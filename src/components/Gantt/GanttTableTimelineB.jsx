import { toPng } from 'html-to-image';
import React, { useState, useEffect, useRef, useMemo } from "react";
import EmojiPickerModal from '../EmojiPickerModal';

const INITIAL_DAYS = 47;

// Colores predefinidos para seleccionar
const PRESET_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#eab308", // yellow
  "#f97316", // orange
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
];

function GanttTableTimelineB({ rows, setRows, exporting, setExporting }) {
  const exportAreaRef = useRef();
  const [dragInfo, setDragInfo] = useState(null);
  const [activeColor, setActiveColor] = useState(PRESET_COLORS[0]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState(null);
  const [emojiPickerTarget, setEmojiPickerTarget] = useState(null); // { etapaIdx, entregableIdx, barIdx }
  const resizeHandlersRef = useRef({ move: null, end: null });
  const longPressTimeoutRef = useRef(null);
  const longPressTargetRef = useRef(null);

  // Calcular días basado en barras
  const numDays = useMemo(() => {
    let maxDay = -1;
    rows.forEach(etapa => {
      etapa.entregables?.forEach(entregable => {
        entregable.bars?.forEach(bar => {
          if (bar.end > maxDay) maxDay = bar.end;
        });
      });
    });
    return Math.max(maxDay >= 0 ? maxDay + 3 : 30, 30);
  }, [rows]);

  const numDaysExport = useMemo(() => {
    let maxDay = -1;
    rows.forEach(etapa => {
      etapa.entregables?.forEach(entregable => {
        entregable.bars?.forEach(bar => {
          if (bar.end > maxDay) maxDay = bar.end;
        });
      });
    });
    return maxDay >= 0 ? maxDay + 3 : 30;
  }, [rows]);

  // Función para unir barras contiguas del mismo color
  const getMergedBars = (bars) => {
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
        merged.push({ 
          start: bar.start, 
          end: bar.end, 
          color: bar.color,
          emoji: bar.emoji || null
        });
      }
    }
    
    return merged;
  };

  // Exportar a PNG
  useEffect(() => {
    if (!exporting) return;

    const handleExportPNG = async () => {
      setExporting(true);
      await new Promise(r => setTimeout(r, 500));
      
      const tableDiv = exportAreaRef.current;
      if (!tableDiv) return;
      
      try {
        const dataUrl = await toPng(tableDiv, {
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          quality: 1,
          skipFonts: true,
          cacheBust: true,
        });
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `calendario_${Date.now()}.png`;
        link.click();
      } finally {
        setExporting(false);
      }
    };
    handleExportPNG();
  }, [exporting, setExporting]);

  const addEtapa = () => {
    setRows([...rows, { etapa: "", entregables: [{ nombre: "", bars: [] }] }]);
  };

  const addEntregable = (etapaIdx) => {
    setRows(rows => rows.map((etapa, i) =>
      i === etapaIdx 
        ? { ...etapa, entregables: [...(etapa.entregables || []), { nombre: "", bars: [] }] }
        : etapa
    ));
  };

  const handleEtapaChange = (idx, value) => {
    const upperValue = typeof value === 'string' ? value.toUpperCase() : value;
    setRows(rows => rows.map((etapa, i) =>
      i === idx ? { ...etapa, etapa: upperValue } : etapa
    ));
  };

  const handleEntregableChange = (etapaIdx, entregableIdx, value) => {
    const upperValue = typeof value === 'string' ? value.toUpperCase() : value;
    setRows(rows => rows.map((etapa, i) =>
      i === etapaIdx 
        ? {
            ...etapa,
            entregables: etapa.entregables.map((ent, j) =>
              j === entregableIdx ? { ...ent, nombre: upperValue } : ent
            )
          }
        : etapa
    ));
  };

  const handleCellMouseDown = (etapaIdx, entregableIdx, dayIdx) => {
    setDragInfo({ etapaIdx, entregableIdx, startDay: dayIdx, endDay: dayIdx });
  };

  const handleCellMouseEnter = (etapaIdx, entregableIdx, dayIdx) => {
    if (dragInfo && dragInfo.etapaIdx === etapaIdx && dragInfo.entregableIdx === entregableIdx) {
      setDragInfo({ ...dragInfo, endDay: dayIdx });
    }
  };

  useEffect(() => {
    if (!dragInfo) return;
    const handleMouseUp = () => {
      const { etapaIdx, entregableIdx, startDay, endDay } = dragInfo;
      if (startDay !== undefined && endDay !== undefined) {
        const start = Math.min(startDay, endDay);
        const end = Math.max(startDay, endDay);
        if (end >= start) {
          const entregable = rows[etapaIdx]?.entregables?.[entregableIdx];
          const overlap = entregable?.bars?.some(bar => !(end < bar.start || start > bar.end));
          if (!overlap) {
            setRows(rows => rows.map((etapa, ei) => {
              if (ei !== etapaIdx) return etapa;
              return {
                ...etapa,
                entregables: etapa.entregables.map((ent, ej) => {
                  if (ej !== entregableIdx) return ent;
                  let newBars = [...(ent.bars || []), { start, end, color: activeColor }];
                  newBars = getMergedBars(newBars);
                  return { ...ent, bars: newBars };
                })
              };
            }));
          }
        }
      }
      setDragInfo(null);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [dragInfo, rows, setRows, activeColor]);

  const handleBarResizeStart = (e, etapaIdx, entregableIdx, barIdx, side) => {
    e.stopPropagation();
    
    const moveHandler = (ev) => handleBarResizeMove(ev, etapaIdx, entregableIdx, barIdx, side);
    const endHandler = () => {
      window.removeEventListener('mousemove', resizeHandlersRef.current.move);
      window.removeEventListener('mouseup', resizeHandlersRef.current.end);
      resizeHandlersRef.current = { move: null, end: null };
    };
    
    resizeHandlersRef.current = { move: moveHandler, end: endHandler };
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', endHandler);
  };

  const handleBarResizeMove = (e, etapaIdx, entregableIdx, barIdx, side) => {
    const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest('td');
    if (!cell) return;
    const cellIdx = cell.cellIndex - 2;
    if (cellIdx < 0) return;
    setRows(rows => rows.map((etapa, ei) => {
      if (ei !== etapaIdx) return etapa;
      return {
        ...etapa,
        entregables: etapa.entregables.map((ent, ej) => {
          if (ej !== entregableIdx) return ent;
          return {
            ...ent,
            bars: ent.bars.map((bar, j) => {
              if (j !== barIdx) return bar;
              let newStart = bar.start;
              let newEnd = bar.end;
              if (side === 'left') {
                newStart = Math.min(cellIdx, bar.end);
                if (ent.bars.some((b, idx) => idx !== barIdx && newStart <= b.end && newStart >= b.start)) return bar;
              } else {
                newEnd = Math.max(cellIdx, bar.start);
                if (ent.bars.some((b, idx) => idx !== barIdx && newEnd <= b.end && newEnd >= b.start)) return bar;
              }
              return { ...bar, start: newStart, end: newEnd };
            })
          };
        })
      };
    }));
  };

  const handleBarEmojiChange = (etapaIdx, entregableIdx, barIdx, emoji) => {
    setRows(rows => rows.map((etapa, ei) => {
      if (ei !== etapaIdx) return etapa;
      return {
        ...etapa,
        entregables: etapa.entregables.map((ent, ej) => {
          if (ej !== entregableIdx) return ent;
          return {
            ...ent,
            bars: ent.bars.map((bar, j) => j === barIdx ? { ...bar, emoji } : bar)
          };
        })
      };
    }));
  };

  const deleteBar = (etapaIdx, entregableIdx, barIdx) => {
    setRows(rows => rows.map((etapa, ei) =>
      ei === etapaIdx
        ? {
            ...etapa,
            entregables: etapa.entregables.map((ent, ej) =>
              ej === entregableIdx
                ? { ...ent, bars: ent.bars.filter((_, j) => j !== barIdx) }
                : ent
            )
          }
        : etapa
    ));
  };

  const handleCellTouchStart = (etapaIdx, entregableIdx, barIdx) => {
    longPressTargetRef.current = { etapaIdx, entregableIdx, barIdx };
    longPressTimeoutRef.current = setTimeout(() => {
      if (barIdx !== -1) {
        deleteBar(etapaIdx, entregableIdx, barIdx);
        longPressTargetRef.current = null;
      }
    }, 500);
  };

  const handleCellTouchEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    longPressTargetRef.current = null;
  };

  const deleteEntregable = (etapaIdx, entregableIdx) => {
    setRows(rows => rows.map((etapa, ei) =>
      ei === etapaIdx
        ? {
            ...etapa,
            entregables: etapa.entregables.filter((_, j) => j !== entregableIdx)
          }
        : etapa
    ));
  };

  const deleteEtapa = (idx) => {
    if (rows.length <= 1) return;
    setRows(rows => rows.filter((_, i) => i !== idx));
  };

  const headerBg = "#7c3aed";
  const headerBgLight = "#a78bfa";

  // MODO EXPORTACIÓN
  if (exporting) {
    return (
      <div style={{ display: 'inline-block' }}>
        <div
          ref={exportAreaRef}
          id="calendario-export-area"
          style={{ 
            background: 'white', 
            padding: '10px',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ height: '28px' }}>
                <th style={{
                  background: headerBg,
                  color: '#fff',
                  padding: '4px 8px',
                  textAlign: 'left',
                  fontSize: 12,
                  fontWeight: 600,
                  minWidth: 150,
                  borderRight: '1px solid #9333ea',
                  verticalAlign: 'middle',
                }}>
                  Etapa
                </th>
                <th style={{
                  background: headerBg,
                  color: '#fff',
                  padding: '4px 8px',
                  textAlign: 'left',
                  fontSize: 12,
                  fontWeight: 600,
                  minWidth: 200,
                  borderRight: '1px solid #9333ea',
                  verticalAlign: 'middle',
                }}>
                  Lista de Entregables
                </th>
                {Array.from({ length: numDaysExport }, (_, idx) => (
                  <th key={idx} style={{
                    background: headerBgLight,
                    color: '#fff',
                    padding: '4px 0',
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    width: 22,
                    verticalAlign: 'middle',
                  }}>
                    {idx + 1}
                  </th>
                ))}
              </tr>
            </thead>
            {rows.map((etapa, etapaIdx) => {
              const entregables = etapa.entregables || [];
              const etapaBg = etapaIdx % 2 === 0 ? '#ffffff' : '#faf5ff';

              const isPair = entregables.length % 2 === 0;
              const showEtapaAtIdx = isPair ? Math.floor(entregables.length / 2) - 1 : Math.floor(entregables.length / 2);
              
              return (
                <tbody key={etapaIdx}>
                  {entregables.map((entregable, entregableIdx) => {
                    const mergedBars = getMergedBars(entregable.bars);
                    const isLastEntregable = entregableIdx === entregables.length - 1;
                    
                    return (
                      <tr key={`${etapaIdx}-${entregableIdx}`} style={{ background: etapaBg, height: '24px' }}>
                        <td style={{
                          background: etapaBg,
                          padding: '4px 8px',
                          borderBottom: isLastEntregable ? '1px solid #a855f7' : 'none',
                          borderRight: '1px solid #e5e7eb',
                          verticalAlign: 'middle',
                          textAlign: 'left',
                          minWidth: 150,
                          fontSize: '12px',
                          color: '#000000',
                          lineHeight: '24px',
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        }}>
                          {entregableIdx === showEtapaAtIdx ? (etapa.etapa || '') : ''}
                        </td>
                        <td style={{
                          background: etapaBg,
                          padding: '4px 8px',
                          fontSize: 11,
                          color: '#000000',
                          borderBottom: isLastEntregable ? '1px solid #a855f7' : '1px solid #e5e7eb',
                          borderRight: '1px solid #e5e7eb',
                          verticalAlign: 'middle',
                          textAlign: 'left',
                          minWidth: 200,
                          lineHeight: '24px',
                        }}>
                          {entregable.nombre?.toUpperCase() || '-'}
                        </td>
                        {Array.from({ length: numDaysExport }, (_, d) => {
                          const barHere = mergedBars.find(bar => d >= bar.start && d <= bar.end);
                          const isBarStart = barHere && d === barHere.start;
                          const isBarEnd = barHere && d === barHere.end;
                          
                          return (
                            <td key={`cell-${d}`} style={{
                              padding: 0,
                              width: 22,
                              height: 24,
                              background: etapaBg,
                              borderBottom: isLastEntregable ? '1px solid #a855f7' : '1px solid #e5e7eb',
                              position: 'relative',
                            }}>
                              {barHere && (
                                <div style={{
                                  position: 'absolute',
                                  top: 4,
                                  bottom: 4,
                                  left: isBarStart ? 2 : 0,
                                  right: isBarEnd ? 2 : 0,
                                  background: barHere.color || '#3b82f6',
                                  borderRadius: isBarStart && isBarEnd ? 6 : isBarStart ? '6px 0 0 6px' : isBarEnd ? '0 6px 6px 0' : 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  paddingLeft: barHere.emoji ? '2px' : '0px',
                                }}>
                                  {barHere.emoji && isBarStart && (
                                    <span style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold',
                                      color: 'white',
                                      minWidth: '10px',
                                      height: '10px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}>
                                      {barHere.emoji}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
          </table>
        </div>
      </div>
    );
  }

  // MODO EDICIÓN
  return (
    <div className="w-full max-w-[98vw] mx-auto">
      <div className="flex items-center justify-center gap-2 mb-4 bg-white rounded-lg shadow border border-gray-200 p-3">
        <span className="text-sm text-gray-600 font-medium mr-2">Color:</span>
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setActiveColor(color)}
            className={`w-7 h-7 rounded-full transition-all ${activeColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
            style={{ background: color }}
          />
        ))}
        <input
          type="color"
          value={activeColor}
          onChange={e => setActiveColor(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-2 border-gray-300 ml-2"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
        <table className="w-full border-collapse select-none">
          <thead>
            <tr>
              <th style={{ background: headerBg, color: '#fff', padding: '8px', minWidth: 150, textAlign: 'left' }}>
                Etapa
              </th>
              <th style={{ background: headerBg, color: '#fff', padding: '8px', minWidth: 200, textAlign: 'left' }}>
                Lista de Entregables
              </th>
              {Array.from({ length: numDays }, (_, idx) => (
                <th key={idx} style={{
                  background: headerBgLight,
                  color: '#fff',
                  padding: '8px',
                  minWidth: 20,
                  width: 20,
                  textAlign: 'center',
                  fontSize: '0.75rem'
                }}>
                  {idx + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((etapa, etapaIdx) => {
              const entregables = etapa.entregables || [];
              let rowCounter = 0; // Contador para alternar filas
              
              return entregables.map((entregable, entregableIdx) => {
                const rowBg = rowCounter % 2 === 0 ? '#ffffff' : '#faf5ff';
                rowCounter++;
                const mergedBars = getMergedBars(entregable.bars);
                
                return (
                  <tr key={`${etapaIdx}-${entregableIdx}`} style={{ background: rowBg }}>
                    {entregableIdx === 0 && (
                      <td rowSpan={entregables.length} style={{
                        background: rowBg,
                        padding: '8px',
                        borderBottom: '1px solid #e5e7eb',
                        borderRight: '1px solid #e5e7eb',
                        verticalAlign: 'middle',
                        minWidth: 150,
                      }}>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm bg-white focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-all"
                            value={etapa.etapa}
                            onChange={(e) => handleEtapaChange(etapaIdx, e.target.value)}
                            placeholder="Nombre de Etapa"
                          />
                          {rows.length > 1 && (
                            <button
                              onClick={() => deleteEtapa(etapaIdx)}
                              className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                              title="Eliminar Etapa"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                    <td style={{
                      background: rowBg,
                      padding: '8px',
                      borderBottom: '1px solid #e5e7eb',
                      borderRight: '1px solid #e5e7eb',
                      verticalAlign: 'middle',
                      minWidth: 200,
                    }}>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm bg-white focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-all"
                          value={entregable.nombre}
                          onChange={(e) => handleEntregableChange(etapaIdx, entregableIdx, e.target.value)}
                          placeholder="Nombre de Entregable"
                        />
                        {entregables.length > 1 && (
                          <button
                            onClick={() => deleteEntregable(etapaIdx, entregableIdx)}
                            className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                            title="Eliminar Entregable"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    {Array.from({ length: numDays }, (_, d) => {
                      const barIdx = entregable.bars?.findIndex(bar => d >= bar.start && d <= bar.end) ?? -1;
                      const isBar = barIdx !== -1;
                      
                      const mergedBar = mergedBars.find(b => d >= b.start && d <= b.end);
                      const isMergedBarStart = mergedBar && d === mergedBar.start;
                      const isMergedBarEnd = mergedBar && d === mergedBar.end;
                      
                      let isPreview = false;
                      if (dragInfo && dragInfo.etapaIdx === etapaIdx && dragInfo.entregableIdx === entregableIdx && dragInfo.startDay !== undefined && dragInfo.endDay !== undefined) {
                        const minSel = Math.min(dragInfo.startDay, dragInfo.endDay);
                        const maxSel = Math.max(dragInfo.startDay, dragInfo.endDay);
                        isPreview = d >= minSel && d <= maxSel;
                      }
                      
                      return (
                        <td
                          key={`cell-${d}`}
                          style={{
                            padding: 0,
                            minWidth: 20,
                            width: 20,
                            height: 32,
                            background: rowBg,
                            borderBottom: '1px solid #e5e7eb',
                            position: 'relative',
                            cursor: 'crosshair',
                          }}
                          onMouseDown={(e) => {
                            if (e.altKey && isBar) {
                              deleteBar(etapaIdx, entregableIdx, barIdx);
                            } else if (!isBar) {
                              handleCellMouseDown(etapaIdx, entregableIdx, d);
                            }
                          }}
                          onMouseEnter={() => handleCellMouseEnter(etapaIdx, entregableIdx, d)}
                          onTouchStart={() => {
                            if (isBar) handleCellTouchStart(etapaIdx, entregableIdx, barIdx);
                          }}
                          onTouchEnd={handleCellTouchEnd}
                          onTouchMove={handleCellTouchEnd}
                        >
                          {isPreview && !isBar && (
                            <div style={{ position: 'absolute', inset: 0, background: activeColor, opacity: 0.5, zIndex: 0 }} />
                          )}
                          {mergedBar && (
                            <div style={{
                              position: 'absolute',
                              top: 4,
                              bottom: 4,
                              left: isMergedBarStart ? 1 : 0,
                              right: isMergedBarEnd ? 1 : 0,
                              background: mergedBar.color || '#3b82f6',
                              borderRadius: isMergedBarStart && isMergedBarEnd ? 8 : isMergedBarStart ? '8px 0 0 8px' : isMergedBarEnd ? '0 8px 8px 0' : 0,
                              zIndex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              paddingLeft: mergedBar.emoji ? '6px' : '4px',
                              paddingRight: '4px',
                              cursor: 'pointer',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setEmojiPickerPosition({
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                              });
                              setEmojiPickerTarget({ etapaIdx, entregableIdx, barIdx });
                              setEmojiPickerOpen(true);
                            }}>
                              {mergedBar.emoji && (
                                <span style={{
                                  fontSize: '0.9rem',
                                  fontWeight: 'bold',
                                  color: 'white',
                                  minWidth: '18px',
                                  height: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                                  flexShrink: 0,
                                }}>
                                  {mergedBar.emoji}
                                </span>
                              )}
                              {isMergedBarStart && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: 8,
                                    height: '100%',
                                    cursor: 'ew-resize',
                                    background: 'rgba(255,255,255,0.3)',
                                    borderRadius: '8px 0 0 8px',
                                  }}
                                  onMouseDown={(e) => handleBarResizeStart(e, etapaIdx, entregableIdx, barIdx, 'left')}
                                />
                              )}
                              {isMergedBarEnd && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                    width: 8,
                                    height: '100%',
                                    cursor: 'ew-resize',
                                    background: 'rgba(255,255,255,0.3)',
                                    borderRadius: '0 8px 8px 0',
                                  }}
                                  onMouseDown={(e) => handleBarResizeStart(e, etapaIdx, entregableIdx, barIdx, 'right')}
                                />
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
      
      <div className="flex gap-2 justify-center mt-4">
        <button
          onClick={addEtapa}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
        >
          + Añadir Etapa
        </button>
        {rows.length > 0 && (
          <button
            onClick={() => addEntregable(rows.length - 1)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
          >
            + Añadir Entregable
          </button>
        )}
      </div>

      <EmojiPickerModal
        isOpen={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        onSelect={(emoji) => {
          if (emojiPickerTarget) {
            handleBarEmojiChange(emojiPickerTarget.etapaIdx, emojiPickerTarget.entregableIdx, emojiPickerTarget.barIdx, emoji);
          }
        }}
        position={emojiPickerPosition}
      />
    </div>
  );
}

export default GanttTableTimelineB;
