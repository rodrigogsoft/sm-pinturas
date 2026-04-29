import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlocacaoTarefa, StatusAlocacaoEnum } from './entities/alocacao-tarefa.entity';
import { CreateAlocacaoDto } from './dto/create-alocacao.dto';
import { UpdateAlocacaoDto } from './dto/update-alocacao.dto';
import { ConcluirAlocacaoDto } from './dto/concluir-alocacao.dto';
import { AlocacaoItem, StatusAlocacaoItemEnum } from '../alocacoes-itens/entities/alocacao-item.entity';
import { ConfiguracoesService } from '../configuracoes/configuracoes.service';
import { SessaoDiaria, StatusSessaoEnum } from '../sessoes/entities/sessao-diaria.entity';
import { StatusAprovacaoEnum, TabelaPreco } from '../precos/entities/tabela-preco.entity';

@Injectable()
export class AlocacoesService {
  private readonly logger = new Logger(AlocacoesService.name);

  constructor(
    @InjectRepository(AlocacaoTarefa)
    private alocacaoRepository: Repository<AlocacaoTarefa>,
    @InjectRepository(AlocacaoItem)
    private alocacaoItemRepository: Repository<AlocacaoItem>,
    @InjectRepository(SessaoDiaria)
    private sessaoRepository: Repository<SessaoDiaria>,
    @InjectRepository(TabelaPreco)
    private tabelaPrecoRepository: Repository<TabelaPreco>,
    private configuracoesService: ConfiguracoesService,
  ) {}

  private calcularMargemPercentual(precoVenda: number, precoCusto: number): number {
    if (precoVenda === 0) {
      return 0;
    }
    return ((precoVenda - precoCusto) / precoVenda) * 100;
  }

  private async sincronizarPrecoCusto(createAlocacaoDto: CreateAlocacaoDto): Promise<void> {
    if (
      createAlocacaoDto.preco_custo === undefined ||
      createAlocacaoDto.id_servico_catalogo === undefined
    ) {
      return;
    }

    const sessao = await this.sessaoRepository.findOne({
      where: { id: createAlocacaoDto.id_sessao, deletado: false },
      select: ['id', 'id_obra'],
    });

    if (!sessao?.id_obra) {
      return;
    }

    const precoCusto = Number(createAlocacaoDto.preco_custo);
    const idServico = Number(createAlocacaoDto.id_servico_catalogo);

    const precoExistente = await this.tabelaPrecoRepository.findOne({
      where: {
        id_obra: sessao.id_obra,
        id_servico_catalogo: idServico,
        deletado: false,
      },
    });

    if (precoExistente) {
      precoExistente.preco_custo = precoCusto;

      if (
        precoExistente.status_aprovacao === StatusAprovacaoEnum.PENDENTE ||
        precoExistente.status_aprovacao === StatusAprovacaoEnum.APROVADO
      ) {
        precoExistente.status_aprovacao = StatusAprovacaoEnum.RASCUNHO;
        precoExistente.data_submissao = null;
        precoExistente.id_usuario_submissor = null;
        precoExistente.data_aprovacao = null;
        precoExistente.id_usuario_aprovador = null;
        precoExistente.data_rejeicao = null;
        precoExistente.id_usuario_rejeitador = null;
        precoExistente.justificativa_rejeicao = null;
      }

      await this.tabelaPrecoRepository.save(precoExistente);
      return;
    }

    const novoPreco = this.tabelaPrecoRepository.create({
      id_obra: sessao.id_obra,
      id_servico_catalogo: idServico,
      preco_custo: precoCusto,
      preco_venda: 0,
      status_aprovacao: StatusAprovacaoEnum.RASCUNHO,
    });
    await this.tabelaPrecoRepository.save(novoPreco);
  }

