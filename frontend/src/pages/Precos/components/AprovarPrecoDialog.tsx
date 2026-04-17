import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  Chip,
  Stack,
  Divider,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import precosService, { TabelaPreco, MargemValidacao } from '../../../services/precos.service';

interface AprovarPrecoDialogProps {
  aberto: boolean;
  preco: TabelaPreco | null;
  onFechar: () => void;
  onSucesso: () => void;
}

export const AprovarPrecoDialog: React.FC<AprovarPrecoDialogProps> = ({
  aberto,
  preco,
  onFechar,
  onSucesso,
}) => {
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [margemInfo, setMargemInfo] = useState<MargemValidacao | null>(null);
  const [carregandoMargem, setCarregandoMargem] = useState(false);

  useEffect(() => {
    if (preco && aberto) {
      carregarMargemValidacao();
    }
  }, [preco, aberto]);

  const carregarMargemValidacao = async () => {
    if (!preco) return;

    try {
      setCarregandoMargem(true);
      const info = await precosService.validarMargem(preco.id);
      setMargemInfo(info);
    } catch (err: any) {
      console.error('Erro ao carregar margem:', err);
    } finally {
      setCarregandoMargem(false);
    }
  };

  const handleAprovar = async () => {
    if (!preco) return;

    try {
      setLoading(true);
      setError(null);
      await precosService.aprovar(preco.id, {
        status: 'APROVADO',
        observacoes: observacoes || undefined,
      });
      onSucesso();
      handleLimpar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao aprovar preço');
    } finally {
      setLoading(false);
    }
  };

  const handleRejeitar = async () => {
    if (!preco) return;

    if (!observacoes || observacoes.trim().length < 10) {
      setError('Justificativa obrigatória (mínimo 10 caracteres)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await precosService.aprovar(preco.id, {
        status: 'REJEITADO',
        observacoes,
      });
      onSucesso();
      handleLimpar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao rejeitar preço');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpar = () => {
    setObservacoes('');
    setError(null);
    setMargemInfo(null);
    onFechar();
  };

  if (!preco) return null;

  const atendeMargemMinima = margemInfo?.atende_margem_minima ?? false;

  return (
    <Dialog open={aberto} onClose={handleLimpar} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Aprovar Preço de Venda</Typography>
          <Chip
            label={preco.status_aprovacao}
            color={preco.status_aprovacao === 'PENDENTE' ? 'warning' : 'default'}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Informações do Serviço */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Serviço
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {preco.servico?.nome || 'Serviço não identificado'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Obra: {preco.obra?.nome || 'N/A'}
          </Typography>
        </Paper>

        {/* Análise de Margem */}
        {carregandoMargem ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : margemInfo ? (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 2,
              bgcolor: atendeMargemMinima ? 'success.50' : 'error.50',
              borderColor: atendeMargemMinima ? 'success.main' : 'error.main',
            }}
          >
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={1}>
                {atendeMargemMinima ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <WarningIcon color="error" />
                )}
                <Typography variant="subtitle1" fontWeight="bold">
                  Análise de Margem
                </Typography>
              </Box>

              <Divider />

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Preço de Custo:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  R$ {margemInfo.preco_custo.toFixed(2)}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Preço de Venda:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  R$ {margemInfo.preco_venda.toFixed(2)}
                </Typography>
              </Box>

              <Divider />

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Margem Calculada:
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color={atendeMargemMinima ? 'success.main' : 'error.main'}
                >
                  {margemInfo.margem_percentual.toFixed(2)}%
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Margem Mínima Exigida:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {margemInfo.margem_minima_exigida}%
                </Typography>
              </Box>

              <Alert severity={atendeMargemMinima ? 'success' : 'error'} variant="outlined">
                {margemInfo.mensagem_validacao}
              </Alert>
            </Stack>
          </Paper>
        ) : null}

        {/* Campo de Observações */}
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Observações"
          placeholder={
            !atendeMargemMinima
              ? 'Justificativa obrigatória para rejeição (mínimo 10 caracteres)'
              : 'Observações (opcional)'
          }
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          helperText={`${observacoes.length} caracteres`}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleLimpar} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleRejeitar}
          color="error"
          variant="outlined"
          disabled={loading || !observacoes || observacoes.trim().length < 10}
          startIcon={<CancelIcon />}
        >
          Rejeitar
        </Button>
        <Button
          onClick={handleAprovar}
          color="success"
          variant="contained"
          disabled={loading || !atendeMargemMinima}
          startIcon={<CheckCircleIcon />}
        >
          Aprovar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
