import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Paper,
  Typography,
  MenuItem,
} from '@mui/material';
import { useState, useEffect } from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { medicoesService, CreateMedicaoDto } from '../services/medicoes.service';
import { alocacoesService } from '../services/alocacoes.service';
import { api } from '../services/api';
import { usePhotoUpload } from '../hooks/usePhotoUpload';

interface Alocacao {
  id: string;
  id_ambiente: string;
  id_colaborador: string;
  nomeElemento: string;
  nomeServico: string;
  nomeAmbiente: string;
  nomeColaborador: string;
  area_planejada: number;
  status: string;
}

interface AlocacaoApi {
  id: string;
  id_ambiente?: string;
  id_colaborador?: string;
  id_item_ambiente?: string | null;
  idItemAmbiente?: string | null;
  id_servico_catalogo?: number;
  idServicoCatalogo?: number;
  id_servico?: number;
  idServico?: number;
  nome_servico?: string;
  nomeServico?: string;
  nomeAmbiente?: string;
  nomeColaborador?: string;
  area_planejada?: number;
  status?: string;
  ambiente?: {
    nome?: string;
    area_m2?: number;
  };
  colaborador?: {
    nome_completo?: string;
  };
  item_ambiente?: {
    nome_elemento?: string;
    area_planejada?: number;
  };
}

interface ItemAmbienteApi {
  id: string;
  nome_elemento?: string | null;
  area_planejada?: number | null;
}

interface ServicoApi {
  id: number;
  nome: string;
}

