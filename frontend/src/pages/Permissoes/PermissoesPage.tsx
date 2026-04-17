import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Checkbox,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Save as SaveIcon } from '@mui/icons-material';
import permissoesService, {
  PerfilComPermissoes,
  PermissoesModulos,
  PermissoesModulo,
  PermissoesAcoes,
} from '../../services/permissoes.service';

// ─── Definição declarativa dos módulos ─────────────────────────────────────
interface DefModulo {
  key: string;
  label: string;
  acoes: (keyof PermissoesAcoes)[];
  submodulos?: { key: string; label: string; acoes: (keyof PermissoesAcoes)[] }[];
}

const MODULOS: DefModulo[] = [
  { key: 'dashboard',    label: 'Dashboard',           acoes: ['visualizar'] },
  { key: 'clientes',     label: 'Clientes',             acoes: ['visualizar', 'criar', 'editar', 'apagar'] },
  { key: 'colaboradores',label: 'Colaboradores',        acoes: ['visualizar', 'criar', 'editar', 'apagar'] },
  { key: 'servicos',     label: 'Serviços',             acoes: ['visualizar', 'criar', 'editar', 'apagar'] },
  { key: 'precos',       label: 'Preço',                acoes: ['visualizar', 'criar', 'editar', 'apagar', 'aprovar'] },
  {
    key: 'obras', label: 'Obras', acoes: ['visualizar', 'criar', 'editar', 'apagar'],
    submodulos: [
      { key: 'pavimentos',    label: 'Pavimentos',           acoes: ['visualizar', 'criar', 'editar', 'apagar'] },
      { key: 'ambientes',     label: 'Ambientes',            acoes: ['visualizar', 'criar', 'editar', 'apagar'] },
      { key: 'itens_ambiente',label: 'Elementos de Serviço', acoes: ['visualizar', 'criar', 'editar', 'apagar'] },
      { key: 'os',            label: 'O.S.',                 acoes: ['visualizar', 'criar', 'editar', 'apagar'] },
    ],
  },
  { key: 'financeiro', label: 'Financeiro', acoes: ['visualizar', 'criar', 'editar', 'apagar'] },
  { key: 'usuarios',   label: 'Usuários',   acoes: ['visualizar', 'criar', 'editar', 'apagar'] },
  { key: 'auditoria',  label: 'Auditoria',  acoes: ['visualizar'] },
  { key: 'permissoes', label: 'Permissões', acoes: ['visualizar', 'editar'] },
];

