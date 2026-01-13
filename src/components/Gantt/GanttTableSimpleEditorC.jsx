import React, { useState } from "react";

// Colores predefinidos
const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#f97316", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

// Feriados nacionales de Perú para sector privado (2024-2026)
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

function mergeBars(bars) {
  if (!bars || bars.length === 0) return [];
  const sorted = [...bars].sort((a, b) => a.start - b.start);
  const merged = [];
  for (const bar of sorted) {
    const last = merged[merged.length - 1];
    if (last && last.end + 1 === bar.start && last.color === bar.color) {
      last.end = bar.end;
      if (!last.emoji && bar.emoji) {
        last.emoji = bar.emoji;
      }
    } else {
      merged.push({ ...bar });
    }
  }
  return merged;
}

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

export default function GanttTableSimpleEditorC({ rows, setRows, onExport }) {
  const [editingBar, setEditingBar] = useState(null);
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formEmoji, setFormEmoji] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [creatingBar, setCreatingBar] = useState(null);
  const [expandedEtapa, setExpandedEtapa] = useState(0);
  const [expandedEntregable, setExpandedEntregable] = useState({});
  const [createHitoModal, setCreateHitoModal] = useState(false);
  const [hitoForm, setHitoForm] = useState({ etapaIdx: 0, entregableIdx: 0, startDate: '', duration: 5 });

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

  const countBusinessDays = (startDateStr, numDays) => {
    const start = parseDate(startDateStr);
    const businessDays = [];
    let current = new Date(start);
    let count = 0;
    
    while (count < numDays) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !PERU_HOLIDAYS.includes(dateStr)) {
        businessDays.push(new Date(current));
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return businessDays;
  };

  const createHitoWithBusinessDays = () => {
    const { etapaIdx, entIdx, startDate: formStartDate, duration } = hitoForm;
    
    if (!formStartDate || duration < 1) {
      setErrorMsg('Por favor completa los datos del hito');
      return;
    }

    const businessDays = countBusinessDays(formStartDate, duration);
    
    if (businessDays.length === 0) {
      setErrorMsg('No hay días hábiles disponibles para esta duración');
      return;
    }

    // Calcular índices relativos (empezamos desde día 1)
    const barStart = 1;
    const barEnd = businessDays.length;

    const newBar = {
      start: barStart,
      end: barEnd,
      color: COLORS[0],
      emoji: "✓"
    };

    setRows(rows => rows.map((etapa, ei) => {
      if (ei !== etapaIdx) return etapa;
      return {
        ...etapa,
        entregables: etapa.entregables.map((ent, ej) =>
          ej === entIdx
            ? { ...ent, bars: [...(ent.bars || []), newBar] }
            : ent
        )
      };
    }));

    setCreateHitoModal(false);
    setHitoForm({ etapaIdx: 0, entregableIdx: 0, startDate: '', duration: 5 });
    setErrorMsg('');
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
    setFormColor(COLORS[0]);
    setFormEmoji("✓");
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
    setFormColor(bar.color || COLORS[0]);
    setFormEmoji(bar.emoji || "✓");
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
      const { etapaIdx, entIdx } = creatingBar;
      const newBar = { start: start - 1, end: end - 1, color: formColor, emoji: formEmoji };
      
      if (hasIntersection(rows[etapaIdx].entregables[entIdx].bars, newBar)) {
        setErrorMsg("Los hitos no pueden solaparse");
        return;
      }

      setRows(rows => rows.map((etapa, ei) => {
        if (ei !== etapaIdx) return etapa;
        return {
          ...etapa,
          entregables: etapa.entregables.map((ent, ej) =>
            ej === entIdx
              ? { ...ent, bars: [...ent.bars, newBar] }
              : ent
          )
        };
      }));
    } else {
      const { etapaIdx, entIdx, barIdx } = editingBar;
      const updatedBar = { start: start - 1, end: end - 1, color: formColor, emoji: formEmoji };
      
      if (hasIntersection(rows[etapaIdx].entregables[entIdx].bars, updatedBar, barIdx)) {
        setErrorMsg("Los hitos no pueden solaparse");
        return;
      }

      setRows(rows => rows.map((etapa, ei) => {
        if (ei !== etapaIdx) return etapa;
        return {
          ...etapa,
          entregables: etapa.entregables.map((ent, ej) =>
            ej === entIdx
              ? { ...ent, bars: ent.bars.map((bar, bj) => bj === barIdx ? updatedBar : bar) }
              : ent
          )
        };
      }));
    }

    closeBarEditor();
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

              {isEtapaExpanded && (
                <div className="p-4 space-y-3 bg-gray-50">
                  {entregables.map((entregable, entIdx) => {
                    const isEntregableExpanded = expandedEntregable[`${etapaIdx}-${entIdx}`];
                    const mergedBars = mergeBars(entregable.bars);

                    return (
                      <div key={entIdx} className="bg-white rounded-lg border border-gray-200">
                        <button
                          onClick={() => toggleEntregable(etapaIdx, entIdx)}
                          className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition text-left"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-lg flex-shrink-0">{isEntregableExpanded ? '▼' : '▶'}</span>
                            <input
                              type="text"
                              placeholder="Nombre de Entregable"
                              value={entregable.nombre}
                              onChange={(e) => handleEntregableChange(etapaIdx, entIdx, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 bg-transparent font-medium placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded px-2 py-1"
                            />
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addBar(etapaIdx, entIdx);
                              }}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded transition text-sm"
                              title="Agregar Hito"
                            >
                              ➕
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setHitoForm({ etapaIdx, entregableIdx: entIdx, startDate: '', duration: 5 });
                                setCreateHitoModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition text-sm"
                              title="Crear Hito con Días Hábiles"
                            >
                              📅
                            </button>
                            {entregables.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeEntregable(etapaIdx, entIdx);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                                title="Eliminar Entregable"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </button>

                        {isEntregableExpanded && (
                          <div className="border-t border-gray-200 p-3 space-y-2 bg-gray-50">
                            {mergedBars.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">Sin hitos</p>
                            ) : (
                              mergedBars.map((bar, barIdx) => (
                                <div key={barIdx} className="flex items-center justify-between p-2 rounded bg-white border border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded"
                                      style={{ background: bar.color }}
                                    />
                                    <span className="text-sm font-medium">
                                      {bar.start + 1} - {bar.end + 1}
                                    </span>
                                    {bar.emoji && (
                                      <span className="text-lg">{bar.emoji}</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => openBarEditor(etapaIdx, entIdx, entregable.bars.findIndex(b => b.start === bar.start && b.end === bar.end))}
                                    className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => removeBar(etapaIdx, entIdx, entregable.bars.findIndex(b => b.start === bar.start && b.end === bar.end))}
                                    className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

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
                  {COLORS.map((color) => (
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
                  {["✓", "✗", "→", "←", "↑", "↓", "⬤", "◆", "★", "◾", "●", "◐"].map((emoji) => (
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

      {createHitoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Crear Hito con Días Hábiles</h3>
            
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Entregable</label>
                <input
                  type="text"
                  disabled
                  value={rows[hitoForm.etapaIdx]?.entregables[hitoForm.entregableIdx]?.nombre || ''}
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Fecha de Inicio</label>
                <input
                  type="date"
                  value={hitoForm.startDate}
                  onChange={(e) => setHitoForm({ ...hitoForm, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Duración (días hábiles)</label>
                <input
                  type="number"
                  min="1"
                  value={hitoForm.duration}
                  onChange={(e) => setHitoForm({ ...hitoForm, duration: parseInt(e.target.value) || 1 })}
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
                />
                <p className="text-xs text-gray-500 mt-1">Se contarán solo lunes a viernes (sin sábados, domingos ni feriados)</p>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded p-2 mb-4">
                <p className="text-xs text-red-700 font-medium">{errorMsg}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCreateHitoModal(false);
                  setErrorMsg('');
                  setHitoForm({ etapaIdx: 0, entregableIdx: 0, startDate: '', duration: 5 });
                }}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createHitoWithBusinessDays}
                className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