export const MedicoesForm = () => {
  const [open, setOpen] = useState(false);
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const [selectedAlocacao, setSelectedAlocacao] = useState<Alocacao | null>(null);
  
  // Form fields
  const [qtdExecutada, setQtdExecutada] = useState('');
  const [dataMedicao, setDataMedicao] = useState(new Date().toISOString().split('T')[0]);
  const [justificativa, setJustificativa] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showExcedenteWarning, setShowExcedenteWarning] = useState(false);
  const [isExcedente, setIsExcedente] = useState(false);
  
  const { uploading: photoUploading, uploadPhoto } = usePhotoUpload();

  const normalizarAlocacoes = (
    raw: AlocacaoApi[],
    servicosMap: Map<number, string>,
    itensMap: Map<string, ItemAmbienteApi>,
  ): Alocacao[] => {
    return raw.map((a) => {
      const idItemAmbiente = a.id_item_ambiente ?? a.idItemAmbiente ?? null;
      const itemMap = idItemAmbiente ? itensMap.get(idItemAmbiente) : undefined;
      const areaPlanejada =
        a.area_planejada ??
        Number(itemMap?.area_planejada ?? a.item_ambiente?.area_planejada ?? 0);

      const idServico =
        a.id_servico_catalogo ??
        a.idServicoCatalogo ??
        a.id_servico ??
        a.idServico ??
        null;

      const nomeServico =
        a.nome_servico ||
        a.nomeServico ||
        (idServico ? servicosMap.get(Number(idServico)) : undefined) ||
        'Servico nao informado';

      return {
        id: a.id,
        id_ambiente: a.id_ambiente || '',
        id_colaborador: a.id_colaborador || '',
        nomeElemento:
          itemMap?.nome_elemento ||
          a.item_ambiente?.nome_elemento ||
          'Elemento nao informado',
        nomeServico,
        nomeAmbiente: a.nomeAmbiente || a.ambiente?.nome || 'Ambiente nao informado',
        nomeColaborador:
          a.nomeColaborador || a.colaborador?.nome_completo || 'Colaborador nao informado',
        area_planejada: areaPlanejada,
        status: a.status || '',
      };
    });
  };

  const carregarServicosMap = async (): Promise<Map<number, string>> => {
    const response = await api.get('/servicos');
    const servicosRaw = (response.data || []) as ServicoApi[];
    return new Map<number, string>(servicosRaw.map((s) => [Number(s.id), s.nome]));
  };

  // Carregar alocações
  useEffect(() => {
    const carregarAlocacoes = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const idSessao = params.get('id_sessao') || undefined;
        const idObra = params.get('id_obra') || undefined;

        const [responseAlocacoes, servicosMap] = await Promise.all([
          alocacoesService.listar({
            status: 'EM_ANDAMENTO',
            id_sessao: idSessao,
            id_obra: idObra,
          }),
          carregarServicosMap(),
        ]);

        const alocacoesRaw = (responseAlocacoes.data || []) as AlocacaoApi[];
        const ambientesUnicos = Array.from(
          new Set(
            alocacoesRaw
              .map((a) => a.id_ambiente)
              .filter((id): id is string => Boolean(id)),
          ),
        );

        const itensMap = new Map<string, ItemAmbienteApi>();
        await Promise.all(
          ambientesUnicos.map(async (idAmbiente) => {
            const itensResponse = await api.get(`/itens-ambiente/ambiente/${idAmbiente}`);
            const itens = (itensResponse.data || []) as ItemAmbienteApi[];
            itens.forEach((item) => {
              itensMap.set(item.id, item);
            });
          }),
        );

        // Filtrar apenas alocações ativas/disponíveis
        const alocacoesValidas = alocacoesRaw.filter(
          (a: any) => a.status === 'DISPONIVEL' || a.status === 'EM_ANDAMENTO',
        );
        setAlocacoes(normalizarAlocacoes(alocacoesValidas, servicosMap, itensMap));
      } catch (err) {
        console.error('Erro ao carregar alocações:', err);
        setError('Erro ao carregar alocações disponíveis');
      }
    };

    if (open) {
      carregarAlocacoes();
    }
  }, [open]);

  // Função para abrir dialog
  const handleOpen = () => {
    setOpen(true);
    setError('');
    setSuccess('');
  };

  // Função para fechar dialog
  const handleClose = () => {
    if (!loading && !photoUploading) {
      setOpen(false);
      resetForm();
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedAlocacao(null);
    setQtdExecutada('');
    setJustificativa('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsExcedente(false);
    setShowExcedenteWarning(false);
    setError('');
    setSuccess('');
    setDataMedicao(new Date().toISOString().split('T')[0]);
  };

  // Validar se há excedente quando quantidade muda
  const handleQtdChange = (value: string) => {
    setQtdExecutada(value);
    
    if (selectedAlocacao && value) {
      const qtd = parseFloat(value);
      if (!isNaN(qtd) && qtd > selectedAlocacao.area_planejada) {
        setIsExcedente(true);
        setShowExcedenteWarning(true);
      } else {
        setIsExcedente(false);
        setShowExcedenteWarning(false);
        setJustificativa('');
        setPhotoFile(null);
        setPhotoPreview(null);
      }
    }
  };

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Arquivo deve ter menos de 5MB');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setError('Arquivo deve ser uma imagem');
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // Submit form
  const handleSubmit = async () => {
    // Validações
    if (!selectedAlocacao) {
      setError('Selecione uma alocação');
      return;
    }

    if (!qtdExecutada || parseFloat(qtdExecutada) <= 0) {
      setError('Quantidade deve ser maior que 0');
      return;
    }

    if (isExcedente) {
      if (!justificativa || justificativa.trim().length < 10) {
        setError('Justificativa deve ter pelo menos 10 caracteres');
        return;
      }

      if (!photoFile) {
        setError('Foto de evidência é obrigatória para excedentes');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      // Upload photo se houver
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      // Criar medição
      const medicaoData: CreateMedicaoDto = {
        id_alocacao: selectedAlocacao.id,
        qtd_executada: parseFloat(qtdExecutada),
        area_planejada: selectedAlocacao.area_planejada,
        ...(isExcedente && {
          justificativa,
          foto_evidencia_url: photoUrl || undefined,
        }),
      };

      const response = await medicoesService.criar(medicaoData);

      setSuccess(`Medição criada com sucesso! ID: ${response.data.id}`);
      resetForm();

      // Recarregar alocações
      const [alocResponse, servicosMap] = await Promise.all([
        (() => {
          const params = new URLSearchParams(window.location.search);
          return alocacoesService.listar({
            status: 'EM_ANDAMENTO',
            id_sessao: params.get('id_sessao') || undefined,
            id_obra: params.get('id_obra') || undefined,
          });
        })(),
        carregarServicosMap(),
      ]);

      const alocacoesRaw = (alocResponse.data || []) as AlocacaoApi[];
      const ambientesUnicos = Array.from(
        new Set(
          alocacoesRaw
            .map((a) => a.id_ambiente)
            .filter((id): id is string => Boolean(id)),
        ),
      );
      const itensMap = new Map<string, ItemAmbienteApi>();
      await Promise.all(
        ambientesUnicos.map(async (idAmbiente) => {
          const itensResponse = await api.get(`/itens-ambiente/ambiente/${idAmbiente}`);
          const itens = (itensResponse.data || []) as ItemAmbienteApi[];
          itens.forEach((item) => {
            itensMap.set(item.id, item);
          });
        }),
      );

      const alocacoesValidas = alocacoesRaw.filter(
        (a: any) => a.status === 'DISPONIVEL' || a.status === 'EM_ANDAMENTO',
      );
      setAlocacoes(normalizarAlocacoes(alocacoesValidas, servicosMap, itensMap));

      // Fechar dialog após 2 segundos
      setTimeout(() => {
        setOpen(false);
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Erro ao criar medição';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleOpen}
        fullWidth
      >
        Registrar Medição
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Nova Medição</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {showExcedenteWarning && isExcedente && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ Quantidade superior à área planejada! Justificativa e foto são obrigatórias.
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Seleção de alocação */}
            <TextField
              select
              label="Alocação"
              value={selectedAlocacao?.id || ''}
              onChange={(e) => {
                const alocacao = alocacoes.find(a => a.id === e.target.value);
                setSelectedAlocacao(alocacao || null);
                setQtdExecutada('');
                setIsExcedente(false);
              }}
              fullWidth
              required
              disabled={loading}
            >
              {alocacoes.map((alocacao) => (
                <MenuItem key={alocacao.id} value={alocacao.id}>
                  {alocacao.nomeColaborador} - {alocacao.nomeAmbiente} - {alocacao.nomeElemento} - {alocacao.nomeServico} ({Number(alocacao.area_planejada || 0).toFixed(2)}m²)
                </MenuItem>
              ))}
            </TextField>

            {/* Data da medição */}
            <TextField
              type="date"
              label="Data da Medição"
              value={dataMedicao}
              onChange={(e) => setDataMedicao(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={loading}
            />

            {/* Quantidade executada */}
            <TextField
              type="number"
              label="Quantidade Executada (m²)"
              value={qtdExecutada}
              onChange={(e) => handleQtdChange(e.target.value)}
              placeholder="0"
              fullWidth
              disabled={loading}
              inputProps={{ step: '0.01', min: '0' }}
              helperText={
                selectedAlocacao 
                  ? `Planejado: ${selectedAlocacao.area_planejada}m²`
                  : 'Selecione uma alocação primeiro'
              }
            />

            {/* Campos de excedente */}
            {isExcedente && (
              <>
                <TextField
                  label="Justificativa para Excedente"
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  multiline
                  rows={3}
                  placeholder="Explique por que a quantidade executada ultrapassou o planejado..."
                  fullWidth
                  disabled={loading}
                  helperText="Mínimo 10 caracteres obrigatório"
                />

                {/* Upload de foto */}
                <Paper sx={{ p: 2, border: '2px dashed #ccc', textAlign: 'center' }}>
                  {photoPreview ? (
                    <Box>
                      <Box
                        component="img"
                        src={photoPreview}
                        sx={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          mb: 1,
                          borderRadius: 1,
                        }}
                        alt="Preview da foto"
                      />
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={handleRemovePhoto}
                        color="error"
                        disabled={photoUploading || loading}
                      >
                        Remover Foto
                      </Button>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {photoFile?.name}
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <CloudUploadIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Clique para selecionar uma foto ou arraste aqui
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        (Máx. 5MB, formatos: JPG, PNG)
                      </Typography>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        style={{ display: 'none' }}
                        id="photo-input"
                      />
                      <label htmlFor="photo-input" style={{ display: 'block', cursor: 'pointer', paddingTop: 10 }}>
                        <Button
                          variant="outlined"
                          component="span"
                          disabled={photoUploading || loading}
                        >
                          Selecionar Foto
                        </Button>
                      </label>
                    </Box>
                  )}
                </Paper>
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={loading || photoUploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={
              loading ||
              photoUploading ||
              !selectedAlocacao ||
              !qtdExecutada ||
              (isExcedente && (!justificativa || !photoFile))
            }
          >
            {loading || photoUploading ? <CircularProgress size={24} /> : 'Registrar Medição'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
