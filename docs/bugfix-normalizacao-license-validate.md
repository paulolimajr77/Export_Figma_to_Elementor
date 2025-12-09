# 🐛 Bugfix: normalizacao-resposta-license-validate.md

## Problema Identificado

O plugin estava gerando o erro `Cannot read properties of undefined (reading 'status')` ao validar licenças porque o código TypeScript esperava uma resposta do endpoint `/license/validate` com um objeto `usage` aninhado, mas o endpoint real retorna apenas:

```json
{
  "status": "ok",
  "mode": "device_bound_now",
  "license_key": "**********AUWUE",
  "figma_user_id": "988809730121047013",
  "device_id": "a28a948d-3138-4e59-b565-2f67fcb897a0"
}
```

### Linha Problemática

Em `src/licensing/LicenseService.ts`, linha 284:

```typescript
if (successResponse.status === 'limit_reached' || successResponse.usage.status === 'limit_reached') {
  // ❌ successResponse.usage era undefined
```

E também nas linhas 291-294, 321-324, 335-336, 343 onde `successResponse.usage.used`, `successResponse.usage.limit`, etc eram acessados sem verificar se `usage` existia.

---

## Solução Implementada

### 1. Refatoração da função `validateLicense`

**Arquivo**: `src/licensing/LicenseService.ts`

**Mudanças**:

a) **Removida a lógica de `usage`**: Como o endpoint `/license/validate` NÃO retorna informações de uso mensal (isso vem do `/usage/compile`), toda a lógica que tentava acessar `successResponse.usage` foi removida.

b) **Parser defensivo baseado no `mode`**: O código agora interpreta a resposta real do endpoint:

```typescript
// Response OK - parse actual shape from /license/validate
const data = response as any;

// Determinar mensagem baseada no mode
let message = 'Licença validada com sucesso!';
if (data.mode === 'device_bound_now' || data.mode === 'bound_first_time') {
    message = 'Licença vinculada a este dispositivo com sucesso.';
} else if (data.mode === 'already_bound') {
    message = 'Licença já vinculada a este dispositivo.';
} else if (data.mode === 'allowed_extra') {
    message = 'Licença validada (usuário extra autorizado).';
}
```

c) **Configuração salva sem `usage`**: O objeto `LicenseStorageConfig` agora salva `lastUsage: null` quando vindo do `/validate`:

```typescript
const config: LicenseStorageConfig = {
    licenseKey: cleanKey,
    siteDomain: cleanDomain,
    clientId: clientId,
    deviceId: deviceId,
    lastUsage: null, // Usage info não vem do /validate
    lastValidationAt: new Date().toISOString(),
    planSlug: data.plan_slug || null,
    figmaUserIdBound: figmaUserId || '',
    deviceIdBound: deviceId,
    lastStatus: 'ok'
};
```

d) **Retorno com `LicenseCheckResult` limpo**: O resultado agora omite `usage` (em vez de definir como `undefined`, para respeitar `exactOptionalPropertyTypes: true`):

```typescript
const result: LicenseCheckResult = {
    allowed: true,
    status: 'ok',
    message,
    planSlug: data.plan_slug || null
};

// Add planLabel only if plan_slug exists
if (data.plan_slug) {
    result.planLabel = getPlanLabel(data.plan_slug);
}

return result;
```

### 2. Suporte a novos erros

Adicionado suporte para `device_mismatch` no `lastStatus`:

```typescript
const lastStatus = errorCode === 'license_user_mismatch'
    ? 'license_user_mismatch'
    : errorCode === 'device_mismatch'
    ? 'device_mismatch'
    : 'error';
```

---

## Correção de Erro HTTP 404

**Arquivo**: `src/licensing/LicenseService.ts` (função `callLicenseEndpoint`)

Melhorado o tratamento de erros HTTP para detectar quando a rota não existe:

