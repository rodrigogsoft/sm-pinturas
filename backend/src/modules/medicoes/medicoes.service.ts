import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medicao } from './entities/medicao.entity';
import { CreateMedicaoDto } from './dto/create-medicao.dto';
import { UpdateMedicaoDto } from './dto/update-medicao.dto';
import { StatusPagamentoEnum, PerfilEnum } from '../../common/enums';
import { TabelaPreco, StatusAprovacaoEnum } from '../precos/entities/tabela-preco.entity';
import { AlocacaoTarefa } from '../alocacoes/entities/alocacao-tarefa.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AcaoAuditoriaEnum } from '../auditoria/entities/audit-log.entity';
import { PushNotificationService } from '../push/push-notification.service';
import { MedicoesColaboradorService } from '../medicoes-colaborador/medicoes-colaborador.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { Usuario } from '../auth/entities/usuario.entity';
import { In } from 'typeorm';
import { PrioridadeEnum, TipoNotificacaoEnum } from '../notificacoes/entities/notificacao.entity';

@Injectable()
export class MedicoesService {
  constructor(
    @InjectRepository(Medicao)
    private medicaoRepository: Repository<Medicao>,

    @InjectRepository(TabelaPreco)
    private tabelaPrecosRepository: Repository<TabelaPreco>,

    @InjectRepository(AlocacaoTarefa)
    private alocacaoRepository: Repository<AlocacaoTarefa>,

    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,

    private auditoriaService: AuditoriaService,
    private pushNotificationService: PushNotificationService,
    private medicoesColaboradorService: MedicoesColaboradorService,
    private notificacoesService: NotificacoesService,
  ) {}

  /**
   * RN02: Validar travamento de faturamento
   * Não permite criar medição se a tabela de preços estiver com status diferente de APROVADO
   */
  private async validarStatusPreco(idAlocacao: string): Promise<TabelaPreco> {
    const alocacao = await this.alocacaoRepository.findOne({
      where: { id: idAlocacao, deletado: false },
      relations: [
        'item_ambiente',
        'item_ambiente.tabelaPreco',
        'ambiente',
        'ambiente.pavimento',
      ],
    });

    if (!alocacao) {
      throw new NotFoundException('Alocacao nao encontrada');
    }

    if (alocacao.item_ambiente?.tabelaPreco &&
        alocacao.item_ambiente.tabelaPreco.id_servico_catalogo === alocacao.id_servico_catalogo) {
      return alocacao.item_ambiente.tabelaPreco;
    }

    const idObra = alocacao.ambiente?.pavimento?.id_obra;
    const idServicoCatalogo = alocacao.id_servico_catalogo;

    if (!idObra || !idServicoCatalogo) {
      throw new BadRequestException(
        'Alocacao sem item de ambiente e sem dados suficientes para validar preco (obra/servico)',
      );
    }

    const tabelaPrecoAmbiente = await this.tabelaPrecosRepository.findOne({
      where: {
        id_obra: idObra,
        id_servico_catalogo: idServicoCatalogo,
        deletado: false,
      },
      order: { updated_at: 'DESC' },
    });

    if (!tabelaPrecoAmbiente) {
      throw new NotFoundException('Tabela de preco nao encontrada para obra/servico da alocacao');
    }

    return tabelaPrecoAmbiente;
  }

