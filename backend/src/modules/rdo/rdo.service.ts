import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rdo } from './rdo.entity';

@Injectable()
export class RdoService {
  constructor(
    @InjectRepository(Rdo)
    private readonly rdoRepository: Repository<Rdo>,
  ) {}

  async criarRdo(data: Partial<Rdo>): Promise<Rdo> {
    const rdo = this.rdoRepository.create(data);
    return this.rdoRepository.save(rdo);
  }

  async listarRdosPorObra(obraId: string) {
    return this.rdoRepository.find({ where: { obra: { id: obraId } }, relations: ['usuario', 'obra'] });
  }

  async buscarRdoAbertoPorObra(obraId: string) {
    return this.rdoRepository.findOne({ where: { obra: { id: obraId }, status: 'ABERTO' }, relations: ['usuario', 'obra'] });
  }

  async finalizarRdo(id: string, assinatura: string, foto_url: string) {
    return this.rdoRepository.update(id, { status: 'FINALIZADO', assinatura, foto_url });
  }
}
