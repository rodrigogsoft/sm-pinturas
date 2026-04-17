/**
 * Custom Redux hooks
 * Exporta hooks tipados do Redux para melhor experiência de desenvolvimento
 */

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';

/**
 * Hook para usar Redux dispatch com tipos
 */
export const useAppDispatch = () => {
  return useDispatch();
};

/**
 * Hook para usar Redux selector com tipos
 */
export const useAppSelector = <T,>(selector: (state: RootState) => T): T => {
  return useSelector(selector);
};