  /**
   * Criar nova alocação (RF07 - Controle 1:1)
   * Implementa a regra: Um ambiente só pode ter um colaborador ativo por vez
   */
  async create(createAlocacaoDto: CreateAlocacaoDto): Promise<AlocacaoTarefa> {
    if (createAlocacaoDto.preco_custo !== undefined && Number(createAlocacaoDto.preco_custo) <= 0) {
      throw new BadRequestException('Preço de custo deve ser maior que zero');
    }

    // Regra legado RF07/RN03 (1:1 por ambiente) permanece apenas quando NAO houver item de ambiente.
    if (!createAlocacaoDto.id_item_ambiente) {
      const alocacaoAtiva = await this.alocacaoRepository
        .createQueryBuilder('alocacao')
        .leftJoin('alocacao.sessao', 'sessao')
        .leftJoin('alocacao.ambiente', 'ambiente')
        .leftJoin('ambiente.pavimento', 'pavimento')
        .leftJoin('pavimento.obra', 'obra')
        .leftJoinAndSelect('alocacao.colaborador', 'colaborador')
        .where('alocacao.id_ambiente = :id_ambiente', {
          id_ambiente: createAlocacaoDto.id_ambiente,
        })
        .andWhere('alocacao.status = :status', {
          status: StatusAlocacaoEnum.EM_ANDAMENTO,
        })
        .andWhere('alocacao.deletado = false')
        .andWhere('sessao.status = :statusSessao', {
          statusSessao: StatusSessaoEnum.ABERTA,
        })
        .andWhere('sessao.deletado = false')
        .andWhere('ambiente.deletado = false')
        .andWhere('pavimento.deletado = false')
        .andWhere('obra.deletado = false')
        .andWhere('alocacao.id_item_ambiente IS NULL')
        .getOne();

      if (alocacaoAtiva) {
        throw new ConflictException({
          message: `Ambiente em uso por ${alocacaoAtiva.colaborador.nome_completo}. Encerre a tarefa anterior primeiro.`,
          codigo: 'AMBIENTE_OCUPADO',
          colaborador_atual: {
            id: alocacaoAtiva.id_colaborador,
            nome: alocacaoAtiva.colaborador.nome_completo,
          },
          alocacao_id: alocacaoAtiva.id,
        });
      }
    }

    // Verificar limite de alocações simultâneas por colaborador
    const maxAlocacoes = await this.configuracoesService.getIntValue(
      'max_alocacoes_simultaneas_colaborador',
      2, // padrão: máximo 2 alocações simultâneas
    );

    if (maxAlocacoes > 0) {
      // 0 = ilimitado
      // Conta ambientes distintos para evitar bloqueio indevido quando houver
      // mais de uma alocacao ativa no mesmo ambiente (ex: itens diferentes).
      const ambientesAtivosRaw = await this.alocacaoRepository
        .createQueryBuilder('alocacao')
        .leftJoin('alocacao.sessao', 'sessao')
        .leftJoin('alocacao.ambiente', 'ambiente')
        .leftJoin('ambiente.pavimento', 'pavimento')
        .leftJoin('pavimento.obra', 'obra')
        .select('COUNT(DISTINCT alocacao.id_ambiente)', 'total')
        .where('alocacao.id_colaborador = :id_colaborador', {
          id_colaborador: createAlocacaoDto.id_colaborador,
        })
        .andWhere('alocacao.status = :status', {
          status: StatusAlocacaoEnum.EM_ANDAMENTO,
        })
        .andWhere('alocacao.deletado = false')
        .andWhere('sessao.status = :statusSessao', {
          statusSessao: StatusSessaoEnum.ABERTA,
        })
        .andWhere('sessao.deletado = false')
        .andWhere('ambiente.deletado = false')
        .andWhere('pavimento.deletado = false')
        .andWhere('obra.deletado = false')
        .getRawOne<{ total: string }>();

      const alocacoesAtuais = Number(ambientesAtivosRaw?.total ?? 0);

      if (alocacoesAtuais >= maxAlocacoes) {
        // Buscar uma para mostrar no erro
        const umAlocacao = await this.alocacaoRepository
          .createQueryBuilder('alocacao')
          .leftJoinAndSelect('alocacao.ambiente', 'ambiente')
          .leftJoinAndSelect('ambiente.pavimento', 'pavimento')
          .leftJoin('pavimento.obra', 'obra')
          .leftJoin('alocacao.sessao', 'sessao')
          .where('alocacao.id_colaborador = :id_colaborador', {
            id_colaborador: createAlocacaoDto.id_colaborador,
          })
          .andWhere('alocacao.status = :status', {
            status: StatusAlocacaoEnum.EM_ANDAMENTO,
          })
          .andWhere('alocacao.deletado = false')
          .andWhere('sessao.status = :statusSessao', {
            statusSessao: StatusSessaoEnum.ABERTA,
          })
          .andWhere('sessao.deletado = false')
          .andWhere('ambiente.deletado = false')
          .andWhere('pavimento.deletado = false')
          .andWhere('obra.deletado = false')
          .orderBy('alocacao.hora_inicio', 'DESC')
          .getOne();

        throw new ConflictException({
          message: `Colaborador já está alocado em ${alocacoesAtuais} ambiente(s). Máximo permitido: ${maxAlocacoes}. Finalize uma tarefa atual primeiro.`,
          codigo: 'COLABORADOR_LIMITE_ALOCACOES',
          alocacoes_atuais: alocacoesAtuais,
          limite: maxAlocacoes,
          ambiente_atual: umAlocacao ? {
            id: umAlocacao.id_ambiente,
            nome: umAlocacao.ambiente.nome,
          } : undefined,
        });
      }
    }

    try {
      await this.sincronizarPrecoCusto(createAlocacaoDto);
    } catch (error) {
      // A sincronização de preço é um efeito colateral.
      // Não deve impedir a criação da alocação em caso de drift de schema/constraints.
      this.logger.warn(
        `Falha ao sincronizar preço de custo para alocação (sessao=${createAlocacaoDto.id_sessao}, servico=${createAlocacaoDto.id_servico_catalogo}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const alocacao = this.alocacaoRepository.create(createAlocacaoDto);
    const savedAlocacao = await this.alocacaoRepository.save(alocacao);

    // Write-through ERS 4.1: espelhar na tabela por item se id_item_ambiente informado
    if (savedAlocacao.id_item_ambiente) {
      try {
        await this.alocacaoItemRepository.save(
          this.alocacaoItemRepository.create({
            id_sessao: savedAlocacao.id_sessao,
            id_ambiente: savedAlocacao.id_ambiente,
            id_item_ambiente: savedAlocacao.id_item_ambiente,
            id_colaborador: savedAlocacao.id_colaborador,
            id_alocacao_legado: savedAlocacao.id,
            hora_inicio: savedAlocacao.hora_inicio,
            status: StatusAlocacaoItemEnum.EM_ANDAMENTO,
          }),
        );
      } catch (error) {
        // O espelhamento é complementar. A alocação principal já foi persistida.
        this.logger.warn(
          `Falha ao espelhar alocação em tb_alocacoes_itens (alocacao=${savedAlocacao.id}, item=${savedAlocacao.id_item_ambiente}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return savedAlocacao;
  }

  /**
   * Listar alocações com filtros
   */
  async findAll(filters?: {
    id_sessao?: string;
    id_obra?: string;
    id_ambiente?: string;
    id_colaborador?: string;
    status?: StatusAlocacaoEnum;
  }): Promise<AlocacaoTarefa[]> {
    const query = this.alocacaoRepository
      .createQueryBuilder('alocacao')
      .leftJoinAndSelect('alocacao.sessao', 'sessao')
      .leftJoinAndSelect('alocacao.ambiente', 'ambiente')
      .leftJoinAndSelect('alocacao.item_ambiente', 'item_ambiente')
      .leftJoinAndSelect('alocacao.colaborador', 'colaborador')
      .leftJoinAndSelect('ambiente.pavimento', 'pavimento')
      .leftJoin('pavimento.obra', 'obra')
      .where('alocacao.deletado = :deletado', { deletado: false })
      .andWhere('sessao.deletado = false')
      .andWhere('ambiente.deletado = false')
      .andWhere('pavimento.deletado = false')
      .andWhere('obra.deletado = false');

    if (filters?.id_sessao) {
      query.andWhere('alocacao.id_sessao = :id_sessao', {
        id_sessao: filters.id_sessao,
      });
    }

    if (filters?.id_obra) {
      query.andWhere('pavimento.id_obra = :id_obra', {
        id_obra: filters.id_obra,
      });
    }

    if (filters?.id_ambiente) {
      query.andWhere('alocacao.id_ambiente = :id_ambiente', {
        id_ambiente: filters.id_ambiente,
      });
    }

    if (filters?.id_colaborador) {
      query.andWhere('alocacao.id_colaborador = :id_colaborador', {
        id_colaborador: filters.id_colaborador,
      });
    }

    if (filters?.status) {
      query.andWhere('alocacao.status = :status', {
        status: filters.status,
      });
    }

    return await query
      .orderBy('alocacao.hora_inicio', 'DESC')
      .getMany();
  }

  /**
   * Buscar alocação por ID
   */
  async findOne(id: string): Promise<AlocacaoTarefa> {
    const alocacao = await this.alocacaoRepository.findOne({
      where: { id, deletado: false },
      relations: ['sessao', 'ambiente', 'colaborador', 'ambiente.pavimento'],
    });

    if (!alocacao) {
      throw new NotFoundException(`Alocação com ID ${id} não encontrada`);
    }

    return alocacao;
  }

  /**
   * Buscar alocações ativas
   */
  async findAlocacoesAtivas(): Promise<AlocacaoTarefa[]> {
    return await this.findAll({
      status: StatusAlocacaoEnum.EM_ANDAMENTO,
    });
  }

  /**
   * Verificar se ambiente está ocupado
   */
  async verificarAmbienteOcupado(id_ambiente: string): Promise<{
    ocupado: boolean;
    alocacao?: AlocacaoTarefa;
  }> {
    const alocacao = await this.alocacaoRepository.findOne({
      where: {
        id_ambiente,
        status: StatusAlocacaoEnum.EM_ANDAMENTO,
        deletado: false,
      },
      relations: ['colaborador'],
    });

    return {
      ocupado: !!alocacao,
      alocacao: alocacao || undefined,
    };
  }

  /**
   * Atualizar alocação
   */
  async update(id: string, updateAlocacaoDto: UpdateAlocacaoDto): Promise<AlocacaoTarefa> {
    const alocacao = await this.findOne(id);

    // Não permitir alterar alocação concluída
    if (alocacao.status === StatusAlocacaoEnum.CONCLUIDO) {
      throw new BadRequestException('Não é possível modificar uma alocação já concluída');
    }

    Object.assign(alocacao, updateAlocacaoDto);
    return await this.alocacaoRepository.save(alocacao);
  }

  /**
   * Concluir alocação
   */
  async concluir(id: string, concluirDto: ConcluirAlocacaoDto): Promise<AlocacaoTarefa> {
    const alocacao = await this.findOne(id);

    if (alocacao.status === StatusAlocacaoEnum.CONCLUIDO) {
      throw new BadRequestException('Esta alocação já está concluída');
    }

    // Validar que hora_fim é posterior a hora_inicio
    if (new Date(concluirDto.hora_fim) <= new Date(alocacao.hora_inicio)) {
      throw new BadRequestException('A hora de fim deve ser posterior à hora de início');
    }

    alocacao.hora_fim = concluirDto.hora_fim;
    alocacao.status = StatusAlocacaoEnum.CONCLUIDO;

    if (concluirDto.observacoes) {
      alocacao.observacoes = concluirDto.observacoes;
    }

    const savedAlocacao = await this.alocacaoRepository.save(alocacao);

    // Write-through ERS 4.1: fechar o espelho na tabela por item
    if (savedAlocacao.id_item_ambiente) {
      const itemAlocacao = await this.alocacaoItemRepository.findOne({
        where: {
          id_alocacao_legado: savedAlocacao.id,
          status: StatusAlocacaoItemEnum.EM_ANDAMENTO,
          deletado: false,
        },
      });
      if (itemAlocacao) {
        itemAlocacao.status = StatusAlocacaoItemEnum.CONCLUIDO;
        itemAlocacao.hora_fim = savedAlocacao.hora_fim;
        if (concluirDto.observacoes) {
          itemAlocacao.observacoes = concluirDto.observacoes;
        }
        await this.alocacaoItemRepository.save(itemAlocacao);
      }
    }

    return savedAlocacao;
  }

  /**
   * Pausar alocação
   */
  async pausar(id: string): Promise<AlocacaoTarefa> {
    const alocacao = await this.findOne(id);

    if (alocacao.status !== StatusAlocacaoEnum.EM_ANDAMENTO) {
      throw new BadRequestException('Só é possível pausar alocações em andamento');
    }

    alocacao.status = StatusAlocacaoEnum.PAUSADO;
    return await this.alocacaoRepository.save(alocacao);
  }

  /**
   * Retomar alocação pausada
   */
  async retomar(id: string): Promise<AlocacaoTarefa> {
    const alocacao = await this.findOne(id);

    if (alocacao.status !== StatusAlocacaoEnum.PAUSADO) {
      throw new BadRequestException('Só é possível retomar alocações pausadas');
    }

    // Verificar se ambiente ainda está livre
    const verificacao = await this.verificarAmbienteOcupado(alocacao.id_ambiente);
    if (verificacao.ocupado) {
      throw new ConflictException({
        message: 'Ambiente já está ocupado por outro colaborador',
        codigo: 'AMBIENTE_OCUPADO',
        alocacao_id: verificacao.alocacao?.id,
      });
    }

    alocacao.status = StatusAlocacaoEnum.EM_ANDAMENTO;
    return await this.alocacaoRepository.save(alocacao);
  }

  /**
   * Soft delete de alocação
   */
  async remove(id: string): Promise<void> {
    const alocacao = await this.findOne(id);
    alocacao.deletado = true;
    await this.alocacaoRepository.save(alocacao);
  }

  /**
   * Calcular duração da alocação em horas
   */
  async calcularDuracao(id: string): Promise<number> {
    const alocacao = await this.findOne(id);

    if (!alocacao.hora_fim) {
      throw new BadRequestException('Alocação ainda não foi concluída');
    }

    const inicio = new Date(alocacao.hora_inicio).getTime();
    const fim = new Date(alocacao.hora_fim).getTime();
    const duracaoMs = fim - inicio;

    return duracaoMs / (1000 * 60 * 60); // Converter para horas
  }
}
