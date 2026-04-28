import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Box,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Typography,
  Alert,
  Tooltip,
} from '@mui/material';
import LeftAlignedTablePagination from '../../../components/LeftAlignedTablePagination';
import { useClientPagination } from '../../../hooks/useClientPagination';
import { TabelaPreco } from '../../../services/precos.service';

interface PrecosTableProps {
  precos: TabelaPreco[];
  loading: boolean;
  error?: string | null;
  userPerfil?: string;
  podeAprovar?: boolean;
  podeSubmeter?: boolean;
  podeEditar?: boolean;
  podeDeletar?: boolean;
  selectedIds?: string[];
  onToggleSelecionado?: (id: string) => void;
  onToggleSelecionarTodos?: () => void;
  onAprovar?: (id: string, status: 'APROVADO' | 'REJEITADO', obs?: string) => Promise<void>;
  onSubmeter?: (id: string) => Promise<void>;
  onRetornarParaRascunho?: (id: string) => Promise<void>;
  onEditar?: (id: string) => void;
  onDeletar?: (id: string) => Promise<void>;
}

const PrecosTable: React.FC<PrecosTableProps> = ({
  precos,
  loading,
  error,
  userPerfil,
  podeAprovar = false,
  podeSubmeter = false,
  podeEditar = false,
  podeDeletar = false,
  selectedIds = [],
  onToggleSelecionado,
  onToggleSelecionarTodos,
  onAprovar,
  onSubmeter,
  onRetornarParaRascunho,
  onEditar,
  onDeletar,
}) => {
  const [precoSelecionado, setPrecoSelecionado] = useState<TabelaPreco | null>(null);
  const [dialogAprovacao, setDialogAprovacao] = useState(false);
  const [statusAprovacao, setStatusAprovacao] = useState<'APROVADO' | 'REJEITADO'>('APROVADO');
  const [observacoes, setObservacoes] = useState('');
  const [processando, setProcessando] = useState(false);

  const handleAbrirDialogAprovacao = (preco: TabelaPreco) => {
    setPrecoSelecionado(preco);
    setStatusAprovacao('APROVADO');
    setObservacoes('');
    setDialogAprovacao(true);
  };

  const handleAprovar = async () => {
    if (!precoSelecionado || !onAprovar) return;

    if (statusAprovacao === 'REJEITADO' && observacoes.trim().length < 10) {
      alert('Justificativa obrigatoria (minimo 10 caracteres)');
      return;
    }

    try {
      setProcessando(true);
      await onAprovar(precoSelecionado.id, statusAprovacao, observacoes);
      setDialogAprovacao(false);
    } catch (err: any) {
      console.error('Erro ao aprovar:', err);
    } finally {
      setProcessando(false);
    }
  };

  const handleDeletar = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este preço?')) {
      try {
        await onDeletar?.(id);
      } catch (err: any) {
        console.error('Erro ao deletar:', err);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RASCUNHO':
        return 'default';
      case 'APROVADO':
        return 'success';
      case 'REJEITADO':
        return 'error';
      default:
        return 'warning';
    }
  };

  // RN01: Mascarar preco_venda para ENCARREGADO
  const podeVerPrecosVenda = userPerfil !== 'ENCARREGADO';
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const toNumber = (valor: unknown, fallback = 0): number => {
    if (typeof valor === 'number') {
      return Number.isFinite(valor) ? valor : fallback;
    }

    if (typeof valor === 'string') {
      const normalizado = valor.replace(',', '.').trim();
      if (!normalizado) {
        return fallback;
      }
      const parsed = Number(normalizado);
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
  };
  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedPrecos,
    handlePageChange,
    handleRowsPerPageChange,
  } = useClientPagination(precos);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={precos.length > 0 && selectedIds.length === precos.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < precos.length}
                  onChange={onToggleSelecionarTodos}
                  disabled={precos.length === 0}
                />
              </TableCell>
              <TableCell>Serviço</TableCell>
              <TableCell align="right">Preço Custo</TableCell>
              {podeVerPrecosVenda && (
                <>
                  <TableCell align="right">Preço Venda</TableCell>
                  <TableCell align="right">Margem %</TableCell>
                </>
              )}
              <TableCell>Status</TableCell>
              <TableCell>Aprovador</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {precos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={podeVerPrecosVenda ? 8 : 6} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    Nenhum preço cadastrado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPrecos.map((preco) => (
                <TableRow key={preco.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.includes(String(preco.id))}
                      onChange={() => onToggleSelecionado?.(String(preco.id))}
                    />
                  </TableCell>
                  <TableCell>
                    {preco.servico?.nome || `Serviço ${preco.id_servico_catalogo}`}
                  </TableCell>
                  <TableCell align="right">
                    {formatarMoeda(toNumber(preco.preco_custo))}
                  </TableCell>
                  {podeVerPrecosVenda && (
                    <>
                      <TableCell align="right">
                        {formatarMoeda(toNumber(preco.preco_venda))}
                      </TableCell>
                      <TableCell align="right">
                        {(() => {
                          const margemMinima = preco.obra?.margem_minima_percentual ?? 20;
                          const margem = toNumber(preco.margem_percentual);
                          return (
                            <Chip
                              label={`${margem.toFixed(2)}%`}
                              color={margem >= margemMinima ? 'success' : 'warning'}
                              size="small"
                            />
                          );
                        })()}
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <Box>
                      <Chip
                        label={preco.status_aprovacao}
                        color={getStatusColor(preco.status_aprovacao) as any}
                        size="small"
                      />
                      {(preco.status_aprovacao === 'RASCUNHO' || preco.status_aprovacao === 'REJEITADO') && (
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                          Aguardando submeter
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {preco.aprovador?.nome_completo || '—'}
                  </TableCell>
                  <TableCell>
                    {podeSubmeter && onSubmeter &&
                      (preco.status_aprovacao === 'RASCUNHO' ||
                        preco.status_aprovacao === 'REJEITADO') && (
                        <Tooltip title="Envia este preço para aprovação (status PENDENTE)">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onSubmeter(preco.id)}
                            sx={{ mr: 1 }}
                          >
                            Submeter
                          </Button>
                        </Tooltip>
                      )}
                    {preco.status_aprovacao === 'PENDENTE' && onAprovar && podeAprovar && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleAbrirDialogAprovacao(preco)}
                        sx={{ mr: 1 }}
                      >
                        Aprovar
                      </Button>
                    )}
                    {(preco.status_aprovacao === 'PENDENTE' ||
                      preco.status_aprovacao === 'APROVADO') &&
                      onRetornarParaRascunho &&
                      podeEditar && (
                        <Tooltip title="Retorna para rascunho para permitir edição e nova submissão">
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            onClick={() => onRetornarParaRascunho(preco.id)}
                            sx={{ mr: 1 }}
                          >
                            Voltar rascunho
                          </Button>
                        </Tooltip>
                      )}
                    {(preco.status_aprovacao === 'RASCUNHO' ||
                      preco.status_aprovacao === 'REJEITADO') &&
                      onEditar &&
                      podeEditar && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onEditar(preco.id)}
                        sx={{ mr: 1 }}
                      >
                        Editar
                      </Button>
                    )}
                    {onDeletar && podeDeletar && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeletar(preco.id)}
                      >
                        Deletar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <LeftAlignedTablePagination
          count={precos.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </TableContainer>

      {/* Dialog de Aprovação */}
      <Dialog open={dialogAprovacao} onClose={() => setDialogAprovacao(false)} fullWidth>
        <DialogTitle>Avaliar Preço de Venda</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {precoSelecionado && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Serviço:</strong> {precoSelecionado.servico?.nome || 'N/A'}<br />
                <strong>Preço Custo:</strong> R$ {toNumber(precoSelecionado.preco_custo).toFixed(2)}<br />
                <strong>Preço Venda:</strong> R$ {toNumber(precoSelecionado.preco_venda).toFixed(2)}<br />
                <strong>Margem:</strong> {toNumber(precoSelecionado.margem_percentual).toFixed(2)}%<br />
                <strong>Margem Minima:</strong> {precoSelecionado.obra?.margem_minima_percentual ?? 20}%
              </Alert>
            </>
          )}

          <TextField
            fullWidth
            select
            label="Decisão"
            value={statusAprovacao}
            onChange={(e) => setStatusAprovacao(e.target.value as any)}
            margin="normal"
            SelectProps={{
              native: true,
            }}
          >
            <option value="APROVADO">✅ Aprovar</option>
            <option value="REJEITADO">❌ Rejeitar</option>
          </TextField>

          <TextField
            fullWidth
            label="Observações (motivo da rejeição, se aplicável)"
            multiline
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAprovacao(false)}>Cancelar</Button>
          <Button
            onClick={handleAprovar}
            variant="contained"
            disabled={processando}
            color={statusAprovacao === 'APROVADO' ? 'success' : 'error'}
          >
            {processando ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PrecosTable;
