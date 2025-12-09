"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/utils/image_utils.ts
  function rgbToHex(rgb) {
    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  // src/services/serializer/index.ts
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
  var DefaultSerializerService = class {
    serialize(node, parentId) {
      return serializeNodeInternal(node, parentId);
    }
    flatten(root) {
      const acc = [];
      const stack = [root];
      while (stack.length > 0) {
        const current = stack.pop();
        acc.push(current);
        if (Array.isArray(current.children)) {
          for (let i = current.children.length - 1; i >= 0; i--) {
            stack.push(current.children[i]);
          }
        }
      }
      return acc;
    }
    createSnapshot(node) {
      const root = this.serialize(node);
      const flatNodes = this.flatten(root);
      return { root, flatNodes };
    }
  };
  var serializerService = new DefaultSerializerService();
  function serializeNodeInternal(node, parentId) {
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
      if (typeof node.getStyledTextSegments === "function") {
        try {
          data.styledTextSegments = node.getStyledTextSegments(["fontSize", "fontName", "fontWeight", "textDecoration", "textCase", "lineHeight", "letterSpacing", "fills", "fillStyleId"]);
        } catch (e) {
          console.warn("Error getting styled text segments", e);
        }
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
        data.children = node.children.map((child) => serializeNodeInternal(child, node.id));
      }
    }
    return data;
  }

  // src/utils/serialization_utils.ts
  function serializeNode(node, parentId) {
    return serializerService.serialize(node, parentId);
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

  // src/utils/style_normalizer.ts
  function normalizeColor(color) {
    if (!color) return void 0;
    if (typeof color === "string") return color;
    if (typeof color === "object" && "r" in color) {
      const r = Math.round((color.r || 0) * 255);
      const g = Math.round((color.g || 0) * 255);
      const b = Math.round((color.b || 0) * 255);
      const a = color.a !== void 0 ? color.a : color.opacity !== void 0 ? color.opacity : 1;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return void 0;
  }

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
    if (typeof node.width === "number") {
      styles.width = node.width;
    }
    if (typeof node.height === "number") {
      styles.height = node.height;
    }
    if (node.fills && Array.isArray(node.fills)) {
      const gradient = node.fills.find(
        (f) => f.type === "GRADIENT_RADIAL" || f.type === "GRADIENT_LINEAR"
      );
      if (gradient && gradient.gradientStops) {
        const stops = gradient.gradientStops.map((stop) => {
          const r = Math.round((stop.color.r || 0) * 255);
          const g = Math.round((stop.color.g || 0) * 255);
          const b = Math.round((stop.color.b || 0) * 255);
          const toHex = (n) => {
            const hex2 = n.toString(16);
            return hex2.length === 1 ? "0" + hex2 : hex2;
          };
          const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
          const pos = Math.round((stop.position || 0) * 100);
          return `${hex} ${pos}%`;
        }).join(", ");
        const gradType = gradient.type === "GRADIENT_RADIAL" ? "radial-gradient" : "linear-gradient";
        const gradParams = gradient.type === "GRADIENT_RADIAL" ? "circle at center" : "180deg";
        styles.customCss = `selector {
    background: ${gradType}(${gradParams}, ${stops});
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}`;
        console.log("[GRADIENT TEXT] Generated CSS for", gradient.type);
      } else {
        const solid = node.fills.find((f) => f.type === "SOLID");
        if (solid && solid.color) {
          styles.color = normalizeColor(solid.color);
        }
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
    console.log("[EXTRACT STYLES]", node.name, {
      itemSpacing: node.itemSpacing,
      paddingTop: node.paddingTop,
      paddingRight: node.paddingRight,
      paddingBottom: node.paddingBottom,
      paddingLeft: node.paddingLeft
    });
    if (typeof node.itemSpacing === "number" && node.itemSpacing >= 0 && node.itemSpacing < 100) {
      styles.gap = node.itemSpacing;
    }
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
      const visibleFills = fills.filter((f) => f.visible !== false);
      if (visibleFills.length > 0) {
        const fill = visibleFills[visibleFills.length - 1];
        if (fill.type === "SOLID" && fill.color) {
          const { r, g, b } = fill.color;
          const a = fill.opacity !== void 0 ? fill.opacity : 1;
          styles.background = {
            type: "solid",
            color: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
          };
        } else if (fill.type === "GRADIENT_LINEAR" || fill.type === "GRADIENT_RADIAL" || fill.type === "GRADIENT_ANGULAR" || fill.type === "GRADIENT_DIAMOND") {
          const stops = (fill.gradientStops || []).map((stop) => {
            const c = stop.color || { r: 0, g: 0, b: 0, a: 1 };
            return {
              position: Math.round(stop.position * 100),
              color: `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a || 1})`
            };
          });
          styles.background = {
            type: "gradient",
            gradientType: fill.type === "GRADIENT_RADIAL" ? "radial" : "linear",
            stops
          };
        } else if (fill.type === "IMAGE") {
          styles.background = {
            type: "image",
            imageHash: fill.imageHash || null
          };
        }
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

  // src/api_gemini.ts
  var GEMINI_MODEL = "gemini-1.5-flash-002";
  var API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
  var DEFAULT_TIMEOUT_MS = 12e3;
  async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
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
      return await fetch(url, options);
    }
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, __spreadProps(__spreadValues({}, options), { signal: controller.signal }));
      return resp;
    } finally {
      clearTimeout(id);
    }
  }
  async function getKey() {
    return await figma.clientStorage.getAsync("gemini_api_key");
  }
  async function saveModel(model) {
    await figma.clientStorage.setAsync("gemini_model", model);
  }
  function cleanJson(content) {
    return content.replace(/```json/gi, "").replace(/```/g, "").trim();
  }
  function parseGeminiJson(content) {
    const clean = cleanJson(content);
    return JSON.parse(clean);
  }
  var geminiProvider = {
    id: "gemini",
    model: GEMINI_MODEL,
    setModel(model) {
      this.model = model;
      saveModel(model).catch(() => {
      });
    },
    async generateSchema(input) {
      var _a, _b, _c, _d, _e, _f, _g;
      const apiKey = input.apiKey || await getKey();
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
        const response = await fetchWithTimeout(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          const rawText = await response.text();
          let parsed = null;
          try {
            parsed = JSON.parse(rawText);
          } catch (e) {
            parsed = rawText;
          }
          const message = ((_b = parsed == null ? void 0 : parsed.error) == null ? void 0 : _b.message) || `HTTP ${response.status}`;
          return { ok: false, message: `Falha na API Gemini: ${message}`, raw: parsed };
        }
        const data = await response.json();
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
    },
    async testConnection(apiKey) {
      var _a;
      const keyToTest = apiKey || await getKey();
      if (!keyToTest) return { ok: false, message: "API Key nao configurada" };
      const endpoint = `${API_BASE_URL}?key=${keyToTest}`;
      try {
        const response = await fetchWithTimeout(endpoint, { method: "GET" });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const message = ((_a = errorData == null ? void 0 : errorData.error) == null ? void 0 : _a.message) || `HTTP ${response.status}`;
          return { ok: false, message: `Falha na conexao: ${message}`, raw: errorData };
        }
        return { ok: true, message: "Conexao com Gemini verificada." };
      } catch (e) {
        const aborted = (e == null ? void 0 : e.name) === "AbortError";
        const baseMessage = aborted ? "Tempo limite ao testar conexao." : (e == null ? void 0 : e.message) || "Erro desconhecido";
        return { ok: false, message: baseMessage, raw: e };
      }
    }
  };

  // src/utils/guid.ts
  function generateGUID() {
    const hex = Math.floor(Math.random() * 268435455).toString(16);
    return ("0000000" + hex).slice(-7);
  }

  // src/config/widget.registry.ts
  function slugFromKey(key) {
    if (!key) return "";
    return key.replace(/^w:/i, "").replace(/^woo:/i, "").replace(/^loop:/i, "").replace(/:/g, "-");
  }
  function stubDefinition(key, family = "misc", aliases = []) {
    const widgetType = slugFromKey(key);
    return {
      key,
      widgetType,
      family,
      aliases: [.../* @__PURE__ */ new Set([widgetType, ...aliases])],
      compile: (_w, base) => ({ widgetType, settings: __spreadValues({}, base) })
    };
  }
  function generateAliases(key, ptAliases = [], extraAliases = []) {
    const baseSet = /* @__PURE__ */ new Set([key, ...ptAliases, ...extraAliases]);
    const variations = /* @__PURE__ */ new Set();
    baseSet.forEach((alias) => {
      const lower = alias.toLowerCase();
      variations.add(lower);
      variations.add(lower.replace(/-/g, " "));
      variations.add(lower.replace(/ /g, "-"));
      variations.add(lower.replace(/[- ]/g, ""));
      variations.add(lower.replace(/[- ]/g, "_"));
      if (!lower.startsWith("w:")) {
        variations.add(`w:${lower}`);
        variations.add(`w:${lower.replace(/-/g, " ")}`);
      }
    });
    return Array.from(variations);
  }
  var registry = [
    {
      key: "heading",
      widgetType: "heading",
      family: "text",
      aliases: generateAliases("heading", ["t\xEDtulo", "cabe\xE7alho", "chamada"], ["title", "headline", "h1", "h2", "h3", "h4", "h5", "h6", "main title", "subt\xEDtulo"]),
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
      aliases: generateAliases("text", ["texto", "editor de texto", "par\xE1grafo", "descri\xE7\xE3o"], ["text editor", "paragraph", "description", "body text", "conte\xFAdo"]),
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
      aliases: generateAliases("button", ["bot\xE3o", "link", "chamada para a\xE7\xE3o"], ["btn", "cta", "action button", "clique aqui"]),
      compile: (w, base) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
        console.log("[REGISTRY DEBUG] Compiling button widget:", w.type);
        console.log("[REGISTRY DEBUG] Button has", ((_a = w.children) == null ? void 0 : _a.length) || 0, "child widgets");
        let buttonText = w.content || "Button";
        let iconId = w.imageId;
        let textColor;
        let textStyles = {};
        if (w.children && Array.isArray(w.children) && w.children.length > 0) {
          console.log("[REGISTRY DEBUG] Processing child widgets:", w.children.map((c) => ({ type: c.type, content: c.content })));
          const textChild = w.children.find(
            (child) => child.type === "heading" || child.type === "text"
          );
          if (textChild && textChild.content) {
            buttonText = textChild.content;
            console.log("[REGISTRY DEBUG] \u2705 Extracted text from child:", buttonText);
            if ((_b = textChild.styles) == null ? void 0 : _b.color) {
              const { r, g, b } = textChild.styles.color;
              textColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 1)`;
              console.log("[REGISTRY DEBUG] \u2705 Extracted text color from child:", textColor);
            }
            if (textChild.styles) {
              textStyles = textChild.styles;
            }
          }
          const imageChild = w.children.find(
            (child) => child.type === "image" || child.type === "icon"
          );
          if (imageChild && imageChild.imageId) {
            iconId = imageChild.imageId;
            console.log("[REGISTRY DEBUG] \u2705 Extracted icon from child:", iconId);
          }
        }
        const settings = __spreadProps(__spreadValues({}, base), {
          text: buttonText,
          // Default Elementor settings
          size: "sm",
          button_type: "",
          align: "center",
          // Default alignment
          typography_typography: "custom"
        });
        const styles = textStyles.fontName ? textStyles : w.styles || {};
        if (styles.fontName) settings.typography_font_family = styles.fontName.family;
        if (styles.fontSize) settings.typography_font_size = { unit: "px", size: styles.fontSize };
        if (styles.fontWeight) settings.typography_font_weight = styles.fontWeight;
        if (styles.lineHeight && styles.lineHeight.unit !== "AUTO") {
          settings.typography_line_height = {
            unit: styles.lineHeight.unit === "PIXELS" ? "px" : "em",
            size: styles.lineHeight.value
          };
        }
        if (styles.textDecoration) {
          settings.typography_text_decoration = styles.textDecoration.toLowerCase();
        }
        if (styles.textCase) {
          const caseMap = { UPPER: "uppercase", LOWER: "lowercase", TITLE: "capitalize" };
          if (caseMap[styles.textCase]) settings.typography_text_transform = caseMap[styles.textCase];
        }
        if (styles.textAlignHorizontal) {
          const alignMap = { LEFT: "left", CENTER: "center", RIGHT: "right", JUSTIFIED: "justify" };
          if (alignMap[styles.textAlignHorizontal]) settings.align = alignMap[styles.textAlignHorizontal];
        }
        if ((_c = w.styles) == null ? void 0 : _c.background) {
          settings.background_color = w.styles.background.color || w.styles.background;
        } else if (((_d = w.styles) == null ? void 0 : _d.fills) && Array.isArray(w.styles.fills) && w.styles.fills.length > 0) {
          const solidFill = w.styles.fills.find((f) => f.type === "SOLID");
          if (solidFill && solidFill.color) {
            const { r, g, b } = solidFill.color;
            const a = solidFill.opacity !== void 0 ? solidFill.opacity : 1;
            settings.background_color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
          }
        }
        if (textColor) {
          settings.button_text_color = textColor;
        } else if ((_e = w.styles) == null ? void 0 : _e.color) {
          const { r, g, b } = w.styles.color;
          settings.button_text_color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 1)`;
        } else if (base.color) {
          settings.button_text_color = base.color;
        }
        if (((_f = w.styles) == null ? void 0 : _f.paddingTop) !== void 0 || ((_g = w.styles) == null ? void 0 : _g.paddingRight) !== void 0 || ((_h = w.styles) == null ? void 0 : _h.paddingBottom) !== void 0 || ((_i = w.styles) == null ? void 0 : _i.paddingLeft) !== void 0) {
          settings.button_padding = {
            unit: "px",
            top: w.styles.paddingTop || 0,
            right: w.styles.paddingRight || 0,
            bottom: w.styles.paddingBottom || 0,
            left: w.styles.paddingLeft || 0,
            isLinked: false
          };
        }
        if (((_k = (_j = w.styles) == null ? void 0 : _j.border) == null ? void 0 : _k.radius) !== void 0) {
          settings.border_radius = {
            unit: "px",
            top: w.styles.border.radius,
            right: w.styles.border.radius,
            bottom: w.styles.border.radius,
            left: w.styles.border.radius,
            isLinked: true
          };
        } else if (((_l = w.styles) == null ? void 0 : _l.cornerRadius) !== void 0) {
          settings.border_radius = {
            unit: "px",
            top: w.styles.cornerRadius,
            right: w.styles.cornerRadius,
            bottom: w.styles.cornerRadius,
            left: w.styles.cornerRadius,
            isLinked: true
          };
        }
        if (iconId) {
          const imgId = parseInt(iconId, 10);
          let iconUrl = "";
          if (w.children && Array.isArray(w.children)) {
            const imageChild = w.children.find(
              (child) => child.type === "image" || child.type === "icon"
            );
            if (imageChild) {
              iconUrl = imageChild.content || "";
              console.log("[BUTTON ICON DEBUG] Found icon URL from child:", iconUrl);
            }
          }
          if (!iconUrl && ((_n = (_m = w.styles) == null ? void 0 : _m.selected_icon) == null ? void 0 : _n.value)) {
            iconUrl = w.styles.selected_icon.value;
          }
          console.log("[BUTTON ICON DEBUG] iconId:", iconId);
          console.log("[BUTTON ICON DEBUG] Final iconUrl:", iconUrl);
          settings.selected_icon = {
            value: isNaN(imgId) ? iconId : { url: iconUrl, id: imgId },
            library: isNaN(imgId) ? "fa-solid" : "svg"
          };
          settings.icon_align = "left";
        }
        return { widgetType: "button", settings };
      }
    },
    {
      key: "image",
      widgetType: "image",
      family: "media",
      aliases: generateAliases("image", ["imagem", "foto", "figura"], ["img", "picture", "photo", "single image", "imagem \xFAnica"]),
      compile: (w, base) => {
        var _a, _b, _c, _d;
        const imgId = w.imageId ? parseInt(w.imageId, 10) : 0;
        const settings = __spreadProps(__spreadValues({}, base), {
          image: {
            url: w.content || "",
            id: isNaN(imgId) ? "" : imgId
          },
          image_size: "full"
          // Use full resolution
        });
        if (((_a = w.styles) == null ? void 0 : _a.width) && typeof w.styles.width === "number") {
          settings.width = { unit: "px", size: Math.round(w.styles.width), sizes: [] };
        }
        console.log("[IMAGE WIDGET DEBUG]", { width: (_b = w.styles) == null ? void 0 : _b.width, height: (_c = w.styles) == null ? void 0 : _c.height, name: (_d = w.styles) == null ? void 0 : _d.sourceName });
        return { widgetType: "image", settings };
      }
    },
    {
      key: "icon",
      widgetType: "icon",
      family: "media",
      aliases: generateAliases("icon", ["\xEDcone", "simbolo"], ["ico", "symbol", "svg icon"]),
      compile: (w, base) => {
        var _a;
        return {
          widgetType: "icon",
          settings: __spreadProps(__spreadValues({}, base), { selected_icon: ((_a = w.styles) == null ? void 0 : _a.selected_icon) || { value: w.content || "fas fa-star", library: "fa-solid" } })
        };
      }
    },
    // Hint-based simples
    {
      key: "image_box",
      widgetType: "image-box",
      family: "media",
      aliases: generateAliases("image-box", ["caixa de imagem", "box imagem", "card com imagem"], ["image box", "box image", "card image", "feature box", "service box"]),
      compile: (w, base) => {
        var _a, _b, _c, _d, _e;
        const imgId = w.imageId ? parseInt(w.imageId, 10) : 0;
        const settings = __spreadProps(__spreadValues({}, base), {
          image: { url: base.image_url || "", id: isNaN(imgId) ? "" : imgId },
          title_text: w.content || base.title_text || ((_a = w.styles) == null ? void 0 : _a.title_text) || "Title",
          description_text: base.description_text || ((_b = w.styles) == null ? void 0 : _b.description_text) || ""
        });
        const titleStyles = (_c = w.styles) == null ? void 0 : _c.titleStyles;
        if (titleStyles) {
          settings.title_typography_typography = "custom";
          if (titleStyles.fontFamily) settings.title_typography_font_family = titleStyles.fontFamily;
          if (titleStyles.fontWeight) settings.title_typography_font_weight = String(titleStyles.fontWeight);
          if (titleStyles.fontSize) settings.title_typography_font_size = { unit: "px", size: titleStyles.fontSize, sizes: [] };
          if (titleStyles.lineHeight) settings.title_typography_line_height = { unit: "px", size: titleStyles.lineHeight, sizes: [] };
          if (titleStyles.letterSpacing) settings.title_typography_letter_spacing = { unit: "px", size: titleStyles.letterSpacing, sizes: [] };
          if (titleStyles.textTransform) settings.title_typography_text_transform = titleStyles.textTransform;
          if (titleStyles.color) settings.title_color = titleStyles.color;
        }
        const descStyles = (_d = w.styles) == null ? void 0 : _d.descriptionStyles;
        if (descStyles) {
          settings.description_typography_typography = "custom";
          if (descStyles.fontFamily) settings.description_typography_font_family = descStyles.fontFamily;
          if (descStyles.fontWeight) settings.description_typography_font_weight = String(descStyles.fontWeight);
          if (descStyles.fontSize) settings.description_typography_font_size = { unit: "px", size: descStyles.fontSize, sizes: [] };
          if (descStyles.lineHeight) settings.description_typography_line_height = { unit: "px", size: descStyles.lineHeight, sizes: [] };
          if (descStyles.letterSpacing) settings.description_typography_letter_spacing = { unit: "px", size: descStyles.letterSpacing, sizes: [] };
          if (descStyles.textTransform) settings.description_typography_text_transform = descStyles.textTransform;
          if (descStyles.color) settings.description_color = descStyles.color;
        }
        if ((_e = w.styles) == null ? void 0 : _e.customCss) {
          settings.custom_css = w.styles.customCss;
        }
        console.log("[IMAGE-BOX COMPILE] Typography applied:", {
          titleFamily: titleStyles == null ? void 0 : titleStyles.fontFamily,
          titleColor: settings.title_color,
          descFamily: descStyles == null ? void 0 : descStyles.fontFamily,
          descColor: settings.description_color,
          hasCustomCss: !!settings.custom_css
        });
        return { widgetType: "image-box", settings };
      }
    },
    {
      key: "icon_box",
      widgetType: "icon-box",
      family: "media",
      aliases: generateAliases("icon-box", ["caixa de \xEDcone", "box \xEDcone", "card com \xEDcone"], ["icon box", "box icon", "card icon", "feature icon"]),
      compile: (w, base) => {
        var _a, _b, _c, _d, _e, _f;
        const settings = __spreadProps(__spreadValues({}, base), {
          // Prioritize w.styles.selected_icon (from upload) over base.selected_icon
          selected_icon: ((_a = w.styles) == null ? void 0 : _a.selected_icon) || base.selected_icon || { value: "fas fa-star", library: "fa-solid" },
          title_text: w.content || base.title_text || ((_b = w.styles) == null ? void 0 : _b.title_text) || "Title",
          description_text: base.description_text || ((_c = w.styles) == null ? void 0 : _c.description_text) || ""
        });
        const titleStyles = (_d = w.styles) == null ? void 0 : _d.titleStyles;
        if (titleStyles) {
          settings.title_typography_typography = "custom";
          if (titleStyles.fontFamily) settings.title_typography_font_family = titleStyles.fontFamily;
          if (titleStyles.fontWeight) settings.title_typography_font_weight = String(titleStyles.fontWeight);
          if (titleStyles.fontSize) settings.title_typography_font_size = { unit: "px", size: titleStyles.fontSize, sizes: [] };
          if (titleStyles.lineHeight) settings.title_typography_line_height = { unit: "px", size: titleStyles.lineHeight, sizes: [] };
          if (titleStyles.letterSpacing) settings.title_typography_letter_spacing = { unit: "px", size: titleStyles.letterSpacing, sizes: [] };
          if (titleStyles.textTransform) settings.title_typography_text_transform = titleStyles.textTransform;
          if (titleStyles.color) settings.title_color = titleStyles.color;
        }
        const descStyles = (_e = w.styles) == null ? void 0 : _e.descriptionStyles;
        if (descStyles) {
          settings.description_typography_typography = "custom";
          if (descStyles.fontFamily) settings.description_typography_font_family = descStyles.fontFamily;
          if (descStyles.fontWeight) settings.description_typography_font_weight = String(descStyles.fontWeight);
          if (descStyles.fontSize) settings.description_typography_font_size = { unit: "px", size: descStyles.fontSize, sizes: [] };
          if (descStyles.lineHeight) settings.description_typography_line_height = { unit: "px", size: descStyles.lineHeight, sizes: [] };
          if (descStyles.letterSpacing) settings.description_typography_letter_spacing = { unit: "px", size: descStyles.letterSpacing, sizes: [] };
          if (descStyles.textTransform) settings.description_typography_text_transform = descStyles.textTransform;
          if (descStyles.color) settings.description_color = descStyles.color;
        }
        if ((_f = w.styles) == null ? void 0 : _f.customCss) {
          settings.custom_css = w.styles.customCss;
        }
        console.log("[ICON-BOX COMPILE] Typography applied:", {
          titleFamily: titleStyles == null ? void 0 : titleStyles.fontFamily,
          titleColor: settings.title_color,
          descFamily: descStyles == null ? void 0 : descStyles.fontFamily,
          descColor: settings.description_color,
          hasCustomCss: !!settings.custom_css
        });
        return { widgetType: "icon-box", settings };
      }
    },
    {
      key: "icon_list",
      widgetType: "icon-list",
      family: "media",
      aliases: generateAliases("icon-list", ["lista de \xEDcones", "lista", "t\xF3picos"], ["icon list", "list", "bullet points", "check list"]),
      compile: (w, base) => {
        var _a;
        const settings = __spreadValues({
          view: "traditional",
          link_click: "full_width"
        }, base);
        const children = w.children || [];
        console.log("[ICON-LIST] Processing with", children.length, "children");
        if (children.length > 0) {
          settings.icon_list = children.map((child, idx) => {
            var _a2, _b;
            const text = child.content || ((_a2 = child.styles) == null ? void 0 : _a2.sourceName) || `Item ${idx + 1}`;
            const iconId = child.imageId;
            console.log("[ICON-LIST] Item", idx, ":", { text, iconId });
            const item = {
              _id: Math.random().toString(36).substring(2, 9),
              text,
              selected_icon: iconId ? {
                value: { url: ((_b = child.styles) == null ? void 0 : _b.icon_url) || "", id: iconId },
                library: "svg"
              } : { value: "fas fa-check", library: "fa-solid" },
              link: { url: "", is_external: "", nofollow: "", custom_attributes: "" }
            };
            if (item.icon) delete item.icon;
            console.log("[ICON-LIST] Generated Item:", JSON.stringify(item));
            return item;
          });
        } else if ((_a = w.styles) == null ? void 0 : _a.icon_list) {
          settings.icon_list = w.styles.icon_list;
        } else {
          settings.icon_list = [{
            _id: "list_item_1",
            text: w.content || "Item",
            selected_icon: w.imageId ? {
              value: { url: "", id: w.imageId },
              library: "svg"
            } : { value: "fas fa-check", library: "fa-solid" },
            link: { url: "", is_external: "", nofollow: "", custom_attributes: "" }
          }];
        }
        return { widgetType: "icon-list", settings };
      }
    },
    {
      key: "video",
      widgetType: "video",
      family: "media",
      aliases: generateAliases("video", ["v\xEDdeo", "player"], ["youtube", "vimeo", "video player"]),
      compile: (w, base) => ({ widgetType: "video", settings: __spreadProps(__spreadValues({}, base), { link: w.content || "" }) })
    },
    {
      key: "divider",
      widgetType: "divider",
      family: "misc",
      aliases: generateAliases("divider", ["divisor", "linha", "separador"], ["line", "separator", "horizontal line", "linha horizontal"]),
      compile: (_w, base) => ({ widgetType: "divider", settings: __spreadValues({}, base) })
    },
    {
      key: "spacer",
      widgetType: "spacer",
      family: "misc",
      aliases: generateAliases("spacer", ["espa\xE7amento", "espa\xE7o", "separador"], ["space", "gap", "empty space", "vazio"]),
      compile: (_w, base) => {
        var _a;
        return { widgetType: "spacer", settings: __spreadProps(__spreadValues({}, base), { space: (_a = base.space) != null ? _a : 20 }) };
      }
    },
    {
      key: "star-rating",
      widgetType: "star-rating",
      family: "misc",
      aliases: generateAliases("star-rating", ["avalia\xE7\xE3o", "estrelas", "nota"], ["star rating", "stars", "rating", "5 stars"]),
      compile: (w, base) => ({ widgetType: "star-rating", settings: __spreadProps(__spreadValues({}, base), { rating: Number(w.content) || 5 }) })
    },
    {
      key: "counter",
      widgetType: "counter",
      family: "misc",
      aliases: generateAliases("counter", ["contador", "n\xFAmero"], ["number", "stats"]),
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
      key: "countdown",
      widgetType: "countdown",
      family: "pro",
      aliases: generateAliases("countdown", ["contagem regressiva", "timer"], ["timer", "count down", "clock"]),
      compile: (w, base) => {
        const settings = __spreadValues({}, base);
        const children = w.children || [];
        const timeData = {};
        const labels = {};
        let digitsColor;
        let labelColor;
        let digitsFontSize;
        let labelFontSize;
        children.forEach((child) => {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
          const text = (child.content || "").toString().trim();
          const lowerText = text.toLowerCase();
          const numValue = parseInt(text, 10);
          if (!isNaN(numValue) && text.match(/^\d+$/)) {
            if (!digitsColor && ((_a = child.styles) == null ? void 0 : _a.color)) {
              digitsColor = normalizeColor(child.styles.color);
            }
            if (!digitsFontSize && ((_b = child.styles) == null ? void 0 : _b.fontSize)) {
              digitsFontSize = child.styles.fontSize;
            }
            const childIndex = children.indexOf(child);
            for (let i = childIndex + 1; i < children.length; i++) {
              const nextChild = children[i];
              const nextText = (nextChild.content || "").toString().trim().toLowerCase();
              if (nextText === ":") continue;
              if (nextText.includes("dia") || nextText.includes("day")) {
                timeData.days = numValue;
                labels.days = String((_c = nextChild.content) != null ? _c : "");
                if (!labelColor && ((_d = nextChild.styles) == null ? void 0 : _d.color)) {
                  labelColor = normalizeColor(nextChild.styles.color);
                }
                if (!labelFontSize && ((_e = nextChild.styles) == null ? void 0 : _e.fontSize)) {
                  labelFontSize = nextChild.styles.fontSize;
                }
              } else if (nextText.includes("hr") || nextText.includes("hour") || nextText.includes("hora")) {
                timeData.hours = numValue;
                labels.hours = String((_f = nextChild.content) != null ? _f : "");
                if (!labelColor && ((_g = nextChild.styles) == null ? void 0 : _g.color)) {
                  labelColor = normalizeColor(nextChild.styles.color);
                }
                if (!labelFontSize && ((_h = nextChild.styles) == null ? void 0 : _h.fontSize)) {
                  labelFontSize = nextChild.styles.fontSize;
                }
              } else if (nextText.includes("min") || nextText.includes("minute")) {
                timeData.minutes = numValue;
                labels.minutes = String((_i = nextChild.content) != null ? _i : "");
                if (!labelColor && ((_j = nextChild.styles) == null ? void 0 : _j.color)) {
                  labelColor = normalizeColor(nextChild.styles.color);
                }
                if (!labelFontSize && ((_k = nextChild.styles) == null ? void 0 : _k.fontSize)) {
                  labelFontSize = nextChild.styles.fontSize;
                }
              } else if (nextText.includes("seg") || nextText.includes("sec") || nextText.includes("second")) {
                timeData.seconds = numValue;
                labels.seconds = String((_l = nextChild.content) != null ? _l : "");
                if (!labelColor && ((_m = nextChild.styles) == null ? void 0 : _m.color)) {
                  labelColor = normalizeColor(nextChild.styles.color);
                }
                if (!labelFontSize && ((_n = nextChild.styles) == null ? void 0 : _n.fontSize)) {
                  labelFontSize = nextChild.styles.fontSize;
                }
              }
              break;
            }
          }
        });
        console.log("[COUNTDOWN] Extracted time data:", timeData);
        console.log("[COUNTDOWN] Extracted labels:", labels);
        console.log("[COUNTDOWN] Extracted colors - digits:", digitsColor, "labels:", labelColor);
        const now = /* @__PURE__ */ new Date();
        const futureDate = new Date(now);
        if (timeData.days) futureDate.setDate(futureDate.getDate() + timeData.days);
        if (timeData.hours) futureDate.setHours(futureDate.getHours() + timeData.hours);
        if (timeData.minutes) futureDate.setMinutes(futureDate.getMinutes() + timeData.minutes);
        if (timeData.seconds) futureDate.setSeconds(futureDate.getSeconds() + timeData.seconds);
        const pad = (n) => n < 10 ? "0" + n : String(n);
        const year = futureDate.getFullYear();
        const month = pad(futureDate.getMonth() + 1);
        const day = pad(futureDate.getDate());
        const hours = pad(futureDate.getHours());
        const minutes = pad(futureDate.getMinutes());
        const dueDate = `${year}-${month}-${day} ${hours}:${minutes}`;
        settings.countdown_type = "due_date";
        settings.due_date = dueDate;
        settings.show_days = timeData.days !== void 0 ? "yes" : "";
        settings.show_hours = timeData.hours !== void 0 ? "yes" : "";
        settings.show_minutes = timeData.minutes !== void 0 ? "yes" : "";
        settings.show_seconds = timeData.seconds !== void 0 ? "yes" : "";
        settings.show_labels = "yes";
        settings.custom_labels = "yes";
        if (labels.days) settings.label_days = labels.days;
        if (labels.hours) settings.label_hours = labels.hours;
        if (labels.minutes) settings.label_minutes = labels.minutes;
        if (labels.seconds) settings.label_seconds = labels.seconds;
        if (base.background_color) {
          settings.box_background_color = base.background_color;
        }
        if (base.border_color && base.border_width) {
          settings.box_border_border = "solid";
          settings.box_border_color = base.border_color;
          settings.box_border_width = base.border_width;
        }
        if (base.border_radius) {
          settings.box_border_radius = base.border_radius;
        }
        if (digitsColor) {
          settings.digits_color = digitsColor;
        }
        if (labelColor) {
          settings.label_color = labelColor;
        }
        if (digitsFontSize) {
          settings.digits_typography_typography = "custom";
          settings.digits_typography_font_size = {
            unit: "px",
            size: digitsFontSize,
            sizes: []
          };
        }
        if (labelFontSize) {
          settings.label_typography_typography = "custom";
          settings.label_typography_font_size = {
            unit: "px",
            size: labelFontSize,
            sizes: []
          };
        }
        console.log("[COUNTDOWN] Generated due_date:", dueDate);
        console.log("[COUNTDOWN] Final settings:", settings);
        return { widgetType: "countdown", settings };
      }
    },
    {
      key: "progress",
      widgetType: "progress",
      family: "misc",
      aliases: generateAliases("progress", ["barra de progresso", "progresso"], ["progress bar", "bar", "skill bar"]),
      compile: (w, base) => ({
        widgetType: "progress",
        settings: __spreadProps(__spreadValues({}, base), { title: w.content || base.title || "Progresso", percent: Number(base.percent) || 50 })
      })
    },
    {
      key: "tabs",
      widgetType: "tabs",
      family: "misc",
      aliases: generateAliases("tabs", ["abas", "guias"], ["tabbed content"]),
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
      aliases: generateAliases("accordion", ["acorde\xE3o", "sanfona"], ["collapse", "faq"]),
      compile: (w, base) => {
        var _a, _b, _d;
        console.log("[ACCORDION COMPILE] Received widget:", JSON.stringify({
          type: w.type,
          content: w.content,
          childrenCount: ((_a = w.children) == null ? void 0 : _a.length) || 0,
          children: (_b = w.children) == null ? void 0 : _b.map((c) => ({
            content: c.content,
            styles: c.styles
          }))
        }, null, 2));
        const items = [];
        const nestedElements = [];
        if (w.children && w.children.length > 0) {
          w.children.forEach((child, i) => {
            var _a2;
            const itemId = generateGUID();
            const title = ((_a2 = child.styles) == null ? void 0 : _a2.title) || child.content || `Item ${i + 1}`;
            items.push({
              item_title: title,
              _id: itemId,
              element_css_id: ""
            });
            nestedElements.push({
              id: generateGUID(),
              elType: "container",
              isInner: true,
              isLocked: true,
              settings: {
                _title: title,
                content_width: "full",
                container_type: "flex",
                width: { unit: "%", size: "", sizes: [] },
                min_height: { unit: "px", size: "", sizes: [] },
                flex_direction: "",
                flex__is_row: "row",
                flex__is_column: "column",
                flex_justify_content: "",
                flex_align_items: "",
                flex_gap: { column: "", row: "", isLinked: true, unit: "px" },
                flex_wrap: "",
                overflow: "",
                html_tag: "",
                background_background: "",
                background_color: "",
                border_border: "",
                border_radius: { unit: "px", top: "", right: "", bottom: "", left: "", isLinked: true },
                margin: { unit: "px", top: "", right: "", bottom: "", left: "", isLinked: true },
                padding: { unit: "px", top: "", right: "", bottom: "", left: "", isLinked: true },
                _element_id: "",
                css_classes: ""
              },
              defaultEditSettings: { defaultEditRoute: "content" },
              elements: []
            });
          });
        }
        if (items.length === 0) {
          const itemId = generateGUID();
          items.push({ item_title: "Item 1", _id: itemId, element_css_id: "" });
          nestedElements.push({
            id: generateGUID(),
            elType: "container",
            isInner: true,
            isLocked: true,
            settings: {
              _title: "Item 1",
              content_width: "full",
              container_type: "flex",
              width: { unit: "%", size: "", sizes: [] },
              flex_direction: "",
              flex__is_row: "row",
              flex__is_column: "column"
            },
            defaultEditSettings: { defaultEditRoute: "content" },
            elements: []
          });
        }
        const _c = base, { selected_icon: _ } = _c, cleanBase = __objRest(_c, ["selected_icon"]);
        const settings = __spreadProps(__spreadValues({}, cleanBase), {
          items,
          accordion_item_title_position_horizontal: "stretch",
          accordion_item_title_icon_position: "end",
          accordion_item_title_icon: { value: "fas fa-plus", library: "fa-solid" },
          accordion_item_title_icon_active: { value: "fas fa-minus", library: "fa-solid" },
          title_tag: "div",
          faq_schema: "",
          default_state: "expanded",
          max_items_expended: "one",
          n_accordion_animation_duration: { unit: "ms", size: 400, sizes: [] },
          accordion_item_title_space_between: { unit: "px", size: 8, sizes: [] },
          accordion_item_title_distance_from_content: { unit: "px", size: 10, sizes: [] },
          accordion_background_normal_background: "",
          accordion_background_normal_color: "",
          accordion_border_normal_border: "",
          accordion_border_radius: { unit: "px", top: "5", right: "5", bottom: "5", left: "5", isLinked: true },
          accordion_padding: { unit: "px", top: "10", right: "10", bottom: "10", left: "10", isLinked: true },
          title_typography_typography: "",
          normal_title_color: "",
          icon_size: { unit: "px", size: 20, sizes: [] },
          normal_icon_color: "",
          content_background_background: "classic",
          content_background_color: "",
          content_border_border: "",
          content_border_radius: { unit: "px", top: "5", right: "5", bottom: "5", left: "5", isLinked: true },
          content_padding: { unit: "px", top: "20", right: "20", bottom: "20", left: "20", isLinked: true }
        });
        if ((_d = w.styles) == null ? void 0 : _d.selected_icon) {
          settings.accordion_item_title_icon = w.styles.selected_icon;
        }
        return {
          widgetType: "nested-accordion",
          settings,
          elements: nestedElements
        };
      }
    },
    {
      key: "toggle",
      widgetType: "toggle",
      family: "misc",
      aliases: generateAliases("toggle", ["alternar", "toggle"], []),
      compile: (w, base) => {
        var _b;
        const tabs = [];
        if (w.children && w.children.length > 0) {
          w.children.forEach((child, i) => {
            var _a2, _b2;
            const itemId = generateGUID();
            const title = ((_a2 = child.styles) == null ? void 0 : _a2.title) || child.content || `Toggle Item ${i + 1}`;
            const content = ((_b2 = child.styles) == null ? void 0 : _b2.content) || "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
            tabs.push({
              tab_title: title,
              tab_content: content,
              _id: itemId
            });
          });
        }
        if (tabs.length === 0) {
          tabs.push({
            tab_title: "Toggle Item 1",
            tab_content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            _id: generateGUID()
          });
        }
        const _a = base, { selected_icon: _ } = _a, cleanBase = __objRest(_a, ["selected_icon"]);
        const settings = __spreadProps(__spreadValues({}, cleanBase), {
          tabs,
          // Icons
          selected_icon: { value: "fas fa-plus", library: "fa-solid" },
          selected_active_icon: { value: "fas fa-minus", library: "fa-solid" },
          icon_align: "right",
          // Title
          title_html_tag: "div",
          // Behavior
          faq_schema: ""
        });
        if ((_b = w.styles) == null ? void 0 : _b.selected_icon) {
          settings.selected_icon = w.styles.selected_icon;
        }
        return {
          widgetType: "toggle",
          settings
        };
      }
    },
    {
      key: "alert",
      widgetType: "alert",
      family: "misc",
      aliases: generateAliases("alert", ["alerta", "aviso", "notifica\xE7\xE3o"], ["notification", "message", "info box"]),
      compile: (w, base) => ({
        widgetType: "alert",
        settings: __spreadProps(__spreadValues({}, base), { alert_type: base.alert_type || "info", title: w.content || base.title || "Alerta" })
      })
    },
    {
      key: "social-icons",
      widgetType: "social-icons",
      family: "misc",
      aliases: generateAliases("social-icons", ["\xEDcones sociais", "redes sociais"], ["social icons", "social media", "follow us", "facebook", "instagram"]),
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
      aliases: generateAliases("soundcloud", ["\xE1udio", "som"], ["audio", "player"]),
      compile: (w, base) => ({ widgetType: "soundcloud", settings: __spreadProps(__spreadValues({}, base), { url: w.content || base.url || "" }) })
    },
    {
      key: "shortcode",
      widgetType: "shortcode",
      family: "misc",
      aliases: generateAliases("shortcode", ["shortcode", "c\xF3digo"], ["code"]),
      compile: (w, base) => ({ widgetType: "shortcode", settings: __spreadProps(__spreadValues({}, base), { shortcode: w.content || base.shortcode || "" }) })
    },
    {
      key: "menu-anchor",
      widgetType: "menu-anchor",
      family: "nav",
      aliases: generateAliases("menu-anchor", ["\xE2ncora", "link interno"], ["menu anchor", "anchor", "id"]),
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
      aliases: generateAliases("read-more", ["leia mais"], ["read more"]),
      compile: (w, base) => ({ widgetType: "read-more", settings: __spreadProps(__spreadValues({}, base), { text: w.content || base.text || "Leia mais" }) })
    },
    {
      key: "image-carousel",
      widgetType: "image-carousel",
      family: "media",
      aliases: generateAliases("image-carousel", ["carrossel de imagens", "slider de imagens", "carrossel"], ["image carousel", "logo carousel", "logos", "slider"]),
      compile: (w, base) => {
        let slides = base.slides;
        if ((!slides || slides.length === 0) && w.children && w.children.length > 0) {
          slides = w.children.filter((c) => c.type === "image").map((c, i) => ({
            _id: `slide_${i + 1}`,
            id: c.imageId ? parseInt(c.imageId, 10) : "",
            url: c.content || "",
            image: {
              url: c.content || "",
              id: c.imageId ? parseInt(c.imageId, 10) : ""
            }
          }));
        }
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
            carousel: normalizedSlides,
            slides: normalizedSlides
            // Keep both for compatibility
          })
        };
      }
    },
    {
      key: "loop-carousel",
      widgetType: "loop-carousel",
      family: "pro",
      aliases: generateAliases("loop-carousel", ["loop do carrossel", "loop carousel"], ["loop"]),
      compile: (w, base) => ({
        widgetType: "loop-carousel",
        settings: __spreadProps(__spreadValues({}, base), {
          // Loop carousel relies on templates, so we mostly pass base settings
          // but we can ensure some defaults if needed
          slides_to_show: base.slides_to_show || "3",
          slides_to_scroll: base.slides_to_scroll || "1"
        })
      })
    },
    {
      key: "basic-gallery",
      widgetType: "basic-gallery",
      family: "media",
      aliases: generateAliases("basic-gallery", ["galeria b\xE1sica"], ["basic gallery"]),
      compile: (w, base) => {
        let gallery = base.gallery;
        if ((!gallery || gallery.length === 0) && w.children && w.children.length > 0) {
          gallery = w.children.filter((c) => c.type === "image").map((c) => ({
            id: c.imageId ? parseInt(c.imageId, 10) : "",
            url: c.content || ""
          }));
        }
        return {
          widgetType: "basic-gallery",
          settings: __spreadProps(__spreadValues({}, base), {
            gallery: gallery || [{
              id: w.imageId && !isNaN(parseInt(w.imageId, 10)) ? parseInt(w.imageId, 10) : "",
              url: w.content || ""
            }]
          })
        };
      }
    },
    {
      key: "media:carousel",
      widgetType: "media-carousel",
      family: "media",
      aliases: generateAliases("media-carousel", ["carrossel de m\xEDdia"], ["media carousel"]),
      compile: (w, base) => {
        let slides = base.slides;
        if ((!slides || slides.length === 0) && w.children && w.children.length > 0) {
          slides = w.children.filter((c) => c.type === "image").map((c, i) => ({
            _id: `slide_${i + 1}`,
            id: c.imageId ? parseInt(c.imageId, 10) : "",
            url: c.content || "",
            image: {
              url: c.content || "",
              id: c.imageId ? parseInt(c.imageId, 10) : ""
            }
          }));
        }
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
          widgetType: "media-carousel",
          settings: __spreadProps(__spreadValues({}, base), {
            slides: normalizedSlides
          })
        };
      }
    },
    {
      key: "testimonial-carousel",
      widgetType: "testimonial-carousel",
      family: "pro",
      aliases: generateAliases("testimonial-carousel", ["carrossel de depoimentos"], ["testimonial carousel"]),
      compile: (w, base) => {
        const slides = base.slides || [];
        return {
          widgetType: "testimonial-carousel",
          settings: __spreadProps(__spreadValues({}, base), {
            slides
          })
        };
      }
    },
    {
      key: "reviews",
      widgetType: "reviews",
      family: "pro",
      aliases: generateAliases("reviews", ["avalia\xE7\xF5es"], ["reviews"]),
      compile: (w, base) => {
        const slides = base.slides || [];
        return {
          widgetType: "reviews",
          settings: __spreadProps(__spreadValues({}, base), {
            slides
          })
        };
      }
    },
    {
      key: "slider:slides",
      widgetType: "slides",
      family: "media",
      aliases: generateAliases("slider:slides", ["slides", "slider"], ["hero slider", "banner rotativo"]),
      compile: (w, base) => {
        const slides = base.slides || [];
        return {
          widgetType: "slides",
          settings: __spreadProps(__spreadValues({}, base), {
            slides
          })
        };
      }
    },
    {
      key: "w:slideshow",
      widgetType: "image-carousel",
      family: "media",
      aliases: generateAliases("w:slideshow", ["slideshow"], []),
      compile: (w, base) => {
        let slides = base.slides;
        if ((!slides || slides.length === 0) && w.children && w.children.length > 0) {
          slides = w.children.filter((c) => c.type === "image").map((c, i) => ({
            _id: `slide_${i + 1}`,
            id: c.imageId ? parseInt(c.imageId, 10) : "",
            url: c.content || "",
            image: {
              url: c.content || "",
              id: c.imageId ? parseInt(c.imageId, 10) : ""
            }
          }));
        }
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
      aliases: generateAliases("gallery", ["galeria", "galeria de fotos", "fotos"], ["photo gallery", "images", "grid gallery"]),
      compile: (w, base) => {
        let gallery = base.gallery;
        if ((!gallery || gallery.length === 0) && w.children && w.children.length > 0) {
          gallery = w.children.filter((c) => c.type === "image").map((c) => ({
            id: c.imageId ? parseInt(c.imageId, 10) : "",
            url: c.content || ""
          }));
        }
        return {
          widgetType: "gallery",
          settings: __spreadProps(__spreadValues({}, base), {
            gallery: gallery || [{
              id: w.imageId && !isNaN(parseInt(w.imageId, 10)) ? parseInt(w.imageId, 10) : "",
              url: w.content || ""
            }]
          })
        };
      }
    },
    {
      key: "nav-menu",
      widgetType: "nav-menu",
      family: "nav",
      aliases: generateAliases("nav-menu", ["menu", "navega\xE7\xE3o", "menu principal"], ["nav menu", "navigation", "navbar", "header menu", "menu topo"]),
      compile: (w, base) => {
        var _a, _b, _c, _d, _e, _f;
        const settings = __spreadProps(__spreadValues({}, base), {
          layout: base.layout || "horizontal",
          menu: w.content || base.menu || "",
          // Full width stretch
          full_width: "stretch",
          stretch_element_to_full_width: "yes",
          // Align menu items
          align_items: "center"
        });
        if ((_a = w.styles) == null ? void 0 : _a.fontSize) {
          settings.typography_typography = "custom";
          settings.typography_font_size = { unit: "px", size: w.styles.fontSize };
        }
        if ((_c = (_b = w.styles) == null ? void 0 : _b.fontName) == null ? void 0 : _c.family) {
          settings.typography_typography = "custom";
          settings.typography_font_family = w.styles.fontName.family;
        }
        if ((_d = w.styles) == null ? void 0 : _d.fontWeight) {
          settings.typography_font_weight = w.styles.fontWeight;
        }
        if ((_e = w.styles) == null ? void 0 : _e.letterSpacing) {
          const lsValue = typeof w.styles.letterSpacing === "object" ? w.styles.letterSpacing.value : w.styles.letterSpacing;
          settings.typography_letter_spacing = { unit: "px", size: lsValue };
        }
        if ((_f = w.styles) == null ? void 0 : _f.color) {
          const c = w.styles.color;
          if (typeof c === "object" && "r" in c) {
            const r = Math.round(c.r * 255);
            const g = Math.round(c.g * 255);
            const b = Math.round(c.b * 255);
            const a = c.a !== void 0 ? c.a : 1;
            settings.text_color = `rgba(${r}, ${g}, ${b}, ${a})`;
          } else if (typeof c === "string") {
            settings.text_color = c;
          }
        }
        if (settings.text_color) {
          settings.text_color_hover = settings.text_color;
        }
        return { widgetType: "nav-menu", settings };
      }
    },
    {
      key: "search-form",
      widgetType: "search-form",
      family: "misc",
      aliases: generateAliases("search-form", ["formul\xE1rio de busca", "pesquisa"], ["search form", "search"]),
      compile: (_w, base) => ({ widgetType: "search-form", settings: __spreadValues({}, base) })
    },
    {
      key: "google-maps",
      widgetType: "google-maps",
      family: "media",
      aliases: generateAliases("google-maps", ["mapa", "google maps"], ["maps", "location"]),
      compile: (w, base) => ({ widgetType: "google-maps", settings: __spreadProps(__spreadValues({}, base), { address: w.content || base.address || "" }) })
    },
    {
      key: "testimonial",
      widgetType: "testimonial",
      family: "misc",
      aliases: generateAliases("testimonial", ["depoimento", "cita\xE7\xE3o", "avalia\xE7\xE3o"], ["quote", "review", "single testimonial"]),
      compile: (w, base) => ({
        widgetType: "testimonial",
        settings: __spreadProps(__spreadValues({}, base), { testimonial_content: w.content || base.testimonial_content || "Depoimento" })
      })
    },
    {
      key: "embed",
      widgetType: "embed",
      family: "media",
      aliases: generateAliases("embed", ["incorporar", "embed"], ["iframe"]),
      compile: (w, base) => ({ widgetType: "embed", settings: __spreadProps(__spreadValues({}, base), { embed_url: w.content || base.embed_url || "" }) })
    },
    {
      key: "lottie",
      widgetType: "lottie",
      family: "media",
      aliases: generateAliases("lottie", ["lottie", "anima\xE7\xE3o"], ["animation", "json animation"]),
      compile: (w, base) => ({ widgetType: "lottie", settings: __spreadProps(__spreadValues({}, base), { lottie_url: w.content || base.lottie_url || "" }) })
    },
    {
      key: "html",
      widgetType: "html",
      family: "misc",
      aliases: generateAliases("html", ["html", "c\xF3digo personalizado"], ["custom code"]),
      compile: (w, base) => ({ widgetType: "html", settings: __spreadProps(__spreadValues({}, base), { html: w.content || "" }) })
    }
  ];
  var basicWidgets = [
    "w:container",
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
  var proWidgets = [
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
  var wooWidgets = [
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
  var loopWidgets = [
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
  var experimentalWidgets = [
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
  var wpWidgets = [
    "w:wp-search",
    "w:wp-recent-posts",
    "w:wp-recent-comments",
    "w:wp-archives",
    "w:wp-categories",
    "w:wp-calendar",
    "w:wp-tag-cloud",
    "w:wp-custom-menu"
  ];
  var widgetAliases = {
    "w:container": { pt: ["container", "se\xE7\xE3o", "coluna", "linha"], en: ["section", "row", "column", "full container", "container 100%", "boxed container", "inner container"] },
    "w:form": { pt: ["formul\xE1rio", "campos", "form de contato", "newsletter"], en: ["form", "contact form", "input"] },
    "w:login": { pt: ["login", "entrar", "acesso", "login form"], en: ["login", "signin", "sign in"] },
    "w:subscription": { pt: ["inscri\xE7\xE3o", "newsletter"], en: ["subscription", "newsletter"] },
    "w:call-to-action": { pt: ["chamada para a\xE7\xE3o", "box cta", "promo box"], en: ["call to action", "cta box"] },
    "media:carousel": { pt: ["carrossel de m\xEDdia"], en: ["media carousel"] },
    "w:portfolio": { pt: ["portf\xF3lio"], en: ["portfolio"] },
    "w:gallery-pro": { pt: ["galeria pro"], en: ["gallery pro"] },
    "slider:slides": { pt: ["slides", "carrossel", "slider", "banner rotativo"], en: ["slides", "slider", "carousel", "hero slider"] },
    "w:slideshow": { pt: ["slideshow"], en: ["slideshow"] },
    "w:flip-box": { pt: ["flip box", "caixa girat\xF3ria"], en: ["flip box"] },
    "w:animated-headline": { pt: ["t\xEDtulo animado", "texto animado", "efeito de digita\xE7\xE3o"], en: ["animated headline", "moving text", "typing effect"] },
    "w:post-navigation": { pt: ["navega\xE7\xE3o de post"], en: ["post navigation"] },
    "w:share-buttons": { pt: ["bot\xF5es de compartilhamento"], en: ["share buttons"] },
    "w:table-of-contents": { pt: ["\xEDndice"], en: ["table of contents"] },
    "w:countdown": { pt: ["contagem regressiva"], en: ["countdown"] },
    "w:blockquote": { pt: ["cita\xE7\xE3o"], en: ["blockquote"] },
    "w:testimonial-carousel": { pt: ["carrossel de depoimentos", "avalia\xE7\xF5es", "slider de depoimentos"], en: ["testimonial carousel", "reviews"] },
    "w:review-box": { pt: ["caixa de avalia\xE7\xE3o"], en: ["review box"] },
    "w:hotspots": { pt: ["hotspots", "pontos de destaque"], en: ["hotspots"] },
    "w:sitemap": { pt: ["mapa do site"], en: ["sitemap"] },
    "w:author-box": { pt: ["caixa do autor"], en: ["author box"] },
    "w:price-table": { pt: ["tabela de pre\xE7o", "pre\xE7os", "plano", "pricing table"], en: ["price table", "pricing", "price"] },
    "w:price-list": { pt: ["lista de pre\xE7o", "card\xE1pio"], en: ["price list", "menu list"] },
    "w:progress-tracker": { pt: ["rastreador de progresso"], en: ["progress tracker"] },
    "w:animated-text": { pt: ["texto animado"], en: ["animated text"] },
    "w:nav-menu-pro": { pt: ["menu pro"], en: ["nav menu pro"] },
    "w:breadcrumb": { pt: ["breadcrumb", "migalhas de p\xE3o", "caminho"], en: ["breadcrumb"] },
    "w:facebook-button": { pt: ["bot\xE3o facebook"], en: ["facebook button"] },
    "w:facebook-comments": { pt: ["coment\xE1rios facebook"], en: ["facebook comments"] },
    "w:facebook-embed": { pt: ["embed facebook"], en: ["facebook embed"] },
    "w:facebook-page": { pt: ["p\xE1gina facebook"], en: ["facebook page"] },
    "loop:builder": { pt: ["loop builder"], en: ["loop builder"] },
    "loop:grid-advanced": { pt: ["grid avan\xE7ado"], en: ["advanced grid"] },
    "loop:carousel": { pt: ["loop carrossel"], en: ["loop carousel"] },
    "w:post-excerpt": { pt: ["resumo do post"], en: ["post excerpt"] },
    "w:post-content": { pt: ["conte\xFAdo do post"], en: ["post content"] },
    "w:post-title": { pt: ["t\xEDtulo do post"], en: ["post title"] },
    "w:post-info": { pt: ["info do post"], en: ["post info"] },
    "w:post-featured-image": { pt: ["imagem destacada"], en: ["featured image"] },
    "w:post-author": { pt: ["autor do post"], en: ["post author"] },
    "w:post-date": { pt: ["data do post"], en: ["post date"] },
    "w:post-terms": { pt: ["termos do post"], en: ["post terms"] },
    "w:archive-title": { pt: ["t\xEDtulo do arquivo"], en: ["archive title"] },
    "w:archive-description": { pt: ["descri\xE7\xE3o do arquivo"], en: ["archive description"] },
    "w:site-logo": { pt: ["logo do site"], en: ["site logo"] },
    "w:site-title": { pt: ["t\xEDtulo do site"], en: ["site title"] },
    "w:site-tagline": { pt: ["slogan do site"], en: ["site tagline"] },
    "w:search-results": { pt: ["resultados da busca"], en: ["search results"] },
    "w:global-widget": { pt: ["widget global"], en: ["global widget"] },
    "w:video-playlist": { pt: ["playlist de v\xEDdeo"], en: ["video playlist"] },
    "w:video-gallery": { pt: ["galeria de v\xEDdeo"], en: ["video gallery"] },
    "woo:product-title": { pt: ["t\xEDtulo do produto"], en: ["product title"] },
    "woo:product-image": { pt: ["imagem do produto"], en: ["product image"] },
    "woo:product-price": { pt: ["pre\xE7o do produto"], en: ["product price"] },
    "woo:product-add-to-cart": { pt: ["adicionar ao carrinho", "bot\xE3o comprar", "comprar"], en: ["add to cart", "buy button"] },
    "woo:product-data-tabs": { pt: ["abas de dados do produto"], en: ["product data tabs"] },
    "woo:product-excerpt": { pt: ["resumo do produto"], en: ["product excerpt"] },
    "woo:product-rating": { pt: ["avalia\xE7\xE3o do produto"], en: ["product rating"] },
    "woo:product-stock": { pt: ["estoque do produto"], en: ["product stock"] },
    "woo:product-meta": { pt: ["meta do produto"], en: ["product meta"] },
    "woo:product-additional-information": { pt: ["informa\xE7\xE3o adicional"], en: ["additional information"] },
    "woo:product-short-description": { pt: ["descri\xE7\xE3o curta"], en: ["short description"] },
    "woo:product-related": { pt: ["produtos relacionados"], en: ["related products"] },
    "woo:product-upsells": { pt: ["upsells"], en: ["upsells"] },
    "woo:product-tabs": { pt: ["abas do produto"], en: ["product tabs"] },
    "woo:product-breadcrumb": { pt: ["breadcrumb do produto"], en: ["product breadcrumb"] },
    "woo:product-gallery": { pt: ["galeria do produto"], en: ["product gallery"] },
    "woo:products": { pt: ["produtos"], en: ["products"] },
    "woo:product-grid": { pt: ["grid de produtos"], en: ["product grid"] },
    "woo:product-carousel": { pt: ["carrossel de produtos"], en: ["product carousel"] },
    "woo:product-loop-item": { pt: ["item de loop de produto"], en: ["product loop item"] },
    "woo:loop-product-title": { pt: ["t\xEDtulo do produto (loop)"], en: ["loop product title"] },
    "woo:loop-product-price": { pt: ["pre\xE7o do produto (loop)"], en: ["loop product price"] },
    "woo:loop-product-rating": { pt: ["avalia\xE7\xE3o do produto (loop)"], en: ["loop product rating"] },
    "woo:loop-product-image": { pt: ["imagem do produto (loop)"], en: ["loop product image"] },
    "woo:loop-product-button": { pt: ["bot\xE3o do produto (loop)"], en: ["loop product button"] },
    "woo:loop-product-meta": { pt: ["meta do produto (loop)"], en: ["loop product meta"] },
    "woo:cart": { pt: ["carrinho"], en: ["cart"] },
    "woo:checkout": { pt: ["checkout", "finalizar compra"], en: ["checkout"] },
    "woo:my-account": { pt: ["minha conta"], en: ["my account"] },
    "woo:purchase-summary": { pt: ["resumo da compra"], en: ["purchase summary"] },
    "woo:order-tracking": { pt: ["rastreamento de pedido"], en: ["order tracking"] },
    "loop:item": { pt: ["item de loop"], en: ["loop item"] },
    "loop:image": { pt: ["imagem de loop"], en: ["loop image"] },
    "loop:title": { pt: ["t\xEDtulo de loop"], en: ["loop title"] },
    "loop:meta": { pt: ["meta de loop"], en: ["loop meta"] },
    "loop:terms": { pt: ["termos de loop"], en: ["loop terms"] },
    "loop:rating": { pt: ["avalia\xE7\xE3o de loop"], en: ["loop rating"] },
    "loop:price": { pt: ["pre\xE7o de loop"], en: ["loop price"] },
    "loop:add-to-cart": { pt: ["adicionar ao carrinho (loop)"], en: ["loop add to cart"] },
    "loop:read-more": { pt: ["leia mais (loop)"], en: ["loop read more"] },
    "loop:featured-image": { pt: ["imagem destacada (loop)"], en: ["loop featured image"] },
    "w:nested-tabs": { pt: ["abas aninhadas"], en: ["nested tabs"] },
    "w:mega-menu": { pt: ["mega menu"], en: ["mega menu"] },
    "w:scroll-snap": { pt: ["scroll snap"], en: ["scroll snap"] },
    "w:motion-effects": { pt: ["efeitos de movimento"], en: ["motion effects"] },
    "w:background-slideshow": { pt: ["slideshow de fundo"], en: ["background slideshow"] },
    "w:css-transform": { pt: ["transforma\xE7\xE3o css"], en: ["css transform"] },
    "w:custom-position": { pt: ["posi\xE7\xE3o personalizada"], en: ["custom position"] },
    "w:dynamic-tags": { pt: ["tags din\xE2micas"], en: ["dynamic tags"] },
    "w:ajax-pagination": { pt: ["pagina\xE7\xE3o ajax"], en: ["ajax pagination"] },
    "loop:pagination": { pt: ["pagina\xE7\xE3o de loop"], en: ["loop pagination"] },
    "w:aspect-ratio-container": { pt: ["container propor\xE7\xE3o"], en: ["aspect ratio container"] },
    "w:wp-search": { pt: ["busca wp"], en: ["wp search"] },
    "w:wp-recent-posts": { pt: ["posts recentes wp"], en: ["wp recent posts"] },
    "w:wp-recent-comments": { pt: ["coment\xE1rios recentes wp"], en: ["wp recent comments"] },
    "w:wp-archives": { pt: ["arquivos wp"], en: ["wp archives"] },
    "w:wp-categories": { pt: ["categorias wp"], en: ["wp categories"] },
    "w:wp-calendar": { pt: ["calend\xE1rio wp"], en: ["wp calendar"] },
    "w:wp-tag-cloud": { pt: ["nuvem de tags wp"], en: ["wp tag cloud"] },
    "w:wp-custom-menu": { pt: ["menu personalizado wp"], en: ["wp custom menu"] }
  };
  var registerWithAliases = (key, family) => {
    const aliasData = widgetAliases[key] || { pt: [], en: [] };
    const aliases = generateAliases(slugFromKey(key), aliasData.pt, aliasData.en);
    registry.push(stubDefinition(key, family, aliases));
  };
  basicWidgets.forEach((k) => registerWithAliases(k, "misc"));
  proWidgets.forEach((k) => registerWithAliases(k, "pro"));
  wooWidgets.forEach((k) => registerWithAliases(k, "woo"));
  loopWidgets.forEach((k) => registerWithAliases(k, "loop"));
  experimentalWidgets.forEach((k) => registerWithAliases(k, "misc"));
  wpWidgets.forEach((k) => registerWithAliases(k, "wp"));
  function findWidgetDefinition(type, kind) {
    const kindLower = kind ? kind.toLowerCase() : "";
    const typeLower = type.toLowerCase();
    const direct = registry.find((r) => r.key.toLowerCase() === typeLower || r.widgetType.toLowerCase() === typeLower);
    if (direct) return direct;
    const byTypeAlias = registry.find((r) => (r.aliases || []).some((a) => a.toLowerCase() === typeLower));
    if (byTypeAlias) return byTypeAlias;
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

  // src/compiler/elementor.compiler.ts
  var ElementorCompiler = class {
    constructor() {
      __publicField(this, "wpConfig", {});
    }
    setWPConfig(config) {
      this.wpConfig = config;
    }
    sanitizeColor(value) {
      return normalizeColor(value);
    }
    compile(schema) {
      var _a;
      const elements = schema.containers.map((container) => this.compileContainer(container, false));
      let siteurl = ((_a = this.wpConfig) == null ? void 0 : _a.url) || "";
      if (siteurl && !siteurl.endsWith("/")) siteurl += "/";
      if (siteurl && !siteurl.endsWith("wp-json/")) siteurl += "wp-json/";
      const template = {
        type: "elementor",
        version: "0.4",
        siteurl,
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
      }, this.mapContainerStyles(container.styles, container.width !== "full"));
      if (!settings.flex_gap) {
        settings.flex_gap = { unit: "px", column: "", row: "", isLinked: true };
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
    mapContainerStyles(styles, isBoxed = false) {
      const settings = {};
      settings.overflow = "hidden";
      if (!styles) return settings;
      console.log("[CONTAINER STYLES DEBUG]", {
        gap: styles.gap,
        paddingTop: styles.paddingTop,
        paddingRight: styles.paddingRight,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        sourceName: styles.sourceName
      });
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
      if (typeof styles.gap === "number" && styles.gap > 0) {
        settings.flex_gap = {
          unit: "px",
          column: String(styles.gap),
          row: String(styles.gap),
          isLinked: true
        };
      }
      const pTop = typeof styles.paddingTop === "number" ? styles.paddingTop : 0;
      const pRight = typeof styles.paddingRight === "number" ? styles.paddingRight : 0;
      const pBottom = typeof styles.paddingBottom === "number" ? styles.paddingBottom : 0;
      const pLeft = typeof styles.paddingLeft === "number" ? styles.paddingLeft : 0;
      if (pTop !== 0 || pRight !== 0 || pBottom !== 0 || pLeft !== 0) {
        settings.padding = {
          unit: "px",
          top: pTop,
          right: pRight,
          bottom: pBottom,
          left: pLeft,
          isLinked: pTop === pRight && pTop === pBottom && pTop === pLeft
        };
      }
      if (styles.background) {
        const bg = styles.background;
        if (bg.type === "solid" || bg.color) {
          const sanitizedColor = this.sanitizeColor(bg.color);
          if (sanitizedColor) {
            settings.background_background = "classic";
            settings.background_color = sanitizedColor;
          }
        } else if (bg.type === "gradient" && bg.stops && bg.stops.length >= 2) {
          settings.background_background = "gradient";
          settings.background_gradient_type = bg.gradientType || "linear";
          settings.background_color = bg.stops[0].color;
          settings.background_color_stop = { unit: "%", size: bg.stops[0].position, sizes: [] };
          if (bg.stops.length >= 2) {
            settings.background_color_b = bg.stops[bg.stops.length - 1].color;
            settings.background_color_b_stop = { unit: "%", size: bg.stops[bg.stops.length - 1].position, sizes: [] };
          }
          settings.background_gradient_angle = { unit: "deg", size: 180, sizes: [] };
        } else if (bg.type === "image" && bg.imageHash) {
          settings.background_background = "classic";
          settings.background_image = { url: "", id: 0, imageHash: bg.imageHash };
        }
      }
      if (styles.width) {
        if (isBoxed) {
          settings.boxed_width = { unit: "px", size: styles.width, sizes: [] };
          settings.width = { unit: "%", size: "", sizes: [] };
        } else {
          settings.width = { unit: "px", size: styles.width, sizes: [] };
        }
      } else {
        settings.width = { unit: "%", size: "", sizes: [] };
      }
      if (styles.minHeight) {
        settings.min_height = { unit: "px", size: styles.minHeight, sizes: [] };
      } else {
        settings.min_height = { unit: "px", size: "", sizes: [] };
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
      if (icon.value && icon.library === "svg" && typeof icon.value === "object" && "url" in icon.value) {
        return icon;
      }
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
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
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
          isInner: (_c = registryResult.isInner) != null ? _c : false,
          isLocked: false,
          widgetType: registryResult.widgetType,
          settings: normalizedSettings,
          defaultEditSettings: { defaultEditRoute: "content" },
          elements: registryResult.elements || []
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
          if ((_d = widget.styles) == null ? void 0 : _d.background) {
            settings.background_color = this.sanitizeColor(widget.styles.background);
          } else if (((_e = widget.styles) == null ? void 0 : _e.fills) && Array.isArray(widget.styles.fills) && widget.styles.fills.length > 0) {
            const solidFill = widget.styles.fills.find((f) => f.type === "SOLID");
            if (solidFill) {
              settings.background_color = this.sanitizeColor(solidFill.color);
            }
          }
          if (baseSettings.color) {
            settings.button_text_color = baseSettings.color;
          }
          if (((_f = widget.styles) == null ? void 0 : _f.paddingTop) !== void 0 || ((_g = widget.styles) == null ? void 0 : _g.paddingRight) !== void 0 || ((_h = widget.styles) == null ? void 0 : _h.paddingBottom) !== void 0 || ((_i = widget.styles) == null ? void 0 : _i.paddingLeft) !== void 0) {
            settings.button_padding = {
              unit: "px",
              top: widget.styles.paddingTop || 0,
              right: widget.styles.paddingRight || 0,
              bottom: widget.styles.paddingBottom || 0,
              left: widget.styles.paddingLeft || 0,
              isLinked: false
            };
          }
          if (((_j = widget.styles) == null ? void 0 : _j.cornerRadius) !== void 0) {
            settings.border_radius = {
              unit: "px",
              top: widget.styles.cornerRadius,
              right: widget.styles.cornerRadius,
              bottom: widget.styles.cornerRadius,
              left: widget.styles.cornerRadius,
              isLinked: true
            };
          }
          if (widget.imageId) {
            settings.selected_icon = this.normalizeSelectedIcon(
              ((_k = widget.styles) == null ? void 0 : _k.selected_icon) || baseSettings.selected_icon || widget.content,
              widget.imageId,
              { value: "fas fa-arrow-right", library: "fa-solid" }
            );
            settings.icon_align = "right";
          }
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
          settings.selected_icon = ((_l = widget.styles) == null ? void 0 : _l.selected_icon) || baseSettings.selected_icon || widget.content;
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

  // src/utils/hash.ts
  async function computeHash(bytes) {
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
  }

  // src/media/image.exporter.ts
  function bytesToString(bytes) {
    let result = "";
    for (let i = 0; i < bytes.length; i++) {
      result += String.fromCharCode(bytes[i]);
    }
    return result;
  }
  function stringToBytes(str) {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 255;
    }
    return bytes;
  }
  function sanitizeSvg(svgBytes) {
    let svgString = bytesToString(svgBytes);
    svgString = svgString.replace(/<filter[^>]*>\s*<\/filter>/gi, "");
    svgString = svgString.replace(/<filter[^>]*\/>/gi, "");
    const filterRefs = svgString.match(/filter="url\(#([^)]+)\)"/gi) || [];
    filterRefs.forEach((ref) => {
      const match = ref.match(/url\(#([^)]+)\)/);
      if (match) {
        const filterId = match[1];
        const filterRegex = new RegExp(`<filter[^>]*id=["']${filterId}["'][^>]*>[\\s\\S]+?<\\/filter>`, "i");
        if (!filterRegex.test(svgString)) {
          svgString = svgString.replace(new RegExp(`filter="url\\(#${filterId}\\)"`, "gi"), "");
        }
      }
    });
    svgString = svgString.replace(/<defs>\s*<\/defs>/gi, "");
    return stringToBytes(svgString);
  }
  async function exportNodeAsImage(node, format, quality = 0.85) {
    try {
      if (format === "SVG") {
        const bytes2 = await node.exportAsync({ format: "SVG" });
        const sanitizedBytes = sanitizeSvg(bytes2);
        return { bytes: sanitizedBytes, mime: "image/svg+xml", ext: "svg" };
      }
      if (format === "WEBP") {
        const bytes2 = await node.exportAsync({
          format: "PNG",
          constraint: { type: "SCALE", value: 2 }
        });
        return { bytes: bytes2, mime: "image/png", ext: "webp", needsConversion: true };
      }
      if (format === "JPG") {
        const bytes2 = await node.exportAsync({
          format: "JPG",
          constraint: { type: "SCALE", value: 2 }
        });
        return { bytes: bytes2, mime: "image/jpeg", ext: "jpg" };
      }
      const bytes = await node.exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: 2 }
      });
      return { bytes, mime: "image/png", ext: "png" };
    } catch (e) {
      console.error(`[F2E] Failed to export image for "${node.name}" (${node.id}):`, e);
      return null;
    }
  }

  // src/media/uploader.ts
  var ImageUploader = class {
    constructor(wpConfig, quality = 0.85) {
      __publicField(this, "pendingUploads", /* @__PURE__ */ new Map());
      __publicField(this, "mediaHashCache", /* @__PURE__ */ new Map());
      __publicField(this, "nodeHashCache", /* @__PURE__ */ new Map());
      __publicField(this, "quality", 0.85);
      __publicField(this, "wpConfig");
      this.wpConfig = wpConfig;
      this.quality = quality;
    }
    /**
     * Faz upload de uma imagem para o WordPress
     * @param node Nó do Figma a ser exportado
     * @param format Formato da imagem
     * @returns Objeto com URL e ID da imagem no WordPress ou null
     */
    async uploadToWordPress(node, format = "WEBP") {
      if (!this.wpConfig || !this.wpConfig.url || !this.wpConfig.user || !this.wpConfig.password) {
        console.warn("[F2E] WP config ausente.");
        return null;
      }
      try {
        const targetFormat = format === "SVG" ? "SVG" : "WEBP";
        const result = await exportNodeAsImage(node, targetFormat, this.quality);
        if (!result) return null;
        const { bytes, mime, ext, needsConversion } = result;
        const hash = await computeHash(bytes);
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

  // src/config/prompts.ts
  var OPTIMIZE_SCHEMA_PROMPT = `
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

  // src/config/debug.ts
  var DEBUG_SHADOW_V1 = false;
  var DEBUG_V2_EXPLAIN = true;

  // src/engine/heuristic-registry.ts
  var V2_MIN_CONFIDENCE = 0.7;
  var BUTTON_MIN_CONFIDENCE = 0.7;
  var HEADING_MIN_CONFIDENCE = 0.75;
  var IMAGE_BOX_MIN_CONFIDENCE = 0.65;
  var TEXT_EDITOR_MIN_CONFIDENCE = 0.6;
  var CONTAINER_DEFAULT_CONFIDENCE = 0.3;
  var ButtonRule = {
    id: "h_button_calibrated",
    targetWidget: "w:button",
    evaluate: function(features) {
      var score = 0;
      var reasons = [];
      if (features.hasText && features.textCount === 1) {
        score += 0.35;
        reasons.push("Texto \xFAnico detectado");
      }
      if (features.hasFill || features.hasStroke) {
        score += 0.2;
        reasons.push("Possui preenchimento ou borda");
      }
      if (features.aspectRatio > 1.5 && features.aspectRatio < 8) {
        score += 0.2;
        reasons.push("Propor\xE7\xE3o horizontal t\xEDpica de bot\xE3o");
      }
      if (features.textLength > 0 && features.textLength < 40) {
        score += 0.15;
        reasons.push("Texto curto (< 40 chars)");
      }
      if (features.childCount > 2) {
        score -= 0.4;
        reasons.push("PENALTY: Muitos filhos (" + features.childCount + ")");
      }
      if (features.height > 120) {
        score -= 0.4;
        reasons.push("PENALTY: Altura excessiva (" + features.height + "px)");
      }
      if (features.hasNestedFrames) {
        score -= 0.3;
        reasons.push("PENALTY: Estrutura aninhada complexa");
      }
      if (features.area > 15e4) {
        score -= 0.35;
        reasons.push("PENALTY: \xC1rea muito grande");
      }
      if ((features.zone === "HEADER" || features.zone === "FOOTER") && features.area > 5e4) {
        score -= 0.2;
        reasons.push("PENALTY: Container grande em " + features.zone);
      }
      if (!features.hasText) {
        score -= 0.5;
        reasons.push("PENALTY: Sem texto");
      }
      if (score < BUTTON_MIN_CONFIDENCE) {
        return null;
      }
      return {
        widget: "w:button",
        score: score > 1 ? 1 : score,
        ruleId: "h_button_calibrated",
        reasons
      };
    }
  };
  var HeadingRule = {
    id: "h_heading_calibrated",
    targetWidget: "w:heading",
    evaluate: function(features) {
      var score = 0;
      var reasons = [];
      if (!features.hasText && features.type !== "TEXT") {
        return null;
      }
      if (features.fontSize >= 22) {
        score += 0.4;
        reasons.push("Tamanho de fonte tipogr\xE1fica grande (" + features.fontSize + "px)");
      } else if (features.fontSize >= 18) {
        score += 0.25;
        reasons.push("Tamanho de fonte moderado (" + features.fontSize + "px)");
      }
      if (features.fontWeight >= 600) {
        score += 0.25;
        reasons.push("Peso de fonte bold/semibold");
      }
      if (features.textLength > 0 && features.textLength < 80) {
        score += 0.2;
        reasons.push("Texto curto (< 80 chars)");
      }
      if (features.zone === "HERO" || features.zone === "HEADER") {
        score += 0.15;
        reasons.push("Zona com alta probabilidade de heading");
      }
      if (features.textLength > 150) {
        score -= 0.5;
        reasons.push("PENALTY: Texto muito longo (par\xE1grafo)");
      }
      if (features.fontSize > 0 && features.fontSize <= 16) {
        score -= 0.4;
        reasons.push("PENALTY: Font size pequeno (" + features.fontSize + "px)");
      }
      if (features.fontWeight <= 400 && features.fontSize < 18) {
        score -= 0.3;
        reasons.push("PENALTY: Peso leve + fonte pequena");
      }
      if (features.zone === "FOOTER") {
        score -= 0.15;
        reasons.push("PENALTY: Zona FOOTER");
      }
      if (score < HEADING_MIN_CONFIDENCE) {
        return null;
      }
      return {
        widget: "w:heading",
        score: score > 1 ? 1 : score,
        ruleId: "h_heading_calibrated",
        reasons
      };
    }
  };
  var TextEditorRule = {
    id: "h_text_editor",
    targetWidget: "w:text-editor",
    evaluate: function(features) {
      var score = 0;
      var reasons = [];
      if (!features.hasText && features.type !== "TEXT") {
        return null;
      }
      if (features.fontSize > 0 && features.fontSize < 20) {
        score += 0.35;
        reasons.push("Font size de texto corrido");
      }
      if (features.textLength > 80) {
        score += 0.35;
        reasons.push("Texto longo (par\xE1grafo)");
      }
      if (features.fontWeight <= 500) {
        score += 0.2;
        reasons.push("Peso de fonte regular");
      }
      if (features.zone === "BODY") {
        score += 0.1;
        reasons.push("Zona BODY");
      }
      if (score < TEXT_EDITOR_MIN_CONFIDENCE) {
        return null;
      }
      return {
        widget: "w:text-editor",
        score: score > 1 ? 1 : score,
        ruleId: "h_text_editor",
        reasons
      };
    }
  };
  var ImageBoxRule = {
    id: "h_image_box_calibrated",
    targetWidget: "w:image-box",
    evaluate: function(features) {
      var score = 0;
      var reasons = [];
      if (!features.hasImage) {
        return null;
      }
      score += 0.3;
      reasons.push("Possui imagem");
      if (features.textCount >= 1 && features.textCount <= 3) {
        score += 0.3;
        reasons.push("Quantidade de texto ideal para card");
      }
      if (features.childCount >= 2 && features.childCount <= 5) {
        score += 0.2;
        reasons.push("Quantidade de filhos t\xEDpica de card");
      }
      if (features.aspectRatio > 0.5 && features.aspectRatio < 2.5) {
        score += 0.15;
        reasons.push("Propor\xE7\xE3o t\xEDpica de card");
      }
      if (features.textCount > 4) {
        score -= 0.5;
        reasons.push("PENALTY: Muitos textos (" + features.textCount + ")");
      }
      if (features.aspectRatio > 3) {
        score -= 0.35;
        reasons.push("PENALTY: Muito horizontal para card");
      }
      if (features.area > 3e5) {
        score -= 0.4;
        reasons.push("PENALTY: \xC1rea muito grande para card");
      }
      if (features.imageCount > 1) {
        score -= 0.25;
        reasons.push("PENALTY: M\xFAltiplas imagens (possivelmente grid/gallery)");
      }
      if (score < IMAGE_BOX_MIN_CONFIDENCE) {
        return null;
      }
      return {
        widget: "w:image-box",
        score: score > 1 ? 1 : score,
        ruleId: "h_image_box_calibrated",
        reasons
      };
    }
  };
  var ImageRule = {
    id: "h_image_simple",
    targetWidget: "w:image",
    evaluate: function(features) {
      var score = 0;
      var reasons = [];
      if (!features.hasImage && features.type !== "IMAGE") {
        return null;
      }
      if (features.type === "IMAGE") {
        score += 0.8;
        reasons.push("N\xF3 do tipo IMAGE");
      } else if (features.hasImage && features.textCount === 0) {
        score += 0.7;
        reasons.push("Possui imagem sem texto");
      }
      if (features.textCount > 0) {
        score -= 0.4;
        reasons.push("PENALTY: Tem texto (considerar image-box)");
      }
      if (score < 0.5) {
        return null;
      }
      return {
        widget: "w:image",
        score: score > 1 ? 1 : score,
        ruleId: "h_image_simple",
        reasons
      };
    }
  };
  var ICON_MAX_DIMENSION = 40;
  var ICON_MIN_CONFIDENCE = 0.7;
  var IconRule = {
    id: "h_icon_v2",
    targetWidget: "w:icon",
    evaluate: function(features) {
      var score = 0;
      var reasons = [];
      if (!features.isVectorNode) {
        return null;
      }
      if (features.vectorWidth > 0 && features.vectorWidth <= ICON_MAX_DIMENSION && features.vectorHeight > 0 && features.vectorHeight <= ICON_MAX_DIMENSION) {
        score += 0.7;
        reasons.push("Vetor pequeno (<= " + ICON_MAX_DIMENSION + "px)");
      } else if (features.vectorWidth <= 60 && features.vectorHeight <= 60) {
        score += 0.5;
        reasons.push("Vetor m\xE9dio (<= 60px)");
      } else {
        return null;
      }
      if (features.aspectRatio >= 0.8 && features.aspectRatio <= 1.2) {
        score += 0.15;
        reasons.push("Propor\xE7\xE3o quadrada t\xEDpica de \xEDcone");
      }
      if (features.hasFill || features.hasStroke) {
        score += 0.1;
        reasons.push("Possui preenchimento ou tra\xE7o");
      }
      if (score < ICON_MIN_CONFIDENCE) {
        return null;
      }
      return {
        widget: "w:icon",
        score: score > 1 ? 1 : score,
        ruleId: "h_icon_v2",
        reasons
      };
    }
  };
  var DIVIDER_MAX_HEIGHT = 5;
  var DIVIDER_MIN_WIDTH = 100;
  var DIVIDER_MIN_CONFIDENCE = 0.7;
  var DividerRule = {
    id: "h_divider_v2",
    targetWidget: "w:divider",
    evaluate: function(features) {
      var score = 0;
      var reasons = [];
      if (features.type !== "RECTANGLE" && features.type !== "LINE") {
        return null;
      }
      if (features.height <= DIVIDER_MAX_HEIGHT && features.width >= DIVIDER_MIN_WIDTH) {
        score += 0.7;
        reasons.push("Ret\xE2ngulo fino e largo (divider horizontal)");
      }
      if (features.width <= DIVIDER_MAX_HEIGHT && features.height >= DIVIDER_MIN_WIDTH) {
        score += 0.65;
        reasons.push("Ret\xE2ngulo fino e alto (divider vertical)");
      }
      if (features.hasFill || features.hasStroke) {
        score += 0.15;
        reasons.push("Possui cor vis\xEDvel");
      }
      if (features.childCount === 0) {
        score += 0.1;
        reasons.push("Elemento simples sem filhos");
      }
      if (score < DIVIDER_MIN_CONFIDENCE) {
        return null;
      }
      return {
        widget: "w:divider",
        score: score > 1 ? 1 : score,
        ruleId: "h_divider_v2",
        reasons
      };
    }
  };
  var SECTION_MIN_CONFIDENCE = 0.8;
  var SectionRule = {
    id: "h_section_strict",
    targetWidget: "structure:section",
    evaluate: function(features) {
      var score = 0;
      var reasons = [];
      if (features.type !== "FRAME" && features.type !== "SECTION" && features.type !== "GROUP") {
        return null;
      }
      if (features.width >= 1200) {
        score += 0.2;
        reasons.push("Largura >= 1200px");
      } else if (features.width >= 900) {
        score += 0.1;
        reasons.push("Largura >= 900px");
      } else {
        return null;
      }
      if (features.height >= 400) {
        score += 0.2;
        reasons.push("Altura significativa >= 400px");
      } else if (features.height >= 200) {
        score += 0.1;
        reasons.push("Altura moderada >= 200px");
      }
      if (features.childCount >= 3) {
        score += 0.15;
        reasons.push("M\xFAltiplos filhos (" + features.childCount + ")");
      }
      if (features.layoutMode !== "NONE") {
        score += 0.15;
        reasons.push("Auto Layout presente");
      }
      if (features.width < 500 && features.hasImage && features.hasText) {
        score -= 0.5;
        reasons.push("PENALTY: Parece card, n\xE3o section");
      }
      if (features.childCount < 2) {
        score -= 0.4;
        reasons.push("PENALTY: Poucos filhos para section");
      }
      if (features.siblingCount > 5) {
        score -= 0.3;
        reasons.push("PENALTY: Muitos irm\xE3os (n\xE3o \xE9 top-level)");
      }
      if (score < SECTION_MIN_CONFIDENCE) {
        return null;
      }
      return {
        widget: "structure:section",
        score: score > 1 ? 1 : score,
        ruleId: "h_section_strict",
        reasons
      };
    }
  };
  var FORM_MIN_CONFIDENCE = 0.8;
  var FormRule = {
    id: "h_form_strict",
    targetWidget: "e:form",
    evaluate: function(features) {
      var score = 0;
      var reasons = [];
      if (features.layoutMode !== "VERTICAL") {
        return null;
      }
      if (features.childCount < 3) {
        return null;
      }
      score += 0.3;
      reasons.push("Layout vertical com filhos");
      if (features.height >= 200) {
        score += 0.2;
        reasons.push("Altura >= 200px");
      }
      if (features.hasNestedFrames) {
        score += 0.15;
        reasons.push("Cont\xE9m frames aninhados (inputs)");
      }
      if (features.hasText && features.textCount >= 2) {
        score += 0.15;
        reasons.push("M\xFAltiplos textos (labels)");
      }
      if (features.hasImage && features.imageCount > 0) {
        score -= 0.5;
        reasons.push("PENALTY: Cont\xE9m imagem (provavelmente card)");
      }
      if (features.width > 600) {
        score -= 0.3;
        reasons.push("PENALTY: Muito largo para form");
      }
      if (features.textCount > 6) {
        score -= 0.4;
        reasons.push("PENALTY: Muitos textos (bloco de conte\xFAdo)");
      }
      if (score < FORM_MIN_CONFIDENCE) {
        return null;
      }
      return {
        widget: "e:form",
        score: score > 1 ? 1 : score,
        ruleId: "h_form_strict",
        reasons
      };
    }
  };
  var COUNTDOWN_MIN_CONFIDENCE = 0.85;
  var CountdownRule = {
    id: "h_countdown_pattern",
    targetWidget: "w:countdown",
    evaluate: function(features) {
      var score = 0;
      var reasons = [];
      if (features.layoutMode !== "HORIZONTAL") {
        return null;
      }
      if (features.childCount < 2 || features.childCount > 8) {
        return null;
      }
      if (features.textCount >= 4) {
        score += 0.5;
        reasons.push("M\xFAltiplos textos: " + features.textCount);
      } else if (features.textCount >= 2) {
        score += 0.25;
        reasons.push("Alguns textos: " + features.textCount);
      } else {
        return null;
      }
      if (features.height <= 200 && features.height >= 40) {
        score += 0.2;
        reasons.push("Altura compacta t\xEDpica de countdown");
      }
      if (features.aspectRatio > 2) {
        score += 0.15;
        reasons.push("Propor\xE7\xE3o horizontal");
      }
      if (features.hasNestedFrames && features.childCount >= 2) {
        score += 0.1;
        reasons.push("Cont\xE9m frames de unidade");
      }
      if (features.hasImage) {
        score -= 0.4;
        reasons.push("PENALTY: Cont\xE9m imagem");
      }
      if (score < COUNTDOWN_MIN_CONFIDENCE) {
        return null;
      }
      return {
        widget: "w:countdown",
        score: score > 1 ? 1 : score,
        ruleId: "h_countdown_pattern",
        reasons
      };
    }
  };
  var ContainerRule = {
    id: "h_container_fallback",
    targetWidget: "w:container",
    evaluate: function(features) {
      var score = CONTAINER_DEFAULT_CONFIDENCE;
      var reasons = ["Fallback seguro para estrutura gen\xE9rica"];
      if (features.layoutMode !== "NONE") {
        score += 0.1;
        reasons.push("Possui Auto Layout");
      }
      if (features.childCount > 0) {
        score += 0.1;
        reasons.push("Possui filhos");
      }
      return {
        widget: "w:container",
        score: score > 0.5 ? 0.5 : score,
        // Cap at 0.5 to never beat specific widgets
        ruleId: "h_container_fallback",
        reasons
      };
    }
  };
  var heuristicRules = [
    CountdownRule,
    // Pattern detection first
    IconRule,
    // Check icons first (vectors)
    DividerRule,
    // Check dividers early (rectangles)
    ButtonRule,
    HeadingRule,
    TextEditorRule,
    ImageRule,
    ImageBoxRule,
    SectionRule,
    // Strict section detection
    FormRule,
    // Strict form detection
    ContainerRule
    // Fallback sempre por último
  ];
  function evaluateHeuristics(features) {
    var results = [];
    for (var i = 0; i < heuristicRules.length; i++) {
      var rule = heuristicRules[i];
      var candidate = rule.evaluate(features);
      if (candidate && candidate.score > 0) {
        results.push(candidate);
      }
    }
    results.sort(function(a, b) {
      return b.score - a.score;
    });
    return results;
  }

  // src/deprecated/v1/engine.ts
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

  // src/deprecated/v1/rules/utils.ts
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

  // src/deprecated/v1/rules/layout.ts
  var LAYOUT_COLUMNS = {
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
  var LAYOUT_GRID = {
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
  var LAYOUT_HEURISTICS = [
    LAYOUT_COLUMNS,
    LAYOUT_GRID
  ];

  // src/deprecated/v1/rules/sections.ts
  var SECTION_GENERIC = {
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
  var SECTION_HERO = {
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
  var SECTION_CTA = {
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
  var SECTION_HEURISTICS = [
    SECTION_HERO,
    SECTION_CTA,
    SECTION_GENERIC
  ];

  // src/deprecated/v1/rules/navigation.ts
  var HEADER_NAVBAR = {
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
  var FOOTER_MAIN = {
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
  var NAVIGATION_HEURISTICS = [
    HEADER_NAVBAR,
    FOOTER_MAIN
  ];

  // src/deprecated/v1/rules/typography.ts
  var HEADING_GENERIC = {
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
        widget: "w:heading",
        confidence: 0.85
      };
    }
  };
  var PARAGRAPH_GENERIC = {
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
        widget: "w:text",
        confidence: 0.8
      };
    }
  };
  var TYPOGRAPHY_HEURISTICS = [
    HEADING_GENERIC,
    PARAGRAPH_GENERIC
  ];

  // src/deprecated/v1/rules/media.ts
  var IMAGE_SINGLE = {
    id: "media.image-single",
    priority: 65,
    match(node) {
      const isGeometricShape = node.type === "RECTANGLE" || node.type === "ELLIPSE";
      const children = node.children || [];
      if ((isGeometricShape || isFrameLike(node)) && node.hasImageFill) {
        if (isFrameLike(node) && (node.hasText || children.length > 0)) {
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
      if (isFrameLike(node) && node.hasChildImage && !node.hasText && children.length === 1) {
        const imageChild = children[0];
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
  var MEDIA_HEURISTICS = [
    IMAGE_SINGLE
  ];

  // src/deprecated/v1/widgets/elementor-basic.ts
  var ELEM_HEADING = {
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
  var ELEM_TEXT_EDITOR = {
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
  var ELEM_IMAGE = {
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
  var ELEM_BUTTON = {
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
  var ELEM_ICON = {
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
  var ELEM_ICON_BOX = {
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
  var ELEM_IMAGE_BOX = {
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
  var ELEM_DIVIDER = {
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
  var ELEM_SPACER = {
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
  var ELEMENTOR_BASIC_WIDGET_HEURISTICS = [
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

  // src/deprecated/v1/widgets/elementor-pro.ts
  var ELEM_PRO_FORM = {
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
  var ELEM_PRO_POSTS = {
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
  var ELEM_PRO_SLIDES = {
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
  var ELEMENTOR_PRO_WIDGET_HEURISTICS = [
    ELEM_PRO_FORM,
    ELEM_PRO_POSTS,
    ELEM_PRO_SLIDES
  ];

  // src/deprecated/v1/widgets/wordpress-core.ts
  var WP_SEARCH = {
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
  var WP_RECENT_POSTS_LIST = {
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
  var WP_CATEGORIES_LIST = {
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
  var WORDPRESS_CORE_WIDGET_HEURISTICS = [
    WP_SEARCH,
    WP_RECENT_POSTS_LIST,
    WP_CATEGORIES_LIST
  ];

  // src/deprecated/v1/widgets/woocommerce.ts
  var WOO_PRODUCT_GRID = {
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
  var WOO_SINGLE_PRODUCT_SUMMARY = {
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
  var WOO_CART_LIKE = {
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
  var WOO_WIDGET_HEURISTICS = [
    WOO_PRODUCT_GRID,
    WOO_SINGLE_PRODUCT_SUMMARY,
    WOO_CART_LIKE
  ];

  // src/deprecated/v1/index.ts
  var DEFAULT_HEURISTICS = [
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

  // src/services/heuristics/noai.parser.ts
  var vectorTypes = ["VECTOR", "STAR", "ELLIPSE", "POLYGON", "BOOLEAN_OPERATION", "LINE", "RECTANGLE"];
  function isImageFill(node) {
    if (!node) return false;
    if (node.type === "IMAGE" || node.type === "VECTOR") {
      console.log("[IS IMAGE FILL] \u2705 Detected", node.type, "node:", node.name, "ID:", node.id);
      return true;
    }
    const fills = node == null ? void 0 : node.fills;
    if (!Array.isArray(fills)) return false;
    const hasImageFill = fills.some((f) => (f == null ? void 0 : f.type) === "IMAGE");
    if (hasImageFill) {
      console.log("[IS IMAGE FILL] \u2705 Detected IMAGE fill in:", node.name, "ID:", node.id);
    }
    return hasImageFill;
  }
  function findFirstImageId(node) {
    if (!node) return null;
    console.log("[FIND IMAGE] Checking node:", node.name, "Type:", node.type, "ID:", node.id);
    if (isImageFill(node)) {
      console.log("[FIND IMAGE] \u2705 Found image via isImageFill:", node.id);
      return node.id || null;
    }
    const children = node.children;
    if (Array.isArray(children)) {
      console.log("[FIND IMAGE] Searching", children.length, "children...");
      for (const child of children) {
        const found = findFirstImageId(child);
        if (found) return found;
      }
    }
    console.log("[FIND IMAGE] No image found in node:", node.name);
    return null;
  }
  function toNodeSnapshot(node) {
    const children = node.children || [];
    const hasText = node.type === "TEXT" || children.some((c) => c.type === "TEXT");
    const hasImage = isImageFill(node) || children.some((c) => isImageFill(c));
    return {
      id: node.id,
      name: node.name || "",
      type: node.type,
      width: node.width || 0,
      height: node.height || 0,
      x: node.x || 0,
      y: node.y || 0,
      isVisible: node.visible !== false,
      // Auto layout
      isAutoLayout: !!node.layoutMode,
      direction: node.layoutMode === "HORIZONTAL" ? "HORIZONTAL" : node.layoutMode === "VERTICAL" ? "VERTICAL" : "NONE",
      spacing: node.itemSpacing || 0,
      paddingTop: node.paddingTop || 0,
      paddingRight: node.paddingRight || 0,
      paddingBottom: node.paddingBottom || 0,
      paddingLeft: node.paddingLeft || 0,
      // Visual style
      hasBackground: !!node.fills && node.fills.length > 0,
      backgroundOpacity: 1,
      hasBorder: !!node.strokes && node.strokes.length > 0,
      borderRadius: node.cornerRadius || 0,
      hasShadow: !!node.effects && node.effects.length > 0,
      // Text
      hasText,
      textFontSizeMax: node.fontSize || void 0,
      textFontSizeMin: node.fontSize || void 0,
      textIsBoldDominant: node.fontWeight >= 600,
      textLineCount: 1,
      // Images
      hasImageFill: isImageFill(node),
      hasChildImage: hasImage,
      // Children
      childCount: children.length,
      childrenTypes: children.map((c) => c.type),
      childrenWidths: children.map((c) => c.width || 0),
      childrenHeights: children.map((c) => c.height || 0),
      childrenAlignment: "LEFT",
      // Context
      parentId: node.parentId || void 0,
      siblingCount: 0
    };
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
  function toNodeFeaturesFromSerialized(node) {
    var _a, _b;
    const children = Array.isArray(node.children) ? node.children : [];
    const hasText = node.type === "TEXT" || children.some((c) => c.type === "TEXT");
    const hasImageFillCheck = isImageFill(node) || children.some((c) => isImageFill(c));
    let textCount = 0;
    let imageCount = 0;
    let textLength = 0;
    let maxFontSize = 0;
    let maxFontWeight = 400;
    if (node.type === "TEXT") {
      textCount = 1;
      textLength = ((_a = node.characters) == null ? void 0 : _a.length) || 0;
      maxFontSize = typeof node.fontSize === "number" ? node.fontSize : 0;
      const fontName = node.fontName;
      if (fontName && fontName.style) {
        const style = fontName.style.toLowerCase();
        if (style.indexOf("bold") >= 0) maxFontWeight = 700;
        else if (style.indexOf("semibold") >= 0) maxFontWeight = 600;
        else if (style.indexOf("medium") >= 0) maxFontWeight = 500;
      }
    }
    for (const child of children) {
      if (child.type === "TEXT") {
        textCount++;
        textLength += ((_b = child.characters) == null ? void 0 : _b.length) || 0;
        const childFontSize = typeof child.fontSize === "number" ? child.fontSize : 0;
        if (childFontSize > maxFontSize) maxFontSize = childFontSize;
      }
      if (isImageFill(child)) {
        imageCount++;
      }
    }
    let hasNestedFrames = false;
    for (const child of children) {
      if (child.type === "FRAME" || child.type === "GROUP" || child.type === "COMPONENT" || child.type === "INSTANCE") {
        hasNestedFrames = true;
        break;
      }
    }
    const vectorNodeTypes = ["VECTOR", "STAR", "ELLIPSE", "POLYGON", "BOOLEAN_OPERATION", "LINE"];
    const isVectorNode = vectorNodeTypes.indexOf(node.type) >= 0;
    const layoutMode = node.layoutMode || "NONE";
    const y = node.y || 0;
    let zone = "BODY";
    if (y < 200) zone = "HEADER";
    else if (y < 800) zone = "HERO";
    const width = node.width || 0;
    const height = node.height || 0;
    return {
      id: node.id,
      name: node.name || "",
      type: node.type,
      width,
      height,
      x: node.x || 0,
      y,
      area: width * height,
      childCount: children.length,
      layoutMode: layoutMode === "HORIZONTAL" ? "HORIZONTAL" : layoutMode === "VERTICAL" ? "VERTICAL" : "NONE",
      primaryAxisSizingMode: node.primaryAxisSizingMode === "AUTO" ? "AUTO" : "FIXED",
      counterAxisSizingMode: node.counterAxisSizingMode === "AUTO" ? "AUTO" : "FIXED",
      hasNestedFrames,
      hasFill: Array.isArray(node.fills) && node.fills.length > 0,
      hasStroke: Array.isArray(node.strokes) && node.strokes.length > 0,
      hasText,
      textCount,
      hasImage: hasImageFillCheck,
      imageCount,
      textLength,
      fontSize: maxFontSize,
      fontWeight: maxFontWeight,
      isVectorNode,
      vectorWidth: isVectorNode ? width : 0,
      vectorHeight: isVectorNode ? height : 0,
      parentLayoutMode: "NONE",
      // Not available from SerializedNode
      siblingCount: 0,
      // Not available from SerializedNode
      aspectRatio: height > 0 ? width / height : 0,
      zone
    };
  }
  function unwrapBoxedInner(node) {
    const rawChildren = Array.isArray(node.children) ? node.children : [];
    if (rawChildren.length === 0) {
      return { isBoxed: false, inner: null, flattenedChildren: rawChildren };
    }
    const candidate = rawChildren.find((child) => {
      const childName = (child.name || "").toLowerCase();
      return childName === "w:inner-container" || childName === "c:inner-container";
    });
    if (!candidate) {
      return { isBoxed: false, inner: null, flattenedChildren: rawChildren };
    }
    console.log("[UNWRAP BOXED] \u2705 Found w:inner-container:", candidate.name, "Width:", candidate.width);
    const innerChildren = Array.isArray(candidate.children) ? candidate.children : [];
    const idx = rawChildren.indexOf(candidate);
    const before = idx >= 0 ? rawChildren.slice(0, idx) : [];
    const after = idx >= 0 ? rawChildren.slice(idx + 1) : [];
    console.log(`[UNWRAP BOXED] \u2705 Flattening children. Before: ${before.length}, Inner: ${innerChildren.length}, After: ${after.length}`);
    return { isBoxed: true, inner: candidate, flattenedChildren: [...before, ...innerChildren, ...after] };
  }
  function calculateWidgetScore(node) {
    const scores = [];
    const name = (node.name || "").toLowerCase();
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const children = hasChildren ? node.children : [];
    const widgetPrefixes = ["w:", "woo:", "e:", "wp:", "loop:", "c:"];
    for (const prefix of widgetPrefixes) {
      if (name.startsWith(prefix)) {
        const explicitType = name.substring(prefix.length).trim();
        if (explicitType) {
          console.log(`[WIDGET SCORE] \u{1F3AF} Explicit widget detected: "${node.name}" \u2192 type: "${explicitType}"`);
          return [{ type: explicitType, score: 1e3, matchedFeatures: ["explicit-name"] }];
        }
      }
    }
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
    console.log("[DETECT WIDGET] Processing node:", node.name, "Type:", node.type, "Name (lowercase):", name);
    if (/^(w:|woo:|loop:)/.test(name)) {
      const widgetType = name.replace(/^(w:|woo:|loop:)/, "");
      console.log("[DETECT WIDGET] \u2705 Explicit widget name detected:", node.name, "\u2192", widgetType);
      if (widgetType === "container" || widgetType === "section") {
        console.log("[DETECT WIDGET] Ignoring container:", node.name);
        return null;
      }
      const registryDef2 = findWidgetDefinition(name, node.type);
      if (registryDef2) {
        console.log("[DETECT WIDGET] Found in registry, delegating to registry handler");
      } else {
        console.log("[DETECT WIDGET] Not in registry, creating basic widget");
        const styles2 = {
          sourceId: node.id,
          sourceName: node.name
        };
        let content = node.name || "";
        let imageId = null;
        if (widgetType === "heading" || widgetType === "text-editor" || widgetType === "text") {
          if (node.type === "TEXT") {
            content = node.characters || node.name;
            const extractedStyles = extractWidgetStyles(node);
            Object.assign(styles2, extractedStyles);
          }
        } else if (widgetType === "image" || widgetType === "icon") {
          imageId = node.id;
          content = "";
        } else if (widgetType === "image-box" || widgetType === "icon-box") {
          const boxContent = extractBoxContent(node);
          content = boxContent.title || node.name;
          imageId = boxContent.imageId || findFirstImageId(node) || null;
          Object.assign(styles2, { title_text: boxContent.title, description_text: boxContent.description });
        }
        return {
          type: widgetType,
          content,
          imageId,
          styles: styles2
        };
      }
    }
    if (name.startsWith("c:container") || name.startsWith("w:container")) {
      console.log("[DETECT WIDGET] Ignoring container:", node.name);
      return null;
    }
    const styles = {
      sourceId: node.id,
      sourceName: node.name
    };
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const children = hasChildren ? node.children : [];
    const firstImageDeep = findFirstImageId(node);
    const hasExplicitName = /^(w:|woo:|loop:|media:|e:)/.test(name);
    if (!hasExplicitName) {
      try {
        const v2Features = toNodeFeaturesFromSerialized(node);
        const v2Candidates = evaluateHeuristics(v2Features);
        let v1Widget = "container";
        if (DEBUG_SHADOW_V1) {
          const snapshot = toNodeSnapshot(node);
          const v1Results = evaluateNode(snapshot, DEFAULT_HEURISTICS, { minConfidence: 0.75 });
          v1Widget = v1Results.length > 0 ? v1Results[0].widget : "container";
        }
        if (v2Candidates.length > 0) {
          const best = v2Candidates[0];
          const v2Widget = best.widget.replace(/^w:/, "");
          const v2Score = best.score;
          if (DEBUG_SHADOW_V1 && v1Widget !== best.widget) {
            console.log(`[SHADOW-V1] Node ${node.id} | V1: ${v1Widget} | V2: ${best.widget} (${v2Score.toFixed(2)})`);
          }
          if (DEBUG_V2_EXPLAIN) {
            console.log(`[V2-EXPLAIN] Node ${node.id} | ${best.widget} (${v2Score.toFixed(2)}) | Features: type=${v2Features.type}, fontSize=${v2Features.fontSize}, childCount=${v2Features.childCount}`);
          }
          if (v2Score >= V2_MIN_CONFIDENCE) {
            const widgetType = v2Widget;
            const analysis = analyzeWidgetStructure(node, widgetType);
            if ((widgetType === "section" || widgetType === "container") && analysis.childWidgets.length > 0) {
              console.log("[V2-ENGINE] Container with", analysis.childWidgets.length, "child widgets - delegating to toContainer");
              return null;
            }
            const mergedStyles = __spreadValues(__spreadValues(__spreadValues({}, styles), analysis.containerStyles), analysis.textStyles);
            if (typeof node.width === "number") mergedStyles.width = node.width;
            if (typeof node.height === "number") mergedStyles.height = node.height;
            if (widgetType === "button" && !mergedStyles.background && (!node.fills || node.fills.length === 0)) {
              mergedStyles.fills = [{
                type: "SOLID",
                color: { r: 1, g: 1, b: 1 },
                opacity: 0,
                visible: true
              }];
            }
            let content = analysis.text;
            if (!content) {
              const isTechnicalName = node.name.includes(":") || node.name.startsWith("w-") || node.name.startsWith("Frame ") || node.name.startsWith("Group ");
              if (!isTechnicalName) {
                content = node.name;
              } else {
                content = widgetType === "heading" ? "Heading" : widgetType === "button" ? "Button" : widgetType === "text" ? "Text Block" : "";
              }
            }
            return {
              type: widgetType,
              content,
              imageId: analysis.iconId,
              styles: mergedStyles,
              children: analysis.childWidgets
            };
          } else {
            console.log(`[V2-ENGINE] Score ${v2Score.toFixed(2)} < ${V2_MIN_CONFIDENCE} for ${best.widget} - falling through to fallback`);
          }
        }
      } catch (error) {
        console.log("[V2-ENGINE] Error evaluating node:", error);
      }
    }
    const registryDef = findWidgetDefinition(name, node.type);
    if (registryDef) {
      const widgetType = registryDef.widgetType;
      console.log(`[DETECT WIDGET] Found explicit widget via registry: ${node.name} -> ${widgetType}`);
      if (widgetType === "image-box") {
        const boxContent = extractBoxContent(node);
        return {
          type: "image-box",
          content: boxContent.title || node.name,
          imageId: boxContent.imageId || findFirstImageId(node) || null,
          styles: __spreadProps(__spreadValues({}, styles), {
            title_text: boxContent.title,
            description_text: boxContent.description,
            titleStyles: boxContent.titleStyles,
            descriptionStyles: boxContent.descriptionStyles,
            customCss: boxContent.customCss
          })
        };
      }
      if (widgetType === "icon-box") {
        const boxContent = extractBoxContent(node);
        return {
          type: "icon-box",
          content: boxContent.title || node.name,
          imageId: boxContent.imageId || findFirstImageId(node) || null,
          styles: __spreadProps(__spreadValues({}, styles), {
            title_text: boxContent.title,
            description_text: boxContent.description,
            titleStyles: boxContent.titleStyles,
            descriptionStyles: boxContent.descriptionStyles,
            customCss: boxContent.customCss
          })
        };
      }
      if (widgetType === "icon-list") {
        let listItems = [];
        const iconChildren = children.filter((c) => isImageFill(c) || c.type === "IMAGE" || c.type === "VECTOR");
        const textChildren = children.filter((c) => c.type === "TEXT");
        if (children.length === 2 && iconChildren.length === 1 && textChildren.length === 1) {
          console.log("[NOAI ICON-LIST] Detected Single Item Split pattern (1 Icon + 1 Text)");
          const textNode = textChildren[0];
          const iconNode = iconChildren[0];
          const text = textNode.characters || textNode.name;
          listItems.push({
            type: "list-item",
            content: text,
            imageId: iconNode.id,
            styles: { sourceName: text }
          });
        } else {
          listItems = children.map((child) => {
            var _a2;
            if (child.type === "TEXT") {
              return {
                type: "list-item",
                content: child.characters || child.name,
                imageId: null,
                styles: { sourceName: child.name }
              };
            }
            if (isImageFill(child) || child.type === "IMAGE" || child.type === "VECTOR") {
              return {
                type: "list-item",
                content: child.name,
                imageId: child.id,
                styles: { sourceName: child.name }
              };
            }
            const itemContent = extractBoxContent(child);
            let text = itemContent.title;
            if (!text) {
              const textNode = (_a2 = child.children) == null ? void 0 : _a2.find((c) => c.type === "TEXT");
              if (textNode) text = textNode.characters || textNode.name;
              else text = child.name;
            }
            return {
              type: "list-item",
              content: text,
              imageId: itemContent.imageId || findFirstImageId(child),
              styles: { sourceName: text }
            };
          });
        }
        console.log("[NOAI ICON-LIST] Extracted", listItems.length, "items");
        return {
          type: "icon-list",
          content: null,
          imageId: null,
          styles,
          children: listItems
        };
      }
      if (widgetType === "media-carousel" || widgetType === "image-carousel") {
        const imageChildren = children.filter(
          (c) => isImageFill(c) || c.type === "IMAGE" || c.type === "FRAME" && findFirstImageId(c)
        );
        const childWidgets = imageChildren.map((child, i) => {
          const imageId = child.type === "IMAGE" ? child.id : findFirstImageId(child);
          return {
            type: "image",
            content: null,
            imageId: imageId || child.id,
            styles: {}
          };
        });
        console.log(`[NOAI ${widgetType.toUpperCase()}] Extracted ${childWidgets.length} image children`);
        return {
          type: widgetType,
          content: null,
          imageId: null,
          styles,
          children: childWidgets
        };
      }
      if (widgetType === "accordion" || widgetType === "toggle") {
        const toggleItems = children.filter((c) => {
          var _a2;
          const n = c.name.toLowerCase();
          return n.includes("accordion:") || n.includes("toggle") || n.includes("item") || n.includes("faq") || c.type === "FRAME" && ((_a2 = c.children) == null ? void 0 : _a2.length) > 0;
        });
        let accordionIconId = null;
        const items = toggleItems.map((child, i) => {
          let title = "";
          let content = "";
          let iconId = null;
          const LOREM_IPSUM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.";
          if (child.children) {
            const childNodes = child.children;
            const titleNode = childNodes.find(
              (c) => c.name.toLowerCase().includes("accordion:title") || c.name.toLowerCase().includes("toggle:title") || c.name.toLowerCase().includes(":title") || c.name.toLowerCase() === "title"
            );
            const contentNode = childNodes.find(
              (c) => c.name.toLowerCase().includes("accordion:content") || c.name.toLowerCase().includes("toggle:content") || c.name.toLowerCase().includes(":content") || c.name.toLowerCase() === "content"
            );
            if (titleNode && titleNode.type === "TEXT") {
              title = titleNode.characters || "";
            }
            if (contentNode) {
              if (contentNode.type === "TEXT") {
                content = contentNode.characters || "";
              } else if (contentNode.children) {
                const textChild = contentNode.children.find((c) => c.type === "TEXT");
                if (textChild) {
                  content = textChild.characters || "";
                }
              }
            }
            if (!title || !content) {
              const textNodes = childNodes.filter((c) => c.type === "TEXT");
              if (!title && textNodes.length >= 1) {
                title = textNodes[0].characters || "";
              }
              if (!content && textNodes.length >= 2) {
                content = textNodes[1].characters || "";
              }
            }
            const iconNode = childNodes.find(
              (c) => c.name.toLowerCase().includes("accordion:icon") || c.name.toLowerCase().includes(":icon") || c.name.toLowerCase().includes("icon") || c.type === "VECTOR" || c.type === "IMAGE"
            );
            if (iconNode) {
              iconId = iconNode.type === "FRAME" ? findFirstImageId(iconNode) : iconNode.id;
              if (!accordionIconId && iconId) {
                accordionIconId = iconId;
              }
            }
            if (!title && child.name) {
              const cleanName = child.name.replace(/^(accordion:|toggle:|w:toggle|w:item|item|faq)[-:]?\s*/i, "").trim();
              if (cleanName && !cleanName.match(/^\d+$/)) {
                title = cleanName;
              }
            }
          }
          return {
            type: "toggle-item",
            content: title,
            imageId: iconId,
            styles: {
              title: title || `Item ${i + 1}`,
              content: content || LOREM_IPSUM
            }
          };
        });
        console.log(`[NOAI ${widgetType.toUpperCase()}] Extracted ${items.length} items, iconId: ${accordionIconId}`);
        return {
          type: widgetType,
          content: null,
          imageId: accordionIconId,
          styles,
          children: items
        };
      }
      if (widgetType === "button") {
        const buttonData = analyzeButtonStructure(node);
        const containerStyles = extractContainerStyles(node);
        const mergedStyles = __spreadValues(__spreadValues(__spreadValues({}, styles), containerStyles), buttonData.textStyles);
        if (!mergedStyles.background && (!node.fills || node.fills.length === 0)) {
          mergedStyles.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0, visible: true }];
        }
        return { type: "button", content: buttonData.text || node.name, imageId: buttonData.iconId, styles: mergedStyles };
      }
      if (widgetType === "slides") {
        const slides = children.map((child, i) => {
          let heading = "";
          let description = "";
          let button_text = "";
          let imageId = findFirstImageId(child);
          if (child.children) {
            const slideChildren = child.children;
            const headingNode = slideChildren.find((c) => c.name.toLowerCase().includes("heading") || c.name.toLowerCase().includes("title"));
            if (headingNode && headingNode.type === "TEXT") heading = headingNode.characters;
            const descNode = slideChildren.find((c) => c.name.toLowerCase().includes("description") || c.name.toLowerCase().includes("text") || c.name.toLowerCase().includes("content"));
            if (descNode && descNode.type === "TEXT") description = descNode.characters;
            const btnNode = slideChildren.find((c) => c.name.toLowerCase().includes("button") || c.name.toLowerCase().includes("btn"));
            if (btnNode) {
              if (btnNode.type === "TEXT") button_text = btnNode.characters;
              else if (btnNode.children) {
                const btnText = btnNode.children.find((c) => c.type === "TEXT");
                if (btnText) button_text = btnText.characters;
              }
            }
            const textNodes = slideChildren.filter((c) => c.type === "TEXT");
            if (!heading && textNodes.length > 0) heading = textNodes[0].characters;
            if (!description && textNodes.length > 1) description = textNodes[1].characters;
          }
          return {
            _id: `slide_${i + 1}`,
            heading,
            description,
            button_text,
            background_color: "",
            background_image: { url: "", id: imageId ? parseInt(imageId) : "" }
          };
        });
        return { type: "slides", content: null, imageId: null, styles: __spreadProps(__spreadValues({}, styles), { slides }) };
      }
      if (widgetType === "image-carousel") {
        const slides = children.filter((c) => isImageFill(c) || vectorTypes.includes(c.type) || c.type === "IMAGE").map((img, i) => ({ id: img.id, url: "", _id: `slide_${i + 1} ` }));
        return { type: "image-carousel", content: null, imageId: null, styles: __spreadProps(__spreadValues({}, styles), { slides }) };
      }
      if (widgetType === "basic-gallery") {
        return { type: "basic-gallery", content: null, imageId: null, styles };
      }
      if (widgetType === "video") {
        return { type: "video", content: "", imageId: null, styles };
      }
      if (widgetType === "image") {
        const imageStyles = __spreadValues({}, styles);
        if (typeof node.width === "number") imageStyles.width = node.width;
        if (typeof node.height === "number") imageStyles.height = node.height;
        console.log("[NOAI IMAGE] Creating image widget with dimensions:", { width: node.width, height: node.height });
        return { type: "image", content: null, imageId: node.id, styles: imageStyles };
      }
      if (widgetType === "icon") {
        const iconStyles = __spreadValues({}, styles);
        if (typeof node.width === "number") iconStyles.width = node.width;
        if (typeof node.height === "number") iconStyles.height = node.height;
        return { type: "icon", content: null, imageId: node.id, styles: iconStyles };
      }
      if (widgetType === "text-editor") {
        const extractedStyles = extractWidgetStyles(node);
        Object.assign(styles, extractedStyles);
        let textContent = node.characters || node.name;
        if (node.styledTextSegments && node.styledTextSegments.length > 1) {
          const rich = buildHtmlFromSegments(node);
          textContent = rich.html;
        }
        return { type: "text-editor", content: textContent, imageId: null, styles };
      }
      if (widgetType === "heading") {
        const extractedStyles = extractWidgetStyles(node);
        Object.assign(styles, extractedStyles);
        let headingContent = node.characters || node.name;
        if (node.styledTextSegments && node.styledTextSegments.length > 1) {
          const rich = buildHtmlFromSegments(node);
          headingContent = rich.html;
        }
        return { type: "heading", content: headingContent, imageId: null, styles };
      }
      if (widgetType === "countdown" || widgetType === "icon-list") {
        const children2 = node.children || [];
        const childWidgets = [];
        children2.forEach((child) => {
          if (child.type === "TEXT") {
            const textContent = child.characters || child.name || "";
            const textStyles = extractWidgetStyles(child);
            childWidgets.push({
              type: "text",
              content: textContent,
              imageId: null,
              styles: textStyles
            });
          } else if (isImageFill(child) || child.type === "VECTOR" || child.type === "IMAGE") {
            childWidgets.push({
              type: "icon",
              content: null,
              imageId: child.id,
              styles: {}
            });
          }
        });
        console.log(`[NOAI ${widgetType.toUpperCase()}] Processed ${childWidgets.length} children`);
        return { type: widgetType, content: node.name, imageId: null, styles, children: childWidgets };
      }
      return { type: widgetType, content: node.name, imageId: null, styles };
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
          case "star-rating":
            return { type: "star-rating", content: "5", imageId: null, styles };
          case "social-icons":
            return { type: "social-icons", content: "", imageId: null, styles };
          case "testimonial":
            return { type: "testimonial", content: "", imageId: null, styles };
          case "basic-gallery":
            return { type: "basic-gallery", content: null, imageId: null, styles };
          case "image-carousel": {
            const slides = children.filter((c) => isImageFill(c) || vectorTypes.includes(c.type) || c.type === "IMAGE").map((img, i) => ({ id: img.id, url: "", _id: `slide_${i + 1} ` }));
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
      const boxContent = extractBoxContent(node);
      const containerStyles = extractContainerStyles(node);
      const mergedStyles = __spreadValues(__spreadValues({}, styles), containerStyles);
      if (!mergedStyles.background && (!node.fills || node.fills.length === 0)) {
        mergedStyles.fills = [{
          type: "SOLID",
          color: { r: 1, g: 1, b: 1 },
          opacity: 0,
          visible: true
        }];
      }
      return {
        type: "button",
        content: boxContent.title || node.name,
        imageId: boxContent.imageId || null,
        styles: mergedStyles
      };
    }
    return null;
  }
  function toContainer(node) {
    console.log("[TO CONTAINER] \u{1F680} Processing node:", node.name, "Type:", node.type);
    const nodeName = (node.name || "").toLowerCase();
    if (/^(w:|woo:|loop:)/.test(nodeName)) {
      const widgetType = nodeName.replace(/^(w:|woo:|loop:)/, "");
      if (widgetType !== "container" && widgetType !== "inner-container" && widgetType !== "section") {
        console.log("[TO CONTAINER] \u2705 Detected explicit widget:", node.name, "\u2192 Processing as single widget");
        const widget = detectWidget(node);
        console.log("[TO CONTAINER] detectWidget returned:", widget ? `type=${widget.type}, content=${widget.content}` : "NULL");
        if (widget) {
          const styles2 = extractContainerStyles(node);
          console.log("[TO CONTAINER] Creating container with single widget:", widget.type);
          return {
            id: node.id,
            direction: node.layoutMode === "HORIZONTAL" ? "row" : "column",
            width: "full",
            styles: styles2,
            widgets: [widget],
            children: []
          };
        } else {
          console.log("[TO CONTAINER] \u26A0\uFE0F detectWidget returned null, falling through to normal container processing");
        }
      }
    }
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
    console.log("[TO CONTAINER] \u{1F4CB} After unwrapBoxedInner, processing", childNodes.length, "children:", childNodes.map((c) => c.name));
    childNodes.forEach((child) => {
      console.log("[TO CONTAINER] \u{1F50D} Processing child:", child.name, "Type:", child.type);
    });
    const processedChildNodes = childNodes;
    if (!Array.isArray(processedChildNodes)) {
      console.error("[TO CONTAINER] \u274C processedChildNodes is not an array");
      return {
        id: node.id,
        direction: direction === "row" ? "row" : "column",
        width: containerWidth,
        styles,
        widgets: [],
        children: []
      };
    }
    const hasInnerAutoLayout = boxed.isBoxed && boxed.inner && (boxed.inner.layoutMode === "HORIZONTAL" || boxed.inner.layoutMode === "VERTICAL");
    if (node.layoutMode !== "HORIZONTAL" && node.layoutMode !== "VERTICAL" && !hasInnerAutoLayout) {
      processedChildNodes.sort((a, b) => {
        const yDiff = (a.y || 0) - (b.y || 0);
        if (Math.abs(yDiff) > 5) return yDiff;
        return (a.x || 0) - (b.x || 0);
      });
    }
    processedChildNodes.forEach((child, idx) => {
      const w = detectWidget(child);
      const childHasChildren = Array.isArray(child.children) && child.children.length > 0;
      const orderMark = idx;
      if (w) {
        w.styles = __spreadProps(__spreadValues({}, w.styles || {}), { _order: orderMark });
        widgets.push(w);
        console.log("[TO CONTAINER] \u2705 Added as widget:", child.name, "Type:", w.type);
      } else if (childHasChildren) {
        const childContainer = toContainer(child);
        childContainer.styles = __spreadProps(__spreadValues({}, childContainer.styles || {}), { _order: orderMark });
        childrenContainers.push(childContainer);
        console.log("[TO CONTAINER] \u2705 Added as container:", child.name);
      } else {
        widgets.push({
          type: "custom",
          content: child.name || "",
          imageId: null,
          styles: { sourceId: child.id, sourceName: child.name, _order: orderMark }
        });
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
  function analyzeButtonStructure(node) {
    const children = node.children || [];
    let text = "";
    let iconId = null;
    let textStyles = {};
    console.log("[BUTTON STRUCTURE] Analyzing button:", node.name);
    console.log("[BUTTON STRUCTURE] Children count:", children.length);
    console.log("[BUTTON STRUCTURE] Children:", children.map((c) => ({ name: c.name, type: c.type, id: c.id })));
    const textChild = children.find(
      (c) => {
        var _a, _b;
        return c.type === "TEXT" || ((_a = c.name) == null ? void 0 : _a.toLowerCase().includes("heading")) || ((_b = c.name) == null ? void 0 : _b.toLowerCase().includes("text"));
      }
    );
    if (textChild) {
      text = textChild.characters || textChild.name || "";
      textStyles = extractWidgetStyles(textChild);
      console.log("[BUTTON STRUCTURE] Found text child:", textChild.name, "Text:", text);
      console.log("[BUTTON STRUCTURE] Text styles:", JSON.stringify(textStyles, null, 2));
    } else {
      console.log("[BUTTON STRUCTURE] No text child found");
    }
    console.log("[BUTTON STRUCTURE] Searching for icon with findFirstImageId...");
    iconId = findFirstImageId(node);
    if (iconId) {
      console.log("[BUTTON STRUCTURE] \u2705 Found icon ID:", iconId);
    } else {
      console.log("[BUTTON STRUCTURE] \u274C No icon found");
      console.log("[BUTTON STRUCTURE] Node details:", JSON.stringify({
        id: node.id,
        name: node.name,
        type: node.type,
        hasChildren: children.length > 0
      }, null, 2));
    }
    return { text, iconId, textStyles };
  }
  function analyzeWidgetStructure(node, widgetType) {
    const children = node.children || [];
    let text = "";
    let iconId = null;
    let textStyles = {};
    let containerStyles = {};
    const childWidgets = [];
    console.log("[WIDGET STRUCTURE] Analyzing", widgetType, ":", node.name);
    console.log("[WIDGET STRUCTURE] Children count:", children.length);
    if (node.type === "TEXT") {
      text = node.characters || node.name || "";
      textStyles = extractWidgetStyles(node);
      console.log("[WIDGET STRUCTURE] Node is TEXT. Content:", text);
    } else if (isImageFill(node) || node.type === "IMAGE" || node.type === "VECTOR") {
      iconId = node.id;
      console.log("[WIDGET STRUCTURE] Node is IMAGE/VECTOR. ID:", iconId);
    }
    children.forEach((child) => {
      const detectedWidget = detectWidget(child);
      if (detectedWidget) {
        console.log("[WIDGET STRUCTURE] Detected child widget:", detectedWidget.type, "from", child.name);
        childWidgets.push(detectedWidget);
      } else if (child.type === "TEXT") {
        if (!text) {
          text = child.characters || child.name || "";
          textStyles = extractWidgetStyles(child);
          console.log("[WIDGET STRUCTURE] Found text child:", text);
        }
      } else if (isImageFill(child) || child.type === "IMAGE" || child.type === "VECTOR") {
        if (!iconId) {
          iconId = child.id;
          console.log("[WIDGET STRUCTURE] Found image/icon child ID:", iconId);
        }
      }
    });
    if (childWidgets.length === 0) {
      if (!text) {
        const textChild = children.find(
          (c) => {
            var _a, _b;
            return c.type === "TEXT" || ((_a = c.name) == null ? void 0 : _a.toLowerCase().includes("heading")) || ((_b = c.name) == null ? void 0 : _b.toLowerCase().includes("text"));
          }
        );
        if (textChild) {
          text = textChild.characters || textChild.name || "";
          textStyles = extractWidgetStyles(textChild);
          console.log("[WIDGET STRUCTURE] Fallback: Found text:", text);
        }
      }
      if (!iconId) {
        iconId = findFirstImageId(node);
        if (iconId) {
          console.log("[WIDGET STRUCTURE] Fallback: Found image/icon ID:", iconId);
        }
      }
    }
    containerStyles = extractContainerStyles(node);
    return { text, iconId, textStyles, containerStyles, childWidgets };
  }
  function analyzeTreeWithHeuristics(tree) {
    return tree;
  }
  function convertToFlexSchema(analyzedTree) {
    var _a, _b, _c, _d;
    const rootContainer = toContainer(analyzedTree);
    const tokens = { primaryColor: "#000000", secondaryColor: "#FFFFFF" };
    console.log("[convertToFlexSchema] Root container after toContainer:", JSON.stringify({
      id: rootContainer.id,
      widgets: ((_a = rootContainer.widgets) == null ? void 0 : _a.length) || 0,
      widgetTypes: ((_b = rootContainer.widgets) == null ? void 0 : _b.map((w) => w.type)) || [],
      children: ((_c = rootContainer.children) == null ? void 0 : _c.length) || 0,
      childrenIds: ((_d = rootContainer.children) == null ? void 0 : _d.map((c) => c.id)) || []
    }, null, 2));
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
    let titleNode = null;
    let descriptionNode = null;
    console.log("[EXTRACT BOX] Processing node:", node.name, "with", children.length, "children");
    for (const child of children) {
      const childName = (child.name || "").toLowerCase();
      console.log("[EXTRACT BOX] Checking child:", child.name, "Type:", child.type);
      if (childName.startsWith("w:image") || childName.startsWith("w:icon")) {
        imageId = child.id;
        console.log("[EXTRACT BOX] \u2705 Found explicit image/icon:", child.name, "ID:", imageId);
        break;
      }
    }
    if (!imageId) {
      let findIconDeep2 = function(n) {
        if (isImageFill(n) || n.type === "IMAGE" || n.type === "VECTOR") {
          return n.id;
        }
        if (n.children) {
          for (const child of n.children) {
            const found = findIconDeep2(child);
            if (found) return found;
          }
        }
        return null;
      };
      var findIconDeep = findIconDeep2;
      const imgNode = children.find((c) => isImageFill(c) || c.type === "IMAGE" || c.type === "VECTOR");
      if (imgNode) {
        imageId = imgNode.id;
        console.log("[EXTRACT BOX] \u2705 Found image via type:", imageId);
      } else {
        for (const child of children) {
          imageId = findIconDeep2(child);
          if (imageId) {
            console.log("[EXTRACT BOX] \u2705 Found image via deep search:", imageId);
            break;
          }
        }
      }
    }
    const textNodes = [];
    for (const child of children) {
      const childName = (child.name || "").toLowerCase();
      if (childName.startsWith("w:heading") || childName.includes("title") || childName.includes("heading")) {
        if (child.type === "TEXT") {
          title = child.characters || child.name;
          titleNode = child;
          console.log("[EXTRACT BOX] \u2705 Found title:", title);
        }
      } else if (childName.startsWith("w:text-editor") || childName.startsWith("w:text") || childName.includes("description") || childName.includes("desc")) {
        if (child.type === "TEXT") {
          description = child.characters || child.name;
          descriptionNode = child;
          console.log("[EXTRACT BOX] \u2705 Found description:", description.substring(0, 50) + "...");
        }
      } else if (child.type === "TEXT" && !title && !description) {
        textNodes.push(child);
      }
    }
    if (!title && !description) {
      let collectTexts2 = function(n) {
        if (n.type === "TEXT") {
          textNodes.push(n);
          return;
        }
        if (n.children) {
          for (const child of n.children) {
            collectTexts2(child);
            if (textNodes.length >= 2) break;
          }
        }
      };
      var collectTexts = collectTexts2;
      for (const child of children) {
        collectTexts2(child);
        if (textNodes.length >= 2) break;
      }
      if (textNodes.length > 0) {
        title = textNodes[0].characters || textNodes[0].name;
        titleNode = textNodes[0];
        console.log("[EXTRACT BOX] \u2705 Fallback title:", title);
      }
      if (textNodes.length > 1) {
        description = textNodes[1].characters || textNodes[1].name;
        descriptionNode = textNodes[1];
        console.log("[EXTRACT BOX] \u2705 Fallback description:", description.substring(0, 50) + "...");
      }
    }
    const titleStyles = titleNode ? extractTypographyFromTextNode(titleNode) : void 0;
    const descriptionStyles = descriptionNode ? extractTypographyFromTextNode(descriptionNode) : void 0;
    const customCss = generateCardCustomCSSFromNode(node);
    console.log("[EXTRACT BOX] Final result - imageId:", imageId, "title:", title, "description:", description ? description.substring(0, 30) + "..." : "empty");
    console.log("[EXTRACT BOX] Typography - titleStyles:", titleStyles ? "extracted" : "none", "descriptionStyles:", descriptionStyles ? "extracted" : "none");
    console.log("[EXTRACT BOX] customCss:", customCss ? "generated" : "none");
    return { imageId, title, description, titleStyles, descriptionStyles, customCss };
  }
  function extractTypographyFromTextNode(node) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (node.type !== "TEXT") return void 0;
    const styles = {};
    const nodeAny = node;
    if ((_a = nodeAny.fontName) == null ? void 0 : _a.family) {
      styles.fontFamily = nodeAny.fontName.family;
    } else if ((_d = (_c = (_b = nodeAny.styledTextSegments) == null ? void 0 : _b[0]) == null ? void 0 : _c.fontName) == null ? void 0 : _d.family) {
      styles.fontFamily = nodeAny.styledTextSegments[0].fontName.family;
    }
    if (nodeAny.fontWeight) {
      styles.fontWeight = nodeAny.fontWeight;
    } else if ((_e = nodeAny.fontName) == null ? void 0 : _e.style) {
      const styleWeightMap = {
        "Thin": 100,
        "ExtraLight": 200,
        "Light": 300,
        "Regular": 400,
        "Medium": 500,
        "SemiBold": 600,
        "Bold": 700,
        "ExtraBold": 800,
        "Black": 900
      };
      const styleName = nodeAny.fontName.style.replace(/\s+/g, "");
      for (const [name, weight] of Object.entries(styleWeightMap)) {
        if (styleName.includes(name)) {
          styles.fontWeight = weight;
          break;
        }
      }
    }
    if (nodeAny.fontSize) {
      styles.fontSize = nodeAny.fontSize;
    }
    if (nodeAny.lineHeight) {
      if (typeof nodeAny.lineHeight === "number") {
        styles.lineHeight = nodeAny.lineHeight;
      } else if (nodeAny.lineHeight.value && nodeAny.lineHeight.unit !== "AUTO") {
        styles.lineHeight = nodeAny.lineHeight.value;
      }
    }
    if (nodeAny.letterSpacing) {
      if (typeof nodeAny.letterSpacing === "number") {
        styles.letterSpacing = nodeAny.letterSpacing;
      } else if (nodeAny.letterSpacing.value) {
        if (nodeAny.letterSpacing.unit === "PERCENT" && styles.fontSize) {
          styles.letterSpacing = nodeAny.letterSpacing.value / 100 * styles.fontSize;
        } else {
          styles.letterSpacing = nodeAny.letterSpacing.value;
        }
      }
    }
    const fills = nodeAny.fills || ((_g = (_f = nodeAny.styledTextSegments) == null ? void 0 : _f[0]) == null ? void 0 : _g.fills);
    if (fills && Array.isArray(fills) && fills.length > 0) {
      const solidFill = fills.find((f) => f.type === "SOLID" && f.visible !== false);
      if (solidFill == null ? void 0 : solidFill.color) {
        const { r, g, b } = solidFill.color;
        const a = (_h = solidFill.opacity) != null ? _h : 1;
        styles.color = a >= 1 ? `#${Math.round(r * 255).toString(16).padStart(2, "0")}${Math.round(g * 255).toString(16).padStart(2, "0")}${Math.round(b * 255).toString(16).padStart(2, "0")}`.toUpperCase() : `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
      }
    }
    if (nodeAny.textAlignHorizontal) {
      const alignMap = { LEFT: "left", CENTER: "center", RIGHT: "right", JUSTIFIED: "justify" };
      styles.textAlign = alignMap[nodeAny.textAlignHorizontal] || "left";
    }
    if (nodeAny.textCase) {
      const caseMap = { UPPER: "uppercase", LOWER: "lowercase", TITLE: "capitalize" };
      styles.textTransform = caseMap[nodeAny.textCase];
    }
    const hasStyles = Object.keys(styles).length > 0;
    return hasStyles ? styles : void 0;
  }
  function generateCardCustomCSSFromNode(node) {
    var _a, _b;
    const nodeAny = node;
    const cssRules = [];
    if (nodeAny.fills && Array.isArray(nodeAny.fills)) {
      const solidFill = nodeAny.fills.find(
        (f) => f.type === "SOLID" && f.visible !== false && f.color
      );
      if (solidFill == null ? void 0 : solidFill.color) {
        const { r, g, b } = solidFill.color;
        const opacity = (_a = solidFill.opacity) != null ? _a : 1;
        if (opacity >= 1) {
          const hex = `#${Math.round(r * 255).toString(16).padStart(2, "0")}${Math.round(g * 255).toString(16).padStart(2, "0")}${Math.round(b * 255).toString(16).padStart(2, "0")}`.toUpperCase();
          cssRules.push(`background-color: ${hex}`);
        } else {
          cssRules.push(`background-color: rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${opacity})`);
        }
      }
    }
    if (nodeAny.strokes && Array.isArray(nodeAny.strokes) && nodeAny.strokes.length > 0) {
      const stroke = nodeAny.strokes[0];
      if (stroke.type === "SOLID" && stroke.color) {
        const { r, g, b } = stroke.color;
        const strokeWeight = nodeAny.strokeWeight || 1;
        const opacity = (_b = stroke.opacity) != null ? _b : 1;
        cssRules.push(`border: ${strokeWeight}px solid rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${opacity})`);
      }
    }
    if (nodeAny.cornerRadius !== void 0 && nodeAny.cornerRadius > 0) {
      cssRules.push(`border-radius: ${nodeAny.cornerRadius}px`);
      cssRules.push(`overflow: hidden`);
    }
    if (cssRules.length === 0) {
      return null;
    }
    return `selector {
  ${cssRules.join(";\n  ")};
}`;
  }

  // markdown-elementor/elementor-widgets-html-structure.md
  var elementor_widgets_html_structure_default = '# Estrutura HTML dos Componentes WordPress Elementor\n\nDocumenta\xE7\xE3o detalhada com tags HTML e classes de todos os widgets Elementor Free, Pro, WooCommerce, Loop Builder, Carros\xE9is, Experimentais e WordPress.\n\n---\n\n## WIDGETS B\xC1SICOS (ELEMENTOR FREE)\n\n### w:container\n```html\n<div class="elementor-container">\n  <div class="elementor-row">\n    <!-- Inner content -->\n  </div>\n</div>\n```\n\n### w:inner-container\n```html\n<div class="elementor-inner-container">\n  <!-- Child elements -->\n</div>\n```\n\n### w:heading\n```html\n<div class="elementor-widget elementor-widget-heading">\n  <div class="elementor-widget-container">\n    <h1 class="elementor-heading-title elementor-size-default">\n      Heading Text\n    </h1>\n  </div>\n</div>\n```\n\n### w:text-editor\n```html\n<div class="elementor-widget elementor-widget-text-editor">\n  <div class="elementor-widget-container">\n    <div class="elementor-text-editor elementor-clearfix">\n      <p>Text content here</p>\n    </div>\n  </div>\n</div>\n```\n\n### w:image\n```html\n<div class="elementor-widget elementor-widget-image">\n  <div class="elementor-widget-container">\n    <img src="image-url.jpg" class="attachment-full" alt="Image Alt Text">\n  </div>\n</div>\n```\n\n### w:video\n```html\n<div class="elementor-widget elementor-widget-video">\n  <div class="elementor-widget-container">\n    <div class="elementor-video-container">\n      <iframe src="video-url" \n              title="Video"\n              frameborder="0"\n              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture">\n      </iframe>\n    </div>\n  </div>\n</div>\n```\n\n### w:button\n```html\n<div class="elementor-widget elementor-widget-button">\n  <div class="elementor-widget-container">\n    <div class="elementor-button-wrapper">\n      <a href="#" class="elementor-button elementor-button-link elementor-size-md">\n        <span class="elementor-button-content-wrapper">\n          <span class="elementor-button-text">Button Text</span>\n        </span>\n      </a>\n    </div>\n  </div>\n</div>\n```\n\n### w:divider\n```html\n<div class="elementor-widget elementor-widget-divider">\n  <div class="elementor-widget-container">\n    <div class="elementor-divider">\n      <span class="elementor-divider-separator"></span>\n    </div>\n  </div>\n</div>\n```\n\n### w:spacer\n```html\n<div class="elementor-widget elementor-widget-spacer">\n  <div class="elementor-widget-container">\n    <div class="elementor-spacer" style="height: 20px;"></div>\n  </div>\n</div>\n```\n\n### w:icon\n```html\n<div class="elementor-widget elementor-widget-icon">\n  <div class="elementor-widget-container">\n    <div class="elementor-icon-wrapper">\n      <div class="elementor-icon">\n        <i class="fas fa-star"></i>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:icon-box\n```html\n<div class="elementor-widget elementor-widget-icon-box">\n  <div class="elementor-widget-container">\n    <div class="elementor-icon-box-wrapper">\n      <div class="elementor-icon-box-icon">\n        <i class="fas fa-check"></i>\n      </div>\n      <div class="elementor-icon-box-content">\n        <h3 class="elementor-icon-box-title">Title</h3>\n        <p class="elementor-icon-box-description">Description</p>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:image-box\n```html\n<div class="elementor-widget elementor-widget-image-box">\n  <div class="elementor-widget-container">\n    <div class="elementor-image-box-wrapper">\n      <figure class="elementor-image-box-img">\n        <img src="image-url.jpg" alt="Image">\n      </figure>\n      <div class="elementor-image-box-content">\n        <h3 class="elementor-image-box-title">Title</h3>\n        <p class="elementor-image-box-description">Description</p>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:star-rating\n```html\n<div class="elementor-widget elementor-widget-star-rating">\n  <div class="elementor-widget-container">\n    <div class="elementor-star-rating">\n      <i class="fas fa-star elementor-star-full"></i>\n      <i class="fas fa-star elementor-star-full"></i>\n      <i class="fas fa-star elementor-star-half"></i>\n      <i class="fas fa-star elementor-star-empty"></i>\n      <i class="fas fa-star elementor-star-empty"></i>\n    </div>\n  </div>\n</div>\n```\n\n### w:counter\n```html\n<div class="elementor-widget elementor-widget-counter">\n  <div class="elementor-widget-container">\n    <div class="elementor-counter-box">\n      <div class="elementor-counter-title">Title</div>\n      <div class="elementor-counter-number-wrapper">\n        <span class="elementor-counter-number" data-to-value="100">0</span>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:progress\n```html\n<div class="elementor-widget elementor-widget-progress">\n  <div class="elementor-widget-container">\n    <div class="elementor-progress-wrapper">\n      <div class="elementor-progress-title">Progress Title</div>\n      <div class="elementor-progress-bar">\n        <div class="elementor-progress-fill" style="width: 75%;"></div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:tabs\n```html\n<div class="elementor-widget elementor-widget-tabs">\n  <div class="elementor-widget-container">\n    <div class="elementor-tabs">\n      <div class="elementor-tabs-wrapper">\n        <div class="elementor-tab-title">Tab 1</div>\n        <div class="elementor-tab-title">Tab 2</div>\n      </div>\n      <div class="elementor-tabs-content-wrapper">\n        <div class="elementor-tab-content">Content 1</div>\n        <div class="elementor-tab-content" style="display:none;">Content 2</div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:accordion\n```html\n<div class="elementor-widget elementor-widget-accordion">\n  <div class="elementor-widget-container">\n    <div class="elementor-accordion">\n      <div class="elementor-accordion-item">\n        <h3 class="elementor-accordion-title">\n          <span class="elementor-accordion-icon"></span>\n          <span>Accordion Item</span>\n        </h3>\n        <div class="elementor-accordion-body">\n          <div class="elementor-accordion-body-title">Content</div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:toggle\n```html\n<div class="elementor-widget elementor-widget-toggle">\n  <div class="elementor-widget-container">\n    <div class="elementor-toggle">\n      <div class="elementor-toggle-item">\n        <h3 class="elementor-toggle-title">Toggle Title</h3>\n        <div class="elementor-toggle-content">Toggle content here</div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:alert\n```html\n<div class="elementor-widget elementor-widget-alert">\n  <div class="elementor-widget-container">\n    <div class="elementor-alert elementor-alert-type-info">\n      <div class="elementor-alert-title">Alert Title</div>\n      <div class="elementor-alert-description">Alert description</div>\n    </div>\n  </div>\n</div>\n```\n\n### w:social-icons\n```html\n<div class="elementor-widget elementor-widget-social-icons">\n  <div class="elementor-widget-container">\n    <div class="elementor-social-icons-wrapper">\n      <a href="#" class="elementor-social-icon elementor-social-icon-facebook">\n        <i class="fab fa-facebook"></i>\n      </a>\n      <a href="#" class="elementor-social-icon elementor-social-icon-twitter">\n        <i class="fab fa-twitter"></i>\n      </a>\n    </div>\n  </div>\n</div>\n```\n\n### w:soundcloud\n```html\n<div class="elementor-widget elementor-widget-soundcloud">\n  <div class="elementor-widget-container">\n    <iframe src="https://w.soundcloud.com/player/?url=..." \n            frameborder="no" \n            allow="autoplay">\n    </iframe>\n  </div>\n</div>\n```\n\n### w:shortcode\n```html\n<div class="elementor-widget elementor-widget-shortcode">\n  <div class="elementor-widget-container">\n    [shortcode_name param="value"]\n  </div>\n</div>\n```\n\n### w:html\n```html\n<div class="elementor-widget elementor-widget-html">\n  <div class="elementor-widget-container">\n    <!-- Custom HTML content -->\n    <div class="custom-html-content">\n      Your HTML code here\n    </div>\n  </div>\n</div>\n```\n\n### w:menu-anchor\n```html\n<div class="elementor-menu-anchor" id="menu-anchor-id"></div>\n```\n\n### w:sidebar\n```html\n<div class="elementor-widget elementor-widget-sidebar">\n  <div class="elementor-widget-container">\n    <aside class="elementor-sidebar">\n      <!-- Sidebar content -->\n    </aside>\n  </div>\n</div>\n```\n\n### w:read-more\n```html\n<div class="elementor-widget elementor-widget-read-more">\n  <div class="elementor-widget-container">\n    <a href="#" class="elementor-read-more">Read More</a>\n  </div>\n</div>\n```\n\n### w:image-carousel\n```html\n<div class="elementor-widget elementor-widget-image-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-image-carousel">\n      <div class="elementor-carousel">\n        <div class="elementor-slide">\n          <img src="image1.jpg" alt="Slide 1">\n        </div>\n        <div class="elementor-slide">\n          <img src="image2.jpg" alt="Slide 2">\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:basic-gallery\n```html\n<div class="elementor-widget elementor-widget-gallery">\n  <div class="elementor-widget-container">\n    <div class="elementor-gallery">\n      <div class="elementor-gallery-item">\n        <figure class="elementor-gallery-item__image">\n          <img src="image1.jpg" alt="Gallery Image">\n        </figure>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:gallery\n```html\n<div class="elementor-widget elementor-widget-gallery">\n  <div class="elementor-widget-container">\n    <div class="elementor-gallery__titles-container"></div>\n    <div class="elementor-gallery__container">\n      <a href="image.jpg" class="elementor-gallery-item">\n        <div class="elementor-gallery-item__image">\n          <img src="thumbnail.jpg" alt="Gallery">\n        </div>\n        <div class="elementor-gallery-item__overlay">\n          <div class="elementor-gallery-item__content">\n            <div class="elementor-gallery-item__title">Title</div>\n          </div>\n        </div>\n      </a>\n    </div>\n  </div>\n</div>\n```\n\n### w:icon-list\n```html\n<div class="elementor-widget elementor-widget-icon-list">\n  <div class="elementor-widget-container">\n    <ul class="elementor-icon-list-items">\n      <li class="elementor-icon-list-item">\n        <span class="elementor-icon-list-icon"><i class="fas fa-check"></i></span>\n        <span class="elementor-icon-list-text">List item</span>\n      </li>\n    </ul>\n  </div>\n</div>\n```\n\n### w:nav-menu\n```html\n<div class="elementor-widget elementor-widget-nav-menu">\n  <div class="elementor-widget-container">\n    <nav class="elementor-nav-menu">\n      <ul class="elementor-nav-menu-list">\n        <li class="elementor-item"><a href="#">Menu Item</a></li>\n      </ul>\n    </nav>\n  </div>\n</div>\n```\n\n### w:search-form\n```html\n<div class="elementor-widget elementor-widget-search-form">\n  <div class="elementor-widget-container">\n    <form class="elementor-search-form">\n      <input type="search" placeholder="Search...">\n      <button type="submit"><i class="fas fa-search"></i></button>\n    </form>\n  </div>\n</div>\n```\n\n### w:google-maps\n```html\n<div class="elementor-widget elementor-widget-google_maps">\n  <div class="elementor-widget-container">\n    <div class="elementor-google-map">\n      <div class="elementor-map" \n           data-lat="40.7128" \n           data-lng="-74.0060"\n           style="height: 400px;">\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:testimonial\n```html\n<div class="elementor-widget elementor-widget-testimonial">\n  <div class="elementor-widget-container">\n    <div class="elementor-testimonial">\n      <div class="elementor-testimonial-content">\n        <p class="elementor-testimonial-text">Testimonial text</p>\n      </div>\n      <div class="elementor-testimonial-meta">\n        <img src="avatar.jpg" class="elementor-testimonial-image" alt="Author">\n        <div class="elementor-testimonial-meta-inner">\n          <h3 class="elementor-testimonial-name">Author Name</h3>\n          <div class="elementor-testimonial-title">Author Title</div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:embed\n```html\n<div class="elementor-widget elementor-widget-embed">\n  <div class="elementor-widget-container">\n    <div class="elementor-embed-frame">\n      <iframe src="embed-url" frameborder="0"></iframe>\n    </div>\n  </div>\n</div>\n```\n\n### w:lottie\n```html\n<div class="elementor-widget elementor-widget-lottie">\n  <div class="elementor-widget-container">\n    <div class="elementor-lottie-animation" \n         data-animation-url="animation.json"\n         style="height: 300px;">\n    </div>\n  </div>\n</div>\n```\n\n### loop:grid\n```html\n<div class="elementor-widget elementor-widget-loop-grid">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-grid elementor-grid">\n      <div class="elementor-grid-item">\n        <!-- Loop item content -->\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n---\n\n## WIDGETS ELEMENTOR PRO\n\n### w:form\n```html\n<div class="elementor-widget elementor-widget-form">\n  <div class="elementor-widget-container">\n    <form class="elementor-form" method="post">\n      <div class="elementor-form-fields-wrapper">\n        <div class="elementor-field-group">\n          <label for="form-field-name" class="elementor-field-label">\n            <span class="elementor-screen-only">Name</span>\n          </label>\n          <input type="text" name="form_fields[name]" id="form-field-name" class="elementor-field-textual elementor-size-md" placeholder="Name" required>\n        </div>\n      </div>\n      <button type="submit" class="elementor-button">Submit</button>\n    </form>\n  </div>\n</div>\n```\n\n### w:login\n```html\n<div class="elementor-widget elementor-widget-login">\n  <div class="elementor-widget-container">\n    <form class="elementor-login-form" method="post">\n      <div class="elementor-login-form-field">\n        <label>Username or Email</label>\n        <input type="text" name="log" required>\n      </div>\n      <div class="elementor-login-form-field">\n        <label>Password</label>\n        <input type="password" name="pwd" required>\n      </div>\n      <button type="submit" class="elementor-button">Login</button>\n    </form>\n  </div>\n</div>\n```\n\n### w:subscription\n```html\n<div class="elementor-widget elementor-widget-subscription">\n  <div class="elementor-widget-container">\n    <form class="elementor-subscription-form" method="post">\n      <div class="elementor-subscription-content">\n        <h3 class="elementor-subscription-title">Subscribe</h3>\n        <input type="email" name="email" placeholder="Your email" required>\n        <button type="submit" class="elementor-button">Subscribe</button>\n      </div>\n    </form>\n  </div>\n</div>\n```\n\n### w:call-to-action\n```html\n<div class="elementor-widget elementor-widget-call-to-action">\n  <div class="elementor-widget-container">\n    <div class="elementor-cta">\n      <div class="elementor-cta__bg-overlay"></div>\n      <div class="elementor-cta__content">\n        <h2 class="elementor-cta__title">Call to Action</h2>\n        <div class="elementor-cta__description">Description text</div>\n        <a href="#" class="elementor-cta__button elementor-button">CTA Button</a>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### media:carousel\n```html\n<div class="elementor-widget elementor-widget-media-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-carousel">\n      <div class="elementor-slide">\n        <div class="elementor-carousel-item">\n          <img src="media1.jpg" alt="Media 1">\n        </div>\n      </div>\n      <div class="elementor-slide">\n        <div class="elementor-carousel-item">\n          <img src="media2.jpg" alt="Media 2">\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:portfolio\n```html\n<div class="elementor-widget elementor-widget-portfolio">\n  <div class="elementor-widget-container">\n    <div class="elementor-portfolio">\n      <div class="elementor-portfolio-item">\n        <figure class="elementor-portfolio-item__image">\n          <img src="portfolio.jpg" alt="Portfolio Item">\n        </figure>\n        <div class="elementor-portfolio-item__content">\n          <h3 class="elementor-portfolio-item__title">Project Title</h3>\n          <p class="elementor-portfolio-item__category">Category</p>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:gallery-pro\n```html\n<div class="elementor-widget elementor-widget-gallery-pro">\n  <div class="elementor-widget-container">\n    <div class="elementor-gallery-pro">\n      <div class="elementor-gallery-pro-item">\n        <img src="gallery-item.jpg" alt="Gallery Item">\n        <div class="elementor-gallery-pro-overlay">\n          <h3>Gallery Title</h3>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### slider:slides\n```html\n<div class="elementor-widget elementor-widget-slides">\n  <div class="elementor-widget-container">\n    <div class="elementor-slides-wrapper">\n      <div class="elementor-slide">\n        <div class="elementor-slide-background">\n          <img src="slide1.jpg" alt="Slide 1">\n        </div>\n        <div class="elementor-slide-content">\n          <h2 class="elementor-slide-heading">Slide 1</h2>\n          <p class="elementor-slide-description">Slide description</p>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:slideshow\n```html\n<div class="elementor-widget elementor-widget-slideshow">\n  <div class="elementor-widget-container">\n    <div class="elementor-slideshow">\n      <div class="elementor-slideshow-wrapper">\n        <div class="elementor-slide-show-slide">\n          <img src="slide.jpg" alt="Slide">\n        </div>\n      </div>\n      <div class="elementor-slideshow-navigation"></div>\n    </div>\n  </div>\n</div>\n```\n\n### w:flip-box\n```html\n<div class="elementor-widget elementor-widget-flip-box">\n  <div class="elementor-widget-container">\n    <div class="elementor-flip-box">\n      <div class="elementor-flip-box-front">\n        <div class="elementor-flip-box-front-inner">\n          <h3>Front Title</h3>\n        </div>\n      </div>\n      <div class="elementor-flip-box-back">\n        <div class="elementor-flip-box-back-inner">\n          <h3>Back Title</h3>\n          <p>Back content</p>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:animated-headline\n```html\n<div class="elementor-widget elementor-widget-animated-headline">\n  <div class="elementor-widget-container">\n    <h2 class="elementor-headline">\n      <span class="elementor-headline-plain-text">Before</span>\n      <span class="elementor-headline-dynamic-wrapper">\n        <span class="elementor-headline-text">Animated Text</span>\n      </span>\n    </h2>\n  </div>\n</div>\n```\n\n### w:post-navigation\n```html\n<div class="elementor-widget elementor-widget-post-navigation">\n  <div class="elementor-widget-container">\n    <nav class="elementor-post-navigation">\n      <div class="elementor-post-nav-prev">\n        <a href="#">Previous Post</a>\n      </div>\n      <div class="elementor-post-nav-next">\n        <a href="#">Next Post</a>\n      </div>\n    </nav>\n  </div>\n</div>\n```\n\n### w:share-buttons\n```html\n<div class="elementor-widget elementor-widget-share-buttons">\n  <div class="elementor-widget-container">\n    <div class="elementor-share-buttons">\n      <a href="#" class="elementor-share-btn facebook">\n        <i class="fab fa-facebook"></i>\n      </a>\n      <a href="#" class="elementor-share-btn twitter">\n        <i class="fab fa-twitter"></i>\n      </a>\n    </div>\n  </div>\n</div>\n```\n\n### w:table-of-contents\n```html\n<div class="elementor-widget elementor-widget-table-of-contents">\n  <div class="elementor-widget-container">\n    <div class="elementor-toc">\n      <h2 class="elementor-toc-title">Table of Contents</h2>\n      <ul class="elementor-toc-list">\n        <li><a href="#heading-1">Heading 1</a></li>\n        <li><a href="#heading-2">Heading 2</a></li>\n      </ul>\n    </div>\n  </div>\n</div>\n```\n\n### w:countdown\n```html\n<div class="elementor-widget elementor-widget-countdown">\n  <div class="elementor-widget-container">\n    <div class="elementor-countdown">\n      <div class="elementor-countdown-item days">\n        <span class="elementor-countdown-digit">0</span>\n        <span class="elementor-countdown-label">Days</span>\n      </div>\n      <div class="elementor-countdown-item hours">\n        <span class="elementor-countdown-digit">0</span>\n        <span class="elementor-countdown-label">Hours</span>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:blockquote\n```html\n<div class="elementor-widget elementor-widget-blockquote">\n  <div class="elementor-widget-container">\n    <blockquote class="elementor-blockquote">\n      <p class="elementor-blockquote-content">Blockquote text</p>\n      <footer class="elementor-blockquote-footer">\n        <cite class="elementor-blockquote-author">Author Name</cite>\n      </footer>\n    </blockquote>\n  </div>\n</div>\n```\n\n### w:testimonial-carousel\n```html\n<div class="elementor-widget elementor-widget-testimonial-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-testimonials-carousel elementor-carousel">\n      <div class="elementor-slide">\n        <div class="elementor-testimonial">\n          <p class="elementor-testimonial-text">Testimonial</p>\n          <footer class="elementor-testimonial-meta">\n            <cite class="elementor-testimonial-name">Author</cite>\n          </footer>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:review-box\n```html\n<div class="elementor-widget elementor-widget-review-box">\n  <div class="elementor-widget-container">\n    <div class="elementor-review">\n      <div class="elementor-review-header">\n        <h3 class="elementor-review-title">Review Title</h3>\n        <div class="elementor-review-rating">\u2605\u2605\u2605\u2605\u2606</div>\n      </div>\n      <div class="elementor-review-content">\n        <p>Review content here</p>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:hotspots\n```html\n<div class="elementor-widget elementor-widget-hotspots">\n  <div class="elementor-widget-container">\n    <div class="elementor-hotspots-container">\n      <img src="image.jpg" alt="Hotspot Image">\n      <div class="elementor-hotspot" data-x="50" data-y="50">\n        <span class="elementor-hotspot-indicator"></span>\n        <div class="elementor-hotspot-tooltip">Hotspot content</div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:sitemap\n```html\n<div class="elementor-widget elementor-widget-sitemap">\n  <div class="elementor-widget-container">\n    <div class="elementor-sitemap">\n      <ul class="elementor-sitemap-list">\n        <li><a href="#">Page Link</a></li>\n      </ul>\n    </div>\n  </div>\n</div>\n```\n\n### w:author-box\n```html\n<div class="elementor-widget elementor-widget-author-box">\n  <div class="elementor-widget-container">\n    <div class="elementor-author-box">\n      <img src="author-avatar.jpg" class="elementor-author-box-avatar" alt="Author">\n      <div class="elementor-author-box-content">\n        <h3 class="elementor-author-box-name">Author Name</h3>\n        <p class="elementor-author-box-bio">Author bio text</p>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:price-table\n```html\n<div class="elementor-widget elementor-widget-price-table">\n  <div class="elementor-widget-container">\n    <div class="elementor-price-table">\n      <div class="elementor-price-table-header">\n        <h3 class="elementor-price-table-title">Plan Name</h3>\n        <span class="elementor-price-table-currency">$</span>\n        <span class="elementor-price-table-integer-part">99</span>\n        <span class="elementor-price-table-fractional-part">99</span>\n      </div>\n      <ul class="elementor-price-table-features">\n        <li class="elementor-price-table-feature">\n          <span>Feature 1</span>\n        </li>\n      </ul>\n      <div class="elementor-price-table-footer">\n        <a href="#" class="elementor-button">Buy Now</a>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:price-list\n```html\n<div class="elementor-widget elementor-widget-price-list">\n  <div class="elementor-widget-container">\n    <div class="elementor-price-list">\n      <div class="elementor-price-list-item">\n        <h4 class="elementor-price-list-heading">Item Title</h4>\n        <span class="elementor-price-list-separator"></span>\n        <span class="elementor-price-list-price">$10</span>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:progress-tracker\n```html\n<div class="elementor-widget elementor-widget-progress-tracker">\n  <div class="elementor-widget-container">\n    <div class="elementor-progress-tracker">\n      <div class="elementor-progress-tracker-item">\n        <div class="elementor-progress-tracker-step">1</div>\n        <div class="elementor-progress-tracker-label">Step 1</div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:animated-text\n```html\n<div class="elementor-widget elementor-widget-animated-text">\n  <div class="elementor-widget-container">\n    <div class="elementor-animated-text">\n      <span class="elementor-animated-text-word">Animated</span>\n      <span class="elementor-animated-text-word">Text</span>\n    </div>\n  </div>\n</div>\n```\n\n### w:nav-menu-pro\n```html\n<div class="elementor-widget elementor-widget-nav-menu">\n  <div class="elementor-widget-container">\n    <nav class="elementor-nav-menu-pro">\n      <ul class="elementor-nav-menu-pro-list">\n        <li class="elementor-item">\n          <a href="#">Menu Item</a>\n          <ul class="elementor-submenu">\n            <li><a href="#">Submenu Item</a></li>\n          </ul>\n        </li>\n      </ul>\n    </nav>\n  </div>\n</div>\n```\n\n### w:breadcrumb\n```html\n<div class="elementor-widget elementor-widget-breadcrumb">\n  <div class="elementor-widget-container">\n    <div class="elementor-breadcrumb">\n      <span class="elementor-breadcrumb-item">\n        <a href="#">Home</a>\n      </span>\n      <span class="elementor-breadcrumb-separator">\u203A</span>\n      <span class="elementor-breadcrumb-item">\n        Current Page\n      </span>\n    </div>\n  </div>\n</div>\n```\n\n### w:facebook-button\n```html\n<div class="elementor-widget elementor-widget-facebook-button">\n  <div class="elementor-widget-container">\n    <a href="#" class="elementor-facebook-button fb-button">\n      <i class="fab fa-facebook"></i> Like\n    </a>\n  </div>\n</div>\n```\n\n### w:facebook-comments\n```html\n<div class="elementor-widget elementor-widget-facebook-comments">\n  <div class="elementor-widget-container">\n    <div class="fb-comments" data-href="page-url" data-numposts="5"></div>\n  </div>\n</div>\n```\n\n### w:facebook-embed\n```html\n<div class="elementor-widget elementor-widget-facebook-embed">\n  <div class="elementor-widget-container">\n    <div class="fb-post" data-href="post-url"></div>\n  </div>\n</div>\n```\n\n### w:facebook-page\n```html\n<div class="elementor-widget elementor-widget-facebook-page">\n  <div class="elementor-widget-container">\n    <div class="fb-page" data-href="page-url"></div>\n  </div>\n</div>\n```\n\n### loop:builder\n```html\n<div class="elementor-widget elementor-widget-loop-builder">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-builder">\n      <!-- Loop builder content -->\n    </div>\n  </div>\n</div>\n```\n\n### loop:grid-advanced\n```html\n<div class="elementor-widget elementor-widget-loop-grid-advanced">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-grid-advanced elementor-grid">\n      <div class="elementor-grid-item">\n        <!-- Advanced grid item -->\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### loop:carousel\n```html\n<div class="elementor-widget elementor-widget-loop-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-carousel elementor-carousel">\n      <div class="elementor-slide">\n        <!-- Carousel item -->\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:post-excerpt\n```html\n<div class="elementor-widget elementor-widget-post-excerpt">\n  <div class="elementor-widget-container">\n    <div class="elementor-post-excerpt">\n      <p>Post excerpt text here...</p>\n    </div>\n  </div>\n</div>\n```\n\n### w:post-content\n```html\n<div class="elementor-widget elementor-widget-post-content">\n  <div class="elementor-widget-container">\n    <div class="elementor-post-content">\n      <!-- Full post content renders here -->\n    </div>\n  </div>\n</div>\n```\n\n### w:post-title\n```html\n<div class="elementor-widget elementor-widget-post-title">\n  <div class="elementor-widget-container">\n    <h1 class="elementor-post-title">Post Title</h1>\n  </div>\n</div>\n```\n\n### w:post-info\n```html\n<div class="elementor-widget elementor-widget-post-info">\n  <div class="elementor-widget-container">\n    <div class="elementor-post-info">\n      <span class="elementor-post-info-author">By Author Name</span>\n      <span class="elementor-post-info-date">Date Published</span>\n    </div>\n  </div>\n</div>\n```\n\n### w:post-featured-image\n```html\n<div class="elementor-widget elementor-widget-post-featured-image">\n  <div class="elementor-widget-container">\n    <div class="elementor-post-featured-image">\n      <img src="featured-image.jpg" alt="Featured Image">\n    </div>\n  </div>\n</div>\n```\n\n### w:post-author\n```html\n<div class="elementor-widget elementor-widget-post-author">\n  <div class="elementor-widget-container">\n    <div class="elementor-post-author">\n      <img src="author.jpg" alt="Author">\n      <h4>Author Name</h4>\n    </div>\n  </div>\n</div>\n```\n\n### w:post-date\n```html\n<div class="elementor-widget elementor-widget-post-date">\n  <div class="elementor-widget-container">\n    <div class="elementor-post-date">\n      Published on: <time>Date</time>\n    </div>\n  </div>\n</div>\n```\n\n### w:post-terms\n```html\n<div class="elementor-widget elementor-widget-post-terms">\n  <div class="elementor-widget-container">\n    <div class="elementor-post-terms">\n      <a href="#">Category</a>, <a href="#">Tag</a>\n    </div>\n  </div>\n</div>\n```\n\n### w:archive-title\n```html\n<div class="elementor-widget elementor-widget-archive-title">\n  <div class="elementor-widget-container">\n    <h1 class="elementor-archive-title">Archive Title</h1>\n  </div>\n</div>\n```\n\n### w:archive-description\n```html\n<div class="elementor-widget elementor-widget-archive-description">\n  <div class="elementor-widget-container">\n    <div class="elementor-archive-description">\n      <p>Archive description here</p>\n    </div>\n  </div>\n</div>\n```\n\n### w:site-logo\n```html\n<div class="elementor-widget elementor-widget-site-logo">\n  <div class="elementor-widget-container">\n    <div class="elementor-site-logo">\n      <a href="/">\n        <img src="logo.png" alt="Logo">\n      </a>\n    </div>\n  </div>\n</div>\n```\n\n### w:site-title\n```html\n<div class="elementor-widget elementor-widget-site-title">\n  <div class="elementor-widget-container">\n    <h1 class="elementor-site-title">\n      <a href="/">Site Title</a>\n    </h1>\n  </div>\n</div>\n```\n\n### w:site-tagline\n```html\n<div class="elementor-widget elementor-widget-site-tagline">\n  <div class="elementor-widget-container">\n    <p class="elementor-site-tagline">Site tagline here</p>\n  </div>\n</div>\n```\n\n### w:search-results\n```html\n<div class="elementor-widget elementor-widget-search-results">\n  <div class="elementor-widget-container">\n    <div class="elementor-search-results">\n      <!-- Search results render here -->\n    </div>\n  </div>\n</div>\n```\n\n### w:global-widget\n```html\n<div class="elementor-widget elementor-widget-global-widget" data-widget-id="123">\n  <div class="elementor-widget-container">\n    <!-- Global widget content -->\n  </div>\n</div>\n```\n\n### w:video-playlist\n```html\n<div class="elementor-widget elementor-widget-video-playlist">\n  <div class="elementor-widget-container">\n    <div class="elementor-video-playlist">\n      <div class="elementor-playlist-item">\n        <iframe src="video-url"></iframe>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:video-gallery\n```html\n<div class="elementor-widget elementor-widget-video-gallery">\n  <div class="elementor-widget-container">\n    <div class="elementor-video-gallery">\n      <div class="elementor-video-gallery-item">\n        <iframe src="video-url"></iframe>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n---\n\n## WIDGETS WOOCOMMERCE\n\n### woo:product-title\n```html\n<div class="elementor-widget elementor-widget-wc-product-title">\n  <div class="elementor-widget-container">\n    <h1 class="product_title entry-title">Product Name</h1>\n  </div>\n</div>\n```\n\n### woo:product-image\n```html\n<div class="elementor-widget elementor-widget-wc-product-image">\n  <div class="elementor-widget-container">\n    <div class="product-images">\n      <figure class="woocommerce-product-gallery">\n        <img src="product.jpg" alt="Product">\n      </figure>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-price\n```html\n<div class="elementor-widget elementor-widget-wc-product-price">\n  <div class="elementor-widget-container">\n    <div class="product_price">\n      <span class="woocommerce-Price-amount amount">\n        <bdi><span class="woocommerce-Price-currencySymbol">$</span>99.99</bdi>\n      </span>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-add-to-cart\n```html\n<div class="elementor-widget elementor-widget-wc-product-add-to-cart">\n  <div class="elementor-widget-container">\n    <form class="cart" method="post" enctype="multipart/form-data">\n      <div class="quantity">\n        <input type="number" value="1" min="1">\n      </div>\n      <button type="submit" class="single_add_to_cart_button button alt">Add to Cart</button>\n    </form>\n  </div>\n</div>\n```\n\n### woo:product-data-tabs\n```html\n<div class="elementor-widget elementor-widget-wc-product-data-tabs">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-tabs">\n      <ul class="tabs">\n        <li><a href="#tab-description">Description</a></li>\n        <li><a href="#tab-reviews">Reviews</a></li>\n      </ul>\n      <div id="tab-description" class="tab-content">Description content</div>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-excerpt\n```html\n<div class="elementor-widget elementor-widget-wc-product-excerpt">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-product-details__short-description">\n      <p>Product short description</p>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-rating\n```html\n<div class="elementor-widget elementor-widget-wc-product-rating">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-product-rating">\n      <div class="star-rating" role="img">\n        <span style="width:80%;">Rated 4 out of 5</span>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-stock\n```html\n<div class="elementor-widget elementor-widget-wc-product-stock">\n  <div class="elementor-widget-container">\n    <p class="stock in-stock">In stock</p>\n  </div>\n</div>\n```\n\n### woo:product-meta\n```html\n<div class="elementor-widget elementor-widget-wc-product-meta">\n  <div class="elementor-widget-container">\n    <div class="product_meta">\n      <span class="sku_wrapper">SKU: <span class="sku">12345</span></span>\n      <span class="posted_in">Category: <a href="#">Electronics</a></span>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-additional-information\n```html\n<div class="elementor-widget elementor-widget-wc-product-additional-information">\n  <div class="elementor-widget-container">\n    <table class="woocommerce-product-attributes">\n      <tr class="woocommerce-product-attributes-item">\n        <th>Attribute</th>\n        <td>Value</td>\n      </tr>\n    </table>\n  </div>\n</div>\n```\n\n### woo:product-short-description\n```html\n<div class="elementor-widget elementor-widget-wc-product-short-description">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-product-details__short-description">\n      <p>Short description here</p>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-related\n```html\n<div class="elementor-widget elementor-widget-wc-product-related">\n  <div class="elementor-widget-container">\n    <section class="related products">\n      <h2>Related Products</h2>\n      <div class="products">\n        <div class="product">\n          <img src="product.jpg" alt="Related Product">\n        </div>\n      </div>\n    </section>\n  </div>\n</div>\n```\n\n### woo:product-upsells\n```html\n<div class="elementor-widget elementor-widget-wc-product-upsells">\n  <div class="elementor-widget-container">\n    <section class="up-sells upsells products">\n      <h2>You might also like\u2026</h2>\n      <div class="products">\n        <div class="product">\n          <img src="upsell.jpg" alt="Upsell Product">\n        </div>\n      </div>\n    </section>\n  </div>\n</div>\n```\n\n### woo:product-tabs\n```html\n<div class="elementor-widget elementor-widget-wc-product-tabs">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-tabs">\n      <ul class="tabs wc-tabs">\n        <li><a href="#tab-description">Description</a></li>\n      </ul>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-breadcrumb\n```html\n<div class="elementor-widget elementor-widget-wc-product-breadcrumb">\n  <div class="elementor-widget-container">\n    <nav class="woocommerce-breadcrumb">\n      <a href="#">Shop</a> \u203A Product\n    </nav>\n  </div>\n</div>\n```\n\n### woo:product-gallery\n```html\n<div class="elementor-widget elementor-widget-wc-product-gallery">\n  <div class="elementor-widget-container">\n    <div class="product-gallery-wrapper">\n      <figure class="woocommerce-product-gallery">\n        <img src="gallery.jpg" alt="Product Gallery">\n      </figure>\n    </div>\n  </div>\n</div>\n```\n\n### woo:products\n```html\n<div class="elementor-widget elementor-widget-wc-products">\n  <div class="elementor-widget-container">\n    <div class="woocommerce columns-4">\n      <ul class="products">\n        <li class="product">\n          <img src="product.jpg" alt="Product">\n          <h2>Product Name</h2>\n          <span class="price">$99.99</span>\n          <a href="#" class="button">Read more</a>\n        </li>\n      </ul>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-grid\n```html\n<div class="elementor-widget elementor-widget-wc-product-grid">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-product-grid elementor-grid">\n      <div class="product elementor-grid-item">\n        <!-- Product item -->\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-carousel\n```html\n<div class="elementor-widget elementor-widget-wc-product-carousel">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-product-carousel elementor-carousel">\n      <div class="product elementor-slide">\n        <!-- Carousel product -->\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-loop-item\n```html\n<div class="elementor-widget elementor-widget-wc-product-loop-item">\n  <div class="elementor-widget-container">\n    <div class="product-loop-item">\n      <!-- Product loop item content -->\n    </div>\n  </div>\n</div>\n```\n\n### woo:loop-product-title\n```html\n<div class="elementor-widget elementor-widget-wc-loop-product-title">\n  <div class="elementor-widget-container">\n    <h2><a href="#">Product Title</a></h2>\n  </div>\n</div>\n```\n\n### woo:loop-product-price\n```html\n<div class="elementor-widget elementor-widget-wc-loop-product-price">\n  <div class="elementor-widget-container">\n    <span class="price">$99.99</span>\n  </div>\n</div>\n```\n\n### woo:loop-product-rating\n```html\n<div class="elementor-widget elementor-widget-wc-loop-product-rating">\n  <div class="elementor-widget-container">\n    <div class="star-rating">\n      <span style="width:80%;">\u2605\u2605\u2605\u2605\u2606</span>\n    </div>\n  </div>\n</div>\n```\n\n### woo:loop-product-image\n```html\n<div class="elementor-widget elementor-widget-wc-loop-product-image">\n  <div class="elementor-widget-container">\n    <img src="product-thumbnail.jpg" alt="Product Thumbnail">\n  </div>\n</div>\n```\n\n### woo:loop-product-button\n```html\n<div class="elementor-widget elementor-widget-wc-loop-product-button">\n  <div class="elementor-widget-container">\n    <a href="#" class="button">Add to Cart</a>\n  </div>\n</div>\n```\n\n### woo:loop-product-meta\n```html\n<div class="elementor-widget elementor-widget-wc-loop-product-meta">\n  <div class="elementor-widget-container">\n    <div class="product-meta">SKU: 123, Category: Electronics</div>\n  </div>\n</div>\n```\n\n### woo:cart\n```html\n<div class="elementor-widget elementor-widget-wc-cart">\n  <div class="elementor-widget-container">\n    <div class="woocommerce">\n      <table class="shop_table cart">\n        <tr>\n          <td class="product-name">Product</td>\n          <td class="product-price">$99.99</td>\n        </tr>\n      </table>\n    </div>\n  </div>\n</div>\n```\n\n### woo:checkout\n```html\n<div class="elementor-widget elementor-widget-wc-checkout">\n  <div class="elementor-widget-container">\n    <div class="woocommerce">\n      <form class="checkout" method="post">\n        <div class="col-1">\n          <h3>Billing details</h3>\n          <div class="woocommerce-billing-fields">\n            <!-- Billing form fields -->\n          </div>\n        </div>\n      </form>\n    </div>\n  </div>\n</div>\n```\n\n### woo:my-account\n```html\n<div class="elementor-widget elementor-widget-wc-my-account">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-account">\n      <nav class="woocommerce-MyAccount-navigation">\n        <ul>\n          <li><a href="#">Dashboard</a></li>\n          <li><a href="#">Orders</a></li>\n        </ul>\n      </nav>\n    </div>\n  </div>\n</div>\n```\n\n### woo:purchase-summary\n```html\n<div class="elementor-widget elementor-widget-wc-purchase-summary">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-purchase-summary">\n      <h3>Order Summary</h3>\n      <p>Subtotal: $99.99</p>\n      <p>Total: $99.99</p>\n    </div>\n  </div>\n</div>\n```\n\n### woo:order-tracking\n```html\n<div class="elementor-widget elementor-widget-wc-order-tracking">\n  <div class="elementor-widget-container">\n    <form class="woocommerce-order-tracking" method="post">\n      <p>Enter your order number to track your shipment.</p>\n      <input type="text" name="order" placeholder="Order #">\n      <button type="submit" class="button">Track</button>\n    </form>\n  </div>\n</div>\n```\n\n---\n\n## LOOP BUILDER WIDGETS\n\n### loop:grid\n```html\n<div class="elementor-widget elementor-widget-loop-grid">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-grid elementor-grid">\n      <div class="elementor-grid-item">\n        <!-- Loop item -->\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### loop:carousel\n```html\n<div class="elementor-widget elementor-widget-loop-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-carousel elementor-carousel">\n      <div class="elementor-slide">\n        <!-- Carousel loop item -->\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### loop:item\n```html\n<div class="elementor-widget elementor-widget-loop-item">\n  <div class="elementor-widget-container">\n    <div class="loop-item">\n      <!-- Loop item content container -->\n    </div>\n  </div>\n</div>\n```\n\n### loop:image\n```html\n<div class="elementor-widget elementor-widget-loop-image">\n  <div class="elementor-widget-container">\n    <figure class="loop-item-image">\n      <img src="image.jpg" alt="Item Image">\n    </figure>\n  </div>\n</div>\n```\n\n### loop:title\n```html\n<div class="elementor-widget elementor-widget-loop-title">\n  <div class="elementor-widget-container">\n    <h2 class="loop-item-title"><a href="#">Item Title</a></h2>\n  </div>\n</div>\n```\n\n### loop:meta\n```html\n<div class="elementor-widget elementor-widget-loop-meta">\n  <div class="elementor-widget-container">\n    <div class="loop-item-meta">\n      <span class="loop-meta-author">By Author</span>\n      <span class="loop-meta-date">Date</span>\n    </div>\n  </div>\n</div>\n```\n\n### loop:terms\n```html\n<div class="elementor-widget elementor-widget-loop-terms">\n  <div class="elementor-widget-container">\n    <div class="loop-item-terms">\n      <a href="#">Category</a>, <a href="#">Tag</a>\n    </div>\n  </div>\n</div>\n```\n\n### loop:rating\n```html\n<div class="elementor-widget elementor-widget-loop-rating">\n  <div class="elementor-widget-container">\n    <div class="loop-item-rating">\n      <div class="star-rating">\u2605\u2605\u2605\u2605\u2606</div>\n    </div>\n  </div>\n</div>\n```\n\n### loop:price\n```html\n<div class="elementor-widget elementor-widget-loop-price">\n  <div class="elementor-widget-container">\n    <span class="loop-item-price">$99.99</span>\n  </div>\n</div>\n```\n\n### loop:add-to-cart\n```html\n<div class="elementor-widget elementor-widget-loop-add-to-cart">\n  <div class="elementor-widget-container">\n    <a href="#" class="loop-item-add-to-cart button">Add to Cart</a>\n  </div>\n</div>\n```\n\n### loop:read-more\n```html\n<div class="elementor-widget elementor-widget-loop-read-more">\n  <div class="elementor-widget-container">\n    <a href="#" class="loop-item-read-more button">Read More</a>\n  </div>\n</div>\n```\n\n### loop:featured-image\n```html\n<div class="elementor-widget elementor-widget-loop-featured-image">\n  <div class="elementor-widget-container">\n    <img src="featured.jpg" class="loop-featured-image" alt="Featured Image">\n  </div>\n</div>\n```\n\n---\n\n## CARROSS\xC9IS\n\n### w:image-carousel\n```html\n<div class="elementor-widget elementor-widget-image-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-image-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide">\n          <img src="image1.jpg" alt="Slide 1">\n        </div>\n        <div class="swiper-slide">\n          <img src="image2.jpg" alt="Slide 2">\n        </div>\n      </div>\n      <div class="swiper-pagination"></div>\n      <div class="swiper-button-prev"></div>\n      <div class="swiper-button-next"></div>\n    </div>\n  </div>\n</div>\n```\n\n### media:carousel\n```html\n<div class="elementor-widget elementor-widget-media-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-media-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide">\n          <img src="media1.jpg" alt="Media 1">\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:testimonial-carousel\n```html\n<div class="elementor-widget elementor-widget-testimonial-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-testimonials-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide">\n          <div class="elementor-testimonial">\n            <p class="elementor-testimonial-text">Testimonial text</p>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:review-carousel\n```html\n<div class="elementor-widget elementor-widget-review-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-review-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide">\n          <div class="elementor-review-item">\u2605\u2605\u2605\u2605\u2605 Review</div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### slider:slides\n```html\n<div class="elementor-widget elementor-widget-slides">\n  <div class="elementor-widget-container">\n    <div class="elementor-slides-wrapper swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide elementor-slide">\n          <div class="elementor-slide-content">Slide content</div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### slider:slider\n```html\n<div class="elementor-widget elementor-widget-slider">\n  <div class="elementor-widget-container">\n    <div class="elementor-slider swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide">Slider item</div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### loop:carousel\n```html\n<div class="elementor-widget elementor-widget-loop-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide">\n          <!-- Loop carousel item -->\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### woo:product-carousel\n```html\n<div class="elementor-widget elementor-widget-wc-product-carousel">\n  <div class="elementor-widget-container">\n    <div class="woocommerce-product-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide product">\n          <img src="product.jpg" alt="Product">\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:posts-carousel\n```html\n<div class="elementor-widget elementor-widget-posts-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-posts-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide post">\n          <h3>Post Title</h3>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:gallery-carousel\n```html\n<div class="elementor-widget elementor-widget-gallery-carousel">\n  <div class="elementor-widget-container">\n    <div class="elementor-gallery-carousel swiper-container">\n      <div class="swiper-wrapper">\n        <div class="swiper-slide">\n          <img src="gallery.jpg" alt="Gallery">\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n---\n\n## WIDGETS EXPERIMENTAIS\n\n### w:nested-tabs\n```html\n<div class="elementor-widget elementor-widget-nested-tabs">\n  <div class="elementor-widget-container">\n    <div class="elementor-nested-tabs">\n      <div class="elementor-tabs-wrapper">\n        <div class="elementor-tab-title">Nested Tab</div>\n      </div>\n    </div>\n  </div>\n</div>\n```\n\n### w:mega-menu\n```html\n<div class="elementor-widget elementor-widget-mega-menu">\n  <div class="elementor-widget-container">\n    <nav class="elementor-mega-menu">\n      <ul>\n        <li>\n          <a href="#">Menu</a>\n          <div class="mega-menu-panel">Mega menu content</div>\n        </li>\n      </ul>\n    </nav>\n  </div>\n</div>\n```\n\n### w:scroll-snap\n```html\n<div class="elementor-widget elementor-widget-scroll-snap">\n  <div class="elementor-widget-container elementor-scroll-snap">\n    <section>Section 1</section>\n    <section>Section 2</section>\n  </div>\n</div>\n```\n\n### w:motion-effects\n```html\n<div class="elementor-widget elementor-widget-motion-effects" data-motion-effect="parallax">\n  <div class="elementor-widget-container">\n    <div class="motion-effect-content">\n      Content with motion effects\n    </div>\n  </div>\n</div>\n```\n\n### w:background-slideshow\n```html\n<div class="elementor-widget elementor-widget-background-slideshow" data-slideshow-effect="fade">\n  <div class="elementor-widget-container">\n    <div class="elementor-slideshow-background">\n      <img src="slide1.jpg" alt="Slide 1">\n      <img src="slide2.jpg" alt="Slide 2">\n    </div>\n    <div class="elementor-slideshow-content">Content</div>\n  </div>\n</div>\n```\n\n### w:css-transform\n```html\n<div class="elementor-widget elementor-widget-css-transform" style="transform: skewX(-10deg);">\n  <div class="elementor-widget-container">\n    Transformed content\n  </div>\n</div>\n```\n\n### w:custom-position\n```html\n<div class="elementor-widget elementor-widget-custom-position" style="position: absolute; top: 0; left: 0;">\n  <div class="elementor-widget-container">\n    Custom positioned content\n  </div>\n</div>\n```\n\n### w:dynamic-tags\n```html\n<div class="elementor-widget elementor-widget-dynamic-tags">\n  <div class="elementor-widget-container">\n    <div class="dynamic-tags-content">\n      [elementor-tag id="post_title"]\n    </div>\n  </div>\n</div>\n```\n\n### w:ajax-pagination\n```html\n<div class="elementor-widget elementor-widget-ajax-pagination">\n  <div class="elementor-widget-container">\n    <nav class="elementor-pagination">\n      <a href="#" class="page-numbers">1</a>\n      <a href="#" class="page-numbers">2</a>\n      <span class="page-numbers current">3</span>\n    </nav>\n  </div>\n</div>\n```\n\n### loop:pagination\n```html\n<div class="elementor-widget elementor-widget-loop-pagination">\n  <div class="elementor-widget-container">\n    <div class="elementor-loop-pagination">\n      <a href="#" class="pagination-link">Previous</a>\n      <span class="pagination-number">1</span>\n      <a href="#" class="pagination-link">Next</a>\n    </div>\n  </div>\n</div>\n```\n\n### w:aspect-ratio-container\n```html\n<div class="elementor-widget elementor-widget-aspect-ratio-container" style="aspect-ratio: 16/9;">\n  <div class="elementor-widget-container">\n    <div class="aspect-ratio-content">\n      Content maintaining aspect ratio\n    </div>\n  </div>\n</div>\n```\n\n---\n\n## WIDGETS WORDPRESS\n\n### w:wp-search\n```html\n<div class="elementor-widget elementor-widget-wp-search">\n  <div class="elementor-widget-container">\n    <aside class="widget widget_search">\n      <form class="searchform" method="get">\n        <input type="search" name="s" placeholder="Search...">\n        <button type="submit">Search</button>\n      </form>\n    </aside>\n  </div>\n</div>\n```\n\n### w:wp-recent-posts\n```html\n<div class="elementor-widget elementor-widget-wp-recent-posts">\n  <div class="elementor-widget-container">\n    <aside class="widget widget_recent_entries">\n      <h3>Recent Posts</h3>\n      <ul>\n        <li><a href="#">Post Title</a></li>\n      </ul>\n    </aside>\n  </div>\n</div>\n```\n\n### w:wp-recent-comments\n```html\n<div class="elementor-widget elementor-widget-wp-recent-comments">\n  <div class="elementor-widget-container">\n    <aside class="widget widget_recent_comments">\n      <h3>Recent Comments</h3>\n      <ul id="recent-comments">\n        <li>Comment text</li>\n      </ul>\n    </aside>\n  </div>\n</div>\n```\n\n### w:wp-archives\n```html\n<div class="elementor-widget elementor-widget-wp-archives">\n  <div class="elementor-widget-container">\n    <aside class="widget widget_archive">\n      <h3>Archives</h3>\n      <ul>\n        <li><a href="#">January 2025</a></li>\n      </ul>\n    </aside>\n  </div>\n</div>\n```\n\n### w:wp-categories\n```html\n<div class="elementor-widget elementor-widget-wp-categories">\n  <div class="elementor-widget-container">\n    <aside class="widget widget_categories">\n      <h3>Categories</h3>\n      <ul>\n        <li><a href="#">Category Name</a></li>\n      </ul>\n    </aside>\n  </div>\n</div>\n```\n\n### w:wp-calendar\n```html\n<div class="elementor-widget elementor-widget-wp-calendar">\n  <div class="elementor-widget-container">\n    <aside class="widget widget_calendar">\n      <div id="calendar_wrap">\n        <table id="wp-calendar">\n          <tr><th>S</th><th>M</th><th>T</th></tr>\n        </table>\n      </div>\n    </aside>\n  </div>\n</div>\n```\n\n### w:wp-tag-cloud\n```html\n<div class="elementor-widget elementor-widget-wp-tag-cloud">\n  <div class="elementor-widget-container">\n    <aside class="widget widget_tag_cloud">\n      <h3>Tags</h3>\n      <div class="tagcloud">\n        <a href="#">tag1</a>\n        <a href="#">tag2</a>\n      </div>\n    </aside>\n  </div>\n</div>\n```\n\n### w:wp-custom-menu\n```html\n<div class="elementor-widget elementor-widget-wp-custom-menu">\n  <div class="elementor-widget-container">\n    <nav class="elementor-wp-menu">\n      <ul class="wp-menu-list">\n        <li><a href="#">Menu Item</a></li>\n      </ul>\n    </nav>\n  </div>\n</div>\n```\n\n---\n\n## ESTRUTURA PADR\xC3O DE WRAPPER\n\nTodos os widgets seguem essa estrutura base:\n\n```html\n<div class="elementor-widget elementor-widget-[tipo]">\n  <div class="elementor-widget-container">\n    <!-- Widget content here -->\n  </div>\n</div>\n```\n\n---\n\n## CLASSES IMPORTANTES DE ELEMENTOR\n\n- `.elementor-widget` - Container raiz do widget\n- `.elementor-widget-container` - Container interno de conte\xFAdo\n- `.elementor-button` - Classe para bot\xF5es\n- `.elementor-carousel` - Classe para carross\xE9is (usa Swiper.js)\n- `.elementor-grid` - Classe para layouts em grid\n- `.elementor-tabs-wrapper` - Wrapper para tabs\n- `.elementor-accordion` - Classe para accordion\n- `.elementor-form` - Classe para formul\xE1rios\n- `.elementor-post-*` - Classes para widgets de posts\n\n---\n\n## ATRIBUTOS DATA IMPORTANTES\n\n- `data-animation-url` - URL da anima\xE7\xE3o Lottie\n- `data-lat` / `data-lng` - Coordenadas do Google Maps\n- `data-to-value` - Valor final do counter\n- `data-widget-id` - ID do widget global\n- `data-motion-effect` - Tipo de efeito de movimento\n- `data-slideshow-effect` - Tipo de efeito do slideshow\n\nEste documento serve como refer\xEAncia completa para mapeamento de componentes Figma \u2192 Elementor WordPress.\n\n';

  // markdown-elementor/widgets-estrutural.md
  var widgets_estrutural_default = '\n# Estruturas de Widgets para Elementor, Elementor Pro, WordPress, WooCommerce\n\n## Widgets Nativos do Elementor (Gratuito)\n\n### Caixa de Imagem (Image Box)\n```html\n<div class="elementor-image-box">\n  <figure class="elementor-image-box-img">\n    <img src="URL-da-imagem" alt="Descri\xE7\xE3o">\n  </figure>\n  <div class="elementor-image-box-content">\n    <h3 class="elementor-image-box-title">T\xEDtulo da Caixa</h3>\n    <p class="elementor-image-box-description">Descri\xE7\xE3o da caixa de imagem.</p>\n  </div>\n</div>\n```\n\n### Caixa de \xCDcone (Icon Box)\n```html\n<div class="elementor-icon-box">\n  <span class="elementor-icon">\n    <i class="fas fa-star"></i>\n  </span>\n  <div class="elementor-icon-box-content">\n    <h3 class="elementor-icon-box-title">T\xEDtulo do \xCDcone</h3>\n    <p class="elementor-icon-box-description">Descri\xE7\xE3o sobre o \xEDcone.</p>\n  </div>\n</div>\n```\n\n### Imagem\n```html\n<img class="elementor-widget-image" src="URL-da-imagem" alt="Descri\xE7\xE3o">\n```\n\n### V\xEDdeo\n```html\n<div class="elementor-widget-video">\n  <iframe src="URL-do-video"></iframe>\n</div>\n```\n\n### Bot\xE3o\n```html\n<a class="elementor-button" href="url-destino">\n  <span class="elementor-button-content-wrapper">\n    <span class="elementor-button-text">Texto do Bot\xE3o</span>\n  </span>\n</a>\n```\n\n### Divider (Divisor)\n```html\n<hr class="elementor-divider">\n```\n\n### Espa\xE7ador\n```html\n<div class="elementor-spacer"></div>\n```\n\n### T\xEDtulo (Heading)\n```html\n<h2 class="elementor-heading-title">T\xEDtulo</h2>\n```\n\n### Editor de Texto (Text Editor)\n```html\n<div class="elementor-text-editor">\n  <p>Texto livre e formatado.</p>\n</div>\n```\n\n### Imagem em Galeria (Image Gallery)\n```html\n<div class="elementor-image-gallery">\n  <img src="img1.jpg">\n  <img src="img2.jpg">\n</div>\n```\n\n### Lista de \xCDcones (Icon List)\n```html\n<ul class="elementor-icon-list">\n  <li class="elementor-icon-list-item">\n    <span class="elementor-icon-list-icon"><i class="fas fa-check"></i></span>\n    <span class="elementor-icon-list-text">Item 1</span>\n  </li>\n</ul>\n```\n\n### Alerta\n```html\n<div class="elementor-alert">\n  <span class="elementor-alert-title">Aten\xE7\xE3o!</span>\n  <div class="elementor-alert-description">Mensagem informativa.</div>\n</div>\n```\n\n### M\xFAsica (SoundCloud)\n```html\n<iframe width="400" height="100" src="https://soundcloud.com"></iframe>\n```\n\n### Google Maps\n```html\n<div class="elementor-google-map">\n  <iframe src="URL-do-mapa"></iframe>\n</div>\n```\n\n### Abas (Tabs)\n```html\n<div class="elementor-tabs">\n  <div class="elementor-tabs-wrapper">\n    <div class="elementor-tab-title">Tab 1</div>\n    <div class="elementor-tab-title">Tab 2</div>\n  </div>\n  <div class="elementor-tabs-content-wrapper">\n    <div class="elementor-tab-content">Conte\xFAdo 1</div>\n    <div class="elementor-tab-content">Conte\xFAdo 2</div>\n  </div>\n</div>\n```\n\n### Acorde\xE3o (Accordion)\n```html\n<div class="elementor-accordion">\n  <div class="elementor-accordion-item">\n    <div class="elementor-accordion-title">T\xEDtulo do Acorde\xE3o</div>\n    <div class="elementor-accordion-content">Conte\xFAdo do Acorde\xE3o</div>\n  </div>\n</div>\n```\n\n### Barra de Progresso (Progress Bar)\n```html\n<div class="elementor-progress-bar">\n  <div class="elementor-progress-bar-fill" style="width:70%"></div>\n</div>\n```\n\n### Contador (Counter)\n```html\n<div class="elementor-counter">\n  <span class="elementor-counter-number">100</span>\n  <span class="elementor-counter-title">T\xEDtulo</span>\n</div>\n```\n\n### \xC1reas de HTML Customizado\n```html\n<div class="elementor-widget-html">\n  <!-- Seu c\xF3digo HTML personalizado aqui -->\n</div>\n```\n\n### Shortcode\n```html\n<div class="elementor-shortcode">\n  [seu_shortcode]\n</div>\n```\n\n## Widgets do Elementor Pro (Adicionais)\n\n### Formul\xE1rio (Form)\n```html\n<form class="elementor-form">\n  <input type="text" placeholder="Nome">\n  <input type="email" placeholder="Email">\n  <textarea placeholder="Mensagem"></textarea>\n  <button type="submit">Enviar</button>\n</form>\n```\n\n### Posts (Grade de Posts/Artigos)\n```html\n<div class="elementor-posts">\n  <article class="elementor-post">\n    <a href="url-do-post">\n      <img src="thumb.jpg" alt="">\n      <h2>T\xEDtulo do Post</h2>\n      <p>Resumo...</p>\n    </a>\n  </article>\n</div>\n```\n\n### Slides\n```html\n<div class="elementor-slides">\n  <div class="elementor-slide">Conte\xFAdo 1</div>\n  <div class="elementor-slide">Conte\xFAdo 2</div>\n</div>\n```\n\n### Testemunhos (Testimonials)\n```html\n<div class="elementor-testimonial">\n  <blockquote>Opini\xE3o do cliente</blockquote>\n  <cite>Nome do Cliente</cite>\n</div>\n```\n\n### Portf\xF3lio\n```html\n<div class="elementor-portfolio">\n  <div class="elementor-portfolio-item">\n    <img src="portfolio.jpg" alt="Projeto">\n    <span>Nome do Projeto</span>\n  </div>\n</div>\n```\n\n### Lista de Pre\xE7os\n```html\n<ul class="elementor-price-list">\n  <li><span class="elementor-price-list-item">Servi\xE7o</span> <span class="elementor-price">R$ 100</span></li>\n</ul>\n```\n\n### Tabela de Pre\xE7os\n```html\n<table class="elementor-price-table">\n  <thead><tr><th>Plano</th><th>Pre\xE7o</th></tr></thead>\n  <tbody><tr><td>Basic</td><td>R$ 50</td></tr></tbody>\n</table>\n```\n\n### Call to Action\n```html\n<div class="elementor-cta">\n  <h2>Chamada</h2>\n  <button>Saiba Mais</button>\n</div>\n```\n\n### Flip Box\n```html\n<div class="elementor-flip-box">\n  <div class="elementor-flip-box-front">Frente</div>\n  <div class="elementor-flip-box-back">Verso</div>\n</div>\n```\n\n### Carrossel de M\xEDdia/Site\n```html\n<div class="elementor-media-carousel">\n  <div class="elementor-carousel-item">Item 1</div>\n  <div class="elementor-carousel-item">Item 2</div>\n</div>\n```\n\n### Formul\xE1rio de Login\n```html\n<form class="elementor-login">\n  <input type="text" placeholder="Usu\xE1rio">\n  <input type="password" placeholder="Senha">\n  <button type="submit">Entrar</button>\n</form>\n```\n\n### Menu Personalizado\n```html\n<nav class="elementor-nav-menu">\n  <ul>\n    <li><a href="#">In\xEDcio</a></li>\n    <li><a href="#">Sobre</a></li>\n  </ul>\n</nav>\n```\n\n### Busca Din\xE2mica\n```html\n<form class="elementor-search">\n  <input type="search" placeholder="Buscar...">\n  <button type="submit">Buscar</button>\n</form>\n```\n\n### Lista de Conte\xFAdos Din\xE2mica\n```html\n<ul class="elementor-dynamic-content">\n  <li>Conte\xFAdo 1</li>\n  <li>Conte\xFAdo 2</li>\n</ul>\n```\n\n### Breadcrumbs\n```html\n<nav class="elementor-breadcrumbs">\n  <a href="#">Home</a> &gt; <a href="#">P\xE1gina</a>\n</nav>\n```\n\n### Widgets para WooCommerce\n```html\n<!-- Exemplo: Adicionar ao Carrinho -->\n<button class="woocommerce-add-to-cart">Adicionar ao Carrinho</button>\n<!-- Grid de Produtos -->\n<ul class="products">\n  <li class="product">\n    <a href="url-produto">\n      <img src="imagem.jpg" alt="">\n      <h2>Nome do Produto</h2>\n      <span class="price">R$ 59,00</span>\n    </a>\n  </li>\n</ul>\n<!-- Produtos Relacionados -->\n<div class="related-products">\n  ...\n</div>\n<!-- Filtros -->\n<form class="woocommerce-product-filter">\n  ...\n</form>\n```\n\n### Popup\n```html\n<div class="elementor-popup">\n  <h2>T\xEDtulo Popup</h2>\n  <p>Conte\xFAdo popup</p>\n</div>\n```\n\n## Widgets Nativos do WordPress\n\n### Arquivos\n```html\n<aside class="widget widget_archives">\n  <h2 class="widget-title">Arquivos</h2>\n  <ul>\n    <li><a href="#">Novembro 2025</a></li>\n  </ul>\n</aside>\n```\n\n### Agenda\n```html\n<aside class="widget widget_calendar">\n  <table>\n    <tr><td>Seg</td><td>Ter</td></tr>\n  </table>\n</aside>\n```\n\n### \xC1udio\n```html\n<audio controls src="audio.mp3"></audio>\n```\n\n### Calend\xE1rio\n```html\n<aside class="widget widget_calendar">\n  <table></table>\n</aside>\n```\n\n### Categorias\n```html\n<aside class="widget widget_categories">\n  <ul>\n    <li><a href="#">Categoria</a></li>\n  </ul>\n</aside>\n```\n\n### Galeria\n```html\n<div class="gallery">\n  <img src="img1.jpg"><img src="img2.jpg">\n</div>\n```\n\n### Imagem\n```html\n<img src="img.jpg" alt="Imagem">\n```\n\n### Menu Personalizado\n```html\n<nav class="widget_nav_menu">\n  <ul>\n    <li><a href="#">Home</a></li>\n  </ul>\n</nav>\n```\n\n### Meta\n```html\n<aside class="widget widget_meta">\n  <ul>\n    <li><a href="#">Login</a></li>\n  </ul>\n</aside>\n```\n\n### P\xE1gina\n```html\n<aside class="widget widget_pages">\n  <ul>\n    <li><a href="#">P\xE1gina 1</a></li>\n  </ul>\n</aside>\n```\n\n### Pesquisar\n```html\n<form class="search-form">\n  <input type="search">\n  <button type="submit">Buscar</button>\n</form>\n```\n\n### Coment\xE1rios Recentes\n```html\n<aside class="widget widget_recent_comments">\n  <ul>\n    <li>Coment\xE1rio</li>\n  </ul>\n</aside>\n```\n\n### Posts Recentes\n```html\n<aside class="widget widget_recent_entries">\n  <ul>\n    <li><a href="#">T\xEDtulo do Post</a></li>\n  </ul>\n</aside>\n```\n\n### RSS\n```html\n<aside class="widget widget_rss">\n  <ul>\n    <li>Feed</li>\n  </ul>\n</aside>\n```\n\n### Lista de Tags\n```html\n<div class="tagcloud">\n  <a href="#">tag1</a>\n  <a href="#">tag2</a>\n</div>\n```\n\n### V\xEDdeo\n```html\n<video controls src="video.mp4"></video>\n```\n\n## Widgets Nativos do WooCommerce\n\n### Carrinho\n```html\n<div class="widget_shopping_cart_content">\n  <ul class="woocommerce-mini-cart">\n    <li>Produto</li>\n  </ul>\n</div>\n```\n\n### Filtros ativos de produto\n```html\n<div class="widget_layered_nav_filters">\n  <ul>\n    <li>Filtro</li>\n  </ul>\n</div>\n```\n\n### Filtro por Atributo\n```html\n<div class="widget_layered_nav">\n  <ul>\n    <li>Atributo</li>\n  </ul>\n</div>\n```\n\n### Filtro por Pre\xE7o\n```html\n<div class="widget_price_filter">\n  <input type="range">\n</div>\n```\n\n### Filtro por Avalia\xE7\xE3o\n```html\n<div class="widget_rating_filter">\n  <ul>\n    <li>Estrelas</li>\n  </ul>\n</div>\n```\n\n### Lista/Categorias de Produto\n```html\n<ul class="product-categories">\n  <li>Categoria</li>\n</ul>\n```\n\n### Produtos em Destaque\n```html\n<ul class="product_list_widget">\n  <li>Produto Destaque</li>\n</ul>\n```\n\n### Produtos em Promo\xE7\xE3o\n```html\n<ul class="product_list_widget">\n  <li>Produto em Promo\xE7\xE3o</li>\n</ul>\n```\n\n### Produtos Recentes/Populares/Mais Vendidos\n```html\n<ul class="product_list_widget">\n  <li>Produto</li>\n</ul>\n```\n\n### Avalia\xE7\xF5es recentes de produto\n```html\n<ul class="woocommerce-widget-reviews">\n  <li>Avalia\xE7\xE3o</li>\n</ul>\n```\n\n### Nuvem de Tags do Produto\n```html\n<div class="woocommerce-product-tag-cloud">\n  <a href="#">tag-produto</a>\n</div>\n```\n\n### Pesquisa de Produtos\n```html\n<form class="woocommerce-product-search">\n  <input type="search">\n  <button type="submit">Buscar</button>\n</form>\n```\n';

  // src/reference_docs.ts
  var referenceDocs = [
    { name: "elementor-widgets-html-structure.md", content: elementor_widgets_html_structure_default },
    { name: "widgets-estrutural.md", content: widgets_estrutural_default }
  ];

  // src/deprecated/v1/adapter.ts
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
          const fills = n.fills;
          if (Array.isArray(fills) && fills.some((f) => f.type === "IMAGE")) {
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
          const fills = child.fills;
          if (Array.isArray(fills) && fills.some((f) => f.type === "IMAGE")) {
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
          if (grandChildren && grandChildren.some((gc) => gc.type === "VECTOR" || gc.fills && Array.isArray(gc.fills) && gc.fills.some((f) => f.type === "IMAGE"))) {
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

  // src/utils/debug.ts
  var debug = {
    log: (...args) => {
      console.log("[debug]", ...args);
    }
  };

  // src/pipeline.ts
  var ConversionPipeline = class {
    constructor() {
      __publicField(this, "compiler");
      __publicField(this, "imageUploader");
      __publicField(this, "autoFixLayout", false);
      __publicField(this, "autoRename", false);
      __publicField(this, "deterministicPipeline");
      this.compiler = new ElementorCompiler();
      this.imageUploader = new ImageUploader({});
    }
    /**
     * Permite injetar o pipeline determinístico sem alterar o comportamento atual.
     */
    attachDeterministicPipeline(pipeline2) {
      this.deterministicPipeline = pipeline2;
    }
    async run(node, wpConfig = {}, options) {
      const normalizedWP = __spreadProps(__spreadValues({}, wpConfig), { password: (wpConfig == null ? void 0 : wpConfig.password) || (wpConfig == null ? void 0 : wpConfig.token) });
      this.compiler.setWPConfig(normalizedWP);
      this.imageUploader.setWPConfig(normalizedWP);
      const provider = (options == null ? void 0 : options.provider) || geminiProvider;
      this.autoFixLayout = !!(options == null ? void 0 : options.autoFixLayout);
      this.autoRename = !!(options == null ? void 0 : options.autoRename);
      const decision = this.shouldUseDeterministic(options);
      if (decision.allowed && this.deterministicPipeline) {
        debug.log("deterministic_pipeline:start", { diffMode: options == null ? void 0 : options.deterministicDiffMode, nodeId: node.id });
        const deterministicResult = await this.runDeterministicFlow(node, wpConfig, normalizedWP, options);
        debug.log("deterministic_pipeline:end", __spreadValues({}, this.summarizeSchema(deterministicResult.schema)));
        if (options == null ? void 0 : options.deterministicDiffMode) {
          const legacyResult2 = await this.runLegacyFlow(node, wpConfig, normalizedWP, provider, options);
          const diffSnapshot = this.compareDeterministicSchemas(options.deterministicDiffMode, deterministicResult.schema, legacyResult2.schema);
          debug.log("deterministic_pipeline:diff", diffSnapshot);
          return this.formatRunResult(legacyResult2, options);
        }
        return this.formatRunResult(deterministicResult, options);
      }
      if (options == null ? void 0 : options.useDeterministic) {
        console.info("[PIPELINE] Deterministic pipeline desativado:", decision.reason || "motivo desconhecido");
      }
      const legacyResult = await this.runLegacyFlow(node, wpConfig, normalizedWP, provider, options);
      return this.formatRunResult(legacyResult, options);
    }
    formatRunResult(result, options) {
      if (options == null ? void 0 : options.debug) {
        return { elementorJson: result.elementorJson, debugInfo: result.debugInfo || null };
      }
      return result.elementorJson;
    }
    async runLegacyFlow(node, originalWP, normalizedWP, provider, options) {
      const preprocessed = this.preprocess(node);
      const screenshot = (options == null ? void 0 : options.includeScreenshot) === false ? null : await this.captureNodeImage(preprocessed.serializedRoot.id);
      const schema = await this.generateSchema(preprocessed, provider, options == null ? void 0 : options.apiKey, {
        includeReferences: (options == null ? void 0 : options.includeReferences) !== false,
        screenshot
      });
      this.validateAndNormalize(schema, preprocessed.serializedRoot, preprocessed.tokens);
      validatePipelineSchema(schema);
      this.hydrateStyles(schema, preprocessed.flatNodes);
      await this.resolveImages(schema, normalizedWP);
      await this.syncNavMenus(schema, preprocessed.serializedRoot, normalizedWP);
      this.logSchemaSummary(schema);
      const includeDebug = !!(options == null ? void 0 : options.debug) || !!(options == null ? void 0 : options.deterministicDiffMode);
      return this.buildExecutionResult(schema, originalWP, preprocessed, includeDebug);
    }
    async runDeterministicFlow(node, originalWP, normalizedWP, options) {
      if (!this.deterministicPipeline) {
        throw new Error("Deterministic pipeline indisponivel.");
      }
      const preprocessed = this.preprocess(node);
      const canUpload = this.canUploadMedia(normalizedWP);
      const simulateUploads = !!(options == null ? void 0 : options.deterministicDiffMode) || !canUpload;
      const deterministicOptions = {
        media: { simulate: simulateUploads }
      };
      if (canUpload) {
        deterministicOptions.wpConfig = normalizedWP;
      }
      const deterministicResult = await this.deterministicPipeline.run(node, deterministicOptions);
      const schema = deterministicResult.schema;
      this.validateAndNormalize(schema, preprocessed.serializedRoot, preprocessed.tokens);
      validatePipelineSchema(schema);
      this.hydrateStyles(schema, preprocessed.flatNodes);
      await this.syncNavMenus(schema, preprocessed.serializedRoot, normalizedWP);
      this.logSchemaSummary(schema);
      const includeDebug = !!(options == null ? void 0 : options.debug) || !!(options == null ? void 0 : options.deterministicDiffMode);
      return this.buildExecutionResult(schema, originalWP, preprocessed, includeDebug);
    }
    buildExecutionResult(schema, originalWP, preprocessed, includeDebug) {
      const elementorJson = this.compiler.compile(schema);
      if (originalWP.url) {
        let siteurl = originalWP.url;
        if (!siteurl.endsWith("/")) siteurl += "/";
        if (!siteurl.endsWith("wp-json/")) siteurl += "wp-json/";
        elementorJson.siteurl = siteurl;
      }
      validateElementorJSON(elementorJson);
      let debugInfo = null;
      if (includeDebug) {
        debugInfo = this.createDebugInfo(preprocessed, schema, elementorJson);
      }
      return { elementorJson, schema, debugInfo };
    }
    createDebugInfo(preprocessed, schema, elementorJson) {
      const coverage = computeCoverage(preprocessed.flatNodes, schema, elementorJson);
      return {
        serializedTree: preprocessed.serializedRoot,
        flatNodes: preprocessed.flatNodes,
        schema,
        elementor: elementorJson,
        coverage
      };
    }
    summarizeSchema(schema) {
      var _a;
      let containers = 0;
      let widgets = 0;
      const walk = (container) => {
        var _a2, _b;
        containers += 1;
        widgets += ((_a2 = container.widgets) == null ? void 0 : _a2.length) || 0;
        (_b = container.children) == null ? void 0 : _b.forEach(walk);
      };
      (_a = schema.containers) == null ? void 0 : _a.forEach(walk);
      return { totalContainers: containers, totalWidgets: widgets };
    }
    logSchemaSummary(schema) {
      var _a, _b, _c, _d, _e;
      const root = (_a = schema == null ? void 0 : schema.containers) == null ? void 0 : _a[0];
      console.log("[PIPELINE] Schema root container:", JSON.stringify({
        id: root == null ? void 0 : root.id,
        widgets: ((_b = root == null ? void 0 : root.widgets) == null ? void 0 : _b.length) || 0,
        widgetTypes: ((_c = root == null ? void 0 : root.widgets) == null ? void 0 : _c.map((w) => w.type)) || [],
        children: ((_d = root == null ? void 0 : root.children) == null ? void 0 : _d.length) || 0,
        childrenIds: ((_e = root == null ? void 0 : root.children) == null ? void 0 : _e.map((c) => c.id)) || []
      }, null, 2));
    }
    compareDeterministicSchemas(mode, deterministic, legacy) {
      const deterministicJson = JSON.stringify(deterministic);
      const legacyJson = JSON.stringify(legacy);
      const matches = deterministicJson === legacyJson;
      const snapshot = {
        matches,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        deterministicSize: deterministicJson.length,
        legacySize: legacyJson.length
      };
      if (matches) {
        console.info("[PIPELINE] Deterministic diff: schemas identicos.", snapshot);
        if (mode === "store") {
          globalThis.__FIGTOEL_DETERMINISTIC_DIFF = snapshot;
        }
        return snapshot;
      }
      const diffPayload = __spreadProps(__spreadValues({}, snapshot), {
        deterministicPreview: deterministicJson.slice(0, 1e3),
        legacyPreview: legacyJson.slice(0, 1e3)
      });
      if (mode === "store") {
        globalThis.__FIGTOEL_DETERMINISTIC_DIFF = __spreadProps(__spreadValues({}, diffPayload), {
          deterministicSchema: deterministic,
          legacySchema: legacy
        });
      } else {
        console.warn("[PIPELINE] Deterministic diff detectado.", diffPayload);
      }
      return __spreadProps(__spreadValues({}, snapshot), { details: diffPayload });
    }
    shouldUseDeterministic(options) {
      if (!(options == null ? void 0 : options.useDeterministic)) {
        return { allowed: false, reason: "Flag desativada" };
      }
      if (!this.deterministicPipeline) {
        return { allowed: false, reason: "Pipeline deterministico indisponivel" };
      }
      if (options.deterministicDiffMode && !["log", "store"].includes(options.deterministicDiffMode)) {
        return { allowed: false, reason: "Modo diff invalido" };
      }
      return { allowed: true };
    }
    canUploadMedia(config) {
      if (!config || !config.url) return false;
      const user = config == null ? void 0 : config.user;
      const password = (config == null ? void 0 : config.password) || (config == null ? void 0 : config.token);
      return !!(user && password && (config == null ? void 0 : config.exportImages));
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
    async captureNodeImage(nodeId) {
      if (!nodeId) return null;
      const node = figma.getNodeById(nodeId);
      if (!node || !("exportAsync" in node)) return null;
      try {
        const bytes = await node.exportAsync({ format: "PNG" });
        const base64 = this.uint8ToBase64(bytes);
        const name = node.name || "frame";
        const size = node.width && node.height ? { width: node.width, height: node.height } : {};
        return __spreadValues({ data: base64, mimeType: "image/png", name }, size);
      } catch (err) {
        console.warn("Falha ao exportar imagem do frame:", err);
        return null;
      }
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
    async generateSchema(pre, provider, apiKey, extras) {
      console.log("Generating Base Schema (Algorithm)...");
      const baseSchema = convertToFlexSchema(pre.serializedRoot);
      console.log("Optimizing Schema (AI)...");
      const prompt = `${OPTIMIZE_SCHEMA_PROMPT}

SCHEMA BASE:
${JSON.stringify(baseSchema, null, 2)}
`;
      const references = (extras == null ? void 0 : extras.includeReferences) === false ? [] : referenceDocs;
      try {
        const schemaRequest = {
          prompt,
          snapshot: pre.serializedRoot,
          instructions: "Otimize o schema JSON fornecido mantendo IDs e dados.",
          references
        };
        if (apiKey) {
          schemaRequest.apiKey = apiKey;
        }
        if (extras == null ? void 0 : extras.screenshot) {
          schemaRequest.image = extras.screenshot;
        }
        const response = await provider.generateSchema(schemaRequest);
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _i;
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
            const hasExplicitChildren = (_d = base.children) == null ? void 0 : _d.some(
              (c) => {
                var _a2;
                return ((_a2 = c.styles) == null ? void 0 : _a2.sourceName) && (c.styles.sourceName.startsWith("w:") || c.styles.sourceName.startsWith("c:")) || c.widgets && c.widgets.length > 0;
              }
            );
            const isCollapsing = (((_e = base.children) == null ? void 0 : _e.length) || 0) > 1 && ai.widgets.length === 1;
            const isGenericWidget = ["image-box", "icon-box"].includes((_f = ai.widgets[0]) == null ? void 0 : _f.type);
            if (hasExplicitChildren && isCollapsing && isGenericWidget) {
              console.warn(`[Merge] Preventing AI from collapsing explicit children of ${base.id} into ${ai.widgets[0].type}`);
            } else {
              merged.widgets = ai.widgets.map((w) => {
                var _a2, _b2;
                return __spreadProps(__spreadValues({}, w), {
                  styles: __spreadProps(__spreadValues({}, w.styles || {}), {
                    sourceId: ((_a2 = w.styles) == null ? void 0 : _a2.sourceId) || w.sourceId || ((_b2 = base.styles) == null ? void 0 : _b2.sourceId) || base.id
                  })
                });
              });
            }
          }
          if (Array.isArray(ai.children)) {
            const isBaseWidget = (_g = base.widgets) == null ? void 0 : _g.some((w) => ["button", "video", "image", "icon"].includes(w.type));
            if (isBaseWidget && ai.children.length > 0) {
              console.warn(`[Merge] Ignoring AI children for widget-container ${base.id} (${(_i = (_h = base.widgets) == null ? void 0 : _h[0]) == null ? void 0 : _i.type}). Keeping as widget.`);
              if (!merged.widgets && base.widgets) {
                merged.widgets = base.widgets;
              }
            } else {
              merged.children = ai.children.map((child) => mergeContainer(child));
              return merged;
            }
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
    async resolveImages(schema, wpConfig) {
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
      const uploadNodeImage = async (nodeId, preferSvg = false) => {
        if (!nodeId) return null;
        const node = figma.getNodeById(nodeId);
        if (!node) {
          console.error(`[PIPELINE] \u274C Node not found for upload: ${nodeId}`);
          return null;
        }
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
        console.log(`[PIPELINE] \u{1F4E4} Uploading ${preferSvg ? "ICON" : "IMAGE"} for node ${node.name} (${node.id}) as ${format}`);
        return this.imageUploader.uploadToWordPress(node, format);
      };
      const processWidget = async (widget) => {
        var _a, _b, _c, _d, _e, _f;
        console.log(`[PIPELINE] Processing widget: ${widget.type} (ID: ${widget.imageId || "none"})`);
        if (widget.imageId && (widget.type === "image" || widget.type === "custom" || widget.type === "icon" || widget.type === "image-box" || widget.type === "icon-box" || widget.type === "icon-list" || widget.type === "list-item")) {
          try {
            const result = await uploadNodeImage(widget.imageId, widget.type === "icon" || widget.type === "icon-box" || widget.type === "icon-list" || widget.type === "list-item");
            if (result) {
              if (widget.type === "image-box") {
                if (!widget.styles) widget.styles = {};
                widget.styles.image_url = result.url;
              } else if (widget.type === "icon-box") {
                if (!widget.styles) widget.styles = {};
                widget.styles.selected_icon = { value: { id: result.id, url: result.url }, library: "svg" };
              } else if (widget.type === "icon") {
                if (!widget.styles) widget.styles = {};
                widget.styles.selected_icon = { value: { id: result.id, url: result.url }, library: "svg" };
              } else if (((_a = widget.styles) == null ? void 0 : _a.icon) && widget.type === "icon-list") {
                widget.styles.icon = { value: { id: result.id, url: result.url }, library: "svg" };
              } else if (widget.type === "list-item") {
                if (!widget.styles) widget.styles = {};
                widget.styles.icon_url = result.url;
              } else {
                widget.content = result.url;
              }
              widget.imageId = result.id.toString();
            }
          } catch (e) {
            console.error("Failed to upload image for widget:", widget.type, e);
          }
        }
        if (widget.type === "image-carousel" && ((_b = widget.styles) == null ? void 0 : _b.slides) && Array.isArray(widget.styles.slides)) {
          const uploads = widget.styles.slides.map(async (slide, idx) => {
            const nodeId = (slide == null ? void 0 : slide.id) || (slide == null ? void 0 : slide.imageId);
            if (!nodeId) return;
            try {
              const result = await uploadNodeImage(nodeId, false);
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
          });
          await Promise.all(uploads);
        }
        if ((widget.type === "gallery" || widget.type === "basic-gallery") && ((_c = widget.styles) == null ? void 0 : _c.gallery) && Array.isArray(widget.styles.gallery)) {
          const uploads = widget.styles.gallery.map(async (imageItem) => {
            const nodeId = (imageItem == null ? void 0 : imageItem.id) || (imageItem == null ? void 0 : imageItem.imageId);
            if (!nodeId) return;
            try {
              const result = await uploadNodeImage(nodeId, false);
              if (result) {
                imageItem.url = result.url;
                const parsedId = parseInt(String(result.id), 10);
                imageItem.id = isNaN(parsedId) ? "" : parsedId;
              }
            } catch (e) {
              console.error(`[Pipeline] Erro ao processar imagem da galeria ${nodeId}:`, e);
            }
          });
          await Promise.all(uploads);
          widget.styles.gallery = widget.styles.gallery.filter((item) => item.url && item.id);
        }
        if (widget.type === "button") {
          const iconValue = (_e = (_d = widget.styles) == null ? void 0 : _d.selected_icon) == null ? void 0 : _e.value;
          if (iconValue && typeof iconValue === "object" && iconValue.id) {
            if ((_f = widget.styles) == null ? void 0 : _f.sourceId) {
              const buttonNode = figma.getNodeById(widget.styles.sourceId);
              if (buttonNode && "children" in buttonNode) {
                const iconChild = buttonNode.children.find((c) => c.name === "Icon" || c.type === "VECTOR" || c.name.toLowerCase().includes("icon"));
                if (iconChild) {
                  try {
                    const result = await uploadNodeImage(iconChild.id, true);
                    if (result) {
                      widget.styles.selected_icon = { value: { id: result.id, url: result.url }, library: "svg" };
                    }
                  } catch (e) {
                    console.error(`[Pipeline] Failed to upload button icon ${iconChild.id}:`, e);
                  }
                }
              }
            }
          }
        }
      };
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
        await Promise.all(uploadPromises);
      }
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
            const childNameLower = (child.name || "").toLowerCase();
            if (childNameLower === "w:inner-container" || childNameLower === "c:inner-container") {
              continue;
            }
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
    /**
     * Sync nav-menus to WordPress via figtoel-remote-menus plugin
     */
    async syncNavMenus(schema, root, wpConfig) {
      var _a;
      console.log("[NAV MENU SYNC] ========== START ==========");
      console.log("[NAV MENU SYNC] WPConfig:", { url: wpConfig.url, user: wpConfig.user, hasPassword: !!(wpConfig.password || wpConfig.token) });
      const syncEnabled = !!(wpConfig && wpConfig.url && wpConfig.user && (wpConfig.password || wpConfig.token));
      if (!syncEnabled) {
        console.log("[NAV MENU SYNC] \u274C Skipped: WordPress config not provided.");
        return;
      }
      const navMenus = [];
      const collect = (container) => {
        if (container.widgets) {
          for (const widget of container.widgets) {
            if (widget.type === "nav-menu") {
              navMenus.push({ widget, container });
            }
          }
        }
        if (container.children) {
          for (const child of container.children) {
            collect(child);
          }
        }
      };
      schema.containers.forEach((c) => collect(c));
      console.log(`[NAV MENU SYNC] Collected ${navMenus.length} nav-menu widget(s):`, navMenus.map((m) => ({ widgetType: m.widget.type, content: m.widget.content })));
      if (navMenus.length === 0) {
        console.log("[NAV MENU SYNC] No nav-menu widgets found.");
        return;
      }
      console.log(`[NAV MENU SYNC] Found ${navMenus.length} nav-menu(s). Syncing to WordPress...`);
      for (const { widget, container } of navMenus) {
        try {
          const sourceId = ((_a = widget.styles) == null ? void 0 : _a.sourceId) || container.id;
          const figmaNode = figma.getNodeById(sourceId);
          if (!figmaNode || !("children" in figmaNode)) {
            console.warn(`[NAV MENU SYNC] Cannot find Figma node for nav-menu: ${sourceId}`);
            continue;
          }
          const items = this.extractMenuItems(figmaNode);
          const menuName = widget.content || figmaNode.name || "Menu Principal";
          const payload = {
            menu_name: menuName,
            menu_location: "primary",
            // Default location
            replace_existing: true,
            items
          };
          const url = `${wpConfig.url}/wp-json/figtoel-remote-menus/v1/sync`;
          const btoaPolyfill = (str) => {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            let output = "";
            let i = 0;
            while (i < str.length) {
              const a = str.charCodeAt(i++);
              const b = i < str.length ? str.charCodeAt(i++) : 0;
              const c = i < str.length ? str.charCodeAt(i++) : 0;
              const bitmap = a << 16 | b << 8 | c;
              output += chars.charAt(bitmap >> 18 & 63);
              output += chars.charAt(bitmap >> 12 & 63);
              output += chars.charAt(b ? bitmap >> 6 & 63 : 64);
              output += chars.charAt(c ? bitmap & 63 : 64);
            }
            return output;
          };
          const auth = "Basic " + btoaPolyfill(`${wpConfig.user}:${wpConfig.password || wpConfig.token}`);
          console.log(`[NAV MENU SYNC] Posting to ${url}...`, payload);
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": auth
            },
            body: JSON.stringify(payload)
          });
          const result = await response.json();
          if (response.ok && result.success) {
            console.log(`[NAV MENU SYNC] \u2705 Menu "${menuName}" synced successfully. Items created: ${result.items_created}`);
            figma.ui.postMessage({ type: "log", level: "success", message: `Menu "${menuName}" criado no WordPress com ${result.items_created} itens.` });
          } else {
            console.error(`[NAV MENU SYNC] \u274C Failed to sync menu "${menuName}":`, result);
            figma.ui.postMessage({ type: "log", level: "error", message: `Erro ao criar menu "${menuName}": ${result.error || "Desconhecido"}` });
          }
        } catch (error) {
          console.error(`[NAV MENU SYNC] Exception:`, error);
          figma.ui.postMessage({ type: "log", level: "error", message: `Erro ao sincronizar menu: ${error}` });
        }
      }
    }
    /**
     * Extract menu items from a nav-menu Figma node
     */
    extractMenuItems(navMenuNode) {
      const items = [];
      if (!navMenuNode.children) return items;
      console.log(`[NAV MENU SYNC] Nav menu has ${navMenuNode.children.length} children`);
      for (const child of navMenuNode.children) {
        console.log(`[NAV MENU SYNC] Processing child: ${child.name} Type: ${child.type}`);
        if (child.type === "TEXT") {
          const title = child.characters;
          const url = "#";
          items.push({ title, url });
          console.log(`[NAV MENU SYNC] \u2705 Added TEXT menu item: ${title}`);
          continue;
        }
        if (child.type === "FRAME" || child.type === "GROUP") {
          let title = child.name;
          if ("children" in child) {
            const textChild = child.children.find((c) => c.type === "TEXT");
            if (textChild) {
              title = textChild.characters;
            }
          }
          const url = "#";
          items.push({ title, url });
          console.log(`[NAV MENU SYNC] \u2705 Added ${child.type} menu item: ${title}`);
        }
      }
      console.log(`[NAV MENU SYNC] Extracted ${items.length} menu items from ${navMenuNode.name}`);
      return items;
    }
  };

  // src/api_openai.ts
  var OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
  var DEFAULT_TIMEOUT_MS2 = 12e3;
  var DEFAULT_GPT_MODEL = "gpt-4.1-mini";
  async function fetchWithTimeout2(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS2) {
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
      return await fetch(url, options);
    }
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, __spreadProps(__spreadValues({}, options), { signal: controller.signal }));
      return resp;
    } finally {
      clearTimeout(id);
    }
  }
  async function getOpenAIKey() {
    return await figma.clientStorage.getAsync("gpt_api_key");
  }
  async function saveOpenAIModel(model) {
    await figma.clientStorage.setAsync("gpt_model", model);
  }
  function cleanJson2(content) {
    return content.replace(/```json/gi, "").replace(/```/g, "").trim();
  }
  async function parseJsonResponse(rawContent) {
    const clean = cleanJson2(rawContent);
    try {
      return JSON.parse(clean);
    } catch (err) {
      throw new Error("Resposta nao JSON");
    }
  }
  var JSON_SAFETY = "Responda sempre em JSON (json) valido e completo.";
  function mapStatusError(status, parsed) {
    var _a;
    const base = (_a = parsed == null ? void 0 : parsed.error) == null ? void 0 : _a.message;
    if (status === 401) return "API Key invalida (401).";
    if (status === 404) return "Modelo nao encontrado (404).";
    if (status === 429) return "Quota excedida (429).";
    if (status >= 500) return "Erro interno da OpenAI (5xx).";
    return base || `HTTP ${status}`;
  }
  async function callOpenAI(apiKey, model, messages, maxTokens = 8192, retries = 3) {
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
        const response = await fetchWithTimeout2(OPENAI_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          const rawText = await response.text();
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
          await new Promise((res) => setTimeout(res, 500 * attempt));
          continue;
        }
        const data = await response.json();
        const content = (_c = (_b = (_a = data == null ? void 0 : data.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content;
        if (!content) {
          return { ok: false, error: "Resposta vazia da OpenAI.", raw: data };
        }
        try {
          const schema = await parseJsonResponse(content);
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
        await new Promise((res) => setTimeout(res, 500 * attempt));
      }
    }
    return { ok: false, error: "Falha ao chamar OpenAI apos retries." };
  }
  async function testOpenAIConnection(apiKey, model) {
    const messages = [
      { role: "system", content: `${JSON_SAFETY} Retorne {"pong": true}.` },
      { role: "user", content: "ping (json)" }
    ];
    const resp = await callOpenAI(apiKey, model, messages, 64, 1);
    if (resp.ok) {
      return { ok: true, message: "Conexao com OpenAI verificada.", raw: resp.raw };
    }
    const message = resp.error || "Falha ao testar OpenAI.";
    const result = {
      ok: false,
      message,
      raw: resp.raw
    };
    if (resp.error) {
      result.error = resp.error;
    }
    return result;
  }
  var openaiProvider = {
    id: "gpt",
    model: DEFAULT_GPT_MODEL,
    setModel(model) {
      this.model = model;
      saveOpenAIModel(model).catch(() => {
      });
    },
    async generateSchema(input) {
      var _a;
      const apiKey = input.apiKey || await getOpenAIKey();
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
      const resp = await callOpenAI(apiKey, model, messages);
      if (!resp.ok) return resp;
      if (resp.schema) {
        return { ok: true, schema: resp.schema, data: resp.data, raw: resp.raw };
      }
      return { ok: true, data: resp.data, raw: resp.raw };
    },
    async testConnection(apiKey) {
      const keyToTest = apiKey || await getOpenAIKey();
      const model = this.model;
      if (!keyToTest) {
        return { ok: false, error: "API Key do OpenAI nao configurada.", message: "API Key do OpenAI nao configurada." };
      }
      return await testOpenAIConnection(keyToTest, model);
    }
  };

  // src/utils/logger.ts
  var FileLogger = class {
    constructor(originalConsoleLog) {
      __publicField(this, "logs", []);
      __publicField(this, "sessionStart");
      __publicField(this, "maxLogs", 1e3);
      // Prevent memory issues
      __publicField(this, "originalLog");
      this.originalLog = originalConsoleLog || console.log.bind(console);
      this.sessionStart = (/* @__PURE__ */ new Date()).toISOString();
      this.log("=".repeat(80));
      this.log(`[SESSION START] ${this.sessionStart}`);
      this.log("=".repeat(80));
    }
    /**
     * Log a message (replaces console.log)
     */
    log(...args) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[1].split(".")[0];
      const message = args.map((arg) => {
        if (typeof arg === "object") {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(" ");
      const logEntry = `[${timestamp}] ${message}`;
      this.logs.push(logEntry);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
      this.originalLog(...args);
    }
    /**
     * Get all logs as a single string
     */
    getLogs() {
      return this.logs.join("\n");
    }
    /**
     * Save logs to a file (called from UI)
     */
    saveToFile() {
      const content = this.getLogs();
      const filename = `test-logs-${this.sessionStart.replace(/:/g, "-").split(".")[0]}.txt`;
      return content;
    }
    /**
     * Clear all logs
     */
    clear() {
      this.logs = [];
      this.sessionStart = (/* @__PURE__ */ new Date()).toISOString();
      this.log("=".repeat(80));
      this.log(`[SESSION CLEARED] ${this.sessionStart}`);
      this.log("=".repeat(80));
    }
    /**
     * Add a test marker
     */
    startTest(testName) {
      this.log("");
      this.log("\u2550".repeat(80));
      this.log(`TEST START: ${testName}`);
      this.log("\u2550".repeat(80));
    }
    /**
     * End test marker
     */
    endTest(testName, passed) {
      this.log("\u2500".repeat(80));
      this.log(`TEST END: ${testName} - ${passed ? "\u2705 PASSED" : "\u274C FAILED"}`);
      this.log("\u2550".repeat(80));
      this.log("");
    }
  };

  // src/linter/detectors/WidgetDetector.ts
  var WidgetDetector = class {
    constructor() {
      __publicField(this, "rules", []);
      this.initializeRules();
    }
    /**
     * Detecta qual widget Elementor melhor representa o node
     */
    detect(node) {
      const detections = [];
      for (const rule of this.rules) {
        const confidence = rule.matcher(node);
        if (confidence > 0) {
          detections.push({
            widget: rule.widget,
            confidence,
            justification: this.generateJustification(node, rule.widget, confidence)
          });
        }
      }
      detections.sort((a, b) => b.confidence - a.confidence);
      const best = detections[0];
      if (!best || best.confidence < 0.3) {
        return null;
      }
      return {
        node_id: node.id,
        node_name: node.name,
        widget: best.widget,
        confidence: best.confidence,
        justification: best.justification
      };
    }
    /**
     * Detecta múltiplos widgets em uma árvore
     */
    detectAll(root) {
      const results = [];
      const traverse = (node) => {
        const detection = this.detect(node);
        if (detection) {
          results.push(detection);
        }
        if ("children" in node && node.children) {
          for (const child of node.children) {
            traverse(child);
          }
        }
      };
      traverse(root);
      return results;
    }
    /**
     * Inicializa todas as regras de detecção
     */
    initializeRules() {
      this.addRule("w:heading", "basic", this.matchHeading.bind(this));
      this.addRule("w:text-editor", "basic", this.matchTextEditor.bind(this));
      this.addRule("w:button", "basic", this.matchButton.bind(this));
      this.addRule("w:image", "basic", this.matchImage.bind(this));
      this.addRule("w:icon", "basic", this.matchIcon.bind(this));
      this.addRule("w:video", "basic", this.matchVideo.bind(this));
      this.addRule("w:divider", "basic", this.matchDivider.bind(this));
      this.addRule("w:spacer", "basic", this.matchSpacer.bind(this));
      this.addRule("w:image-box", "basic", this.matchImageBox.bind(this));
      this.addRule("w:icon-box", "basic", this.matchIconBox.bind(this));
      this.addRule("w:star-rating", "basic", this.matchStarRating.bind(this));
      this.addRule("w:counter", "basic", this.matchCounter.bind(this));
      this.addRule("w:progress", "basic", this.matchProgress.bind(this));
      this.addRule("w:tabs", "basic", this.matchTabs.bind(this));
      this.addRule("w:accordion", "basic", this.matchAccordion.bind(this));
      this.addRule("w:toggle", "basic", this.matchToggle.bind(this));
      this.addRule("w:alert", "basic", this.matchAlert.bind(this));
      this.addRule("w:social-icons", "basic", this.matchSocialIcons.bind(this));
      this.addRule("w:icon-list", "basic", this.matchIconList.bind(this));
      this.addRule("w:nav-menu", "basic", this.matchNavMenu.bind(this));
      this.addRule("w:search-form", "basic", this.matchSearchForm.bind(this));
      this.addRule("w:testimonial", "basic", this.matchTestimonial.bind(this));
      this.addRule("w:container", "basic", this.matchContainer.bind(this));
      this.addRule("w:form", "pro", this.matchForm.bind(this));
      this.addRule("w:login", "pro", this.matchLogin.bind(this));
      this.addRule("w:call-to-action", "pro", this.matchCTA.bind(this));
      this.addRule("w:portfolio", "pro", this.matchPortfolio.bind(this));
      this.addRule("w:flip-box", "pro", this.matchFlipBox.bind(this));
      this.addRule("w:animated-headline", "pro", this.matchAnimatedHeadline.bind(this));
      this.addRule("w:countdown", "pro", this.matchCountdown.bind(this));
      this.addRule("w:price-table", "pro", this.matchPriceTable.bind(this));
      this.addRule("w:price-list", "pro", this.matchPriceList.bind(this));
      this.addRule("w:post-title", "pro", this.matchGenericText.bind(this));
      this.addRule("w:post-excerpt", "pro", this.matchGenericText.bind(this));
      this.addRule("w:post-content", "pro", this.matchGenericText.bind(this));
      this.addRule("w:share-buttons", "pro", this.matchSocialIcons.bind(this));
      this.addRule("w:slideshow", "pro", this.matchPortfolio.bind(this));
      this.addRule("w:gallery-pro", "pro", this.matchPortfolio.bind(this));
      this.addRule("woo:product-title", "woo", this.matchWooProductTitle.bind(this));
      this.addRule("woo:product-image", "woo", this.matchWooProductImage.bind(this));
      this.addRule("woo:product-price", "woo", this.matchWooProductPrice.bind(this));
      this.addRule("woo:product-add-to-cart", "woo", this.matchWooAddToCart.bind(this));
      this.addRule("woo:product-rating", "woo", this.matchWooProductRating.bind(this));
      this.addRule("woo:checkout", "woo", this.matchForm.bind(this));
      this.addRule("loop:image", "loop", this.matchImage.bind(this));
      this.addRule("loop:title", "loop", this.matchHeading.bind(this));
      this.addRule("loop:meta", "loop", this.matchGenericText.bind(this));
      this.addRule("loop:terms", "loop", this.matchGenericText.bind(this));
      this.addRule("loop:rating", "loop", this.matchStarRating.bind(this));
      this.addRule("loop:price", "loop", this.matchGenericText.bind(this));
      this.addRule("loop:add-to-cart", "loop", this.matchButton.bind(this));
      this.addRule("loop:read-more", "loop", this.matchButton.bind(this));
      this.addRule("loop:featured-image", "loop", this.matchImage.bind(this));
      this.addRule("w:wp-search", "wordpress", this.matchSearchForm.bind(this));
      this.addRule("w:wp-custom-menu", "wordpress", this.matchNavMenu.bind(this));
      this.addRule("w:gallery", "basic", this.matchGallery.bind(this));
      this.addRule("w:image-carousel", "basic", this.matchImageCarousel.bind(this));
      this.addRule("w:basic-gallery", "basic", this.matchGallery.bind(this));
      this.addRule("w:google-maps", "basic", this.matchGoogleMaps.bind(this));
      this.addRule("w:embed", "basic", this.matchEmbed.bind(this));
      this.addRule("w:lottie", "basic", this.matchLottie.bind(this));
      this.addRule("w:shortcode", "basic", this.matchShortcode.bind(this));
      this.addRule("w:html", "basic", this.matchHTML.bind(this));
      this.addRule("w:menu-anchor", "basic", this.matchMenuAnchor.bind(this));
      this.addRule("w:sidebar", "basic", this.matchSidebar.bind(this));
      this.addRule("w:read-more", "basic", this.matchReadMore.bind(this));
      this.addRule("w:soundcloud", "basic", this.matchSoundcloud.bind(this));
      this.addRule("loop:grid", "basic", this.matchLoopGrid.bind(this));
      this.addRule("woo:product-breadcrumb", "woo", this.matchWooBreadcrumb.bind(this));
      this.addRule("woo:products", "woo", this.matchWooProducts.bind(this));
      this.addRule("woo:product-grid", "woo", this.matchWooProductGrid.bind(this));
      this.addRule("woo:product-carousel", "woo", this.matchWooProductCarousel.bind(this));
      this.addRule("woo:loop-product-title", "woo", this.matchGenericText.bind(this));
      this.addRule("woo:loop-product-price", "woo", this.matchGenericText.bind(this));
      this.addRule("woo:loop-product-image", "woo", this.matchImage.bind(this));
      this.addRule("woo:loop-product-button", "woo", this.matchButton.bind(this));
      this.addRule("woo:product-data-tabs", "woo", this.matchWooProductTabs.bind(this));
      this.addRule("woo:product-excerpt", "woo", this.matchGenericText.bind(this));
      this.addRule("woo:product-stock", "woo", this.matchWooProductStock.bind(this));
      this.addRule("woo:product-meta", "woo", this.matchWooProductMeta.bind(this));
      this.addRule("w:subscription", "pro", this.matchSubscription.bind(this));
      this.addRule("w:media-carousel", "pro", this.matchMediaCarousel.bind(this));
      this.addRule("w:slider-slides", "pro", this.matchSliderSlides.bind(this));
      this.addRule("w:post-navigation", "pro", this.matchPostNavigation.bind(this));
      this.addRule("w:table-of-contents", "pro", this.matchTableOfContents.bind(this));
      this.addRule("w:blockquote", "pro", this.matchBlockquote.bind(this));
      this.addRule("w:testimonial-carousel", "pro", this.matchTestimonialCarousel.bind(this));
      this.addRule("w:review-box", "pro", this.matchReviewBox.bind(this));
      this.addRule("w:reviews", "pro", this.matchReviews.bind(this));
      this.addRule("w:hotspots", "pro", this.matchHotspots.bind(this));
      this.addRule("w:sitemap", "pro", this.matchSitemap.bind(this));
      this.addRule("w:progress-tracker", "pro", this.matchProgressTracker.bind(this));
      this.addRule("w:animated-text", "pro", this.matchAnimatedText.bind(this));
      this.addRule("w:nav-menu-pro", "pro", this.matchNavMenu.bind(this));
      this.addRule("w:breadcrumb", "pro", this.matchBreadcrumb.bind(this));
      this.addRule("w:facebook-button", "pro", this.matchFacebookButton.bind(this));
      this.addRule("w:facebook-comments", "pro", this.matchFacebookComments.bind(this));
      this.addRule("w:facebook-embed", "pro", this.matchFacebookEmbed.bind(this));
      this.addRule("w:facebook-page", "pro", this.matchFacebookPage.bind(this));
      this.addRule("w:loop-builder", "pro", this.matchLoopBuilder.bind(this));
      this.addRule("w:loop-grid-advanced", "pro", this.matchLoopGrid.bind(this));
      this.addRule("w:loop-carousel", "pro", this.matchImageCarousel.bind(this));
      this.addRule("w:post-info", "pro", this.matchPostInfo.bind(this));
      this.addRule("w:post-featured-image", "pro", this.matchImage.bind(this));
      this.addRule("w:post-author", "pro", this.matchGenericText.bind(this));
      this.addRule("w:post-date", "pro", this.matchGenericText.bind(this));
      this.addRule("w:post-terms", "pro", this.matchGenericText.bind(this));
      this.addRule("w:archive-title", "pro", this.matchHeading.bind(this));
      this.addRule("w:archive-description", "pro", this.matchGenericText.bind(this));
      this.addRule("w:site-logo", "pro", this.matchImage.bind(this));
      this.addRule("w:site-title", "pro", this.matchHeading.bind(this));
      this.addRule("w:site-tagline", "pro", this.matchGenericText.bind(this));
      this.addRule("w:search-results", "pro", this.matchSearchResults.bind(this));
      this.addRule("w:global-widget", "pro", this.matchGlobalWidget.bind(this));
      this.addRule("w:video-playlist", "pro", this.matchVideoPlaylist.bind(this));
      this.addRule("w:video-gallery", "pro", this.matchVideoGallery.bind(this));
      this.addRule("w:nested-tabs", "pro", this.matchNestedTabs.bind(this));
      this.addRule("w:mega-menu", "experimental", this.matchMegaMenu.bind(this));
      this.addRule("w:scroll-snap", "experimental", this.matchScrollSnap.bind(this));
      this.addRule("w:motion-effects", "experimental", this.matchMotionEffects.bind(this));
      this.addRule("w:background-slideshow", "experimental", this.matchBackgroundSlideshow.bind(this));
      this.addRule("w:css-transform", "experimental", this.matchCSSTransform.bind(this));
      this.addRule("w:custom-position", "experimental", this.matchCustomPosition.bind(this));
      this.addRule("w:dynamic-tags", "experimental", this.matchDynamicTags.bind(this));
      this.addRule("w:ajax-pagination", "experimental", this.matchAjaxPagination.bind(this));
      this.addRule("w:parallax", "experimental", this.matchParallax.bind(this));
    }
    /**
     * Adiciona uma regra de detecção
     */
    addRule(widget, category, matcher) {
      this.rules.push({ widget, category, matcher });
    }
    /**
     * Gera justificativa para a detecção
     */
    generateJustification(node, widget, confidence) {
      const reasons = [];
      if (node.name.toLowerCase().includes(widget.replace(/^w:|^woo:|^loop:/, ""))) {
        reasons.push("Nome do layer corresponde ao widget");
      }
      if (node.type === "TEXT") {
        reasons.push("\xC9 um elemento de texto");
      } else if (node.type === "RECTANGLE" || node.type === "FRAME") {
        reasons.push("Estrutura compat\xEDvel com o widget");
      }
      if (confidence >= 0.8) {
        reasons.push("Alta confian\xE7a na detec\xE7\xE3o");
      } else if (confidence >= 0.5) {
        reasons.push("Confian\xE7a moderada");
      }
      return reasons.join("; ");
    }
    /**
     * Helper: Analisa contexto visual do node
     */
    analyzeVisualContext(node) {
      var _a;
      const width = "width" in node ? node.width : 0;
      const height = "height" in node ? node.height : 0;
      const aspectRatio = height > 0 ? width / height : 0;
      const hasBackground = "fills" in node && Array.isArray(node.fills) && node.fills.length > 0 && node.fills.some((f) => f.visible !== false);
      const hasBorder = "strokes" in node && Array.isArray(node.strokes) && node.strokes.length > 0 && node.strokes.some((s) => s.visible !== false);
      let hasIcon = false;
      let hasImage = false;
      let textCount = 0;
      let totalTextLength = 0;
      if ("children" in node && node.children) {
        for (const child of node.children) {
          if (child.type === "VECTOR" || child.type === "STAR" || child.type === "ELLIPSE" || child.type === "POLYGON" || child.type === "BOOLEAN_OPERATION") {
            hasIcon = true;
          }
          if (child.name.toLowerCase().includes("icon")) {
            hasIcon = true;
          }
          if ("fills" in child && Array.isArray(child.fills)) {
            if (child.fills.some((f) => f.type === "IMAGE")) {
              hasImage = true;
            }
          }
          if (child.type === "TEXT" && "characters" in child) {
            textCount++;
            totalTextLength += ((_a = child.characters) == null ? void 0 : _a.length) || 0;
          }
        }
      }
      return {
        aspectRatio,
        hasBackground,
        hasBorder,
        hasIcon,
        hasImage,
        textCount,
        avgTextLength: textCount > 0 ? totalTextLength / textCount : 0
      };
    }
    /**
     * Helper: Analisa conteúdo de texto
     */
    analyzeTextContent(node) {
      let hasQuote = false;
      let hasAuthor = false;
      let isLongText = false;
      let hasTitle = false;
      let hasDescription = false;
      if ("children" in node && node.children) {
        const texts = node.children.filter((child) => child.type === "TEXT");
        hasQuote = texts.some((t) => t.characters.includes('"') || t.characters.includes("\u201C") || t.characters.includes("\u201D") || t.name.toLowerCase().includes("quote"));
        hasAuthor = texts.some((t) => t.name.toLowerCase().includes("author") || t.name.toLowerCase().includes("autor") || t.name.toLowerCase().includes("role") || t.name.toLowerCase().includes("cargo"));
        isLongText = texts.some((t) => t.characters.length > 100);
        hasTitle = texts.some((t) => typeof t.fontSize === "number" && t.fontSize > 16 || t.fontWeight === 700 || t.name.toLowerCase().includes("title") || t.name.toLowerCase().includes("heading"));
        hasDescription = texts.some((t) => t.characters.length > 40 || t.name.toLowerCase().includes("desc") || t.name.toLowerCase().includes("text"));
      }
      return { hasQuote, hasAuthor, isLongText, hasTitle, hasDescription };
    }
    /**
     * Helper: Calcula confiança final
     */
    calculateConfidence(baseScore, visualMatch, contentMatch, nameMatch) {
      const weights = {
        visual: 0.4,
        content: 0.3,
        name: 0.2,
        base: 0.1
      };
      return Math.min(
        baseScore * weights.base + visualMatch * weights.visual + contentMatch * weights.content + nameMatch * weights.name,
        1
      );
    }
    // ==================== MATCHERS - BÁSICOS ====================
    matchHeading(node) {
      if (node.type !== "TEXT") return 0;
      const text = node;
      let confidence = 0.4;
      const name = node.name.toLowerCase();
      if (name.includes("heading") || name.includes("t\xEDtulo") || /^h[1-6]$/i.test(name)) {
        confidence += 0.3;
      }
      if (text.fontSize && typeof text.fontSize === "number" && text.fontSize > 24) {
        confidence += 0.2;
      }
      if (text.fontWeight && typeof text.fontWeight === "number" && text.fontWeight >= 700) {
        confidence += 0.1;
      }
      return Math.min(confidence, 1);
    }
    matchTextEditor(node) {
      if (node.type !== "TEXT") return 0;
      const text = node;
      let confidence = 0.3;
      const name = node.name.toLowerCase();
      if (name.includes("text") || name.includes("paragraph") || name.includes("description")) {
        confidence += 0.3;
      }
      if (text.characters && text.characters.length > 50) {
        confidence += 0.2;
      }
      if (text.fontSize && typeof text.fontSize === "number" && text.fontSize >= 14 && text.fontSize <= 18) {
        confidence += 0.2;
      }
      return Math.min(confidence, 1);
    }
    matchButton(node) {
      const visual = this.analyzeVisualContext(node);
      const name = node.name.toLowerCase();
      let nameMatch = 0;
      if (name.includes("button") || name.includes("btn") || name.includes("botao")) nameMatch = 1;
      let visualMatch = 0;
      if (visual.aspectRatio > 1.5 && visual.aspectRatio < 6) visualMatch += 0.3;
      if (visual.hasBackground || visual.hasBorder) visualMatch += 0.4;
      if (visual.textCount === 1 && visual.avgTextLength < 30) visualMatch += 0.3;
      if (visual.hasIcon) visualMatch += 0.2;
      let contentMatch = 0;
      if (visual.textCount >= 1 && visual.textCount <= 2) contentMatch = 1;
      return this.calculateConfidence(0.4, Math.min(visualMatch, 1), contentMatch, nameMatch);
    }
    matchImage(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("image") || name.includes("img") || name.includes("photo") || name.includes("picture")) {
        confidence += 0.5;
      }
      if ("fills" in node && node.fills && Array.isArray(node.fills)) {
        const hasImageFill = node.fills.some((fill) => fill.type === "IMAGE");
        if (hasImageFill) {
          confidence += 0.5;
        }
      }
      return Math.min(confidence, 1);
    }
    matchIcon(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("icon") || name.includes("svg")) {
        confidence += 0.5;
      }
      if ("width" in node && "height" in node) {
        if (node.width < 100 && node.height < 100) {
          confidence += 0.3;
        }
      }
      if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION") {
        confidence += 0.2;
      }
      return Math.min(confidence, 1);
    }
    matchVideo(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("video") || name.includes("youtube") || name.includes("vimeo") || name.includes("player")) {
        confidence += 0.6;
      }
      if ("width" in node && "height" in node) {
        const ratio = node.width / node.height;
        if (Math.abs(ratio - 16 / 9) < 0.1) {
          confidence += 0.4;
        }
      }
      return Math.min(confidence, 1);
    }
    matchDivider(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("divider") || name.includes("separator") || name.includes("line")) {
        confidence += 0.5;
      }
      if ("width" in node && "height" in node) {
        const width = node.width;
        const height = node.height;
        if (height < 5 && width > 50 || width < 5 && height > 50) {
          confidence += 0.5;
        }
      }
      return Math.min(confidence, 1);
    }
    matchSpacer(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("spacer") || name.includes("space") || name === "gap") {
        confidence += 0.6;
      }
      if (node.type === "FRAME" && "children" in node && (!node.children || node.children.length === 0)) {
        confidence += 0.4;
      }
      return Math.min(confidence, 1);
    }
    matchImageBox(node) {
      const visual = this.analyzeVisualContext(node);
      const content = this.analyzeTextContent(node);
      const name = node.name.toLowerCase();
      let nameMatch = 0;
      if (name.includes("image-box") || name.includes("image box")) nameMatch = 1;
      let visualMatch = 0;
      if (visual.hasImage) visualMatch += 0.6;
      if (visual.textCount >= 1) visualMatch += 0.4;
      let contentMatch = 0;
      if (content.hasTitle || content.hasDescription) contentMatch += 0.5;
      if (content.hasTitle && content.hasDescription) contentMatch += 0.5;
      if (visual.textCount > 4) contentMatch -= 0.5;
      return this.calculateConfidence(0.3, Math.min(visualMatch, 1), Math.max(contentMatch, 0), nameMatch);
    }
    matchIconBox(node) {
      const visual = this.analyzeVisualContext(node);
      const content = this.analyzeTextContent(node);
      const name = node.name.toLowerCase();
      let nameMatch = 0;
      if (name.includes("icon-box") || name.includes("icon box")) nameMatch = 1;
      let visualMatch = 0;
      if (visual.hasIcon) visualMatch += 0.6;
      if (visual.textCount >= 1) visualMatch += 0.4;
      let contentMatch = 0;
      if (content.hasTitle || content.hasDescription) contentMatch += 0.5;
      if (content.hasTitle && content.hasDescription) contentMatch += 0.5;
      if (visual.textCount > 4) contentMatch -= 0.5;
      return this.calculateConfidence(0.3, Math.min(visualMatch, 1), Math.max(contentMatch, 0), nameMatch);
    }
    matchStarRating(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("star") || name.includes("rating") || name.includes("review")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        const starCount = node.children.filter(
          (child) => child.name.toLowerCase().includes("star") || child.type === "VECTOR"
        ).length;
        if (starCount >= 3 && starCount <= 5) {
          confidence += 0.3;
        }
      }
      return Math.min(confidence, 1);
    }
    matchCounter(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("counter") || name.includes("count") || name.includes("number")) {
        confidence += 0.6;
      }
      if (node.type === "TEXT") {
        const text = node;
        if (text.characters && /^\d+/.test(text.characters)) {
          confidence += 0.4;
        }
      }
      return Math.min(confidence, 1);
    }
    matchProgress(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("progress") || name.includes("bar")) {
        confidence += 0.6;
      }
      if (node.type === "FRAME" && "width" in node && "height" in node) {
        const ratio = node.width / node.height;
        if (ratio > 3) {
          confidence += 0.4;
        }
      }
      return Math.min(confidence, 1);
    }
    matchTabs(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("tabs") || name.includes("tab")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "children" in node && node.children && node.children.length >= 2) {
        const hasMultipleSections = node.children.filter((child) => child.type === "FRAME").length >= 2;
        if (hasMultipleSections) {
          confidence += 0.3;
        }
      }
      return Math.min(confidence, 1);
    }
    matchAccordion(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("accordion") || name.includes("collapse") || name.includes("expand")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "children" in node && node.children && node.children.length >= 2) {
        confidence += 0.3;
      }
      return Math.min(confidence, 1);
    }
    matchToggle(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("toggle") || name.includes("switch")) {
        confidence += 0.7;
      }
      if ("width" in node && "height" in node && "cornerRadius" in node) {
        const width = node.width;
        const height = node.height;
        if (width < 100 && height < 50 && node.cornerRadius) {
          confidence += 0.3;
        }
      }
      return Math.min(confidence, 1);
    }
    matchAlert(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("alert") || name.includes("notification") || name.includes("message")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        const hasText = node.children.some((child) => child.type === "TEXT");
        if (hasText && "fills" in node && node.fills) {
          confidence += 0.3;
        }
      }
      return Math.min(confidence, 1);
    }
    matchSocialIcons(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("social") || name.includes("share")) {
        confidence += 0.6;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        const iconCount = node.children.filter(
          (child) => child.type === "VECTOR" || child.name.toLowerCase().includes("icon")
        ).length;
        if (iconCount >= 2) {
          confidence += 0.4;
        }
      }
      return Math.min(confidence, 1);
    }
    matchIconList(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("icon-list") || name.includes("list")) {
        confidence += 0.6;
      }
      if (node.type === "FRAME" && "children" in node && node.children && node.children.length >= 2) {
        confidence += 0.4;
      }
      return Math.min(confidence, 1);
    }
    matchNavMenu(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("nav") || name.includes("menu") || name.includes("navigation")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "children" in node && node.children && node.children.length >= 3) {
        confidence += 0.3;
      }
      return Math.min(confidence, 1);
    }
    matchSearchForm(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("search") || name.includes("busca")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        const hasInput = node.children.some(
          (child) => child.name.toLowerCase().includes("input") || child.type === "RECTANGLE"
        );
        const hasButton = node.children.some(
          (child) => child.name.toLowerCase().includes("button")
        );
        if (hasInput && hasButton) {
          confidence += 0.3;
        }
      }
      return Math.min(confidence, 1);
    }
    matchTestimonial(node) {
      const visual = this.analyzeVisualContext(node);
      const content = this.analyzeTextContent(node);
      const name = node.name.toLowerCase();
      let nameMatch = 0;
      if (name.includes("testimonial") || name.includes("review") || name.includes("depoimento")) nameMatch = 1;
      let visualMatch = 0;
      if (visual.hasImage) visualMatch += 0.3;
      if (visual.textCount >= 2) visualMatch += 0.3;
      let contentMatch = 0;
      if (content.hasQuote) contentMatch += 0.4;
      if (content.hasAuthor) contentMatch += 0.3;
      if (content.isLongText) contentMatch += 0.3;
      return this.calculateConfidence(0.3, Math.min(visualMatch, 1), Math.min(contentMatch, 1), nameMatch);
    }
    matchContainer(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("container") || name.includes("section") || name.includes("wrapper")) {
        confidence += 0.5;
      }
      if (node.type === "FRAME" && "children" in node && node.children && node.children.length > 0) {
        confidence += 0.3;
      }
      if ("layoutMode" in node && node.layoutMode !== "NONE") {
        confidence += 0.2;
      }
      return Math.min(confidence, 1);
    }
    // ==================== MATCHERS - PRO ====================
    matchForm(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("form") || name.includes("formulario")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        const inputCount = node.children.filter(
          (child) => child.name.toLowerCase().includes("input") || child.name.toLowerCase().includes("field")
        ).length;
        if (inputCount >= 2) {
          confidence += 0.3;
        }
      }
      return Math.min(confidence, 1);
    }
    matchLogin(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("login") || name.includes("sign-in") || name.includes("auth")) {
        confidence += 0.8;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        const hasInputs = node.children.filter(
          (child) => child.name.toLowerCase().includes("input") || child.name.toLowerCase().includes("password") || child.name.toLowerCase().includes("email")
        ).length >= 2;
        if (hasInputs) {
          confidence += 0.2;
        }
      }
      return Math.min(confidence, 1);
    }
    matchCTA(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("cta") || name.includes("call-to-action")) {
        confidence += 0.8;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        const hasText = node.children.filter((child) => child.type === "TEXT").length >= 2;
        const hasButton = node.children.some(
          (child) => child.name.toLowerCase().includes("button")
        );
        if (hasText && hasButton) {
          confidence += 0.2;
        }
      }
      return Math.min(confidence, 1);
    }
    matchPortfolio(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("portfolio") || name.includes("gallery") || name.includes("grid")) {
        confidence += 0.6;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        const imageCount = node.children.filter(
          (child) => child.name.toLowerCase().includes("image") || "fills" in child && Array.isArray(child.fills) && child.fills.some((f) => f.type === "IMAGE")
        ).length;
        if (imageCount >= 3) {
          confidence += 0.4;
        }
      }
      return Math.min(confidence, 1);
    }
    matchFlipBox(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("flip-box") || name.includes("flip")) {
        confidence += 0.8;
      }
      if (node.type === "FRAME" && "children" in node && node.children && node.children.length === 2) {
        confidence += 0.2;
      }
      return Math.min(confidence, 1);
    }
    matchAnimatedHeadline(node) {
      var _a;
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("animated") && name.includes("headline")) {
        confidence += 0.9;
      }
      if (node.type === "TEXT" || node.type === "FRAME" && "children" in node && ((_a = node.children) == null ? void 0 : _a.some((c) => c.type === "TEXT"))) {
        confidence += 0.1;
      }
      return Math.min(confidence, 1);
    }
    matchCountdown(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("countdown") || name.includes("timer")) {
        confidence += 0.8;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        const numberCount = node.children.filter(
          (child) => child.type === "TEXT" && /\d/.test(child.name)
        ).length;
        if (numberCount >= 2) {
          confidence += 0.2;
        }
      }
      return Math.min(confidence, 1);
    }
    matchPriceTable(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("price") || name.includes("pricing") || name.includes("plan")) {
        confidence += 0.6;
      }
      if (node.type === "FRAME" && "children" in node && node.children && node.children.length >= 3) {
        confidence += 0.4;
      }
      return Math.min(confidence, 1);
    }
    matchPriceList(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("price-list") || name.includes("menu")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "children" in node && node.children && node.children.length >= 2) {
        confidence += 0.3;
      }
      return Math.min(confidence, 1);
    }
    // ==================== MATCHERS - WOOCOMMERCE ====================
    matchWooProductTitle(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("product") && name.includes("title")) {
        confidence += 0.8;
      }
      if (node.type === "TEXT") {
        confidence += 0.2;
      }
      return Math.min(confidence, 1);
    }
    matchWooProductImage(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("product") && name.includes("image")) {
        confidence += 0.8;
      }
      if ("fills" in node && Array.isArray(node.fills) && node.fills.some((f) => f.type === "IMAGE")) {
        confidence += 0.2;
      }
      return Math.min(confidence, 1);
    }
    matchWooProductPrice(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("price") || name.includes("preco")) {
        confidence += 0.7;
      }
      if (node.type === "TEXT") {
        const text = node;
        if (text.characters && (/\$|R\$|€/.test(text.characters) || /\d+[.,]\d+/.test(text.characters))) {
          confidence += 0.3;
        }
      }
      return Math.min(confidence, 1);
    }
    matchWooAddToCart(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("add-to-cart") || name.includes("cart") || name.includes("buy")) {
        confidence += 0.8;
      }
      if (node.type === "FRAME" || "cornerRadius" in node && node.cornerRadius) {
        confidence += 0.2;
      }
      return Math.min(confidence, 1);
    }
    matchWooProductRating(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("rating") || name.includes("star")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        const starCount = node.children.filter(
          (child) => child.type === "VECTOR" || child.name.toLowerCase().includes("star")
        ).length;
        if (starCount >= 3) {
          confidence += 0.3;
        }
      }
      return Math.min(confidence, 1);
    }
    // ==================== MATCHERS - GENÉRICOS ====================
    /**
     * Matcher genérico para texto (usado para widgets simples de texto)
     */
    matchGenericText(node) {
      let confidence = 0;
      if (node.type === "TEXT") {
        confidence += 0.5;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        const hasText = node.children.some((child) => child.type === "TEXT");
        if (hasText) {
          confidence += 0.3;
        }
      }
      return Math.min(confidence, 1);
    }
    /**
     * Matcher genérico para containers (usado para widgets que são apenas wrappers)
     */
    matchGenericContainer(node) {
      let confidence = 0;
      if (node.type === "FRAME") {
        confidence += 0.3;
      }
      if ("children" in node && node.children && node.children.length > 0) {
        confidence += 0.4;
      }
      return Math.min(confidence, 1);
    }
    matchGallery(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("gallery") || name.includes("galeria")) {
        confidence += 0.6;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        const imageCount = node.children.filter((child) => {
          const childName = child.name.toLowerCase();
          return childName.includes("image") || childName.includes("img") || "fills" in child && Array.isArray(child.fills) && child.fills.some((fill) => fill.type === "IMAGE");
        }).length;
        if (imageCount >= 3) {
          confidence += 0.4;
        }
      }
      return Math.min(confidence, 1);
    }
    matchImageCarousel(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("carousel") || name.includes("slider") || name.includes("swiper")) {
        confidence += 0.5;
      }
      if (name.includes("image")) {
        confidence += 0.3;
      }
      if (node.type === "FRAME" && "children" in node && "layoutMode" in node) {
        if (node.layoutMode === "HORIZONTAL") {
          confidence += 0.2;
        }
      }
      return Math.min(confidence, 1);
    }
    matchGoogleMaps(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("map") || name.includes("google") || name.includes("location")) {
        confidence += 0.7;
      }
      if ("width" in node && "height" in node) {
        const ratio = node.width / node.height;
        if (ratio >= 1.3 && ratio <= 2) {
          confidence += 0.3;
        }
      }
      return Math.min(confidence, 1);
    }
    matchEmbed(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("embed") || name.includes("iframe") || name.includes("youtube") || name.includes("vimeo")) {
        confidence += 0.8;
      }
      return Math.min(confidence, 1);
    }
    matchLottie(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("lottie") || name.includes("animation") || name.includes("animated")) {
        confidence += 0.7;
      }
      return Math.min(confidence, 1);
    }
    matchShortcode(node) {
      if (node.type !== "TEXT") return 0;
      const text = node;
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("shortcode")) {
        confidence += 0.6;
      }
      if (text.characters && text.characters.includes("[") && text.characters.includes("]")) {
        confidence += 0.4;
      }
      return Math.min(confidence, 1);
    }
    matchHTML(node) {
      if (node.type !== "TEXT") return 0;
      const text = node;
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("html") || name.includes("code")) {
        confidence += 0.6;
      }
      if (text.characters && text.characters.includes("<") && text.characters.includes(">")) {
        confidence += 0.4;
      }
      return Math.min(confidence, 1);
    }
    matchMenuAnchor(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("anchor") || name.includes("menu-anchor")) {
        confidence += 0.8;
      }
      if ("width" in node && "height" in node) {
        const width = node.width;
        const height = node.height;
        if (width < 50 && height < 50) {
          confidence += 0.2;
        }
      }
      return Math.min(confidence, 1);
    }
    matchSidebar(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("sidebar") || name.includes("aside")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "layoutMode" in node) {
        if (node.layoutMode === "VERTICAL") {
          confidence += 0.3;
        }
      }
      return Math.min(confidence, 1);
    }
    matchReadMore(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("read") && name.includes("more")) {
        confidence += 0.6;
      }
      if (name.includes("button") || name.includes("link")) {
        confidence += 0.3;
      }
      return Math.min(confidence, 1);
    }
    matchSoundcloud(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("soundcloud") || name.includes("audio") || name.includes("music")) {
        confidence += 0.8;
      }
      return Math.min(confidence, 1);
    }
    matchLoopGrid(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("grid") || name.includes("loop") || name.includes("repeater")) {
        confidence += 0.5;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        if (node.children.length >= 4) {
          confidence += 0.3;
        }
      }
      return Math.min(confidence, 1);
    }
    // ==================== MATCHERS - WOOCOMMERCE SIMPLES ====================
    matchLoopBuilder(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("loop") && (name.includes("builder") || name.includes("grid") || name.includes("carousel"))) {
        confidence += 0.8;
      }
      if (node.type === "FRAME") {
        confidence += 0.1;
      }
      if (name.includes("link") || name.includes("item") || name.includes("menu")) {
        confidence -= 0.5;
      }
      return Math.min(confidence, 1);
    }
    matchSearchResults(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("search") && name.includes("result")) {
        confidence += 0.9;
      }
      if (name === "link" || name.includes("menu item")) {
        confidence -= 0.5;
      }
      return Math.min(confidence, 1);
    }
    matchGlobalWidget(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("global") && (name.includes("widget") || name.includes("template"))) {
        confidence += 0.9;
      }
      return Math.min(confidence, 1);
    }
    matchWooBreadcrumb(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("breadcrumb") || name.includes("bread")) {
        confidence += 0.7;
      }
      if (name.includes("product") || name.includes("woo")) {
        confidence += 0.3;
      }
      return Math.min(confidence, 1);
    }
    matchWooProducts(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("products") || name.includes("shop")) {
        confidence += 0.6;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        if (node.children.length >= 3) {
          confidence += 0.4;
        }
      }
      return Math.min(confidence, 1);
    }
    matchWooProductGrid(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("product") && name.includes("grid")) {
        confidence += 0.8;
      }
      return Math.min(confidence, 1);
    }
    matchWooProductCarousel(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("product") && (name.includes("carousel") || name.includes("slider"))) {
        confidence += 0.8;
      }
      return Math.min(confidence, 1);
    }
    matchWooProductSingle(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("product") && name.includes("single")) {
        confidence += 0.8;
      }
      return Math.min(confidence, 1);
    }
    matchWooProductTabs(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("tab") && name.includes("product")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "children" in node && node.children && node.children.length >= 2) {
        confidence += 0.3;
      }
      return Math.min(confidence, 1);
    }
    matchWooProductStock(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("stock") || name.includes("availability")) {
        confidence += 0.8;
      }
      return Math.min(confidence, 1);
    }
    matchWooProductMeta(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("meta") && name.includes("product")) {
        confidence += 0.7;
      }
      if (name.includes("sku") || name.includes("category") || name.includes("tag")) {
        confidence += 0.3;
      }
      return Math.min(confidence, 1);
    }
    matchWooProductAdditionalInformation(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("additional") && name.includes("information")) {
        confidence += 0.8;
      }
      if (node.type === "FRAME" && "children" in node && node.children) {
        const hasAttributeTerms = node.children.some((child) => {
          if (child.type === "TEXT") {
            const text = child.characters.toLowerCase();
            return text.includes("weight") || text.includes("dimensions") || text.includes("peso") || text.includes("dimens\xF5es") || text.includes("attributes") || text.includes("atributos");
          }
          if ("children" in child) {
            return child.children.some((grandChild) => {
              if (grandChild.type === "TEXT") {
                const text = grandChild.characters.toLowerCase();
                return text.includes("weight") || text.includes("dimensions") || text.includes("peso") || text.includes("dimens\xF5es");
              }
              return false;
            });
          }
          return false;
        });
        if (hasAttributeTerms) {
          confidence += 0.4;
        }
      }
      return Math.min(confidence, 1);
    }
    // ==================== MATCHERS - PRO AVANÇADO ====================
    matchSubscription(node) {
      var _a;
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("subscription") || name.includes("subscribe") || name.includes("newsletter")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "children" in node) {
        const hasInput = (_a = node.children) == null ? void 0 : _a.some((child) => child.name.toLowerCase().includes("email"));
        if (hasInput) confidence += 0.3;
      }
      return Math.min(confidence, 1);
    }
    matchMediaCarousel(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("media") && name.includes("carousel")) {
        confidence += 0.8;
      }
      if (name.includes("carousel") || name.includes("slider")) {
        confidence += 0.2;
      }
      return Math.min(confidence, 1);
    }
    matchSliderSlides(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("slider") || name.includes("slide")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "children" in node && node.children && node.children.length >= 2) {
        confidence += 0.3;
      }
      return Math.min(confidence, 1);
    }
    matchPostNavigation(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if ((name.includes("prev") || name.includes("next")) && name.includes("post")) {
        confidence += 0.7;
      }
      if (name.includes("navigation")) {
        confidence += 0.3;
      }
      return Math.min(confidence, 1);
    }
    matchTableOfContents(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("toc") || name.includes("table") && name.includes("content")) {
        confidence += 0.8;
      }
      if (name.includes("index") || name.includes("summary")) {
        confidence += 0.2;
      }
      return Math.min(confidence, 1);
    }
    matchBlockquote(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("blockquote") || name.includes("quote")) {
        confidence += 0.7;
      }
      if (node.type === "TEXT") {
        confidence += 0.3;
      }
      return Math.min(confidence, 1);
    }
    matchTestimonialCarousel(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("testimonial") && name.includes("carousel")) {
        confidence += 0.9;
      }
      return Math.min(confidence, 1);
    }
    matchReviewBox(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("review") && name.includes("box")) {
        confidence += 0.8;
      }
      if (name.includes("rating")) {
        confidence += 0.2;
      }
      return Math.min(confidence, 1);
    }
    matchReviews(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("reviews") || name.includes("rating")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "children" in node && node.children && node.children.length >= 2) {
        confidence += 0.3;
      }
      return Math.min(confidence, 1);
    }
    matchHotspots(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("hotspot") || name.includes("marker")) {
        confidence += 0.8;
      }
      return Math.min(confidence, 1);
    }
    matchSitemap(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("sitemap")) {
        confidence += 0.9;
      }
      return Math.min(confidence, 1);
    }
    matchProgressTracker(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("progress") || name.includes("tracker") || name.includes("stepper") || name.includes("wizard")) {
        confidence += 0.7;
      }
      if (node.type === "FRAME" && "children" in node && node.children && node.children.length >= 3) {
        confidence += 0.3;
      }
      return Math.min(confidence, 1);
    }
    matchAnimatedText(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("animated") && name.includes("text")) {
        confidence += 0.8;
      }
      if (node.type === "TEXT") {
        confidence += 0.2;
      }
      return Math.min(confidence, 1);
    }
    matchBreadcrumb(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("breadcrumb") || name.includes("bread")) {
        confidence += 0.8;
      }
      return Math.min(confidence, 1);
    }
    matchFacebookButton(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("facebook") && name.includes("button")) {
        confidence += 0.9;
      }
      return Math.min(confidence, 1);
    }
    matchFacebookComments(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("facebook") && name.includes("comment")) {
        confidence += 0.9;
      }
      return Math.min(confidence, 1);
    }
    matchFacebookEmbed(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("facebook") && name.includes("embed")) {
        confidence += 0.9;
      }
      return Math.min(confidence, 1);
    }
    matchFacebookPage(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("facebook") && name.includes("page")) {
        confidence += 0.9;
      }
      return Math.min(confidence, 1);
    }
    matchPostInfo(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("post") && name.includes("info")) {
        confidence += 0.8;
      }
      if (name.includes("meta") || name.includes("date") || name.includes("author")) {
        confidence += 0.2;
      }
      return Math.min(confidence, 1);
    }
    matchVideoPlaylist(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("video") && name.includes("playlist")) {
        confidence += 0.8;
      }
      if (node.type === "FRAME" && "children" in node && node.children && node.children.length >= 2) {
        confidence += 0.2;
      }
      return Math.min(confidence, 1);
    }
    matchVideoGallery(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("video") && name.includes("gallery")) {
        confidence += 0.8;
      }
      if (node.type === "FRAME" && "children" in node && node.children && node.children.length >= 2) {
        confidence += 0.2;
      }
      return Math.min(confidence, 1);
    }
    matchNestedTabs(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("nested") && name.includes("tab")) {
        confidence += 0.9;
      }
      return Math.min(confidence, 1);
    }
    // ==================== MATCHERS - EXPERIMENTAIS ====================
    matchMegaMenu(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("mega") && name.includes("menu")) {
        confidence += 0.9;
      }
      return Math.min(confidence, 1);
    }
    matchScrollSnap(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("scroll") && name.includes("snap")) {
        confidence += 0.8;
      }
      return Math.min(confidence, 1);
    }
    matchMotionEffects(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("motion") || name.includes("parallax") || name.includes("effect")) {
        confidence += 0.6;
      }
      return Math.min(confidence, 1);
    }
    matchBackgroundSlideshow(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("background") && name.includes("slideshow")) {
        confidence += 0.9;
      }
      return Math.min(confidence, 1);
    }
    matchCSSTransform(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("transform") || name.includes("rotate") || name.includes("scale")) {
        confidence += 0.7;
      }
      return Math.min(confidence, 1);
    }
    matchCustomPosition(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("position") || name.includes("absolute") || name.includes("fixed")) {
        confidence += 0.6;
      }
      return Math.min(confidence, 1);
    }
    matchDynamicTags(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("dynamic") && name.includes("tag")) {
        confidence += 0.8;
      }
      return Math.min(confidence, 1);
    }
    matchAjaxPagination(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("ajax") && name.includes("pagination")) {
        confidence += 0.9;
      }
      if (name.includes("load") && name.includes("more")) {
        confidence += 0.1;
      }
      return Math.min(confidence, 1);
    }
    matchParallax(node) {
      let confidence = 0;
      const name = node.name.toLowerCase();
      if (name.includes("parallax")) {
        confidence += 0.9;
      }
      return Math.min(confidence, 1);
    }
  };

  // src/linter/core/LinterEngine.ts
  var LinterEngine = class {
    constructor() {
      __publicField(this, "startTime", 0);
      __publicField(this, "endTime", 0);
    }
    /**
     * Analisa um node do Figma
     */
    async analyze(node, registry2, options = {}) {
      this.startTime = Date.now();
      registry2.resetExecutedRules();
      const results = [];
      const rules = this.getApplicableRules(registry2, options);
      for (const rule of rules) {
        const result = await rule.validate(node);
        if (result) {
          results.push(result);
        }
        registry2.markAsExecuted(rule.id);
      }
      if ("children" in node && node.children) {
        for (const child of node.children) {
          const childResults = await this.analyzeNode(child, registry2);
          results.push(...childResults);
        }
      }
      this.endTime = Date.now();
      return results;
    }
    /**
     * Analisa um único node (sem recursão)
     */
    async analyzeNode(node, registry2) {
      console.log(`\u{1F50D} [analyzeNode] Analisando: ${node.name} (${node.type})`);
      const results = [];
      const hasValidWidgetName = /^(w:|woo:|loop:)/.test(node.name);
      if (hasValidWidgetName) {
        console.log(`  \u23ED\uFE0F Pulando ${node.name}: j\xE1 tem nome de widget v\xE1lido`);
        if ("children" in node && node.children) {
          console.log(`\u{1F50D} [analyzeNode] ${node.name} tem ${node.children.length} filhos`);
          for (const child of node.children) {
            const childResults = await this.analyzeNode(child, registry2);
            results.push(...childResults);
          }
        }
        return results;
      }
      const rules = registry2.getAll();
      console.log(`\u{1F50D} [analyzeNode] ${rules.length} regras para executar`);
      for (const rule of rules) {
        console.log(`  \u2699\uFE0F Executando regra: ${rule.id}`);
        try {
          const result = await rule.validate(node);
          if (result) {
            results.push(result);
            console.log(`    \u2705 Regra ${rule.id}: Issue encontrado`);
          } else {
            console.log(`    \u2705 Regra ${rule.id}: OK`);
          }
        } catch (error) {
          console.error(`    \u274C ERRO na regra ${rule.id}:`, error);
        }
      }
      if ("children" in node && node.children) {
        console.log(`\u{1F50D} [analyzeNode] ${node.name} tem ${node.children.length} filhos`);
        for (const child of node.children) {
          const childResults = await this.analyzeNode(child, registry2);
          results.push(...childResults);
        }
      }
      return results;
    }
    /**
     * Gera relatório completo
     */
    generateReport(results, registry2, options = {}, rootNode) {
      const summary = this.generateSummary(results);
      console.log("\u{1F4CA} [generateReport] Summary gerado");
      const guides = this.generateGuides(results, registry2);
      console.log("\u{1F4CA} [generateReport] Guides gerados");
      let widgets = [];
      if (rootNode) {
        console.log("\u{1F4CA} [generateReport] Iniciando detec\xE7\xE3o de widgets...");
        try {
          const detector = new WidgetDetector();
          console.log("\u{1F4CA} [generateReport] WidgetDetector criado");
          widgets = detector.detectAll(rootNode);
          console.log(`\u{1F4CA} [generateReport] ${widgets.length} widgets detectados`);
        } catch (error) {
          console.error("\u274C ERRO ao detectar widgets:", error);
          widgets = [];
        }
      }
      return {
        summary,
        analysis: results,
        widgets,
        guides,
        metadata: {
          duration: this.getDuration(),
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          device_target: "desktop",
          ai_used: options.aiAssisted || false,
          rules_executed: registry2.getExecutedRules()
        }
      };
    }
    /**
     * Gera sumário de problemas
     */
    generateSummary(results) {
      return {
        total: results.length,
        critical: results.filter((r) => r.severity === "critical").length,
        major: results.filter((r) => r.severity === "major").length,
        minor: results.filter((r) => r.severity === "minor").length,
        info: results.filter((r) => r.severity === "info").length
      };
    }
    /**
     * Gera guias de correção manual
     */
    generateGuides(results, registry2) {
      const guides = [];
      for (const result of results) {
        const rule = registry2.get(result.rule);
        if (rule && rule.generateGuide) {
          const guide = {
            node_id: result.node_id,
            problem: result.message,
            severity: result.severity,
            step_by_step: this.getGenericSteps(result.rule),
            estimated_time: this.estimateTime(result.severity),
            difficulty: this.estimateDifficulty(result.severity)
          };
          guides.push(guide);
        }
      }
      return guides;
    }
    /**
     * Obtém passos genéricos baseados na regra
     */
    getGenericSteps(ruleId) {
      const stepsMap = {
        "auto-layout-required": [
          "Selecione o frame no Figma",
          "Pressione Shift + A (atalho para Auto Layout)",
          "Ajuste a dire\xE7\xE3o (Vertical ou Horizontal)",
          "Defina o espa\xE7amento (Gap) entre itens",
          "Adicione padding interno se necess\xE1rio"
        ],
        "spacer-detected": [
          "Selecione o frame pai",
          "Aumente o valor de Gap",
          "Delete o elemento spacer"
        ],
        "generic-name-detected": [
          "Clique duas vezes no nome da camada",
          "Renomeie seguindo o padr\xE3o sugerido"
        ]
      };
      const actions = stepsMap[ruleId] || ["Corrija o problema manualmente"];
      return actions.map((action, index) => ({ step: index + 1, action }));
    }
    /**
     * Estima tempo de correção
     */
    estimateTime(severity) {
      const timeMap = {
        critical: "1-2 minutos",
        major: "30 segundos",
        minor: "10 segundos",
        info: "5 segundos"
      };
      return timeMap[severity] || "1 minuto";
    }
    /**
     * Estima dificuldade de correção
     */
    estimateDifficulty(severity) {
      if (severity === "critical") return "medium";
      if (severity === "major") return "easy";
      return "easy";
    }
    /**
     * Obtém regras aplicáveis baseado nas opções
     */
    getApplicableRules(registry2, options) {
      let rules = registry2.getAll();
      if (options.rules && options.rules.length > 0) {
        rules = rules.filter((rule) => options.rules.includes(rule.id));
      }
      if (options.severity && options.severity.length > 0) {
        rules = rules.filter((rule) => options.severity.includes(rule.severity));
      }
      return rules;
    }
    /**
     * Obtém duração da análise em ms
     */
    getDuration() {
      return this.endTime - this.startTime;
    }
  };

  // src/linter/core/RuleRegistry.ts
  var RuleRegistry = class {
    constructor() {
      __publicField(this, "rules", /* @__PURE__ */ new Map());
      __publicField(this, "executedRules", []);
    }
    /**
     * Registra uma nova regra
     */
    register(rule) {
      this.rules.set(rule.id, rule);
    }
    /**
     * Registra múltiplas regras
     */
    registerAll(rules) {
      rules.forEach((rule) => this.register(rule));
    }
    /**
     * Registra apenas regras para desktop
     */
    registerDesktopRules() {
    }
    /**
     * Obtém uma regra por ID
     */
    get(ruleId) {
      return this.rules.get(ruleId);
    }
    /**
     * Obtém todas as regras registradas
     */
    getAll() {
      return Array.from(this.rules.values());
    }
    /**
     * Obtém regras por categoria
     */
    getByCategory(category) {
      return this.getAll().filter((rule) => rule.category === category);
    }
    /**
     * Obtém regras por severidade
     */
    getBySeverity(severity) {
      return this.getAll().filter((rule) => rule.severity === severity);
    }
    /**
     * Marca uma regra como executada
     */
    markAsExecuted(ruleId) {
      if (!this.executedRules.includes(ruleId)) {
        this.executedRules.push(ruleId);
      }
    }
    /**
     * Obtém lista de regras executadas
     */
    getExecutedRules() {
      return [...this.executedRules];
    }
    /**
     * Reseta lista de regras executadas
     */
    resetExecutedRules() {
      this.executedRules = [];
    }
    /**
     * Obtém total de regras registradas
     */
    count() {
      return this.rules.size;
    }
  };

  // src/linter/rules/structure/AutoLayoutRule.ts
  var AutoLayoutRule = class {
    constructor() {
      __publicField(this, "id", "auto-layout-required");
      __publicField(this, "category", "structure");
      __publicField(this, "severity", "critical");
    }
    async validate(node) {
      if (node.type !== "FRAME") return null;
      const frame = node;
      const hasChildren = frame.children && frame.children.length > 0;
      const hasAutoLayout = frame.layoutMode !== "NONE";
      if (hasChildren && !hasAutoLayout) {
        return {
          node_id: frame.id,
          node_name: frame.name,
          severity: this.severity,
          category: this.category,
          rule: this.id,
          message: `Frame "${frame.name}" possui ${frame.children.length} filhos mas n\xE3o usa Auto Layout`,
          fixAvailable: true,
          educational_tip: `
\u26A0\uFE0F Por que isso \xE9 cr\xEDtico?

Frames sem Auto Layout usam posicionamento absoluto, que n\xE3o \xE9 suportado pelo Elementor. Isso causar\xE1:
\u2022 Sobreposi\xE7\xE3o de elementos
\u2022 Quebra de layout em diferentes resolu\xE7\xF5es
\u2022 Dificuldade de manuten\xE7\xE3o

\u2705 Solu\xE7\xE3o:
Aplicar Auto Layout permite que o Elementor entenda a estrutura e gere containers flex\xEDveis e responsivos.
        `.trim()
        };
      }
      return null;
    }
    async fix(node) {
      if (node.type !== "FRAME") return false;
      const frame = node;
      try {
        frame.layoutMode = "VERTICAL";
        frame.primaryAxisSizingMode = "AUTO";
        frame.counterAxisSizingMode = "AUTO";
        frame.itemSpacing = 20;
        frame.paddingLeft = 20;
        frame.paddingRight = 20;
        frame.paddingTop = 20;
        frame.paddingBottom = 20;
        return true;
      } catch (e) {
        console.error("Erro ao aplicar Auto Layout:", e);
        return false;
      }
    }
    generateGuide(node) {
      const frame = node;
      return {
        node_id: frame.id,
        problem: `Frame "${frame.name}" sem Auto Layout`,
        severity: this.severity,
        step_by_step: [
          { step: 1, action: "Selecione o frame no Figma" },
          { step: 2, action: "Pressione Shift + A (atalho para Auto Layout)" },
          { step: 3, action: "No painel direito, ajuste a dire\xE7\xE3o (Vertical ou Horizontal)" },
          { step: 4, action: "Defina o espa\xE7amento (Gap) entre itens" },
          { step: 5, action: "Adicione padding interno se necess\xE1rio" }
        ],
        before_after_example: {
          before: "Frame com posicionamento absoluto dos filhos",
          after: "Frame com Auto Layout vertical, gap de 16px e padding de 24px"
        },
        estimated_time: "1 minuto",
        difficulty: "easy"
      };
    }
  };

  // src/linter/rules/structure/SpacerDetectionRule.ts
  var SpacerDetectionRule = class {
    constructor() {
      __publicField(this, "id", "spacer-detected");
      __publicField(this, "category", "structure");
      __publicField(this, "severity", "major");
    }
    async validate(node) {
      if (node.type !== "RECTANGLE") return null;
      const rect = node;
      const hasNoFill = !rect.fills || typeof rect.fills !== "symbol" && rect.fills.length === 0 || typeof rect.fills !== "symbol" && rect.fills.every(
        (fill) => fill.type === "SOLID" && fill.visible === false
      );
      const hasNoStroke = !rect.strokes || typeof rect.strokes !== "symbol" && rect.strokes.length === 0;
      const isGenericName = /^(Rectangle|Spacer|Space|Gap)\s*\d*$/i.test(rect.name);
      if (hasNoFill && hasNoStroke && isGenericName) {
        return {
          node_id: rect.id,
          node_name: rect.name,
          severity: this.severity,
          category: this.category,
          rule: this.id,
          message: `Spacer detectado: "${rect.name}"`,
          educational_tip: `
\u26A0\uFE0F Por que evitar spacers?

Ret\xE2ngulos vazios usados como espa\xE7amento devem ser substitu\xEDdos pela propriedade "gap" do Auto Layout. Isso:
\u2022 Reduz a complexidade do layout
\u2022 Melhora a manuten\xE7\xE3o
\u2022 Facilita ajustes responsivos
\u2022 Gera c\xF3digo Elementor mais limpo

\u2705 Solu\xE7\xE3o:
Use a propriedade "Gap" do Auto Layout no frame pai ao inv\xE9s de elementos invis\xEDveis.
        `.trim()
        };
      }
      return null;
    }
    generateGuide(node) {
      const rect = node;
      return {
        node_id: rect.id,
        problem: `Spacer detectado: "${rect.name}"`,
        severity: this.severity,
        step_by_step: [
          { step: 1, action: "Selecione o frame pai que cont\xE9m este spacer" },
          { step: 2, action: "Verifique se o frame pai usa Auto Layout (se n\xE3o, aplique com Shift + A)" },
          { step: 3, action: 'Aumente o valor de "Gap" no painel direito' },
          { step: 4, action: `Delete o elemento "${rect.name}"` },
          { step: 5, action: "Ajuste o gap at\xE9 obter o espa\xE7amento desejado" }
        ],
        before_after_example: {
          before: "Frame com spacers (ret\xE2ngulos invis\xEDveis) entre elementos",
          after: "Frame com Auto Layout e gap configurado"
        },
        estimated_time: "30 segundos",
        difficulty: "easy"
      };
    }
  };

  // src/linter/rules/naming/GenericNameRule.ts
  var GenericNameRule = class {
    constructor() {
      __publicField(this, "id", "generic-name-detected");
      __publicField(this, "category", "naming");
      __publicField(this, "severity", "major");
      __publicField(this, "GENERIC_PATTERNS", /^(Frame|Rectangle|Group|Vector|Ellipse|Line|Component|Instance)\s+\d+$/);
    }
    async validate(node) {
      if (this.GENERIC_PATTERNS.test(node.name)) {
        const suggestedPattern = this.detectSuggestedPattern(node);
        const examples = this.getExamplesForNodeType(node);
        return {
          node_id: node.id,
          node_name: node.name,
          severity: this.severity,
          category: this.category,
          rule: this.id,
          message: `Nome gen\xE9rico detectado: "${node.name}"`,
          educational_tip: `
\u26A0\uFE0F Por que nomenclatura importa?

\u2022 Facilita manuten\xE7\xE3o do design no Figma
\u2022 Melhora a detec\xE7\xE3o autom\xE1tica de widgets
\u2022 Gera c\xF3digo Elementor mais leg\xEDvel
\u2022 Facilita colabora\xE7\xE3o em equipe

\u{1F4A1} Padr\xE3o sugerido: ${suggestedPattern}

\u{1F4D6} Exemplos:
${examples.map((ex) => `  \u2022 ${ex}`).join("\n")}

\u2705 Solu\xE7\xE3o:
Renomeie a camada seguindo a taxonomia Elementor (Btn/*, Img/*, Icon/*, H1-H6, Card/*, etc.)
        `.trim()
        };
      }
      return null;
    }
    generateGuide(node) {
      const suggestedPattern = this.detectSuggestedPattern(node);
      const examples = this.getExamplesForNodeType(node);
      return {
        node_id: node.id,
        problem: `Nome gen\xE9rico: "${node.name}"`,
        severity: this.severity,
        step_by_step: [
          { step: 1, action: "Clique duas vezes no nome da camada no Figma" },
          { step: 2, action: `Renomeie seguindo o padr\xE3o: ${suggestedPattern}` },
          { step: 3, action: "Use nomes descritivos que indiquem a fun\xE7\xE3o do elemento" }
        ],
        before_after_example: {
          before: `"${node.name}" (gen\xE9rico)`,
          after: `"${examples[0]}" (descritivo)`
        },
        estimated_time: "10 segundos",
        difficulty: "easy"
      };
    }
    /**
     * Detecta padrão sugerido baseado no tipo de node
     */
    detectSuggestedPattern(node) {
      if (node.type === "TEXT") {
        const textNode = node;
        const fontSize = typeof textNode.fontSize === "number" ? textNode.fontSize : 16;
        if (fontSize >= 32) return "H1, H2, H3";
        if (fontSize >= 24) return "H4, H5";
        return "Text/Paragraph, Text/Description, Text/Label";
      }
      if (node.type === "RECTANGLE") {
        const rect = node;
        if (this.hasImageFill(rect)) {
          return "Img/Hero, Img/Product, Img/Background";
        }
        if (this.isButtonLike(rect)) {
          return "Btn/Primary, Btn/Secondary, Btn/Outline";
        }
        return "Container/*, Section/*";
      }
      if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION") {
        return "Icon/Menu, Icon/Close, Icon/Arrow";
      }
      if (node.type === "FRAME") {
        const frame = node;
        if (frame.layoutMode !== "NONE") {
          return "Card/*, Grid/*, Section/*, Container/*";
        }
      }
      return "Descreva a fun\xE7\xE3o do elemento";
    }
    /**
     * Obtém exemplos de nomenclatura para o tipo de node
     */
    getExamplesForNodeType(node) {
      if (node.type === "TEXT") {
        return [
          "H1 - T\xEDtulo principal",
          "H2/Features - Subt\xEDtulo da se\xE7\xE3o",
          "Text/Description - Texto descritivo",
          "Label/Price - R\xF3tulo de pre\xE7o"
        ];
      }
      if (node.type === "RECTANGLE") {
        const rect = node;
        if (this.hasImageFill(rect)) {
          return [
            "Img/Hero - Imagem principal",
            "Img/Product - Imagem de produto",
            "Img/Avatar - Foto de perfil"
          ];
        }
        if (this.isButtonLike(rect)) {
          return [
            "Btn/Primary - Bot\xE3o principal",
            "Btn/CTA - Call to action",
            "Btn/Submit - Bot\xE3o de envio"
          ];
        }
      }
      if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION") {
        return [
          "Icon/Menu - \xCDcone de menu",
          "Icon/Close - \xCDcone de fechar",
          "Icon/Arrow - \xCDcone de seta"
        ];
      }
      if (node.type === "FRAME") {
        return [
          "Card/Product - Card de produto",
          "Grid/Features - Grid de funcionalidades",
          "Section/Hero - Se\xE7\xE3o hero",
          "Container/Content - Container de conte\xFAdo"
        ];
      }
      return ["Use nomes descritivos"];
    }
    /**
     * Verifica se node tem fill de imagem
     */
    hasImageFill(node) {
      if (!node.fills || typeof node.fills === "symbol") return false;
      return node.fills.some((fill) => fill.type === "IMAGE");
    }
    /**
     * Verifica se node parece um botão
     */
    isButtonLike(node) {
      const hasFill = node.fills && typeof node.fills !== "symbol" && node.fills.length > 0;
      const hasStroke = node.strokes && typeof node.strokes !== "symbol" && node.strokes.length > 0;
      const hasRadius = typeof node.cornerRadius === "number" && node.cornerRadius > 0;
      return hasFill && hasRadius || hasFill && hasStroke;
    }
  };

  // src/linter/rules/naming/WidgetNamingRule.ts
  var WidgetNamingRule = class {
    constructor() {
      __publicField(this, "id", "widget-naming");
      __publicField(this, "category", "naming");
      __publicField(this, "severity", "major");
      __publicField(this, "detector", new WidgetDetector());
    }
    async validate(node) {
      const detection = this.detector.detect(node);
      if (!detection) {
        return null;
      }
      const currentName = node.name;
      const suggestedWidget = detection.widget;
      const confidence = detection.confidence;
      if (confidence < 0.6) {
        return null;
      }
      const isCorrectlyNamed = currentName.toLowerCase().includes(suggestedWidget.toLowerCase()) || currentName.startsWith("w:") || currentName.startsWith("woo:") || currentName.startsWith("loop:");
      if (isCorrectlyNamed) {
        return null;
      }
      const alternatives = this.getAlternativeNames(suggestedWidget, currentName);
      return {
        node_id: node.id,
        node_name: node.name,
        node_type: node.type,
        severity: this.severity,
        category: this.category,
        rule: this.id,
        message: `Widget detectado como "${suggestedWidget}" (${Math.round(confidence * 100)}% confian\xE7a), mas nome atual \xE9 "${currentName}"`,
        // ===== NAMING OBJECT FOR UI ACTION PANEL =====
        widgetType: suggestedWidget,
        confidence,
        naming: {
          recommendedName: suggestedWidget,
          alternatives
        },
        educational_tip: `
\u{1F4A1} Widget Detection

O Linter detectou que este elemento corresponde ao widget "${suggestedWidget}" do Elementor.

\u{1F4CB} Por que nomenclatura correta importa:
\u2022 Facilita identifica\xE7\xE3o visual no Figma
\u2022 Melhora convers\xE3o autom\xE1tica para Elementor
\u2022 Reduz erros na exporta\xE7\xE3o
\u2022 Torna o design system mais consistente

\u2705 Nomenclatura recomendada:
${this.getSuggestions(suggestedWidget, currentName).join("\n")}

\u{1F3AF} Justificativa da detec\xE7\xE3o:
${detection.justification}
            `.trim(),
        fixAvailable: true
        // Naming now has one-click fix via UI
      };
    }
    /**
     * Generate cleaner alternative names for the dropdown
     */
    getAlternativeNames(widget, currentName) {
      const alternatives = [];
      const context = currentName.replace(/frame|rectangle|group|circle|ellipse|polygon|\d+/gi, "").trim();
      if (context && context.length > 1) {
        const contextName = `${context} ${widget}`.replace(/\s+/g, " ").trim();
        if (contextName !== widget) {
          alternatives.push(contextName);
        }
      }
      const widgetBase = widget.toLowerCase();
      if (widgetBase.includes("button")) {
        if (!widget.includes("primary")) alternatives.push(`${widget}-primary`);
        if (!widget.includes("secondary")) alternatives.push(`${widget}-secondary`);
      } else if (widgetBase.includes("heading")) {
        alternatives.push(`${widget}-hero`);
      } else if (widgetBase.includes("container")) {
        alternatives.push(`c:section`);
        alternatives.push(`c:wrapper`);
      }
      return alternatives.slice(0, 3);
    }
    generateGuide(node) {
      const detection = this.detector.detect(node);
      const suggestedWidget = (detection == null ? void 0 : detection.widget) || "w:unknown";
      return {
        node_id: node.id,
        problem: `Nome n\xE3o reflete o widget detectado (${suggestedWidget})`,
        severity: this.severity,
        step_by_step: [
          { step: 1, action: "Selecione o layer no Figma" },
          { step: 2, action: `Renomeie para "${suggestedWidget}"` },
          { step: 3, action: "Ou use um nome descritivo que inclua o tipo de widget" },
          { step: 4, action: 'Exemplo: "Hero CTA Button" ou "w:button"' }
        ],
        before_after_example: {
          before: `Nome gen\xE9rico: "${node.name}"`,
          after: `Nome correto: "${suggestedWidget}" ou "Hero ${suggestedWidget}"`
        },
        estimated_time: "30 segundos",
        difficulty: "easy"
      };
    }
    getSuggestions(widget, currentName) {
      const suggestions = [];
      suggestions.push(`\u2022 "${widget}" (padr\xE3o t\xE9cnico)`);
      const context = currentName.replace(/frame|rectangle|group|\d+/gi, "").trim();
      if (context) {
        suggestions.push(`\u2022 "${context} ${widget}" (nome descritivo)`);
      }
      const widgetType = widget.split(":")[1] || widget;
      suggestions.push(`\u2022 "Hero ${widgetType}" ou "Footer ${widgetType}" (nome funcional)`);
      return suggestions;
    }
  };

  // src/linter/index.ts
  async function analyzeFigmaLayout(node, options = {
    aiAssisted: false,
    aiProvider: "none",
    deviceTarget: "desktop"
  }) {
    console.log("\u{1F4CD} [analyzeFigmaLayout] Iniciando...");
    const engine = new LinterEngine();
    console.log("\u{1F4CD} [analyzeFigmaLayout] Engine criado");
    const registry2 = new RuleRegistry();
    console.log("\u{1F4CD} [analyzeFigmaLayout] Registry criado");
    console.log("\u{1F4CD} [analyzeFigmaLayout] Registrando regras...");
    registry2.registerAll([
      new AutoLayoutRule(),
      new SpacerDetectionRule(),
      new GenericNameRule(),
      new WidgetNamingRule()
    ]);
    console.log("\u{1F4CD} [analyzeFigmaLayout] Regras registradas");
    console.log("\u{1F4CD} [analyzeFigmaLayout] Iniciando engine.analyze...");
    const results = await engine.analyze(node, registry2, options);
    console.log(`\u{1F4CD} [analyzeFigmaLayout] An\xE1lise completa. ${results.length} resultados`);
    console.log("\u{1F4CD} [analyzeFigmaLayout] Gerando relat\xF3rio...");
    const report = engine.generateReport(results, registry2, options, node);
    console.log("\u{1F4CD} [analyzeFigmaLayout] Relat\xF3rio gerado com sucesso");
    return report;
  }
  async function validateSingleNode(node) {
    const engine = new LinterEngine();
    const registry2 = new RuleRegistry();
    registry2.registerAll([
      new AutoLayoutRule(),
      new SpacerDetectionRule(),
      new GenericNameRule()
    ]);
    const results = await engine.analyzeNode(node, registry2);
    return {
      isValid: results.length === 0,
      issues: results.map((r) => r.message)
    };
  }

  // src/services/heuristics/index.ts
  var isSceneNode = (node) => {
    return !!node && typeof node === "object" && typeof node.type === "string" && typeof node.name === "string";
  };
  var DefaultHeuristicsService = class {
    analyzeTree(root) {
      return analyzeTreeWithHeuristics(root);
    }
    generateSchema(root) {
      const analyzed = this.analyzeTree(root);
      return convertToFlexSchema(analyzed);
    }
    async enforceWidgetTypes(schema, deps = {}) {
      const getNodeById = deps.getNodeById || ((id) => {
        try {
          return figma.getNodeById(id);
        } catch (e) {
          return null;
        }
      });
      const visitContainer = async (container) => {
        for (const widget of container.widgets || []) {
          await this.fixWidget(widget, getNodeById);
        }
        for (const child of container.children || []) {
          await visitContainer(child);
        }
      };
      for (const container of schema.containers) {
        await visitContainer(container);
      }
      return schema;
    }
    async fixWidget(widget, getNodeById) {
      if (widget.id) {
        try {
          const node = await getNodeById(widget.id);
          if (isSceneNode(node)) {
            if (node.name.startsWith("w:image") && !node.name.startsWith("w:image-box") && widget.type !== "image") {
              widget.type = "image";
            }
            if (node.name.startsWith("w:button") && widget.type !== "button") {
              widget.type = "button";
            }
          }
        } catch (err) {
          console.error(`[Heuristics] Error checking node ${widget.id}:`, err);
        }
      }
      if (widget.children && Array.isArray(widget.children)) {
        for (const child of widget.children) {
          if (!child.id) continue;
          try {
            const childNode = await getNodeById(child.id);
            if (isSceneNode(childNode) && (childNode.type === "VECTOR" || childNode.name === "Icon") && child.type !== "icon") {
              child.type = "icon";
            }
          } catch (e) {
          }
        }
      }
    }
  };
  var heuristicsService = new DefaultHeuristicsService();
  async function enforceWidgetTypes(schema, deps) {
    return heuristicsService.enforceWidgetTypes(schema, deps);
  }

  // src/compat/polyfills/trim.ts
  function installTrimPolyfill() {
    if (typeof String.prototype.trim === "function") {
      return;
    }
    Object.defineProperty(String.prototype, "trim", {
      value: function trim() {
        return String(this).replace(/^\s+|\s+$/g, "");
      },
      configurable: true,
      writable: true
    });
  }

  // src/compat/polyfills/flat.ts
  function installFlatPolyfill() {
    if (typeof Array.prototype.flat === "function") {
      return;
    }
    Object.defineProperty(Array.prototype, "flat", {
      value: function flat(depth) {
        const maxDepth = typeof depth === "number" && depth > 0 ? depth : 1;
        const flatten = (arr, currentDepth) => {
          if (currentDepth > maxDepth) {
            return arr.slice();
          }
          const result = [];
          for (const item of arr) {
            if (Array.isArray(item)) {
              result.push(...flatten(item, currentDepth + 1));
            } else {
              result.push(item);
            }
          }
          return result;
        };
        return flatten(this, 0);
      },
      configurable: true,
      writable: true
    });
  }

  // src/compat/polyfills/promise-finally.ts
  function installPromiseFinallyPolyfill() {
    if (typeof Promise.prototype.finally === "function") {
      return;
    }
    Promise.prototype.finally = function finallyPolyfill(onFinally) {
      const handler = typeof onFinally === "function" ? onFinally : () => void 0;
      const promise = this;
      return promise.then(
        (value) => Promise.resolve(handler()).then(() => value),
        (reason) => Promise.resolve(handler()).then(() => {
          throw reason;
        })
      );
    };
  }

  // src/compat/polyfills/fromEntries.ts
  function installFromEntriesPolyfill() {
    if (typeof Object.fromEntries === "function") {
      return;
    }
    Object.fromEntries = function fromEntries(entries) {
      const obj = {};
      if (!entries) {
        return obj;
      }
      for (const pair of entries) {
        if (!pair || pair.length < 2) continue;
        const [key, value] = pair;
        obj[key] = value;
      }
      return obj;
    };
  }

  // src/types/runtime.ts
  var globalScope = typeof globalThis !== "undefined" ? globalThis : {};
  var runtimeFigma = globalScope.figma;
  var FIGMA_MIXED_SENTINEL = runtimeFigma && runtimeFigma.mixed ? runtimeFigma.mixed : "__FIGMA_MIXED_SENTINEL__";
  function isFigmaMixedValue(value) {
    if (runtimeFigma && runtimeFigma.mixed) {
      return value === runtimeFigma.mixed;
    }
    return value === FIGMA_MIXED_SENTINEL;
  }

  // src/compat/safe-access.ts
  var pathCache = /* @__PURE__ */ new Map();
  function toSegments(path) {
    if (Array.isArray(path)) {
      return path;
    }
    if (pathCache.has(path)) {
      return pathCache.get(path);
    }
    const segments = [];
    path.split(".").forEach((part) => {
      if (!part) return;
      const bracketMatches = part.match(/([^\[\]]+)|\[(\d+)\]/g);
      if (!bracketMatches) {
        segments.push(part);
        return;
      }
      bracketMatches.forEach((segment) => {
        if (!segment) return;
        if (segment.startsWith("[") && segment.endsWith("]")) {
          const index = parseInt(segment.slice(1, -1), 10);
          segments.push(isNaN(index) ? segment : index);
        } else {
          segments.push(segment);
        }
      });
    });
    pathCache.set(path, segments);
    return segments;
  }
  function safeGet(source, path, defaultValue) {
    if (path === void 0 || path === null || path === "") {
      return source === void 0 ? defaultValue : source;
    }
    const segments = toSegments(path);
    let current = source;
    for (const segment of segments) {
      if (current === null || current === void 0) {
        return defaultValue;
      }
      try {
        current = current[segment];
      } catch (e) {
        return defaultValue;
      }
      if (isFigmaMixedValue(current)) {
        return defaultValue;
      }
    }
    if (current === void 0) {
      return defaultValue;
    }
    return current;
  }
  function safeGetArray(source, path, defaultValue = []) {
    const value = safeGet(source, path);
    return Array.isArray(value) ? value : defaultValue;
  }
  function safeGetNumber(source, path, defaultValue = 0) {
    const value = safeGet(source, path);
    return typeof value === "number" && !Number.isNaN(value) ? value : defaultValue;
  }
  function safeGetString(source, path, defaultValue = "") {
    const value = safeGet(source, path);
    return typeof value === "string" ? value : defaultValue;
  }
  function safeGetBoolean(source, path, defaultValue = false) {
    const value = safeGet(source, path);
    return typeof value === "boolean" ? value : defaultValue;
  }

  // src/compat/runtime/envelope.ts
  var initialized = false;
  var cachedHealth = { runtime: "ok", timestamp: Date.now() };
  var runtimeLogger;
  function initializeRuntimeEnvelope(options) {
    if (initialized) {
      return cachedHealth;
    }
    initialized = true;
    runtimeLogger = options == null ? void 0 : options.logger;
    cachedHealth = buildHealthReport();
    if (options == null ? void 0 : options.onHealthChange) {
      safeInvoke(() => options.onHealthChange(cachedHealth));
    }
    return cachedHealth;
  }
  function buildHealthReport() {
    const warnings = [];
    if (typeof String.prototype.trim !== "function") warnings.push("string.trim");
    if (typeof Array.prototype.flat !== "function") warnings.push("array.flat");
    if (typeof Promise.prototype.finally !== "function") warnings.push("promise.finally");
    if (typeof Object.fromEntries !== "function") warnings.push("object.fromEntries");
    return {
      runtime: warnings.length > 0 ? "warn" : "ok",
      warnings,
      timestamp: Date.now()
    };
  }
  function safeInvoke(fn, fallback) {
    try {
      return fn();
    } catch (error) {
      if (runtimeLogger) {
        try {
          runtimeLogger("runtime.error", {
            message: safeGet(error, "message") || String(error)
          });
        } catch (e) {
        }
      }
      return fallback;
    }
  }

  // src/compat/index.ts
  var compatReady = false;
  var compatState = null;
  function initializeCompatLayer(options) {
    if (compatReady && compatState) {
      return compatState;
    }
    installTrimPolyfill();
    installFlatPolyfill();
    installPromiseFinallyPolyfill();
    installFromEntriesPolyfill();
    compatState = initializeRuntimeEnvelope(options);
    compatReady = true;
    return compatState;
  }

  // src/licensing/LicenseConfig.ts
  var LICENSE_BACKEND_URL = "https://figmatoelementor.pljr.com.br";
  var LICENSE_ENDPOINT = "/wp-json/figtoel/v1/usage/compile";
  var LICENSE_PLANS_URL = "https://figmatoelementor.pljr.com.br/planos/";
  var LICENSE_STORAGE_KEY = "figtoel_license_config_v1";
  var CLIENT_ID_STORAGE_KEY = "figtoel_client_id_v1";
  var PLUGIN_VERSION = "1.1.0";
  var ERROR_MESSAGES = {
    license_not_found: "N\xE3o encontramos essa chave de licen\xE7a. Verifique se digitou corretamente ou adquira um plano.",
    license_inactive: "Sua licen\xE7a n\xE3o est\xE1 ativa. Regularize seu plano em /planos/.",
    limit_sites_reached: "Limite m\xE1ximo de sites atingido para esta licen\xE7a. Gerencie seus sites na \xE1rea do cliente.",
    site_register_error: "N\xE3o foi poss\xEDvel registrar este dom\xEDnio para sua licen\xE7a. Tente novamente ou contate o suporte.",
    usage_error: "Erro ao registrar uso da licen\xE7a. Tente novamente mais tarde ou contate o suporte.",
    missing_params: "Dados incompletos. Verifique a chave e o dom\xEDnio.",
    network_error: "Servidor temporariamente indispon\xEDvel. Verifique sua conex\xE3o e tente novamente.",
    license_user_mismatch: "Esta chave j\xE1 est\xE1 vinculada a outra conta Figma. Use a conta original ou adquira uma nova licen\xE7a.",
    figma_user_required: "N\xE3o foi poss\xEDvel identificar sua conta Figma. Recarregue o plugin e tente novamente."
  };
  function getErrorMessage(code) {
    return ERROR_MESSAGES[code] || "Erro desconhecido. Contate o suporte.";
  }
  function maskLicenseKey(key) {
    if (!key || key.length < 10) return "****";
    const prefix = key.substring(0, 5);
    const suffix = key.substring(key.length - 5);
    return `${prefix}*****${suffix}`;
  }
  function generateClientId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }

  // src/licensing/LicenseService.ts
  async function getOrCreateClientId() {
    try {
      let clientId = await figma.clientStorage.getAsync(CLIENT_ID_STORAGE_KEY);
      if (!clientId) {
        clientId = generateClientId();
        await figma.clientStorage.setAsync(CLIENT_ID_STORAGE_KEY, clientId);
        console.log("[LICENSE] Novo client_id gerado");
      }
      return clientId;
    } catch (e) {
      console.warn("[LICENSE] Erro ao gerenciar client_id:", e);
      return generateClientId();
    }
  }
  async function loadLicenseConfig() {
    try {
      const stored = await figma.clientStorage.getAsync(LICENSE_STORAGE_KEY);
      if (!stored) return null;
      return stored;
    } catch (e) {
      console.warn("[LICENSE] Erro ao carregar configura\xE7\xE3o");
      return null;
    }
  }
  async function saveLicenseConfig(config) {
    try {
      await figma.clientStorage.setAsync(LICENSE_STORAGE_KEY, config);
      console.log("[LICENSE] Configura\xE7\xE3o salva");
    } catch (e) {
      console.error("[LICENSE] Erro ao salvar configura\xE7\xE3o");
      throw new Error("N\xE3o foi poss\xEDvel salvar a configura\xE7\xE3o da licen\xE7a.");
    }
  }
  async function clearLicenseConfig() {
    try {
      await figma.clientStorage.deleteAsync(LICENSE_STORAGE_KEY);
      console.log("[LICENSE] Configura\xE7\xE3o removida");
    } catch (e) {
      console.warn("[LICENSE] Erro ao limpar configura\xE7\xE3o");
    }
  }
  async function callLicenseEndpoint(request) {
    const url = `${LICENSE_BACKEND_URL}${LICENSE_ENDPOINT}`;
    console.log("[LICENSE] Chamando endpoint:", url);
    console.log("[LICENSE] Payload:", {
      license_key: maskLicenseKey(request.license_key),
      site_domain: request.site_domain,
      figma_user_id: request.figma_user_id ? "***" + request.figma_user_id.slice(-4) : "N/A",
      client_id: request.client_id ? "***" + request.client_id.slice(-4) : "N/A"
    });
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `Figma-To-Elementor/${PLUGIN_VERSION}`
        },
        body: JSON.stringify(request)
      });
      const data = await response.json();
      const safeData = __spreadValues({}, data);
      if (safeData.license_key) {
        safeData.license_key = maskLicenseKey(safeData.license_key);
      }
      console.log("[LICENSE] Resposta:", safeData);
      return data;
    } catch (error) {
      console.error("[LICENSE] Erro de rede");
      return {
        status: "error",
        code: "network_error",
        message: "Servidor temporariamente indispon\xEDvel"
      };
    }
  }
  async function validateAndSaveLicense(licenseKey, siteDomain, figmaUserId) {
    const cleanDomain = siteDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase().trim();
    const cleanKey = licenseKey.trim().toUpperCase();
    if (!cleanKey || !cleanDomain) {
      return {
        allowed: false,
        status: "not_configured",
        message: "Chave de licen\xE7a e dom\xEDnio s\xE3o obrigat\xF3rios."
      };
    }
    if (!figmaUserId) {
      return {
        allowed: false,
        status: "license_error",
        message: getErrorMessage("figma_user_required")
      };
    }
    const clientId = await getOrCreateClientId();
    const response = await callLicenseEndpoint({
      license_key: cleanKey,
      site_domain: cleanDomain,
      plugin_version: PLUGIN_VERSION,
      figma_user_id: figmaUserId,
      client_id: clientId
    });
    if (response.status === "error") {
      const errorResponse = response;
      const errorCode = errorResponse.code;
      const errorMessage = getErrorMessage(errorCode);
      const lastStatus = errorCode === "license_user_mismatch" ? "license_user_mismatch" : "error";
      const config2 = {
        licenseKey: cleanKey,
        siteDomain: cleanDomain,
        pluginVersion: PLUGIN_VERSION,
        figmaUserIdBound: "",
        clientId,
        lastStatus,
        planSlug: null,
        usageSnapshot: null,
        lastValidatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await saveLicenseConfig(config2);
      return {
        allowed: false,
        status: errorCode === "license_user_mismatch" ? "license_user_mismatch" : "license_error",
        message: errorMessage
      };
    }
    const successResponse = response;
    if (successResponse.status === "limit_reached" || successResponse.usage.status === "limit_reached") {
      const config2 = {
        licenseKey: cleanKey,
        siteDomain: cleanDomain,
        pluginVersion: PLUGIN_VERSION,
        figmaUserIdBound: figmaUserId,
        clientId,
        lastStatus: "limit_reached",
        planSlug: successResponse.plan_slug,
        usageSnapshot: {
          used: successResponse.usage.used,
          limit: successResponse.usage.limit,
          warning: successResponse.usage.warning,
          resetsAt: successResponse.usage.resets_at
        },
        lastValidatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await saveLicenseConfig(config2);
      return {
        allowed: false,
        status: "limit_reached",
        message: `Limite mensal atingido (${successResponse.usage.used}/${successResponse.usage.limit} compila\xE7\xF5es).`,
        usage: successResponse.usage,
        planSlug: successResponse.plan_slug
      };
    }
    const config = {
      licenseKey: cleanKey,
      siteDomain: cleanDomain,
      pluginVersion: PLUGIN_VERSION,
      figmaUserIdBound: figmaUserId,
      clientId,
      lastStatus: "ok",
      planSlug: successResponse.plan_slug,
      usageSnapshot: {
        used: successResponse.usage.used,
        limit: successResponse.usage.limit,
        warning: successResponse.usage.warning,
        resetsAt: successResponse.usage.resets_at
      },
      lastValidatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await saveLicenseConfig(config);
    let message = "Licen\xE7a validada com sucesso!";
    if (successResponse.usage.warning === "soft_limit") {
      message = `Licen\xE7a v\xE1lida. Aten\xE7\xE3o: voc\xEA j\xE1 usou ${successResponse.usage.used} de ${successResponse.usage.limit} compila\xE7\xF5es este m\xEAs.`;
    }
    return {
      allowed: true,
      status: "ok",
      message,
      usage: successResponse.usage,
      planSlug: successResponse.plan_slug
    };
  }
  async function checkAndConsumeLicenseUsage(figmaUserId) {
    const config = await loadLicenseConfig();
    if (!config || !config.licenseKey || !config.siteDomain) {
      return {
        allowed: false,
        status: "not_configured",
        message: 'Licen\xE7a n\xE3o configurada. Configure sua chave de licen\xE7a na aba "Licen\xE7a".'
      };
    }
    if (!figmaUserId) {
      return {
        allowed: false,
        status: "license_error",
        message: getErrorMessage("figma_user_required")
      };
    }
    const clientId = config.clientId || await getOrCreateClientId();
    const response = await callLicenseEndpoint({
      license_key: config.licenseKey,
      site_domain: config.siteDomain,
      plugin_version: PLUGIN_VERSION,
      figma_user_id: figmaUserId,
      client_id: clientId
    });
    if (response.status === "error") {
      const errorResponse = response;
      const errorCode = errorResponse.code;
      const errorMessage = getErrorMessage(errorCode);
      config.lastStatus = errorCode === "license_user_mismatch" ? "license_user_mismatch" : "error";
      config.lastValidatedAt = (/* @__PURE__ */ new Date()).toISOString();
      await saveLicenseConfig(config);
      if (errorCode === "license_user_mismatch") {
        return {
          allowed: false,
          status: "license_user_mismatch",
          message: errorMessage
        };
      }
      if (errorCode === "network_error") {
        return {
          allowed: false,
          status: "network_error",
          message: errorMessage
        };
      }
      return {
        allowed: false,
        status: "license_error",
        message: errorMessage
      };
    }
    const successResponse = response;
    config.lastStatus = successResponse.status === "limit_reached" ? "limit_reached" : "ok";
    config.planSlug = successResponse.plan_slug;
    config.figmaUserIdBound = figmaUserId;
    config.usageSnapshot = {
      used: successResponse.usage.used,
      limit: successResponse.usage.limit,
      warning: successResponse.usage.warning,
      resetsAt: successResponse.usage.resets_at
    };
    config.lastValidatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await saveLicenseConfig(config);
    if (successResponse.status === "limit_reached" || successResponse.usage.status === "limit_reached") {
      return {
        allowed: false,
        status: "limit_reached",
        message: `Limite mensal de compila\xE7\xF5es atingido (${successResponse.usage.used}/${successResponse.usage.limit}). Renova em breve.`,
        usage: successResponse.usage,
        planSlug: successResponse.plan_slug
      };
    }
    let message = `Compila\xE7\xE3o autorizada (${successResponse.usage.used}/${successResponse.usage.limit} este m\xEAs).`;
    return {
      allowed: true,
      status: "ok",
      message,
      usage: successResponse.usage,
      planSlug: successResponse.plan_slug
    };
  }
  async function getLicenseDisplayInfo() {
    const config = await loadLicenseConfig();
    if (!config) {
      return {
        configured: false,
        licenseKey: "",
        licenseKeyMasked: "",
        siteDomain: "",
        planSlug: null,
        usage: null,
        status: "not_configured",
        lastValidated: null,
        figmaUserIdBound: ""
      };
    }
    return {
      configured: true,
      licenseKey: config.licenseKey,
      licenseKeyMasked: maskLicenseKey(config.licenseKey),
      siteDomain: config.siteDomain,
      planSlug: config.planSlug,
      usage: config.usageSnapshot,
      status: config.lastStatus,
      lastValidated: config.lastValidatedAt,
      figmaUserIdBound: config.figmaUserIdBound || ""
    };
  }

  // src/engine/zone-detector.ts
  function detectZone(nodeY, rootHeight) {
    if (!rootHeight || rootHeight <= 0) {
      return "BODY";
    }
    var relativeY = nodeY;
    if (relativeY < 150) {
      return "HEADER";
    }
    if (relativeY > rootHeight - 300) {
      return "FOOTER";
    }
    if (relativeY < 800) {
      return "HERO";
    }
    return "BODY";
  }

  // src/engine/feature-extractor.ts
  function extractNodeFeatures(node, rootFrame) {
    var baseWidth = 0;
    var baseHeight = 0;
    var x = 0;
    var y = 0;
    var childCount = 0;
    var layoutMode = "NONE";
    var primaryAxisSizingMode;
    var counterAxisSizingMode;
    var hasNestedFrames = false;
    if ("width" in node && typeof node.width === "number") {
      baseWidth = node.width;
    }
    if ("height" in node && typeof node.height === "number") {
      baseHeight = node.height;
    }
    if ("x" in node && typeof node.x === "number") {
      x = node.x;
    }
    if ("y" in node && typeof node.y === "number") {
      y = node.y;
    }
    if ("children" in node && Array.isArray(node.children)) {
      var children = node.children;
      childCount = children.length;
      for (var n = 0; n < children.length; n++) {
        var ch = children[n];
        if (ch.type === "FRAME" || ch.type === "GROUP" || ch.type === "COMPONENT" || ch.type === "INSTANCE") {
          hasNestedFrames = true;
          break;
        }
      }
      if ("layoutMode" in node) {
        var lm = node.layoutMode;
        if (lm === "HORIZONTAL" || lm === "VERTICAL" || lm === "NONE") {
          layoutMode = lm;
        }
      }
      if ("primaryAxisSizingMode" in node) {
        var p = node.primaryAxisSizingMode;
        if (p === "FIXED" || p === "AUTO") {
          primaryAxisSizingMode = p;
        }
      }
      if ("counterAxisSizingMode" in node) {
        var c = node.counterAxisSizingMode;
        if (c === "FIXED" || c === "AUTO") {
          counterAxisSizingMode = c;
        }
      }
    }
    var hasFill = false;
    var hasStroke = false;
    var hasText = false;
    var textCount = 0;
    var hasImage = false;
    var imageCount = 0;
    var textLength = 0;
    var fontSize = 0;
    var fontWeight = 400;
    if (node.type === "TEXT") {
      hasText = true;
      textCount = 1;
      var textNode = node;
      var chars = textNode.characters;
      textLength = chars ? chars.length : 0;
      if ("fontSize" in textNode && typeof textNode.fontSize === "number") {
        fontSize = textNode.fontSize;
      }
      if ("fontWeight" in textNode && typeof textNode.fontWeight === "number") {
        fontWeight = textNode.fontWeight;
      } else if ("fontName" in textNode) {
        var fn = textNode.fontName;
        if (fn && fn.style) {
          var style = fn.style.toLowerCase();
          if (style.indexOf("bold") >= 0) {
            fontWeight = 700;
          } else if (style.indexOf("semibold") >= 0 || style.indexOf("semi") >= 0) {
            fontWeight = 600;
          } else if (style.indexOf("medium") >= 0) {
            fontWeight = 500;
          } else if (style.indexOf("light") >= 0) {
            fontWeight = 300;
          }
        }
      }
    }
    if ("fills" in node) {
      var fills = node.fills;
      if (Array.isArray(fills)) {
        for (var i = 0; i < fills.length; i++) {
          var fill = fills[i];
          if (fill && fill.type === "SOLID") {
            hasFill = true;
          }
          if (fill && fill.type === "IMAGE") {
            hasImage = true;
            imageCount++;
          }
        }
      }
    }
    if ("strokes" in node) {
      var strokes = node.strokes;
      if (Array.isArray(strokes) && strokes.length > 0) {
        hasStroke = true;
      }
    }
    var maxFontSize = fontSize;
    var maxFontWeight = fontWeight;
    if ("children" in node && Array.isArray(node.children)) {
      var _children = node.children;
      for (var j = 0; j < _children.length; j++) {
        var child = _children[j];
        if (child.type === "TEXT") {
          hasText = true;
          textCount++;
          var childText = child;
          textLength += childText.characters ? childText.characters.length : 0;
          if ("fontSize" in childText && typeof childText.fontSize === "number") {
            if (childText.fontSize > maxFontSize) {
              maxFontSize = childText.fontSize;
            }
          }
          if ("fontName" in childText) {
            var cfn = childText.fontName;
            if (cfn && cfn.style) {
              var cstyle = cfn.style.toLowerCase();
              var cw = 400;
              if (cstyle.indexOf("bold") >= 0) {
                cw = 700;
              } else if (cstyle.indexOf("semibold") >= 0 || cstyle.indexOf("semi") >= 0) {
                cw = 600;
              } else if (cstyle.indexOf("medium") >= 0) {
                cw = 500;
              }
              if (cw > maxFontWeight) {
                maxFontWeight = cw;
              }
            }
          }
        }
        if ("fills" in child) {
          var childFills = child.fills;
          if (Array.isArray(childFills)) {
            for (var k = 0; k < childFills.length; k++) {
              var cf = childFills[k];
              if (cf && cf.type === "IMAGE") {
                hasImage = true;
                imageCount++;
              }
            }
          }
        }
      }
    }
    if (maxFontSize > fontSize) {
      fontSize = maxFontSize;
    }
    if (maxFontWeight > fontWeight) {
      fontWeight = maxFontWeight;
    }
    var aspectRatio = 0;
    if (baseHeight > 0) {
      aspectRatio = baseWidth / baseHeight;
    }
    var area = baseWidth * baseHeight;
    var rootHeight = null;
    if (rootFrame && "height" in rootFrame) {
      rootHeight = rootFrame.height;
    }
    var zone = detectZone(y, rootHeight);
    var vectorTypes2 = ["VECTOR", "STAR", "ELLIPSE", "POLYGON", "BOOLEAN_OPERATION", "LINE"];
    var isVectorNode = vectorTypes2.indexOf(node.type) >= 0;
    var vectorWidth = isVectorNode ? baseWidth : 0;
    var vectorHeight = isVectorNode ? baseHeight : 0;
    var parentLayoutMode = "NONE";
    var siblingCount = 0;
    if (node.parent && "layoutMode" in node.parent) {
      var pm = node.parent.layoutMode;
      if (pm === "HORIZONTAL" || pm === "VERTICAL") {
        parentLayoutMode = pm;
      }
      if ("children" in node.parent && Array.isArray(node.parent.children)) {
        siblingCount = node.parent.children.length;
      }
    }
    var features = {
      id: node.id,
      name: node.name,
      type: node.type,
      width: baseWidth,
      height: baseHeight,
      x,
      y,
      area,
      childCount,
      layoutMode,
      primaryAxisSizingMode,
      counterAxisSizingMode,
      hasNestedFrames,
      hasFill,
      hasStroke,
      hasText,
      textCount,
      hasImage,
      imageCount,
      textLength,
      fontSize,
      fontWeight,
      isVectorNode,
      vectorWidth,
      vectorHeight,
      parentLayoutMode,
      siblingCount,
      aspectRatio,
      zone
    };
    return features;
  }

  // src/engine/decision-engine.ts
  var EXPLAIN_ENABLED = true;
  var V2_MIN_CONFIDENCE2 = 0.7;
  function explainDecision(explanation) {
    if (!EXPLAIN_ENABLED) return;
    const candidateList = explanation.candidates.slice(0, 3).map((c) => `${c.widget}(${c.score.toFixed(2)})`).join(", ");
    const featureStr = Object.entries(explanation.features).filter(([_, v]) => v !== void 0 && v !== null && v !== false && v !== 0).slice(0, 5).map(([k, v]) => `${k}=${typeof v === "number" ? v.toFixed ? v.toFixed(0) : v : v}`).join(", ");
    console.log(
      `[V2-EXPLAIN] Node ${explanation.nodeId} | ${explanation.winner || "container"} (${explanation.score.toFixed(2)}) | ${explanation.reason} | Features: ${featureStr || "none"}`
    );
    if (explanation.candidates.length > 1) {
      console.log(`[V2-EXPLAIN] Candidates: ${candidateList}`);
    }
  }
  function analyzeNodeWithEngine(node, rootFrame) {
    var features = extractNodeFeatures(node, rootFrame);
    var structuralIssues = [];
    if (features.childCount > 0 && features.layoutMode === "NONE") {
      structuralIssues.push({
        severity: "warning",
        message: "Container com filhos sem Auto Layout. Considere aplicar Auto Layout para melhor responsividade.",
        fixAvailable: false
      });
    }
    var candidates = evaluateHeuristics(features);
    var bestMatch = null;
    var alternatives = [];
    var decisionReason = "no candidates";
    if (candidates.length > 0) {
      bestMatch = candidates[0];
      if (bestMatch.score < V2_MIN_CONFIDENCE2) {
        decisionReason = `score ${bestMatch.score.toFixed(2)} < threshold ${V2_MIN_CONFIDENCE2}`;
        bestMatch = {
          widget: "w:container",
          score: 0.3,
          ruleId: "ContainerFallback"
        };
      } else {
        decisionReason = `score ${bestMatch.score.toFixed(2)} >= threshold`;
        for (var i = 1; i < candidates.length; i++) {
          alternatives.push(candidates[i]);
        }
      }
    } else {
      bestMatch = {
        widget: "w:container",
        score: 0.3,
        ruleId: "ContainerFallback"
      };
      decisionReason = "no candidates, fallback";
    }
    explainDecision({
      nodeId: features.id,
      nodeName: features.name,
      winner: (bestMatch == null ? void 0 : bestMatch.widget) || null,
      score: (bestMatch == null ? void 0 : bestMatch.score) || 0,
      reason: decisionReason,
      features: {
        type: features.type,
        width: features.width,
        height: features.height,
        childCount: features.childCount,
        hasText: features.hasText,
        hasImage: features.hasImage,
        fontSize: features.fontSize,
        fontWeight: features.fontWeight,
        zone: features.zone
      },
      candidates: candidates.map((c) => ({ widget: c.widget, score: c.score }))
    });
    var result = {
      nodeId: features.id,
      nodeName: features.name,
      bestMatch,
      alternatives,
      structuralIssues
    };
    return result;
  }

  // src/code.ts
  var SHADOW_MODE = true;
  var runtimeHealth = initializeCompatLayer({
    logger: (event, payload) => {
      try {
        console.log(`[compat:${event}]`, payload || "");
      } catch (e) {
      }
    }
  });
  var logger = new FileLogger(console.log.bind(console));
  figma.notify("Plugin carregou!");
  figma.showUI(__html__, { width: 600, height: 820, themeColors: true });
  safeInvoke(() => figma.ui.postMessage({
    type: "runtime-health",
    status: runtimeHealth.runtime,
    warnings: runtimeHealth.warnings || []
  }));
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
    const children = safeGetArray(node, "children", []);
    children.forEach((child) => warnings.push(...collectLayoutWarnings(child)));
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
  async function fetchWithTimeout3(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS3) {
    const AC = typeof AbortController !== "undefined" ? AbortController : null;
    if (!AC) {
      return await fetch(url, options);
    }
    const controller = new AC();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, __spreadProps(__spreadValues({}, options), {
        signal: controller.signal,
        headers: __spreadProps(__spreadValues({}, options.headers), {
          "User-Agent": "Figma-To-Elementor/1.0"
        })
      }));
    } finally {
      clearTimeout(id);
    }
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
  async function loadSetting(key, defaultValue) {
    try {
      const value = await figma.clientStorage.getAsync(key);
      if (value === void 0 || value === null) return defaultValue;
      return value;
    } catch (e) {
      return defaultValue;
    }
  }
  async function saveSetting(key, value) {
    try {
      await figma.clientStorage.setAsync(key, value);
    } catch (e) {
      console.warn("Failed to save setting", key, e);
    }
  }
  async function loadWPConfig() {
    const url = await loadSetting("gptel_wp_url", "");
    const user = await loadSetting("gptel_wp_user", "");
    const token = await loadSetting("gptel_wp_token", "");
    const exportImages = await loadSetting("gptel_export_images", false);
    const webpQuality = await loadSetting("gptel_webp_quality", 85);
    if (!url || !token || !user) {
      const legacy = await loadSetting("wp_config", null);
      if (legacy) {
        return {
          url: legacy.url || url,
          user: legacy.user || user,
          token: legacy.auth || token,
          exportImages,
          webpQuality
        };
      }
    }
    return { url, user, token, exportImages, webpQuality };
  }
  async function resolveProviderConfig(msg) {
    const providerFromMsg = safeGet(msg, "providerAi");
    const incomingProvider = providerFromMsg || await loadSetting("aiProvider", DEFAULT_PROVIDER) || await loadSetting("provider_ai", DEFAULT_PROVIDER);
    const providerId = incomingProvider === "gpt" ? "gpt" : DEFAULT_PROVIDER;
    await saveSetting("aiProvider", providerId);
    await saveSetting("provider_ai", providerId);
    const provider = getActiveProvider(providerId);
    if (providerId === "gpt") {
      const inlineKey2 = safeGet(msg, "gptApiKey");
      let key2 = inlineKey2 || await loadSetting("gptApiKey", "") || await loadSetting("gpt_api_key", "");
      if (inlineKey2) {
        await saveSetting("gptApiKey", inlineKey2);
        await saveSetting("gpt_api_key", inlineKey2);
      }
      const storedModel = safeGet(msg, "gptModel") || await loadSetting("gptModel", DEFAULT_GPT_MODEL2) || await loadSetting("gpt_model", openaiProvider.model);
      if (storedModel) {
        await saveSetting("gptModel", storedModel);
        await saveSetting("gpt_model", storedModel);
        openaiProvider.setModel(storedModel);
      }
      if (!key2) throw new Error("OpenAI API Key nao configurada.");
      return { provider, apiKey: key2, providerId };
    }
    const inlineKey = safeGet(msg, "apiKey");
    let key = inlineKey || await loadSetting("gptel_gemini_key", "");
    if (!key) {
      key = await loadSetting("gemini_api_key", "");
    }
    if (inlineKey) {
      await saveSetting("gptel_gemini_key", inlineKey);
      await saveSetting("gemini_api_key", inlineKey);
    }
    const model = safeGet(msg, "geminiModel") || await loadSetting("gemini_model", GEMINI_MODEL);
    if (model) {
      await saveSetting("gemini_model", model);
      geminiProvider.setModel(model);
    }
    if (!key) throw new Error("Gemini API Key nao configurada.");
    return { provider, apiKey: key, providerId };
  }
  function getSelectedNode() {
    const selection = safeGetArray(figma, "currentPage.selection");
    if (!selection || selection.length === 0) {
      throw new Error("Selecione um frame ou node para converter.");
    }
    return selection[0];
  }
  async function generateElementorJSON(aiPayload, customWP, debug2) {
    const node = getSelectedNode();
    log(
      `[DEBUG] Selected Node: ${safeGetString(node, "name", "unknown")} (ID: ${safeGetString(node, "id", "n/a")}, Type: ${safeGetString(node, "type", "unknown")}, Locked: ${safeGetBoolean(node, "locked", false)})`,
      "info"
    );
    const wpConfig = customWP || await loadWPConfig();
    const useAIPayload = safeGet(aiPayload, "useAI");
    const useAI = typeof useAIPayload === "boolean" ? useAIPayload : await loadSetting("gptel_use_ai", true);
    const serialized = serializeNode(node);
    const includeScreenshotPayload = safeGet(aiPayload, "includeScreenshot");
    const includeScreenshot = typeof includeScreenshotPayload === "boolean" ? includeScreenshotPayload : await loadSetting("gptel_include_screenshot", true);
    const includeReferencesPayload = safeGet(aiPayload, "includeReferences");
    const includeReferences = typeof includeReferencesPayload === "boolean" ? includeReferencesPayload : await loadSetting("gptel_include_references", true);
    const useDeterministic = safeGet(aiPayload, "useDeterministic") === true;
    const diffModeValue = safeGet(aiPayload, "deterministicDiffMode");
    const deterministicDiffMode = diffModeValue === "log" || diffModeValue === "store" ? diffModeValue : void 0;
    if (!useAI) {
      log("Iniciando pipeline (NO-AI)...", "info");
      const elementorJson = await runPipelineWithoutAI(serialized, wpConfig);
      log("Pipeline NO-AI concluido.", "success");
      return { elementorJson };
    }
    const autoRenameFlag = safeGet(aiPayload, "autoRename");
    const autoRenameValue = typeof autoRenameFlag === "boolean" ? autoRenameFlag : await loadSetting("gptel_auto_rename", false);
    const { provider, apiKey, providerId } = await resolveProviderConfig(aiPayload);
    const autoFixLayout = await loadSetting("auto_fix_layout", false);
    log(`Iniciando pipeline (${providerId.toUpperCase()})...`, "info");
    const runOptions = {
      debug: !!debug2,
      provider,
      apiKey,
      autoFixLayout,
      includeScreenshot,
      includeReferences,
      autoRename: autoRenameValue,
      useDeterministic
    };
    if (deterministicDiffMode) {
      runOptions.deterministicDiffMode = deterministicDiffMode;
    }
    const result = await pipeline.run(node, wpConfig, runOptions);
    log("Pipeline concluido.", "success");
    if (debug2 && result.elementorJson) {
      return result;
    }
    return { elementorJson: result };
  }
  function log(message, level = "info") {
    try {
      logger.log(`[${level}] ${message}`);
    } catch (e) {
    }
    figma.ui.postMessage({ type: "log", level, message });
  }
  async function deliverResult(json, debugInfo) {
    const normalizedElements = json.elements || json.content || [];
    let siteurl = json.siteurl || "";
    if (siteurl && !siteurl.endsWith("/")) siteurl += "/";
    if (siteurl && !siteurl.endsWith("wp-json/")) siteurl += "wp-json/";
    const normalizedJson = {
      type: json.type || "elementor",
      siteurl,
      version: json.version || "0.4",
      elements: normalizedElements
    };
    const payload = JSON.stringify(normalizedJson, null, 2);
    const pastePayload = payload;
    lastJSON = payload;
    figma.ui.postMessage({ type: "generation-complete", payload, pastePayload, debug: debugInfo });
    figma.ui.postMessage({ type: "copy-json", payload: pastePayload });
    figma.ui.postMessage({ type: "clipboard:copy", payload: pastePayload });
  }
  function sendPreview(data) {
    const payload = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    figma.ui.postMessage({ type: "preview", payload });
  }
  async function runPipelineWithoutAI(serializedTree, wpConfig = {}) {
    const analyzed = analyzeTreeWithHeuristics(serializedTree);
    const schema = convertToFlexSchema(analyzed);
    if (SHADOW_MODE) {
      try {
        var rootNode = figma.getNodeById(serializedTree.id);
        if (rootNode) {
          var v2Result = analyzeNodeWithEngine(rootNode, rootNode);
          var v1Widget = "container";
          if (schema.containers && schema.containers.length > 0) {
            var rootContainer = schema.containers[0];
            if (rootContainer.widgets && rootContainer.widgets.length > 0) {
              v1Widget = rootContainer.widgets[0].type || "container";
            } else if (rootContainer.children && rootContainer.children.length > 0) {
              v1Widget = "container";
            }
          }
          var nodeName = (serializedTree.name || "").toLowerCase();
          if (nodeName.startsWith("w:") || nodeName.startsWith("c:")) {
            v1Widget = nodeName.replace(/^(w:|c:)/, "");
          }
          var v2Widget = v2Result.bestMatch ? v2Result.bestMatch.widget : "null";
          var v2Score = v2Result.bestMatch ? v2Result.bestMatch.score.toFixed(2) : "0.00";
          if (v1Widget !== v2Widget) {
            console.log("[SHADOW-V2] Node " + serializedTree.id + " | V1: " + v1Widget + " | V2: " + v2Widget + " (" + v2Score + ")");
            if (v2Result.structuralIssues.length > 0) {
              console.log("[SHADOW-V2] Issues:", v2Result.structuralIssues.map(function(i) {
                return i.message;
              }));
            }
          }
        }
      } catch (shadowError) {
        console.warn("[SHADOW-V2] Error:", shadowError);
      }
    }
    const normalizedWP = __spreadProps(__spreadValues({}, wpConfig), { password: safeGet(wpConfig, "password") || safeGet(wpConfig, "token") });
    noaiUploader = new ImageUploader({});
    noaiUploader.setWPConfig(normalizedWP);
    const uploadEnabled = !!(normalizedWP && normalizedWP.url && normalizedWP.user && normalizedWP.password && normalizedWP.exportImages);
    const uploadPromises = [];
    await enforceWidgetTypes(schema);
    const processWidget = async (widget) => {
      const uploader = noaiUploader;
      if (!uploader) return;
      const nodeId = widget.imageId || widget.id;
      console.log(`[NO-AI UPLOAD] Processing widget: type=${widget.type}, nodeId=${nodeId}, uploadEnabled=${uploadEnabled}`);
      if (uploadEnabled && nodeId && (widget.type === "image" || widget.type === "custom" || widget.type === "icon" || widget.type === "image-box" || widget.type === "icon-box" || widget.type === "button" || widget.type === "list-item" || widget.type === "icon-list" || widget.type === "accordion" || widget.type === "toggle")) {
        console.log(`[NO-AI UPLOAD] \u2705 Widget ${widget.type} (${nodeId}) will be uploaded`);
        try {
          const node = await figma.getNodeById(nodeId);
          if (node) {
            let format = widget.type === "icon" || widget.type === "icon-box" || widget.type === "list-item" || widget.type === "icon-list" ? "SVG" : "WEBP";
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
            if (node.name === "Icon" || widget.type === "icon" || widget.type === "list-item" || widget.type === "accordion" || widget.type === "toggle") {
              format = "SVG";
            }
            const result = await uploader.uploadToWordPress(node, format);
            if (result) {
              if (widget.type === "image-box") {
                if (!widget.styles) widget.styles = {};
                widget.styles.image_url = result.url;
              } else if (widget.type === "icon-box") {
                if (!widget.styles) widget.styles = {};
                widget.styles.selected_icon = { value: { url: result.url, id: result.id }, library: "svg" };
                widget.imageId = result.id.toString();
              } else if (widget.type === "button") {
                if (!widget.styles) widget.styles = {};
                widget.styles.selected_icon = { value: { url: result.url, id: result.id }, library: "svg" };
                widget.imageId = result.id.toString();
                console.log("[BUTTON UPLOAD] Icon uploaded:", result.url, "ID:", result.id);
              } else if (widget.type === "list-item") {
                if (!widget.styles) widget.styles = {};
                widget.styles.icon_url = result.url;
                widget.imageId = result.id.toString();
                console.log("[LIST-ITEM UPLOAD] Icon uploaded:", result.url, "ID:", result.id);
              } else if (widget.type === "icon-list") {
                if (!widget.styles) widget.styles = {};
                widget.styles.icon = { value: { id: result.id, url: result.url }, library: "svg" };
                widget.imageId = result.id.toString();
              } else if (widget.type === "accordion" || widget.type === "toggle") {
                if (!widget.styles) widget.styles = {};
                widget.styles.selected_icon = { value: { url: result.url, id: result.id }, library: "svg" };
                widget.imageId = result.id.toString();
                console.log("[ACCORDION UPLOAD] Icon uploaded:", result.url, "ID:", result.id);
              } else {
                widget.content = result.url;
                widget.imageId = result.id.toString();
              }
            }
          }
        } catch (e) {
          console.error(`[NO-AI] Erro ao processar imagem ${nodeId}:`, e);
        }
      }
      const carouselSlides = safeGet(widget, "styles.slides");
      if (uploadEnabled && widget.type === "image-carousel" && Array.isArray(carouselSlides)) {
        console.log(`[NO-AI UPLOAD] ?? Processing image-carousel with ${carouselSlides.length} slides`);
        const updatedSlides = [];
        for (const slide of carouselSlides) {
          const slideNodeId = slide.id;
          if (slideNodeId) {
            try {
              const node = await figma.getNodeById(slideNodeId);
              if (node) {
                const result = await uploader.uploadToWordPress(node, "WEBP");
                if (result) {
                  console.log(`[NO-AI UPLOAD] \u{1F3A0} Slide uploaded: ${result.url}, ID: ${result.id}`);
                  updatedSlides.push({
                    _id: slide._id,
                    id: result.id,
                    url: result.url,
                    image: { url: result.url, id: result.id }
                  });
                } else {
                  updatedSlides.push(slide);
                }
              } else {
                updatedSlides.push(slide);
              }
            } catch (e) {
              console.error(`[NO-AI] Erro ao processar slide ${slideNodeId}:`, e);
              updatedSlides.push(slide);
            }
          } else {
            updatedSlides.push(slide);
          }
        }
        widget.styles.slides = updatedSlides;
      }
    };
    const collectUploads = (container) => {
      for (const widget of container.widgets || []) {
        uploadPromises.push(processWidget(widget));
        if (widget.children && Array.isArray(widget.children)) {
          for (const childWidget of widget.children) {
            uploadPromises.push(processWidget(childWidget));
          }
        }
      }
      for (const child of container.children || []) {
        collectUploads(child);
      }
    };
    for (const container of schema.containers) {
      collectUploads(container);
    }
    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }
    const compiler = new ElementorCompiler();
    compiler.setWPConfig(normalizedWP);
    const json = compiler.compile(schema);
    if (normalizedWP.url) {
      let siteurl = normalizedWP.url;
      if (!siteurl.endsWith("/")) siteurl += "/";
      if (!siteurl.endsWith("wp-json/")) siteurl += "wp-json/";
      json.siteurl = siteurl;
    }
    return json;
  }
  async function sendStoredSettings() {
    console.log("\u{1F527} [sendStoredSettings] Carregando configura\xE7\xF5es salvas...");
    let geminiKey = await loadSetting("gptel_gemini_key", "");
    if (!geminiKey) {
      geminiKey = await loadSetting("gemini_api_key", "");
    }
    const geminiModel = await loadSetting("gemini_model", GEMINI_MODEL);
    const providerAi = await loadSetting("aiProvider", DEFAULT_PROVIDER) || await loadSetting("provider_ai", DEFAULT_PROVIDER);
    const gptKey = await loadSetting("gptApiKey", "") || await loadSetting("gpt_api_key", "");
    const gptModel = await loadSetting("gptModel", DEFAULT_GPT_MODEL2) || await loadSetting("gpt_model", openaiProvider.model);
    const wpUrl = await loadSetting("gptel_wp_url", "");
    const wpUser = await loadSetting("gptel_wp_user", "");
    const wpToken = await loadSetting("gptel_wp_token", "");
    const exportImages = await loadSetting("gptel_export_images", false);
    const webpQuality = await loadSetting("gptel_webp_quality", 85);
    const darkMode = await loadSetting("gptel_dark_mode", false);
    const useAI = await loadSetting("gptel_use_ai", true);
    const includeScreenshot = await loadSetting("gptel_include_screenshot", true);
    const includeReferences = await loadSetting("gptel_include_references", true);
    const autoRename = await loadSetting("gptel_auto_rename", false);
    console.log("\u{1F527} [sendStoredSettings] Configura\xE7\xF5es carregadas:", {
      geminiKey: geminiKey ? "***" + geminiKey.slice(-4) : "vazio",
      gptKey: gptKey ? "***" + gptKey.slice(-4) : "vazio",
      wpUrl,
      providerAi
    });
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
        webpQuality,
        darkMode,
        useAI,
        includeScreenshot,
        includeReferences,
        autoRename
      }
    });
    console.log("\u{1F527} [sendStoredSettings] Mensagem enviada para UI");
  }
  figma.ui.onmessage = async (msg) => {
    var _a, _b;
    if (!msg || typeof msg !== "object") return;
    if (typeof msg.type !== "string") return;
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
          log(safeGet(error, "message") || String(error), "error");
        }
        break;
      case "generate-json":
        try {
          figma.ui.postMessage({ type: "generation-start" });
          log("Verificando licen\xE7a...", "info");
          const figmaUserId = ((_a = figma.currentUser) == null ? void 0 : _a.id) || "";
          if (!figmaUserId) {
            log("N\xE3o foi poss\xEDvel identificar o usu\xE1rio Figma.", "error");
            figma.ui.postMessage({ type: "generation-error", message: "N\xE3o foi poss\xEDvel identificar sua conta Figma. Recarregue o plugin." });
            break;
          }
          const licenseCheck = await checkAndConsumeLicenseUsage(figmaUserId);
          if (!licenseCheck.allowed) {
            log(`Licen\xE7a: ${licenseCheck.message}`, "error");
            figma.ui.postMessage({
              type: "license-blocked",
              status: licenseCheck.status,
              message: licenseCheck.message,
              usage: licenseCheck.usage,
              plansUrl: LICENSE_PLANS_URL
            });
            figma.ui.postMessage({ type: "generation-error", message: licenseCheck.message });
            figma.notify(`\u26A0\uFE0F ${licenseCheck.message}`, { timeout: 6e3 });
            break;
          }
          if (licenseCheck.usage) {
            figma.ui.postMessage({
              type: "license-usage-updated",
              usage: licenseCheck.usage
            });
          }
          log(`Licen\xE7a OK: ${licenseCheck.message}`, "success");
          const wpConfig = msg.wpConfig;
          const debug2 = !!msg.debug;
          const { elementorJson, debugInfo } = await generateElementorJSON(msg, wpConfig, debug2);
          await deliverResult(elementorJson, debugInfo);
        } catch (error) {
          const message = safeGet(error, "message") || String(error);
          log(`Erro: ${message}`, "error");
          figma.ui.postMessage({ type: "generation-error", message });
          figma.notify("Erro ao gerar JSON. Verifique os logs.", { timeout: 5e3 });
        }
        break;
      case "copy-json":
        if (lastJSON) {
          figma.ui.postMessage({ type: "copy-json", payload: lastJSON });
          figma.ui.postMessage({ type: "clipboard:copy", payload: lastJSON });
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
            await saveSetting("gemini_model", msg.model);
            geminiProvider.setModel(msg.model);
          }
          const inlineKey = msg.apiKey;
          if (inlineKey) {
            await saveSetting("gptel_gemini_key", inlineKey);
            await saveSetting("gemini_api_key", inlineKey);
          }
          const res = await geminiProvider.testConnection(inlineKey);
          figma.ui.postMessage({ type: "gemini-status", success: res.ok, message: res.message });
        } catch (e) {
          const geminiError = safeGet(e, "message") || e;
          figma.ui.postMessage({ type: "gemini-status", success: false, message: `Erro: ${geminiError}` });
        }
        break;
      case "test-gpt":
        try {
          const inlineKey = msg.apiKey || msg.gptApiKey || "";
          if (inlineKey) {
            await saveSetting("gptApiKey", inlineKey);
            await saveSetting("gpt_api_key", inlineKey);
          }
          const model = msg.model || await loadSetting("gptModel", DEFAULT_GPT_MODEL2) || await loadSetting("gpt_model", DEFAULT_GPT_MODEL2);
          if (model) {
            await saveSetting("gptModel", model);
            await saveSetting("gpt_model", model);
            openaiProvider.setModel(model);
          }
          const keyToUse = inlineKey || await loadSetting("gptApiKey", "") || await loadSetting("gpt_api_key", "");
          const res = await testOpenAIConnection(keyToUse, model || openaiProvider.model);
          figma.ui.postMessage({ type: "gpt-status", success: res.ok, message: res.error || "Conexao com GPT verificada." });
        } catch (e) {
          const gptError = safeGet(e, "message") || e;
          figma.ui.postMessage({ type: "gpt-status", success: false, message: `Erro: ${gptError}` });
        }
        break;
      case "test-wp":
        try {
          const incoming = msg.wpConfig;
          const cfg = incoming && incoming.url ? incoming : await loadWPConfig();
          const url = normalizeWpUrl(safeGet(cfg, "url") || "");
          const user = (safeGet(cfg, "user") || "").trim();
          const token = (safeGet(cfg, "token") || safeGet(cfg, "password") || "").replace(/\s+/g, "");
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
          const resp = await fetchWithTimeout3(endpoint, {
            method: "GET",
            headers: { Authorization: `Basic ${auth}`, Accept: "application/json" }
          });
          if (!resp.ok) {
            const text = await resp.text();
            figma.ui.postMessage({ type: "log", level: "error", message: `[WP] Test FAIL (${resp.status}) -> ${text}` });
            figma.ui.postMessage({ type: "wp-status", success: false, message: `Falha (${resp.status}): ${text || "sem detalhe"}` });
            break;
          }
          const autoPage = cfg.autoPage !== void 0 ? cfg.autoPage : cfg.createPage;
          await saveSetting("gptel_wp_url", url);
          await saveSetting("gptel_wp_user", user);
          await saveSetting("gptel_wp_token", token);
          await saveSetting("gptel_export_images", !!cfg.exportImages);
          await saveSetting("gptel_auto_page", !!autoPage);
          figma.ui.postMessage({ type: "wp-status", success: true, message: "Conexao com WordPress verificada." });
        } catch (e) {
          const wpError = safeGet(e, "message") || e;
          figma.ui.postMessage({ type: "wp-status", success: false, message: `Erro: ${wpError}` });
        }
        break;
      case "save-setting":
        if (msg.key) {
          await saveSetting(msg.key, msg.value);
        }
        break;
      case "load-settings":
        await sendStoredSettings();
        break;
      case "reset":
        lastJSON = null;
        break;
      // ============================================================
      // LICENSE HANDLERS
      // ============================================================
      case "license-validate":
        try {
          figma.ui.postMessage({ type: "license-validating" });
          const licenseKey = msg.licenseKey || "";
          const siteDomain = msg.siteDomain || "";
          const figmaUserIdForValidation = ((_b = figma.currentUser) == null ? void 0 : _b.id) || "";
          if (!figmaUserIdForValidation) {
            figma.ui.postMessage({
              type: "license-validate-result",
              success: false,
              status: "license_error",
              message: "N\xE3o foi poss\xEDvel identificar sua conta Figma. Recarregue o plugin.",
              plansUrl: LICENSE_PLANS_URL
            });
            break;
          }
          const result = await validateAndSaveLicense(licenseKey, siteDomain, figmaUserIdForValidation);
          figma.ui.postMessage({
            type: "license-validate-result",
            success: result.allowed,
            status: result.status,
            message: result.message,
            usage: result.usage,
            planSlug: result.planSlug,
            plansUrl: LICENSE_PLANS_URL
          });
          if (result.allowed) {
            figma.notify("\u2705 Licen\xE7a validada com sucesso!", { timeout: 3e3 });
          } else {
            figma.notify(`\u26A0\uFE0F ${result.message}`, { timeout: 5e3 });
          }
        } catch (error) {
          const errorMsg = safeGet(error, "message") || String(error);
          figma.ui.postMessage({
            type: "license-validate-result",
            success: false,
            status: "license_error",
            message: errorMsg,
            plansUrl: LICENSE_PLANS_URL
          });
        }
        break;
      case "license-load":
        try {
          const info = await getLicenseDisplayInfo();
          figma.ui.postMessage(__spreadProps(__spreadValues({
            type: "license-info"
          }, info), {
            plansUrl: LICENSE_PLANS_URL
          }));
        } catch (error) {
          figma.ui.postMessage({
            type: "license-info",
            configured: false,
            status: "error",
            plansUrl: LICENSE_PLANS_URL
          });
        }
        break;
      case "license-clear":
        try {
          await clearLicenseConfig();
          figma.ui.postMessage({
            type: "license-cleared",
            success: true
          });
          figma.notify("\u{1F513} Licen\xE7a desconectada.", { timeout: 3e3 });
        } catch (error) {
          figma.ui.postMessage({
            type: "license-cleared",
            success: false,
            error: safeGet(error, "message") || String(error)
          });
        }
        break;
      case "license-open-plans":
        figma.ui.postMessage({
          type: "open-external-url",
          url: LICENSE_PLANS_URL
        });
        break;
      case "resize-ui":
        const targetWidth = safeGetNumber(msg, "width", 0);
        const targetHeight = safeGetNumber(msg, "height", 0);
        if (targetWidth > 0 && targetHeight > 0) {
          figma.ui.resize(Math.min(1500, targetWidth), Math.min(1e3, targetHeight));
        }
        break;
      case "rename-layer":
        try {
          let node = null;
          if (msg.nodeId) {
            const foundNode = figma.getNodeById(msg.nodeId);
            if (foundNode && "name" in foundNode) {
              node = foundNode;
            } else {
              throw new Error("Node n\xE3o encontrado ou n\xE3o pode ser renomeado");
            }
          } else {
            const selection = safeGetArray(figma, "currentPage.selection");
            if (!selection || selection.length === 0) {
              throw new Error("Nenhum layer selecionado.");
            }
            node = selection[0];
          }
          const name = msg.name;
          if (!name) throw new Error("Nome n\xE3o fornecido");
          node.name = name;
          figma.notify(`\u2705 Layer renomeada para "${name}"`);
          figma.ui.postMessage({
            type: "rename-success",
            nodeId: node.id,
            newName: name
          });
        } catch (e) {
          const renameError = safeGet(e, "message") || "Falha ao renomear layer";
          figma.notify(renameError);
          figma.ui.postMessage({
            type: "rename-error",
            message: renameError
          });
        }
        break;
      case "run-heuristics-rename":
        try {
          const selection = safeGetArray(figma, "currentPage.selection");
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
          figma.notify(safeGet(e, "message") || "Erro ao organizar layers");
        }
        break;
      // ========== LINTER HANDLERS ==========
      case "analyze-layout":
        try {
          console.log("\u{1F50D} [LINTER] Handler analyze-layout iniciado");
          log("\u{1F50D} Handler analyze-layout iniciado", "info");
          const selection = safeGetArray(figma, "currentPage.selection");
          console.log("[LINTER] Selection:", selection);
          if (!selection || selection.length === 0) {
            console.log("[LINTER] \u274C Nenhum node selecionado");
            figma.ui.postMessage({
              type: "linter-error",
              message: "Selecione um Frame para analisar"
            });
            log("\u274C Nenhum Frame selecionado", "error");
            break;
          }
          const node = selection[0];
          console.log(`[LINTER] Node selecionado: ${node.name} (${node.type})`);
          log(`Node selecionado: ${node.name} (${node.type})`, "info");
          if (node.type !== "FRAME") {
            console.log(`[LINTER] \u274C Node n\xE3o \xE9 FRAME: ${node.type}`);
            figma.ui.postMessage({
              type: "linter-error",
              message: "Selecione um Frame (n\xE3o um " + node.type + ")"
            });
            log(`\u274C Selecione um Frame (n\xE3o ${node.type})`, "error");
            break;
          }
          console.log("[LINTER] Iniciando an\xE1lise de layout...");
          log("Iniciando an\xE1lise de layout...", "info");
          console.log("[LINTER] Chamando analyzeFigmaLayout...");
          log("Chamando analyzeFigmaLayout...", "info");
          const report = await analyzeFigmaLayout(node, {
            aiAssisted: false,
            deviceTarget: "desktop"
          });
          console.log("[LINTER] \u2705 Relat\xF3rio gerado:", report);
          log("Relat\xF3rio gerado com sucesso", "info");
          log(`Total de issues: ${report.analysis.length}`, "info");
          log(`Total de widgets detectados: ${report.widgets.length}`, "info");
          figma.ui.postMessage({
            type: "linter-report",
            payload: report
          });
          console.log("[LINTER] \u2705 Mensagem enviada para UI");
          log(`An\xE1lise conclu\xEDda: ${report.summary.total} problemas encontrados`, "success");
        } catch (error) {
          const message = safeGet(error, "message") || String(error);
          const stack = safeGet(error, "stack") || "No stack trace";
          console.error("[LINTER] \u274C ERRO:", message);
          console.error("[LINTER] Stack:", stack);
          log(`\u274C ERRO ao analisar layout: ${message}`, "error");
          log(`Stack: ${stack}`, "error");
          figma.ui.postMessage({
            type: "linter-error",
            message
          });
        }
        break;
      case "select-problem-node":
        try {
          const nodeId = msg.nodeId;
          if (!nodeId) {
            figma.ui.postMessage({
              type: "linter-error",
              message: "ID do node n\xE3o fornecido"
            });
            break;
          }
          const node = figma.getNodeById(nodeId);
          if (!node) {
            figma.ui.postMessage({
              type: "linter-error",
              message: "Node n\xE3o encontrado"
            });
            break;
          }
          figma.currentPage.selection = [node];
          figma.viewport.scrollAndZoomIntoView([node]);
          figma.ui.postMessage({
            type: "node-selected",
            nodeId
          });
        } catch (error) {
          figma.ui.postMessage({
            type: "linter-error",
            message: safeGet(error, "message") || "Erro ao selecionar node"
          });
        }
        break;
      case "mark-problem-resolved":
        try {
          const nodeId = msg.nodeId;
          if (!nodeId) {
            figma.ui.postMessage({
              type: "linter-error",
              message: "ID do node n\xE3o fornecido"
            });
            break;
          }
          const node = figma.getNodeById(nodeId);
          if (!node) {
            figma.ui.postMessage({
              type: "linter-error",
              message: "Node n\xE3o encontrado"
            });
            break;
          }
          const result = await validateSingleNode(node);
          if (result.isValid) {
            await figma.clientStorage.setAsync(`linter-resolved-${nodeId}`, true);
          }
          figma.ui.postMessage({
            type: "validation-result",
            nodeId,
            isFixed: result.isValid,
            issues: result.issues
          });
          if (result.isValid) {
            log("\u2705 Problema resolvido!", "success");
          } else {
            log(`\u26A0\uFE0F Problema ainda n\xE3o resolvido: ${result.issues.join(", ")}`, "warn");
          }
        } catch (error) {
          figma.ui.postMessage({
            type: "linter-error",
            message: safeGet(error, "message") || "Erro ao validar corre\xE7\xE3o"
          });
        }
        break;
      case "fix-issue":
        try {
          const { nodeId, ruleId } = msg;
          const node = figma.getNodeById(nodeId);
          if (!node) {
            throw new Error("Node n\xE3o encontrado");
          }
          const registry2 = new RuleRegistry();
          registry2.register(new AutoLayoutRule());
          const rule = registry2.get(ruleId);
          if (!rule) {
            throw new Error(`Regra ${ruleId} n\xE3o encontrada ou n\xE3o suporta corre\xE7\xE3o autom\xE1tica`);
          }
          if (!rule.fix) {
            throw new Error(`Regra ${ruleId} n\xE3o possui corre\xE7\xE3o autom\xE1tica implementada`);
          }
          const success = await rule.fix(node);
          if (success) {
            log(`\u2705 Corre\xE7\xE3o aplicada com sucesso para ${ruleId}`, "success");
            const result = await validateSingleNode(node);
            figma.ui.postMessage({
              type: "validation-result",
              nodeId,
              isFixed: result.isValid,
              issues: result.issues
            });
          } else {
            throw new Error("Falha ao aplicar corre\xE7\xE3o autom\xE1tica");
          }
        } catch (error) {
          log(`Erro ao aplicar corre\xE7\xE3o: ${error.message}`, "error");
          figma.ui.postMessage({
            type: "linter-error",
            message: error.message
          });
        }
        break;
      case "focus-node":
        if (msg.nodeId) {
          const node = figma.getNodeById(msg.nodeId);
          if (node) {
            figma.currentPage.selection = [node];
            figma.viewport.scrollAndZoomIntoView([node]);
            figma.notify(`Focando em: ${node.name}`);
          } else {
            figma.notify("Node n\xE3o encontrado (pode ter sido deletado).", { error: true });
          }
        }
        break;
      // ============================================================
      // LINTER: Select Node from UI
      // Handles message from Linter UI v2 to select and focus a node
      // ============================================================
      case "linter:select-node":
      case "select-node": {
        const { nodeId } = msg;
        console.log("[LINTER] onmessage: linter:select-node", { nodeId });
        if (!nodeId || typeof nodeId !== "string") {
          console.warn("[LINTER] nodeId inv\xE1lido ou ausente", { nodeId });
          figma.ui.postMessage({
            type: "linter:select-node:error",
            payload: {
              nodeId: nodeId || void 0,
              reason: "INVALID_ID",
              detail: "O nodeId fornecido \xE9 inv\xE1lido ou est\xE1 ausente."
            }
          });
          break;
        }
        try {
          const node = figma.getNodeById(nodeId);
          if (!node) {
            console.warn("[LINTER] Node n\xE3o encontrado para nodeId:", nodeId);
            figma.ui.postMessage({
              type: "linter:select-node:error",
              payload: {
                nodeId,
                reason: "NODE_NOT_FOUND",
                detail: `Node com ID "${nodeId}" n\xE3o foi encontrado. Pode ter sido deletado.`
              }
            });
            figma.notify("Node n\xE3o encontrado (pode ter sido deletado).", { error: true, timeout: 3e3 });
            break;
          }
          console.log("[LINTER] Selecionando node:", node.name, nodeId);
          figma.currentPage.selection = [node];
          try {
            figma.viewport.scrollAndZoomIntoView([node]);
            console.log("[LINTER] Viewport ajustado para node:", node.name);
          } catch (viewportError) {
            console.warn("[LINTER] Erro ao ajustar viewport (ignorando):", viewportError);
          }
          figma.ui.postMessage({
            type: "linter:select-node:ok",
            payload: {
              nodeId,
              nodeName: node.name,
              message: `Node "${node.name}" selecionado com sucesso.`
            }
          });
          log(`\u{1F3AF} [LINTER] Node selecionado: ${node.name}`, "info");
        } catch (error) {
          console.error("[LINTER] Erro ao selecionar node:", error);
          figma.ui.postMessage({
            type: "linter:select-node:error",
            payload: {
              nodeId,
              reason: "UNKNOWN_ERROR",
              detail: (error == null ? void 0 : error.message) || String(error)
            }
          });
        }
        break;
      }
      // ============================================================
      // LINTER: Rename Node from UI
      // Handles rename requests from Linter action panel
      // ============================================================
      case "linter-rename-node": {
        const { nodeId, newName } = msg;
        console.log("[LINTER] onmessage: linter-rename-node", { nodeId, newName });
        if (!nodeId || typeof nodeId !== "string") {
          console.warn("[LINTER] nodeId inv\xE1lido");
          figma.ui.postMessage({
            type: "linter-rename-node:result",
            payload: {
              nodeId: nodeId || "",
              newName: newName || "",
              status: "error",
              errorMessage: "nodeId inv\xE1lido ou ausente."
            }
          });
          break;
        }
        if (!newName || typeof newName !== "string" || newName.trim() === "") {
          console.warn("[LINTER] newName inv\xE1lido");
          figma.ui.postMessage({
            type: "linter-rename-node:result",
            payload: {
              nodeId,
              newName: newName || "",
              status: "error",
              errorMessage: "Nome inv\xE1lido ou vazio."
            }
          });
          break;
        }
        try {
          const node = figma.getNodeById(nodeId);
          if (!node) {
            console.warn("[LINTER] Node n\xE3o encontrado:", nodeId);
            figma.ui.postMessage({
              type: "linter-rename-node:result",
              payload: {
                nodeId,
                newName,
                status: "error",
                errorMessage: "Node n\xE3o encontrado. Pode ter sido deletado."
              }
            });
            break;
          }
          const sceneNode = node;
          if (!sceneNode || !sceneNode.name) {
            console.warn("[LINTER] Node n\xE3o suporta renomea\xE7\xE3o");
            figma.ui.postMessage({
              type: "linter-rename-node:result",
              payload: {
                nodeId,
                newName,
                status: "error",
                errorMessage: "Node n\xE3o suporta renomea\xE7\xE3o."
              }
            });
            break;
          }
          const oldName = sceneNode.name;
          sceneNode.name = newName.trim();
          console.log("[LINTER] Node renomeado:", oldName, "\u2192", sceneNode.name);
          figma.currentPage.selection = [sceneNode];
          figma.ui.postMessage({
            type: "linter-rename-node:result",
            payload: {
              nodeId,
              oldName,
              newName: sceneNode.name,
              status: "ok",
              errorMessage: null
            }
          });
          log(`\u270F\uFE0F Layer renomeada: "${oldName}" \u2192 "${sceneNode.name}"`, "success");
          figma.notify(`Layer renomeada: ${sceneNode.name}`, { timeout: 2e3 });
        } catch (error) {
          console.error("[LINTER] Erro ao renomear node:", error);
          figma.ui.postMessage({
            type: "linter-rename-node:result",
            payload: {
              nodeId,
              newName,
              status: "error",
              errorMessage: (error == null ? void 0 : error.message) || String(error)
            }
          });
        }
        break;
      }
      case "close":
        figma.closePlugin();
        break;
    }
  };
  sendStoredSettings();
})();
