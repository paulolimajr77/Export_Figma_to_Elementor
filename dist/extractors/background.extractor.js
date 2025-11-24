var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { convertColor } from '../utils/colors';
/**
 * Type guards
 */
function hasFills(node) {
    return 'fills' in node;
}
function isArray(value) {
    return Array.isArray(value);
}
/**
 * Extrai background avançado (sólido, gradiente ou imagem)
 * @param node Nó do Figma
 * @param uploader Instância do uploader de imagens
 * @returns Settings de background do Elementor
 */
export function extractBackgroundAdvanced(node, uploader) {
    return __awaiter(this, void 0, void 0, function* () {
        const settings = {};
        if (!hasFills(node) || !isArray(node.fills) || node.fills.length === 0) {
            return settings;
        }
        const visibleFills = node.fills.filter(f => f.visible !== false);
        if (visibleFills.length === 0)
            return settings;
        // Pega o último fill visível (o que está por cima)
        const bgFill = visibleFills[visibleFills.length - 1];
        // Background sólido
        if (bgFill.type === 'SOLID') {
            settings.background_background = 'classic';
            settings.background_color = convertColor(bgFill);
        }
        // Background com imagem
        else if (bgFill.type === 'IMAGE') {
            settings.background_background = 'classic';
            const bgUrl = yield uploader.uploadToWordPress(node, 'WEBP');
            if (bgUrl) {
                settings.background_image = { url: bgUrl, id: 0, source: 'library' };
            }
            settings.background_position = 'center center';
            settings.background_size = 'cover';
            settings.background_repeat = 'no-repeat';
        }
        // Background com gradiente
        else if (bgFill.type === 'GRADIENT_LINEAR' || bgFill.type === 'GRADIENT_RADIAL') {
            settings.background_background = 'gradient';
            settings.background_gradient_type = bgFill.type === 'GRADIENT_RADIAL' ? 'radial' : 'linear';
            const stops = bgFill.gradientStops;
            // Primeira cor do gradiente
            if (stops.length > 0) {
                settings.background_color = convertColor({
                    type: 'SOLID',
                    color: stops[0].color,
                    opacity: stops[0].color.a
                });
                settings.background_color_stop = {
                    unit: '%',
                    size: Math.round(stops[0].position * 100)
                };
            }
            // Segunda cor do gradiente
            if (stops.length > 1) {
                settings.background_color_b = convertColor({
                    type: 'SOLID',
                    color: stops[stops.length - 1].color,
                    opacity: stops[stops.length - 1].color.a
                });
                settings.background_color_b_stop = {
                    unit: '%',
                    size: Math.round(stops[stops.length - 1].position * 100)
                };
            }
            // Ângulo do gradiente linear
            if (bgFill.type === 'GRADIENT_LINEAR') {
                settings.background_gradient_angle = { unit: 'deg', size: 180 };
            }
        }
        return settings;
    });
}
/**
 * Extrai background simples (apenas cor sólida)
 * @param node Nó do Figma
 * @returns Settings de background
 */
export function extractBackgroundColor(node) {
    const settings = {};
    if (!hasFills(node) || !isArray(node.fills) || node.fills.length === 0) {
        return settings;
    }
    const visibleFills = node.fills.filter(f => f.visible !== false);
    if (visibleFills.length === 0)
        return settings;
    const bgFill = visibleFills[visibleFills.length - 1];
    if (bgFill.type === 'SOLID') {
        settings.background_background = 'classic';
        settings.background_color = convertColor(bgFill);
    }
    return settings;
}
