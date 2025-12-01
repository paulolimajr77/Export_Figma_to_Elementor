 /**
 * @fileoverview Funções utilitárias para o Agente Compiler.
 * Isola a lógica de compilação de widgets para maior clareza e manutenibilidade.
 */

/**
 * Compila um nó do schema intermediário para um widget de ícone do Elementor.
 * Garante que nós do tipo 'IMAGE' nomeados como 'w:icon' sejam convertidos corretamente.
 *
 * @param {any} node - O nó do schema intermediário a ser compilado.
 * @returns {any} O objeto de widget de ícone para o JSON do Elementor.
 */
function compileIconWidget(node: any): any {
  // Extrai a URL do ícone SVG, garantindo que o caminho seja válido.
  const iconUrl = node.styles?.src || '';

  // Retorna a estrutura completa do widget de ícone para o Elementor.
  // A propriedade 'selected_icon' é crucial para a renderização correta.
  return {
    id: node.id,
    elType: 'widget',
    widgetType: 'icon',
    settings: {
      // Garante que o ícone seja tratado como um SVG customizado.
      selected_icon: {
        value: {
          url: iconUrl,
        },
        library: 'svg',
      },
      // Preserva o alinhamento definido no Figma.
      align: node.styles?.textAlignHorizontal?.toLowerCase() || 'center',
    },
    elements: [],
  };
}