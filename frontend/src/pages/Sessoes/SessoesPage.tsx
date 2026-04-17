import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { useSessiones } from '../../hooks/useSessiones';
import { useToast } from '../../components/Toast/ToastProvider';
import SessoesTable from './components/SessoesTable';
import { SignatureCanvas } from '../../components/SignatureCanvas';
import { uploadSignature } from '../../services/uploads.service';
import obrasService, { Obra } from '../../services/obras.service';

export const SessoesPage = () => {
  const { showToast } = useToast();
  const [dialogAbrir, setDialogAbrir] = useState(false);
  const [idObra, setIdObra] = useState('');
  const [dataSessao, setDataSessao] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [geoLat, setGeoLat] = useState('');
  const [geoLong, setGeoLong] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [nomeAssinante, setNomeAssinante] = useState('');
  const [cpfAssinante, setCpfAssinante] = useState('');
  const [criando, setCriando] = useState(false);
  const [assinaturaBase64, setAssinaturaBase64] = useState<string | null>(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [obrasAtivas, setObrasAtivas] = useState<Obra[]>([]);
  const [loadingObras, setLoadingObras] = useState(false);

  const [filtroStatus, setFiltroStatus] = useState<'ABERTA' | 'ENCERRADA' | ''>('');
  const [filtroObra, setFiltroObra] = useState<string>('');

  const {
    sessoes,
    loading,
    error,
    carregarSessoes,
    criarSessao,
    encerrarSessao,
    deletarSessao,
  } = useSessiones(
    filtroStatus || filtroObra ? {
      ...(filtroStatus && { status: filtroStatus }),
      ...(filtroObra && { id_obra: filtroObra }),
    } : undefined
  );

  // Carregar obras ativas
  useEffect(() => {
    const carregarObrasAtivas = async () => {
      try {
        setLoadingObras(true);
        const obras = await obrasService.listarAtivas();
        setObrasAtivas(obras);
      } catch (error: any) {
        console.error('Erro ao carregar obras ativas:', error);
        showToast({
          message: 'Erro ao carregar obras ativas',
          severity: 'error',
        });
      } finally {
        setLoadingObras(false);
      }
    };

    carregarObrasAtivas();
  }, []);

  const handleObterGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLat(position.coords.latitude.toString());
          setGeoLong(position.coords.longitude.toString());
          showToast({
            message: 'Localização GPS obtida com sucesso!',
            severity: 'success',
          });
        },
        (error) => {
          showToast({
            message: 'Erro ao obter localização: ' + error.message,
            severity: 'error',
          });
        }
      );
    }
  };

  const handleCriarSessao = async () => {
    if (!idObra) {
      showToast({
        message: 'Por favor, selecione uma obra',
        severity: 'error',
      });
      return;
    }

    if (!geoLat || !geoLong) {
      showToast({
        message: 'Por favor, obtenha a localização GPS',
        severity: 'error',
      });
      return;
    }

    if (!assinaturaBase64) {
      showToast({
        message: 'Por favor, confirme sua assinatura digital',
        severity: 'error',
      });
      return;
    }

    if (!nomeAssinante.trim()) {
      showToast({
        message: 'Por favor, informe o nome de quem assinou',
        severity: 'error',
      });
      return;
    }

    try {
      setCriando(true);
      setUploadingSignature(true);

      // Fazer upload da assinatura e obter URL
      const assinaturaUrl = await uploadSignature(
        assinaturaBase64,
        'outro',
        'Assinatura de abertura de sessão'
      );

      setUploadingSignature(false);

      // Criar sessão com a assinatura
      await criarSessao({
        id_obra: idObra,
        data_sessao: dataSessao,
        hora_inicio: new Date().toISOString(),
        geo_lat: parseFloat(geoLat),
        geo_long: parseFloat(geoLong),
        assinatura_url: assinaturaUrl,
        nome_assinante: nomeAssinante.trim(),
        cpf_assinante: cpfAssinante.trim() || undefined,
        observacoes: observacoes || undefined,
      });

      setDialogAbrir(false);
      setIdObra('');
      setGeoLat('');
      setGeoLong('');
      setObservacoes('');
      setNomeAssinante('');
      setAssinaturaBase64(null);
      setCpfAssinante('');
      
      showToast({
        message: 'Sessão criada com sucesso!',
        severity: 'success',
      });
      await carregarSessoes();
    } catch (err: any) {
      // Se for erro de alocação em andamento, usar Toast com shake
      if (err.response?.data?.message?.includes('EM_ANDAMENTO') || err.response?.data?.message?.includes('em uso')) {
        showToast({
          message: 'Ambiente em uso por outro colaborador. Encerre a tarefa anterior primeiro.',
          severity: 'error',
        });
      } else {
        showToast({
          message: 'Erro ao criar sessão: ' + err.message,
          severity: 'error',
        });
      }
    } finally {
      setCriando(false);
      setUploadingSignature(false);
    }
  };

  const handleEncerrarSessao = async (id: string, dados?: { observacoes?: string; justificativa?: string; assinatura_url?: string; nome_assinante?: string; cpf_assinante?: string }) => {
    try {
      await encerrarSessao(id, {
        observacoes: dados?.observacoes,
        justificativa: dados?.justificativa,
        assinatura_url: dados?.assinatura_url,
        nome_assinante: dados?.nome_assinante,
        cpf_assinante: dados?.cpf_assinante,
      });
      await carregarSessoes();
    } catch (err: any) {
      alert('Erro ao encerrar sessão: ' + err.message);
    }
  };

  const handleDeletarSessao = async (id: string) => {
    try {
      await deletarSessao(id);
      await carregarSessoes();
    } catch (err: any) {
      alert('Erro ao deletar sessão: ' + err.message);
    }
  };

  const sessõesAbertas = sessoes.filter((s) => s.status === 'ABERTA').length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          📋 Ordens de Serviço
        </Typography>
        <Typography color="textSecondary">
          Gerencie ordens de serviço com geolocalização e assinatura digital
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Sessões Abertas
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                {sessõesAbertas}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total de Sessões
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                {sessoes.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros e Ações */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filtroStatus}
              label="Status"
              onChange={(e) => setFiltroStatus(e.target.value as any)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ABERTA">Abertas</MenuItem>
              <MenuItem value="ENCERRADA">Encerradas</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Obra</InputLabel>
            <Select
              value={filtroObra}
              label="Obra"
              onChange={(e) => setFiltroObra(e.target.value)}
              disabled={loadingObras}
            >
              <MenuItem value="">Todas as Obras</MenuItem>
              {obrasAtivas.map((obra) => (
                <MenuItem key={obra.id} value={obra.id}>
                  {obra.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {(filtroStatus || filtroObra) && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setFiltroStatus('');
                setFiltroObra('');
              }}
              size="small"
            >
              Limpar Filtros
            </Button>
          )}

          <Button
            variant="contained"
            color="success"
            onClick={() => {
              setDialogAbrir(true);
              // Resetar campos ao abrir dialog
              setIdObra('');
              setGeoLat('');
              setGeoLong('');
              setObservacoes('');
              setNomeAssinante('');
              setAssinaturaBase64(null);
              setCpfAssinante('');
            }}
          >
            + Abrir Nova Sessão
          </Button>

          {loading && <CircularProgress size={24} />}
        </Box>

        {/* Indicador de Filtros Ativos */}
        {(filtroStatus || filtroObra) && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Filtrando por:
            </Typography>
            {filtroStatus && (
              <Chip
                label={`Status: ${filtroStatus === 'ABERTA' ? 'Abertas' : 'Encerradas'}`}
                onDelete={() => setFiltroStatus('')}
                color="primary"
                size="small"
              />
            )}
            {filtroObra && (
              <Chip
                label={`Obra: ${obrasAtivas.find(o => o.id === filtroObra)?.nome || 'Desconhecida'}`}
                onDelete={() => setFiltroObra('')}
                color="primary"
                size="small"
              />
            )}
            <Chip
              label={`${sessoes.length} ${sessoes.length === 1 ? 'sessão encontrada' : 'sessões encontradas'}`}
              color="default"
              size="small"
              variant="outlined"
            />
          </Box>
        )}
      </Paper>

      {/* Tabela de Sessões */}
      <SessoesTable
        sessoes={sessoes}
        loading={loading}
        error={error}
        onEncerrar={handleEncerrarSessao}
        onDeletar={handleDeletarSessao}
      />

      {/* Dialog para Abrir Nova Sessão */}
      <Dialog open={dialogAbrir} onClose={() => setDialogAbrir(false)} fullWidth maxWidth="md">
        <DialogTitle>Abrir Nova Sessão de Trabalho</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="select-obra-label">Obra *</InputLabel>
            <Select
              labelId="select-obra-label"
              id="select-obra"
              value={idObra}
              label="Obra *"
              onChange={(e) => setIdObra(e.target.value)}
              disabled={loadingObras}
            >
              {loadingObras ? (
                <MenuItem value="" disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Carregando obras...
                </MenuItem>
              ) : obrasAtivas.length === 0 ? (
                <MenuItem value="" disabled>
                  Nenhuma obra ativa encontrada
                </MenuItem>
              ) : (
                obrasAtivas.map((obra) => (
                  <MenuItem key={obra.id} value={obra.id}>
                    {obra.nome} - {obra.endereco_completo}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {!loadingObras && obrasAtivas.length > 0 && (
            <Alert severity="info" sx={{ mt: 1 }}>
              {obrasAtivas.length} {obrasAtivas.length === 1 ? 'obra ativa disponível' : 'obras ativas disponíveis'}
            </Alert>
          )}

          {!loadingObras && obrasAtivas.length === 0 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Nenhuma obra ativa cadastrada. Por favor, cadastre uma obra com status ATIVA.
            </Alert>
          )}

          <TextField
            fullWidth
            type="date"
            label="Data da Sessão"
            value={dataSessao}
            onChange={(e) => setDataSessao(e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <Box sx={{ my: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              📍 Localização GPS
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleObterGPS}
              sx={{ mb: 2 }}
            >
              Obter Localização Atual
            </Button>

            {geoLat && geoLong && (
              <Alert severity="success" sx={{ mb: 1 }}>
                GPS Capturado: {geoLat}, {geoLong}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Latitude"
              type="number"
              inputProps={{ step: 'any' }}
              value={geoLat}
              onChange={(e) => setGeoLat(e.target.value)}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Longitude"
              type="number"
              inputProps={{ step: 'any' }}
              value={geoLong}
              onChange={(e) => setGeoLong(e.target.value)}
              margin="normal"
            />
          </Box>

          <TextField
            fullWidth
            label="Observações (opcional)"
            placeholder="Notas sobre a sessão"
            multiline
            rows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            margin="normal"
          />

          {/* Componente de Assinatura Digital */}
          <SignatureCanvas
            onSignatureConfirm={(dataUrl) => setAssinaturaBase64(dataUrl)}
            onClear={() => setAssinaturaBase64(null)}
            width={550}
            height={180}
          />

          <TextField
            fullWidth
            required
            label="Nome de Quem Assinou"
            placeholder="Digite o nome completo"
            value={nomeAssinante}
            onChange={(e) => setNomeAssinante(e.target.value)}
            margin="normal"
          />

          <TextField
            fullWidth
            label="CPF de Quem Assinou (opcional)"
            placeholder="000.000.000-00"
            value={cpfAssinante}
            onChange={(e) => setCpfAssinante(e.target.value)}
            margin="normal"
            inputProps={{ maxLength: 14 }}
          />

          {uploadingSignature && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                Enviando assinatura...
              </Box>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAbrir(false)}>Cancelar</Button>
          <Button
            onClick={handleCriarSessao}
            variant="contained"
            color="success"
            disabled={criando || !assinaturaBase64 || !nomeAssinante.trim()}
          >
            {criando ? <CircularProgress size={24} /> : 'Abrir Sessão'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SessoesPage;
