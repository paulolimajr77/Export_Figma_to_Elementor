# 1. Resumo Executivo: Modernização do Lint & Exportador

**Para:** Stakeholders, Product Managers e Liderança  
**Assunto:** Unificação da Inteligência do Plugin (Framework V2)

## O Problema Atual (Por que mudar?)
Nosso plugin hoje sofre de "personalidade dividida". A ferramenta que analisa o design (Linter) e a ferramenta que gera o código (Exportador) pensam de formas diferentes.
Isso cria frustração: o designer corrige os avisos que o plugin mostra, mas quando exporta para o Elementor, o resultado muitas vezes ignora essas correções. Além disso, o plugin "alucina" com frequência, dizendo que qualquer retângulo com texto é um Botão, o que faz os usuários ignorarem nossos avisos.

## A Solução: Framework V2
Estamos implementando um "Cérebro Único" (`WidgetEngine`). A mesma lógica que diagnostica o problema será usada para gerar o código final. Se o sistema disser "Isso é um Botão", ele será exportado como Botão, sem surpresas.

## O Que Muda para o Usuário?
1.  **Confiabilidade**: "What You See Is What You Get". O diagnóstico visual passa a ser uma promessa de exportação.
2.  **Menos Ruído**: Introduzimos "Consciência de Contexto". O plugin saberá que um menu no rodapé funciona diferente de um menu no topo, eliminando avisos inúteis.
3.  **Saúde do Arquivo**: Em vez de uma lista infinita de erros, o usuário verá um "Health Score" (Nota de 0 a 100), transformando a correção do layout em um processo gamificado e satisfatório.

## Retorno sobre Investimento (ROI)
Essa modernização é fundamental para reduzirmos o suporte técnico relacionado a "exportação quebrada" e aumentamos a retenção de usuários que hoje desistem por achar a ferramenta "bugada" ou inconsistente.

## Riscos e Mitigação
*   **Risco**: Alterar a lógica de exportação pode mudar levemente como sites antigos são gerados.
*   **Mitigação**: Faremos a mudança em fases. Primeiro lançamos o novo painel visual (V2.0). Só após validarmos que ele está acertando mais que o antigo, migramos o gerador de código (V2.5).
