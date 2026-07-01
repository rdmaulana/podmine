import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { prisma } from '@podmine/database';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import { getEnv } from '@podmine/config';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
      },
    });

    return this.generateTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokens(user.id, user.email);
  }

  async refresh(token: string): Promise<AuthResponseDto> {
    const record = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete the used refresh token to implement rotation (optional, but safe)
    await prisma.refreshToken.delete({ where: { id: record.id } });

    return this.generateTokens(record.user.id, record.user.email);
  }

  private async generateTokens(userId: string, email: string): Promise<AuthResponseDto> {
    const env = getEnv();
    
    // Generate JWT access token
    const accessToken = await this.jwtService.signAsync(
      { userId, email },
      {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN as any,
      },
    );

    // Generate refresh token (random UUID)
    const refreshToken = crypto.randomUUID();

    // Determine expiration date
    const durationMatch = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([dhm])$/);
    let expiresAt = new Date();
    if (durationMatch) {
      const amount = parseInt(durationMatch[1], 10);
      const unit = durationMatch[2];
      if (unit === 'd') expiresAt.setDate(expiresAt.getDate() + amount);
      else if (unit === 'h') expiresAt.setHours(expiresAt.getHours() + amount);
      else if (unit === 'm') expiresAt.setMinutes(expiresAt.getMinutes() + amount);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days
    }

    // Save refresh token to DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
