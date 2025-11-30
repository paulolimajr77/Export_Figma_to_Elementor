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
    const justifyMap = { MIN: "start", CENTER: "center", MAX: "end", SPACE_BETWEEN: "space-between" };
    const alignMap = { MIN: "start", CENTER: "center", MAX: "end", STRETCH: "stretch" };
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
            var _a, _b, _c, _d, _e, _f;
            const apiKey = input.apiKey || (yield getKey());
            if (!apiKey) {
              return { ok: false, message: "API Key do Gemini nao configurada." };
            }
            const model = this.model || GEMINI_MODEL;
            const endpoint = `${API_BASE_URL}${model}:generateContent?key=${apiKey}`;
            const contents = [{
              parts: [
                { text: input.instructions },
                { text: input.prompt },
                { text: `SNAPSHOT:
${JSON.stringify(input.snapshot)}` }
              ]
            }];
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
                const message = ((_a = parsed == null ? void 0 : parsed.error) == null ? void 0 : _a.message) || `HTTP ${response.status}`;
                return { ok: false, message: `Falha na API Gemini: ${message}`, raw: parsed };
              }
              const data = yield response.json();
              const text = (_f = (_e = (_d = (_c = (_b = data == null ? void 0 : data.candidates) == null ? void 0 : _b[0]) == null ? void 0 : _c.content) == null ? void 0 : _d.parts) == null ? void 0 : _e[0]) == null ? void 0 : _f.text;
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
          compile: (w, base) => ({ widgetType: "heading", settings: __spreadProps(__spreadValues({}, base), { title: w.content || "Heading" }) })
        },
        {
          key: "text",
          widgetType: "text-editor",
          family: "text",
          compile: (w, base) => ({ widgetType: "text-editor", settings: __spreadProps(__spreadValues({}, base), { editor: w.content || "Text" }) })
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
          compile: (w, base) => ({
            widgetType: "image-carousel",
            settings: __spreadProps(__spreadValues({}, base), {
              slides: base.slides || [
                {
                  id: w.imageId && !isNaN(parseInt(w.imageId, 10)) ? parseInt(w.imageId, 10) : "",
                  url: w.content || "",
                  _id: "slide1"
                }
              ]
            })
          })
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
          var _a, _b;
          const elements = schema.containers.map((container) => this.compileContainer(container, false));
          const template = {
            type: "page",
            version: "0.4",
            title: ((_a = schema == null ? void 0 : schema.page) == null ? void 0 : _a.title) || "Pagina importada",
            siteurl: ((_b = this.wpConfig) == null ? void 0 : _b.url) || "",
            page_settings: {},
            content: elements,
            elements
          };
          return template;
        }
        compileContainer(container, isInner) {
          const id = generateGUID();
          const settings = __spreadValues({
            _element_id: id,
            container_type: "flex",
            content_width: container.width === "full" ? "full" : "boxed",
            flex_direction: container.direction === "row" ? "row" : "column"
          }, this.mapContainerStyles(container.styles));
          if (!settings.flex_gap) {
            settings.flex_gap = { unit: "px", size: 0, column: "0", row: "0", isLinked: true };
          }
          if (!settings.justify_content) settings.justify_content = "start";
          if (!settings.align_items) settings.align_items = "start";
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
          if (styles.primaryAxisAlignItems) {
            const map = { MIN: "start", CENTER: "center", MAX: "end", SPACE_BETWEEN: "space-between" };
            settings.justify_content = map[styles.primaryAxisAlignItems] || "start";
          }
          if (styles.counterAxisAlignItems) {
            const map = { MIN: "start", CENTER: "center", MAX: "end", STRETCH: "stretch" };
            settings.align_items = map[styles.counterAxisAlignItems] || "start";
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
        compileWidget(widget) {
          var _a, _b;
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
            return {
              id: widgetId,
              elType: "widget",
              isLocked: false,
              widgetType: registryResult.widgetType,
              settings: registryResult.settings,
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
              settings.selected_icon = { value: widget.content || "fas fa-star", library: "fa-solid" };
              break;
            case "custom":
            default:
              widgetType = "html";
              settings.html = widget.content || "";
              break;
          }
          return {
            id: widgetId,
            elType: "widget",
            isLocked: false,
            widgetType,
            settings,
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
      throw new Error(`Container ${container.id} com width invalido.`);
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

TRANSFORMA\xC7\xD5ES DESEJADAS:
-   **Icon List**: Se vir uma lista de containers onde cada um tem um \xCDcone + Texto -> Converta para widget "icon-list".
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
            return { type: "basic-gallery", content: node.name, imageId: null, styles };
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
    const direction = node.layoutMode === "HORIZONTAL" ? "row" : "column";
    const styles = extractContainerStyles(node);
    const widgets = [];
    const childrenContainers = [];
    const childNodes = Array.isArray(node.children) ? [...node.children] : [];
    if (node.layoutMode !== "HORIZONTAL" && node.layoutMode !== "VERTICAL") {
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
      width: "full",
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
  var vectorTypes;
  var init_noai_parser = __esm({
    "src/pipeline/noai.parser.ts"() {
      init_style_utils();
      vectorTypes = ["VECTOR", "STAR", "ELLIPSE", "POLYGON", "BOOLEAN_OPERATION", "LINE", "RECTANGLE"];
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
      ConversionPipeline = class {
        constructor() {
          this.autoFixLayout = false;
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
            const preprocessed = this.preprocess(node);
            const schema = yield this.generateSchema(preprocessed, provider, options == null ? void 0 : options.apiKey);
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
        generateSchema(pre, provider, apiKey) {
          return __async(this, null, function* () {
            console.log("Generating Base Schema (Algorithm)...");
            const baseSchema = convertToFlexSchema(pre.serializedRoot);
            console.log("Optimizing Schema (AI)...");
            const prompt = `${OPTIMIZE_SCHEMA_PROMPT}

SCHEMA BASE:
${JSON.stringify(baseSchema, null, 2)}
`;
            try {
              const response = yield provider.generateSchema({
                prompt,
                snapshot: pre.serializedRoot,
                instructions: "Otimize o schema JSON fornecido mantendo IDs e dados.",
                apiKey
              });
              if (!response.ok || !response.schema) {
                console.warn("AI returned invalid response. Falling back to base schema.", response.message);
                return baseSchema;
              }
              return response.schema;
            } catch (error) {
              console.error("AI Optimization failed:", error);
              console.warn("Falling back to Base Schema.");
              return baseSchema;
            }
          });
        }
        validateAndNormalize(schema, root, tokens) {
          if (!schema || typeof schema !== "object") throw new Error("Schema invalido: nao e um objeto.");
          if (!schema.page) schema.page = { title: root.name, tokens };
          if (!schema.page.tokens) schema.page.tokens = tokens;
          if (!schema.page.title) schema.page.title = root.name;
          if (!Array.isArray(schema.containers)) schema.containers = [];
          schema.containers = this.normalizeContainers(schema.containers);
        }
        resolveImages(schema, wpConfig) {
          return __async(this, null, function* () {
            const uploadEnabled = !!(wpConfig && wpConfig.url && wpConfig.user && (wpConfig.password || wpConfig.token) && wpConfig.exportImages);
            if (!uploadEnabled) return;
            const processWidget = (widget) => __async(this, null, function* () {
              if (widget.imageId && (widget.type === "image" || widget.type === "custom" || widget.type === "icon" || widget.type === "image-box" || widget.type === "icon-box")) {
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
                    if ("locked" in node && node.locked || hasVectorChildren(node)) {
                      format = "SVG";
                    }
                    const result = yield this.imageUploader.uploadToWordPress(node, format);
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
                  console.error(`[Pipeline] Erro ao processar imagem ${widget.imageId}:`, e);
                }
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
          const walk = (c, parent) => {
            if (!c.id) {
              logWarn("[AutoFix] Container sem id detectado. Ignorado para evitar quebra.");
              return null;
            }
            const node = figma.getNodeById(c.id);
            const layoutMode = node == null ? void 0 : node.layoutMode;
            const type = node == null ? void 0 : node.type;
            const isFrameLike = type === "FRAME" || type === "GROUP" || type === "COMPONENT" || type === "INSTANCE";
            const hasAutoLayout = layoutMode === "HORIZONTAL" || layoutMode === "VERTICAL";
            const looksInvalidContainer = !hasAutoLayout && node || !isFrameLike && node;
            if (looksInvalidContainer) {
              logWarn(`[AutoFix] Node ${c.id} (${(node == null ? void 0 : node.name) || "container"}) nao tem auto layout ou tipo invalido (${type}).`);
              if (!this.autoFixLayout) {
                logWarn(`[AutoFix] Corre\xE7\xE3o desativada. Ative "auto_fix_layout" para aplicar fallback.`);
              } else {
                if (!isFrameLike || type === "RECTANGLE" || type === "VECTOR" || type === "TEXT") {
                  if (parent) {
                    parent.widgets = parent.widgets || [];
                    parent.widgets.push({
                      type: "custom",
                      content: (node == null ? void 0 : node.characters) || null,
                      imageId: null,
                      styles: { sourceId: c.id, sourceName: node == null ? void 0 : node.name }
                    });
                    if (Array.isArray(c.widgets)) parent.widgets.push(...c.widgets);
                    if (Array.isArray(c.children)) parent.children.push(...c.children);
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
              logWarn(`[AI] Container ${c.id} sem direction valido. Ajustado para 'column'.`);
            }
            if (!c.width) c.width = "full";
            if (!Array.isArray(c.widgets)) c.widgets = [];
            if (!Array.isArray(c.children)) c.children = [];
            c.children = c.children.map((child) => walk(child, c)).filter(Boolean);
            return c;
          };
          return containers.map((c) => walk(c, null)).filter(Boolean);
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
          const wpConfig = customWP || (yield loadWPConfig());
          const useAI = typeof (aiPayload == null ? void 0 : aiPayload.useAI) === "boolean" ? aiPayload.useAI : yield loadSetting("gptel_use_ai", true);
          const serialized = serializeNode(node);
          if (!useAI) {
            log("Iniciando pipeline (NO-AI)...", "info");
            const elementorJson = yield runPipelineWithoutAI(serialized, wpConfig);
            log("Pipeline NO-AI concluido.", "success");
            return { elementorJson };
          }
          const { provider, apiKey, providerId } = yield resolveProviderConfig(aiPayload);
          const autoFixLayout = yield loadSetting("auto_fix_layout", false);
          log(`Iniciando pipeline (${providerId.toUpperCase()})...`, "info");
          const result = yield pipeline.run(node, wpConfig, { debug, provider, apiKey, autoFixLayout });
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
          const elementsForPaste = json.content || json.elements || [];
          const normalizedJson = __spreadProps(__spreadValues({}, json), { content: elementsForPaste, elements: elementsForPaste });
          const payload = JSON.stringify(normalizedJson, null, 2);
          const pastePayload = JSON.stringify(elementsForPaste, null, 2);
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
                  if ("locked" in node && node.locked || hasVectorChildren(node)) {
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
              useAI
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
          case "export-wp":
            try {
              const incoming = msg.wpConfig;
              const cfg = incoming && incoming.url ? incoming : yield loadWPConfig();
              if (!cfg.autoPage) {
                figma.ui.postMessage({ type: "wp-status", success: false, message: "Criar p\xE1gina automaticamente est\xE1 desativado." });
                break;
              }
              const url = normalizeWpUrl((cfg == null ? void 0 : cfg.url) || "");
              const userRaw = (cfg == null ? void 0 : cfg.user) || "";
              const tokenRaw = (cfg == null ? void 0 : cfg.token) || (cfg == null ? void 0 : cfg.password) || "";
              const user = (userRaw || "").trim();
              const token = (tokenRaw || "").replace(/\s+/g, "");
              figma.ui.postMessage({
                type: "log",
                level: "info",
                message: `[WP] Export -> endpoint: ${url || "(vazio)"} / user: ${user || "(vazio)"} / tokenLen: ${token.length}`
              });
              if (!lastJSON) {
                figma.ui.postMessage({ type: "wp-status", success: false, message: "Nenhum JSON gerado para exportar." });
                break;
              }
              if (!url || !user || !token) {
                figma.ui.postMessage({ type: "wp-status", success: false, message: "URL, usuario ou senha do app ausentes." });
                break;
              }
              const auth = `Basic ${toBase64(`${user}:${token}`)}`;
              const base = url.replace(/\/$/, "");
              const meEndpoint = `${base}/wp-json/wp/v2/users/me`;
              const meResp = yield fetchWithTimeout3(meEndpoint, { headers: { Authorization: auth, Accept: "application/json" } });
              if (!meResp.ok) {
                const text = yield meResp.text();
                figma.ui.postMessage({ type: "log", level: "error", message: `[WP] Auth FAIL (${meResp.status}) -> ${text}` });
                figma.ui.postMessage({ type: "wp-status", success: false, message: `Falha de autenticacao (${meResp.status}): ${text}` });
                break;
              }
              const pageEndpoint = `${base}/wp-json/wp/v2/pages`;
              const pageBody = {
                title: `FigToEL ${(/* @__PURE__ */ new Date()).toISOString()}`,
                status: "draft",
                meta: { _elementor_data: lastJSON },
                content: "Gerado via FigToEL (Elementor JSON em _elementor_data)."
              };
              const pageResp = yield fetchWithTimeout3(pageEndpoint, {
                method: "POST",
                headers: {
                  Authorization: auth,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(pageBody)
              });
              if (!pageResp.ok) {
                const text = yield pageResp.text();
                figma.ui.postMessage({ type: "wp-status", success: false, message: `Falha ao criar pagina (${pageResp.status}): ${text}` });
                break;
              }
              const pageJson = yield pageResp.json().catch(() => ({}));
              yield saveSetting("gptel_wp_url", url);
              yield saveSetting("gptel_wp_user", user);
              yield saveSetting("gptel_wp_token", token);
              yield saveSetting("gptel_export_images", !!cfg.exportImages);
              yield saveSetting("gptel_auto_page", !!cfg.autoPage);
              const link = (pageJson == null ? void 0 : pageJson.link) || url;
              figma.ui.postMessage({ type: "wp-status", success: true, message: `Pagina enviada como rascunho. Link: ${link}` });
            } catch (e) {
              const aborted = (e == null ? void 0 : e.name) === "AbortError";
              const msgErr = aborted ? "Tempo limite ao exportar para WP." : (e == null ? void 0 : e.message) || "Erro desconhecido";
              figma.ui.postMessage({ type: "wp-status", success: false, message: msgErr });
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
