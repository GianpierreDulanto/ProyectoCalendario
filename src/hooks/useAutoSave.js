import { useEffect, useRef, useState, useCallback } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.config';
import { useAuth } from './useAuth';

export function useAutoSave(data, projectId) {
  const { user } = useAuth();
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const lastDataRef = useRef(data);
  const userRef = useRef(user);
  const projectIdRef = useRef(projectId);

  // Actualizar referencias sin disparar efectos
  useEffect(() => {
    lastDataRef.current = data;
    userRef.current = user;
    projectIdRef.current = projectId;
  }, [data, user, projectId]);

  // Guardar datos en Firestore
  const saveData = useCallback(async (dataToSave) => {
    if (!userRef.current || !projectIdRef.current) return;

    try {
      setIsSaving(true);
      const projectRef = doc(db, 'users', userRef.current.uid, 'projects', projectIdRef.current);
      
      await updateDoc(projectRef, {
        rowsA: dataToSave.rowsA,
        rowsB: dataToSave.rowsB,
        rowsC: dataToSave.rowsC,
        startDate: dataToSave.startDate,
        endDate: dataToSave.endDate,
        viewMode: dataToSave.viewMode,
        updatedAt: Timestamp.now()
      });

      setLastSaved(new Date().toISOString());
      setIsSaving(false);

      return true;
    } catch (error) {
      setIsSaving(false);

      return false;
    }
  }, []);

  // Guardar datos solo al desmontar (sin dependencias)
  useEffect(() => {
    return () => {
      if (lastDataRef.current && userRef.current && projectIdRef.current) {
        const projectRef = doc(db, 'users', userRef.current.uid, 'projects', projectIdRef.current);
        updateDoc(projectRef, {
          rowsA: lastDataRef.current.rowsA,
          rowsB: lastDataRef.current.rowsB,
          rowsC: lastDataRef.current.rowsC,
          startDate: lastDataRef.current.startDate,
          endDate: lastDataRef.current.endDate,
          viewMode: lastDataRef.current.viewMode,
          updatedAt: Timestamp.now()
        }).catch(err => {});
      }
    };
  }, []);

  return { saveData, lastSaved, isSaving };
}
