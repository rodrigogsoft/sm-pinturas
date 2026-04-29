import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { AlocacoesService } from './alocacoes.service';
import { AlocacaoTarefa } from './entities/alocacao-tarefa.entity';
import { SessaoDiaria } from '../sessoes/entities/sessao-diaria.entity';
import { Colaborador } from '../colaboradores/entities/colaborador.entity';

describe('AlocacoesService - RF07 (Controle 1:1)', () => {
  let service: AlocacoesService;
  let mockAlocacaoRepository: any;
  let mockSessaoRepository: any;
  let mockColaboradorRepository: any;

  beforeEach(async () => {
    // Mocks dos repositories
    mockAlocacaoRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockSessaoRepository = {
      findOne: jest.fn(),
    };

    mockColaboradorRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlocacoesService,
        {
          provide: getRepositoryToken(AlocacaoTarefa),
          useValue: mockAlocacaoRepository,
        },
        {
          provide: getRepositoryToken(SessaoDiaria),
          useValue: mockSessaoRepository,
        },
        {
          provide: getRepositoryToken(Colaborador),
          useValue: mockColaboradorRepository,
        },
      ],
    }).compile();

    service = module.get<AlocacoesService>(AlocacoesService);
  });

  describe('create - Regra 1:1', () => {
    it('✅ deve criar alocação com sucesso quando ambiente não está ocupado', async () => {
      // Arrange
      const id_sessao = 'uuid-sessao';
      const id_ambiente = 'uuid-ambiente';
      const id_colaborador = 'uuid-colab-1';

      mockAlocacaoRepository.findOne.mockResolvedValue(null); // Ambiente livre
      mockSessaoRepository.findOne.mockResolvedValue({ id: id_sessao });
      mockColaboradorRepository.findOne.mockResolvedValue({
        id: id_colaborador,
        nome_completo: 'João Silva',
      });

      const createDto = {
        id_sessao,
        id_ambiente,
        id_colaborador,
        id_servico_catalogo: 'uuid-servico',
        hora_inicio: new Date(),
      };

      const novaAlocacao = {
        id: 'uuid-alocacao',
        ...createDto,
        status: 'EM_ANDAMENTO',
      };

      mockAlocacaoRepository.create.mockReturnValue(novaAlocacao);
      mockAlocacaoRepository.save.mockResolvedValue(novaAlocacao);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toEqual(novaAlocacao);
      // Verificar que verificou se ambiente está ocupado
      expect(mockAlocacaoRepository.findOne).toHaveBeenCalled();
    });

    it('❌ deve lançar ConflictException quando ambiente está ocupado', async () => {
      // Arrange
      const id_sessao = 'uuid-sessao';
      const id_ambiente = 'uuid-ambiente';
      const id_colaborador_novo = 'uuid-colab-novo';
      const id_colaborador_atual = 'uuid-colab-atual';

      mockAlocacaoRepository.findOne.mockResolvedValue({
        id: 'uuid-alocacao-ativa',
        id_colaborador: id_colaborador_atual,
        colaborador: {
          id: id_colaborador_atual,
          nome_completo: 'Maria Santos',
        },
        status: 'EM_ANDAMENTO',
      });

      const createDto = {
        id_sessao,
        id_ambiente,
        id_colaborador: id_colaborador_novo,
        id_servico_catalogo: 'uuid-servico',
        hora_inicio: new Date(),
      };

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        /Ambiente em uso|ocupado/i,
      );
    });

    it('✅ deve permitir múltiplas alocações em ambientes diferentes', async () => {
      // Arrange
      const colab = { id: 'uuid-colab', nome_completo: 'João' };
      const sessao = { id: 'uuid-sessao' };

      // Primeira alocação
      mockAlocacaoRepository.findOne.mockResolvedValueOnce(null);
      mockAlocacaoRepository.create.mockReturnValueOnce({
        id: 'alocacao-1',
        id_ambiente: 'ambiente-1',
      });
      mockAlocacaoRepository.save.mockResolvedValueOnce({
        id: 'alocacao-1',
        id_ambiente: 'ambiente-1',
      });

      // Segunda alocação (mesmo colaborador, ambiente diferente)
      mockAlocacaoRepository.findOne.mockResolvedValueOnce(null);
      mockAlocacaoRepository.create.mockReturnValueOnce({
        id: 'alocacao-2',
        id_ambiente: 'ambiente-2',
      });
      mockAlocacaoRepository.save.mockResolvedValueOnce({
        id: 'alocacao-2',
        id_ambiente: 'ambiente-2',
      });

      const result1 = await service.create({
        id_sessao: 'uuid-sessao',
        id_ambiente: 'ambiente-1',
        id_colaborador: colab.id,
        id_servico_catalogo: 'uuid-servico',
        hora_inicio: new Date(),
      });

      const result2 = await service.create({
        id_sessao: 'uuid-sessao',
        id_ambiente: 'ambiente-2',
        id_colaborador: colab.id,
        id_servico_catalogo: 'uuid-servico',
        hora_inicio: new Date(),
      });

      // Assert
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.id_ambiente).not.toBe(result2.id_ambiente);
    });
  });

  describe('verificarAmbienteOcupado', () => {
    it('✅ deve retornar false quando ambiente está livre', async () => {
      // Arrange
      mockAlocacaoRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.verificarAmbienteOcupado('uuid-ambiente');

      // Assert
      expect(result).toBeDefined();
      expect(result.ocupado).toBe(false);
    });

    it('✅ deve retornar true e dados do ocupante quando ambiente ocupado', async () => {
      // Arrange
      const alocacaoAtiva = {
        id: 'uuid-alocacao',
        id_colaborador: 'uuid-colab',
        colaborador: {
          nome_completo: 'Maria Santos',
        },
      };

      mockAlocacaoRepository.findOne.mockResolvedValue(alocacaoAtiva);

      // Act
      const result = await service.verificarAmbienteOcupado('uuid-ambiente');

      // Assert
      expect(result.ocupado).toBe(true);
      if (result.alocacao) {
        expect((result.alocacao as any).colaborador?.nome_completo).toBe('Maria Santos');
      }
    });
  });

  describe('concluir', () => {
    it('✅ deve marcar alocação como concluída', async () => {
      // Arrange
      const alocacaoId = 'uuid-alocacao';
      mockAlocacaoRepository.findOne.mockResolvedValue({
        id: alocacaoId,
        status: 'EM_ANDAMENTO',
      });

      const updatedAlocacao = {
        id: alocacaoId,
        status: 'CONCLUIDO',
        hora_fim: new Date(),
      };

      mockAlocacaoRepository.save.mockResolvedValue(updatedAlocacao);

      // Act
      const result = await service.concluir(alocacaoId, {
        hora_fim: new Date(),
      });

      // Assert
      expect(result.status).toBe('CONCLUIDO');
    });

    it('❌ deve lançar erro se alocação não existe', async () => {
      // Arrange
      mockAlocacaoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.concluir('uuid-invalido', { hora_fim: new Date() }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('pausar / retomar', () => {
    it('✅ deve pausar alocação', async () => {
      // Arrange
      mockAlocacaoRepository.findOne.mockResolvedValue({
        id: 'uuid-alocacao',
        status: 'EM_ANDAMENTO',
      });

      const pausedAlocacao = {
        id: 'uuid-alocacao',
        status: 'PAUSADO',
      };

      mockAlocacaoRepository.save.mockResolvedValue(pausedAlocacao);

      // Act
      const result = await service.pausar('uuid-alocacao');

      // Assert
      expect(result.status).toBe('PAUSADO');
    });

    it('✅ deve retomar alocação pausada', async () => {
      // Arrange
      const alocacaoPausada = {
        id: 'uuid-alocacao',
        id_ambiente: 'uuid-ambiente',
        status: 'PAUSADO',
        sessao: {},
        ambiente: {},
        colaborador: { nome_completo: 'João Silva' },
      };

      // Resetar o mock primeiro
      mockAlocacaoRepository.findOne.mockReset();
      
      // Mock findOne chamadas:
      // 1ª chamada: findOne(id) em retomar() - retorna alocação pausada
      // 2ª chamada: findOne(id_ambiente) em verificarAmbienteOcupado() - retorna null (ambiente livre)
      mockAlocacaoRepository.findOne
        .mockResolvedValueOnce(alocacaoPausada) // retomar -> findOne(id)
        .mockResolvedValueOnce(null); // verificarAmbienteOcupado -> findOne(id_ambiente)

      mockAlocacaoRepository.save.mockResolvedValue({
        id: 'uuid-alocacao',
        status: 'EM_ANDAMENTO',
      });

      // Act
      const result = await service.retomar('uuid-alocacao');

      // Assert
      expect(result.status).toBe('EM_ANDAMENTO');
    });
  });
});
