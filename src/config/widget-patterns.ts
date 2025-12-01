/**
 * Widget Structure Patterns for Generic Analysis
 * 
 * Defines how to extract content and styles from each widget type's internal structure.
 */

export interface WidgetStructurePattern {
    widgetType: string;
    expectedChildren: {
        text?: { required: boolean; extractAs: 'content' | 'title' | 'description' };
        icon?: { required: boolean; extractAs: 'imageId' | 'selected_icon' };
        image?: { required: boolean; extractAs: 'imageId' | 'image_url' };
    };
    styleExtractors: {
        fromContainer?: boolean;  // Extract padding, background, border from container
        fromText?: boolean;       // Extract typography, color from text child
        fromIcon?: boolean;       // Extract icon properties
    };
}

/**
 * Pattern definitions for common Elementor widgets
 */
export const WIDGET_PATTERNS: Record<string, WidgetStructurePattern> = {
    // Button widget
    'button': {
        widgetType: 'button',
        expectedChildren: {
            text: { required: true, extractAs: 'content' },
            icon: { required: false, extractAs: 'imageId' }
        },
        styleExtractors: {
            fromContainer: true,
            fromText: true
        }
    },

    // Icon Box widget
    'icon-box': {
        widgetType: 'icon-box',
        expectedChildren: {
            text: { required: true, extractAs: 'title' },
            icon: { required: true, extractAs: 'imageId' }
        },
        styleExtractors: {
            fromContainer: true,
            fromText: true
        }
    },

    // Image Box widget
    'image-box': {
        widgetType: 'image-box',
        expectedChildren: {
            text: { required: true, extractAs: 'title' },
            image: { required: true, extractAs: 'imageId' }
        },
        styleExtractors: {
            fromContainer: true,
            fromText: true
        }
    },

    // Heading widget (simple text)
    'heading': {
        widgetType: 'heading',
        expectedChildren: {
            text: { required: true, extractAs: 'content' }
        },
        styleExtractors: {
            fromText: true
        }
    },

    // Text Editor widget
    'text-editor': {
        widgetType: 'text-editor',
        expectedChildren: {
            text: { required: true, extractAs: 'content' }
        },
        styleExtractors: {
            fromText: true
        }
    },

    // Image widget
    'image': {
        widgetType: 'image',
        expectedChildren: {
            image: { required: true, extractAs: 'imageId' }
        },
        styleExtractors: {
            fromContainer: true
        }
    },

    // Icon widget
    'icon': {
        widgetType: 'icon',
        expectedChildren: {
            icon: { required: true, extractAs: 'imageId' }
        },
        styleExtractors: {
            fromContainer: true
        }
    },

    // Divider widget
    'divider': {
        widgetType: 'divider',
        expectedChildren: {},
        styleExtractors: {
            fromContainer: true
        }
    },

    // Spacer widget
    'spacer': {
        widgetType: 'spacer',
        expectedChildren: {},
        styleExtractors: {
            fromContainer: true
        }
    }
};
