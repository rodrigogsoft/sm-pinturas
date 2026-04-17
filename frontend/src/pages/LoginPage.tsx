import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../store/slices/authSlice';
import type { AppDispatch, RootState } from '../store';

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { carregando, erro } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resultado = await dispatch(login({ email, senha }));
    if (login.fulfilled.match(resultado)) {
      navigate('/obras');
    }
  };

  return (
    <Box
      sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ width: 360, p: 4, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" component="div" sx={{ mb: 3, textAlign: 'center' }}>
          SM Pinturas
        </Typography>
        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
        <TextField
          label="E-mail"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Senha"
          type="password"
          fullWidth
          margin="normal"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={carregando}>
          {carregando ? <CircularProgress size={24} /> : 'Entrar'}
        </Button>
      </Box>
    </Box>
  );
};

export default LoginPage;
