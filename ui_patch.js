// Função copyWithFallback - ADICIONAR APÓS A FUNÇÃO addLog (linha ~967)
async function copyWithFallback(text, label = 'conteúdo') {
    if (!text) {
        addLog(`Nenhum ${label} para copiar.`, 'warn');
        return false;
    }
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            addLog(`✓ ${label} copiado!`, 'info');
            return true;
        }
    } catch (err) {
        console.warn('Clipboard API falhou:', err);
    }
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (success) {
            addLog(`✓ ${label} copiado!`, 'info');
            return true;
        }
    } catch (err) {
        addLog(`✗ Falha ao copiar. Use Ctrl+C.`, 'error');
    }
    return false;
}

// INSTRUÇÕES DE APLICAÇÃO:
// 1. Abra src/ui.html
// 2. Localize a função addLog (linha ~959-967)
// 3. APÓS o fechamento dessa função (linha 967), adicione a função copyWithFallback acima
// 4. Salve o arquivo
// 5. Execute: npm run build
