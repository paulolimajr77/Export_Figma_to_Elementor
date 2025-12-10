import { describe, expect, it } from 'vitest';
import { WidgetDetector } from '../../../linter/detectors/WidgetDetector';
import { GenericNameRule } from '../../../linter/rules/naming/GenericNameRule';

const makeRect = (overrides: Record<string, any> = {}): SceneNode => ({
    id: overrides.id || 'rect-1',
    name: overrides.name || 'Rectangle 1',
    type: 'RECTANGLE',
    width: overrides.width ?? 100,
    height: overrides.height ?? 40,
    children: [],
    fills: [],
    strokes: [],
    parentId: overrides.parentId || 'root',
    ...overrides
} as unknown as SceneNode);

const makeText = (id: string, text: string): SceneNode => ({
    id,
    name: text,
    type: 'TEXT',
    characters: text,
    fontSize: 14,
    fontWeight: 400,
    width: 80,
    height: 20,
    parentId: 'p1',
    fills: [],
    strokes: [],
    children: []
} as unknown as SceneNode);

describe('Rectangles decorativos não viram button', () => {
    it('WidgetDetector ignora RECTANGLE sem texto/imagem', () => {
        const detector = new WidgetDetector();
        const rect = makeRect();
        const res = detector.detect(rect);
        expect(res).toBeNull();
    });

    it('GenericNameRule não sugere nomes para RECTANGLE sem texto', async () => {
        const rule = new GenericNameRule();
        const rect = makeRect({ name: 'Rectangle 2' });
        const res = await rule.validate(rect);
        expect(res).toBeNull();
    });
});

describe('Compósitos absorvem background decorativo', () => {
    it('icon-box consome background rectangle e não emite widget para ele', () => {
        const detector = new WidgetDetector();
        const bg = makeRect({ id: 'bg', fills: [{ type: 'SOLID' }], children: [] });
        const icon = { id: 'ic', name: 'w:icon', type: 'VECTOR', parentId: 'f1', width: 24, height: 24, children: [] } as unknown as SceneNode;
        const title = makeText('t1', 'Heading');
        const body = makeText('t2', 'Texto de descrição longo o bastante');
        const frame = {
            id: 'f1',
            name: 'w:icon-box',
            type: 'FRAME',
            children: [bg, icon, title, body],
            width: 200,
            height: 120,
            parentId: 'root',
            fills: [],
            strokes: []
        } as unknown as SceneNode;

        const map = detector.detectAll(frame);
        const det = map.get('f1');
        expect(det?.widget).toBe('w:icon-box');
        expect(det?.consumedBackgroundIds).toContain('bg');
        expect(map.has('bg')).toBe(false);
    });

    it('absorve rectangle decorativo dentro de w:icon (FRAME) sem emitir widget', () => {
        const detector = new WidgetDetector();
        const bg = makeRect({ id: 'bg-inner', fills: [{ type: 'SOLID' }], children: [], parentId: 'icon-frame' });
        const vectorIcon = { id: 'vec', name: 'shape', type: 'VECTOR', parentId: 'icon-frame', width: 24, height: 24, children: [] } as unknown as SceneNode;
        const iconFrame = {
            id: 'icon-frame',
            name: 'w:icon',
            type: 'FRAME',
            children: [bg, vectorIcon],
            width: 40,
            height: 40,
            parentId: 'f2',
            fills: [],
            strokes: []
        } as unknown as SceneNode;
        const title = makeText('t3', 'Heading');
        const body = makeText('t4', 'Texto de descrição longo o bastante');
        const frame = {
            id: 'f2',
            name: 'w:icon-box',
            type: 'FRAME',
            children: [iconFrame, title, body],
            width: 200,
            height: 120,
            parentId: 'root',
            fills: [],
            strokes: []
        } as unknown as SceneNode;

        const map = detector.detectAll(frame);
        const det = map.get('f2');
        expect(det?.widget).toBe('w:icon-box');
        expect(det?.consumedBackgroundIds).toContain('bg-inner');
        expect(map.has('bg-inner')).toBe(false);
    });
});
