'use client';

import React from 'react';
import { useAppContext } from '../../lib/context/AppContext';
import { 
  ClipboardList, 
  Activity, 
  LineChart, 
  BookOpen, 
  QrCode, 
  Settings, 
  Sprout, 
  User, 
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { activeRole, setActiveRole } = useAppContext();
  const pathname = usePathname();

  // Mapear roles a datos visuales
  const ROL_INFO = {
    jardinero: { nombre: 'Juan (Jardinero)', color: 'text-phase-propagacion border-phase-propagacion bg-phase-propagacion/5' },
    director: { nombre: 'Tabaré (Director)', color: 'text-phase-floracion border-phase-floracion bg-phase-floracion/5' },
    admin: { nombre: 'Sophia (Admin/Compliance)', color: 'text-[#d4a373] border-[#d4a373] bg-[#d4a373]/5' },
  };

  // Definir todas las pantallas posibles con sus permisos
  const MENU_ITEMS = [
    {
      label: 'Modo Hoy',
      href: '/hoy',
      icon: ClipboardList,
      roles: ['jardinero', 'director', 'admin'],
      desc: 'Checklist de tareas del día'
    },
    {
      label: 'En Vivo',
      href: '/dashboard',
      icon: Activity,
      roles: ['jardinero', 'director', 'admin'],
      desc: 'Sensores en tiempo real'
    },
    {
      label: 'Vista Nerd',
      href: '/informe',
      icon: LineChart,
      roles: ['director', 'admin'],
      desc: 'Informe y análisis de desvíos'
    },
    {
      label: 'Plantillas',
      href: '/plantillas',
      icon: BookOpen,
      roles: ['director', 'admin'],
      desc: 'Planes estándar de cultivo'
    },
    {
      label: 'Trazabilidad',
      href: '/trazabilidad',
      icon: QrCode,
      roles: ['director', 'admin'], // Director puede verla según spec
      desc: 'Semilla a paciente (INASE)'
    },
    {
      label: 'Madres y Cepa',
      href: '/madres',
      icon: Sprout,
      roles: ['director', 'admin'],
      desc: 'Catálogo de genética'
    },
  ];

  // Filtrar items según rol activo
  const filteredMenuItems = MENU_ITEMS.filter(item => item.roles.includes(activeRole));

  return (
    <div className="min-h-screen flex flex-col bg-[#1f1e1d] text-[#f4f1ea] select-none">
      
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 w-full bg-[#1f1e1d] border-b border-[#3a3938] px-4 md:px-8 py-3 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded flex items-center justify-center border border-[#3a3938] bg-[#2a2928]">
            <Sprout className="w-5 h-5 text-[#849d85]" />
          </div>
          <div>
            <span className="font-serif font-bold text-xl tracking-wide text-[#f4f1ea]">
              CANNIS
            </span>
            <span className="hidden sm:block text-[10px] text-[#a3a19e] font-medium tracking-widest uppercase -mt-1">
              Cultivo Intelligence
            </span>
          </div>
        </div>

        {/* Role switcher & Profile */}
        <div className="flex items-center gap-3">
          
          {/* Simulador de Rol (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#2a2928] p-1 rounded border border-[#3a3938]">
            <span className="text-[10px] text-muted-foreground uppercase px-2 font-medium">Simular:</span>
            <button
              onClick={() => setActiveRole('jardinero')}
              className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                activeRole === 'jardinero' 
                  ? 'bg-[#1f1e1d] text-phase-propagacion border border-[#3a3938]' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Jardinero
            </button>
            <button
              onClick={() => setActiveRole('director')}
              className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                activeRole === 'director' 
                  ? 'bg-[#1f1e1d] text-phase-floracion border border-[#3a3938]' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Director
            </button>
            <button
              onClick={() => setActiveRole('admin')}
              className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                activeRole === 'admin' 
                  ? 'bg-[#1f1e1d] text-[#d4a373] border border-[#3a3938]' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Selector de Rol Compacto (Mobile) */}
          <div className="sm:hidden">
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as any)}
              className="text-xs bg-[#2a2928] border border-[#3a3938] rounded px-2 py-1.5 focus:outline-none focus:border-[#849d85] font-medium"
            >
              <option value="jardinero">Jardinero</option>
              <option value="director">Director</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Perfil Indicador */}
          <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-full transition-all text-xs font-semibold ${ROL_INFO[activeRole].color}`}>
            <User className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{ROL_INFO[activeRole].nombre}</span>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 relative">
        
        {/* 2. DESKTOP SIDEBAR MENU */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-[#3a3938] bg-[#1f1e1d] p-6 space-y-6 sticky top-[57px] h-[calc(100vh-57px)]">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase px-3 block">
              Menú Principal
            </span>
            <nav className="space-y-1 pt-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors group ${
                      isActive 
                        ? 'bg-[#2a2928] text-foreground border border-[#3a3938]' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-[#2a2928]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-transform ${isActive ? 'text-[#849d85]' : 'text-muted-foreground'}`} />
                    <div>
                      <span>{item.label}</span>
                      <span className="text-[10px] text-muted-foreground block font-normal leading-tight mt-0.5">
                        {item.desc}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-[#3a3938] pt-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 px-3">
              <Layers className="w-3.5 h-3.5 text-[#849d85]" />
              <span>Versión 1.0 (MVP)</span>
            </div>
            <p className="px-3 leading-normal">
              Sección agronómica activa en modo simulación de datos local.
            </p>
          </div>
        </aside>

        {/* 3. CORE PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-8 pt-6 md:pt-8 overflow-y-auto pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* 4. MOBILE BOTTOM NAVIGATION */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1f1e1d] border-t border-[#3a3938] px-2 py-2 flex items-center justify-around">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center min-h-[52px] px-4 rounded transition-colors ${
                  isActive 
                    ? 'text-[#f4f1ea] font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5.5 h-5.5 mb-1 ${isActive ? 'text-[#849d85]' : 'text-muted-foreground'}`} />
                <span className="text-[10px] tracking-tight">{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#849d85]" />
                )}
              </Link>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
