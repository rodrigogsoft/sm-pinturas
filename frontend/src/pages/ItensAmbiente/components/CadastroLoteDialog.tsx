import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { ItemLoteDto } from '../../../services/itens-ambiente.service';

interface Props {
  open: boolean;
  idAmbiente: string;
  nomeAmbiente?: string;
  quantidadeAmbientesSemelhantes?: number;
  ambientesSemelhantesPreview?: string[];
  onClose: () => void;
  onSubmit: (itens: ItemLoteDto[], cadastrarSemelhantes: boolean) => Promise<{ criados: number; erros: string[] }>;
}

const itemVazio = (): ItemLoteDto => ({ nome_elemento: '', area_planejada: 0 });

export const CadastroLoteDialog = ({
  open,
  idAmbiente: _idAmbiente,
  nomeAmbiente,
  quantidadeAmbientesSemelhantes = 1,
  ambientesSemelhantesPreview = [],
  onClose,
  onSubmit,
}: Props) => {
  const [itens, setItens] = useState<ItemLoteDto[]>([itemVazio()]);
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [cadastrarSemelhantes, setCadastrarSemelhantes] = useState(false);

  useEffect(() => {
    if (quantidadeAmbientesSemelhantes <= 1 && cadastrarSemelhantes) {
      setCadastrarSemelhantes(false);
    }
  }, [cadastrarSemelhantes, quantidadeAmbientesSemelhantes]);

  const handleFechar = () => {
    setItens([itemVazio()]);
    setErros([]);
    setSucesso(null);
    setCadastrarSemelhantes(false);
    onClose();
  };

  const handleAdicionarLinha = () => {
    setItens((prev) => [...prev, itemVazio()]);
  };

  const handleRemoverLinha = (idx: number) => {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAlterarItem = (idx: number, campo: keyof ItemLoteDto, valor: string) => {
    setItens((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, [campo]: campo === 'area_planejada' ? Number(valor) : valor }
          : item,
      ),
    );
  };

  const handleSubmit = async () => {
    setErros([]);
    setSucesso(null);

    // Validação local
    const invalidos = itens.filter(
      (it) => !it.nome_elemento.trim() || it.area_planejada <= 0,
    );
    if (invalidos.length > 0) {
      setErros(['Todos os itens devem ter nome e área planejada maior que zero.']);
      return;
    }

    try {
      setCarregando(true);
      const resultado = await onSubmit(itens, cadastrarSemelhantes);
      if (resultado.criados > 0) {
        setSucesso(`${resultado.criados} elemento(s) criado(s) com sucesso.`);
        setItens([itemVazio()]);
      }
      if (resultado.erros.length > 0) {
        setErros(resultado.erros);
      }
    } catch (err: any) {
      setErros([err?.response?.data?.message ?? err.message ?? 'Erro ao criar elementos.']);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleFechar} maxWidth="md" fullWidth>
      <DialogTitle>
        Cadastro em Lote de Elementos de Serviço
        {nomeAmbiente && (
          <Typography variant="body2" color="textSecondary">
            Ambiente: {nomeAmbiente}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {sucesso && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {sucesso}
          </Alert>
        )}
        {erros.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {erros.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </Alert>
        )}

        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Informe nome e área planejada de cada elemento. O tipo de serviço será definido no momento da alocação.
        </Typography>

        <FormControlLabel
          sx={{ mb: 2, alignItems: 'flex-start' }}
          control={(
            <Checkbox
              checked={cadastrarSemelhantes}
              onChange={(e) => setCadastrarSemelhantes(e.target.checked)}
              disabled={carregando || quantidadeAmbientesSemelhantes <= 1}
            />
          )}
          label={(
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Cadastrar nos ambientes semelhantes
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {quantidadeAmbientesSemelhantes > 1
                  ? `Aplicará este lote em ${quantidadeAmbientesSemelhantes} ambientes da mesma obra, incluindo ${nomeAmbiente ?? 'o ambiente atual'}.`
                  : 'Não há outros ambientes semelhantes disponíveis na obra selecionada.'}
              </Typography>
              {ambientesSemelhantesPreview.length > 1 && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Ambientes: {ambientesSemelhantesPreview.slice(0, 4).join(', ')}
                  {ambientesSemelhantesPreview.length > 4
                    ? ` +${ambientesSemelhantesPreview.length - 4}`
                    : ''}
                </Typography>
              )}
            </Box>
          )}
        />

        {/* Cabeçalho */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 160px 48px', gap: 1, mb: 1 }}>
          <Typography variant="caption" fontWeight="bold">
            Nome do Elemento
          </Typography>
          <Typography variant="caption" fontWeight="bold">
            Área Planejada (m²)
          </Typography>
          <span />
        </Box>

        <Divider sx={{ mb: 1 }} />

        {itens.map((item, idx) => (
          <Box
            key={idx}
            sx={{ display: 'grid', gridTemplateColumns: '1fr 160px 48px', gap: 1, mb: 1 }}
          >
            <TextField
              size="small"
              placeholder="Ex: Pintura parede norte"
              value={item.nome_elemento}
              onChange={(e) => handleAlterarItem(idx, 'nome_elemento', e.target.value)}
              inputProps={{ maxLength: 200 }}
              disabled={carregando}
            />
            <TextField
              size="small"
              type="number"
              placeholder="0.00"
              value={item.area_planejada || ''}
              onChange={(e) => handleAlterarItem(idx, 'area_planejada', e.target.value)}
              inputProps={{ min: 0.01, step: 0.01 }}
              disabled={carregando}
            />
            <IconButton
              size="small"
              color="error"
              onClick={() => handleRemoverLinha(idx)}
              disabled={itens.length === 1 || carregando}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}

        <Button
          startIcon={<AddIcon />}
          onClick={handleAdicionarLinha}
          size="small"
          sx={{ mt: 1 }}
          disabled={carregando}
        >
          Adicionar linha
        </Button>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleFechar} disabled={carregando}>
          Fechar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={carregando}
          startIcon={carregando ? <CircularProgress size={16} /> : undefined}
        >
          Salvar Lote ({itens.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CadastroLoteDialog;
