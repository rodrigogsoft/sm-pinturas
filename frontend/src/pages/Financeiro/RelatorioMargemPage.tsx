import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Grid,
  TextField,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
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
import { MargemObraRelatorio, MargemLucroResponse } from '../../types/relatorios';
import { relatoriosAPI } from '../../services/api';
import obrasService, { Obra } from '../../services/obras.service';

type Periodo = 'dia' | 'semana' | 'mes' | 'ano';

export const RelatorioMargemPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MargemObraRelatorio[]>([]);
  const [selectedObra, setSelectedObra] = useState<MargemObraRelatorio | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [idObra, setIdObra] = useState('');
  const [obras, setObras] = useState<Obra[]>([]);

  const toNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const fetchMargem = async (newPage = 0) => {
    setLoading(true);
    setError('');
    try {
      const response = await relatoriosAPI.getMargemLucro({
        periodo,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        id_obra: idObra || undefined,
        page: newPage + 1,
        limit: pageSize,
      });
      const typedResponse = response.data as unknown as
        | MargemLucroResponse
        | {
            data?: Array<{
              id?: string;
              obra?: string;
              servico?: string;
              preco_venda?: number | string;
              preco_custo?: number | string;
              margem_percentual?: number | string;
            }>;
            meta?: { total?: number };
          };

      const itensBrutos = Array.isArray((typedResponse as MargemLucroResponse).obras)
        ? (typedResponse as MargemLucroResponse).obras
        : Array.isArray((typedResponse as { data?: unknown[] }).data)
          ? ((typedResponse as { data: any[] }).data).map((item) => {
              const precoVenda = toNumber(item.preco_venda);
              const precoCusto = toNumber(item.preco_custo);
              return {
                id_obra: String(item.id || ''),
                nome_obra: item.obra || 'N/A',
                servico: item.servico || 'N/A',
                valor_contrato: precoVenda,
                custo_total: precoCusto,
                margem_lucro: precoVenda - precoCusto,
                percentual_margem: toNumber(item.margem_percentual),
              } as MargemObraRelatorio;
            })
          : [];

      const itens = itensBrutos.map((item) => {
        const valorContrato = toNumber(item.valor_contrato);
        const custoTotal = toNumber(item.custo_total);
        const margemLucro = valorContrato - custoTotal;
        const percentualRecalculado = valorContrato > 0 ? (margemLucro / valorContrato) * 100 : 0;

        return {
          ...item,
          servico: item.servico || 'N/A',
          valor_contrato: valorContrato,
          custo_total: custoTotal,
          margem_lucro: margemLucro,
          percentual_margem: parseFloat(percentualRecalculado.toFixed(2)),
        };
      });

      const totalRegistros = typeof (typedResponse as MargemLucroResponse).total === 'number'
        ? (typedResponse as MargemLucroResponse).total
        : typeof (typedResponse as { meta?: { total?: number } }).meta?.total === 'number'
          ? (typedResponse as { meta: { total: number } }).meta.total
          : itens.length;

      setData(itens);
      setTotal(totalRegistros);
      setPage(newPage);
    } catch (err: any) {
      console.error('Erro ao carregar margem:', err);
      setError(err.message || 'Erro ao carregar margem de lucro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMargem(0);
  }, [pageSize, periodo, dataInicio, dataFim, idObra]);

  useEffect(() => {
    const carregarObras = async () => {
      try {
        const lista = await obrasService.listar();
        setObras(lista.filter((obra) => !obra.deletado));
      } catch {
        setObras([]);
      }
    };

    carregarObras();
  }, []);

  const headers = ['Obra', 'Serviço', 'Valor Contrato', 'Custo Total', 'Margem Lucro', 'Percentual'];
  const rows = data.map((item) => [
    item.nome_obra,
    item.servico || 'N/A',
    toNumber(item.valor_contrato).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    toNumber(item.custo_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    toNumber(item.margem_lucro).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    `${toNumber(item.percentual_margem).toFixed(2)}%`,
  ]);

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `margem_lucro_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleExportXLSX = () => {
    if (data.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Margem de Lucro');
    XLSX.writeFile(wb, `margem_lucro_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    if (data.length === 0) return;
    const doc = new jsPDF();
    doc.text('Relatório de Margem de Lucro', 14, 16);
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 160, 133] },
    });
    doc.save(`margem_lucro_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getMargemColor = (percentual: number): 'success' | 'warning' | 'error' => {
    if (percentual >= 20) return 'success';
    if (percentual >= 10) return 'warning';
    return 'error';
  };

  const columns: GridColDef[] = [
    {
      field: 'nome_obra',
      headerName: 'Obra',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'servico',
      headerName: 'Serviço',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'valor_contrato',
      headerName: 'Valor Contrato',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => formatCurrency(params.value),
    },
    {
      field: 'custo_total',
      headerName: 'Custo Total',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => formatCurrency(params.value),
    },
    {
      field: 'margem_lucro',
      headerName: 'Margem de Lucro',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => formatCurrency(params.value),
    },
    {
      field: 'percentual_margem',
      headerName: 'Percentual',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const percentual = params.value as number;
        return (
          <Chip
            label={`${percentual.toFixed(2)}%`}
            color={getMargemColor(percentual)}
            variant="filled"
            size="small"
          />
        );
      },
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

  const totalContrato = data.reduce((sum, item) => sum + item.valor_contrato, 0);
  const totalCusto = data.reduce((sum, item) => sum + item.custo_total, 0);
  const totalMargem = data.reduce((sum, item) => sum + item.margem_lucro, 0);
  const margemMedia = totalContrato > 0 ? (totalMargem / totalContrato) * 100 : 0;

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
          <Typography variant="h4">Relatório de Margem de Lucro</Typography>
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

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Obra"
              value={idObra}
              onChange={(e) => setIdObra(e.target.value)}
            >
              <MenuItem value="">Todas as obras</MenuItem>
              {obras.map((obra) => (
                <MenuItem key={obra.id} value={obra.id}>
                  {obra.nome}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Valor Total Contratos
            </Typography>
            <Typography variant="h6" color="primary">
              {formatCurrency(totalContrato)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Custo Total
            </Typography>
            <Typography variant="h6" color="error">
              {formatCurrency(totalCusto)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Margem Total
            </Typography>
            <Typography variant="h6" color="success.main">
              {formatCurrency(totalMargem)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              textAlign: 'center',
              bgcolor:
                margemMedia >= 20 ? 'success.light' : margemMedia >= 10 ? 'warning.light' : 'error.light',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Margem Média
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {margemMedia.toFixed(2)}%
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', height: 600 }}>
        <DataGrid
          rows={data}
          getRowId={(row) => row.id_obra || row.nome_obra}
          columns={columns}
          rowCount={total}
          paginationModel={{ pageSize, page }}
          onPaginationModelChange={(newModel) => {
            setPageSize(newModel.pageSize);
            fetchMargem(newModel.page);
          }}
          pageSizeOptions={[10, 25, 50]}
          loading={loading}
          disableRowSelectionOnClick
          onRowClick={(params) => {
            setSelectedObra(params.row);
            setOpenModal(true);
          }}
        />
      </Paper>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Detalhes da Obra
          <IconButton onClick={() => setOpenModal(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedObra && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Obra:</strong> {selectedObra.nome_obra}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Serviço:</strong> {selectedObra.servico || 'N/A'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Valor Contrato:</strong> {formatCurrency(toNumber(selectedObra.valor_contrato))}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Custo Total:</strong> {formatCurrency(toNumber(selectedObra.custo_total))}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Margem de Lucro:</strong> {formatCurrency(toNumber(selectedObra.margem_lucro))}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Percentual:</strong> {toNumber(selectedObra.percentual_margem).toFixed(2)}%
              </Typography>
              {/* Outros detalhes da obra podem ser exibidos aqui */}
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
        <Typography variant="caption" color="text.secondary" component="div">
          🎯 <strong>Análise de Margem</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          🟢 Verde: Margem ≥ 20% (Excelente) • 🟡 Amarelo: Margem 10%-20% (Bom) • 🔴 Vermelho: Margem &lt; 10%
          (Atenção)
        </Typography>
      </Box>
    </Box>
  );
};
