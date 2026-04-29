import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { LotePagamento, TipoPagamentoEnum, StatusLoteEnum } from './entities/lote-pagamento.entity';
import { Medicao } from '../medicoes/entities/medicao.entity';
import { TabelaPreco } from '../precos/entities/tabela-preco.entity';
import { AlocacaoTarefa } from '../alocacoes/entities/alocacao-tarefa.entity';
import { Ambiente, Pavimento } from '../pavimentos/entities/pavimento.entity';
import { MedicaoColaborador } from '../medicoes-colaborador/entities/medicao-colaborador.entity';
import { ValeAdiantamento } from '../vale-adiantamento/entities/vale-adiantamento.entity';
import { ValeAdiantamentoParcela } from '../vale-adiantamento/entities/vale-adiantamento-parcela.entity';
import { Usuario } from '../auth/entities/usuario.entity';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

describe('FinanceiroService - RF04 (Workflow de Aprovação)', () => {
  let service: FinanceiroService;
  let mockLoteRepository: any;
  let mockMedicaoRepository: any;
  let mockMedicaoColaboradorRepository: any;

  const createRepositoryMock = () => ({
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
    softDelete: jest.fn(),
  });

  beforeEach(async () => {
    mockLoteRepository = createRepositoryMock();

    mockMedicaoRepository = {
      find: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    mockMedicaoColaboradorRepository = {
      update: jest.fn().mockResolvedValue({ affected: 0 }),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    };

    const mockNotificacoesService = {
      publicarEventoDominio: jest.fn().mockResolvedValue(undefined),
      createEmLote: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceiroService,
        {
          provide: getRepositoryToken(LotePagamento),
          useValue: mockLoteRepository,
        },
        {
          provide: getRepositoryToken(Medicao),
          useValue: mockMedicaoRepository,
        },
        {
          provide: getRepositoryToken(TabelaPreco),
          useValue: createRepositoryMock(),
        },
        {
          provide: getRepositoryToken(AlocacaoTarefa),
          useValue: createRepositoryMock(),
        },
        {
          provide: getRepositoryToken(Ambiente),
          useValue: createRepositoryMock(),
        },
        {
          provide: getRepositoryToken(Pavimento),
          useValue: createRepositoryMock(),
        },
        {
          provide: getRepositoryToken(MedicaoColaborador),
          useValue: mockMedicaoColaboradorRepository,
        },
        {
          provide: getRepositoryToken(ValeAdiantamento),
          useValue: createRepositoryMock(),
        },
        {
          provide: getRepositoryToken(ValeAdiantamentoParcela),
          useValue: createRepositoryMock(),
        },
        {
          provide: getRepositoryToken(Usuario),
          useValue: createRepositoryMock(),
        },
        {
          provide: NotificacoesService,
          useValue: mockNotificacoesService,
        },
      ],
    }).compile();

    service = module.get<FinanceiroService>(FinanceiroService);
  });

  describe('createLote - Workflow Inicial', () => {
    it('✅ deve criar lote com status ABERTO', async () => {
      // Arrange
      const medicoes_ids = ['medicao-1', 'medicao-2'];
      const createDto = {
        descricao: 'Pagamento Quinzenal',
        data_competencia: new Date('2026-02-15'),
        medicoes_ids,
        id_criado_por: 'usuario-1',
      };

      mockMedicaoRepository.find.mockResolvedValue([
        { id: 'medicao-1', status_pagamento: 'ABERTO', valor_calculado: 500 },
        { id: 'medicao-2', status_pagamento: 'ABERTO', valor_calculado: 300 },
      ]);

      const novoLote = {
        id: 'lote-1',
        status: StatusLoteEnum.ABERTO,
        valor_total: 800,
      };

      mockLoteRepository.create.mockReturnValue(novoLote);
      mockLoteRepository.save.mockResolvedValue(novoLote);

      // Act
      const result = await service.createLote(createDto as any);

      // Assert
      expect(result.status).toBe(StatusLoteEnum.ABERTO);
      expect(mockLoteRepository.save).toHaveBeenCalled();
    });

    it('❌ deve lançar erro se medição não está ABERTA', async () => {
      // Arrange
      mockMedicaoRepository.find.mockResolvedValue([
        { id: 'medicao-1', status_pagamento: 'PAGO' },
      ]);

      const createDto = {
        descricao: 'Pagamento Quinzenal',
        data_competencia: new Date('2026-02-15'),
        medicoes_ids: ['medicao-1'],
        id_criado_por: 'usuario-1',
      };

      // Act & Assert
      await expect(service.createLote(createDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('enviarParaAprovacao - Workflow Criador', () => {
    it('✅ deve manter status ABERTO ao enviar para aprovação', async () => {
      // Arrange
      const loteId = 'lote-1';
      mockLoteRepository.findOne.mockResolvedValue({
        id: loteId,
        status: StatusLoteEnum.ABERTO,
      });

      const loteAtualizado = {
        id: loteId,
        status: StatusLoteEnum.ABERTO,
      };

      mockLoteRepository.save.mockResolvedValue(loteAtualizado);

      // Act
      const result = await service.enviarParaAprovacao(loteId);

      // Assert
      expect(result.status).toBe(StatusLoteEnum.ABERTO);
    });
  });

  describe('aprovarLote - Workflow Gestor', () => {
    it('✅ deve aprovar lote mantendo status ABERTO', async () => {
      // Arrange
      const loteId = 'lote-1';
      mockLoteRepository.findOne.mockResolvedValue({
        id: loteId,
        status: StatusLoteEnum.ABERTO,
      });

      const loteAprovado = {
        id: loteId,
        status: StatusLoteEnum.ABERTO,
        id_aprovado_por: 'gestor-1',
      };

      mockLoteRepository.save.mockResolvedValue(loteAprovado);

      // Act
      const result = await service.aprovarLote(loteId, {
        id_aprovado_por: 'gestor-1',
      } as any, 'gestor-1');

      // Assert
      expect(result.status).toBe(StatusLoteEnum.ABERTO);
    });

  });

  describe('processarPagamento - Workflow Financeiro', () => {
    it('✅ deve processar pagamento ABERTO → PAGO', async () => {
      // Arrange
      const loteId = 'lote-1';
      mockLoteRepository.findOne.mockResolvedValue({
        id: loteId,
        status: StatusLoteEnum.ABERTO,
      });

      const lotePago = {
        id: loteId,
        status: StatusLoteEnum.PAGO,
      };

      mockLoteRepository.save.mockResolvedValue(lotePago);
      mockMedicaoRepository.update.mockResolvedValue({ affected: 2 });

      // Act
      const result = await service.processarPagamento(loteId, {
        data_pagamento: new Date(),
        tipo_pagamento: TipoPagamentoEnum.PIX,
        id_processado_por: 'user-1',
      } as any, 'user-1');

      // Assert
      expect(result.status).toBe(StatusLoteEnum.PAGO);
      expect(mockMedicaoRepository.update).toHaveBeenCalled();
    });

    it('❌ deve lançar erro se lote não está ABERTO', async () => {
      // Arrange
      mockLoteRepository.findOne.mockResolvedValue({
        id: 'lote-1',
        status: StatusLoteEnum.CANCELADO,
      });

      // Act & Assert
      await expect(
        service.processarPagamento('lote-1', {
          data_pagamento: new Date(),
          tipo_pagamento: TipoPagamentoEnum.PIX,
          id_processado_por: 'user-1',
        } as any, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelarLote - Reverter Pagamento', () => {
    it('✅ deve cancelar lote e liberar medições', async () => {
      // Arrange
      const loteId = 'lote-1';
      mockLoteRepository.findOne.mockResolvedValue({
        id: loteId,
        status: StatusLoteEnum.ABERTO,
      });

      const loteCancelado = {
        id: loteId,
        status: StatusLoteEnum.CANCELADO,
      };

      mockLoteRepository.save.mockResolvedValue(loteCancelado);
      mockMedicaoRepository.update.mockResolvedValue({ affected: 2 });

      // Act
      const result = await service.cancelarLote(loteId);

      // Assert
      expect(result.status).toBe(StatusLoteEnum.CANCELADO);
      expect(mockMedicaoRepository.update).toHaveBeenCalled();
    });
  });

  describe('dashboard - Resumo Financeiro', () => {
    it('✅ deve retornar dashboard com dados agregados', async () => {
      // Arrange
       const mockQueryBuilder = {
         where: jest.fn().mockReturnThis(),
         andWhere: jest.fn().mockReturnThis(),
         orderBy: jest.fn().mockReturnThis(),
         getMany: jest.fn().mockResolvedValue([
           { id: 'lote-1', status: StatusLoteEnum.PAGO, valor_total: 2000 },
           { id: 'lote-2', status: StatusLoteEnum.PAGO, valor_total: 1500 },
           { id: 'lote-3', status: StatusLoteEnum.ABERTO, valor_total: 1000 },
           { id: 'lote-4', status: StatusLoteEnum.ABERTO, valor_total: 500 },
         ]),
       };
     
       mockLoteRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.dashboard();

      // Assert
      expect(result.total_pago).toBe(3500);
      expect(result.total_pendente).toBe(1500);
    });
  });

  describe('Workflow Completo - Happy Path', () => {
    it('✅ deve executar workflow completo: ABERTO → PAGO', async () => {
      // Arrange - Criar Lote
      const loteId = 'lote-1';
      const medicoes_ids = ['medicao-1'];

      mockMedicaoRepository.find.mockResolvedValueOnce([
        { id: 'medicao-1', status_pagamento: 'ABERTO', valor_calculado: 1000 },
      ]);

      mockLoteRepository.create.mockReturnValue({
        id: loteId,
        status: StatusLoteEnum.ABERTO,
      });
      mockLoteRepository.save.mockResolvedValueOnce({
        id: loteId,
        status: StatusLoteEnum.ABERTO,
      });

      // Arrange - Enviar para Aprovação
      mockLoteRepository.findOne.mockResolvedValueOnce({
        id: loteId,
        status: StatusLoteEnum.ABERTO,
      });
      mockLoteRepository.save.mockResolvedValueOnce({
        id: loteId,
        status: StatusLoteEnum.ABERTO,
      });

      // Arrange - Aprovar
      mockLoteRepository.findOne.mockResolvedValueOnce({
        id: loteId,
        status: StatusLoteEnum.ABERTO,
      });
      mockLoteRepository.save.mockResolvedValueOnce({
        id: loteId,
        status: StatusLoteEnum.ABERTO,
      });

      // Arrange - Processar Pagamento
      mockLoteRepository.findOne.mockResolvedValueOnce({
        id: loteId,
        status: StatusLoteEnum.ABERTO,
      });
      mockLoteRepository.save.mockResolvedValueOnce({
        id: loteId,
        status: StatusLoteEnum.PAGO,
      });

      // Act
      const lote1 = await service.createLote({
        descricao: 'Pagamento',
        data_competencia: new Date(),
        medicoes_ids,
        id_criado_por: 'user-1',
      } as any);

      const lote2 = await service.enviarParaAprovacao(lote1.id);
      const lote3 = await service.aprovarLote(lote2.id, {
        id_aprovado_por: 'gestor-1',
      } as any, 'gestor-1');
      const lote4 = await service.processarPagamento(lote3.id, {
        data_pagamento: new Date(),
        tipo_pagamento: TipoPagamentoEnum.PIX,
        id_processado_por: 'user-1',
      } as any, 'user-1');

      // Assert
      expect(lote1.status).toBe(StatusLoteEnum.ABERTO);
      expect(lote2.status).toBe(StatusLoteEnum.ABERTO);
      expect(lote3.status).toBe(StatusLoteEnum.ABERTO);
      expect(lote4.status).toBe(StatusLoteEnum.PAGO);
    });
  });
});
