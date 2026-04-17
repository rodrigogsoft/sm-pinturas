import { useCallback, useEffect, useMemo, useState } from 'react';

export const useClientPagination = <T,>(items: T[], initialRowsPerPage = 10) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  useEffect(() => {
    const maxPage = Math.max(Math.ceil(items.length / rowsPerPage) - 1, 0);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [items.length, page, rowsPerPage]);

  const paginatedItems = useMemo(() => {
    const start = page * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, page, rowsPerPage]);

  const handlePageChange = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const resetPagination = useCallback(() => {
    setPage(0);
  }, []);

  return {
    page,
    rowsPerPage,
    paginatedItems,
    handlePageChange,
    handleRowsPerPageChange,
    resetPagination,
  };
};

export default useClientPagination;