import { Rule, LintResult, ManualFixGuide } from '../../types';

/**
 * Regra: Detecta nomes genéricos de camadas
 * Severidade: Major
 * Categoria: Naming
 */
export class GenericNameRule implements Rule {
    id = 'generic-name-detected';
    category = 'naming' as const;
    severity = 'major' as const;

    private readonly GENERIC_PATTERNS = /^(Frame|Rectangle|Group|Vector|Ellipse|Line|Component|Instance)\s+\d+$/;

    async validate(node: SceneNode): Promise<LintResult | null> {
        if (this.GENERIC_PATTERNS.test(node.name)) {
            const suggestedPattern = this.detectSuggestedPattern(node);
            const examples = this.getExamplesForNodeType(node);

            return {
                node_id: node.id,
                node_name: node.name,
                severity: this.severity,
                category: this.category,
                rule: this.id,
                message: `Nome genérico detectado: "${node.name}"`,
                educational_tip: `
⚠️ Por que nomenclatura importa?

• Facilita manutenção do design no Figma
• Melhora a detecção automática de widgets
• Gera código Elementor mais legível
• Facilita colaboração em equipe

💡 Padrão sugerido: ${suggestedPattern}

📖 Exemplos:
${examples.map(ex => `  • ${ex}`).join('\n')}

✅ Solução:
Renomeie a camada seguindo a taxonomia Elementor (Btn/*, Img/*, Icon/*, H1-H6, Card/*, etc.)
        `.trim()
            };
        }

        return null;
    }

    generateGuide(node: SceneNode): ManualFixGuide {
        const suggestedPattern = this.detectSuggestedPattern(node);
        const examples = this.getExamplesForNodeType(node);

        return {
            node_id: node.id,
            problem: `Nome genérico: "${node.name}"`,
            severity: this.severity,
            step_by_step: [
                { step: 1, action: 'Clique duas vezes no nome da camada no Figma' },
                { step: 2, action: `Renomeie seguindo o padrão: ${suggestedPattern}` },
                { step: 3, action: 'Use nomes descritivos que indiquem a função do elemento' }
            ],
            before_after_example: {
                before: `"${node.name}" (genérico)`,
                after: `"${examples[0]}" (descritivo)`
            },
            estimated_time: '10 segundos',
            difficulty: 'easy'
        };
    }

    /**
     * Detecta padrão sugerido baseado no tipo de node
     */
    private detectSuggestedPattern(node: SceneNode): string {
        if (node.type === 'TEXT') {
            const textNode = node as TextNode;
            const fontSize = typeof textNode.fontSize === 'number' ? textNode.fontSize : 16;

            if (fontSize >= 32) return 'H1, H2, H3';
            if (fontSize >= 24) return 'H4, H5';
            return 'Text/Paragraph, Text/Description, Text/Label';
        }

        if (node.type === 'RECTANGLE') {
            const rect = node as RectangleNode;
            if (this.hasImageFill(rect)) {
                return 'Img/Hero, Img/Product, Img/Background';
            }
            if (this.isButtonLike(rect)) {
                return 'Btn/Primary, Btn/Secondary, Btn/Outline';
            }
            return 'Container/*, Section/*';
        }

        if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') {
            return 'Icon/Menu, Icon/Close, Icon/Arrow';
        }

        if (node.type === 'FRAME') {
            const frame = node as FrameNode;
            if (frame.layoutMode !== 'NONE') {
                return 'Card/*, Grid/*, Section/*, Container/*';
            }
        }

        return 'Descreva a função do elemento';
    }

    /**
     * Obtém exemplos de nomenclatura para o tipo de node
     */
    private getExamplesForNodeType(node: SceneNode): string[] {
        if (node.type === 'TEXT') {
            return [
                'H1 - Título principal',
                'H2/Features - Subtítulo da seção',
                'Text/Description - Texto descritivo',
                'Label/Price - Rótulo de preço'
            ];
        }

        if (node.type === 'RECTANGLE') {
            const rect = node as RectangleNode;
            if (this.hasImageFill(rect)) {
                return [
                    'Img/Hero - Imagem principal',
                    'Img/Product - Imagem de produto',
                    'Img/Avatar - Foto de perfil'
                ];
            }
            if (this.isButtonLike(rect)) {
                return [
                    'Btn/Primary - Botão principal',
                    'Btn/CTA - Call to action',
                    'Btn/Submit - Botão de envio'
                ];
            }
        }

        if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') {
            return [
                'Icon/Menu - Ícone de menu',
                'Icon/Close - Ícone de fechar',
                'Icon/Arrow - Ícone de seta'
            ];
        }

        if (node.type === 'FRAME') {
            return [
                'Card/Product - Card de produto',
                'Grid/Features - Grid de funcionalidades',
                'Section/Hero - Seção hero',
                'Container/Content - Container de conteúdo'
            ];
        }

        return ['Use nomes descritivos'];
    }

    /**
     * Verifica se node tem fill de imagem
     */
    private hasImageFill(node: RectangleNode): boolean {
        if (!node.fills || typeof node.fills === 'symbol') return false;
        return (node.fills as Paint[]).some(fill => fill.type === 'IMAGE');
    }

    /**
     * Verifica se node parece um botão
     */
    private isButtonLike(node: RectangleNode): boolean {
        // Heurística simples: tem fill + stroke ou cornerRadius > 0
        const hasFill = node.fills && typeof node.fills !== 'symbol' && node.fills.length > 0;
        const hasStroke = node.strokes && typeof node.strokes !== 'symbol' && node.strokes.length > 0;
        const hasRadius = typeof node.cornerRadius === 'number' && node.cornerRadius > 0;

        return (hasFill && hasRadius) || (hasFill && hasStroke);
    }
}
