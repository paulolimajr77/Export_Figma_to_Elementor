import { WidgetPattern } from '../types/elementor.types';

/**
 * Padrões de widgets do Elementor para análise estrutural
 * Versão simplificada com 4 padrões principais
 */
export const widgetPatterns: WidgetPattern[] = [
    {
        name: 'Image Box',
        tag: 'w:image-box',
        minScore: 70,
        category: 'basic',
        structure: {
            rootType: ['FRAME'],
            childCount: { min: 2, max: 4 },
            requiredChildren: [
                { type: 'RECTANGLE', count: 1 },
                { type: 'TEXT', count: 2 }
            ],
            properties: {
                hasAutoLayout: true,
                layoutMode: 'VERTICAL',
                hasImage: true,
                textCount: 2
            }
        }
    },

    {
        name: 'Button',
        tag: 'w:button',
        minScore: 70,
        category: 'basic',
        structure: {
            rootType: ['FRAME', 'INSTANCE', 'COMPONENT'],
            childCount: { min: 1, max: 3 },
            requiredChildren: [
                { type: 'TEXT', count: 1 }
            ],
            properties: {
                hasAutoLayout: true,
                hasPadding: true,
                hasBorderRadius: true,
                hasBackground: true
            }
        },
        scoreFunction: (node: SceneNode): number => {
            if (node.type !== 'FRAME' && node.type !== 'INSTANCE' && node.type !== 'COMPONENT') return 0;

            let score = 0;
            const frameNode = node as FrameNode;

            // Verificar se tem texto filho
            const hasText = 'children' in frameNode && frameNode.children.some(child => child.type === 'TEXT');
            if (!hasText) return 0; // Botão PRECISA ter texto

            score += 30; // Tem texto

            // Auto-layout (botões geralmente usam)
            if ('layoutMode' in frameNode && frameNode.layoutMode !== 'NONE') {
                score += 20;
            }

            // Padding (botões têm padding)
            if ('paddingLeft' in frameNode && 'paddingTop' in frameNode) {
                const hasPadding = frameNode.paddingLeft > 0 || frameNode.paddingTop > 0 ||
                    frameNode.paddingRight > 0 || frameNode.paddingBottom > 0;
                if (hasPadding) score += 25;
            }

            // Border radius (botões geralmente têm cantos arredondados)
            if ('cornerRadius' in frameNode && typeof frameNode.cornerRadius === 'number' && frameNode.cornerRadius > 0) {
                score += 15;
            }

            // Background preenchido (botões têm fundo)
            let hasVisualStyle = false;
            if ('fills' in frameNode) {
                const fills = frameNode.fills;
                if (typeof fills !== 'symbol' && Array.isArray(fills) && fills.length > 0) {
                    const hasSolidFill = fills.some(fill => fill.type === 'SOLID' && fill.visible !== false);
                    if (hasSolidFill) {
                        score += 20;
                        hasVisualStyle = true;
                    }
                }
            }

            // Border (Stroke) - Botões outline
            if ('strokes' in frameNode && Array.isArray(frameNode.strokes) && frameNode.strokes.length > 0) {
                // strokeWeight pode ser 'mixed' (symbol), então verificamos se é número
                if (typeof frameNode.strokeWeight === 'number' && frameNode.strokeWeight > 0) {
                    score += 15;
                    hasVisualStyle = true;
                }
            }

            // 🚨 PENALIDADE CRÍTICA: Se não tem fundo nem borda, NÃO É BOTÃO
            // Provavelmente é apenas um container de texto (Heading ou Text Block)
            if (!hasVisualStyle) {
                return 0;
            }

            // Poucos filhos (botões são simples: texto + talvez ícone)
            if ('children' in frameNode && frameNode.children.length <= 3) {
                score += 10;
            }

            // Detecção por nome
            const name = node.name.toLowerCase();
            if (name.includes('button') || name.includes('btn') || name.includes('cta')) {
                score += 15;
            }

            return Math.min(score, 100);
        }
    },

    {
        name: 'Icon Box',
        tag: 'w:icon-box',
        minScore: 70,
        category: 'basic',
        structure: {
            rootType: ['FRAME', 'COMPONENT', 'INSTANCE'],
            childCount: { min: 2, max: 4 },
            properties: {
                hasAutoLayout: true,
                layoutMode: 'VERTICAL'
            }
        },
        scoreFunction: (node: SceneNode): number => {
            if (node.type !== 'FRAME' && node.type !== 'INSTANCE' && node.type !== 'COMPONENT') return 0;

            let score = 0;
            const frameNode = node as FrameNode;

            if (!('children' in frameNode)) return 0;

            // Verificar estrutura: ícone/imagem + texto
            const hasIcon = frameNode.children.some(child =>
                child.type === 'INSTANCE' ||
                child.type === 'COMPONENT' ||
                child.type === 'VECTOR' ||
                child.type === 'ELLIPSE' ||
                (child.type === 'FRAME' && child.name.toLowerCase().includes('icon'))
            );

            const hasText = frameNode.children.some(child => child.type === 'TEXT');

            if (!hasIcon || !hasText) return 0; // Precisa ter ícone E texto

            score += 40; // Tem ícone + texto

            // Layout vertical (típico de icon-box)
            if ('layoutMode' in frameNode && frameNode.layoutMode === 'VERTICAL') {
                score += 30;
            }

            // Centralizado (icon-boxes geralmente são centralizados)
            if ('primaryAxisAlignItems' in frameNode && frameNode.primaryAxisAlignItems === 'CENTER') {
                score += 15;
            }

            // Poucos filhos (ícone + texto + talvez descrição)
            if (frameNode.children.length >= 2 && frameNode.children.length <= 4) {
                score += 15;
            }

            return score;
        }
    },

    {
        name: 'Heading',
        tag: 'w:heading',
        minScore: 70,
        category: 'basic',
        structure: {
            rootType: ['TEXT'],
            properties: {}
        },
        scoreFunction: (node: SceneNode): number => {
            if (node.type !== 'TEXT') return 0;

            const textNode = node as TextNode;
            let score = 0;

            if (typeof textNode.fontSize === 'number' && textNode.fontSize >= 18) {
                score += 50;
            }

            const fontWeight = textNode.fontWeight;
            if (typeof fontWeight === 'number' && fontWeight >= 600) {
                score += 50;
            }

            return score;
        }
    },

    {
        name: 'Image',
        tag: 'w:image',
        minScore: 75,
        category: 'basic',
        structure: {
            rootType: ['RECTANGLE', 'INSTANCE', 'COMPONENT', 'FRAME'],
            properties: {}
        },
        scoreFunction: (node: SceneNode): number => {
            // Componentes e instâncias geralmente são imagens
            if (node.type === 'INSTANCE' || node.type === 'COMPONENT') {
                // Se o nome contém "image", "img", "photo", "picture"
                const name = node.name.toLowerCase();
                if (name.includes('image') || name.includes('img') ||
                    name.includes('photo') || name.includes('picture') ||
                    name.includes('default')) {
                    return 90;
                }

                // Se tem filhos, provavelmente não é só uma imagem
                if ('children' in node && node.children.length > 0) {
                    return 40; // Score baixo - pode ser button ou icon-box
                }

                return 60; // Score médio para componentes sem indicação clara
            }

            // Retângulos com fill de imagem
            if (node.type === 'RECTANGLE' && 'fills' in node) {
                const fills = node.fills;
                if (typeof fills !== 'symbol' && Array.isArray(fills)) {
                    const hasImageFill = fills.some(fill => fill.type === 'IMAGE');
                    if (hasImageFill) return 95;
                }
            }

            // Frames que parecem ser containers de imagem
            if (node.type === 'FRAME' && 'fills' in node) {
                const fills = node.fills;
                if (typeof fills !== 'symbol' && Array.isArray(fills)) {
                    const hasImageFill = fills.some(fill => fill.type === 'IMAGE');
                    if (hasImageFill) return 85;
                }
            }

            return 0;
        }
    },



    {
        name: 'Text Editor',
        tag: 'w:text',
        minScore: 60,
        category: 'basic',
        structure: {
            rootType: ['TEXT'],
            properties: {}
        },
        scoreFunction: (node: SceneNode): number => {
            if (node.type !== 'TEXT') return 0;
            const textNode = node as TextNode;

            // Se for muito grande, é heading
            if (typeof textNode.fontSize === 'number' && textNode.fontSize >= 18) return 0;

            // Se for muito curto, pode ser label ou button text
            if (textNode.characters.length < 10) return 40;

            // Texto longo = Text Editor
            return 80;
        }
    },

    {
        name: 'Icon',
        tag: 'w:icon',
        minScore: 80,
        category: 'basic',
        structure: {
            rootType: ['VECTOR', 'STAR', 'POLYGON', 'ELLIPSE', 'BOOLEAN_OPERATION', 'INSTANCE', 'COMPONENT'],
            properties: {}
        },
        scoreFunction: (node: SceneNode): number => {
            // Instâncias com "icon" no nome
            if (node.type === 'INSTANCE' || node.type === 'COMPONENT') {
                if (node.name.toLowerCase().includes('icon')) return 90;
                // Se for pequeno e quadrado
                if (Math.abs(node.width - node.height) < 2 && node.width < 64) return 70;
            }

            // Vetores puros
            if (['VECTOR', 'STAR', 'POLYGON', 'BOOLEAN_OPERATION'].includes(node.type)) {
                return 80;
            }

            return 0;
        }
    },

    {
        name: 'Divider',
        tag: 'w:divider',
        minScore: 80,
        category: 'basic',
        structure: {
            rootType: ['LINE', 'RECTANGLE'],
            properties: {}
        },
        scoreFunction: (node: SceneNode): number => {
            if (node.type === 'LINE') return 100;

            if (node.type === 'RECTANGLE') {
                // Retângulo muito fino (altura < 5px ou largura < 5px)
                if (node.height <= 2 || node.width <= 2) return 90;
            }

            return 0;
        }
    },

    {
        name: 'Container',
        tag: 'c:container',
        minScore: 60,
        category: 'basic',
        structure: {
            rootType: ['FRAME'],
            properties: {
                hasAutoLayout: true
            }
        },
        scoreFunction: (node: SceneNode): number => {
            if (node.type !== 'FRAME') return 0;

            const frameNode = node as FrameNode;
            let score = 0;

            if (frameNode.layoutMode !== 'NONE') {
                score += 40;
            }

            if (frameNode.children.length > 0) {
                score += 30;
            }

            if (frameNode.paddingLeft > 0 || frameNode.paddingTop > 0) {
                score += 30;
            }

            return score;
        }
    }
];
