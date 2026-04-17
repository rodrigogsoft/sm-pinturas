import { TablePagination, TablePaginationProps } from '@mui/material';

type LeftAlignedTablePaginationProps = Omit<TablePaginationProps, 'component'>;

export const LeftAlignedTablePagination = (props: LeftAlignedTablePaginationProps) => {
  return (
    <TablePagination
      component="div"
      rowsPerPageOptions={[10, 20, 50, 100]}
      labelRowsPerPage="Itens por página"
      sx={{
        '& .MuiTablePagination-toolbar': {
          justifyContent: 'flex-start',
          px: 2,
          gap: 2,
          flexWrap: 'wrap',
        },
        '& .MuiTablePagination-spacer': {
          display: 'none',
        },
        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
          margin: 0,
        },
        '& .MuiTablePagination-actions': {
          marginLeft: 0,
        },
      }}
      {...props}
    />
  );
};

export default LeftAlignedTablePagination;