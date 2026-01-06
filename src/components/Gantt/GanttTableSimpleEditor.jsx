import React, { useState } from "react";

// Colores predefinidos
const PRESET_COLORS = [
  "#3b82f6", "#22c55e", "#eab308", "#f97316", 
  "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899",
];

// Función para unificar barras contiguas del mismo color
function mergeBars(bars) {
  if (!bars || bars.length === 0) return [];
  const sorted = [...bars].sort((a, b) => a.start - b.start);
  const merged = [];
  for (const bar of sorted) {
    const last = merged[merged.length - 1];
    if (last && last.end + 1 === bar.start && last.color === bar.color) {
      last.end = bar.end;
    } else {
      merged.push({ ...bar });
    }
  }
  return merged;
}

// Función para validar que no hay intersecciones
function hasIntersection(bars, newBar, excludeIdx = -1) {
  for (let i = 0; i < bars.length; i++) {
    if (i === excludeIdx) continue;
    const bar = bars[i];
    if (!(newBar.end < bar.start || newBar.start > bar.end)) {
      return true;
    }
  }
  return false;
}

export default function GanttTableSimpleEditor({ rows, setRows, onExport }) {
  const [editingBar, setEditingBar] = useState(null);
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formColor, setFormColor] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [creatingRowIdx, setCreatingRowIdx] = useState(null);

  const handleRowChange = (idx, field, value) => {
    // Convertir texto a mayúsculas automáticamente
    const upperValue = typeof value === 'string' ? value.toUpperCase() : value;
    setRows(rows => rows.map((row, i) =>
      i === idx ? { ...row, [field]: upperValue } : row
    ));
  };

  const addBar = (rowIdx) => {
    const sortedBars = [...rows[rowIdx].bars].sort((a, b) => a.start - b.start);
    let nextStart = 0;
    for (const bar of sortedBars) {
      if (nextStart < bar.start) break;
      nextStart = bar.end + 1;
    }
    setCreatingRowIdx(rowIdx);
    setFormStart(String(nextStart + 1));
    setFormEnd(String(nextStart + 1));
    setFormColor(PRESET_COLORS[0]);
    setErrorMsg("");
  };

  const removeBar = (rowIdx, barIdx) => {
    setRows(rows => rows.map((row, i) =>
      i === rowIdx ? { ...row, bars: row.bars.filter((_, j) => j !== barIdx) } : row
    ));
  };

  const openBarEditor = (rowIdx, barIdx) => {
    const bar = rows[rowIdx].bars[barIdx];
    setEditingBar({ rowIdx, barIdx });
    setFormStart(String(bar.start + 1));
    setFormEnd(String(bar.end + 1));
    setFormColor(bar.color || PRESET_COLORS[0]);
    setErrorMsg("");
  };

  const closeBarEditor = () => {
    setEditingBar(null);
    setCreatingRowIdx(null);
    setFormStart("");
    setFormEnd("");
    setFormColor("");
    setErrorMsg("");
  };

  const saveBarChanges = () => {
    const start = parseInt(formStart, 10);
    const end = parseInt(formEnd, 10);

    if (isNaN(start) || isNaN(end)) {
      setErrorMsg("Los números no son válidos");
      return;
    }

    if (start < 1 || end < 1) {
      setErrorMsg("Los números deben ser mayores a 0");
      return;
    }

    if (start > end) {
      setErrorMsg("La fecha inicio no puede ser mayor que la fecha fin");
      return;
    }

    if (creatingRowIdx !== null) {
      // Crear nuevo hito
      setRows(rows => rows.map((row, i) => {
        if (i !== creatingRowIdx) return row;
        
        const newBar = { start: start - 1, end: end - 1, color: formColor };
        let newBars = [...row.bars, newBar];
        
        if (hasIntersection(newBars, newBar, newBars.length - 1)) {
          setErrorMsg("Este rango se superpone con otro hito");
          return row;
        }
        
        newBars = mergeBars(newBars);
        closeBarEditor();
        return { ...row, bars: newBars };
      }));
    } else {
      // Editar hito existente
      const { rowIdx, barIdx } = editingBar;
      setRows(rows => rows.map((row, i) => {
        if (i !== rowIdx) return row;
        
        const newBars = row.bars.map((bar, j) => {
          if (j !== barIdx) return bar;
          return { ...bar, start: start - 1, end: end - 1, color: formColor };
        });

        const editedBar = newBars[barIdx];
        
        // Validar intersecciones
        if (hasIntersection(newBars, editedBar, barIdx)) {
          setErrorMsg("Este rango se superpone con otro hito");
          return row;
        }

        const mergedBars = mergeBars(newBars);
        closeBarEditor();
        return { ...row, bars: mergedBars };
      }));
    }
  };

  const addRow = () => {
    setRows([...rows, { phase: "", profile: "", bars: [] }]);
  };

  const removeRow = (idx) => {
    if (rows.length <= 1) return;
    setRows(rows => rows.filter((_, i) => i !== idx));
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2">
      {/* Lista de tareas como cards para móvil */}
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div 
            key={i} 
            className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
          >
            {/* Header de la tarea */}
            <div className="bg-purple-600 px-3 py-2 flex items-center justify-between">
              <span className="text-white text-xs font-medium">Tarea {i + 1}</span>
              <button
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
                className="p-1 text-white hover:text-red-200 opacity-100 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                title="Eliminar tarea"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contenido */}
            <div className="p-3 space-y-2">
              {/* Fase y Perfil */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 block mb-1">Fase</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded px-2 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none flex-1 flex items-center"
                    value={row.phase}
                    onChange={e => handleRowChange(i, "phase", e.target.value)}
                    placeholder="Nombre"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 block mb-1">Perfil</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded px-2 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none flex-1 flex items-center"
                    value={row.profile}
                    onChange={e => handleRowChange(i, "profile", e.target.value)}
                    placeholder="Perfil"
                  />
                </div>
              </div>
              
              {/* Hitos */}
              <div>
                <label className="text-xs text-gray-500 block mb-2">Hitos</label>
                <div className="space-y-1.5">
                  {row.bars && row.bars.map((bar, barIdx) => (
                    <div
                      key={barIdx}
                      className="w-full flex items-center gap-2 rounded p-2 border transition-colors cursor-pointer hover:bg-opacity-50"
                      style={{ borderColor: bar.color || '#3b82f6', background: `${bar.color || '#3b82f6'}10` }}
                      onClick={() => openBarEditor(i, barIdx)}
                    >
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ background: bar.color || '#3b82f6' }}
                      />
                      <div className="flex-1 flex items-center text-left">
                        <span className="text-xs font-medium text-gray-700">
                          {bar.start + 1} a {bar.end + 1}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBar(i, barIdx);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar hito"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addBar(i)}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-2 text-xs text-purple-600 rounded border border-dashed border-purple-300 hover:bg-purple-50 transition-colors font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Hito
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button
          onClick={addRow}
          className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium shadow flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir Tarea
        </button>
        <button
          onClick={onExport}
          className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar PNG
        </button>
      </div>
      
      <p className="text-center text-xs text-gray-400 mt-3">
        Los hitos contiguos del mismo color se unen automáticamente
      </p>

      {/* Modal de edición/creación de hito */}
      {(editingBar || creatingRowIdx !== null) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-xs">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              {creatingRowIdx !== null ? "Crear Hito" : "Editar Hito"}
            </h3>
            
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Fecha Inicio</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm bg-white focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
                  value={formStart}
                  onChange={e => setFormStart(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Fecha Fin</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm bg-white focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
                  value={formEnd}
                  onChange={e => setFormEnd(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-2">Color</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormColor(color)}
                      className={`w-6 h-6 rounded-full transition-all ${formColor === color ? 'ring-2 ring-offset-1 ring-purple-400 scale-110' : ''}`}
                      style={{ background: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formColor}
                    onChange={e => setFormColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-gray-300"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded p-2 mb-4">
                <p className="text-xs text-red-700 font-medium">{errorMsg}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={closeBarEditor}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveBarChanges}
                className="flex-1 px-3 py-2 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
              >
                {creatingRowIdx !== null ? "Crear" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
