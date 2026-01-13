import { useState, useEffect, useRef } from 'react';
import GanttTableTimeline from './components/Gantt/GanttTableTimeline';
import GanttTableTimelineC from './components/Gantt/GanttTableTimelineC';
import GanttTableSimpleEditor from './components/Gantt/GanttTableSimpleEditor';
import GanttTableSimpleEditorB from './components/Gantt/GanttTableSimpleEditorB';
import UserProfile from './components/UserProfile';
import ProjectSelector from './components/ProjectSelector';
import { useAuth } from './hooks/useAuth';
import { useAutoSave } from './hooks/useAutoSave';
import { useProjects } from './hooks/useProjects';

function App() {
  const { user: _user } = useAuth();
  const { currentProjectId, setCurrentProjectId, projects, createProject, _updateProject, getCurrentProject, loading: projectsLoading } = useProjects();
  
  const [simpleMode, setSimpleMode] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  // Modo A: estructura plana { phase: string, profile: string, bars: [] }
  const [rowsA, setRowsA] = useState([{ phase: '', profile: '', bars: [] }]);
  
  // Modos B y C: estructura jerárquica { etapa: string, entregables: [{ nombre: string, bars: [] }] }
  const [rowsB, setRowsB] = useState([{ etapa: '', entregables: [{ nombre: '', bars: [] }] }]);
  const [rowsC, setRowsC] = useState([{ etapa: '', entregables: [{ nombre: '', bars: [] }] }]);
  
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState('A');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const hasLoadedRef = useRef(false);

  // Resetear hasLoaded cuando cambia el proyecto
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [currentProjectId]);

  // Cargar datos del proyecto actual cuando cambia (una sola vez por proyecto)
  useEffect(() => {
    let isMounted = true;

    const loadProjectData = async () => {
      if (!projectsLoading && currentProjectId && !hasLoadedRef.current) {
        const currentProject = getCurrentProject();
        if (currentProject && isMounted) {
          hasLoadedRef.current = true;
          // Batch updates together
          await Promise.resolve().then(() => {
            if (!isMounted) return;
            setRowsA(currentProject.rowsA || [{ phase: '', profile: '', bars: [] }]);
            setRowsB(currentProject.rowsB || [{ etapa: '', entregables: [{ nombre: '', bars: [] }] }]);
            setRowsC(currentProject.rowsC || [{ etapa: '', entregables: [{ nombre: '', bars: [] }] }]);
            setViewMode(currentProject.viewMode || 'A');
            setStartDate(currentProject.startDate || '');
            setEndDate(currentProject.endDate || '');
            setSaveStatus('✅ Progreso cargado');
            setDataLoading(false);
          });
          
          setTimeout(() => setSaveStatus(''), 2000);
        }
      } else if (!projectsLoading && projects.length === 0 && isMounted && !hasLoadedRef.current) {
        // Si no hay proyectos, crear uno por defecto
        hasLoadedRef.current = true;
        await createProject('Mi primer progreso');
        setDataLoading(false);
      } else if (!projectsLoading && isMounted) {
        setDataLoading(false);
      }
    };

    loadProjectData();

    return () => {
      isMounted = false;
    };
  }, [currentProjectId, projectsLoading, projects.length, getCurrentProject, createProject]);

  // Preparar datos para auto-guardar
  const allData = {
    rowsA,
    rowsB,
    rowsC,
    startDate,
    endDate,
    viewMode
  };

  // Guardar manual (sin auto-save automático)
  const { saveData, lastSaved, isSaving: saving } = useAutoSave(allData, currentProjectId, true);

  // Función para guardar manualmente
  const handleSave = async () => {
    setIsSaving(true);
    await saveData(allData);
    setSaveStatus('✅ Guardado correctamente');
    setTimeout(() => setSaveStatus(''), 3000);
    setIsSaving(false);
  };

  // Función para cambiar de proyecto (guarda primero, luego cambia)
  const handleChangeProject = async (projectId) => {
    // Guardar cambios del proyecto actual antes de cambiar
    await saveData(allData);
    // Resetear hasLoadedRef para que se carguen los datos del nuevo proyecto
    hasLoadedRef.current = false;
    // Cambiar a nuevo proyecto
    setCurrentProjectId(projectId);
  };

  const handleExport = () => {
    // Cambiar temporalmente a modo Timeline para exportar
    if (simpleMode) {
      setSimpleMode(false);
      setTimeout(() => setExporting(true), 100);
    } else {
      setExporting(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header con logo y perfil */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="w-full max-w-[98vw] mx-auto px-2 sm:px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Planificador</h1>
            <p className="text-xs text-gray-500">Sincronizado con Firebase</p>
          </div>

          {/* Selector de Proyectos */}
          <ProjectSelector 
            onProjectChange={handleChangeProject} 
            currentProjectId={currentProjectId}
            currentProjectName={projects.find(p => p.id === currentProjectId)?.name}
          />

          <div className="flex items-center gap-3 ml-auto">
            {saveStatus && (
              <span className="text-xs text-green-600 font-medium animate-pulse">
                {saveStatus}
              </span>
            )}
            {lastSaved && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                Guardado: {new Date(lastSaved).toLocaleTimeString('es-ES')}
              </span>
            )}
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Loader mientras se cargan datos */}
      {dataLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Cargando tus proyectos...</p>
          </div>
        </div>
      )}

      {!dataLoading && (
        <main className="flex-1 w-full max-w-[98vw] mx-auto px-2 sm:px-4 py-4 sm:py-6 flex flex-col items-center">
        {/* Switch A-B-C arriba a la izquierda con botón Guardar */}
        <div className="flex items-center justify-start gap-3 mb-4 w-full">
          <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-lg shadow border border-gray-200">
            {['A', 'B', 'C'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded font-medium text-sm transition-all ${
                  viewMode === mode
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          
          {/* Botón Guardar */}
          <button
            onClick={handleSave}
            disabled={isSaving || saving}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 shadow border ${
              isSaving || saving
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
            }`}
          >
            {isSaving || saving ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Guardar
              </>
            )}
          </button>
        </div>

        {/* Contenido basado en modo seleccionado */}
        {viewMode === 'C' && (
          <div className="w-full">
            <div className="bg-white border border-gray-200 rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Configurar fechas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Fecha de inicio</label>
                  <input
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Fecha de fin</label>
                  <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              {startDate && endDate && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-purple-900">
                    <strong>Período:</strong> {(() => {
                      const parseDate = (dateStr) => {
                        if (typeof dateStr === 'string') {
                          const [year, month, day] = dateStr.split('-').map(Number);
                          return new Date(year, month - 1, day);
                        }
                        return new Date(dateStr);
                      };
                      const start = parseDate(startDate);
                      const end = parseDate(endDate);
                      return `${start.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`;
                    })()}
                  </p>
                  <p className="text-sm mt-1 text-purple-900">
                    <strong>Días:</strong> {(() => {
                      const parseDate = (dateStr) => {
                        if (typeof dateStr === 'string') {
                          const [year, month, day] = dateStr.split('-').map(Number);
                          return new Date(year, month - 1, day);
                        }
                        return new Date(dateStr);
                      };
                      const start = parseDate(startDate);
                      const end = parseDate(endDate);
                      return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1);
                    })()}
                  </p>
                  <p className="text-sm mt-1 text-purple-900">
                    <strong>Días hábiles:</strong> {(() => {
                      const PERU_HOLIDAYS = [
                        "2024-01-01", "2024-03-28", "2024-03-29", "2024-05-01", "2024-06-29",
                        "2024-07-28", "2024-07-29", "2024-08-30", "2024-10-08", "2024-11-01",
                        "2024-12-08", "2024-12-25", "2025-01-01", "2025-04-17", "2025-04-18",
                        "2025-05-01", "2025-06-29", "2025-07-28", "2025-07-29", "2025-08-30",
                        "2025-10-08", "2025-11-01", "2025-12-08", "2025-12-25", "2026-01-01",
                        "2026-04-02", "2026-04-03", "2026-05-01", "2026-06-29", "2026-07-28",
                        "2026-07-29", "2026-08-30", "2026-10-08", "2026-11-01", "2026-12-08",
                        "2026-12-25",
                      ];
                      const parseDate = (dateStr) => {
                        if (typeof dateStr === 'string') {
                          const [year, month, day] = dateStr.split('-').map(Number);
                          return new Date(year, month - 1, day);
                        }
                        return new Date(dateStr);
                      };
                      const start = parseDate(startDate);
                      const end = parseDate(endDate);
                      let businessDays = 0;
                      let current = new Date(start);
                      while (current <= end) {
                        const dayOfWeek = current.getDay();
                        const dateStr = current.toISOString().split('T')[0];
                        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !PERU_HOLIDAYS.includes(dateStr)) {
                          businessDays++;
                        }
                        current.setDate(current.getDate() + 1);
                      }
                      return businessDays;
                    })()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contenido basado en modo seleccionado */}
        {(viewMode === 'A' || viewMode === 'B') && (
          <>
            {/* Toggle switch limpio para Timeline/Editor */}
            <div className="flex items-center justify-center gap-3 mb-4 w-full">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow border border-gray-200">
            <span className={`font-medium text-sm transition-colors ${!simpleMode ? 'text-purple-700' : 'text-gray-400'}`}>Timeline</span>
            <button
              type="button"
              aria-pressed={simpleMode}
              onClick={() => setSimpleMode(s => !s)}
              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 ${simpleMode ? 'bg-purple-600' : 'bg-gray-300'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${simpleMode ? 'translate-x-6' : 'translate-x-0.5'}`}
              />
            </button>
            <span className={`font-medium text-sm transition-colors ${simpleMode ? 'text-purple-700' : 'text-gray-400'}`}>Editor</span>
          </div>
        </div>
        
        {/* Contenedor principal */}
        <div className="w-full flex justify-center">
          {viewMode === 'A' && (
            <>
              {simpleMode ? (
                <GanttTableSimpleEditor 
                  rows={rowsA} 
                  setRows={setRowsA} 
                  onExport={handleExport}
                />
              ) : (
                <GanttTableTimeline
                  mode="A"
                  rows={rowsA}
                  setRows={setRowsA}
                  exporting={exporting}
                  setExporting={setExporting}
                />
              )}
            </>
          )}
          {viewMode === 'B' && (
            <>
              {simpleMode ? (
                <GanttTableSimpleEditorB 
                  rows={rowsB} 
                  setRows={setRowsB} 
                  onExport={handleExport}
                />
              ) : (
                <GanttTableTimeline
                  mode="B"
                  rows={rowsB}
                  setRows={setRowsB}
                  exporting={exporting}
                  setExporting={setExporting}
                />
              )}
            </>
          )}
          {viewMode === 'C' && (
            <GanttTableTimelineC
              rows={rowsC}
              setRows={setRowsC}
              exporting={exporting}
              setExporting={setExporting}
              startDate={startDate}
              endDate={endDate}
            />
          )}
        </div>

        {/* Botón de exportar solo en Timeline */}
        {(viewMode === 'A' || viewMode === 'B' || viewMode === 'C') && !simpleMode && (
          <div className="flex justify-center mt-4 w-full">
            <button
              onClick={() => setExporting(true)}
              className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar PNG
            </button>
          </div>
        )}
          </>
        )}

        {/* C mode - Timeline only */}
        {viewMode === 'C' && (
          <div className="w-full flex justify-center">
            <GanttTableTimelineC
              rows={rowsC}
              setRows={setRowsC}
              exporting={exporting}
              setExporting={setExporting}
              startDate={startDate}
              endDate={endDate}
            />
          </div>
        )}

        {/* Exportar para C */}
        {viewMode === 'C' && (
          <div className="flex justify-center mt-4 w-full">
            <button
              onClick={() => setExporting(true)}
              className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar PNG
            </button>
          </div>
        )}
        </main>
      )}
    </div>
  );
}

export default App;
