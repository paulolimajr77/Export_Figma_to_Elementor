# Fix para Image-Box - Detectar Imagens Corretas

## Problema
O plugin está exportando a mesma imagem múltiplas vezes porque não há lógica específica para o widget `image-box`.

## Solução
Adicione este código no arquivo `src/code.ts`, dentro do método `createExplicitWidget`, **APÓS** o bloco do `icon-box` (linha ~887) e **ANTES** do bloco do `heading`:

```typescript
else if (widgetSlug === 'image-box') {
    console.log(`[F2E] Processing image-box: ${node.name}`);
    let imageNode: SceneNode | null = null;
    let titleNode: TextNode | null = null;
    let descNode: TextNode | null = null;

    // Find children
    if ('children' in node) {
        const frame = node as FrameNode;
        console.log(`[F2E] image-box has ${frame.children.length} children`);
        
        // Find Image (Rectangle, Frame, or Instance with image fill or named w:image)
        imageNode = frame.children.find(c => {
            const isNamedImage = c.name.toLowerCase().includes('w:image') || c.name.toLowerCase().includes('image');
            const isImageType = ['RECTANGLE', 'FRAME', 'INSTANCE', 'COMPONENT'].includes(c.type);
            
            // Check for image fill (only for geometry nodes)
            let hasImageFillCheck = false;
            if ('fills' in c && c.fills !== figma.mixed && Array.isArray(c.fills)) {
                hasImageFillCheck = c.fills.some((fill: any) => fill.type === 'IMAGE');
            }
            
            console.log(`[F2E]   Child "${c.name}" (${c.type}): isNamed=${isNamedImage}, hasImage=${hasImageFillCheck}, isType=${isImageType}`);
            
            return isNamedImage || (isImageType && hasImageFillCheck);
        }) || null;

        // Find Texts
        const textNodes = frame.children.filter(c => c.type === 'TEXT') as TextNode[];
        console.log(`[F2E] Found ${textNodes.length} text nodes`);
        if (textNodes.length > 0) titleNode = textNodes[0];
        if (textNodes.length > 1) descNode = textNodes[1];
    }

    // Handle Image
    if (imageNode) {
        console.log(`[F2E] Found image node: ${imageNode.name}`);
        const url = await this.uploadImageToWordPress(imageNode, 'PNG');
        if (url) {
            console.log(`[F2E] Image uploaded successfully: ${url}`);
            settings.image = { url, id: 0 };
        } else {
            console.warn(`[F2E] Image upload failed, using PNG base64`);
            const pngBytes = await exportNodeAsPng(imageNode);
            if (pngBytes) {
                settings.image = {
                    url: `data:image/png;base64,${figma.base64Encode(pngBytes)}`
                };
            } else {
                settings.image = { url: '' };
            }
        }
    } else {
        console.warn(`[F2E] No image node found in image-box: ${node.name}`);
        settings.image = { url: '' };
    }

    // Handle Title
    if (titleNode) {
        settings.title_text = titleNode.characters;
        const typo = extractTypography(titleNode);
        const color = extractTextColor(titleNode);

        // Map typography to title_typography
        for (const key in typo) {
            const newKey = key.replace('typography_', 'title_typography_');
            (settings as any)[newKey] = (typo as any)[key];
        }
        if (color) settings.title_color = color;
    } else {
        settings.title_text = 'This is the heading';
    }

    // Handle Description
    if (descNode) {
        settings.description_text = descNode.characters;
        const typo = extractTypography(descNode);
        const color = extractTextColor(descNode);

        // Map typography to description_typography
        for (const key in typo) {
            const newKey = key.replace('typography_', 'description_typography_');
            (settings as any)[newKey] = (typo as any)[key];
        }
        if (color) settings.description_color = color;
    } else {
        settings.description_text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
    }

    // Image position (top, left, right)
    settings.image_position = 'top';
    settings.title_size = 'default';
    settings.link = { url: '#', is_external: false, nofollow: false };
}
```

## Como Aplicar

1. Abra `src/code.ts`
2. Procure por `else if (widgetSlug === 'heading') {` (linha ~888)
3. **ANTES** dessa linha, adicione o código acima
4. Salve o arquivo
5. Execute `npm run build`

## O que isso faz

1. **Detecta a imagem correta**: Procura por nós filhos que:
   - Tenham nome contendo "w:image" ou "image"
   - OU sejam do tipo RECTANGLE/FRAME/INSTANCE/COMPONENT com preenchimento de imagem

2. **Logs detalhados**: Mostra no console qual nó foi encontrado como imagem

3. **Mapeia título e descrição**: Pega os textos corretos do frame

4. **Upload ou base64**: Tenta fazer upload ao WordPress, se falhar usa base64

## Testando

Após aplicar o fix:
1. Abra o console do Figma (Ctrl+Shift+I)
2. Exporte o design
3. Veja os logs `[F2E] Processing image-box...`
4. Verifique se cada image-box encontrou a imagem correta
