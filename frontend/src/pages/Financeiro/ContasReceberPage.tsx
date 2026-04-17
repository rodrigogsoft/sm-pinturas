import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import { api, relatoriosAPI } from '../../services/api';

interface MedicaoFinanceira {
  id_medicao: string;
  cliente: string;
  nome_obra: string;
  servico: string;
  data_medicao: string;
  medicao: number;
  valor_total: number;
  status_pagamento: string;
}

interface RecebivelAgrupadoObra {
  key: string;
  cliente: string;
  nome_obra: string;
  competencia: string;
  medicao_total: number;
  valor_total: number;
  status_pagamento: string;
  ids_medicoes: string[];
}

const formatarCompetencia = (valor?: string) => {
  if (!valor) {
    return '-';
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return data.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const ContasReceberPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [medicoes, setMedicoes] = useState<MedicaoFinanceira[]>([]);
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [obraSelecionada, setObraSelecionada] = useState<RecebivelAgrupadoObra | null>(null);
  const [obraProcessando, setObraProcessando] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setError('');

        const limite = 200;
        let pagina = 1;
        let acumulado: MedicaoFinanceira[] = [];

        while (true) {
          const response = await relatoriosAPI.getMedicoes({
            page: pagina,
            limit: limite,
            periodo: 'ano',
          });

          const raw = response.data as any;
          const listaPagina: MedicaoFinanceira[] = Array.isArray(raw?.medicoes)
            ? raw.medicoes
            : Array.isArray(raw?.data)
              ? raw.data.map((item: any) => ({
                  id_medicao: item.id || item.id_medicao || '',
                  cliente: item.cliente || '-',
                  nome_obra: item.obra || item.nome_obra || '-',
                  servico: item.servico || 'Serviço não informado',
                  data_medicao: item.data || item.data_medicao || '',
                  medicao: toNumber(item.quantidade ?? item.area_pintada),
                  valor_total: toNumber(item.valor_total),
                  status_pagamento: item.status || item.status_pagamento || 'ABERTO',
                }))
              : [];

          acumulado = [...acumulado, ...listaPagina];

          if (listaPagina.length < limite) {
            break;
          }

          pagina += 1;
        }

        setMedicoes(acumulado);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar contas a receber.');
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const contasEmAberto = useMemo(
    () => medicoes.filter((m) => (m.status_pagamento || '').toUpperCase() !== 'PAGO'),
    [medicoes]
  );

  const valorMedicao = (item: MedicaoFinanceira) => {
    return toNumber(item.valor_total);
  };

  const totalReceber = useMemo(
    () => contasEmAberto.reduce((sum, item) => sum + valorMedicao(item), 0),
    [contasEmAberto]
  );

  const recebiveisAgrupados = useMemo<RecebivelAgrupadoObra[]>(() => {
    const grouped = new Map<string, RecebivelAgrupadoObra & { competencias: Set<string> }>();

    contasEmAberto.forEach((item) => {
      const key = `${item.cliente}::${item.nome_obra}`;
      const competencia = formatarCompetencia(item.data_medicao);
      const atual = grouped.get(key);

      if (!atual) {
        grouped.set(key, {
          key,
          cliente: item.cliente || '-',
          nome_obra: item.nome_obra || '-',
          competencia,
          medicao_total: toNumber(item.medicao),
          valor_total: valorMedicao(item),
          status_pagamento: item.status_pagamento || 'ABERTO',
          ids_medicoes: [item.id_medicao],
          competencias: new Set([competencia]),
        });
        return;
      }

      atual.medicao_total += toNumber(item.medicao);
      atual.valor_total += valorMedicao(item);
      atual.ids_medicoes.push(item.id_medicao);
      atual.competencias.add(competencia);
    });

    return Array.from(grouped.values()).map((item) => ({
      key: item.key,
      cliente: item.cliente,
      nome_obra: item.nome_obra,
      competencia:
        item.competencias.size > 1
          ? 'Múltiplas'
          : Array.from(item.competencias)[0] || '-',
      medicao_total: item.medicao_total,
      valor_total: item.valor_total,
      status_pagamento: item.status_pagamento,
      ids_medicoes: item.ids_medicoes,
    }));
  }, [contasEmAberto]);

  const detalhamentoServicos = useMemo(() => {
    if (!obraSelecionada) {
      return [] as Array<{ servico: string; medicao: number; valor: number }>;
    }

    const itensDaObra = contasEmAberto.filter(
      (item) =>
        item.nome_obra === obraSelecionada.nome_obra &&
        item.cliente === obraSelecionada.cliente,
    );

    const grouped = new Map<string, { servico: string; medicao: number; valor: number }>();

    itensDaObra.forEach((item) => {
      const servico = item.servico || 'Serviço não informado';
      const atual = grouped.get(servico);

      if (!atual) {
        grouped.set(servico, {
          servico,
          medicao: toNumber(item.medicao),
          valor: valorMedicao(item),
        });
        return;
      }

      atual.medicao += toNumber(item.medicao);
      atual.valor += valorMedicao(item);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.servico.localeCompare(b.servico, 'pt-BR'),
    );
  }, [obraSelecionada, contasEmAberto]);

  const abrirDetalhes = (item: RecebivelAgrupadoObra) => {
    setObraSelecionada(item);
    setDetalheAberto(true);
  };

  const marcarObraComoRecebida = async (item: RecebivelAgrupadoObra) => {
    if (!window.confirm(`Marcar todos os recebíveis da obra ${item.nome_obra} como recebidos?`)) {
      return;
    }

    try {
      setObraProcessando(item.key);
      await Promise.all(
        item.ids_medicoes.map((idMedicao) =>
          api.patch(`/medicoes/${idMedicao}`, { status_pagamento: 'PAGO' }),
        ),
      );

      setMedicoes((anteriores) =>
        anteriores.map((medicao) =>
          item.ids_medicoes.includes(medicao.id_medicao)
            ? { ...medicao, status_pagamento: 'PAGO' }
            : medicao,
        ),
      );
    } catch (err: any) {
      setError(err?.message || 'Erro ao marcar recebível como recebido.');
    } finally {
      setObraProcessando(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Exportação
  const headers = ['Cliente', 'Obra', 'Competência', 'Medição', 'Valor', 'Status'];
  const rows = recebiveisAgrupados.map((item) => [
    item.cliente || '-',
    item.nome_obra || '-',
    item.competencia,
    toNumber(item.medicao_total).toFixed(2),
    toNumber(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    item.status_pagamento || 'ABERTO',
  ]);

  const handleExportCSV = () => {
    if (recebiveisAgrupados.length === 0) return;
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contas_receber_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleExportXLSX = () => {
    if (recebiveisAgrupados.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contas a Receber');
    XLSX.writeFile(wb, `contas_receber_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    if (recebiveisAgrupados.length === 0) return;
    const doc = new jsPDF();
    doc.text('Contas a Receber', 14, 16);
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 160, 133] },
    });
    doc.save(`contas_receber_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/financeiro')}>
            Voltar
          </Button>
          <Typography variant="h4">Contas a Receber</Typography>
      </Box>
        <Box>
          <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportCSV} disabled={recebiveisAgrupados.length === 0}>Exportar CSV</Button>
          <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportXLSX} disabled={recebiveisAgrupados.length === 0}>Exportar XLSX</Button>
          <Button variant="outlined" onClick={handleExportPDF} disabled={recebiveisAgrupados.length === 0}>Exportar PDF</Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total a Receber
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {totalReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Medições em Aberto
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {contasEmAberto.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Obra</TableCell>
              <TableCell>Competência</TableCell>
              <TableCell align="right">Medição</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recebiveisAgrupados.map((item) => (
              <TableRow key={item.key} hover>
                <TableCell>{item.cliente || '-'}</TableCell>
                <TableCell>
                  {item.nome_obra || '-'}
                </TableCell>
                <TableCell>
                  {item.competencia}
                </TableCell>
                <TableCell align="right">{toNumber(item.medicao_total).toFixed(2)}</TableCell>
                <TableCell align="right">
                  {toNumber(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
                <TableCell>{(item.status_pagamento || 'ABERTO') === 'PAGO' ? 'RECEBIDO' : (item.status_pagamento || 'ABERTO')}</TableCell>
                <TableCell align="center">
                  <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => abrirDetalhes(item)}>
                    Detalhes
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    disabled={obraProcessando === item.key}
                    onClick={() => marcarObraComoRecebida(item)}
                  >
                    {obraProcessando === item.key ? 'Processando...' : 'Marcar como recebido'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {recebiveisAgrupados.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhuma medição pendente encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={detalheAberto} onClose={() => setDetalheAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalhes por Serviço</DialogTitle>
        <DialogContent dividers>
          {obraSelecionada && (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box sx={{ display: 'grid', gap: 0.5 }}>
                <Typography><strong>Cliente:</strong> {obraSelecionada.cliente || '-'}</Typography>
                <Typography><strong>Obra:</strong> {obraSelecionada.nome_obra || '-'}</Typography>
                <Typography><strong>Competência:</strong> {obraSelecionada.competencia}</Typography>
              </Box>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Serviço</TableCell>
                    <TableCell align="right">Medição</TableCell>
                    <TableCell align="right">Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalhamentoServicos.map((item) => (
                    <TableRow key={item.servico}>
                      <TableCell>{item.servico}</TableCell>
                      <TableCell align="right">{toNumber(item.medicao).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        {toNumber(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {detalhamentoServicos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">Sem serviços para exibir.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <Typography>
                <strong>Total da obra:</strong>{' '}
                {toNumber(obraSelecionada.valor_total).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetalheAberto(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
