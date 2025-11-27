// Elementor JSON Compiler – Versão Refatorada
// Exporta frames do Figma para JSON compatível com Elementor (clipboard)
// Refatorado para melhor manutenibilidade e reaproveitamento de código

// -------------------- Imports dos Módulos Refatorados --------------------
import type { ElementorTemplate, WPConfig } from './types/elementor.types';
import { ElementorCompiler } from './compiler/elementor.compiler';
import * as Gemini from './api_gemini';
import * as DeepSeek from './api_deepseek';
import type { LayoutAnalysis, ChildNode } from './api_gemini';
import { createOptimizedFrame } from './gemini_frame_builder';
import { extractImagesFromNode, getBackgroundFromNode } from './utils/image_utils';
import { serializeNode, normalizeFigmaJSON, getSectionsToAnalyze } from './utils/serialization_utils';

// -------------------- Type Guards (mantidos para compatibilidade) --------------------
function hasLayout(node: SceneNode): node is FrameNode | ComponentNode | InstanceNode {
    return 'layoutMode' in node;
}

// -------------------- Helper Functions --------------------
// (Funções de imagem e serialização movidas para src/utils)

// Cache de fontes carregadas para evitar carregamentos duplicados
const loadedFonts = new Set<string>();

/**
 * Carrega uma fonte do Figma se ainda não estiver carregada
 * @param fontName - Nome da fonte (family + style)
 */
async function loadFontIfNeeded(fontName: FontName): Promise<void> {
    const fontKey = `${fontName.family}-${fontName.style}`;

    if (loadedFonts.has(fontKey)) {
        return; // Fonte já carregada
    }

    try {
        await figma.loadFontAsync(fontName);
        loadedFonts.add(fontKey);
        console.log(`✅ Fonte carregada: ${fontKey}`);
    } catch (error) {
        console.warn(`⚠️ Não foi possível carregar a fonte ${fontKey}. Usando fonte padrão.`, error);
        // Fallback para Roboto Regular (fonte padrão do Figma)
        const fallbackFont = { family: "Roboto", style: "Regular" };
        const fallbackKey = `${fallbackFont.family}-${fallbackFont.style}`;

        if (!loadedFonts.has(fallbackKey)) {
            await figma.loadFontAsync(fallbackFont);
            loadedFonts.add(fallbackKey);
        }
    }
}

/**
 * Valida e corrige fills para garantir compatibilidade com o Figma
 * @param fills - Array de fills que pode vir da IA em formato incorreto
 * @returns Array de fills válidos ou array vazio se inválido
 */
function validateAndFixFills(fills: any[]): Paint[] {
    if (!Array.isArray(fills) || fills.length === 0) {
        return [];
    }

    const validFills: Paint[] = [];

    for (const fill of fills) {
        if (!fill || typeof fill !== 'object') {
            continue;
        }

        // SOLID fill - formato simples
        if (fill.type === 'SOLID') {
            if (fill.color && typeof fill.color === 'object') {
                // Remover propriedade 'a' se existir (Figma não aceita 'a' dentro de color)
                const { a, ...colorWithoutAlpha } = fill.color;

                // Se opacity não está definido mas color.a está, usar color.a como opacity
                const opacity = typeof fill.opacity === 'number'
                    ? fill.opacity
                    : (typeof a === 'number' ? a : 1);

                validFills.push({
                    type: 'SOLID',
                    color: colorWithoutAlpha,
                    opacity: opacity,
                    visible: typeof fill.visible === 'boolean' ? fill.visible : true
                } as SolidPaint);
            }
            continue;
        }

        // IMAGE fill
        if (fill.type === 'IMAGE') {
            if (fill.imageHash) {
                validFills.push({
                    type: 'IMAGE',
                    imageHash: fill.imageHash,
                    scaleMode: fill.scaleMode || 'FILL',
                    opacity: typeof fill.opacity === 'number' ? fill.opacity : 1,
                    visible: typeof fill.visible === 'boolean' ? fill.visible : true
                } as ImagePaint);
            }
            continue;
        }

        // GRADIENT fills - precisam de gradientTransform e gradientStops
        if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL' || fill.type === 'GRADIENT_ANGULAR' || fill.type === 'GRADIENT_DIAMOND') {
            // Verificar se tem as propriedades obrigatórias
            if (!fill.gradientStops || !Array.isArray(fill.gradientStops) || fill.gradientStops.length === 0) {
                console.warn(`⚠️ Gradiente ${fill.type} sem gradientStops válido. Ignorando.`);
                continue;
            }

            if (!fill.gradientTransform || !Array.isArray(fill.gradientTransform)) {
                console.warn(`⚠️ Gradiente ${fill.type} sem gradientTransform. Usando matriz identidade.`);
                // Matriz de transformação padrão (identidade)
                fill.gradientTransform = [[1, 0, 0], [0, 1, 0]];
            }

            // IMPORTANTE: Gradientes PRECISAM da propriedade 'a' nas cores dos gradientStops!
            // Não remover 'a' aqui, apenas garantir que existe
            const cleanedGradientStops = fill.gradientStops.map((stop: any) => {
                if (stop.color && typeof stop.color === 'object') {
                    // Garantir que 'a' existe (padrão = 1 se não existir)
                    return {
                        ...stop,
                        color: {
                            ...stop.color,
                            a: typeof stop.color.a === 'number' ? stop.color.a : 1
                        }
                    };
                }
                return stop;
            });

            validFills.push({
                type: fill.type,
                gradientStops: cleanedGradientStops,
                gradientTransform: fill.gradientTransform,
                opacity: typeof fill.opacity === 'number' ? fill.opacity : 1,
                visible: typeof fill.visible === 'boolean' ? fill.visible : true
            } as GradientPaint);
            continue;
        }

        // Tipo desconhecido - ignorar
        console.warn(`⚠️ Tipo de fill desconhecido: ${fill.type}. Ignorando.`);
    }

    return validFills;
}

