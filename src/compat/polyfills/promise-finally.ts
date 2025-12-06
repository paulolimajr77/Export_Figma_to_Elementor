export function installPromiseFinallyPolyfill(): void {
    if (typeof Promise.prototype.finally === 'function') {
        return;
    }

    // eslint-disable-next-line no-extend-native
    Promise.prototype.finally = function finallyPolyfill(onFinally?: () => void) {
        const handler = typeof onFinally === 'function' ? onFinally : () => undefined;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const promise = this;
        return promise.then(
            value => Promise.resolve(handler()).then(() => value),
            reason => Promise.resolve(handler()).then(() => {
                throw reason;
            })
        );
    };
}
