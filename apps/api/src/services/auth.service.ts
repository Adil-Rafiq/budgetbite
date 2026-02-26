import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { RegisterInput, LoginInput } from '@repo/shared';
import { userRepository } from '@repo/database';
import { AppError } from '../middleware/error.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET ?? '';
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError(409, 'Email already registered', 'EMAIL_EXISTS');
    }
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
    });
    const token = this.issueToken(user.id, user.email, user.role);
    return { user: toUserResponse(user), token };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);

    if (!user?.passwordHash) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }
    const token = this.issueToken(user.id, user.email, user.role);
    return { user: toUserResponse(user), token };
  },

  issueToken(sub: string, email?: string, role?: string): string {
    if (!JWT_SECRET) throw new AppError(503, 'Auth not configured', 'AUTH_NOT_CONFIGURED');
    return jwt.sign({ sub, email, role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  },
};

function toUserResponse(u: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  latitude: string | null;
  longitude: string | null;
  role: string;
}) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    latitude: u.latitude != null ? Number(u.latitude) : null,
    longitude: u.longitude != null ? Number(u.longitude) : null,
    role: u.role,
  };
}
