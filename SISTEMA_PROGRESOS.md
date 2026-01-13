# 📊 ACTUALIZACIÓN: SISTEMA DE GESTIÓN DE PROGRESOS

## ¿Qué cambió?

Se agregó un **sistema completo de gestión de proyectos/progresos** que permite:

✅ **Crear** múltiples progresos  
✅ **Nombrar** cada progreso  
✅ **Editar** nombres de progresos  
✅ **Borrar** progresos cuando no los necesites  
✅ **Guardar automáticamente** cada progreso (A, B y C completos)  
✅ **Cambiar entre progresos** con un dropdown  

---

## 🎯 Cómo funciona

### En el Header

En el encabezado (arriba a la izquierda, después del logo) encontrarás un **dropdown de proyectos** que muestra:

- **Botón principal**: Nombre del progreso actual
- **Icono de archivo**: Representa los progresos guardados
- **Flecha hacia abajo**: Indica que hay un menú desplegable

### Dentro del Dropdown

Cuando hagas clic en el dropdown, verás:

1. **Botón "+ Nuevo Progreso"** (arriba)
   - Clic para crear un nuevo progreso
   - Se pide que nombre el progreso
   - Los nuevos progresos guardan automáticamente los estados A, B y C

2. **Lista de progresos**
   - Nombre del progreso
   - Fecha de última modificación
   - Botón ✏️ (editar) - para cambiar el nombre
   - Botón 🗑️ (eliminar) - para borrar el progreso

---

## 📁 Archivos Nuevos/Modificados

### Nuevos archivos:
- `src/hooks/useProjects.js` - Hook para manejar proyectos
- `src/components/ProjectSelector.jsx` - Componente dropdown de proyectos

### Archivos modificados:
- `src/App.jsx` - Integración del sistema de proyectos
- `src/hooks/useAutoSave.js` - Actualizado para guardar por proyecto
- `src/firebase.config.js` - Ya tiene credenciales configuradas ✅

---

## 🗄️ Estructura en Firestore

Los proyectos se guardan así:

```
users/{userId}/
  └─ projects/
      └─ {projectId}/
          ├─ name: "Nombre del Progreso"
          ├─ rowsA: [...]          (Datos del modo A)
          ├─ rowsB: [...]          (Datos del modo B)
          ├─ rowsC: [...]          (Datos del modo C)
          ├─ startDate: "2024-01-15"
          ├─ endDate: "2024-12-31"
          ├─ viewMode: "A"
          ├─ createdAt: timestamp
          └─ updatedAt: timestamp
```

Cada usuario puede tener **múltiples proyectos**, cada uno con sus propios datos A, B y C.

---

## 🎮 Cómo usar

### Crear un nuevo progreso
1. Haz clic en el selector de proyectos (dropdown)
2. Clic en "+ Nuevo Progreso"
3. Ingresa el nombre
4. Clic en "Crear"
5. ¡El progreso está listo!

### Editar un progreso
1. Abre el dropdown de proyectos
2. Haz clic en el ícono ✏️ del progreso que quieres editar
3. Ingresa el nuevo nombre
4. Clic en "Guardar"

### Cambiar de progreso
1. Abre el dropdown
2. Haz clic en el nombre del progreso que quieres usar
3. Los datos A, B y C se cargan automáticamente

### Eliminar un progreso
1. Abre el dropdown
2. Haz clic en el ícono 🗑️ del progreso a eliminar
3. Confirma la eliminación

---

## 🔄 Auto-guardado

- Cada cambio que hagas se guarda automáticamente **cada 5 segundos**
- Los datos de **A, B y C se guardan juntos** en el mismo progreso
- Cambiar de progreso **no pierde datos** - cada uno está guardado por separado
- El timestamp "Guardado: HH:MM:SS" muestra cuándo fue la última sincronización

---

## 🚀 Flujo de la App

```
Usuario inicia sesión
         ↓
Se cargan los proyectos
         ↓
Si no hay proyectos, se crea uno por defecto
         ↓
Se selecciona el primer proyecto
         ↓
Se cargan los datos del proyecto (A, B, C)
         ↓
Usuario edita (cualquier cambio se auto-guarda)
         ↓
Cambiar de proyecto → Se cargan datos diferentes
```

---

## 💾 Ventajas del nuevo sistema

✅ **Organización**: Múltiples proyectos en una sola cuenta  
✅ **Separación**: Cada proyecto tiene sus propios datos A, B, C  
✅ **Flexibilidad**: Crear, editar, borrar proyectos fácilmente  
✅ **Sincronización**: Auto-guardado automático  
✅ **Portabilidad**: Todos tus proyectos en la nube  
✅ **Multi-dispositivo**: Accede desde cualquier dispositivo  

---

## 🔐 Seguridad

- Cada usuario solo ve sus propios proyectos
- Los proyectos se almacenan en colecciones privadas por usuario
- Firebase garantiza que no hay acceso cruzado entre usuarios

---

## ⚙️ Configuración técnica

### Hook `useProjects()`
Proporciona:
- `projects` - Lista de todos los proyectos
- `currentProjectId` - ID del proyecto actual
- `createProject(name, data)` - Crear nuevo proyecto
- `updateProject(id, data)` - Actualizar datos del proyecto
- `renameProject(id, name)` - Renombrar proyecto
- `deleteProject(id)` - Eliminar proyecto
- `getCurrentProject()` - Obtener proyecto actual

### Componente `<ProjectSelector />`
- Dropdown interactivo
- Crear, editar, eliminar proyectos
- Seleccionar proyecto activo
- Muestra fecha de última modificación

---

## 📝 Ejemplo de uso en código

```jsx
import { useProjects } from './hooks/useProjects';

function MyComponent() {
  const { 
    projects, 
    currentProjectId, 
    createProject, 
    deleteProject 
  } = useProjects();

  // Crear nuevo proyecto
  const handleCreate = async () => {
    await createProject('Mi nuevo proyecto');
  };

  // Eliminar proyecto
  const handleDelete = async (projectId) => {
    await deleteProject(projectId);
  };

  return (
    <div>
      {/* Tu contenido */}
    </div>
  );
}
```

---

## 🎯 Próximas mejoras posibles

- [ ] Duplicar un proyecto
- [ ] Exportar proyecto a JSON/PDF
- [ ] Compartir proyecto con otros usuarios
- [ ] Historial de versiones del proyecto
- [ ] Buscar proyectos por nombre
- [ ] Ordenar proyectos (nombre, fecha)
- [ ] Archivar proyectos (sin eliminar)
- [ ] Notas/descripciones por proyecto

---

## ✅ Verificación

- ✓ Sistema de proyectos funcional
- ✓ Auto-guardado por proyecto
- ✓ CRUD completo (Create, Read, Update, Delete)
- ✓ Interfaz de usuario amigable
- ✓ Firebase integrado
- ✓ Responsive design

---

**¡Ahora puedes tener múltiples proyectos organizados y sincronizados en la nube!** 🎉
