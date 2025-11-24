// ==================== FUNÇÃO DE NAVEGAÇÃO DE ABAS ====================
function openTab(tabName) {
    const contents = document.querySelectorAll('.content');
    contents.forEach(c => c.classList.remove('active'));
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(b => b.classList.remove('active'));
    const selectedTab = document.getElementById('tab-' + tabName);
    if (selectedTab) selectedTab.classList.add('active');
    const selectedButton = event?.target;
    if (selectedButton) selectedButton.classList.add('active');
}

// ==================== EVENT LISTENERS GEMINI ====================
document.getElementById('btn-save-gemini-key').addEventListener('click', () => {
    const key = document.getElementById('gemini-api-key').value.trim();
    if (!key) {
        alert('⚠️ Digite uma API Key válida');
        return;
    }
    parent.postMessage({ pluginMessage: { type: 'save-gemini-key', key } }, '*');
});

document.getElementById('btn-test-gemini').addEventListener('click', () => {
    parent.postMessage({ pluginMessage: { type: 'test-gemini-connection' } }, '*');
});

document.getElementById('btn-analyze-gemini').addEventListener('click', () => {
    document.getElementById('gemini-results').style.display = 'none';
    parent.postMessage({ pluginMessage: { type: 'analyze-with-gemini' } }, '*');
});

// ==================== HANDLERS GEMINI NO WINDOW.ONMESSAGE ====================
const originalOnMessage = window.onmessage;
window.onmessage = (event) => {
    if (originalOnMessage) originalOnMessage(event);
    const msg = event.data.pluginMessage;
    if (!msg) return;

    if (msg.type === 'gemini-connection-result') {
        if (msg.success) {
            alert('✅ Conexão OK! API Key válida.');
        } else {
            alert('❌ Falha na conexão. Verifique a API Key.');
        }
    }

    if (msg.type === 'gemini-creation-complete') {
        const resultsDiv = document.getElementById('gemini-results');
        const improvementsDiv = document.getElementById('gemini-improvements');
        resultsDiv.style.display = 'block';
        improvementsDiv.innerHTML = `
            <strong>Frame Original:</strong> ${msg.data.originalName}<br>
            <strong>Novo Frame:</strong> ${msg.data.newName}<br><br>
            <strong>Melhorias:</strong><br>
            ${msg.data.improvements.map(imp => `• ${imp}`).join('<br>')}
        `;
    }

    if (msg.type === 'gemini-error') {
        alert('❌ Erro: ' + msg.error);
    }
};
