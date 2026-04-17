// Mock serviço para desenvolvimento/teste sem backend

export const mockMedicoes = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    id_alocacao: 'alloc-001',
    nomeColaborador: 'João Silva',
    nomeAmbiente: 'Cozinha',
    area_planejada: 20,
    qtd_executada: 25, // Excedente
    valor_total: 2500,
    status_pagamento: 'ABERTO',
    flag_excedente: true,
    justificativa: 'Parede dobrada aumentou execução',
    foto_evidencia_url: 'https://via.placeholder.com/400x300?text=Excedente',
    data_medicao: '2026-02-01T10:00:00Z',
    nome_obra: 'Reforma Casa - Rua A'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    id_alocacao: 'alloc-002',
    nomeColaborador: 'Maria Santos',
    nomeAmbiente: 'Banheiro',
    area_planejada: 10,
    qtd_executada: 10,
    valor_total: 1200,
    status_pagamento: 'PAGO',
    flag_excedente: false,
    justificativa: null,
    foto_evidencia_url: null,
    data_medicao: '2026-01-28T14:30:00Z',
    nome_obra: 'Reforma Casa - Rua A'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    id_alocacao: 'alloc-003',
    nomeColaborador: 'João Silva',
    nomeAmbiente: 'Sala',
    area_planejada: 30,
    qtd_executada: 32, // Pequeno excedente
    valor_total: 3100,
    status_pagamento: 'ABERTO',
    flag_excedente: true,
    justificativa: 'Material adicional necessário',
    foto_evidencia_url: 'https://via.placeholder.com/400x300?text=Sala',
    data_medicao: '2026-02-02T09:00:00Z',
    nome_obra: 'Reforma Casa - Rua A'
  }
];

export const mockAlocacoes = [
  {
    id: 'alloc-001',
    id_obra: 'obra-001',
    id_colaborador: 'col-001',
    id_ambiente: 'amb-001',
    area_planejada: 20,
    percentual_executado: 125,
    status: 'ATIVO',
    data_inicio: '2026-01-15T00:00:00Z',
    data_fim_prevista: '2026-02-15T00:00:00Z',
    created_at: '2026-01-15T00:00:00Z'
  }
];

export class MockService {
  private static instance: MockService;

  private constructor() {}

  static getInstance(): MockService {
    if (!MockService.instance) {
      MockService.instance = new MockService();
    }
    return MockService.instance;
  }

  // Simular ligar/desligar do backend
  async isBackendAvailable(): Promise<boolean> {
    // Tentar fazer um simples GET - se falhar, retorna false
    try {
      await fetch('http://localhost:3005/api/v1', {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      // Se houve resposta HTTP (mesmo 401/404), o backend está ativo.
      return true;
    } catch {
      return false;
    }
  }

  // Mock dos medicoes
  getMockMedicoes() {
    return mockMedicoes;
  }

  getMockMedicoesExcedentes() {
    return mockMedicoes.filter(m => m.flag_excedente);
  }

  getMockAlocacoes() {
    return mockAlocacoes;
  }

  // Stats
  getStats() {
    return {
      total_medicoes: mockMedicoes.length,
      total_excedentes: mockMedicoes.filter(m => m.flag_excedente).length,
      valor_total: mockMedicoes.reduce((sum, m) => sum + m.valor_total, 0),
      pendentes_pagamento: mockMedicoes.filter(m => m.status_pagamento === 'ABERTO').length,
    };
  }
}

export default MockService.getInstance();
