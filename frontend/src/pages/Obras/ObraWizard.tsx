import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
} from '@mui/icons-material';

export interface ObraWizardData {
  obra: {
    nome: string;
    endereco_completo: string;
    data_inicio: string;
    data_previsao_fim: string;
    status: 'PLANEJAMENTO' | 'ATIVA' | 'SUSPENSA' | 'CONCLUIDA';
    margem_minima_percentual: number;
  };
  pavimentos: Array<{
    id: string; // temp uuid
    nome: string;
    ordem: number;
    ambientes: Array<{
      id: string; // temp uuid
      nome: string;
      area_m2: number;
    }>;
  }>;
}

interface ObraWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ObraWizardData) => Promise<void>;
  loading?: boolean;
}

const steps = ['Dados da Obra', 'Pavimentos', 'Ambientes', 'Revisão'];

export const ObraWizard: React.FC<ObraWizardProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState<ObraWizardData>({
    obra: {
      nome: '',
      endereco_completo: '',
      data_inicio: new Date().toISOString().split('T')[0],
      data_previsao_fim: '',
      status: 'PLANEJAMENTO',
      margem_minima_percentual: 20,
    },
    pavimentos: [],
  });

  const [novoPavimento, setNovoPavimento] = useState({ nome: '', ordem: 1 });
  const [novoAmbiente, setNovoAmbiente] = useState({ nome: '', area_m2: 0 });
  const [pavimentoSelecionado, setPavimentoSelecionado] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const handleNext = () => {
    setError('');

    // Validação de cada step
    if (activeStep === 0) {
      if (!data.obra.nome.trim()) {
        setError('Nome da obra é obrigatório');
        return;
      }
      if (!data.obra.endereco_completo.trim()) {
        setError('Endereço é obrigatório');
        return;
      }
      if (!data.obra.data_inicio) {
        setError('Data de início é obrigatória');
        return;
      }
      if (!data.obra.data_previsao_fim) {
        setError('Data de previsão de fim é obrigatória');
        return;
      }
    }

    if (activeStep === 1) {
      if (data.pavimentos.length === 0) {
        setError('Adicione pelo menos 1 pavimento');
        return;
      }
    }

    if (activeStep === 2) {
      const pavSemAmbientes = data.pavimentos.filter(p => p.ambientes.length === 0);
      if (pavSemAmbientes.length > 0) {
        setError('Todos os pavimentos devem ter pelo menos 1 ambiente');
        return;
      }
    }

    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAddPavimento = () => {
    if (!novoPavimento.nome.trim()) {
      setError('Nome do pavimento é obrigatório');
      return;
    }

    const tempId = `temp_pav_${Date.now()}`;
    setData({
      ...data,
      pavimentos: [
        ...data.pavimentos,
        {
          id: tempId,
          nome: novoPavimento.nome,
          ordem: novoPavimento.ordem,
          ambientes: [],
        },
      ],
    });

    setNovoPavimento({ nome: '', ordem: data.pavimentos.length + 1 });
    setError('');
  };

  const handleDeletePavimento = (idx: number) => {
    setData({
      ...data,
      pavimentos: data.pavimentos.filter((_, i) => i !== idx),
    });
    setPavimentoSelecionado(0);
  };

  const handleAddAmbiente = () => {
    if (!novoAmbiente.nome.trim()) {
      setError('Nome do ambiente é obrigatório');
      return;
    }

    if (novoAmbiente.area_m2 <= 0) {
      setError('Área deve ser maior que 0');
      return;
    }

    const tempId = `temp_amb_${Date.now()}`;
    const newPavimentos = [...data.pavimentos];
    newPavimentos[pavimentoSelecionado].ambientes.push({
      id: tempId,
      nome: novoAmbiente.nome,
      area_m2: novoAmbiente.area_m2,
    });

    setData({ ...data, pavimentos: newPavimentos });
    setNovoAmbiente({ nome: '', area_m2: 0 });
    setError('');
  };

  const handleDeleteAmbiente = (pavIdx: number, ambIdx: number) => {
    const newPavimentos = [...data.pavimentos];
    newPavimentos[pavIdx].ambientes = newPavimentos[pavIdx].ambientes.filter(
      (_, i) => i !== ambIdx
    );
    setData({ ...data, pavimentos: newPavimentos });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await onSubmit(data);
      setActiveStep(0);
      setData({
        obra: {
          nome: '',
          endereco_completo: '',
          data_inicio: new Date().toISOString().split('T')[0],
          data_previsao_fim: '',
          status: 'PLANEJAMENTO',
          margem_minima_percentual: 20,
        },
        pavimentos: [],
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao criar obra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Assistente de Criação de Obra</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Step 0: Dados da Obra */}
        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Nome da Obra *"
              placeholder="Ex: Reforma Residencial - Apto 101"
              value={data.obra.nome}
              onChange={(e) => setData({
                ...data,
                obra: { ...data.obra, nome: e.target.value }
              })}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Endereço Completo *"
              placeholder="Rua..., Número, Bairro, Cidade"
              value={data.obra.endereco_completo}
              onChange={(e) => setData({
                ...data,
                obra: { ...data.obra, endereco_completo: e.target.value }
              })}
              multiline
              rows={2}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data de Início *"
                  type="date"
                  value={data.obra.data_inicio}
                  onChange={(e) => setData({
                    ...data,
                    obra: { ...data.obra, data_inicio: e.target.value }
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data Prevista de Fim *"
                  type="date"
                  value={data.obra.data_previsao_fim}
                  onChange={(e) => setData({
                    ...data,
                    obra: { ...data.obra, data_previsao_fim: e.target.value }
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={data.obra.status}
                    label="Status"
                    onChange={(e) => setData({
                      ...data,
                      obra: { ...data.obra, status: e.target.value as any }
                    })}
                  >
                    <MenuItem value="PLANEJAMENTO">Planejamento</MenuItem>
                    <MenuItem value="ATIVA">Ativa</MenuItem>
                    <MenuItem value="SUSPENSA">Suspensa</MenuItem>
                    <MenuItem value="CONCLUIDA">Concluída</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Margem Mínima (%)"
                  type="number"
                  value={data.obra.margem_minima_percentual}
                  onChange={(e) => setData({
                    ...data,
                    obra: { ...data.obra, margem_minima_percentual: parseFloat(e.target.value) }
                  })}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 1: Pavimentos */}
        {activeStep === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Adicione os pavimentos (andar, subsolo, etc) da obra. Cada pavimento terá ambientes.
            </Alert>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Nome do Pavimento"
                placeholder="Ex: Térreo, 1º Andar"
                value={novoPavimento.nome}
                onChange={(e) => setNovoPavimento({ ...novoPavimento, nome: e.target.value })}
                sx={{ flex: 1 }}
              />

              <TextField
                label="Ordem"
                type="number"
                value={novoPavimento.ordem}
                onChange={(e) => setNovoPavimento({ ...novoPavimento, ordem: parseInt(e.target.value) || 1 })}
                sx={{ width: 100 }}
                inputProps={{ min: 1 }}
              />

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddPavimento}
              >
                Adicionar
              </Button>
            </Box>

            {data.pavimentos.length > 0 && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell>Ordem</TableCell>
                      <TableCell>Nome</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.pavimentos.map((pav, idx) => (
                      <TableRow key={pav.id}>
                        <TableCell><strong>{pav.ordem}</strong></TableCell>
                        <TableCell>{pav.nome}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletePavimento(idx)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Step 2: Ambientes */}
        {activeStep === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Adicione os ambientes para cada pavimento.
            </Alert>

            <FormControl fullWidth>
              <InputLabel>Selecione o Pavimento</InputLabel>
              <Select
                value={pavimentoSelecionado}
                label="Selecione o Pavimento"
                onChange={(e) => setPavimentoSelecionado(e.target.value as any)}
              >
                {data.pavimentos.map((pav, idx) => (
                  <MenuItem key={pav.id} value={idx}>
                    {pav.nome} ({pav.ambientes.length} ambientes)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Nome do Ambiente"
                placeholder="Ex: Sala, Cozinha, Quarto"
                value={novoAmbiente.nome}
                onChange={(e) => setNovoAmbiente({ ...novoAmbiente, nome: e.target.value })}
                sx={{ flex: 1 }}
              />

              <TextField
                label="Área (m²)"
                type="number"
                value={novoAmbiente.area_m2}
                onChange={(e) => setNovoAmbiente({ ...novoAmbiente, area_m2: parseFloat(e.target.value) || 0 })}
                sx={{ width: 100 }}
                inputProps={{ min: 0, step: 0.01 }}
              />

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddAmbiente}
              >
                Adicionar
              </Button>
            </Box>

            {data.pavimentos[pavimentoSelecionado]?.ambientes.length > 0 && (
              <Card sx={{ bgcolor: '#f9f9f9' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Ambientes de {data.pavimentos[pavimentoSelecionado].nome}:
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Nome</TableCell>
                        <TableCell align="right">Área</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.pavimentos[pavimentoSelecionado].ambientes.map((amb, idx) => (
                        <TableRow key={amb.id}>
                          <TableCell>{amb.nome}</TableCell>
                          <TableCell align="right">{amb.area_m2} m²</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteAmbiente(pavimentoSelecionado, idx)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {/* Step 3: Revisão */}
        {activeStep === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="success">
              Revise os dados antes de criar a obra.
            </Alert>

            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Dados da Obra
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">Nome:</Typography>
                    <Typography variant="body1">{data.obra.nome}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">Status:</Typography>
                    <Chip label={data.obra.status} size="small" />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Endereço:</Typography>
                    <Typography variant="body1">{data.obra.endereco_completo}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">Data de Início:</Typography>
                    <Typography variant="body1">{new Date(data.obra.data_inicio).toLocaleDateString('pt-BR')}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">Previsão de Fim:</Typography>
                    <Typography variant="body1">{new Date(data.obra.data_previsao_fim).toLocaleDateString('pt-BR')}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Estrutura: {data.pavimentos.length} pavimento(s)
                </Typography>
                {data.pavimentos.map((pav) => (
                  <Box key={pav.id} sx={{ mb: 2, pl: 1, borderLeft: '3px solid #2196F3' }}>
                    <Typography variant="body2" sx={{ fontWeight: '600' }}>
                      {pav.nome} ({pav.ambientes.length} ambientes)
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {pav.ambientes.map((amb) => (
                        <Chip
                          key={amb.id}
                          label={`${amb.nome} (${amb.area_m2}m²)`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0 || submitting}
            startIcon={<NavigateBeforeIcon />}
          >
            Voltar
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="success"
              disabled={submitting || loading}
            >
              {submitting || loading ? <CircularProgress size={24} /> : 'Criar Obra'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              endIcon={<NavigateNextIcon />}
            >
              Próximo
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ObraWizard;
