'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/context/AppContext';
import { 
  Sprout, 
  ClipboardList, 
  Activity, 
  QrCode, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Thermometer, 
  Droplet,
  Percent
} from 'lucide-react';

export default function Home() {
  const { setActiveRole } = useAppContext();
  const router = useRouter();

  const handleRoleSelect = (role: 'jardinero' | 'director' | 'admin', targetUrl: string) => {
    setActiveRole(role);
    router.push(targetUrl);
  };

  return (
    <div className="min-h-screen bg-[#1f1e1d] text-[#f4f1ea] flex flex-col relative font-sans">
      
      {/* TOP HEADER */}
      <header className="w-full bg-[#1f1e1d] border-b border-[#3a3938] px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded flex items-center justify-center border border-[#3a3938] bg-[#2a2928]">
            <Sprout className="w-5 h-5 text-[#849d85]" />
          </div>
          <div>
            <span className="font-serif font-bold text-xl tracking-wide text-[#f4f1ea]">
              CANNIS
            </span>
            <span className="text-[10px] block text-[#a3a19e] font-medium tracking-widest uppercase -mt-1">
              Cultivo Intelligence
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-[#2a2928] border border-[#3a3938] rounded px-3 py-1 font-medium uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-[#849d85] inline mr-1" />
          Pre-seeded Local Storage MVP
        </div>
      </header>

      {/* MAIN HERO CONTENT */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-16 max-w-6xl mx-auto z-10 w-full">
        
        {/* Hero Headline */}
        <div className="text-center space-y-4 max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 bg-[#2a2928] text-[#849d85] border border-[#3a3938] px-3.5 py-1 rounded text-xs font-medium uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} /> 
            Smart Cultivation Portal
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-normal tracking-tight text-[#f4f1ea] leading-tight">
            La Próxima Generación de Inteligencia Agronómica
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Plataforma híbrida diseñada con UX de consumidor premium para el seguimiento del plan agronómico (Seed-to-Sale), 
            control analítico de desvíos, telemetría IoT virtualizada y cumplimiento legal inmutable.
          </p>
        </div>

        {/* ROLE CARDS CONTAINER (3-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-16">
          
          {/* 1. JARDINERO CARD */}
          <button
            onClick={() => handleRoleSelect('jardinero', '/hoy')}
            className="group relative text-left bg-[#2a2928] border border-[#3a3938] rounded p-6 md:p-8 hover:bg-[#3a3938] transition-colors focus:outline-none flex flex-col"
          >
            {/* Top Icon Badge */}
            <div className="w-10 h-10 rounded bg-[#1f1e1d] border border-[#3a3938] flex items-center justify-center mb-6">
              <ClipboardList className="w-5 h-5 text-[#849d85]" />
            </div>

            {/* Title & Desc */}
            <h3 className="font-serif text-lg font-medium text-[#f4f1ea] mb-2 tracking-wide">
              Módulo de Campo
            </h3>
            <span className="text-xs text-[#849d85] font-medium block mb-4">
              ROL: JARDINERO
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6 flex-1">
              Checklist interactivo (Modo Hoy), visualización del progreso del riego, ingreso rápido de pH, EC y registro fotográfico en carpas.
            </p>

            {/* Action link */}
            <div className="flex items-center gap-1.5 text-xs text-[#849d85] font-medium mt-auto pt-4 border-t border-[#3a3938] w-full">
              Ingresar a Modo Hoy 
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* 2. DIRECTOR CARD */}
          <button
            onClick={() => handleRoleSelect('director', '/dashboard')}
            className="group relative text-left bg-[#2a2928] border border-[#3a3938] rounded p-6 md:p-8 hover:bg-[#3a3938] transition-colors focus:outline-none flex flex-col"
          >
            {/* Top Icon Badge */}
            <div className="w-10 h-10 rounded bg-[#1f1e1d] border border-[#3a3938] flex items-center justify-center mb-6">
              <Activity className="w-5 h-5 text-[#9d8a9f]" />
            </div>

            {/* Title & Desc */}
            <h3 className="font-serif text-lg font-medium text-[#f4f1ea] mb-2 tracking-wide">
              Dirección de Cultivo
            </h3>
            <span className="text-xs text-[#9d8a9f] font-medium block mb-4">
              ROL: DIRECTOR AGRONÓMICO
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6 flex-1">
              Monitoreo analítico de desvíos (pH/EC), dashboard en vivo con semáforos, telemetría IoT de carpas y modelador visual de curvas agronómicas.
            </p>

            {/* Action link */}
            <div className="flex items-center gap-1.5 text-xs text-[#9d8a9f] font-medium mt-auto pt-4 border-t border-[#3a3938] w-full">
              Ver Dashboard En Vivo
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* 3. ADMIN COMPLIANCE CARD */}
          <button
            onClick={() => handleRoleSelect('admin', '/trazabilidad')}
            className="group relative text-left bg-[#2a2928] border border-[#3a3938] rounded p-6 md:p-8 hover:bg-[#3a3938] transition-colors focus:outline-none flex flex-col"
          >
            {/* Top Icon Badge */}
            <div className="w-10 h-10 rounded bg-[#1f1e1d] border border-[#3a3938] flex items-center justify-center mb-6">
              <QrCode className="w-5 h-5 text-[#d4a373]" />
            </div>

            {/* Title & Desc */}
            <h3 className="font-serif text-lg font-medium text-[#f4f1ea] mb-2 tracking-wide">
              Trazabilidad Legal
            </h3>
            <span className="text-xs text-[#d4a373] font-medium block mb-4">
              ROL: COMPLIANCE ADMIN
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6 flex-1">
              Rastreo inmutable de la semilla al paciente, búsqueda de precintos, mapa histórico de procedencia INASE y generación de manifiestos oficiales de transporte.
            </p>

            {/* Action link */}
            <div className="flex items-center gap-1.5 text-xs text-[#d4a373] font-medium mt-auto pt-4 border-t border-[#3a3938] w-full">
              Generar Manifiesto Legal
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

        </div>

        {/* BOTTOM REAL-TIME SUMMARY STATS PANEL */}
        <div className="w-full bg-[#2a2928] border border-[#3a3938] rounded p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">Carpas Monitoreadas</span>
            <div className="flex items-center justify-center gap-1 text-[#f4f1ea] font-medium text-lg">
              <Sprout className="w-4 h-4 text-[#849d85]" />
              3 Lotes Activos
            </div>
          </div>

          <div className="space-y-1 border-l border-[#3a3938] sm:border-l">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">Agua Suministrada (Semana)</span>
            <div className="flex items-center justify-center gap-1 text-[#f4f1ea] font-medium text-lg">
              <Droplet className="w-4 h-4 text-[#7aa2a6]" />
              36.8 Litros
            </div>
          </div>

          <div className="space-y-1 border-l border-[#3a3938] sm:border-l">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">Temperatura Media</span>
            <div className="flex items-center justify-center gap-1 text-[#f4f1ea] font-medium text-lg">
              <Thermometer className="w-4 h-4 text-[#d97757]" />
              24.2°C Promedio
            </div>
          </div>

          <div className="space-y-1 border-l border-[#3a3938] sm:border-l">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">Cumplimiento Legal</span>
            <div className="flex items-center justify-center gap-1 text-[#849d85] font-medium text-lg">
              <Percent className="w-4 h-4 text-[#849d85]" />
              100% INASE OK
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full text-center py-6 text-xs text-muted-foreground border-t border-[#3a3938] bg-[#1f1e1d] mt-auto z-10">
        <p>© 2026 Cannis intelligence Inc. Diseñado para control agronómico y cumplimiento regulatorio estricto.</p>
      </footer>

    </div>
  );
}
