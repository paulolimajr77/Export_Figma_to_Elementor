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

  // src/utils/guid.ts
  function generateGUID() {
    return "xxxxxxxxxx".replace(/[x]/g, () => (Math.random() * 36 | 0).toString(36));
  }
  function stripWidgetPrefix(name) {
    return name.replace(/^(w:|c:|grid:|loop:|woo:|slider:|pro:|media:)/i, "").trim();
  }
  var init_guid = __esm({
    "src/utils/guid.ts"() {
    }
  });

  // src/utils/geometry.ts
  function detectRelativePosition(source, target) {
    if (!source.absoluteBoundingBox || !target.absoluteBoundingBox) return "top";
    const b1 = source.absoluteBoundingBox;
    const b2 = target.absoluteBoundingBox;
    const c1 = { x: b1.x + b1.width / 2, y: b1.y + b1.height / 2 };
    const c2 = { x: b2.x + b2.width / 2, y: b2.y + b2.height / 2 };
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    if (Math.abs(dy) > Math.abs(dx)) {
      return "top";
    } else {
      return dx < 0 ? "left" : "right";
    }
  }
  var init_geometry = __esm({
    "src/utils/geometry.ts"() {
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
         * @returns URL da imagem no WordPress ou null
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
                    this.mediaHashCache.set(hash, result2.url);
                    resolve(result2.url);
                  } else {
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

  // src/utils/colors.ts
  function convertColor(paint) {
    if (!paint || paint.type !== "SOLID") return "";
    const { r, g, b } = paint.color;
    const a = paint.opacity !== void 0 ? paint.opacity : 1;
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
  }
  var init_colors = __esm({
    "src/utils/colors.ts"() {
    }
  });

  // src/extractors/styles.extractor.ts
  function hasStrokes(node) {
    return "strokes" in node;
  }
  function hasEffects(node) {
    return "effects" in node;
  }
  function hasCornerRadius(node) {
    return "cornerRadius" in node || "topLeftRadius" in node;
  }
  function isArray(value) {
    return Array.isArray(value);
  }
  function extractBorderStyles(node) {
    const settings = {};
    if (hasStrokes(node) && isArray(node.strokes) && node.strokes.length > 0) {
      const stroke = node.strokes[0];
      if (stroke.type === "SOLID") {
        settings.border_color = convertColor(stroke);
        settings.border_border = "solid";
        if (node.strokeWeight !== figma.mixed) {
          const w = node.strokeWeight;
          settings.border_width = {
            unit: "px",
            top: w,
            right: w,
            bottom: w,
            left: w,
            isLinked: true
          };
        }
      }
    }
    const radiusSettings = extractCornerRadius(node);
    Object.assign(settings, radiusSettings);
    return settings;
  }
  function extractCornerRadius(node) {
    const settings = {};
    if (hasCornerRadius(node)) {
      const anyNode = node;
      if (anyNode.cornerRadius !== figma.mixed && typeof anyNode.cornerRadius === "number") {
        const r = anyNode.cornerRadius;
        settings.border_radius = {
          unit: "px",
          top: r,
          right: r,
          bottom: r,
          left: r,
          isLinked: true
        };
      } else {
        settings.border_radius = {
          unit: "px",
          top: anyNode.topLeftRadius || 0,
          right: anyNode.topRightRadius || 0,
          bottom: anyNode.bottomRightRadius || 0,
          left: anyNode.bottomLeftRadius || 0,
          isLinked: false
        };
      }
    }
    return settings;
  }
  function extractShadows(node) {
    const settings = {};
    if (!hasEffects(node) || !Array.isArray(node.effects)) return settings;
    const drop = node.effects.find((e) => e.type === "DROP_SHADOW" && e.visible !== false);
    if (drop) {
      const { color, offset, radius, spread } = drop;
      const rgba = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
      settings.box_shadow_box_shadow_type = "yes";
      settings.box_shadow_box_shadow = {
        horizontal: Math.round(offset.x),
        vertical: Math.round(offset.y),
        blur: Math.round(radius),
        spread: Math.round(spread || 0),
        color: rgba
      };
    }
    return settings;
  }
  function extractOpacity(node) {
    if ("opacity" in node && node.opacity !== 1) {
      return { _opacity: { unit: "px", size: node.opacity } };
    }
    return {};
  }
  function extractTransform(node) {
    const settings = {};
    if ("rotation" in node && node.rotation !== 0) {
      settings._transform_rotate_popover = "custom";
      settings._transform_rotateZ_effect = { unit: "deg", size: Math.round(node.rotation) };
    }
    return settings;
  }
  var init_styles_extractor = __esm({
    "src/extractors/styles.extractor.ts"() {
      init_colors();
    }
  });

  // src/extractors/layout.extractor.ts
  function hasLayout(node) {
    return "layoutMode" in node;
  }
  function extractFlexLayout(node) {
    if (!hasLayout(node) || node.layoutMode === "NONE") return {};
    const settings = {};
    const isRow = node.layoutMode === "HORIZONTAL";
    settings.flex_direction = isRow ? "row" : "column";
    const justifyMap = {
      MIN: "start",
      CENTER: "center",
      MAX: "end",
      SPACE_BETWEEN: "space-between"
    };
    const alignMap = {
      MIN: "start",
      CENTER: "center",
      MAX: "end",
      BASELINE: "baseline",
      STRETCH: "stretch"
    };
    if (node.primaryAxisAlignItems && justifyMap[node.primaryAxisAlignItems]) {
      settings.justify_content = justifyMap[node.primaryAxisAlignItems];
    }
    if (node.counterAxisAlignItems && alignMap[node.counterAxisAlignItems]) {
      settings.align_items = alignMap[node.counterAxisAlignItems];
    }
    if (node.itemSpacing && node.itemSpacing > 0) {
      settings.gap = {
        unit: "px",
        size: node.itemSpacing,
        column: node.itemSpacing,
        row: node.itemSpacing,
        isLinked: true
      };
    }
    settings.flex_wrap = node.layoutWrap === "WRAP" ? "wrap" : "nowrap";
    return settings;
  }
  function extractPadding(node) {
    var _a, _b, _c, _d;
    const frame = node;
    const top = (_a = frame.paddingTop) != null ? _a : 0;
    const right = (_b = frame.paddingRight) != null ? _b : 0;
    const bottom = (_c = frame.paddingBottom) != null ? _c : 0;
    const left = (_d = frame.paddingLeft) != null ? _d : 0;
    const isLinked = top === right && top === bottom && top === left;
    return {
      padding: {
        unit: "px",
        top,
        right,
        bottom,
        left,
        isLinked
      }
    };
  }
  function extractMargin(node) {
    const parent = node.parent;
    if (!parent || !("layoutMode" in parent) || parent.layoutMode !== "NONE") {
      return {};
    }
    const margin = {};
    const threshold = 2;
    if (node.y > threshold) {
      margin.margin_top = { unit: "px", size: Math.round(node.y) };
    }
    if (node.x > threshold) {
      margin.margin_left = { unit: "px", size: Math.round(node.x) };
    }
    if ("width" in parent) {
      const rightSpace = parent.width - (node.x + node.width);
      if (rightSpace > threshold) {
        margin.margin_right = { unit: "px", size: Math.round(rightSpace) };
      }
    }
    if ("height" in parent) {
      const bottomSpace = parent.height - (node.y + node.height);
      if (bottomSpace > threshold) {
        margin.margin_bottom = { unit: "px", size: Math.round(bottomSpace) };
      }
    }
    return margin;
  }
  function extractPositioning(node) {
    const settings = {};
    const name = node.name.toLowerCase();
    if (name.includes("fixed")) {
      settings._position = "fixed";
      settings._offset_x = { unit: "px", size: Math.round(node.x) };
      settings._offset_y = { unit: "px", size: Math.round(node.y) };
    } else if (name.includes("sticky")) {
      settings._position = "sticky";
      settings._offset_y = { unit: "px", size: 0 };
    }
    if (node.parent && "children" in node.parent) {
      const siblings = node.parent.children;
      const index = siblings.indexOf(node);
      const z = siblings.length - index;
      if (z > 1) settings._z_index = z;
    }
    return settings;
  }
  var init_layout_extractor = __esm({
    "src/extractors/layout.extractor.ts"() {
    }
  });

  // src/extractors/background.extractor.ts
  function hasFills(node) {
    return "fills" in node;
  }
  function isArray2(value) {
    return Array.isArray(value);
  }
  function extractBackgroundAdvanced(node, uploader) {
    return __async(this, null, function* () {
      const settings = {};
      if (!hasFills(node) || !isArray2(node.fills) || node.fills.length === 0) {
        return settings;
      }
      const visibleFills = node.fills.filter((f) => f.visible !== false);
      if (visibleFills.length === 0) return settings;
      const bgFill = visibleFills[visibleFills.length - 1];
      if (bgFill.type === "SOLID") {
        settings.background_background = "classic";
        settings.background_color = convertColor(bgFill);
      } else if (bgFill.type === "IMAGE") {
        settings.background_background = "classic";
        const bgUrl = yield uploader.uploadToWordPress(node, "WEBP");
        if (bgUrl) {
          settings.background_image = { url: bgUrl, id: 0, source: "library" };
        }
        settings.background_position = "center center";
        settings.background_size = "cover";
        settings.background_repeat = "no-repeat";
      } else if (bgFill.type === "GRADIENT_LINEAR" || bgFill.type === "GRADIENT_RADIAL") {
        settings.background_background = "gradient";
        settings.background_gradient_type = bgFill.type === "GRADIENT_RADIAL" ? "radial" : "linear";
        const stops = bgFill.gradientStops;
        if (stops.length > 0) {
          settings.background_color = convertColor({
            type: "SOLID",
            color: stops[0].color,
            opacity: stops[0].color.a
          });
          settings.background_color_stop = {
            unit: "%",
            size: Math.round(stops[0].position * 100)
          };
        }
        if (stops.length > 1) {
          settings.background_color_b = convertColor({
            type: "SOLID",
            color: stops[stops.length - 1].color,
            opacity: stops[stops.length - 1].color.a
          });
          settings.background_color_b_stop = {
            unit: "%",
            size: Math.round(stops[stops.length - 1].position * 100)
          };
        }
        if (bgFill.type === "GRADIENT_LINEAR") {
          settings.background_gradient_angle = { unit: "deg", size: 180 };
        }
      }
      return settings;
    });
  }
  var init_background_extractor = __esm({
    "src/extractors/background.extractor.ts"() {
      init_colors();
    }
  });

  // src/containers/container.detector.ts
  function hasLayout2(node) {
    return "layoutMode" in node;
  }
  function isExternalContainer(node, isTopLevel = false) {
    if (!hasLayout2(node)) return false;
    const frame = node;
    const lname = node.name.toLowerCase();
    if (lname.startsWith("c:section") || lname.startsWith("c:boxed")) return true;
    if (isTopLevel) return true;
    if (frame.width > 900) return true;
    const sectionKeywords = ["section", "hero", "header", "footer", "banner", "cta"];
    if (sectionKeywords.some((kw) => lname.includes(kw))) return true;
    return false;
  }
  function isInnerContainer(node, parentNode) {
    if (!hasLayout2(node)) return false;
    const frame = node;
    const lname = node.name.toLowerCase();
    if (lname.startsWith("c:inner") || lname.startsWith("c:row") || lname.startsWith("c:col")) {
      return true;
    }
    if (!parentNode) return false;
    if (hasLayout2(parentNode)) {
      const parentFrame = parentNode;
      if (frame.width < parentFrame.width * 0.95) return true;
    }
    const innerKeywords = ["inner", "content", "wrapper", "container", "box"];
    if (innerKeywords.some((kw) => lname.includes(kw))) return true;
    return false;
  }
  function detectContainerType(node, parentNode, isTopLevel) {
    const lname = node.name.toLowerCase();
    if (lname.startsWith("c:section") || lname.startsWith("c:boxed")) {
      return "external";
    }
    if (lname.startsWith("c:inner")) {
      return "inner";
    }
    if (isExternalContainer(node, isTopLevel)) {
      return "external";
    }
    if (isInnerContainer(node, parentNode)) {
      return "inner";
    }
    return "normal";
  }
  var init_container_detector = __esm({
    "src/containers/container.detector.ts"() {
    }
  });

  // src/containers/container.builder.ts
  var ContainerBuilder;
  var init_container_builder = __esm({
    "src/containers/container.builder.ts"() {
      init_guid();
      init_styles_extractor();
      init_layout_extractor();
      init_background_extractor();
      init_container_detector();
      ContainerBuilder = class {
        constructor(uploader, processNodeFn) {
          this.uploader = uploader;
          this.processNodeFn = processNodeFn;
        }
        /**
         * Constrói um container Elementor a partir de um nó do Figma
         * @param node Nó do Figma
         * @param parentNode Nó pai
         * @param isTopLevel Se é nó de nível superior
         * @returns Elemento Elementor container
         */
        build(node, parentNode = null, isTopLevel = false) {
          return __async(this, null, function* () {
            const lname = node.name.toLowerCase();
            let settings = {};
            const containerType = detectContainerType(node, parentNode, isTopLevel);
            let isInner = containerType === "inner";
            Object.assign(settings, extractBorderStyles(node));
            Object.assign(settings, extractShadows(node));
            Object.assign(settings, yield extractBackgroundAdvanced(node, this.uploader));
            Object.assign(settings, extractPadding(node));
            Object.assign(settings, extractOpacity(node));
            Object.assign(settings, extractTransform(node));
            Object.assign(settings, extractFlexLayout(node));
            Object.assign(settings, extractMargin(node));
            if (containerType === "external") {
              let childToMerge = null;
              if ("children" in node) {
                const children = node.children;
                const frameChildren = children.filter((c) => c.type === "FRAME" || c.type === "INSTANCE");
                if (frameChildren.length === 1 && isInnerContainer(frameChildren[0], node)) {
                  childToMerge = frameChildren[0];
                }
              }
              if (childToMerge) {
                settings.content_width = "boxed";
                settings.width = { unit: "%", size: 100 };
                settings.boxed_width = { unit: "px", size: Math.round(childToMerge.width) };
                Object.assign(settings, extractPadding(childToMerge));
                Object.assign(settings, extractFlexLayout(childToMerge));
                const grandChildren = yield Promise.all(
                  childToMerge.children.map((c) => this.processNodeFn(c, node, false))
                );
                return {
                  id: generateGUID(),
                  elType: "container",
                  isInner: false,
                  settings,
                  elements: grandChildren
                };
              } else {
                settings.content_width = "full";
                settings.width = { unit: "%", size: 100 };
                if ("width" in node && node.width < 1200) {
                  settings.content_width = "boxed";
                  settings.boxed_width = { unit: "px", size: Math.round(node.width) };
                }
              }
            } else {
              isInner = true;
              settings.content_width = "full";
            }
            if (settings._position === "absolute") {
              delete settings._position;
            }
            let childElements = [];
            if ("children" in node) {
              childElements = yield Promise.all(
                node.children.map((child) => this.processNodeFn(child, node, false))
              );
            }
            return {
              id: generateGUID(),
              elType: "container",
              isInner,
              settings,
              elements: childElements
            };
          });
        }
      };
    }
  });

  // src/widgets/detector.ts
  function hasFills2(node) {
    return "fills" in node;
  }
  function isArray3(value) {
    return Array.isArray(value);
  }
  function isIconNode(node) {
    const vectorTypes = ["VECTOR", "STAR", "ELLIPSE", "POLYGON", "BOOLEAN_OPERATION", "LINE"];
    const isVector = vectorTypes.includes(node.type);
    const isSmallFrame = (node.type === "FRAME" || node.type === "INSTANCE") && node.width <= 50 && node.height <= 50;
    const name = node.name.toLowerCase();
    return isVector || isSmallFrame || name.includes("icon") || name.includes("vector");
  }
  function hasImageFill(node) {
    return hasFills2(node) && isArray3(node.fills) && node.fills.some((p) => p.type === "IMAGE");
  }
  function isImageNode(node) {
    if (node.type === "RECTANGLE") {
      return hasImageFill(node);
    }
    if (node.type === "FRAME" || node.type === "INSTANCE" || node.type === "COMPONENT") {
      const g = node;
      if (hasFills2(g) && isArray3(g.fills) && g.fills.some((f) => f.type === "IMAGE")) {
        return true;
      }
    }
    const lname = node.name.toLowerCase();
    return lname.includes("image") || lname.includes("img") || lname.includes("foto");
  }
  function detectWidgetType(node) {
    const lname = node.name.toLowerCase();
    if (lname.includes("button") || lname.includes("btn")) return "button";
    if (lname.includes("image-box") || lname.includes("card")) return "image-box";
    if (lname.includes("icon-box")) return "icon-box";
    if (node.type === "TEXT") {
      if (lname.includes("heading") || lname.includes("title")) return "heading";
      return "text-editor";
    }
    if (lname.includes("image") || lname.includes("img")) return "image";
    if (lname.includes("icon") || lname.includes("ico")) return "icon";
    if ("layoutMode" in node || node.type === "GROUP") return "container";
    return null;
  }
  function detectWidgetFromPrefix(name) {
    const prefixMatch = name.match(/^(w:|c:|grid:|loop:|woo:|slider:|pro:|media:)/i);
    if (!prefixMatch) return null;
    const prefix = prefixMatch[0].toLowerCase();
    let slug = name.substring(prefix.length).trim().toLowerCase().split(" ")[0];
    if (prefix === "woo:") slug = `woocommerce-${slug}`;
    if (prefix === "loop:") slug = `loop-${slug}`;
    if (prefix === "slider:") slug = "slides";
    return slug;
  }
  var init_detector = __esm({
    "src/widgets/detector.ts"() {
    }
  });

  // src/extractors/typography.extractor.ts
  function isArray4(value) {
    return Array.isArray(value);
  }
  function extractTypography(node) {
    const settings = {};
    settings.typography_typography = "custom";
    if (node.fontSize !== figma.mixed) {
      settings.typography_font_size = { unit: "px", size: Math.round(node.fontSize) };
    }
    if (node.fontName !== figma.mixed) {
      const style = node.fontName.style.toLowerCase();
      if (style.includes("bold")) settings.typography_font_weight = "700";
      else if (style.includes("semibold")) settings.typography_font_weight = "600";
      else if (style.includes("medium")) settings.typography_font_weight = "500";
      else if (style.includes("light")) settings.typography_font_weight = "300";
      else settings.typography_font_weight = "400";
      if (style.includes("italic")) settings.typography_font_style = "italic";
      settings.typography_font_family = node.fontName.family;
    }
    if (node.lineHeight !== figma.mixed && node.lineHeight.unit !== "AUTO") {
      if (node.lineHeight.unit === "PIXELS") {
        settings.typography_line_height = { unit: "px", size: Math.round(node.lineHeight.value) };
      } else if (node.lineHeight.unit === "PERCENT") {
        settings.typography_line_height = { unit: "em", size: (node.lineHeight.value / 100).toFixed(2) };
      }
    }
    if (node.letterSpacing !== figma.mixed && node.letterSpacing.value !== 0) {
      settings.typography_letter_spacing = { unit: "px", size: node.letterSpacing.value };
    }
    if (node.textAlignHorizontal) {
      const map = {
        LEFT: "left",
        CENTER: "center",
        RIGHT: "right",
        JUSTIFIED: "justify"
      };
      const key = node.textAlignHorizontal;
      if (map[key]) settings.align = map[key];
    }
    if (node.textDecoration === "UNDERLINE") {
      settings.typography_text_decoration = "underline";
    }
    if (node.textCase === "UPPER") {
      settings.typography_text_transform = "uppercase";
    }
    return settings;
  }
  function extractTextColor(node) {
    if (!("fills" in node) || !isArray4(node.fills) || node.fills.length === 0) return "";
    const fill = node.fills[0];
    if (fill.type === "SOLID") {
      const { r, g, b } = fill.color;
      const a = fill.opacity !== void 0 ? fill.opacity : 1;
      return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    }
    return "";
  }
  var init_typography_extractor = __esm({
    "src/extractors/typography.extractor.ts"() {
    }
  });

  // src/widgets/builders/text.builder.ts
  function createTextWidget(node) {
    const isHeading = node.fontSize > 24 || node.fontName.style.toLowerCase().includes("bold");
    const widgetType = isHeading ? "heading" : "text-editor";
    const settings = {};
    if (isHeading) {
      settings.title = node.characters;
    } else {
      settings.editor = node.characters;
    }
    Object.assign(settings, extractTypography(node));
    const color = extractTextColor(node);
    if (color) {
      if (isHeading) {
        settings.title_color = color;
      } else {
        settings.text_color = color;
      }
    }
    Object.assign(settings, extractMargin(node));
    return {
      id: generateGUID(),
      elType: "widget",
      widgetType,
      settings,
      elements: []
    };
  }
  var init_text_builder = __esm({
    "src/widgets/builders/text.builder.ts"() {
      init_guid();
      init_typography_extractor();
      init_layout_extractor();
    }
  });

  // src/compiler/elementor.compiler.ts
  function hasLayout3(node) {
    return "layoutMode" in node;
  }
  function hasCornerRadius2(node) {
    return "cornerRadius" in node || "topLeftRadius" in node;
  }
  var ElementorCompiler;
  var init_elementor_compiler = __esm({
    "src/compiler/elementor.compiler.ts"() {
      init_guid();
      init_geometry();
      init_uploader();
      init_container_builder();
      init_detector();
      init_text_builder();
      init_styles_extractor();
      init_layout_extractor();
      init_background_extractor();
      init_typography_extractor();
      ElementorCompiler = class {
        constructor(wpConfig = {}, quality = 0.85) {
          this.wpConfig = wpConfig;
          this.uploader = new ImageUploader(wpConfig, quality);
          this.containerBuilder = new ContainerBuilder(
            this.uploader,
            this.processNode.bind(this)
          );
        }
        /**
         * Compila nós do Figma em elementos Elementor
         */
        compile(nodes) {
          return __async(this, null, function* () {
            if (nodes.length === 1) {
              const node = nodes[0];
              const isArtboard = node.parent && node.parent.type === "PAGE";
              const hasPrefix = node.name.match(/^(w:|c:|grid:|loop:|woo:|slider:|pro:|media:)/i);
              if (node.type === "FRAME" && isArtboard && !hasPrefix) {
                const frame = node;
                const children = yield Promise.all(
                  frame.children.map((child) => this.processNode(child, null, true))
                );
                return children;
              }
            }
            const elements = yield Promise.all(
              Array.from(nodes).map((node) => __async(this, null, function* () {
                return this.processNode(node, null, true);
              }))
            );
            return elements;
          });
        }
        /**
         * Processa um nó individual
         */
        processNode(node, parentNode = null, isTopLevel = false) {
          return __async(this, null, function* () {
            const rawName = node.name || "";
            const widgetSlug = detectWidgetFromPrefix(rawName);
            if (widgetSlug) {
              if (["container", "section", "inner-container", "column", "row"].includes(widgetSlug)) {
                return this.containerBuilder.build(node, parentNode, isTopLevel);
              }
              return this.createExplicitWidget(node, widgetSlug);
            }
            const detected = detectWidgetType(node);
            if (detected === "container") {
              return this.containerBuilder.build(node, parentNode, isTopLevel);
            }
            if (detected) {
              return this.createExplicitWidget(node, detected);
            }
            if (node.type === "TEXT") {
              return createTextWidget(node);
            }
            if (isImageNode(node)) {
              return this.createExplicitWidget(node, "image");
            }
            if (["FRAME", "GROUP", "INSTANCE", "COMPONENT"].includes(node.type)) {
              return this.containerBuilder.build(node, parentNode, isTopLevel);
            }
            return {
              id: generateGUID(),
              elType: "widget",
              widgetType: "text-editor",
              settings: { editor: "N\xF3 n\xE3o suportado" },
              elements: []
            };
          });
        }
        /**
         * Cria um widget explícito baseado no slug
         */
        createExplicitWidget(node, widgetSlug) {
          return __async(this, null, function* () {
            const settings = {};
            const cleanTitle = stripWidgetPrefix(node.name);
            settings._widget_title = cleanTitle || widgetSlug;
            const allDescendants = this.findAllChildren(node);
            let imageNode = null;
            let titleNode = null;
            let descNode = null;
            if (["image-box", "icon-box", "button", "image"].includes(widgetSlug)) {
              if (widgetSlug === "image-box" || widgetSlug === "image") {
                imageNode = allDescendants.find((c) => isImageNode(c)) || null;
              } else if (widgetSlug === "icon-box" || widgetSlug === "icon") {
                imageNode = allDescendants.find((c) => isIconNode(c)) || null;
              }
              const textNodes = allDescendants.filter((c) => c.type === "TEXT");
              textNodes.sort((a, b) => {
                var _a, _b;
                const yA = "absoluteBoundingBox" in a ? ((_a = a.absoluteBoundingBox) == null ? void 0 : _a.y) || 0 : 0;
                const yB = "absoluteBoundingBox" in b ? ((_b = b.absoluteBoundingBox) == null ? void 0 : _b.y) || 0 : 0;
                return yA - yB;
              });
              if (textNodes.length > 0) titleNode = textNodes[0];
              if (textNodes.length > 1) descNode = textNodes[1];
            }
            const contentNodes = [imageNode, titleNode, descNode].filter((n) => n !== null);
            const styleNode = this.detectStyleNode(node, contentNodes);
            Object.assign(settings, extractMargin(node));
            Object.assign(settings, extractPositioning(node));
            Object.assign(settings, extractTransform(node));
            Object.assign(settings, extractOpacity(node));
            if (styleNode) {
              Object.assign(settings, yield extractBackgroundAdvanced(styleNode, this.uploader));
              Object.assign(settings, extractBorderStyles(styleNode));
              Object.assign(settings, extractShadows(styleNode));
              if (hasLayout3(styleNode) || hasCornerRadius2(styleNode)) {
                Object.assign(settings, extractPadding(styleNode));
              }
            } else {
              Object.assign(settings, extractBorderStyles(node));
              Object.assign(settings, extractShadows(node));
            }
            yield this.buildSpecificWidget(widgetSlug, node, settings, imageNode, titleNode, descNode);
            return {
              id: generateGUID(),
              elType: "widget",
              widgetType: widgetSlug,
              settings,
              elements: []
            };
          });
        }
        /**
         * Constrói configurações específicas de cada tipo de widget
         */
        buildSpecificWidget(widgetSlug, node, settings, imageNode, titleNode, descNode) {
          return __async(this, null, function* () {
            if (widgetSlug === "nav-menu") {
              return;
            }
            if (widgetSlug === "image") {
              const url = yield this.uploader.uploadToWordPress(node, "WEBP");
              settings.image = { url: url || "", id: 0 };
              if ("width" in node) {
                settings.width = { unit: "px", size: Math.round(node.width) };
              }
            } else if (widgetSlug === "button") {
              if (titleNode) {
                settings.text = titleNode.characters;
                Object.assign(settings, extractTypography(titleNode));
                const color = extractTextColor(titleNode);
                if (color) settings.button_text_color = color;
              } else if (node.type === "TEXT") {
                settings.text = node.characters;
              } else {
                settings.text = "Button";
              }
              if (settings.background_color) {
                settings.button_background_color = settings.background_color;
                delete settings.background_background;
                delete settings.background_color;
              }
            } else if (widgetSlug === "image-box" || widgetSlug === "icon-box") {
              if (imageNode && titleNode) {
                const pos = detectRelativePosition(imageNode, titleNode);
                settings.position = pos;
                if (pos === "left" || pos === "right") {
                  settings.content_vertical_alignment = "middle";
                }
              }
              if (imageNode) {
                if (widgetSlug === "image-box") {
                  const url = yield this.uploader.uploadToWordPress(imageNode, "WEBP");
                  if (url) settings.image = { url, id: 0 };
                  if ("width" in imageNode) {
                    const w = Math.round(imageNode.width);
                    settings.image_width = { unit: "px", size: w };
                    settings.image_size = { unit: "px", size: w, sizes: [] };
                  }
                } else {
                  const url = yield this.uploader.uploadToWordPress(imageNode, "SVG");
                  if (url) settings.selected_icon = { value: { url, id: 0 }, library: "svg" };
                  if ("width" in imageNode) {
                    const w = Math.round(imageNode.width);
                    settings.icon_size = { unit: "px", size: w };
                  }
                }
              }
              if (titleNode) {
                settings.title_text = titleNode.characters;
                const typo = extractTypography(titleNode);
                const color = extractTextColor(titleNode);
                for (const key in typo) {
                  settings[key.replace("typography_", "title_typography_")] = typo[key];
                }
                if (color) settings.title_color = color;
              }
              if (descNode) {
                settings.description_text = descNode.characters;
                const typo = extractTypography(descNode);
                const color = extractTextColor(descNode);
                for (const key in typo) {
                  settings[key.replace("typography_", "description_typography_")] = typo[key];
                }
                if (color) settings.description_color = color;
              }
            } else if (widgetSlug === "heading") {
              if (node.type === "TEXT") {
                settings.title = node.characters;
                Object.assign(settings, extractTypography(node));
                const color = extractTextColor(node);
                if (color) settings.title_color = color;
              }
            } else if (widgetSlug === "text-editor") {
              if (node.type === "TEXT") {
                settings.editor = node.characters;
                Object.assign(settings, extractTypography(node));
                const color = extractTextColor(node);
                if (color) settings.text_color = color;
              }
            } else if (widgetSlug === "icon") {
              const url = yield this.uploader.uploadToWordPress(node, "SVG");
              if (url) settings.selected_icon = { value: { url, id: 0 }, library: "svg" };
            }
          });
        }
        /**
         * Detecta o nó que contém os estilos visuais
         */
        detectStyleNode(node, internalContentNodes) {
          if ("fills" in node && Array.isArray(node.fills) && node.fills.length > 0 || "strokes" in node && Array.isArray(node.strokes) && node.strokes.length > 0 || "effects" in node && Array.isArray(node.effects) && node.effects.length > 0) {
            return node;
          }
          if ("children" in node) {
            const children = node.children;
            for (let i = children.length - 1; i >= 0; i--) {
              const child = children[i];
              if (internalContentNodes.includes(child)) continue;
              if (child.width < 10 || child.height < 10) continue;
              if ((child.type === "RECTANGLE" || child.type === "FRAME" || child.type === "ELLIPSE") && ("fills" in child && Array.isArray(child.fills) && child.fills.length > 0 || "strokes" in child && Array.isArray(child.strokes) && child.strokes.length > 0 || "effects" in child && Array.isArray(child.effects) && child.effects.length > 0)) {
                return child;
              }
            }
          }
          return node;
        }
        /**
         * Encontra todos os filhos recursivamente
         */
        findAllChildren(node, result = []) {
          if ("children" in node) {
            for (const child of node.children) {
              result.push(child);
              this.findAllChildren(child, result);
            }
          }
          return result;
        }
        /**
         * Encontra todos os elementos nav-menu recursivamente
         */
        findNavMenus(elements) {
          const navMenus = [];
          const searchRecursive = (els) => {
            for (const el of els) {
              if (el.widgetType === "nav-menu") {
                navMenus.push({
                  id: el.id,
                  name: el.settings._widget_title || "Menu de Navega\xE7\xE3o"
                });
              }
              if (el.elements && el.elements.length > 0) {
                searchRecursive(el.elements);
              }
            }
          };
          searchRecursive(elements);
          return navMenus;
        }
        /**
         * Atualiza configuração do WordPress
         */
        setWPConfig(wpConfig) {
          this.wpConfig = wpConfig;
          this.uploader.setWPConfig(wpConfig);
        }
        /**
         * Atualiza qualidade de exportação
         */
        setQuality(quality) {
          this.uploader.setQuality(quality);
        }
        /**
         * Processa resposta de upload
         */
        handleUploadResponse(id, result) {
          this.uploader.handleUploadResponse(id, result);
        }
      };
    }
  });

  // src/config/prompts.ts
  var ANALYZE_RECREATE_PROMPT;
  var init_prompts = __esm({
    "src/config/prompts.ts"() {
      ANALYZE_RECREATE_PROMPT = `
Act as an EXPERT in Figma and Elementor.
Your goal is to visually and structurally interpret the layout of the sent frame and recreate it using the best practices of responsive design and Auto Layout.

1. ANALYZE the layout screenshot and the STRUCTURAL DATA below.
2. APPLY the best practices of Auto Layout, responsiveness, visual hierarchy, and organization.
3. MAP each Figma layer to the most suitable native Elementor widget (e.g., Layer "Title" -> w:heading, Layer "Image" -> w:image).
4. PRESERVE visual fidelity using the provided data as the ABSOLUTE SOURCE OF TRUTH.

AVAILABLE IMAGES (IDs):
\${availableImageIds}

STRUCTURAL CONTEXT (FIGMA DATA):
\${nodeData}

CRITICAL VISUAL FIDELITY RULES:
1. DIMENSIONS: Copy EXACTLY the "width" and "height" from the structural JSON for each element. DO NOT invent values.
2. BACKGROUNDS: Extract "fills" from the JSON. If "SOLID", use the hex color. If "GRADIENT", try to reproduce or use the main color.
3. IMAGES: If the JSON has "fills" of type "IMAGE", map to the correct image widget.
4. TEXT: Copy the text EXACTLY as it is in the "characters" field of the JSON.

VALID WIDGET LIST (Use EXACTLY these tags in the "name" field):

**Widgets B\xE1sicos (Elementor Free)**
- w:container, w:inner-container, w:heading, w:text-editor, w:image, w:video, w:button, w:divider, w:spacer, w:icon, w:icon-box, w:image-box, w:star-rating, w:counter, w:progress, w:tabs, w:accordion, w:toggle, w:alert, w:social-icons, w:soundcloud, w:shortcode, w:html, w:menu-anchor, w:sidebar, w:read-more, w:image-carousel, w:basic-gallery, w:gallery, w:icon-list, w:nav-menu, w:search-form, w:google-maps, w:testimonial, w:embed, w:lottie, loop:grid

**Widgets Elementor Pro**
- w:form, w:login, w:subscription, w:call-to-action, media:carousel, w:portfolio, w:gallery-pro, slider:slides, w:slideshow, w:flip-box, w:animated-headline, w:post-navigation, w:share-buttons, w:table-of-contents, w:countdown, w:blockquote, w:testimonial-carousel, w:review-box, w:hotspots, w:sitemap, w:author-box, w:price-table, w:price-list, w:progress-tracker, w:animated-text, w:nav-menu-pro, w:breadcrumb, w:facebook-button, w:facebook-comments, w:facebook-embed, w:facebook-page, loop:builder, loop:grid-advanced, loop:carousel, w:post-excerpt, w:post-content, w:post-title, w:post-info, w:post-featured-image, w:post-author, w:post-date, w:post-terms, w:archive-title, w:archive-description, w:site-logo, w:site-title, w:site-tagline, w:search-results, w:global-widget, w:video-playlist, w:video-gallery

**WooCommerce Widgets**
- woo:product-title, woo:product-image, woo:product-price, woo:product-add-to-cart, woo:product-data-tabs, woo:product-excerpt, woo:product-rating, woo:product-stock, woo:product-meta, woo:product-additional-information, woo:product-short-description, woo:product-related, woo:product-upsells, woo:product-tabs, woo:product-breadcrumb, woo:product-gallery, woo:products, woo:product-grid, woo:product-carousel, woo:product-loop-item, woo:loop-product-title, woo:loop-product-price, woo:loop-product-rating, woo:loop-product-image, woo:loop-product-button, woo:loop-product-meta, woo:cart, woo:checkout, woo:my-account, woo:purchase-summary, woo:order-tracking

**Loop Builder Widgets**
- loop:grid, loop:carousel, loop:item, loop:image, loop:title, loop:meta, loop:terms, loop:rating, loop:price, loop:add-to-cart, loop:read-more, loop:featured-image

**Carross\xE9is**
- w:image-carousel, media:carousel, w:testimonial-carousel, w:review-carousel, slider:slides, slider:slider, loop:carousel, woo:product-carousel, w:posts-carousel, w:gallery-carousel

**Widgets Experimentais**
- w:nested-tabs, w:mega-menu, w:scroll-snap, w:motion-effects, w:background-slideshow, w:css-transform, w:custom-position, w:dynamic-tags, w:ajax-pagination, loop:pagination, w:aspect-ratio-container

**WordPress Widgets**
- w:wp-search, w:wp-recent-posts, w:wp-recent-comments, w:wp-archives, w:wp-categories, w:wp-calendar, w:wp-tag-cloud, w:wp-custom-menu

Responda APENAS com JSON v\xE1lido seguindo ESTRITAMENTE esta estrutura:

{
  "frameName": "Nome do Frame",
  "width": \${width},
  "height": \${height},
  "background": "#FFFFFF",
  "autoLayout": { "direction": "vertical", "gap": 0, "padding": { "top": 0, "right": 0, "bottom": 0, "left": 0 } },
  "children": [
    {
      "type": "container",
      "name": "w:container",
      "background": "transparent",
      "width": \${width},
      "height": \${halfHeight},
      "autoLayout": { "direction": "vertical", "gap": 20, "padding": { "top": 40, "right": 40, "bottom": 40, "left": 40 } },
      "children": [
        {
          "type": "widget",
          "widgetType": "heading",
          "name": "w:heading",
          "content": "TEXTO EXATO DA IMAGEM",
          "fontSize": 48,
          "fontFamily": "Inter",
          "fontWeight": "Bold",
          "color": "#333333",
          "width": \${halfWidth},
          "height": 60
        },
        {
          "type": "widget",
          "widgetType": "image",
          "name": "w:image",
          "content": "\${firstImageId}",
          "width": \${thirdWidth},
          "height": \${thirdHeight}
        }
      ]
    }
    }
  ]
}

Regras CRITICAS:
1. Use os DADOS DO FIGMA fornecidos para extrair o texto exato, fontes (fontFamily/fontWeight), cores e dimens\xF5es.
2. Estime as dimens\xF5es (width/height) de TODOS os elementos com precis\xE3o baseada nos dados.
3. Para IMAGENS: Se a imagem visual corresponder a um dos IDs listados acima, use o ID no campo "content".
4.  **Components**: Identify repeating elements that should be Components.

OUTPUT FORMAT:
Provide the response in clear MARKDOWN format.
- Use **Bold** for key settings.
- Use \`Code Blocks\` ONLY for JSON tokens (Colors/Typography).
- Structure with clear Headings (###).

REQUIRED JSON OUTPUTS (Include these as code blocks):
- **Color Tokens JSON**: { "colors": { ... } }
- **Typography Tokens JSON**: { "typography": { ... } }

STRUCTURAL CONTEXT (FIGMA DATA):
\${nodeData}
`;
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
      if (char === "\\" && !escaped) {
        escaped = true;
        continue;
      }
      if (char === '"' && !escaped) {
        inString = !inString;
      }
      if (!inString) {
        if (char === "{") openBraces++;
        if (char === "}") openBraces--;
        if (char === "[") openBrackets++;
        if (char === "]") openBrackets--;
      }
      escaped = false;
    }
    if (inString) {
      repaired += '"';
    }
    while (openBrackets > 0) {
      repaired += "]";
      openBrackets--;
    }
    while (openBraces > 0) {
      repaired += "}";
      openBraces--;
    }
    return repaired;
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
  var GEMINI_MODEL, API_BASE_URL, GeminiError;
  var init_api_gemini = __esm({
    "src/api_gemini.ts"() {
      init_prompts();
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

  // src/gemini_frame_builder.ts
  function createOptimizedFrame(_0, _1) {
    return __async(this, arguments, function* (analysis, originalNode, availableImages = {}) {
      figma.ui.postMessage({ type: "add-gemini-log", data: `\u{1F528} Criando Frame Principal: "${analysis.frameName || "Gemini Frame"}"` });
      const newFrame = figma.createFrame();
      newFrame.name = analysis.frameName || "Gemini IA Frame";
      const width = analysis.width || (originalNode ? originalNode.width : 1200);
      const height = analysis.height || (originalNode ? originalNode.height : 800);
      newFrame.resize(width, height);
      figma.ui.postMessage({ type: "add-gemini-log", data: `\u{1F4CF} Dimens\xF5es: ${width}x${height}` });
      if (originalNode && "x" in originalNode && "y" in originalNode) {
        newFrame.x = originalNode.x + originalNode.width + 100;
        newFrame.y = originalNode.y;
      } else {
        newFrame.x = figma.viewport.center.x - width / 2;
        newFrame.y = figma.viewport.center.y - height / 2;
      }
      if (originalNode && "fills" in originalNode && originalNode.fills !== figma.mixed) {
        console.log("Original Node Fills:", JSON.stringify(originalNode.fills, null, 2));
        try {
          newFrame.fills = JSON.parse(JSON.stringify(originalNode.fills));
          console.log("New Frame Fills applied:", JSON.stringify(newFrame.fills, null, 2));
          figma.ui.postMessage({ type: "add-gemini-log", data: `\u{1F3A8} Copiando preenchimentos do original...` });
        } catch (e) {
          console.error("Error applying fills:", e);
        }
      } else {
        console.log("Original Node has no fills or mixed fills, or is null.");
        if (analysis.fills) {
          try {
            newFrame.fills = analysis.fills;
            figma.ui.postMessage({ type: "add-gemini-log", data: `\u{1F3A8} Aplicando fills do JSON...` });
          } catch (e) {
            console.error("Error applying JSON fills:", e);
          }
        } else if (analysis.background) {
          newFrame.fills = [{ type: "SOLID", color: hexToRgb(analysis.background) }];
          figma.ui.postMessage({ type: "add-gemini-log", data: `\u{1F3A8} Aplicando background: ${analysis.background}` });
        }
      }
      if (analysis.autoLayout) {
        applyAutoLayoutToFrame(newFrame, analysis.autoLayout);
        figma.ui.postMessage({ type: "add-gemini-log", data: `\u{1F4D0} Aplicando Auto Layout: ${analysis.autoLayout.direction}` });
      }
      if (analysis.children && Array.isArray(analysis.children)) {
        figma.ui.postMessage({ type: "add-gemini-log", data: `\u{1F476} Processando ${analysis.children.length} filhos...` });
        for (const child of analysis.children) {
          yield createChildNode(newFrame, child, availableImages);
        }
      }
      figma.currentPage.appendChild(newFrame);
      return newFrame;
    });
  }
  function createChildNode(parent, spec, availableImages) {
    return __async(this, null, function* () {
      if (spec.type === "container") {
        const container = figma.createFrame();
        container.name = spec.name;
        applyCommonProperties(container, spec);
        if (spec.autoLayout) {
          applyAutoLayoutToFrame(container, spec.autoLayout);
        }
        if (spec.children) {
          for (const child of spec.children) {
            yield createChildNode(container, child, availableImages);
          }
        }
        parent.appendChild(container);
        return container;
      } else if (spec.type === "widget") {
        return yield createWidget(parent, spec, availableImages);
      }
      const fallback = figma.createFrame();
      fallback.name = spec.name || "Unknown Node";
      applyCommonProperties(fallback, spec);
      parent.appendChild(fallback);
      return fallback;
    });
  }
  function createWidget(parent, spec, availableImages) {
    return __async(this, null, function* () {
      yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
      yield figma.loadFontAsync({ family: "Inter", style: "Medium" });
      yield figma.loadFontAsync({ family: "Inter", style: "Bold" });
      if (spec.fontFamily) {
        try {
          const weight = spec.fontWeight || "Regular";
          yield figma.loadFontAsync({ family: spec.fontFamily, style: weight });
        } catch (e) {
          console.warn(`Fonte ${spec.fontFamily} n\xE3o encontrada, usando Inter.`);
        }
      }
      let node;
      switch (spec.widgetType) {
        case "heading":
        case "text":
        case "text-editor":
          const text = figma.createText();
          node = text;
          text.name = spec.name || "Texto";
          text.characters = spec.content || spec.characters || "Texto";
          if (spec.fontSize) text.fontSize = spec.fontSize;
          if (spec.fontFamily) {
            const weight = spec.fontWeight || "Regular";
            try {
              text.fontName = { family: spec.fontFamily, style: weight };
            } catch (e) {
              text.fontName = { family: "Inter", style: "Regular" };
            }
          }
          if (spec.width) {
            text.resize(spec.width, text.height);
            text.textAutoResize = "HEIGHT";
          } else {
            text.textAutoResize = "WIDTH_AND_HEIGHT";
          }
          applyCommonProperties(text, spec, { skipResize: true });
          break;
        case "button":
          const button = figma.createFrame();
          node = button;
          button.name = spec.name || "Bot\xE3o";
          button.primaryAxisSizingMode = "AUTO";
          button.counterAxisSizingMode = "AUTO";
          button.layoutMode = "HORIZONTAL";
          button.paddingLeft = 24;
          button.paddingRight = 24;
          button.paddingTop = 12;
          button.paddingBottom = 12;
          button.cornerRadius = 8;
          const btnText = figma.createText();
          btnText.characters = spec.content || "Bot\xE3o";
          btnText.fontSize = 16;
          if (spec.color) btnText.fills = [{ type: "SOLID", color: hexToRgb(spec.color) }];
          button.appendChild(btnText);
          applyCommonProperties(button, spec);
          if (spec.width && spec.height) {
            button.primaryAxisSizingMode = "FIXED";
            button.counterAxisSizingMode = "FIXED";
          }
          break;
        case "image":
        case "image-box":
          const rect = figma.createRectangle();
          node = rect;
          rect.name = spec.name || "Imagem";
          if (!spec.width || !spec.height) {
            rect.resize(100, 100);
          }
          applyCommonProperties(rect, spec);
          if (spec.content && availableImages[spec.content]) {
            const image = figma.createImage(availableImages[spec.content]);
            rect.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: image.hash }];
          } else if (!spec.fills && !spec.background) {
            rect.fills = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
          }
          break;
        default:
          const fallbackWidget = figma.createFrame();
          node = fallbackWidget;
          fallbackWidget.name = spec.name || "Widget";
          applyCommonProperties(fallbackWidget, spec);
          break;
      }
      parent.appendChild(node);
      return node;
    });
  }
  function applyCommonProperties(node, spec, options = {}) {
    if (!options.skipResize && spec.width && spec.height) {
      try {
        if ("resize" in node) {
          node.resize(spec.width, spec.height);
        }
      } catch (e) {
        console.warn("Falha ao redimensionar node:", e);
      }
    }
    if ("fills" in node) {
      if (spec.fills) {
        try {
          node.fills = spec.fills;
        } catch (e) {
        }
      } else if (spec.background) {
        node.fills = [{ type: "SOLID", color: hexToRgb(spec.background) }];
      } else if (spec.color && node.type === "TEXT") {
        node.fills = [{ type: "SOLID", color: hexToRgb(spec.color) }];
      }
    }
    if ("cornerRadius" in node && spec.cornerRadius) {
      if (node.type !== "ELLIPSE") {
        node.cornerRadius = spec.cornerRadius;
      }
    }
  }
  function applyAutoLayoutToFrame(frame, config) {
    frame.layoutMode = config.direction === "horizontal" ? "HORIZONTAL" : "VERTICAL";
  }
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  }
  var init_gemini_frame_builder = __esm({
    "src/gemini_frame_builder.ts"() {
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
  var init_serialization_utils = __esm({
    "src/utils/serialization_utils.ts"() {
      init_image_utils();
    }
  });

  // src/code.ts
  var require_code = __commonJS({
    "src/code.ts"(exports) {
      init_elementor_compiler();
      init_api_gemini();
      init_gemini_frame_builder();
      init_image_utils();
      init_serialization_utils();
      function hasLayout4(node) {
        return "layoutMode" in node;
      }
      figma.showUI(__html__, { width: 600, height: 600 });
      var compiler;
      figma.clientStorage.getAsync("wp_config").then((config) => {
        compiler = new ElementorCompiler(config || {});
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
        var _a;
        console.log("\u{1F4E8} Mensagem recebida:", msg.type);
        console.log("Dados completos:", msg);
        if (!compiler) compiler = new ElementorCompiler({});
        if (msg.type === "export-elementor") {
          const selection = figma.currentPage.selection;
          if (selection.length === 0) {
            figma.notify("Selecione ao menos um frame.");
            return;
          }
          if (msg.quality) compiler.setQuality(msg.quality);
          figma.notify("Processando... (Uploads de imagem podem demorar)");
          try {
            const elements = yield compiler.compile(selection);
            const navMenus = compiler.findNavMenus(elements);
            const template = {
              type: "elementor",
              siteurl: ((_a = compiler.wpConfig) == null ? void 0 : _a.url) || "",
              elements,
              version: "0.4"
            };
            figma.ui.postMessage({
              type: "export-result",
              data: JSON.stringify(template, null, 2),
              navMenus
            });
            if (navMenus.length > 0) {
              figma.notify(`JSON gerado! Encontrado(s) ${navMenus.length} menu(s) de navega\xE7\xE3o.`);
            } else {
              figma.notify("JSON gerado com sucesso!");
            }
          } catch (e) {
            console.error(e);
            figma.notify("Erro ao exportar.");
          }
        } else if (msg.type === "save-wp-config") {
          yield figma.clientStorage.setAsync("wp_config", msg.config);
          compiler.setWPConfig(msg.config);
          figma.notify("Configura\xE7\xF5es salvas.");
        } else if (msg.type === "get-wp-config") {
          console.log("\u{1F4E5} Recebido get-wp-config");
          const config = yield figma.clientStorage.getAsync("wp_config");
          console.log("Config WP recuperada:", config);
          figma.ui.postMessage({ type: "load-wp-config", config });
        } else if (msg.type === "get-gemini-config") {
          console.log("\u{1F4E5} Recebido get-gemini-config");
          const apiKey = yield getKey();
          const model = yield getModel();
          console.log("Gemini config recuperada - API Key:", apiKey ? "presente" : "ausente", "Modelo:", model);
          figma.ui.postMessage({ type: "load-gemini-config", apiKey, model });
        } else if (msg.type === "upload-image-response") {
          compiler.handleUploadResponse(msg.id, msg);
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
            layout: hasLayout4(n) ? n.layoutMode : "none"
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
          if (node.type !== "FRAME" && node.type !== "SECTION" && node.type !== "COMPONENT") {
            figma.notify("\u26A0\uFE0F Selecione um Frame, Section ou Componente v\xE1lido.");
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
              const originalName = child.name;
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
              figma.ui.postMessage({
                type: "show-preview-image",
                image: base64SectionImage,
                name: child.name
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
              if (sectionAnalysis.children) {
                aggregatedChildren.push(...sectionAnalysis.children);
              }
              if (sectionAnalysis.improvements) {
                aggregatedImprovements.push(...sectionAnalysis.improvements);
              }
            }
            figma.notify("\u{1F3A8} Montando frame final otimizado...");
            const finalAnalysis = {
              frameName: node.name + " (Otimizado)",
              width: node.width,
              height: node.height,
              background: getBackgroundFromNode(node),
              // Extrai o background do node original
              autoLayout: { direction: "vertical", gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
              children: aggregatedChildren,
              improvements: [...new Set(aggregatedImprovements)]
              // Remove duplicatas
            };
            const newFrame = yield createOptimizedFrame(finalAnalysis, node, availableImages);
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
            figma.notify("\u2705 Frame recriado com sucesso (An\xE1lise por se\xE7\xF5es)!");
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
        } else if (msg.type === "resize-ui") {
          figma.ui.resize(msg.width, msg.height);
        }
      });
    }
  });
  require_code();
})();
