import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TabelaPreco,
  StatusAprovacaoEnum,
} from './entities/tabela-preco.entity';
import { Obra } from '../obras/entities/obra.entity';
import { CreatePrecoDto } from './dto/create-preco.dto';
import { UpdatePrecoDto } from './dto/update-preco.dto';
import { AprovarPrecoDto } from './dto/aprovar-preco.dto';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

@Injectable()
export class PrecosService {
  private readonly MARGEM_MINIMA_PERCENTUAL = 20; // fallback

  constructor(
    @InjectRepository(TabelaPreco)
    private precoRepository: Repository<TabelaPreco>,
    @InjectRepository(Obra)
    private obraRepository: Repository<Obra>,
    private notificacoesService: NotificacoesService,
  ) {}

  /**
   * Calcula a margem percentual entre preço de venda e custo
   * Margem % = ((preco_venda - preco_custo) / preco_venda) * 100
   * Nota: Esta é a margem sobre a receita (lucro_bruto / receita_total)
   */
  private calcularMargemPercentual(preco_venda: number, preco_custo: number): number {
    if (preco_venda === 0) {
      return 0;
    }
    return ((preco_venda - preco_custo) / preco_venda) * 100;
  }

  private normalizarMargem(preco: TabelaPreco): TabelaPreco {
    const margemCalculada = this.calcularMargemPercentual(
      Number(preco.preco_venda || 0),
      Number(preco.preco_custo || 0),
    );
    preco.margem_percentual = parseFloat(margemCalculada.toFixed(2));
    return preco;
  }

  private async getMargemMinima(idObra?: string): Promise<number> {
    if (!idObra) {
      return this.MARGEM_MINIMA_PERCENTUAL;
    }

    const obra = await this.obraRepository.findOne({
      where: { id: idObra, deletado: false },
    });

    return obra?.margem_minima_percentual ?? this.MARGEM_MINIMA_PERCENTUAL;
  }

  async getMargemValidacao(id: string): Promise<any> {
    const preco = await this.findOne(id);

    const margemCalculada = this.calcularMargemPercentual(
      preco.preco_venda,
      preco.preco_custo,
    );

    const margemMinima = await this.getMargemMinima(preco.id_obra);
    const atendeMargem = margemCalculada >= margemMinima;

    let mensagemValidacao = '';
    if (atendeMargem) {
      mensagemValidacao = `Margem aprovada (${margemCalculada.toFixed(2)}% >= ${margemMinima}%). Permitido aprovar.`;
    } else {
      mensagemValidacao = `Margem insuficiente (${margemCalculada.toFixed(2)}% < ${margemMinima}%). Rejeitar ou aumentar preço de venda.`;
    }

    return {
      id: preco.id,
      preco_custo: preco.preco_custo,
      preco_venda: preco.preco_venda,
      margem_percentual: parseFloat(margemCalculada.toFixed(2)),
      margem_minima_exigida: margemMinima,
      atende_margem_minima: atendeMargem,
      status_aprovacao: preco.status_aprovacao,
      mensagem_validacao: mensagemValidacao,
    };
  }

