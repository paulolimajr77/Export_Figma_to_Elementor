import { describe, it, expect } from 'vitest';
import { WidgetDetector } from '../../../linter/detectors/WidgetDetector';
import { WidgetNamingRule } from '../../../linter/rules/naming/WidgetNamingRule';

// Helpers
const makeTextNode = (overrides: Record<string, any>): SceneNode => ({
    id: overrides.id,
    name: overrides.name,
    type: 'TEXT',
    characters: overrides.characters,
    width: overrides.width ?? 200,
    height: overrides.height ?? 40,
    parentId: overrides.parentId ?? 'root',
    fontSize: overrides.fontSize ?? 16,
    fontWeight: overrides.fontWeight ?? 400,
    children: [],
    fills: [],
    strokes: [],
    ...overrides
} as unknown as SceneNode);

describe('WidgetDetector heuristics (safe defaults)', () => {
    it('não classifica frame raiz como widget', () => {
        const detector = new WidgetDetector();
        const rootFrame = {
            id: 'root',
            name: 'Page 6',
            type: 'FRAME',
            width: 1200,
            height: 800,
            parentId: null,
            children: []
        } as unknown as SceneNode;

        const detections = detector.detectAll(rootFrame);
        expect(detections.has('root')).toBe(false);

        const namingRule = new WidgetNamingRule();
        namingRule.setDetectionMap(detections);
        return namingRule.validate(rootFrame).then(result => {
            expect(result).toBeNull();
        });
    });

    it('classifica texto longo como widget textual (nunca maps/gallery)', () => {
        const detector = new WidgetDetector();
        const textNode = makeTextNode({
            id: 'text-1',
            name: 'Em 2025, demos um salto...',
            characters: 'Em 2025, demos um salto...'.repeat(8),
            parentId: 'frame-1'
        });

        const detection = detector.detect(textNode);
        expect(detection).not.toBeNull();
        expect(detection!.widget).not.toBe('w:google-maps');
        expect(detection!.widget).not.toBe('w:gallery');
    });

    it('sugere heading para títulos e text-editor para parágrafos', () => {
        const detector = new WidgetDetector();
        const heading = makeTextNode({
            id: 'text-heading',
            name: 'Hero Title',
            characters: 'Título principal',
            fontSize: 32,
            fontWeight: 700,
            parentId: 'frame-hero'
        });

        const paragraph = makeTextNode({
            id: 'text-paragraph',
            name: 'Body copy',
            characters: 'Conteúdo de parágrafo'.repeat(6),
            fontSize: 14,
            fontWeight: 400,
            parentId: 'frame-hero'
        });

        const headingDetection = detector.detect(heading);
        const paragraphDetection = detector.detect(paragraph);

        expect(headingDetection?.widget).toBe('w:heading');
        expect(paragraphDetection?.widget).toBe('w:text-editor');
    });

    it('respeita prefixo explícito w:image com confiança 1.0', () => {
        const detector = new WidgetDetector();
        const imageNode = {
            id: 'image-1',
            name: 'w:image',
            type: 'RECTANGLE',
            width: 200,
            height: 200,
            parentId: 'frame-1',
            children: [],
            fills: [],
            strokes: []
        } as unknown as SceneNode;

        const detection = detector.detect(imageNode);
        expect(detection).not.toBeNull();
        expect(detection!.widget).toBe('w:image');
        expect(detection!.confidence).toBe(1);
    });

    it('ignora detecções com confiança baixa (<= 0.5)', () => {
        const detector = new WidgetDetector();
        const tinyText = makeTextNode({
            id: 'text-low',
            name: 'note',
            characters: 'hi',
            fontSize: 12,
            width: 50,
            height: 20,
            parentId: 'frame-1'
        });

        const detection = detector.detect(tinyText);
        expect(detection).toBeNull();
    });
});
