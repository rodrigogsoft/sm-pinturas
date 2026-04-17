import React, { useEffect } from 'react';
import { Typography, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { buscarObras } from '../store/slices/obrasSlice';
import type { AppDispatch, RootState } from '../store';

const ObrasPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { lista, carregando, erro } = useSelector((state: RootState) => state.obras);

  useEffect(() => {
    dispatch(buscarObras());
  }, [dispatch]);

  if (carregando) return <CircularProgress />;
  if (erro) return <Alert severity="error">{erro}</Alert>;

  return (
    <>
      <Typography variant="h5" component="div" sx={{ mb: 2 }}>Obras</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Descrição</TableCell>
            <TableCell>Endereço</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lista.map((obra) => (
            <TableRow key={obra.id}>
              <TableCell>{obra.descricao}</TableCell>
              <TableCell>{obra.endereco}</TableCell>
              <TableCell>{obra.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default ObrasPage;
