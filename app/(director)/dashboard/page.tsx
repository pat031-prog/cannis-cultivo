'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/lib/context/AppContext';
import { mockDb, Lote, Ubicacion } from '@/lib/supabase/mockDb';
import { 
  Activity, 
  Sprout, 
  AlertTriangle, 
  CheckCircle, 
  Thermometer, 
  Droplet, 
  Sun, 
  Plus, 
  Layers, 
  Calendar,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  LineChart,
  User,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

// ─── VPD Helpers ────────────────────────────────────────────────────────────

function calcVPD(temp: number, humidity: number): number {
  return 0.6108 * Math.exp(17.27 * temp / (temp + 237.3)) * (1 - humidity / 100);
}

function vpdColor(vpd: number): string {
  if (vpd < 0.4) return 'text-blue-400';
  if (vpd < 0.8) return 'text-emerald-400';
  if (vpd <= 1.2) return 'text-emerald-400';
  if (vpd <= 1.6) return 'text-amber-400';
  return 'text-red-400';
}

function vpdGlowClass(vpd: number): string {
  if (vpd < 0.4) return 'drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]';
  if (vpd <= 1.2) return 'drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]';
  if (vpd <= 1.6) return 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]';
  return 'drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]';
}

function vpdLabel(vpd: number): string {
  if (vpd < 0.4) return 'Demasiado bajo';
  if (vpd < 0.8) return 'Óptimo vegetativo';
  if (vpd <= 1.2) return 'Óptimo floración';
  if (vpd <= 1.6) return 'Alto';
  return 'Peligro — demasiado alto';
}

// ─── Deterministic Sparkline ─────────────────────────────────────────────────

function deterministicSparkline(loteId: string, base: number, length = 12): number[] {
  // Use char codes of loteId as seed, no Math.random()
  const seed = loteId.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  return Array.from({ length }, (_, i) => {
    const angle = i * 0.8 + (seed % 100) * 0.01;
    const wave = Math.sin(angle) * 1.5;
    // pseudo-random deterministic noise: use sin of a different frequency
    const noise = Math.sin(angle * 3.7 + seed * 0.001) * 0.4;
    return base + wave + noise;
  });
}

function buildPolylinePoints(values: number[], w = 120, h = 30): string {
  if (values.length < 2) return '';
  const minV = Math.min(...values) - 0.5;
  const maxV = Math.max(...values) + 0.5;
  const range = maxV - minV || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - minV) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

// ─── Sub-metric chip progress bar ────────────────────────────────────────────

