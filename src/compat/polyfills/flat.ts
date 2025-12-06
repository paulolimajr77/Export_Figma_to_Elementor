export function installFlatPolyfill(): void {
    if (typeof Array.prototype.flat === 'function') {
        return;
    }

    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Array.prototype, 'flat', {
        value: function flat(depth?: number): unknown[] {
            const maxDepth = typeof depth === 'number' && depth > 0 ? depth : 1;
            const flatten = (arr: any[], currentDepth: number): any[] => {
                if (currentDepth > maxDepth) {
                    return arr.slice();
                }
                const result: any[] = [];
                for (const item of arr) {
                    if (Array.isArray(item)) {
                        result.push(...flatten(item, currentDepth + 1));
                    } else {
                        result.push(item);
                    }
                }
                return result;
            };
            return flatten(this as any[], 0);
        },
        configurable: true,
        writable: true
    });
}
