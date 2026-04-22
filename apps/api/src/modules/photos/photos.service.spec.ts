import { Test, TestingModule } from '@nestjs/testing';
import { PhotosService } from './photos.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PhotosService', () => {
  let service: PhotosService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      photo: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotosService,
        { provide: PrismaService, useValue: prismaService },
        { provide: ConfigService, useValue: { get: vi.fn() } },
      ],
    }).compile();

    service = module.get<PhotosService>(PhotosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByPatient', () => {
    it('should return paginated photos', async () => {
      const result = await service.findByPatient('123', { page: 1, limit: 10 });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(prismaService.photo.findMany).toHaveBeenCalled();
      expect(prismaService.photo.count).toHaveBeenCalled();
    });
  });

  describe('quarantine', () => {
    it('should quarantine a photo successfully', async () => {
      prismaService.photo.update.mockResolvedValue({ id: '1', category: 'LIXEIRA' });
      const result = await service.quarantine('1');
      expect(result.category).toBe('LIXEIRA');
    });
  });
});
