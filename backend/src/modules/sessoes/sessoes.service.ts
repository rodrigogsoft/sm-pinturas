import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessaoDiaria, StatusSessaoEnum } from './entities/sessao-diaria.entity';
import { Obra } from '../obras/entities/obra.entity';
import { CreateSessaoDto } from './dto/create-sessao.dto';
import { UpdateSessaoDto } from './dto/update-sessao.dto';
import { EncerrarSessaoDto } from './dto/encerrar-sessao.dto';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

@Injectable()
export class SessoesService {
  private readonly TOLERANCIA_METROS = 100; // RF06: Tolerância de 100m
  private readonly RAIO_TERRA_METROS = 6371000;

  constructor(
    @InjectRepository(SessaoDiaria)
    private sessaoRepository: Repository<SessaoDiaria>,
    @InjectRepository(Obra)
    private obraRepository: Repository<Obra>,
    private notificacoesService: NotificacoesService,
  ) {}

  /**
   * Criar nova sessão diária (abrir RDO)
   * RF06: Validação de geolocalização e proximidade
   */
  async create(createSessaoDto: CreateSessaoDto): Promise<SessaoDiaria> {
    // Converter strings de data para Date
    const data_sessao = typeof createSessaoDto.data_sessao === 'string' 
      ? new Date(createSessaoDto.data_sessao)
      : createSessaoDto.data_sessao;
    
    const hora_inicio = typeof createSessaoDto.hora_inicio === 'string'
      ? new Date(createSessaoDto.hora_inicio)
      : createSessaoDto.hora_inicio;

    // Verificar se já existe sessão aberta para este encarregado na mesma data
    const sessaoAberta = await this.sessaoRepository.findOne({
      where: {
        id_encarregado: createSessaoDto.id_encarregado,
        data_sessao: data_sessao,
        status: StatusSessaoEnum.ABERTA,
        deletado: false,
      },
    });

    if (sessaoAberta) {
      throw new ConflictException(
        'Já existe uma sessão aberta para este encarregado nesta data. Encerre a sessão anterior primeiro.',
      );
    }

    // RF06: Validar geolocalização se obra tiver coordenadas cadastradas
    if (createSessaoDto.id_obra) {
      const obra = await this.obraRepository.findOne({
        where: { id: createSessaoDto.id_obra },
      });

      if (!obra) {
        throw new NotFoundException('Obra não encontrada');
      }

      // Se obra tem coordenadas, validar proximidade
      if (obra.geo_lat && obra.geo_long) {
        if (!createSessaoDto.geo_lat || !createSessaoDto.geo_long) {
          throw new BadRequestException({
            message: 'Esta obra requer captura de localização GPS',
            codigo: 'GEOLOCALIZACAO_OBRIGATORIA',
          });
        }

        const resultado = this.validarProximidade(
          createSessaoDto.geo_lat,
          createSessaoDto.geo_long,
          obra.geo_lat,
          obra.geo_long,
        );

        if (!resultado.valida) {
          throw new BadRequestException({
            message: `Você está muito longe da obra (${resultado.distancia}m). É necessário estar a menos de ${this.TOLERANCIA_METROS}m.`,
            codigo: 'FORA_DA_AREA_OBRA',
            distancia: resultado.distancia,
            tolerancia: this.TOLERANCIA_METROS,
          });
        }
      }
    }

    const sessao = this.sessaoRepository.create({
      ...createSessaoDto,
      data_sessao: data_sessao,
      hora_inicio: hora_inicio,
    });
    const salva = await this.sessaoRepository.save(sessao);

    await this.notificacoesService.publicarEventoDominio({
      event_type: 'OS_ABERTA',
      source_module: 'sessoes',
      entity_type: 'sessao',
      entity_id: salva.id,
      payload: {
        id_sessao: salva.id,
        id_obra: salva.id_obra,
        id_encarregado: salva.id_encarregado,
        data_sessao: salva.data_sessao,
      },
    });

    return salva;
  }

  /**
   * RF06: Calcula distância entre duas coordenadas usando fórmula de Haversine
   * @returns Distância em metros
   */
  private calcularDistancia(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.RAIO_TERRA_METROS * c;
  }

  /**
   * RF06: Valida se usuário está próximo da obra
   */
  private validarProximidade(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): { valida: boolean; distancia: number } {
    const distancia = Math.round(this.calcularDistancia(lat1, lon1, lat2, lon2));
    return {
      valida: distancia <= this.TOLERANCIA_METROS,
      distancia,
    };
  }