function progressPercent(value: number, min: number, max: number): number {
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

// ─── Semáforo LED ─────────────────────────────────────────────────────────────

function LedSemaforo({ estado }: { estado: 'green' | 'amber' | 'red' }) {
  const cfg = {
    green: { bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/60' },
    amber: { bg: 'bg-amber-400',   shadow: 'shadow-amber-400/60' },
    red:   { bg: 'bg-red-500',     shadow: 'shadow-red-500/60' },
  }[estado];

  return (
    <span
      className={`
        inline-block w-2.5 h-2.5 rounded-full animate-pulse shadow-lg
        ${cfg.bg} ${cfg.shadow}
      `}
    />
  );
}

// ─── Sensor Sub-Metric Chip ───────────────────────────────────────────────────

function SensorChip({
  icon,
  value,
  unit,
  min,
  max,
  barColor = 'bg-emerald-500',
}: {
  icon: React.ReactNode;
  value: number;
  unit: string;
  min: number;
  max: number;
  barColor?: string;
}) {
  const pct = progressPercent(value, min, max);
  return (
    <div className="flex-1 min-w-0 bg-[#090d10]/60 border border-[#1e293b]/80 rounded-xl p-2.5 flex flex-col gap-1.5 min-h-[44px]">
      <div className="flex items-center gap-1">
        {icon}
        <span className="font-bold text-sm text-foreground leading-none">{value.toFixed(1)}</span>
        <span className="text-[10px] text-muted-foreground leading-none">{unit}</span>
      </div>
      {/* progress bar */}
      <div className="h-1 w-full rounded-full bg-[#1e293b]">
        <div
          className={`h-1 rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Carpa Card ───────────────────────────────────────────────────────────────

function CarpaCard({ carpa }: { carpa: any }) {
  const { estadoSemaforo, sensores, lote, ubicacion, genetica, fase, semana, dia, totalDesvios } = carpa;

  const temp: number = sensores.temp.actual;
  const humidity: number = sensores.humedad.actual;
  const vpd = calcVPD(temp, humidity);

  // Sparkline data (deterministic, based on lote.id)
  const sparkPoints = deterministicSparkline(lote.id, temp);
  const polyline = buildPolylinePoints(sparkPoints);

  // Card border/glow based on semáforo state
  const borderClass =
    estadoSemaforo === 'red'
      ? 'border-red-500/40 shadow-red-950/10'
      : estadoSemaforo === 'amber'
      ? 'border-amber-500/30 shadow-amber-950/10'
      : 'border-[#1e293b] hover:border-emerald-500/20';

  // Sparkline stroke color
  const sparkStroke =
    estadoSemaforo === 'red' ? '#ef4444' : estadoSemaforo === 'amber' ? '#f59e0b' : '#10b981';

  const { setSelectedLoteId } = useAppContext();

  return (
    <div
      className={`
        snap-center min-w-[280px] flex-shrink-0
        md:min-w-0 md:flex-shrink
        bg-[#10161d] border rounded-2xl p-5 flex flex-col min-h-[280px]
        relative overflow-hidden group shadow-lg transition-all
        ${borderClass}
      `}
    >
      {/* Top accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] ${
          estadoSemaforo === 'red'
            ? 'bg-gradient-to-r from-red-500 to-red-400'
            : estadoSemaforo === 'amber'
            ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
            : 'bg-gradient-to-r from-emerald-600 to-teal-500'
        }`}
      />

      {/* ── HEADER: title + LED ── */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="font-bold text-xs tracking-wide text-foreground truncate">
              {ubicacion?.posicion}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              ({ubicacion?.sala})
            </span>
          </div>
          <h3 className="font-extrabold text-sm text-foreground group-hover:text-emerald-400 transition-colors leading-tight truncate">
            {genetica?.nombre ?? 'Sin genética'}
          </h3>
          <span className="text-[10px] text-muted-foreground block">
            Lote: <b>{lote.codigo}</b> · Sem <b>{semana}</b> D<b>{dia}</b> · {fase}
          </span>
        </div>

        {/* LED semáforo */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <LedSemaforo estado={estadoSemaforo} />
          <span
            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border ${
              estadoSemaforo === 'red'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : estadoSemaforo === 'amber'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {estadoSemaforo === 'red' ? 'ALERTA' : estadoSemaforo === 'amber' ? 'DESVÍO' : 'OK'}
          </span>
        </div>
      </div>

      {/* ── VPD HERO METRIC ── */}
      <div className="flex flex-col items-center justify-center py-3 border-y border-[#1e293b]/50 mb-3">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
          VPD
        </span>
        <span
          className={`text-5xl font-black leading-none tabular-nums ${vpdColor(vpd)} ${vpdGlowClass(vpd)}`}
        >
          {vpd.toFixed(2)}
        </span>
        <span className="text-[10px] text-muted-foreground mt-1 font-medium">
          {vpdLabel(vpd)}
        </span>
        <span className="text-[9px] text-muted-foreground/60 mt-0.5">
          rango óptimo: 0.8 – 1.2 kPa
        </span>
      </div>

      {/* ── SENSOR SUB-METRICS (3 chips) ── */}
      <div className="flex gap-2 mb-3">
        {/* Temperature chip */}
        <SensorChip
          icon={<Thermometer className="w-3 h-3 text-orange-400 shrink-0" />}
          value={temp}
          unit="°C"
          min={15}
          max={35}
          barColor={
            Math.abs(temp - sensores.temp.esperado) >= 3 ? 'bg-amber-400' : 'bg-orange-400'
          }
        />
        {/* Humidity chip */}
        <SensorChip
          icon={<Droplet className="w-3 h-3 text-blue-400 shrink-0" />}
          value={humidity}
          unit="%"
          min={30}
          max={90}
          barColor={
            Math.abs(humidity - sensores.humedad.esperado) >= 10 ? 'bg-amber-400' : 'bg-blue-400'
          }
        />
        {/* CO2 / Luz chip (static) */}
        <SensorChip
          icon={<Sun className="w-3 h-3 text-emerald-400 shrink-0" />}
          value={420}
          unit="ppm"
          min={300}
          max={1200}
          barColor="bg-emerald-500"
        />
      </div>

      {/* ── SPARKLINE (deterministic, temp history) ── */}
      <div className="w-full mb-3">
        <svg
          viewBox="0 0 120 30"
          preserveAspectRatio="none"
          className="w-full h-[30px]"
          aria-hidden="true"
        >
          {/* Subtle gradient fill under the line */}
          <defs>
            <linearGradient id={`spark-fill-${lote.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={sparkStroke} stopOpacity="0.2" />
              <stop offset="100%" stopColor={sparkStroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Area fill */}
          {polyline && (
            <polygon
              points={`0,30 ${polyline} 120,30`}
              fill={`url(#spark-fill-${lote.id})`}
            />
          )}
          {/* Line */}
          <polyline
            fill="none"
            stroke={sparkStroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polyline}
          />
          {/* Current dot */}
          {sparkPoints.length > 0 && (() => {
            const lastIdx = sparkPoints.length - 1;
            const lastY = 30 - ((sparkPoints[lastIdx] - Math.min(...sparkPoints) + 0.5) / (Math.max(...sparkPoints) - Math.min(...sparkPoints) + 1)) * 30;
            return <circle cx="120" cy={lastY.toFixed(1)} r="2.5" fill={sparkStroke} />;
          })()}
        </svg>
        <div className="flex justify-between mt-0.5 px-0.5">
          <span className="text-[8px] text-muted-foreground/50">Historial temp.</span>
          <span className="text-[8px] text-muted-foreground/50">{temp.toFixed(1)}°C ahora</span>
        </div>
      </div>

      {/* ── FOOTER: desvíos + link ── */}
      <div className="mt-auto border-t border-[#1e293b]/50 pt-2.5 flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground">
          {totalDesvios} desvíos en ciclo
        </span>
        <Link
          href="/informe"
          onClick={() => setSelectedLoteId(lote.id)}
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group/btn min-h-[44px] flex items-center"
        >
          <span>Ver Informe</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DirectorDashboardPage() {
  const { lotes, recargarLotes, setSelectedLoteId } = useAppContext();
  
  const [carpasData, setCarpasData] = useState<any[]>([]);
  const [desviosHoy, setDesviosHoy] = useState<any[]>([]);
  
  const [showLaunchForm, setShowLaunchForm] = useState(false);
  const [nuevaGenetica, setNuevaGenetica] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');
  const [nuevaPlantilla, setNuevaPlantilla] = useState('');
  const [cantPlantas, setCantPlantas] = useState(12);
  const [colorPrecinto, setColorPrecinto] = useState<'verde' | 'amarillo' | 'azul' | 'rojo' | 'morado'>('verde');

  const fechaHoy = '2026-05-21';

  const cargarDatos = () => {
    const list = lotes.map(l => {
      const ubi = mockDb.ubicaciones.find(u => u.id === l.ubicacion_id);
      const gen = mockDb.geneticas.find(g => g.id === l.plantilla_id || g.id === 'gen-1');
      const sensores = mockDb.getSensoresEnVivo(l.ubicacion_id);
      
      const diaCiclo = mockDb.calcularDiaDeCiclo(l.fecha_inicio, fechaHoy);
      const sem = Math.floor((diaCiclo - 1) / 7) + 1;
      const dia = ((diaCiclo - 1) % 7) + 1;
      
      const plan = mockDb.plantillas.find(p => p.id === l.plantilla_id);
      const diaPlan = plan?.dias?.find(d => d.semana === sem && d.dia === dia);
      const fase = diaPlan?.fase || 'vegetativo';

      const desvios = mockDb.getDesviosLote(l.id);
      const desviosRecientes = desvios.filter(d => d.fecha === fechaHoy);
      
      let estadoSemaforo: 'green' | 'amber' | 'red' = 'green';
      if (desviosRecientes.some(d => d.gravedadGeneral === 'grave')) {
        estadoSemaforo = 'red';
      } else if (desviosRecientes.some(d => d.gravedadGeneral === 'moderada' || d.gravedadGeneral === 'leve')) {
        estadoSemaforo = 'amber';
      }

      const tempFuera = Math.abs(sensores.temp.actual - sensores.temp.esperado) >= 3;
      const humFuera = Math.abs(sensores.humedad.actual - sensores.humedad.esperado) >= 10;
      
      if (tempFuera || humFuera) {
        estadoSemaforo = Math.max(estadoSemaforo === 'red' ? 2 : 1, 1) === 2 ? 'red' : 'amber';
      }

      return {
        lote: l,
        ubicacion: ubi,
        genetica: gen,
        fase,
        semana: sem,
        dia: dia,
        sensores,
        estadoSemaforo,
        totalDesvios: desvios.length,
        desviosHoy: desviosRecientes
      };
    });

    setCarpasData(list);

    const desviosTotales: any[] = [];
    lotes.forEach(l => {
      const loteDesvios = mockDb.getDesviosLote(l.id).filter(d => d.fecha === fechaHoy);
      const gen = mockDb.geneticas.find(g => g.id === l.plantilla_id || g.id === 'gen-1');
      const ubi = mockDb.ubicaciones.find(u => u.id === l.ubicacion_id);

      loteDesvios.forEach(d => {
        desviosTotales.push({
          ...d,
          geneticaNombre: gen?.nombre,
          carpaNombre: ubi?.posicion,
        });
      });
    });
    setDesviosHoy(desviosTotales);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      cargarDatos();
    }, 0);
    const interval = setInterval(() => {
      cargarDatos();
    }, 5000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [lotes]);

  const handleLaunchLote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaGenetica || !nuevaUbicacion || !nuevaPlantilla) {
      alert('Por favor completa todos los campos.');
      return;
    }

    mockDb.crearLote({
      plantilla_id: nuevaPlantilla,
      ubicacion_id: nuevaUbicacion,
      fecha_inicio: fechaHoy,
      responsable_id: 'usr-2',
    }, cantPlantas, colorPrecinto);

    recargarLotes();
    setShowLaunchForm(false);
    
    setNuevaGenetica('');
    setNuevaUbicacion('');
    setNuevaPlantilla('');

    alert('¡Lote lanzado con éxito! Se han generado las plantas individuales y sus precintos de trazabilidad en Supabase.');
  };

  const carpasDisponibles = mockDb.ubicaciones.filter(
    u => u.tipo === 'carpa' && !lotes.some(l => l.ubicacion_id === u.id && l.estado === 'activo')
  );

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. TOP HEADER & ACCIONES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" />
            Dashboard General
          </h1>
          <p className="text-muted-foreground text-sm">
            Supervisión agronómica de carpas y telemetría de sensores en vivo.
          </p>
        </div>
        
        <button
          onClick={() => setShowLaunchForm(!showLaunchForm)}
          className="self-start sm:self-center min-h-[44px] py-2 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-900 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4 text-slate-900" />
          <span>Lanzar Lote de Cultivo</span>
        </button>
      </div>

      {/* 2. FORMULARIO MODAL SIMULADO: LANZAR NUEVO LOTE */}
      {showLaunchForm && (
        <div className="bg-[#10161d] border border-emerald-500/30 p-6 rounded-2xl shadow-xl space-y-4 animate-ring-grow relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          
          <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]">
            <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
              <Sprout className="w-5 h-5 text-emerald-500" />
              Lanzar Nuevo Lote en Producción
            </h3>
            <button
              onClick={() => setShowLaunchForm(false)}
              className="text-xs text-muted-foreground hover:text-foreground min-h-[44px] px-2"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleLaunchLote} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Genética de Cepa</label>
              <select
                value={nuevaPlantilla}
                onChange={(e) => {
                  setNuevaPlantilla(e.target.value);
                  const p = mockDb.plantillas.find(pl => pl.id === e.target.value);
                  setNuevaGenetica(p?.genetica_id || '');
                }}
                className="w-full bg-[#090d10] border border-[#1e293b] text-sm text-foreground rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="">Selecciona plantilla del plan...</option>
                {mockDb.plantillas.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Ubicación (Carpa Vacía)</label>
              <select
                value={nuevaUbicacion}
                onChange={(e) => setNuevaUbicacion(e.target.value)}
                className="w-full bg-[#090d10] border border-[#1e293b] text-sm text-foreground rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="">Selecciona carpa disponible...</option>
                {carpasDisponibles.map(c => (
                  <option key={c.id} value={c.id}>{c.posicion} ({c.sala}) - Capacidad {c.capacidad} macetas</option>
                ))}
                {carpasDisponibles.length === 0 && (
                  <option disabled>No hay carpas vacías disponibles.</option>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Cantidad de Especímenes</label>
              <input
                type="number"
                min="1"
                max="48"
                value={cantPlantas}
                onChange={(e) => setCantPlantas(Number(e.target.value))}
                className="w-full bg-[#090d10] border border-[#1e293b] text-sm font-semibold text-foreground rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Color de Precinto Físico (INASE)</label>
              <select
                value={colorPrecinto}
                onChange={(e) => setColorPrecinto(e.target.value as any)}
                className="w-full bg-[#090d10] border border-[#1e293b] text-sm text-foreground rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="verde">Verde (Propagación / CBD)</option>
                <option value="amarillo">Amarillo (Vegetativo)</option>
                <option value="morado">Morado (Floración / THC)</option>
                <option value="azul">Azul (Madres / Clones)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Responsable Asignado</label>
              <div className="w-full bg-[#090d10]/40 border border-[#1e293b]/70 text-sm text-muted-foreground rounded-lg px-3 py-2 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-500" />
                <span>Juan (Jardinero Core)</span>
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full min-h-[44px] py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/10"
              >
                Generar Precintos e Iniciar Ciclo
              </button>
            </div>

          </form>
        </div>
      )}

      {/* 3. GRILLA PRINCIPAL DE CARPAS */}
      <div>
        {/* Mobile: horizontal scroll with snap */}
        <div className="md:hidden overflow-x-auto flex gap-4 snap-x snap-mandatory pb-4 -mx-4 px-4">
          {carpasData.map((carpa) => (
            <CarpaCard key={carpa.lote.id} carpa={carpa} />
          ))}
          {carpasData.length === 0 && (
            <div className="min-w-[280px] snap-center flex items-center justify-center p-8 bg-[#10161d] border border-dashed border-[#1e293b] rounded-2xl text-muted-foreground text-xs text-center">
              No hay carpas activas.
            </div>
          )}
        </div>

        {/* Desktop: responsive grid */}
        <div
          className={`hidden md:grid gap-6 ${
            carpasData.length === 1
              ? 'grid-cols-1 max-w-sm'
              : carpasData.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {carpasData.map((carpa) => (
            <CarpaCard key={carpa.lote.id} carpa={carpa} />
          ))}
        </div>
      </div>

      {/* 4. PANEL INFERIOR: FEED DE DESVÍOS */}
      <div className="bg-[#10161d] border border-[#1e293b] p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <div>
            <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Feed de Desvíos del Día (Tabaré Review)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comparación automática real vs planificada proveniente del Modo Hoy del Jardinero.
            </p>
          </div>
          <span className="text-xs bg-[#090d10] border border-[#1e293b] px-3 py-1.5 rounded-lg text-muted-foreground font-bold">
            Total Hoy: {desviosHoy.length} alertas
          </span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
          {desviosHoy.map((desvio, idx) => {
            const esGrave = desvio.gravedadGeneral === 'grave';
            const esModerado = desvio.gravedadGeneral === 'moderada';
            
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-[#131b24] ${
                  esGrave ? 'border-red-500/20 bg-red-950/[0.01]' : 
                  esModerado ? 'border-amber-500/20 bg-amber-950/[0.01]' : 
                  'border-[#1e293b] bg-[#090d10]/40'
                }`}
              >
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground tracking-wide">{desvio.carpaNombre}</span>
                    <span className="text-[10px] text-muted-foreground font-bold bg-[#10161d] px-2 py-0.5 rounded border border-[#1e293b]">
                      {desvio.geneticaNombre}
                    </span>
                    <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                      esGrave ? 'text-red-400 bg-red-500/10' :
                      esModerado ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-500/10'
                    }`}>
                      {desvio.gravedadGeneral}
                    </span>
                  </div>
                  
                  <div className="text-xs text-foreground font-semibold flex items-center gap-1.5 pt-0.5">
                    {desvio.tipoDesvio === 'no_realizada' ? (
                      <span className="text-red-400">Tarea obligatoria de <b>{desvio.accionTipo}</b> no fue realizada por el Jardinero.</span>
                    ) : desvio.tipoDesvio === 'extra' ? (
                      <span className="text-emerald-400">Se realizó una labor extra de <b>{desvio.accionTipo}</b> fuera del plan.</span>
                    ) : (
                      <span>
                        Parámetros excedidos en <b>{desvio.accionTipo}</b>:{' '}
                        {desvio.desviosCampos.map((dc: any, dIdx: number) => (
                          <span key={dIdx} className="text-amber-400 font-bold ml-1">
                            [{dc.campo}: {dc.real} vs {dc.esperado} (Dif: {dc.magnitud > 0 ? `+${dc.magnitud}` : dc.magnitud})]
                          </span>
                        ))}
                      </span>
                    )}
                  </div>

                  {desvio.notas && (
                    <p className="text-[11px] text-muted-foreground leading-normal italic pl-3 border-l-2 border-[#1e293b] mt-1.5">
                      &ldquo;{desvio.notas}&rdquo; — Jardinero Log
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Hora de registro</span>
                    <span className="text-xs font-bold text-foreground">09:30 AM</span>
                  </div>
                </div>

              </div>
            );
          })}

          {desviosHoy.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-xs border border-dashed border-[#1e293b] rounded-xl bg-[#090d10]/20 space-y-1">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto opacity-40 mb-1" />
              <p className="font-bold text-foreground">¡Todo en perfecto orden hoy!</p>
              <p>No se han registrado desvíos agronómicos o ambientales en la jornada actual.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
