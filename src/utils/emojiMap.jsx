import React from 'react';

export const emojiToSVGComponent = (emoji) => {
  const svgMap = {
    '✓': (
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
      </svg>
    ),
    '⭐': (
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2l-2.81 6.63L2 9.24l5.46 4.73L5.82 21 12 17.27z"/>
      </svg>
    ),
    '🎯': (
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none"/>
        <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="2" fill="none"/>
        <circle cx="12" cy="12" r="2" fill="white"/>
      </svg>
    ),
    '📋': (
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-2h-4v-2h4v2zm3-4h-7v2h7v-2zm0-2h-7v2h7v-2z"/>
      </svg>
    ),
    '🚀': (
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    '⚡': (
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    '🔥': (
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 2.86 13.5.67z"/>
      </svg>
    ),
    '💡': (
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-20C8.14 1 5 4.13 5 8c0 2.38 1.19 4.47 3 5.74V17c0 .82.68 1.5 1.5 1.5s1.5-.68 1.5-1.5v-3.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm3.5 9c0 1.93-1.57 3.5-3.5 3.5S8 12.93 8 11h2.5c.82 0 1.5-.68 1.5-1.5S11.32 8 10.5 8H8c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5z"/>
      </svg>
    ),
    '📍': (
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c0 1.93-1.57 3.5-3.5 3.5S8 12.93 8 11s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5z"/>
      </svg>
    ),
    '🎨': (
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    '✍️': (
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
      </svg>
    ),
    '📝': (
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-8-6z"/>
      </svg>
    ),
    '🎁': (
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    '💼': (
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M20 6h-2.18c.11-.89.3-1.5.3-1.5a2.5 2.5 0 0 0-5 0c0 0 .15.61.3 1.5H11V5a2 2 0 0 0-2-2 2 2 0 0 0-2 2v1H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-5-2a.5.5 0 0 1 .5.5.5.5 0 0 1-.5.5.5.5 0 0 1-.5-.5.5.5 0 0 1 .5-.5zM8 5a1 1 0 1 1 2 0 1 1 0 0 1-2 0z"/>
      </svg>
    ),
  };

  return svgMap[emoji] || null;
};

