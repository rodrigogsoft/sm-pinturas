import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import ObrasScreen from './src/screens/ObrasScreen';

export default function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    verificarAutenticacao();
  }, []);

  const verificarAutenticacao = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    setAutenticado(!!token);
    setVerificando(false);
  };

  if (verificando) return null;

  return (
    <>
      <StatusBar style="auto" />
      {autenticado ? (
        <ObrasScreen />
      ) : (
        <LoginScreen onLoginSucesso={() => setAutenticado(true)} />
      )}
    </>
  );
}
