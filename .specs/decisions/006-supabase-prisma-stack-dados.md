# ADR-006: Banco de Dados em Produção — Supabase + Prisma
**Status**: ACCEPTED  
**Data**: 2026-04-20  
**Contexto**: Infraestrutura de Dados

---

## Contexto

O projeto precisava de um banco relacional robusto em produção com gerenciamento
de schema e migrations versionadas, sem overhead de infraestrutura própria.

## Decisão

- **ORM**: Prisma (migrations, type safety, query builder)
- **Banco em Produção**: Supabase (PostgreSQL gerenciado)
- **Banco em Desenvolvimento**: PostgreSQL local via Docker

### Regras de Migration

| Ambiente | Como aplicar migration |
|---|---|
| Local | `pnpm prisma migrate dev` |
| Produção | SQL Editor do Supabase **ou** CLI com `DATABASE_URL` do Supabase |

> ⚠️ **NUNCA** rodar `prisma migrate deploy` em produção sem backup prévio.

### Variáveis de Ambiente

```env
# Local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clinica"

# Produção (Supabase)
DATABASE_URL="postgresql://postgres:[SENHA]@[HOST].supabase.co:5432/postgres"
```

## Alternativas Rejeitadas

| Alternativa | Motivo da Rejeição |
|---|---|
| MongoDB / NoSQL | Dados clínicos têm relações complexas (paciente → prontuário → procedimento) |
| Drizzle ORM | Prisma já consolidado, migração desnecessária |
| RDS AWS | Custo e complexidade maiores que Supabase para o porte atual |
| SQLite | Sem suporte a concorrência real em produção |

## Consequências

- ✅ Type safety end-to-end (Prisma gera tipos para o frontend)
- ✅ Migrations versionadas no git
- ✅ Supabase oferece dashboard, backups automáticos e Row Level Security
- ⚠️ Migrations em produção requerem atenção manual (não há CI/CD para isso ainda)
