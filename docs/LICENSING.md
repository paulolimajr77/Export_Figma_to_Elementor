# 🔑 Módulo de Licenciamento v1.3

## Visão Geral

O módulo de licenciamento do plugin **Figma → Elementor** controla o acesso às funcionalidades de conversão através de um sistema de chaves de licença com:

- **Vinculação por conta Figma** (figma_user_id)
- **Vinculação por dispositivo** (device_id) - NOVO v1.3
- Limite de uso mensal de compilações
- Controle de sites/domínios
- Endpoints separados para validação, ativação e compilação

---

## Novidades v1.3

### Restrição 1 Usuário + 1 Máquina

Cada licença agora só pode ser utilizada por:
- **1 único usuário Figma** (figma_user_id)
- **Em 1 única máquina** (device_id)

### Novo Endpoint de Ativação

```
POST /figtoel/v1/license/activate
```

Vincula a licença ao usuário e dispositivo. Deve ser chamado na primeira ativação.

### Device ID

- Gerado automaticamente como UUID v4
- Persiste no `clientStorage` do Figma (`figtoel_device_id`)
- Único por máquina/instalação do Figma

---

## Arquitetura

```
src/licensing/
├── index.ts              # Exports do módulo
├── LicenseConfig.ts      # Tipos, constantes, helpers (v1.3)
└── LicenseService.ts     # Lógica de negócio (v1.3)
```

---

## Endpoints

### 1. Ativar Licença (Bind user + device)

```http
POST /wp-json/figtoel/v1/license/activate
```

**Uso**: Primeira ativação da licença no plugin.

**Payload**:
```json
{
  "license_key": "FTEL-5GKGTD5HOEZS",
  "figma_user_id": "123456789012345678",
  "device_id": "550e8400-e29b-41d4-a716-446655440000",
  "site_domain": "dev.pljr.com.br",
  "plugin_version": "1.3.0"
}
```

**Respostas**:

| Mode | Descrição |
|------|-----------|
| `bound_first_time` | Primeiro bind - user e device gravados |
| `already_bound` | Mesmo user + device - OK |
| `device_mismatch` | Mesmo user, device diferente - ERRO |
| `figma_mismatch` | User diferente - ERRO |

### 2. Validar Licença (Não consome uso)

```http
POST /wp-json/figtoel/v1/license/validate
```

**Uso**: Tela de configuração de licença, ao abrir o plugin.

### 3. Registrar Compilação (Consome 1 uso)

```http
POST /wp-json/figtoel/v1/usage/compile
```

**Uso**: Antes de cada compilação de layout.

---

## Fluxo de Ativação

```
┌─────────────────────────────────────────────────────────┐
│              Usuário insere license_key                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│    Plugin gera/carrega device_id do clientStorage       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│   POST /license/activate com figma_user_id + device_id  │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
   Primeiro bind    Já vinculado   Mismatch
   (grava IDs)      (OK)           (ERRO)
```

---

## Códigos de Erro

| Código | Mensagem | Descrição |
|--------|----------|-----------|
| `license_not_found` | Chave não encontrada | Chave inválida |
| `license_inactive` | Licença não ativa | Expirada/cancelada |
| `figma_mismatch` | Outra conta Figma | Licença vinculada a outro user |
| `device_mismatch` | Outro computador | Licença vinculada a outro device |
| `device_or_user_mismatch` | User ou device diferente | Validação falhou no compile |
| `network_error` | Servidor indisponível | Problema de conexão |

---

## Estrutura de Armazenamento

### Chave: `figtoel_license_state`

```typescript
interface LicenseStorageConfig {
  licenseKey: string;
  siteDomain: string;
  clientId: string;
  deviceId: string;              // NOVO v1.3
  lastUsage: UsageSnapshot | null;
  lastValidationAt: string;
  planSlug: string | null;
  figmaUserIdBound: string;
  deviceIdBound: string;         // NOVO v1.3
  lastStatus: 'ok' | 'error' | 'limit_reached' | 'not_configured' | 'license_user_mismatch' | 'device_mismatch';
}
```

### Chave: `figtoel_device_id`

UUID único gerado na primeira execução do plugin nesta máquina.

---

## Campos no CCT Licenças (WordPress)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `license_key` | string | Chave da licença |
| `status_licenca` | string | 'active', 'cancelled', etc |
| `figma_user_id_primary` | string | ID do usuário Figma vinculado |
| `figma_device_id_primary` | string | ID do dispositivo vinculado |
| `figma_user_ids_extra` | string | CSV de IDs extras (se necessário) |

---

## Segurança

- ✅ Chave nunca aparece em logs (usa `maskLicenseKey`)
- ✅ Device ID é UUID gerado localmente
- ✅ Apenas HTTPS
- ✅ IDs exibidos parcialmente em erros (-8 chars)

---

## Fluxo Típico do Usuário

1. **Primeira ativação**: Plugin gera device_id, chama `/activate`, grava IDs
2. **Aberturas seguintes**: Valida via `/validate` com device_id
3. **Cada compilação**: Consome uso via `/compile` com device_id
4. **Outra máquina**: Erro `device_mismatch` ao tentar usar

---

## Changelog

### v1.3.0 (2025-12-08)

- [FEAT] Restrição 1 usuário + 1 máquina por licença
- [FEAT] Novo endpoint `/license/activate`
- [FEAT] Geração e persistência de `device_id`
- [FEAT] Validação de device em todas as chamadas
- [FEAT] Novos erros: `device_mismatch`, `device_or_user_mismatch`

### v1.2.0 (2025-12-08)

- [FEAT] Endpoints separados: `/license/validate` e `/usage/compile`
- [FEAT] Formatação de data por locale do navegador
- [FEAT] Mapeamento de plan_slug para labels amigáveis

### v1.1.0 (2025-12-08)

- [FEAT] Vinculação por figma_user_id
- [FEAT] Geração de client_id único

### v1.0.0 (2025-12-08)

- Implementação inicial

---

**Desenvolvido por Paulo Lima Jr**  
© 2025 Figma to Elementor
