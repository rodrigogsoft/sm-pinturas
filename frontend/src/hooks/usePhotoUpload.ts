import { useState } from 'react';
import { uploadFile } from '../services/uploads.service';

interface PhotoUploadState {
  uploading: boolean;
  error: string | null;
  url: string | null;
}

export const usePhotoUpload = () => {
  const [state, setState] = useState<PhotoUploadState>({
    uploading: false,
    error: null,
    url: null,
  });

  const uploadPhoto = async (file: File): Promise<string> => {
    setState({ uploading: true, error: null, url: null });

    try {
      const response = await uploadFile(
        file,
        'foto_evidencia',
        undefined,
        'Foto de evidência para excedente de medição'
      );

      setState({ uploading: false, error: null, url: response.url });
      return response.url;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao fazer upload da foto';
      setState({ uploading: false, error: errorMessage, url: null });
      throw err;
    }
  };

  const resetState = () => {
    setState({ uploading: false, error: null, url: null });
  };

  return {
    ...state,
    uploadPhoto,
    resetState,
  };
};
