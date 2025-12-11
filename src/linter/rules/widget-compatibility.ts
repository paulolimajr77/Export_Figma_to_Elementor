/**
 * Regras de Compatibilidade Estrutural (Figma Node Type -> Elementor Widget)
 * Centraliza a validação para evitar sugestões impossíveis ou arriscadas.
 */

export const WIDGET_COMPATIBILITY_MAP: Record<string, string[]> = {
    // Nós de Texto só podem virar widgets baseados em texto
    TEXT: [
        'heading', 'text-editor', 'paragraph', 'rich-text',
        'post-title', 'post-excerpt', 'post-content', 'post-info', 'post-date', 'post-author', 'post-terms',
        'site-title', 'site-tagline', 'archive-title', 'archive-description',
        'call-to-action', // CTA pode ser aplicado a texto se for apenas o link? Geralmente CTA é um container. Mas aceitamos para conversão de texto isolado em botão simples as vezes.
        'button', // Texto pode virar botão (apenas o label)
        'icon', // Ícones de fonte (FontAwesome) são texto
        'shortcode', 'html',
        'menu-anchor'
    ],

    // Retângulos e Vetores
    RECTANGLE: [
        'image', 'button', 'icon', 'divider', 'spacer', 'video', 'lottie', 'google-maps',
        'menu-anchor',
        'container', // Retângulo pode ser background de container
        'inner-container'
    ],
    ELLIPSE: ['image', 'icon', 'avatar', 'button'],
    VECTOR: ['icon', 'divider', 'spacer', 'star-rating', 'svg'],
    STAR: ['icon', 'star-rating'],
    LINE: ['divider', 'spacer'],

    // Frames e Grupos (Containers e Composites)
    FRAME: [
        'container', 'inner-container',
        'button', 'checkbox', 'radio', 'switch', 'select',
        'icon-box', 'image-box', 'card', 'form', 'nav-menu',
        'tabs', 'accordion', 'toggle',
        'gallery', 'image-gallery', 'slider', 'slides', 'carousel', 'image-carousel', 'media-carousel', 'testimonial-carousel', 'loop-carousel',
        'loop-grid', 'loop-item',
        'reviews', 'testimonial',
        'progress-tracker', 'table-of-contents',
        'price-table', 'price-list',
        'login', 'search-form', 'blockquote',
        'global-widget'
    ],
    GROUP: [
        'container', 'inner-container',
        'button', 'checkbox', 'radio', 'switch', 'select',
        'icon-box', 'image-box', 'card', 'form', 'nav-menu',
        'tabs', 'accordion', 'toggle', 'gallery', 'slider', 'carousel', 'loop-grid',
        'gallery', 'image-gallery', 'slider', 'slides', 'carousel', 'image-carousel',
        'loop-grid', 'loop-item',
        'price-table', 'price-list',
        'login', 'search-form'
    ],

    // Instances (Componentes) - Geralmente tratados como Frames
    INSTANCE: [
        'global-widget', 'template',
        'container', 'inner-container',
        'button', // Componente de botão
        'icon-box', 'image-box', 'card', 'form', 'nav-menu'
    ]
};

/**
 * Verifica se um widget é compatível com os tipos de nodes selecionados.
 * Retorna uma mensagem de aviso ou null se for compatível.
 */
export function getCompatibilityWarning(nodeTypes: string[], widgetName: string): string | null {
    if (!nodeTypes || nodeTypes.length === 0) return null;

    // Normalizar widget name (remover prefixos)
    const plainName = widgetName.toLowerCase().replace(/^(w:|woo:|loop:|c:)/, '').trim();

    // Ignorar widgets desconhecidos ou genéricos demais que não estão no mapa
    // Mas se não estiver no mapa, assumimos Safe? Não, melhor safe por default para evitar impedir inovação.

    const incompatibleTypes = nodeTypes.filter(type => {
        // Se for INSTANCE, tratar como FRAME na dúvida se não houver regra específica
        // Mas temos regra para INSTANCE.

        const allowed = WIDGET_COMPATIBILITY_MAP[type];
        if (!allowed) return false; // Se não tem regra para o tipo (ex: SLICE), aceita tudo.

        return !allowed.includes(plainName);
    });

    if (incompatibleTypes.length > 0) {
        const uniqueTypes = [...new Set(incompatibleTypes)];
        const typeStr = uniqueTypes.join(', ');
        return `Incomum para ${typeStr}`;
    }

    return null;
}
