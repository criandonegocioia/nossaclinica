import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as argon2 from 'argon2';

vi.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    jwtService = {
      signAsync: vi.fn().mockResolvedValue('mocked-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: vi.fn().mockReturnValue('secret') } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.validateUser('test@test.com', 'pwd')).rejects.toThrow(UnauthorizedException);
    });

    it('should validate user correctly', async () => {
      const mockUser = {
        id: '1', email: 'test@test.com', passwordHash: 'hash', active: true, role: { name: 'ADMIN' }
      };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(argon2.verify).mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'pwd');
      expect(result).toEqual(mockUser);
      expect(prismaService.user.update).toHaveBeenCalled();
    });
  });
});
