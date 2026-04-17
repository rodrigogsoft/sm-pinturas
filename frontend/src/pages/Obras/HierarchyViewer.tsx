import React, { useState } from 'react';
import {
  Breadcrumbs,
  Button,
  Chip,
  Collapse,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FolderOpen as FolderOpenIcon,
  Home as HomeIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Domain as ObraIcon,
  Layers as PavimentoIcon,
  Widgets as AmbienteIcon,
} from '@mui/icons-material';
import { Obra } from '../../services/obras.service';

interface Ambiente {
  id: string;
  nome: string;
  area_m2: number;
}

interface Pavimento {
  id: string;
  nome: string;
  ordem: number;
  ambientes?: Ambiente[];
}

interface ObraHierarchy extends Obra {
  pavimentos?: Pavimento[];
}

interface HierarchyViewerProps {
  obra: ObraHierarchy;
  loading?: boolean;
  onAddPavimento?: (obraId: string) => void;
  onEditPavimento?: (pavimentoId: string) => void;
  onDeletePavimento?: (pavimentoId: string) => void;
  onAddAmbiente?: (pavimentoId: string) => void;
  onEditAmbiente?: (ambienteId: string) => void;
  onDeleteAmbiente?: (ambienteId: string) => void;
}

export const HierarchyViewer: React.FC<HierarchyViewerProps> = ({
  obra,
  loading = false,
  onAddPavimento,
  onEditPavimento,
  onDeletePavimento,
  onAddAmbiente,
  onEditAmbiente,
  onDeleteAmbiente,
}) => {
  const [expandedPavimentos, setExpandedPavimentos] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<{ type: 'pavimento' | 'ambiente'; id: string } | null>(null);

  const togglePavimento = (pavimentoId: string) => {
    const newExpanded = new Set(expandedPavimentos);
    if (newExpanded.has(pavimentoId)) {
      newExpanded.delete(pavimentoId);
    } else {
      newExpanded.add(pavimentoId);
    }
    setExpandedPavimentos(newExpanded);
  };

  const pavimentos = obra.pavimentos || [];

  return (
    <Box>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/obras" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <HomeIcon fontSize="small" />
            Obras
          </Link>
          <Typography color="textPrimary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ObraIcon fontSize="small" />
            {obra.nome}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header da Hierarquia */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Estrutura da Obra
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {pavimentos.length} pavimento(s) - {pavimentos.reduce((sum, p) => sum + (p.ambientes?.length || 0), 0)} ambiente(s)
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => onAddPavimento?.(obra.id)}
            disabled={loading}
          >
            Novo Pavimento
          </Button>
        </Box>
      </Paper>

      {/* Árvore de Hierarquia */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : pavimentos.length === 0 ? (
        <Alert severity="info">
          Nenhum pavimento cadastrado. Clique em "Novo Pavimento" para começar.
        </Alert>
      ) : (
        <List disablePadding>
          {pavimentos
            .sort((a, b) => a.ordem - b.ordem)
            .map((pavimento) => (
              <Box key={pavimento.id}>
                {/* Pavimento Item */}
                <ListItem
                  disablePadding
                  sx={{
                    bgcolor: selectedItem?.type === 'pavimento' && selectedItem?.id === pavimento.id ? '#e3f2fd' : 'transparent',
                    '&:hover': { bgcolor: '#f5f5f5' },
                    mb: 1,
                    borderRadius: 1,
                    border: selectedItem?.type === 'pavimento' && selectedItem?.id === pavimento.id ? '2px solid #2196F3' : 'none',
                  }}
                >
                  <ListItemButton
                    onClick={() => togglePavimento(pavimento.id)}
                    sx={{
                      pl: 1,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <IconButton
                        edge="start"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePavimento(pavimento.id);
                        }}
                      >
                        {expandedPavimentos.has(pavimento.id) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                      </IconButton>
                    </ListItemIcon>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <PavimentoIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                            Pavimento {pavimento.ordem}: {pavimento.nome}
                          </Typography>
                          <Chip
                            label={`${pavimento.ambientes?.length || 0} ambiente(s)`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPavimento?.(pavimento.id);
                        }}
                        title="Editar pavimento"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Deletar este pavimento e todos seus ambientes?')) {
                            onDeletePavimento?.(pavimento.id);
                          }
                        }}
                        title="Deletar pavimento"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemButton>
                </ListItem>

                {/* Ambientes (Pavimento Expandido) */}
                <Collapse in={expandedPavimentos.has(pavimento.id)} timeout="auto" unmountOnExit>
                  <Box sx={{ pl: 4, mb: 1 }}>
                    {(!pavimento.ambientes || pavimento.ambientes.length === 0) ? (
                      <Box sx={{ py: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          Nenhum ambiente neste pavimento
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => onAddAmbiente?.(pavimento.id)}
                          variant="outlined"
                        >
                          Adicionar Ambiente
                        </Button>
                      </Box>
                    ) : (
                      <List disablePadding>
                        {pavimento.ambientes.map((ambiente) => (
                          <ListItem
                            key={ambiente.id}
                            disablePadding
                            sx={{
                              bgcolor: selectedItem?.type === 'ambiente' && selectedItem?.id === ambiente.id ? '#f3e5f5' : 'transparent',
                              '&:hover': { bgcolor: '#fafafa' },
                              mb: 0.5,
                              borderRadius: 1,
                              border: selectedItem?.type === 'ambiente' && selectedItem?.id === ambiente.id ? '2px solid #9C27B0' : 'none',
                            }}
                          >
                            <ListItemButton
                              sx={{ pl: 0 }}
                              onClick={() => setSelectedItem({ type: 'ambiente', id: ambiente.id })}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <AmbienteIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: '500' }}>
                                      {ambiente.nome}
                                    </Typography>
                                    <Chip
                                      label={`${ambiente.area_m2} m²`}
                                      size="small"
                                      variant="outlined"
                                      icon={<FolderOpenIcon />}
                                    />
                                  </Box>
                                }
                              />
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditAmbiente?.(ambiente.id);
                                  }}
                                  title="Editar ambiente"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Deletar este ambiente?')) {
                                      onDeleteAmbiente?.(ambiente.id);
                                    }
                                  }}
                                  title="Deletar ambiente"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </ListItemButton>
                          </ListItem>
                        ))}
                        <Box sx={{ mt: 1, ml: 1 }}>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => onAddAmbiente?.(pavimento.id)}
                            variant="outlined"
                          >
                            Novo Ambiente
                          </Button>
                        </Box>
                      </List>
                    )}
                  </Box>
                </Collapse>
              </Box>
            ))}
        </List>
      )}
    </Box>
  );
};

export default HierarchyViewer;
