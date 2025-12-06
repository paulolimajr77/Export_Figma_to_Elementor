import { defineConfig } from 'vitest/config';

const markdownAsRawPlugin = () => ({
    name: 'md-as-raw',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
        if (id.endsWith('.md')) {
            return {
                code: `export default ${JSON.stringify(code)};`,
                map: null
            };
        }
        return null;
    }
});

export default defineConfig({
    plugins: [markdownAsRawPlugin()],
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.{spec,test}.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'dist/',
                '**/*.test.ts',
                '**/types/**',
                '**/test-setup.ts'
            ]
        }
    }
});
