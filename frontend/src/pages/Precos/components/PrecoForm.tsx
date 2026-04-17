import { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CreatePrecoDto } from '../../../services/precos.service';

interface PrecoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (dados: CreatePrecoDto) => Promise<void>;
  obras: any[];
  servicos: any[];
  loading?: boolean;
  initialData?: any;
}

const PrecoForm: React.FC<PrecoFormProps> = ({
  open,
  onClose,
  onSubmit,
  obras,
  servicos,
  initialData,
}) => {
  const isEditingMode = Boolean(initialData?.id);

  const [formData, setFormData] = useState<CreatePrecoDto>({
    id_obra: '',
    id_servico_catalogo: 0,
    preco_custo: 0,
    preco_venda: 0,
  });

  const [validacao, setValidacao] = useState<{
    margem: number;
    valida: boolean;
    mensagem: string;
  } | null>(null);

  const [processando, setProcessando] = useState(false);

  const toNumber = (value: unknown, fallback = 0): number => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : fallback;
    }

    if (typeof value === 'string') {
      const normalized = value.replace(',', '.').trim();
      if (!normalized) {
        return fallback;
      }
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        id_obra: initialData.id_obra || '',
        id_servico_catalogo: toNumber(initialData.id_servico_catalogo),
        preco_custo: toNumber(initialData.preco_custo),
        preco_venda: toNumber(initialData.preco_venda),
        observacoes: initialData.observacoes || '',
      });
      return;
    }

    setFormData({
      id_obra: '',
      id_servico_catalogo: 0,
      preco_custo: 0,
      preco_venda: 0,
      observacoes: '',
    });
    setValidacao(null);
  }, [initialData, open]);

  const calcularMargem = () => {
    if (formData.preco_custo > 0 && formData.preco_venda > 0) {
      const margem = ((formData.preco_venda - formData.preco_custo) / formData.preco_custo) * 100;
      const obraSelecionada = obras.find((obra) => obra.id === formData.id_obra);
      const margemMinima = obraSelecionada?.margem_minima_percentual ?? 20;
      const valida = margem >= margemMinima;
      setValidacao({
        margem,
        valida,
        mensagem: valida
          ? `✅ Margem válida: ${margem.toFixed(2)}%`
          : `⚠️ Margem baixa: ${margem.toFixed(2)}% (mínimo ${margemMinima}%)`,
      });
      return;
    }

    setValidacao(null);
  };

  useEffect(() => {
    calcularMargem();
  }, [formData.preco_custo, formData.preco_venda, formData.id_obra, obras]);

  const handleSubmit = async () => {
    if (!formData.id_obra) {
      alert('Selecione uma obra');
      return;
    }

    if (!formData.id_servico_catalogo) {
      alert('Selecione um serviço');
      return;
    }

    if (formData.preco_venda <= 0) {
      alert('Preço de venda deve ser maior que 0');
      return;
    }

    if (isEditingMode && formData.preco_custo <= 0) {
      alert('Preço de custo inválido para edição');
      return;
    }

    try {
      setProcessando(true);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar preço:', err);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {initialData ? 'Editar Preço' : 'Novo Preço'}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Obra</InputLabel>
          <Select
            value={formData.id_obra}
            onChange={(e) => setFormData({ ...formData, id_obra: e.target.value })}
            label="Obra"
            disabled={isEditingMode}
          >
            {obras.map((obra) => (
              <MenuItem key={obra.id} value={obra.id}>
                {obra.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel>Serviço</InputLabel>
          <Select
            value={formData.id_servico_catalogo || ''}
            onChange={(e) =>
              setFormData({ ...formData, id_servico_catalogo: parseInt(e.target.value as string) })
            }
            label="Serviço"
            disabled={isEditingMode}
          >
            {servicos.map((servico) => (
              <MenuItem key={servico.id} value={servico.id}>
                {servico.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {isEditingMode && (
          <TextField
            fullWidth
            label="Preço Custo"
            type="number"
            inputProps={{ step: '0.01' }}
            value={Number.isFinite(formData.preco_custo) ? formData.preco_custo : ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                preco_custo: toNumber(e.target.value),
              })
            }
            margin="normal"
          />
        )}

        {!isEditingMode && (
          <Alert severity="info" sx={{ mt: 2 }}>
            O preço de custo agora é informado na criação da alocação.
          </Alert>
        )}

        <TextField
          fullWidth
          label="Preço Venda"
          type="number"
          inputProps={{ step: '0.01' }}
          value={Number.isFinite(formData.preco_venda) ? formData.preco_venda : ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              preco_venda: toNumber(e.target.value),
            })
          }
          margin="normal"
        />

        {validacao && (
          <Alert
            severity={validacao.valida ? 'success' : 'warning'}
            sx={{ mt: 2, mb: 2 }}
          >
            {validacao.mensagem}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Observações"
          multiline
          rows={2}
          value={formData.observacoes || ''}
          onChange={(e) =>
            setFormData({ ...formData, observacoes: e.target.value })
          }
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={processando}
          color="primary"
        >
          {processando ? <CircularProgress size={24} /> : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrecoForm;
