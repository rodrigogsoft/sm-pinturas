import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { HomeScreen } from '../screens/HomeScreen';
import { ObrasScreen } from '../screens/ObrasScreen';
import { MedicoesScreen } from '../screens/MedicoesScreen';
import { CatalogoScreen } from '../screens/CatalogoScreen';
import { ConfiguracoesScreen } from '../screens/ConfiguracoesScreen';
import { AlocacaoScreen } from '../screens/Alocacao/AlocacaoScreen';
import { ClientesScreen } from '../screens/ClientesScreen';
import { ColaboradoresScreen } from '../screens/ColaboradoresScreen';
import { PavimentosScreen } from '../screens/PavimentosScreen';
import { AmbientesScreen } from '../screens/AmbientesScreen';
import { ItensAmbienteScreen } from '../screens/ItensAmbienteScreen';
import { PrecosScreen } from '../screens/PrecosScreen';
import { FinanceiroScreen } from '../screens/FinanceiroScreen';
import { RelatoriosScreen } from '../screens/RelatoriosScreen';
import { ValesAdiantamentoScreen } from '../screens/ValesAdiantamentoScreen';
import { UsuariosScreen } from '../screens/UsuariosScreen';
import { RDOListScreen } from '../screens/RDOListScreen';

import { SM_COLORS } from '../theme/colors';

const Drawer = createDrawerNavigator();

const HEADER_OPTS = {
  headerStyle: { backgroundColor: SM_COLORS.primary },
  headerTintColor: SM_COLORS.textOnDark,
};

const drawerStyles = StyleSheet.create({
  submenuContainer: {
    paddingLeft: 12,
  },
  submenuLabel: {
    fontSize: 13,
  },
});

const getIcon = (name: string, color: string, size: number) => (
  <MaterialCommunityIcons name={name} color={color} size={size} />
);

