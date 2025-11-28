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

// src/config/prompts.ts
var PIPELINE_GENERATION_PROMPT = `
Voc\xEA \xE9 um especialista s\xEAnior em Front-end e Elementor, com foco em convers\xE3o de designs Figma.
Sua tarefa \xE9 analisar os dados brutos extra\xEDdos do Figma e gerar um JSON estritamente formatado de acordo com o Schema Intermedi\xE1rio (PipelineSchema).

### OBJETIVO
Converter a \xE1rvore de n\xF3s do Figma em uma estrutura l\xF3gica de Se\xE7\xF5es, Colunas e Widgets do Elementor.

### SCHEMA DE SA\xCDDA (TypeScript Interface)
O JSON gerado DEVE seguir exatamente esta estrutura:

\`\`\`typescript
interface PipelineSchema {
  page: {
    title: string; // Nome do frame raiz
    tokens: {
      primaryColor: string; // Cor predominante (hex)
      secondaryColor: string; // Cor secund\xE1ria (hex)
    };
  };
  sections: Section[];
}

interface Section {
  id: string;
  type: 'hero_two_columns' | 'hero_single_column' | 'grid_3col' | 'grid_4col' | 'card' | 'custom';
  width: 'full' | 'boxed'; // 'full' se o frame for largura total (>1200px), 'boxed' caso contr\xE1rio
  background: {
    color?: string;
    image?: string; // URL ou hash da imagem
    gradient?: string; // CSS gradient string
  };
  columns: Column[];
}

interface Column {
  span: number; // Largura da coluna em grid de 12 (ex: 12=100%, 6=50%, 4=33%)
  widgets: Widget[];
}

interface Widget {
  type: 'heading' | 'text' | 'button' | 'image' | 'icon' | 'iconBox' | 'imageBox' | 'list' | 'divider' | 'html';
  content: string | null; // Texto do heading/par\xE1grafo ou URL da imagem
  imageId: string | null; // ID interno da imagem (se houver)
  styles: {
    // Mapeie propriedades visuais relevantes
    color?: string;
    typography_font_size?: { unit: 'px', size: number };
    typography_font_weight?: string;
    text_align?: 'left' | 'center' | 'right' | 'justify';
    background_color?: string;
    border_radius?: { unit: 'px', top: number, right: number, bottom: number, left: number };
    // ... outros estilos
  };
}
\`\`\`

### REGRAS DE MAPEAMENTO (Racioc\xEDnio)

1. **Estrutura (Se\xE7\xF5es e Colunas)**:
   - O Frame Raiz \xE9 a P\xE1gina.
   - Os filhos diretos do Frame Raiz s\xE3o **Se\xE7\xF5es**.
   - Dentro de uma Se\xE7\xE3o:
     - Se layoutMode for 'HORIZONTAL', os filhos s\xE3o **Colunas**. Calcule o span baseado na largura relativa (Total = 12).
     - Se layoutMode for 'VERTICAL', considere uma \xFAnica **Coluna** (span 12) contendo os widgets empilhados.

2. **Detec\xE7\xE3o de Widgets**:
   - **Heading**: Texto com tamanho > 20px ou peso Bold/SemiBold.
   - **Text**: Texto com tamanho <= 20px e peso Regular/Medium.
   - **Button**: Frame/Group pequeno contendo Texto centralizado e Fundo (Fill) ou Borda (Stroke).
   - **Image**: Ret\xE2ngulo ou Frame com preenchimento do tipo IMAGE.
   - **Icon**: Node do tipo VECTOR, ou Frame contendo apenas vetor.
   - **ImageBox**: Container com Imagem + Heading + Texto (opcional).
   - **IconBox**: Container com \xCDcone + Heading + Texto (opcional).

3. **Estilos**:
   - Extraia cores em Hexadecimal.
   - Converta tamanhos de fonte para pixels.
   - Identifique alinhamentos (textAlign, justifyContent).

### INSTRU\xC7\xD5ES FINAIS
- **N\xC3O** inclua explica\xE7\xF5es, markdown ou blocos de c\xF3digo (\`\`\`json).
- **APENAS** o JSON puro.
- Se um elemento for muito complexo, simplifique para o widget mais pr\xF3ximo ou use 'html' se necess\xE1rio.
- Garanta que o JSON seja v\xE1lido e parse\xE1vel.
`;

