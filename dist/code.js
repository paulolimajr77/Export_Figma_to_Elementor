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
      "name": "Section 1 - Hero (Full Container)",
      "type": "FRAME",
      "layoutMode": "HORIZONTAL",
      "primaryAxisSizingMode": "FIXED",
      "counterAxisSizingMode": "AUTO",
      "children": [
        {
          "id": "hero-content-col",
          "name": "Container - Left Content",
          "type": "FRAME",
          "layoutMode": "VERTICAL",
          "children": [
            {
              "id": "hero-heading",
              "name": "Heading - Title",
              "type": "TEXT",
              "characters": "O que \xE9 a Harmoniza\xE7\xE3o\\nIntima Masculina?",
              "fontSize": 48,
              "layoutSizingHorizontal": "FILL"
            },
            {
              "id": "hero-text",
              "name": "Text Editor - Description",
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
- Se um node for "w:container", ele deve virar um Container do Elementor.
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

  // src/code.ts
  var require_code = __commonJS({
    "src/code.ts"(exports) {
      init_elementor_compiler();
      init_api_gemini();
      init_api_deepseek();
      init_image_utils();
      init_serialization_utils();
      function hasLayout4(node) {
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