  /**
   * Criar nova medição (RF08 - Validação de Excedentes)
   * RN02: Valida se o preço está aprovado antes de criar
   */
  async create(
    createMedicaoDto: CreateMedicaoDto,
    usuario: { id: string; id_perfil: number },
  ): Promise<Medicao> {
    const { qtd_executada, area_planejada, justificativa, foto_evidencia_url } = createMedicaoDto;

    // RN02: Validator travamento de faturamento
    const tabelaPreco = await this.validarStatusPreco(createMedicaoDto.id_alocacao);

    if (tabelaPreco.status_aprovacao !== StatusAprovacaoEnum.APROVADO) {
      if (usuario.id_perfil === PerfilEnum.ADMIN) {
        if (!createMedicaoDto.justificativa_excecao_admin) {
          throw new BadRequestException({
            message: 'Preco nao aprovado. Admin deve informar justificativa_excecao_admin',
            codigo: 'PRECO_NAOAPROVADO',
            status_atual: tabelaPreco.status_aprovacao,
          });
        }
      } else {
        throw new BadRequestException({
          message: 'Nao e possivel criar medicao. Preco ainda nao aprovado.',
          codigo: 'PRECO_NAOAPROVADO',
          status_atual: tabelaPreco.status_aprovacao,
        });
      }
    }

    // RF08: Validar excedentes
    let flagExcedente = false;

    if (area_planejada && qtd_executada > area_planejada) {
      flagExcedente = true;

      // Exigir justificativa e foto para excedentes
      if (!justificativa || justificativa.trim() === '') {
        throw new BadRequestException({
          message: 'Justificativa obrigatoria para medicao excedente',
          codigo: 'EXCEDENTE_SEM_JUSTIFICATIVA',
          qtd_executada,
          area_planejada,
          excedente: qtd_executada - area_planejada,
        });
      }

      if (!foto_evidencia_url || foto_evidencia_url.trim() === '') {
        throw new BadRequestException({
          message: 'Foto de evidencia obrigatoria para medicao excedente',
          codigo: 'EXCEDENTE_SEM_FOTO',
          qtd_executada,
          area_planejada,
          excedente: qtd_executada - area_planejada,
        });
      }
    }

    const medicao = this.medicaoRepository.create({
      ...createMedicaoDto,
      valor_calculado: Number(qtd_executada) * Number(tabelaPreco.preco_custo || 0),
      flag_excedente: flagExcedente,
    });

    const medicaoSalva = await this.medicaoRepository.save(medicao);

    if (
      tabelaPreco.status_aprovacao !== StatusAprovacaoEnum.APROVADO &&
      usuario.id_perfil === PerfilEnum.ADMIN &&
      createMedicaoDto.justificativa_excecao_admin
    ) {
      await this.auditoriaService.create({
        id_usuario: usuario.id,
        tabela_afetada: 'tb_medicoes',
        acao: AcaoAuditoriaEnum.INSERT,
        id_registro: medicaoSalva.id,
        justificativa: createMedicaoDto.justificativa_excecao_admin,
        dados_depois: {
          id_medicao: medicaoSalva.id,
          id_alocacao: medicaoSalva.id_alocacao,
          status_preco: tabelaPreco.status_aprovacao,
          excecao_admin: true,
        },
      });
    }

    // RF08: Enviar notificação para GESTORs se houver excedente
    if (flagExcedente && area_planejada) {
      const percentualExcedente = ((qtd_executada - area_planejada) / area_planejada) * 100;
      // Carrega informações da alocação para notificação
      const alocacao = await this.alocacaoRepository.findOne({
        where: { id: createMedicaoDto.id_alocacao },
        relations: ['colaborador', 'ambiente'],
      });

      if (alocacao?.colaborador && alocacao?.ambiente) {
        // Enviar para GESTORs de forma assíncrona (não bloqueia),
        // usando try/catch para evitar erros de notificação bloquearem a criação
        this.pushNotificationService
          .enviarParaUsuarios(
            [], // Em produção, buscar lista de GESTORs
            {
              titulo: '🚨 Excedente de Medição Detectado',
              mensagem: `${alocacao.colaborador.nome_completo} completou ${percentualExcedente.toFixed(1)}% acima do planejado em ${alocacao.ambiente.nome}`,
              tipo: 'medicao_excedente',
              id_entidade: medicaoSalva.id,
              prioridade: 'alta',
              dados_extras: {
                percentualExcedente: percentualExcedente.toString(),
              },
            }
          )
          .catch((err) => {
            // Log de erro mas não falha a criação de medição
            console.error('Erro ao enviar notificação de excedente:', err);
          });
      }
    }

    // RF17+RF18: cascade de progresso após nova medição
    await this.recalcularProgressoPorAlocacao(medicaoSalva.id_alocacao);

    return medicaoSalva;
  }

  // Dispara recálculo de progresso em cascata para o item vinculado à alocação
  private async recalcularProgressoPorAlocacao(idAlocacao: string): Promise<void> {
    const alocacao = await this.alocacaoRepository.findOne({
      where: { id: idAlocacao, deletado: false },
      select: ['id', 'id_item_ambiente'],
    });
    if (alocacao?.id_item_ambiente) {
      await this.medicoesColaboradorService.recalcularProgressoItem(alocacao.id_item_ambiente);
    }
  }

