import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import LeftAlignedTablePagination from '../../components/LeftAlignedTablePagination';
import { useClientPagination } from '../../hooks/useClientPagination';
import { api } from '../../services/api';

export const AuditoriaPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('');
  const [filtroTabela, setFiltroTabela] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    carregarLogs();
  }, []);

  const carregarLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/auditoria/logs');
      setLogs(response.data);
    } catch (err: any) {
      setError('Erro ao carregar logs de auditoria');
      console.error('Erro:', err);
      // Se não tiver endpoint, mostrar mensagem informativa
      if (err.response?.status === 404) {
        setError('Módulo de auditoria ainda não implementado no backend');
      }
    } finally {
      setLoading(false);
    }
  };

  const filtrarLogs = () => {
    let resultado = logs;

    if (filtroAcao) {
      resultado = resultado.filter((log) =>
        log.acao?.toLowerCase().includes(filtroAcao.toLowerCase())
      );
    }

    if (filtroTabela) {
      resultado = resultado.filter((log) =>
        log.tabela?.toLowerCase().includes(filtroTabela.toLowerCase())
      );
    }

    if (dataInicio) {
      resultado = resultado.filter(
        (log) => new Date(log.data_hora) >= new Date(dataInicio)
      );
    }

    if (dataFim) {
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59);
      resultado = resultado.filter(
        (log) => new Date(log.data_hora) <= fim
      );
    }

    return resultado;
  };

  const logsFiltr = filtrarLogs();
  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedLogs,
    handlePageChange,
    handleRowsPerPageChange,
    resetPagination,
  } = useClientPagination(logsFiltr);

  useEffect(() => {
    resetPagination();
  }, [filtroAcao, filtroTabela, dataInicio, dataFim, resetPagination]);

  const getCorAcao = (acao: string) => {
    const tipo = acao?.toLowerCase() || '';
    if (tipo.includes('delete')) return 'error';
    if (tipo.includes('create') || tipo.includes('insert')) return 'success';
    if (tipo.includes('update')) return 'warning';
    return 'default';
  };

  const formatarData = (data: string) => {
    try {
      return new Date(data).toLocaleString('pt-BR');
    } catch {
      return data;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          📋 Logs de Auditoria
        </Typography>
        <Typography color="textSecondary">
          Histórico de todas as ações realizadas no sistema
        </Typography>
      </Box>

      {/* Stats */}
      <Card sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
        <CardContent>
          <Typography>
            <strong>Total de Registros:</strong> {logs.length}
          </Typography>
        </CardContent>
      </Card>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          <TextField
            label="Filtrar por Ação"
            value={filtroAcao}
            onChange={(e) => setFiltroAcao(e.target.value)}
            placeholder="Ex: INSERT, UPDATE, DELETE"
            size="small"
          />
          <TextField
            label="Filtrar por Tabela"
            value={filtroTabela}
            onChange={(e) => setFiltroTabela(e.target.value)}
            placeholder="Ex: tb_pavimentos"
            size="small"
          />
          <TextField
            label="Data Início"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="Data Fim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setFiltroAcao('');
                setFiltroTabela('');
                setDataInicio('');
                setDataFim('');
              }}
              fullWidth
            >
              Limpar Filtros
            </Button>
            <Button
              variant="contained"
              onClick={carregarLogs}
              disabled={loading}
            >
              Recarregar
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabela */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Data/Hora</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Usuário</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ação</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tabela</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>ID do Registro</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Detalhes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logsFiltr.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    {logs.length === 0
                      ? 'Nenhum log de auditoria disponível'
                      : 'Nenhum resultado com os filtros aplicados'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontSize: '0.9rem' }}>
                      {formatarData(log.data_hora)}
                    </TableCell>
                    <TableCell>{log.usuario_email || 'Desconhecido'}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.acao}
                        color={getCorAcao(log.acao) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {log.tabela}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {log.id_registro?.substring(0, 8) || '-'}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Typography variant="caption" display="block">
                        {typeof log.detalhes === 'object'
                          ? JSON.stringify(log.detalhes).substring(0, 50)
                          : log.detalhes || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <LeftAlignedTablePagination
            count={logsFiltr.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </TableContainer>
      )}
    </Container>
  );
};
