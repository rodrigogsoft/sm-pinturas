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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useEffect, useState } from 'react';
import GetAppIcon from '@mui/icons-material/GetApp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { relatoriosAPI } from '../../services/api';
import { ProdutividadeColaborador, ProdutividadeResponse } from '../../types/relatorios';

type Periodo = 'dia' | 'semana' | 'mes' | 'ano';

export const RelatarioProdutividadePage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ProdutividadeColaborador[]>([]);
  const [selectedColaborador, setSelectedColaborador] = useState<ProdutividadeColaborador | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [periodInfo, setPeriodInfo] = useState({ data_inicio: '', data_fim: '' });
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const toNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizarColaborador = (item: any): ProdutividadeColaborador => ({
    id_colaborador: item?.id_colaborador || item?.colaborador_id || '',
    nome_colaborador: item?.nome_colaborador || item?.colaborador_nome || 'N/A',
    total_horas: toNumber(item?.total_horas ?? item?.total_medicoes),
    area_total_pintada: toNumber(item?.area_total_pintada ?? item?.total_unidades),
    horas_por_m2: toNumber(item?.horas_por_m2 ?? item?.media_por_medicao),
  });

  const fetchProdutividade = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await relatoriosAPI.getProdutividade({
        periodo,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
      });
      const typedResponse = response.data as unknown as
        | ProdutividadeResponse
        | {
            periodo?: { inicio?: string; fim?: string };
            colaboradores?: Array<{
              colaborador_id?: string;
              colaborador_nome?: string;
              total_unidades?: number | string;
              media_por_medicao?: number | string;
              total_medicoes?: number | string;
            }>;
          };

      const colaboradores = Array.isArray((typedResponse as { colaboradores?: unknown[] }).colaboradores)
        ? ((typedResponse as { colaboradores: any[] }).colaboradores).map((item) => normalizarColaborador(item))
        : [];

      setData(colaboradores);
      setPeriodInfo({
        data_inicio:
          (typedResponse as ProdutividadeResponse).data_inicio ||
          (typedResponse as { periodo?: { inicio?: string } }).periodo?.inicio ||
          dataInicio,
        data_fim:
          (typedResponse as ProdutividadeResponse).data_fim ||
          (typedResponse as { periodo?: { fim?: string } }).periodo?.fim ||
          dataFim,
      });
    } catch (err: any) {
      console.error('Erro ao carregar produtividade:', err);
      setError(err.message || 'Erro ao carregar dados de produtividade');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutividade();
  }, [periodo, dataInicio, dataFim]);

  const headers = ['ID Colaborador', 'Nome', 'Medições Totais'];
  const rows = data.map((item) => [
    item.id_colaborador,
    item.nome_colaborador,
    toNumber(item.area_total_pintada).toFixed(2),
  ]);

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `produtividade_${periodo}_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleExportXLSX = () => {
    if (data.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produtividade');
    XLSX.writeFile(wb, `produtividade_${periodo}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    if (data.length === 0) return;
    const doc = new jsPDF();
    doc.text('Relatório de Produtividade', 14, 16);
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 160, 133] },
    });
    doc.save(`produtividade_${periodo}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const columns: GridColDef[] = [
    {
      field: 'nome_colaborador',
      headerName: 'Colaborador',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'area_total_pintada',
      headerName: 'Medições Totais',
      width: 180,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        const value = toNumber(params.value);
        return value.toFixed(2);
      },
    },
  ];

  if (loading) {
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
          <Typography variant="h4">Relatório de Produtividade</Typography>
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
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Período"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as Periodo)}
            >
              <MenuItem value="dia">Hoje</MenuItem>
              <MenuItem value="semana">Esta Semana</MenuItem>
              <MenuItem value="mes">Este Mês</MenuItem>
              <MenuItem value="ano">Este Ano</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Data inicial"
              InputLabelProps={{ shrink: true }}
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Data final"
              InputLabelProps={{ shrink: true }}
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Período:{' '}
              <strong>
                {periodInfo.data_inicio ? new Date(periodInfo.data_inicio).toLocaleDateString('pt-BR') : '-'} a{' '}
                {periodInfo.data_fim ? new Date(periodInfo.data_fim).toLocaleDateString('pt-BR') : '-'}
              </strong>{' '}
              • Total de Colaboradores: <strong>{data.length}</strong>
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ width: '100%', height: 600 }}>
        <DataGrid
          rows={data}
          getRowId={(row) => row.id_colaborador}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
            sorting: {
              sortModel: [{ field: 'area_total_pintada', sort: 'desc' }],
            },
          }}
          loading={loading}
          disableRowSelectionOnClick
          onRowClick={(params) => {
            setSelectedColaborador(params.row);
            setOpenModal(true);
          }}
        />
      </Paper>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Detalhes do Colaborador
          <IconButton onClick={() => setOpenModal(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedColaborador && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>ID:</strong> {selectedColaborador.id_colaborador}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Nome:</strong> {selectedColaborador.nome_colaborador}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Medições Totais:</strong> {toNumber(selectedColaborador.area_total_pintada).toFixed(2)}
              </Typography>
              {/* Histórico de períodos ou outros detalhes podem ser adicionados aqui */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          💡 A coluna <strong>Medições Totais</strong> representa o total consolidado de medições por colaborador no período filtrado.
        </Typography>
      </Box>
    </Box>
  );
};
