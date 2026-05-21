'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockDb, Lote } from '../supabase/mockDb';

type Rol = 'jardinero' | 'director' | 'admin';

interface AppContextType {
  activeRole: Rol;
  setActiveRole: (role: Rol) => void;
  selectedLoteId: string;
  setSelectedLoteId: (loteId: string) => void;
  lotes: Lote[];
  recargarLotes: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<Rol>(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('cannis_active_role') as Rol;
      if (savedRole && ['jardinero', 'director', 'admin'].includes(savedRole)) {
        return savedRole;
      }
    }
    return 'director'; // Director por defecto para explorar todo
  });
  const [selectedLoteId, setSelectedLoteId] = useState<string>('');
  const [lotes, setLotes] = useState<Lote[]>([]);

  // Cargar lotes iniciales
  const recargarLotes = () => {
    const list = mockDb.getLotes();
    setLotes(list);
    if (list.length > 0 && !selectedLoteId) {
      // Por defecto seleccionar el lote Kush de floración (que tiene los mejores desvíos simulados)
      const kush = list.find(l => l.id === 'lot-kush-floracion');
      setSelectedLoteId(kush ? kush.id : list[0].id);
    }
  };

  useEffect(() => {
    // Evitar errores de SSR
    if (typeof window !== 'undefined') {
      const t = setTimeout(() => {
        recargarLotes();
      }, 0);
      return () => clearTimeout(t);
    }
  }, []);

  const setActiveRole = (role: Rol) => {
    setActiveRoleState(role);
    localStorage.setItem('cannis_active_role', role);
  };

  return (
    <AppContext.Provider
      value={{
        activeRole,
        setActiveRole,
        selectedLoteId,
        setSelectedLoteId,
        lotes,
        recargarLotes,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext debe ser utilizado dentro de un AppProvider');
  }
  return context;
}
