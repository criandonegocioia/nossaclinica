import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      include: { role: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    roleId: string;
  }) {
    return this.prisma.user.create({
      data,
      include: { role: true },
    });
  }

  async update(id: string, data: Partial<{ name: string; email: string; active: boolean; roleId: string; avatarUrl: string }>) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });
  }

  async deactivate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { active: false },
    });
  }
}