// Helper simples para construção de nodes (Engine "Burra" para teste)
const buildNode = async (data: any, parent?: FrameNode): Promise<SceneNode> => {
    let node: SceneNode;
    if (data.type === 'FRAME') {
        const frame = figma.createFrame();
        node = frame;
        frame.name = data.name;

        // Add to parent FIRST so we can set layout sizing properties that depend on parent
        if (parent) parent.appendChild(node);

        if (data.width) frame.resize(data.width, typeof data.height === 'number' ? data.height : 100);
        if (data.layoutMode) frame.layoutMode = data.layoutMode;
        if (data.primaryAxisAlignItems) {
            if (data.primaryAxisAlignItems === 'START') frame.primaryAxisAlignItems = 'MIN';
            else if (data.primaryAxisAlignItems === 'END') frame.primaryAxisAlignItems = 'MAX';
            else frame.primaryAxisAlignItems = data.primaryAxisAlignItems;
        }
        if (data.counterAxisAlignItems) {
            if (data.counterAxisAlignItems === 'START') frame.counterAxisAlignItems = 'MIN';
            else if (data.counterAxisAlignItems === 'END') frame.counterAxisAlignItems = 'MAX';
            else if (data.counterAxisAlignItems === 'STRETCH') {
                // STRETCH não é válido para counterAxisAlignItems. Ignorar e deixar padrão.
                // Para esticar filhos, use layoutSizingHorizontal/Vertical: "FILL" nos filhos.
            }
            else frame.counterAxisAlignItems = data.counterAxisAlignItems;
        }
        if (data.itemSpacing) frame.itemSpacing = data.itemSpacing;
        if (data.paddingTop) frame.paddingTop = data.paddingTop;
        if (data.paddingBottom) frame.paddingBottom = data.paddingBottom;
        if (data.paddingLeft) frame.paddingLeft = data.paddingLeft;
        if (data.paddingRight) frame.paddingRight = data.paddingRight;
        if (data.cornerRadius) frame.cornerRadius = data.cornerRadius;
        if (data.topLeftRadius) frame.topLeftRadius = data.topLeftRadius;
        if (data.topRightRadius) frame.topRightRadius = data.topRightRadius;
        if (data.bottomLeftRadius) frame.bottomLeftRadius = data.bottomLeftRadius;
        if (data.bottomRightRadius) frame.bottomRightRadius = data.bottomRightRadius;
        if (data.strokes) frame.strokes = data.strokes;
        if (data.strokeWeight) frame.strokeWeight = data.strokeWeight;

        // Validar e corrigir fills antes de aplicar (especialmente gradientes)
        if (data.fills !== undefined) {
            if (Array.isArray(data.fills) && data.fills.length === 0) {
                // Se fills é array vazio, definir explicitamente como vazio (sem fundo)
                frame.fills = [];
            } else {
                const validatedFills = validateAndFixFills(data.fills);
                if (validatedFills.length > 0) {
                    frame.fills = validatedFills;
                } else {
                    // Se validação retornou vazio, definir explicitamente
                    frame.fills = [];
                }
            }
        }

        // Set sizing AFTER appending to parent and parent has layoutMode (if applicable)
        // Note: The parent must have layoutMode != "NONE" for these to work.
        // Since we build top-down, parent should be ready.
        if (data.layoutSizingHorizontal === 'FILL') frame.layoutSizingHorizontal = 'FILL';
        if (data.layoutSizingVertical === 'FILL') frame.layoutSizingVertical = 'FILL';
        if (data.layoutSizingVertical === 'HUG') frame.layoutSizingVertical = 'HUG';

        if (data.primaryAxisSizingMode) {
            if (data.primaryAxisSizingMode === 'HUG') frame.primaryAxisSizingMode = 'AUTO';
            else if (data.primaryAxisSizingMode === 'FILL') frame.primaryAxisSizingMode = 'FIXED';
            else frame.primaryAxisSizingMode = data.primaryAxisSizingMode;
        }
        if (data.counterAxisSizingMode) {
            if (data.counterAxisSizingMode === 'HUG') frame.counterAxisSizingMode = 'AUTO';
            else if (data.counterAxisSizingMode === 'FILL') frame.counterAxisSizingMode = 'FIXED';
            else frame.counterAxisSizingMode = data.counterAxisSizingMode;
        }

        if (data.children) {
            for (const childData of data.children) {
                await buildNode(childData, frame);
            }
        }
    } else if (data.type === 'TEXT') {
        const text = figma.createText();
        node = text;
        text.name = data.name;

        // Add to parent FIRST
        if (parent) parent.appendChild(node);

        // Carregar a fonte ANTES de definir o texto
        const fontToLoad = data.fontName || { family: "Inter", style: "Regular" };
        await loadFontIfNeeded(fontToLoad);

        // IMPORTANTE: Aplicar fontName ANTES de characters
        // O Figma precisa saber qual fonte usar antes de definir o texto
        if (data.fontName) text.fontName = data.fontName;

        // Agora podemos definir o texto com segurança
        text.characters = data.characters || '';

        // Aplicar outras propriedades
        if (data.fontSize) text.fontSize = data.fontSize;

        // Validar e aplicar fills (remover 'a' de cores SOLID)
        if (data.fills) {
            const validatedFills = validateAndFixFills(data.fills);
            if (validatedFills.length > 0) {
                text.fills = validatedFills;
            }
        } else if (data.color) {
            // Remover 'a' da cor se existir
            const { a, ...colorWithoutAlpha } = data.color;
            text.fills = [{ type: 'SOLID', color: colorWithoutAlpha }];
        }
        if (data.textAlignHorizontal) text.textAlignHorizontal = data.textAlignHorizontal;
        if (data.lineHeight) text.lineHeight = data.lineHeight;

        // Set sizing AFTER appending
        if (data.layoutSizingHorizontal === 'FILL') text.layoutSizingHorizontal = 'FILL';
    } else {
        return;
    }

    return node;
};

// -------------------- Main Execution --------------------
figma.showUI(__html__, { width: 600, height: 600 });

let compiler: ElementorCompiler;

