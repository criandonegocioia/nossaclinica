# ADR-006: Sistema de Design Apple HIG

**Status:** ✅ Aceito  
**Data:** 2026-05-07  
**Autor:** Antigravity Agent  
**Contexto:** Padronização visual do sistema clínico

---

## Decisão

Toda nova interface do sistema OdontoFace DEVE seguir o padrão visual **Apple Human Interface Guidelines (HIG)**, implementado exclusivamente via CSS tokens no arquivo `globals.css`.

## Princípios Obrigatórios

### 1. Cores Desaturadas
- Paleta primária: Teal desaturado (`#2E8E97` base)
- Grays: Apple warm grays (`#F5F5F7`, `#E8E8ED`, `#D2D2D7`, `#8E8E93`, `#6E6E73`, `#48484A`, `#1C1C1E`)
- Feedback: Apple system colors (`#34C759` success, `#FF9F0A` warning, `#FF3B30` error, `#007AFF` info)
- **PROIBIDO**: Cores saturadas puras (ex: `#FF0000`, `#00FF00`, `#0000FF`)

### 2. Sombras Multicamada (Signature Look)
```css
/* Apple card shadow — PADRÃO para cards */
--shadow-card: 0 0.5px 1px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04);
--shadow-card-hover: 0 2px 4px rgba(0,0,0,0.03), 0 4px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);
```
- Sempre 2-3 camadas com opacidades muito baixas (0.02-0.06)
- **PROIBIDO**: Sombras single-layer com opacidade > 0.1

### 3. Cards Sem Borda
```css
.card {
  border: none;
  border-radius: var(--radius-2xl); /* 1.5rem */
  box-shadow: var(--shadow-card);
}
```
- Cards usam **elevação pura** (shadow-card), nunca `border: 1px solid`
- Border-radius generoso: `1.5rem` (24px) para cards, `0.875rem` (14px) para inputs

### 4. Botões Flat
```css
.btn-primary {
  background: var(--primary-500); /* cor sólida, SEM gradient */
  box-shadow: none;
}
```
- **PROIBIDO**: `linear-gradient` em botões
- **PROIBIDO**: `box-shadow` decorativo em botões (shadow-primary)
- Hover: `scale(1.02)` + `brightness(1.05)`
- Active: `scale(0.97)` + `brightness(0.95)`

### 5. Glassmorphism na Sidebar
```css
.sidebar {
  background: rgba(28, 28, 30, 0.92);
  backdrop-filter: blur(40px) saturate(180%);
}
```
- Sidebar escura translúcida com blur forte
- Nunca usar gradientes sólidos

### 6. Vibrancy na Topbar
```css
.topbar {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
}
```
- Topbar semi-transparente com saturação
- Borda ultra-fina (0.5px)

### 7. Inputs com Background Sutil
```css
.input {
  background: var(--gray-50); /* F5F5F7 — não branco puro */
  border: 1px solid var(--gray-200);
}
.input:hover { background: var(--white); }
.input:focus { box-shadow: 0 0 0 4px rgba(46,142,151,0.08); }
```
- Background cinza sutil no estado neutro
- Transição para branco no hover/focus
- Focus ring: 4px com opacidade 0.08 (muito sutil)

### 8. Tipografia
```css
--font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', 'Helvetica Neue', sans-serif;
```
- SF Pro como primeira opção (nativo em macOS/iOS)
- Inter como fallback web
- **Letter-spacing negativo** em títulos: `-0.01em` a `-0.02em`
- Pesos mais leves: preferir `font-medium` (500) sobre `font-bold` (700)

### 9. Animações
```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);   /* Apple spring out */
--ease-spring: cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Apple spring */
```
- Transições suaves: `200ms` padrão
- Sem `translateY` exagerado — apenas `scale` sutil
- `filter: brightness()` para feedback visual

### 10. Espaçamento Generoso
- Cards: `padding: var(--space-6)` (1.5rem = 24px)
- Page content: `padding: var(--space-6) var(--space-8)` (24px × 32px)
- Entre seções: `margin-bottom: var(--space-6)` mínimo

## Checklist para Novas Interfaces

Antes de entregar qualquer nova tela, verificar:

- [ ] Cards sem `border`, usando `shadow-card`
- [ ] Botões sem `linear-gradient`
- [ ] Inputs com `background: var(--gray-50)`
- [ ] Grids usando classes CSS (`.grid-2`, `.grid-4`, `.crm-kpis`) — nunca inline
- [ ] Sombras multicamada (2-3 layers)
- [ ] Radius `var(--radius-2xl)` em cards, `var(--radius-lg)` em inputs
- [ ] Cores da paleta Apple (não inventar hex novos)
- [ ] Animações com `--ease-out` e `--duration-200`

## Consequências

- Visual consistente e premium em todas as telas
- Percepção de qualidade profissional
- Compatibilidade com Safari/macOS nativa (SF Pro, backdrop-filter)
- Sem necessidade de alterar componentes React — tudo via CSS tokens
