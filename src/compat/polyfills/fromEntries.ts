export function installFromEntriesPolyfill(): void {
    if (typeof Object.fromEntries === 'function') {
        return;
    }

    Object.fromEntries = function fromEntries(entries: Iterable<[PropertyKey, any]>): Record<PropertyKey, any> {
        const obj: Record<PropertyKey, any> = {};
        if (!entries) {
            return obj;
        }
        for (const pair of entries) {
            if (!pair || pair.length < 2) continue;
            const [key, value] = pair;
            obj[key] = value;
        }
        return obj;
    };
}
