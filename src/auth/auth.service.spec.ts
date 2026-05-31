import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

const mockUser = {
  id: 'user-uuid-1',
  name: 'Test User',
  email: 'test@test.com',
  password: '',
  role: Role.OPERATOR,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  user: {
    findUnique: vi.fn(),
  },
};

const mockJwtService = {
  sign: vi.fn().mockReturnValue('mock-jwt-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    mockUser.password = await bcrypt.hash('Password@1', 10);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    vi.clearAllMocks();
    mockUser.password = await bcrypt.hash('Password@1', 10);
  });

  describe('validateUser', () => {
    it('should return user without password on valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@test.com', 'Password@1');

      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty('password');
      expect(result?.email).toBe('test@test.com');
    });

    it('should return null when user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('notfound@test.com', 'anypass');

      expect(result).toBeNull();
    });

    it('should return null on wrong password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@test.com', 'WrongPassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access_token and user info', async () => {
      const { password: _pw, ...userWithoutPassword } = mockUser;
      const result = await service.login(userWithoutPassword);

      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@test.com');
      expect(mockJwtService.sign).toHaveBeenCalledOnce();
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const { password: _pw, ...userWithoutPassword } = mockUser;
      mockPrismaService.user.findUnique.mockResolvedValue(userWithoutPassword);

      const result = await service.getProfile(mockUser.id);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('test@test.com');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent-id')).rejects.toThrow(UnauthorizedException);
    });
  });
});
