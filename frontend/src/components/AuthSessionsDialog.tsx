import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Close, Logout } from '@mui/icons-material';
import { authAPI } from '../services/api';

interface AuthSessionItem {
  id: string;
  created_at: string;
  expira_em: string;
  ip_address?: string | null;
  user_agent?: string | null;
  atual: boolean;
}

interface AuthSessionsDialogProps {
  open: boolean;
  onClose: () => void;
  onLogoutCurrentSession: () => Promise<void>;
}

export const AuthSessionsDialog = ({
  open,
  onClose,
  onLogoutCurrentSession,
}: AuthSessionsDialogProps) => {
  const [sessions, setSessions] = useState<AuthSessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => Number(b.atual) - Number(a.atual)),
    [sessions],
  );

  const carregarSessoes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.listSessions();
      setSessions(Array.isArray(response.data) ? response.data : []);
    } catch (e: any) {
      setError(e?.message || 'Não foi possível carregar sessões ativas.');
    } finally {
      setLoading(false);
    }
  };

  const revogarSessao = async (session: AuthSessionItem) => {
    const mensagemConfirmacao = session.atual
      ? 'Deseja encerrar esta sessão atual? Você será desconectado imediatamente.'
      : 'Deseja encerrar esta sessão agora?';

    if (!window.confirm(mensagemConfirmacao)) {
      return;
    }

    try {
      setRevokingId(session.id);
      await authAPI.revokeSession(session.id);

      if (session.atual) {
        await onLogoutCurrentSession();
        return;
      }

      setSessions((prev) => prev.filter((item) => item.id !== session.id));
    } catch (e: any) {
      setError(e?.message || 'Não foi possível revogar a sessão selecionada.');
    } finally {
      setRevokingId(null);
    }
  };

  const revogarOutrasSessoes = async () => {
    if (!window.confirm('Deseja encerrar todas as outras sessões ativas?')) {
      return;
    }

    try {
      setRevokingOthers(true);
      setError(null);
      await authAPI.revokeOtherSessions();
      await carregarSessoes();
    } catch (e: any) {
      setError(e?.message || 'Não foi possível revogar as outras sessões.');
    } finally {
      setRevokingOthers(false);
    }
  };

  useEffect(() => {
    if (open) {
      carregarSessoes();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Sessões Ativas
        <IconButton size="small" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : sortedSessions.length === 0 ? (
          <Alert severity="info">Nenhuma sessão ativa encontrada.</Alert>
        ) : (
          <Stack spacing={1.5}>
            {sortedSessions.map((session) => {
              const criadoEm = new Date(session.created_at).toLocaleString('pt-BR');
              const expiraEm = new Date(session.expira_em).toLocaleString('pt-BR');

              return (
                <Box
                  key={session.id}
                  sx={{
                    border: '1px solid',
                    borderColor: session.atual ? 'primary.main' : 'divider',
                    borderRadius: 1.5,
                    p: 1.5,
                    backgroundColor: session.atual ? 'action.hover' : 'background.paper',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        {session.user_agent || 'Dispositivo não identificado'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        IP: {session.ip_address || 'Não informado'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Início: {criadoEm}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Expira em: {expiraEm}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      {session.atual && <Chip size="small" color="primary" label="Sessão atual" />}

                      <Tooltip
                        title={session.atual ? 'Encerrar esta sessão e sair' : 'Revogar sessão'}
                      >
                        <span>
                          <Button
                            variant={session.atual ? 'contained' : 'outlined'}
                            color="error"
                            size="small"
                            startIcon={<Logout fontSize="small" />}
                            disabled={revokingId === session.id}
                            onClick={() => revogarSessao(session)}
                          >
                            {revokingId === session.id ? 'Encerrando...' : 'Encerrar'}
                          </Button>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          color="warning"
          onClick={revogarOutrasSessoes}
          disabled={loading || revokingOthers || sortedSessions.length <= 1}
        >
          {revokingOthers ? 'Encerrando outras...' : 'Encerrar outras sessões'}
        </Button>
        <Button onClick={carregarSessoes} disabled={loading}>
          Atualizar
        </Button>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};
