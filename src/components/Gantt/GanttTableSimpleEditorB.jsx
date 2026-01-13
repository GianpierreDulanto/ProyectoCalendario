import React, { useState } from "react";

// Colores predefinidos
const PRESET_COLORS = [
  "#3b82f6", "#22c55e", "#eab308", "#f97316", 
  "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899",
];

// Emojis/marcadores predefinidos
const PRESET_EMOJIS = [
  "✓", "✗", "→", "←", "↑", "↓", 
  "⬤", "◆", "★", "◾", "●", "◐", 
  "☑", "☐", "☒", "⊙"
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

export default function GanttTableSimpleEditorB({ rows, setRows, onExport }) {
  const [editingBar, setEditingBar] = useState(null);
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formEmoji, setFormEmoji] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [creatingBar, setCreatingBar] = useState(null);
  const [expandedEtapa, setExpandedEtapa] = useState(0);
  const [expandedEntregable, setExpandedEntregable] = useState({});

  const handleEtapaChange = (idx, value) => {
    const upperValue = typeof value === 'string' ? value.toUpperCase() : value;
    setRows(rows => rows.map((row, i) =>
      i === idx ? { ...row, etapa: upperValue } : row
    ));
  };

  const handleEntregableChange = (etapaIdx, entIdx, value) => {
    const upperValue = typeof value === 'string' ? value.toUpperCase() : value;
    setRows(rows => rows.map((etapa, ei) => {
      if (ei !== etapaIdx) return etapa;
      return {
        ...etapa,
        entregables: etapa.entregables.map((ent, ej) =>
          ej === entIdx ? { ...ent, nombre: upperValue } : ent
        )
      };
    }));
  };

  const addBar = (etapaIdx, entIdx) => {
    const bars = rows[etapaIdx].entregables[entIdx].bars;
    const sortedBars = [...bars].sort((a, b) => a.start - b.start);
    let nextStart = 0;
    for (const bar of sortedBars) {
      if (nextStart < bar.start) break;
      nextStart = bar.end + 1;
    }
    
    setCreatingBar({ etapaIdx, entIdx });
    setFormStart(String(nextStart + 1));
    setFormEnd(String(nextStart + 1));
    setFormColor(PRESET_COLORS[0]);
    setFormEmoji(PRESET_EMOJIS[0]);
    setErrorMsg("");
  };

  const removeBar = (etapaIdx, entIdx, barIdx) => {
    setRows(rows => rows.map((etapa, ei) => {
      if (ei !== etapaIdx) return etapa;
      return {
        ...etapa,
        entregables: etapa.entregables.map((ent, ej) =>
          ej === entIdx
            ? { ...ent, bars: ent.bars.filter((_, j) => j !== barIdx) }
            : ent
        )
      };
    }));
  };

  const openBarEditor = (etapaIdx, entIdx, barIdx) => {
    const bar = rows[etapaIdx].entregables[entIdx].bars[barIdx];
    setEditingBar({ etapaIdx, entIdx, barIdx });
    setFormStart(String(bar.start + 1));
    setFormEnd(String(bar.end + 1));
    setFormColor(bar.color || PRESET_COLORS[0]);
    setFormEmoji(bar.emoji || PRESET_EMOJIS[0]);
    setErrorMsg("");
  };

  const closeBarEditor = () => {
    setEditingBar(null);
    setCreatingBar(null);
    setFormStart("");
    setFormEnd("");
    setFormColor("");
    setFormEmoji("");
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

    if (creatingBar) {
      // Crear nuevo hito
      const { etapaIdx, entIdx } = creatingBar;
      setRows(rows => rows.map((etapa, ei) => {
        if (ei !== etapaIdx) return etapa;
        return {
          ...etapa,
          entregables: etapa.entregables.map((ent, ej) => {
            if (ej !== entIdx) return ent;
            
            const newBar = { start: start - 1, end: end - 1, color: formColor, emoji: formEmoji };
            let newBars = [...ent.bars, newBar];
            
            if (hasIntersection(newBars, newBar, newBars.length - 1)) {
              setErrorMsg("Este rango se superpone con otro hito");
              return ent;
            }
            
            newBars = mergeBars(newBars);
            closeBarEditor();
            return { ...ent, bars: newBars };
          })
        };
      }));
    } else {
      // Editar hito existente
      const { etapaIdx, entIdx, barIdx } = editingBar;
      setRows(rows => rows.map((etapa, ei) => {
        if (ei !== etapaIdx) return etapa;
        return {
          ...etapa,
          entregables: etapa.entregables.map((ent, ej) => {
            if (ej !== entIdx) return ent;
            
            const newBars = ent.bars.map((bar, j) => {
              if (j !== barIdx) return bar;
              return { ...bar, start: start - 1, end: end - 1, color: formColor, emoji: formEmoji };
            });

            const editedBar = newBars[barIdx];
            
            if (hasIntersection(newBars, editedBar, barIdx)) {
              setErrorMsg("Este rango se superpone con otro hito");
              return ent;
            }

            const mergedBars = mergeBars(newBars);
            closeBarEditor();
            return { ...ent, bars: mergedBars };
          })
        };
      }));
    }
  };

  const addEtapa = () => {
    setRows([...rows, { etapa: "", entregables: [{ nombre: "", bars: [] }] }]);
  };

  const removeEtapa = (idx) => {
    if (rows.length <= 1) return;
    setRows(rows => rows.filter((_, i) => i !== idx));
  };

  const addEntregable = (etapaIdx) => {
    setRows(rows => rows.map((etapa, ei) => {
      if (ei !== etapaIdx) return etapa;
      return {
        ...etapa,
        entregables: [...etapa.entregables, { nombre: "", bars: [] }]
      };
    }));
  };

  const removeEntregable = (etapaIdx, entIdx) => {
    setRows(rows => rows.map((etapa, ei) => {
      if (ei !== etapaIdx) return etapa;
      if (etapa.entregables.length <= 1) return etapa;
      return {
        ...etapa,
        entregables: etapa.entregables.filter((_, j) => j !== entIdx)
      };
    }));
  };

  const toggleEtapa = (etapaIdx) => {
    setExpandedEtapa(expandedEtapa === etapaIdx ? -1 : etapaIdx);
  };

  const toggleEntregable = (etapaIdx, entIdx) => {
    const key = `${etapaIdx}-${entIdx}`;
    setExpandedEntregable(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-2">
      <div className="space-y-2 max-h-[70vh] overflow-y-auto">
        {rows.map((etapa, etapaIdx) => {
          const entregables = etapa.entregables || [];
          const isEtapaExpanded = expandedEtapa === etapaIdx;

          return (
            <div key={etapaIdx} className="border-l-4 border-purple-600 bg-white rounded-lg shadow overflow-hidden">
              {/* ETAPA HEADER */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleEtapa(etapaIdx)}
                  className="flex-1 p-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white flex items-center justify-start gap-3 hover:from-purple-700 hover:to-purple-800 transition text-left"
                >
                  <span className="text-2xl flex-shrink-0">{isEtapaExpanded ? '▼' : '▶'}</span>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-xs opacity-75">ETAPA {etapaIdx + 1}</span>
                    <input
                      type="text"
                      placeholder="Nombre de Etapa"
                      value={etapa.etapa}
                      onChange={(e) => handleEtapaChange(etapaIdx, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent text-lg font-bold placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1 w-full"
                    />
                  </div>
                </button>
                {rows.length > 1 && (
                  <button
                    onClick={() => removeEtapa(etapaIdx)}
                    className="p-3 text-white hover:bg-red-500 rounded-r transition flex-shrink-0"
                    title="Eliminar Etapa"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* ENTREGABLES CONTAINER */}
              {isEtapaExpanded && (
                <div className="p-4 space-y-3 bg-gray-50">
                  {entregables.map((entregable, entIdx) => {
                    const isEntregableExpanded = expandedEntregable[`${etapaIdx}-${entIdx}`];

                    return (
                      <div key={entIdx} className="bg-white rounded-lg border-2 border-blue-300 overflow-hidden">
                        {/* ENTREGABLE HEADER */}
                        <div className="flex items-center justify-between bg-blue-100">
                          <button
                            onClick={() => toggleEntregable(etapaIdx, entIdx)}
                            className="flex-1 p-3 text-blue-900 flex items-center justify-start gap-3 hover:bg-blue-200 transition font-medium text-left"
                          >
                            <span className="text-lg flex-shrink-0">{isEntregableExpanded ? '▼' : '▶'}</span>
                            <input
                              type="text"
                              placeholder="Nombre de Entregable"
                              value={entregable.nombre}
                              onChange={(e) => handleEntregableChange(etapaIdx, entIdx, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1 font-medium flex-1"
                            />
                          </button>
                          {entregables.length > 1 && (
                            <button
                              onClick={() => removeEntregable(etapaIdx, entIdx)}
                              className="p-2 text-red-600 hover:text-red-800 transition flex-shrink-0"
                              title="Eliminar Entregable"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* HITOS/BARRAS CONTAINER */}
                        {isEntregableExpanded && (
                          <div className="p-3 space-y-2 bg-white">
                            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hitos/Barras:</div>
                            
                            <div className="space-y-2">
                              {(entregable.bars || []).map((bar, barIdx) => (
                                <div
                                  key={barIdx}
                                  className="flex items-center gap-3 p-3 rounded-lg border-l-4 transition-all cursor-pointer hover:shadow-md"
                                  style={{ borderColor: bar.color || '#3b82f6', background: `${bar.color || '#3b82f6'}08` }}
                                  onClick={() => openBarEditor(etapaIdx, entIdx, barIdx)}
                                >
                                  <div 
                                    className="w-5 h-5 rounded-full flex-shrink-0"
                                    style={{ background: bar.color || '#3b82f6' }}
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold text-gray-800">
                                      Día {bar.start + 1} a {bar.end + 1}
                                    </div>
                                    {bar.emoji && <div className="text-lg">{bar.emoji}</div>}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeBar(etapaIdx, entIdx, barIdx);
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500 transition"
                                    title="Eliminar Hito"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}

                              <button
                                onClick={() => addBar(etapaIdx, entIdx)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-blue-600 rounded-lg border-2 border-dashed border-blue-300 hover:bg-blue-50 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Agregar Hito
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* ADD ENTREGABLE BUTTON */}
                  <button
                    onClick={() => addEntregable(etapaIdx)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg border-2 border-dashed border-purple-300 hover:bg-purple-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Entregable
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button
          onClick={addEtapa}
          className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium shadow flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Etapa
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

      {/* MODAL DE EDICIÓN/CREACIÓN DE HITO */}
      {(editingBar || creatingBar) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              {creatingBar ? "Crear Hito" : "Editar Hito"}
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
              <div>
                <label className="text-xs text-gray-600 block mb-2">Emoji/Marcador</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setFormEmoji(emoji)}
                      className={`w-8 h-8 rounded transition-all flex items-center justify-center text-lg ${formEmoji === emoji ? 'ring-2 ring-purple-400 bg-purple-100 scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">O ingresa un carácter personalizado:</label>
                  <input
                    type="text"
                    maxLength="1"
                    placeholder="A, 1, *, etc"
                    value={formEmoji}
                    onChange={(e) => {
                      const char = e.target.value.slice(0, 1);
                      setFormEmoji(char);
                    }}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center font-medium bg-white focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
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
                {creatingBar ? "Crear" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
