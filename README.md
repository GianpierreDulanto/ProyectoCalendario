# Planificador Gantt - Sincronización Firebase

Aplicación web para crear y gestionar diagramas de Gantt con sincronización automática en Firebase.

## 🎯 Características Principales

- ✅ **Autenticación** - Email y Google OAuth con Firebase
- ✅ **Multi-Proyectos** - Crear, editar, eliminar y cambiar entre proyectos
- ✅ **Tres Modos de Visualización** (A, B, C)
  - **Modo A**: Estructura plana (Fases y Perfiles)
  - **Modo B**: Estructura jerárquica (Etapas con Entregables)
  - **Modo C**: Configuración de fechas (Fechas de inicio y fin)
- ✅ **Auto-guardado** - Sincronización automática cada 5 segundos
- ✅ **Exportar PNG** - Descargar diagramas como imagen
- ✅ **Responsivo** - Funciona en desktop y móviles

## 🚀 Inicio Rápido

### Requisitos
- Node.js 16+
- npm o yarn

### Instalación

```bash
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5174`

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── Gantt/
│   │   └── GanttTableTimeline.jsx      # Componente principal del Gantt
│   ├── ProjectSelector.jsx              # Dropdown de gestión de proyectos
│   ├── UserProfile.jsx                  # Perfil del usuario
│   └── ProtectedRoute.jsx               # Rutas protegidas
├── contexts/
│   └── AuthContext.jsx                  # Contexto de autenticación
├── hooks/
│   ├── useProjects.js                   # CRUD de proyectos
│   └── useAutoSave.js                   # Auto-guardado en Firestore
├── pages/
│   └── Login.jsx                        # Página de inicio de sesión
├── App.jsx                              # Componente principal
├── firebase.config.js                   # Configuración de Firebase
└── main.jsx                             # Punto de entrada
```

## 🔧 Configuración Firebase

El archivo `firebase.config.js` contiene las credenciales del proyecto Firebase.

## 📊 Estructura de Datos en Firestore

```
users/{userId}/
  └─ projects/
      ├─ {projectId}/
      │   ├─ name: string
      │   ├─ rowsA: []
      │   ├─ rowsB: []
      │   ├─ rowsC: []
      │   ├─ startDate: string
      │   ├─ endDate: string
      │   ├─ viewMode: string
      │   └─ createdAt: timestamp
```

## 💾 Auto-guardado

Los cambios se guardan automáticamente cada 5 segundos en Firestore:
- Los tres modos (A, B, C) se guardan juntos
- Al cambiar de proyecto, los datos se cargan automáticamente
- No hay pérdida de datos al cambiar proyectos

## 🎨 Tecnologías Utilizadas

- **React 19** - Frontend framework
- **Vite** - Build tool y dev server
- **Firebase 10.13.2** - Backend-as-a-Service
- **Firestore** - Base de datos en tiempo real
- **Tailwind CSS** - Estilos
- **React Router v6** - Enrutamiento

## 📝 Scripts Disponibles

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Crear build para producción
npm run preview  # Previsualizar build
npm run lint     # Ejecutar ESLint
```

## 🔐 Autenticación

La aplicación soporta:
- Registro e inicio de sesión con email/contraseña
- Autenticación con Google
- Sesiones persistentes
- Rutas protegidas

## 📱 Uso

1. **Login** - Inicia sesión con tu cuenta
2. **Crear Proyecto** - Usa el dropdown para crear uno nuevo
3. **Editar** - Cambia entre modos A, B, C para editar
4. **Guardar** - Los cambios se guardan automáticamente
5. **Exportar** - Descarga el diagrama como PNG
6. **Cambiar Proyecto** - Selecciona otro proyecto del dropdown

## 📄 Licencia

MIT
