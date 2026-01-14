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

// Feriados nacionales de Perú para sector privado (2024-2026)
const PERU_HOLIDAYS = [
  // 2024
  "2024-01-01", // Año Nuevo
  "2024-03-28", // Jueves Santo
  "2024-03-29", // Viernes Santo
  "2024-05-01", // Día del Trabajo
  "2024-06-29", // San Pedro y San Pablo
  "2024-07-28", // Independencia del Perú
  "2024-07-29", // Independencia del Perú (segundo día)
  "2024-08-30", // Santa Rosa de Lima
  "2024-10-08", // Combate de Angamos
  "2024-11-01", // Todos los Santos
  "2024-12-08", // Inmaculada Concepción
  "2024-12-25", // Navidad
  // 2025
  "2025-01-01", // Año Nuevo
  "2025-04-17", // Jueves Santo
  "2025-04-18", // Viernes Santo
  "2025-05-01", // Día del Trabajo
  "2025-06-29", // San Pedro y San Pablo
  "2025-07-28", // Independencia del Perú
  "2025-07-29", // Independencia del Perú (segundo día)
  "2025-08-30", // Santa Rosa de Lima
  "2025-10-08", // Combate de Angamos
  "2025-11-01", // Todos los Santos
  "2025-12-08", // Inmaculada Concepción
  "2025-12-25", // Navidad
  // 2026
  "2026-01-01", // Año Nuevo
  "2026-04-02", // Jueves Santo
  "2026-04-03", // Viernes Santo
  "2026-05-01", // Día del Trabajo
  "2026-06-29", // San Pedro y San Pablo
  "2026-07-28", // Independencia del Perú
  "2026-07-29", // Independencia del Perú (segundo día)
  "2026-08-30", // Santa Rosa de Lima
  "2026-10-08", // Combate de Angamos
  "2026-11-01", // Todos los Santos
  "2026-12-08", // Inmaculada Concepción
  "2026-12-25", // Navidad
];

// Función auxiliar para parsear fechas correctamente
const parseDate = (dateStr) => {
  if (typeof dateStr === 'string') {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // Month es 0-indexed
  }
  return new Date(dateStr);
};

