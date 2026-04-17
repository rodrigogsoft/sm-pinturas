import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { restaurarSessaoAsync } from '../store/slices/authSlice';
import { LoginScreen } from '../screens/LoginScreen';
import { DrawerNavigator } from './DrawerNavigator';
import { RDOFormScreen } from '../screens/RDOFormScreen';
import { SM_COLORS } from '../theme/colors';

const Stack = createNativeStackNavigator();

const HEADER_OPTS = {
  headerStyle: { backgroundColor: SM_COLORS.primary },
  headerTintColor: SM_COLORS.textOnDark,
  headerTitleStyle: { fontWeight: '600' as const, fontSize: 18 },
};

export const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const { usuario, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Restaurar sessão ao iniciar
    dispatch(restaurarSessaoAsync());
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: SM_COLORS.background }}>
        <ActivityIndicator size="large" color={SM_COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={HEADER_OPTS}>
        {!usuario ? (
          <Stack.Group screenOptions={{ headerShown: false, animationEnabled: false }}>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="MainApp" component={DrawerNavigator} options={{ headerShown: false }} />
            {/* Telas modais / de detalhe acessíveis de qualquer ponto do app */}
            <Stack.Screen name="RDOForm" component={RDOFormScreen} options={{ title: 'Novo RDO' }} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
