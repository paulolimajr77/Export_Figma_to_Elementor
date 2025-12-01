import os

file_path = r'c:\Projetos Gravity\Export_Figma_to_Elementor\src\ui.html.bak'
output_path = r'c:\Projetos Gravity\Export_Figma_to_Elementor\src\ui.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "async function uploadImage(msg) {"
end_marker = "window.onmessage ="

start_index = content.find(start_marker)
end_index = content.find(end_marker)

if start_index != -1 and end_index != -1:
    # We need to include the start_marker in the replacement, but end_marker should be preserved (or we insert before it)
    # The new code should end with a newline before window.onmessage
    
    pre_content = content[:start_index]
    post_content = content[end_index:]
    
    new_code = """      async function convertToWebP(uint8Array, originalMime) {
        const blob = new Blob([new Uint8Array(uint8Array)], { type: originalMime });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        return new Promise(resolve => {
          canvas.toBlob(blob => {
            URL.revokeObjectURL(url);
            resolve(blob);
          }, 'image/webp', 0.85);
        });
      }

      async function uploadImage(msg) {
        const { id, name, mimeType, data, needsConversion } = msg;
        const url = (fields.wp_url.value || '').replace(/\/$/, '');
        const user = fields.wp_user.value;
        const token = fields.wp_token.value;

        if (!url || !user || !token) {
          send('upload-image-response', { id, success: false, error: 'Credenciais WP ausentes na UI' });
          return;
        }

        try {
          let blob;
          addLog('[UI] Uploading image: ' + name + ' needsConversion: ' + needsConversion, 'info');
          if (needsConversion) {
            addLog('[UI] Converting to WebP...', 'info');
            blob = await convertToWebP(data, mimeType);
            addLog('[UI] Converted blob type: ' + blob.type + ' size: ' + blob.size, 'info');
          } else {
            blob = new Blob([new Uint8Array(data)], { type: mimeType });
            addLog('[UI] Using original blob type: ' + blob.type, 'info');
          }

          const formData = new FormData();
          formData.append('file', blob, name);
          formData.append('title', name.split('.')[0]);
          formData.append('caption', 'Exported via FigToEL');

          const auth = btoa(`${user}:${token}`);
          const resp = await fetch(`${url}/wp-json/wp/v2/media`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`
            },
            body: formData
          });

          if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`HTTP ${resp.status}: ${errText}`);
          }

          const json = await resp.json();
          send('upload-image-response', { id, success: true, url: json.source_url, wpId: json.id });

        } catch (e) {
          send('upload-image-response', { id, success: false, error: e.message });
        }
      }

      """
    
    new_content = pre_content + new_code + post_content
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated ui.html using markers")

else:
    print("Could not find markers in ui.html.bak")
    print(f"Start found: {start_index}")
    print(f"End found: {end_index}")
