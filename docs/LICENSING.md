# 🔑 Módulo de Licenciamento v1.1

## Visão Geral

O módulo de licenciamento do plugin **Figma → Elementor** controla o acesso às funcionalidades de conversão através de um sistema de chaves de licença vinculadas a uma conta Figma específica, com limite de uso mensal e controle de sites.

---

## Novidades v1.1

- **Vinculação por Conta Figma**: Cada licença é vinculada ao primeiro `figma_user_id` que a ativar
- **Client ID**: UUID único por instalação para rastreamento
- **Erro de Mismatch**: Tratamento específico quando outra conta Figma tenta usar a mesma licença
- **Logs Seguros**: A chave de licença nunca aparece completa em logs
- **Datas MySQL**: Suporte completo a datetime do MySQL (YYYY-MM-DD HH:MM:SS)

---

## Arquitetura

```
src/licensing/
├── index.ts              # Exports do módulo
├── LicenseConfig.ts      # Tipos, interfaces, constantes, helpers
└── LicenseService.ts     # Lógica de negócio (HTTP + Storage)
```

---

## Fluxo de Funcionamento

### 1. Primeira Ativação

1. Usuário insere chave de licença e domínio
2. Plugin envia ao backend:
   - `license_key`: Chave de licença
   - `site_domain`: Domínio do WordPress
   - `figma_user_id`: ID da conta Figma (de `figma.currentUser.id`)
   - `client_id`: UUID único desta instalação
   - `plugin_version`: Versão do plugin
3. Backend grava `figma_user_id_primary` e permite uso
4. Plugin salva configuração em `clientStorage`

### 2. Uso Normal (Mesmo Usuário)

1. Antes de cada compilação, plugin chama `checkAndConsumeLicenseUsage(figmaUserId)`
2. Backend verifica se `figma_user_id` corresponde ao `figma_user_id_primary`
3. Se corresponder → incrementa uso e permite
4. Se diferir → retorna erro `license_user_mismatch`

### 3. Tentativa com Outra Conta Figma

1. Plugin envia `figma_user_id` diferente do original
2. Backend retorna: `{ status: "error", code: "license_user_mismatch" }`
3. Plugin exibe: "Esta chave já está vinculada a outra conta Figma"
4. Usuário precisa usar a conta original ou comprar nova licença

---

## Payload da Requisição

```json
{
  "license_key": "FTEL-5GKGTD5HOEZS",
  "site_domain": "dev.pljr.com.br",
  "plugin_version": "1.1.0",
  "figma_user_id": "123456789012345678",
  "client_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `license_not_found` | Chave não existe |
| `license_inactive` | Licença cancelada/expirada/pendente |
| `limit_sites_reached` | Limite de sites atingido |
| `license_user_mismatch` | **NOVO v1.1**: Licença vinculada a outra conta Figma |
| `figma_user_required` | **NOVO v1.1**: figma_user_id não fornecido |
| `site_register_error` | Falha ao registrar domínio |
| `usage_error` | Falha ao registrar uso |
| `missing_params` | Dados incompletos |
| `network_error` | Falha de conexão |

---

## Mensagens de Erro (PT-BR)

| Código | Mensagem Amigável |
|--------|-------------------|
| `license_user_mismatch` | Esta chave já está vinculada a outra conta Figma. Use a conta original ou adquira uma nova licença. |
| `figma_user_required` | Não foi possível identificar sua conta Figma. Recarregue o plugin e tente novamente. |
| `network_error` | Servidor temporariamente indisponível. Verifique sua conexão e tente novamente. |

---

## Estrutura de Armazenamento

### Chave: `figtoel_license_config_v1`

```typescript
interface LicenseStorageConfig {
  licenseKey: string;           // FTEL-XXXXXX
  siteDomain: string;           // meusite.com.br
  pluginVersion: string;        // 1.1.0
  figmaUserIdBound: string;     // ID do usuário Figma vinculado ← NOVO
  clientId: string;             // UUID único desta instalação ← NOVO
  lastStatus: 'ok' | 'error' | 'limit_reached' | 'not_configured' | 'license_user_mismatch';
  planSlug: string | null;
  usageSnapshot: {
    used: number;
    limit: number;
    warning: 'soft_limit' | null;
    resetsAt: string | null;    // MySQL datetime ou ISO string
  } | null;
  lastValidatedAt: string;      // ISO datetime
}
```

### Chave: `figtoel_client_id_v1`

UUID único gerado na primeira execução e persistido independentemente.

---

## Segurança

### Mascaramento de Chave

```typescript
// FTEL-5GKGTD5HOEZS → FTEL-*****HOEZS
function maskLicenseKey(key: string): string
```

### Logs Seguros

- ❌ NUNCA: `console.log('Key:', licenseKey)`
- ✅ CORRETO: `console.log('Key:', maskLicenseKey(licenseKey))`

### Proteção no Campo de Entrada

- `type="password"` no input
- `oncopy="return false"`
- `user-select: none`
- Menu de contexto desabilitado

---

## Formatação de Datas

O módulo suporta múltiplos formatos de data do backend:

```typescript
formatResetDate(resetsAt):
  - Unix timestamp (número): 1735689600 → "01/01/2025"
  - MySQL datetime: "2025-01-01 00:00:00" → "01/01/2025"
  - ISO string: "2025-01-01T00:00:00Z" → "01/01/2025"
```

---

## Estados da UI

| Estado | Badge | Cor |
|--------|-------|-----|
| Ativa | "Ativa" | Verde |
| Limite Atingido | "Limite Atingido" | Amarelo |
| Conta Diferente | "Conta Diferente" | Vermelho |
| Inválida | "Inválida" | Vermelho |
| Não configurada | "Não configurada" | Cinza |

---

## Critérios de Aceitação

- [x] AC1 – Primeira ativação grava figma_user_id_primary no backend
- [x] AC2 – Mesma licença com mesma conta funciona normalmente
- [x] AC3 – Mesma licença com outra conta retorna `license_user_mismatch`
- [x] AC4 – UI mostra estado, uso e link para /planos/
- [x] AC5 – Nenhuma license_key completa aparece em logs
- [x] AC6 – Compilação bloqueada em caso de erro/limite/mismatch

---

## Changelog

### v1.1.0 (2025-12-08)

- [FEAT] Vinculação de licença por `figma_user_id`
- [FEAT] Geração e persistência de `client_id` único
- [FEAT] Tratamento de erro `license_user_mismatch`
- [FEAT] Suporte a datas MySQL datetime
- [SEC] Mascaramento de chave em todos os logs
- [SEC] Campo de chave com `type="password"` e proteção contra cópia

### v1.0.0 (2025-12-08)

- Implementação inicial do módulo de licenciamento
- Integração com endpoint WordPress
- UI de configuração de licença
- Verificação pré-compilação
- Persistência em clientStorage

---

**Desenvolvido por Paulo Lima Jr**  
© 2025 Figma to Elementor
