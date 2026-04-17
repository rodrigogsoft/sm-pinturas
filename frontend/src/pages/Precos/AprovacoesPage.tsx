import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import LeftAlignedTablePagination from '../../components/LeftAlignedTablePagination';
import { useClientPagination } from '../../hooks/useClientPagination';
import precosService, { TabelaPreco } from '../../services/precos.service';
import { AprovarPrecoDialog } from './components/AprovarPrecoDialog';

export const AprovacoesPage: React.FC = () => {
  const [precosPendentes, setPrecosPendentes] = useState<TabelaPreco[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [precoSelecionado, setPrecoSelecionado] = useState<TabelaPreco | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [estatisticas, setEstatisticas] = useState<any>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pendentes, stats] = await Promise.all([
        precosService.listarPendentes(),
        precosService.getEstatisticas(),
      ]);
      setPrecosPendentes(pendentes);
      setEstatisticas(stats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirDialog = (preco: TabelaPreco) => {
    setPrecoSelecionado(preco);
    setDialogAberto(true);
  };

  const handleSucesso = () => {
    setDialogAberto(false);
    setPrecoSelecionado(null);
    carregarDados();
  };

  const formatarData = (data: string | null) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor: unknown) => {
    const valorNumerico = toNumber(valor);
    return valorNumerico.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const toNumber = (valor: unknown) => {
    const parsed = Number(valor);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedPrecosPendentes,
    handlePageChange,
    handleRowsPerPageChange,
  } = useClientPagination(precosPendentes);

  return (
    <Container maxWidth="xl">
      <Box py={4}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Aprovações de Preços
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Analise e aprove os preços de venda submetidos pelo Financeiro
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={carregarDados}
            disabled={loading}
          >
            Atualizar
          </Button>
        </Box>

        {/* Estatísticas */}
        {estatisticas && (
          <Grid container spacing={2} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total de Preços
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {estatisticas.total}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'warning.lighter' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Pendentes
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.dark">
                    {estatisticas.por_status.pendente}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'success.lighter' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Aprovados
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.dark">
                    {estatisticas.por_status.aprovado}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'error.lighter' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Rejeitados
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.dark">
                    {estatisticas.por_status.rejeitado}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Erros */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        )}

        {/* Tabela de Preços Pendentes */}
        {!loading && precosPendentes.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Nenhuma Aprovação Pendente
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Todos os preços foram analisados. Parabéns!
            </Typography>
          </Paper>
        ) : (
          !loading && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>Serviço</TableCell>
                    <TableCell>Obra</TableCell>
                    <TableCell align="right">Custo</TableCell>
                    <TableCell align="right">Venda</TableCell>
                    <TableCell align="right">Margem %</TableCell>
                    <TableCell>Submetido em</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedPrecosPendentes.map((preco) => {
                    const margemPercentual = toNumber(preco.margem_percentual);

                    return (
                      <TableRow key={preco.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {preco.servico?.nome || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{preco.obra?.nome || 'N/A'}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">R$ {formatarValor(preco.preco_custo)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            R$ {formatarValor(preco.preco_venda)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${margemPercentual.toFixed(1)}%`}
                            size="small"
                            color={margemPercentual >= 20 ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {formatarData(preco.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Analisar e Aprovar">
                            <IconButton
                              color="primary"
                              onClick={() => handleAbrirDialog(preco)}
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <LeftAlignedTablePagination
                count={precosPendentes.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </TableContainer>
          )
        )}
      </Box>

      {/* Dialog de Aprovação */}
      <AprovarPrecoDialog
        aberto={dialogAberto}
        preco={precoSelecionado}
        onFechar={() => {
          setDialogAberto(false);
          setPrecoSelecionado(null);
        }}
        onSucesso={handleSucesso}
      />
    </Container>
  );
};
