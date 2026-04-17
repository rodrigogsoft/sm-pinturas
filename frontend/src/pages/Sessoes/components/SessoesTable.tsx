import { useState } from 'react';
import LeftAlignedTablePagination from '../../../components/LeftAlignedTablePagination';
import SignatureCanvas from '../../../components/SignatureCanvas/SignatureCanvas';
import { useClientPagination } from '../../../hooks/useClientPagination';
import { uploadSignature } from '../../../services/uploads.service';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  Link,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { Sessao } from '../../../services/sessoes.service';

interface SessoesTableProps {
  sessoes: Sessao[];
  loading: boolean;
  error?: string | null;
  onEncerrar?: (id: string, dados?: { observacoes?: string; justificativa?: string; assinatura_url?: string; nome_assinante?: string; cpf_assinante?: string }) => Promise<void>;
  onDeletar?: (id: string) => Promise<void>;
}

const SessoesTable: React.FC<SessoesTableProps> = ({
  sessoes,
  loading,
  error,
  onEncerrar,
  onDeletar,
}) => {
  const navigate = useNavigate();
  const [sessaoSelecionada, setSessaoSelecionada] = useState<Sessao | null>(null);
  const [dialogEncerrar, setDialogEncerrar] = useState(false);
  const [dialogVisualizar, setDialogVisualizar] = useState(false);
  const [sessaoVisualizar, setSessaoVisualizar] = useState<Sessao | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [nomeConferente, setNomeConferente] = useState('');
  const [cpfConferente, setCpfConferente] = useState('');
  const [assinaturaBase64, setAssinaturaBase64] = useState<string | null>(null);
  const [assinaturaUrl, setAssinaturaUrl] = useState<string | null>(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [encerrando, setEncerrando] = useState(false);
  const [erroJustificativa, setErroJustificativa] = useState<string | null>(null);
  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedSessoes,
    handlePageChange,
    handleRowsPerPageChange,
  } = useClientPagination(sessoes);

  const handleAbrirDialogEncerrar = (sessao: Sessao) => {
    setSessaoSelecionada(sessao);
    setDialogEncerrar(true);
    setJustificativa('');
    setAssinaturaBase64(null);
    setAssinaturaUrl(null);
    setErroJustificativa(null);
    setObservacoes('');
    setNomeConferente('');
    setCpfConferente('');
  };

  const handleEncerrarSessao = async () => {
    if (!sessaoSelecionada || !onEncerrar) return;

    // Validação da justificativa
    if (!justificativa || justificativa.trim().length < 15) {
      setErroJustificativa('A justificativa deve ter pelo menos 15 caracteres.');
      return;
    }

    // Validação do nome do conferente
    if (!nomeConferente || nomeConferente.trim().length < 3) {
      setErroJustificativa('Nome do conferente é obrigatório (mínimo 3 caracteres).');
      return;
    }

    // Validação do CPF do conferente
    const cpfLimpo = cpfConferente.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      setErroJustificativa('CPF do conferente deve ter 11 dígitos.');
      return;
    }
    setErroJustificativa(null);

    let assinaturaFinalUrl = assinaturaUrl;
    if (assinaturaBase64) {
      try {
        setUploadingSignature(true);
        assinaturaFinalUrl = await uploadSignature(
          assinaturaBase64,
          'assinatura',
          'Assinatura de encerramento de sessão'
        );
        setUploadingSignature(false);
      } catch (err: any) {
        setUploadingSignature(false);
        setErroJustificativa('Erro ao enviar assinatura. Tente novamente.');
        return;
      }
    }

    try {
      setEncerrando(true);
      await onEncerrar(sessaoSelecionada.id, {
        observacoes: observacoes || undefined,
        justificativa: justificativa.trim(),
        assinatura_url: assinaturaFinalUrl || undefined,
        nome_assinante: nomeConferente.trim(),
        cpf_assinante: cpfConferente.trim(),
      });
      setDialogEncerrar(false);
      setObservacoes('');
      setJustificativa('');
      setNomeConferente('');
      setCpfConferente('');
      setAssinaturaBase64(null);
      setAssinaturaUrl(null);
      setSessaoSelecionada(null);
    } catch (err: any) {
      setErroJustificativa('Erro ao encerrar sessão.');
      console.error('Erro ao encerrar sessão:', err);
    } finally {
      setEncerrando(false);
    }
  };

  const handleDeletar = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta sessão?')) {
      try {
        await onDeletar?.(id);
      } catch (err: any) {
        console.error('Erro ao deletar sessão:', err);
      }
    }
  };

  const handleVisualizarSessao = (sessao: Sessao) => {
    setSessaoVisualizar(sessao);
    setDialogVisualizar(true);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarHora = (data: string) => {
    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calcularDuracao = (inicio: string, fim: string | null) => {
    if (!fim) return '—';
    const horaInicio = new Date(inicio);
    const horaFim = new Date(fim);
    const diff = (horaFim.getTime() - horaInicio.getTime()) / (1000 * 60 * 60);
    return `${diff.toFixed(1)}h`;
  };

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
              <TableCell>Data</TableCell>
              <TableCell>Hora Início</TableCell>
              <TableCell>Hora Fim</TableCell>
              <TableCell>Duração</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Localização</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    Nenhuma sessão encontrada
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedSessoes.map((sessao) => (
                <TableRow key={sessao.id} hover>
                  <TableCell>{formatarData(sessao.data_sessao)}</TableCell>
                  <TableCell>{formatarHora(sessao.hora_inicio)}</TableCell>
                  <TableCell>
                    {sessao.hora_fim ? formatarHora(sessao.hora_fim) : '—'}
                  </TableCell>
                  <TableCell>
                    {calcularDuracao(sessao.hora_inicio, sessao.hora_fim)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={sessao.status}
                      color={sessao.status === 'ABERTA' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {sessao.geo_lat && sessao.geo_long
                      ? `${sessao.geo_lat.toFixed(4)}, ${sessao.geo_long.toFixed(4)}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => handleVisualizarSessao(sessao)}
                      >
                        Visualizar
                      </Button>
                      {sessao.status === 'ABERTA' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="info"
                            onClick={() => navigate(`/alocacao/${sessao.id}/${sessao.id_obra}`)}
                          >
                            Alocar
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => navigate(`/medicoes?id_sessao=${sessao.id}`)}
                          >
                            Medir
                          </Button>
                        </>
                      )}
                      {sessao.status === 'ABERTA' && onEncerrar ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          onClick={() => handleAbrirDialogEncerrar(sessao)}
                        >
                          Encerrar
                        </Button>
                      ) : null}
                      {onDeletar && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDeletar(sessao.id)}
                        >
                          Deletar
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <LeftAlignedTablePagination
          count={sessoes.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </TableContainer>

      {/* Dialog para encerrar sessão */}

      <Dialog open={dialogEncerrar} onClose={() => setDialogEncerrar(false)} fullWidth>
        <DialogTitle>Encerrar Sessão</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Nome do conferente (obrigatório)"
            placeholder="Nome completo de quem conferiu o fechamento da OS"
            value={nomeConferente}
            onChange={(e) => setNomeConferente(e.target.value)}
            margin="normal"
            required
            error={!!erroJustificativa && (!nomeConferente || nomeConferente.trim().length < 3)}
          />
          <TextField
            fullWidth
            label="CPF do conferente (obrigatório)"
            placeholder="000.000.000-00"
            value={cpfConferente}
            onChange={(e) => {
              // Máscara de CPF
              const v = e.target.value.replace(/\D/g, '').slice(0, 11);
              const masked = v
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
                .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
              setCpfConferente(masked);
            }}
            inputProps={{ maxLength: 14 }}
            margin="normal"
            required
            error={!!erroJustificativa && cpfConferente.replace(/\D/g, '').length !== 11}
          />
          <TextField
            fullWidth
            label="Justificativa (obrigatória)"
            placeholder="Descreva o motivo do encerramento e detalhes relevantes"
            multiline
            rows={3}
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            margin="normal"
            required
            error={!!erroJustificativa}
            helperText={erroJustificativa || 'Mínimo 15 caracteres'}
          />
          <TextField
            fullWidth
            label="Observações (opcional)"
            placeholder="Alguma observação sobre a sessão"
            multiline
            rows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Assinatura Digital (opcional para atualização)
            </Typography>
            <SignatureCanvas
              onSignatureConfirm={(dataUrl) => setAssinaturaBase64(dataUrl)}
              onClear={() => setAssinaturaBase64(null)}
              width={400}
              height={120}
            />
            {assinaturaBase64 && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Nova assinatura capturada. Será enviada ao encerrar.
              </Alert>
            )}
            {uploadingSignature && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={20} />
                  Enviando assinatura...
                </Box>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEncerrar(false)}>Cancelar</Button>
          <Button
            onClick={handleEncerrarSessao}
            variant="contained"
            disabled={encerrando || uploadingSignature}
          >
            {encerrando ? <CircularProgress size={24} /> : 'Encerrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para visualizar detalhes da sessão */}
      <Dialog open={dialogVisualizar} onClose={() => setDialogVisualizar(false)} fullWidth maxWidth="sm">
        <DialogTitle>Detalhes da Sessão</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {sessaoVisualizar ? (
            <Box>
              {/* Informações Básicas */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    📅 Informações Básicas
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Data da Sessão
                      </Typography>
                      <Typography variant="body1">
                        {formatarData(sessaoVisualizar.data_sessao)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Status
                      </Typography>
                      <Chip
                        label={sessaoVisualizar.status}
                        color={sessaoVisualizar.status === 'ABERTA' ? 'success' : 'default'}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Hora de Início
                      </Typography>
                      <Typography variant="body1">
                        {formatarHora(sessaoVisualizar.hora_inicio)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Hora de Término
                      </Typography>
                      <Typography variant="body1">
                        {sessaoVisualizar.hora_fim ? formatarHora(sessaoVisualizar.hora_fim) : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">
                        Duração
                      </Typography>
                      <Typography variant="body1">
                        {calcularDuracao(sessaoVisualizar.hora_inicio, sessaoVisualizar.hora_fim)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Divider sx={{ my: 2 }} />

              {/* Localização */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    📍 Localização GPS
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Latitude
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {sessaoVisualizar.geo_lat?.toFixed(6) ?? '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Longitude
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {sessaoVisualizar.geo_long?.toFixed(6) ?? '—'}
                      </Typography>
                    </Grid>
                    {sessaoVisualizar.geo_lat && sessaoVisualizar.geo_long && (
                      <Grid item xs={12}>
                        <Link
                          href={`https://www.google.com/maps/@${sessaoVisualizar.geo_lat},${sessaoVisualizar.geo_long},15z`}
                          target="_blank"
                          rel="noopener"
                          variant="body2"
                        >
                          🗺️ Abrir no Google Maps
                        </Link>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              <Divider sx={{ my: 2 }} />

              {/* Autorização */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    ✅ Autorização
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Nome de Quem Autorizou
                      </Typography>
                      <Typography variant="body1">
                        {sessaoVisualizar.nome_assinante || sessaoVisualizar.encarregado?.nome_completo || '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        CPF de Quem Autorizou
                      </Typography>
                      <Typography variant="body1">
                        {sessaoVisualizar.cpf_assinante || '—'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Divider sx={{ my: 2 }} />

              {/* Assinatura e Observações */}
              {(sessaoVisualizar.assinatura_url || sessaoVisualizar.observacoes) && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      📝 Observações e Assinatura
                    </Typography>
                    <Grid container spacing={2}>
                      {sessaoVisualizar.assinatura_url && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            Assinatura Digital
                          </Typography>
                          <Link
                            href={sessaoVisualizar.assinatura_url}
                            target="_blank"
                            rel="noopener"
                            variant="body2"
                          >
                            🖼️ Visualizar Assinatura
                          </Link>
                        </Grid>
                      )}
                      {sessaoVisualizar.observacoes && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            Observações
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {sessaoVisualizar.observacoes}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              <Divider sx={{ my: 2 }} />

              {/* ID da Sessão */}
              <Typography variant="caption" color="textSecondary">
                ID: {sessaoVisualizar.id}
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogVisualizar(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SessoesTable;
