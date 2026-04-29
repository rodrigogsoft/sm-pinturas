import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PushNotificationService } from './push-notification.service';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { id: number };
}

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(
    private readonly pushService: PushNotificationService,
  ) {}

  /**
   * Registrar token FCM do dispositivo
   * POST /push/register-token
   */
  @Post('register-token')
  async registrarToken(
    @Req() req: RequestWithUser,
    @Body('fcm_token') fcm_token: string,
  ) {
    const user_id = req.user.id.toString();
    await this.pushService.registrarToken(user_id, fcm_token);
    return {
      message: 'Token FCM registrado com sucesso',
      sucesso: true,
    };
  }

  /**
   * Remover token FCM (logout)
   * POST /push/unregister-token
   */
  @Post('unregister-token')
  async removerToken(@Req() req: RequestWithUser) {
    const user_id = req.user.id.toString();
    await this.pushService.removerToken(user_id);
    return {
      message: 'Token FCM removido com sucesso',
      sucesso: true,
    };
  }

  /**
   * Testar envio de push (desenvolvimento)
   * POST /push/test
   */
  @Post('test')
  async testarPush(@Req() req: RequestWithUser, @Body() data: { titulo: string; mensagem: string }) {
    const user_id = req.user.id.toString();
    const resultado = await this.pushService.enviarParaUsuario(user_id, {
      titulo: data.titulo || 'Teste de Push',
      mensagem: data.mensagem || 'Esta é uma notificação de teste',
      tipo: 'teste',
      prioridade: 'normal',
    });

    return {
      message: 'Push de teste enviado',
      resultado,
    };
  }

  /**
   * Obter estatísticas de tokens registrados (admin only)
   * GET /push/stats
   */
  @Get('stats')
  async obterEstatisticas() {
    return await this.pushService.obterEstatisticas();
  }
}
