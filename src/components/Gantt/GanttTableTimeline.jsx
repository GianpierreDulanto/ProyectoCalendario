import html2canvas from "html2canvas";
import React, { useState, useEffect, useRef, useMemo } from "react";

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

function GanttTableTimeline({ rows, setRows, exporting, setExporting }) {
  const exportAreaRef = useRef();
  const [dragInfo, setDragInfo] = useState(null);
  const [activeColor, setActiveColor] = useState(PRESET_COLORS[0]);
  const resizeHandlersRef = useRef({ move: null, end: null });

  // Calcular días basado en barras
  const numDays = useMemo(() => {
    let maxDay = INITIAL_DAYS - 1;
    rows.forEach(row => {
      row.bars?.forEach(bar => {
        if (bar.end > maxDay) maxDay = bar.end;
      });
    });
    return Math.max(maxDay + 2, INITIAL_DAYS);
  }, [rows]);

  // Función para unir barras contiguas del mismo color
  const getMergedBars = (bars) => {
    if (!bars || bars.length === 0) return [];
    
    // Ordenar por inicio
    const sorted = [...bars].sort((a, b) => a.start - b.start);
    const merged = [];
    
    for (const bar of sorted) {
      const last = merged[merged.length - 1];
      // Si la última barra es contigua (end + 1 === start) y mismo color, unir
      if (last && last.end + 1 === bar.start && last.color === bar.color) {
        last.end = bar.end;
      } else {
        merged.push({ ...bar });
      }
    }
    
    return merged;
  };

  // Exportar a PNG con máxima calidad
  useEffect(() => {
    if (!exporting) return;
    const handleExportPNG = async () => {
      await new Promise(r => setTimeout(r, 150));
      const tableDiv = exportAreaRef.current;
      if (!tableDiv) return;
      const prevWidth = tableDiv.style.width;
      const prevOverflow = tableDiv.style.overflow;
      tableDiv.style.width = tableDiv.scrollWidth + 'px';
      tableDiv.style.overflow = 'visible';
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(tableDiv, { 
        scale: 4, 
        useCORS: true, 
        backgroundColor: '#f8fafc',
        logging: false,
        allowTaint: true,
      });
      const imgData = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `calendario_${Date.now()}.png`;
      link.click();
      tableDiv.style.width = prevWidth;
      tableDiv.style.overflow = prevOverflow;
      setExporting(false);
    };
    handleExportPNG();
  }, [exporting, setExporting]);

  const addRow = () => {
    setRows([...rows, { phase: "", profile: "", bars: [] }]);
  };

  const handleRowChange = (idx, field, value) => {
    setRows(rows => rows.map((row, i) =>
      i === idx ? { ...row, [field]: value } : row
    ));
  };

  const handleCellMouseDown = (rowIdx, dayIdx) => {
    setDragInfo({ rowIdx, startDay: dayIdx, endDay: dayIdx });
  };

  const handleCellMouseEnter = (rowIdx, dayIdx) => {
    if (dragInfo && dragInfo.rowIdx === rowIdx) {
      setDragInfo({ ...dragInfo, endDay: dayIdx });
    }
  };

  useEffect(() => {
    if (!dragInfo) return;
    const handleMouseUp = () => {
      const { rowIdx, startDay, endDay } = dragInfo;
      if (startDay !== undefined && endDay !== undefined) {
        const start = Math.min(startDay, endDay);
        const end = Math.max(startDay, endDay);
        if (end >= start) {
          const overlap = rows[rowIdx]?.bars?.some(bar => !(end < bar.start || start > bar.end));
          if (!overlap) {
            setRows(rows => rows.map((row, i) => {
              if (i !== rowIdx) return row;
              let newBars = [...(row.bars || []), { start, end, color: activeColor }];
              // Unificar barras contiguas del mismo color
              newBars = getMergedBars(newBars);
              return { ...row, bars: newBars };
            }));
          }
        }
      }
      setDragInfo(null);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [dragInfo, rows, setRows, activeColor]);

  const handleBarResizeStart = (e, rowIdx, barIdx, side) => {
    e.stopPropagation();
    
    const moveHandler = (ev) => handleBarResizeMove(ev, rowIdx, barIdx, side);
    const endHandler = () => {
      window.removeEventListener('mousemove', resizeHandlersRef.current.move);
      window.removeEventListener('mouseup', resizeHandlersRef.current.end);
      resizeHandlersRef.current = { move: null, end: null };
    };
    
    resizeHandlersRef.current = { move: moveHandler, end: endHandler };
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', endHandler);
  };

  const handleBarResizeMove = (e, rowIdx, barIdx, side) => {
    const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest('td');
    if (!cell) return;
    const cellIdx = cell.cellIndex - 2;
    if (cellIdx < 0) return;
    setRows(rows => rows.map((row, i) => {
      if (i !== rowIdx) return row;
      return {
        ...row,
        bars: row.bars.map((bar, j) => {
          if (j !== barIdx) return bar;
          let newStart = bar.start;
          let newEnd = bar.end;
          if (side === 'left') {
            newStart = Math.min(cellIdx, bar.end);
            if (row.bars.some((b, idx) => idx !== barIdx && newStart <= b.end && newStart >= b.start)) return bar;
          } else {
            newEnd = Math.max(cellIdx, bar.start);
            if (row.bars.some((b, idx) => idx !== barIdx && newEnd <= b.end && newEnd >= b.start)) return bar;
          }
          return { ...bar, start: newStart, end: newEnd };
        })
      };
    }));
  };

  const handleBarColorChange = (rowIdx, barIdx, color) => {
    setRows(rows => rows.map((row, i) => {
      if (i !== rowIdx) return row;
      let newBars = row.bars.map((bar, j) => j === barIdx ? { ...bar, color } : bar);
      // Unificar barras contiguas del mismo color después del cambio
      newBars = getMergedBars(newBars);
      return { ...row, bars: newBars };
    }));
  };

  const deleteBar = (rowIdx, barIdx) => {
    setRows(rows => rows.map((row, i) =>
      i === rowIdx ? { ...row, bars: row.bars.filter((_, j) => j !== barIdx) } : row
    ));
  };

  // Colores del diseño
  const headerBg = "#7c3aed";
  const headerBgLight = "#a78bfa";

  // MODO EXPORTACIÓN - Con encabezados y tabla completa
  if (exporting) {
    return (
      <div className="w-full max-w-[98vw] mx-auto">
        <div
          ref={exportAreaRef}
          id="calendario-export-area"
          style={{ 
            background: '#ffffff', 
            padding: 0, 
            minWidth: 1200,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th 
                  style={{
                    background: headerBg,
                    color: '#fff',
                    padding: '10px 12px',
                    textAlign: 'left',
                    fontSize: 13,
                    fontWeight: 600,
                    minWidth: 250,
                    width: 250,
                    borderRight: '1px solid #9333ea',
                  }}
                >
                  Fase
                </th>
                <th 
                  style={{
                    background: headerBg,
                    color: '#fff',
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    minWidth: 80,
                    width: 80,
                    borderRight: '1px solid #9333ea',
                  }}
                >
                  Perfiles
                </th>
                {Array.from({ length: numDays }, (_, idx) => (
                  <th
                    key={idx}
                    style={{
                      background: headerBgLight,
                      color: '#fff',
                      padding: '8px 0',
                      textAlign: 'center',
                      fontSize: 11,
                      fontWeight: 500,
                      minWidth: 22,
                      width: 22,
                    }}
                  >
                    {idx + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const rowBg = i % 2 === 0 ? '#ffffff' : '#faf5ff';
                const mergedBars = getMergedBars(row.bars);
                
                return (
                  <tr key={i} style={{ background: rowBg }}>
                    <td 
                      style={{
                        background: rowBg,
                        padding: '8px 12px',
                        fontSize: 12,
                        color: '#1e293b',
                        borderBottom: '1px solid #e5e7eb',
                        borderRight: '1px solid #e5e7eb',
                      }}
                    >
                      {row.phase || '-'}
                    </td>
                    <td 
                      style={{
                        background: rowBg,
                        padding: '8px 12px',
                        fontSize: 11,
                        color: '#64748b',
                        textAlign: 'center',
                        fontWeight: 500,
                        borderBottom: '1px solid #e5e7eb',
                        borderRight: '1px solid #e5e7eb',
                      }}
                    >
                      {row.profile || '-'}
                    </td>
                    {Array.from({ length: numDays }, (_, d) => {
                      const barHere = mergedBars.find(bar => d >= bar.start && d <= bar.end);
                      const isBarStart = barHere && d === barHere.start;
                      const isBarEnd = barHere && d === barHere.end;
                      
                      return (
                        <td
                          key={`cell-${d}`}
                          style={{
                            padding: 0,
                            minWidth: 22,
                            width: 22,
                            height: 28,
                            background: rowBg,
                            borderBottom: '1px solid #e5e7eb',
                            position: 'relative',
                          }}
                        >
                          {barHere && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 4,
                                bottom: 4,
                                left: isBarStart ? 2 : 0,
                                right: isBarEnd ? 2 : 0,
                                background: barHere.color || '#3b82f6',
                                borderRadius: isBarStart && isBarEnd ? 6 : isBarStart ? '6px 0 0 6px' : isBarEnd ? '0 6px 6px 0' : 0,
                              }}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // MODO EDICIÓN - Diseño con tabla y grid
  return (
    <div className="w-full max-w-[98vw] mx-auto">
      {/* Selector de color activo */}
      <div className="flex items-center justify-center gap-2 mb-4 bg-white rounded-lg shadow border border-gray-200 p-3">
        <span className="text-sm text-gray-600 font-medium mr-2">Color:</span>
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setActiveColor(color)}
            className={`w-7 h-7 rounded-full transition-all ${activeColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
            style={{ background: color }}
            title={`Seleccionar ${color}`}
          />
        ))}
        <input
          type="color"
          value={activeColor}
          onChange={e => setActiveColor(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-2 border-gray-300 ml-2"
          title="Color personalizado"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
        <table className="w-full border-collapse select-none" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
          <thead>
            <tr>
              <th 
                className="px-3 py-2 text-left font-semibold text-white text-sm border-r border-purple-400"
                style={{
                  background: headerBg,
                  minWidth: 200,
                  width: 200,
                }}
              >
                Fase
              </th>
              <th 
                className="px-3 py-2 text-center font-semibold text-white text-sm border-r border-purple-400"
                style={{
                  background: headerBg,
                  minWidth: 70,
                  width: 70,
                }}
              >
                Perfiles
              </th>
              {Array.from({ length: numDays }, (_, idx) => (
                <th
                  key={idx}
                  className="py-2 text-xs font-medium text-center border-r border-purple-300/50"
                  style={{
                    minWidth: 20,
                    width: 20,
                    background: headerBgLight,
                    color: '#fff',
                  }}
                >
                  {idx + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const rowBg = i % 2 === 0 ? '#ffffff' : '#f5f3ff';
              // Usar barras unidas para visualización
              const mergedBars = getMergedBars(row.bars);
              
              return (
                <tr key={i} className="group" style={{ background: rowBg }}>
                  <td 
                    className="px-2 py-1 border-r border-gray-200"
                    style={{
                      background: rowBg,
                      borderBottom: '1px solid #e5e7eb',
                      minWidth: 200,
                    }}
                  >
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-all"
                      value={row.phase}
                      onChange={e => handleRowChange(i, "phase", e.target.value)}
                      placeholder="Nombre de la fase"
                    />
                  </td>
                  <td 
                    className="px-2 py-1 border-r border-gray-200"
                    style={{
                      background: rowBg,
                      borderBottom: '1px solid #e5e7eb',
                      minWidth: 70,
                    }}
                  >
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-center bg-white focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-all"
                      value={row.profile}
                      onChange={e => handleRowChange(i, "profile", e.target.value)}
                      placeholder="PERFIL"
                    />
                  </td>
                  {Array.from({ length: numDays }, (_, d) => {
                    // Buscar en barras originales para edición
                    const barIdx = row.bars?.findIndex(bar => d >= bar.start && d <= bar.end) ?? -1;
                    const isBar = barIdx !== -1;
                    const bar = isBar ? row.bars[barIdx] : null;
                    
                    // Buscar en barras unidas para visualización
                    const mergedBar = mergedBars.find(b => d >= b.start && d <= b.end);
                    const isMergedBarStart = mergedBar && d === mergedBar.start;
                    const isMergedBarEnd = mergedBar && d === mergedBar.end;
                    
                    const isBarStart = isBar && d === bar.start;
                    
                    let isPreview = false;
                    if (dragInfo && dragInfo.rowIdx === i && dragInfo.startDay !== undefined && dragInfo.endDay !== undefined) {
                      const minSel = Math.min(dragInfo.startDay, dragInfo.endDay);
                      const maxSel = Math.max(dragInfo.startDay, dragInfo.endDay);
                      isPreview = d >= minSel && d <= maxSel;
                    }
                    
                    return (
                      <td
                        key={`cell-${d}`}
                        className="p-0 cursor-crosshair border-r border-gray-100 hover:bg-purple-50 transition-colors"
                        style={{
                          minWidth: 20,
                          width: 20,
                          height: 32,
                          background: rowBg,
                          borderBottom: '1px solid #e5e7eb',
                          position: 'relative',
                        }}
                        onMouseDown={e => {
                          if (e.altKey && isBar) {
                            deleteBar(i, barIdx);
                          } else if (!isBar) {
                            handleCellMouseDown(i, d);
                          }
                        }}
                        onMouseEnter={() => handleCellMouseEnter(i, d)}
                      >
                        {/* Vista previa de selección con color activo */}
                        {isPreview && !isBar && (
                          <div
                            className="absolute inset-0"
                            style={{ 
                              zIndex: 0, 
                              background: activeColor,
                              opacity: 0.5,
                            }}
                          />
                        )}
                        {mergedBar && (
                          <div
                            className="absolute flex items-center group/bar"
                            style={{
                              top: 4,
                              bottom: 4,
                              left: isMergedBarStart ? 1 : 0,
                              right: isMergedBarEnd ? 1 : 0,
                              background: mergedBar.color || '#3b82f6',
                              borderRadius: isMergedBarStart && isMergedBarEnd ? 8 : isMergedBarStart ? '8px 0 0 8px' : isMergedBarEnd ? '0 8px 8px 0' : 0,
                              zIndex: 1,
                            }}
                          >
                            {/* Drag handle izquierdo - solo en el inicio de la barra unida */}
                            {isMergedBarStart && (
                              <div
                                className="absolute left-0 top-0 w-2 h-full cursor-ew-resize hover:bg-white/30 rounded-l"
                                style={{ zIndex: 2 }}
                                onMouseDown={e => handleBarResizeStart(e, i, barIdx, 'left')}
                              />
                            )}
                            {/* Color picker - solo en el inicio de la barra */}
                            {isBarStart && (
                              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                <input
                                  type="color"
                                  value={bar.color || '#3b82f6'}
                                  onChange={e => handleBarColorChange(i, barIdx, e.target.value)}
                                  className="w-4 h-4 rounded cursor-pointer border-0 opacity-80 hover:opacity-100"
                                  title="Cambiar color"
                                  onClick={e => e.stopPropagation()}
                                />
                              </div>
                            )}
                            {/* Drag handle derecho - solo en el final de la barra unida */}
                            {isMergedBarEnd && (
                              <div
                                className="absolute right-0 top-0 w-2 h-full cursor-ew-resize hover:bg-white/30 rounded-r"
                                style={{ zIndex: 2 }}
                                onMouseDown={e => handleBarResizeStart(e, i, barIdx, 'right')}
                              />
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
        </table>
      </div>
      
      <div className="flex justify-center mt-4">
        <button
          onClick={addRow}
          className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir Tarea
        </button>
      </div>
      
      <p className="text-center text-xs text-gray-400 mt-3">
        Selecciona un color y arrastra en las celdas • Alt+Click para eliminar • Arrastra los bordes para redimensionar
      </p>
    </div>
  );
}

export default GanttTableTimeline;