```typescript
if (!response.ok) {
    // Se for erro de rota não encontrada (404)
    if (data.code === 'rest_no_route') {
        return {
            status: 'error',
            code: 'network_error',
            message: 'API de licenciamento não encontrada. Verifique se o plugin está atualizado no servidor.'
        } as LicenseErrorResponse;
    }

    // Outros erros
    return {
        status: 'error',
        code: 'network_error',
        message: data.message || `Erro no servidor (${response.status})`
    } as LicenseErrorResponse;
}
```

---

## Correção da UI (inputs travados)

**Arquivo**: `src/ui.html`

### Problema

Ao desconectar a licença ou em caso de erro, os campos `#license_key` e `#license_domain` ficavam permanentemente desabilitados.

### Solução

Criadas funções helpers:

```javascript
function setLicenseInputsEnabled(enabled) {
  const keyInput = document.getElementById('license_key');
  const domainInput = document.getElementById('license_domain');
  if (keyInput) keyInput.disabled = !enabled;
  if (domainInput) domainInput.disabled = !enabled;
}

function setLicenseLoading(isLoading) {
  const btnText = document.getElementById('license-btn-text');
  const spinner = document.getElementById('license-spinner');
  const validateBtn = document.getElementById('btn-license-validate');

  if (btnText) btnText.style.display = isLoading ? 'none' : 'inline';
  if (spinner) spinner.style.display = isLoading ? 'inline' : 'none';
  if (validateBtn) validateBtn.disabled = isLoading;
}
```

Refatorados todos os handlers de licença para **SEMPRE** chamar `setLicenseInputsEnabled(true)` após qualquer operação (sucesso ou erro):

- `license-validating`: Chama `setLicenseInputsEnabled(true)`
- `license-validate-result`: Chama `setLicenseInputsEnabled(true)` no início
- `license-info`: Chama `setLicenseInputsEnabled(true)` no início
- `license-cleared`: Chama `setLicenseInputsEnabled(true)` no início

### Parsing defensivo de `msg`

No handler `license-validate-result`, adicionado acesso seguro às propriedades:

```javascript
const success = msg && msg.success === true;
const status = (msg && msg.status) || 'error';
const message = (msg && msg.message) || (success ? 'Licença ativa.' : 'Erro na validação.');
```

Isso evita erros se `msg` vier com estrutura inesperada.

---

## Testes de Aceitação

### ✅ Cenário 1: Validação Bem-Sucedida

**Input**: Endpoint retorna `{status: 'ok', mode: 'device_bound_now', ...}`

**Output**:
- `validateLicense` retorna `{allowed: true, status: 'ok', message: 'Licença vinculada a este dispositivo com sucesso.'}`
- UI mostra badge "Ativa" com cor verde
- Inputs permanecem editáveis

**Console**: ❌ Nenhum erro de JavaScript

### ✅ Cenário 2: Endpoint 404 (não existe)

**Input**: Endpoint retorna `{code: 'rest_no_route', message: '...'}`

**Output**:
- `validateLicense` retorna `{allowed: false, status: 'license_error', message: 'API de licenciamento não encontrada...'}`
- UI mostra mensagem de erro
- Inputs permanecem editáveis

**Console**: ❌ Nenhum erro de JavaScript

### ✅ Cenário 3: Desconectar Licença

**Ação**: Usuário clica em "Desconectar"

**Output**:
- Campos limpos
- Badge volta para "Não configurada"
- Inputs **habilitados** (não travados)

---

## Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| `src/licensing/LicenseService.ts` | Refatorada `validateLicense` para não acessar `usage` |
| `src/licensing/LicenseService.ts` | Melhorado tratamento de erro HTTP em `callLicenseEndpoint` |
| `src/ui.html` | Adicionadas funções `setLicenseInputsEnabled` e `setLicenseLoading` |
| `src/ui.html` | Refatorados handlers `license-validating`, `license-validate-result`, `license-info`, `license-cleared` |

---

## Versão

**Licenciamento**: v1.3.0  
**Build**: Compilado com sucesso em 54ms  
**Data**: 2025-12-09

---

**Desenvolvido por Paulo Lima Jr**  
© 2025 Figma to Elementor
