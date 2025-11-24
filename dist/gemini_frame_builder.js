/// <reference types="@figma/plugin-typings" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// ==================== Funções de Criação de Frame ====================
export function createOptimizedFrame(analysis, originalNode) {
    return __awaiter(this, void 0, void 0, function* () {
        const newFrame = figma.createFrame();
        newFrame.name = analysis.frameName;
        newFrame.resize(analysis.width, analysis.height);
        if ('x' in originalNode && 'y' in originalNode) {
            newFrame.x = originalNode.x + originalNode.width + 100;
            newFrame.y = originalNode.y;
        }
        if (analysis.background) {
            newFrame.fills = [{ type: 'SOLID', color: hexToRgb(analysis.background) }];
        }
        if (analysis.autoLayout) {
            applyAutoLayoutToFrame(newFrame, analysis.autoLayout);
        }
        for (const child of analysis.children) {
            yield createChildNode(newFrame, child);
        }
        figma.currentPage.appendChild(newFrame);
        return newFrame;
    });
}
function createChildNode(parent, spec) {
    return __awaiter(this, void 0, void 0, function* () {
        if (spec.type === 'container') {
            const container = figma.createFrame();
            container.name = spec.name;
            if (spec.autoLayout) {
                applyAutoLayoutToFrame(container, spec.autoLayout);
            }
            if (spec.background) {
                container.fills = [{ type: 'SOLID', color: hexToRgb(spec.background) }];
            }
            if (spec.children) {
                for (const child of spec.children) {
                    yield createChildNode(container, child);
                }
            }
            parent.appendChild(container);
            return container;
        }
        else if (spec.type === 'widget') {
            return yield createWidget(parent, spec);
        }
        const fallback = figma.createFrame();
        fallback.name = spec.name || 'Unknown Node';
        parent.appendChild(fallback);
        return fallback;
    });
}
function createWidget(parent, spec) {
    return __awaiter(this, void 0, void 0, function* () {
        yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
        yield figma.loadFontAsync({ family: "Inter", style: "Medium" });
        switch (spec.widgetType) {
            case 'heading':
            case 'text':
            case 'text-editor':
                const text = figma.createText();
                text.name = spec.name;
                text.characters = spec.content || 'Texto de Exemplo';
                if (spec.fontSize)
                    text.fontSize = spec.fontSize;
                if (spec.color)
                    text.fills = [{ type: 'SOLID', color: hexToRgb(spec.color) }];
                parent.appendChild(text);
                return text;
            case 'button':
                const button = figma.createFrame();
                // ... (restante da lógica do botão)
                parent.appendChild(button);
                return button;
            case 'image':
            case 'image-box':
                const rect = figma.createRectangle();
                // ... (restante da lógica da imagem)
                parent.appendChild(rect);
                return rect;
            default:
                const fallbackWidget = figma.createFrame();
                fallbackWidget.name = spec.name || 'Widget Desconhecido';
                parent.appendChild(fallbackWidget);
                return fallbackWidget;
        }
    });
}
function applyAutoLayoutToFrame(frame, config) {
    frame.layoutMode = config.direction === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL';
    // ... (restante da lógica do auto-layout)
}
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
}
