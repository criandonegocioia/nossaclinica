# ADR-003: Workflow Multi-LLM para Otimização de Tokens
**Status**: ACCEPTED  
**Data**: 2026-05-07  
**Contexto**: Processo de desenvolvimento com Antigravity

---

## Contexto

O uso de modelos premium (Claude Sonnet) para analisar imagens de interface custa
significativamente mais tokens do que o necessário. Uma imagem de screenshot processa
~800–1500 tokens de input, enquanto uma descrição textual equivalente usa ~200–400 tokens.

## Decisão

Adotar workflow de **dois estágios com modelos diferentes**:

### Fase 1 — Análise Visual (Modelo Leve)
Use **Gemini 2.0 Flash** ou **GPT-4o mini** para:
- Descrever screenshots de UI
- Identificar componentes e layout
- Gerar prompt estruturado para implementação

**Prompt padrão para Fase 1:**
```
Descreva detalhadamente esta interface para um desenvolvedor Next.js implementar:
- Quais componentes existem e onde estão posicionados
- Que ações o usuário pode realizar
- Estilos visuais relevantes (cores, espaçamentos, hierarquia)
- O que precisa ser implementado em código
```

### Fase 2 — Implementação (Claude Sonnet)
Recebe a **descrição textual** gerada na Fase 1 + regras do AGENTS.md.
Nunca recebe a imagem diretamente.

## Alternativas Rejeitadas

| Alternativa | Motivo da Rejeição |
|---|---|
| Enviar imagem direto ao Claude | Custo ~3-5x maior de tokens |
| Descrever manualmente | Tempo do desenvolvedor > custo do LLM leve |
| Não usar imagens | Perda de precisão na especificação de UI |

## Consequências

- ✅ ~60-75% de economia de tokens em tarefas com imagens
- ✅ Descrição textual vira artefato reutilizável (pode virar spec)
- ✅ Clareza maior: texto obriga pensar no que realmente importa
- ⚠️ Step extra de copiar/colar entre ferramentas

## Economia Estimada

| Cenário | Tokens Sem Otimização | Tokens Com Otimização |
|---|---|---|
| 1 screenshot de UI | ~2.000 | ~500 |
| Sprint com 10 telas | ~20.000 | ~5.000 |
| Mês de desenvolvimento | ~200.000 | ~50.000 |