function CustomDrawerContent(props: any) {
  const [obrasOpen, setObrasOpen] = useState(true);
  const activeRouteName = props.state.routeNames[props.state.index];

  const menu = useMemo(
    () => [
      { label: 'Dashboard', route: 'Dashboard', icon: 'view-dashboard-outline' },
      { label: 'Clientes', route: 'Clientes', icon: 'domain' },
      { label: 'Colaboradores', route: 'Colaboradores', icon: 'account-group-outline' },
      { label: 'Serviços', route: 'Catalogo', icon: 'package-variant-closed' },
      { label: 'Preço', route: 'Precos', icon: 'currency-usd' },
      {
        label: 'Obras',
        route: 'Obras',
        icon: 'briefcase-outline',
        children: [
          { label: 'Pavimentos', route: 'Pavimentos', icon: 'layers-outline' },
          { label: 'Ambientes', route: 'Ambientes', icon: 'floor-plan' },
          { label: 'Elementos de Serviço', route: 'ItensAmbiente', icon: 'format-list-text' },
          { label: 'O.S.', route: 'Configuracoes', icon: 'clipboard-text-outline' },
        ],
      },
      { label: 'Financeiro', route: 'Financeiro', icon: 'cash-multiple' },
      { label: 'Usuários', route: 'Usuarios', icon: 'account-multiple-outline' },
    ],
    []
  );

  return (
    <DrawerContentScrollView {...props}>
      {menu.map((item: any) => {
        const childRoutes = item.children?.map((c: any) => c.route) ?? [];
        const parentActive = activeRouteName === item.route || childRoutes.includes(activeRouteName);

        return (
          <View key={item.route}>
            <DrawerItem
              label={item.label}
              focused={parentActive}
              onPress={() => {
                if (item.children) setObrasOpen((v) => !v);
                props.navigation.navigate(item.route);
              }}
              icon={({ color, size }) => getIcon(item.icon, color, size)}
            />

            {item.children && obrasOpen ? (
              <View style={drawerStyles.submenuContainer}>
                {item.children.map((child: any) => (
                  <DrawerItem
                    key={child.route}
                    label={child.label}
                    focused={activeRouteName === child.route}
                    onPress={() => props.navigation.navigate(child.route)}
                    icon={({ color, size }) => getIcon(child.icon, color, size - 2)}
                    labelStyle={drawerStyles.submenuLabel}
                  />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </DrawerContentScrollView>
  );
}

export const DrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{
      ...HEADER_OPTS,
      drawerActiveTintColor: SM_COLORS.secondary,
      drawerInactiveTintColor: SM_COLORS.textSecondary,
      drawerLabelStyle: { fontSize: 14, fontWeight: '500' },
    }}
  >
    {/* Mantidas para navegação interna; menu visível é definido no CustomDrawerContent */}
    <Drawer.Screen
      name="Home"
      component={HomeScreen}
      options={{ title: 'Início', drawerItemStyle: { display: 'none' }, drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="home-outline" color={color} size={size} /> }}
    />
    <Drawer.Screen
      name="Dashboard"
      component={RelatoriosScreen}
      options={{ title: 'Dashboard', drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} /> }}
    />

    <Drawer.Screen
      name="Obras"
      component={ObrasScreen}
      options={{ title: 'Obras', drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="briefcase-outline" color={color} size={size} /> }}
    />
    <Drawer.Screen
      name="RDOList"
      component={RDOListScreen}
      options={{ title: 'Diários de Obra (RDO)', drawerItemStyle: { display: 'none' }, drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="notebook-outline" color={color} size={size} /> }}
    />
    <Drawer.Screen
      name="Alocacao"
      component={AlocacaoScreen}
      options={{ title: 'Alocação de Equipe', drawerItemStyle: { display: 'none' }, drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="account-hard-hat" color={color} size={size} /> }}
    />
    <Drawer.Screen
      name="Medicoes"
      component={MedicoesScreen}
      options={{ title: 'Medições', drawerItemStyle: { display: 'none' }, drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="ruler-square" color={color} size={size} /> }}
    />
    <Drawer.Screen
      name="Configuracoes"
      component={ConfiguracoesScreen}
      options={{ title: 'Sessões O.S.', drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="clipboard-text-outline" color={color} size={size} /> }}
    />

    <Drawer.Screen
      name="Clientes"
      component={ClientesScreen}
      options={{ title: 'Clientes', drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="domain" color={color} size={size} /> }}
    />
    <Drawer.Screen
      name="Colaboradores"
      component={ColaboradoresScreen}
      options={{ title: 'Colaboradores', drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group-outline" color={color} size={size} /> }}
    />
    <Drawer.Screen
      name="Pavimentos"
      component={PavimentosScreen}
      options={{ title: 'Pavimentos', drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="layers-outline" color={color} size={size} /> }}
    />
    <Drawer.Screen
      name="Ambientes"
      component={AmbientesScreen}
      options={{ title: 'Ambientes', drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="floor-plan" color={color} size={size} /> }}
    />
    <Drawer.Screen
      name="ItensAmbiente"
      component={ItensAmbienteScreen}
      options={{ title: 'Elementos de Serviço', drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="format-list-text" color={color} size={size} /> }}
    />

    <Drawer.Screen
      name="Financeiro"
      component={FinanceiroScreen}
      options={{ title: 'Financeiro', drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="cash-multiple" color={color} size={size} /> }}
    />
    <Drawer.Screen
      name="Precos"
      component={PrecosScreen}
      options={{ title: 'Preço', drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="currency-usd" color={color} size={size} /> }}
    />
    <Drawer.Screen
      name="ValesAdiantamento"
      component={ValesAdiantamentoScreen}
      options={{ title: 'Vales de Adiantamento', drawerItemStyle: { display: 'none' }, drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="wallet-outline" color={color} size={size} /> }}
    />
    <Drawer.Screen
      name="Catalogo"
      component={CatalogoScreen}
      options={{ title: 'Serviços', drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="package-variant-closed" color={color} size={size} /> }}
    />

    <Drawer.Screen
      name="Usuarios"
      component={UsuariosScreen}
      options={{ title: 'Usuários', drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="account-multiple-outline" color={color} size={size} /> }}
    />
  </Drawer.Navigator>
);
