import { AxiosError } from 'axios';
import { api } from './api';
// import { database } from '../database';  // WatermelonDB disabled
// import { Q } from '@nozbe/watermelondb';  // WatermelonDB disabled

export interface CriarMedicaoDTO {
  id_alocacao?: string | number;
  id_alocacao_item?: string;
  id_colaborador?: string;
  id_item_ambiente?: string;
  qtd_executada: number;
  data_medicao: string;
  area_planejada?: number;
  percentual_conclusao_item?: number;
  justificativa?: string;
  foto_evidencia_url?: string | null;
  justificativa_excedente?: string;
  foto_excedente?: string | null;
}

export interface MedicaoResponse {
  id: string | number;
  id_alocacao?: string | number;
  id_alocacao_item?: string;
  qtd_executada: number;
  data_medicao: string;
  justificativa_excedente?: string;
  foto_excedente?: string;
  possui_excedente: boolean;
  percentual_excedente?: number;
}

interface ApiErrorPayload {
  message?: string;
  [key: string]: unknown;
}

/**
 * MedicoesService
 * 
 * Serviço para gerenciar medições de execução
 * 
 * Features:
 * - Offline-first com WatermelonDB
 * - Upload de fotos de evidência
 * - Validação de excedentes (RF08)
 * - Sincronização com backend
 */
export class MedicoesService {
  /**
   * Listar alocações concluídas sem medição
   */
  static async listarAlocacoesSemMedicao(): Promise<any[]> {
    try {
      // Buscar do backend (WatermelonDB não disponível)
      const response = await api.get('/alocacoes/sem-medicao');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiErrorPayload>;
      // Compatibilidade com backend ERS 4.1.
      if (axiosError.response?.status === 404) {
        const fallback = await api.get('/financeiro/medicoes-colaborador/para-lote');
        return Array.isArray(fallback.data?.items) ? fallback.data.items : fallback.data;
      }
      console.error('Erro ao listar alocações sem medição:', error);
      return [];
    }
  }

  /**
   * Criar medição
   */
  static async criar(dto: CriarMedicaoDTO): Promise<MedicaoResponse> {
    try {
      const idAlocacaoItem = dto.id_alocacao_item || (dto.id_alocacao ? String(dto.id_alocacao) : undefined);
      const justificativa = dto.justificativa || dto.justificativa_excedente;
      const fotoEvidencia = dto.foto_evidencia_url ?? dto.foto_excedente;

      // Fluxo ERS 4.1: medição individual por colaborador/item.
      if (idAlocacaoItem && dto.id_colaborador && dto.id_item_ambiente) {
        try {
          const response = await api.post('/medicoes-colaborador', {
            id_alocacao_item: idAlocacaoItem,
            id_colaborador: dto.id_colaborador,
            id_item_ambiente: dto.id_item_ambiente,
            qtd_executada: dto.qtd_executada,
            area_planejada: dto.area_planejada,
            percentual_conclusao_item: dto.percentual_conclusao_item,
            justificativa,
            foto_evidencia_url: fotoEvidencia,
            data_medicao: dto.data_medicao,
          });
          return response.data;
        } catch (error: unknown) {
          const axiosError = error as AxiosError<ApiErrorPayload>;
          // Em ambientes legados sem endpoint novo, tenta rota antiga.
          if (axiosError.response?.status !== 404) {
            throw error;
          }
        }
      }

      // Compatibilidade com fluxo legado.
      const response = await api.post('/medicoes', {
        id_alocacao: dto.id_alocacao,
        qtd_executada: dto.qtd_executada,
        data_medicao: dto.data_medicao,
        justificativa_excedente: justificativa,
        foto_excedente: fotoEvidencia,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar medição:', error);
      throw new Error('Falha ao criar medição');
    }
  }

  /**
   * Upload de foto de evidência
   * 
   * Compressão conforme RNF03:
   * - Resolução máxima: 1024x1024px
   * - Qualidade: 80%
   */
  static async uploadFoto(fotoUri: string): Promise<string> {
    try {
      const formData = new FormData();
      
      // Extrair nome do arquivo da URI
      const filename = fotoUri.split('/').pop() || 'evidencia.jpg';
      
      formData.append('file', {
        uri: fotoUri,
        type: 'image/jpeg',
        name: filename,
      } as any);

      const response = await api.post('/uploads/foto-evidencia', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.url;
    } catch (error) {
      console.error('Erro ao fazer upload de foto:', error);
      throw new Error('Falha ao enviar foto de evidência');
    }
  }

  /**
   * Buscar medições de uma obra
   */
  static async listarPorObra(idObra: number): Promise<MedicaoResponse[]> {
    try {
      const response = await api.get(`/medicoes/obra/${idObra}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar medições:', error);
      return [];
    }
  }

  /**
   * Buscar medição específica
   */
  static async buscarPorId(id: number): Promise<MedicaoResponse | null> {
    try {
      const response = await api.get(`/medicoes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar medição:', error);
      return null;
    }
  }

  /**
   * Sincronizar medições pendentes
   * 
   * Chamado pelo SyncService periodicamente
   * NOTA: WatermelonDB desabilitado - apenas API sync
   */
  static async sincronizarPendentes(): Promise<void> {
    try {
      console.log('Sincronização de medições: usando apenas API');
      // Com WatermelonDB desabilitado, sincronização é feita em tempo real via API
    } catch (error) {
      console.error('Erro ao sincronizar medições:', error);
    }
  }
}
