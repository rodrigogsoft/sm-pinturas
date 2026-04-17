// import { format, parseISO } from 'date-fns';  // Not installed
// import { ptBR } from 'date-fns/locale';  // Not installed

export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

export const formatDatetime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}:${seconds}`;
  } catch {
    return dateString;
  }
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const calculateProdutividade = (area: number, horas: number): number => {
  if (horas === 0) return 0;
  return area / horas;
};

export const getProdutividadeColor = (horas_por_m2: number): string => {
  if (horas_por_m2 < 0.5) return '#4CAF50'; // Excelente (verde)
  if (horas_por_m2 < 1.0) return '#FFC107'; // Bom (amarelo)
  return '#F44336'; // Precisa melhorar (vermelho)
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'rascunho':
      return '#FF9800';
    case 'enviado':
      return '#2196F3';
    case 'sincronizado':
      return '#4CAF50';
    default:
      return '#999';
  }
};

export const compressImage = async (base64: string): Promise<string> => {
  // Implementação simples - em produção usar biblioteca como 'react-native-image-resizer'
  // Por enquanto apenas retorna a imagem como está
  return base64;
};

export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const regex = /^[\d\s\-\(\)]+$/;
  return regex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};
