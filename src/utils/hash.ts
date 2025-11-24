/**
 * Calcula o hash SHA-1 de um array de bytes
 * Usado para identificar imagens únicas e evitar uploads duplicados
 * @param bytes Array de bytes da imagem
 * @returns Hash SHA-1 em formato hexadecimal
 */
export async function computeHash(bytes: Uint8Array): Promise<string> {
    const chrsz = 8;

    function rol(num: number, cnt: number) {
        return (num << cnt) | (num >>> (32 - cnt));
    }

    function safe_add(x: number, y: number) {
        const lsw = (x & 0xFFFF) + (y & 0xFFFF);
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    function sha1_ft(t: number, b: number, c: number, d: number) {
        if (t < 20) return (b & c) | ((~b) & d);
        if (t < 40) return b ^ c ^ d;
        if (t < 60) return (b & c) | (b & d) | (c & d);
        return b ^ c ^ d;
    }

    function sha1_kt(t: number) {
        return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 : (t < 60) ? -1894007588 : -899497514;
    }

    function core_sha1(x: number[], len: number) {
        x[len >> 5] |= 0x80 << (24 - len % 32);
        x[((len + 64 >> 9) << 4) + 15] = len;
        const w = Array(80);
        let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, e = -1009589776;

        for (let i = 0; i < x.length; i += 16) {
            const olda = a, oldb = b, oldc = c, oldd = d, olde = e;
            for (let j = 0; j < 80; j++) {
                if (j < 16) w[j] = x[i + j];
                else w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
                const t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)), safe_add(safe_add(e, w[j]), sha1_kt(j)));
                e = d; d = c; c = rol(b, 30); b = a; a = t;
            }
            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
            e = safe_add(e, olde);
        }
        return [a, b, c, d, e];
    }

    function binb2hex(binarray: number[]) {
        const hex_tab = "0123456789abcdef";
        let str = "";
        for (let i = 0; i < binarray.length * 4; i++) {
            str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
                hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
        }
        return str;
    }

    function bytesToWords(bytes: Uint8Array) {
        const words: number[] = [];
        for (let i = 0; i < bytes.length; i++) {
            words[i >>> 2] |= (bytes[i] & 0xFF) << (24 - (i % 4) * 8);
        }
        return words;
    }

    return binb2hex(core_sha1(bytesToWords(bytes), bytes.length * 8));
}
