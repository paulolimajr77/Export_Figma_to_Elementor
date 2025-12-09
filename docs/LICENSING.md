# 🔑 Módulo de Licenciamento v1.2

## Visão Geral

O módulo de licenciamento do plugin **Figma → Elementor** controla o acesso às funcionalidades de conversão através de um sistema de chaves de licença com:

- Vinculação por conta Figma (figma_user_id)
- Limite de uso mensal de compilações
- Controle de sites/domínios
- Endpoints separados para validação (não consome) e compilação (consome uso)

---

## Novidades v1.2

- **Formatação de data por locale**: Datas exibidas conforme idioma do navegador (pt-BR: dd/mm/yyyy, en-US: mm/dd/yyyy)
- **Endpoints separados**:
  - `/license/validate` - Valida licença SEM consumir uso
  - `/usage/compile` - Registra compilação e consome 1 uso
- **Labels de planos amigáveis**: Mapeamento de slugs para textos legíveis
- **Parser de datas robusto**: Suporte a MySQL datetime, timestamp Unix e ISO

---

## Arquitetura

```
src/licensing/
├── index.ts              # Exports do módulo
├── LicenseConfig.ts      # Tipos, constantes, helpers (v1.2)
└── LicenseService.ts     # Lógica de negócio (v1.2)
```

---

## Endpoints

### 1. Validar Licença (Não consome uso)

```http
POST /wp-json/figtoel/v1/license/validate
```

**Uso**: Tela de configuração de licença, ao abrir o plugin.

### 2. Registrar Compilação (Consome 1 uso)

```http
POST /wp-json/figtoel/v1/usage/compile
```

**Uso**: Antes de cada compilação de layout.

### Payload (ambos)

```json
{
  "license_key": "FTEL-5GKGTD5HOEZS",
  "site_domain": "dev.pljr.com.br",
  "plugin_version": "1.2.0",
  "figma_user_id": "123456789012345678",
  "client_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Formatação de Datas

A formatação de datas agora usa `navigator.language` para detectar automaticamente o idioma do usuário:

| Locale | Formato | Exemplo |
|--------|---------|---------|
| pt-BR | dd/mm/yyyy | 31/12/2025 |
| en-US | mm/dd/yyyy | 12/31/2025 |
| de-DE | dd.mm.yyyy | 31.12.2025 |
| ja-JP | yyyy/mm/dd | 2025/12/31 |

### Formatos de Entrada Suportados

- **Unix timestamp (segundos)**: `1735689600`
- **Unix timestamp (milissegundos)**: `1735689600000`
- **MySQL datetime**: `"2025-12-31 23:59:59"`
- **ISO string**: `"2025-12-31T23:59:59Z"`
- **Timestamp como string**: `"1735689600"`

---

## Labels de Planos

| Slug | Label Amigável |
|------|----------------|
| `mensal` | Assinatura Mensal |
| `anual` | Assinatura Anual |
| `lifetime` | Licença Vitalícia |
| `trial` | Período de Teste |
| `free` | Plano Gratuito |
| (outro) | O próprio slug |

---

## Funções Principais

### `validateLicense(licenseKey, siteDomain, figmaUserId?)`

Valida licença **sem** consumir uso. Retorna status e informações de uso.

### `registerCompileUsage(figmaUserId?)`

Registra compilação e **consome 1 uso**. Chamada antes de cada compilação.

### `checkAndConsumeLicenseUsage(figmaUserId?)`

Alias para `registerCompileUsage` (compatibilidade).

### `validateAndSaveLicense(licenseKey, siteDomain, figmaUserId?)`

Alias para `validateLicense` (compatibilidade).

### `getPlanLabel(planSlug)`

Retorna label amigável para o slug do plano.

### `formatResetDate(resetsAt, userLocale?)`

Formata data de reset para exibição, usando locale do navegador.

### `maskLicenseKey(key)`

Mascara a chave de licença: `FTEL-5GKGTD5HOEZS` → `**********HOEZS`

---

## Estrutura de Armazenamento

### Chave: `figtoel_license_state`

```typescript
interface LicenseStorageConfig {
  licenseKey: string;
  siteDomain: string;
  clientId: string;          // UUID único
  lastUsage: {
    used: number;
    limit: number;
    warning: 'soft_limit' | null;
    resetsAt: string | number | null;
  } | null;
  lastValidationAt: string;  // ISO datetime
  planSlug: string | null;
  figmaUserIdBound: string;
  lastStatus: 'ok' | 'error' | 'limit_reached' | 'not_configured' | 'license_user_mismatch';
}
```

---

## Códigos de Erro

| Código | Mensagem |
|--------|----------|
| `license_not_found` | Chave de licença não encontrada |
| `license_inactive` | Licença não está ativa |
| `limit_sites_reached` | Limite de domínios atingido |
| `license_user_mismatch` | Licença vinculada a outra conta Figma |
| `network_error` | Servidor indisponível |

---

## Segurança

- ✅ Chave nunca aparece em logs (usa `maskLicenseKey`)
- ✅ Campo de entrada com `type="password"`
- ✅ Proteção contra cópia (oncopy, oncut, ondrag)
- ✅ Apenas HTTPS

---

## Critérios de Aceitação

- [x] Validar licença não consome uso
- [x] Compilar layout consome exatamente 1 uso
- [x] Datas formatadas conforme locale do usuário
- [x] Labels de planos amigáveis
- [x] Chave nunca aparece em logs
- [x] Suporte a figma_user_id para vínculo

---

## Changelog

### v1.2.0 (2025-12-08)

- [FEAT] Endpoints separados: `/license/validate` e `/usage/compile`
- [FEAT] Formatação de data por locale do navegador
- [FEAT] Mapeamento de plan_slug para labels amigáveis
- [FIX] Parser de datas robusto (MySQL, timestamp, ISO)

### v1.1.0 (2025-12-08)

- [FEAT] Vinculação por figma_user_id
- [FEAT] Geração de client_id único
- [FEAT] Tratamento de license_user_mismatch

### v1.0.0 (2025-12-08)

- Implementação inicial

---

**Desenvolvido por Paulo Lima Jr**  
© 2025 Figma to Elementor
