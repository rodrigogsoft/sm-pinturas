import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/index';
import { authAPI, setApiAuthToken } from '../services/api';
import { logout, setUser } from '../store/slices/authSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user, token, refreshToken } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const [restoringUser, setRestoringUser] = useState(false);
  const restoredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const restoreUserFromToken = async () => {
      if (!isAuthenticated || user) {
        return;
      }

      const storedToken = token || localStorage.getItem('token');
      if (!storedToken) {
        dispatch(logout());
        return;
      }

      // Evita tentativas repetidas de restore com o mesmo token quando ele já falhou.
      if (restoredTokenRef.current === storedToken) {
        return;
      }

      restoredTokenRef.current = storedToken;

      try {
        setRestoringUser(true);
        const response = await authAPI.getProfile();
        const userFromApi = response.data || {};
        const idPerfil = Number(userFromApi.id_perfil ?? userFromApi.perfil);
        setApiAuthToken(storedToken);
        dispatch(
          setUser({
            user: {
              ...userFromApi,
              id_perfil: Number.isFinite(idPerfil) ? idPerfil : 0,
              perfil_nome: userFromApi.perfil_nome || String(userFromApi.id_perfil ?? userFromApi.perfil ?? ''),
              permissoes_modulos: userFromApi.permissoes_modulos ?? null,
            },
            token: storedToken,
            refreshToken: refreshToken || localStorage.getItem('refresh_token'),
          }),
        );
      } catch {
        setApiAuthToken(null);
        dispatch(logout());
      } finally {
        setRestoringUser(false);
      }
    };

    restoreUserFromToken();
  }, [dispatch, isAuthenticated, refreshToken, token, user]);

  if (loading || restoringUser) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};