// src/api_gemini.ts
var GEMINI_MODEL = "gemini-2.5-flash";
var API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
var GeminiError = class extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = "GeminiError";
  }
};
async function getKey() {
  return await figma.clientStorage.getAsync("gemini_api_key");
}
async function getModel() {
  const savedModel = await figma.clientStorage.getAsync("gemini_model");
  return savedModel || GEMINI_MODEL;
}

// src/utils/guid.ts
function generateGUID() {
  return "xxxxxxxxxx".replace(/[x]/g, () => (Math.random() * 36 | 0).toString(36));
}

// src/compiler/elementor.compiler.ts
var ElementorCompiler = class {
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
      version: "0.4",
      title: schema.page.title || "Figma Import",
      type: "page",
      siteurl: "",
      // Será preenchido pelo code.ts se necessário
      elements: rootElements
    };
  }
  compileSection(section) {
    const sectionId = generateGUID();
    const settings = {
      layout: section.width === "full" ? "full_width" : "boxed"
    };
    if (section.background.color) settings.background_color = section.background.color;
    if (section.background.image) settings.background_image = { url: section.background.image, id: 0 };
    if (section.background.gradient) settings.background_background = "gradient";
    return {
      id: sectionId,
      elType: "section",
      isInner: false,
      settings,
      elements: section.columns.map((col) => this.compileColumn(col))
    };
  }
  compileColumn(column) {
    const colId = generateGUID();
    const colWidth = column.span / 12 * 100;
    return {
      id: colId,
      elType: "column",
      isInner: false,
      settings: {
        _column_size: colWidth,
        _inline_size: colWidth
        // Para containers flex
      },
      elements: column.widgets.map((widget) => this.compileWidget(widget))
    };
  }
  compileWidget(widget) {
    const widgetId = generateGUID();
    let widgetType = widget.type;
    let settings = { ...widget.styles };
    switch (widget.type) {
      case "heading":
        settings.title = widget.content || "Heading";
        break;
      case "text":
        widgetType = "text-editor";
        settings.editor = widget.content || "Text";
        break;
      case "button":
        settings.text = widget.content || "Button";
        break;
      case "image":
        settings.image = { url: widget.content || "", id: 0 };
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
        settings.image = { url: widget.imageId || "", id: 0 };
        settings.title_text = "Title";
        settings.description_text = widget.content || "Description";
        break;
      case "iconBox":
        widgetType = "icon-box";
        settings.selected_icon = { value: "fas fa-star", library: "fa-solid" };
        settings.title_text = "Title";
        settings.description_text = widget.content || "Description";
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
};

// src/pipeline.ts
var ConversionPipeline = class {
  constructor() {
    this.apiKey = null;
    this.model = null;
    this.compiler = new ElementorCompiler();
  }
  /**
   * Executa o pipeline completo
   * @param node Nó raiz do Figma a ser convertido
   */
  async run(node, wpConfig = {}) {
    this.compiler.setWPConfig(wpConfig);
    await this.loadConfig();
    console.log("[Pipeline] 1. Extraindo dados do n\xF3...");
    const serializedData = serializeNode(node);
    console.log("[Pipeline] 2. Enviando para IA...");
    const intermediateSchema = await this.processWithAI(serializedData);
    console.log("[Pipeline] 3. Validando schema...");
    this.validateSchema(intermediateSchema);
    console.log("[Pipeline] 4. Compilando para Elementor...");
    const elementorJson = this.compiler.compile(intermediateSchema);
    if (wpConfig.url) {
      elementorJson.siteurl = wpConfig.url;
    }
    return elementorJson;
  }
  async loadConfig() {
    this.apiKey = await getKey();
    this.model = await getModel();
    if (!this.apiKey) {
      throw new Error("API Key n\xE3o configurada. Por favor, configure na aba 'IA Gemini'.");
    }
  }
  /**
   * Envia os dados para a IA e retorna o Schema Intermediário
   */
  async processWithAI(data) {
    if (!this.apiKey || !this.model) throw new Error("Configura\xE7\xE3o de IA incompleta.");
    const endpoint = `${API_BASE_URL}${this.model}:generateContent?key=${this.apiKey}`;
    const systemPrompt = PIPELINE_GENERATION_PROMPT;
    const requestBody = {
      contents: [{
        parts: [
          { text: systemPrompt },
          { text: `DADOS DE ENTRADA:
${JSON.stringify(data)}` }
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        response_mime_type: "application/json"
      }
    };
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new GeminiError(`Erro na API Gemini: ${err.error?.message || response.statusText}`);
      }
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Resposta vazia da IA.");
      const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanText);
    } catch (e) {
      console.error("Erro no processamento de IA:", e);
      throw e;
    }
  }
  /**
   * Valida o schema retornado pela IA
   */
  validateSchema(schema) {
    if (!schema || typeof schema !== "object") throw new Error("Schema inv\xE1lido: N\xE3o \xE9 um objeto.");
    if (!schema.page || !schema.sections) throw new Error("Schema inv\xE1lido: Faltando 'page' ou 'sections'.");
    if (!Array.isArray(schema.sections)) throw new Error("Schema inv\xE1lido: 'sections' deve ser um array.");
    schema.sections.forEach((section, idx) => {
      if (!section.columns || !Array.isArray(section.columns)) {
        throw new Error(`Schema inv\xE1lido na se\xE7\xE3o ${idx}: 'columns' ausente ou inv\xE1lido.`);
      }
    });
  }
};

