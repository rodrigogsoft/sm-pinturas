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
import {
  CreateItemAmbienteDto,
  ItemAmbiente,
  UpdateItemAmbienteDto,
} from '../../../services/itens-ambiente.service';

interface ItemAmbienteFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (dados: CreateItemAmbienteDto | UpdateItemAmbienteDto) => Promise<void>;
  ambientes: any[];
  idAmbientePreSelecionado?: string;
  modo?: 'criar' | 'editar';
  itemInicial?: ItemAmbiente | null;
}

const ItemAmbienteForm: React.FC<ItemAmbienteFormProps> = ({
  open,
  onClose,
  onSubmit,
  ambientes,
  idAmbientePreSelecionado,
  modo = 'criar',
  itemInicial,
}) => {
  const [formData, setFormData] = useState<CreateItemAmbienteDto>({
    id_ambiente: idAmbientePreSelecionado || '',
    nome_elemento: '',
    area_planejada: 0,
  });

  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (open) {
      if (modo === 'editar' && itemInicial) {
        setFormData({
          id_ambiente: itemInicial.id_ambiente,
          nome_elemento: (itemInicial.nome_elemento || '').trim(),
          area_planejada: Number(itemInicial.area_planejada || 0),
        });
      } else {
        setFormData({
          id_ambiente: idAmbientePreSelecionado || '',
          nome_elemento: '',
          area_planejada: 0,
        });
      }
    }
  }, [open, idAmbientePreSelecionado, itemInicial, modo]);

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
      if (modo === 'editar') {
        await onSubmit({
          nome_elemento: formData.nome_elemento?.trim(),
          area_planejada: formData.area_planejada,
        });
      } else {
        await onSubmit(formData);
      }
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar item:', err);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {modo === 'editar' ? 'Editar Elemento de Serviço' : 'Novo Elemento de Serviço'}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <FormControl fullWidth margin="normal" disabled={!!idAmbientePreSelecionado || modo === 'editar'}>
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
          {processando ? <CircularProgress size={24} /> : modo === 'editar' ? 'Atualizar' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ItemAmbienteForm;
