import type { SerializedNode } from '../../utils/serialization_utils';
import type { PipelineSchema, PipelineContainer, PipelineWidget } from '../../types/pipeline.schema';
import { analyzeTreeWithHeuristics, convertToFlexSchema } from './noai.parser';

const isSceneNode = (node: any): node is SceneNode => {
    return !!node && typeof node === 'object' && typeof (node as any).type === 'string' && typeof (node as any).name === 'string';
};

export interface WidgetEnforceDeps {
    getNodeById?: (id: string) => Promise<SceneNode | BaseNode | null> | SceneNode | BaseNode | null;
}

export interface HeuristicsService {
    analyzeTree(root: SerializedNode): SerializedNode;
    generateSchema(root: SerializedNode): PipelineSchema;
    enforceWidgetTypes(schema: PipelineSchema, deps?: WidgetEnforceDeps): Promise<PipelineSchema>;
}

export class DefaultHeuristicsService implements HeuristicsService {
    analyzeTree(root: SerializedNode): SerializedNode {
        return analyzeTreeWithHeuristics(root);
    }

    generateSchema(root: SerializedNode): PipelineSchema {
        const analyzed = this.analyzeTree(root);
        return convertToFlexSchema(analyzed);
    }

    async enforceWidgetTypes(schema: PipelineSchema, deps: WidgetEnforceDeps = {}): Promise<PipelineSchema> {
        const getNodeById = deps.getNodeById || ((id: string) => {
            try {
                return figma.getNodeById(id);
            } catch {
                return null;
            }
        });

        const visitContainer = async (container: PipelineContainer) => {
            for (const widget of container.widgets || []) {
                await this.fixWidget(widget, getNodeById);
            }
            for (const child of container.children || []) {
                await visitContainer(child);
            }
        };

        for (const container of schema.containers) {
            await visitContainer(container);
        }

        return schema;
    }

    private async fixWidget(widget: PipelineWidget, getNodeById: NonNullable<WidgetEnforceDeps['getNodeById']>) {
        if (widget.id) {
            try {
                const node = await getNodeById(widget.id);
                if (isSceneNode(node)) {
                    if (node.name.startsWith('w:image') && !node.name.startsWith('w:image-box') && widget.type !== 'image') {
                        widget.type = 'image';
                    }
                    if (node.name.startsWith('w:button') && widget.type !== 'button') {
                        widget.type = 'button';
                    }
                }
            } catch (err) {
                console.error(`[Heuristics] Error checking node ${widget.id}:`, err);
            }
        }

        if (widget.children && Array.isArray(widget.children)) {
            for (const child of widget.children) {
                if (!child.id) continue;
                try {
                    const childNode = await getNodeById(child.id);
                    if (isSceneNode(childNode) && (childNode.type === 'VECTOR' || childNode.name === 'Icon') && child.type !== 'icon') {
                        child.type = 'icon';
                    }
                } catch {
                    // ignore
                }
            }
        }
    }
}

export const heuristicsService = new DefaultHeuristicsService();

export async function enforceWidgetTypes(schema: PipelineSchema, deps?: WidgetEnforceDeps) {
    return heuristicsService.enforceWidgetTypes(schema, deps);
}

export { analyzeTreeWithHeuristics, convertToFlexSchema } from './noai.parser';
