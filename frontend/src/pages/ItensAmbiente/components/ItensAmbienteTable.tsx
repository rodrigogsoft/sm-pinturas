import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Checkbox,
} from '@mui/material';
import LeftAlignedTablePagination from '../../../components/LeftAlignedTablePagination';
import { useClientPagination } from '../../../hooks/useClientPagination';
import { ItemAmbiente } from '../../../services/itens-ambiente.service';

interface ItensAmbienteTableProps {
  itens: ItemAmbiente[];
  loading: boolean;
  error?: string | null;
  selectedIds?: string[];
  onToggleSelecionado?: (id: string) => void;
  onToggleSelecionarTodos?: () => void;
  onEditar?: (id: string) => void;
  onDeletar?: (id: string) => Promise<void>;
}

const ItensAmbienteTable: React.FC<ItensAmbienteTableProps> = ({
  itens,
  loading,
  error,
  selectedIds = [],
  onToggleSelecionado,
  onToggleSelecionarTodos,
  onEditar,
  onDeletar,
}) => {
  const montarNomeElementoExibicao = (item: ItemAmbiente): string => {
    const nomeBase = (item.nome_elemento || '').trim() || '—';
    const nomePavimento = item.ambiente?.pavimento?.nome;
    const nomeAmbiente = item.ambiente?.nome;

    if (!nomePavimento && !nomeAmbiente) {
      return nomeBase;
    }

    const sufixo = [nomePavimento, nomeAmbiente].filter(Boolean).join(' / ');
    return `${nomeBase} - ${sufixo}`;
  };

  const formatAreaPlanejada = (value: unknown) => {
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
    if (Number.isNaN(numericValue)) {
      return '0.00';
    }
    return numericValue.toFixed(2);
  };

  const handleDeletar = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este item?')) {
      try {
        await onDeletar?.(id);
      } catch (err: any) {
        console.error('Erro ao deletar:', err);
      }
    }
  };
  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedItens,
    handlePageChange,
    handleRowsPerPageChange,
  } = useClientPagination(itens);

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
                  checked={itens.length > 0 && selectedIds.length === itens.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < itens.length}
                  onChange={onToggleSelecionarTodos}
                  disabled={itens.length === 0}
                />
              </TableCell>
              <TableCell>Nome do Elemento</TableCell>
              <TableCell align="right">Área Planejada (m²)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {itens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    Nenhum item cadastrado para este ambiente
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedItens.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.includes(String(item.id))}
                      onChange={() => onToggleSelecionado?.(String(item.id))}
                    />
                  </TableCell>
                  <TableCell>
                    <strong>{montarNomeElementoExibicao(item)}</strong>
                  </TableCell>
                  <TableCell align="right">
                    {formatAreaPlanejada(item.area_planejada)}
                  </TableCell>
                  <TableCell>
                    {item.status || '—'}
                  </TableCell>
                  <TableCell>
                    {onEditar && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onEditar(item.id)}
                        sx={{ mr: 1 }}
                      >
                        Editar
                      </Button>
                    )}
                    {onDeletar && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeletar(item.id)}
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
          count={itens.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </TableContainer>
    </>
  );
};

export default ItensAmbienteTable;
