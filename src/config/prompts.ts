export const ANALYZE_RECREATE_PROMPT = `
Organize a arvore Figma em um schema de CONTAINERS FLEX simples.

REGRAS CRITICAS:
- NAO ignore nenhum node. Cada node vira container (se tiver filhos) ou widget (se for folha).
- NAO classifique por aparencia. Se nao souber, type = "custom".
- NAO invente grids, sections/columns ou imageBox/iconBox.
- Preserve a ordem original dos filhos.
- Mapear auto-layout: HORIZONTAL -> direction=row; VERTICAL/NONE -> direction=column.
- gap = itemSpacing; padding = paddingTop/Right/Bottom/Left; background = fills/gradiente/imagem se houver.
- Widgets permitidos: heading | text | button | image | icon | custom.
- styles deve incluir sourceId com o id do node original.

SCHEMA ALVO:
{
  "page": { "title": "...", "tokens": { "primaryColor": "...", "secondaryColor": "..." } },
  "containers": [
    {
      "id": "string",
      "direction": "row" | "column",
      "width": "full" | "boxed",
      "styles": {},
      "widgets": [ { "type": "heading|text|button|image|icon|custom", "content": "...", "imageId": null, "styles": {} } ],
      "children": [ ... ]
    }
  ]
}

ENTRADA:
${nodeData}

INSTRUCOES:
- Mantenha textos e imagens exatamente como no original.
- Nao agrupe nos diferentes em um unico widget.
- Se o node tem filhos -> container; se nao tem -> widget simples.
- width use "full" (padrao); direction derive do layoutMode.
`;
