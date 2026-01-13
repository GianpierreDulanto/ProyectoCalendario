import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  // Iniciales del usuario
  const initials = (user.displayName || user.email)
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  // Obtener foto de Google si está disponible
  const photoURL = user.photoURL;
  const isGoogleUser = user.providerData?.[0]?.providerId === 'google.com';
  
  // Debug


  return (
    <div className="relative">
      {/* Botón Avatar */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
        title={user.email}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
          {photoURL ? (
            <img src={photoURL} alt={user.displayName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline max-w-[150px] truncate">
          {user.displayName || user.email.split('@')[0]}
        </span>
      </button>

      {/* Menú desplegable */}
      {showMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header del menú */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-lg font-bold overflow-hidden flex-shrink-0">
                {photoURL ? (
                  <img src={photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {user.displayName || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Información */}
          <div className="p-4 border-b border-gray-200 space-y-2 text-sm">
            <div>
              <p className="text-gray-600">Nombre</p>
              <p className="font-medium text-gray-900">
                {user.displayName || 'No configurado'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Correo</p>
              <p className="font-medium text-gray-900 break-words">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-600">Proveedor</p>
              <p className="font-medium text-gray-900">
                {isGoogleUser ? '🔵 Google' : '📧 Email/Contraseña'}
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="p-2">
            <button
              onClick={() => {
                setShowMenu(false);
                navigate('/settings');
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700"
            >
              ⚙️ Configuración
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full text-left px-4 py-2 hover:bg-red-50 rounded-lg transition-colors text-sm text-red-600 disabled:opacity-50 cursor-pointer"
            >
              {isLoggingOut ? '⏳ Cerrando sesión...' : '🚪 Cerrar Sesión'}
            </button>
          </div>
        </div>
      )}

      {/* Cierre del menú al hacer clic fuera */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