const LABEL_ACAO: Record<keyof PermissoesAcoes, string> = {
  visualizar: 'Ver',
  criar:      'Criar',
  editar:     'Editar',
  apagar:     'Apagar',
  aprovar:    'Aprovar',
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function moduloVazio(def: DefModulo): PermissoesModulo {
  const acoes: PermissoesAcoes = {};
  def.acoes.forEach((a) => (acoes[a] = false));
  const mod: PermissoesModulo = { ativo: false, acoes };
  if (def.submodulos) {
    mod.submodulos = {};
    def.submodulos.forEach((s) => {
      const subAcoes: PermissoesAcoes = {};
      s.acoes.forEach((a) => (subAcoes[a] = false));
      mod.submodulos![s.key] = { ativo: false, acoes: subAcoes };
    });
  }
  return mod;
}

function normalizarPermissoes(raw: PermissoesModulos | null): PermissoesModulos {
  const resultado: PermissoesModulos = {};
  MODULOS.forEach((def) => {
    const existente = raw?.[def.key];
    if (existente) {
      resultado[def.key] = existente;
    } else {
      resultado[def.key] = moduloVazio(def);
    }
  });
  return resultado;
}

// ─── Componente de ações de um módulo ───────────────────────────────────────
function AcoesModulo({
  acoesDef,
  acoes,
  moduloAtivo,
  onChange,
}: {
  acoesDef: (keyof PermissoesAcoes)[];
  acoes: PermissoesAcoes;
  moduloAtivo: boolean;
  onChange: (acao: keyof PermissoesAcoes, valor: boolean) => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
      {acoesDef.map((acao) => (
        <FormControlLabel
          key={acao}
          disabled={!moduloAtivo}
          control={
            <Checkbox
              size="small"
              checked={!!acoes[acao]}
              onChange={(e) => onChange(acao, e.target.checked)}
            />
          }
          label={LABEL_ACAO[acao]}
          sx={{ mr: 0 }}
        />
      ))}
    </Box>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export const PermissoesPage = () => {
  const [perfis, setPerfis] = useState<PerfilComPermissoes[]>([]);
  const [perfilSelecionado, setPerfilSelecionado] = useState<number | ''>('');
  const [permissoes, setPermissoes] = useState<PermissoesModulos>({});
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    permissoesService.listarPerfis().then((lista) => {
      // ADMIN (id=1) não é configurável — tem acesso total por definição
      const perfisFiltrados = lista.filter((p) => p.id !== 1);
      setPerfis(perfisFiltrados);

      // Seleciona um perfil válido assim que a lista for carregada.
      // Prefere GESTOR (id=2) quando disponível.
      const perfilPadrao = perfisFiltrados.find((p) => p.id === 2)?.id ?? perfisFiltrados[0]?.id ?? '';
      setPerfilSelecionado(perfilPadrao);
    });
  }, []);

  const carregarPermissoes = useCallback(async (idPerfil: number) => {
    try {
      setCarregando(true);
      setErro('');
      const perfil = await permissoesService.buscarPerfil(idPerfil);
      setPermissoes(normalizarPermissoes(perfil.permissoes_modulos));
    } catch {
      setErro('Erro ao carregar permissões do perfil.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (typeof perfilSelecionado === 'number') carregarPermissoes(perfilSelecionado);
  }, [perfilSelecionado, carregarPermissoes]);

  const handleToggleModulo = (moduloKey: string, ativo: boolean) => {
    setPermissoes((prev) => {
      const mod = { ...prev[moduloKey], ativo };
      // Desativar módulo desativa submodulos (RN14)
      if (!ativo && mod.submodulos) {
        const subs: typeof mod.submodulos = {};
        Object.entries(mod.submodulos).forEach(([k, v]) => {
          subs[k] = { ...v, ativo: false };
        });
        mod.submodulos = subs;
      }
      return { ...prev, [moduloKey]: mod };
    });
  };

  const handleToggleAcao = (moduloKey: string, acao: keyof PermissoesAcoes, valor: boolean) => {
    setPermissoes((prev) => ({
      ...prev,
      [moduloKey]: {
        ...prev[moduloKey],
        acoes: { ...prev[moduloKey].acoes, [acao]: valor },
      },
    }));
  };

  const handleToggleSubmodulo = (moduloKey: string, subKey: string, ativo: boolean) => {
    setPermissoes((prev) => ({
      ...prev,
      [moduloKey]: {
        ...prev[moduloKey],
        submodulos: {
          ...prev[moduloKey].submodulos,
          [subKey]: { ...prev[moduloKey].submodulos![subKey], ativo },
        },
      },
    }));
  };

  const handleToggleAcaoSubmodulo = (
    moduloKey: string,
    subKey: string,
    acao: keyof PermissoesAcoes,
    valor: boolean,
  ) => {
    setPermissoes((prev) => ({
      ...prev,
      [moduloKey]: {
        ...prev[moduloKey],
        submodulos: {
          ...prev[moduloKey].submodulos,
          [subKey]: {
            ...prev[moduloKey].submodulos![subKey],
            acoes: { ...prev[moduloKey].submodulos![subKey].acoes, [acao]: valor },
          },
        },
      },
    }));
  };

  const handleSalvar = async () => {
    if (typeof perfilSelecionado !== 'number') {
      setErro('Selecione um perfil antes de salvar.');
      return;
    }

    try {
      setSalvando(true);
      setErro('');
      setSucesso('');
      await permissoesService.atualizar(perfilSelecionado, permissoes);
      setSucesso('Permissões salvas com sucesso! As alterações terão efeito no próximo login dos usuários.');
    } catch {
      setErro('Erro ao salvar permissões.');
    } finally {
      setSalvando(false);
    }
  };

  const nomePerfil = perfis.find((p) => p.id === perfilSelecionado)?.nome ?? '';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          Administração de Permissões
        </Typography>
        <Typography color="textSecondary">
          ERS 4.2 — Configure módulos e ações por perfil de acesso
        </Typography>
      </Box>

      {sucesso && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSucesso('')}>{sucesso}</Alert>}
      {erro    && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setErro('')}>{erro}</Alert>}

      <Alert severity="info" sx={{ mb: 3 }}>
        O perfil <strong>Administrador</strong> tem acesso total e não pode ser restringido.
        Alterações aplicam-se a todos os usuários do perfil selecionado.
      </Alert>

      {/* Seletor de perfil */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Perfil</InputLabel>
          <Select
            value={perfilSelecionado}
            label="Perfil"
            onChange={(e) => setPerfilSelecionado(Number(e.target.value))}
            displayEmpty
          >
            <MenuItem value="" disabled>
              Selecione um perfil
            </MenuItem>
            {perfis.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {nomePerfil && <Chip label={`Editando: ${nomePerfil}`} color="primary" variant="outlined" />}

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="contained"
          color="primary"
          startIcon={salvando ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSalvar}
          disabled={salvando || carregando}
        >
          Salvar Alterações
        </Button>
      </Paper>

      {/* Árvore de módulos */}
      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {MODULOS.map((def) => {
            const mod = permissoes[def.key];
            if (!mod) return null;

            return (
              <Grid item xs={12} key={def.key}>
                <Card variant="outlined" sx={{ opacity: mod.ativo ? 1 : 0.65 }}>
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={mod.ativo}
                              onChange={(e) => handleToggleModulo(def.key, e.target.checked)}
                              color="success"
                            />
                          }
                          label={<Typography variant="subtitle1" fontWeight="bold">{def.label}</Typography>}
                        />
                      </Box>
                    }
                    action={
                      <Chip
                        size="small"
                        label={mod.ativo ? 'Ativo' : 'Desativado'}
                        color={mod.ativo ? 'success' : 'default'}
                      />
                    }
                    sx={{ pb: 0 }}
                  />
                  <CardContent sx={{ pt: 1 }}>
                    <AcoesModulo
                      acoesDef={def.acoes}
                      acoes={mod.acoes}
                      moduloAtivo={mod.ativo}
                      onChange={(acao, valor) => handleToggleAcao(def.key, acao, valor)}
                    />

                    {/* Submodulos */}
                    {def.submodulos && mod.submodulos && (
                      <>
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                          Subpáginas (desativar o módulo pai desativa todas)
                        </Typography>
                        {def.submodulos.map((subDef) => {
                          const sub = mod.submodulos![subDef.key];
                          if (!sub) return null;
                          return (
                            <Accordion
                              key={subDef.key}
                              disableGutters
                              elevation={0}
                              sx={{ border: '1px solid', borderColor: 'divider', mb: 0.5 }}
                            >
                              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40 }}>
                                <FormControlLabel
                                  onClick={(e) => e.stopPropagation()}
                                  onFocus={(e) => e.stopPropagation()}
                                  control={
                                    <Switch
                                      size="small"
                                      checked={sub.ativo}
                                      disabled={!mod.ativo}
                                      onChange={(e) =>
                                        handleToggleSubmodulo(def.key, subDef.key, e.target.checked)
                                      }
                                    />
                                  }
                                  label={subDef.label}
                                />
                              </AccordionSummary>
                              <AccordionDetails sx={{ pt: 0 }}>
                                <AcoesModulo
                                  acoesDef={subDef.acoes}
                                  acoes={sub.acoes}
                                  moduloAtivo={mod.ativo && sub.ativo}
                                  onChange={(acao, valor) =>
                                    handleToggleAcaoSubmodulo(def.key, subDef.key, acao, valor)
                                  }
                                />
                              </AccordionDetails>
                            </Accordion>
                          );
                        })}
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default PermissoesPage;
