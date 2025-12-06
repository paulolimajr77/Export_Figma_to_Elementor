import { describe, it, expect } from 'vitest';
import { ElementorCompiler } from '../compiler/elementor.compiler';
import type { PipelineSchema } from '../types/pipeline.schema';

const compiler = new ElementorCompiler();

const schema: PipelineSchema = {
  page: { title: 'Test', tokens: { primaryColor: '#111', secondaryColor: '#fff' } },
  containers: [
    {
      id: 'c1',
      direction: 'row',
      width: 'full',
      styles: { sourceId: 'c1', gap: 8 },
      widgets: [
        { type: 'heading', content: 'Hello', imageId: null, styles: { sourceId: 'w1' } },
        { type: 'text', content: 'World', imageId: null, styles: { sourceId: 'w2' } }
      ],
      children: [
        {
          id: 'c2',
          direction: 'column',
          width: 'boxed',
          styles: { sourceId: 'c2', paddingTop: 10 },
          widgets: [],
          children: []
        }
      ]
    }
  ]
};

describe('ElementorCompiler', () => {
  it('gera containers com elType container e widgetType corretos', () => {
    const json = compiler.compile(schema);
    const elements = json.elements || [];
    expect(Array.isArray(elements)).toBe(true);
    expect(elements.length).toBeGreaterThan(0);
    const root = elements[0];
    expect(root.elType).toBe('container');
    expect(root.settings.flex_direction).toBe('row');
    expect(root.settings._element_id).toBeDefined();
    const widgetHeading = root.elements.find((e: any) => e.widgetType === 'heading');
    expect(widgetHeading).toBeTruthy();
    const childContainer = root.elements.find((e: any) => e.elType === 'container');
    expect(childContainer?.settings.flex_direction).toBe('column');
  });
});
