import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { loginAsync } from '../store/slices/authSlice';
import { SM_COLORS } from '../theme/colors';

export const LoginScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Validação', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      await dispatch(loginAsync({ email, senha })).unwrap();
      // Navigation happens automatically via RootNavigator
    } catch (err: any) {
      Alert.alert('Erro ao fazer login', err || 'Tente novamente');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.formContainer}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          style={styles.input}
          placeholderTextColor="#999"
        />

        <TextInput
          label="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry={!showPassword}
          editable={!isLoading}
          style={styles.input}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye' : 'eye-off'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          placeholderTextColor="#999"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.versionText}>Versão 1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 280,
    height: 100,
  },
  formContainer: {
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: SM_COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 40,
  },
});