function GanttTableTimelineC({ rows, setRows, exporting, setExporting, startDate, endDate }) {
  const exportAreaRef = useRef();
  const [dragInfo, setDragInfo] = useState(null);
  const [activeColor, setActiveColor] = useState(PRESET_COLORS[0]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState(null);
  const [emojiPickerTarget, setEmojiPickerTarget] = useState(null);
  const resizeHandlersRef = useRef({ move: null, end: null });
  const longPressTimeoutRef = useRef(null);
  const longPressTargetRef = useRef(null);

  // Calcular días reales basado en startDate y endDate
  const numDays = useMemo(() => {
    if (!startDate || !endDate) return 30;
    
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [startDate, endDate]);

  // Generar array de fechas y agrupar por mes
  const dateGroups = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    const dates = [];
    const current = parseDate(startDate);
    const end = parseDate(endDate);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    const groups = [];
    let currentMonth = null;
    let currentGroup = null;
    
    dates.forEach(date => {
      const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(' de ', ' ');
      
      if (monthYear !== currentMonth) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentMonth = monthYear;
        currentGroup = {
          monthName,
          dates: [date]
        };
      } else {
        currentGroup.dates.push(date);
      }
    });
    
    if (currentGroup) {
      groups.push(currentGroup);
    }
    
    return groups;
  }, [startDate, endDate]);

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

  // Si no hay fechas, mostrar un mensaje
  if (!startDate || !endDate) {
    return (
      <div className="w-full text-center py-12">
        <p className="text-gray-500">Selecciona las fechas de inicio y fin para ver el diagrama</p>
      </div>
    );
  }

  // Función para verificar si un día es no elegible (sábado, domingo o feriado)
  const isNonEligibleDay = (date) => {
    // Crear una copia de la fecha para evitar modificaciones
    const d = new Date(date);
    // Ajustar por zona horaria local
    const dayOfWeek = d.getDay();
    const isSaturdayOrSunday = dayOfWeek === 6 || dayOfWeek === 0; // 6 = Sábado, 0 = Domingo
    
    // Obtener la fecha en formato YYYY-MM-DD en zona horaria local
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const isHoliday = PERU_HOLIDAYS.includes(dateString);
    
    return isSaturdayOrSunday || isHoliday;
  };

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
            // Si emoji es vacío, considéralo como si se eliminó (null)
            bars: ent.bars.map((bar, j) => j === barIdx ? { ...bar, emoji: emoji || null } : bar)
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

  // Long press handler para móvil
  const handleCellTouchStart = (etapaIdx, entregableIdx, barIdx) => {
    longPressTargetRef.current = { etapaIdx, entregableIdx, barIdx };
    longPressTimeoutRef.current = setTimeout(() => {
      if (barIdx !== -1) {
        deleteBar(etapaIdx, entregableIdx, barIdx);
        longPressTargetRef.current = null;
      }
    }, 500); // 500ms de presión
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
              <tr style={{ height: '24px' }}>
                <th rowSpan={2} style={{
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
                <th rowSpan={2} style={{
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
                {dateGroups.map((group, idx) => {
                  const monthNumber = new Date(group.dates[0]).getMonth() + 1;
                  const isEvenMonth = monthNumber % 2 === 0;
                  const monthBg = isEvenMonth ? '#6d28d9' : headerBg;
                  
                  return (
                  <th key={idx} colSpan={group.dates.length} style={{
                    background: monthBg,
                    color: '#fff',
                    padding: '4px 0',
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRight: '1px solid #9333ea',
                    verticalAlign: 'middle',
                  }}>
                    {group.monthName.toUpperCase()}
                  </th>
                );
                })}
              </tr>
              <tr style={{ height: '18px' }}>
                {dateGroups.map((group, gIdx) =>
                  group.dates.map((date, dIdx) => {
                    const isNonEligible = isNonEligibleDay(date);
                    const bgColor = isNonEligible ? '#ef4444' : headerBgLight;
                    
                    return (
                      <th key={`${gIdx}-${dIdx}`} style={{
                        background: bgColor,
                        color: '#fff',
                        padding: '4px 0',
                        textAlign: 'center',
                        fontSize: 11,
                        fontWeight: isNonEligible ? '700' : '700',
                        width: 22,
                        minWidth: 22,
                        verticalAlign: 'middle',
                        borderRight: '1px solid #9333ea',
                      }}>
                        {date.getDate()}
                      </th>
                    );
                  })
                )}
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
                      <tr key={`${etapaIdx}-${entregableIdx}`} style={{ background: etapaBg, height: '18px' }}>
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
                          lineHeight: '18px',
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
                          lineHeight: '16px',
                        }}>
                          {entregable.nombre?.toUpperCase() || '-'}
                        </td>
                        {Array.from({ length: numDays }, (_, d) => {
                          const currentDate = parseDate(startDate);
                          currentDate.setDate(currentDate.getDate() + d);
                          const isNonEligible = isNonEligibleDay(currentDate);
                          
                          const barHere = mergedBars.find(bar => d >= bar.start && d <= bar.end);
                          const isBarStart = barHere && d === barHere.start;
                          const isBarEnd = barHere && d === barHere.end;
                          
                          return (
                            <td key={`cell-${d}`} style={{
                              padding: 0,
                              width: 22,
                              height: 24,
                              background: isNonEligible ? '#fee2e2' : etapaBg,
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
              <th rowSpan={2} style={{ background: headerBg, color: '#fff', padding: '8px', width: '25%', textAlign: 'left', verticalAlign: 'middle' }}>
                Etapa
              </th>
              <th rowSpan={2} style={{ background: headerBg, color: '#fff', padding: '8px', width: '25%', textAlign: 'left', verticalAlign: 'middle' }}>
                Lista de Entregables
              </th>
              {dateGroups.map((group, idx) => {
                const monthNumber = new Date(group.dates[0]).getMonth() + 1;
                const isEvenMonth = monthNumber % 2 === 0;
                const monthBg = isEvenMonth ? '#6d28d9' : headerBg;
                
                return (
                <th key={idx} colSpan={group.dates.length} style={{
                  background: monthBg,
                  color: '#fff',
                  padding: '8px',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                }}>
                  {group.monthName.toUpperCase()}
                </th>
              );
              })}
            </tr>
            <tr>
              {dateGroups.map((group, gIdx) =>
                group.dates.map((date, dIdx) => {
                  const isNonEligible = isNonEligibleDay(date);
                  const bgColor = isNonEligible ? '#ef4444' : headerBgLight;
                  const textColor = isNonEligible ? '#ffffff' : '#ffffff';
                  
                  return (
                    <th key={`${gIdx}-${dIdx}`} style={{
                      background: bgColor,
                      color: textColor,
                      padding: '8px',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: isNonEligible ? '700' : '600',
                    }}>
                      {date.getDate()}
                    </th>
                  );
                })
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((etapa, etapaIdx) => {
              const entregables = etapa.entregables || [];
              return entregables.map((entregable, entregableIdx) => {
                const rowBg = (etapaIdx + entregableIdx) % 2 === 0 ? '#ffffff' : '#f5f3ff';
                const etapaBg = etapaIdx % 2 === 0 ? '#ffffff' : '#f5f3ff';
                const mergedBars = getMergedBars(entregable.bars);
                
                return (
                  <tr key={`${etapaIdx}-${entregableIdx}`} style={{ background: rowBg, height: '10px' }}>
                    {entregableIdx === 0 && (
                      <td rowSpan={entregables.length} style={{
                        background: etapaBg,
                        padding: '8px',
                        borderBottom: '1px solid #e5e7eb',
                        borderRight: '1px solid #e5e7eb',
                        verticalAlign: 'top',
                        width: '25%',
                      }}>
                        <div className="flex gap-2 items-start pt-1">
                          <input
                            type="text"
                            value={etapa.etapa}
                            onChange={(e) => handleEtapaChange(etapaIdx, e.target.value)}
                            style={{
                              flex: 1,
                              minHeight: '24px',
                              padding: '8px 12px',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#111827',
                              backgroundColor: etapa.etapa ? '#f8f8f8' : '#ffffff',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              outline: 'none',
                            }}
                            placeholder="Nombre de Etapa"
                            onFocus={(e) => {
                              e.target.style.borderColor = '#a855f7';
                              e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#d1d5db';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                          {etapaIdx > 0 && (
                            <button
                              onClick={() => deleteEtapa(etapaIdx)}
                              className="p-2 text-gray-400 hover:text-red-500 flex-shrink-0 mt-0"
                              title="Eliminar etapa"
                            >
                              ✕
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
                      width: '25%',
                    }}>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={entregable.nombre}
                          onChange={(e) => handleEntregableChange(etapaIdx, entregableIdx, e.target.value)}
                          style={{
                            flex: 1,
                            minHeight: '24px',
                            padding: '8px 12px',
                            fontSize: '14px',
                            color: '#111827',
                            backgroundColor: entregable.nombre ? '#f8f8f8' : '#ffffff',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            outline: 'none',
                          }}
                          placeholder="Nombre de Entregable"
                          onFocus={(e) => {
                            e.target.style.borderColor = '#a855f7';
                            e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        {entregables.length > 1 && (
                          <button
                            onClick={() => deleteEntregable(etapaIdx, entregableIdx)}
                            className="p-2 text-gray-400 hover:text-red-500 flex-shrink-0"
                            title="Eliminar entregable"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                    {dateGroups.map((group, gIdx) =>
                      group.dates.map((date, dIdx) => {
                        const d = dateGroups.slice(0, gIdx).reduce((sum, g) => sum + g.dates.length, 0) + dIdx;
                        const isNonEligible = isNonEligibleDay(date);
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
                            height: 10,
                            background: isNonEligible ? '#fee2e2' : rowBg,
                            borderBottom: '1px solid #e5e7eb',
                            position: 'relative',
                            cursor: isNonEligible ? 'not-allowed' : 'crosshair',
                          }}
                          onMouseDown={(e) => {
                            if (isNonEligible) return;
                            if (e.altKey && isBar) {
                              deleteBar(etapaIdx, entregableIdx, barIdx);
                            } else if (!isBar) {
                              handleCellMouseDown(etapaIdx, entregableIdx, d);
                            }
                          }}
                          onTouchStart={() => {
                            if (!isNonEligible && isBar) {
                              handleCellTouchStart(etapaIdx, entregableIdx, barIdx);
                            }
                          }}
                          onTouchEnd={handleCellTouchEnd}
                          onTouchMove={handleCellTouchEnd}
                          onMouseEnter={() => {
                            if (!isNonEligible) {
                              handleCellMouseEnter(etapaIdx, entregableIdx, d);
                            }
                          }}
                        >
                          {isPreview && !isBar && !isNonEligible && (
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
                      })
                    )}
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
        currentEmoji={emojiPickerTarget ? getMergedBars(rows[emojiPickerTarget.etapaIdx].entregables[emojiPickerTarget.entregableIdx].bars)[emojiPickerTarget.barIdx]?.emoji || "" : ""}
      />
    </div>
  );
}

export default GanttTableTimelineC;
