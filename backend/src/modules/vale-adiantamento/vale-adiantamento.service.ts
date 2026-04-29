import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { CreateValeAdiantamentoDto } from './dto/create-vale-adiantamento.dto';
import { AprovarValeAdiantamentoDto } from './dto/aprovar-vale-adiantamento.dto';
import { DescontarValeAdiantamentoDto } from './dto/descontar-vale-adiantamento.dto';
import {
  StatusValeAdiantamentoEnum,
  ValeAdiantamento,
} from './entities/vale-adiantamento.entity';
import { ValeAdiantamentoParcela } from './entities/vale-adiantamento-parcela.entity';
import { Colaborador } from '../colaboradores/entities/colaborador.entity';
import { Obra } from '../obras/entities/obra.entity';
import { Usuario } from '../auth/entities/usuario.entity';
import { StatusParcelaValeEnum } from './entities/vale-adiantamento-parcela.entity';

@Injectable()
export class ValeAdiantamentoService {
  private readonly limiteSaldoDevedorPadrao = Number(
    process.env.VALE_ADIANTAMENTO_LIMITE_PADRAO || 3000,
  );

  constructor(
    @InjectRepository(ValeAdiantamento)
    private readonly valesRepository: Repository<ValeAdiantamento>,
    @InjectRepository(ValeAdiantamentoParcela)
    private readonly parcelasRepository: Repository<ValeAdiantamentoParcela>,
    @InjectRepository(Colaborador)
    private readonly colaboradoresRepository: Repository<Colaborador>,
    @InjectRepository(Obra)
    private readonly obrasRepository: Repository<Obra>,
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  async create(createDto: CreateValeAdiantamentoDto): Promise<ValeAdiantamento> {
    const [colaborador, obra, aprovador] = await Promise.all([
      this.colaboradoresRepository.findOne({
        where: { id: createDto.id_colaborador, deletado: false },
      }),
      createDto.id_obra
        ? this.obrasRepository.findOne({ where: { id: createDto.id_obra, deletado: false } })
        : Promise.resolve(null),
      createDto.id_aprovado_por
        ? this.usuariosRepository.findOne({ where: { id: createDto.id_aprovado_por, deletado: false } })
        : Promise.resolve(null),
    ]);

    if (!colaborador) {
      throw new NotFoundException(`Colaborador ${createDto.id_colaborador} nao encontrado`);
    }

    if (createDto.id_obra && !obra) {
      throw new NotFoundException(`Obra ${createDto.id_obra} nao encontrada`);
    }

    if (createDto.id_aprovado_por && !aprovador) {
      throw new NotFoundException(`Usuario aprovador ${createDto.id_aprovado_por} nao encontrado`);
    }

    // RN08: bloqueio por limite de saldo devedor do colaborador.
    const saldoAtual = await this.getSaldoDevedorByColaborador(createDto.id_colaborador);
    const valorNovoVale = Number(createDto.valor_aprovado ?? createDto.valor_solicitado ?? 0);
    const saldoProjetado = saldoAtual.saldo_devedor + valorNovoVale;

    if (saldoProjetado > saldoAtual.limite_saldo_devedor) {
      throw new BadRequestException({
        message: 'RN08: Limite de saldo devedor excedido para novo vale adiantamento',
        codigo: 'LIMITE_SALDO_DEVEDOR_EXCEDIDO',
        saldo_atual: saldoAtual.saldo_devedor,
        valor_solicitado: valorNovoVale,
        saldo_projetado: saldoProjetado,
        limite_saldo_devedor: saldoAtual.limite_saldo_devedor,
      });
    }

    const vale = this.valesRepository.create({
      id_colaborador: createDto.id_colaborador,
      id_obra: createDto.id_obra ?? null,
      data_solicitacao: createDto.data_solicitacao ? new Date(createDto.data_solicitacao) : new Date(),
      data_aprovacao: createDto.id_aprovado_por ? new Date() : null,
      valor_solicitado: createDto.valor_solicitado,
      valor_aprovado: createDto.valor_aprovado ?? null,
      status: createDto.id_aprovado_por
        ? StatusValeAdiantamentoEnum.APROVADO
        : StatusValeAdiantamentoEnum.SOLICITADO,
      motivo: createDto.motivo ?? null,
      observacoes: createDto.observacoes ?? null,
      id_aprovado_por: createDto.id_aprovado_por ?? null,
    });

    const valeSalvo = await this.valesRepository.save(vale);

    if (createDto.parcelas?.length && createDto.qtd_parcelas_auto) {
      throw new BadRequestException(
        'Informe parcelas manuais ou qtd_parcelas_auto, nao ambos ao mesmo tempo',
      );
    }

    if (createDto.parcelas?.length) {
      const parcelas = createDto.parcelas.map((parcela) =>
        this.parcelasRepository.create({
          id_vale_adiantamento: valeSalvo.id,
          numero_parcela: parcela.numero_parcela,
          valor_parcela: parcela.valor_parcela,
          data_prevista_desconto: new Date(parcela.data_prevista_desconto),
          observacoes: parcela.observacoes ?? null,
        }),
      );

      await this.parcelasRepository.save(parcelas);
    } else if (createDto.qtd_parcelas_auto) {
      const valorBase = Number(createDto.valor_aprovado ?? createDto.valor_solicitado ?? 0);

      if (valorBase <= 0) {
        throw new BadRequestException('Valor base invalido para geracao automatica de parcelas');
      }

      const dataBase = createDto.data_primeira_parcela
        ? new Date(createDto.data_primeira_parcela)
        : new Date();

      const parcelasAuto = this.gerarParcelasAutomaticas(
        valeSalvo.id,
        valorBase,
        createDto.qtd_parcelas_auto,
        dataBase,
      );

      await this.parcelasRepository.save(parcelasAuto);
    }

    return this.valesRepository.findOneOrFail({
      where: { id: valeSalvo.id },
      relations: ['colaborador', 'obra', 'aprovado_por', 'parcelas'],
    });
  }

  async getSaldoDevedorByColaborador(id_colaborador: string): Promise<{
    id_colaborador: string;
    valor_liberado: number;
    valor_descontado: number;
    saldo_devedor: number;
    limite_saldo_devedor: number;
  }> {
    const colaborador = await this.colaboradoresRepository.findOne({
      where: { id: id_colaborador, deletado: false },
    });

    if (!colaborador) {
      throw new NotFoundException(`Colaborador ${id_colaborador} nao encontrado`);
    }

    const statusComSaldo: StatusValeAdiantamentoEnum[] = [
      StatusValeAdiantamentoEnum.SOLICITADO,
      StatusValeAdiantamentoEnum.APROVADO,
      StatusValeAdiantamentoEnum.PAGO,
      StatusValeAdiantamentoEnum.PARCIALMENTE_COMPENSADO,
    ];

    const valesComSaldo = await this.valesRepository.find({
      where: {
        id_colaborador,
        deletado: false,
        status: In(statusComSaldo),
      },
      select: ['id', 'valor_solicitado', 'valor_aprovado'],
    });

    const valorLiberado = valesComSaldo.reduce((acc, vale) => {
      const valorBase = Number(vale.valor_aprovado ?? vale.valor_solicitado ?? 0);
      return acc + valorBase;
    }, 0);

    const idsVales = valesComSaldo.map((vale) => vale.id);

    const parcelasDescontadas = idsVales.length
      ? await this.parcelasRepository.find({
          where: {
            id_vale_adiantamento: In(idsVales),
            status: StatusParcelaValeEnum.DESCONTADO,
            deletado: false,
          },
          select: ['valor_parcela'],
        })
      : [];

    const valorDescontado = parcelasDescontadas.reduce(
      (acc, parcela) => acc + Number(parcela.valor_parcela || 0),
      0,
    );

    const saldoDevedor = Math.max(valorLiberado - valorDescontado, 0);

    return {
      id_colaborador,
      valor_liberado: Number(valorLiberado.toFixed(2)),
      valor_descontado: Number(valorDescontado.toFixed(2)),
      saldo_devedor: Number(saldoDevedor.toFixed(2)),
      limite_saldo_devedor: this.limiteSaldoDevedorPadrao,
    };
  }

  async findAll(): Promise<ValeAdiantamento[]> {
    return this.valesRepository.find({
      where: { deletado: false },
      relations: ['colaborador', 'obra', 'aprovado_por', 'parcelas'],
      order: { created_at: 'DESC' },
    });
  }

  async findByColaborador(id_colaborador: string): Promise<ValeAdiantamento[]> {
    return this.valesRepository.find({
      where: { id_colaborador, deletado: false },
      relations: ['obra', 'aprovado_por', 'parcelas'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ValeAdiantamento> {
    const record = await this.valesRepository.findOne({
      where: { id, deletado: false },
      relations: ['colaborador', 'obra', 'aprovado_por', 'parcelas'],
    });
    if (!record) {
      throw new NotFoundException(`Vale adiantamento ${id} nao encontrado`);
    }
    return record;
  }

  async aprovar(id: string, dto: AprovarValeAdiantamentoDto): Promise<ValeAdiantamento> {
    const record = await this.findOne(id);
    if (record.status !== StatusValeAdiantamentoEnum.SOLICITADO) {
      throw new BadRequestException('Apenas vales com status SOLICITADO podem ser aprovados');
    }
    if (!dto.id_aprovado_por) {
      throw new BadRequestException('id_aprovado_por nao informado para aprovacao do vale');
    }
    const aprovador = await this.usuariosRepository.findOne({
      where: { id: dto.id_aprovado_por, deletado: false },
    });
    if (!aprovador) {
      throw new NotFoundException(`Usuario ${dto.id_aprovado_por} nao encontrado`);
    }
    record.status = StatusValeAdiantamentoEnum.APROVADO;
    record.id_aprovado_por = dto.id_aprovado_por;
    record.data_aprovacao = new Date();
    record.valor_aprovado = dto.valor_aprovado;
    return this.valesRepository.save(record);
  }

  async lancar(id: string): Promise<ValeAdiantamento> {
    const record = await this.findOne(id);

    if (record.status !== StatusValeAdiantamentoEnum.APROVADO) {
      throw new BadRequestException('Apenas vales aprovados podem ser lancados para desconto');
    }

    record.status = StatusValeAdiantamentoEnum.PAGO;
    return this.valesRepository.save(record);
  }

  async cancelar(id: string): Promise<ValeAdiantamento> {
    const record = await this.findOne(id);
    if (
      record.status === StatusValeAdiantamentoEnum.COMPENSADO ||
      record.status === StatusValeAdiantamentoEnum.CANCELADO
    ) {
      throw new BadRequestException('Vale ja esta compensado ou cancelado');
    }
    record.status = StatusValeAdiantamentoEnum.CANCELADO;
    return this.valesRepository.save(record);
  }

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.findOne(id);

    if (record.status === StatusValeAdiantamentoEnum.COMPENSADO) {
      throw new BadRequestException('Nao e possivel apagar vale compensado');
    }

    const possuiParcelasDescontadas = (record.parcelas || []).some(
      (parcela) => !parcela.deletado && parcela.status === StatusParcelaValeEnum.DESCONTADO,
    );

    if (possuiParcelasDescontadas) {
      throw new BadRequestException('Nao e possivel apagar vale com parcelas ja descontadas');
    }

    record.deletado = true;
    await this.valesRepository.save(record);

    await this.parcelasRepository.update(
      { id_vale_adiantamento: record.id, deletado: false },
      { deletado: true },
    );

    return { message: 'Vale apagado com sucesso' };
  }

  async getResumoByVale(id: string): Promise<{
    id_vale_adiantamento: string;
    status: StatusValeAdiantamentoEnum;
    valor_base: number;
    valor_descontado: number;
    saldo_devedor: number;
    parcelas_pendentes: number;
    parcelas_descontadas: number;
    parcelas_canceladas: number;
  }> {
    const vale = await this.findOne(id);
    const parcelas = (vale.parcelas || []).filter((p) => !p.deletado);

    const valorBase = Number(vale.valor_aprovado ?? vale.valor_solicitado ?? 0);
    const valorDescontado = parcelas
      .filter((p) => p.status === StatusParcelaValeEnum.DESCONTADO)
      .reduce((sum, p) => sum + Number(p.valor_parcela || 0), 0);

    return {
      id_vale_adiantamento: vale.id,
      status: vale.status,
      valor_base: Number(valorBase.toFixed(2)),
      valor_descontado: Number(valorDescontado.toFixed(2)),
      saldo_devedor: Number(Math.max(valorBase - valorDescontado, 0).toFixed(2)),
      parcelas_pendentes: parcelas.filter((p) => p.status === StatusParcelaValeEnum.PENDENTE).length,
      parcelas_descontadas: parcelas.filter((p) => p.status === StatusParcelaValeEnum.DESCONTADO).length,
      parcelas_canceladas: parcelas.filter((p) => p.status === StatusParcelaValeEnum.CANCELADO).length,
    };
  }

  async descontar(id: string, dto: DescontarValeAdiantamentoDto): Promise<ValeAdiantamento> {
    const vale = await this.findOne(id);

    if (
      ![
        StatusValeAdiantamentoEnum.PAGO,
        StatusValeAdiantamentoEnum.PARCIALMENTE_COMPENSADO,
        StatusValeAdiantamentoEnum.APROVADO,
      ].includes(vale.status)
    ) {
      throw new BadRequestException('Status atual do vale nao permite desconto');
    }

    let saldoParaDesconto = Number(dto.valor_desconto || 0);
    if (saldoParaDesconto <= 0) {
      throw new BadRequestException('valor_desconto deve ser maior que zero');
    }

    const dataDesconto = dto.data_desconto ? new Date(dto.data_desconto) : new Date();

    const parcelasPendentes = (vale.parcelas || [])
      .filter((p) => !p.deletado && p.status === StatusParcelaValeEnum.PENDENTE)
      .sort((a, b) => a.numero_parcela - b.numero_parcela);

    if (parcelasPendentes.length === 0) {
      throw new BadRequestException('Nao ha parcelas pendentes para aplicar desconto');
    }

    for (const parcela of parcelasPendentes) {
      if (saldoParaDesconto <= 0) {
        break;
      }

      const valorParcela = Number(parcela.valor_parcela || 0);
      if (valorParcela <= 0) {
        continue;
      }

      if (saldoParaDesconto >= valorParcela) {
        parcela.status = StatusParcelaValeEnum.DESCONTADO;
        parcela.data_desconto_realizado = dataDesconto;
        parcela.id_lote_pagamento = dto.id_lote_pagamento ?? parcela.id_lote_pagamento;
        parcela.observacoes = [parcela.observacoes, dto.observacoes]
          .filter(Boolean)
          .join(' | ');
        await this.parcelasRepository.save(parcela);

        saldoParaDesconto -= valorParcela;
        continue;
      }

      const descontoParcial = Number(saldoParaDesconto.toFixed(2));
      const saldoResidual = Number((valorParcela - descontoParcial).toFixed(2));

      if (descontoParcial > 0) {
        parcela.valor_parcela = descontoParcial;
        parcela.status = StatusParcelaValeEnum.DESCONTADO;
        parcela.data_desconto_realizado = dataDesconto;
        parcela.id_lote_pagamento = dto.id_lote_pagamento ?? parcela.id_lote_pagamento;
        parcela.observacoes = [parcela.observacoes, dto.observacoes, 'Desconto parcial manual']
          .filter(Boolean)
          .join(' | ');
        await this.parcelasRepository.save(parcela);

        const maxNumeroParcela = (vale.parcelas || [])
          .filter((p) => !p.deletado)
          .reduce((max, p) => Math.max(max, p.numero_parcela), 0);

        const parcelaResidual = this.parcelasRepository.create({
          id_vale_adiantamento: vale.id,
          numero_parcela: maxNumeroParcela + 1,
          valor_parcela: saldoResidual,
          data_prevista_desconto: dataDesconto,
          status: StatusParcelaValeEnum.PENDENTE,
          observacoes: 'Parcela residual gerada apos desconto manual parcial',
        });

        await this.parcelasRepository.save(parcelaResidual);
        vale.parcelas = [...(vale.parcelas || []), parcelaResidual];
      }

      saldoParaDesconto = 0;
    }

    if (saldoParaDesconto > 0) {
      throw new BadRequestException({
        message: 'Valor de desconto maior que o saldo pendente do vale',
        codigo: 'DESCONTO_MAIOR_QUE_SALDO',
        valor_nao_utilizado: Number(saldoParaDesconto.toFixed(2)),
      });
    }

    await this.atualizarStatusValePorParcelas(vale.id);
    return this.findOne(vale.id);
  }

  private gerarParcelasAutomaticas(
    idValeAdiantamento: string,
    valorTotal: number,
    quantidadeParcelas: number,
    dataPrimeiraParcela: Date,
  ): ValeAdiantamentoParcela[] {
    const valorBaseParcela = Number((valorTotal / quantidadeParcelas).toFixed(2));
    const totalBase = Number((valorBaseParcela * quantidadeParcelas).toFixed(2));
    const ajusteCentavos = Number((valorTotal - totalBase).toFixed(2));

    const parcelas: ValeAdiantamentoParcela[] = [];
    for (let i = 1; i <= quantidadeParcelas; i++) {
      const dataParcela = new Date(dataPrimeiraParcela);
      dataParcela.setMonth(dataParcela.getMonth() + (i - 1));

      const valorParcela = i === quantidadeParcelas
        ? Number((valorBaseParcela + ajusteCentavos).toFixed(2))
        : valorBaseParcela;

      parcelas.push(
        this.parcelasRepository.create({
          id_vale_adiantamento: idValeAdiantamento,
          numero_parcela: i,
          valor_parcela: valorParcela,
          data_prevista_desconto: dataParcela,
          status: StatusParcelaValeEnum.PENDENTE,
          observacoes: 'Parcela gerada automaticamente',
        }),
      );
    }

    return parcelas;
  }

  private async atualizarStatusValePorParcelas(idVale: string): Promise<void> {
    const vale = await this.valesRepository.findOne({
      where: { id: idVale, deletado: false },
      relations: ['parcelas'],
    });

    if (!vale || vale.status === StatusValeAdiantamentoEnum.CANCELADO) {
      return;
    }

    const parcelasAtivas = (vale.parcelas || []).filter((p) => !p.deletado);
    const totalDescontado = parcelasAtivas
      .filter((p) => p.status === StatusParcelaValeEnum.DESCONTADO)
      .reduce((sum, p) => sum + Number(p.valor_parcela || 0), 0);

    const totalPendente = parcelasAtivas
      .filter((p) => p.status === StatusParcelaValeEnum.PENDENTE)
      .reduce((sum, p) => sum + Number(p.valor_parcela || 0), 0);

    const valorBase = Number(vale.valor_aprovado ?? vale.valor_solicitado ?? 0);

    if (totalDescontado > 0 && (totalPendente <= 0 || totalDescontado >= valorBase)) {
      vale.status = StatusValeAdiantamentoEnum.COMPENSADO;
    } else if (totalDescontado > 0) {
      vale.status = StatusValeAdiantamentoEnum.PARCIALMENTE_COMPENSADO;
    } else if (vale.status === StatusValeAdiantamentoEnum.APROVADO) {
      vale.status = StatusValeAdiantamentoEnum.PAGO;
    }

    await this.valesRepository.save(vale);
  }
}
