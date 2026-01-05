import { useState } from 'react';
import GanttTableTimeline from './components/Gantt/GanttTableTimeline';
import GanttTableSimpleEditor from './components/Gantt/GanttTableSimpleEditor';

function App() {
  const [simpleMode, setSimpleMode] = useState(false);
  const [rows, setRows] = useState([
    { phase: '', profile: '', bars: [] },
  ]);
  const [exporting, setExporting] = useState(false);

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
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <main className="flex-1 w-full max-w-[98vw] mx-auto px-2 sm:px-4 py-4 sm:py-6 flex flex-col items-center">
        {/* Toggle switch limpio */}
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
          {simpleMode ? (
            <GanttTableSimpleEditor 
              rows={rows} 
              setRows={setRows} 
              onExport={handleExport}
            />
          ) : (
            <GanttTableTimeline
              rows={rows}
              setRows={setRows}
              exporting={exporting}
              setExporting={setExporting}
            />
          )}
        </div>

        {/* Botón de exportar solo en Timeline */}
        {!simpleMode && (
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
    </div>
  );
}

export default App;