  /**
   * Listar medições com filtros
   */
  async findAll(filters?: {
    id_sessao?: string;
    id_alocacao?: string;
    data_inicio?: Date;
    data_fim?: Date;
    status_pagamento?: StatusPagamentoEnum;
    flag_excedente?: boolean;
  }): Promise<Medicao[]> {
    const query = this.medicaoRepository
      .createQueryBuilder('medicao')
      .leftJoinAndSelect('medicao.alocacao', 'alocacao')
      .leftJoinAndSelect('alocacao.colaborador', 'colaborador')
      .leftJoinAndSelect('alocacao.ambiente', 'ambiente')
      .leftJoinAndSelect('alocacao.item_ambiente', 'item_ambiente')
      .leftJoinAndSelect('item_ambiente.tabelaPreco', 'tabela_preco')
      .where('medicao.deletado = :deletado', { deletado: false });

    if (filters?.id_sessao) {
      query.andWhere('alocacao.id_sessao = :id_sessao', {
        id_sessao: filters.id_sessao,
      });
    }

    if (filters?.id_alocacao) {
      query.andWhere('medicao.id_alocacao = :id_alocacao', {
        id_alocacao: filters.id_alocacao,
      });
    }

    if (filters?.data_inicio) {
      query.andWhere('medicao.created_at >= :data_inicio', {
        data_inicio: filters.data_inicio,
      });
    }

    if (filters?.data_fim) {
      query.andWhere('medicao.created_at <= :data_fim', {
        data_fim: filters.data_fim,
      });
    }

    if (filters?.status_pagamento) {
      query.andWhere('medicao.status_pagamento = :status_pagamento', {
        status_pagamento: filters.status_pagamento,
      });
    }

    if (filters?.flag_excedente !== undefined) {
      query.andWhere('medicao.flag_excedente = :flag_excedente', {
        flag_excedente: filters.flag_excedente,
      });
    }

    return await query
      .orderBy('medicao.created_at', 'DESC')
      .getMany();
  }

  /**
   * Buscar medição por ID
   */
  async findOne(id: string): Promise<Medicao> {
    const medicao = await this.medicaoRepository.findOne({
      where: { id, deletado: false },
      relations: [
        'alocacao',
        'alocacao.colaborador',
        'alocacao.ambiente',
        'alocacao.ambiente.pavimento',
        'alocacao.sessao',
      ],
    });

    if (!medicao) {
      throw new NotFoundException(`Medição com ID ${id} não encontrada`);
    }

    return medicao;
  }

