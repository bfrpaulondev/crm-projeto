// =============================================================================
// User Service
// =============================================================================

import { logger } from '@/infrastructure/logging/index.js';
import { traceServiceOperation } from '@/infrastructure/otel/tracing.js';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { config } from '@/config/index.js';
import { auditLogRepository } from '@/repositories/audit-log.repository.js';
import { UserRole } from '@/types/entities.js';

const SALT_ROUNDS = 12;

interface User {
  _id: { toHexString: () => string };
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateUserData {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// Simple in-memory user store (replace with database in production)
const users = new Map<string, User>();

export class UserService {
  async create(data: CreateUserData, createdBy: string): Promise<User> {
    return traceServiceOperation('UserService', 'create', async () => {
      // Check if user exists
      const existing = Array.from(users.values()).find(
        u => u.email === data.email && u.tenantId === data.tenantId
      );

      if (existing) {
        throw new Error('User with this email already exists');
      }

      const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

      const user: User = {
        _id: { toHexString: () => crypto.randomUUID() },
        tenantId: data.tenantId,
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || UserRole.SALES_REP,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      users.set(user._id.toHexString(), user);

      await auditLogRepository.log({
        tenantId: data.tenantId,
        entityType: 'User',
        entityId: user._id.toHexString(),
        action: 'CREATE',
        actorId: createdBy,
        actorEmail: '',
        changes: { created: { email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } },
        metadata: {},
        requestId: '',
      });

      logger.info('User created', {
        userId: user._id.toHexString(),
        email: user.email,
        tenantId: data.tenantId,
      });

      return user;
    });
  }

  async login(email: string, password: string, tenantId: string): Promise<AuthResult> {
    return traceServiceOperation('UserService', 'login', async () => {
      const user = Array.from(users.values()).find(
        u => u.email === email.toLowerCase() && u.tenantId === tenantId
      );

      if (!user || !user.isActive) {
        throw new Error('Invalid credentials');
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      user.lastLoginAt = new Date();

      // Generate tokens
      const accessToken = jwt.sign(
        {
          userId: user._id.toHexString(),
          tenantId: user.tenantId,
          email: user.email,
          role: user.role,
        },
        config.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        {
          userId: user._id.toHexString(),
          type: 'refresh',
        },
        config.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      await auditLogRepository.log({
        tenantId: user.tenantId,
        entityType: 'User',
        entityId: user._id.toHexString(),
        action: 'LOGIN',
        actorId: user._id.toHexString(),
        actorEmail: user.email,
        changes: {},
        metadata: {},
        requestId: '',
      });

      logger.info('User logged in', {
        userId: user._id.toHexString(),
        email: user.email,
        tenantId,
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user._id.toHexString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    });
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return traceServiceOperation('UserService', 'refreshToken', async () => {
      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as {
        userId: string;
        type: string;
      };

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = users.get(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      const newAccessToken = jwt.sign(
        {
          userId: user._id.toHexString(),
          tenantId: user.tenantId,
          email: user.email,
          role: user.role,
        },
        config.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const newRefreshToken = jwt.sign(
        {
          userId: user._id.toHexString(),
          type: 'refresh',
        },
        config.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    });
  }

  async getById(id: string, tenantId: string): Promise<User | null> {
    const user = users.get(id);
    if (user && user.tenantId === tenantId) {
      return user;
    }
    return null;
  }

  async update(id: string, tenantId: string, updates: Partial<User>, updatedBy: string): Promise<User> {
    const user = users.get(id);
    if (!user || user.tenantId !== tenantId) {
      throw new Error('User not found');
    }

    const oldData = { email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role };

    if (updates.firstName) user.firstName = updates.firstName;
    if (updates.lastName) user.lastName = updates.lastName;
    if (updates.role) user.role = updates.role;
    user.updatedAt = new Date();

    await auditLogRepository.log({
      tenantId,
      entityType: 'User',
      entityId: id,
      action: 'UPDATE',
      actorId: updatedBy,
      actorEmail: '',
      changes: { previous: oldData, current: { email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } },
      metadata: {},
      requestId: '',
    });

    logger.info('User updated', { userId: id, tenantId, updatedBy });

    return user;
  }
}

export const userService = new UserService();
