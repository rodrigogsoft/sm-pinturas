import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Button,
  Grid,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useState } from 'react';
import GetAppIcon from '@mui/icons-material/GetApp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { relatoriosAPI } from '../../services/api';
import obrasService, { Obra } from '../../services/obras.service';
import { MedicaoRelatorio, MedicoesResponse } from '../../types/relatorios';

type Periodo = 'dia' | 'semana' | 'mes' | 'ano';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const RelatarioMedicoesPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MedicaoRelatorio[]>([]);
  const [selectedMedicao, setSelectedMedicao] = useState<MedicaoRelatorio | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
    const handleRowClick = (params: any) => {
      setSelectedMedicao(params.row);
      setModalOpen(true);
    };

    const handleCloseModal = () => {
      setModalOpen(false);
      setSelectedMedicao(null);
    };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [obraFilter, setObraFilter] = useState('');
  const [obras, setObras] = useState<Obra[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const toNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const fetchMedicoes = async (newPage = 0) => {
    setLoading(true);
    setError('');
    try {
      const params: any = {
        page: newPage + 1,
        limit: pageSize,
        periodo,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
      };
      if (statusFilter) {
        params.status_pagamento = statusFilter;
      }
      if (obraFilter && UUID_REGEX.test(obraFilter)) {
        params.id_obra = obraFilter;
      }
      const response = await relatoriosAPI.getMedicoes(params);
      const typedResponse = response.data as unknown as MedicoesResponse & {
        data?: MedicaoRelatorio[];
        meta?: { total?: number };
      };
      const medicoes = Array.isArray(typedResponse.medicoes)
        ? typedResponse.medicoes
        : Array.isArray(typedResponse.data)
          ? typedResponse.data.map((item: any) => ({
              id_medicao: item.id || item.id_medicao || '',
              nome_obra: item.obra || item.nome_obra || 'N/A',
              data_medicao: item.data || item.data_medicao || '',
              area_pintada: toNumber(item.quantidade ?? item.area_pintada),
              valor_total: toNumber(item.valor_total),
              status_pagamento: item.status || item.status_pagamento || 'PENDENTE',
              encarregado: item.encarregado || item.colaborador || 'N/A',
            }))
          : [];
      const totalRegistros = typeof typedResponse.total === 'number'
        ? typedResponse.total
        : typeof typedResponse.meta?.total === 'number'
          ? typedResponse.meta.total
          : medicoes.length;

      setData(medicoes);
      setTotal(totalRegistros);
      setPage(newPage);
    } catch (err: any) {
      console.error('Erro ao carregar medições:', err);
      setError(err.message || 'Erro ao carregar medições');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicoes(0);
  }, [pageSize, statusFilter, obraFilter, periodo, dataInicio, dataFim]);

  useEffect(() => {
    obrasService.listarAtivas().then(setObras);
  }, []);

  const headers = ['ID Medição', 'Obra', 'Data', 'Área (m²)', 'Status', 'Encarregado'];
  const rows = data.map((item) => [
    item.id_medicao,
    item.nome_obra,
    new Date(item.data_medicao).toLocaleDateString('pt-BR'),
    toNumber(item.area_pintada).toFixed(2),
    item.status_pagamento,
    item.encarregado,
  ]);

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `medicoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleExportXLSX = () => {
    if (data.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Medições');
    XLSX.writeFile(wb, `medicoes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    if (data.length === 0) return;
    const doc = new jsPDF();
    doc.text('Relatório de Medições', 14, 16);
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 160, 133] },
    });
    doc.save(`medicoes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const columns: GridColDef[] = [
    {
      field: 'id_medicao',
      headerName: 'ID Medição',
      width: 150,
    },
    {
      field: 'nome_obra',
      headerName: 'Obra',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'data_medicao',
      headerName: 'Data Medição',
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString('pt-BR');
      },
    },
    {
      field: 'area_pintada',
      headerName: 'Área (m²)',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return '-';
        return Number(params.value).toFixed(2);
      },
    },
    {
      field: 'status_pagamento',
      headerName: 'Status Pagamento',
      width: 150,
      valueFormatter: (params) => {
        const status = params.value || 'PENDENTE';
        const statusMap: any = {
          PENDENTE: '⏳ Pendente',
          PAGO: '✅ Pago',
          ATRASADO: '⚠️ Atrasado',
        };
        return statusMap[status] || status;
      },
    },
    {
      field: 'encarregado',
      headerName: 'Encarregado',
      flex: 1,
      minWidth: 150,
    },
  ];

  if (loading && data.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/financeiro')}
            sx={{ textTransform: 'none' }}
          >
            Voltar
          </Button>
          <Typography variant="h4">Relatório de Medições</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<GetAppIcon />}
          onClick={handleExportCSV}
          disabled={data.length === 0}
          sx={{ mr: 1 }}
        >
          Exportar CSV
        </Button>
        <Button
          variant="outlined"
          startIcon={<GetAppIcon />}
          onClick={handleExportXLSX}
          disabled={data.length === 0}
          sx={{ mr: 1 }}
        >
          Exportar XLSX
        </Button>
        <Button
          variant="outlined"
          startIcon={<GetAppIcon />}
          onClick={handleExportPDF}
          disabled={data.length === 0}
        >
          Exportar PDF
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Período"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as Periodo)}
            >
              <MenuItem value="dia">Hoje</MenuItem>
              <MenuItem value="semana">Esta semana</MenuItem>
              <MenuItem value="mes">Este mês</MenuItem>
              <MenuItem value="ano">Este ano</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Data inicial"
              InputLabelProps={{ shrink: true }}
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Data final"
              InputLabelProps={{ shrink: true }}
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Status de Pagamento"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="PENDENTE">Pendente</MenuItem>
              <MenuItem value="PAGO">Pago</MenuItem>
              <MenuItem value="ATRASADO">Atrasado</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Obra"
              value={obraFilter}
              onChange={(e) => {
                const obraId = String(e.target.value || '');
                setObraFilter(obraId && UUID_REGEX.test(obraId) ? obraId : '');
              }}
            >
              <MenuItem value="">Todas</MenuItem>
              {obras.map((obra) => (
                <MenuItem key={obra.id} value={obra.id}>{obra.nome}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total de Registros: <strong>{total}</strong>
          </Typography>
        </Box>
      </Paper>

      <Paper sx={{ width: '100%', height: 600 }}>
        <DataGrid
          rows={data}
          getRowId={(row) => row.id_medicao}
          columns={columns}
          rowCount={total}
          paginationModel={{ pageSize, page }}
          onPaginationModelChange={(newModel) => {
            setPageSize(newModel.pageSize);
            fetchMedicoes(newModel.page);
          }}
          pageSizeOptions={[10, 25, 50]}
          loading={loading}
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
        />

        {/* Modal de detalhes da medição */}
        <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
          <DialogTitle>
            Detalhes da Medição
            <IconButton
              aria-label="close"
              onClick={handleCloseModal}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedMedicao && (
              <Box>
                <Typography><strong>ID Medição:</strong> {selectedMedicao.id_medicao}</Typography>
                <Typography><strong>Obra:</strong> {selectedMedicao.nome_obra}</Typography>
                <Typography><strong>Data:</strong> {new Date(selectedMedicao.data_medicao).toLocaleDateString('pt-BR')}</Typography>
                <Typography><strong>Área Pintada:</strong> {toNumber(selectedMedicao.area_pintada).toFixed(2)} m²</Typography>
                <Typography><strong>Valor Total:</strong> {formatCurrency(toNumber(selectedMedicao.valor_total))}</Typography>
                <Typography><strong>Status Pagamento:</strong> {selectedMedicao.status_pagamento}</Typography>
                <Typography><strong>Encarregado:</strong> {selectedMedicao.encarregado}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} color="primary">Fechar</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};
