import { Controller, Post, Body, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, AuthResponseDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AuthResponseDto, description: 'User successfully registered' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email is already registered' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    // TODO: Add registration (for now we don't accept signups)
    return this.authService.register(dto);
    // throw new ForbiddenException('Registration is currently closed');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive tokens' })
  @ApiResponse({ status: HttpStatus.OK, type: AuthResponseDto, description: 'Tokens issued successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid email or password' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: HttpStatus.OK, type: AuthResponseDto, description: 'New tokens issued successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }
}
