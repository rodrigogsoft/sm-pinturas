import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authAPI, setApiAuthToken } from '../../services/api';
import { setUser } from '../../store/slices/authSlice';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugInfo('');
    setLoading(true);

    try {
      console.log('🔐 [1] Formulário enviado');
      console.log('🔐 [2] Email:', email);
      console.log('🔐 [3] Password:', '***');
      
      setDebugInfo('Conectando ao servidor...');
      
      console.log('🔐 [4] Chamando authAPI.login()');
      const response = await authAPI.login(email, password);
      
      console.log('🔐 [5] Resposta recebida:', response);
      console.log('🔐 [6] Response status:', response.status);
      console.log('🔐 [7] Response data:', response.data);
      
      const { user, access_token, refresh_token } = response.data;
      
      if (!user || !access_token) {
        throw new Error('Resposta incompleta: user ou token faltando');
      }
      
      console.log('🔐 [8] User:', user);
      console.log('🔐 [9] Token:', access_token ? 'recebido' : 'vazio');

      setDebugInfo('Atualizando autenticação...');
      setApiAuthToken(access_token);
      
      console.log('🔐 [10] Disparando Redux setUser');
      dispatch(
        setUser({
          user,
          token: access_token,
          refreshToken: refresh_token ?? null,
        })
      );
      
      console.log('🔐 [11] Redux atualizado');
      setDebugInfo('Redirecionando...');
      
      console.log('🔐 [12] Navegando para /dashboard');
      
      // Add a small delay to ensure Redux state is set
      await new Promise(resolve => setTimeout(resolve, 500));
      
      navigate('/dashboard');
      
      console.log('🔐 [13] LOGIN SUCESSO!');
    } catch (err: any) {
      console.error('❌ [ERRO] Login falhou');
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error:', err);
      
      let errorMessage = 'Erro desconhecido ao fazer login';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.data?.message) {
        errorMessage = err.data.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      console.error('❌ Final error message:', errorMessage);
      setError(errorMessage);
      setDebugInfo(`❌ Erro: ${errorMessage}`);
      
      // Stay on login page, don't redirect
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img src="/logo.png" alt="SM Pinturas & Construções" style={{ maxWidth: 280, height: 'auto' }} />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                <strong>❌ Erro de Login:</strong>
              </Typography>
              {error}
            </Alert>
          )}

          {debugInfo && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="caption" display="block">
                ℹ️ {debugInfo}
              </Typography>
            </Alert>
          )}

          <form onSubmit={handleSubmit} aria-label="formulario-login">
            <TextField
              id="login-email"
              name="email"
              fullWidth
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              placeholder="admin@jbpinturas.com.br"
            />
            <TextField
              id="login-password"
              name="password"
              fullWidth
              label="Senha"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              placeholder="Admin@2026"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
            </Button>
          </form>


        </Paper>
      </Box>
    </Container>
  );
};
