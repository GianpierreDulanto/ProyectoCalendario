import { useState, useEffect, useRef } from 'react';

// Emojis/marcadores predefinidos - Igual al SimpleEditor
const PRESET_EMOJIS = [
  "✓", "✗", "→", "←", "↑", "↓", 
  "⬤", "◆", "★", "◾", "●", "◐", 
  "☑", "☐", "☒", "⊙"
];

// Colores predefinidos
const PRESET_COLORS = [
  "#3b82f6", "#22c55e", "#eab308", "#f97316", 
  "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899",
];

export default function EmojiPickerModal({ isOpen, onClose, onSelect, position, currentEmoji = "" }) {
  const modalRef = useRef(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [customEmoji, setCustomEmoji] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCustomEmoji(currentEmoji || "");
    }
  }, [isOpen, currentEmoji]);

  useEffect(() => {
    if (isOpen && position) {
      // Calcular posición del modal para que no se salga de pantalla
      const modalWidth = 400;
      const modalHeight = 350;
      const offset = 10;
      
      let top = position.y + offset;
      let left = position.x - modalWidth / 2;
      
      // Ajustar si se sale de pantalla
      if (left < offset) left = offset;
      if (left + modalWidth > window.innerWidth) {
        left = window.innerWidth - modalWidth - offset;
      }
      if (top + modalHeight > window.innerHeight) {
        top = position.y - modalHeight - offset;
      }
      
      Promise.resolve().then(() => {
        setModalPosition({ top, left });
      });
    }
  }, [isOpen, position]);

  // Cerrar con ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      <div
        ref={modalRef}
        className="absolute bg-white rounded-lg shadow-2xl border border-gray-200 p-4"
        style={{
          top: `${modalPosition.top}px`,
          left: `${modalPosition.left}px`,
          width: '400px',
        }}
      >
        <div className="space-y-3">
          {/* Sección de Color */}
          <div>
            <label className="text-xs text-gray-600 block mb-2">Color</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    // No hacer nada con el color en Timeline, solo cerrar
                    onClose();
                  }}
                  className="w-6 h-6 rounded-full transition-all"
                  style={{ background: color }}
                  title={color}
                />
              ))}
              <input
                type="color"
                className="w-6 h-6 rounded cursor-pointer border border-gray-300"
                disabled
              />
            </div>
          </div>

          {/* Sección de Emoji/Marcador */}
          <div>
            <label className="text-xs text-gray-600 block mb-2">Emoji/Marcador</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setCustomEmoji(emoji);
                  }}
                  className={`w-8 h-8 rounded transition-all flex items-center justify-center text-lg ${customEmoji === emoji ? 'ring-2 ring-purple-400 bg-purple-100' : 'bg-gray-100 hover:bg-gray-200'}`}
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
                value={customEmoji}
                onChange={(e) => {
                  const char = e.target.value.slice(0, 1);
                  setCustomEmoji(char);
                }}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center font-medium bg-white focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
                autoFocus
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (customEmoji) {
                onSelect(customEmoji);
              } else {
                // Si está vacío, se considera como eliminación
                onSelect("");
              }
              onClose();
            }}
            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
