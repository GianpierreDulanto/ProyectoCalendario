import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';

export default function ProjectSelector({ onProjectChange, currentProjectId: propCurrentProjectId, currentProjectName }) {
  const { projects, currentProjectId: hookCurrentProjectId, setCurrentProjectId, createProject, renameProject, deleteProject } = useProjects();
  
  // Usar la prop currentProjectId si se proporciona, si no usar la del hook
  const currentProjectId = propCurrentProjectId ?? hookCurrentProjectId;
  const [showMenu, setShowMenu] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renamingName, setRenamingName] = useState('');

  const currentProject = projects.find(p => p.id === currentProjectId);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      await createProject(newProjectName);
      setNewProjectName('');
      setIsCreating(false);
    }
  };

  const handleRenameProject = async (projectId) => {
    if (renamingName.trim()) {
      await renameProject(projectId, renamingName);
      setRenamingId(null);
      setRenamingName('');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('¿Seguro que quieres eliminar este progreso?')) {
      await deleteProject(projectId);
    }
  };

  return (
    <div className="relative">
      {/* Botón Principal */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow"
      >
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="font-semibold text-gray-900">
          {currentProjectName || currentProject?.name || 'Sin proyecto'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform ${showMenu ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Menú Desplegable */}
      {showMenu && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Crear Proyecto */}
          <div className="p-4 border-b border-gray-200">
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Progreso
              </button>
            ) : (
              <form onSubmit={handleCreateProject} className="space-y-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Nombre del progreso..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setNewProjectName('');
                    }}
                    className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Lista de Proyectos */}
          <div className="max-h-80 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No hay progresos aún. Crea uno para comenzar.
              </div>
            ) : (
              projects.map(project => (
                <div
                  key={project.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    currentProjectId === project.id ? 'bg-purple-50' : ''
                  }`}
                >
                  {renamingId === project.id ? (
                    // Modo edición
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRenameProject(project.id);
                      }}
                      className="space-y-2"
                    >
                      <input
                        type="text"
                        value={renamingName}
                        onChange={(e) => setRenamingName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingId(null);
                            setRenamingName('');
                          }}
                          className="flex-1 px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    // Modo vista
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={async () => {
                          if (onProjectChange) {
                            await onProjectChange(project.id);
                          } else {
                            setCurrentProjectId(project.id);
                          }
                          setShowMenu(false);
                        }}
                        className="flex-1 text-left"
                      >
                        <p className="font-semibold text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(project.updatedAt?.toDate?.() || project.updatedAt).toLocaleDateString('es-ES')}
                        </p>
                      </button>

                      {/* Botones de acción */}
                      <div className="flex gap-1">
                        {/* Botón editar */}
                        <button
                          onClick={() => {
                            setRenamingId(project.id);
                            setRenamingName(project.name);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar nombre"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Botón eliminar */}
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Cerrar menú al hacer clic fuera */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
