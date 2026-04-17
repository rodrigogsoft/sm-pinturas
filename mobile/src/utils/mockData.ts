// Mock data for development and testing
import { Obra, Colaborador } from '../types';

export const MOCK_OBRAS: Obra[] = [
  {
    id_obra: '1',
    nome: 'Pintura Residencial - Apto 501',
    endereco: 'Rua Principal, 1000 - São Paulo, SP',
    data_inicio: '2024-01-15',
    data_previsao_termino: '2024-02-15',
    status: 'em_progresso',
    valor_contrato: 15000,
    area_total: 250,
  },
  {
    id_obra: '2',
    nome: 'Pintura Comercial - Escritório',
    endereco: 'Av. Paulista, 2000 - São Paulo, SP',
    data_inicio: '2024-02-01',
    data_previsao_termino: '2024-03-01',
    status: 'em_progresso',
    valor_contrato: 25000,
    area_total: 400,
  },
  {
    id_obra: '3',
    nome: 'Restauração - Fachada',
    endereco: 'Rua Augusta, 500 - São Paulo, SP',
    data_inicio: '2024-01-01',
    data_previsao_termino: '2024-02-01',
    status: 'pausada',
    valor_contrato: 40000,
    area_total: 600,
  },
];

export const MOCK_COLABORADORES: Colaborador[] = [
  {
    id_colaborador: '1',
    nome: 'João da Silva',
    funcao: 'Pintor Master',
    telefone: '(11) 98765-4321',
    ativo: true,
  },
  {
    id_colaborador: '2',
    nome: 'Maria Santos',
    funcao: 'Aprendiz',
    telefone: '(11) 99876-5432',
    ativo: true,
  },
  {
    id_colaborador: '3',
    nome: 'Pedro Oliveira',
    funcao: 'Encarregado',
    telefone: '(11) 97654-3210',
    ativo: true,
  },
];
