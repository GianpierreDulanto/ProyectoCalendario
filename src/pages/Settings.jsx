import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, updateUserProfile, updateUserPassword } = useAuth();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editingPassword, setEditingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.displayName) {
      setEditName(user.displayName);
    }
  }, [user]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setMessage({ type: 'error', text: 'El nombre no puede estar vacío' });
      return;
    }
    setLoading(true);
    try {
      await updateUserProfile({ displayName: editName });
      setMessage({ type: 'success', text: 'Nombre actualizado correctamente' });
      setEditingProfile(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error al actualizar el nombre' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setMessage({ type: 'error', text: 'Ingresa tu contraseña actual' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    setLoading(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error al actualizar la contraseña' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Configuración</h1>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Perfil - Editar Nombre */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Perfil</h2>
              {!editingProfile && user?.providerData?.[0]?.providerId !== 'google.com' && (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Editar
                </button>
              )}
            </div>
            
            {editingProfile ? (
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                  >
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(false);
                      setEditName(user?.displayName || '');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium">{user?.displayName || 'No configurado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Correo</p>
                  <p className="font-medium break-all">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Autenticación</p>
                  <p className="font-medium">
                    {user?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email/Contraseña'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card: Información */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Información</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Aplicación</p>
                <p className="font-medium">Herramienta Calendario v1.0</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Última actualización</p>
                <p className="font-medium">Enero 2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Cambiar Contraseña (solo para Email/Password) */}
        {user?.providerData?.[0]?.providerId !== 'google.com' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Seguridad</h2>
              {!editingPassword && (
                <button
                  onClick={() => setEditingPassword(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Cambiar Contraseña
                </button>
              )}
            </div>

            {editingPassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Contraseña Actual</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Nueva Contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                  >
                    {loading ? 'Actualizando...' : 'Actualizar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-gray-600">Puedes cambiar tu contraseña usando el botón de arriba.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