  /**
   * Listar todas as sessões (com filtros opcionais)
   */
  async findAll(filters?: {
    id_encarregado?: string;
    id_obra?: string;
    data_inicio?: Date;
    data_fim?: Date;
    status?: StatusSessaoEnum;
  }): Promise<SessaoDiaria[]> {
    const query = this.sessaoRepository.createQueryBuilder('sessao')
      .leftJoinAndSelect('sessao.encarregado', 'encarregado')
      .where('sessao.deletado = :deletado', { deletado: false });

    if (filters?.id_encarregado) {
      query.andWhere('sessao.id_encarregado = :id_encarregado', {
        id_encarregado: filters.id_encarregado,
      });
    }

    if (filters?.id_obra) {
      query.andWhere('sessao.id_obra = :id_obra', {
        id_obra: filters.id_obra,
      });
    }

    if (filters?.data_inicio) {
      query.andWhere('sessao.data_sessao >= :data_inicio', {
        data_inicio: filters.data_inicio,
      });
    }

    if (filters?.data_fim) {
      query.andWhere('sessao.data_sessao <= :data_fim', {
        data_fim: filters.data_fim,
      });
    }

    if (filters?.status) {
      query.andWhere('sessao.status = :status', {
        status: filters.status,
      });
    }

    return await query
      .orderBy('sessao.data_sessao', 'DESC')
      .addOrderBy('sessao.hora_inicio', 'DESC')
      .getMany();
  }

  /**
   * Buscar sessão por ID
   */
  async findOne(id: string): Promise<SessaoDiaria> {
    const sessao = await this.sessaoRepository.findOne({
      where: { id, deletado: false },
      relations: ['encarregado'],
    });

    if (!sessao) {
      throw new NotFoundException(`Sessão com ID ${id} não encontrada`);
    }

    return sessao;
  }

  /**
   * Buscar sessão aberta atual do encarregado
   */
  async findSessaoAberta(id_encarregado: string): Promise<SessaoDiaria | null> {
    return await this.sessaoRepository.findOne({
      where: {
        id_encarregado,
        status: StatusSessaoEnum.ABERTA,
        deletado: false,
      },
      relations: ['encarregado'],
      order: {
        hora_inicio: 'DESC',
      },
    });
  }

  /**
   * Atualizar sessão
   */
  async update(id: string, updateSessaoDto: UpdateSessaoDto): Promise<SessaoDiaria> {
    const sessao = await this.findOne(id);

    // Não permitir alterar sessão encerrada
    if (sessao.status === StatusSessaoEnum.ENCERRADA && updateSessaoDto.status !== StatusSessaoEnum.ENCERRADA) {
      throw new BadRequestException('Não é possível modificar uma sessão já encerrada');
    }

    Object.assign(sessao, updateSessaoDto);
    const salva = await this.sessaoRepository.save(sessao);

    await this.notificacoesService.publicarEventoDominio({
      event_type: 'OS_ENCERRADA',
      source_module: 'sessoes',
      entity_type: 'sessao',
      entity_id: salva.id,
      payload: {
        id_sessao: salva.id,
        id_obra: salva.id_obra,
        id_encarregado: salva.id_encarregado,
        hora_fim: salva.hora_fim,
      },
    });

    return salva;
  }

  /**
   * Encerrar sessão (RDO)
   */
  async encerrar(id: string, encerrarDto: EncerrarSessaoDto): Promise<SessaoDiaria> {
    const sessao = await this.findOne(id);

    if (sessao.status === StatusSessaoEnum.ENCERRADA) {
      throw new BadRequestException('Esta sessão já está encerrada');
    }

    const horaFim = new Date();

    // Validar que hora_fim é posterior a hora_inicio
    if (horaFim <= new Date(sessao.hora_inicio)) {
      throw new BadRequestException('A hora de fim deve ser posterior à hora de início');
    }

    sessao.hora_fim = horaFim;
    sessao.status = StatusSessaoEnum.ENCERRADA;


    if (encerrarDto.assinatura_url) {
      sessao.assinatura_url = encerrarDto.assinatura_url;
    }

    if (encerrarDto.observacoes) {
      sessao.observacoes = encerrarDto.observacoes;
    }

    // Persistir justificativa obrigatória
    if (!encerrarDto.justificativa || encerrarDto.justificativa.trim().length < 15) {
      throw new BadRequestException('A justificativa é obrigatória e deve ter pelo menos 15 caracteres.');
    }
    sessao.justificativa = encerrarDto.justificativa.trim();

    if (encerrarDto.nome_assinante) {
      sessao.nome_assinante = encerrarDto.nome_assinante.trim();
    }

    if (encerrarDto.cpf_assinante) {
      sessao.cpf_assinante = encerrarDto.cpf_assinante.trim();
    }

    return await this.sessaoRepository.save(sessao);
  }

  /**
   * Soft delete de sessão
   */
  async remove(id: string): Promise<void> {
    const sessao = await this.findOne(id);

    // Não permitir deletar sessão com alocações (será implementado após criar módulo de alocações)
    sessao.deletado = true;
    await this.sessaoRepository.save(sessao);
  }

  /**
   * Calcular duração da sessão em horas
   */
  async calcularDuracao(id: string): Promise<number> {
    const sessao = await this.findOne(id);

    if (!sessao.hora_fim) {
      throw new BadRequestException('Sessão ainda não foi encerrada');
    }

    const inicio = new Date(sessao.hora_inicio).getTime();
    const fim = new Date(sessao.hora_fim).getTime();
    const duracaoMs = fim - inicio;

    return duracaoMs / (1000 * 60 * 60); // Converter para horas
  }
}
