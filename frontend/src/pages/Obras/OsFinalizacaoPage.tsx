import { useEffect, useRef, useState } from 'react';
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
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GestureIcon from '@mui/icons-material/Gesture';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../components/Toast/ToastProvider';
import api from '../../services/api';
import obrasService, { Obra } from '../../services/obras.service';

interface ItemIncompleto {
  id_item_ambiente: string;
  descricao: string;
  progresso: number;
}

interface VerificacaoResponse {
  pode_finalizar: boolean;
  itens_incompletos: ItemIncompleto[];
}

export const OsFinalizacaoPage = () => {
  const { id_obra } = useParams<{ id_obra: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDesenhando = useRef(false);

  const [obra, setObra] = useState<Obra | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verificacao, setVerificacao] = useState<VerificacaoResponse | null>(null);

  // Pop-up de confirmação para itens incompletos
  const [openPopupIncompletos, setOpenPopupIncompletos] = useState(false);

  // Campos do formulário
  const [nomeFiscalizador, setNomeFiscalizador] = useState('');
  const [cpfFiscalizador, setCpfFiscalizador] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState('');
  const [canvasPreenchido, setCanvasPreenchido] = useState(false);

  useEffect(() => {
    if (!id_obra) return;
    carregarDados();
  }, [id_obra]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [obraData, verificacaoData] = await Promise.all([
        obrasService.buscarPorId(id_obra!),
        api.get<VerificacaoResponse>(`/os-finalizacao/verificar/${id_obra}`).then((r) => r.data),
      ]);
      setObra(obraData);
      setVerificacao(verificacaoData);

      // Exibe o pop-up automaticamente se houver incompletos
      if (!verificacaoData.pode_finalizar) {
        setOpenPopupIncompletos(true);
      }
    } catch {
      showToast({ message: 'Erro ao carregar dados da obra.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ── Canvas de assinatura ─────────────────────────────────────────────────

  const iniciarDesenho = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDesenhando.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const desenhar = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDesenhando.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a237e';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setCanvasPreenchido(true);
  };

  const pararDesenho = () => {
    isDesenhando.current = false;
    if (canvasRef.current) {
      setAssinaturaDataUrl(canvasRef.current.toDataURL('image/png'));
    }
  };

  const limparAssinatura = () => {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setAssinaturaDataUrl('');
    setCanvasPreenchido(false);
  };

  // ── Submissão ────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!nomeFiscalizador.trim()) {
      showToast({ message: 'Informe o nome do fiscalizador.', severity: 'warning' });
      return;
    }
    if (!cpfFiscalizador.trim()) {
      showToast({ message: 'Informe o CPF do fiscalizador.', severity: 'warning' });
      return;
    }
    if (!canvasPreenchido) {
      showToast({ message: 'A assinatura digital é obrigatória.', severity: 'warning' });
      return;
    }
    if (verificacao && !verificacao.pode_finalizar && !justificativa.trim()) {
      showToast({ message: 'Informe a justificativa para elementos incompletos.', severity: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      // Envia o dataURL da assinatura como string (pode ser enviado ao S3 antes)
      await api.post('/os-finalizacao', {
        id_obra,
        nome_fiscalizador: nomeFiscalizador,
        cpf_fiscalizador: cpfFiscalizador,
        assinatura_url: assinaturaDataUrl,
        justificativa_incompletude: justificativa || undefined,
      });

      showToast({ message: 'O.S. finalizada com sucesso!', severity: 'success' });
      navigate(`/obras`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao finalizar O.S.';
      showToast({ message: msg, severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const temIncompletos = verificacao && !verificacao.pode_finalizar;

  return (
    <Box p={3} maxWidth={800} mx="auto">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/obras')}
        sx={{ mb: 2 }}
      >
        Voltar
      </Button>

      <Typography variant="h5" fontWeight="bold" mb={1}>
        Finalização de O.S.
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {obra?.nome} — {obra?.endereco_completo}
      </Typography>

      {/* Barra de progresso da obra */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" fontWeight="bold">
              Progresso geral da obra
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {Number(obra?.progresso ?? 0).toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(Number(obra?.progresso ?? 0), 100)}
            sx={{ height: 10, borderRadius: 5 }}
            color={Number(obra?.progresso ?? 0) >= 100 ? 'success' : 'primary'}
          />
        </CardContent>
      </Card>

      {/* Alerta de itens incompletos */}
      {temIncompletos && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningAmberIcon />}>
          <strong>{verificacao.itens_incompletos.length} elemento(s)</strong> ainda não
          foram concluídos. Preencha a justificativa abaixo para finalizar parcialmente.
        </Alert>
      )}

      {!temIncompletos && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleOutlineIcon />}>
          Todos os elementos estão concluídos. A O.S. pode ser finalizada normalmente.
        </Alert>
      )}

      {/* Formulário */}
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Dados do Fiscalizador
          </Typography>

          <TextField
            label="Nome completo do fiscalizador"
            value={nomeFiscalizador}
            onChange={(e) => setNomeFiscalizador(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            required
          />

          <TextField
            label="CPF do fiscalizador"
            value={cpfFiscalizador}
            onChange={(e) => setCpfFiscalizador(e.target.value)}
            fullWidth
            placeholder="000.000.000-00"
            inputProps={{ maxLength: 14 }}
            sx={{ mb: 2 }}
            required
          />

          {temIncompletos && (
            <TextField
              label="Justificativa para elementos incompletos"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              fullWidth
              multiline
              rows={3}
              sx={{ mb: 2 }}
              required
              helperText="Obrigatório quando há elementos não concluídos."
            />
          )}

          <Divider sx={{ my: 2 }} />

          {/* Canvas de assinatura */}
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <GestureIcon color="primary" />
            <Typography variant="h6">Assinatura Digital</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Assine dentro do campo abaixo usando o mouse.
          </Typography>

          <Box
            sx={{
              border: '2px dashed',
              borderColor: canvasPreenchido ? 'primary.main' : 'grey.400',
              borderRadius: 2,
              overflow: 'hidden',
              cursor: 'crosshair',
              mb: 1,
              background: '#fafafa',
            }}
          >
            <canvas
              ref={canvasRef}
              width={700}
              height={150}
              style={{ display: 'block', width: '100%', touchAction: 'none' }}
              onMouseDown={iniciarDesenho}
              onMouseMove={desenhar}
              onMouseUp={pararDesenho}
              onMouseLeave={pararDesenho}
            />
          </Box>

          <Button size="small" onClick={limparAssinatura} sx={{ mb: 3 }}>
            Limpar assinatura
          </Button>

          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={submitting}
              color={temIncompletos ? 'warning' : 'success'}
            >
              {submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : temIncompletos ? (
                'Finalizar Parcialmente'
              ) : (
                'Finalizar O.S.'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Pop-up: elementos incompletos (abre automaticamente) */}
      <Dialog
        open={openPopupIncompletos}
        onClose={() => setOpenPopupIncompletos(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Elementos não concluídos
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>
            Os seguintes elementos ainda não foram 100% concluídos. Você pode prosseguir
            informando uma justificativa.
          </Typography>
          <List dense disablePadding>
            {verificacao?.itens_incompletos.map((item) => (
              <ListItem key={item.id_item_ambiente} disablePadding sx={{ mb: 1 }}>
                <ListItemText
                  primary={item.descricao}
                  secondary={
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <LinearProgress
                        variant="determinate"
                        value={item.progresso}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                      />
                      <Chip
                        label={`${item.progresso.toFixed(1)}%`}
                        size="small"
                        color="warning"
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenPopupIncompletos(false); navigate('/obras'); }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => setOpenPopupIncompletos(false)}
          >
            Prosseguir mesmo assim
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
