import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { RdoService } from './rdo.service';

@Controller('rdo')
export class RdoController {
  constructor(private readonly rdoService: RdoService) {}

  @Post('criar')
  async criarRdo(@Body() body: any) {
    return this.rdoService.criarRdo(body);
  }

  @Get('obra/:obraId')
  async listarRdosPorObra(@Param('obraId') obraId: string) {
    return this.rdoService.listarRdosPorObra(obraId);
  }

  @Get('aberto/:obraId')
  async buscarRdoAbertoPorObra(@Param('obraId') obraId: string) {
    return this.rdoService.buscarRdoAbertoPorObra(obraId);
  }

  @Patch('finalizar/:id')
  async finalizarRdo(@Param('id') id: string, @Body() body: any) {
    return this.rdoService.finalizarRdo(id, body.assinatura, body.foto_url);
  }
}