  /**
   * Buscar medições excedentes
   */
  async findExcedentes(): Promise<Medicao[]> {
    return await this.medicaoRepository.find({
      where: {
        flag_excedente: true,
        deletado: false,
      },
      relations: [
        'alocacao',
        'alocacao.colaborador',
        'alocacao.ambiente',
      ],
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Buscar medições pendentes de pagamento
   */
  async findPendentesPagamento(): Promise<Medicao[]> {
    return await this.medicaoRepository.createQueryBuilder('medicao')
      .where('medicao.status_pagamento = :status', { status: StatusPagamentoEnum.ABERTO })
      .andWhere('medicao.deletado = false')
      .leftJoinAndSelect('medicao.alocacao', 'alocacao')
      .leftJoinAndSelect('alocacao.colaborador', 'colaborador')
      .leftJoinAndSelect('alocacao.ambiente', 'ambiente')
      .orderBy('medicao.created_at', 'ASC')
      .getMany();
  }

  /**
   * Atualizar medição
   */
  async update(id: string, updateMedicaoDto: UpdateMedicaoDto): Promise<Medicao> {
    const medicao = await this.findOne(id);
    const statusAnterior = medicao.status_pagamento;

    // Não permitir alterar medição paga
    if (medicao.status_pagamento === StatusPagamentoEnum.PAGO) {
      throw new BadRequestException('Não é possível modificar uma medição já paga');
    }

    // Se alterar qtd_executada, recalcular flag_excedente
    if (updateMedicaoDto.qtd_executada !== undefined) {
      const novaQtd = updateMedicaoDto.qtd_executada;
      const areaRef = updateMedicaoDto.area_planejada || medicao.area_planejada;

      if (areaRef && novaQtd > areaRef) {
        if (!updateMedicaoDto.justificativa && !medicao.justificativa) {
          throw new BadRequestException('Justificativa obrigatória para medição excedente');
        }
        if (!updateMedicaoDto.foto_evidencia_url && !medicao.foto_evidencia_url) {
          throw new BadRequestException('Foto de evidência obrigatória para medição excedente');
        }
        medicao.flag_excedente = true;
      } else {
        medicao.flag_excedente = false;
      }
    }

    Object.assign(medicao, updateMedicaoDto);
    const atualizada = await this.medicaoRepository.save(medicao);

    if (
      statusAnterior !== StatusPagamentoEnum.PAGO &&
      atualizada.status_pagamento === StatusPagamentoEnum.PAGO
    ) {
      await this.notificarRecebivelMarcadoComoPago(atualizada);
    }

    // RF17+RF18: cascade de progresso após atualização
    await this.recalcularProgressoPorAlocacao(atualizada.id_alocacao);
    return atualizada;
  }

  private async notificarRecebivelMarcadoComoPago(medicao: Medicao): Promise<void> {
    const usuarios = await this.usuarioRepository.find({
      where: {
        ativo: true,
        deletado: false,
        id_perfil: In([PerfilEnum.ADMIN, PerfilEnum.GESTOR, PerfilEnum.FINANCEIRO]),
      },
      select: ['id'],
    });

    const idsDestinatarios = Array.from(new Set(usuarios.map((u) => u.id).filter(Boolean)));
    if (idsDestinatarios.length === 0) {
      return;
    }

    const nomeObra = medicao.alocacao?.ambiente?.pavimento?.obra?.nome || 'obra nao identificada';

    await this.notificacoesService.createEmLote(idsDestinatarios, {
      tipo: TipoNotificacaoEnum.CICLO_FATURAMENTO,
      titulo: 'Recebivel marcado como recebido',
      mensagem: `A medicao ${medicao.id} da ${nomeObra} foi marcada como paga no contas a receber.`,
      prioridade: PrioridadeEnum.MEDIA,
      dados_extras: {
        id_medicao: medicao.id,
        id_alocacao: medicao.id_alocacao,
        id_lote_pagamento: medicao.id_lote_pagamento,
        status_pagamento: medicao.status_pagamento,
      },
      id_entidade_relacionada: medicao.id,
      tipo_entidade: 'medicao',
    });
  }

  /**
   * Soft delete de medição
   */
  async remove(id: string): Promise<void> {
    const medicao = await this.findOne(id);

    // Não permitir deletar medição paga
    if (medicao.status_pagamento === StatusPagamentoEnum.PAGO) {
      throw new BadRequestException('Não é possível deletar uma medição já paga');
    }

    medicao.deletado = true;
    await this.medicaoRepository.save(medicao);
    // RF17+RF18: cascade de progresso após remoção
    await this.recalcularProgressoPorAlocacao(medicao.id_alocacao);
  }

  /**
   * Calcular total de quantidade executada por colaborador
   */
  async calcularTotalPorColaborador(
    id_colaborador: string,
    data_inicio?: Date,
    data_fim?: Date,
  ): Promise<{ total: number; count: number }> {
    const query = this.medicaoRepository
      .createQueryBuilder('medicao')
      .leftJoin('medicao.alocacao', 'alocacao')
      .where('alocacao.id_colaborador = :id_colaborador', { id_colaborador })
      .andWhere('medicao.deletado = :deletado', { deletado: false });

    if (data_inicio) {
      query.andWhere('medicao.data_medicao >= :data_inicio', { data_inicio });
    }

    if (data_fim) {
      query.andWhere('medicao.created_at <= :data_fim', { data_fim });
    }

    const medicoes = await query.getMany();

    const total = medicoes.reduce((sum, m) => sum + Number(m.qtd_executada), 0);
    
    return {
      total,
      count: medicoes.length,
    };
  }

  /**
   * Relatório de produtividade
   */
  async relatorioProducao(data_inicio: Date, data_fim: Date) {
    const medicoes = await this.medicaoRepository
      .createQueryBuilder('medicao')
      .leftJoinAndSelect('medicao.alocacao', 'alocacao')
      .leftJoinAndSelect('alocacao.colaborador', 'colaborador')
      .where('medicao.created_at BETWEEN :data_inicio AND :data_fim', {
        data_inicio,
        data_fim,
      })
      .andWhere('medicao.deletado = false')
      .getMany();

    // Agrupar por colaborador
    const producaoPorColaborador = medicoes.reduce((acc, medicao) => {
      const colaboradorId = medicao.alocacao.id_colaborador;
      const colaboradorNome = medicao.alocacao.colaborador.nome_completo;

      if (!acc[colaboradorId]) {
        acc[colaboradorId] = {
          id: colaboradorId,
          nome: colaboradorNome,
          total_executado: 0,
          total_medicoes: 0,
          excedentes: 0,
        };
      }

      acc[colaboradorId].total_executado += Number(medicao.qtd_executada);
      acc[colaboradorId].total_medicoes += 1;
      
      if (medicao.flag_excedente) {
        acc[colaboradorId].excedentes += 1;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(producaoPorColaborador);
  }
}
