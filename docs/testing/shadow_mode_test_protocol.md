# Shadow Mode V2 — Protocolo de Testes

**Versão:** 2.0.1
**Status:** Em Execução (Calibrado)
**Data:** 06/12/2025

---

## 1. Objetivo

Executar testes controlados do Lint Engine V2 em Shadow Mode, capturar divergências entre V1 e V2 e produzir logs estruturados para análise e calibração das heurísticas.

## 2. Pré-requisitos

- [x] `SHADOW_MODE = true` em `src/code.ts`
- [x] Plugin compilado (`npm run build`)
- [x] Heurísticas calibradas (v2.0.1)
- [ ] Arquivo Figma com frames de teste variados

## 3. Thresholds Calibrados (v2.0.1)

| Widget | Min. Confidence | Fallback |
|:-------|:----------------|:---------|
| button | 0.70 | container |
| heading | 0.75 | text-editor |
| text-editor | 0.60 | container |
| image-box | 0.65 | container |
| image | 0.50 | container |
| container | 0.30 | (default) |

### Penalidades Aplicadas

| Condição | Penalidade | Afeta |
|:---------|:-----------|:------|
| childCount > 2 | -0.40 | button |
| height > 120px | -0.40 | button |
| hasNestedFrames | -0.30 | button |
| area > 150000 | -0.35 | button |
| textLength > 150 | -0.50 | heading |
| fontSize <= 16 | -0.40 | heading |
| textCount > 4 | -0.50 | image-box |
```
[SHADOW-V2] Node 44f2
V1: container
V2: w:button 0.82
```

### Passo 4: Documentar Divergências
Copiar logs divergentes para análise.

---

## 4. Frames a Testar

| Tipo | Exemplo | Prioridade |
|:-----|:--------|:-----------|
| Hero Section | Texto grande + CTA | Alta |
| Cards | Serviços, Preços, Features | Alta |
| Menus | Header, Footer, Nav | Alta |
| Listas | Icon lists, Grids | Média |
| Imagens | Backgrounds, Galleries | Média |
| Layouts Mistos | Com/sem Auto Layout | Baixa |

---

## 5. Classificação de Divergências

| Severidade | Descrição | Exemplo |
|:-----------|:----------|:--------|
| 🔴 **Critical** | V2 detecta errado com score alto (>0.75) | V1: container → V2: button (0.83) |
| 🟠 **High** | V2 subclassifica (menos específico) | V1: image-box → V2: container |
| 🟡 **Medium** | V2 superclassifica | V1: container → V2: image-box |
| 🟢 **Low** | V2 acerta mas com baixa confiança | V1: button → V2: button (0.32) |

---

## 6. Template de Registro

```markdown
### Divergência #X
- **Node ID:** 
- **V1 Result:** 
- **V2 Result:** 
- **V2 Score:** 
- **Severidade:** 
- **Observação:** 
```

---

## 7. Critério de Aprovação

> **Próxima fase (Nova UI)** só será iniciada quando **90% das divergências Critical/High** forem resolvidas.

---

## 8. Divergências Capturadas

*(Preencher durante os testes)*

### Divergência #1
- **Node ID:** 
- **V1 Result:** 
- **V2 Result:** 
- **V2 Score:** 
- **Severidade:** 
- **Observação:** 
