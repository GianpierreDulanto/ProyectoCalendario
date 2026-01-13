import { useState, useEffect, useRef } from 'react';

const PRESET_MARKERS = [
  // Números
  "1", "2", "3", "4", "5", "6", "7", "8", "9",
  // Check y símbolos simples
  "✓", "✗", "→", "←", "↑", "↓",
  // Emojis
  "⭐", "🎯", "🚀", "⚡", "🔥", "💡",
  "📋", "📍", "🎨", "✍️", "📝", "🎁",
];

export default function EmojiPickerModal({ isOpen, onClose, onSelect, position }) {
  const modalRef = useRef(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && position) {
      // Calcular posición del modal para que no se salga de pantalla
      const modalWidth = 280;
      const modalHeight = 180;
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
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Elegir emoji</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-8 gap-1 max-w-xs">
          {PRESET_MARKERS.map((marker) => (
            <button
              key={marker}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(marker);
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-lg cursor-pointer transition-all hover:scale-110 active:scale-95"
              title={`Seleccionar ${marker}`}
            >
              {marker}
            </button>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
