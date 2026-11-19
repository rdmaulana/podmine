import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { getEnv } from '@podmine/config';
import { User, RefreshToken } from '@podmine/database';

import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

@Global() // Make JwtService and JwtAuthGuard globally available
@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    JwtModule.register({
      global: true,
      secret: getEnv().JWT_SECRET,
      signOptions: { expiresIn: getEnv().JWT_EXPIRES_IN as any },
    }),
  ],
  providers: [AuthService, JwtAuthGuard, OptionalJwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class AuthModule {}