// Carrega configuração do WordPress salva
figma.clientStorage.getAsync('wp_config').then(config => {
    compiler = new ElementorCompiler(config || {});
    if (config) {
        figma.ui.postMessage({ type: 'load-wp-config', config });
    }
});

// Carrega a configuração do Gemini ao iniciar
figma.clientStorage.getAsync('gemini_api_key').then(apiKey => {
    figma.clientStorage.getAsync('gemini_model').then(model => {
        if (apiKey || model) {
            figma.ui.postMessage({ type: 'load-gemini-config', apiKey, model });
        }
    });
});


// -------------------- Message Handler --------------------


// Helper auxiliar (se não existir)


figma.ui.onmessage = async (msg) => {
    console.log('📨 Mensagem recebida:', msg.type);
    console.log('Dados completos:', msg);

    if (!compiler) compiler = new ElementorCompiler({});

    // Exportar para Elementor
    if (msg.type === 'export-elementor') {
        console.log('🚀 Iniciando export-elementor...');
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.notify('Selecione ao menos um frame.');
            return;
        }

        if (msg.quality) compiler.setQuality(msg.quality);

        figma.notify('Processando... (Uploads de imagem podem demorar)');

        try {
            console.log('📦 Compilando elementos...');
            const elements = await compiler.compile(selection);
            console.log('✅ Elementos compilados:', elements);

            // Detectar elementos w:nav-menu
            const navMenus = compiler.findNavMenus(elements);
            console.log('🔍 Menus encontrados:', navMenus);

            const template: ElementorTemplate = {
                type: 'elementor',
                siteurl: (compiler as any).wpConfig?.url || '',
                elements,
                version: '0.4'
            };

            console.log('📤 Enviando export-result para UI...');
            figma.ui.postMessage({
                type: 'export-result',
                data: JSON.stringify(template, null, 2),
                navMenus: navMenus
            });
            console.log('✅ Mensagem export-result enviada!');

            if (navMenus.length > 0) {
                figma.notify(`JSON gerado! Encontrado(s) ${navMenus.length} menu(s) de navegação.`);
            } else {
                figma.notify('JSON gerado com sucesso!');
            }
        } catch (e) {
            console.error('❌ ERRO ao exportar:', e);
            console.error('Stack trace:', (e as Error).stack);
            figma.notify(`Erro ao exportar: ${(e as Error).message}`);
        }
    }

    // Salvar configuração do WordPress
    else if (msg.type === 'save-wp-config') {
        await figma.clientStorage.setAsync('wp_config', msg.config);
        compiler.setWPConfig(msg.config);
        figma.notify('Configurações salvas.');
    }

    else if (msg.type === 'get-wp-config') {
        console.log('📥 Recebido get-wp-config');
        const config = await figma.clientStorage.getAsync('wp_config');
        console.log('Config WP recuperada:', config);
        figma.ui.postMessage({ type: 'load-wp-config', config });
    }

    else if (msg.type === 'get-gemini-config') {
        console.log('📥 Recebido get-gemini-config');
        const apiKey = await Gemini.getKey();
        const model = await Gemini.getModel();
        console.log('Gemini config recuperada - API Key:', apiKey ? 'presente' : 'ausente', 'Modelo:', model);
        figma.ui.postMessage({ type: 'load-gemini-config', apiKey, model });
    }

    // Resposta de upload de imagem
    else if (msg.type === 'upload-image-response') {
        compiler.handleUploadResponse(msg.id, msg);
    }

    // Renomear layer
    else if (msg.type === 'rename-layer') {
        const sel = figma.currentPage.selection;
        if (sel.length === 1) {
            sel[0].name = msg.newName;
            figma.notify(`Renomeado: ${msg.newName}`);
        } else {
            figma.notify('Selecione 1 item.');
        }
    }

    // Debug de estrutura
    else if (msg.type === 'debug-structure') {
        const debug = figma.currentPage.selection.map(n => ({
            id: n.id,
            name: n.name,
            type: n.type,
            layout: hasLayout(n) ? (n as FrameNode).layoutMode : 'none'
        }));
        figma.ui.postMessage({ type: 'debug-result', data: JSON.stringify(debug, null, 2) });
    }

    // Redimensionar a UI
    else if (msg.type === 'resize-ui') {
        figma.ui.resize(msg.width, msg.height);
    }

    // =================================================================
    // ----- NOVA LÓGICA DO GEMINI USANDO A SDK -----------------------
    // =================================================================

    // Salva a API Key do Gemini
    else if (msg.type === 'save-gemini-key') {
        console.log('📥 Recebido save-gemini-key');
        console.log('Key recebida:', msg.key);

        try {
            await Gemini.saveKey(msg.key);
            console.log('✅ Key salva com sucesso');
            figma.notify('🔑 API Key do Gemini salva com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao salvar key:', error);
            figma.notify('❌ Erro ao salvar API Key');
        }
    }

    // Salva o modelo Gemini selecionado
    else if (msg.type === 'save-gemini-model') {
        console.log('📥 Recebido save-gemini-model');
        await Gemini.saveModel(msg.model);
        figma.notify(`🤖 Modelo Gemini definido para: ${msg.model}`);
    }

    // Testa a conexão com a API Gemini usando a SDK
    else if (msg.type === 'test-gemini-connection') {
        console.log('📥 Recebido test-gemini-connection');
        figma.notify('Testando conexão com a API Gemini...');
        try {
            const result = await Gemini.testConnection();
            console.log('Resultado do teste:', result);

            figma.ui.postMessage({
                type: 'gemini-connection-result',
                success: result.success,
                message: result.message
            });

            if (result.success) {
                figma.notify(result.message || '✅ Conexão com Gemini OK!');
            } else {
                figma.notify(`❌ ${result.message || 'Falha na conexão.'}`);
            }
        } catch (e: any) {
            figma.notify('❌ Erro crítico ao testar conexão: ' + e.message);
            figma.ui.postMessage({
                type: 'gemini-connection-result',
                success: false,
                message: e.message
            });
        }
    }

    // Analisa o layout com a IA Gemini (Estratégia Dividir para Conquistar)
    else if (msg.type === 'analyze-with-gemini') {
        const selection = figma.currentPage.selection;
        if (selection.length !== 1) {
            figma.notify('⚠️ Selecione apenas 1 frame para análise');
            return;
        }

        const node = selection[0];

        // Validação mais estrita do tipo de node
        if (node.type !== 'FRAME' && node.type !== 'SECTION' && node.type !== 'COMPONENT' && node.type !== 'GROUP') {
            figma.notify('⚠️ Selecione um Frame, Section, Componente ou Grupo válido.');
            return;
        }

        if (!('children' in node)) {
            figma.notify('⚠️ O elemento selecionado não possui filhos para análise.');
            return;
        }

        figma.notify('🤖 Iniciando análise estruturada...');

        try {
            // Extrai imagens globais para reutilização
            const availableImages = await extractImagesFromNode(node);
            const availableImageIds = Object.keys(availableImages);
            console.log('🖼️ Imagens extraídas do original:', availableImageIds);
            figma.ui.postMessage({ type: 'add-gemini-log', data: `🖼️ Imagens encontradas no original: ${availableImageIds.length}` });
            if (availableImageIds.length > 0) {
                figma.ui.postMessage({ type: 'add-gemini-log', data: `IDs: ${availableImageIds.join(', ')}` });
            }

            // Prepara lista de filhos para análise usando a lógica de drill-down
            const childrenToAnalyze = getSectionsToAnalyze(node);
            const totalSections = childrenToAnalyze.length;

            if (totalSections === 0) {
                throw new Error("O frame selecionado está vazio ou não possui seções visíveis.");
            }

            const aggregatedChildren: any[] = [];
            const aggregatedImprovements: string[] = [];

            // Itera sobre cada filho (seção)
            for (let i = 0; i < totalSections; i++) {
                let child = childrenToAnalyze[i];
                const sectionIndex = i + 1;

                // Aplica unwrapping agressivo para remover containers redundantes
                const originalName = child.name;
                // child = unwrapNode(child); // DESATIVADO POR SOLICITAÇÃO DO USUÁRIO
                // if (child.name !== originalName) {
                //     figma.notify(`🧹 Simplificando seção ${sectionIndex}: ${originalName} -> ${child.name}`);
                // }

                figma.notify(`🤖 Analisando seção ${sectionIndex} de ${totalSections}: ${child.name}...`);
                figma.ui.postMessage({ type: 'add-gemini-log', data: `--- INICIANDO ANÁLISE DA SEÇÃO ${sectionIndex}/${totalSections}: ${child.name} ---` });

                // Exporta imagem da seção
                const sectionImageData = await child.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1.5 } });
                const base64SectionImage = figma.base64Encode(sectionImageData);

                // MOSTRA O PRINT NA UI (Igual ao botão roxo)
                // Envia para a área principal (Modal)
                figma.ui.postMessage({
                    type: 'show-analysis-results',
                    data: '', // Texto vazio, apenas imagem
                    image: base64SectionImage
                });

                // Serializa dados da seção
                const sectionSerializedData = serializeNode(child);

                // LOG DETALHADO DOS DADOS COLETADOS
                figma.ui.postMessage({
                    type: 'add-gemini-log',
                    data: `🔍 DADOS COLETADOS (Seção ${sectionIndex} - ${child.name}):\n${JSON.stringify(sectionSerializedData, null, 2)}`
                });

                // Analisa a seção individualmente usando a nova lógica de geração JSON
                // Nota: Passamos availableImageIds globais para que imagens possam ser reutilizadas mesmo dentro das seções
                const sectionAnalysis = await Gemini.analyzeAndRecreate(sectionImageData, availableImageIds, sectionSerializedData);

                // LOG DA RESPOSTA DA IA
                figma.ui.postMessage({
                    type: 'add-gemini-log',
                    data: `🤖 RESPOSTA DA IA (Seção ${sectionIndex} - ${child.name}):\n${JSON.stringify(sectionAnalysis, null, 2)}`
                });

                // A IA pode retornar em dois formatos:
                // 1. Objeto com children e improvements (formato esperado)
                // 2. Objeto único que é o frame raiz (formato atual)

                // Detectar se a resposta é um array (formato antigo) ou objeto único
                if (Array.isArray(sectionAnalysis)) {
                    // Formato array - adicionar todos os itens
                    aggregatedChildren.push(...sectionAnalysis);
                } else if (sectionAnalysis.type === 'FRAME' && sectionAnalysis.children) {
                    // Formato de frame único - adicionar os children do frame
                    aggregatedChildren.push(...sectionAnalysis.children);

                    // Se houver improvements no frame, adicionar
                    if (sectionAnalysis.improvements) {
                        aggregatedImprovements.push(...sectionAnalysis.improvements);
                    }
                } else if (sectionAnalysis.children) {
                    // Formato objeto com children (formato esperado original)
                    aggregatedChildren.push(...sectionAnalysis.children);

                    if (sectionAnalysis.improvements) {
                        aggregatedImprovements.push(...sectionAnalysis.improvements);
                    }
                } else {
                    // Formato desconhecido - adicionar o objeto inteiro como um child
                    console.warn('⚠️ Formato de resposta inesperado da IA:', sectionAnalysis);
                    aggregatedChildren.push(sectionAnalysis);
                }
            }

            figma.notify('🎨 Montando frame final otimizado...');

            // Cria um objeto de análise consolidado
            // ... (existing code)

            // Cria um objeto de análise consolidado
            // Cria um objeto de análise consolidado
            const finalAnalysis: any = {
                type: "FRAME",
                name: node.name + " (Otimizado)",
                frameName: node.name + " (Otimizado)",
                width: node.width,
                height: node.height,
                layoutMode: "VERTICAL",
                background: getBackgroundFromNode(node),
                autoLayout: { direction: "vertical", gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
                children: aggregatedChildren,
                improvements: [...new Set(aggregatedImprovements)]
            };

            // 1. Cria o frame visual no Figma usando a engine buildNode
            // Engine simples que renderiza o JSON da IA diretamente sem pós-processamento
            const newFrame = await buildNode(finalAnalysis) as FrameNode;
            if (node) {
                newFrame.x = node.x + node.width + 100;
                newFrame.y = node.y;
            }

            figma.currentPage.selection = [newFrame];
            figma.viewport.scrollAndZoomIntoView([newFrame]);

            figma.ui.postMessage({
                type: 'gemini-creation-complete',
                data: {
                    originalName: node.name,
                    newName: newFrame.name,
                    improvements: finalAnalysis.improvements
                }
            });

            // 2. FASE 4: CONSOLIDAÇÃO PARA JSON ELEMENTOR
            figma.notify('🔗 Iniciando Fase 4: Consolidação Final...');
            figma.ui.postMessage({ type: 'add-gemini-log', data: `--- FASE 4: CONSOLIDAÇÃO ---` });

            // Converter LayoutAnalysis para ProcessedNode[]
            const processedNodes: Gemini.ProcessedNode[] = flattenAnalysisToNodes(finalAnalysis);

            figma.ui.postMessage({
                type: 'add-gemini-log',
                data: `📋 Nodes para consolidação: ${processedNodes.length}\n${JSON.stringify(processedNodes, null, 2)}`
            });

            // Chamar API de consolidação
            const consolidationResult = await Gemini.consolidateNodes(processedNodes);

            figma.ui.postMessage({
                type: 'add-gemini-log',
                data: `✅ CONSOLIDAÇÃO CONCLUÍDA:\n${JSON.stringify(consolidationResult, null, 2)}`
            });

            // Enviar resultado final para a UI (para download/copiar)
            figma.ui.postMessage({
                type: 'consolidation-result',
                result: consolidationResult
            });

            figma.notify('✅ Conversão Completa! JSON gerado.');

        } catch (e: any) {
            console.error("Erro detalhado na análise Gemini:", e);
            figma.notify('❌ Erro na análise: ' + e.message);
            figma.ui.postMessage({
                type: 'gemini-error',
                error: e.message
            });
        } finally {
            figma.ui.postMessage({ type: 'hide-loader' });
        }
    }

    // =================================================================
    // ----- LÓGICA DO DEEPSEEK ---------------------------------------
    // =================================================================

    else if (msg.type === 'save-deepseek-key') {
        await DeepSeek.saveDeepSeekKey(msg.key);
        figma.notify('🔑 API Key do DeepSeek salva com sucesso!');
    }

    else if (msg.type === 'save-deepseek-model') {
        await DeepSeek.saveDeepSeekModel(msg.model);
        figma.notify(`🤖 Modelo DeepSeek definido para: ${msg.model}`);
    }

    else if (msg.type === 'get-deepseek-config') {
        const apiKey = await DeepSeek.getDeepSeekKey();
        const model = await DeepSeek.getDeepSeekModel();
        figma.ui.postMessage({ type: 'load-deepseek-config', apiKey, model });
    }

    else if (msg.type === 'test-deepseek-connection') {
        figma.notify('Testando conexão com DeepSeek...');
        const result = await DeepSeek.testDeepSeekConnection();
        figma.ui.postMessage({ type: 'deepseek-connection-result', ...result });
        if (result.success) figma.notify(result.message);
        else figma.notify('❌ Falha na conexão DeepSeek');
    }

    else if (msg.type === 'analyze-with-deepseek') {
        const selection = figma.currentPage.selection;
        if (selection.length !== 1) {
            figma.notify('⚠️ Selecione apenas 1 frame para análise');
            return;
        }

        const node = selection[0];

        // Validação mais estrita do tipo de node
        if (node.type !== 'FRAME' && node.type !== 'SECTION' && node.type !== 'COMPONENT' && node.type !== 'GROUP') {
            figma.notify('⚠️ Selecione um Frame, Section, Componente ou Grupo válido.');
            return;
        }

        if (!('children' in node)) {
            figma.notify('⚠️ O elemento selecionado não possui filhos para análise.');
            return;
        }

        figma.notify('🤖 Iniciando análise com DeepSeek...');

        try {
            // Extrai imagens globais para reutilização
            const availableImages = await extractImagesFromNode(node);
            const availableImageIds = Object.keys(availableImages);
            console.log('🖼️ Imagens extraídas do original:', availableImageIds);
            figma.ui.postMessage({ type: 'add-gemini-log', data: `🖼️ Imagens encontradas no original: ${availableImageIds.length}` });

            // Prepara lista de filhos para análise
            const childrenToAnalyze = getSectionsToAnalyze(node);
            const totalSections = childrenToAnalyze.length;

            if (totalSections === 0) {
                throw new Error("O frame selecionado está vazio ou não possui seções visíveis.");
            }

            const aggregatedChildren: any[] = [];
            const aggregatedImprovements: string[] = [];

            // Itera sobre cada filho (seção)
            for (let i = 0; i < totalSections; i++) {
                let child = childrenToAnalyze[i];
                const sectionIndex = i + 1;

                figma.notify(`🤖 Analisando seção ${sectionIndex} de ${totalSections}: ${child.name}...`);
                figma.ui.postMessage({ type: 'add-gemini-log', data: `--- INICIANDO ANÁLISE DA SEÇÃO ${sectionIndex}/${totalSections}: ${child.name} ---` });

                // Serializa dados da seção
                const sectionSerializedData = serializeNode(child);

                // LOG DETALHADO DOS DADOS COLETADOS
                figma.ui.postMessage({
                    type: 'add-gemini-log',
                    data: `🔍 DADOS COLETADOS (Seção ${sectionIndex} - ${child.name}):\n${JSON.stringify(sectionSerializedData, null, 2)}`
                });

                // Exporta imagem da seção para análise visual (se suportado)
                const sectionImageData = await child.exportAsync({ format: 'JPG', constraint: { type: 'SCALE', value: 1 } });

                // Analisa a seção individualmente usando DeepSeek
                const sectionAnalysis = await DeepSeek.analyzeLayoutDeepSeek(sectionSerializedData, child.id, sectionImageData);

                // LOG DA RESPOSTA DA IA
                figma.ui.postMessage({
                    type: 'add-gemini-log',
                    data: `🤖 RESPOSTA DEEPSEEK (Seção ${sectionIndex} - ${child.name}):\n${JSON.stringify(sectionAnalysis, null, 2)}`
                });

                // A IA pode retornar em dois formatos:
                // 1. Objeto com children e improvements (formato esperado)
                // 2. Objeto único que é o frame raiz (formato atual do DeepSeek)

                // Detectar se a resposta é um array (formato antigo) ou objeto único
                if (Array.isArray(sectionAnalysis)) {
                    // Formato array - adicionar todos os itens
                    aggregatedChildren.push(...sectionAnalysis);
                } else if (sectionAnalysis.type === 'FRAME' && sectionAnalysis.children) {
                    // Formato de frame único - adicionar os children do frame
                    aggregatedChildren.push(...sectionAnalysis.children);

                    // Se houver improvements no frame, adicionar
                    if (sectionAnalysis.improvements) {
                        aggregatedImprovements.push(...sectionAnalysis.improvements);
                    }
                } else if (sectionAnalysis.children) {
                    // Formato objeto com children (formato esperado original)
                    aggregatedChildren.push(...sectionAnalysis.children);

                    if (sectionAnalysis.improvements) {
                        aggregatedImprovements.push(...sectionAnalysis.improvements);
                    }
                } else {
                    // Formato desconhecido - adicionar o objeto inteiro como um child
                    console.warn('⚠️ Formato de resposta inesperado da IA:', sectionAnalysis);
                    aggregatedChildren.push(sectionAnalysis);
                }
            }

            figma.notify('🎨 Montando frame final otimizado...');

            // Cria um objeto de análise consolidado
            // Cria um objeto de análise consolidado
            const finalAnalysis: any = {
                type: "FRAME",
                name: node.name + " (DeepSeek Otimizado)",
                frameName: node.name + " (DeepSeek Otimizado)",
                width: node.width,
                height: node.height,
                layoutMode: "VERTICAL",
                background: getBackgroundFromNode(node),
                autoLayout: { direction: "vertical", gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
                children: aggregatedChildren,
                improvements: [...new Set(aggregatedImprovements)]
            };

            // 1. Cria o frame visual no Figma usando a engine buildNode
            // Engine simples que renderiza o JSON da IA diretamente sem pós-processamento
            const newFrame = await buildNode(finalAnalysis) as FrameNode;
            if (node) {
                newFrame.x = node.x + node.width + 100;
                newFrame.y = node.y;
            }

            figma.currentPage.selection = [newFrame];
            figma.viewport.scrollAndZoomIntoView([newFrame]);

            figma.ui.postMessage({
                type: 'gemini-creation-complete',
                data: {
                    originalName: node.name,
                    newName: newFrame.name,
                    improvements: finalAnalysis.improvements
                }
            });

            // 2. FASE 4: CONSOLIDAÇÃO PARA JSON ELEMENTOR
            figma.notify('🔗 Iniciando Fase 4: Consolidação Final...');
            figma.ui.postMessage({ type: 'add-gemini-log', data: `--- FASE 4: CONSOLIDAÇÃO ---` });

            // Converter LayoutAnalysis para ProcessedNode[]
            const processedNodes: Gemini.ProcessedNode[] = flattenAnalysisToNodes(finalAnalysis);

            // Chamar API de consolidação do DeepSeek
            const consolidationResult = await DeepSeek.consolidateNodes(processedNodes);

            figma.ui.postMessage({
                type: 'add-gemini-log',
                data: `✅ CONSOLIDAÇÃO CONCLUÍDA:\n${JSON.stringify(consolidationResult, null, 2)}`
            });

            figma.ui.postMessage({
                type: 'consolidation-result',
                result: consolidationResult
            });

            figma.notify('✅ Conversão Completa! JSON gerado.');

        } catch (e: any) {
            console.error("Erro detalhado na análise DeepSeek:", e);
            figma.notify('❌ Erro na análise: ' + e.message);
            figma.ui.postMessage({
                type: 'gemini-error',
                error: e.message
            });
        } finally {
            figma.ui.postMessage({ type: 'hide-loader' });
        }
    }

    else if (msg.type === 'resize-ui') {
        figma.ui.resize(msg.width, msg.height);
    }

    // Gerar Frame de Teste Otimizado
    else if (msg.type === 'create-test-frame') {
        try {
            const testFrameData = {
                "id": "root-frame",
                "name": "Desktop - Homepage Optimized",
                "type": "FRAME",
                "width": 1920,
                "height": 2000,
                "x": 0,
                "y": 0,
                "visible": true,
                "layoutMode": "VERTICAL",
                "primaryAxisSizingMode": "AUTO",
                "counterAxisSizingMode": "FIXED",
                "primaryAxisAlignItems": "MIN",
                "counterAxisAlignItems": "CENTER",
                "itemSpacing": 0,
                "paddingTop": 0,
                "paddingRight": 0,
                "paddingBottom": 0,
                "paddingLeft": 0,
                "fills": [
                    {
                        "type": "SOLID",
                        "color": { "r": 1, "g": 1, "b": 1 },
                        "visible": true
                    }
                ],
                "children": [
                    {
                        "id": "section-hero",
                        "name": "Section 1 - Hero (Full Container)",
                        "type": "FRAME",
                        "layoutMode": "HORIZONTAL",
                        "primaryAxisSizingMode": "FIXED",
                        "counterAxisSizingMode": "AUTO",
                        "width": 1920,
                        "paddingTop": 100,
                        "paddingBottom": 100,
                        "paddingLeft": 320,
                        "paddingRight": 320,
                        "itemSpacing": 64,
                        "primaryAxisAlignItems": "CENTER",
                        "counterAxisAlignItems": "CENTER",
                        "fills": [
                            {
                                "type": "SOLID",
                                "color": { "r": 1, "g": 1, "b": 1 }
                            }
                        ],
                        "children": [
                            {
                                "id": "hero-content-col",
                                "name": "Container - Left Content",
                                "type": "FRAME",
                                "layoutMode": "VERTICAL",
                                "primaryAxisSizingMode": "AUTO",
                                "counterAxisSizingMode": "FIXED",
                                "layoutSizingHorizontal": "FILL",
                                "width": 600,
                                "itemSpacing": 32,
                                "children": [
                                    {
                                        "id": "hero-heading",
                                        "name": "Heading - Title",
                                        "type": "TEXT",
                                        "characters": "O que é a Harmonização\nIntima Masculina?",
                                        "fontSize": 48,
                                        "fontName": { "family": "Inter", "style": "Bold" },
                                        "fontWeight": 700,
                                        "fills": [{ "type": "SOLID", "color": { "r": 0.007, "g": 0.431, "b": 0.478 } }],
                                        "layoutSizingHorizontal": "FILL"
                                    },
                                    {
                                        "id": "hero-text",
                                        "name": "Text Editor - Description",
                                        "type": "TEXT",
                                        "characters": "A harmonização íntima masculina é um procedimento estético que visa aumentar tanto o tamanho quanto a circunferência do Pênis, além de corrigir assimetrias e melhorar a aparência.\n\nO Protocolo NEXX utiliza Ácido Hialurônico, Toxina Botulínica e FIOS de PDO, produtos seguros, eficazes e compatíveis com o nosso organismo.",
                                        "fontSize": 18,
                                        "fontName": { "family": "Inter", "style": "Regular" },
                                        "lineHeight": { "value": 28, "unit": "PIXELS" },
                                        "fills": [{ "type": "SOLID", "color": { "r": 0.2, "g": 0.2, "b": 0.2 } }],
                                        "layoutSizingHorizontal": "FILL"
                                    },
                                    {
                                        "id": "hero-button",
                                        "name": "Button - CTA",
                                        "type": "FRAME",
                                        "layoutMode": "HORIZONTAL",
                                        "primaryAxisSizingMode": "AUTO",
                                        "counterAxisSizingMode": "AUTO",
                                        "primaryAxisAlignItems": "CENTER",
                                        "counterAxisAlignItems": "CENTER",
                                        "paddingTop": 20,
                                        "paddingBottom": 20,
                                        "paddingLeft": 40,
                                        "paddingRight": 40,
                                        "cornerRadius": 50,
                                        "fills": [{ "type": "SOLID", "color": { "r": 0.007, "g": 0.431, "b": 0.478 } }],
                                        "children": [
                                            {
                                                "id": "btn-text",
                                                "name": "Label",
                                                "type": "TEXT",
                                                "characters": "Agendar Avaliação",
                                                "fontSize": 18,
                                                "fontName": { "family": "Sora", "style": "SemiBold" },
                                                "fills": [{ "type": "SOLID", "color": { "r": 1, "g": 1, "b": 1 } }]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "id": "hero-image-col",
                                "name": "Container - Right Image",
                                "type": "FRAME",
                                "layoutMode": "VERTICAL",
                                "primaryAxisSizingMode": "AUTO",
                                "counterAxisSizingMode": "FIXED",
                                "width": 547,
                                "height": 550,
                                "cornerRadius": 24,
                                "topLeftRadius": 24,
                                "topRightRadius": 24,
                                "bottomLeftRadius": 270,
                                "bottomRightRadius": 24,
                                "fills": [
                                    {
                                        "type": "IMAGE",
                                        "scaleMode": "FILL",
                                        "imageHash": "8940bc040ef8faaed695b736e6eff3a7c543b3b8"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "id": "section-features",
                        "name": "Section 2 - Features (Full Container)",
                        "type": "FRAME",
                        "layoutMode": "VERTICAL",
                        "primaryAxisSizingMode": "AUTO",
                        "counterAxisSizingMode": "FIXED",
                        "width": 1920,
                        "paddingTop": 100,
                        "paddingBottom": 100,
                        "paddingLeft": 320,
                        "paddingRight": 320,
                        "itemSpacing": 64,
                        "primaryAxisAlignItems": "CENTER",
                        "fills": [
                            {
                                "type": "SOLID",
                                "color": { "r": 0.96, "g": 0.97, "b": 0.97 }
                            }
                        ],
                        "children": [
                            {
                                "id": "feature-heading",
                                "name": "Heading - Section Title",
                                "type": "TEXT",
                                "characters": "ENGROSSE E AUMENTE SEU PÊNIS COM RESULTADOS IMEDIATOS",
                                "textAlignHorizontal": "CENTER",
                                "fontSize": 36,
                                "fontName": { "family": "Inter", "style": "Bold" },
                                "fills": [{ "type": "SOLID", "color": { "r": 0.007, "g": 0.431, "b": 0.478 } }]
                            },
                            {
                                "id": "features-grid",
                                "name": "Container - Grid (Flex Row)",
                                "type": "FRAME",
                                "layoutMode": "HORIZONTAL",
                                "primaryAxisSizingMode": "AUTO",
                                "counterAxisSizingMode": "AUTO",
                                "primaryAxisAlignItems": "CENTER",
                                "itemSpacing": 32,
                                "layoutSizingHorizontal": "FILL",
                                "children": [
                                    {
                                        "id": "card-1",
                                        "name": "Container - Card 1",
                                        "type": "FRAME",
                                        "layoutMode": "VERTICAL",
                                        "primaryAxisSizingMode": "AUTO",
                                        "counterAxisSizingMode": "FIXED",
                                        "itemSpacing": 16,
                                        "width": 400,
                                        "children": [
                                            {
                                                "id": "img-box-1",
                                                "name": "Image Box",
                                                "type": "FRAME",
                                                "layoutMode": "VERTICAL",
                                                "primaryAxisSizingMode": "FIXED",
                                                "counterAxisSizingMode": "FIXED",
                                                "width": 400,
                                                "height": 260,
                                                "cornerRadius": 12,
                                                "strokes": [{ "type": "SOLID", "color": { "r": 0.015, "g": 0.76, "b": 0.796 } }],
                                                "strokeWeight": 1,
                                                "fills": [{ "type": "IMAGE", "scaleMode": "FILL", "imageHash": "42e2afde322e10744ddbea5a95e2ef2849570b61" }]
                                            },
                                            {
                                                "id": "text-1",
                                                "name": "Heading",
                                                "type": "TEXT",
                                                "characters": "Anestesia Local é Aplicada",
                                                "fontSize": 20,
                                                "textAlignHorizontal": "CENTER",
                                                "layoutSizingHorizontal": "FILL",
                                                "fontName": { "family": "Inter", "style": "Medium" },
                                                "fills": [{ "type": "SOLID", "color": { "r": 0.2, "g": 0.2, "b": 0.2 } }]
                                            }
                                        ]
                                    },
                                    {
                                        "id": "card-2",
                                        "name": "Container - Card 2",
                                        "type": "FRAME",
                                        "layoutMode": "VERTICAL",
                                        "primaryAxisSizingMode": "AUTO",
                                        "counterAxisSizingMode": "FIXED",
                                        "itemSpacing": 16,
                                        "width": 400,
                                        "children": [
                                            {
                                                "id": "img-box-2",
                                                "name": "Image Box",
                                                "type": "FRAME",
                                                "layoutMode": "VERTICAL",
                                                "primaryAxisSizingMode": "FIXED",
                                                "counterAxisSizingMode": "FIXED",
                                                "width": 400,
                                                "height": 260,
                                                "cornerRadius": 12,
                                                "strokes": [{ "type": "SOLID", "color": { "r": 0.015, "g": 0.76, "b": 0.796 } }],
                                                "strokeWeight": 1,
                                                "fills": [{ "type": "IMAGE", "scaleMode": "FILL", "imageHash": "67d1eeaa0af163b171593ec0086e9b06964feee7" }]
                                            },
                                            {
                                                "id": "text-2",
                                                "name": "Heading",
                                                "type": "TEXT",
                                                "characters": "Aumento Imediato",
                                                "fontSize": 20,
                                                "textAlignHorizontal": "CENTER",
                                                "layoutSizingHorizontal": "FILL",
                                                "fontName": { "family": "Inter", "style": "Medium" },
                                                "fills": [{ "type": "SOLID", "color": { "r": 0.2, "g": 0.2, "b": 0.2 } }]
                                            }
                                        ]
                                    },
                                    {
                                        "id": "card-3",
                                        "name": "Container - Card 3",
                                        "type": "FRAME",
                                        "layoutMode": "VERTICAL",
                                        "primaryAxisSizingMode": "AUTO",
                                        "counterAxisSizingMode": "FIXED",
                                        "itemSpacing": 16,
                                        "width": 400,
                                        "children": [
                                            {
                                                "id": "img-box-3",
                                                "name": "Image Box",
                                                "type": "FRAME",
                                                "layoutMode": "VERTICAL",
                                                "primaryAxisSizingMode": "FIXED",
                                                "counterAxisSizingMode": "FIXED",
                                                "width": 400,
                                                "height": 260,
                                                "cornerRadius": 12,
                                                "strokes": [{ "type": "SOLID", "color": { "r": 0.015, "g": 0.76, "b": 0.796 } }],
                                                "strokeWeight": 1,
                                                "fills": [{ "type": "IMAGE", "scaleMode": "FILL", "imageHash": "ea1036b71582be34af958b067e936c4599722911" }]
                                            },
                                            {
                                                "id": "text-3",
                                                "name": "Heading",
                                                "type": "TEXT",
                                                "characters": "Resultado Final",
                                                "fontSize": 20,
                                                "textAlignHorizontal": "CENTER",
                                                "layoutSizingHorizontal": "FILL",
                                                "fontName": { "family": "Inter", "style": "Medium" },
                                                "fills": [{ "type": "SOLID", "color": { "r": 0.2, "g": 0.2, "b": 0.2 } }]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };

            await figma.loadFontAsync({ family: "Inter", style: "Regular" });
            await figma.loadFontAsync({ family: "Inter", style: "Medium" });
            await figma.loadFontAsync({ family: "Inter", style: "Bold" });
            await figma.loadFontAsync({ family: "Sora", style: "SemiBold" });

            const rootFrame = await buildNode(testFrameData) as FrameNode;
            if (rootFrame) {
                figma.currentPage.selection = [rootFrame];
                figma.viewport.scrollAndZoomIntoView([rootFrame]);
                figma.notify("✅ Frame de teste OTIMIZADO criado!");
            }

        } catch (e: any) {
            console.error("Erro ao criar frame de teste:", e);
            figma.notify("❌ Erro ao criar frame: " + e.message);
        }
    }
};



// Helper para converter LayoutAnalysis em ProcessedNode[]
function flattenAnalysisToNodes(analysis: Gemini.LayoutAnalysis): Gemini.ProcessedNode[] {
    const nodes: Gemini.ProcessedNode[] = [];
    let nodeIdCounter = 1;

    function processChild(child: Gemini.ChildNode, parentId?: string) {
        const currentId = `node_${nodeIdCounter++}`;

        const node: Gemini.ProcessedNode = {
            nodeId: currentId,
            widget: child.name || child.widgetType || 'w:container', // Fallback
            confidence: 'high',
            settings: {
                ...child, // Passa todas as propriedades como settings iniciais
                _originalType: child.type
            },
            parentId: parentId,
            children: [] // Será preenchido se houver filhos
        };

        nodes.push(node);

        if (child.children && child.children.length > 0) {
            child.children.forEach(c => {
                const childId = processChild(c, currentId);
                node.children?.push(childId);
            });
        }

        return currentId;
    }

    // Processar filhos raiz
    if (analysis.children) {
        analysis.children.forEach(child => processChild(child));
    }

    return nodes;
}
