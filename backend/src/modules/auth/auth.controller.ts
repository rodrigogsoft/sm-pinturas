import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Delete,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, RefreshTokenDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
  })
  @ApiResponse({
    status: 409,
    description: 'Email já cadastrado',
  })
  async register(@Body() registerDto: RegisterDto) {
    const usuario = await this.authService.register(registerDto);
    // Remover senha do retorno
    const { senha_hash, ...result } = usuario;
    return result;
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer login' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: any,
  ): Promise<LoginResponseDto> {
    return this.authService.login(loginDto, req);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Request() req: any) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token, req);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encerrar sessão e revogar refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
  })
  async logout(@Request() req: any) {
    await this.authService.revokeRefreshToken(req.user.id, req.user.sid);
    return { message: 'Logout realizado com sucesso' };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar sessões ativas do usuário' })
  @ApiResponse({ status: 200, description: 'Sessões ativas listadas com sucesso' })
  async getSessions(@Request() req: any) {
    return this.authService.listActiveSessions(req.user.id, req.user.sid);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revogar sessão específica do usuário' })
  @ApiResponse({ status: 200, description: 'Sessão revogada com sucesso' })
  async revokeSession(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Request() req: any,
  ) {
    await this.authService.revokeSessionById(req.user.id, sessionId);
    return { message: 'Sessão revogada com sucesso' };
  }

  @Delete('sessions/others')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revogar todas as outras sessões ativas do usuário' })
  @ApiResponse({ status: 200, description: 'Outras sessões revogadas com sucesso' })
  async revokeOtherSessions(@Request() req: any) {
    const revogadas = await this.authService.revokeOtherSessions(
      req.user.id,
      req.user.sid,
    );

    return {
      message: 'Outras sessões revogadas com sucesso',
      revogadas,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuário',
  })
  async getProfile(@Request() req: any) {
    return req.user;
  }
}
