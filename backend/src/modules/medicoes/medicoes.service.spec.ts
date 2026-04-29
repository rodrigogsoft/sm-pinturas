import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { MedicoesService } from './medicoes.service';
import { Medicao } from './entities/medicao.entity';

describe('MedicoesService - RF08 (Validação de Excedentes)', () => {
  let service: MedicoesService;
  let mockMedicaoRepository: any;

  beforeEach(async () => {
    mockMedicaoRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicoesService,
        {
          provide: getRepositoryToken(Medicao),
          useValue: mockMedicaoRepository,
        },
      ],
    }).compile();

    service = module.get<MedicoesService>(MedicoesService);
  });

  describe('create - RF08 (Validação de Excedentes)', () => {
    it('✅ deve criar medição ABERTA quando dentro da área planejada', async () => {
      // Arrange
      const createDto = {
        id_alocacao: 'uuid-alocacao',
        area_planejada: 50.0,
        qtd_executada: 40.0,
        data_medicao: new Date('2026-02-15'),
      };

      const novaMedicao = {
        id: 'uuid-medicao-1',
        ...createDto,
        flag_excedente: false,
        status_pagamento: 'ABERTO',
      };

      mockMedicaoRepository.create.mockReturnValue(novaMedicao);
      mockMedicaoRepository.save.mockResolvedValue(novaMedicao);

      // Act
      const mockUsuario = { id: 'user-id-1', id_perfil: 2 };
      const result = await service.create(createDto as any, mockUsuario);

      // Assert
      expect(result.flag_excedente).toBe(false);
      expect(result.status_pagamento).toBe('ABERTO');
    });

    it('❌ deve lançar erro se excedente SEM justificativa', async () => {
      // Arrange
      const createDto = {
        id_alocacao: 'uuid-alocacao',
        area_planejada: 50.0,
        qtd_executada: 60.0,
        data_medicao: new Date('2026-02-15'),
        justificativa: '',
        foto_evidencia_url: 'https://evidencia.jpg',
      };

      // Act & Assert
      const mockUsuario = { id: 'user-id-1', id_perfil: 2 };
      await expect(service.create(createDto as any, mockUsuario)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('❌ deve lançar erro se excedente SEM foto', async () => {
      // Arrange
      const createDto = {
        id_alocacao: 'uuid-alocacao',
        area_planejada: 50.0,
        qtd_executada: 60.0,
        data_medicao: new Date('2026-02-15'),
        justificativa: 'Motivo do excedente',
        foto_evidencia_url: '',
      };

      // Act & Assert
      const mockUsuario = { id: 'user-id-1', id_perfil: 2 };
      await expect(service.create(createDto as any, mockUsuario)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('✅ deve criar medição com flag_excedente=true se atender RF08', async () => {
      // Arrange
      const createDto = {
        id_alocacao: 'uuid-alocacao',
        area_planejada: 50.0,
        qtd_executada: 65.0,
        data_medicao: new Date('2026-02-15'),
        justificativa: 'Motivo valido',
        foto_evidencia_url: 'https://evidencia.jpg',
      };

      const novaMedicao = {
        id: 'uuid-medicao-2',
        ...createDto,
        flag_excedente: true,
        status_pagamento: 'ABERTO',
      };

      mockMedicaoRepository.create.mockReturnValue(novaMedicao);
      mockMedicaoRepository.save.mockResolvedValue(novaMedicao);

      // Act
      const mockUsuario = { id: 'user-id-1', id_perfil: 2 };
      const result = await service.create(createDto as any, mockUsuario);

      // Assert
      expect(result.flag_excedente).toBe(true);
    });
  });

  describe('relatorioProducao - Agregação', () => {
    it('✅ deve gerar relatório de produção por colaborador', async () => {
      // Arrange
      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            qtd_executada: 20,
            flag_excedente: false,
            alocacao: {
              id_colaborador: 'colab-1',
              colaborador: { nome_completo: 'João Silva' },
            },
          },
          {
            qtd_executada: 25,
            flag_excedente: true,
            alocacao: {
              id_colaborador: 'colab-1',
              colaborador: { nome_completo: 'João Silva' },
            },
          },
          {
            qtd_executada: 15,
            flag_excedente: false,
            alocacao: {
              id_colaborador: 'colab-2',
              colaborador: { nome_completo: 'Maria Santos' },
            },
          },
        ]),
      };

      mockMedicaoRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.relatorioProducao(
        new Date('2026-02-01'),
        new Date('2026-02-07'),
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].total_executado).toBe(45);
      expect(result[0].excedentes).toBe(1);
    });
  });

  describe('findPendentesPagamento', () => {
    it('✅ deve retornar medições com status ABERTO', async () => {
      // Arrange
      mockMedicaoRepository.find.mockResolvedValue([
        {
          id: 'medicao-1',
          status_pagamento: 'ABERTO',
          qtd_executada: 20.0,
        },
      ]);

      // Act
      const result = await service.findPendentesPagamento();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].status_pagamento).toBe('ABERTO');
    });
  });

  describe('findExcedentes', () => {
    it('✅ deve listar medições excedentes', async () => {
      // Arrange
      mockMedicaoRepository.find.mockResolvedValue([
        {
          id: 'medicao-1',
          flag_excedente: true,
          justificativa: 'Motivo 1',
        },
        {
          id: 'medicao-2',
          flag_excedente: true,
          justificativa: 'Motivo 2',
        },
      ]);

      // Act
      const result = await service.findExcedentes();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((m) => m.flag_excedente)).toBe(true);
    });
  });
});
