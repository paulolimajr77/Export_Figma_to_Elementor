(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/config/prompts.ts
  function buildConsolidationPrompt(processedNodes) {
    return `CONSOLIDA\xC7\xC3O FINAL

Voc\xEA processou ${processedNodes.length} nodes. Agora consolide tudo em um JSON Elementor v\xE1lido.

NODES PROCESSADOS:
${JSON.stringify(processedNodes, null, 2)}

TAREFA:
1. Montar hierarquia completa respeitando parent-child
2. Validar integridade estrutural
3. Gerar JSON final no formato Elementor
4. Criar relat\xF3rio t\xE9cnico

FORMATO DE SA\xCDDA:
{
  "elementorJSON": {
    "version": "1.0",
    "elements": [...]
  },
  "report": {
    "summary": {
      "totalNodes": ${processedNodes.length},
      "converted": 0,
      "custom": 0
    },
    "mappings": [...],
    "warnings": [...]
  }
}`;
  }
  var ANALYZE_RECREATE_PROMPT;
  var init_prompts = __esm({
    "src/config/prompts.ts"() {
      ANALYZE_RECREATE_PROMPT = `
pense como um webdesginer especialista em layouts usando wordpress elementor.

imagine que voce receba um layout no figma muito mal estruturado como este a baixo e precise ajusta-lo para que um outro webdesigner que ir\xE1 receber o arquivo consiga identificar o auto layout para responsividade, os widgets a serem usados no elementor e etc.

como voc\xEA ajustaria esse layout no figma.

lembre-se Full container, Container encaixotado, caixas de imagem, caixas de icone otimizam o layout.

evite o uso de container, dentro de container, dentro de container e assim por diante.(coisa de amador).

**IMPORTANTE:** Mantenha TODOS os fundos (fills), gradientes e imagens EXATAMENTE como est\xE3o no original. N\xC3O remova, simplifique ou altere cores de fundo, gradientes ou imagens. Se um elemento tem fundo no original, ele DEVE ter o mesmo fundo na sa\xEDda. Se n\xE3o tem fundo (fills vazio), mantenha vazio.

**ATEN\xC7\xC3O ESPECIAL:** Se o frame raiz (Section) tem um gradiente ou imagem de fundo, MOVA esse fundo para o PRIMEIRO container filho (Section 1 - Hero, por exemplo), N\xC3O deixe no frame raiz. O frame raiz deve ter "fills": [] vazio, e o fundo deve estar no container de se\xE7\xE3o.

**REGRA T\xC9CNICA:** NUNCA use "counterAxisAlignItems": "STRETCH". Os valores v\xE1lidos s\xE3o: "MIN", "MAX", "CENTER", "BASELINE". Para esticar elementos filhos, use "layoutSizingHorizontal": "FILL" ou "layoutSizingVertical": "FILL" nos pr\xF3prios filhos.

**REGRAS DE NOMENCLATURA (CR\xCDTICO):**
Voc\xEA DEVE renomear as camadas (propriedade "name") usando os seguintes prefixos para que o plugin identifique os widgets automaticamente:

- **Containers:**
  - "c:container" ou "section:nome" (para se\xE7\xF5es principais)
  - "c:inner" ou "column:nome" (para colunas internas)

- **Widgets:**
  - "w:heading" (T\xEDtulos)
  - "w:text-editor" (Textos longos)
  - "w:image" (Imagens simples)
  - "w:image-box" (Imagem + T\xEDtulo + Texto agrupados)
  - "w:icon-box" (\xCDcone + T\xEDtulo + Texto agrupados)
  - "w:button" (Bot\xF5es)
  - "w:video" (V\xEDdeos)
  - "w:divider" (Divisores)
  - "w:spacer" (Espa\xE7adores)

Exemplo: Em vez de "Group 1", use "c:container - Hero Section". Em vez de "Heading 2", use "w:heading - T\xEDtulo Principal".

\${nodeData}

quero que devolva o json Aplicando boas pr\xE1ticas visuais, como espa\xE7amentos mais consistentes, grid centralizado e alinhamentos corrigidos, limpando e reorganizando o layout, mantendo tudo exatamente igual visualmente.

n\xE3o reduza texto, descaracterize (deforme) formato de imagem ou \xEDcones e etc.

mantenha o conte\xFAdo original.

utilize o modelo abaixo como referencia do antes e depois.

ANTES (Layout Sujo - O que voc\xEA pode receber):
\`\`\`json
{
  "id": "174:691",
  "name": "Group 6",
  "type": "GROUP",
  "width": 1920,
  "height": 1304.449951171875,
  "x": 0,
  "y": 1320,
  "visible": true,
  "children": [
    {
      "id": "172:667",
      "name": "Group 5",
      "type": "GROUP",
      "children": [
        {
          "id": "169:123",
          "name": "Frame 5",
          "type": "FRAME",
          "layoutMode": "NONE",
          "children": [
            {
              "id": "1:26",
              "name": "Group 1",
              "type": "GROUP",
              "children": [
                {
                  "id": "1:27",
                  "name": "Section",
                  "type": "FRAME",
                  "layoutMode": "NONE",
                  "children": [
                    {
                      "id": "1:33",
                      "name": "Heading 2",
                      "type": "TEXT",
                      "characters": "O que \xE9 a Harmoniza\xE7\xE3o\\nIntima Masculina ?",
                      "fontSize": 40
                    },
                    {
                      "id": "1:34",
                      "name": "Description",
                      "type": "TEXT",
                      "characters": "A harmoniza\xE7\xE3o \xEDntima masculina \xE9 um procedimento est\xE9tico...",
                      "fontSize": 20
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
\`\`\`

DEPOIS (Layout Otimizado - O que voc\xEA deve gerar):
\`\`\`json
{
  "id": "root-frame",
  "name": "Desktop - Homepage Optimized",
  "type": "FRAME",
  "layoutMode": "VERTICAL",
  "primaryAxisSizingMode": "AUTO",
  "counterAxisSizingMode": "FIXED",
  "children": [
    {
      "id": "section-hero",
      "name": "c:container - Hero Section",
      "type": "FRAME",
      "layoutMode": "HORIZONTAL",
      "primaryAxisSizingMode": "FIXED",
      "counterAxisSizingMode": "AUTO",
      "children": [
        {
          "id": "hero-content-col",
          "name": "c:inner - Left Content",
          "type": "FRAME",
          "layoutMode": "VERTICAL",
          "children": [
            {
              "id": "hero-heading",
              "name": "w:heading - Title",
              "type": "TEXT",
              "characters": "O que \xE9 a Harmoniza\xE7\xE3o\\nIntima Masculina?",
              "fontSize": 48,
              "layoutSizingHorizontal": "FILL"
            },
            {
              "id": "hero-text",
              "name": "w:text-editor - Description",
              "type": "TEXT",
              "characters": "A harmoniza\xE7\xE3o \xEDntima masculina \xE9 um procedimento est\xE9tico...",
              "fontSize": 18,
              "layoutSizingHorizontal": "FILL"
            }
          ]
        }
      ]
    }
  ]
}
\`\`\`
`;
    }
  });

  // src/utils/image_utils.ts
  function rgbToHex(rgb) {
    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }
  function getBackgroundFromNode(node) {
    if ("fills" in node && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === "SOLID") {
          const { r, g, b } = fill.color;
          return rgbToHex({ r, g, b });
        }
      }
    }
    return "#FFFFFF";
  }
  function extractImagesFromNode(node) {
    return __async(this, null, function* () {
      const images = {};
      function traverse(n) {
        return __async(this, null, function* () {
          if ("fills" in n && Array.isArray(n.fills)) {
            for (const fill of n.fills) {
              if (fill.type === "IMAGE" && fill.imageHash) {
                const image = figma.getImageByHash(fill.imageHash);
                if (image) {
                  const bytes = yield image.getBytesAsync();
                  images[fill.imageHash] = bytes;
                }
              }
            }
          }
          if ("children" in n) {
            for (const child of n.children) {
              yield traverse(child);
            }
          }
        });
      }
      yield traverse(node);
      return images;
    });
  }
  var init_image_utils = __esm({
    "src/utils/image_utils.ts"() {
    }
  });

  // src/utils/serialization_utils.ts
  function serializeNode(node) {
    const data = {
      id: node.id,
      name: node.name,
      type: node.type,
      width: node.width,
      height: node.height,
      x: node.x,
      y: node.y,
      visible: node.visible,
      locked: node.locked
    };
    if ("opacity" in node) data.opacity = node.opacity;
    if ("blendMode" in node) data.blendMode = node.blendMode;
    if ("fills" in node && node.fills !== figma.mixed) {
      data.fills = node.fills.map((fill) => {
        if (fill.type === "SOLID") {
          return { type: "SOLID", color: fill.color, opacity: fill.opacity, visible: fill.visible };
        }
        if (fill.type === "IMAGE") {
          return { type: "IMAGE", visible: fill.visible, imageHash: fill.imageHash, scaleMode: fill.scaleMode };
        }
        if (fill.type === "GRADIENT_LINEAR" || fill.type === "GRADIENT_RADIAL" || fill.type === "GRADIENT_ANGULAR" || fill.type === "GRADIENT_DIAMOND") {
          return {
            type: fill.type,
            gradientStops: fill.gradientStops || [],
            gradientTransform: fill.gradientTransform || [[1, 0, 0], [0, 1, 0]],
            opacity: fill.opacity,
            visible: fill.visible
          };
        }
        return { type: fill.type, visible: fill.visible };
      });
    }
    if ("strokes" in node && node.strokes !== figma.mixed) {
      data.strokes = node.strokes.map((stroke) => {
        if (stroke.type === "SOLID") {
          return { type: "SOLID", color: stroke.color, opacity: stroke.opacity, visible: stroke.visible };
        }
        return { type: stroke.type, visible: stroke.visible };
      });
      data.strokeWeight = node.strokeWeight;
      data.strokeAlign = node.strokeAlign;
      data.strokeCap = node.strokeCap;
      data.strokeJoin = node.strokeJoin;
      data.dashPattern = node.dashPattern;
    }
    if ("effects" in node && node.effects !== figma.mixed) {
      data.effects = node.effects.map((effect) => ({
        type: effect.type,
        visible: effect.visible,
        radius: effect.radius,
        offset: effect.offset,
        spread: effect.spread,
        color: effect.color,
        blendMode: effect.blendMode
      }));
    }
    if ("cornerRadius" in node) {
      if (node.cornerRadius !== figma.mixed) {
        data.cornerRadius = node.cornerRadius;
      } else {
        data.topLeftRadius = node.topLeftRadius;
        data.topRightRadius = node.topRightRadius;
        data.bottomLeftRadius = node.bottomLeftRadius;
        data.bottomRightRadius = node.bottomRightRadius;
      }
    }
    if ("constraints" in node) {
      data.constraints = node.constraints;
    }
    if (node.type === "TEXT") {
      data.characters = node.characters;
      data.fontSize = node.fontSize;
      data.fontName = node.fontName;
      data.fontWeight = node.fontWeight;
      data.textAlignHorizontal = node.textAlignHorizontal;
      data.textAlignVertical = node.textAlignVertical;
      data.textAutoResize = node.textAutoResize;
      data.letterSpacing = node.letterSpacing;
      data.lineHeight = node.lineHeight;
      data.textCase = node.textCase;
      data.textDecoration = node.textDecoration;
      if (node.fills !== figma.mixed && node.fills.length > 0 && node.fills[0].type === "SOLID") {
        data.color = node.fills[0].color;
      }
    }
    if ("layoutMode" in node) {
      data.layoutMode = node.layoutMode;
      data.primaryAxisSizingMode = node.primaryAxisSizingMode;
      data.counterAxisSizingMode = node.counterAxisSizingMode;
      data.primaryAxisAlignItems = node.primaryAxisAlignItems;
      data.counterAxisAlignItems = node.counterAxisAlignItems;
      data.paddingTop = node.paddingTop;
      data.paddingRight = node.paddingRight;
      data.paddingBottom = node.paddingBottom;
      data.paddingLeft = node.paddingLeft;
      data.itemSpacing = node.itemSpacing;
    }
    if ("children" in node) {
      data.children = node.children.map((child) => serializeNode(child));
    }
    return data;
  }
  function getSectionsToAnalyze(node) {
    return [node];
  }
  function repairJson(jsonString) {
    let repaired = jsonString.trim();
    if (repaired.endsWith(",")) {
      repaired = repaired.slice(0, -1);
    }
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escaped = false;
    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === "{") openBraces++;
        else if (char === "}") openBraces--;
        else if (char === "[") openBrackets++;
        else if (char === "]") openBrackets--;
      }
    }
    while (openBraces > 0) {
      repaired += "}";
      openBraces--;
    }
    while (openBrackets > 0) {
      repaired += "]";
      openBrackets--;
    }
    return repaired;
  }
  var init_serialization_utils = __esm({
    "src/utils/serialization_utils.ts"() {
      init_image_utils();
    }
  });

  // src/api_gemini.ts
  function saveKey(key) {
    return __async(this, null, function* () {
      yield figma.clientStorage.setAsync("gemini_api_key", key);
    });
  }
  function getKey() {
    return __async(this, null, function* () {
      return yield figma.clientStorage.getAsync("gemini_api_key");
    });
  }
  function saveModel(model) {
    return __async(this, null, function* () {
      yield figma.clientStorage.setAsync("gemini_model", model);
    });
  }
  function getModel() {
    return __async(this, null, function* () {
      const savedModel = yield figma.clientStorage.getAsync("gemini_model");
      return savedModel || GEMINI_MODEL;
    });
  }
  function testConnection() {
    return __async(this, null, function* () {
      var _a;
      const apiKey = yield getKey();
      if (!apiKey) {
        return { success: false, message: "API Key n\xE3o configurada" };
      }
      const model = yield getModel();
      console.log(`\u{1F9EA} Testando conex\xE3o com modelo: ${model}`);
      const endpoint = `${API_BASE_URL}${model}:generateContent?key=${apiKey}`;
      try {
        const response = yield fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: "Ol\xE1" }]
            }]
          })
        });
        if (!response.ok) {
          const errorData = yield response.json();
          const errorMessage = ((_a = errorData.error) == null ? void 0 : _a.message) || `HTTP ${response.status}`;
          console.error("\u274C Erro na resposta:", errorData);
          throw new GeminiError(`Falha na conex\xE3o: ${errorMessage}`);
        }
        return { success: true, message: `Conex\xE3o OK com ${model}!` };
      } catch (e) {
        console.error("Erro de rede ao testar conex\xE3o:", e);
        return { success: false, message: e.message || "Erro desconhecido" };
      }
    });
  }
  function analyzeAndRecreate(_0) {
    return __async(this, arguments, function* (imageData, availableImageIds = [], nodeData = null, promptType = "full") {
      var _a, _b, _c, _d, _e, _f, _g;
      const apiKey = yield getKey();
      if (!apiKey) {
        throw new GeminiError("API Key n\xE3o configurada. Configure em Settings.");
      }
      const model = yield getModel();
      const endpoint = `${API_BASE_URL}${model}:generateContent?key=${apiKey}`;
      if (promptType === "micro" && (nodeData == null ? void 0 : nodeData.prompt)) {
        const requestBody2 = {
          contents: [{
            parts: [{ text: nodeData.prompt }]
          }]
        };
        const response = yield fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody2)
        });
        if (!response.ok) {
          const errorData = yield response.json().catch(() => ({}));
          throw new GeminiError(
            `Gemini API error: ${response.statusText}`,
            response.status,
            errorData
          );
        }
        const data = yield response.json();
        const textResponse = ((_e = (_d = (_c = (_b = (_a = data.candidates) == null ? void 0 : _a[0]) == null ? void 0 : _b.content) == null ? void 0 : _c.parts) == null ? void 0 : _d[0]) == null ? void 0 : _e.text) || "{}";
        try {
          return JSON.parse(textResponse);
        } catch (e) {
          return { response: textResponse };
        }
      }
      const base64Image = arrayBufferToBase64(imageData);
      const width = nodeData ? nodeData.width : 1440;
      const height = nodeData ? nodeData.height : 900;
      const halfHeight = nodeData ? Math.round(nodeData.height / 2) : 500;
      const halfWidth = nodeData ? Math.round(nodeData.width * 0.5) : 800;
      const thirdWidth = nodeData ? Math.round(nodeData.width * 0.3) : 400;
      const thirdHeight = nodeData ? Math.round(nodeData.height * 0.3) : 300;
      const firstImageId = availableImageIds[0] || "ID_DA_IMAGEM_AQUI";
      const prompt = ANALYZE_RECREATE_PROMPT.replace("${availableImageIds}", availableImageIds.join(", ")).replace("${nodeData}", nodeData ? JSON.stringify(nodeData, null, 2) : "No structural data available.").replace(/\${width}/g, width.toString()).replace(/\${height}/g, height.toString()).replace(/\${halfHeight}/g, halfHeight.toString()).replace(/\${halfWidth}/g, halfWidth.toString()).replace(/\${thirdWidth}/g, thirdWidth.toString()).replace(/\${thirdHeight}/g, thirdHeight.toString()).replace("${firstImageId}", firstImageId);
      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/png", data: base64Image } }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 8192,
          response_mime_type: "application/json"
        }
      };
      const requestLog = __spreadProps(__spreadValues({}, requestBody), { contents: [{ parts: [{ text: prompt }, { text: "[imagem omitida]" }] }] });
      figma.ui.postMessage({ type: "add-gemini-log", data: `--- REQUISI\xC7\xC3O ---
${JSON.stringify(requestLog, null, 2)}` });
      try {
        const response = yield fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          const errorData = yield response.json();
          const errorMessage = ((_f = errorData == null ? void 0 : errorData.error) == null ? void 0 : _f.message) || `Erro na API: ${response.status}`;
          throw new GeminiError(errorMessage, response.status, errorData);
        }
        const data = yield response.json();
        figma.ui.postMessage({ type: "add-gemini-log", data: `--- RESPOSTA ---
${JSON.stringify(data, null, 2)}` });
        if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
          const errorMessage = ((_g = data.error) == null ? void 0 : _g.message) || "A API retornou uma resposta vazia ou malformada.";
          throw new GeminiError(errorMessage, void 0, data);
        }
        const candidate = data.candidates[0];
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
          throw new GeminiError("A API retornou um conte\xFAdo vazio.");
        }
        let responseText = candidate.content.parts[0].text;
        const startIndex = responseText.indexOf("{");
        if (startIndex === -1) {
          throw new GeminiError("Nenhum objeto JSON encontrado na resposta.");
        }
        let endIndex = responseText.lastIndexOf("}");
        if (endIndex === -1 || endIndex < startIndex) {
          endIndex = responseText.length;
        }
        let jsonString = responseText.substring(startIndex, endIndex + 1);
        try {
          const result = JSON.parse(jsonString);
          return result;
        } catch (e) {
          console.warn("JSON inv\xE1lido detectado. Tentando reparar...", e);
          try {
            const repairedJson = repairJson(jsonString);
            const result = JSON.parse(repairedJson);
            return result;
          } catch (repairError) {
            console.error("Falha ao reparar JSON:", repairError);
            if (candidate.finishReason === "MAX_TOKENS") {
              throw new GeminiError("A resposta foi cortada e n\xE3o p\xF4de ser recuperada. Tente simplificar o frame.", void 0, { finishReason: "MAX_TOKENS" });
            }
            throw new GeminiError("Falha ao processar o JSON retornado pela IA.", void 0, repairError);
          }
        }
      } catch (error) {
        figma.ui.postMessage({ type: "add-gemini-log", data: `--- ERRO ---
${error.message}` });
        console.error("Erro na chamada fetch para o Gemini:", error);
        if (error instanceof GeminiError) throw error;
        throw new GeminiError(`Erro na API Gemini: ${error.message}`, void 0, error);
      }
    });
  }
  function arrayBufferToBase64(buffer) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = "";
    let i = 0;
    const len = buffer.length;
    while (i < len) {
      const byte1 = buffer[i++];
      const byte2 = i < len ? buffer[i++] : NaN;
      const byte3 = i < len ? buffer[i++] : NaN;
      const enc1 = byte1 >> 2;
      const enc2 = (byte1 & 3) << 4 | (isNaN(byte2) ? 0 : byte2 >> 4);
      const enc3 = (byte2 & 15) << 2 | (isNaN(byte3) ? 0 : byte3 >> 6);
      const enc4 = byte3 & 63;
      result += chars.charAt(enc1) + chars.charAt(enc2);
      if (isNaN(byte2)) {
        result += "==";
      } else {
        result += chars.charAt(enc3);
        if (isNaN(byte3)) {
          result += "=";
        } else {
          result += chars.charAt(enc4);
        }
      }
    }
    return result;
  }
  function consolidateNodes(processedNodes) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d;
      const apiKey = yield getKey();
      if (!apiKey) throw new GeminiError("API Key n\xE3o configurada.");
      const model = yield getModel();
      const endpoint = `${API_BASE_URL}${model}:generateContent?key=${apiKey}`;
      const prompt = buildConsolidationPrompt2(processedNodes);
      const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          // Baixa temperatura para maior precisão estrutural
          maxOutputTokens: 8192,
          response_mime_type: "application/json"
        }
      };
      try {
        const response = yield fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          const errorData = yield response.json();
          throw new GeminiError(`Erro na consolida\xE7\xE3o: ${response.status}`, response.status, errorData);
        }
        const data = yield response.json();
        const candidate = (_a = data.candidates) == null ? void 0 : _a[0];
        if (!((_d = (_c = (_b = candidate == null ? void 0 : candidate.content) == null ? void 0 : _b.parts) == null ? void 0 : _c[0]) == null ? void 0 : _d.text)) {
          throw new GeminiError("Resposta vazia da consolida\xE7\xE3o.");
        }
        const responseText = candidate.content.parts[0].text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new GeminiError("JSON n\xE3o encontrado na resposta de consolida\xE7\xE3o.");
        let jsonString = jsonMatch[0];
        try {
          return JSON.parse(jsonString);
        } catch (parseError) {
          console.warn("\u26A0\uFE0F JSON inv\xE1lido detectado na consolida\xE7\xE3o. Tentando reparar...", parseError);
          figma.ui.postMessage({ type: "add-gemini-log", data: `\u26A0\uFE0F JSON malformado, tentando reparar...` });
          try {
            const repairedJson = repairJson(jsonString);
            const result = JSON.parse(repairedJson);
            figma.ui.postMessage({ type: "add-gemini-log", data: `\u2705 JSON reparado com sucesso` });
            return result;
          } catch (repairError) {
            console.error("\u274C Falha ao reparar JSON:", repairError);
            figma.ui.postMessage({ type: "add-gemini-log", data: `\u274C Falha ao reparar JSON: ${repairError}` });
            throw new GeminiError(`JSON malformado e n\xE3o repar\xE1vel: ${repairError}`);
          }
        }
      } catch (error) {
        console.error("Erro na consolida\xE7\xE3o:", error);
        throw new GeminiError(`Falha na consolida\xE7\xE3o: ${error.message}`);
      }
    });
  }
  function buildConsolidationPrompt2(nodes) {
    return `
CONSOLIDA\xC7\xC3O FINAL - ELEMENTOR JSON

Voc\xEA recebeu ${nodes.length} nodes processados individualmente.
Sua tarefa \xE9 montar a hierarquia final e gerar um JSON v\xE1lido para importa\xE7\xE3o no Elementor.

NODES PROCESSADOS:
${JSON.stringify(nodes, null, 2)}

TAREFA:
1. Reconstrur a \xE1rvore hier\xE1rquica baseada nos parentIds e childrenIds.
2. Validar se todos os widgets s\xE3o v\xE1lidos (w:container, w:heading, etc).
3. Converter propriedades de estilo para o formato final do Elementor.
4. Gerar relat\xF3rio t\xE9cnico.

FORMATO DE SA\xCDDA (JSON):
{
  "elementorJSON": {
    "version": "0.4",
    "title": "Figma Import",
    "type": "page",
    "content": [
      // Array de elementos raiz (Containers principais)
      // Cada elemento deve ter "id", "elType" ("section", "column", "widget"), "settings", "elements"
    ]
  },
  "report": {
    "summary": {
      "totalNodes": ${nodes.length},
      "converted": 0, // Preencher
      "custom": 0,    // Preencher
      "warnings": 0   // Preencher
    },
    "mappings": [
      { "nodeId": "...", "widget": "...", "status": "success|warning" }
    ],
    "warnings": [
      "Aviso 1...",
      "Aviso 2..."
    ]
  }
}

REGRAS CR\xCDTICAS:
- O JSON deve seguir estritamente a estrutura do Elementor (sections > columns > widgets) OU Containers (preferencial).
- "c:container", "c:inner", "section:nome", "column:nome", "w:container" -> DEVEM virar Container do Elementor ("elType": "container").
- "w:image-box", "w:icon-box" -> DEVEM virar widgets compostos (image-box, icon-box).
- MAPPING DE AUTO LAYOUT:
  - direction: "row" -> settings: { "flex_direction": "row", "container_type": "flex" }
  - direction: "vertical" -> settings: { "flex_direction": "column", "container_type": "flex" }
  - primaryAlign: "MIN" -> justify_content: "flex-start" (ou start)
  - primaryAlign: "CENTER" -> justify_content: "center"
  - primaryAlign: "MAX" -> justify_content: "flex-end" (ou end)
  - primaryAlign: "SPACE_BETWEEN" -> justify_content: "space-between"
  - counterAlign: "MIN" -> align_items: "flex-start" (ou start)
  - counterAlign: "CENTER" -> align_items: "center"
  - counterAlign: "MAX" -> align_items: "flex-end" (ou end)
- IDs devem ser \xFAnicos.
`;
  }
  var GEMINI_MODEL, API_BASE_URL, GeminiError;
  var init_api_gemini = __esm({
    "src/api_gemini.ts"() {
      init_prompts();
      init_serialization_utils();
      GEMINI_MODEL = "gemini-2.5-flash";
      API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
      GeminiError = class extends Error {
        constructor(message, statusCode, details) {
          super(message);
          this.statusCode = statusCode;
          this.details = details;
          this.name = "GeminiError";
        }
      };
    }
  });

  // src/api_deepseek.ts
  function consolidateNodes2(processedNodes) {
    return __async(this, null, function* () {
      var _a, _b, _c;
      const apiKey = yield getDeepSeekKey();
      if (!apiKey) throw new DeepSeekError("API Key n\xE3o configurada.");
      const model = yield getDeepSeekModel();
      const prompt = buildConsolidationPrompt(processedNodes);
      const requestBody = {
        model,
        messages: [
          { role: "system", content: "You are an expert Elementor developer. Consolidate the provided nodes into a valid Elementor JSON structure." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 8192,
        response_format: { type: "json_object" }
      };
      try {
        console.log(`\u{1F680} Enviando consolida\xE7\xE3o para DeepSeek (${model})...`);
        const response = yield fetch(API_BASE_URL2, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          const errorData = yield response.json();
          throw new DeepSeekError(`Erro na consolida\xE7\xE3o DeepSeek: ${response.status}`, response.status, errorData);
        }
        const data = yield response.json();
        const content = (_c = (_b = (_a = data.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content;
        if (!content) {
          throw new DeepSeekError("Resposta vazia da consolida\xE7\xE3o DeepSeek.");
        }
        let jsonString = content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
        try {
          return JSON.parse(jsonString);
        } catch (e) {
          console.warn("JSON inv\xE1lido na consolida\xE7\xE3o. Tentando reparar...", e);
          try {
            const repairedJson = repairJson(jsonString);
            return JSON.parse(repairedJson);
          } catch (repairError) {
            console.error("Falha ao reparar JSON de consolida\xE7\xE3o:", repairError);
            throw new DeepSeekError(`JSON de consolida\xE7\xE3o inv\xE1lido e irrepar\xE1vel: ${e}`);
          }
        }
      } catch (error) {
        console.error("Erro na consolida\xE7\xE3o DeepSeek:", error);
        throw new DeepSeekError(`Falha na consolida\xE7\xE3o: ${error.message}`);
      }
    });
  }
  function saveDeepSeekKey(key) {
    return __async(this, null, function* () {
      yield figma.clientStorage.setAsync("deepseek_api_key", key);
    });
  }
  function getDeepSeekKey() {
    return __async(this, null, function* () {
      return yield figma.clientStorage.getAsync("deepseek_api_key");
    });
  }
  function saveDeepSeekModel(model) {
    return __async(this, null, function* () {
      yield figma.clientStorage.setAsync("deepseek_model", model);
    });
  }
  function getDeepSeekModel() {
    return __async(this, null, function* () {
      const savedModel = yield figma.clientStorage.getAsync("deepseek_model");
      return savedModel || DEEPSEEK_MODEL;
    });
  }
  function testDeepSeekConnection() {
    return __async(this, null, function* () {
      var _a;
      const apiKey = yield getDeepSeekKey();
      if (!apiKey) {
        return { success: false, message: "API Key n\xE3o configurada" };
      }
      const model = yield getDeepSeekModel();
      console.log(`\u{1F9EA} Testando conex\xE3o com DeepSeek (${model})...`);
      try {
        const response = yield fetch(API_BASE_URL2, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: "Hello" }
            ],
            stream: false
          })
        });
        if (!response.ok) {
          const errorData = yield response.json();
          const errorMessage = ((_a = errorData.error) == null ? void 0 : _a.message) || `HTTP ${response.status}`;
          console.error("\u274C Erro na resposta DeepSeek:", errorData);
          throw new DeepSeekError(`Falha na conex\xE3o: ${errorMessage}`);
        }
        return { success: true, message: `Conex\xE3o OK com DeepSeek (${model})!` };
      } catch (e) {
        console.error("Erro de rede ao testar conex\xE3o DeepSeek:", e);
        return { success: false, message: e.message || "Erro desconhecido" };
      }
    });
  }
  function analyzeLayoutDeepSeek(nodeData, originalNodeId, imageData) {
    return __async(this, null, function* () {
      var _a, _b, _c;
      const apiKey = yield getDeepSeekKey();
      if (!apiKey) throw new DeepSeekError("API Key n\xE3o configurada.");
      const model = yield getDeepSeekModel();
      const prompt = ANALYZE_RECREATE_PROMPT.replace("${nodeData}", JSON.stringify(nodeData, null, 2));
      const requestBody = {
        model,
        messages: [
          { role: "system", content: "You are an expert UI/UX designer and Elementor developer." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        // Baixa temperatura para maior precisão estrutural
        max_tokens: 8192,
        response_format: { type: "json_object" }
        // DeepSeek suporta JSON mode
      };
      const fullLog = `--- PROMPT ENVIADO PARA DEEPSEEK ---
${JSON.stringify(requestBody.messages, null, 2)}`;
      figma.ui.postMessage({ type: "add-gemini-log", data: fullLog });
      try {
        console.log(`\u{1F680} Enviando an\xE1lise para DeepSeek (${model})...`);
        const response = yield fetch(API_BASE_URL2, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          const errorData = yield response.json();
          throw new DeepSeekError(`Erro na API DeepSeek: ${response.status}`, response.status, errorData);
        }
        const data = yield response.json();
        const content = (_c = (_b = (_a = data.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content;
        if (!content) {
          throw new DeepSeekError("Resposta vazia da API DeepSeek.");
        }
        figma.ui.postMessage({ type: "add-gemini-log", data: `--- RESPOSTA DEEPSEEK ---
${content}` });
        let jsonString = content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
        try {
          return JSON.parse(jsonString);
        } catch (e) {
          console.warn("JSON inv\xE1lido detectado. Tentando reparar...", e);
          try {
            const repairedJson = repairJson(jsonString);
            return JSON.parse(repairedJson);
          } catch (repairError) {
            console.error("Falha ao reparar JSON:", repairError);
            throw new DeepSeekError(`A IA retornou um JSON inv\xE1lido e irrepar\xE1vel: ${e}`);
          }
        }
      } catch (error) {
        console.error("Erro na an\xE1lise DeepSeek:", error);
        throw new DeepSeekError(`Falha na an\xE1lise: ${error.message}`);
      }
    });
  }
  var DEEPSEEK_MODEL, API_BASE_URL2, DeepSeekError;
  var init_api_deepseek = __esm({
    "src/api_deepseek.ts"() {
      init_prompts();
      init_serialization_utils();
      DEEPSEEK_MODEL = "deepseek-chat";
      API_BASE_URL2 = "https://api.deepseek.com/chat/completions";
      DeepSeekError = class extends Error {
        constructor(message, statusCode, details) {
          super(message);
          this.statusCode = statusCode;
          this.details = details;
          this.name = "DeepSeekError";
        }
      };
    }
  });

  // src/optimizers/structure.optimizer.ts
  var StructureOptimizer;
  var init_structure_optimizer = __esm({
    "src/optimizers/structure.optimizer.ts"() {
      StructureOptimizer = class {
        /**
         * Otimiza a estrutura de um nó e seus filhos recursivamente.
         * @param node O nó a ser otimizado
         * @returns O nó otimizado (pode ser o próprio nó ou um de seus filhos)
         */
        static optimize(node) {
          if (this.isRedundantContainer(node)) {
            const child = node.children[0];
            return this.optimize(child);
          }
          return node;
        }
        /**
         * Verifica se um container é redundante e pode ser removido.
         */
        static isRedundantContainer(node) {
          if (node.type !== "FRAME" && node.type !== "GROUP") {
            return false;
          }
          if (node.locked) {
            return false;
          }
          if (node.children.length === 0) {
            return true;
          }
          if (node.children.length !== 1) {
            return false;
          }
          const child = node.children[0];
          if ("fills" in node && Array.isArray(node.fills)) {
            const hasVisibleFill = node.fills.some((fill) => fill.visible !== false);
            if (hasVisibleFill) return false;
          }
          if ("strokes" in node && Array.isArray(node.strokes)) {
            const hasVisibleStroke = node.strokes.some((stroke) => stroke.visible !== false);
            if (hasVisibleStroke && typeof node.strokeWeight === "number" && node.strokeWeight > 0) return false;
          }
          if ("effects" in node && Array.isArray(node.effects)) {
            const hasVisibleEffect = node.effects.some((effect) => effect.visible !== false);
            if (hasVisibleEffect) return false;
          }
          if ("cornerRadius" in node && typeof node.cornerRadius === "number" && node.cornerRadius > 0) {
            if (node.clipsContent) return false;
          }
          if (node.type === "GROUP") {
            return true;
          }
          if (node.type === "FRAME") {
            if (node.layoutMode !== "NONE") {
              if (node.paddingLeft > 0 || node.paddingRight > 0 || node.paddingTop > 0 || node.paddingBottom > 0) {
                return false;
              }
              if (node.itemSpacing > 0 && child.type === "FRAME" && "layoutMode" in child && child.layoutMode !== "NONE") {
                return false;
              }
            } else {
              if (Math.abs(child.x) < 0.1 && Math.abs(child.y) < 0.1 && Math.abs(child.width - node.width) < 1 && Math.abs(child.height - node.height) < 1) {
                return true;
              }
              return false;
            }
          }
          return true;
        }
        /**
         * Aplica a otimização diretamente no documento Figma (Modifica a estrutura real).
         * @param node O nó a ser otimizado
         * @param logCallback Função opcional para enviar logs para a UI
         * @returns O número de nós removidos
         */
        static applyOptimization(node, logCallback) {
          let removedCount = 0;
          const nodeName = node.name;
          const nodeType = node.type;
          const childrenCount = "children" in node ? node.children.length : 0;
          console.log(`[Optimizer] \u{1F50D} Analisando: ${nodeName} (tipo: ${nodeType}, filhos: ${childrenCount})`);
          if ("children" in node) {
            const children = [...node.children];
            for (const child of children) {
              removedCount += this.applyOptimization(child, logCallback);
            }
          }
          const isRedundant = this.isRedundantContainer(node);
          if (isRedundant) {
            console.log(`[Optimizer] \u2705 ${nodeName} \xE9 REDUNDANTE - ser\xE1 removido`);
          } else {
            if (node.type === "FRAME" || node.type === "GROUP") {
              const reasons = this.getPreservationReasons(node);
              if (reasons.length > 0) {
                console.log(`[Optimizer] \u274C ${nodeName} foi PRESERVADO porque: ${reasons.join(", ")}`);
                if (logCallback) {
                  logCallback(`  \u23ED\uFE0F "${nodeName}" preservado: ${reasons.join(", ")}`, "info");
                }
              }
            }
          }
          if (isRedundant) {
            const parent = node.parent;
            if (parent && "children" in node && node.children.length === 1) {
              const child = node.children[0];
              try {
                parent.appendChild(child);
                node.remove();
                console.log(`[Optimizer] \u{1F9F9} Container redundante removido do documento: ${nodeName}`);
                if (logCallback) {
                  logCallback(`  \u{1F5D1}\uFE0F Removido: "${nodeName}" (${nodeType})`, "info");
                }
                removedCount++;
              } catch (error) {
                console.log(`[Optimizer] \u26A0\uFE0F Erro ao remover: ${nodeName} - ${error}`);
                if (logCallback) {
                  logCallback(`  \u26A0\uFE0F Erro ao remover "${nodeName}"`, "warn");
                }
              }
            }
          }
          return removedCount;
        }
        /**
         * Retorna as razões pelas quais um nó foi preservado (para debugging)
         */
        static getPreservationReasons(node) {
          const reasons = [];
          if (node.type !== "FRAME" && node.type !== "GROUP") {
            return reasons;
          }
          if (node.locked) {
            reasons.push("est\xE1 trancado");
          }
          if (node.children.length === 0) {
            return reasons;
          }
          if (node.children.length > 1) {
            reasons.push(`tem ${node.children.length} filhos`);
          }
          if ("fills" in node && Array.isArray(node.fills)) {
            const hasVisibleFill = node.fills.some((fill) => fill.visible !== false);
            if (hasVisibleFill) {
              reasons.push("tem cor de fundo");
            }
          }
          if ("strokes" in node && Array.isArray(node.strokes)) {
            const hasVisibleStroke = node.strokes.some((stroke) => stroke.visible !== false);
            if (hasVisibleStroke && typeof node.strokeWeight === "number" && node.strokeWeight > 0) {
              reasons.push("tem borda");
            }
          }
          if ("effects" in node && Array.isArray(node.effects)) {
            const hasVisibleEffect = node.effects.some((effect) => effect.visible !== false);
            if (hasVisibleEffect) {
              reasons.push("tem efeitos");
            }
          }
          if ("cornerRadius" in node && typeof node.cornerRadius === "number" && node.cornerRadius > 0) {
            if (node.clipsContent) {
              reasons.push("tem corner radius");
            }
          }
          if (node.type === "FRAME" && node.layoutMode !== "NONE") {
            if (node.paddingLeft > 0 || node.paddingRight > 0 || node.paddingTop > 0 || node.paddingBottom > 0) {
              reasons.push(`tem padding`);
            }
            if (node.children.length === 1) {
              const child = node.children[0];
              if (node.itemSpacing > 0 && child.type === "FRAME" && "layoutMode" in child && child.layoutMode !== "NONE") {
                reasons.push(`tem gap`);
              }
            }
          }
          return reasons;
        }
      };
    }
  });

  // src/utils/guid.ts
  function generateGUID() {
    return Math.random().toString(36).substring(2, 9);
  }
  var init_guid = __esm({
    "src/utils/guid.ts"() {
    }
  });

  // src/compiler/elementor.compiler.ts
  var ElementorCompiler;
  var init_elementor_compiler = __esm({
    "src/compiler/elementor.compiler.ts"() {
      init_guid();
      ElementorCompiler = class {
        constructor() {
          this.wpConfig = {};
        }
        /**
         * Define a configuração do WordPress
         */
        setWPConfig(config) {
          this.wpConfig = config;
        }
        /**
         * Compila o Schema Intermediário para o formato final do Elementor
         */
        compile(schema) {
          const rootElements = schema.sections.map((section) => this.compileSection(section));
          return {
            type: "elementor",
            siteurl: "",
            // Pode ser deixado vazio ou configurado via WPConfig
            elements: rootElements
          };
        }
        compileSection(section) {
          const sectionId = generateGUID();
          const settings = {
            layout: section.width === "full" ? "full_width" : "boxed"
          };
          if (section.background.color) {
            settings.background_background = "classic";
            settings.background_color = section.background.color;
          }
          if (section.background.image) {
            settings.background_background = "classic";
            settings.background_image = { url: section.background.image, id: 0 };
          }
          if (section.background.gradient) settings.background_background = "gradient";
          return {
            id: sectionId,
            elType: "container",
            isInner: false,
            settings: __spreadProps(__spreadValues({}, settings), {
              content_width: "boxed",
              flex_direction: "row",
              // Seção atua como linha para colunas
              flex_wrap: "wrap"
            }),
            elements: section.columns.map((col) => this.compileColumn(col))
          };
        }
        compileColumn(column) {
          const colId = generateGUID();
          const colWidth = column.span / 12 * 100;
          return {
            id: colId,
            elType: "container",
            isInner: false,
            // Containers aninhados também parecem ser isInner: false no modelo novo, ou true? O exemplo do usuário não mostra aninhamento. Vamos assumir false por enquanto.
            settings: {
              content_width: "full",
              width: { unit: "%", size: colWidth, sizes: [] },
              flex_direction: "column"
              // Coluna empilha widgets verticalmente
            },
            elements: column.widgets.map((widget) => this.compileWidget(widget))
          };
        }
        compileWidget(widget) {
          var _a;
          const widgetId = generateGUID();
          let widgetType = widget.type;
          let settings = __spreadValues({}, widget.styles);
          switch (widget.type) {
            case "heading":
              settings.title = widget.content || "Heading";
              if (widget.styles.color) {
                settings.title_color = widget.styles.color;
                delete settings.color;
              }
              if (widget.styles.text_align) {
                settings.align = widget.styles.text_align;
                delete settings.text_align;
              }
              settings.typography_typography = "custom";
              break;
            case "text":
              widgetType = "text-editor";
              settings.editor = widget.content || "Text";
              if (widget.styles.color) {
                settings.text_color = widget.styles.color;
                delete settings.color;
              }
              if (widget.styles.text_align) {
                settings.align = widget.styles.text_align;
                delete settings.text_align;
              }
              settings.typography_typography = "custom";
              break;
            case "button":
              settings.text = widget.content || "Button";
              if (widget.styles.color) {
                settings.button_text_color = widget.styles.color;
                delete settings.color;
              }
              if (widget.styles.text_align) {
                settings.align = widget.styles.text_align;
                delete settings.text_align;
              }
              settings.typography_typography = "custom";
              break;
            case "image":
              settings.image = {
                url: widget.content || "",
                id: widget.imageId ? parseInt(widget.imageId) : 0
              };
              break;
            case "icon":
              settings.selected_icon = { value: widget.content || "fas fa-star", library: "fa-solid" };
              break;
            case "html":
              widgetType = "html";
              settings.html = widget.content || "";
              break;
            case "divider":
              widgetType = "divider";
              break;
            case "list":
              widgetType = "icon-list";
              break;
            case "imageBox":
              widgetType = "image-box";
              settings.image = {
                url: ((_a = widget.styles) == null ? void 0 : _a.image_url) || "",
                id: widget.imageId ? parseInt(widget.imageId) : 0
              };
              settings.title_text = "Title";
              settings.description_text = widget.content || "Description";
              break;
            case "iconBox":
              widgetType = "icon-box";
              settings.selected_icon = { value: "fas fa-star", library: "fa-solid" };
              settings.title_text = "Title";
              settings.description_text = widget.content || "Description";
              break;
            case "custom":
              return this.compileCustomContainer(widget);
            default:
              console.warn(`Tipo de widget desconhecido: ${widget.type}. Renderizando como Spacer.`);
              widgetType = "spacer";
              settings.space = { unit: "px", size: 50, sizes: [] };
              break;
          }
          return {
            id: widgetId,
            elType: "widget",
            widgetType,
            settings,
            elements: []
          };
        }
        compileCustomContainer(widget) {
          const containerId = generateGUID();
          const styles = widget.styles || {};
          const settings = {
            content_width: "boxed",
            flex_direction: styles.layoutMode === "HORIZONTAL" ? "row" : "column",
            flex_gap: {
              unit: "px",
              column: styles.itemSpacing || 0,
              row: styles.itemSpacing || 0,
              isLinked: true
            },
            padding: {
              unit: "px",
              top: styles.paddingTop || 0,
              right: styles.paddingRight || 0,
              bottom: styles.paddingBottom || 0,
              left: styles.paddingLeft || 0,
              isLinked: false
            }
          };
          if (widget.styles && widget.styles.image_url) {
            settings.background_background = "classic";
            settings.background_image = {
              url: widget.styles.image_url,
              id: widget.imageId ? parseInt(widget.imageId) : 0
            };
          }
          if (styles.primaryAxisAlignItems) {
            const map = { "MIN": "start", "CENTER": "center", "MAX": "end", "SPACE_BETWEEN": "space-between" };
            settings.justify_content = map[styles.primaryAxisAlignItems] || "start";
          }
          if (styles.counterAxisAlignItems) {
            const map = { "MIN": "start", "CENTER": "center", "MAX": "end" };
            settings.align_items = map[styles.counterAxisAlignItems] || "start";
          }
          if (styles.width) {
            settings.width = { unit: "px", size: styles.width, sizes: [] };
            settings.content_width = "full";
          }
          return {
            id: containerId,
            elType: "container",
            isInner: false,
            settings,
            elements: []
            // Widgets "custom" no pipeline atual não têm filhos definidos no schema, então retornam vazio
          };
        }
      };
    }
  });

  // src/utils/hash.ts
  function computeHash(bytes) {
    return __async(this, null, function* () {
      const chrsz = 8;
      function rol(num, cnt) {
        return num << cnt | num >>> 32 - cnt;
      }
      function safe_add(x, y) {
        const lsw = (x & 65535) + (y & 65535);
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return msw << 16 | lsw & 65535;
      }
      function sha1_ft(t, b, c, d) {
        if (t < 20) return b & c | ~b & d;
        if (t < 40) return b ^ c ^ d;
        if (t < 60) return b & c | b & d | c & d;
        return b ^ c ^ d;
      }
      function sha1_kt(t) {
        return t < 20 ? 1518500249 : t < 40 ? 1859775393 : t < 60 ? -1894007588 : -899497514;
      }
      function core_sha1(x, len) {
        x[len >> 5] |= 128 << 24 - len % 32;
        x[(len + 64 >> 9 << 4) + 15] = len;
        const w = Array(80);
        let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, e = -1009589776;
        for (let i = 0; i < x.length; i += 16) {
          const olda = a, oldb = b, oldc = c, oldd = d, olde = e;
          for (let j = 0; j < 80; j++) {
            if (j < 16) w[j] = x[i + j];
            else w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
            const t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)), safe_add(safe_add(e, w[j]), sha1_kt(j)));
            e = d;
            d = c;
            c = rol(b, 30);
            b = a;
            a = t;
          }
          a = safe_add(a, olda);
          b = safe_add(b, oldb);
          c = safe_add(c, oldc);
          d = safe_add(d, oldd);
          e = safe_add(e, olde);
        }
        return [a, b, c, d, e];
      }
      function binb2hex(binarray) {
        const hex_tab = "0123456789abcdef";
        let str = "";
        for (let i = 0; i < binarray.length * 4; i++) {
          str += hex_tab.charAt(binarray[i >> 2] >> (3 - i % 4) * 8 + 4 & 15) + hex_tab.charAt(binarray[i >> 2] >> (3 - i % 4) * 8 & 15);
        }
        return str;
      }
      function bytesToWords(bytes2) {
        const words = [];
        for (let i = 0; i < bytes2.length; i++) {
          words[i >>> 2] |= (bytes2[i] & 255) << 24 - i % 4 * 8;
        }
        return words;
      }
      return binb2hex(core_sha1(bytesToWords(bytes), bytes.length * 8));
    });
  }
  var init_hash = __esm({
    "src/utils/hash.ts"() {
    }
  });

  // src/media/image.exporter.ts
  function exportNodeAsImage(node, format, quality = 0.85) {
    return __async(this, null, function* () {
      try {
        if (format === "SVG") {
          const bytes2 = yield node.exportAsync({ format: "SVG" });
          return { bytes: bytes2, mime: "image/svg+xml", ext: "svg" };
        }
        if (format === "WEBP") {
          const bytes2 = yield node.exportAsync({
            format: "PNG",
            constraint: { type: "SCALE", value: 2 }
          });
          return { bytes: bytes2, mime: "image/png", ext: "webp", needsConversion: true };
        }
        if (format === "JPG") {
          const bytes2 = yield node.exportAsync({
            format: "JPG",
            constraint: { type: "SCALE", value: 2 }
          });
          return { bytes: bytes2, mime: "image/jpeg", ext: "jpg" };
        }
        const bytes = yield node.exportAsync({
          format: "PNG",
          constraint: { type: "SCALE", value: 2 }
        });
        return { bytes, mime: "image/png", ext: "png" };
      } catch (e) {
        console.error(`[F2E] Failed to export image for "${node.name}" (${node.id}):`, e);
        return null;
      }
    });
  }
  var init_image_exporter = __esm({
    "src/media/image.exporter.ts"() {
    }
  });

  // src/media/uploader.ts
  var ImageUploader;
  var init_uploader = __esm({
    "src/media/uploader.ts"() {
      init_hash();
      init_guid();
      init_image_exporter();
      ImageUploader = class {
        constructor(wpConfig, quality = 0.85) {
          this.pendingUploads = /* @__PURE__ */ new Map();
          this.mediaHashCache = /* @__PURE__ */ new Map();
          this.nodeHashCache = /* @__PURE__ */ new Map();
          this.quality = 0.85;
          this.wpConfig = wpConfig;
          this.quality = quality;
        }
        /**
         * Faz upload de uma imagem para o WordPress
         * @param node Nó do Figma a ser exportado
         * @param format Formato da imagem
         * @returns Objeto com URL e ID da imagem no WordPress ou null
         */
        uploadToWordPress(node, format = "WEBP") {
          return __async(this, null, function* () {
            if (!this.wpConfig || !this.wpConfig.url || !this.wpConfig.user || !this.wpConfig.password) {
              console.warn("[F2E] WP config ausente.");
              return null;
            }
            try {
              const targetFormat = format === "SVG" ? "SVG" : "WEBP";
              const result = yield exportNodeAsImage(node, targetFormat, this.quality);
              if (!result) return null;
              const { bytes, mime, ext, needsConversion } = result;
              const hash = yield computeHash(bytes);
              if (this.mediaHashCache.has(hash)) {
                return this.mediaHashCache.get(hash);
              }
              this.nodeHashCache.set(node.id, hash);
              const id = generateGUID();
              const safeId = node.id.replace(/[^a-z0-9]/gi, "_");
              const name = `w_${safeId}_${hash}.${ext}`;
              return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                  if (this.pendingUploads.has(id)) {
                    this.pendingUploads.delete(id);
                    resolve(null);
                  }
                }, 9e4);
                this.pendingUploads.set(id, (result2) => {
                  clearTimeout(timeout);
                  if (result2.success) {
                    console.log(`[ImageUploader] Upload bem-sucedido. URL: ${result2.url}, ID: ${result2.wpId}`);
                    const mediaData = { url: result2.url, id: result2.wpId || 0 };
                    this.mediaHashCache.set(hash, mediaData);
                    resolve(mediaData);
                  } else {
                    console.error(`[ImageUploader] Falha no upload:`, result2.error);
                    resolve(null);
                  }
                });
                figma.ui.postMessage({
                  type: "upload-image-request",
                  id,
                  name,
                  mimeType: mime,
                  targetMimeType: "image/webp",
                  data: bytes,
                  needsConversion: !!needsConversion
                });
              });
            } catch (e) {
              console.error("Error preparing upload:", e);
              return null;
            }
          });
        }
        /**
         * Processa resposta de upload da UI
         * @param id ID do upload
         * @param result Resultado do upload
         */
        handleUploadResponse(id, result) {
          const resolver = this.pendingUploads.get(id);
          if (resolver) {
            resolver(result);
            this.pendingUploads.delete(id);
          } else {
            console.warn(`[ImageUploader] Nenhuma promessa pendente encontrada para ${id}`);
          }
        }
        /**
         * Atualiza a qualidade de exportação
         * @param quality Nova qualidade (0.1 a 1.0)
         */
        setQuality(quality) {
          this.quality = Math.max(0.1, Math.min(1, quality));
        }
        /**
         * Atualiza a configuração do WordPress
         * @param wpConfig Nova configuração
         */
        setWPConfig(wpConfig) {
          this.wpConfig = wpConfig;
        }
        /**
         * Limpa o cache de hashes
         */
        clearCache() {
          this.mediaHashCache.clear();
          this.nodeHashCache.clear();
        }
      };
    }
  });

  // src/pipeline.ts
  var PIPELINE_PROMPT_V2, ConversionPipeline;
  var init_pipeline = __esm({
    "src/pipeline.ts"() {
      init_serialization_utils();
      init_api_gemini();
      init_elementor_compiler();
      init_uploader();
      PIPELINE_PROMPT_V2 = `
Voc\xEA \xE9 um assistente que organiza \xE1rvores Figma em um SCHEMA INTERMEDI\xC1RIO FIXO.

REGRAS INEGOCI\xC1VEIS:
- NENHUM node pode ser ignorado. Cada node de entrada vira um widget.
- N\xE3o agrupe nodes diferentes em um \xFAnico widget.
- N\xE3o invente spans, grids ou heur\xEDsticas visuais.
- N\xE3o classifique por apar\xEAncia; use apenas os dados fornecidos.
- Se n\xE3o souber o tipo, use "custom".
- Sempre inclua styles.sourceId com o id do node original.
- Widgets permitidos: heading | text | button | image | icon | custom
- Section.type \xE9 SEMPRE "custom".
- Column.span \xE9 SEMPRE 12.
- Sections devem ter, no m\xEDnimo, uma coluna span 12.

BACKGROUND: apenas { color?, image?, gradient? }
TOKENS: page.tokens.primaryColor e secondaryColor s\xE3o obrigat\xF3rios. Se n\xE3o houver cor detect\xE1vel, use "#000000" e "#FFFFFF".

SA\xCDDA OBRIGAT\xD3RIA:
{
  "page": { "title": "<string>", "tokens": { "primaryColor": "<hex>", "secondaryColor": "<hex>" } },
  "sections": [
    {
      "id": "<string>",
      "type": "custom",
      "width": "full" | "boxed",
      "background": { "color"?: "<hex|rgba>", "image"?: "<string>", "gradient"?: "<string>" },
      "columns": [
        {
          "span": 12,
          "widgets": [
            {
              "type": "heading" | "text" | "button" | "image" | "icon" | "custom",
              "content": "<string|null>",
              "imageId": "<string|null>",
              "styles": { "sourceId": "<node-id>", ...outros_campos_opcionais }
            }
          ]
        }
      ]
    }
  ]
}

ENTRADA:
- Uma lista linear de TODOS os nodes serializados do Figma (com propriedades).
- O t\xEDtulo sugerido da p\xE1gina.

RESPONDA APENAS COM JSON V\xC1LIDO, sem markdown.
`;
      ConversionPipeline = class {
        constructor() {
          this.apiKey = null;
          this.model = null;
          this.compiler = new ElementorCompiler();
          this.imageUploader = new ImageUploader({});
        }
        /**
         * Executa o pipeline completo
         */
        run(_0) {
          return __async(this, arguments, function* (node, wpConfig = {}) {
            this.compiler.setWPConfig(wpConfig);
            this.imageUploader.setWPConfig(wpConfig);
            yield this.loadConfig();
            console.log("[Pipeline] 1. Pr\xE9-processando n\xF3...");
            const preprocessed = this.preprocess(node);
            console.log("[Pipeline] 2. Enviando para IA...");
            const intermediate = yield this.processWithAI(preprocessed);
            console.log("[Pipeline] 3. Validando schema...");
            this.validateAndNormalize(intermediate);
            console.log("[Pipeline] 4. Reconciliando nodes...");
            this.reconcileWithSource(intermediate, preprocessed.flatNodes);
            console.log("[Pipeline] 5. Resolvendo imagens...");
            yield this.resolveImages(intermediate);
            console.log("[Pipeline] 6. Compilando para Elementor...");
            const elementorJson = this.compiler.compile(intermediate);
            if (wpConfig.url) {
              elementorJson.siteurl = wpConfig.url;
            }
            return elementorJson;
          });
        }
        /**
         * Carrega configs do Gemini
         */
        loadConfig() {
          return __async(this, null, function* () {
            this.apiKey = yield getKey();
            this.model = yield getModel();
            if (!this.apiKey) {
              throw new Error("API Key n\xE3o configurada. Por favor, configure na aba 'IA Gemini'.");
            }
            if (!this.model) {
              throw new Error("Modelo do Gemini n\xE3o configurado.");
            }
          });
        }
        /**
         * Pré-processa o node Figma para gerar insumos da IA
         */
        preprocess(node) {
          const serializedRoot = serializeNode(node);
          const flatNodes = this.flatten(serializedRoot);
          const tokens = this.deriveTokens(serializedRoot);
          return {
            pageTitle: serializedRoot.name || "P\xE1gina importada",
            tokens,
            serializedRoot,
            flatNodes
          };
        }
        /**
         * Achata a árvore serializada em uma lista
         */
        flatten(root) {
          const acc = [];
          const walk = (n) => {
            acc.push(n);
            if (Array.isArray(n.children)) {
              n.children.forEach((child) => walk(child));
            }
          };
          walk(root);
          return acc;
        }
        /**
         * Deriva cores principais (fallback seguro)
         */
        deriveTokens(serializedRoot) {
          const defaultTokens = { primaryColor: "#000000", secondaryColor: "#FFFFFF" };
          const fills = serializedRoot.fills;
          if (Array.isArray(fills) && fills.length > 0) {
            const solidFill = fills.find((f) => f.type === "SOLID");
            if (solidFill == null ? void 0 : solidFill.color) {
              const { r, g, b } = solidFill.color;
              const toHex = (c) => {
                const h = Math.round(c * 255).toString(16).padStart(2, "0");
                return h;
              };
              const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
              return { primaryColor: hex, secondaryColor: "#FFFFFF" };
            }
          }
          return defaultTokens;
        }
        /**
         * Monta a requisição e chama a IA
         */
        processWithAI(pre) {
          return __async(this, null, function* () {
            var _a, _b, _c, _d, _e;
            if (!this.apiKey || !this.model) throw new Error("Configura\xE7\xE3o de IA incompleta.");
            const endpoint = `${API_BASE_URL}${this.model}:generateContent?key=${this.apiKey}`;
            const inputPayload = {
              title: pre.pageTitle,
              tokens: pre.tokens,
              nodes: pre.flatNodes
            };
            const contents = [{
              parts: [
                { text: PIPELINE_PROMPT_V2 },
                { text: `DADOS DE ENTRADA:
${JSON.stringify(inputPayload)}` }
              ]
            }];
            const requestBody = {
              contents,
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8192,
                response_mime_type: "application/json"
              }
            };
            const maxRetries = 2;
            let attempt = 0;
            while (attempt <= maxRetries) {
              try {
                const response = yield fetch(endpoint, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(requestBody)
                });
                if (!response.ok) {
                  const errText = yield response.text();
                  throw new GeminiError(`Erro na API Gemini: ${response.status} - ${errText}`);
                }
                const result = yield response.json();
                const text = (_e = (_d = (_c = (_b = (_a = result == null ? void 0 : result.candidates) == null ? void 0 : _a[0]) == null ? void 0 : _b.content) == null ? void 0 : _c.parts) == null ? void 0 : _d[0]) == null ? void 0 : _e.text;
                if (!text) throw new Error("Resposta vazia da IA.");
                const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
                return JSON.parse(clean);
              } catch (err) {
                attempt++;
                if (attempt > maxRetries) {
                  console.error("[Pipeline] Erro no processamento de IA:", err);
                  throw err;
                }
                const delay = 1500 * attempt;
                console.warn(`[Pipeline] Falha na IA (tentativa ${attempt}). Retentando em ${delay}ms...`);
                yield new Promise((res) => setTimeout(res, delay));
              }
            }
            throw new Error("Falha ao processar IA.");
          });
        }
        /**
         * Valida e normaliza o schema recebido
         */
        validateAndNormalize(schema) {
          if (!schema || typeof schema !== "object") throw new Error("Schema inv\xE1lido: n\xE3o \xE9 um objeto.");
          if (!schema.page || typeof schema.page !== "object") throw new Error("Schema inv\xE1lido: campo 'page' ausente.");
          if (typeof schema.page.title !== "string") schema.page.title = String(schema.page.title || "P\xE1gina importada");
          if (!schema.page.tokens) schema.page.tokens = {};
          if (typeof schema.page.tokens.primaryColor !== "string") schema.page.tokens.primaryColor = "#000000";
          if (typeof schema.page.tokens.secondaryColor !== "string") schema.page.tokens.secondaryColor = "#FFFFFF";
          if (!Array.isArray(schema.sections)) {
            schema.sections = [];
          }
          if (schema.sections.length === 0) {
            schema.sections.push(this.createDefaultSection(schema.page.title));
          }
          schema.sections = schema.sections.map((section, index) => {
            const normalized = {
              id: typeof section.id === "string" ? section.id : `section-${index + 1}`,
              type: "custom",
              width: section.width === "boxed" ? "boxed" : "full",
              background: this.normalizeBackground(section.background),
              columns: Array.isArray(section.columns) && section.columns.length > 0 ? section.columns.map((col) => this.normalizeColumn(col)) : [this.createDefaultColumn()]
            };
            return normalized;
          });
        }
        /**
         * Normaliza background
         */
        normalizeBackground(bg) {
          const normalized = {};
          if (bg && typeof bg === "object") {
            if (typeof bg.color === "string") normalized.color = bg.color;
            if (typeof bg.image === "string") normalized.image = bg.image;
            if (typeof bg.gradient === "string") normalized.gradient = bg.gradient;
          }
          return normalized;
        }
        /**
         * Normaliza coluna (span fixo em 12)
         */
        normalizeColumn(col) {
          const widgets = Array.isArray(col == null ? void 0 : col.widgets) ? col.widgets : [];
          return {
            span: 12,
            widgets: widgets.map((w) => this.normalizeWidget(w))
          };
        }
        /**
         * Normaliza widget dentro das regras de tipos
         */
        normalizeWidget(w) {
          const allowed = ["heading", "text", "button", "image", "icon", "custom"];
          const type = allowed.includes(w == null ? void 0 : w.type) ? w.type : "custom";
          const content = typeof (w == null ? void 0 : w.content) === "string" || (w == null ? void 0 : w.content) === null ? w.content : null;
          const imageId = typeof (w == null ? void 0 : w.imageId) === "string" || (w == null ? void 0 : w.imageId) === null ? w.imageId : null;
          const styles = w && typeof w.styles === "object" && !Array.isArray(w.styles) ? w.styles : {};
          return { type, content, imageId, styles };
        }
        /**
         * Garante que todos os nodes de origem estejam representados no schema (1:1)
         */
        reconcileWithSource(schema, flatNodes) {
          const allSourceIds = new Set(flatNodes.map((n) => n.id));
          const covered = /* @__PURE__ */ new Set();
          const markCovered = (widget) => {
            var _a;
            const sourceId = (_a = widget.styles) == null ? void 0 : _a.sourceId;
            if (typeof sourceId === "string") covered.add(sourceId);
            if (typeof widget.imageId === "string") covered.add(widget.imageId);
          };
          schema.sections.forEach((section) => {
            section.columns.forEach((col) => {
              col.widgets.forEach(markCovered);
            });
          });
          const missing = [...allSourceIds].filter((id) => !covered.has(id));
          if (missing.length === 0) return;
          if (!schema.sections.length) {
            schema.sections.push(this.createDefaultSection(schema.page.title));
          }
          const targetColumn = schema.sections[0].columns[0] || this.createDefaultColumn();
          if (!schema.sections[0].columns.length) {
            schema.sections[0].columns.push(targetColumn);
          }
          missing.forEach((id) => {
            const sourceNode = flatNodes.find((n) => n.id === id);
            const widget = {
              type: "custom",
              content: typeof (sourceNode == null ? void 0 : sourceNode.characters) === "string" ? sourceNode.characters : null,
              imageId: null,
              styles: {
                sourceId: id,
                sourceType: sourceNode == null ? void 0 : sourceNode.type,
                sourceName: sourceNode == null ? void 0 : sourceNode.name
              }
            };
            targetColumn.widgets.push(widget);
          });
        }
        /**
         * Upload/resolve imagens referenciadas
         */
        resolveImages(schema) {
          return __async(this, null, function* () {
            const processWidget = (widget) => __async(this, null, function* () {
              if (widget.imageId && (widget.type === "image" || widget.type === "custom")) {
                try {
                  const node = figma.getNodeById(widget.imageId);
                  if (node && (node.type === "FRAME" || node.type === "GROUP" || node.type === "RECTANGLE" || node.type === "INSTANCE" || node.type === "COMPONENT")) {
                    console.log(`[Pipeline] Uploading image for widget ${widget.type} (${widget.imageId})...`);
                    const result = yield this.imageUploader.uploadToWordPress(node);
                    if (result) {
                      widget.content = result.url;
                      widget.imageId = result.id.toString();
                    } else {
                      console.warn(`[Pipeline] Falha no upload da imagem ${widget.imageId}`);
                    }
                  }
                } catch (e) {
                  console.error(`[Pipeline] Erro ao processar imagem ${widget.imageId}:`, e);
                }
              }
            });
            for (const section of schema.sections) {
              for (const column of section.columns) {
                for (const widget of column.widgets) {
                  yield processWidget(widget);
                }
              }
            }
          });
        }
        createDefaultSection(title) {
          return {
            id: "section-1",
            type: "custom",
            width: "full",
            background: {},
            columns: [this.createDefaultColumn()]
          };
        }
        createDefaultColumn() {
          return { span: 12, widgets: [] };
        }
      };
    }
  });

  // src/config/widget.patterns.ts
  var widgetPatterns;
  var init_widget_patterns = __esm({
    "src/config/widget.patterns.ts"() {
      widgetPatterns = [
        {
          name: "Image Box",
          tag: "w:image-box",
          minScore: 70,
          category: "basic",
          structure: {
            rootType: ["FRAME"],
            childCount: { min: 2, max: 4 },
            requiredChildren: [
              { type: "RECTANGLE", count: 1 },
              { type: "TEXT", count: 2 }
            ],
            properties: {
              hasAutoLayout: true,
              layoutMode: "VERTICAL",
              hasImage: true,
              textCount: 2
            }
          }
        },
        {
          name: "Button",
          tag: "w:button",
          minScore: 70,
          category: "basic",
          structure: {
            rootType: ["FRAME", "INSTANCE", "COMPONENT"],
            childCount: { min: 1, max: 3 },
            requiredChildren: [
              { type: "TEXT", count: 1 }
            ],
            properties: {
              hasAutoLayout: true,
              hasPadding: true,
              hasBorderRadius: true,
              hasBackground: true
            }
          },
          scoreFunction: (node) => {
            if (node.type !== "FRAME" && node.type !== "INSTANCE" && node.type !== "COMPONENT") return 0;
            let score = 0;
            const frameNode = node;
            const hasText = "children" in frameNode && frameNode.children.some((child) => child.type === "TEXT");
            if (!hasText) return 0;
            score += 30;
            if ("layoutMode" in frameNode && frameNode.layoutMode !== "NONE") {
              score += 20;
            }
            if ("paddingLeft" in frameNode && "paddingTop" in frameNode) {
              const hasPadding = frameNode.paddingLeft > 0 || frameNode.paddingTop > 0 || frameNode.paddingRight > 0 || frameNode.paddingBottom > 0;
              if (hasPadding) score += 25;
            }
            if ("cornerRadius" in frameNode && typeof frameNode.cornerRadius === "number" && frameNode.cornerRadius > 0) {
              score += 15;
            }
            let hasVisualStyle = false;
            if ("fills" in frameNode) {
              const fills = frameNode.fills;
              if (typeof fills !== "symbol" && Array.isArray(fills) && fills.length > 0) {
                const hasSolidFill = fills.some((fill) => fill.type === "SOLID" && fill.visible !== false);
                if (hasSolidFill) {
                  score += 20;
                  hasVisualStyle = true;
                }
              }
            }
            if ("strokes" in frameNode && Array.isArray(frameNode.strokes) && frameNode.strokes.length > 0) {
              if (typeof frameNode.strokeWeight === "number" && frameNode.strokeWeight > 0) {
                score += 15;
                hasVisualStyle = true;
              }
            }
            if (!hasVisualStyle) {
              return 0;
            }
            if ("children" in frameNode && frameNode.children.length <= 3) {
              score += 10;
            }
            const name = node.name.toLowerCase();
            if (name.includes("button") || name.includes("btn") || name.includes("cta")) {
              score += 15;
            }
            return Math.min(score, 100);
          }
        },
        {
          name: "Icon Box",
          tag: "w:icon-box",
          minScore: 70,
          category: "basic",
          structure: {
            rootType: ["FRAME", "COMPONENT", "INSTANCE"],
            childCount: { min: 2, max: 4 },
            properties: {
              hasAutoLayout: true,
              layoutMode: "VERTICAL"
            }
          },
          scoreFunction: (node) => {
            if (node.type !== "FRAME" && node.type !== "INSTANCE" && node.type !== "COMPONENT") return 0;
            let score = 0;
            const frameNode = node;
            if (!("children" in frameNode)) return 0;
            const hasIcon = frameNode.children.some(
              (child) => child.type === "INSTANCE" || child.type === "COMPONENT" || child.type === "VECTOR" || child.type === "ELLIPSE" || child.type === "FRAME" && child.name.toLowerCase().includes("icon")
            );
            const hasText = frameNode.children.some((child) => child.type === "TEXT");
            if (!hasIcon || !hasText) return 0;
            score += 40;
            if ("layoutMode" in frameNode && frameNode.layoutMode === "VERTICAL") {
              score += 30;
            }
            if ("primaryAxisAlignItems" in frameNode && frameNode.primaryAxisAlignItems === "CENTER") {
              score += 15;
            }
            if (frameNode.children.length >= 2 && frameNode.children.length <= 4) {
              score += 15;
            }
            return score;
          }
        },
        {
          name: "Heading",
          tag: "w:heading",
          minScore: 70,
          category: "basic",
          structure: {
            rootType: ["TEXT"],
            properties: {}
          },
          scoreFunction: (node) => {
            if (node.type !== "TEXT") return 0;
            const textNode = node;
            let score = 0;
            if (typeof textNode.fontSize === "number" && textNode.fontSize >= 18) {
              score += 50;
            }
            const fontWeight = textNode.fontWeight;
            if (typeof fontWeight === "number" && fontWeight >= 600) {
              score += 50;
            }
            return score;
          }
        },
        {
          name: "Image",
          tag: "w:image",
          minScore: 75,
          category: "basic",
          structure: {
            rootType: ["RECTANGLE", "INSTANCE", "COMPONENT", "FRAME"],
            properties: {}
          },
          scoreFunction: (node) => {
            if (node.type === "INSTANCE" || node.type === "COMPONENT") {
              const name = node.name.toLowerCase();
              if (name.includes("image") || name.includes("img") || name.includes("photo") || name.includes("picture") || name.includes("default")) {
                return 90;
              }
              if ("children" in node && node.children.length > 0) {
                return 40;
              }
              return 60;
            }
            if (node.type === "RECTANGLE" && "fills" in node) {
              const fills = node.fills;
              if (typeof fills !== "symbol" && Array.isArray(fills)) {
                const hasImageFill2 = fills.some((fill) => fill.type === "IMAGE");
                if (hasImageFill2) return 95;
              }
            }
            if (node.type === "FRAME" && "fills" in node) {
              const fills = node.fills;
              if (typeof fills !== "symbol" && Array.isArray(fills)) {
                const hasImageFill2 = fills.some((fill) => fill.type === "IMAGE");
                if (hasImageFill2) return 85;
              }
            }
            return 0;
          }
        },
        {
          name: "Text Editor",
          tag: "w:text",
          minScore: 60,
          category: "basic",
          structure: {
            rootType: ["TEXT"],
            properties: {}
          },
          scoreFunction: (node) => {
            if (node.type !== "TEXT") return 0;
            const textNode = node;
            if (typeof textNode.fontSize === "number" && textNode.fontSize >= 18) return 0;
            if (textNode.characters.length < 10) return 40;
            return 80;
          }
        },
        {
          name: "Icon",
          tag: "w:icon",
          minScore: 80,
          category: "basic",
          structure: {
            rootType: ["VECTOR", "STAR", "POLYGON", "ELLIPSE", "BOOLEAN_OPERATION", "INSTANCE", "COMPONENT"],
            properties: {}
          },
          scoreFunction: (node) => {
            if (node.type === "INSTANCE" || node.type === "COMPONENT") {
              if (node.name.toLowerCase().includes("icon")) return 90;
              if (Math.abs(node.width - node.height) < 2 && node.width < 64) return 70;
            }
            if (["VECTOR", "STAR", "POLYGON", "BOOLEAN_OPERATION"].includes(node.type)) {
              return 80;
            }
            return 0;
          }
        },
        {
          name: "Divider",
          tag: "w:divider",
          minScore: 80,
          category: "basic",
          structure: {
            rootType: ["LINE", "RECTANGLE"],
            properties: {}
          },
          scoreFunction: (node) => {
            if (node.type === "LINE") return 100;
            if (node.type === "RECTANGLE") {
              if (node.height <= 2 || node.width <= 2) return 90;
            }
            return 0;
          }
        },
        {
          name: "Container",
          tag: "c:container",
          minScore: 60,
          category: "basic",
          structure: {
            rootType: ["FRAME"],
            properties: {
              hasAutoLayout: true
            }
          },
          scoreFunction: (node) => {
            if (node.type !== "FRAME") return 0;
            const frameNode = node;
            let score = 0;
            if (frameNode.layoutMode !== "NONE") {
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
    }
  });

  // src/analyzers/structure.analyzer.ts
  function analyzeStructural(node) {
    const matches = [];
    for (const pattern of widgetPatterns) {
      const score = calculateStructuralScore(node, pattern);
      if (score >= pattern.minScore) {
        matches.push({
          pattern,
          score,
          method: "structural",
          confidence: score / 100
        });
      }
    }
    return matches.sort((a, b) => b.score - a.score);
  }
  function calculateStructuralScore(node, pattern) {
    if (pattern.scoreFunction) {
      return pattern.scoreFunction(node);
    }
    let score = 0;
    if (pattern.structure.rootType.includes(node.type)) {
      score += 10;
    } else {
      return 0;
    }
    score += analyzeHierarchy(node, pattern);
    score += analyzeVisualProperties(node, pattern);
    score += analyzeContent(node, pattern);
    return Math.min(score, 100);
  }
  function analyzeHierarchy(node, pattern) {
    let score = 0;
    if (!("children" in node)) {
      return 0;
    }
    const children = node.children;
    if (pattern.structure.childCount) {
      const { min, max, exact } = pattern.structure.childCount;
      if (exact !== void 0 && children.length === exact) {
        score += 20;
      } else if (min !== void 0 && max !== void 0) {
        if (children.length >= min && children.length <= max) {
          score += 15;
        }
      } else if (min !== void 0 && children.length >= min) {
        score += 10;
      }
    }
    if (pattern.structure.requiredChildren) {
      const pointsPerChild = 20 / pattern.structure.requiredChildren.length;
      for (const required of pattern.structure.requiredChildren) {
        const matchingChildren = children.filter((c) => c.type === required.type);
        if (matchingChildren.length >= required.count) {
          score += pointsPerChild;
        }
      }
    }
    return Math.min(score, 40);
  }
  function analyzeVisualProperties(node, pattern) {
    let score = 0;
    const props = pattern.structure.properties;
    if (!props) return 0;
    if (props.hasAutoLayout && "layoutMode" in node) {
      if (node.layoutMode !== "NONE") {
        score += 10;
        if (props.layoutMode && node.layoutMode === props.layoutMode) {
          score += 5;
        }
      }
    }
    if (props.hasPadding && "paddingLeft" in node) {
      if (node.paddingLeft > 0 || node.paddingTop > 0) {
        score += 5;
      }
    }
    if (props.hasBorderRadius && "cornerRadius" in node) {
      if (typeof node.cornerRadius === "number" && node.cornerRadius > 0) {
        score += 5;
      }
    }
    if (props.hasBackground && "fills" in node) {
      if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
        score += 5;
      }
    }
    return Math.min(score, 30);
  }
  function analyzeContent(node, pattern) {
    let score = 0;
    const props = pattern.structure.properties;
    if (!props || !("children" in node)) return 0;
    const children = node.children;
    const imageCount = children.filter(
      (c) => c.type === "RECTANGLE" && hasImageFill(c)
    ).length;
    const iconCount = children.filter(
      (c) => c.type === "VECTOR" || c.type === "COMPONENT" && c.name.toLowerCase().includes("icon")
    ).length;
    const textCount = children.filter((c) => c.type === "TEXT").length;
    if (props.hasImage && imageCount > 0) {
      score += 7;
    }
    if (props.hasIcon && iconCount > 0) {
      score += 7;
    }
    if (props.hasText && textCount > 0) {
      score += 6;
    }
    if (props.textCount !== void 0 && textCount === props.textCount) {
      score += 10;
    }
    return Math.min(score, 20);
  }
  function hasImageFill(node) {
    if (!("fills" in node)) return false;
    const fills = node.fills;
    if (!Array.isArray(fills)) return false;
    return fills.some(
      (fill) => typeof fill === "object" && fill !== null && "type" in fill && fill.type === "IMAGE"
    );
  }
  var init_structure_analyzer = __esm({
    "src/analyzers/structure.analyzer.ts"() {
      init_widget_patterns();
    }
  });

  // src/analyzers/visual.analyzer.ts
  function captureElementScreenshot(node) {
    return __async(this, null, function* () {
      try {
        const screenshot = yield node.exportAsync({
          format: "PNG",
          constraint: { type: "SCALE", value: 2 }
          // 2x para melhor qualidade
        });
        console.log(`[Visual] Screenshot capturado: ${node.name} (${screenshot.length} bytes)`);
        figma.ui.postMessage({ type: "add-log", message: `[Visual] Screenshot capturado: ${node.name} (${screenshot.length} bytes)`, level: "info" });
        return screenshot;
      } catch (error) {
        console.error("[Visual] Erro ao capturar screenshot:", error);
        throw error;
      }
    });
  }
  function cleanExpiredCache() {
    const now = Date.now();
    let removed = 0;
    for (const [key, value] of screenshotCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        screenshotCache.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      console.log(`[Cache] \u{1F5D1}\uFE0F Removidos ${removed} screenshots expirados`);
    }
  }
  function enforceMaxCacheSize() {
    if (screenshotCache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(screenshotCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, screenshotCache.size - MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => screenshotCache.delete(key));
      console.log(`[Cache] \u{1F5D1}\uFE0F Removidos ${toRemove.length} screenshots antigos (limite: ${MAX_CACHE_SIZE})`);
    }
  }
  function getCachedScreenshot(node) {
    return __async(this, null, function* () {
      const nodeId = node.id;
      cleanExpiredCache();
      const cached = screenshotCache.get(nodeId);
      if (cached) {
        console.log(`[Cache] \u2705 Screenshot encontrado: ${node.name}`);
        return cached.data;
      }
      console.log(`[Cache] \u{1F4F8} Capturando novo screenshot: ${node.name}`);
      const screenshot = yield captureElementScreenshot(node);
      screenshotCache.set(nodeId, {
        data: screenshot,
        timestamp: Date.now()
      });
      enforceMaxCacheSize();
      return screenshot;
    });
  }
  function uint8ArrayToBase64(bytes) {
    const base64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = "";
    let i;
    for (i = 0; i < bytes.length; i += 3) {
      const byte1 = bytes[i];
      const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      const encoded1 = byte1 >> 2;
      const encoded2 = (byte1 & 3) << 4 | byte2 >> 4;
      const encoded3 = (byte2 & 15) << 2 | byte3 >> 6;
      const encoded4 = byte3 & 63;
      result += base64chars[encoded1];
      result += base64chars[encoded2];
      result += i + 1 < bytes.length ? base64chars[encoded3] : "=";
      result += i + 2 < bytes.length ? base64chars[encoded4] : "=";
    }
    return result;
  }
  function createVisualPrompt(node, algorithmResults) {
    const nodeInfo = {
      name: node.name,
      type: node.type,
      width: "width" in node ? Math.round(node.width) : 0,
      height: "height" in node ? Math.round(node.height) : 0,
      childCount: "children" in node ? node.children.length : 0
    };
    const algorithmTop3 = algorithmResults.slice(0, 3).map(
      (match, i) => `${i + 1}. ${match.pattern.tag} (${Math.round(match.score)}%)`
    ).join("\n");
    return `Voc\xEA \xE9 um especialista em Elementor (WordPress page builder).

TAREFA:
Analise a imagem e identifique qual widget do Elementor melhor representa este elemento.

WIDGETS DISPON\xCDVEIS:
- w:button (bot\xF5es clic\xE1veis com texto)
- w:heading (t\xEDtulos/cabe\xE7alhos)
- w:text-editor (par\xE1grafos de texto)
- w:image (imagens simples)
- w:image-box (imagem + t\xEDtulo + descri\xE7\xE3o)
- w:icon (\xEDcone simples SVG/vetor)
- w:icon-box (\xEDcone + t\xEDtulo + descri\xE7\xE3o em layout vertical)
- w:divider (separadores/linhas horizontais)
- w:spacer (espa\xE7amento vazio)
- c:container (containers/se\xE7\xF5es que agrupam outros elementos)

CONTEXTO DO ELEMENTO:
Nome: "${nodeInfo.name}"
Tipo Figma: ${nodeInfo.type}
Dimens\xF5es: ${nodeInfo.width}x${nodeInfo.height}px
Filhos: ${nodeInfo.childCount}

AN\xC1LISE ALGOR\xCDTMICA (refer\xEAncia):
${algorithmTop3}

INSTRU\xC7\xD5ES:
1. Analise a imagem visualmente
2. Identifique padr\xF5es visuais (cores, formas, layout, tipografia)
3. Compare com os widgets do Elementor
4. Considere a an\xE1lise algor\xEDtmica mas priorize sua an\xE1lise visual
5. Se for um \xEDcone circular com texto abaixo, \xE9 w:icon-box
6. Se for um bot\xE3o com fundo colorido e texto, \xE9 w:button
7. Se for apenas uma imagem sem texto, \xE9 w:image

RESPONDA APENAS COM JSON V\xC1LIDO (sem markdown, sem \`\`\`):
{
  "widget": "w:xxx",
  "confidence": 85,
  "reasoning": "Breve explica\xE7\xE3o (m\xE1x 50 palavras)",
  "visualFeatures": ["feature1", "feature2"],
  "alternatives": [
    {"widget": "w:yyy", "confidence": 40}
  ]
}`;
  }
  function analyzeVisual(node, algorithmResults, apiKey, model = "gemini-1.5-flash-latest") {
    return __async(this, null, function* () {
      console.log(`[Visual] Iniciando an\xE1lise visual de: ${node.name}`);
      figma.ui.postMessage({ type: "add-log", message: `[Visual] Iniciando an\xE1lise visual de: ${node.name}`, level: "info" });
      try {
        const screenshot = yield getCachedScreenshot(node);
        const base64Image = uint8ArrayToBase64(screenshot);
        figma.ui.postMessage({
          type: "add-log",
          message: `[Visual] Screenshot capturado para an\xE1lise: ${node.name}`,
          level: "info",
          image: base64Image
        });
        const prompt = createVisualPrompt(node, algorithmResults);
        console.log("[Visual] Enviando para Gemini Vision...");
        figma.ui.postMessage({ type: "add-log", message: "[Visual] Enviando para Gemini Vision...", level: "info" });
        const response = yield fetch(
          `${API_BASE_URL}${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: "image/png",
                      data: base64Image
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.2,
                // Baixa temperatura para respostas mais consistentes
                maxOutputTokens: 500
              }
            })
          }
        );
        if (!response.ok) {
          const error = yield response.text();
          throw new GeminiError(`Gemini API error: ${response.status} - ${error}`, response.status);
        }
        const data = yield response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        console.log("[Visual] Resposta da IA:", aiResponse);
        figma.ui.postMessage({ type: "add-log", message: `[Visual] Resposta da IA: ${aiResponse.substring(0, 100)}...`, level: "info" });
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new GeminiError("Resposta da IA n\xE3o cont\xE9m JSON v\xE1lido");
        }
        const analysis = JSON.parse(jsonMatch[0]);
        console.log(`[Visual] An\xE1lise conclu\xEDda: ${analysis.widget} (${analysis.confidence}%)`);
        figma.ui.postMessage({ type: "add-log", message: `[Visual] An\xE1lise conclu\xEDda: ${analysis.widget} (${analysis.confidence}%)`, level: "success" });
        return analysis;
      } catch (error) {
        console.error("[Visual] Erro na an\xE1lise visual:", error);
        throw error;
      }
    });
  }
  function combineResults(structural, visual) {
    const structuralBest = structural[0];
    console.log("[Visual] Combinando resultados:");
    figma.ui.postMessage({ type: "add-log", message: "[Visual] Combinando resultados:", level: "info" });
    console.log(`  Algoritmo: ${structuralBest.pattern.tag} (${structuralBest.score}%)`);
    figma.ui.postMessage({ type: "add-log", message: `  Algoritmo: ${structuralBest.pattern.tag} (${structuralBest.score}%)`, level: "info" });
    console.log(`  IA Visual: ${visual.widget} (${visual.confidence}%)`);
    figma.ui.postMessage({ type: "add-log", message: `  IA Visual: ${visual.widget} (${visual.confidence}%)`, level: "info" });
    const aiPattern = widgetPatterns.find((p) => p.tag === visual.widget);
    if (!aiPattern) {
      console.warn(`[Visual] Padr\xE3o n\xE3o encontrado para: ${visual.widget}`);
      return {
        pattern: structuralBest.pattern,
        score: structuralBest.score,
        method: "structural",
        confidence: 50
      };
    }
    if (structuralBest.pattern.tag === visual.widget) {
      const combinedScore = Math.max(structuralBest.score, visual.confidence);
      console.log(`[Visual] \u2705 Concord\xE2ncia! Score combinado: ${combinedScore}%`);
      figma.ui.postMessage({ type: "add-log", message: `[Visual] \u2705 Concord\xE2ncia! Score combinado: ${combinedScore}%`, level: "success" });
      return {
        pattern: structuralBest.pattern,
        score: combinedScore,
        method: "hybrid",
        confidence: combinedScore,
        reasoning: `Algoritmo e IA concordam. ${visual.reasoning}`
      };
    }
    if (visual.confidence > 85) {
      console.log(`[Visual] \u{1F916} IA confiante (${visual.confidence}%) - usando resultado da IA`);
      figma.ui.postMessage({ type: "add-log", message: `[Visual] \u{1F916} IA confiante (${visual.confidence}%) - usando resultado da IA`, level: "info" });
      return {
        pattern: aiPattern,
        score: visual.confidence,
        method: "ai",
        confidence: visual.confidence,
        reasoning: visual.reasoning
      };
    }
    if (structuralBest.score > 85) {
      console.log(`[Visual] \u26A1 Algoritmo confiante (${structuralBest.score}%) - usando resultado algor\xEDtmico`);
      figma.ui.postMessage({ type: "add-log", message: `[Visual] \u26A1 Algoritmo confiante (${structuralBest.score}%) - usando resultado algor\xEDtmico`, level: "info" });
      return {
        pattern: structuralBest.pattern,
        score: structuralBest.score,
        method: "structural",
        confidence: structuralBest.score,
        reasoning: `Algoritmo confiante. IA sugere ${visual.widget} (${visual.confidence}%)`
      };
    }
    const avgScore = Math.round((structuralBest.score + visual.confidence) / 2);
    console.log(`[Visual] \u2696\uFE0F Desempate - usando IA. Score m\xE9dio: ${avgScore}%`);
    figma.ui.postMessage({ type: "add-log", message: `[Visual] \u2696\uFE0F Desempate - usando IA. Score m\xE9dio: ${avgScore}%`, level: "warn" });
    return {
      pattern: aiPattern,
      score: avgScore,
      method: "hybrid",
      confidence: avgScore,
      reasoning: `Desempate por IA. ${visual.reasoning}`
    };
  }
  var screenshotCache, CACHE_TTL, MAX_CACHE_SIZE;
  var init_visual_analyzer = __esm({
    "src/analyzers/visual.analyzer.ts"() {
      init_widget_patterns();
      init_api_gemini();
      screenshotCache = /* @__PURE__ */ new Map();
      CACHE_TTL = 5 * 60 * 1e3;
      MAX_CACHE_SIZE = 50;
    }
  });

  // src/analyzers/hybrid.analyzer.ts
  var hybrid_analyzer_exports = {};
  __export(hybrid_analyzer_exports, {
    analyzeHybrid: () => analyzeHybrid,
    clearAICache: () => clearAICache,
    getCacheStats: () => getCacheStats
  });
  function analyzeHybrid(node, config) {
    return __async(this, null, function* () {
      const startTime = Date.now();
      console.log("[Hybrid] \u{1F50D} Iniciando an\xE1lise h\xEDbrida...");
      figma.ui.postMessage({ type: "add-log", message: "[Hybrid] \u{1F50D} Iniciando an\xE1lise h\xEDbrida...", level: "info" });
      console.log(`[Hybrid] Usar IA: ${config.useAIFallback ? "Sim" : "N\xE3o"}`);
      figma.ui.postMessage({ type: "add-log", message: `[Hybrid] Usar IA: ${config.useAIFallback ? "Sim" : "N\xE3o"}`, level: "info" });
      console.log("[Hybrid] \u26A1 Executando an\xE1lise estrutural...");
      figma.ui.postMessage({ type: "add-log", message: "[Hybrid] \u26A1 Executando an\xE1lise estrutural...", level: "info" });
      const structuralMatches = analyzeStructural(node);
      const bestStructural = structuralMatches[0];
      if (!bestStructural) {
        console.warn("[Hybrid] \u26A0\uFE0F Nenhum match estrutural encontrado - usando fallback");
        figma.ui.postMessage({ type: "add-log", message: "[Hybrid] \u26A0\uFE0F Nenhum match estrutural encontrado - usando fallback", level: "warn" });
        const fallbackMatch = createFallbackMatch(node);
        return {
          matches: [fallbackMatch],
          method: "structural",
          // Mantém 'structural' para compatibilidade
          processingTime: Date.now() - startTime
        };
      }
      console.log(`[Hybrid] \u26A1 Melhor match estrutural: ${bestStructural.pattern.tag} (${bestStructural.score}%)`);
      figma.ui.postMessage({ type: "add-log", message: `[Hybrid] \u26A1 Melhor match estrutural: ${bestStructural.pattern.tag} (${bestStructural.score}%)`, level: "info" });
      const shouldUseAI = config.useAIFallback && config.apiKey;
      if (!shouldUseAI) {
        console.log("[Hybrid] \u2139\uFE0F IA desabilitada ou sem API key - usando apenas algoritmo");
        figma.ui.postMessage({ type: "add-log", message: "[Hybrid] \u2139\uFE0F IA desabilitada ou sem API key - usando apenas algoritmo", level: "info" });
        return {
          matches: structuralMatches,
          method: "structural",
          processingTime: Date.now() - startTime
        };
      }
      const threshold = config.structuralThreshold || 70;
      if (bestStructural.score >= threshold) {
        console.log(`[Hybrid] \u2705 Algoritmo confiante (${bestStructural.score}% >= ${threshold}%) - pulando IA`);
        figma.ui.postMessage({ type: "add-log", message: `[Hybrid] \u2705 Algoritmo confiante (${bestStructural.score}% >= ${threshold}%) - pulando IA`, level: "success" });
        return {
          matches: structuralMatches,
          method: "structural",
          processingTime: Date.now() - startTime
        };
      }
      try {
        console.log("[Hybrid] \u{1F916} Algoritmo incerto - chamando IA Visual...");
        figma.ui.postMessage({ type: "add-log", message: "[Hybrid] \u{1F916} Algoritmo incerto - chamando IA Visual...", level: "info" });
        const visualAnalysis = yield analyzeVisual(
          node,
          structuralMatches,
          config.apiKey,
          config.model
        );
        console.log(`[Hybrid] \u{1F916} IA retornou: ${visualAnalysis.widget} (${visualAnalysis.confidence}%)`);
        figma.ui.postMessage({ type: "add-log", message: `[Hybrid] \u{1F916} IA retornou: ${visualAnalysis.widget} (${visualAnalysis.confidence}%)`, level: "info" });
        const combinedMatch = combineResults(structuralMatches, visualAnalysis);
        console.log(`[Hybrid] \u2728 Resultado final: ${combinedMatch.pattern.tag} (${combinedMatch.score}%) via ${combinedMatch.method}`);
        figma.ui.postMessage({ type: "add-log", message: `[Hybrid] \u2728 Resultado final: ${combinedMatch.pattern.tag} (${combinedMatch.score}%) via ${combinedMatch.method}`, level: "success" });
        const finalMatches = [
          combinedMatch,
          ...structuralMatches.slice(1)
        ];
        return {
          matches: finalMatches,
          method: combinedMatch.method,
          processingTime: Date.now() - startTime
        };
      } catch (error) {
        console.error("[Hybrid] \u274C Erro na an\xE1lise visual:", error);
        figma.ui.postMessage({ type: "add-log", message: `[Hybrid] \u274C Erro na an\xE1lise visual: ${error.message || error}`, level: "error" });
        console.log("[Hybrid] \u{1F504} Fallback para resultado estrutural");
        figma.ui.postMessage({ type: "add-log", message: "[Hybrid] \u{1F504} Fallback para resultado estrutural", level: "warn" });
        return {
          matches: structuralMatches,
          method: "structural",
          processingTime: Date.now() - startTime
        };
      }
    });
  }
  function createFallbackMatch(node) {
    let tag = "c:container";
    let name = "Container Gen\xE9rico";
    let score = 30;
    switch (node.type) {
      case "TEXT":
        tag = "w:heading";
        name = "Heading (Texto)";
        score = 40;
        break;
      case "RECTANGLE":
      case "ELLIPSE":
      case "POLYGON":
      case "STAR":
      case "LINE":
      case "VECTOR":
        tag = "w:divider";
        name = "Divider (Forma)";
        score = 35;
        break;
      case "FRAME":
      case "GROUP":
        if ("children" in node && node.children.length > 0) {
          tag = "c:container";
          name = "Container";
          score = 50;
        } else {
          tag = "w:spacer";
          name = "Spacer (Vazio)";
          score = 40;
        }
        break;
      case "INSTANCE":
      case "COMPONENT":
        tag = "c:container";
        name = "Container (Componente)";
        score = 45;
        break;
      default:
        tag = "c:container";
        name = "Container Desconhecido";
        score = 30;
    }
    return {
      pattern: {
        name,
        tag,
        minScore: 0,
        category: "basic",
        structure: {
          rootType: [],
          properties: {}
        }
      },
      score,
      method: "structural",
      confidence: score,
      reasoning: `Fallback gen\xE9rico para tipo ${node.type}`
    };
  }
  function clearAICache() {
    console.log("[Hybrid] Cache limpo");
  }
  function getCacheStats() {
    return { size: 0, keys: [] };
  }
  var init_hybrid_analyzer = __esm({
    "src/analyzers/hybrid.analyzer.ts"() {
      init_structure_analyzer();
      init_visual_analyzer();
    }
  });

  // src/code.ts
  var require_code = __commonJS({
    "src/code.ts"(exports) {
      init_api_gemini();
      init_api_deepseek();
      init_structure_optimizer();
      init_image_utils();
      init_serialization_utils();
      init_pipeline();
      function hasLayout(node) {
        return "layoutMode" in node;
      }
      var loadedFonts = /* @__PURE__ */ new Set();
      function loadFontIfNeeded(fontName) {
        return __async(this, null, function* () {
          const fontKey = `${fontName.family}-${fontName.style}`;
          if (loadedFonts.has(fontKey)) {
            return;
          }
          try {
            yield figma.loadFontAsync(fontName);
            loadedFonts.add(fontKey);
            console.log(`\u2705 Fonte carregada: ${fontKey}`);
          } catch (error) {
            console.warn(`\u26A0\uFE0F N\xE3o foi poss\xEDvel carregar a fonte ${fontKey}. Usando fonte padr\xE3o.`, error);
            const fallbackFont = { family: "Roboto", style: "Regular" };
            const fallbackKey = `${fallbackFont.family}-${fallbackFont.style}`;
            if (!loadedFonts.has(fallbackKey)) {
              yield figma.loadFontAsync(fallbackFont);
              loadedFonts.add(fallbackKey);
            }
          }
        });
      }
      function sendLog(message, level = "info") {
        console.log(`[${level.toUpperCase()}] ${message}`);
        figma.ui.postMessage({
          type: "add-log",
          message,
          level
        });
      }
      function validateAndFixFills(fills) {
        if (!Array.isArray(fills) || fills.length === 0) {
          return [];
        }
        const validFills = [];
        for (const fill of fills) {
          if (!fill || typeof fill !== "object") {
            continue;
          }
          if (fill.type === "SOLID") {
            if (fill.color && typeof fill.color === "object") {
              const _a = fill.color, { a } = _a, colorWithoutAlpha = __objRest(_a, ["a"]);
              const opacity = typeof fill.opacity === "number" ? fill.opacity : typeof a === "number" ? a : 1;
              validFills.push({
                type: "SOLID",
                color: colorWithoutAlpha,
                opacity,
                visible: typeof fill.visible === "boolean" ? fill.visible : true
              });
            }
            continue;
          }
          if (fill.type === "IMAGE") {
            if (fill.imageHash) {
              validFills.push({
                type: "IMAGE",
                imageHash: fill.imageHash,
                scaleMode: fill.scaleMode || "FILL",
                opacity: typeof fill.opacity === "number" ? fill.opacity : 1,
                visible: typeof fill.visible === "boolean" ? fill.visible : true
              });
            }
            continue;
          }
          if (fill.type === "GRADIENT_LINEAR" || fill.type === "GRADIENT_RADIAL" || fill.type === "GRADIENT_ANGULAR" || fill.type === "GRADIENT_DIAMOND") {
            if (!fill.gradientStops || !Array.isArray(fill.gradientStops) || fill.gradientStops.length === 0) {
              console.warn(`\u26A0\uFE0F Gradiente ${fill.type} sem gradientStops v\xE1lido. Ignorando.`);
              continue;
            }
            if (!fill.gradientTransform || !Array.isArray(fill.gradientTransform)) {
              console.warn(`\u26A0\uFE0F Gradiente ${fill.type} sem gradientTransform. Usando matriz identidade.`);
              fill.gradientTransform = [[1, 0, 0], [0, 1, 0]];
            }
            const cleanedGradientStops = fill.gradientStops.map((stop) => {
              if (stop.color && typeof stop.color === "object") {
                return __spreadProps(__spreadValues({}, stop), {
                  color: __spreadProps(__spreadValues({}, stop.color), {
                    a: typeof stop.color.a === "number" ? stop.color.a : 1
                  })
                });
              }
              return stop;
            });
            validFills.push({
              type: fill.type,
              gradientStops: cleanedGradientStops,
              gradientTransform: fill.gradientTransform,
              opacity: typeof fill.opacity === "number" ? fill.opacity : 1,
              visible: typeof fill.visible === "boolean" ? fill.visible : true
            });
            continue;
          }
          console.warn(`\u26A0\uFE0F Tipo de fill desconhecido: ${fill.type}. Ignorando.`);
        }
        return validFills;
      }
      var buildNode = (data, parent) => __async(null, null, function* () {
        let node;
        if (data.type === "FRAME") {
          const frame = figma.createFrame();
          node = frame;
          frame.name = data.name;
          if (parent) parent.appendChild(node);
          if (data.width) frame.resize(data.width, typeof data.height === "number" ? data.height : 100);
          if (data.layoutMode) frame.layoutMode = data.layoutMode;
          if (data.primaryAxisAlignItems) {
            if (data.primaryAxisAlignItems === "START") frame.primaryAxisAlignItems = "MIN";
            else if (data.primaryAxisAlignItems === "END") frame.primaryAxisAlignItems = "MAX";
            else frame.primaryAxisAlignItems = data.primaryAxisAlignItems;
          }
          if (data.counterAxisAlignItems) {
            if (data.counterAxisAlignItems === "START") frame.counterAxisAlignItems = "MIN";
            else if (data.counterAxisAlignItems === "END") frame.counterAxisAlignItems = "MAX";
            else if (data.counterAxisAlignItems === "STRETCH") {
            } else frame.counterAxisAlignItems = data.counterAxisAlignItems;
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
          if (data.fills !== void 0) {
            if (Array.isArray(data.fills) && data.fills.length === 0) {
              frame.fills = [];
            } else {
              const validatedFills = validateAndFixFills(data.fills);
              if (validatedFills.length > 0) {
                frame.fills = validatedFills;
              } else {
                frame.fills = [];
              }
            }
          }
          if (data.layoutSizingHorizontal === "FILL") frame.layoutSizingHorizontal = "FILL";
          if (data.layoutSizingVertical === "FILL") frame.layoutSizingVertical = "FILL";
          if (data.layoutSizingVertical === "HUG") frame.layoutSizingVertical = "HUG";
          if (data.primaryAxisSizingMode) {
            if (data.primaryAxisSizingMode === "HUG") frame.primaryAxisSizingMode = "AUTO";
            else if (data.primaryAxisSizingMode === "FILL") frame.primaryAxisSizingMode = "FIXED";
            else frame.primaryAxisSizingMode = data.primaryAxisSizingMode;
          }
          if (data.counterAxisSizingMode) {
            if (data.counterAxisSizingMode === "HUG") frame.counterAxisSizingMode = "AUTO";
            else if (data.counterAxisSizingMode === "FILL") frame.counterAxisSizingMode = "FIXED";
            else frame.counterAxisSizingMode = data.counterAxisSizingMode;
          }
          if (data.children) {
            for (const childData of data.children) {
              yield buildNode(childData, frame);
            }
          }
        } else if (data.type === "TEXT") {
          const text = figma.createText();
          node = text;
          text.name = data.name;
          if (parent) parent.appendChild(node);
          const fontToLoad = data.fontName || { family: "Inter", style: "Regular" };
          yield loadFontIfNeeded(fontToLoad);
          if (data.fontName) text.fontName = data.fontName;
          text.characters = data.characters || "";
          if (data.fontSize) text.fontSize = data.fontSize;
          if (data.fills) {
            const validatedFills = validateAndFixFills(data.fills);
            if (validatedFills.length > 0) {
              text.fills = validatedFills;
            }
          } else if (data.color) {
            const _a = data.color, { a } = _a, colorWithoutAlpha = __objRest(_a, ["a"]);
            text.fills = [{ type: "SOLID", color: colorWithoutAlpha }];
          }
          if (data.textAlignHorizontal) text.textAlignHorizontal = data.textAlignHorizontal;
          if (data.lineHeight) text.lineHeight = data.lineHeight;
          if (data.layoutSizingHorizontal === "FILL") text.layoutSizingHorizontal = "FILL";
        } else {
          return;
        }
        return node;
      });
      figma.showUI(__html__, { width: 600, height: 600 });
      figma.clientStorage.getAsync("wp_config").then((config) => {
        if (config) {
          figma.ui.postMessage({ type: "load-wp-config", config });
        }
      });
      figma.clientStorage.getAsync("gemini_api_key").then((apiKey) => {
        figma.clientStorage.getAsync("gemini_model").then((model) => {
          if (apiKey || model) {
            figma.ui.postMessage({ type: "load-gemini-config", apiKey, model });
          }
        });
      });
      figma.ui.onmessage = (msg) => __async(null, null, function* () {
        console.log("\u{1F4E8} Mensagem recebida:", msg.type);
        console.log("Dados completos:", msg);
        if (msg.type === "export-elementor") {
          figma.notify('\u26A0\uFE0F Use o bot\xE3o "Converter com Pipeline Estrito" para melhores resultados.');
          const selection = figma.currentPage.selection;
          if (selection.length !== 1) {
            figma.notify("Selecione exatamente 1 frame.");
            return;
          }
          try {
            const pipeline = new ConversionPipeline();
            const wpConfig = (yield figma.clientStorage.getAsync("wp_config")) || {};
            const json = yield pipeline.run(selection[0], wpConfig);
            figma.ui.postMessage({
              type: "export-result",
              data: JSON.stringify(json.content, null, 2)
            });
            figma.notify("\u2705 Convers\xE3o conclu\xEDda (Pipeline)!");
          } catch (e) {
            figma.notify("\u274C Erro: " + e.message);
          }
        } else if (msg.type === "save-wp-config") {
          yield figma.clientStorage.setAsync("wp_config", msg.config);
          yield figma.clientStorage.setAsync("wp_config", msg.config);
          figma.notify("Configura\xE7\xF5es salvas.");
        } else if (msg.type === "get-wp-config") {
          console.log("\u{1F4E5} Recebido get-wp-config");
          const config = yield figma.clientStorage.getAsync("wp_config");
          console.log("Config WP recuperada:", config);
          figma.ui.postMessage({ type: "load-wp-config", config });
        } else if (msg.type === "optimize-structure") {
          const selection = figma.currentPage.selection;
          if (selection.length === 0) {
            figma.notify("Selecione um frame para otimizar.");
            sendLog("\u26A0\uFE0F Nenhum frame selecionado.", "warn");
            return;
          }
          sendLog(`\u{1F50D} Iniciando otimiza\xE7\xE3o de estrutura em ${selection.length} elemento(s)...`, "info");
          figma.notify("Otimizando estrutura...");
          let totalRemoved = 0;
          const nodes = [...selection];
          for (const node of nodes) {
            sendLog(`\u{1F4CB} Processando: ${node.name}`, "info");
            const removed = StructureOptimizer.applyOptimization(node, sendLog);
            if (removed > 0) {
              sendLog(`  \u2705 ${removed} container(s) removido(s) de "${node.name}"`, "info");
            }
            totalRemoved += removed;
          }
          if (totalRemoved > 0) {
            sendLog(`\u{1F389} Estrutura otimizada! Total: ${totalRemoved} containers redundantes removidos.`, "info");
            figma.notify(`Otimiza\xE7\xE3o conclu\xEDda: ${totalRemoved} itens removidos.`);
          } else {
            sendLog("\u2139\uFE0F Nenhum container redundante encontrado. Estrutura j\xE1 est\xE1 otimizada.", "info");
            figma.notify("Nenhuma otimiza\xE7\xE3o necess\xE1ria.");
          }
        } else if (msg.type === "get-gemini-config") {
          console.log("\u{1F4E5} Recebido get-gemini-config");
          const apiKey = yield getKey();
          const model = yield getModel();
          console.log("Gemini config recuperada - API Key:", apiKey ? "presente" : "ausente", "Modelo:", model);
          figma.ui.postMessage({ type: "load-gemini-config", apiKey, model });
        } else if (msg.type === "upload-image-response") {
          console.warn("Upload response ignored in legacy mode");
        } else if (msg.type === "rename-layer") {
          const sel = figma.currentPage.selection;
          if (sel.length === 1) {
            sel[0].name = msg.newName;
            figma.notify(`Renomeado: ${msg.newName}`);
          } else {
            figma.notify("Selecione 1 item.");
          }
        } else if (msg.type === "debug-structure") {
          const debug = figma.currentPage.selection.map((n) => ({
            id: n.id,
            name: n.name,
            type: n.type,
            layout: hasLayout(n) ? n.layoutMode : "none"
          }));
          figma.ui.postMessage({ type: "debug-result", data: JSON.stringify(debug, null, 2) });
        } else if (msg.type === "resize-ui") {
          figma.ui.resize(msg.width, msg.height);
        } else if (msg.type === "save-gemini-key") {
          console.log("\u{1F4E5} Recebido save-gemini-key");
          console.log("Key recebida:", msg.key);
          try {
            yield saveKey(msg.key);
            console.log("\u2705 Key salva com sucesso");
            figma.notify("\u{1F511} API Key do Gemini salva com sucesso!");
          } catch (error) {
            console.error("\u274C Erro ao salvar key:", error);
            figma.notify("\u274C Erro ao salvar API Key");
          }
        } else if (msg.type === "save-gemini-model") {
          console.log("\u{1F4E5} Recebido save-gemini-model");
          yield saveModel(msg.model);
          figma.notify(`\u{1F916} Modelo Gemini definido para: ${msg.model}`);
        } else if (msg.type === "test-gemini-connection") {
          console.log("\u{1F4E5} Recebido test-gemini-connection");
          figma.notify("Testando conex\xE3o com a API Gemini...");
          try {
            const result = yield testConnection();
            console.log("Resultado do teste:", result);
            figma.ui.postMessage({
              type: "gemini-connection-result",
              success: result.success,
              message: result.message
            });
            if (result.success) {
              figma.notify(result.message || "\u2705 Conex\xE3o com Gemini OK!");
            } else {
              figma.notify(`\u274C ${result.message || "Falha na conex\xE3o."}`);
            }
          } catch (e) {
            figma.notify("\u274C Erro cr\xEDtico ao testar conex\xE3o: " + e.message);
            figma.ui.postMessage({
              type: "gemini-connection-result",
              success: false,
              message: e.message
            });
          }
        } else if (msg.type === "analyze-with-gemini") {
          const selection = figma.currentPage.selection;
          if (selection.length !== 1) {
            figma.notify("\u26A0\uFE0F Selecione apenas 1 frame para an\xE1lise");
            return;
          }
          const node = selection[0];
          if (node.type !== "FRAME" && node.type !== "SECTION" && node.type !== "COMPONENT" && node.type !== "GROUP") {
            figma.notify("\u26A0\uFE0F Selecione um Frame, Section, Componente ou Grupo v\xE1lido.");
            return;
          }
          if (!("children" in node)) {
            figma.notify("\u26A0\uFE0F O elemento selecionado n\xE3o possui filhos para an\xE1lise.");
            return;
          }
          figma.notify("\u{1F916} Iniciando an\xE1lise estruturada...");
          try {
            const availableImages = yield extractImagesFromNode(node);
            const availableImageIds = Object.keys(availableImages);
            console.log("\u{1F5BC}\uFE0F Imagens extra\xEDdas do original:", availableImageIds);
            figma.ui.postMessage({ type: "add-gemini-log", data: `\u{1F5BC}\uFE0F Imagens encontradas no original: ${availableImageIds.length}` });
            if (availableImageIds.length > 0) {
              figma.ui.postMessage({ type: "add-gemini-log", data: `IDs: ${availableImageIds.join(", ")}` });
            }
            const childrenToAnalyze = getSectionsToAnalyze(node);
            const totalSections = childrenToAnalyze.length;
            if (totalSections === 0) {
              throw new Error("O frame selecionado est\xE1 vazio ou n\xE3o possui se\xE7\xF5es vis\xEDveis.");
            }
            const aggregatedChildren = [];
            const aggregatedImprovements = [];
            for (let i = 0; i < totalSections; i++) {
              let child = childrenToAnalyze[i];
              const sectionIndex = i + 1;
              figma.notify(`\u{1F916} Analisando se\xE7\xE3o ${sectionIndex} de ${totalSections}: ${child.name}...`);
              figma.ui.postMessage({ type: "add-gemini-log", data: `--- INICIANDO AN\xC1LISE DA SE\xC7\xC3O ${sectionIndex}/${totalSections}: ${child.name} ---` });
              const sectionImageData = yield child.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: 1.5 } });
              const base64SectionImage = figma.base64Encode(sectionImageData);
              figma.ui.postMessage({
                type: "show-analysis-results",
                data: "",
                // Texto vazio, apenas imagem
                image: base64SectionImage
              });
              const sectionSerializedData = serializeNode(child);
              figma.ui.postMessage({
                type: "add-gemini-log",
                data: `\u{1F50D} DADOS COLETADOS (Se\xE7\xE3o ${sectionIndex} - ${child.name}):
${JSON.stringify(sectionSerializedData, null, 2)}`
              });
              const sectionAnalysis = yield analyzeAndRecreate(sectionImageData, availableImageIds, sectionSerializedData);
              figma.ui.postMessage({
                type: "add-gemini-log",
                data: `\u{1F916} RESPOSTA DA IA (Se\xE7\xE3o ${sectionIndex} - ${child.name}):
${JSON.stringify(sectionAnalysis, null, 2)}`
              });
              if (Array.isArray(sectionAnalysis)) {
                aggregatedChildren.push(...sectionAnalysis);
              } else if (sectionAnalysis.type === "FRAME" && sectionAnalysis.children) {
                aggregatedChildren.push(...sectionAnalysis.children);
                if (sectionAnalysis.improvements) {
                  aggregatedImprovements.push(...sectionAnalysis.improvements);
                }
              } else if (sectionAnalysis.children) {
                aggregatedChildren.push(...sectionAnalysis.children);
                if (sectionAnalysis.improvements) {
                  aggregatedImprovements.push(...sectionAnalysis.improvements);
                }
              } else {
                console.warn("\u26A0\uFE0F Formato de resposta inesperado da IA:", sectionAnalysis);
                aggregatedChildren.push(sectionAnalysis);
              }
            }
            figma.notify("\u{1F3A8} Montando frame final otimizado...");
            const finalAnalysis = {
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
            const newFrame = yield buildNode(finalAnalysis);
            if (node) {
              newFrame.x = node.x + node.width + 100;
              newFrame.y = node.y;
            }
            figma.currentPage.selection = [newFrame];
            figma.viewport.scrollAndZoomIntoView([newFrame]);
            figma.ui.postMessage({
              type: "gemini-creation-complete",
              data: {
                originalName: node.name,
                newName: newFrame.name,
                improvements: finalAnalysis.improvements
              }
            });
            figma.notify("\u{1F517} Iniciando Fase 4: Consolida\xE7\xE3o Final...");
            figma.ui.postMessage({ type: "add-gemini-log", data: `--- FASE 4: CONSOLIDA\xC7\xC3O ---` });
            const processedNodes = flattenAnalysisToNodes(finalAnalysis);
            figma.ui.postMessage({
              type: "add-gemini-log",
              data: `\u{1F4CB} Nodes para consolida\xE7\xE3o: ${processedNodes.length}
${JSON.stringify(processedNodes, null, 2)}`
            });
            const consolidationResult = yield consolidateNodes(processedNodes);
            figma.ui.postMessage({
              type: "add-gemini-log",
              data: `\u2705 CONSOLIDA\xC7\xC3O CONCLU\xCDDA:
${JSON.stringify(consolidationResult, null, 2)}`
            });
            figma.ui.postMessage({
              type: "consolidation-result",
              result: consolidationResult
            });
            figma.notify("\u2705 Convers\xE3o Completa! JSON gerado.");
          } catch (e) {
            console.error("Erro detalhado na an\xE1lise Gemini:", e);
            figma.notify("\u274C Erro na an\xE1lise: " + e.message);
            figma.ui.postMessage({
              type: "gemini-error",
              error: e.message
            });
          } finally {
            figma.ui.postMessage({ type: "hide-loader" });
          }
        } else if (msg.type === "save-deepseek-key") {
          yield saveDeepSeekKey(msg.key);
          figma.notify("\u{1F511} API Key do DeepSeek salva com sucesso!");
        } else if (msg.type === "save-deepseek-model") {
          yield saveDeepSeekModel(msg.model);
          figma.notify(`\u{1F916} Modelo DeepSeek definido para: ${msg.model}`);
        } else if (msg.type === "get-deepseek-config") {
          const apiKey = yield getDeepSeekKey();
          const model = yield getDeepSeekModel();
          figma.ui.postMessage({ type: "load-deepseek-config", apiKey, model });
        } else if (msg.type === "test-deepseek-connection") {
          figma.notify("Testando conex\xE3o com DeepSeek...");
          const result = yield testDeepSeekConnection();
          figma.ui.postMessage(__spreadValues({ type: "deepseek-connection-result" }, result));
          if (result.success) figma.notify(result.message);
          else figma.notify("\u274C Falha na conex\xE3o DeepSeek");
        } else if (msg.type === "analyze-with-deepseek") {
          const selection = figma.currentPage.selection;
          if (selection.length !== 1) {
            figma.notify("\u26A0\uFE0F Selecione apenas 1 frame para an\xE1lise");
            return;
          }
          const node = selection[0];
          if (node.type !== "FRAME" && node.type !== "SECTION" && node.type !== "COMPONENT" && node.type !== "GROUP") {
            figma.notify("\u26A0\uFE0F Selecione um Frame, Section, Componente ou Grupo v\xE1lido.");
            return;
          }
          if (!("children" in node)) {
            figma.notify("\u26A0\uFE0F O elemento selecionado n\xE3o possui filhos para an\xE1lise.");
            return;
          }
          figma.notify("\u{1F916} Iniciando an\xE1lise com DeepSeek...");
          try {
            const availableImages = yield extractImagesFromNode(node);
            const availableImageIds = Object.keys(availableImages);
            console.log("\u{1F5BC}\uFE0F Imagens extra\xEDdas do original:", availableImageIds);
            figma.ui.postMessage({ type: "add-gemini-log", data: `\u{1F5BC}\uFE0F Imagens encontradas no original: ${availableImageIds.length}` });
            const childrenToAnalyze = getSectionsToAnalyze(node);
            const totalSections = childrenToAnalyze.length;
            if (totalSections === 0) {
              throw new Error("O frame selecionado est\xE1 vazio ou n\xE3o possui se\xE7\xF5es vis\xEDveis.");
            }
            const aggregatedChildren = [];
            const aggregatedImprovements = [];
            for (let i = 0; i < totalSections; i++) {
              let child = childrenToAnalyze[i];
              const sectionIndex = i + 1;
              figma.notify(`\u{1F916} Analisando se\xE7\xE3o ${sectionIndex} de ${totalSections}: ${child.name}...`);
              figma.ui.postMessage({ type: "add-gemini-log", data: `--- INICIANDO AN\xC1LISE DA SE\xC7\xC3O ${sectionIndex}/${totalSections}: ${child.name} ---` });
              const sectionSerializedData = serializeNode(child);
              figma.ui.postMessage({
                type: "add-gemini-log",
                data: `\u{1F50D} DADOS COLETADOS (Se\xE7\xE3o ${sectionIndex} - ${child.name}):
${JSON.stringify(sectionSerializedData, null, 2)}`
              });
              const sectionImageData = yield child.exportAsync({ format: "JPG", constraint: { type: "SCALE", value: 1 } });
              const sectionAnalysis = yield analyzeLayoutDeepSeek(sectionSerializedData, child.id, sectionImageData);
              figma.ui.postMessage({
                type: "add-gemini-log",
                data: `\u{1F916} RESPOSTA DEEPSEEK (Se\xE7\xE3o ${sectionIndex} - ${child.name}):
${JSON.stringify(sectionAnalysis, null, 2)}`
              });
              if (Array.isArray(sectionAnalysis)) {
                aggregatedChildren.push(...sectionAnalysis);
              } else if (sectionAnalysis.type === "FRAME" && sectionAnalysis.children) {
                aggregatedChildren.push(...sectionAnalysis.children);
                if (sectionAnalysis.improvements) {
                  aggregatedImprovements.push(...sectionAnalysis.improvements);
                }
              } else if (sectionAnalysis.children) {
                aggregatedChildren.push(...sectionAnalysis.children);
                if (sectionAnalysis.improvements) {
                  aggregatedImprovements.push(...sectionAnalysis.improvements);
                }
              } else {
                console.warn("\u26A0\uFE0F Formato de resposta inesperado da IA:", sectionAnalysis);
                aggregatedChildren.push(sectionAnalysis);
              }
            }
            figma.notify("\u{1F3A8} Montando frame final otimizado...");
            const finalAnalysis = {
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
            const newFrame = yield buildNode(finalAnalysis);
            if (node) {
              newFrame.x = node.x + node.width + 100;
              newFrame.y = node.y;
            }
            figma.currentPage.selection = [newFrame];
            figma.viewport.scrollAndZoomIntoView([newFrame]);
            figma.ui.postMessage({
              type: "gemini-creation-complete",
              data: {
                originalName: node.name,
                newName: newFrame.name,
                improvements: finalAnalysis.improvements
              }
            });
            figma.notify("\u{1F517} Iniciando Fase 4: Consolida\xE7\xE3o Final...");
            figma.ui.postMessage({ type: "add-gemini-log", data: `--- FASE 4: CONSOLIDA\xC7\xC3O ---` });
            const processedNodes = flattenAnalysisToNodes(finalAnalysis);
            const consolidationResult = yield consolidateNodes2(processedNodes);
            figma.ui.postMessage({
              type: "add-gemini-log",
              data: `\u2705 CONSOLIDA\xC7\xC3O CONCLU\xCDDA:
${JSON.stringify(consolidationResult, null, 2)}`
            });
            figma.ui.postMessage({
              type: "consolidation-result",
              result: consolidationResult
            });
            figma.notify("\u2705 Convers\xE3o Completa! JSON gerado.");
          } catch (e) {
            console.error("Erro detalhado na an\xE1lise DeepSeek:", e);
            figma.notify("\u274C Erro na an\xE1lise: " + e.message);
            figma.ui.postMessage({
              type: "gemini-error",
              error: e.message
            });
          } finally {
            figma.ui.postMessage({ type: "hide-loader" });
          }
        } else if (msg.type === "resize-ui") {
          figma.ui.resize(msg.width, msg.height);
        } else if (msg.type === "create-test-frame") {
          try {
            const testFrameData = {
              "id": "root-frame",
              "name": "Desktop - Homepage Optimized",
              "type": "FRAME",
              "width": 1920,
              "height": 2e3,
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
                          "characters": "O que \xE9 a Harmoniza\xE7\xE3o\nIntima Masculina?",
                          "fontSize": 48,
                          "fontName": { "family": "Inter", "style": "Bold" },
                          "fontWeight": 700,
                          "fills": [{ "type": "SOLID", "color": { "r": 7e-3, "g": 0.431, "b": 0.478 } }],
                          "layoutSizingHorizontal": "FILL"
                        },
                        {
                          "id": "hero-text",
                          "name": "Text Editor - Description",
                          "type": "TEXT",
                          "characters": "A harmoniza\xE7\xE3o \xEDntima masculina \xE9 um procedimento est\xE9tico que visa aumentar tanto o tamanho quanto a circunfer\xEAncia do P\xEAnis, al\xE9m de corrigir assimetrias e melhorar a apar\xEAncia.\n\nO Protocolo NEXX utiliza \xC1cido Hialur\xF4nico, Toxina Botul\xEDnica e FIOS de PDO, produtos seguros, eficazes e compat\xEDveis com o nosso organismo.",
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
                          "fills": [{ "type": "SOLID", "color": { "r": 7e-3, "g": 0.431, "b": 0.478 } }],
                          "children": [
                            {
                              "id": "btn-text",
                              "name": "Label",
                              "type": "TEXT",
                              "characters": "Agendar Avalia\xE7\xE3o",
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
                      "characters": "ENGROSSE E AUMENTE SEU P\xCANIS COM RESULTADOS IMEDIATOS",
                      "textAlignHorizontal": "CENTER",
                      "fontSize": 36,
                      "fontName": { "family": "Inter", "style": "Bold" },
                      "fills": [{ "type": "SOLID", "color": { "r": 7e-3, "g": 0.431, "b": 0.478 } }]
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
                              "characters": "Anestesia Local \xE9 Aplicada",
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
            yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
            yield figma.loadFontAsync({ family: "Inter", style: "Medium" });
            yield figma.loadFontAsync({ family: "Inter", style: "Bold" });
            yield figma.loadFontAsync({ family: "Sora", style: "SemiBold" });
            const rootFrame = yield buildNode(testFrameData);
            if (rootFrame) {
              figma.currentPage.selection = [rootFrame];
              figma.viewport.scrollAndZoomIntoView([rootFrame]);
              figma.notify("\u2705 Frame de teste OTIMIZADO criado!");
            }
          } catch (e) {
            console.error("Erro ao criar frame de teste:", e);
            figma.notify("\u274C Erro ao criar frame: " + e.message);
          }
        } else if (msg.type === "analyze-structure") {
          const selection = figma.currentPage.selection;
          if (selection.length === 0) {
            figma.ui.postMessage({
              type: "analysis-error",
              message: "Selecione um ou mais elementos para analisar"
            });
            return;
          }
          figma.notify(`\u{1F50D} Analisando ${selection.length} elemento(s)...`);
          try {
            const { analyzeHybrid: analyzeHybrid2, clearAICache: clearAICache2 } = yield Promise.resolve().then(() => (init_hybrid_analyzer(), hybrid_analyzer_exports));
            const config = {
              structuralThreshold: msg.threshold || 85,
              useAIFallback: msg.useAI !== false,
              cacheEnabled: msg.cache !== false,
              apiKey: msg.apiKey,
              model: msg.model || "gemini-1.5-flash-latest"
            };
            const results = [];
            function analyzeNodeRecursive(node, depth = 0) {
              return __async(this, null, function* () {
                const result = yield analyzeHybrid2(node, config);
                const serializableMatches = result.matches.slice(0, 3).map((match) => ({
                  pattern: {
                    name: match.pattern.name,
                    tag: match.pattern.tag,
                    minScore: match.pattern.minScore,
                    category: match.pattern.category
                  },
                  score: match.score,
                  method: match.method,
                  confidence: match.confidence,
                  reasoning: match.reasoning
                }));
                results.push({
                  nodeId: node.id,
                  nodeName: node.name,
                  depth,
                  matches: serializableMatches,
                  bestMatch: serializableMatches[0],
                  method: result.method,
                  processingTime: result.processingTime
                });
                if ("children" in node && node.children.length > 0) {
                  for (const child of node.children) {
                    yield analyzeNodeRecursive(child, depth + 1);
                  }
                }
              });
            }
            for (const node of selection) {
              yield analyzeNodeRecursive(node, 0);
            }
            console.log("[Analysis] Resultados:", results);
            figma.ui.postMessage({
              type: "analysis-results",
              results,
              totalAnalyzed: results.length
            });
            figma.notify(`\u2705 An\xE1lise conclu\xEDda! ${results.length} elemento(s) analisado(s).`);
          } catch (error) {
            console.error("[Hybrid Analysis] Erro:", error);
            figma.ui.postMessage({
              type: "analysis-error",
              message: error.message || "Erro desconhecido na an\xE1lise"
            });
            figma.notify("\u274C Erro na an\xE1lise estrutural");
          }
        }
        if (msg.type === "save-analysis-api-key") {
          try {
            yield figma.clientStorage.setAsync("analysis-api-key", msg.apiKey);
            console.log("[Storage] API key salva com sucesso");
          } catch (error) {
            console.error("[Storage] Erro ao salvar API key:", error);
          }
        }
        if (msg.type === "get-analysis-api-key") {
          try {
            const apiKey = (yield figma.clientStorage.getAsync("analysis-api-key")) || "";
            figma.ui.postMessage({
              type: "analysis-api-key",
              apiKey
            });
            console.log("[Storage] API key enviada para UI");
          } catch (error) {
            console.error("[Storage] Erro ao carregar API key:", error);
            figma.ui.postMessage({
              type: "analysis-api-key",
              apiKey: ""
            });
          }
        }
        if (msg.type === "clear-analysis-api-key") {
          try {
            yield figma.clientStorage.deleteAsync("analysis-api-key");
            console.log("[Storage] API key removida com sucesso");
            figma.notify("\u{1F5D1}\uFE0F API key removida");
          } catch (error) {
            console.error("[Storage] Erro ao remover API key:", error);
          }
        } else if (msg.type === "apply-renames") {
          if (!msg.results || !Array.isArray(msg.results)) {
            figma.notify("\u274C Dados de renomea\xE7\xE3o inv\xE1lidos");
            return;
          }
          let renamed = 0;
          for (const result of msg.results) {
            const node = figma.getNodeById(result.nodeId);
            if (node && result.bestMatch) {
              node.name = result.bestMatch.pattern.tag;
              renamed++;
            }
          }
          figma.notify(`\u2705 ${renamed} elemento(s) renomeado(s)!`);
          figma.ui.postMessage({
            type: "rename-complete",
            count: renamed
          });
        } else if (msg.type === "clear-ai-cache") {
          try {
            const { clearAICache: clearAICache2 } = yield Promise.resolve().then(() => (init_hybrid_analyzer(), hybrid_analyzer_exports));
            clearAICache2();
            figma.ui.postMessage({
              type: "cache-cleared"
            });
            figma.notify("\u{1F5D1}\uFE0F Cache de IA limpo!");
          } catch (error) {
            console.error("[Cache] Erro ao limpar:", error);
            figma.notify("\u274C Erro ao limpar cache");
          }
        } else if (msg.type === "run-conversion-pipeline") {
          const selection = figma.currentPage.selection;
          if (selection.length !== 1) {
            figma.notify("Selecione exatamente 1 frame para converter.");
            return;
          }
          figma.notify("\u{1F680} Iniciando Pipeline de Convers\xE3o Estrita...");
          try {
            const pipeline = new ConversionPipeline();
            const wpConfig = (yield figma.clientStorage.getAsync("wp_config")) || {};
            const json = yield pipeline.run(selection[0], wpConfig);
            figma.ui.postMessage({
              type: "export-result",
              data: JSON.stringify(json, null, 2)
            });
            figma.notify("\u2705 Convers\xE3o conclu\xEDda com sucesso!");
          } catch (e) {
            console.error("Erro no pipeline:", e);
            figma.notify("\u274C Erro no pipeline: " + e.message);
            figma.ui.postMessage({
              type: "add-log",
              message: `Erro no pipeline: ${e.message}`,
              level: "error"
            });
          }
        }
      });
      function flattenAnalysisToNodes(analysis) {
        const nodes = [];
        let nodeIdCounter = 1;
        function processChild(child, parentId) {
          const currentId = `node_${nodeIdCounter++}`;
          const node = {
            nodeId: currentId,
            widget: child.name || child.widgetType || "w:container",
            // Fallback
            confidence: "high",
            settings: __spreadProps(__spreadValues({}, child), {
              // Passa todas as propriedades como settings iniciais
              _originalType: child.type
            }),
            parentId,
            children: []
            // Será preenchido se houver filhos
          };
          nodes.push(node);
          if (child.children && child.children.length > 0) {
            child.children.forEach((c) => {
              var _a;
              const childId = processChild(c, currentId);
              (_a = node.children) == null ? void 0 : _a.push(childId);
            });
          }
          return currentId;
        }
        if (analysis.children) {
          analysis.children.forEach((child) => processChild(child));
        }
        return nodes;
      }
    }
  });
  require_code();
})();