  async create(createPrecoDto: CreatePrecoDto): Promise<TabelaPreco> {
    // Verificar se já existe preço para esta obra/serviço
    const existing = await this.precoRepository.findOne({
      where: {
        id_obra: createPrecoDto.id_obra,
        id_servico_catalogo: createPrecoDto.id_servico_catalogo,
        deletado: false,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Já existe preço cadastrado para este serviço nesta obra',
      );
    }

    const preco = this.precoRepository.create({
      ...createPrecoDto,
      margem_percentual: parseFloat(
        this.calcularMargemPercentual(
          Number(createPrecoDto.preco_venda || 0),
          Number(createPrecoDto.preco_custo || 0),
        ).toFixed(2),
      ),
      status_aprovacao: StatusAprovacaoEnum.RASCUNHO,
    });
    return this.precoRepository.save(preco);
  }

  async findAll(idObra?: string): Promise<TabelaPreco[]> {
    const where: any = { deletado: false };
    if (idObra) {
      where.id_obra = idObra;
    }

    const precos = await this.precoRepository.find({
      where,
      relations: ['obra', 'servico', 'aprovador'],
      order: { created_at: 'DESC' },
    });

    return precos.map((preco) => this.normalizarMargem(preco));
  }

  async findByObra(idObra: string): Promise<TabelaPreco[]> {
    const precos = await this.precoRepository.find({
      where: { id_obra: idObra, deletado: false },
      relations: ['servico', 'aprovador'],
      order: { status_aprovacao: 'ASC', created_at: 'DESC' },
    });

    return precos.map((preco) => this.normalizarMargem(preco));
  }

  async findOne(id: string): Promise<TabelaPreco> {
    const preco = await this.precoRepository.findOne({
      where: { id, deletado: false },
      relations: ['obra', 'servico', 'aprovador'],
    });

    if (!preco) {
      throw new NotFoundException(`Preço com ID ${id} não encontrado`);
    }

    return this.normalizarMargem(preco);
  }

  async update(id: string, updatePrecoDto: UpdatePrecoDto): Promise<TabelaPreco> {
    const preco = await this.findOne(id);

    // Não permitir atualização se já aprovado ou pendente
    if (
      preco.status_aprovacao === StatusAprovacaoEnum.APROVADO ||
      preco.status_aprovacao === StatusAprovacaoEnum.PENDENTE
    ) {
      throw new BadRequestException(
        'Não é possível atualizar preço pendente ou aprovado',
      );
    }

    Object.assign(preco, updatePrecoDto);
    this.normalizarMargem(preco);
    return this.precoRepository.save(preco);
  }

  async retornarParaRascunho(
    id: string,
    idUsuarioSolicitante: string,
  ): Promise<TabelaPreco> {
    const preco = await this.findOne(id);

    if (preco.status_aprovacao === StatusAprovacaoEnum.RASCUNHO) {
      throw new BadRequestException('Preço já está em rascunho');
    }

    preco.status_aprovacao = StatusAprovacaoEnum.RASCUNHO;

    // Reinicia ciclo de aprovação para permitir nova edição/submissão.
    preco.data_submissao = null;
    preco.id_usuario_submissor = null;
    preco.data_aprovacao = null;
    preco.id_usuario_aprovador = null;
    preco.data_rejeicao = null;
    preco.id_usuario_rejeitador = null;
    preco.justificativa_rejeicao = null;

    this.normalizarMargem(preco);
    const salvo = await this.precoRepository.save(preco);

    await this.notificacoesService.publicarEventoDominio({
      event_type: 'PRECO_RETORNADO_RASCUNHO',
      source_module: 'precos',
      entity_type: 'tabela_preco',
      entity_id: salvo.id,
      payload: {
        id_preco: salvo.id,
        id_obra: salvo.id_obra,
        status_aprovacao: salvo.status_aprovacao,
        id_usuario_solicitante: idUsuarioSolicitante,
      },
    });

    return salvo;
  }

  async submeterParaAprovacao(id: string, idUsuarioSubmissor: string): Promise<TabelaPreco> {
    const preco = await this.findOne(id);

    if (
      preco.status_aprovacao !== StatusAprovacaoEnum.RASCUNHO &&
      preco.status_aprovacao !== StatusAprovacaoEnum.REJEITADO
    ) {
      throw new BadRequestException('Preco ja esta pendente ou aprovado');
    }

    if (preco.preco_custo <= 0 || preco.preco_venda <= 0) {
      throw new BadRequestException('Preco de custo e venda devem ser maiores que zero');
    }

    const margemCalculada = this.calcularMargemPercentual(
      preco.preco_venda,
      preco.preco_custo,
    );
    const margemMinima = await this.getMargemMinima(preco.id_obra);

    if (margemCalculada < margemMinima) {
      throw new BadRequestException(
        `Margem insuficiente. Margem calculada: ${margemCalculada.toFixed(2)}%. ` +
        `Margem minima exigida: ${margemMinima}%.`,
      );
    }

    preco.status_aprovacao = StatusAprovacaoEnum.PENDENTE;
    this.normalizarMargem(preco);
    preco.data_submissao = new Date();
    preco.id_usuario_submissor = idUsuarioSubmissor;
    preco.data_rejeicao = null;
    preco.id_usuario_rejeitador = null;
    preco.justificativa_rejeicao = null;

    const salvo = await this.precoRepository.save(preco);

    await this.notificacoesService.publicarEventoDominio({
      event_type: 'PRECO_APROVACAO_PENDENTE',
      source_module: 'precos',
      entity_type: 'tabela_preco',
      entity_id: salvo.id,
      payload: {
        id_preco: salvo.id,
        id_obra: salvo.id_obra,
        preco_venda: Number(salvo.preco_venda),
        preco_custo: Number(salvo.preco_custo),
        margem_percentual: Number(salvo.margem_percentual),
      },
    });

    return salvo;
  }

  async aprovar(
    id: string,
    aprovarPrecoDto: AprovarPrecoDto,
    idUsuarioAprovador: string,
  ): Promise<TabelaPreco> {
    const preco = await this.findOne(id);

    if (preco.status_aprovacao !== StatusAprovacaoEnum.PENDENTE) {
      throw new BadRequestException(
        'Apenas preços pendentes podem ser aprovados/rejeitados',
      );
    }

    if (aprovarPrecoDto.status === StatusAprovacaoEnum.REJEITADO) {
      if (!aprovarPrecoDto.observacoes || aprovarPrecoDto.observacoes.trim().length < 10) {
        throw new BadRequestException('Justificativa obrigatoria (minimo 10 caracteres)');
      }
    }

    // Validar margem se o status e APROVADO
    if (aprovarPrecoDto.status === StatusAprovacaoEnum.APROVADO) {
      const margemCalculada = this.calcularMargemPercentual(
        preco.preco_venda,
        preco.preco_custo,
      );
      const margemMinima = await this.getMargemMinima(preco.id_obra);

      if (margemCalculada < margemMinima) {
        throw new BadRequestException(
          `Margem insuficiente. Margem calculada: ${margemCalculada.toFixed(2)}%. ` +
          `Margem minima exigida: ${margemMinima}%. ` +
          `Para aprovar com margem inferior, contate o administrador.`,
        );
      }
    }

    preco.status_aprovacao = aprovarPrecoDto.status;
    if (aprovarPrecoDto.status === StatusAprovacaoEnum.APROVADO) {
      preco.data_aprovacao = new Date();
      preco.id_usuario_aprovador = idUsuarioAprovador;
      preco.data_rejeicao = null;
      preco.id_usuario_rejeitador = null;
      preco.justificativa_rejeicao = null;
    }

    if (aprovarPrecoDto.status === StatusAprovacaoEnum.REJEITADO) {
      preco.data_rejeicao = new Date();
      preco.id_usuario_rejeitador = idUsuarioAprovador;
      preco.justificativa_rejeicao = aprovarPrecoDto.observacoes || null;
      preco.data_aprovacao = null;
      preco.id_usuario_aprovador = null;
    }

    if (aprovarPrecoDto.observacoes) {
      preco.observacoes = aprovarPrecoDto.observacoes;
    }

    this.normalizarMargem(preco);
    const salvo = await this.precoRepository.save(preco);

    await this.notificacoesService.publicarEventoDominio({
      event_type: `PRECO_${aprovarPrecoDto.status}`,
      source_module: 'precos',
      entity_type: 'tabela_preco',
      entity_id: salvo.id,
      payload: {
        id_preco: salvo.id,
        id_obra: salvo.id_obra,
        status_aprovacao: salvo.status_aprovacao,
        observacoes: salvo.observacoes,
      },
    });

    return salvo;
  }

  async remove(id: string): Promise<void> {
    const preco = await this.findOne(id);
    preco.deletado = true;
    await this.precoRepository.save(preco);
  }

  /**
   * Listar preços pendentes de aprovação
   * Útil para o Gestor ver o que precisa aprovar
   */
  async findPendentes(): Promise<TabelaPreco[]> {
    const precos = await this.precoRepository.find({
      where: {
        status_aprovacao: StatusAprovacaoEnum.PENDENTE,
        deletado: false,
      },
      relations: ['obra', 'servico', 'aprovador'],
      order: { data_submissao: 'ASC' }, // Mais antigos primeiro
    });

    return precos.map((preco) => this.normalizarMargem(preco));
  }

  /**
   * Obter estatísticas de preços
   * Retorna contadores por status de aprovação
   */
  async getEstatisticas(): Promise<{
    total: number;
    por_status: {
      rascunho: number;
      pendente: number;
      aprovado: number;
      rejeitado: number;
    };
  }> {
    const [total, rascunho, pendente, aprovado, rejeitado] = await Promise.all([
      this.precoRepository.count({ where: { deletado: false } }),
      this.precoRepository.count({
        where: { status_aprovacao: StatusAprovacaoEnum.RASCUNHO, deletado: false },
      }),
      this.precoRepository.count({
        where: { status_aprovacao: StatusAprovacaoEnum.PENDENTE, deletado: false },
      }),
      this.precoRepository.count({
        where: { status_aprovacao: StatusAprovacaoEnum.APROVADO, deletado: false },
      }),
      this.precoRepository.count({
        where: { status_aprovacao: StatusAprovacaoEnum.REJEITADO, deletado: false },
      }),
    ]);

    return {
      total,
      por_status: {
        rascunho,
        pendente,
        aprovado,
        rejeitado,
      },
    };
  }
}
