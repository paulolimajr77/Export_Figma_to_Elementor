export function installTrimPolyfill(): void {
    if (typeof String.prototype.trim === 'function') {
        return;
    }

    // eslint-disable-next-line no-extend-native
    Object.defineProperty(String.prototype, 'trim', {
        value: function trim() {
            return String(this).replace(/^\s+|\s+$/g, '');
        },
        configurable: true,
        writable: true
    });
}
