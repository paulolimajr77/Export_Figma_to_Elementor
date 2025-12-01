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
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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

  // src/utils/image_utils.ts
  function rgbToHex(rgb) {
    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }
  var init_image_utils = __esm({
    "src/utils/image_utils.ts"() {
    }
  });

  // src/utils/serialization_utils.ts
  function getFontWeight(style) {
    style = (style || "").toLowerCase();
    if (style.includes("thin")) return 100;
    if (style.includes("extra light") || style.includes("extralight")) return 200;
    if (style.includes("light")) return 300;
    if (style.includes("medium")) return 500;
    if (style.includes("semi bold") || style.includes("semibold")) return 600;
    if (style.includes("bold")) return 700;
    if (style.includes("extra bold") || style.includes("extrabold")) return 800;
    if (style.includes("black") || style.includes("heavy")) return 900;
    return 400;
  }
  function serializeNode(node, parentId) {
    var _a;
    const data = {
      id: node.id,
      name: node.name,
      type: node.locked ? "IMAGE" : node.type,
      width: node.width,
      height: node.height,
      x: node.x,
      y: node.y,
      visible: node.visible,
      locked: node.locked,
      parentId: parentId || null
    };
    if (node.locked) {
      data.isLockedImage = true;
      if ("children" in node) {
        data.children = [];
      }
      return data;
    }
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
      data.fontSize = node.fontSize !== figma.mixed ? node.fontSize : void 0;
      data.fontName = node.fontName !== figma.mixed ? node.fontName : void 0;
      data.fontWeight = node.fontName !== figma.mixed ? getFontWeight((_a = node.fontName) == null ? void 0 : _a.style) : 400;
      data.textAlignHorizontal = node.textAlignHorizontal;
      data.textAlignVertical = node.textAlignVertical;
      data.textAutoResize = node.textAutoResize;
      data.letterSpacing = node.letterSpacing !== figma.mixed ? node.letterSpacing : void 0;
      data.lineHeight = node.lineHeight !== figma.mixed ? node.lineHeight : void 0;
      data.textCase = node.textCase !== figma.mixed ? node.textCase : void 0;
      data.textDecoration = node.textDecoration !== figma.mixed ? node.textDecoration : void 0;
      if (node.fills !== figma.mixed && node.fills.length > 0 && node.fills[0].type === "SOLID") {
        data.color = node.fills[0].color;
      }
      try {
        data.styledTextSegments = node.getStyledTextSegments(["fontSize", "fontName", "fontWeight", "textDecoration", "textCase", "lineHeight", "letterSpacing", "fills", "fillStyleId"]);
      } catch (e) {
        console.warn("Error getting styled text segments", e);
      }
    }
    if ("layoutMode" in node) {
      data.layoutMode = node.layoutMode;
      data.direction = node.layoutMode === "HORIZONTAL" ? "row" : "column";
      data.primaryAxisSizingMode = node.primaryAxisSizingMode;
      data.counterAxisSizingMode = node.counterAxisSizingMode;
      data.primaryAxisAlignItems = node.primaryAxisAlignItems;
      data.counterAxisAlignItems = node.counterAxisAlignItems;
      data.paddingTop = node.paddingTop;
      data.paddingRight = node.paddingRight;
      data.paddingBottom = node.paddingBottom;
      data.paddingLeft = node.paddingLeft;
      data.itemSpacing = node.itemSpacing;
      if ("layoutWrap" in node) {
        data.layoutWrap = node.layoutWrap;
      }
    }
    if ("children" in node) {
      if (node.locked) {
        data.children = [];
      } else {
        data.children = node.children.map((child) => serializeNode(child, node.id));
      }
    }
    return data;
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

  // src/utils/style_utils.ts
  function buildHtmlFromSegments(node) {
    if (!node.styledTextSegments || node.styledTextSegments.length === 0) return { html: node.characters || "", css: "" };
    const cssRules = /* @__PURE__ */ new Set();
    const baseFontSize = node.fontSize;
    const baseFontWeight = node.fontWeight;
    const baseTextDecoration = node.textDecoration;
    let baseColorHex = "";
    if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
      const solid = node.fills.find((f) => f.type === "SOLID");
      if (solid && solid.color) {
        baseColorHex = rgbToHex(solid.color).replace("#", "").toLowerCase();
      }
    }
    const html = node.styledTextSegments.map((seg) => {
      const classes = [];
      let inlineStyle = "";
      let segColorHex = "";
      let segColorObj = null;
      if (seg.fills && Array.isArray(seg.fills) && seg.fills.length > 0) {
        const solid = seg.fills.find((f) => f.type === "SOLID");
        if (solid && solid.color) {
          segColorObj = solid;
          segColorHex = rgbToHex(solid.color).replace("#", "").toLowerCase();
        }
      }
      if (segColorHex && segColorHex !== baseColorHex) {
        const { r, g, b } = segColorObj.color;
        const a = segColorObj.opacity !== void 0 ? segColorObj.opacity : 1;
        const className = `color-${segColorHex}`;
        classes.push(className);
        cssRules.add(`.${className} { color: rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a}); }`);
      }
      if (seg.fontSize && seg.fontSize !== baseFontSize) {
        inlineStyle += `font-size: ${seg.fontSize}px;`;
      }
      if (seg.fontWeight && seg.fontWeight !== baseFontWeight) {
        inlineStyle += `font-weight: ${seg.fontWeight};`;
      }
      if (seg.textDecoration !== baseTextDecoration) {
        if (seg.textDecoration === "UNDERLINE") inlineStyle += "text-decoration: underline;";
        if (seg.textDecoration === "STRIKETHROUGH") inlineStyle += "text-decoration: line-through;";
      }
      if (classes.length === 0 && !inlineStyle) {
        return seg.characters;
      }
      const classAttr = classes.length > 0 ? ` class="${classes.join(" ")}"` : "";
      const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : "";
      return `<span${classAttr}${styleAttr}>${seg.characters}</span>`;
    }).join("").replace(/\n/g, "<br>");
    return { html, css: Array.from(cssRules).join("\n") };
  }
  function extractWidgetStyles(node) {
    const styles = {
      sourceId: node.id,
      sourceName: node.name
    };
    if (node.fontSize) styles.fontSize = node.fontSize;
    if (node.fontName) styles.fontName = node.fontName;
    if (node.fontWeight) styles.fontWeight = node.fontWeight;
    if (node.textDecoration) styles.textDecoration = node.textDecoration;
    if (node.textCase) styles.textCase = node.textCase;
    if (node.lineHeight) styles.lineHeight = node.lineHeight;
    if (node.letterSpacing) styles.letterSpacing = node.letterSpacing;
    if (node.textAlignHorizontal) {
      const map = { LEFT: "left", CENTER: "center", RIGHT: "right", JUSTIFIED: "justify" };
      styles.align = map[node.textAlignHorizontal] || "left";
    }
    if (node.fills && Array.isArray(node.fills)) {
      const solid = node.fills.find((f) => f.type === "SOLID");
      if (solid && solid.color) {
        styles.color = solid.color;
      }
    }
    if (node.styledTextSegments && node.styledTextSegments.length > 1) {
      const rich = buildHtmlFromSegments(node);
      styles.customCss = rich.css;
    }
    return styles;
  }
  function extractContainerStyles(node) {
    const styles = {
      sourceId: node.id,
      sourceName: node.name
    };
    if (typeof node.itemSpacing === "number") styles.gap = node.itemSpacing;
    if (typeof node.height === "number") {
      styles.minHeight = node.height;
    }
    if (typeof node.paddingTop === "number" || typeof node.paddingRight === "number" || typeof node.paddingBottom === "number" || typeof node.paddingLeft === "number") {
      styles.paddingTop = node.paddingTop || 0;
      styles.paddingRight = node.paddingRight || 0;
      styles.paddingBottom = node.paddingBottom || 0;
      styles.paddingLeft = node.paddingLeft || 0;
    }
    const fills = node.fills;
    if (Array.isArray(fills) && fills.length > 0) {
      const solid = fills.find((f) => f.type === "SOLID" && f.color);
      if (solid) {
        const { r, g, b } = solid.color;
        const a = solid.opacity !== void 0 ? solid.opacity : 1;
        styles.background = { color: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})` };
      }
    }
    if (node.strokes && node.strokes.length > 0 && node.strokeWeight) {
      const stroke = node.strokes.find((s) => s.type === "SOLID" && s.visible !== false);
      if (stroke) {
        const { r, g, b } = stroke.color;
        const a = stroke.opacity !== void 0 ? stroke.opacity : 1;
        styles.border = {
          type: "solid",
          width: node.strokeWeight,
          color: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`,
          radius: typeof node.cornerRadius === "number" ? node.cornerRadius : 0
        };
      }
    } else if (typeof node.cornerRadius === "number" && node.cornerRadius > 0) {
      styles.border = { radius: node.cornerRadius };
    }
    const justifyMap = { MIN: "flex-start", CENTER: "center", MAX: "flex-end", SPACE_BETWEEN: "space-between" };
    const alignMap = { MIN: "flex-start", CENTER: "center", MAX: "flex-end", STRETCH: "stretch" };
    if (node.primaryAxisAlignItems) styles.justify_content = justifyMap[node.primaryAxisAlignItems] || void 0;
    if (node.counterAxisAlignItems) styles.align_items = alignMap[node.counterAxisAlignItems] || void 0;
    return styles;
  }
  var init_style_utils = __esm({
    "src/utils/style_utils.ts"() {
      init_serialization_utils();
    }
  });

  // src/api_gemini.ts
  function fetchWithTimeout(_0) {
    return __async(this, arguments, function* (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
      const AC = typeof AbortController === "function" ? AbortController : null;
      let controller = null;
      if (AC) {
        try {
          controller = new AC();
        } catch (e) {
          controller = null;
        }
      }
      if (!controller) {
        return yield fetch(url, options);
      }
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const resp = yield fetch(url, __spreadProps(__spreadValues({}, options), { signal: controller.signal }));
        return resp;
      } finally {
        clearTimeout(id);
      }
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
  function cleanJson(content) {
    return content.replace(/```json/gi, "").replace(/```/g, "").trim();
  }
  function parseGeminiJson(content) {
    const clean = cleanJson(content);
    return JSON.parse(clean);
  }
  var GEMINI_MODEL, API_BASE_URL, DEFAULT_TIMEOUT_MS, geminiProvider;
  var init_api_gemini = __esm({
    "src/api_gemini.ts"() {
      init_serialization_utils();
      GEMINI_MODEL = "gemini-1.5-flash-002";
      API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
      DEFAULT_TIMEOUT_MS = 12e3;
      geminiProvider = {
        id: "gemini",
        model: GEMINI_MODEL,
        setModel(model) {
          this.model = model;
          saveModel(model).catch(() => {
          });
        },
        generateSchema(input) {
          return __async(this, null, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            const apiKey = input.apiKey || (yield getKey());
            if (!apiKey) {
              return { ok: false, message: "API Key do Gemini nao configurada." };
            }
            const model = this.model || GEMINI_MODEL;
            const endpoint = `${API_BASE_URL}${model}:generateContent?key=${apiKey}`;
            const parts = [
              { text: input.instructions },
              { text: input.prompt },
              { text: `SNAPSHOT:
${JSON.stringify(input.snapshot)}` }
            ];
            if (input.references && input.references.length > 0) {
              const refText = input.references.map((ref) => `### ${ref.name}
${ref.content}`).join("\n\n");
              parts.push({ text: `REFERENCIAS:
${refText}` });
            }
            if ((_a = input.image) == null ? void 0 : _a.data) {
              parts.push({
                inlineData: {
                  data: input.image.data,
                  mimeType: input.image.mimeType || "image/png"
                }
              });
            }
            const contents = [{ parts }];
            const requestBody = {
              contents,
              generationConfig: {
                temperature: 0.15,
                maxOutputTokens: 8192,
                response_mime_type: "application/json"
              }
            };
            try {
              const response = yield fetchWithTimeout(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
              });
              if (!response.ok) {
                const rawText = yield response.text();
                let parsed = null;
                try {
                  parsed = JSON.parse(rawText);
                } catch (e) {
                  parsed = rawText;
                }
                const message = ((_b = parsed == null ? void 0 : parsed.error) == null ? void 0 : _b.message) || `HTTP ${response.status}`;
                return { ok: false, message: `Falha na API Gemini: ${message}`, raw: parsed };
              }
              const data = yield response.json();
              const text = (_g = (_f = (_e = (_d = (_c = data == null ? void 0 : data.candidates) == null ? void 0 : _c[0]) == null ? void 0 : _d.content) == null ? void 0 : _e.parts) == null ? void 0 : _f[0]) == null ? void 0 : _g.text;
              if (!text) {
                return { ok: false, message: "Resposta vazia da Gemini.", raw: data };
              }
              try {
                const schema = parseGeminiJson(text);
                return { ok: true, schema, raw: data };
              } catch (e) {
                try {
                  const repaired = repairJson(cleanJson(text));
                  const schema = JSON.parse(repaired);
                  return { ok: true, schema, raw: data };
                } catch (err) {
                  return { ok: false, message: "Resposta nao JSON da Gemini.", raw: text };
                }
              }
            } catch (err) {
              const aborted = (err == null ? void 0 : err.name) === "AbortError";
              const message = aborted ? "Timeout na chamada Gemini." : (err == null ? void 0 : err.message) || "Erro desconhecido na Gemini.";
              return { ok: false, message, raw: err };
            }
          });
        },
        testConnection(apiKey) {
          return __async(this, null, function* () {
            var _a;
            const keyToTest = apiKey || (yield getKey());
            if (!keyToTest) return { ok: false, message: "API Key nao configurada" };
            const endpoint = `${API_BASE_URL}?key=${keyToTest}`;
            try {
              const response = yield fetchWithTimeout(endpoint, { method: "GET" });
              if (!response.ok) {
                const errorData = yield response.json().catch(() => ({}));
                const message = ((_a = errorData == null ? void 0 : errorData.error) == null ? void 0 : _a.message) || `HTTP ${response.status}`;
                return { ok: false, message: `Falha na conexao: ${message}`, raw: errorData };
              }
              return { ok: true, message: "Conexao com Gemini verificada." };
            } catch (e) {
              const aborted = (e == null ? void 0 : e.name) === "AbortError";
              const baseMessage = aborted ? "Tempo limite ao testar conexao." : (e == null ? void 0 : e.message) || "Erro desconhecido";
              return { ok: false, message: baseMessage, raw: e };
            }
          });
        }
      };
    }
  });

  // src/utils/guid.ts
  function generateGUID() {
    const hex = Math.floor(Math.random() * 268435455).toString(16);
    return ("0000000" + hex).slice(-7);
  }
  var init_guid = __esm({
    "src/utils/guid.ts"() {
    }
  });

  // src/config/widget.registry.ts
  function slugFromKey(key) {
    if (!key) return "";
    return key.replace(/^w:/i, "").replace(/^woo:/i, "").replace(/^loop:/i, "").replace(/:/g, "-");
  }
  function stubDefinition(key, family = "misc") {
    const widgetType = slugFromKey(key);
    return {
      key,
      widgetType,
      family,
      aliases: [widgetType],
      compile: (_w, base) => ({ widgetType, settings: __spreadValues({}, base) })
    };
  }
  function findWidgetDefinition(type, kind) {
    const kindLower = kind ? kind.toLowerCase() : "";
    const typeLower = type.toLowerCase();
    const direct = registry.find((r) => r.key.toLowerCase() === typeLower || r.widgetType.toLowerCase() === typeLower);
    if (direct) return direct;
    if (kindLower) {
      const byKind = registry.find((r) => (r.aliases || []).some((a) => a.toLowerCase() === kindLower));
      if (byKind) return byKind;
    }
    return null;
  }
  function compileWithRegistry(widget, base) {
    const def = findWidgetDefinition(widget.type, widget.kind);
    if (!def) return null;
    return def.compile(widget, base);
  }
  var registry, basicWidgets, proWidgets, wooWidgets, loopWidgets, experimentalWidgets, wpWidgets;
  var init_widget_registry = __esm({
    "src/config/widget.registry.ts"() {
      registry = [
        {
          key: "heading",
          widgetType: "heading",
          family: "text",
          compile: (w, base) => {
            const color = base.color;
            return {
              widgetType: "heading",
              settings: __spreadValues(__spreadProps(__spreadValues({}, base), {
                title: w.content || "Heading"
              }), color ? { title_color: color } : {})
            };
          }
        },
        {
          key: "text",
          widgetType: "text-editor",
          family: "text",
          compile: (w, base) => {
            const color = base.color;
            return {
              widgetType: "text-editor",
              settings: __spreadValues(__spreadProps(__spreadValues({}, base), {
                editor: w.content || "Text"
              }), color ? { text_color: color } : {})
            };
          }
        },
        {
          key: "button",
          widgetType: "button",
          family: "action",
          compile: (w, base) => ({ widgetType: "button", settings: __spreadProps(__spreadValues({}, base), { text: w.content || "Button" }) })
        },
        {
          key: "image",
          widgetType: "image",
          family: "media",
          compile: (w, base) => {
            const imgId = w.imageId ? parseInt(w.imageId, 10) : 0;
            return {
              widgetType: "image",
              settings: __spreadProps(__spreadValues({}, base), {
                image: {
                  url: w.content || "",
                  id: isNaN(imgId) ? "" : imgId
                }
              })
            };
          }
        },
        {
          key: "icon",
          widgetType: "icon",
          family: "media",
          compile: (w, base) => ({
            widgetType: "icon",
            settings: __spreadProps(__spreadValues({}, base), { selected_icon: { value: w.content || "fas fa-star", library: "fa-solid" } })
          })
        },
        // Hint-based simples
        {
          key: "image_box",
          widgetType: "image-box",
          family: "media",
          aliases: ["image_box_like"],
          compile: (w, base) => {
            const imgId = w.imageId ? parseInt(w.imageId, 10) : 0;
            return {
              widgetType: "image-box",
              settings: __spreadProps(__spreadValues({}, base), {
                image: { url: base.image_url || "", id: isNaN(imgId) ? "" : imgId },
                title_text: w.content || base.title_text || "Title",
                description_text: base.description_text || ""
              })
            };
          }
        },
        {
          key: "icon_box",
          widgetType: "icon-box",
          family: "media",
          aliases: ["icon_box_like"],
          compile: (w, base) => ({
            widgetType: "icon-box",
            settings: __spreadProps(__spreadValues({}, base), {
              selected_icon: base.selected_icon || { value: "fas fa-star", library: "fa-solid" },
              title_text: w.content || base.title_text || "Title",
              description_text: base.description_text || ""
            })
          })
        },
        {
          key: "icon_list",
          widgetType: "icon-list",
          family: "media",
          aliases: ["icon_list_like", "list_like"],
          compile: (_w, base) => ({ widgetType: "icon-list", settings: __spreadValues({}, base) })
        },
        {
          key: "video",
          widgetType: "video",
          family: "media",
          compile: (w, base) => ({ widgetType: "video", settings: __spreadProps(__spreadValues({}, base), { link: w.content || "" }) })
        },
        {
          key: "divider",
          widgetType: "divider",
          family: "misc",
          compile: (_w, base) => ({ widgetType: "divider", settings: __spreadValues({}, base) })
        },
        {
          key: "spacer",
          widgetType: "spacer",
          family: "misc",
          compile: (_w, base) => {
            var _a;
            return { widgetType: "spacer", settings: __spreadProps(__spreadValues({}, base), { space: (_a = base.space) != null ? _a : 20 }) };
          }
        },
        {
          key: "star-rating",
          widgetType: "star-rating",
          family: "misc",
          compile: (w, base) => ({ widgetType: "star-rating", settings: __spreadProps(__spreadValues({}, base), { rating: Number(w.content) || 5 }) })
        },
        {
          key: "counter",
          widgetType: "counter",
          family: "misc",
          compile: (w, base) => ({
            widgetType: "counter",
            settings: __spreadProps(__spreadValues({}, base), {
              starting_number: 0,
              ending_number: Number(w.content) || 100,
              prefix: base.prefix,
              suffix: base.suffix
            })
          })
        },
        {
          key: "progress",
          widgetType: "progress",
          family: "misc",
          compile: (w, base) => ({
            widgetType: "progress",
            settings: __spreadProps(__spreadValues({}, base), { title: w.content || base.title || "Progresso", percent: Number(base.percent) || 50 })
          })
        },
        {
          key: "tabs",
          widgetType: "tabs",
          family: "misc",
          compile: (w, base) => ({
            widgetType: "tabs",
            settings: __spreadProps(__spreadValues({}, base), {
              tabs: base.tabs || [{ _id: "tab1", tab_title: "Aba 1", tab_content: w.content || "Conte\xFAdo" }]
            })
          })
        },
        {
          key: "accordion",
          widgetType: "accordion",
          family: "misc",
          compile: (w, base) => ({
            widgetType: "accordion",
            settings: __spreadProps(__spreadValues({}, base), {
              accordion: base.accordion || [{ _id: "acc1", title: "Item 1", content: w.content || "Conte\xFAdo" }]
            })
          })
        },
        {
          key: "toggle",
          widgetType: "toggle",
          family: "misc",
          compile: (w, base) => ({
            widgetType: "toggle",
            settings: __spreadProps(__spreadValues({}, base), {
              toggle: base.toggle || [{ _id: "tog1", title: "Item 1", content: w.content || "Conte\xFAdo" }]
            })
          })
        },
        {
          key: "alert",
          widgetType: "alert",
          family: "misc",
          compile: (w, base) => ({
            widgetType: "alert",
            settings: __spreadProps(__spreadValues({}, base), { alert_type: base.alert_type || "info", title: w.content || base.title || "Alerta" })
          })
        },
        {
          key: "social-icons",
          widgetType: "social-icons",
          family: "misc",
          compile: (_w, base) => ({
            widgetType: "social-icons",
            settings: __spreadProps(__spreadValues({}, base), {
              social_icon_list: base.social_icon_list || [
                { _id: "soc1", icon: { value: "fab fa-facebook", library: "fa-brands" }, link: { url: "" } }
              ]
            })
          })
        },
        {
          key: "soundcloud",
          widgetType: "soundcloud",
          family: "media",
          compile: (w, base) => ({ widgetType: "soundcloud", settings: __spreadProps(__spreadValues({}, base), { url: w.content || base.url || "" }) })
        },
        {
          key: "shortcode",
          widgetType: "shortcode",
          family: "misc",
          compile: (w, base) => ({ widgetType: "shortcode", settings: __spreadProps(__spreadValues({}, base), { shortcode: w.content || base.shortcode || "" }) })
        },
        {
          key: "menu-anchor",
          widgetType: "menu-anchor",
          family: "nav",
          compile: (w, base) => ({ widgetType: "menu-anchor", settings: __spreadProps(__spreadValues({}, base), { anchor: w.content || base.anchor || "ancora" }) })
        },
        {
          key: "sidebar",
          widgetType: "sidebar",
          family: "misc",
          compile: (w, base) => ({ widgetType: "sidebar", settings: __spreadProps(__spreadValues({}, base), { sidebar: w.content || base.sidebar || "sidebar-1" }) })
        },
        {
          key: "read-more",
          widgetType: "read-more",
          family: "action",
          compile: (w, base) => ({ widgetType: "read-more", settings: __spreadProps(__spreadValues({}, base), { text: w.content || base.text || "Leia mais" }) })
        },
        {
          key: "image-carousel",
          widgetType: "image-carousel",
          family: "media",
          compile: (w, base) => {
            const slides = base.slides;
            const fallbackSlide = {
              id: w.imageId && !isNaN(parseInt(w.imageId, 10)) ? parseInt(w.imageId, 10) : "",
              url: w.content || "",
              image: { url: w.content || "", id: w.imageId || "" },
              _id: "slide1"
            };
            const normalizedSlides = Array.isArray(slides) && slides.length > 0 ? slides.map((s, i) => {
              var _a;
              return {
                _id: s._id || `slide_${i + 1}`,
                id: (() => {
                  var _a2, _b;
                  const raw = (_b = s.id) != null ? _b : (_a2 = s.image) == null ? void 0 : _a2.id;
                  const parsed = raw !== void 0 ? parseInt(String(raw), 10) : NaN;
                  return isNaN(parsed) ? "" : parsed;
                })(),
                url: s.url || ((_a = s.image) == null ? void 0 : _a.url) || "",
                image: (() => {
                  var _a2, _b, _c;
                  const url = s.url || ((_a2 = s.image) == null ? void 0 : _a2.url) || "";
                  const raw = (_c = s.id) != null ? _c : (_b = s.image) == null ? void 0 : _b.id;
                  const parsed = raw !== void 0 ? parseInt(String(raw), 10) : NaN;
                  const id = isNaN(parsed) ? "" : parsed;
                  return { url, id };
                })()
              };
            }) : [fallbackSlide];
            return {
              widgetType: "image-carousel",
              settings: __spreadProps(__spreadValues({}, base), {
                slides: normalizedSlides
              })
            };
          }
        },
        {
          key: "basic-gallery",
          widgetType: "basic-gallery",
          family: "media",
          compile: (w, base) => ({
            widgetType: "basic-gallery",
            settings: __spreadProps(__spreadValues({}, base), {
              gallery: base.gallery || [{
                id: w.imageId && !isNaN(parseInt(w.imageId, 10)) ? parseInt(w.imageId, 10) : "",
                url: w.content || ""
              }]
            })
          })
        },
        {
          key: "media:carousel",
          widgetType: "image-carousel",
          family: "media",
          compile: (w, base) => {
            const slides = base.slides;
            const fallbackSlide = {
              id: w.imageId && !isNaN(parseInt(w.imageId, 10)) ? parseInt(w.imageId, 10) : "",
              url: w.content || "",
              image: { url: w.content || "", id: w.imageId || "" },
              _id: "slide1"
            };
            const normalizedSlides = Array.isArray(slides) && slides.length > 0 ? slides.map((s, i) => {
              var _a;
              return {
                _id: s._id || `slide_${i + 1}`,
                id: (() => {
                  var _a2, _b;
                  const raw = (_b = s.id) != null ? _b : (_a2 = s.image) == null ? void 0 : _a2.id;
                  const parsed = raw !== void 0 ? parseInt(String(raw), 10) : NaN;
                  return isNaN(parsed) ? "" : parsed;
                })(),
                url: s.url || ((_a = s.image) == null ? void 0 : _a.url) || "",
                image: (() => {
                  var _a2, _b, _c;
                  const url = s.url || ((_a2 = s.image) == null ? void 0 : _a2.url) || "";
                  const raw = (_c = s.id) != null ? _c : (_b = s.image) == null ? void 0 : _b.id;
                  const parsed = raw !== void 0 ? parseInt(String(raw), 10) : NaN;
                  const id = isNaN(parsed) ? "" : parsed;
                  return { url, id };
                })()
              };
            }) : [fallbackSlide];
            return {
              widgetType: "image-carousel",
              settings: __spreadProps(__spreadValues({}, base), {
                slides: normalizedSlides
              })
            };
          }
        },
        {
          key: "slider:slides",
          widgetType: "image-carousel",
          family: "media",
          compile: (w, base) => {
            const slides = base.slides;
            const fallbackSlide = {
              id: w.imageId && !isNaN(parseInt(w.imageId, 10)) ? parseInt(w.imageId, 10) : "",
              url: w.content || "",
              image: { url: w.content || "", id: w.imageId || "" },
              _id: "slide1"
            };
            const normalizedSlides = Array.isArray(slides) && slides.length > 0 ? slides.map((s, i) => {
              var _a;
              return {
                _id: s._id || `slide_${i + 1}`,
                id: (() => {
                  var _a2, _b;
                  const raw = (_b = s.id) != null ? _b : (_a2 = s.image) == null ? void 0 : _a2.id;
                  const parsed = raw !== void 0 ? parseInt(String(raw), 10) : NaN;
                  return isNaN(parsed) ? "" : parsed;
                })(),
                url: s.url || ((_a = s.image) == null ? void 0 : _a.url) || "",
                image: (() => {
                  var _a2, _b, _c;
                  const url = s.url || ((_a2 = s.image) == null ? void 0 : _a2.url) || "";
                  const raw = (_c = s.id) != null ? _c : (_b = s.image) == null ? void 0 : _b.id;
                  const parsed = raw !== void 0 ? parseInt(String(raw), 10) : NaN;
                  const id = isNaN(parsed) ? "" : parsed;
                  return { url, id };
                })()
              };
            }) : [fallbackSlide];
            return {
              widgetType: "image-carousel",
              settings: __spreadProps(__spreadValues({}, base), {
                slides: normalizedSlides
              })
            };
          }
        },
        {
          key: "w:slideshow",
          widgetType: "image-carousel",
          family: "media",
          compile: (w, base) => {
            const slides = base.slides;
            const fallbackSlide = {
              id: w.imageId && !isNaN(parseInt(w.imageId, 10)) ? parseInt(w.imageId, 10) : "",
              url: w.content || "",
              image: { url: w.content || "", id: w.imageId || "" },
              _id: "slide1"
            };
            const normalizedSlides = Array.isArray(slides) && slides.length > 0 ? slides.map((s, i) => {
              var _a;
              return {
                _id: s._id || `slide_${i + 1}`,
                id: (() => {
                  var _a2, _b;
                  const raw = (_b = s.id) != null ? _b : (_a2 = s.image) == null ? void 0 : _a2.id;
                  const parsed = raw !== void 0 ? parseInt(String(raw), 10) : NaN;
                  return isNaN(parsed) ? "" : parsed;
                })(),
                url: s.url || ((_a = s.image) == null ? void 0 : _a.url) || "",
                image: (() => {
                  var _a2, _b, _c;
                  const url = s.url || ((_a2 = s.image) == null ? void 0 : _a2.url) || "";
                  const raw = (_c = s.id) != null ? _c : (_b = s.image) == null ? void 0 : _b.id;
                  const parsed = raw !== void 0 ? parseInt(String(raw), 10) : NaN;
                  const id = isNaN(parsed) ? "" : parsed;
                  return { url, id };
                })()
              };
            }) : [fallbackSlide];
            return {
              widgetType: "image-carousel",
              settings: __spreadProps(__spreadValues({}, base), {
                slides: normalizedSlides
              })
            };
          }
        },
        {
          key: "gallery",
          widgetType: "gallery",
          family: "media",
          compile: (w, base) => ({
            widgetType: "gallery",
            settings: __spreadProps(__spreadValues({}, base), {
              gallery: base.gallery || [{
                id: w.imageId && !isNaN(parseInt(w.imageId, 10)) ? parseInt(w.imageId, 10) : "",
                url: w.content || ""
              }]
            })
          })
        },
        {
          key: "nav-menu",
          widgetType: "nav-menu",
          family: "nav",
          compile: (w, base) => ({ widgetType: "nav-menu", settings: __spreadProps(__spreadValues({}, base), { layout: base.layout || "horizontal", menu: w.content || base.menu }) })
        },
        {
          key: "search-form",
          widgetType: "search-form",
          family: "misc",
          compile: (_w, base) => ({ widgetType: "search-form", settings: __spreadValues({}, base) })
        },
        {
          key: "google-maps",
          widgetType: "google-maps",
          family: "media",
          compile: (w, base) => ({ widgetType: "google-maps", settings: __spreadProps(__spreadValues({}, base), { address: w.content || base.address || "" }) })
        },
        {
          key: "testimonial",
          widgetType: "testimonial",
          family: "misc",
          compile: (w, base) => ({
            widgetType: "testimonial",
            settings: __spreadProps(__spreadValues({}, base), { testimonial_content: w.content || base.testimonial_content || "Depoimento" })
          })
        },
        {
          key: "embed",
          widgetType: "embed",
          family: "media",
          compile: (w, base) => ({ widgetType: "embed", settings: __spreadProps(__spreadValues({}, base), { embed_url: w.content || base.embed_url || "" }) })
        },
        {
          key: "lottie",
          widgetType: "lottie",
          family: "media",
          compile: (w, base) => ({ widgetType: "lottie", settings: __spreadProps(__spreadValues({}, base), { lottie_url: w.content || base.lottie_url || "" }) })
        },
        {
          key: "html",
          widgetType: "html",
          family: "misc",
          aliases: ["custom"],
          compile: (w, base) => ({ widgetType: "html", settings: __spreadProps(__spreadValues({}, base), { html: w.content || "" }) })
        }
      ];
      basicWidgets = [
        "w:container",
        "w:inner-container",
        "w:video",
        "w:divider",
        "w:spacer",
        "w:image-box",
        "w:star-rating",
        "w:counter",
        "w:progress",
        "w:tabs",
        "w:accordion",
        "w:toggle",
        "w:alert",
        "w:social-icons",
        "w:soundcloud",
        "w:shortcode",
        "w:menu-anchor",
        "w:sidebar",
        "w:read-more",
        "w:image-carousel",
        "w:basic-gallery",
        "w:gallery",
        "w:icon-list",
        "w:nav-menu",
        "w:search-form",
        "w:google-maps",
        "w:testimonial",
        "w:embed",
        "w:lottie",
        "loop:grid"
      ];
      proWidgets = [
        "w:form",
        "w:login",
        "w:subscription",
        "w:call-to-action",
        "media:carousel",
        "w:portfolio",
        "w:gallery-pro",
        "slider:slides",
        "w:slideshow",
        "w:flip-box",
        "w:animated-headline",
        "w:post-navigation",
        "w:share-buttons",
        "w:table-of-contents",
        "w:countdown",
        "w:blockquote",
        "w:testimonial-carousel",
        "w:review-box",
        "w:hotspots",
        "w:sitemap",
        "w:author-box",
        "w:price-table",
        "w:price-list",
        "w:progress-tracker",
        "w:animated-text",
        "w:nav-menu-pro",
        "w:breadcrumb",
        "w:facebook-button",
        "w:facebook-comments",
        "w:facebook-embed",
        "w:facebook-page",
        "loop:builder",
        "loop:grid-advanced",
        "loop:carousel",
        "w:post-excerpt",
        "w:post-content",
        "w:post-title",
        "w:post-info",
        "w:post-featured-image",
        "w:post-author",
        "w:post-date",
        "w:post-terms",
        "w:archive-title",
        "w:archive-description",
        "w:site-logo",
        "w:site-title",
        "w:site-tagline",
        "w:search-results",
        "w:global-widget",
        "w:video-playlist",
        "w:video-gallery"
      ];
      wooWidgets = [
        "woo:product-title",
        "woo:product-image",
        "woo:product-price",
        "woo:product-add-to-cart",
        "woo:product-data-tabs",
        "woo:product-excerpt",
        "woo:product-rating",
        "woo:product-stock",
        "woo:product-meta",
        "woo:product-additional-information",
        "woo:product-short-description",
        "woo:product-related",
        "woo:product-upsells",
        "woo:product-tabs",
        "woo:product-breadcrumb",
        "woo:product-gallery",
        "woo:products",
        "woo:product-grid",
        "woo:product-carousel",
        "woo:product-loop-item",
        "woo:loop-product-title",
        "woo:loop-product-price",
        "woo:loop-product-rating",
        "woo:loop-product-image",
        "woo:loop-product-button",
        "woo:loop-product-meta",
        "woo:cart",
        "woo:checkout",
        "woo:my-account",
        "woo:purchase-summary",
        "woo:order-tracking"
      ];
      loopWidgets = [
        "loop:item",
        "loop:image",
        "loop:title",
        "loop:meta",
        "loop:terms",
        "loop:rating",
        "loop:price",
        "loop:add-to-cart",
        "loop:read-more",
        "loop:featured-image"
      ];
      experimentalWidgets = [
        "w:nested-tabs",
        "w:mega-menu",
        "w:scroll-snap",
        "w:motion-effects",
        "w:background-slideshow",
        "w:css-transform",
        "w:custom-position",
        "w:dynamic-tags",
        "w:ajax-pagination",
        "loop:pagination",
        "w:aspect-ratio-container"
      ];
      wpWidgets = [
        "w:wp-search",
        "w:wp-recent-posts",
        "w:wp-recent-comments",
        "w:wp-archives",
        "w:wp-categories",
        "w:wp-calendar",
        "w:wp-tag-cloud",
        "w:wp-custom-menu"
      ];
      basicWidgets.forEach((k) => registry.push(stubDefinition(k, "misc")));
      proWidgets.forEach((k) => registry.push(stubDefinition(k, "pro")));
      wooWidgets.forEach((k) => registry.push(stubDefinition(k, "woo")));
      loopWidgets.forEach((k) => registry.push(stubDefinition(k, "loop")));
      experimentalWidgets.forEach((k) => registry.push(stubDefinition(k, "misc")));
      wpWidgets.forEach((k) => registry.push(stubDefinition(k, "wp")));
    }
  });

  // src/compiler/elementor.compiler.ts
  var ElementorCompiler;
  var init_elementor_compiler = __esm({
    "src/compiler/elementor.compiler.ts"() {
      init_guid();
      init_widget_registry();
      ElementorCompiler = class {
        constructor() {
          this.wpConfig = {};
        }
        setWPConfig(config) {
          this.wpConfig = config;
        }
        sanitizeColor(value) {
          if (!value) return void 0;
          if (typeof value === "string") return value;
          if (typeof value === "object" && value.r !== void 0 && value.g !== void 0 && value.b !== void 0) {
            const r = Math.round((value.r || 0) * 255);
            const g = Math.round((value.g || 0) * 255);
            const b = Math.round((value.b || 0) * 255);
            const a = value.a !== void 0 ? value.a : 1;
            return `rgba(${r}, ${g}, ${b}, ${a})`;
          }
          return void 0;
        }
        compile(schema) {
          var _a;
          const elements = schema.containers.map((container) => this.compileContainer(container, false));
          const template = {
            type: "elementor",
            version: "0.4",
            siteurl: ((_a = this.wpConfig) == null ? void 0 : _a.url) || "",
            elements
          };
          return template;
        }
        compileContainer(container, isInner) {
          const id = generateGUID();
          const flexDirection = container.direction === "row" ? "row" : "column";
          const settings = __spreadValues({
            _element_id: id,
            container_type: "flex",
            content_width: container.width === "full" ? "full" : "boxed",
            flex_direction: flexDirection,
            flex__is_row: "row",
            flex__is_column: "column"
          }, this.mapContainerStyles(container.styles));
          if (!settings.flex_gap) {
            settings.flex_gap = { unit: "px", size: 0, column: "0", row: "0", isLinked: true };
          }
          if (!settings.justify_content) settings.justify_content = "flex-start";
          if (!settings.align_items) settings.align_items = "flex-start";
          settings.flex_justify_content = settings.justify_content;
          settings.flex_align_items = settings.align_items;
          const widgetElements = container.widgets.map((w) => {
            var _a, _b;
            return { order: (_b = (_a = w.styles) == null ? void 0 : _a._order) != null ? _b : 0, el: this.compileWidget(w) };
          });
          const childContainers = container.children.map((child) => {
            var _a, _b;
            return { order: (_b = (_a = child.styles) == null ? void 0 : _a._order) != null ? _b : 0, el: this.compileContainer(child, true) };
          });
          const merged = [...widgetElements, ...childContainers].sort((a, b) => a.order - b.order).map((i) => i.el);
          return {
            id,
            elType: "container",
            isInner,
            isLocked: false,
            settings,
            defaultEditSettings: { defaultEditRoute: "content" },
            elements: merged
          };
        }
        mapContainerStyles(styles) {
          const settings = {};
          if (!styles) return settings;
          const normalizeFlexValue = (value) => {
            if (!value) return void 0;
            if (value === "start") return "flex-start";
            if (value === "end") return "flex-end";
            return value;
          };
          if (styles.justify_content) {
            settings.justify_content = normalizeFlexValue(styles.justify_content);
            settings.flex_justify_content = settings.justify_content;
          }
          if (styles.align_items) {
            settings.align_items = normalizeFlexValue(styles.align_items);
            settings.flex_align_items = settings.align_items;
          }
          if (styles.gap !== void 0) {
            settings.flex_gap = {
              unit: "px",
              size: styles.gap,
              column: String(styles.gap),
              row: String(styles.gap),
              isLinked: true
            };
          }
          if (typeof styles.paddingTop === "number" || typeof styles.paddingRight === "number" || typeof styles.paddingBottom === "number" || typeof styles.paddingLeft === "number") {
            settings.padding = {
              unit: "px",
              top: styles.paddingTop || 0,
              right: styles.paddingRight || 0,
              bottom: styles.paddingBottom || 0,
              left: styles.paddingLeft || 0,
              isLinked: false
            };
          }
          if (styles.background) {
            const bg = styles.background;
            const sanitizedColor = this.sanitizeColor(bg.color);
            if (sanitizedColor) {
              settings.background_background = "classic";
              settings.background_color = sanitizedColor;
            }
            if (bg.image) {
              settings.background_background = "classic";
              settings.background_image = { url: bg.image, id: 0 };
            }
            if (bg.gradient) {
              settings.background_background = "gradient";
            }
          }
          if (styles.width) {
            settings.width = { unit: "px", size: styles.width, sizes: [] };
          }
          if (styles.minHeight) {
            settings.min_height = { unit: "px", size: styles.minHeight, sizes: [] };
          }
          if (styles.primaryAxisAlignItems) {
            const map = { MIN: "start", CENTER: "center", MAX: "end", SPACE_BETWEEN: "space-between" };
            settings.justify_content = settings.justify_content || map[styles.primaryAxisAlignItems] || "start";
          }
          if (styles.counterAxisAlignItems) {
            const map = { MIN: "start", CENTER: "center", MAX: "end", STRETCH: "stretch" };
            settings.align_items = settings.align_items || map[styles.counterAxisAlignItems] || "start";
          }
          if (styles.border) {
            const b = styles.border;
            if (b.type) settings.border_border = b.type;
            if (b.width) settings.border_width = { unit: "px", top: b.width, right: b.width, bottom: b.width, left: b.width, isLinked: true };
            if (b.color) settings.border_color = b.color;
            if (b.radius) settings.border_radius = { unit: "px", top: b.radius, right: b.radius, bottom: b.radius, left: b.radius, isLinked: true };
          } else if (styles.cornerRadius) {
            settings.border_radius = { unit: "px", top: styles.cornerRadius, right: styles.cornerRadius, bottom: styles.cornerRadius, left: styles.cornerRadius, isLinked: true };
          }
          return settings;
        }
        mapTypography(styles, prefix = "typography") {
          const s = {};
          if (styles.fontName || styles.fontSize || styles.fontWeight || styles.lineHeight || styles.letterSpacing) {
            s[`${prefix}_typography`] = "custom";
          }
          if (styles.fontName) {
            s[`${prefix}_font_family`] = styles.fontName.family;
            s[`${prefix}_font_weight`] = styles.fontWeight || 400;
          }
          if (styles.fontSize) s[`${prefix}_font_size`] = { unit: "px", size: styles.fontSize };
          if (styles.lineHeight && styles.lineHeight.unit !== "AUTO") s[`${prefix}_line_height`] = { unit: "px", size: styles.lineHeight.value };
          if (styles.letterSpacing && styles.letterSpacing.value !== 0) s[`${prefix}_letter_spacing`] = { unit: "px", size: styles.letterSpacing.value };
          if (styles.textDecoration) s[`${prefix}_text_decoration`] = styles.textDecoration.toLowerCase();
          if (styles.textCase) s[`${prefix}_text_transform`] = styles.textCase === "UPPER" ? "uppercase" : styles.textCase === "LOWER" ? "lowercase" : "none";
          return s;
        }
        sanitizeSettings(raw) {
          const out = {};
          const ignoredKeys = [
            "fontName",
            "fontSize",
            "fontWeight",
            "lineHeight",
            "letterSpacing",
            "textDecoration",
            "textCase",
            "paragraphIndent",
            "paragraphSpacing",
            "fills",
            "strokes",
            "effects",
            "layoutMode",
            "primaryAxisAlignItems",
            "counterAxisAlignItems",
            "primaryAxisSizingMode",
            "counterAxisSizingMode",
            "paddingTop",
            "paddingRight",
            "paddingBottom",
            "paddingLeft",
            "itemSpacing",
            "gap",
            "background",
            "border",
            "cornerRadius",
            "width",
            "height",
            "sourceId",
            "sourceName",
            "_order"
          ];
          Object.keys(raw).forEach((k) => {
            if (ignoredKeys.includes(k)) return;
            const v = raw[k];
            if (k.toLowerCase().includes("color")) {
              const sanitized = this.sanitizeColor(v);
              if (sanitized) out[k] = sanitized;
            } else {
              out[k] = v;
            }
          });
          return out;
        }
        looksLikeIconUrl(value) {
          if (typeof value !== "string") return false;
          const trimmed = value.trim();
          return /^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.endsWith(".svg") || trimmed.startsWith("<svg");
        }
        normalizeSelectedIcon(icon, imageId, fallback = { value: "fas fa-star", library: "fa-solid" }) {
          var _a;
          if (!icon) return __spreadValues({}, fallback);
          const rawValue = icon.value || icon.url || icon.icon || icon;
          const normalized = __spreadProps(__spreadValues(__spreadValues({}, fallback), icon), { value: rawValue });
          if (this.looksLikeIconUrl(rawValue)) {
            const parsedId = imageId !== void 0 ? parseInt(String(imageId), 10) : (_a = icon.id) != null ? _a : icon.wpId;
            normalized.library = "svg";
            normalized.value = {
              url: rawValue,
              id: isNaN(parsedId) ? "" : parsedId
            };
          } else if (!normalized.library) {
            normalized.library = fallback.library;
          }
          return normalized;
        }
        normalizeIconList(settings) {
          if (!Array.isArray(settings.icon_list)) return settings;
          settings.icon_list = settings.icon_list.map((item, idx) => {
            var _a, _b, _c, _d, _e, _f;
            const normalizedIcon = this.normalizeSelectedIcon(
              item.icon || item.selected_icon || item,
              item.imageId || ((_a = item.icon) == null ? void 0 : _a.id) || ((_b = item.selected_icon) == null ? void 0 : _b.id),
              { value: ((_c = item == null ? void 0 : item.icon) == null ? void 0 : _c.value) || ((_d = item == null ? void 0 : item.selected_icon) == null ? void 0 : _d.value) || "fas fa-check", library: ((_e = item == null ? void 0 : item.icon) == null ? void 0 : _e.library) || ((_f = item == null ? void 0 : item.selected_icon) == null ? void 0 : _f.library) || "fa-solid" }
            );
            return __spreadProps(__spreadValues({
              _id: item._id || `icon_item_${idx + 1}`
            }, item), {
              icon: normalizedIcon,
              selected_icon: normalizedIcon
            });
          });
          return settings;
        }
        normalizeIconSettings(widgetType, settings, widget) {
          var _a, _b;
          const normalized = __spreadValues({}, settings);
          if (widgetType === "icon" || widgetType === "icon-box") {
            const imageId = (widget == null ? void 0 : widget.imageId) || ((_a = normalized.selected_icon) == null ? void 0 : _a.id) || ((_b = normalized.selected_icon) == null ? void 0 : _b.wpId);
            normalized.selected_icon = this.normalizeSelectedIcon(normalized.selected_icon, imageId);
          }
          if (widgetType === "icon-list") {
            this.normalizeIconList(normalized);
          }
          return normalized;
        }
        compileWidget(widget) {
          var _a, _b, _c;
          const widgetId = generateGUID();
          const baseSettings = __spreadValues({ _element_id: widgetId }, this.sanitizeSettings(widget.styles || {}));
          Object.assign(baseSettings, this.mapTypography(widget.styles || {}));
          if ((_a = widget.styles) == null ? void 0 : _a.customCss) {
            baseSettings.custom_css = widget.styles.customCss;
          }
          if ((_b = widget.styles) == null ? void 0 : _b.align) {
            baseSettings.align = widget.styles.align;
          }
          const registryResult = compileWithRegistry(widget, baseSettings);
          if (registryResult) {
            const normalizedSettings = this.normalizeIconSettings(registryResult.widgetType, registryResult.settings, widget);
            return {
              id: widgetId,
              elType: "widget",
              isLocked: false,
              widgetType: registryResult.widgetType,
              settings: normalizedSettings,
              defaultEditSettings: { defaultEditRoute: "content" },
              elements: []
            };
          }
          let widgetType = widget.type;
          const settings = __spreadValues({}, baseSettings);
          switch (widget.type) {
            case "heading":
              widgetType = "heading";
              settings.title = widget.content || "Heading";
              if (baseSettings.color) settings.title_color = baseSettings.color;
              break;
            case "text":
              widgetType = "text-editor";
              settings.editor = widget.content || "";
              if (baseSettings.color) settings.text_color = baseSettings.color;
              break;
            case "button":
              widgetType = "button";
              settings.text = widget.content || "Button";
              Object.assign(settings, this.mapTypography(widget.styles || {}, "typography"));
              break;
            case "image":
              widgetType = "image";
              const imgId = widget.imageId ? parseInt(widget.imageId, 10) : 0;
              const finalId = isNaN(imgId) ? "" : imgId;
              settings.image = {
                url: widget.content || "",
                id: finalId
              };
              break;
            case "icon":
              widgetType = "icon";
              settings.selected_icon = this.normalizeSelectedIcon(((_c = widget.styles) == null ? void 0 : _c.selected_icon) || baseSettings.selected_icon || widget.content, widget.imageId);
              break;
            case "custom":
            default:
              widgetType = "html";
              settings.html = widget.content || "";
              break;
          }
          const finalSettings = this.normalizeIconSettings(widgetType, settings, widget);
          return {
            id: widgetId,
            elType: "widget",
            isLocked: false,
            widgetType,
            settings: finalSettings,
            defaultEditSettings: { defaultEditRoute: "content" },
            elements: []
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
          this.wpConfig = __spreadProps(__spreadValues({}, wpConfig), {
            password: (wpConfig == null ? void 0 : wpConfig.password) || (wpConfig == null ? void 0 : wpConfig.token)
          });
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

  // src/utils/validation.ts
  function validatePipelineSchema(schema) {
    if (!schema || typeof schema !== "object") {
      throw new Error("Schema invalido: nao e um objeto.");
    }
    if (!schema.page || typeof schema.page !== "object") {
      throw new Error("Schema invalido: campo page ausente.");
    }
    if (!Array.isArray(schema.containers)) {
      throw new Error("Schema invalido: containers deve ser array.");
    }
    schema.containers.forEach(validateContainer);
  }
  function validateContainer(container) {
    if (typeof container.id !== "string") throw new Error("Container sem id.");
    if (container.direction !== "row" && container.direction !== "column") {
      throw new Error(`Container ${container.id} com direction invalido.`);
    }
    if (container.width !== "full" && container.width !== "boxed") {
      throw new Error(`Container ${container.id} com width invalido: ${JSON.stringify(container.width)}`);
    }
    if (!Array.isArray(container.widgets) || !Array.isArray(container.children)) {
      throw new Error(`Container ${container.id} sem widgets/children array.`);
    }
    container.widgets.forEach(validateWidget);
    container.children.forEach(validateContainer);
  }
  function validateWidget(widget) {
    if (!widget || typeof widget.type !== "string" || widget.type.length === 0) {
      throw new Error(`Widget com tipo invalido: ${widget == null ? void 0 : widget.type}`);
    }
  }
  function validateElementorJSON(json) {
    if (!json || typeof json !== "object") throw new Error("Elementor JSON invalido: nao e um objeto.");
    const content = json.content || json.elements;
    if (!Array.isArray(content)) throw new Error("Elementor JSON invalido: content/elements deve ser array.");
    if (!json.elements) json.elements = content;
    if (!json.content) json.content = content;
    content.forEach((el) => validateElement(el));
  }
  function validateElement(el) {
    if (!el.id || !el.elType) throw new Error("Elemento Elementor sem id ou elType.");
    if (!Array.isArray(el.elements)) throw new Error(`Elemento ${el.id} sem elements array.`);
    if (!el.settings) throw new Error(`Elemento ${el.id} sem settings.`);
    if (el.elType !== "container" && el.elType !== "widget") throw new Error(`Elemento ${el.id} com elType invalido.`);
    el.elements.forEach((child) => validateElement(child));
  }
  function computeCoverage(serializedFlat, schema, elementor) {
    var _a;
    const n_nodes_origem = serializedFlat.length;
    let n_widgets_schema = 0;
    let n_containers_schema = 0;
    const walkSchema = (c) => {
      n_containers_schema++;
      n_widgets_schema += c.widgets.length;
      c.children.forEach(walkSchema);
    };
    schema.containers.forEach(walkSchema);
    let n_elements_elementor = 0;
    const walkEl = (el) => {
      n_elements_elementor++;
      el.elements.forEach(walkEl);
    };
    (_a = elementor.elements) == null ? void 0 : _a.forEach(walkEl);
    return { n_nodes_origem, n_widgets_schema, n_containers_schema, n_elements_elementor };
  }
  var init_validation = __esm({
    "src/utils/validation.ts"() {
    }
  });

  // src/config/prompts.ts
  var OPTIMIZE_SCHEMA_PROMPT;
  var init_prompts = __esm({
    "src/config/prompts.ts"() {
      OPTIMIZE_SCHEMA_PROMPT = `
Voc\xEA \xE9 um especialista em Elementor e Otimiza\xE7\xE3o Sem\xE2ntica.
Sua tarefa \xE9 analisar um SCHEMA JSON existente (gerado por um algoritmo) e melhor\xE1-lo semanticamente.

ENTRADA:
Um JSON representando uma estrutura de containers e widgets b\xE1sicos.

OBJETIVO:
Identificar padr\xF5es visuais que correspondam a widgets Elementor mais ricos e substituir a estrutura b\xE1sica por esses widgets, MANTENDO OS DADOS E IDs.

REGRAS CR\xCDTICAS (N\xC3O QUEBRE O SCHEMA):
1.  **N\xC3O REMOVA IDs**: Os IDs (sourceId, id) s\xE3o fundamentais para o link com o Figma. Mantenha-os.
2.  **N\xC3O ALTERE IMAGENS**: Se o input tem um widget type="image" com um imageId, MANTENHA-O. N\xE3o transforme em HTML ou Texto.
3.  **N\xC3O ALTERE TEXTOS**: Mantenha o conte\xFAdo dos textos exato.

4.  **N\xC3O DUPLIQUE NENHUM NODE**: para cada container ou widget do SCHEMA BASE (identificado por id e/ou styles.sourceId), mantenha no m\xE1ximo UMA inst\xE2ncia correspondente no schema otimizado. \xC9 proibido gerar dois containers/widgets diferentes com o mesmo id ou styles.sourceId.
5.  **N\xC3O CRIE NODES NOVOS**: n\xE3o invente containers ou widgets para nodes que n\xE3o existam no SCHEMA BASE. Se precisar agrupar logicamente, use apenas estruturas j\xE1 existentes, sem adicionar novos IDs.
6.  **NUNCA CONVERTA M\xDALTIPLOS BOXES EM LISTA**: \xC9 ESTRITAMENTE PROIBIDO converter m\xFAltiplos widgets 'icon-box' ou 'image-box' em um \xFAnico widget 'icon-list'. PRESERVE SEMPRE os widgets individuais.

TRANSFORMA\xC7\xD5ES DESEJADAS:
-   **Image Box**: Se vir Container com Imagem + T\xEDtulo + Texto -> Converta para widget "image-box".
-   **Icon Box**: Se vir Container com \xCDcone + T\xEDtulo + Texto -> Converta para widget "icon-box".
-   **Gallery**: Se vir um Grid de Imagens -> Converta para "gallery" ou "basic-gallery".
-   **Button**: Se vir um Container com Texto centralizado e cor de fundo -> Converta para "button".

SA\xCDDA:
Retorne APENAS o JSON otimizado. Sem markdown, sem explica\xE7\xF5es.
`;
    }
  });

  // src/pipeline/noai.parser.ts
  function isImageFill(node) {
    if (!node) return false;
    if (node.type === "IMAGE") return true;
    const fills = node == null ? void 0 : node.fills;
    if (!Array.isArray(fills)) return false;
    return fills.some((f) => (f == null ? void 0 : f.type) === "IMAGE");
  }
  function findFirstImageId(node) {
    if (!node) return null;
    if (isImageFill(node)) return node.id || null;
    const children = node.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        const found = findFirstImageId(child);
        if (found) return found;
      }
    }
    return null;
  }
  function hasTextDeep(node) {
    if (!node) return false;
    if (node.type === "TEXT") return true;
    const children = node.children;
    if (Array.isArray(children)) {
      return children.some((c) => hasTextDeep(c));
    }
    return false;
  }
  function hasIconDeep(node) {
    if (!node) return false;
    if (vectorTypes.includes(node.type)) return true;
    const children = node.children;
    if (Array.isArray(children)) {
      return children.some((c) => hasIconDeep(c));
    }
    return false;
  }
  function isSolidColor(node) {
    const fills = node == null ? void 0 : node.fills;
    if (!Array.isArray(fills) || fills.length === 0) return void 0;
    const solid = fills.find((f) => f.type === "SOLID" && f.color);
    if (!solid) return void 0;
    const { r, g, b, a = 1 } = solid.color || {};
    const to255 = (v) => Math.round((v || 0) * 255);
    return `rgba(${to255(r)}, ${to255(g)}, ${to255(b)}, ${a})`;
  }
  function isContainerLike(node) {
    const containerTypes = ["FRAME", "GROUP", "SECTION", "INSTANCE", "COMPONENT"];
    return containerTypes.includes(node.type);
  }
  function unwrapBoxedInner(node) {
    const rawChildren = Array.isArray(node.children) ? node.children : [];
    if (node.width < BOXED_MIN_PARENT_WIDTH || rawChildren.length === 0) {
      return { isBoxed: false, inner: null, flattenedChildren: rawChildren };
    }
    const candidate = rawChildren.find(
      (child) => isContainerLike(child) && typeof child.width === "number" && child.width > 0 && child.width < node.width && node.width - child.width >= BOXED_MIN_WIDTH_DELTA
    );
    if (!candidate) {
      return { isBoxed: false, inner: null, flattenedChildren: rawChildren };
    }
    const innerChildren = Array.isArray(candidate.children) ? candidate.children : [];
    const idx = rawChildren.indexOf(candidate);
    const before = idx >= 0 ? rawChildren.slice(0, idx) : [];
    const after = idx >= 0 ? rawChildren.slice(idx + 1) : [];
    return { isBoxed: true, inner: candidate, flattenedChildren: [...before, ...innerChildren, ...after] };
  }
  function calculateWidgetScore(node) {
    const scores = [];
    const name = (node.name || "").toLowerCase();
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const children = hasChildren ? node.children : [];
    const hasImage = children.some((c) => isImageFill(c) || findFirstImageId(c));
    const hasText = children.some((c) => hasTextDeep(c));
    const hasIcon = children.some((c) => hasIconDeep(c));
    const allImages = children.length > 0 && children.every((c) => isImageFill(c) || Array.isArray(c.children) && c.children.every((gr) => isImageFill(gr)));
    const allIcons = children.length > 0 && children.every((c) => vectorTypes.includes(c.type));
    const isHorizontal = node.layoutMode === "HORIZONTAL";
    const isVertical = node.layoutMode === "VERTICAL";
    const isGenericName = name.includes("container") || name.includes("frame") || name.includes("group") || name.includes("section") || name === "div";
    const hasComplexChildren = children.some((c) => c.children && c.children.length > 1);
    let imageBoxScore = 0;
    if (hasImage) imageBoxScore += 30;
    if (hasText) imageBoxScore += 20;
    if (children.length <= 4) imageBoxScore += 10;
    if (isVertical) imageBoxScore += 10;
    if (name.includes("image") && name.includes("box")) imageBoxScore += 50;
    if (isGenericName) imageBoxScore -= 30;
    if (hasComplexChildren) imageBoxScore -= 30;
    if (imageBoxScore > 0) scores.push({ type: "image-box", score: imageBoxScore, matchedFeatures: ["image", "text"] });
    let iconBoxScore = 0;
    if (hasIcon) iconBoxScore += 30;
    if (hasText) iconBoxScore += 20;
    if (children.length <= 4) iconBoxScore += 10;
    if (name.includes("icon") && name.includes("box")) iconBoxScore += 50;
    if (isGenericName) iconBoxScore -= 30;
    if (hasComplexChildren) iconBoxScore -= 30;
    if (iconBoxScore > 0) scores.push({ type: "icon-box", score: iconBoxScore, matchedFeatures: ["icon", "text"] });
    let buttonScore = 0;
    const bg = isSolidColor(node);
    if (bg) buttonScore += 20;
    if (children.length === 1 && children[0].type === "TEXT") buttonScore += 20;
    if (children.length === 2 && hasText && hasIcon) buttonScore += 40;
    if (node.primaryAxisAlignItems === "CENTER" && node.counterAxisAlignItems === "CENTER") buttonScore += 10;
    if (name.includes("btn") || name.includes("button") || name.includes("link")) buttonScore += 50;
    if (!hasImage && !hasIcon && !hasText) buttonScore = 0;
    if (buttonScore > 0) scores.push({ type: "button", score: buttonScore, matchedFeatures: ["background", "text-icon"] });
    let starScore = 0;
    if (allIcons && children.length >= 3 && children.length <= 5) starScore += 30;
    if (isHorizontal) starScore += 10;
    if (name.includes("star") || name.includes("rating")) starScore += 50;
    if (starScore > 0) scores.push({ type: "star-rating", score: starScore, matchedFeatures: ["icons", "horizontal"] });
    let socialScore = 0;
    if (isHorizontal) socialScore += 20;
    if (allIcons || children.every((c) => c.type === "FRAME" || c.type === "GROUP")) socialScore += 20;
    if (name.includes("social")) socialScore += 50;
    if (socialScore > 0) scores.push({ type: "social-icons", score: socialScore, matchedFeatures: ["horizontal", "icons"] });
    let testimonialScore = 0;
    if (hasImage) testimonialScore += 20;
    if (hasText) testimonialScore += 20;
    if (name.includes("testimonial") || name.includes("review")) testimonialScore += 50;
    if (testimonialScore > 0) scores.push({ type: "testimonial", score: testimonialScore, matchedFeatures: ["image", "text"] });
    let galleryScore = 0;
    if (allImages && children.length >= 3) galleryScore += 60;
    if (name.includes("gallery")) galleryScore += 40;
    if (galleryScore > 0) scores.push({ type: "basic-gallery", score: galleryScore, matchedFeatures: ["all-images"] });
    let carouselScore = 0;
    if (allImages && children.length >= 2) carouselScore += 60;
    if (name.includes("carousel") || name.includes("slider")) carouselScore += 50;
    if (carouselScore > 0) scores.push({ type: "image-carousel", score: carouselScore, matchedFeatures: ["images", "carousel"] });
    let iconListScore = 0;
    if (hasIcon && hasText && (children.length >= 3 || name.includes("list"))) iconListScore += 40;
    if (name.includes("icon") && name.includes("list")) iconListScore += 40;
    if (iconListScore > 0) scores.push({ type: "icon_list", score: iconListScore, matchedFeatures: ["icon", "text", "list"] });
    let videoScore = 0;
    if (name.includes("video") || name.includes("player")) videoScore += 40;
    if (hasImage && children.some((c) => (c.name || "").toLowerCase().includes("play"))) videoScore += 40;
    if (videoScore > 0) scores.push({ type: "video", score: videoScore, matchedFeatures: ["name", "play-icon"] });
    let mapScore = 0;
    if (name.includes("map") || name.includes("location")) mapScore += 50;
    if (hasImage && name.includes("map")) mapScore += 20;
    if (mapScore > 0) scores.push({ type: "google_maps", score: mapScore, matchedFeatures: ["name"] });
    let dividerScore = 0;
    if (name.includes("divider") || name.includes("separator") || name.includes("line")) dividerScore += 40;
    if (!hasChildren && (node.type === "LINE" || node.type === "VECTOR" || node.type === "RECTANGLE") && (node.height <= 2 || node.width <= 2)) dividerScore += 30;
    if (dividerScore > 0) scores.push({ type: "divider", score: dividerScore, matchedFeatures: ["name", "shape"] });
    let spacerScore = 0;
    if (name.includes("spacer") || name.includes("gap")) spacerScore += 50;
    if (!hasChildren && !isImageFill(node) && !isSolidColor(node)) spacerScore += 20;
    if (spacerScore > 0) scores.push({ type: "spacer", score: spacerScore, matchedFeatures: ["name", "empty"] });
    let formScore = 0;
    if (name.includes("form") && !name.includes("search")) formScore += 40;
    const inputLike = children.filter((c) => (c.name || "").toLowerCase().includes("input") || (c.name || "").toLowerCase().includes("field"));
    if (inputLike.length >= 1) formScore += 30;
    if (children.some((c) => (c.name || "").toLowerCase().includes("submit") || (c.name || "").toLowerCase().includes("button"))) formScore += 20;
    if (formScore > 0) scores.push({ type: "form", score: formScore, matchedFeatures: ["name", "inputs"] });
    let loginScore = 0;
    if (name.includes("login") || name.includes("signin")) loginScore += 50;
    if (loginScore > 0) scores.push({ type: "login", score: loginScore, matchedFeatures: ["name"] });
    let priceTableScore = 0;
    if (name.includes("price") && name.includes("table")) priceTableScore += 60;
    if (name.includes("pricing")) priceTableScore += 40;
    if (hasText && children.some((c) => (c.name || "").toLowerCase().includes("price"))) priceTableScore += 20;
    if (priceTableScore > 0) scores.push({ type: "price-table", score: priceTableScore, matchedFeatures: ["name"] });
    let flipScore = 0;
    if (name.includes("flip") && name.includes("box")) flipScore += 60;
    if (flipScore > 0) scores.push({ type: "flip-box", score: flipScore, matchedFeatures: ["name"] });
    let ctaScore = 0;
    if (name.includes("cta") || name.includes("call to action")) ctaScore += 50;
    if (hasImage && hasText && children.some((c) => (c.name || "").toLowerCase().includes("button"))) ctaScore += 20;
    if (ctaScore > 0) scores.push({ type: "call-to-action", score: ctaScore, matchedFeatures: ["name", "structure"] });
    let countdownScore = 0;
    if (name.includes("countdown") || name.includes("timer")) countdownScore += 60;
    if (countdownScore > 0) scores.push({ type: "countdown", score: countdownScore, matchedFeatures: ["name"] });
    let wooTitleScore = 0;
    if (name.includes("product") && name.includes("title")) wooTitleScore += 60;
    if (wooTitleScore > 0) scores.push({ type: "woo:product-title", score: wooTitleScore, matchedFeatures: ["name"] });
    let wooPriceScore = 0;
    if (name.includes("product") && name.includes("price")) wooPriceScore += 60;
    if (wooPriceScore > 0) scores.push({ type: "woo:product-price", score: wooPriceScore, matchedFeatures: ["name"] });
    let wooCartScore = 0;
    if (name.includes("add to cart") || name.includes("product") && name.includes("button")) wooCartScore += 60;
    if (wooCartScore > 0) scores.push({ type: "woo:product-add-to-cart", score: wooCartScore, matchedFeatures: ["name"] });
    let wooImageScore = 0;
    if (name.includes("product") && name.includes("image")) wooImageScore += 60;
    if (wooImageScore > 0) scores.push({ type: "woo:product-image", score: wooImageScore, matchedFeatures: ["name"] });
    return scores.sort((a, b) => b.score - a.score);
  }
  function detectWidget(node) {
    var _a, _b;
    const name = (node.name || "").toLowerCase();
    if (name.startsWith("c:container") || name.startsWith("w:container")) {
      return null;
    }
    const styles = {
      sourceId: node.id,
      sourceName: node.name
    };
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const children = hasChildren ? node.children : [];
    const firstImageDeep = findFirstImageId(node);
    if (name.startsWith("w:")) {
      const boxContent = extractBoxContent(node);
      if (name.includes("image-box")) {
        return {
          type: "image-box",
          content: boxContent.title || node.name,
          imageId: boxContent.imageId || findFirstImageId(node) || null,
          styles: __spreadProps(__spreadValues({}, styles), { title_text: boxContent.title, description_text: boxContent.description })
        };
      }
      if (name.includes("icon-box")) {
        return {
          type: "icon-box",
          content: boxContent.title || node.name,
          imageId: boxContent.imageId || findFirstImageId(node) || null,
          styles: __spreadProps(__spreadValues({}, styles), { title_text: boxContent.title, description_text: boxContent.description })
        };
      }
      if (name.includes("button")) {
        return {
          type: "button",
          content: boxContent.title || node.name,
          imageId: null,
          styles
        };
      }
      if (name.includes("video")) return { type: "video", content: "", imageId: null, styles };
    }
    if (hasChildren || node.type === "LINE" || node.type === "VECTOR" || node.type === "RECTANGLE") {
      const scores = calculateWidgetScore(node);
      const bestMatch = scores[0];
      if (bestMatch && bestMatch.score >= 60) {
        switch (bestMatch.type) {
          case "image-box": {
            const boxContent = extractBoxContent(node);
            if (!boxContent.title) break;
            return {
              type: "image-box",
              content: boxContent.title,
              imageId: boxContent.imageId || findFirstImageId(node) || null,
              styles: __spreadProps(__spreadValues({}, styles), { title_text: boxContent.title, description_text: boxContent.description })
            };
          }
          case "icon-box": {
            const boxContent = extractBoxContent(node);
            if (!boxContent.title) break;
            return {
              type: "icon-box",
              content: boxContent.title,
              imageId: boxContent.imageId || findFirstImageId(node) || null,
              styles: __spreadProps(__spreadValues({}, styles), { title_text: boxContent.title, description_text: boxContent.description })
            };
          }
          case "button": {
            const boxContent = extractBoxContent(node);
            if (!boxContent.title && hasTextDeep(node)) break;
            return { type: "button", content: boxContent.title || node.name, imageId: null, styles };
          }
          case "star-rating":
            return { type: "star-rating", content: "5", imageId: null, styles };
          case "social-icons":
            return { type: "social-icons", content: "", imageId: null, styles };
          case "testimonial":
            return { type: "testimonial", content: "", imageId: null, styles };
          case "basic-gallery":
            return { type: "basic-gallery", content: null, imageId: null, styles };
          case "image-carousel": {
            const slides = children.filter((c) => isImageFill(c) || vectorTypes.includes(c.type) || c.type === "IMAGE").map((img, i) => ({ id: img.id, url: "", _id: `slide_${i + 1}` }));
            return { type: "image-carousel", content: null, imageId: null, styles: __spreadProps(__spreadValues({}, styles), { slides }) };
          }
          case "icon_list":
            return { type: "icon_list", content: node.name, imageId: null, styles };
          // New Widgets
          case "video":
            return { type: "video", content: "", imageId: null, styles };
          case "google_maps":
            return { type: "google_maps", content: "", imageId: null, styles };
          case "divider":
            return { type: "divider", content: "", imageId: null, styles };
          case "spacer":
            return { type: "spacer", content: "", imageId: null, styles };
          case "form":
            return { type: "form", content: "", imageId: null, styles };
          case "login":
            return { type: "login", content: "", imageId: null, styles };
          case "price-table":
            return { type: "price-table", content: "", imageId: null, styles };
          case "flip-box":
            return { type: "flip-box", content: "", imageId: null, styles };
          case "call-to-action":
            return { type: "call-to-action", content: "", imageId: null, styles };
          case "countdown":
            return { type: "countdown", content: "", imageId: null, styles };
          // WooCommerce
          case "woo:product-title":
            return { type: "woo:product-title", content: "", imageId: null, styles };
          case "woo:product-price":
            return { type: "woo:product-price", content: "", imageId: null, styles };
          case "woo:product-add-to-cart":
            return { type: "woo:product-add-to-cart", content: "", imageId: null, styles };
          case "woo:product-image":
            return { type: "woo:product-image", content: "", imageId: null, styles };
        }
      }
      if (children.length > 0 && children.every((c) => isImageFill(c) || Array.isArray(c.children) && c.children.every((gr) => isImageFill(gr)))) {
        if (children.length >= 3) {
          return { type: "basic-gallery", content: node.name, imageId: null, styles };
        }
        const firstImage = children.find(isImageFill) || ((_b = (_a = children[0]) == null ? void 0 : _a.children) == null ? void 0 : _b.find((gr) => isImageFill(gr)));
        const imageId = (firstImage == null ? void 0 : firstImage.id) || node.id;
        return { type: "image", content: null, imageId, styles };
      }
      if (children.some(isImageFill) && !children.some((c) => hasTextDeep(c))) {
        const firstImage = children.find(isImageFill);
        return { type: "image", content: null, imageId: (firstImage == null ? void 0 : firstImage.id) || node.id, styles };
      }
    }
    if (node.type === "TEXT") {
      const charCount = (node.characters || "").length;
      const hasNewLines = (node.characters || "").includes("\n");
      const isExplicitText = name.includes("text") || name.includes("paragraph") || name.includes("desc");
      const isExplicitHeading = name.includes("heading") || name.includes("title");
      let isHeading = true;
      if (isExplicitText) {
        isHeading = false;
      } else if (isExplicitHeading) {
        isHeading = true;
      } else {
        if (charCount > 500) {
          isHeading = false;
        }
      }
      if (name.includes("button") || name.includes("btn")) {
        return { type: "button", content: node.characters || node.name, imageId: null, styles };
      }
      const extractedStyles = extractWidgetStyles(node);
      Object.assign(styles, extractedStyles);
      let content = node.characters || node.name;
      if (node.styledTextSegments && node.styledTextSegments.length > 1) {
        const rich = buildHtmlFromSegments(node);
        content = rich.html;
      }
      return {
        type: isHeading ? "heading" : "text",
        content,
        imageId: null,
        styles
      };
    }
    if (vectorTypes.includes(node.type)) {
      return { type: "image", content: null, imageId: node.id, styles };
    }
    if (isImageFill(node) || name.startsWith("w:image") || node.type === "IMAGE") {
      const nestedImageId = findFirstImageId(node);
      return { type: "image", content: null, imageId: nestedImageId || node.id, styles };
    }
    if (name.includes("button") || name.includes("btn")) {
      return { type: "button", content: node.name, imageId: null, styles };
    }
    return null;
  }
  function toContainer(node) {
    let direction = node.layoutMode === "HORIZONTAL" ? "row" : "column";
    const styles = extractContainerStyles(node);
    const widgets = [];
    const childrenContainers = [];
    const boxed = unwrapBoxedInner(node);
    let childNodes = boxed.flattenedChildren;
    let containerWidth = boxed.isBoxed ? "boxed" : "full";
    if (boxed.isBoxed && boxed.inner) {
      const innerStyles = extractContainerStyles(boxed.inner);
      if (boxed.inner.layoutMode === "HORIZONTAL" || boxed.inner.layoutMode === "VERTICAL") {
        direction = boxed.inner.layoutMode === "HORIZONTAL" ? "row" : "column";
      }
      const hasPadding = (s) => ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"].some((k) => s[k] !== void 0 && s[k] !== null);
      if (styles.gap === void 0 && innerStyles.gap !== void 0) styles.gap = innerStyles.gap;
      if (!hasPadding(styles) && hasPadding(innerStyles)) {
        styles.paddingTop = innerStyles.paddingTop;
        styles.paddingRight = innerStyles.paddingRight;
        styles.paddingBottom = innerStyles.paddingBottom;
        styles.paddingLeft = innerStyles.paddingLeft;
      }
      if (!styles.justify_content && innerStyles.justify_content) styles.justify_content = innerStyles.justify_content;
      if (!styles.align_items && innerStyles.align_items) styles.align_items = innerStyles.align_items;
      if (!styles.background && innerStyles.background) styles.background = innerStyles.background;
      if (!styles.border && innerStyles.border) styles.border = innerStyles.border;
      styles.width = boxed.inner.width;
      styles._boxedInnerSourceId = boxed.inner.id;
    }
    if (!Array.isArray(childNodes)) childNodes = [];
    const hasInnerAutoLayout = boxed.isBoxed && boxed.inner && (boxed.inner.layoutMode === "HORIZONTAL" || boxed.inner.layoutMode === "VERTICAL");
    if (node.layoutMode !== "HORIZONTAL" && node.layoutMode !== "VERTICAL" && !hasInnerAutoLayout) {
      childNodes.sort((a, b) => {
        const yDiff = (a.y || 0) - (b.y || 0);
        if (Math.abs(yDiff) > 5) return yDiff;
        return (a.x || 0) - (b.x || 0);
      });
    }
    childNodes.forEach((child, idx) => {
      const w = detectWidget(child);
      const childHasChildren = Array.isArray(child.children) && child.children.length > 0;
      const orderMark = idx;
      if (w) {
        w.styles = __spreadProps(__spreadValues({}, w.styles || {}), { _order: orderMark });
        widgets.push(w);
      } else {
        if (childHasChildren) {
          const childContainer = toContainer(child);
          childContainer.styles = __spreadProps(__spreadValues({}, childContainer.styles || {}), { _order: orderMark });
          childrenContainers.push(childContainer);
        } else {
          widgets.push({
            type: "custom",
            content: child.name || "",
            imageId: null,
            styles: { sourceId: child.id, sourceName: child.name, _order: orderMark }
          });
        }
      }
    });
    return {
      id: node.id,
      direction: direction === "row" ? "row" : "column",
      width: containerWidth,
      styles,
      widgets,
      children: childrenContainers
    };
  }
  function analyzeTreeWithHeuristics(tree) {
    return tree;
  }
  function convertToFlexSchema(analyzedTree) {
    const rootContainer = toContainer(analyzedTree);
    const tokens = { primaryColor: "#000000", secondaryColor: "#FFFFFF" };
    return {
      page: { title: analyzedTree.name || "Layout importado", tokens },
      containers: [rootContainer]
    };
  }
  function extractBoxContent(node) {
    const children = node.children || [];
    let imageId = null;
    let title = "";
    let description = "";
    const imgNode = children.find((c) => isImageFill(c) || c.type === "IMAGE" || c.type === "VECTOR");
    if (imgNode) {
      imageId = imgNode.id;
    } else {
      for (const child of children) {
        if (child.children) {
          const deepImg = child.children.find((c) => isImageFill(c) || c.type === "IMAGE" || c.type === "VECTOR");
          if (deepImg) {
            imageId = deepImg.id;
            break;
          }
        }
      }
    }
    const textNodes = [];
    function collectTexts(n) {
      if (n.type === "TEXT") {
        textNodes.push(n);
        return;
      }
      if (n.children) {
        for (const child of n.children) {
          collectTexts(child);
          if (textNodes.length >= 2) return;
        }
      }
    }
    for (const child of children) {
      collectTexts(child);
      if (textNodes.length >= 2) break;
    }
    if (textNodes.length > 0) {
      title = textNodes[0].characters || textNodes[0].name;
    }
    if (textNodes.length > 1) {
      description = textNodes[1].characters || textNodes[1].name;
    }
    return { imageId, title, description };
  }
  var vectorTypes, BOXED_MIN_PARENT_WIDTH, BOXED_MIN_WIDTH_DELTA;
  var init_noai_parser = __esm({
    "src/pipeline/noai.parser.ts"() {
      init_style_utils();
      vectorTypes = ["VECTOR", "STAR", "ELLIPSE", "POLYGON", "BOOLEAN_OPERATION", "LINE", "RECTANGLE"];
      BOXED_MIN_PARENT_WIDTH = 1440;
      BOXED_MIN_WIDTH_DELTA = 40;
    }
  });

  // markdown-elementor/elementor-widgets-html-structure.md
  var elementor_widgets_html_structure_default;
  var init_elementor_widgets_html_structure = __esm({
    "markdown-elementor/elementor-widgets-html-structure.md"() {
      elementor_widgets_html_structure_default = '# Estrutura HTML dos Componentes WordPress Elementor\n\nDocumenta\xE7\xE3o detalhada com tags HTML e classes de todos os widgets Elementor Free, Pro, WooCommerce, Loop Builder, Carros\xE9is, Experimentais e WordPress.\n\n---\n\n## WIDGETS B\xC1SICOS (ELEMENTOR FREE)\n\n### w:container\n```html\n<div class="elementor-container">\n  <div class="elementor-row">\n    <!-- Inner content -->\n  </div>\n</div>\n```\n\n### w:inner-container\n```html\n<div class="elementor-inner-container">\n  <!-- Child elements -->\n</div>\n```\n\n### w:heading\n```html\n<div class="elementor-widget elementor-widget-heading">\n  <div class="elementor-widget-container">\n    <h1 class="elementor-heading-title elementor-size-default">\n      Heading Text\n    </h1>\n  </div>\n</div>\n```\n\n### w:text-editor\n```html\n<div class="elementor-widget elementor-widget-text-editor">\n  <div class="elementor-widget-container">\n    <div class="elementor-text-editor elementor-clearfix">\n      <p>Text content here</p>\n    </div>\n  </div>\n</div>\n```\n\n### w:image\n```html\n<div class="elementor-widget elementor-widget-image">\n  <div class="elementor-widget-container">\n    <img src="image-url.jpg" class="attachment-full" alt="Image Alt Text">\n  </div>\n</div>\n```\n\n### w:video\n```html\n<div class="elementor-widget elementor-widget-video">\n  <div class="elementor-widget-container">\n    <div class="elementor-video-container">\n      <iframe src="video-url" \n              title="Video"\n              frameborder="0"\n              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture">\n      </iframe>\n    </div>\n  </div>\n</div>\n```\n\n### w:button\n```html\n<div class="elementor-widget elementor-widget-button">\n  <div class="elementor-widget-container">\n    <div class="elementor-button-wrapper">\n      <a href="#" class="elementor-button elementor-button-link elementor-size-md">\n        <span class="elementor-button-content-wrapper">\n          <span class="elementor-button-text">Button Text</span>\n        </span>\n      </a>\n    </div>\n  </div>\n</div>\n```\n\n### w:divider\n```html\n<div class="elementor-widget elementor-widget-divider">\n  <div class="elementor-widget-container">\n    <div class="elementor-divider">\n      <span class="elementor-divider-separator"></span>\n    </div>\n  </div>\n</div>\n```\n\n### w:spacer\n```html\n<div class="elementor-widget elementor-widget-spacer">\n  <div class="elementor-widget-container">\n    <div class="elementor-spacer" style="height: 20px;"></div>\n  </div>\n</div>\n```\n\n### w:icon\n```html\n<div class="elementor-widget elementor-widget-icon">\n  <div class="elementor-widget-container">\n    <div class="elementor-icon-wrapper">\n      <div class="elementor-icon">\n        <i class="fas fa-star"></i>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:icon-box\n```html\n<div class="elementor-widget elementor-widget-icon-box">\n  <div class="elementor-widget-container">\n    <div class="elementor-icon-box-wrapper">\n      <div class="elementor-icon-box-icon">\n        <i class="fas fa-check"></i>\n      </div>\n      <div class="elementor-icon-box-content">\n        <h3 class="elementor-icon-box-title">Title</h3>\n        <p class="elementor-icon-box-description">Description</p>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:image-box\n```html\n<div class="elementor-widget elementor-widget-image-box">\n  <div class="elementor-widget-container">\n    <div class="elementor-image-box-wrapper">\n      <figure class="elementor-image-box-img">\n        <img src="image-url.jpg" alt="Image">\n      </figure>\n      <div class="elementor-image-box-content">\n        <h3 class="elementor-image-box-title">Title</h3>\n        <p class="elementor-image-box-description">Description</p>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:star-rating\n```html\n<div class="elementor-widget elementor-widget-star-rating">\n  <div class="elementor-widget-container">\n    <div class="elementor-star-rating">\n      <i class="fas fa-star elementor-star-full"></i>\n      <i class="fas fa-star elementor-star-full"></i>\n      <i class="fas fa-star elementor-star-half"></i>\n      <i class="fas fa-star elementor-star-empty"></i>\n      <i class="fas fa-star elementor-star-empty"></i>\n    </div>\n  </div>\n</div>\n```\n\n### w:counter\n```html\n<div class="elementor-widget elementor-widget-counter">\n  <div class="elementor-widget-container">\n    <div class="elementor-counter-box">\n      <div class="elementor-counter-title">Title</div>\n      <div class="elementor-counter-number-wrapper">\n        <span class="elementor-counter-number" data-to-value="100">0</span>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:progress\n```html\n<div class="elementor-widget elementor-widget-progress">\n  <div class="elementor-widget-container">\n    <div class="elementor-progress-wrapper">\n      <div class="elementor-progress-title">Progress Title</div>\n      <div class="elementor-progress-bar">\n        <div class="elementor-progress-fill" style="width: 75%;"></div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:tabs\n```html\n<div class="elementor-widget elementor-widget-tabs">\n  <div class="elementor-widget-container">\n    <div class="elementor-tabs">\n      <div class="elementor-tabs-wrapper">\n        <div class="elementor-tab-title">Tab 1</div>\n        <div class="elementor-tab-title">Tab 2</div>\n      </div>\n      <div class="elementor-tabs-content-wrapper">\n        <div class="elementor-tab-content">Content 1</div>\n        <div class="elementor-tab-content" style="display:none;">Content 2</div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:accordion\n```html\n<div class="elementor-widget elementor-widget-accordion">\n  <div class="elementor-widget-container">\n    <div class="elementor-accordion">\n      <div class="elementor-accordion-item">\n        <h3 class="elementor-accordion-title">\n          <span class="elementor-accordion-icon"></span>\n          <span>Accordion Item</span>\n        </h3>\n        <div class="elementor-accordion-body">\n          <div class="elementor-accordion-body-title">Content</div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:toggle\n```html\n<div class="elementor-widget elementor-widget-toggle">\n  <div class="elementor-widget-container">\n    <div class="elementor-toggle">\n      <div class="elementor-toggle-item">\n        <h3 class="elementor-toggle-title">Toggle Title</h3>\n        <div class="elementor-toggle-content">Toggle content here</div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:alert\n```html\n<div class="elementor-widget elementor-widget-alert">\n  <div class="elementor-widget-container">\n    <div class="elementor-alert elementor-alert-type-info">\n      <div class="elementor-alert-title">Alert Title</div>\n      <div class="elementor-alert-description">Alert description</div>\n    </div>\n  </div>\n</div>\n```\n\n### w:social-icons\n```html\n<div class="elementor-widget elementor-widget-social-icons">\n  <div class="elementor-widget-container">\n    <div class="elementor-social-icons-wrapper">\n      <a href="#" class="elementor-social-icon elementor-social-icon-facebook">\n        <i class="fab fa-facebook"></i>\n      </a>\n      <a href="#" class="elementor-social-icon elementor-social-icon-twitter">\n        <i class="fab fa-twitter"></i>\n      </a>\n    </div>\n  </div>\n</div>\n```\n\n### w:soundcloud\n```html\n<div class="elementor-widget elementor-widget-soundcloud">\n  <div class="elementor-widget-container">\n    <iframe src="https://w.soundcloud.com/player/?url=..." \n            frameborder="no" \n            allow="autoplay">\n    </iframe>\n  </div>\n</div>\n```\n\n### w:shortcode\n```html\n<div class="elementor-widget elementor-widget-shortcode">\n  <div class="elementor-widget-container">\n    [shortcode_name param="value"]\n  </div>\n</div>\n```\n\n### w:html\n```html\n<div class="elementor-widget elementor-widget-html">\n  <div class="elementor-widget-container">\n    <!-- Custom HTML content -->\n    <div class="custom-html-content">\n      Your HTML code here\n    </div>\n  </div>\n</div>\n```\n\n### w:menu-anchor\n```html\n<div class="elementor-menu-anchor" id="menu-anchor-id"></div>\n```\n\n### w:sidebar\n```html\n<div class="elementor-widget elementor-widget-sidebar">\n  <div class="elementor-widget-container">\n    <aside class="elementor-sidebar">\n      <!-- Sidebar content -->\n    </aside>\n  </div>\n</div>\n```\n\n### w:read-more\n```html\n<div class="elementor-widget elementor-widget-read-more">\n  <div class="elementor-widget-container">\n    <a href="#" class="elementor-read-more">Read More</a>\n  </div>\n</div>\n```\n\n### w:image-carousel\n```html\n<div class="elementor-widget elementor-widget-image-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-image-carousel">\n      <div class="elementor-carousel">\n        <div class="elementor-slide">\n          <img src="image1.jpg" alt="Slide 1">\n        </div>\n        <div class="elementor-slide">\n          <img src="image2.jpg" alt="Slide 2">\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:basic-gallery\n```html\n<div class="elementor-widget elementor-widget-gallery">\n  <div class="elementor-widget-container">\n    <div class="elementor-gallery">\n      <div class="elementor-gallery-item">\n        <figure class="elementor-gallery-item__image">\n          <img src="image1.jpg" alt="Gallery Image">\n        </figure>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:gallery\n```html\n<div class="elementor-widget elementor-widget-gallery">\n  <div class="elementor-widget-container">\n    <div class="elementor-gallery__titles-container"></div>\n    <div class="elementor-gallery__container">\n      <a href="image.jpg" class="elementor-gallery-item">\n        <div class="elementor-gallery-item__image">\n          <img src="thumbnail.jpg" alt="Gallery">\n        </div>\n        <div class="elementor-gallery-item__overlay">\n          <div class="elementor-gallery-item__content">\n            <div class="elementor-gallery-item__title">Title</div>\n          </div>\n        </div>\n      </a>\n    </div>\n  </div>\n</div>\n```\n\n### w:icon-list\n```html\n<div class="elementor-widget elementor-widget-icon-list">\n  <div class="elementor-widget-container">\n    <ul class="elementor-icon-list-items">\n      <li class="elementor-icon-list-item">\n        <span class="elementor-icon-list-icon"><i class="fas fa-check"></i></span>\n        <span class="elementor-icon-list-text">List item</span>\n      </li>\n    </ul>\n  </div>\n</div>\n```\n\n### w:nav-menu\n```html\n<div class="elementor-widget elementor-widget-nav-menu">\n  <div class="elementor-widget-container">\n    <nav class="elementor-nav-menu">\n      <ul class="elementor-nav-menu-list">\n        <li class="elementor-item"><a href="#">Menu Item</a></li>\n      </ul>\n    </nav>\n  </div>\n</div>\n```\n\n### w:search-form\n```html\n<div class="elementor-widget elementor-widget-search-form">\n  <div class="elementor-widget-container">\n    <form class="elementor-search-form">\n      <input type="search" placeholder="Search...">\n      <button type="submit"><i class="fas fa-search"></i></button>\n    </form>\n  </div>\n</div>\n```\n\n### w:google-maps\n```html\n<div class="elementor-widget elementor-widget-google_maps">\n  <div class="elementor-widget-container">\n    <div class="elementor-google-map">\n      <div class="elementor-map" \n           data-lat="40.7128" \n           data-lng="-74.0060"\n           style="height: 400px;">\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:testimonial\n```html\n<div class="elementor-widget elementor-widget-testimonial">\n  <div class="elementor-widget-container">\n    <div class="elementor-testimonial">\n      <div class="elementor-testimonial-content">\n        <p class="elementor-testimonial-text">Testimonial text</p>\n      </div>\n      <div class="elementor-testimonial-meta">\n        <img src="avatar.jpg" class="elementor-testimonial-image" alt="Author">\n        <div class="elementor-testimonial-meta-inner">\n          <h3 class="elementor-testimonial-name">Author Name</h3>\n          <div class="elementor-testimonial-title">Author Title</div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:embed\n```html\n<div class="elementor-widget elementor-widget-embed">\n  <div class="elementor-widget-container">\n    <div class="elementor-embed-frame">\n      <iframe src="embed-url" frameborder="0"></iframe>\n    </div>\n  </div>\n</div>\n```\n\n### w:lottie\n```html\n<div class="elementor-widget elementor-widget-lottie">\n  <div class="elementor-widget-container">\n    <div class="elementor-lottie-animation" \n         data-animation-url="animation.json"\n         style="height: 300px;">\n    </div>\n  </div>\n</div>\n```\n\n### loop:grid\n```html\n<div class="elementor-widget elementor-widget-loop-grid">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-grid elementor-grid">\n      <div class="elementor-grid-item">\n        <!-- Loop item content -->\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n---\n\n## WIDGETS ELEMENTOR PRO\n\n### w:form\n```html\n<div class="elementor-widget elementor-widget-form">\n  <div class="elementor-widget-container">\n    <form class="elementor-form" method="post">\n      <div class="elementor-form-fields-wrapper">\n        <div class="elementor-field-group">\n          <label for="form-field-name" class="elementor-field-label">\n            <span class="elementor-screen-only">Name</span>\n          </label>\n          <input type="text" name="form_fields[name]" id="form-field-name" class="elementor-field-textual elementor-size-md" placeholder="Name" required>\n        </div>\n      </div>\n      <button type="submit" class="elementor-button">Submit</button>\n    </form>\n  </div>\n</div>\n```\n\n### w:login\n```html\n<div class="elementor-widget elementor-widget-login">\n  <div class="elementor-widget-container">\n    <form class="elementor-login-form" method="post">\n      <div class="elementor-login-form-field">\n        <label>Username or Email</label>\n        <input type="text" name="log" required>\n      </div>\n      <div class="elementor-login-form-field">\n        <label>Password</label>\n        <input type="password" name="pwd" required>\n      </div>\n      <button type="submit" class="elementor-button">Login</button>\n    </form>\n  </div>\n</div>\n```\n\n### w:subscription\n```html\n<div class="elementor-widget elementor-widget-subscription">\n  <div class="elementor-widget-container">\n    <form class="elementor-subscription-form" method="post">\n      <div class="elementor-subscription-content">\n        <h3 class="elementor-subscription-title">Subscribe</h3>\n        <input type="email" name="email" placeholder="Your email" required>\n        <button type="submit" class="elementor-button">Subscribe</button>\n      </div>\n    </form>\n  </div>\n</div>\n```\n\n### w:call-to-action\n```html\n<div class="elementor-widget elementor-widget-call-to-action">\n  <div class="elementor-widget-container">\n    <div class="elementor-cta">\n      <div class="elementor-cta__bg-overlay"></div>\n      <div class="elementor-cta__content">\n        <h2 class="elementor-cta__title">Call to Action</h2>\n        <div class="elementor-cta__description">Description text</div>\n        <a href="#" class="elementor-cta__button elementor-button">CTA Button</a>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### media:carousel\n```html\n<div class="elementor-widget elementor-widget-media-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-carousel">\n      <div class="elementor-slide">\n        <div class="elementor-carousel-item">\n          <img src="media1.jpg" alt="Media 1">\n        </div>\n      </div>\n      <div class="elementor-slide">\n        <div class="elementor-carousel-item">\n          <img src="media2.jpg" alt="Media 2">\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:portfolio\n```html\n<div class="elementor-widget elementor-widget-portfolio">\n  <div class="elementor-widget-container">\n    <div class="elementor-portfolio">\n      <div class="elementor-portfolio-item">\n        <figure class="elementor-portfolio-item__image">\n          <img src="portfolio.jpg" alt="Portfolio Item">\n        </figure>\n        <div class="elementor-portfolio-item__content">\n          <h3 class="elementor-portfolio-item__title">Project Title</h3>\n          <p class="elementor-portfolio-item__category">Category</p>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:gallery-pro\n```html\n<div class="elementor-widget elementor-widget-gallery-pro">\n  <div class="elementor-widget-container">\n    <div class="elementor-gallery-pro">\n      <div class="elementor-gallery-pro-item">\n        <img src="gallery-item.jpg" alt="Gallery Item">\n        <div class="elementor-gallery-pro-overlay">\n          <h3>Gallery Title</h3>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### slider:slides\n```html\n<div class="elementor-widget elementor-widget-slides">\n  <div class="elementor-widget-container">\n    <div class="elementor-slides-wrapper">\n      <div class="elementor-slide">\n        <div class="elementor-slide-background">\n          <img src="slide1.jpg" alt="Slide 1">\n        </div>\n        <div class="elementor-slide-content">\n          <h2 class="elementor-slide-heading">Slide 1</h2>\n          <p class="elementor-slide-description">Slide description</p>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:slideshow\n```html\n<div class="elementor-widget elementor-widget-slideshow">\n  <div class="elementor-widget-container">\n    <div class="elementor-slideshow">\n      <div class="elementor-slideshow-wrapper">\n        <div class="elementor-slide-show-slide">\n          <img src="slide.jpg" alt="Slide">\n        </div>\n      </div>\n      <div class="elementor-slideshow-navigation"></div>\n    </div>\n  </div>\n</div>\n```\n\n### w:flip-box\n```html\n<div class="elementor-widget elementor-widget-flip-box">\n  <div class="elementor-widget-container">\n    <div class="elementor-flip-box">\n      <div class="elementor-flip-box-front">\n        <div class="elementor-flip-box-front-inner">\n          <h3>Front Title</h3>\n        </div>\n      </div>\n      <div class="elementor-flip-box-back">\n        <div class="elementor-flip-box-back-inner">\n          <h3>Back Title</h3>\n          <p>Back content</p>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:animated-headline\n```html\n<div class="elementor-widget elementor-widget-animated-headline">\n  <div class="elementor-widget-container">\n    <h2 class="elementor-headline">\n      <span class="elementor-headline-plain-text">Before</span>\n      <span class="elementor-headline-dynamic-wrapper">\n        <span class="elementor-headline-text">Animated Text</span>\n      </span>\n    </h2>\n  </div>\n</div>\n```\n\n### w:post-navigation\n```html\n<div class="elementor-widget elementor-widget-post-navigation">\n  <div class="elementor-widget-container">\n    <nav class="elementor-post-navigation">\n      <div class="elementor-post-nav-prev">\n        <a href="#">Previous Post</a>\n      </div>\n      <div class="elementor-post-nav-next">\n        <a href="#">Next Post</a>\n      </div>\n    </nav>\n  </div>\n</div>\n```\n\n### w:share-buttons\n```html\n<div class="elementor-widget elementor-widget-share-buttons">\n  <div class="elementor-widget-container">\n    <div class="elementor-share-buttons">\n      <a href="#" class="elementor-share-btn facebook">\n        <i class="fab fa-facebook"></i>\n      </a>\n      <a href="#" class="elementor-share-btn twitter">\n        <i class="fab fa-twitter"></i>\n      </a>\n    </div>\n  </div>\n</div>\n```\n\n### w:table-of-contents\n```html\n<div class="elementor-widget elementor-widget-table-of-contents">\n  <div class="elementor-widget-container">\n    <div class="elementor-toc">\n      <h2 class="elementor-toc-title">Table of Contents</h2>\n      <ul class="elementor-toc-list">\n        <li><a href="#heading-1">Heading 1</a></li>\n        <li><a href="#heading-2">Heading 2</a></li>\n      </ul>\n    </div>\n  </div>\n</div>\n```\n\n### w:countdown\n```html\n<div class="elementor-widget elementor-widget-countdown">\n  <div class="elementor-widget-container">\n    <div class="elementor-countdown">\n      <div class="elementor-countdown-item days">\n        <span class="elementor-countdown-digit">0</span>\n        <span class="elementor-countdown-label">Days</span>\n      </div>\n      <div class="elementor-countdown-item hours">\n        <span class="elementor-countdown-digit">0</span>\n        <span class="elementor-countdown-label">Hours</span>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:blockquote\n```html\n<div class="elementor-widget elementor-widget-blockquote">\n  <div class="elementor-widget-container">\n    <blockquote class="elementor-blockquote">\n      <p class="elementor-blockquote-content">Blockquote text</p>\n      <footer class="elementor-blockquote-footer">\n        <cite class="elementor-blockquote-author">Author Name</cite>\n      </footer>\n    </blockquote>\n  </div>\n</div>\n```\n\n### w:testimonial-carousel\n```html\n<div class="elementor-widget elementor-widget-testimonial-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-testimonials-carousel elementor-carousel">\n      <div class="elementor-slide">\n        <div class="elementor-testimonial">\n          <p class="elementor-testimonial-text">Testimonial</p>\n          <footer class="elementor-testimonial-meta">\n            <cite class="elementor-testimonial-name">Author</cite>\n          </footer>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:review-box\n```html\n<div class="elementor-widget elementor-widget-review-box">\n  <div class="elementor-widget-container">\n    <div class="elementor-review">\n      <div class="elementor-review-header">\n        <h3 class="elementor-review-title">Review Title</h3>\n        <div class="elementor-review-rating">\u2605\u2605\u2605\u2605\u2606</div>\n      </div>\n      <div class="elementor-review-content">\n        <p>Review content here</p>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:hotspots\n```html\n<div class="elementor-widget elementor-widget-hotspots">\n  <div class="elementor-widget-container">\n    <div class="elementor-hotspots-container">\n      <img src="image.jpg" alt="Hotspot Image">\n      <div class="elementor-hotspot" data-x="50" data-y="50">\n        <span class="elementor-hotspot-indicator"></span>\n        <div class="elementor-hotspot-tooltip">Hotspot content</div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:sitemap\n```html\n<div class="elementor-widget elementor-widget-sitemap">\n  <div class="elementor-widget-container">\n    <div class="elementor-sitemap">\n      <ul class="elementor-sitemap-list">\n        <li><a href="#">Page Link</a></li>\n      </ul>\n    </div>\n  </div>\n</div>\n```\n\n### w:author-box\n```html\n<div class="elementor-widget elementor-widget-author-box">\n  <div class="elementor-widget-container">\n    <div class="elementor-author-box">\n      <img src="author-avatar.jpg" class="elementor-author-box-avatar" alt="Author">\n      <div class="elementor-author-box-content">\n        <h3 class="elementor-author-box-name">Author Name</h3>\n        <p class="elementor-author-box-bio">Author bio text</p>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:price-table\n```html\n<div class="elementor-widget elementor-widget-price-table">\n  <div class="elementor-widget-container">\n    <div class="elementor-price-table">\n      <div class="elementor-price-table-header">\n        <h3 class="elementor-price-table-title">Plan Name</h3>\n        <span class="elementor-price-table-currency">$</span>\n        <span class="elementor-price-table-integer-part">99</span>\n        <span class="elementor-price-table-fractional-part">99</span>\n      </div>\n      <ul class="elementor-price-table-features">\n        <li class="elementor-price-table-feature">\n          <span>Feature 1</span>\n        </li>\n      </ul>\n      <div class="elementor-price-table-footer">\n        <a href="#" class="elementor-button">Buy Now</a>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:price-list\n```html\n<div class="elementor-widget elementor-widget-price-list">\n  <div class="elementor-widget-container">\n    <div class="elementor-price-list">\n      <div class="elementor-price-list-item">\n        <h4 class="elementor-price-list-heading">Item Title</h4>\n        <span class="elementor-price-list-separator"></span>\n        <span class="elementor-price-list-price">$10</span>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:progress-tracker\n```html\n<div class="elementor-widget elementor-widget-progress-tracker">\n  <div class="elementor-widget-container">\n    <div class="elementor-progress-tracker">\n      <div class="elementor-progress-tracker-item">\n        <div class="elementor-progress-tracker-step">1</div>\n        <div class="elementor-progress-tracker-label">Step 1</div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:animated-text\n```html\n<div class="elementor-widget elementor-widget-animated-text">\n  <div class="elementor-widget-container">\n    <div class="elementor-animated-text">\n      <span class="elementor-animated-text-word">Animated</span>\n      <span class="elementor-animated-text-word">Text</span>\n    </div>\n  </div>\n</div>\n```\n\n### w:nav-menu-pro\n```html\n<div class="elementor-widget elementor-widget-nav-menu">\n  <div class="elementor-widget-container">\n    <nav class="elementor-nav-menu-pro">\n      <ul class="elementor-nav-menu-pro-list">\n        <li class="elementor-item">\n          <a href="#">Menu Item</a>\n          <ul class="elementor-submenu">\n            <li><a href="#">Submenu Item</a></li>\n          </ul>\n        </li>\n      </ul>\n    </nav>\n  </div>\n</div>\n```\n\n### w:breadcrumb\n```html\n<div class="elementor-widget elementor-widget-breadcrumb">\n  <div class="elementor-widget-container">\n    <div class="elementor-breadcrumb">\n      <span class="elementor-breadcrumb-item">\n        <a href="#">Home</a>\n      </span>\n      <span class="elementor-breadcrumb-separator">\u203A</span>\n      <span class="elementor-breadcrumb-item">\n        Current Page\n      </span>\n    </div>\n  </div>\n</div>\n```\n\n### w:facebook-button\n```html\n<div class="elementor-widget elementor-widget-facebook-button">\n  <div class="elementor-widget-container">\n    <a href="#" class="elementor-facebook-button fb-button">\n      <i class="fab fa-facebook"></i> Like\n    </a>\n  </div>\n</div>\n```\n\n### w:facebook-comments\n```html\n<div class="elementor-widget elementor-widget-facebook-comments">\n  <div class="elementor-widget-container">\n    <div class="fb-comments" data-href="page-url" data-numposts="5"></div>\n  </div>\n</div>\n```\n\n### w:facebook-embed\n```html\n<div class="elementor-widget elementor-widget-facebook-embed">\n  <div class="elementor-widget-container">\n    <div class="fb-post" data-href="post-url"></div>\n  </div>\n</div>\n```\n\n### w:facebook-page\n```html\n<div class="elementor-widget elementor-widget-facebook-page">\n  <div class="elementor-widget-container">\n    <div class="fb-page" data-href="page-url"></div>\n  </div>\n</div>\n```\n\n### loop:builder\n```html\n<div class="elementor-widget elementor-widget-loop-builder">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-builder">\n      <!-- Loop builder content -->\n    </div>\n  </div>\n</div>\n```\n\n### loop:grid-advanced\n```html\n<div class="elementor-widget elementor-widget-loop-grid-advanced">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-grid-advanced elementor-grid">\n      <div class="elementor-grid-item">\n        <!-- Advanced grid item -->\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### loop:carousel\n```html\n<div class="elementor-widget elementor-widget-loop-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-carousel elementor-carousel">\n      <div class="elementor-slide">\n        <!-- Carousel item -->\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:post-excerpt\n```html\n<div class="elementor-widget elementor-widget-post-excerpt">\n  <div class="elementor-widget-container">\n    <div class="elementor-post-excerpt">\n      <p>Post excerpt text here...</p>\n    </div>\n  </div>\n</div>\n```\n\n### w:post-content\n```html\n<div class="elementor-widget elementor-widget-post-content">\n  <div class="elementor-widget-container">\n    <div class="elementor-post-content">\n      <!-- Full post content renders here -->\n    </div>\n  </div>\n</div>\n```\n\n### w:post-title\n```html\n<div class="elementor-widget elementor-widget-post-title">\n  <div class="elementor-widget-container">\n    <h1 class="elementor-post-title">Post Title</h1>\n  </div>\n</div>\n```\n\n### w:post-info\n```html\n<div class="elementor-widget elementor-widget-post-info">\n  <div class="elementor-widget-container">\n    <div class="elementor-post-info">\n      <span class="elementor-post-info-author">By Author Name</span>\n      <span class="elementor-post-info-date">Date Published</span>\n    </div>\n  </div>\n</div>\n```\n\n### w:post-featured-image\n```html\n<div class="elementor-widget elementor-widget-post-featured-image">\n  <div class="elementor-widget-container">\n    <div class="elementor-post-featured-image">\n      <img src="featured-image.jpg" alt="Featured Image">\n    </div>\n  </div>\n</div>\n```\n\n### w:post-author\n```html\n<div class="elementor-widget elementor-widget-post-author">\n  <div class="elementor-widget-container">\n    <div class="elementor-post-author">\n      <img src="author.jpg" alt="Author">\n      <h4>Author Name</h4>\n    </div>\n  </div>\n</div>\n```\n\n### w:post-date\n```html\n<div class="elementor-widget elementor-widget-post-date">\n  <div class="elementor-widget-container">\n    <div class="elementor-post-date">\n      Published on: <time>Date</time>\n    </div>\n  </div>\n</div>\n```\n\n### w:post-terms\n```html\n<div class="elementor-widget elementor-widget-post-terms">\n  <div class="elementor-widget-container">\n    <div class="elementor-post-terms">\n      <a href="#">Category</a>, <a href="#">Tag</a>\n    </div>\n  </div>\n</div>\n```\n\n### w:archive-title\n```html\n<div class="elementor-widget elementor-widget-archive-title">\n  <div class="elementor-widget-container">\n    <h1 class="elementor-archive-title">Archive Title</h1>\n  </div>\n</div>\n```\n\n### w:archive-description\n```html\n<div class="elementor-widget elementor-widget-archive-description">\n  <div class="elementor-widget-container">\n    <div class="elementor-archive-description">\n      <p>Archive description here</p>\n    </div>\n  </div>\n</div>\n```\n\n### w:site-logo\n```html\n<div class="elementor-widget elementor-widget-site-logo">\n  <div class="elementor-widget-container">\n    <div class="elementor-site-logo">\n      <a href="/">\n        <img src="logo.png" alt="Logo">\n      </a>\n    </div>\n  </div>\n</div>\n```\n\n### w:site-title\n```html\n<div class="elementor-widget elementor-widget-site-title">\n  <div class="elementor-widget-container">\n    <h1 class="elementor-site-title">\n      <a href="/">Site Title</a>\n    </h1>\n  </div>\n</div>\n```\n\n### w:site-tagline\n```html\n<div class="elementor-widget elementor-widget-site-tagline">\n  <div class="elementor-widget-container">\n    <p class="elementor-site-tagline">Site tagline here</p>\n  </div>\n</div>\n```\n\n### w:search-results\n```html\n<div class="elementor-widget elementor-widget-search-results">\n  <div class="elementor-widget-container">\n    <div class="elementor-search-results">\n      <!-- Search results render here -->\n    </div>\n  </div>\n</div>\n```\n\n### w:global-widget\n```html\n<div class="elementor-widget elementor-widget-global-widget" data-widget-id="123">\n  <div class="elementor-widget-container">\n    <!-- Global widget content -->\n  </div>\n</div>\n```\n\n### w:video-playlist\n```html\n<div class="elementor-widget elementor-widget-video-playlist">\n  <div class="elementor-widget-container">\n    <div class="elementor-video-playlist">\n      <div class="elementor-playlist-item">\n        <iframe src="video-url"></iframe>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:video-gallery\n```html\n<div class="elementor-widget elementor-widget-video-gallery">\n  <div class="elementor-widget-container">\n    <div class="elementor-video-gallery">\n      <div class="elementor-video-gallery-item">\n        <iframe src="video-url"></iframe>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n---\n\n## WIDGETS WOOCOMMERCE\n\n### woo:product-title\n```html\n<div class="elementor-widget elementor-widget-wc-product-title">\n  <div class="elementor-widget-container">\n    <h1 class="product_title entry-title">Product Name</h1>\n  </div>\n</div>\n```\n\n### woo:product-image\n```html\n<div class="elementor-widget elementor-widget-wc-product-image">\n  <div class="elementor-widget-container">\n    <div class="product-images">\n      <figure class="woocommerce-product-gallery">\n        <img src="product.jpg" alt="Product">\n      </figure>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-price\n```html\n<div class="elementor-widget elementor-widget-wc-product-price">\n  <div class="elementor-widget-container">\n    <div class="product_price">\n      <span class="woocommerce-Price-amount amount">\n        <bdi><span class="woocommerce-Price-currencySymbol">$</span>99.99</bdi>\n      </span>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-add-to-cart\n```html\n<div class="elementor-widget elementor-widget-wc-product-add-to-cart">\n  <div class="elementor-widget-container">\n    <form class="cart" method="post" enctype="multipart/form-data">\n      <div class="quantity">\n        <input type="number" value="1" min="1">\n      </div>\n      <button type="submit" class="single_add_to_cart_button button alt">Add to Cart</button>\n    </form>\n  </div>\n</div>\n```\n\n### woo:product-data-tabs\n```html\n<div class="elementor-widget elementor-widget-wc-product-data-tabs">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-tabs">\n      <ul class="tabs">\n        <li><a href="#tab-description">Description</a></li>\n        <li><a href="#tab-reviews">Reviews</a></li>\n      </ul>\n      <div id="tab-description" class="tab-content">Description content</div>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-excerpt\n```html\n<div class="elementor-widget elementor-widget-wc-product-excerpt">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-product-details__short-description">\n      <p>Product short description</p>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-rating\n```html\n<div class="elementor-widget elementor-widget-wc-product-rating">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-product-rating">\n      <div class="star-rating" role="img">\n        <span style="width:80%;">Rated 4 out of 5</span>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-stock\n```html\n<div class="elementor-widget elementor-widget-wc-product-stock">\n  <div class="elementor-widget-container">\n    <p class="stock in-stock">In stock</p>\n  </div>\n</div>\n```\n\n### woo:product-meta\n```html\n<div class="elementor-widget elementor-widget-wc-product-meta">\n  <div class="elementor-widget-container">\n    <div class="product_meta">\n      <span class="sku_wrapper">SKU: <span class="sku">12345</span></span>\n      <span class="posted_in">Category: <a href="#">Electronics</a></span>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-additional-information\n```html\n<div class="elementor-widget elementor-widget-wc-product-additional-information">\n  <div class="elementor-widget-container">\n    <table class="woocommerce-product-attributes">\n      <tr class="woocommerce-product-attributes-item">\n        <th>Attribute</th>\n        <td>Value</td>\n      </tr>\n    </table>\n  </div>\n</div>\n```\n\n### woo:product-short-description\n```html\n<div class="elementor-widget elementor-widget-wc-product-short-description">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-product-details__short-description">\n      <p>Short description here</p>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-related\n```html\n<div class="elementor-widget elementor-widget-wc-product-related">\n  <div class="elementor-widget-container">\n    <section class="related products">\n      <h2>Related Products</h2>\n      <div class="products">\n        <div class="product">\n          <img src="product.jpg" alt="Related Product">\n        </div>\n      </div>\n    </section>\n  </div>\n</div>\n```\n\n### woo:product-upsells\n```html\n<div class="elementor-widget elementor-widget-wc-product-upsells">\n  <div class="elementor-widget-container">\n    <section class="up-sells upsells products">\n      <h2>You might also like\u2026</h2>\n      <div class="products">\n        <div class="product">\n          <img src="upsell.jpg" alt="Upsell Product">\n        </div>\n      </div>\n    </section>\n  </div>\n</div>\n```\n\n### woo:product-tabs\n```html\n<div class="elementor-widget elementor-widget-wc-product-tabs">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-tabs">\n      <ul class="tabs wc-tabs">\n        <li><a href="#tab-description">Description</a></li>\n      </ul>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-breadcrumb\n```html\n<div class="elementor-widget elementor-widget-wc-product-breadcrumb">\n  <div class="elementor-widget-container">\n    <nav class="woocommerce-breadcrumb">\n      <a href="#">Shop</a> \u203A Product\n    </nav>\n  </div>\n</div>\n```\n\n### woo:product-gallery\n```html\n<div class="elementor-widget elementor-widget-wc-product-gallery">\n  <div class="elementor-widget-container">\n    <div class="product-gallery-wrapper">\n      <figure class="woocommerce-product-gallery">\n        <img src="gallery.jpg" alt="Product Gallery">\n      </figure>\n    </div>\n  </div>\n</div>\n```\n\n### woo:products\n```html\n<div class="elementor-widget elementor-widget-wc-products">\n  <div class="elementor-widget-container">\n    <div class="woocommerce columns-4">\n      <ul class="products">\n        <li class="product">\n          <img src="product.jpg" alt="Product">\n          <h2>Product Name</h2>\n          <span class="price">$99.99</span>\n          <a href="#" class="button">Read more</a>\n        </li>\n      </ul>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-grid\n```html\n<div class="elementor-widget elementor-widget-wc-product-grid">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-product-grid elementor-grid">\n      <div class="product elementor-grid-item">\n        <!-- Product item -->\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-carousel\n```html\n<div class="elementor-widget elementor-widget-wc-product-carousel">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-product-carousel elementor-carousel">\n      <div class="product elementor-slide">\n        <!-- Carousel product -->\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-loop-item\n```html\n<div class="elementor-widget elementor-widget-wc-product-loop-item">\n  <div class="elementor-widget-container">\n    <div class="product-loop-item">\n      <!-- Product loop item content -->\n    </div>\n  </div>\n</div>\n```\n\n### woo:loop-product-title\n```html\n<div class="elementor-widget elementor-widget-wc-loop-product-title">\n  <div class="elementor-widget-container">\n    <h2><a href="#">Product Title</a></h2>\n  </div>\n</div>\n```\n\n### woo:loop-product-price\n```html\n<div class="elementor-widget elementor-widget-wc-loop-product-price">\n  <div class="elementor-widget-container">\n    <span class="price">$99.99</span>\n  </div>\n</div>\n```\n\n### woo:loop-product-rating\n```html\n<div class="elementor-widget elementor-widget-wc-loop-product-rating">\n  <div class="elementor-widget-container">\n    <div class="star-rating">\n      <span style="width:80%;">\u2605\u2605\u2605\u2605\u2606</span>\n    </div>\n  </div>\n</div>\n```\n\n### woo:loop-product-image\n```html\n<div class="elementor-widget elementor-widget-wc-loop-product-image">\n  <div class="elementor-widget-container">\n    <img src="product-thumbnail.jpg" alt="Product Thumbnail">\n  </div>\n</div>\n```\n\n### woo:loop-product-button\n```html\n<div class="elementor-widget elementor-widget-wc-loop-product-button">\n  <div class="elementor-widget-container">\n    <a href="#" class="button">Add to Cart</a>\n  </div>\n</div>\n```\n\n### woo:loop-product-meta\n```html\n<div class="elementor-widget elementor-widget-wc-loop-product-meta">\n  <div class="elementor-widget-container">\n    <div class="product-meta">SKU: 123, Category: Electronics</div>\n  </div>\n</div>\n```\n\n### woo:cart\n```html\n<div class="elementor-widget elementor-widget-wc-cart">\n  <div class="elementor-widget-container">\n    <div class="woocommerce">\n      <table class="shop_table cart">\n        <tr>\n          <td class="product-name">Product</td>\n          <td class="product-price">$99.99</td>\n        </tr>\n      </table>\n    </div>\n  </div>\n</div>\n```\n\n### woo:checkout\n```html\n<div class="elementor-widget elementor-widget-wc-checkout">\n  <div class="elementor-widget-container">\n    <div class="woocommerce">\n      <form class="checkout" method="post">\n        <div class="col-1">\n          <h3>Billing details</h3>\n          <div class="woocommerce-billing-fields">\n            <!-- Billing form fields -->\n          </div>\n        </div>\n      </form>\n    </div>\n  </div>\n</div>\n```\n\n### woo:my-account\n```html\n<div class="elementor-widget elementor-widget-wc-my-account">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-account">\n      <nav class="woocommerce-MyAccount-navigation">\n        <ul>\n          <li><a href="#">Dashboard</a></li>\n          <li><a href="#">Orders</a></li>\n        </ul>\n      </nav>\n    </div>\n  </div>\n</div>\n```\n\n### woo:purchase-summary\n```html\n<div class="elementor-widget elementor-widget-wc-purchase-summary">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-purchase-summary">\n      <h3>Order Summary</h3>\n      <p>Subtotal: $99.99</p>\n      <p>Total: $99.99</p>\n    </div>\n  </div>\n</div>\n```\n\n### woo:order-tracking\n```html\n<div class="elementor-widget elementor-widget-wc-order-tracking">\n  <div class="elementor-widget-container">\n    <form class="woocommerce-order-tracking" method="post">\n      <p>Enter your order number to track your shipment.</p>\n      <input type="text" name="order" placeholder="Order #">\n      <button type="submit" class="button">Track</button>\n    </form>\n  </div>\n</div>\n```\n\n---\n\n## LOOP BUILDER WIDGETS\n\n### loop:grid\n```html\n<div class="elementor-widget elementor-widget-loop-grid">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-grid elementor-grid">\n      <div class="elementor-grid-item">\n        <!-- Loop item -->\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### loop:carousel\n```html\n<div class="elementor-widget elementor-widget-loop-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-carousel elementor-carousel">\n      <div class="elementor-slide">\n        <!-- Carousel loop item -->\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### loop:item\n```html\n<div class="elementor-widget elementor-widget-loop-item">\n  <div class="elementor-widget-container">\n    <div class="loop-item">\n      <!-- Loop item content container -->\n    </div>\n  </div>\n</div>\n```\n\n### loop:image\n```html\n<div class="elementor-widget elementor-widget-loop-image">\n  <div class="elementor-widget-container">\n    <figure class="loop-item-image">\n      <img src="image.jpg" alt="Item Image">\n    </figure>\n  </div>\n</div>\n```\n\n### loop:title\n```html\n<div class="elementor-widget elementor-widget-loop-title">\n  <div class="elementor-widget-container">\n    <h2 class="loop-item-title"><a href="#">Item Title</a></h2>\n  </div>\n</div>\n```\n\n### loop:meta\n```html\n<div class="elementor-widget elementor-widget-loop-meta">\n  <div class="elementor-widget-container">\n    <div class="loop-item-meta">\n      <span class="loop-meta-author">By Author</span>\n      <span class="loop-meta-date">Date</span>\n    </div>\n  </div>\n</div>\n```\n\n### loop:terms\n```html\n<div class="elementor-widget elementor-widget-loop-terms">\n  <div class="elementor-widget-container">\n    <div class="loop-item-terms">\n      <a href="#">Category</a>, <a href="#">Tag</a>\n    </div>\n  </div>\n</div>\n```\n\n### loop:rating\n```html\n<div class="elementor-widget elementor-widget-loop-rating">\n  <div class="elementor-widget-container">\n    <div class="loop-item-rating">\n      <div class="star-rating">\u2605\u2605\u2605\u2605\u2606</div>\n    </div>\n  </div>\n</div>\n```\n\n### loop:price\n```html\n<div class="elementor-widget elementor-widget-loop-price">\n  <div class="elementor-widget-container">\n    <span class="loop-item-price">$99.99</span>\n  </div>\n</div>\n```\n\n### loop:add-to-cart\n```html\n<div class="elementor-widget elementor-widget-loop-add-to-cart">\n  <div class="elementor-widget-container">\n    <a href="#" class="loop-item-add-to-cart button">Add to Cart</a>\n  </div>\n</div>\n```\n\n### loop:read-more\n```html\n<div class="elementor-widget elementor-widget-loop-read-more">\n  <div class="elementor-widget-container">\n    <a href="#" class="loop-item-read-more button">Read More</a>\n  </div>\n</div>\n```\n\n### loop:featured-image\n```html\n<div class="elementor-widget elementor-widget-loop-featured-image">\n  <div class="elementor-widget-container">\n    <img src="featured.jpg" class="loop-featured-image" alt="Featured Image">\n  </div>\n</div>\n```\n\n---\n\n## CARROSS\xC9IS\n\n### w:image-carousel\n```html\n<div class="elementor-widget elementor-widget-image-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-image-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide">\n          <img src="image1.jpg" alt="Slide 1">\n        </div>\n        <div class="swiper-slide">\n          <img src="image2.jpg" alt="Slide 2">\n        </div>\n      </div>\n      <div class="swiper-pagination"></div>\n      <div class="swiper-button-prev"></div>\n      <div class="swiper-button-next"></div>\n    </div>\n  </div>\n</div>\n```\n\n### media:carousel\n```html\n<div class="elementor-widget elementor-widget-media-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-media-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide">\n          <img src="media1.jpg" alt="Media 1">\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:testimonial-carousel\n```html\n<div class="elementor-widget elementor-widget-testimonial-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-testimonials-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide">\n          <div class="elementor-testimonial">\n            <p class="elementor-testimonial-text">Testimonial text</p>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:review-carousel\n```html\n<div class="elementor-widget elementor-widget-review-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-review-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide">\n          <div class="elementor-review-item">\u2605\u2605\u2605\u2605\u2605 Review</div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### slider:slides\n```html\n<div class="elementor-widget elementor-widget-slides">\n  <div class="elementor-widget-container">\n    <div class="elementor-slides-wrapper swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide elementor-slide">\n          <div class="elementor-slide-content">Slide content</div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### slider:slider\n```html\n<div class="elementor-widget elementor-widget-slider">\n  <div class="elementor-widget-container">\n    <div class="elementor-slider swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide">Slider item</div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### loop:carousel\n```html\n<div class="elementor-widget elementor-widget-loop-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide">\n          <!-- Loop carousel item -->\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-carousel\n```html\n<div class="elementor-widget elementor-widget-wc-product-carousel">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-product-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide product">\n          <img src="product.jpg" alt="Product">\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:posts-carousel\n```html\n<div class="elementor-widget elementor-widget-posts-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-posts-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide post">\n          <h3>Post Title</h3>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:gallery-carousel\n```html\n<div class="elementor-widget elementor-widget-gallery-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-gallery-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide">\n          <img src="gallery.jpg" alt="Gallery">\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n---\n\n## WIDGETS EXPERIMENTAIS\n\n### w:nested-tabs\n```html\n<div class="elementor-widget elementor-widget-nested-tabs">\n  <div class="elementor-widget-container">\n    <div class="elementor-nested-tabs">\n      <div class="elementor-tabs-wrapper">\n        <div class="elementor-tab-title">Nested Tab</div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:mega-menu\n```html\n<div class="elementor-widget elementor-widget-mega-menu">\n  <div class="elementor-widget-container">\n    <nav class="elementor-mega-menu">\n      <ul>\n        <li>\n          <a href="#">Menu</a>\n          <div class="mega-menu-panel">Mega menu content</div>\n        </li>\n      </ul>\n    </nav>\n  </div>\n</div>\n```\n\n### w:scroll-snap\n```html\n<div class="elementor-widget elementor-widget-scroll-snap">\n  <div class="elementor-widget-container elementor-scroll-snap">\n    <section>Section 1</section>\n    <section>Section 2</section>\n  </div>\n</div>\n```\n\n### w:motion-effects\n```html\n<div class="elementor-widget elementor-widget-motion-effects" data-motion-effect="parallax">\n  <div class="elementor-widget-container">\n    <div class="motion-effect-content">\n      Content with motion effects\n    </div>\n  </div>\n</div>\n```\n\n### w:background-slideshow\n```html\n<div class="elementor-widget elementor-widget-background-slideshow" data-slideshow-effect="fade">\n  <div class="elementor-widget-container">\n    <div class="elementor-slideshow-background">\n      <img src="slide1.jpg" alt="Slide 1">\n      <img src="slide2.jpg" alt="Slide 2">\n    </div>\n    <div class="elementor-slideshow-content">Content</div>\n  </div>\n</div>\n```\n\n### w:css-transform\n```html\n<div class="elementor-widget elementor-widget-css-transform" style="transform: skewX(-10deg);">\n  <div class="elementor-widget-container">\n    Transformed content\n  </div>\n</div>\n```\n\n### w:custom-position\n```html\n<div class="elementor-widget elementor-widget-custom-position" style="position: absolute; top: 0; left: 0;">\n  <div class="elementor-widget-container">\n    Custom positioned content\n  </div>\n</div>\n```\n\n### w:dynamic-tags\n```html\n<div class="elementor-widget elementor-widget-dynamic-tags">\n  <div class="elementor-widget-container">\n    <div class="dynamic-tags-content">\n      [elementor-tag id="post_title"]\n    </div>\n  </div>\n</div>\n```\n\n### w:ajax-pagination\n```html\n<div class="elementor-widget elementor-widget-ajax-pagination">\n  <div class="elementor-widget-container">\n    <nav class="elementor-pagination">\n      <a href="#" class="page-numbers">1</a>\n      <a href="#" class="page-numbers">2</a>\n      <span class="page-numbers current">3</span>\n    </nav>\n  </div>\n</div>\n```\n\n### loop:pagination\n```html\n<div class="elementor-widget elementor-widget-loop-pagination">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-pagination">\n      <a href="#" class="pagination-link">Previous</a>\n      <span class="pagination-number">1</span>\n      <a href="#" class="pagination-link">Next</a>\n    </div>\n  </div>\n</div>\n```\n\n### w:aspect-ratio-container\n```html\n<div class="elementor-widget elementor-widget-aspect-ratio-container" style="aspect-ratio: 16/9;">\n  <div class="elementor-widget-container">\n    <div class="aspect-ratio-content">\n      Content maintaining aspect ratio\n    </div>\n  </div>\n</div>\n```\n\n---\n\n## WIDGETS WORDPRESS\n\n### w:wp-search\n```html\n<div class="elementor-widget elementor-widget-wp-search">\n  <div class="elementor-widget-container">\n    <aside class="widget widget_search">\n      <form class="searchform" method="get">\n        <input type="search" name="s" placeholder="Search...">\n        <button type="submit">Search</button>\n      </form>\n    </aside>\n  </div>\n</div>\n```\n\n### w:wp-recent-posts\n```html\n<div class="elementor-widget elementor-widget-wp-recent-posts">\n  <div class="elementor-widget-container">\n    <aside class="widget widget_recent_entries">\n      <h3>Recent Posts</h3>\n      <ul>\n        <li><a href="#">Post Title</a></li>\n      </ul>\n    </aside>\n  </div>\n</div>\n```\n\n### w:wp-recent-comments\n```html\n<div class="elementor-widget elementor-widget-wp-recent-comments">\n  <div class="elementor-widget-container">\n    <aside class="widget widget_recent_comments">\n      <h3>Recent Comments</h3>\n      <ul id="recent-comments">\n        <li>Comment text</li>\n      </ul>\n    </aside>\n  </div>\n</div>\n```\n\n### w:wp-archives\n```html\n<div class="elementor-widget elementor-widget-wp-archives">\n  <div class="elementor-widget-container">\n    <aside class="widget widget_archive">\n      <h3>Archives</h3>\n      <ul>\n        <li><a href="#">January 2025</a></li>\n      </ul>\n    </aside>\n  </div>\n</div>\n```\n\n### w:wp-categories\n```html\n<div class="elementor-widget elementor-widget-wp-categories">\n  <div class="elementor-widget-container">\n    <aside class="widget widget_categories">\n      <h3>Categories</h3>\n      <ul>\n        <li><a href="#">Category Name</a></li>\n      </ul>\n    </aside>\n  </div>\n</div>\n```\n\n### w:wp-calendar\n```html\n<div class="elementor-widget elementor-widget-wp-calendar">\n  <div class="elementor-widget-container">\n    <aside class="widget widget_calendar">\n      <div id="calendar_wrap">\n        <table id="wp-calendar">\n          <tr><th>S</th><th>M</th><th>T</th></tr>\n        </table>\n      </div>\n    </aside>\n  </div>\n</div>\n```\n\n### w:wp-tag-cloud\n```html\n<div class="elementor-widget elementor-widget-wp-tag-cloud">\n  <div class="elementor-widget-container">\n    <aside class="widget widget_tag_cloud">\n      <h3>Tags</h3>\n      <div class="tagcloud">\n        <a href="#">tag1</a>\n        <a href="#">tag2</a>\n      </div>\n    </aside>\n  </div>\n</div>\n```\n\n### w:wp-custom-menu\n```html\n<div class="elementor-widget elementor-widget-wp-custom-menu">\n  <div class="elementor-widget-container">\n    <nav class="elementor-wp-menu">\n      <ul class="wp-menu-list">\n        <li><a href="#">Menu Item</a></li>\n      </ul>\n    </nav>\n  </div>\n</div>\n```\n\n---\n\n## ESTRUTURA PADR\xC3O DE WRAPPER\n\nTodos os widgets seguem essa estrutura base:\n\n```html\n<div class="elementor-widget elementor-widget-[tipo]">\n  <div class="elementor-widget-container">\n    <!-- Widget content here -->\n  </div>\n</div>\n```\n\n---\n\n## CLASSES IMPORTANTES DE ELEMENTOR\n\n- `.elementor-widget` - Container raiz do widget\n- `.elementor-widget-container` - Container interno de conte\xFAdo\n- `.elementor-button` - Classe para bot\xF5es\n- `.elementor-carousel` - Classe para carross\xE9is (usa Swiper.js)\n- `.elementor-grid` - Classe para layouts em grid\n- `.elementor-tabs-wrapper` - Wrapper para tabs\n- `.elementor-accordion` - Classe para accordion\n- `.elementor-form` - Classe para formul\xE1rios\n- `.elementor-post-*` - Classes para widgets de posts\n\n---\n\n## ATRIBUTOS DATA IMPORTANTES\n\n- `data-animation-url` - URL da anima\xE7\xE3o Lottie\n- `data-lat` / `data-lng` - Coordenadas do Google Maps\n- `data-to-value` - Valor final do counter\n- `data-widget-id` - ID do widget global\n- `data-motion-effect` - Tipo de efeito de movimento\n- `data-slideshow-effect` - Tipo de efeito do slideshow\n\nEste documento serve como refer\xEAncia completa para mapeamento de componentes Figma \u2192 Elementor WordPress.\n\n';
    }
  });

  // markdown-elementor/widgets-estrutural.md
  var widgets_estrutural_default;
  var init_widgets_estrutural = __esm({
    "markdown-elementor/widgets-estrutural.md"() {
      widgets_estrutural_default = '\n# Estruturas de Widgets para Elementor, Elementor Pro, WordPress, WooCommerce\n\n## Widgets Nativos do Elementor (Gratuito)\n\n### Caixa de Imagem (Image Box)\n```html\n<div class="elementor-image-box">\n  <figure class="elementor-image-box-img">\n    <img src="URL-da-imagem" alt="Descri\xE7\xE3o">\n  </figure>\n  <div class="elementor-image-box-content">\n    <h3 class="elementor-image-box-title">T\xEDtulo da Caixa</h3>\n    <p class="elementor-image-box-description">Descri\xE7\xE3o da caixa de imagem.</p>\n  </div>\n</div>\n```\n\n### Caixa de \xCDcone (Icon Box)\n```html\n<div class="elementor-icon-box">\n  <span class="elementor-icon">\n    <i class="fas fa-star"></i>\n  </span>\n  <div class="elementor-icon-box-content">\n    <h3 class="elementor-icon-box-title">T\xEDtulo do \xCDcone</h3>\n    <p class="elementor-icon-box-description">Descri\xE7\xE3o sobre o \xEDcone.</p>\n  </div>\n</div>\n```\n\n### Imagem\n```html\n<img class="elementor-widget-image" src="URL-da-imagem" alt="Descri\xE7\xE3o">\n```\n\n### V\xEDdeo\n```html\n<div class="elementor-widget-video">\n  <iframe src="URL-do-video"></iframe>\n</div>\n```\n\n### Bot\xE3o\n```html\n<a class="elementor-button" href="url-destino">\n  <span class="elementor-button-content-wrapper">\n    <span class="elementor-button-text">Texto do Bot\xE3o</span>\n  </span>\n</a>\n```\n\n### Divider (Divisor)\n```html\n<hr class="elementor-divider">\n```\n\n### Espa\xE7ador\n```html\n<div class="elementor-spacer"></div>\n```\n\n### T\xEDtulo (Heading)\n```html\n<h2 class="elementor-heading-title">T\xEDtulo</h2>\n```\n\n### Editor de Texto (Text Editor)\n```html\n<div class="elementor-text-editor">\n  <p>Texto livre e formatado.</p>\n</div>\n```\n\n### Imagem em Galeria (Image Gallery)\n```html\n<div class="elementor-image-gallery">\n  <img src="img1.jpg">\n  <img src="img2.jpg">\n</div>\n```\n\n### Lista de \xCDcones (Icon List)\n```html\n<ul class="elementor-icon-list">\n  <li class="elementor-icon-list-item">\n    <span class="elementor-icon-list-icon"><i class="fas fa-check"></i></span>\n    <span class="elementor-icon-list-text">Item 1</span>\n  </li>\n</ul>\n```\n\n### Alerta\n```html\n<div class="elementor-alert">\n  <span class="elementor-alert-title">Aten\xE7\xE3o!</span>\n  <div class="elementor-alert-description">Mensagem informativa.</div>\n</div>\n```\n\n### M\xFAsica (SoundCloud)\n```html\n<iframe width="400" height="100" src="https://soundcloud.com"></iframe>\n```\n\n### Google Maps\n```html\n<div class="elementor-google-map">\n  <iframe src="URL-do-mapa"></iframe>\n</div>\n```\n\n### Abas (Tabs)\n```html\n<div class="elementor-tabs">\n  <div class="elementor-tabs-wrapper">\n    <div class="elementor-tab-title">Tab 1</div>\n    <div class="elementor-tab-title">Tab 2</div>\n  </div>\n  <div class="elementor-tabs-content-wrapper">\n    <div class="elementor-tab-content">Conte\xFAdo 1</div>\n    <div class="elementor-tab-content">Conte\xFAdo 2</div>\n  </div>\n</div>\n```\n\n### Acorde\xE3o (Accordion)\n```html\n<div class="elementor-accordion">\n  <div class="elementor-accordion-item">\n    <div class="elementor-accordion-title">T\xEDtulo do Acorde\xE3o</div>\n    <div class="elementor-accordion-content">Conte\xFAdo do Acorde\xE3o</div>\n  </div>\n</div>\n```\n\n### Barra de Progresso (Progress Bar)\n```html\n<div class="elementor-progress-bar">\n  <div class="elementor-progress-bar-fill" style="width:70%"></div>\n</div>\n```\n\n### Contador (Counter)\n```html\n<div class="elementor-counter">\n  <span class="elementor-counter-number">100</span>\n  <span class="elementor-counter-title">T\xEDtulo</span>\n</div>\n```\n\n### \xC1reas de HTML Customizado\n```html\n<div class="elementor-widget-html">\n  <!-- Seu c\xF3digo HTML personalizado aqui -->\n</div>\n```\n\n### Shortcode\n```html\n<div class="elementor-shortcode">\n  [seu_shortcode]\n</div>\n```\n\n## Widgets do Elementor Pro (Adicionais)\n\n### Formul\xE1rio (Form)\n```html\n<form class="elementor-form">\n  <input type="text" placeholder="Nome">\n  <input type="email" placeholder="Email">\n  <textarea placeholder="Mensagem"></textarea>\n  <button type="submit">Enviar</button>\n</form>\n```\n\n### Posts (Grade de Posts/Artigos)\n```html\n<div class="elementor-posts">\n  <article class="elementor-post">\n    <a href="url-do-post">\n      <img src="thumb.jpg" alt="">\n      <h2>T\xEDtulo do Post</h2>\n      <p>Resumo...</p>\n    </a>\n  </article>\n</div>\n```\n\n### Slides\n```html\n<div class="elementor-slides">\n  <div class="elementor-slide">Conte\xFAdo 1</div>\n  <div class="elementor-slide">Conte\xFAdo 2</div>\n</div>\n```\n\n### Testemunhos (Testimonials)\n```html\n<div class="elementor-testimonial">\n  <blockquote>Opini\xE3o do cliente</blockquote>\n  <cite>Nome do Cliente</cite>\n</div>\n```\n\n### Portf\xF3lio\n```html\n<div class="elementor-portfolio">\n  <div class="elementor-portfolio-item">\n    <img src="portfolio.jpg" alt="Projeto">\n    <span>Nome do Projeto</span>\n  </div>\n</div>\n```\n\n### Lista de Pre\xE7os\n```html\n<ul class="elementor-price-list">\n  <li><span class="elementor-price-list-item">Servi\xE7o</span> <span class="elementor-price">R$ 100</span></li>\n</ul>\n```\n\n### Tabela de Pre\xE7os\n```html\n<table class="elementor-price-table">\n  <thead><tr><th>Plano</th><th>Pre\xE7o</th></tr></thead>\n  <tbody><tr><td>Basic</td><td>R$ 50</td></tr></tbody>\n</table>\n```\n\n### Call to Action\n```html\n<div class="elementor-cta">\n  <h2>Chamada</h2>\n  <button>Saiba Mais</button>\n</div>\n```\n\n### Flip Box\n```html\n<div class="elementor-flip-box">\n  <div class="elementor-flip-box-front">Frente</div>\n  <div class="elementor-flip-box-back">Verso</div>\n</div>\n```\n\n### Carrossel de M\xEDdia/Site\n```html\n<div class="elementor-media-carousel">\n  <div class="elementor-carousel-item">Item 1</div>\n  <div class="elementor-carousel-item">Item 2</div>\n</div>\n```\n\n### Formul\xE1rio de Login\n```html\n<form class="elementor-login">\n  <input type="text" placeholder="Usu\xE1rio">\n  <input type="password" placeholder="Senha">\n  <button type="submit">Entrar</button>\n</form>\n```\n\n### Menu Personalizado\n```html\n<nav class="elementor-nav-menu">\n  <ul>\n    <li><a href="#">In\xEDcio</a></li>\n    <li><a href="#">Sobre</a></li>\n  </ul>\n</nav>\n```\n\n### Busca Din\xE2mica\n```html\n<form class="elementor-search">\n  <input type="search" placeholder="Buscar...">\n  <button type="submit">Buscar</button>\n</form>\n```\n\n### Lista de Conte\xFAdos Din\xE2mica\n```html\n<ul class="elementor-dynamic-content">\n  <li>Conte\xFAdo 1</li>\n  <li>Conte\xFAdo 2</li>\n</ul>\n```\n\n### Breadcrumbs\n```html\n<nav class="elementor-breadcrumbs">\n  <a href="#">Home</a> &gt; <a href="#">P\xE1gina</a>\n</nav>\n```\n\n### Widgets para WooCommerce\n```html\n<!-- Exemplo: Adicionar ao Carrinho -->\n<button class="woocommerce-add-to-cart">Adicionar ao Carrinho</button>\n<!-- Grid de Produtos -->\n<ul class="products">\n  <li class="product">\n    <a href="url-produto">\n      <img src="imagem.jpg" alt="">\n      <h2>Nome do Produto</h2>\n      <span class="price">R$ 59,00</span>\n    </a>\n  </li>\n</ul>\n<!-- Produtos Relacionados -->\n<div class="related-products">\n  ...\n</div>\n<!-- Filtros -->\n<form class="woocommerce-product-filter">\n  ...\n</form>\n```\n\n### Popup\n```html\n<div class="elementor-popup">\n  <h2>T\xEDtulo Popup</h2>\n  <p>Conte\xFAdo popup</p>\n</div>\n```\n\n## Widgets Nativos do WordPress\n\n### Arquivos\n```html\n<aside class="widget widget_archives">\n  <h2 class="widget-title">Arquivos</h2>\n  <ul>\n    <li><a href="#">Novembro 2025</a></li>\n  </ul>\n</aside>\n```\n\n### Agenda\n```html\n<aside class="widget widget_calendar">\n  <table>\n    <tr><td>Seg</td><td>Ter</td></tr>\n  </table>\n</aside>\n```\n\n### \xC1udio\n```html\n<audio controls src="audio.mp3"></audio>\n```\n\n### Calend\xE1rio\n```html\n<aside class="widget widget_calendar">\n  <table></table>\n</aside>\n```\n\n### Categorias\n```html\n<aside class="widget widget_categories">\n  <ul>\n    <li><a href="#">Categoria</a></li>\n  </ul>\n</aside>\n```\n\n### Galeria\n```html\n<div class="gallery">\n  <img src="img1.jpg"><img src="img2.jpg">\n</div>\n```\n\n### Imagem\n```html\n<img src="img.jpg" alt="Imagem">\n```\n\n### Menu Personalizado\n```html\n<nav class="widget_nav_menu">\n  <ul>\n    <li><a href="#">Home</a></li>\n  </ul>\n</nav>\n```\n\n### Meta\n```html\n<aside class="widget widget_meta">\n  <ul>\n    <li><a href="#">Login</a></li>\n  </ul>\n</aside>\n```\n\n### P\xE1gina\n```html\n<aside class="widget widget_pages">\n  <ul>\n    <li><a href="#">P\xE1gina 1</a></li>\n  </ul>\n</aside>\n```\n\n### Pesquisar\n```html\n<form class="search-form">\n  <input type="search">\n  <button type="submit">Buscar</button>\n</form>\n```\n\n### Coment\xE1rios Recentes\n```html\n<aside class="widget widget_recent_comments">\n  <ul>\n    <li>Coment\xE1rio</li>\n  </ul>\n</aside>\n```\n\n### Posts Recentes\n```html\n<aside class="widget widget_recent_entries">\n  <ul>\n    <li><a href="#">T\xEDtulo do Post</a></li>\n  </ul>\n</aside>\n```\n\n### RSS\n```html\n<aside class="widget widget_rss">\n  <ul>\n    <li>Feed</li>\n  </ul>\n</aside>\n```\n\n### Lista de Tags\n```html\n<div class="tagcloud">\n  <a href="#">tag1</a>\n  <a href="#">tag2</a>\n</div>\n```\n\n### V\xEDdeo\n```html\n<video controls src="video.mp4"></video>\n```\n\n## Widgets Nativos do WooCommerce\n\n### Carrinho\n```html\n<div class="widget_shopping_cart_content">\n  <ul class="woocommerce-mini-cart">\n    <li>Produto</li>\n  </ul>\n</div>\n```\n\n### Filtros ativos de produto\n```html\n<div class="widget_layered_nav_filters">\n  <ul>\n    <li>Filtro</li>\n  </ul>\n</div>\n```\n\n### Filtro por Atributo\n```html\n<div class="widget_layered_nav">\n  <ul>\n    <li>Atributo</li>\n  </ul>\n</div>\n```\n\n### Filtro por Pre\xE7o\n```html\n<div class="widget_price_filter">\n  <input type="range">\n</div>\n```\n\n### Filtro por Avalia\xE7\xE3o\n```html\n<div class="widget_rating_filter">\n  <ul>\n    <li>Estrelas</li>\n  </ul>\n</div>\n```\n\n### Lista/Categorias de Produto\n```html\n<ul class="product-categories">\n  <li>Categoria</li>\n</ul>\n```\n\n### Produtos em Destaque\n```html\n<ul class="product_list_widget">\n  <li>Produto Destaque</li>\n</ul>\n```\n\n### Produtos em Promo\xE7\xE3o\n```html\n<ul class="product_list_widget">\n  <li>Produto em Promo\xE7\xE3o</li>\n</ul>\n```\n\n### Produtos Recentes/Populares/Mais Vendidos\n```html\n<ul class="product_list_widget">\n  <li>Produto</li>\n</ul>\n```\n\n### Avalia\xE7\xF5es recentes de produto\n```html\n<ul class="woocommerce-widget-reviews">\n  <li>Avalia\xE7\xE3o</li>\n</ul>\n```\n\n### Nuvem de Tags do Produto\n```html\n<div class="woocommerce-product-tag-cloud">\n  <a href="#">tag-produto</a>\n</div>\n```\n\n### Pesquisa de Produtos\n```html\n<form class="woocommerce-product-search">\n  <input type="search">\n  <button type="submit">Buscar</button>\n</form>\n```\n';
    }
  });

  // src/reference_docs.ts
  var referenceDocs;
  var init_reference_docs = __esm({
    "src/reference_docs.ts"() {
      init_elementor_widgets_html_structure();
      init_widgets_estrutural();
      referenceDocs = [
        { name: "elementor-widgets-html-structure.md", content: elementor_widgets_html_structure_default },
        { name: "widgets-estrutural.md", content: widgets_estrutural_default }
      ];
    }
  });

  // src/heuristics/types.ts
  var init_types = __esm({
    "src/heuristics/types.ts"() {
    }
  });

  // src/heuristics/engine.ts
  function evaluateNode(node, heuristics, options = {}) {
    var _a;
    const minConfidence = (_a = options.minConfidence) != null ? _a : 0.3;
    const results = [];
    for (const rule of heuristics) {
      try {
        const out = rule.match(node);
        if (!out) continue;
        if (out.confidence < minConfidence) continue;
        results.push(__spreadProps(__spreadValues({}, out), {
          heuristicId: rule.id,
          priority: rule.priority
        }));
      } catch (e) {
        continue;
      }
    }
    results.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return b.priority - a.priority;
    });
    return results;
  }
  var init_engine = __esm({
    "src/heuristics/engine.ts"() {
    }
  });

  // src/heuristics/rules/utils.ts
  function areWidthsRoughlyEqual(widths, tolerance = 12) {
    if (widths.length < 2) return false;
    const min = Math.min(...widths);
    const max = Math.max(...widths);
    return max - min <= tolerance;
  }
  function hasAnyText(node) {
    return node.hasText === true;
  }
  function isFrameLike(node) {
    return node.type === "FRAME" || node.type === "SECTION" || node.type === "COMPONENT" || node.type === "INSTANCE";
  }
  var init_utils = __esm({
    "src/heuristics/rules/utils.ts"() {
    }
  });

  // src/heuristics/rules/layout.ts
  var LAYOUT_COLUMNS, LAYOUT_GRID, LAYOUT_HEURISTICS;
  var init_layout = __esm({
    "src/heuristics/rules/layout.ts"() {
      init_utils();
      LAYOUT_COLUMNS = {
        id: "layout.columns",
        priority: 70,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (!node.isAutoLayout) return null;
          if (node.direction !== "HORIZONTAL") return null;
          if (node.childCount < 2) return null;
          if (!areWidthsRoughlyEqual(node.childrenWidths)) return null;
          let patternId = "layout.columnsN";
          if (node.childCount === 2) patternId = "layout.columns2";
          else if (node.childCount === 3) patternId = "layout.columns3";
          else if (node.childCount === 4) patternId = "layout.columns4";
          return {
            patternId,
            widget: "structure:columns",
            confidence: 0.8,
            meta: { columns: node.childCount }
          };
        }
      };
      LAYOUT_GRID = {
        id: "layout.grid",
        priority: 68,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (node.childCount < 3) return null;
          const widths = node.childrenWidths;
          if (!widths.length) return null;
          const min = Math.min(...widths);
          const max = Math.max(...widths);
          if (max - min > 24) return null;
          return {
            patternId: "layout.grid",
            widget: "structure:grid",
            confidence: 0.77
          };
        }
      };
      LAYOUT_HEURISTICS = [
        LAYOUT_COLUMNS,
        LAYOUT_GRID
      ];
    }
  });

  // src/heuristics/rules/sections.ts
  var SECTION_GENERIC, SECTION_HERO, SECTION_CTA, SECTION_HEURISTICS;
  var init_sections = __esm({
    "src/heuristics/rules/sections.ts"() {
      init_utils();
      SECTION_GENERIC = {
        id: "section.generic",
        priority: 60,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (node.width < 900) return null;
          if (node.height < 180) return null;
          return {
            patternId: "section.generic",
            widget: "structure:section",
            confidence: 0.75
          };
        }
      };
      SECTION_HERO = {
        id: "section.hero",
        priority: 85,
        match(node) {
          var _a;
          if (!isFrameLike(node)) return null;
          if (node.width < 900) return null;
          if (node.height < 380) return null;
          if (!node.hasText) return null;
          const hasVisual = node.hasBackground || node.hasChildImage;
          if (!hasVisual) return null;
          const bigText = ((_a = node.textFontSizeMax) != null ? _a : 0) >= 32;
          if (!bigText) return null;
          return {
            patternId: "section.hero",
            widget: "structure:section-hero",
            confidence: 0.86,
            meta: { isHero: true }
          };
        }
      };
      SECTION_CTA = {
        id: "section.cta",
        priority: 80,
        match(node) {
          var _a;
          if (!isFrameLike(node)) return null;
          if (!node.hasText) return null;
          if (node.height < 140 || node.height > 520) return null;
          if (!node.hasBackground && !node.hasBorder) return null;
          const bigText = ((_a = node.textFontSizeMax) != null ? _a : 0) >= 20;
          if (!bigText) return null;
          return {
            patternId: "section.cta",
            widget: "structure:section-cta",
            confidence: 0.8
          };
        }
      };
      SECTION_HEURISTICS = [
        SECTION_HERO,
        SECTION_CTA,
        SECTION_GENERIC
      ];
    }
  });

  // src/heuristics/rules/navigation.ts
  var HEADER_NAVBAR, FOOTER_MAIN, NAVIGATION_HEURISTICS;
  var init_navigation = __esm({
    "src/heuristics/rules/navigation.ts"() {
      init_utils();
      HEADER_NAVBAR = {
        id: "navigation.header-navbar",
        priority: 75,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (node.height > 200) return null;
          if (node.width < 900) return null;
          const nearTop = node.y <= 80;
          if (!nearTop) return null;
          if (!node.hasText && !node.hasChildImage) return null;
          return {
            patternId: "navigation.header-navbar",
            widget: "structure:header-navbar",
            confidence: 0.8
          };
        }
      };
      FOOTER_MAIN = {
        id: "navigation.footer-main",
        priority: 70,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (node.width < 900) return null;
          if (node.height < 160) return null;
          if (!node.hasText) return null;
          return {
            patternId: "navigation.footer-main",
            widget: "structure:footer-main",
            confidence: 0.72
          };
        }
      };
      NAVIGATION_HEURISTICS = [
        HEADER_NAVBAR,
        FOOTER_MAIN
      ];
    }
  });

  // src/heuristics/rules/typography.ts
  var HEADING_GENERIC, PARAGRAPH_GENERIC, TYPOGRAPHY_HEURISTICS;
  var init_typography = __esm({
    "src/heuristics/rules/typography.ts"() {
      init_utils();
      HEADING_GENERIC = {
        id: "typography.heading-generic",
        priority: 80,
        match(node) {
          var _a, _b;
          if (node.type !== "TEXT") return null;
          if (!hasAnyText(node)) return null;
          const sizeMax = (_a = node.textFontSizeMax) != null ? _a : 0;
          const lineCount = (_b = node.textLineCount) != null ? _b : 1;
          if (sizeMax < 20) return null;
          if (lineCount > 3) return null;
          return {
            patternId: "typography.heading",
            widget: "structure:heading",
            confidence: 0.85
          };
        }
      };
      PARAGRAPH_GENERIC = {
        id: "typography.paragraph-generic",
        priority: 60,
        match(node) {
          var _a, _b, _c;
          if (node.type !== "TEXT") return null;
          if (!hasAnyText(node)) return null;
          const sizeMax = (_a = node.textFontSizeMax) != null ? _a : 0;
          const sizeMin = (_b = node.textFontSizeMin) != null ? _b : sizeMax;
          const lineCount = (_c = node.textLineCount) != null ? _c : 1;
          if (sizeMax > 22) return null;
          if (sizeMin < 10) return null;
          if (lineCount < 2) return null;
          return {
            patternId: "typography.paragraph",
            widget: "structure:paragraph",
            confidence: 0.8
          };
        }
      };
      TYPOGRAPHY_HEURISTICS = [
        HEADING_GENERIC,
        PARAGRAPH_GENERIC
      ];
    }
  });

  // src/heuristics/rules/media.ts
  var IMAGE_SINGLE, MEDIA_HEURISTICS;
  var init_media = __esm({
    "src/heuristics/rules/media.ts"() {
      init_utils();
      IMAGE_SINGLE = {
        id: "media.image-single",
        priority: 65,
        match(node) {
          const isGeometricShape = node.type === "RECTANGLE" || node.type === "ELLIPSE";
          if ((isGeometricShape || isFrameLike(node)) && node.hasImageFill) {
            if (isFrameLike(node) && (node.hasText || node.children.length > 0)) {
              return null;
            }
            return {
              patternId: "media.image.fill",
              // ID mais específico
              widget: "image",
              // Widget de imagem direto
              confidence: 0.85,
              imageId: node.id
            };
          }
          if (isFrameLike(node) && node.hasChildImage && !node.hasText && node.children.length === 1) {
            const imageChild = node.children[0];
            return {
              patternId: "media.image.child",
              // ID mais específico
              widget: "image",
              // Widget de imagem direto
              confidence: 0.8,
              imageId: imageChild.id
            };
          }
          return null;
        }
      };
      MEDIA_HEURISTICS = [
        IMAGE_SINGLE
      ];
    }
  });

  // src/heuristics/widgets/elementor-basic.ts
  var ELEM_HEADING, ELEM_TEXT_EDITOR, ELEM_IMAGE, ELEM_BUTTON, ELEM_ICON, ELEM_ICON_BOX, ELEM_IMAGE_BOX, ELEM_DIVIDER, ELEM_SPACER, ELEMENTOR_BASIC_WIDGET_HEURISTICS;
  var init_elementor_basic = __esm({
    "src/heuristics/widgets/elementor-basic.ts"() {
      init_utils();
      ELEM_HEADING = {
        id: "widget.elementor.heading",
        priority: 90,
        match(node) {
          var _a, _b, _c;
          if (node.type !== "TEXT") return null;
          if (!hasAnyText(node)) return null;
          const sizeMax = (_a = node.textFontSizeMax) != null ? _a : 0;
          const lineCount = (_b = node.textLineCount) != null ? _b : 1;
          const isBold = (_c = node.textIsBoldDominant) != null ? _c : false;
          if (sizeMax < 22) return null;
          if (lineCount > 3) return null;
          if (!isBold) return null;
          return {
            patternId: "widget.elementor.heading",
            widget: "w:heading",
            confidence: 0.9,
            meta: { levelGuess: sizeMax >= 32 ? "h1-h2" : "h3" }
          };
        }
      };
      ELEM_TEXT_EDITOR = {
        id: "widget.elementor.text-editor",
        priority: 85,
        match(node) {
          var _a, _b;
          if (node.type !== "TEXT") return null;
          if (!hasAnyText(node)) return null;
          const sizeMax = (_a = node.textFontSizeMax) != null ? _a : 0;
          const lineCount = (_b = node.textLineCount) != null ? _b : 1;
          if (sizeMax > 22) return null;
          if (lineCount < 2) return null;
          return {
            patternId: "widget.elementor.text-editor",
            widget: "w:text-editor",
            confidence: 0.85
          };
        }
      };
      ELEM_IMAGE = {
        id: "widget.elementor.image",
        priority: 80,
        match(node) {
          if (node.type === "RECTANGLE" || node.type === "ELLIPSE") {
            if (node.hasImageFill) {
              return {
                patternId: "widget.elementor.image",
                widget: "w:image",
                confidence: 0.88
              };
            }
          }
          if (isFrameLike(node) && node.hasChildImage && !node.hasText) {
            return {
              patternId: "widget.elementor.image",
              widget: "w:image",
              confidence: 0.8
            };
          }
          return null;
        }
      };
      ELEM_BUTTON = {
        id: "widget.elementor.button",
        priority: 90,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (!node.isAutoLayout) return null;
          if (!node.hasBackground) return null;
          if (!node.hasText) return null;
          if (node.height < 28 || node.height > 72) return null;
          if (node.width < 80) return null;
          const paddingH = (node.paddingLeft + node.paddingRight) / 2;
          if (paddingH < 10) return null;
          return {
            patternId: "widget.elementor.button",
            widget: "w:button",
            confidence: 0.9
          };
        }
      };
      ELEM_ICON = {
        id: "widget.elementor.icon",
        priority: 70,
        match(node) {
          const isIconShape = node.type === "ELLIPSE" || node.type === "VECTOR" || node.type === "INSTANCE";
          if (!isIconShape) return null;
          if (node.width > 128 || node.height > 128) return null;
          return {
            patternId: "widget.elementor.icon",
            widget: "w:icon",
            confidence: 0.78
          };
        }
      };
      ELEM_ICON_BOX = {
        id: "widget.elementor.icon-box",
        priority: 78,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (!node.isAutoLayout) return null;
          if (node.direction !== "VERTICAL") return null;
          if (!node.hasText) return null;
          if (!node.hasChildImage) return null;
          if (node.childCount < 2 || node.childCount > 4) return null;
          return {
            patternId: "widget.elementor.icon-box",
            widget: "w:icon-box",
            confidence: 0.8
          };
        }
      };
      ELEM_IMAGE_BOX = {
        id: "widget.elementor.image-box",
        priority: 78,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (!node.isAutoLayout) return null;
          if (node.direction !== "VERTICAL") return null;
          if (!node.hasText) return null;
          if (!node.hasChildImage) return null;
          if (node.childCount < 2 || node.childCount > 4) return null;
          return {
            patternId: "widget.elementor.image-box",
            widget: "w:image-box",
            confidence: 0.8
          };
        }
      };
      ELEM_DIVIDER = {
        id: "widget.elementor.divider",
        priority: 65,
        match(node) {
          if (node.height > 4 && node.width < 200) return null;
          if (!node.hasBorder && !node.hasBackground) return null;
          return {
            patternId: "widget.elementor.divider",
            widget: "w:divider",
            confidence: 0.7
          };
        }
      };
      ELEM_SPACER = {
        id: "widget.elementor.spacer",
        priority: 50,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (node.childCount !== 0) return null;
          if (!node.hasBackground && !node.hasBorder) return null;
          if (node.height >= 8 && node.height <= 80 && node.width >= 16) {
            return {
              patternId: "widget.elementor.spacer",
              widget: "w:spacer",
              confidence: 0.65
            };
          }
          return null;
        }
      };
      ELEMENTOR_BASIC_WIDGET_HEURISTICS = [
        ELEM_HEADING,
        ELEM_TEXT_EDITOR,
        ELEM_IMAGE,
        ELEM_BUTTON,
        ELEM_ICON,
        ELEM_ICON_BOX,
        ELEM_IMAGE_BOX,
        ELEM_DIVIDER,
        ELEM_SPACER
      ];
    }
  });

  // src/heuristics/widgets/elementor-pro.ts
  var ELEM_PRO_FORM, ELEM_PRO_POSTS, ELEM_PRO_SLIDES, ELEMENTOR_PRO_WIDGET_HEURISTICS;
  var init_elementor_pro = __esm({
    "src/heuristics/widgets/elementor-pro.ts"() {
      init_utils();
      ELEM_PRO_FORM = {
        id: "widget.elementor-pro.form",
        priority: 88,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (!node.isAutoLayout) return null;
          if (!node.hasText) return null;
          if (node.childCount < 2) return null;
          const looksTall = node.height >= 200;
          const manyChildren = node.childCount >= 3;
          if (!looksTall || !manyChildren) return null;
          return {
            patternId: "widget.elementor-pro.form",
            widget: "e:form",
            confidence: 0.78
          };
        }
      };
      ELEM_PRO_POSTS = {
        id: "widget.elementor-pro.posts",
        priority: 86,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (node.childCount < 3) return null;
          const widths = node.childrenWidths;
          if (!widths.length) return null;
          const min = Math.min(...widths);
          const max = Math.max(...widths);
          if (max - min > 32) return null;
          return {
            patternId: "widget.elementor-pro.posts",
            widget: "e:posts",
            confidence: 0.8,
            meta: { layout: "cards-grid-or-columns" }
          };
        }
      };
      ELEM_PRO_SLIDES = {
        id: "widget.elementor-pro.slides",
        priority: 80,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (!node.hasChildImage) return null;
          if (!node.hasText) return null;
          if (node.width < 600 || node.height < 300) return null;
          return {
            patternId: "widget.elementor-pro.slides",
            widget: "e:slides",
            confidence: 0.75
          };
        }
      };
      ELEMENTOR_PRO_WIDGET_HEURISTICS = [
        ELEM_PRO_FORM,
        ELEM_PRO_POSTS,
        ELEM_PRO_SLIDES
      ];
    }
  });

  // src/heuristics/widgets/wordpress-core.ts
  var WP_SEARCH, WP_RECENT_POSTS_LIST, WP_CATEGORIES_LIST, WORDPRESS_CORE_WIDGET_HEURISTICS;
  var init_wordpress_core = __esm({
    "src/heuristics/widgets/wordpress-core.ts"() {
      init_utils();
      WP_SEARCH = {
        id: "widget.wp.search",
        priority: 70,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (!node.isAutoLayout) return null;
          if (node.childCount < 1 || node.childCount > 3) return null;
          if (!node.hasText) return null;
          if (node.height < 40 || node.height > 120) return null;
          return {
            patternId: "widget.wp.search",
            widget: "wp:search",
            confidence: 0.65
          };
        }
      };
      WP_RECENT_POSTS_LIST = {
        id: "widget.wp.recent-posts",
        priority: 60,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (!node.isAutoLayout) return null;
          if (node.direction !== "VERTICAL") return null;
          if (!node.hasText) return null;
          if (node.childCount < 3) return null;
          return {
            patternId: "widget.wp.recent-posts",
            widget: "wp:recent-posts",
            confidence: 0.6
          };
        }
      };
      WP_CATEGORIES_LIST = {
        id: "widget.wp.categories",
        priority: 60,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (!node.isAutoLayout) return null;
          if (node.direction !== "VERTICAL") return null;
          if (!node.hasText) return null;
          if (node.childCount < 3) return null;
          return {
            patternId: "widget.wp.categories",
            widget: "wp:categories",
            confidence: 0.55
          };
        }
      };
      WORDPRESS_CORE_WIDGET_HEURISTICS = [
        WP_SEARCH,
        WP_RECENT_POSTS_LIST,
        WP_CATEGORIES_LIST
      ];
    }
  });

  // src/heuristics/widgets/woocommerce.ts
  var WOO_PRODUCT_GRID, WOO_SINGLE_PRODUCT_SUMMARY, WOO_CART_LIKE, WOO_WIDGET_HEURISTICS;
  var init_woocommerce = __esm({
    "src/heuristics/widgets/woocommerce.ts"() {
      init_utils();
      WOO_PRODUCT_GRID = {
        id: "widget.woo.product-grid",
        priority: 85,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (node.childCount < 3) return null;
          if (!node.hasChildImage || !node.hasText) return null;
          const widths = node.childrenWidths;
          if (!widths.length) return null;
          const min = Math.min(...widths);
          const max = Math.max(...widths);
          if (max - min > 40) return null;
          return {
            patternId: "widget.woo.product-grid",
            widget: "woo:products-grid",
            confidence: 0.82
          };
        }
      };
      WOO_SINGLE_PRODUCT_SUMMARY = {
        id: "widget.woo.single-product-summary",
        priority: 82,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (!node.hasText) return null;
          if (node.width < 260) return null;
          const tall = node.height >= 240;
          if (!tall) return null;
          return {
            patternId: "widget.woo.single-product-summary",
            widget: "woo:single-product-summary",
            confidence: 0.78
          };
        }
      };
      WOO_CART_LIKE = {
        id: "widget.woo.cart-like",
        priority: 70,
        match(node) {
          if (!isFrameLike(node)) return null;
          if (!node.hasText) return null;
          if (node.width < 600) return null;
          if (node.height < 200) return null;
          return {
            patternId: "widget.woo.cart",
            widget: "woo:cart",
            confidence: 0.7
          };
        }
      };
      WOO_WIDGET_HEURISTICS = [
        WOO_PRODUCT_GRID,
        WOO_SINGLE_PRODUCT_SUMMARY,
        WOO_CART_LIKE
      ];
    }
  });

  // src/heuristics/index.ts
  var DEFAULT_HEURISTICS;
  var init_heuristics = __esm({
    "src/heuristics/index.ts"() {
      init_types();
      init_engine();
      init_layout();
      init_sections();
      init_navigation();
      init_typography();
      init_media();
      init_elementor_basic();
      init_elementor_pro();
      init_wordpress_core();
      init_woocommerce();
      DEFAULT_HEURISTICS = [
        ...LAYOUT_HEURISTICS,
        ...SECTION_HEURISTICS,
        ...NAVIGATION_HEURISTICS,
        ...TYPOGRAPHY_HEURISTICS,
        ...MEDIA_HEURISTICS,
        ...ELEMENTOR_BASIC_WIDGET_HEURISTICS,
        ...ELEMENTOR_PRO_WIDGET_HEURISTICS,
        ...WORDPRESS_CORE_WIDGET_HEURISTICS,
        ...WOO_WIDGET_HEURISTICS
      ];
    }
  });

  // src/heuristics/adapter.ts
  function createNodeSnapshot(node) {
    var _a;
    const { width, height, x, y } = node;
    const snapshot = {
      id: node.id,
      name: node.name,
      type: node.type,
      width,
      height,
      x,
      y,
      isVisible: node.visible,
      isAutoLayout: false,
      direction: "NONE",
      spacing: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      hasBackground: false,
      backgroundOpacity: 0,
      hasBorder: false,
      borderRadius: 0,
      hasShadow: false,
      hasText: false,
      hasImageFill: false,
      hasChildImage: false,
      childCount: 0,
      childrenTypes: [],
      childrenWidths: [],
      childrenHeights: [],
      childrenAlignment: "MIXED"
    };
    if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "SECTION") {
      const frame = node;
      if (frame.layoutMode !== "NONE") {
        snapshot.isAutoLayout = true;
        snapshot.direction = frame.layoutMode;
        snapshot.spacing = frame.itemSpacing;
        snapshot.paddingTop = frame.paddingTop;
        snapshot.paddingRight = frame.paddingRight;
        snapshot.paddingBottom = frame.paddingBottom;
        snapshot.paddingLeft = frame.paddingLeft;
      }
      if (Array.isArray(frame.fills)) {
        const solid = frame.fills.find((f) => f.type === "SOLID");
        if (solid) {
          snapshot.hasBackground = true;
          snapshot.backgroundOpacity = (_a = solid.opacity) != null ? _a : 1;
        }
        const image = frame.fills.find((f) => f.type === "IMAGE");
        if (image) snapshot.hasImageFill = true;
      }
      if (Array.isArray(frame.strokes) && frame.strokes.length > 0) {
        snapshot.hasBorder = true;
      }
      if (typeof frame.cornerRadius === "number") {
        snapshot.borderRadius = frame.cornerRadius;
      }
      if (Array.isArray(frame.effects)) {
        snapshot.hasShadow = frame.effects.some((e) => e.type === "DROP_SHADOW" && e.visible);
      }
      snapshot.childCount = frame.children.length;
      snapshot.childrenTypes = frame.children.map((c) => c.type);
      snapshot.childrenWidths = frame.children.map((c) => c.width);
      snapshot.childrenHeights = frame.children.map((c) => c.height);
      let textCount = 0;
      let imageCount = 0;
      let maxFontSize = 0;
      let minFontSize = 9999;
      let isBold = false;
      let lineCount = 0;
      const traverse = (n) => {
        if (n.type === "TEXT") {
          textCount++;
          const t = n;
          if (t.characters.trim().length > 0) {
            snapshot.hasText = true;
            const size = t.fontSize;
            if (typeof size === "number") {
              if (size > maxFontSize) maxFontSize = size;
              if (size < minFontSize) minFontSize = size;
            }
          }
        } else if (n.type === "VECTOR" || n.type === "ELLIPSE" || n.type === "POLYGON" || n.type === "STAR" || n.type === "BOOLEAN_OPERATION") {
          imageCount++;
          snapshot.hasChildImage = true;
        } else if (n.type === "RECTANGLE") {
          if (Array.isArray(n.fills) && n.fills.some((f) => f.type === "IMAGE")) {
            imageCount++;
            snapshot.hasChildImage = true;
          }
        }
        if ("children" in n) {
          n.children.forEach(traverse);
        }
      };
      frame.children.forEach((child) => {
        if (child.type === "VECTOR" || child.type === "ELLIPSE" || child.type === "POLYGON" || child.type === "STAR" || child.type === "BOOLEAN_OPERATION") {
          snapshot.hasChildImage = true;
        }
        if (child.type === "RECTANGLE") {
          if (Array.isArray(child.fills) && child.fills.some((f) => f.type === "IMAGE")) {
            snapshot.hasChildImage = true;
          }
        }
        if (child.type === "TEXT") {
          snapshot.hasText = true;
          const t = child;
          const size = t.fontSize;
          if (typeof size === "number") {
            if (size > maxFontSize) maxFontSize = size;
            if (size < minFontSize) minFontSize = size;
          }
          if (t.height && typeof size === "number") {
            lineCount += Math.round(t.height / size);
          }
        }
        if (!snapshot.hasChildImage && (child.type === "FRAME" || child.type === "INSTANCE" || child.type === "GROUP")) {
          const grandChildren = child.children;
          if (grandChildren && grandChildren.some((gc) => gc.type === "VECTOR" || gc.fills && gc.fills.some((f) => f.type === "IMAGE"))) {
            snapshot.hasChildImage = true;
          }
        }
      });
      if (snapshot.hasText) {
        snapshot.textFontSizeMax = maxFontSize;
        snapshot.textFontSizeMin = minFontSize === 9999 ? maxFontSize : minFontSize;
        snapshot.textLineCount = lineCount || 1;
      }
    } else if (node.type === "TEXT") {
      snapshot.hasText = true;
      const t = node;
      const size = t.fontSize;
      if (typeof size === "number") {
        snapshot.textFontSizeMax = size;
        snapshot.textFontSizeMin = size;
      }
    } else if (node.type === "RECTANGLE" || node.type === "ELLIPSE") {
      if (Array.isArray(node.fills) && node.fills.some((f) => f.type === "IMAGE")) {
        snapshot.hasImageFill = true;
      }
    }
    return snapshot;
  }
  var init_adapter = __esm({
    "src/heuristics/adapter.ts"() {
    }
  });

  // src/pipeline.ts
  var ConversionPipeline;
  var init_pipeline = __esm({
    "src/pipeline.ts"() {
      init_serialization_utils();
      init_style_utils();
      init_api_gemini();
      init_elementor_compiler();
      init_uploader();
      init_validation();
      init_prompts();
      init_noai_parser();
      init_reference_docs();
      init_heuristics();
      init_adapter();
      ConversionPipeline = class {
        constructor() {
          this.autoFixLayout = false;
          this.autoRename = false;
          this.compiler = new ElementorCompiler();
          this.imageUploader = new ImageUploader({});
        }
        run(_0) {
          return __async(this, arguments, function* (node, wpConfig = {}, options) {
            const normalizedWP = __spreadProps(__spreadValues({}, wpConfig), { password: (wpConfig == null ? void 0 : wpConfig.password) || (wpConfig == null ? void 0 : wpConfig.token) });
            this.compiler.setWPConfig(normalizedWP);
            this.imageUploader.setWPConfig(normalizedWP);
            const provider = (options == null ? void 0 : options.provider) || geminiProvider;
            this.autoFixLayout = !!(options == null ? void 0 : options.autoFixLayout);
            this.autoRename = !!(options == null ? void 0 : options.autoRename);
            const preprocessed = this.preprocess(node);
            const screenshot = (options == null ? void 0 : options.includeScreenshot) === false ? null : yield this.captureNodeImage(preprocessed.serializedRoot.id);
            const schema = yield this.generateSchema(preprocessed, provider, options == null ? void 0 : options.apiKey, {
              includeReferences: (options == null ? void 0 : options.includeReferences) !== false,
              screenshot
            });
            this.validateAndNormalize(schema, preprocessed.serializedRoot, preprocessed.tokens);
            validatePipelineSchema(schema);
            this.hydrateStyles(schema, preprocessed.flatNodes);
            yield this.resolveImages(schema, normalizedWP);
            const elementorJson = this.compiler.compile(schema);
            if (wpConfig.url) elementorJson.siteurl = wpConfig.url;
            validateElementorJSON(elementorJson);
            if (options == null ? void 0 : options.debug) {
              const coverage = computeCoverage(preprocessed.flatNodes, schema, elementorJson);
              const debugInfo = {
                serializedTree: preprocessed.serializedRoot,
                flatNodes: preprocessed.flatNodes,
                schema,
                elementor: elementorJson,
                coverage
              };
              return { elementorJson, debugInfo };
            }
            return elementorJson;
          });
        }
        handleUploadResponse(id, result) {
          this.imageUploader.handleUploadResponse(id, result);
        }
        preprocess(node) {
          const serializedRoot = serializeNode(node);
          const flatNodes = this.flatten(serializedRoot);
          const tokens = this.deriveTokens(serializedRoot);
          return {
            pageTitle: serializedRoot.name || "Pagina importada",
            tokens,
            serializedRoot,
            flatNodes
          };
        }
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
        deriveTokens(serializedRoot) {
          const defaultTokens = { primaryColor: "#000000", secondaryColor: "#FFFFFF" };
          const fills = serializedRoot.fills;
          if (Array.isArray(fills) && fills.length > 0) {
            const solidFill = fills.find((f) => f.type === "SOLID");
            if (solidFill == null ? void 0 : solidFill.color) {
              const { r, g, b } = solidFill.color;
              const toHex = (c) => ("0" + Math.round(c * 255).toString(16)).slice(-2);
              const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
              return { primaryColor: hex, secondaryColor: "#FFFFFF" };
            }
          }
          return defaultTokens;
        }
        captureNodeImage(nodeId) {
          return __async(this, null, function* () {
            if (!nodeId) return null;
            const node = figma.getNodeById(nodeId);
            if (!node || !("exportAsync" in node)) return null;
            try {
              const bytes = yield node.exportAsync({ format: "PNG" });
              const base64 = this.uint8ToBase64(bytes);
              const name = node.name || "frame";
              const size = node.width && node.height ? { width: node.width, height: node.height } : {};
              return __spreadValues({ data: base64, mimeType: "image/png", name }, size);
            } catch (err) {
              console.warn("Falha ao exportar imagem do frame:", err);
              return null;
            }
          });
        }
        uint8ToBase64(bytes) {
          const base64abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
          let result = "", i;
          const l = bytes.length;
          for (i = 2; i < l; i += 3) {
            result += base64abc[bytes[i - 2] >> 2];
            result += base64abc[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
            result += base64abc[(bytes[i - 1] & 15) << 2 | bytes[i] >> 6];
            result += base64abc[bytes[i] & 63];
          }
          if (i === l + 1) {
            result += base64abc[bytes[i - 2] >> 2];
            result += base64abc[(bytes[i - 2] & 3) << 4];
            result += "==";
          } else if (i === l) {
            result += base64abc[bytes[i - 2] >> 2];
            result += base64abc[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
            result += base64abc[(bytes[i - 1] & 15) << 2];
            result += "=";
          }
          return result;
        }
        generateSchema(pre, provider, apiKey, extras) {
          return __async(this, null, function* () {
            console.log("Generating Base Schema (Algorithm)...");
            const baseSchema = convertToFlexSchema(pre.serializedRoot);
            console.log("Optimizing Schema (AI)...");
            const prompt = `${OPTIMIZE_SCHEMA_PROMPT}

SCHEMA BASE:
${JSON.stringify(baseSchema, null, 2)}
`;
            const references = (extras == null ? void 0 : extras.includeReferences) === false ? [] : referenceDocs;
            try {
              const response = yield provider.generateSchema({
                prompt,
                snapshot: pre.serializedRoot,
                instructions: "Otimize o schema JSON fornecido mantendo IDs e dados.",
                apiKey,
                image: (extras == null ? void 0 : extras.screenshot) || void 0,
                references
              });
              if (!response.ok || !response.schema) {
                console.warn("AI returned invalid response. Falling back to base schema.", response.message);
                return baseSchema;
              }
              const aiSchema = response.schema;
              const merged = this.mergeSchemas(baseSchema, aiSchema);
              return merged;
            } catch (error) {
              console.error("AI Optimization failed:", error);
              console.warn("Falling back to Base Schema.");
              return baseSchema;
            }
          });
        }
        /**
         * Mescla o schema base (NO-AI) com o schema otimizado pela IA.
         *
         * Regras:
         * - A estrutura de containers (hierarquia e ids) é sempre a do baseSchema.
         * - A IA só pode sugerir estilos e widgets para containers existentes,
         *   casados por styles.sourceId ou id.
         * - Containers criados apenas pela IA (sem sourceId/id conhecido) são ignorados.
         */
        mergeSchemas(baseSchema, aiSchema) {
          const aiContainersBySource = /* @__PURE__ */ new Map();
          const collect = (c) => {
            var _a;
            const key = ((_a = c.styles) == null ? void 0 : _a.sourceId) || c.id;
            if (key && !aiContainersBySource.has(key)) {
              aiContainersBySource.set(key, c);
            }
            (c.children || []).forEach((child) => collect(child));
          };
          (aiSchema.containers || []).forEach((c) => collect(c));
          const mergeContainer = (base) => {
            var _a, _b, _c;
            const key = ((_a = base.styles) == null ? void 0 : _a.sourceId) || base.id;
            const ai = key ? aiContainersBySource.get(key) : void 0;
            const merged = __spreadProps(__spreadValues({}, base), {
              styles: __spreadValues({}, base.styles || {})
            });
            if (ai) {
              merged._aiOptimized = true;
              merged.styles = __spreadProps(__spreadValues(__spreadValues({}, ai.styles || {}), base.styles || {}), {
                sourceId: ((_b = base.styles) == null ? void 0 : _b.sourceId) || ((_c = ai.styles) == null ? void 0 : _c.sourceId) || base.id
              });
              if (Array.isArray(ai.widgets)) {
                merged.widgets = ai.widgets.map((w) => {
                  var _a2, _b2;
                  return __spreadProps(__spreadValues({}, w), {
                    styles: __spreadProps(__spreadValues({}, w.styles || {}), {
                      sourceId: ((_a2 = w.styles) == null ? void 0 : _a2.sourceId) || w.sourceId || ((_b2 = base.styles) == null ? void 0 : _b2.sourceId) || base.id
                    })
                  });
                });
              }
              if (Array.isArray(ai.children)) {
                merged.children = ai.children.map((child) => mergeContainer(child));
                return merged;
              }
            }
            if (Array.isArray(base.children) && base.children.length > 0) {
              merged.children = base.children.map((child) => mergeContainer(child));
            }
            return merged;
          };
          const mergedContainers = baseSchema.containers.map((c) => mergeContainer(c));
          return {
            page: baseSchema.page,
            containers: mergedContainers
          };
        }
        validateAndNormalize(schema, root, tokens) {
          if (!schema || typeof schema !== "object") throw new Error("Schema invalido: nao e um objeto.");
          if (!schema.page) schema.page = { title: root.name, tokens };
          if (!schema.page.tokens) schema.page.tokens = tokens;
          if (!schema.page.title) schema.page.title = root.name;
          if (!Array.isArray(schema.containers)) schema.containers = [];
          this.rehydrateIds(schema.containers, root);
          schema.containers = this.normalizeContainers(schema.containers);
        }
        rehydrateIds(containers, root) {
          const nodeMap = /* @__PURE__ */ new Map();
          const collectNodes = (n) => {
            nodeMap.set(n.id, n);
            if ("children" in n && Array.isArray(n.children)) {
              n.children.forEach(collectNodes);
            }
          };
          collectNodes(root);
          const walk = (c) => {
            var _a, _b, _c;
            if (!c.id || !nodeMap.has(c.id)) {
              if (((_a = c.styles) == null ? void 0 : _a.sourceId) && nodeMap.has(c.styles.sourceId)) {
                c.id = c.styles.sourceId;
              }
            }
            (_b = c.widgets) == null ? void 0 : _b.forEach((w) => {
              var _a2;
              if (((_a2 = w.styles) == null ? void 0 : _a2.sourceId) && nodeMap.has(w.styles.sourceId)) {
              }
            });
            (_c = c.children) == null ? void 0 : _c.forEach(walk);
          };
          containers.forEach(walk);
        }
        resolveImages(schema, wpConfig) {
          return __async(this, null, function* () {
            const uploadEnabled = !!(wpConfig && wpConfig.url && wpConfig.user && (wpConfig.password || wpConfig.token) && wpConfig.exportImages);
            if (!uploadEnabled) return;
            const isVectorNode = (n) => n.type === "VECTOR" || n.type === "STAR" || n.type === "ELLIPSE" || n.type === "POLYGON" || n.type === "BOOLEAN_OPERATION" || n.type === "LINE";
            const hasVectorChildren = (n) => {
              if (isVectorNode(n)) return true;
              if ("children" in n) {
                return n.children.some((c) => hasVectorChildren(c));
              }
              return false;
            };
            const uploadNodeImage = (nodeId, preferSvg = false) => __async(this, null, function* () {
              if (!nodeId) return null;
              const node = figma.getNodeById(nodeId);
              if (!node) return null;
              let format = preferSvg ? "SVG" : "WEBP";
              const hasImageChildren = (n) => {
                if ("fills" in n && Array.isArray(n.fills)) {
                  if (n.fills.some((f) => f.type === "IMAGE")) return true;
                }
                if ("children" in n) {
                  return n.children.some((c) => hasImageChildren(c));
                }
                return false;
              };
              if ("locked" in node && node.locked) {
                if (hasImageChildren(node)) {
                  format = "WEBP";
                } else if (hasVectorChildren(node)) {
                  format = "SVG";
                } else {
                  format = "WEBP";
                }
              } else if (hasVectorChildren(node)) {
                format = "SVG";
              }
              return this.imageUploader.uploadToWordPress(node, format);
            });
            const processWidget = (widget) => __async(this, null, function* () {
              var _a, _b, _c;
              if (widget.imageId && (widget.type === "image" || widget.type === "custom" || widget.type === "icon" || widget.type === "image-box" || widget.type === "icon-box")) {
                try {
                  const result = yield uploadNodeImage(widget.imageId, widget.type === "icon" || widget.type === "icon-box");
                  if (result) {
                    if (widget.type === "image-box") {
                      if (!widget.styles) widget.styles = {};
                      widget.styles.image_url = result.url;
                    } else if (widget.type === "icon-box") {
                      if (!widget.styles) widget.styles = {};
                      widget.styles.selected_icon = { value: { id: result.id, url: result.url }, library: "svg" };
                    } else if (widget.type === "icon") {
                      widget.content = { value: { id: result.id, url: result.url }, library: "svg" };
                    } else if (((_a = widget.styles) == null ? void 0 : _a.icon) && widget.type === "icon-list") {
                      widget.styles.icon = { value: { id: result.id, url: result.url }, library: "svg" };
                    } else {
                      widget.content = result.url;
                    }
                    widget.imageId = result.id.toString();
                  }
                } catch (e) {
                  console.error(`[Pipeline] Erro ao processar imagem ${widget.imageId}:`, e);
                }
              }
              if (widget.type === "image-carousel" && ((_b = widget.styles) == null ? void 0 : _b.slides) && Array.isArray(widget.styles.slides)) {
                const uploads = widget.styles.slides.map((slide, idx) => __async(this, null, function* () {
                  const nodeId = (slide == null ? void 0 : slide.id) || (slide == null ? void 0 : slide.imageId);
                  if (!nodeId) return;
                  try {
                    const result = yield uploadNodeImage(nodeId, false);
                    if (result) {
                      slide.url = result.url;
                      const parsedId = parseInt(String(result.id), 10);
                      slide.id = isNaN(parsedId) ? "" : parsedId;
                      slide._id = slide._id || `slide_${idx + 1}`;
                      slide.image = { url: slide.url, id: slide.id };
                    }
                  } catch (e) {
                    console.error(`[Pipeline] Erro ao processar slide ${nodeId}:`, e);
                  }
                }));
                yield Promise.all(uploads);
              }
              if ((widget.type === "gallery" || widget.type === "basic-gallery") && ((_c = widget.styles) == null ? void 0 : _c.gallery) && Array.isArray(widget.styles.gallery)) {
                const uploads = widget.styles.gallery.map((imageItem) => __async(this, null, function* () {
                  const nodeId = (imageItem == null ? void 0 : imageItem.id) || (imageItem == null ? void 0 : imageItem.imageId);
                  if (!nodeId) return;
                  try {
                    const result = yield uploadNodeImage(nodeId, false);
                    if (result) {
                      imageItem.url = result.url;
                      const parsedId = parseInt(String(result.id), 10);
                      imageItem.id = isNaN(parsedId) ? "" : parsedId;
                    }
                  } catch (e) {
                    console.error(`[Pipeline] Erro ao processar imagem da galeria ${nodeId}:`, e);
                  }
                }));
                yield Promise.all(uploads);
                widget.styles.gallery = widget.styles.gallery.filter((item) => item.url && item.id);
              }
            });
            const uploadPromises = [];
            const collectUploads = (container) => {
              if (container.widgets) {
                for (const widget of container.widgets) {
                  uploadPromises.push(processWidget(widget));
                }
              }
              if (container.children) {
                for (const child of container.children) {
                  collectUploads(child);
                }
              }
            };
            if (schema.containers) {
              for (const container of schema.containers) {
                collectUploads(container);
              }
            }
            if (uploadPromises.length > 0) {
              yield Promise.all(uploadPromises);
            }
          });
        }
        hydrateStyles(schema, flatNodes) {
          const nodeMap = new Map(flatNodes.map((n) => [n.id, n]));
          const processContainer = (container) => {
            var _a, _b, _c;
            if ((_a = container.styles) == null ? void 0 : _a.sourceId) {
              const node = nodeMap.get(container.styles.sourceId);
              if (node) {
                const realStyles = extractContainerStyles(node);
                container.styles = __spreadValues(__spreadValues({}, container.styles), realStyles);
                if (realStyles.paddingTop !== void 0) container.styles.paddingTop = realStyles.paddingTop;
                if (realStyles.paddingRight !== void 0) container.styles.paddingRight = realStyles.paddingRight;
                if (realStyles.paddingBottom !== void 0) container.styles.paddingBottom = realStyles.paddingBottom;
                if (realStyles.paddingLeft !== void 0) container.styles.paddingLeft = realStyles.paddingLeft;
                if (realStyles.gap !== void 0) container.styles.gap = realStyles.gap;
              }
            }
            if (container.widgets) {
              for (const widget of container.widgets) {
                if ((_b = widget.styles) == null ? void 0 : _b.sourceId) {
                  const node = nodeMap.get(widget.styles.sourceId);
                  if (node) {
                    const realStyles = extractWidgetStyles(node);
                    widget.styles = __spreadValues(__spreadValues({}, widget.styles), realStyles);
                    if (node.type === "VECTOR" || node.type === "STAR" || node.type === "POLYGON" || node.type === "ELLIPSE") {
                      if (widget.type !== "icon" && widget.type !== "image") {
                        widget.type = "icon";
                        widget.imageId = node.id;
                      }
                    } else if (node.type === "RECTANGLE" || node.type === "FRAME") {
                      const hasImage = (_c = node.fills) == null ? void 0 : _c.some((f) => f.type === "IMAGE");
                      if (hasImage && widget.type !== "image") {
                        widget.type = "image";
                        widget.imageId = node.id;
                      }
                    }
                    if (node.type === "TEXT" && (widget.type === "heading" || widget.type === "text")) {
                      if (node.styledTextSegments && node.styledTextSegments.length > 1) {
                        const rich = buildHtmlFromSegments(node);
                        widget.content = rich.html;
                        widget.styles.customCss = rich.css;
                      } else {
                        widget.content = node.characters || node.name;
                      }
                    }
                  }
                }
              }
            }
            if (container.children) {
              for (const child of container.children) {
                processContainer(child);
              }
            }
          };
          if (schema.containers) {
            for (const c of schema.containers) {
              processContainer(c);
            }
          }
        }
        normalizeContainers(containers) {
          const logWarn = (message) => {
            try {
              figma.ui.postMessage({ type: "log", level: "warn", message });
            } catch (e) {
            }
          };
          containers = this.deduplicateContainers(containers);
          const walk = (c, parent) => {
            var _a, _b, _c;
            if (!c.id) {
              logWarn("[AutoFix] Container sem id detectado. Ignorado para evitar quebra.");
              return null;
            }
            if (c.children && c.children.length > 0) {
              c.children = this.deduplicateContainers(c.children);
            }
            const node = figma.getNodeById(c.id);
            if (node) {
              try {
                const snapshot = createNodeSnapshot(node);
                const results = evaluateNode(snapshot, DEFAULT_HEURISTICS);
                const best = results[0];
                if (best) {
                  if (this.autoRename && best.confidence > 0.6) {
                    try {
                      const newName = best.widget;
                      if (!node.name.match(/^[wc]:/) && node.name !== newName) {
                        node.name = newName;
                      }
                    } catch (e) {
                    }
                  }
                }
                if (best && best.confidence >= 0.85) {
                  const widgetType = best.widget.split(":")[1];
                  const prefix = best.widget.split(":")[0];
                  const isLeafWidget = ["w", "e", "wp", "woo"].includes(prefix) && !best.widget.includes("structure");
                  if (isLeafWidget && parent) {
                    let content = node.name;
                    if (node.type === "TEXT") content = node.characters;
                    else if (node.children) {
                      const textChild = node.children.find((child) => child.type === "TEXT");
                      if (textChild) content = textChild.characters;
                    }
                    let imageId = null;
                    if (widgetType === "image" || widgetType === "image-box") {
                      if ((_a = node.fills) == null ? void 0 : _a.some((f) => f.type === "IMAGE")) imageId = node.id;
                      else if (node.children) {
                        const imgChild = node.children.find((child) => child.type === "VECTOR" || child.type === "RECTANGLE" || child.type === "ELLIPSE");
                        if (imgChild) imageId = imgChild.id;
                      }
                    }
                    parent.widgets = parent.widgets || [];
                    parent.widgets.push({
                      type: widgetType,
                      content,
                      imageId,
                      styles: { sourceId: c.id, sourceName: node.name }
                    });
                    return null;
                  }
                }
              } catch (err) {
                console.warn("[Heuristics] Error evaluating node:", err);
              }
            }
            const layoutMode = (node == null ? void 0 : node.layoutMode) || c.layoutMode;
            const type = (node == null ? void 0 : node.type) || c.type;
            const name = (node == null ? void 0 : node.name) || c.name;
            const isFrameLike2 = type === "FRAME" || type === "GROUP" || type === "COMPONENT" || type === "INSTANCE" || type === "SECTION";
            const hasAutoLayout = layoutMode === "HORIZONTAL" || layoutMode === "VERTICAL";
            const looksInvalidContainer = !hasAutoLayout || !isFrameLike2;
            if (looksInvalidContainer) {
              if (!this.autoFixLayout) {
                logWarn(`[AutoFix] Corre\xE7\xE3o desativada. Ative "auto_fix_layout" para aplicar fallback.`);
              } else {
                if (!isFrameLike2 || type === "RECTANGLE" || type === "VECTOR" || type === "TEXT") {
                  if (parent) {
                    parent.widgets = parent.widgets || [];
                    parent.widgets.push({
                      type: "custom",
                      content: (node == null ? void 0 : node.characters) || c.characters || name || null,
                      imageId: null,
                      styles: { sourceId: c.id, sourceName: node == null ? void 0 : node.name }
                    });
                    return null;
                  }
                  c.direction = "column";
                } else {
                  c.direction = "column";
                  logWarn(`[AutoFix] Aplicado fallback: container ${c.id} for\xE7ado para flex column.`);
                }
              }
            }
            if (c.direction !== "row" && c.direction !== "column") {
              c.direction = "column";
              if (c.children && c.children.length > 0) {
                logWarn(`[AI] Container ${c.id} sem direction valido. Ajustado para 'column'.`);
              }
            }
            if (!c.width) {
              c.width = "full";
            } else if (typeof c.width === "number") {
              c.styles = c.styles || {};
              c.styles.width = c.width;
              c.width = "boxed";
            } else if (c.width !== "full" && c.width !== "boxed") {
              logWarn(`[AI] Container ${c.id} com width invalido (${String(c.width)}). Ajustado para 'full'.`);
              c.width = "full";
            }
            if (!Array.isArray(c.widgets)) c.widgets = [];
            c.widgets.forEach((w) => this.normalizeWidget(w));
            if (!Array.isArray(c.children)) c.children = [];
            c.children = c.children.map((child) => walk(child, c)).filter(Boolean);
            if (node && "children" in node && !c._aiOptimized) {
              const collectIds = (container, ids) => {
                var _a2, _b2;
                if (container.id) ids.add(container.id);
                (_a2 = container.widgets) == null ? void 0 : _a2.forEach((w) => {
                  var _a3;
                  if ((_a3 = w.styles) == null ? void 0 : _a3.sourceId) ids.add(w.styles.sourceId);
                  if (w.imageId) ids.add(w.imageId);
                });
                (_b2 = container.children) == null ? void 0 : _b2.forEach((child) => collectIds(child, ids));
              };
              const existingIds = /* @__PURE__ */ new Set();
              collectIds(c, existingIds);
              for (const child of node.children) {
                if (!existingIds.has(child.id) && child.visible) {
                  if (child.type === "TEXT") {
                    c.widgets.push({
                      type: "heading",
                      // Default to heading/text
                      content: child.characters,
                      imageId: null,
                      styles: {
                        sourceId: child.id,
                        sourceName: child.name,
                        color: ((_c = (_b = child.fills) == null ? void 0 : _b[0]) == null ? void 0 : _c.color) ? this.rgbaToHex(child.fills[0].color) : void 0
                      }
                    });
                  } else if (child.type === "FRAME" || child.type === "GROUP" || child.type === "INSTANCE" || child.type === "RECTANGLE") {
                    const rescuedContainer = {
                      id: child.id,
                      direction: child.layoutMode === "HORIZONTAL" ? "row" : "column",
                      width: child.layoutMode ? "boxed" : "full",
                      // Guess
                      styles: { sourceId: child.id, sourceName: child.name },
                      widgets: [],
                      children: []
                    };
                    const processed = walk(rescuedContainer, c);
                    if (processed) c.children.push(processed);
                  }
                }
              }
            }
            if (c.children && c.children.length > 0) {
              c.children = this.deduplicateContainers(c.children);
            }
            return c;
          };
          return containers.map((c) => walk(c, null)).filter(Boolean);
        }
        normalizeWidget(widget) {
          var _a, _b, _c;
          if ((widget.type === "image-box" || widget.type === "icon-box") && ((_a = widget.styles) == null ? void 0 : _a.title_text) && typeof widget.styles.title_text === "object") {
            const tt = widget.styles.title_text;
            if (tt.imageId && !widget.imageId) widget.imageId = tt.imageId;
            if (tt.title) widget.content = tt.title;
            if (tt.description) widget.styles.description_text = tt.description;
            widget.styles.title_text = tt.title || "";
          }
          if (widget.type === "image-box" && !widget.imageId && ((_c = (_b = widget.styles) == null ? void 0 : _b.image) == null ? void 0 : _c.id)) {
            widget.imageId = widget.styles.image.id;
          }
        }
        rgbaToHex(color) {
          if (!color) return "#000000";
          const r = Math.round(color.r * 255);
          const g = Math.round(color.g * 255);
          const b = Math.round(color.b * 255);
          return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        }
        deduplicateContainers(containers) {
          const map = /* @__PURE__ */ new Map();
          const order = [];
          const resolveKey = (container) => {
            var _a;
            return ((_a = container.styles) == null ? void 0 : _a.sourceId) || container.id;
          };
          for (const c of containers) {
            if (!c.id) {
              continue;
            }
            const key = resolveKey(c);
            if (!key) {
              if (!map.has(c.id)) {
                map.set(c.id, __spreadProps(__spreadValues({}, c), { widgets: [...c.widgets || []], children: [...c.children || []] }));
                order.push(c.id);
              }
              continue;
            }
            if (!map.has(key)) {
              map.set(key, __spreadProps(__spreadValues({}, c), { widgets: [...c.widgets || []], children: [...c.children || []] }));
              order.push(key);
              continue;
            }
            const existing = map.get(key);
            if (c.styles && existing.styles) {
              const existingStylesCount = Object.keys(existing.styles).length;
              const newStylesCount = Object.keys(c.styles).length;
              if (newStylesCount > existingStylesCount) {
                existing.styles = __spreadValues(__spreadValues({}, existing.styles), c.styles);
              }
            } else if (c.styles && !existing.styles) {
              existing.styles = __spreadValues({}, c.styles);
            }
          }
          return order.map((id) => map.get(id));
        }
      };
    }
  });

  // src/api_openai.ts
  function fetchWithTimeout2(_0) {
    return __async(this, arguments, function* (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS2) {
      const AC = typeof AbortController === "function" ? AbortController : null;
      let controller = null;
      if (AC) {
        try {
          controller = new AC();
        } catch (e) {
          controller = null;
        }
      }
      if (!controller) {
        return yield fetch(url, options);
      }
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const resp = yield fetch(url, __spreadProps(__spreadValues({}, options), { signal: controller.signal }));
        return resp;
      } finally {
        clearTimeout(id);
      }
    });
  }
  function getOpenAIKey() {
    return __async(this, null, function* () {
      return yield figma.clientStorage.getAsync("gpt_api_key");
    });
  }
  function saveOpenAIModel(model) {
    return __async(this, null, function* () {
      yield figma.clientStorage.setAsync("gpt_model", model);
    });
  }
  function cleanJson2(content) {
    return content.replace(/```json/gi, "").replace(/```/g, "").trim();
  }
  function parseJsonResponse(rawContent) {
    return __async(this, null, function* () {
      const clean = cleanJson2(rawContent);
      try {
        return JSON.parse(clean);
      } catch (err) {
        throw new Error("Resposta nao JSON");
      }
    });
  }
  function mapStatusError(status, parsed) {
    var _a;
    const base = (_a = parsed == null ? void 0 : parsed.error) == null ? void 0 : _a.message;
    if (status === 401) return "API Key invalida (401).";
    if (status === 404) return "Modelo nao encontrado (404).";
    if (status === 429) return "Quota excedida (429).";
    if (status >= 500) return "Erro interno da OpenAI (5xx).";
    return base || `HTTP ${status}`;
  }
  function callOpenAI(apiKey, model, messages, maxTokens = 8192, retries = 3) {
    return __async(this, null, function* () {
      var _a, _b, _c;
      const requestBody = {
        model,
        messages,
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: { type: "json_object" }
      };
      let attempt = 0;
      while (attempt < retries) {
        try {
          const response = yield fetchWithTimeout2(OPENAI_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
          });
          if (!response.ok) {
            const rawText = yield response.text();
            let parsed = null;
            try {
              parsed = JSON.parse(rawText);
            } catch (e) {
              parsed = rawText;
            }
            const error = mapStatusError(response.status, parsed);
            if (response.status >= 400 && response.status < 500) {
              return { ok: false, error, raw: parsed };
            }
            attempt++;
            if (attempt >= retries) return { ok: false, error, raw: parsed };
            yield new Promise((res) => setTimeout(res, 500 * attempt));
            continue;
          }
          const data = yield response.json();
          const content = (_c = (_b = (_a = data == null ? void 0 : data.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content;
          if (!content) {
            return { ok: false, error: "Resposta vazia da OpenAI.", raw: data };
          }
          try {
            const schema = yield parseJsonResponse(content);
            return { ok: true, data: schema, schema, raw: data };
          } catch (err) {
            return { ok: false, error: (err == null ? void 0 : err.message) || "Resposta nao JSON", raw: content };
          }
        } catch (err) {
          attempt++;
          if (attempt >= retries) {
            const aborted = (err == null ? void 0 : err.name) === "AbortError";
            const message = aborted ? "Timeout na chamada OpenAI." : (err == null ? void 0 : err.message) || "Erro desconhecido ao chamar OpenAI.";
            return { ok: false, error: message, raw: err };
          }
          yield new Promise((res) => setTimeout(res, 500 * attempt));
        }
      }
      return { ok: false, error: "Falha ao chamar OpenAI apos retries." };
    });
  }
  function testOpenAIConnection(apiKey, model) {
    return __async(this, null, function* () {
      const messages = [
        { role: "system", content: `${JSON_SAFETY} Retorne {"pong": true}.` },
        { role: "user", content: "ping (json)" }
      ];
      const resp = yield callOpenAI(apiKey, model, messages, 64, 1);
      return { ok: resp.ok, error: resp.error, data: resp.raw };
    });
  }
  var OPENAI_API_URL, DEFAULT_TIMEOUT_MS2, DEFAULT_GPT_MODEL, JSON_SAFETY, openaiProvider;
  var init_api_openai = __esm({
    "src/api_openai.ts"() {
      OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
      DEFAULT_TIMEOUT_MS2 = 12e3;
      DEFAULT_GPT_MODEL = "gpt-4.1-mini";
      JSON_SAFETY = "Responda sempre em JSON (json) valido e completo.";
      openaiProvider = {
        id: "gpt",
        model: DEFAULT_GPT_MODEL,
        setModel(model) {
          this.model = model;
          saveOpenAIModel(model).catch(() => {
          });
        },
        generateSchema(input) {
          return __async(this, null, function* () {
            var _a;
            const apiKey = input.apiKey || (yield getOpenAIKey());
            if (!apiKey) {
              return { ok: false, error: "API Key do OpenAI nao configurada." };
            }
            const model = this.model;
            const messages = [
              { role: "system", content: `${input.instructions}
${JSON_SAFETY}` },
              { role: "user", content: input.prompt },
              { role: "user", content: `SNAPSHOT (json esperado):
${JSON.stringify(input.snapshot)}` }
            ];
            if (input.references && input.references.length > 0) {
              const refText = input.references.map((r) => `### ${r.name}
${r.content}`).join("\n\n");
              messages.push({ role: "user", content: `REFERENCIAS:
${refText}` });
            }
            if ((_a = input.image) == null ? void 0 : _a.data) {
              messages.push({
                role: "user",
                content: [
                  { type: "text", text: "PRINT DO FRAME (PNG base64 inline):" },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${input.image.mimeType || "image/png"};base64,${input.image.data}`
                    }
                  }
                ]
              });
            }
            const resp = yield callOpenAI(apiKey, model, messages);
            if (!resp.ok) return resp;
            return { ok: true, schema: resp.schema, data: resp.data, raw: resp.raw };
          });
        },
        testConnection(apiKey) {
          return __async(this, null, function* () {
            const keyToTest = apiKey || (yield getOpenAIKey());
            const model = this.model;
            if (!keyToTest) {
              return { ok: false, error: "API Key do OpenAI nao configurada." };
            }
            return yield testOpenAIConnection(keyToTest, model);
          });
        }
      };
    }
  });

  // src/code.ts
  var require_code = __commonJS({
    "src/code.ts"(exports) {
      init_pipeline();
      init_serialization_utils();
      init_api_gemini();
      init_api_openai();
      init_noai_parser();
      init_elementor_compiler();
      init_uploader();
      init_adapter();
      init_heuristics();
      figma.showUI(__html__, { width: 600, height: 820, themeColors: true });
      var pipeline = new ConversionPipeline();
      var lastJSON = null;
      var noaiUploader = null;
      var DEFAULT_TIMEOUT_MS3 = 12e3;
      var DEFAULT_PROVIDER = "gemini";
      var DEFAULT_GPT_MODEL2 = "gpt-4.1-mini";
      function getActiveProvider(providerId) {
        return providerId === "gpt" ? openaiProvider : geminiProvider;
      }
      function collectLayoutWarnings(node) {
        const warnings = [];
        if (Array.isArray(node.children)) {
          node.children.forEach((child) => warnings.push(...collectLayoutWarnings(child)));
        }
        return warnings;
      }
      function toBase64(str) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        let output = "";
        let i = 0;
        while (i < str.length) {
          const c1 = str.charCodeAt(i++);
          const c2 = i < str.length ? str.charCodeAt(i++) : NaN;
          const c3 = i < str.length ? str.charCodeAt(i++) : NaN;
          const e1 = c1 >> 2;
          const e2 = (c1 & 3) << 4 | (isNaN(c2) ? 0 : c2 >> 4);
          const e3 = isNaN(c2) ? 64 : (c2 & 15) << 2 | (isNaN(c3) ? 0 : c3 >> 6);
          const e4 = isNaN(c3) ? 64 : c3 & 63;
          output += chars.charAt(e1) + chars.charAt(e2) + (e3 === 64 ? "=" : chars.charAt(e3)) + (e4 === 64 ? "=" : chars.charAt(e4));
        }
        return output;
      }
      function fetchWithTimeout3(_0) {
        return __async(this, arguments, function* (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS3) {
          const AC = typeof AbortController !== "undefined" ? AbortController : null;
          if (!AC) {
            return yield fetch(url, options);
          }
          const controller = new AC();
          const id = setTimeout(() => controller.abort(), timeoutMs);
          try {
            return yield fetch(url, __spreadProps(__spreadValues({}, options), {
              signal: controller.signal,
              headers: __spreadProps(__spreadValues({}, options.headers), {
                "User-Agent": "Figma-To-Elementor/1.0"
              })
            }));
          } finally {
            clearTimeout(id);
          }
        });
      }
      function normalizeWpUrl(raw) {
        if (!raw) return "";
        let url = raw.trim();
        if (!/^https?:\/\//i.test(url)) {
          url = "https://" + url;
        }
        url = url.replace(/\/+$/, "");
        return url;
      }
      function loadSetting(key, defaultValue) {
        return __async(this, null, function* () {
          try {
            const value = yield figma.clientStorage.getAsync(key);
            if (value === void 0 || value === null) return defaultValue;
            return value;
          } catch (e) {
            return defaultValue;
          }
        });
      }
      function saveSetting(key, value) {
        return __async(this, null, function* () {
          try {
            yield figma.clientStorage.setAsync(key, value);
          } catch (e) {
            console.warn("Failed to save setting", key, e);
          }
        });
      }
      function loadWPConfig() {
        return __async(this, null, function* () {
          const url = yield loadSetting("gptel_wp_url", "");
          const user = yield loadSetting("gptel_wp_user", "");
          const token = yield loadSetting("gptel_wp_token", "");
          const exportImages = yield loadSetting("gptel_export_images", false);
          const autoPage = yield loadSetting("gptel_auto_page", false);
          if (!url || !token || !user) {
            const legacy = yield loadSetting("wp_config", null);
            if (legacy) {
              return {
                url: legacy.url || url,
                user: legacy.user || user,
                token: legacy.auth || token,
                exportImages,
                autoPage
              };
            }
          }
          return { url, user, token, exportImages, autoPage };
        });
      }
      function resolveProviderConfig(msg) {
        return __async(this, null, function* () {
          const incomingProvider = (msg == null ? void 0 : msg.providerAi) || (yield loadSetting("aiProvider", DEFAULT_PROVIDER)) || (yield loadSetting("provider_ai", DEFAULT_PROVIDER));
          const providerId = incomingProvider === "gpt" ? "gpt" : DEFAULT_PROVIDER;
          yield saveSetting("aiProvider", providerId);
          yield saveSetting("provider_ai", providerId);
          const provider = getActiveProvider(providerId);
          if (providerId === "gpt") {
            const inlineKey2 = msg == null ? void 0 : msg.gptApiKey;
            let key2 = inlineKey2 || (yield loadSetting("gptApiKey", "")) || (yield loadSetting("gpt_api_key", ""));
            if (inlineKey2) {
              yield saveSetting("gptApiKey", inlineKey2);
              yield saveSetting("gpt_api_key", inlineKey2);
            }
            const storedModel = (msg == null ? void 0 : msg.gptModel) || (yield loadSetting("gptModel", DEFAULT_GPT_MODEL2)) || (yield loadSetting("gpt_model", openaiProvider.model));
            if (storedModel) {
              yield saveSetting("gptModel", storedModel);
              yield saveSetting("gpt_model", storedModel);
              openaiProvider.setModel(storedModel);
            }
            if (!key2) throw new Error("OpenAI API Key nao configurada.");
            return { provider, apiKey: key2, providerId };
          }
          const inlineKey = msg == null ? void 0 : msg.apiKey;
          let key = inlineKey || (yield loadSetting("gptel_gemini_key", ""));
          if (!key) {
            key = yield loadSetting("gemini_api_key", "");
          }
          if (inlineKey) {
            yield saveSetting("gptel_gemini_key", inlineKey);
            yield saveSetting("gemini_api_key", inlineKey);
          }
          const model = (msg == null ? void 0 : msg.geminiModel) || (yield loadSetting("gemini_model", GEMINI_MODEL));
          if (model) {
            yield saveSetting("gemini_model", model);
            geminiProvider.setModel(model);
          }
          if (!key) throw new Error("Gemini API Key nao configurada.");
          return { provider, apiKey: key, providerId };
        });
      }
      function getSelectedNode() {
        const selection = figma.currentPage.selection;
        if (!selection || selection.length === 0) {
          throw new Error("Selecione um frame ou node para converter.");
        }
        return selection[0];
      }
      function generateElementorJSON(aiPayload, customWP, debug) {
        return __async(this, null, function* () {
          const node = getSelectedNode();
          log(`[DEBUG] Selected Node: ${node.name} (ID: ${node.id}, Type: ${node.type}, Locked: ${node.locked})`, "info");
          const wpConfig = customWP || (yield loadWPConfig());
          const useAI = typeof (aiPayload == null ? void 0 : aiPayload.useAI) === "boolean" ? aiPayload.useAI : yield loadSetting("gptel_use_ai", true);
          const serialized = serializeNode(node);
          const includeScreenshot = typeof (aiPayload == null ? void 0 : aiPayload.includeScreenshot) === "boolean" ? aiPayload.includeScreenshot : yield loadSetting("gptel_include_screenshot", true);
          const includeReferences = typeof (aiPayload == null ? void 0 : aiPayload.includeReferences) === "boolean" ? aiPayload.includeReferences : yield loadSetting("gptel_include_references", true);
          if (!useAI) {
            log("Iniciando pipeline (NO-AI)...", "info");
            const elementorJson = yield runPipelineWithoutAI(serialized, wpConfig);
            log("Pipeline NO-AI concluido.", "success");
            return { elementorJson };
          }
          const { provider, apiKey, providerId } = yield resolveProviderConfig(aiPayload);
          const autoFixLayout = yield loadSetting("auto_fix_layout", false);
          log(`Iniciando pipeline (${providerId.toUpperCase()})...`, "info");
          const result = yield pipeline.run(node, wpConfig, {
            debug,
            provider,
            apiKey,
            autoFixLayout,
            includeScreenshot,
            includeReferences,
            autoRename: typeof (aiPayload == null ? void 0 : aiPayload.autoRename) === "boolean" ? aiPayload.autoRename : yield loadSetting("gptel_auto_rename", false)
          });
          log("Pipeline concluido.", "success");
          if (debug && result.elementorJson) {
            return result;
          }
          return { elementorJson: result };
        });
      }
      function log(message, level = "info") {
        figma.ui.postMessage({ type: "log", level, message });
      }
      function deliverResult(json, debugInfo) {
        return __async(this, null, function* () {
          var _a;
          const normalizedElements = json.elements || json.content || [];
          const normalizedJson = {
            type: json.type || "elementor",
            siteurl: json.siteurl || ((_a = this == null ? void 0 : this.wpConfig) == null ? void 0 : _a.url) || "",
            version: json.version || "0.4",
            elements: normalizedElements
          };
          const payload = JSON.stringify(normalizedJson, null, 2);
          const pastePayload = payload;
          lastJSON = payload;
          figma.ui.postMessage({ type: "generation-complete", payload, pastePayload, debug: debugInfo });
          figma.ui.postMessage({ type: "copy-json", payload: pastePayload });
        });
      }
      function sendPreview(data) {
        const payload = typeof data === "string" ? data : JSON.stringify(data, null, 2);
        figma.ui.postMessage({ type: "preview", payload });
      }
      function runPipelineWithoutAI(_0) {
        return __async(this, arguments, function* (serializedTree, wpConfig = {}) {
          const analyzed = analyzeTreeWithHeuristics(serializedTree);
          const schema = convertToFlexSchema(analyzed);
          const normalizedWP = __spreadProps(__spreadValues({}, wpConfig), { password: (wpConfig == null ? void 0 : wpConfig.password) || (wpConfig == null ? void 0 : wpConfig.token) });
          noaiUploader = new ImageUploader({});
          noaiUploader.setWPConfig(normalizedWP);
          const uploadEnabled = !!(normalizedWP && normalizedWP.url && normalizedWP.user && normalizedWP.password && normalizedWP.exportImages);
          const uploadPromises = [];
          const processWidget = (widget) => __async(null, null, function* () {
            if (uploadEnabled && widget.imageId && (widget.type === "image" || widget.type === "custom" || widget.type === "icon" || widget.type === "image-box" || widget.type === "icon-box")) {
              try {
                const node = figma.getNodeById(widget.imageId);
                if (node) {
                  let format = widget.type === "icon" || widget.type === "icon-box" ? "SVG" : "WEBP";
                  const isVectorNode = (n) => n.type === "VECTOR" || n.type === "STAR" || n.type === "ELLIPSE" || n.type === "POLYGON" || n.type === "BOOLEAN_OPERATION" || n.type === "LINE";
                  const hasVectorChildren = (n) => {
                    if (isVectorNode(n)) return true;
                    if ("children" in n) {
                      return n.children.some((c) => hasVectorChildren(c));
                    }
                    return false;
                  };
                  const hasImageChildren = (n) => {
                    if ("fills" in n && Array.isArray(n.fills)) {
                      if (n.fills.some((f) => f.type === "IMAGE")) return true;
                    }
                    if ("children" in n) {
                      return n.children.some((c) => hasImageChildren(c));
                    }
                    return false;
                  };
                  if ("locked" in node && node.locked) {
                    if (hasImageChildren(node)) {
                      format = "WEBP";
                    } else if (hasVectorChildren(node)) {
                      format = "SVG";
                    } else {
                      format = "WEBP";
                    }
                  } else if (hasVectorChildren(node)) {
                    format = "SVG";
                  }
                  const result = yield noaiUploader.uploadToWordPress(node, format);
                  if (result) {
                    if (widget.type === "image-box") {
                      if (!widget.styles) widget.styles = {};
                      widget.styles.image_url = result.url;
                    } else if (widget.type === "icon-box") {
                      if (!widget.styles) widget.styles = {};
                      widget.styles.selected_icon = { value: result.url, library: "svg" };
                    } else {
                      widget.content = result.url;
                    }
                    widget.imageId = result.id.toString();
                  }
                }
              } catch (e) {
                console.error(`[NO-AI] Erro ao processar imagem ${widget.imageId}:`, e);
              }
            }
          });
          const collectUploads = (container) => {
            for (const widget of container.widgets || []) {
              uploadPromises.push(processWidget(widget));
            }
            for (const child of container.children || []) {
              collectUploads(child);
            }
          };
          for (const container of schema.containers) {
            collectUploads(container);
          }
          if (uploadPromises.length > 0) {
            yield Promise.all(uploadPromises);
          }
          const compiler = new ElementorCompiler();
          compiler.setWPConfig(normalizedWP);
          const json = compiler.compile(schema);
          if (normalizedWP.url) json.siteurl = normalizedWP.url;
          return json;
        });
      }
      function sendStoredSettings() {
        return __async(this, null, function* () {
          let geminiKey = yield loadSetting("gptel_gemini_key", "");
          if (!geminiKey) {
            geminiKey = yield loadSetting("gemini_api_key", "");
          }
          const geminiModel = yield loadSetting("gemini_model", GEMINI_MODEL);
          const providerAi = (yield loadSetting("aiProvider", DEFAULT_PROVIDER)) || (yield loadSetting("provider_ai", DEFAULT_PROVIDER));
          const gptKey = (yield loadSetting("gptApiKey", "")) || (yield loadSetting("gpt_api_key", ""));
          const gptModel = (yield loadSetting("gptModel", DEFAULT_GPT_MODEL2)) || (yield loadSetting("gpt_model", openaiProvider.model));
          const wpUrl = yield loadSetting("gptel_wp_url", "");
          const wpUser = yield loadSetting("gptel_wp_user", "");
          const wpToken = yield loadSetting("gptel_wp_token", "");
          const exportImages = yield loadSetting("gptel_export_images", false);
          const autoPage = yield loadSetting("gptel_auto_page", false);
          const darkMode = yield loadSetting("gptel_dark_mode", false);
          const useAI = yield loadSetting("gptel_use_ai", true);
          const includeScreenshot = yield loadSetting("gptel_include_screenshot", true);
          const includeReferences = yield loadSetting("gptel_include_references", true);
          const autoRename = yield loadSetting("gptel_auto_rename", false);
          figma.ui.postMessage({
            type: "load-settings",
            payload: {
              geminiKey,
              geminiModel,
              providerAi,
              gptKey,
              gptModel,
              wpUrl,
              wpUser,
              wpToken,
              exportImages,
              autoPage,
              darkMode,
              useAI,
              includeScreenshot,
              includeReferences,
              autoRename
            }
          });
        });
      }
      figma.ui.onmessage = (msg) => __async(null, null, function* () {
        var _a;
        if (!msg || typeof msg !== "object") return;
        switch (msg.type) {
          case "inspect":
            try {
              const node = getSelectedNode();
              const serialized = serializeNode(node);
              sendPreview(serialized);
              const warns = collectLayoutWarnings(serialized);
              if (warns.length > 0) {
                warns.forEach((w) => log(w, "warn"));
              } else {
                log("Inspecao: nenhum problema de auto layout detectado.", "info");
              }
              log("Arvore inspecionada.", "info");
            } catch (error) {
              log((error == null ? void 0 : error.message) || String(error), "error");
            }
            break;
          case "generate-json":
            try {
              figma.ui.postMessage({ type: "generation-start" });
              const wpConfig = msg.wpConfig;
              const debug = !!msg.debug;
              const { elementorJson, debugInfo } = yield generateElementorJSON(msg, wpConfig, debug);
              yield deliverResult(elementorJson, debugInfo);
            } catch (error) {
              const message = (error == null ? void 0 : error.message) || String(error);
              log(`Erro: ${message}`, "error");
              figma.ui.postMessage({ type: "generation-error", message });
              figma.notify("Erro ao gerar JSON. Verifique os logs.", { timeout: 5e3 });
            }
            break;
          case "copy-json":
            if (lastJSON) {
              figma.ui.postMessage({ type: "copy-json", payload: lastJSON });
            } else {
              log("Nenhum JSON para copiar.", "warn");
            }
            break;
          case "upload-image-response":
            pipeline.handleUploadResponse(msg.id, msg);
            if (noaiUploader) {
              noaiUploader.handleUploadResponse(msg.id, msg);
            }
            break;
          case "download-json":
            if (lastJSON) {
              figma.ui.postMessage({ type: "preview", payload: lastJSON, action: "download" });
            } else {
              log("Nenhum JSON para baixar.", "warn");
            }
            break;
          case "test-gemini":
            try {
              if (msg.model) {
                yield saveSetting("gemini_model", msg.model);
                geminiProvider.setModel(msg.model);
              }
              const inlineKey = msg.apiKey;
              if (inlineKey) {
                yield saveSetting("gptel_gemini_key", inlineKey);
                yield saveSetting("gemini_api_key", inlineKey);
              }
              const res = yield geminiProvider.testConnection(inlineKey);
              figma.ui.postMessage({ type: "gemini-status", success: res.ok, message: res.message });
            } catch (e) {
              figma.ui.postMessage({ type: "gemini-status", success: false, message: `Erro: ${(e == null ? void 0 : e.message) || e}` });
            }
            break;
          case "test-gpt":
            try {
              const inlineKey = msg.apiKey || msg.gptApiKey || "";
              if (inlineKey) {
                yield saveSetting("gptApiKey", inlineKey);
                yield saveSetting("gpt_api_key", inlineKey);
              }
              const model = msg.model || (yield loadSetting("gptModel", DEFAULT_GPT_MODEL2)) || (yield loadSetting("gpt_model", DEFAULT_GPT_MODEL2));
              if (model) {
                yield saveSetting("gptModel", model);
                yield saveSetting("gpt_model", model);
                openaiProvider.setModel(model);
              }
              const keyToUse = inlineKey || (yield loadSetting("gptApiKey", "")) || (yield loadSetting("gpt_api_key", ""));
              const res = yield testOpenAIConnection(keyToUse, model || openaiProvider.model);
              figma.ui.postMessage({ type: "gpt-status", success: res.ok, message: res.error || "Conexao com GPT verificada." });
            } catch (e) {
              figma.ui.postMessage({ type: "gpt-status", success: false, message: `Erro: ${(e == null ? void 0 : e.message) || e}` });
            }
            break;
          case "test-wp":
            try {
              const incoming = msg.wpConfig;
              const cfg = incoming && incoming.url ? incoming : yield loadWPConfig();
              const url = normalizeWpUrl((cfg == null ? void 0 : cfg.url) || "");
              const user = ((cfg == null ? void 0 : cfg.user) || "").trim();
              const token = ((cfg == null ? void 0 : cfg.token) || (cfg == null ? void 0 : cfg.password) || "").replace(/\s+/g, "");
              if (!url || !user || !token) {
                figma.ui.postMessage({ type: "wp-status", success: false, message: "URL, usuario ou senha do app ausentes." });
                break;
              }
              figma.ui.postMessage({
                type: "log",
                level: "info",
                message: `[WP] Test -> endpoint: ${url} / user: ${user} / tokenLen: ${token.length}`
              });
              const endpoint = url + "/wp-json/wp/v2/users/me";
              const auth = toBase64(`${user}:${token}`);
              const resp = yield fetchWithTimeout3(endpoint, {
                method: "GET",
                headers: { Authorization: `Basic ${auth}`, Accept: "application/json" }
              });
              if (!resp.ok) {
                const text = yield resp.text();
                figma.ui.postMessage({ type: "log", level: "error", message: `[WP] Test FAIL (${resp.status}) -> ${text}` });
                figma.ui.postMessage({ type: "wp-status", success: false, message: `Falha (${resp.status}): ${text || "sem detalhe"}` });
                break;
              }
              const autoPage = (_a = cfg.autoPage) != null ? _a : cfg.createPage;
              yield saveSetting("gptel_wp_url", url);
              yield saveSetting("gptel_wp_user", user);
              yield saveSetting("gptel_wp_token", token);
              yield saveSetting("gptel_export_images", !!cfg.exportImages);
              yield saveSetting("gptel_auto_page", !!autoPage);
              figma.ui.postMessage({ type: "wp-status", success: true, message: "Conexao com WordPress verificada." });
            } catch (e) {
              figma.ui.postMessage({ type: "wp-status", success: false, message: `Erro: ${(e == null ? void 0 : e.message) || e}` });
            }
            break;
          case "save-setting":
            if (msg.key) {
              yield saveSetting(msg.key, msg.value);
            }
            break;
          case "load-settings":
            yield sendStoredSettings();
            break;
          case "reset":
            lastJSON = null;
            break;
          case "resize-ui":
            if (msg.width && msg.height) {
              figma.ui.resize(Math.min(1500, msg.width), Math.min(1e3, msg.height));
            }
            break;
          case "rename-layer":
            try {
              const selection = figma.currentPage.selection;
              if (!selection || selection.length === 0) throw new Error("Nenhum layer selecionado.");
              const node = selection[0];
              const name = msg.name;
              if (name) node.name = name;
              figma.notify(`Layer renomeada para ${name}`);
            } catch (e) {
              figma.notify((e == null ? void 0 : e.message) || "Falha ao renomear layer");
            }
            break;
          case "run-heuristics-rename":
            try {
              const selection = figma.currentPage.selection;
              if (!selection || selection.length === 0) throw new Error("Selecione um frame ou node para organizar.");
              let count = 0;
              const processNode = (node) => {
                try {
                  const snapshot = createNodeSnapshot(node);
                  const results = evaluateNode(snapshot, DEFAULT_HEURISTICS);
                  const best = results[0];
                  if (best && best.confidence > 0.6) {
                    const newName = best.widget;
                    if (!node.name.match(/^[wc]:/) && node.name !== newName) {
                      node.name = newName;
                      count++;
                    }
                  }
                } catch (e) {
                }
                if ("children" in node) {
                  for (const child of node.children) {
                    processNode(child);
                  }
                }
              };
              selection.forEach(processNode);
              figma.notify(`Organiza\xE7\xE3o conclu\xEDda! ${count} layers renomeados.`);
            } catch (e) {
              figma.notify((e == null ? void 0 : e.message) || "Erro ao organizar layers");
            }
            break;
          case "close":
            figma.closePlugin();
            break;
        }
      });
      sendStoredSettings();
    }
  });
  require_code();
})();
