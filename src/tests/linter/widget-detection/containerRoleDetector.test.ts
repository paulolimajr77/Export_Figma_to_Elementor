import { describe, it, expect } from 'vitest';
import { ContainerRoleDetector } from '../../../../src/linter/detectors/ContainerRoleDetector';

const makeFrame = (id: string, name: string, width: number, height: number, children: SceneNode[] = [], layoutMode: 'HORIZONTAL' | 'VERTICAL' | 'NONE' = 'NONE', parentId: string | null = 'root'): SceneNode => ({
    id,
    name,
    type: 'FRAME',
    width,
    height,
    children,
    layoutMode,
    parentId
} as unknown as SceneNode);

const makeText = (id: string, text: string): SceneNode => ({
    id,
    name: text,
    type: 'TEXT',
    characters: text,
    width: 120,
    height: 20,
    fontSize: 16,
    fontWeight: 400
} as unknown as SceneNode);

const makeImage = (id: string): SceneNode => ({
    id,
    name: 'Image',
    type: 'RECTANGLE',
    width: 120,
    height: 120,
    fills: [{ type: 'IMAGE' }]
} as unknown as SceneNode);

describe('ContainerRoleDetector', () => {
    it('sugere section/inner para frames genéricos com 1 filho', () => {
        const frame = makeFrame('f1', 'Frame', 600, 400, [makeText('t1', 'Texto')], 'NONE');
        const detector = new ContainerRoleDetector();
        const detection = detector.detect(frame);
        expect(detection).not.toBeNull();
        expect(['section', 'inner']).toContain(detection!.role);
    });

    it('detecta image-box container (imagem + texto)', () => {
        const frame = makeFrame('f2', 'Frame', 400, 400, [makeImage('img1'), makeText('t2', 'Legenda')], 'VERTICAL');
        const detector = new ContainerRoleDetector();
        const detection = detector.detect(frame);
        expect(detection?.role).toBe('image-box-container');
    });

    it('detecta card exportado isoladamente com parentId null', () => {
        const card = makeFrame('card-1', 'Card Export', 420, 520, [makeImage('img2'), makeText('t3', 'Título'), makeText('t4', 'Descrição')], 'VERTICAL', null);
        const detector = new ContainerRoleDetector();
        const detection = detector.detect(card);
        expect(detection).not.toBeNull();
        expect(detection!.role).toBe('card');
    });
});
