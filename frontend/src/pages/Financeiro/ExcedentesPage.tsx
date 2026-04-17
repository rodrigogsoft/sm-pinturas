import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
} from '@mui/material';
import LeftAlignedTablePagination from '../../components/LeftAlignedTablePagination';
import {
  Warning,
  CheckCircle,
  Photo,
  Info,
  FilterList,
  Refresh,
} from '@mui/icons-material';
import { useClientPagination } from '../../hooks/useClientPagination';
import { medicoesService } from '../../services/medicoes.service';

interface Medicao {
  id: string;
  qtd_executada: number;
  area_planejada: number;
  flag_excedente: boolean;
  justificativa: string | null;
  foto_evidencia_url: string | null;
  data_medicao: Date;
  alocacao: {
    colaborador: {
      nome: string;
    };
    itemAmbiente: {
      nome_item: string;
      ambiente: {
        nome: string;
      };
      tabelaPreco: {
        servico: {
          nome: string;
        };
      };
    };
  };
}

export const ExcedentesPage: React.FC = () => {
  
  const [medicoes, setMedicoes] = useState<Medicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroObra, setFiltroObra] = useState<string>('');
  const [filtroColaborador, setFiltroColaborador] = useState<string>('');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');
  const [detalheModal, setDetalheModal] = useState<Medicao | null>(null);
  const [fotoModal, setFotoModal] = useState<string | null>(null);
  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedMedicoes,
    handlePageChange,
    handleRowsPerPageChange,
    resetPagination,
  } = useClientPagination(medicoes);

  useEffect(() => {
    carregarExcedentes();
  }, []);

  // Exportação
  const exportHeaders = [
    'Data',
    'Colaborador',
    'Ambiente',
    'Serviço',
    'Planejado',
    'Executado',
    'Excedente',
    '% Excedente',
    'Justificativa',
    'Foto',
  ];
  const exportRows = medicoes.map((m) => [
    formatarData(m.data_medicao),
    m.alocacao.colaborador.nome,
    m.alocacao.itemAmbiente.ambiente.nome,
    m.alocacao.itemAmbiente.tabelaPreco.servico.nome,
    m.area_planejada?.toFixed(2) || '—',
    m.qtd_executada.toFixed(2),
    (m.qtd_executada - (m.area_planejada || 0)).toFixed(2),
    m.area_planejada ? (((m.qtd_executada - m.area_planejada) / m.area_planejada) * 100).toFixed(1) + '%' : '0%',
    m.justificativa || '',
    m.foto_evidencia_url || '',
  ]);

  const handleExportCSV = () => {
    if (!medicoes || medicoes.length === 0) return;
    const csv = [exportHeaders, ...exportRows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `excedentes_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleExportXLSX = () => {
    if (!medicoes || medicoes.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet([exportHeaders, ...exportRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Excedentes');
    XLSX.writeFile(wb, `excedentes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!medicoes || medicoes.length === 0) return;
    const doc = new jsPDF();
    doc.text('Excedentes', 14, 16);
    (doc as any).autoTable({
      head: [exportHeaders],
      body: exportRows,
      startY: 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 160, 133] },
    });
    doc.save(`excedentes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const carregarExcedentes = async () => {
    setLoading(true);
    try {
      const response = await medicoesService.listarExcedentes({
        id_obra: filtroObra || undefined,
        id_colaborador: filtroColaborador || undefined,
        data_inicio: filtroDataInicio || undefined,
        data_fim: filtroDataFim || undefined,
      });
      setMedicoes(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar excedentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = () => {
    carregarExcedentes();
  };

  const handleLimparFiltros = () => {
    setFiltroObra('');
    setFiltroColaborador('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
  };

  useEffect(() => {
    resetPagination();
  }, [filtroObra, filtroColaborador, filtroDataInicio, filtroDataFim, resetPagination]);

  const calcularExcedente = (medicao: Medicao): number => {
    return medicao.qtd_executada - (medicao.area_planejada || 0);
  };

  const calcularPercentualExcedente = (medicao: Medicao): number => {
    if (!medicao.area_planejada) return 0;
    return ((medicao.qtd_executada - medicao.area_planejada) / medicao.area_planejada) * 100;
  };

  const formatarData = (data: Date): string => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getTotalExcedentes = (): number => {
    return medicoes.reduce((sum, m) => sum + calcularExcedente(m), 0);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          📊 Gestão de Excedentes
        </Typography>
        <Box>
          <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportCSV} disabled={!medicoes || medicoes.length === 0}>Exportar CSV</Button>
          <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportXLSX} disabled={!medicoes || medicoes.length === 0}>Exportar XLSX</Button>
          <Button variant="outlined" sx={{ mr: 1 }} onClick={handleExportPDF} disabled={!medicoes || medicoes.length === 0}>Exportar PDF</Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={carregarExcedentes}
            disabled={loading}
            sx={{ ml: 2 }}
          >
            Atualizar
          </Button>
        </Box>
      </Box>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                Total de Excedentes
              </Typography>
              <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold' }}>
                {medicoes.length}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                medições acima do planejado
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                Área Excedente Total
              </Typography>
              <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold' }}>
                {getTotalExcedentes().toFixed(1)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                m² acima do cadastrado
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                Com Justificativa
              </Typography>
              <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold' }}>
                {medicoes.filter(m => m.justificativa).length}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {((medicoes.filter(m => m.justificativa).length / medicoes.length) * 100 || 0).toFixed(0)}% documentadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                Com Foto
              </Typography>
              <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold' }}>
                {medicoes.filter(m => m.foto_evidencia_url).length}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {((medicoes.filter(m => m.foto_evidencia_url).length / medicoes.length) * 100 || 0).toFixed(0)}% com evidência
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="h6">Filtros</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Data Início"
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Data Fim"
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleFiltrar}
                disabled={loading}
                sx={{ height: '56px' }}
              >
                Filtrar
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleLimparFiltros}
                sx={{ height: '56px' }}
              >
                Limpar Filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Alertas */}
      {medicoes.some(m => !m.justificativa) && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
          <strong>{medicoes.filter(m => !m.justificativa).length} excedente(s)</strong> sem justificativa.
          É obrigatório documentar o motivo de medições acima da área planejada.
        </Alert>
      )}

      {/* Tabela */}
      <Card elevation={3}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Data</strong></TableCell>
                <TableCell><strong>Colaborador</strong></TableCell>
                <TableCell><strong>Ambiente</strong></TableCell>
                <TableCell><strong>Serviço</strong></TableCell>
                <TableCell align="right"><strong>Planejado</strong></TableCell>
                <TableCell align="right"><strong>Executado</strong></TableCell>
                <TableCell align="right"><strong>Excedente</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : medicoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CheckCircle sx={{ fontSize: 48, color: '#4caf50', mb: 1 }} />
                    <Typography variant="h6">Nenhum excedente encontrado</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Todas as medições estão dentro do planejado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMedicoes.map((medicao) => {
                  const excedente = calcularExcedente(medicao);
                  const percentual = calcularPercentualExcedente(medicao);

                  return (
                    <TableRow
                      key={medicao.id}
                      hover
                      sx={{
                        backgroundColor: !medicao.justificativa ? 'rgba(255, 152, 0, 0.08)' : 'transparent',
                      }}
                    >
                      <TableCell>{formatarData(medicao.data_medicao)}</TableCell>
                      <TableCell>{medicao.alocacao.colaborador.nome}</TableCell>
                      <TableCell>{medicao.alocacao.itemAmbiente.ambiente.nome}</TableCell>
                      <TableCell>{medicao.alocacao.itemAmbiente.tabelaPreco.servico.nome}</TableCell>
                      <TableCell align="right">{medicao.area_planejada?.toFixed(2) || '—'} m²</TableCell>
                      <TableCell align="right"><strong>{medicao.qtd_executada.toFixed(2)} m²</strong></TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`+${excedente.toFixed(2)} m² (+${percentual.toFixed(1)}%)`}
                          color="warning"
                          size="small"
                          icon={<Warning />}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {medicao.justificativa && (
                            <Tooltip title="Com justificativa">
                              <CheckCircle fontSize="small" color="success" />
                            </Tooltip>
                          )}
                          {medicao.foto_evidencia_url && (
                            <Tooltip title="Com foto">
                              <Photo fontSize="small" color="primary" />
                            </Tooltip>
                          )}
                          {!medicao.justificativa && (
                            <Tooltip title="Sem justificativa">
                              <Warning fontSize="small" color="error" />
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Ver detalhes">
                            <IconButton
                              size="small"
                              onClick={() => setDetalheModal(medicao)}
                              color="primary"
                            >
                              <Info />
                            </IconButton>
                          </Tooltip>
                          {medicao.foto_evidencia_url && (
                            <Tooltip title="Ver foto">
                              <IconButton
                                size="small"
                                onClick={() => setFotoModal(medicao.foto_evidencia_url)}
                                color="primary"
                              >
                                <Photo />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <LeftAlignedTablePagination
            count={medicoes.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </TableContainer>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog
        open={!!detalheModal}
        onClose={() => setDetalheModal(null)}
        maxWidth="md"
        fullWidth
      >
        {detalheModal && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                Detalhes do Excedente
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>Excedente:</strong> +{calcularExcedente(detalheModal).toFixed(2)} m² 
                      ({calcularPercentualExcedente(detalheModal).toFixed(1)}% acima do planejado)
                    </Typography>
                  </Alert>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Data</Typography>
                  <Typography variant="body1">{formatarData(detalheModal.data_medicao)}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Colaborador</Typography>
                  <Typography variant="body1">{detalheModal.alocacao.colaborador.nome}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Área Planejada</Typography>
                  <Typography variant="body1">{detalheModal.area_planejada?.toFixed(2) || '—'} m²</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Área Executada</Typography>
                  <Typography variant="body1" fontWeight="bold">{detalheModal.qtd_executada.toFixed(2)} m²</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Ambiente</Typography>
                  <Typography variant="body1">{detalheModal.alocacao.itemAmbiente.ambiente.nome}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Serviço</Typography>
                  <Typography variant="body1">{detalheModal.alocacao.itemAmbiente.tabelaPreco.servico.nome}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Justificativa</Typography>
                  {detalheModal.justificativa ? (
                    <Paper sx={{ p: 2, mt: 1, backgroundColor: '#f5f5f5' }}>
                      <Typography variant="body2">{detalheModal.justificativa}</Typography>
                    </Paper>
                  ) : (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      Nenhuma justificativa fornecida
                    </Alert>
                  )}
                </Grid>

                {detalheModal.foto_evidencia_url && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Foto de Evidência</Typography>
                    <Box
                      component="img"
                      src={detalheModal.foto_evidencia_url}
                      alt="Evidência"
                      sx={{
                        width: '100%',
                        maxHeight: '400px',
                        objectFit: 'contain',
                        mt: 1,
                        borderRadius: 1,
                        border: '1px solid #ddd',
                      }}
                    />
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetalheModal(null)}>Fechar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal de Foto */}
      <Dialog
        open={!!fotoModal}
        onClose={() => setFotoModal(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Foto de Evidência</DialogTitle>
        <DialogContent>
          {fotoModal && (
            <Box
              component="img"
              src={fotoModal}
              alt="Foto de evidência"
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFotoModal(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
