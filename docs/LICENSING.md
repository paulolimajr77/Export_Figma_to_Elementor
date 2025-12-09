# 🔑 Módulo de Licenciamento v1.0

## Visão Geral

O módulo de licenciamento do plugin **Figma → Elementor** controla o acesso às funcionalidades de conversão através de um sistema de chaves de licença com limite de uso mensal.

---

## Arquitetura

```
src/licensing/
├── index.ts              # Exports do módulo
├── LicenseConfig.ts      # Tipos, interfaces e constantes
└── LicenseService.ts     # Lógica de negócio (HTTP + Storage)
```

---

## Fluxo de Funcionamento

### 1. Primeira Execução

Ao abrir o plugin pela primeira vez:

1. O sistema verifica se existe configuração de licença salva em `figma.clientStorage`
2. Se não existir, a aba "Licença" indica que a configuração é necessária
3. O usuário deve inserir sua chave de licença (formato `FTEL-XXXXX`) e o domínio do site WordPress

### 2. Validação de Licença

Ao clicar em "Validar e Salvar":

1. Os dados são enviados ao endpoint:
   ```
   POST https://figmatoelementor.pljr.com.br/wp-json/figtoel/v1/usage/compile
   ```

2. O backend valida:
   - Se a chave existe
   - Se a licença está ativa
   - Se o limite de sites não foi excedido
   - Se há saldo de compilações no mês

3. Em caso de sucesso, a configuração é salva em `clientStorage`

### 3. Controle de Uso (Antes da Compilação)

Antes de cada compilação, o sistema:

1. Carrega a configuração salva
2. Faz uma chamada ao backend para verificar e registrar o uso
3. Se permitido, incrementa o contador de uso e libera a compilação
4. Se bloqueado (limite atingido, licença inválida, etc.), exibe mensagem e bloqueia

---

## Códigos de Erro

| Código | Mensagem Amigável |
|--------|-------------------|
| `license_not_found` | Não encontramos essa chave de licença |
| `license_inactive` | Licença não está ativa |
| `limit_sites_reached` | Limite máximo de sites atingido |
| `site_register_error` | Erro ao registrar domínio |
| `usage_error` | Erro ao registrar uso |
| `missing_params` | Dados incompletos |
| `network_error` | Erro de conexão |

---

## Estrutura de Armazenamento

### Chave: `figtoel_license_config_v1`

```typescript
interface LicenseStorageConfig {
  licenseKey: string;        // FTEL-XXXXXX
  siteDomain: string;        // meusite.com.br
  pluginVersion: string;     // 1.0.0
  lastStatus: 'ok' | 'error' | 'limit_reached' | 'not_configured';
  planSlug: string | null;   // mensal, anual, etc.
  usageSnapshot: {
    used: number;            // Compilações usadas
    limit: number;           // Limite do plano
    warning: 'soft_limit' | null;
    resetsAt: string | null; // Data de reset
  } | null;
  lastValidatedAt: string;   // ISO datetime
}
```

---

## UI de Licenciamento

### Aba "Licença"

A interface contém:

1. **Formulário de Configuração**
   - Campo para chave de licença
   - Campo para domínio do site
   - Botão "Validar e Salvar"
   - Botão "Desconectar" (quando configurado)

2. **Painel de Status**
   - Nome do plano
   - Status da licença
   - Uso mensal (usado/limite)
   - Data de renovação
   - Barra de progresso de uso

3. **Link para Compra**
   - Card com link para `https://figmatoelementor.pljr.com.br/planos/`

---

## Integração com code.ts

### Import

```typescript
import {
    checkAndConsumeLicenseUsage,
    validateAndSaveLicense,
    clearLicenseConfig,
    getLicenseDisplayInfo,
    LICENSE_PLANS_URL
} from './licensing';
```

### Verificação Antes da Compilação

```typescript
case 'generate-json':
    const licenseCheck = await checkAndConsumeLicenseUsage();
    
    if (!licenseCheck.allowed) {
        // Bloquear compilação
        figma.ui.postMessage({ 
            type: 'license-blocked', 
            message: licenseCheck.message 
        });
        break;
    }
    
    // Prosseguir com compilação...
```

---

## Mensagens UI ↔ Backend

### Enviadas pela UI

| Tipo | Payload | Descrição |
|------|---------|-----------|
| `license-validate` | `{ licenseKey, siteDomain }` | Validar e salvar licença |
| `license-load` | - | Carregar info da licença salva |
| `license-clear` | - | Desconectar licença |

### Recebidas pela UI

| Tipo | Payload | Descrição |
|------|---------|-----------|
| `license-validating` | - | Indicar loading |
| `license-validate-result` | `{ success, message, usage, planSlug }` | Resultado da validação |
| `license-info` | `{ configured, licenseKey, usage, ... }` | Info carregada |
| `license-cleared` | `{ success }` | Resultado da desconexão |
| `license-blocked` | `{ message, usage }` | Compilação bloqueada |
| `license-usage-updated` | `{ usage }` | Atualização de uso |

---

## Critérios de Aceitação

- [x] AC1 – Tela de licença exibida obrigatoriamente se não configurada
- [x] AC2 – Validação salva em clientStorage com sucesso
- [x] AC3 – Link para planos abre no navegador
- [x] AC4 – Compilação válida incrementa uso e prossegue
- [x] AC5 – Limite atingido exibe mensagem clara e bloqueia
- [x] AC6 – Licença inválida bloqueia e orienta usuário
- [x] AC7 – Erro de rede tratado sem quebrar o plugin

---

## Changelog

### v1.0.0 (2025-12-08)

- Implementação inicial do módulo de licenciamento
- Integração com endpoint WordPress
- UI de configuração de licença
- Verificação pré-compilação
- Persistência em clientStorage
- Tratamento de erros amigável

---

**Desenvolvido por Paulo Lima Jr**  
© 2025 Figma to Elementor
