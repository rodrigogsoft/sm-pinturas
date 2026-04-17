import { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CreateItemAmbienteDto } from '../../../services/itens-ambiente.service';

interface ItemAmbienteFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (dados: CreateItemAmbienteDto) => Promise<void>;
  ambientes: any[];
  idAmbientePreSelecionado?: string;
}

const ItemAmbienteForm: React.FC<ItemAmbienteFormProps> = ({
  open,
  onClose,
  onSubmit,
  ambientes,
  idAmbientePreSelecionado,
}) => {
  const [formData, setFormData] = useState<CreateItemAmbienteDto>({
    id_ambiente: idAmbientePreSelecionado || '',
    nome_elemento: '',
    area_planejada: 0,
  });

  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        id_ambiente: idAmbientePreSelecionado || '',
        nome_elemento: '',
        area_planejada: 0,
      });
    }
  }, [open, idAmbientePreSelecionado]);

  const handleSubmit = async () => {
    if (!formData.id_ambiente) {
      alert('Selecione um ambiente');
      return;
    }

    if (!formData.nome_elemento?.trim()) {
      alert('Nome do elemento é obrigatório');
      return;
    }

    if (formData.area_planejada <= 0) {
      alert('Área planejada deve ser maior que 0');
      return;
    }

    try {
      setProcessando(true);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar item:', err);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Novo Elemento de Serviço</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <FormControl fullWidth margin="normal" disabled={!!idAmbientePreSelecionado}>
          <InputLabel>Ambiente</InputLabel>
          <Select
            value={formData.id_ambiente}
            onChange={(e) => setFormData({ ...formData, id_ambiente: e.target.value })}
            label="Ambiente"
          >
            {ambientes.map((amb) => (
              <MenuItem key={amb.id} value={amb.id}>
                {amb.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Nome do Elemento"
          placeholder="Ex: Pintura parede norte, Reboco, Assentamento"
          value={formData.nome_elemento}
          onChange={(e) => setFormData({ ...formData, nome_elemento: e.target.value })}
          margin="normal"
        />

        <TextField
          fullWidth
          label="Área Planejada (m²)"
          type="number"
          inputProps={{ step: '0.01' }}
          value={formData.area_planejada}
          onChange={(e) =>
            setFormData({
              ...formData,
              area_planejada: parseFloat(e.target.value),
            })
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

export default ItemAmbienteForm;
