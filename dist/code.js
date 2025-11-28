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
  var init_image_utils = __esm({
    "src/utils/image_utils.ts"() {
    }
  });

  // src/utils/serialization_utils.ts
  function serializeNode(node, parentId) {
    const data = {
      id: node.id,
      name: node.name,
      type: node.type,
      width: node.width,
      height: node.height,
      x: node.x,
      y: node.y,
      visible: node.visible,
      locked: node.locked,
      parentId: parentId || null
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
      data.children = node.children.map((child) => serializeNode(child, node.id));
    }
    return data;
  }
  var init_serialization_utils = __esm({
    "src/utils/serialization_utils.ts"() {
      init_image_utils();
    }
  });

  // src/config/prompts.ts
  var init_prompts = __esm({
    "src/config/prompts.ts"() {
    }
  });

  // src/api_gemini.ts
  function getKey() {
    return __async(this, null, function* () {
      return yield figma.clientStorage.getAsync("gemini_api_key");
    });
  }
  function getModel() {
    return __async(this, null, function* () {
      const savedModel = yield figma.clientStorage.getAsync("gemini_model");
      return savedModel || GEMINI_MODEL;
    });
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

  // src/utils/guid.ts
  function generateGUID() {
    return Math.random().toString(36).substring(2, 9);
  }
  var init_guid = __esm({
    "src/utils/guid.ts"() {
    }
  });

  // src/config/widget.registry.ts
  function findWidgetDefinition(type, kind) {
    const kindLower = kind ? kind.toLowerCase() : "";
    const typeLower = type.toLowerCase();
    const direct = registry.find((r) => r.key === typeLower || r.widgetType === typeLower);
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
  var registry;
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
          compile: (w, base) => ({
            widgetType: "image",
            settings: __spreadProps(__spreadValues({}, base), {
              image: {
                url: w.content || "",
                id: w.imageId ? parseInt(w.imageId, 10) : 0
              }
            })
          })
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
          compile: (w, base) => ({
            widgetType: "image-box",
            settings: __spreadProps(__spreadValues({}, base), {
              image: { url: base.image_url || "", id: w.imageId ? parseInt(w.imageId, 10) : 0 },
              title_text: w.content || base.title_text || "Title",
              description_text: base.description_text || ""
            })
          })
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
          key: "html",
          widgetType: "html",
          family: "misc",
          aliases: ["custom"],
          compile: (w, base) => ({ widgetType: "html", settings: __spreadProps(__spreadValues({}, base), { html: w.content || "" }) })
        }
      ];
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
        compile(schema) {
          const elements = schema.containers.map((container) => this.compileContainer(container, false));
          return {
            type: "elementor",
            siteurl: "",
            elements
          };
        }
        compileContainer(container, isInner) {
          const id = generateGUID();
          const settings = __spreadValues({
            _element_id: id,
            container_type: "flex",
            content_width: container.width === "full" ? "full" : "boxed",
            flex_direction: container.direction === "row" ? "row" : "column"
          }, this.mapContainerStyles(container.styles));
          const widgetElements = container.widgets.map((w) => this.compileWidget(w));
          const childContainers = container.children.map((child) => this.compileContainer(child, true));
          return {
            id,
            elType: "container",
            isInner,
            settings,
            elements: [...widgetElements, ...childContainers]
          };
        }
        mapContainerStyles(styles) {
          const settings = {};
          if (!styles) return settings;
          if (styles.gap !== void 0) {
            settings.flex_gap = {
              unit: "px",
              column: styles.gap,
              row: styles.gap,
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
            if (bg.color) {
              settings.background_background = "classic";
              settings.background_color = bg.color;
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
          return settings;
        }
        compileWidget(widget) {
          const widgetId = generateGUID();
          const baseSettings = __spreadValues({ _element_id: widgetId }, widget.styles);
          const registryResult = compileWithRegistry(widget, baseSettings);
          if (registryResult) {
            return {
              id: widgetId,
              elType: "widget",
              widgetType: registryResult.widgetType,
              settings: registryResult.settings,
              elements: []
            };
          }
          let widgetType = widget.type;
          const settings = __spreadValues({}, baseSettings);
          switch (widget.type) {
            case "heading":
              widgetType = "heading";
              settings.title = widget.content || "Heading";
              break;
            case "text":
              widgetType = "text-editor";
              settings.editor = widget.content || "Text";
              break;
            case "button":
              widgetType = "button";
              settings.text = widget.content || "Button";
              break;
            case "image":
              widgetType = "image";
              settings.image = {
                url: widget.content || "",
                id: widget.imageId ? parseInt(widget.imageId, 10) : 0
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
            widgetType,
            settings,
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

  // src/utils/validation.ts
  function validatePipelineSchema(schema) {
    if (!schema || typeof schema !== "object") {
      throw new Error("Schema inv\xE1lido: n\xE3o \xE9 objeto.");
    }
    if (!schema.page || typeof schema.page !== "object") {
      throw new Error("Schema inv\xE1lido: campo page ausente.");
    }
    if (!Array.isArray(schema.containers)) {
      throw new Error("Schema inv\xE1lido: containers deve ser array.");
    }
    schema.containers.forEach(validateContainer);
  }
  function validateContainer(container) {
    if (typeof container.id !== "string") throw new Error("Container sem id.");
    if (container.direction !== "row" && container.direction !== "column") {
      throw new Error(`Container ${container.id} com direction inv\xE1lido.`);
    }
    if (container.width !== "full" && container.width !== "boxed") {
      throw new Error(`Container ${container.id} com width inv\xE1lido.`);
    }
    if (!Array.isArray(container.widgets) || !Array.isArray(container.children)) {
      throw new Error(`Container ${container.id} sem widgets/children array.`);
    }
    container.widgets.forEach(validateWidget);
    container.children.forEach(validateContainer);
  }
  function validateWidget(widget) {
    const allowed = ["heading", "text", "button", "image", "icon", "custom"];
    if (!allowed.includes(widget.type)) {
      throw new Error(`Widget com tipo inv\xE1lido: ${widget.type}`);
    }
  }
  function validateElementorJSON(json) {
    if (!json || typeof json !== "object") throw new Error("Elementor JSON inv\xE1lido: n\xE3o \xE9 objeto.");
    if (!Array.isArray(json.elements)) throw new Error("Elementor JSON inv\xE1lido: elements deve ser array.");
    json.elements.forEach((el) => validateElement(el));
  }
  function validateElement(el) {
    if (!el.id || !el.elType) throw new Error("Elemento Elementor sem id ou elType.");
    if (!Array.isArray(el.elements)) throw new Error(`Elemento ${el.id} sem elements array.`);
    if (!el.settings) throw new Error(`Elemento ${el.id} sem settings.`);
    if (el.elType !== "container" && el.elType !== "widget") throw new Error(`Elemento ${el.id} com elType inv\xE1lido.`);
    el.elements.forEach((child) => validateElement(child));
  }
  function computeCoverage(serializedFlat, schema, elementor) {
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
    elementor.elements.forEach(walkEl);
    return { n_nodes_origem, n_widgets_schema, n_containers_schema, n_elements_elementor };
  }
  var init_validation = __esm({
    "src/utils/validation.ts"() {
    }
  });

  // src/pipeline.ts
  var PIPELINE_PROMPT_V3, ConversionPipeline;
  var init_pipeline = __esm({
    "src/pipeline.ts"() {
      init_serialization_utils();
      init_api_gemini();
      init_elementor_compiler();
      init_uploader();
      init_validation();
      PIPELINE_PROMPT_V3 = `
Voce e um organizador de arvore Figma para um schema de CONTAINERS flex.

REGRAS:
- NAO ignore nenhum node. Cada node vira container (se tiver filhos) ou widget (se folha).
- NAO classifique por aparencia. Se nao souber, type = "custom".
- NAO invente grids, colunas extras ou imageBox/iconBox.
- Preservar ordem dos filhos exatamente como a arvore original.
- Mapear layoutMode: HORIZONTAL -> direction=row, VERTICAL -> direction=column, NONE -> column.
- gap = itemSpacing (se houver).
- padding = paddingTop/Right/Bottom/Left (se houver).
- background: usar fills do node (cor/imagem/gradiente) se presentes.

SCHEMA:
{
  "page": { "title": "...", "tokens": { "primaryColor": "...", "secondaryColor": "..." } },
  "containers": [
    {
      "id": "string",
      "direction": "row" | "column",
      "width": "full" | "boxed",
      "styles": {},
      "widgets": [ ... ],
      "children": [ ... ]
    }
  ]
}

WIDGETS permitidos: heading | text | button | image | icon | custom
styles: incluir sempre "sourceId" com id do node original.
SAIDA: JSON puro, sem markdown.
`;
      ConversionPipeline = class {
        constructor() {
          this.apiKey = null;
          this.model = null;
          this.compiler = new ElementorCompiler();
          this.imageUploader = new ImageUploader({});
        }
        run(_0) {
          return __async(this, arguments, function* (node, wpConfig = {}, options) {
            this.compiler.setWPConfig(wpConfig);
            this.imageUploader.setWPConfig(wpConfig);
            yield this.loadConfig();
            const preprocessed = this.preprocess(node);
            const intermediate = yield this.processWithAI(preprocessed);
            this.validateAndNormalize(intermediate, preprocessed.serializedRoot);
            validatePipelineSchema(intermediate);
            this.reconcileWithSource(intermediate, preprocessed.flatNodes);
            yield this.resolveImages(intermediate);
            const elementorJson = this.compiler.compile(intermediate);
            if (wpConfig.url) elementorJson.siteurl = wpConfig.url;
            validateElementorJSON(elementorJson);
            if (options == null ? void 0 : options.debug) {
              const coverage = computeCoverage(preprocessed.flatNodes, intermediate, elementorJson);
              const debugInfo = {
                serializedTree: preprocessed.serializedRoot,
                flatNodes: preprocessed.flatNodes,
                schema: intermediate,
                elementor: elementorJson,
                coverage
              };
              return { elementorJson, debugInfo };
            }
            return elementorJson;
          });
        }
        loadConfig() {
          return __async(this, null, function* () {
            this.apiKey = yield getKey();
            this.model = yield getModel();
            if (!this.apiKey) throw new Error("API Key nao configurada. Configure na aba IA.");
            if (!this.model) throw new Error("Modelo do Gemini nao configurado.");
          });
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
              const toHex = (c) => Math.round(c * 255).toString(16).padStart(2, "0");
              const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
              return { primaryColor: hex, secondaryColor: "#FFFFFF" };
            }
          }
          return defaultTokens;
        }
        processWithAI(pre) {
          return __async(this, null, function* () {
            var _a, _b, _c, _d, _e;
            if (!this.apiKey || !this.model) throw new Error("Configuracao de IA incompleta.");
            const endpoint = `${API_BASE_URL}${this.model}:generateContent?key=${this.apiKey}`;
            const inputPayload = {
              title: pre.pageTitle,
              tokens: pre.tokens,
              nodes: pre.flatNodes
            };
            const contents = [{
              parts: [
                { text: PIPELINE_PROMPT_V3 },
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
                  throw err;
                }
                const delay = 1500 * attempt;
                yield new Promise((res) => setTimeout(res, delay));
              }
            }
            throw new Error("Falha ao processar IA.");
          });
        }
        validateAndNormalize(schema, root) {
          if (!schema || typeof schema !== "object") throw new Error("Schema invalido: nao e um objeto.");
          if (!schema.page || typeof schema.page !== "object") schema.page = {};
          if (typeof schema.page.title !== "string") schema.page.title = String(schema.page.title || "Pagina importada");
          if (!schema.page.tokens) schema.page.tokens = {};
          if (typeof schema.page.tokens.primaryColor !== "string") schema.page.tokens.primaryColor = "#000000";
          if (typeof schema.page.tokens.secondaryColor !== "string") schema.page.tokens.secondaryColor = "#FFFFFF";
          if (!Array.isArray(schema.containers) || schema.containers.length === 0) {
            schema.containers = [this.createContainerFromSerialized(root, 0)];
          }
          schema.containers = schema.containers.map(
            (container, index) => this.normalizeContainer(container, index)
          );
        }
        normalizeContainer(container, index) {
          const normalizeWidget = (w, idx) => {
            const allowed = ["heading", "text", "button", "image", "icon", "custom"];
            const type = allowed.includes(w == null ? void 0 : w.type) ? w.type : "custom";
            const content = typeof (w == null ? void 0 : w.content) === "string" || (w == null ? void 0 : w.content) === null ? w.content : null;
            const imageId = typeof (w == null ? void 0 : w.imageId) === "string" || (w == null ? void 0 : w.imageId) === null ? w.imageId : null;
            const styles2 = w && typeof w.styles === "object" && !Array.isArray(w.styles) ? __spreadValues({}, w.styles) : {};
            if (!styles2.sourceId && typeof (w == null ? void 0 : w.sourceId) === "string") styles2.sourceId = w.sourceId;
            if (!styles2.sourceId) styles2.sourceId = `widget-${index}-${idx}`;
            return { type, content, imageId, styles: styles2, kind: w == null ? void 0 : w.kind };
          };
          const direction = (container == null ? void 0 : container.direction) === "row" ? "row" : "column";
          const width = (container == null ? void 0 : container.width) === "boxed" ? "boxed" : "full";
          const styles = container && typeof container.styles === "object" && !Array.isArray(container.styles) ? __spreadValues({}, container.styles) : {};
          if (!styles.sourceId && typeof (container == null ? void 0 : container.id) === "string") styles.sourceId = container.id;
          const widgets = Array.isArray(container == null ? void 0 : container.widgets) ? container.widgets.map((w, idx) => normalizeWidget(w, idx)) : [];
          const children = Array.isArray(container == null ? void 0 : container.children) ? container.children.map((c, i) => this.normalizeContainer(c, i)) : [];
          return {
            id: typeof (container == null ? void 0 : container.id) === "string" ? container.id : `container-${index + 1}`,
            direction,
            width,
            styles,
            widgets,
            children
          };
        }
        reconcileWithSource(schema, flatNodes) {
          const allSourceIds = new Set(flatNodes.map((n) => n.id));
          const covered = /* @__PURE__ */ new Set();
          const containerMap = /* @__PURE__ */ new Map();
          const markCoveredWidget = (widget) => {
            var _a;
            const sourceId = (_a = widget.styles) == null ? void 0 : _a.sourceId;
            if (typeof sourceId === "string") covered.add(sourceId);
          };
          const walkContainer = (container) => {
            var _a;
            const sourceId = (_a = container.styles) == null ? void 0 : _a.sourceId;
            if (typeof sourceId === "string") {
              covered.add(sourceId);
              containerMap.set(sourceId, container);
            }
            container.widgets.forEach(markCoveredWidget);
            container.children.forEach(walkContainer);
          };
          schema.containers.forEach(walkContainer);
          const missing = [...allSourceIds].filter((id) => !covered.has(id));
          if (missing.length === 0) return;
          const rootContainer = schema.containers[0] || this.createContainerFromSerialized(flatNodes[0], 0);
          const nodeById = /* @__PURE__ */ new Map();
          flatNodes.forEach((n) => nodeById.set(n.id, n));
          const ensureParentContainer = (parentId) => {
            if (parentId && containerMap.has(parentId)) return containerMap.get(parentId);
            return rootContainer;
          };
          const createWidgetFromNode = (node) => {
            const map = {
              TEXT: "text",
              VECTOR: "icon",
              STAR: "icon",
              ELLIPSE: "icon",
              RECTANGLE: "image",
              LINE: "icon"
            };
            const type = map[node.type] || "custom";
            const content = typeof node.characters === "string" ? node.characters : null;
            return {
              type,
              content,
              imageId: node.id,
              styles: {
                sourceId: node.id,
                sourceType: node.type,
                sourceName: node.name
              },
              kind: void 0
            };
          };
          const createContainerFromNode = (node) => {
            const direction = node.layoutMode === "HORIZONTAL" || node.direction === "row" ? "row" : "column";
            const styles = {
              sourceId: node.id,
              sourceType: node.type,
              sourceName: node.name,
              gap: node.itemSpacing,
              paddingTop: node.paddingTop,
              paddingRight: node.paddingRight,
              paddingBottom: node.paddingBottom,
              paddingLeft: node.paddingLeft,
              primaryAxisAlignItems: node.primaryAxisAlignItems,
              counterAxisAlignItems: node.counterAxisAlignItems
            };
            return {
              id: `container-${node.id}`,
              direction,
              width: "full",
              styles,
              widgets: [],
              children: []
            };
          };
          missing.forEach((id) => {
            const sourceNode = nodeById.get(id);
            if (!sourceNode) return;
            const parent = ensureParentContainer(sourceNode.parentId);
            if (Array.isArray(sourceNode.children) && sourceNode.children.length > 0) {
              const newContainer = createContainerFromNode(sourceNode);
              parent.children.push(newContainer);
              containerMap.set(sourceNode.id, newContainer);
              covered.add(sourceNode.id);
            } else {
              const widget = createWidgetFromNode(sourceNode);
              parent.widgets.push(widget);
              covered.add(sourceNode.id);
            }
          });
        }
        resolveImages(schema) {
          return __async(this, null, function* () {
            const processWidget = (widget) => __async(this, null, function* () {
              if (widget.imageId && (widget.type === "image" || widget.type === "custom")) {
                try {
                  const node = figma.getNodeById(widget.imageId);
                  if (node && (node.type === "FRAME" || node.type === "GROUP" || node.type === "RECTANGLE" || node.type === "INSTANCE" || node.type === "COMPONENT")) {
                    const result = yield this.imageUploader.uploadToWordPress(node);
                    if (result) {
                      widget.content = result.url;
                      widget.imageId = result.id.toString();
                    }
                  }
                } catch (e) {
                  console.error(`[Pipeline] Erro ao processar imagem ${widget.imageId}:`, e);
                }
              }
            });
            const walkContainer = (container) => __async(this, null, function* () {
              for (const widget of container.widgets) {
                yield processWidget(widget);
              }
              for (const child of container.children) {
                yield walkContainer(child);
              }
            });
            for (const container of schema.containers) {
              yield walkContainer(container);
            }
          });
        }
        createContainerFromSerialized(node, index) {
          const direction = node.layoutMode === "HORIZONTAL" || node.direction === "row" ? "row" : "column";
          const styles = {
            sourceId: node.id,
            sourceType: node.type,
            sourceName: node.name,
            gap: node.itemSpacing,
            paddingTop: node.paddingTop,
            paddingRight: node.paddingRight,
            paddingBottom: node.paddingBottom,
            paddingLeft: node.paddingLeft,
            primaryAxisAlignItems: node.primaryAxisAlignItems,
            counterAxisAlignItems: node.counterAxisAlignItems
          };
          const children = [];
          const widgets = [];
          if (Array.isArray(node.children)) {
            node.children.forEach((child) => {
              if (child.children && child.children.length > 0) {
                children.push(this.createContainerFromSerialized(child, children.length));
              } else {
                const widget = {
                  type: child.type === "TEXT" ? "text" : child.type === "RECTANGLE" ? "image" : "custom",
                  content: typeof child.characters === "string" ? child.characters : null,
                  imageId: child.type === "RECTANGLE" ? child.id : null,
                  styles: { sourceId: child.id, sourceType: child.type, sourceName: child.name }
                };
                widgets.push(widget);
              }
            });
          }
          return {
            id: typeof node.id === "string" ? node.id : `container-${index + 1}`,
            direction,
            width: "full",
            styles,
            widgets,
            children
          };
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
      figma.showUI(__html__, { width: 1024, height: 820, themeColors: true });
      var pipeline = new ConversionPipeline();
      var lastJSON = null;
      var DEFAULT_TIMEOUT_MS = 12e3;
      function toBase64(value) {
        try {
          if (typeof btoa === "function") return btoa(value);
        } catch (_) {
        }
        if (typeof globalThis.Buffer !== "undefined") {
          return globalThis.Buffer.from(value, "utf8").toString("base64");
        }
        return value;
      }
      function fetchWithTimeout(_0) {
        return __async(this, arguments, function* (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeoutMs);
          try {
            const resp = yield fetch(url, __spreadProps(__spreadValues({}, options), { signal: controller.signal }));
            return resp;
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
      function getSelectedNode() {
        const selection = figma.currentPage.selection;
        if (!selection || selection.length === 0) {
          throw new Error("Selecione um frame ou node para converter.");
        }
        return selection[0];
      }
      function generateElementorJSON(customWP, debug) {
        return __async(this, null, function* () {
          const node = getSelectedNode();
          const wpConfig = customWP || (yield loadWPConfig());
          log("Iniciando pipeline...", "info");
          const result = yield pipeline.run(node, wpConfig, { debug });
          log("Pipeline conclu\xEDdo.", "success");
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
          const payload = JSON.stringify(json, null, 2);
          lastJSON = payload;
          figma.ui.postMessage({ type: "generation-complete", payload, debug: debugInfo });
          try {
            yield figma.clipboard.writeText(payload);
            figma.notify("JSON Elementor gerado e copiado para a \xE1rea de transfer\xEAncia.");
          } catch (err) {
            figma.notify("JSON Elementor gerado. N\xE3o foi poss\xEDvel copiar automaticamente.", { timeout: 4e3 });
            log(`Falha ao copiar: ${err}`, "warn");
          }
        });
      }
      function sendPreview(data) {
        const payload = typeof data === "string" ? data : JSON.stringify(data, null, 2);
        figma.ui.postMessage({ type: "preview", payload });
      }
      function sendStoredSettings() {
        return __async(this, null, function* () {
          let geminiKey = yield loadSetting("gptel_gemini_key", "");
          if (!geminiKey) {
            geminiKey = yield loadSetting("gemini_api_key", "");
          }
          const wpUrl = yield loadSetting("gptel_wp_url", "");
          const wpUser = yield loadSetting("gptel_wp_user", "");
          const wpToken = yield loadSetting("gptel_wp_token", "");
          const exportImages = yield loadSetting("gptel_export_images", false);
          const autoPage = yield loadSetting("gptel_auto_page", false);
          const darkMode = yield loadSetting("gptel_dark_mode", false);
          figma.ui.postMessage({
            type: "load-settings",
            payload: {
              geminiKey,
              wpUrl,
              wpUser,
              wpToken,
              exportImages,
              autoPage,
              darkMode
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
              log("\xC1rvore inspecionada.", "info");
            } catch (error) {
              log((error == null ? void 0 : error.message) || String(error), "error");
            }
            break;
          case "generate-json":
            try {
              const wpConfig = msg.wpConfig;
              const debug = !!msg.debug;
              const { elementorJson, debugInfo } = yield generateElementorJSON(wpConfig, debug);
              yield deliverResult(elementorJson, debugInfo);
              sendPreview(elementorJson);
            } catch (error) {
              const message = (error == null ? void 0 : error.message) || String(error);
              log(`Erro: ${message}`, "error");
              figma.ui.postMessage({ type: "generation-error", message });
              figma.notify("Erro ao gerar JSON. Verifique os logs.", { timeout: 5e3 });
            }
            break;
          case "copy-json":
            if (lastJSON) {
              try {
                yield figma.clipboard.writeText(lastJSON);
                log("JSON copiado.", "success");
              } catch (err) {
                log(`Falha ao copiar: ${err}`, "warn");
              }
            } else {
              log("Nenhum JSON para copiar.", "warn");
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
              const url = normalizeWpUrl((cfg == null ? void 0 : cfg.url) || "");
              const user = (cfg == null ? void 0 : cfg.user) || "";
              const token = (cfg == null ? void 0 : cfg.token) || "";
              if (!lastJSON) {
                figma.ui.postMessage({ type: "wp-status", success: false, message: "Nenhum JSON gerado para exportar." });
                break;
              }
              if (!url || !user || !token) {
                figma.ui.postMessage({ type: "wp-status", success: false, message: "URL, usu\xE1rio ou senha do app ausentes." });
                break;
              }
              const auth = `Basic ${toBase64(`${user}:${token}`)}`;
              const base = url.replace(/\/$/, "");
              const meEndpoint = `${base}/wp-json/wp/v2/users/me`;
              const meResp = yield fetchWithTimeout(meEndpoint, { headers: { Authorization: auth } });
              if (!meResp.ok) {
                const text = yield meResp.text();
                figma.ui.postMessage({ type: "wp-status", success: false, message: `Falha de autentica\xE7\xE3o (${meResp.status}): ${text}` });
                break;
              }
              const pageEndpoint = `${base}/wp-json/wp/v2/pages`;
              const pageBody = {
                title: `FigToEL ${(/* @__PURE__ */ new Date()).toISOString()}`,
                status: "draft",
                meta: { _elementor_data: lastJSON },
                content: "Gerado via FigToEL (Elementor JSON em _elementor_data)."
              };
              const pageResp = yield fetchWithTimeout(pageEndpoint, {
                method: "POST",
                headers: {
                  Authorization: auth,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(pageBody)
              });
              if (!pageResp.ok) {
                const text = yield pageResp.text();
                figma.ui.postMessage({ type: "wp-status", success: false, message: `Falha ao criar p\xE1gina (${pageResp.status}): ${text}` });
                break;
              }
              const pageJson = yield pageResp.json().catch(() => ({}));
              yield saveSetting("gptel_wp_url", url);
              yield saveSetting("gptel_wp_user", user);
              yield saveSetting("gptel_wp_token", token);
              yield saveSetting("gptel_export_images", !!cfg.exportImages);
              yield saveSetting("gptel_auto_page", !!cfg.autoPage);
              const link = (pageJson == null ? void 0 : pageJson.link) || url;
              figma.ui.postMessage({ type: "wp-status", success: true, message: `P\xE1gina enviada como rascunho. Link: ${link}` });
            } catch (e) {
              const aborted = (e == null ? void 0 : e.name) === "AbortError";
              const msgErr = aborted ? "Tempo limite ao exportar para WP." : (e == null ? void 0 : e.message) || "Erro desconhecido";
              figma.ui.postMessage({ type: "wp-status", success: false, message: msgErr });
            }
            break;
          case "test-gemini":
            try {
              const inlineKey = msg.apiKey;
              let keyToTest = inlineKey || (yield loadSetting("gptel_gemini_key", ""));
              if (!keyToTest) {
                keyToTest = yield loadSetting("gemini_api_key", "");
              }
              if (!keyToTest) {
                figma.ui.postMessage({ type: "gemini-status", success: false, message: "API Key n\xE3o informada." });
                break;
              }
              const resp = yield fetch(`${API_BASE_URL}models?key=${keyToTest}&pageSize=1`);
              if (!resp.ok) {
                const text = yield resp.text();
                figma.ui.postMessage({ type: "gemini-status", success: false, message: `Falha na conex\xE3o (${resp.status}): ${text}` });
                break;
              }
              yield saveSetting("gptel_gemini_key", keyToTest);
              figma.ui.postMessage({ type: "gemini-status", success: true, message: "Conex\xE3o com Gemini verificada." });
            } catch (e) {
              figma.ui.postMessage({ type: "gemini-status", success: false, message: `Erro: ${(e == null ? void 0 : e.message) || e}` });
            }
            break;
          case "test-wp":
            try {
              const incoming = msg.wpConfig;
              const cfg = incoming && incoming.url ? incoming : yield loadWPConfig();
              const url = (cfg == null ? void 0 : cfg.url) || "";
              const user = (cfg == null ? void 0 : cfg.user) || "";
              const token = (cfg == null ? void 0 : cfg.token) || "";
              if (!url || !user || !token) {
                figma.ui.postMessage({ type: "wp-status", success: false, message: "URL, usu\xE1rio ou senha do app ausentes." });
                break;
              }
              const endpoint = url.replace(/\/$/, "") + "/wp-json/wp/v2/users/me";
              const auth = toBase64(`${user}:${token}`);
              const resp = yield fetch(endpoint, {
                method: "GET",
                headers: { Authorization: `Basic ${auth}` }
              });
              if (!resp.ok) {
                const text = yield resp.text();
                figma.ui.postMessage({ type: "wp-status", success: false, message: `Falha (${resp.status}): ${text || "sem detalhe"}` });
                break;
              }
              const autoPage = (_a = cfg.autoPage) != null ? _a : cfg.createPage;
              yield saveSetting("gptel_wp_url", url);
              yield saveSetting("gptel_wp_user", user);
              yield saveSetting("gptel_wp_token", token);
              yield saveSetting("gptel_export_images", !!cfg.exportImages);
              yield saveSetting("gptel_auto_page", !!autoPage);
              figma.ui.postMessage({ type: "wp-status", success: true, message: "Conex\xE3o com WordPress verificada." });
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