// src/tests/simulation.ts
globalThis.figma = {
  clientStorage: {
    getAsync: async (key) => {
      if (key === "wp_config") return { url: "https://example.com", auth: "basic" };
      if (key === "gemini_api_key") return "mock-key";
      if (key === "gemini_model") return "gemini-1.5-flash";
      return null;
    }
  },
  notify: (msg) => console.log("Figma Notify:", msg),
  ui: {
    postMessage: (msg) => console.log("UI Message:", msg)
  }
};
globalThis.fetch = async (url, options) => {
  console.log("Fetch called:", url);
  return {
    ok: true,
    json: async () => ({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              page: { title: "Test Page", tokens: { primaryColor: "#000", secondaryColor: "#fff" } },
              sections: [{
                id: "sec1",
                type: "hero_single_column",
                width: "full",
                background: { color: "#ffffff" },
                columns: [{
                  span: 12,
                  widgets: [{
                    type: "heading",
                    content: "Hello World",
                    imageId: null,
                    styles: { color: "#000000", typography_font_size: { unit: "px", size: 32 } }
                  }]
                }]
              }]
            })
          }]
        }
      }]
    })
  };
};
async function runSimulation() {
  console.log("--- Starting Simulation ---");
  const mockNode = {
    id: "1:1",
    name: "Test Frame",
    type: "FRAME",
    children: [],
    exportAsync: async () => new Uint8Array([])
  };
  const pipeline = new ConversionPipeline();
  const wpConfig = { url: "https://test.local", auth: "mock" };
  try {
    const result = await pipeline.run(mockNode, wpConfig);
    console.log("--- Simulation Result ---");
    console.log(JSON.stringify(result, null, 2));
    if (result.siteurl === "https://test.local" && result.elements.length > 0) {
      console.log("\u2705 SUCCESS: Pipeline ran and produced output with correct config.");
    } else {
      console.error("\u274C FAILURE: Output mismatch.");
    }
  } catch (error) {
    console.error("\u274C ERROR:", error);
  }
}
runSimulation();
