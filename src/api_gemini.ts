namespace Gemini {
    export async function saveKey(key: string): Promise<void> {
        await figma.clientStorage.setAsync('gemini_api_key', key);
    }

    export async function getKey(): Promise<string | undefined> {
        return await figma.clientStorage.getAsync('gemini_api_key');
    }
}
