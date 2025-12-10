import { describe, it, expect } from 'vitest';
import { TextBlockDetector } from '../../../../src/linter/detectors/TextBlockDetector';

const makeText = (id: string, name: string, fontSize: number, fontWeight: number, characters: string): SceneNode => ({
    id,
    name,
    type: 'TEXT',
    characters,
    width: 200,
    height: 40,
    fontSize,
    fontWeight,
    children: []
} as unknown as SceneNode);

describe('TextBlockDetector', () => {
    it('detecta stack de headline + body em auto layout', () => {
        const frame = {
            id: 'frame-text',
            name: 'Frame 1',
            type: 'FRAME',
            layoutMode: 'VERTICAL',
            width: 240,
            height: 137,
            children: [
                makeText('t1', 'headline', 24, 700, 'Título de impacto'),
                makeText('t2', 'body', 16, 400, 'Texto de suporte em algumas linhas\nmais linha\nmais linha')
            ]
        } as unknown as SceneNode;

        const detector = new TextBlockDetector();
        const detection = detector.detect(frame);

        expect(detection).not.toBeNull();
        expect(detection?.type).toBe('headline+body');
        expect(detection?.rolesByChildId['t1']).toBe('headline');
        expect(detection?.rolesByChildId['t2']).toBe('body');
    });

    it('detecta headline-stack com duas headlines', () => {
        const frame = {
            id: 'frame-text-2',
            name: 'Frame 2',
            type: 'FRAME',
            layoutMode: 'VERTICAL',
            width: 240,
            height: 180,
            children: [
                makeText('t1', 'headline', 30, 700, 'CHAMADA PRINCIPAL'),
                makeText('t2', 'subheadline', 26, 600, 'Subheadline de apoio')
            ]
        } as unknown as SceneNode;

        const detector = new TextBlockDetector();
        const detection = detector.detect(frame);

        expect(detection).not.toBeNull();
        expect(detection?.type).toBe('headline+subheadline');
    });
});
