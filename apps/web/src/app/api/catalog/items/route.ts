import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/catalog/items
 * Retorna Produtos (materiais) e Medicamentos unificados.
 * Query params: search, tipo (MATERIAL|MEDICAMENTO), limit
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tipo = searchParams.get('tipo') || undefined;
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const nameFilter = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

    // Busca em paralelo respeitando o filtro de tipo
    const [produtos, medicamentos] = await Promise.all([
      tipo === 'MEDICAMENTO' ? Promise.resolve([]) : prisma.product.findMany({
        where: { active: true, ...nameFilter },
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true, name: true, brand: true, unit: true,
          category: true, active: true, supplier: true,
        },
      }).catch(() => []),

      tipo === 'MATERIAL' ? Promise.resolve([]) : prisma.medication.findMany({
        where: { active: true, ...nameFilter },
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true, name: true, activeIngredient: true,
          concentration: true, form: true, route: true,
          defaultDosage: true, active: true,
        },
      }).catch(() => []),
    ]);

    // Normaliza para formato unificado do catálogo
    const data = [
      ...produtos.map((p) => ({
        id: p.id,
        nome: p.name,
        fabricante: p.brand ?? undefined,
        unidadeMedida: p.unit ?? 'UN',
        precoUnitario: 0,   // Preço vem do lote mais recente — simplificado aqui
        estoque: 0,
        ativo: p.active,
        tipo: 'MATERIAL' as const,
        categoria: p.category,
      })),
      ...medicamentos.map((m) => ({
        id: m.id,
        nome: m.name,
        fabricante: undefined,
        unidadeMedida: 'UN',
        precoUnitario: 0,
        estoque: 0,
        ativo: m.active,
        tipo: 'MEDICAMENTO' as const,
        principioAtivo: m.activeIngredient,
        concentracao: m.concentration ?? undefined,
        posologia: m.defaultDosage ?? undefined,
        viaAdministracao: m.route ?? undefined,
      })),
    ].sort((a, b) => a.nome.localeCompare(b.nome));

    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    console.error('Catalog GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
