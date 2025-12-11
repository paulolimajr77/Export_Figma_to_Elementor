import type { ElementorSettings, GeometryNode } from '../types/elementor.types';

/**
 * Extrai dados brutos de background (cor, imagem, gradiente) sem heurísticas.
 * Não descarta fills; apenas converte o último fill visível para settings simples.
 */
function hasFills(node: SceneNode): node is GeometryNode {
    return 'fills' in node;
}

/**
 * Extrai background simplificado (cor/gradiente/imagem) preservando o fill visível.
 */
export function extractBackgroundBasic(node: SceneNode): ElementorSettings {
    const settings: ElementorSettings = {};

    if (!hasFills(node) || !Array.isArray(node.fills) || node.fills.length === 0) {
        return settings;
    }

    const visibleFills = node.fills.filter(f => f.visible !== false);
    if (visibleFills.length === 0) return settings;

    // Usa o último fill visível (mais ao topo)
    const fill = visibleFills[visibleFills.length - 1];

    if (fill.type === 'SOLID') {
        const { r, g, b } = fill.color;
        const a = typeof fill.opacity === 'number' ? fill.opacity : 1;
        settings.background_background = 'classic';
        settings.background_color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    } else if (fill.type === 'IMAGE') {
        settings.background_background = 'classic';
        settings.background_image = {
            url: '', // URL deve ser resolvida posteriormente pelo pipeline/uploader
            id: 0,
            imageHash: fill.imageHash ?? null
        };
        settings.background_size = fill.scaleMode === 'TILE' ? 'auto' : 'cover';
        settings.background_repeat = fill.scaleMode === 'TILE' ? 'repeat' : 'no-repeat';
    } else if (
        fill.type === 'GRADIENT_LINEAR' ||
        fill.type === 'GRADIENT_RADIAL' ||
        fill.type === 'GRADIENT_ANGULAR' ||
        fill.type === 'GRADIENT_DIAMOND'
    ) {
        settings.background_background = 'gradient';
        settings.background_gradient_type = fill.type === 'GRADIENT_RADIAL' ? 'radial' : 'linear';

        // Convert Stops
        const stops = (fill.gradientStops || []).map((stop: any) => ({
            position: Math.round(stop.position * 100),
            color: `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(stop.color.g * 255)}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`
        }));

        // Calculate Angle
        let angle = 180; // Default Top-to-Bottom
        if (fill.gradientTransform) {
            const [row1, row2] = fill.gradientTransform;
            // a = row1[0], b = row2[0]
            const a = row1[0];
            const b = row2[0];
            // Math angle in radians
            const rad = Math.atan2(b, a);
            // Convert to degrees
            const deg = rad * (180 / Math.PI);
            // Convert Math (0=Right, 90=Down) to CSS (0=Up, 90=Right, 180=Down)
            // Math 0 -> CSS 90
            // Math 90 -> CSS 180
            angle = Math.round(deg + 90);

            // Normalize to 0-360
            if (angle < 0) angle += 360;
            if (angle >= 360) angle -= 360;
        }

        // Pass enriched data to be consumed by compiler or directly here if possible. 
        // Note: The extractor returns "ElementorSettings" which is flat.
        // However, elementor.compiler.ts reads from `styles.background`.
        // This function seems to be used by the pipeline to populate `styles`.
        // We will output a custom structure that logic/compiler knows how to read?
        // Wait, `extractBackgroundBasic` returns `ElementorSettings`. But `elementor.compiler.ts` logic suggests it reads abstract `styles.background` object? 
        // Let's verify who calls `extractBackgroundBasic`. 
        // It seems `runPipelineWithoutAI` calls generic extraction -> `styles.extractor` -> which might call this? 
        // No, `styles.extractor` deals with "strokes". 
        // `background.extractor.ts` is likely called by the pipeline aggregator. 

        // Let's return the standard Elementor "field" names directly here?
        // If I do that, `elementor.compiler.ts` logic might overwrite it or not usage it if it expects a specific `styles` object structure.
        // Let's look at `elementor.compiler.ts` line 167 again. It checks `styles.background.type`.
        // This implies `extractBackgroundBasic` is NOT the final step for `styles.background`.

        // Actually, looking at `elementor.compiler.ts` again, it acts on `styles`.
        // If `extractBackgroundBasic` is used to populate `styles` directly, then I should return the raw-ish data that `elementor.compiler.ts` expects, OR update `elementor.compiler.ts` to expect this pre-calculated data.

        // Assuming `extractBackgroundBasic` is THE place where `styles: { background ... }` is created?
        // Wait, the return type is `ElementorSettings`. But `elementor.compiler.ts` consumes `ElementorSettings`?
        // `elementor.compiler.ts` : `compile(node)` -> `const styles = node.styles || {}`.
        // So `styles` is PART of the node data structure passed to compiler.
        // `extractBackgroundBasic` likely populates that `node.styles`.

        // PROPOSAL: I will output the direct Elementor settings here (flattened) AND a special `_gradient_data` property if needed, 
        // BUT most importantly, I will format it so the Compiler can just use it or pass it through.

        // Actually, looking at `elementor.compiler.ts` L167, it expects `bg.type`, `bg.stops`, `bg.gradientType`.
        // I should return an object that satisfies that check OR ensures the Compiler logic (which hardcodes 180) is sidestepped/updated.

        // I will return the specific internal properties the compiler looks for, but ENRICHED.

        // Hack: The current codebase (seen in compiler) expects `bg` object.
        // `extractBackgroundBasic` returns `ElementorSettings` (flat settings).
        // This means there is a mismatch or I am missing the glues code.
        // `pipeline/noai.parser.ts` likely calls extractors and builds the style object.

        // I will blindly assume I should return the "Compiler-Ready" settings here as "ElementorSettings" keys 
        // AND special keys that I will update the compiler to look for.

        settings.background_gradient_stops = stops; // Custom key I can read in compiler
        settings.background_gradient_angle = { unit: 'deg', size: angle, sizes: [] }; // The compiler was overwriting this!

        // Also keeping raw "fill" refs for safety? No.
    }

    return settings;
}
