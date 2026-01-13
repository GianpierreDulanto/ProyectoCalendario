import { useEffect, useState } from 'react';
import { doc, collection, getDocs, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.config';
import { useAuth } from './useAuth';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar todos los proyectos del usuario
  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const projectsRef = collection(db, 'users', user.uid, 'projects');
        const snapshot = await getDocs(projectsRef);
        const projectsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (isMounted) {
          setProjects(projectsList);
          
          // Si no hay proyecto actual, seleccionar el primero
          if (projectsList.length > 0 && !currentProjectId) {
            setCurrentProjectId(projectsList[0].id);
          }

          await Promise.resolve().then(() => {
            if (isMounted) {
              setLoading(false);
            }
          });
        }
      } catch (err) {
        if (isMounted) {

          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, [user, currentProjectId]);

  // Crear un nuevo proyecto
  const createProject = async (projectName, data = null) => {
    if (!user) return null;

    try {
      const projectId = Date.now().toString();
      const newProject = {
        id: projectId,
        name: projectName,
        rowsA: data?.rowsA || [{ phase: '', profile: '', bars: [] }],
        rowsB: data?.rowsB || [{ etapa: '', entregables: [{ nombre: '', bars: [] }] }],
        rowsC: data?.rowsC || [{ etapa: '', entregables: [{ nombre: '', bars: [] }] }],
        startDate: data?.startDate || '',
        endDate: data?.endDate || '',
        viewMode: data?.viewMode || 'A',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const projectRef = doc(db, 'users', user.uid, 'projects', projectId);
      await setDoc(projectRef, newProject);

      setProjects([...projects, newProject]);
      setCurrentProjectId(projectId);

      return projectId;
    } catch (err) {

      setError(err.message);
      return null;
    }
  };

  // Actualizar proyecto actual
  const updateProject = async (projectId, data) => {
    if (!user) return;

    try {
      const projectRef = doc(db, 'users', user.uid, 'projects', projectId);
      await updateDoc(projectRef, {
        rowsA: data.rowsA,
        rowsB: data.rowsB,
        rowsC: data.rowsC,
        startDate: data.startDate,
        endDate: data.endDate,
        viewMode: data.viewMode,
        updatedAt: Timestamp.now()
      });

      // Actualizar en estado local
      setProjects(projects.map(p => 
        p.id === projectId 
          ? { ...p, ...data, updatedAt: new Date() }
          : p
      ));
    } catch (err) {

      setError(err.message);
    }
  };

  // Renombrar proyecto
  const renameProject = async (projectId, newName) => {
    if (!user) return;

    try {
      const projectRef = doc(db, 'users', user.uid, 'projects', projectId);
      await updateDoc(projectRef, {
        name: newName,
        updatedAt: Timestamp.now()
      });

      setProjects(projects.map(p => 
        p.id === projectId 
          ? { ...p, name: newName, updatedAt: new Date() }
          : p
      ));
    } catch (err) {

      setError(err.message);
    }
  };

  // Eliminar proyecto
  const deleteProject = async (projectId) => {
    if (!user) return;

    try {
      const projectRef = doc(db, 'users', user.uid, 'projects', projectId);
      await deleteDoc(projectRef);

      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);

      // Si eliminamos el proyecto actual, seleccionar otro
      if (projectId === currentProjectId) {
        if (updatedProjects.length > 0) {
          setCurrentProjectId(updatedProjects[0].id);
        } else {
          setCurrentProjectId(null);
        }
      }
    } catch (err) {

      setError(err.message);
    }
  };

  // Obtener proyecto actual
  const getCurrentProject = () => {
    return projects.find(p => p.id === currentProjectId) || null;
  };

  return {
    projects,
    currentProjectId,
    setCurrentProjectId,
    loading,
    error,
    createProject,
    updateProject,
    renameProject,
    deleteProject,
    getCurrentProject
  };
}
