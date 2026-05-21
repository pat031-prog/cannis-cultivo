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
    <div className="min-h-screen bg-[#090d10] text-[#f1f5f9] flex flex-col relative overflow-hidden font-sans">
      
      {/* BACKGROUND NEON GLOW BLOB 1 (Emerald) */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      
      {/* BACKGROUND NEON GLOW BLOB 2 (Purple) */}
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* TOP HEADER */}
      <header className="w-full glass border-b border-[#1e293b] px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <Sprout className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              CANNIS
            </span>
            <span className="text-[10px] block text-emerald-500 font-semibold tracking-widest uppercase -mt-1">
              Cultivo Intelligence
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-[#10161d] border border-[#1e293b] rounded-full px-3 py-1 font-semibold uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline mr-1" />
          Pre-seeded Local Storage MVP
        </div>
      </header>

      {/* MAIN HERO CONTENT */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-16 max-w-6xl mx-auto z-10 w-full">
        
        {/* Hero Headline */}
        <div className="text-center space-y-4 max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} /> 
            Smart Cultivation Portal
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-[#94a3b8] bg-clip-text text-transparent leading-none">
            La Próxima Generación de Inteligencia Agronómica
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Plataforma híbrida diseñada con UX de consumidor premium para el seguimiento del plan agronómico (Seed-to-Sale), 
            control analítico de desvíos, telemetría IoT virtualizada y cumplimiento legal inmutable.
          </p>
        </div>

        {/* ROLE CARDS CONTAINER (3-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-16">
          
          {/* 1. JARDINERO CARD */}
          <button
            onClick={() => handleRoleSelect('jardinero', '/hoy')}
            className="group relative text-left bg-[#10161d]/60 border border-[#1e293b] rounded-3xl p-6 md:p-8 hover:border-emerald-500/40 hover:bg-[#10161d]/90 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 transform hover:-translate-y-1.5 focus:outline-none"
          >
            {/* Top Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-all">
              <ClipboardList className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>

            {/* Title & Desc */}
            <h3 className="text-lg font-extrabold text-white mb-2 uppercase tracking-wide">
              Módulo de Campo
            </h3>
            <span className="text-xs text-emerald-400 font-bold block mb-4">
              ROL: JARDINERO
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Checklist interactivo (Modo Hoy), visualización del progreso del riego, ingreso rápido de pH, EC y registro fotográfico en carpas.
            </p>

            {/* Action link */}
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-auto pt-4 border-t border-[#1e293b]/60 w-full group-hover:text-emerald-300">
              Ingresar a Modo Hoy 
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 2. DIRECTOR CARD */}
          <button
            onClick={() => handleRoleSelect('director', '/dashboard')}
            className="group relative text-left bg-[#10161d]/60 border border-[#1e293b] rounded-3xl p-6 md:p-8 hover:border-purple-500/40 hover:bg-[#10161d]/90 hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-300 transform hover:-translate-y-1.5 focus:outline-none"
          >
            {/* Top Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-all">
              <Activity className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>

            {/* Title & Desc */}
            <h3 className="text-lg font-extrabold text-white mb-2 uppercase tracking-wide">
              Dirección de Cultivo
            </h3>
            <span className="text-xs text-purple-400 font-bold block mb-4">
              ROL: DIRECTOR AGRONÓMICO
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Monitoreo analítico de desvíos (pH/EC), dashboard en vivo con semáforos, telemetría IoT de carpas y modelador visual de curvas agronómicas.
            </p>

            {/* Action link */}
            <div className="flex items-center gap-1.5 text-xs text-purple-400 font-bold mt-auto pt-4 border-t border-[#1e293b]/60 w-full group-hover:text-purple-300">
              Ver Dashboard En Vivo
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 3. ADMIN COMPLIANCE CARD */}
          <button
            onClick={() => handleRoleSelect('admin', '/trazabilidad')}
            className="group relative text-left bg-[#10161d]/60 border border-[#1e293b] rounded-3xl p-6 md:p-8 hover:border-amber-500/40 hover:bg-[#10161d]/90 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 transform hover:-translate-y-1.5 focus:outline-none"
          >
            {/* Top Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-all">
              <QrCode className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>

            {/* Title & Desc */}
            <h3 className="text-lg font-extrabold text-white mb-2 uppercase tracking-wide">
              Trazabilidad Legal
            </h3>
            <span className="text-xs text-amber-400 font-bold block mb-4">
              ROL: COMPLIANCE ADMIN
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Rastreo inmutable de la semilla al paciente, búsqueda de precintos, mapa histórico de procedencia INASE y generación de manifiestos oficiales de transporte.
            </p>

            {/* Action link */}
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mt-auto pt-4 border-t border-[#1e293b]/60 w-full group-hover:text-amber-300">
              Generar Manifiesto Legal
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

        </div>

        {/* BOTTOM REAL-TIME SUMMARY STATS PANEL */}
        <div className="w-full bg-[#10161d]/40 border border-[#1e293b]/80 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Carpas Monitoreadas</span>
            <div className="flex items-center justify-center gap-1 text-white font-extrabold text-lg">
              <Sprout className="w-4 h-4 text-emerald-500" />
              3 Lotes Activos
            </div>
          </div>

          <div className="space-y-1 border-l border-[#1e293b]/60 sm:border-l">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Agua Suministrada (Semana)</span>
            <div className="flex items-center justify-center gap-1 text-white font-extrabold text-lg">
              <Droplet className="w-4 h-4 text-cyan-400" />
              36.8 Litros
            </div>
          </div>

          <div className="space-y-1 border-l border-[#1e293b]/60 sm:border-l">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Temperatura Media</span>
            <div className="flex items-center justify-center gap-1 text-white font-extrabold text-lg">
              <Thermometer className="w-4 h-4 text-orange-500" />
              24.2°C Promedio
            </div>
          </div>

          <div className="space-y-1 border-l border-[#1e293b]/60 sm:border-l">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Cumplimiento Legal</span>
            <div className="flex items-center justify-center gap-1 text-emerald-400 font-extrabold text-lg">
              <Percent className="w-4 h-4 text-emerald-500" />
              100% INASE OK
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full text-center py-6 text-xs text-muted-foreground border-t border-[#1e293b] glass mt-auto z-10">
        <p>© 2026 Cannis intelligence Inc. Diseñado para control agronómico y cumplimiento regulatorio estricto.</p>
      </footer>

    </div>
  );
}
