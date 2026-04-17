import { api } from './api';

export interface UploadResponse {
  id: string;
  url: string;
  nome_original: string;
  mimetype: string;
  tamanho: number;
  created_at: string;
}

/**
 * Converte base64 data URL em Blob
 */
export const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

/**
 * Faz upload de uma assinatura (imagem base64) para o backend
 * @param signatureDataUrl - String base64 da imagem
 * @param tipo - Tipo do upload (padrão: 'outro')
 * @param descricao - Descrição do arquivo
 * @returns URL do arquivo no servidor
 */
export const uploadSignature = async (
  signatureDataUrl: string,
  tipo: string = 'outro',
  descricao?: string
): Promise<string> => {
  try {
    // Converter base64 para blob
    const blob = dataURLtoBlob(signatureDataUrl);
    
    // Criar FormData
    const formData = new FormData();
    formData.append('file', blob, 'assinatura.png');
    formData.append('tipo', tipo);
    
    if (descricao) {
      formData.append('descricao', descricao);
    }
    
    // Fazer upload
    const response = await api.post<UploadResponse>('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.url;
  } catch (error: any) {
    console.error('Erro ao fazer upload da assinatura:', error);
    throw new Error(
      error.response?.data?.message || 
      'Erro ao fazer upload da assinatura'
    );
  }
};

/**
 * Faz upload de um arquivo genérico
 */
export const uploadFile = async (
  file: File,
  tipo: string,
  idRelacionado?: string,
  descricao?: string
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tipo', tipo);
  
  if (idRelacionado) {
    formData.append('id_relacionado', idRelacionado);
  }
  
  if (descricao) {
    formData.append('descricao', descricao);
  }
  
  const response = await api.post<UploadResponse>('/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export default {
  uploadSignature,
  uploadFile,
  dataURLtoBlob,
};
