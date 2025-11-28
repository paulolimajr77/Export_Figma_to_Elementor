import { PipelineSchema, PipelineContainer, PipelineWidget } from '../types/pipeline.schema';
import { ElementorJSON, ElementorElement } from '../types/elementor.types';

export function validatePipelineSchema(schema: any): asserts schema is PipelineSchema {
    if (!schema || typeof schema !== 'object') {
        throw new Error('Schema inválido: não é objeto.');
    }
    if (!schema.page || typeof schema.page !== 'object') {
        throw new Error('Schema inválido: campo page ausente.');
    }
    if (!Array.isArray(schema.containers)) {
        throw new Error('Schema inválido: containers deve ser array.');
    }
    schema.containers.forEach(validateContainer);
}

function validateContainer(container: PipelineContainer) {
    if (typeof container.id !== 'string') throw new Error('Container sem id.');
    if (container.direction !== 'row' && container.direction !== 'column') {
        throw new Error(`Container ${container.id} com direction inválido.`);
    }
    if (container.width !== 'full' && container.width !== 'boxed') {
        throw new Error(`Container ${container.id} com width inválido.`);
    }
    if (!Array.isArray(container.widgets) || !Array.isArray(container.children)) {
        throw new Error(`Container ${container.id} sem widgets/children array.`);
    }
    container.widgets.forEach(validateWidget);
    container.children.forEach(validateContainer);
}

function validateWidget(widget: PipelineWidget) {
    const allowed: PipelineWidget['type'][] = ['heading', 'text', 'button', 'image', 'icon', 'custom'];
    if (!allowed.includes(widget.type)) {
        throw new Error(`Widget com tipo inválido: ${widget.type}`);
    }
}

export function validateElementorJSON(json: any): asserts json is ElementorJSON {
    if (!json || typeof json !== 'object') throw new Error('Elementor JSON inválido: não é objeto.');
    if (!Array.isArray(json.elements)) throw new Error('Elementor JSON inválido: elements deve ser array.');
    json.elements.forEach(el => validateElement(el));
}

function validateElement(el: ElementorElement) {
    if (!el.id || !el.elType) throw new Error('Elemento Elementor sem id ou elType.');
    if (!Array.isArray(el.elements)) throw new Error(`Elemento ${el.id} sem elements array.`);
    if (!el.settings) throw new Error(`Elemento ${el.id} sem settings.`);
    if (el.elType !== 'container' && el.elType !== 'widget') throw new Error(`Elemento ${el.id} com elType inválido.`);
    el.elements.forEach(child => validateElement(child));
}

export interface CoverageReport {
    n_nodes_origem: number;
    n_widgets_schema: number;
    n_containers_schema: number;
    n_elements_elementor: number;
}

export function computeCoverage(serializedFlat: any[], schema: PipelineSchema, elementor: ElementorJSON): CoverageReport {
    const n_nodes_origem = serializedFlat.length;

    let n_widgets_schema = 0;
    let n_containers_schema = 0;
    const walkSchema = (c: PipelineContainer) => {
        n_containers_schema++;
        n_widgets_schema += c.widgets.length;
        c.children.forEach(walkSchema);
    };
    schema.containers.forEach(walkSchema);

    let n_elements_elementor = 0;
    const walkEl = (el: ElementorElement) => {
        n_elements_elementor++;
        el.elements.forEach(walkEl);
    };
    elementor.elements.forEach(walkEl);

    return { n_nodes_origem, n_widgets_schema, n_containers_schema, n_elements_elementor };
}
