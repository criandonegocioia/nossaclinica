import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage') || undefined;
    const source = searchParams.get('source') || undefined;
    const assignedTo = searchParams.get('assignedTo') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {};
    if (stage) where.status = stage as never;
    if (source) where.source = source as never;
    if (assignedTo) where.assignedTo = assignedTo;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { interest: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where, skip, take: limit, orderBy: { updatedAt: 'desc' },
        include: { activities: { orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Leads GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const data = await request.json();
    const lead = await prisma.lead.create({ data: data as Prisma.LeadCreateInput });
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Leads POST error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
