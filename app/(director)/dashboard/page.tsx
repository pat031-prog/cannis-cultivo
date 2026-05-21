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

export default function DirectorDashboardPage() {
  const { lotes, recargarLotes, setSelectedLoteId } = useAppContext();
  
  // Lista de todas las carpas y su telemetría asociada
  const [carpasData, setCarpasData] = useState<any[]>([]);
  const [desviosHoy, setDesviosHoy] = useState<any[]>([]);
  
  // Estados para el formulario de Lanzar Lote
  const [showLaunchForm, setShowLaunchForm] = useState(false);
  const [nuevaGenetica, setNuevaGenetica] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');
  const [nuevaPlantilla, setNuevaPlantilla] = useState('');
  const [cantPlantas, setCantPlantas] = useState(12);
  const [colorPrecinto, setColorPrecinto] = useState<'verde' | 'amarillo' | 'azul' | 'rojo' | 'morado'>('verde');

  const fechaHoy = '2026-05-21';

  const cargarDatos = () => {
    // 1. Cargar carpas activas
    const list = lotes.map(l => {
      const ubi = mockDb.ubicaciones.find(u => u.id === l.ubicacion_id);
      const gen = mockDb.geneticas.find(g => g.id === l.plantilla_id || g.id === 'gen-1');
      const sensores = mockDb.getSensoresEnVivo(l.ubicacion_id);
      
      // Calcular día de cultivo
      const diaCiclo = mockDb.calcularDiaDeCiclo(l.fecha_inicio, fechaHoy);
      const sem = Math.floor((diaCiclo - 1) / 7) + 1;
      const dia = ((diaCiclo - 1) % 7) + 1;
      
      // Obtener fase
      const plan = mockDb.plantillas.find(p => p.id === l.plantilla_id);
      const diaPlan = plan?.dias?.find(d => d.semana === sem && d.dia === dia);
      const fase = diaPlan?.fase || 'vegetativo';

      // Calcular desvíos para saber el color del semáforo
      const desvios = mockDb.getDesviosLote(l.id);
      const desviosRecientes = desvios.filter(d => d.fecha === fechaHoy);
      
      let estadoSemaforo: 'green' | 'amber' | 'red' = 'green';
      if (desviosRecientes.some(d => d.gravedadGeneral === 'grave')) {
        estadoSemaforo = 'red';
      } else if (desviosRecientes.some(d => d.gravedadGeneral === 'moderada' || d.gravedadGeneral === 'leve')) {
        estadoSemaforo = 'amber';
      }

      // Check de sensores fuera de rango
      const tempFuera = Math.abs(sensores.temp.actual - sensores.temp.esperado) >= 3;
      const humFuera = Math.abs(sensores.humedad.actual - sensores.humedad.esperado) >= 10;
      
      if (tempFuera || humFuera) {
        // Un sensor muy fuera de rango sube la alarma a rojo
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

    // 2. Acumular todos los desvíos del día
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
    // Simular telemetría en tiempo real: Actualizar cada 5 segundos
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

    // Crear Lote en mock db
    mockDb.crearLote({
      plantilla_id: nuevaPlantilla,
      ubicacion_id: nuevaUbicacion,
      fecha_inicio: fechaHoy,
      responsable_id: 'usr-2', // Juan jardinero por defecto
    }, cantPlantas, colorPrecinto);

    recargarLotes();
    setShowLaunchForm(false);
    
    // Limpiar formulario
    setNuevaGenetica('');
    setNuevaUbicacion('');
    setNuevaPlantilla('');

    alert('¡Lote lanzado con éxito! Se han generado las plantas individuales y sus precintos de trazabilidad en Supabase.');
  };

  // Carpas vacías disponibles para lanzar lote
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
        
        {/* Lanzar lote botón */}
        <button
          onClick={() => setShowLaunchForm(!showLaunchForm)}
          className="self-start sm:self-center py-2 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-900 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
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
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleLaunchLote} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Selección de Genética */}
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

            {/* Selección de Carpa */}
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

            {/* Cantidad de Plantas */}
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

            {/* Color de Precinto */}
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

            {/* Asignación de Jardinero */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Responsable Asignado</label>
              <div className="w-full bg-[#090d10]/40 border border-[#1e293b]/70 text-sm text-muted-foreground rounded-lg px-3 py-2 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-500" />
                <span>Juan (Jardinero Core)</span>
              </div>
            </div>

            {/* Botón de Envío */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/10"
              >
                Generar Precintos e Iniciar Ciclo
              </button>
            </div>

          </form>
        </div>
      )}

      {/* 3. GRILLA PRINCIPAL DE CARPAS CON SEMÁFOROS Y SENSORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {carpasData.map((carpa) => {
          const isRed = carpa.estadoSemaforo === 'red';
          const isAmber = carpa.estadoSemaforo === 'amber';
          
          return (
            <div
              key={carpa.lote.id}
              className={`bg-[#10161d] border rounded-2xl p-5 space-y-5 transition-all relative overflow-hidden group shadow-lg ${
                isRed ? 'border-red-500/30 bg-red-950/[0.01] hover:border-red-500/40 shadow-red-950/5' : 
                isAmber ? 'border-amber-500/30 bg-amber-950/[0.01] hover:border-amber-500/40 shadow-amber-950/5' : 
                'border-[#1e293b] hover:border-[#10b981]/20 shadow-black/5'
              }`}
            >
              
              {/* Header de Tarjeta (Info Lote y Semáforo) */}
              <div className="flex items-start justify-between gap-2 border-b border-[#1e293b]/50 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-bold text-sm tracking-wide text-foreground">{carpa.ubicacion?.posicion}</span>
                    <span className="text-[10px] text-muted-foreground">({carpa.ubicacion?.sala})</span>
                  </div>
                  <h3 className="font-extrabold text-base text-foreground group-hover:text-emerald-400 transition-colors">
                    {carpa.genetica?.nombre}
                  </h3>
                  <span className="text-[10px] text-muted-foreground block">
                    Lote: <b>{carpa.lote.codigo}</b>
                  </span>
                </div>

                {/* Semáforo Visual */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold border ${
                      isRed ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      isAmber ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {isRed ? 'ANOMALÍA' : isAmber ? 'DESVÍO' : 'EN ORDEN'}
                    </span>
                    <span className="text-[8px] text-muted-foreground uppercase tracking-wider pt-0.5">
                      Fase {carpa.fase}
                    </span>
                  </div>
                  {/* Luz parpadeante */}
                  <div className={`w-3.5 h-3.5 rounded-full border shadow-inner ${
                    isRed ? 'bg-red-500 border-red-400 shadow-red-950 animate-ping' : 
                    isAmber ? 'bg-amber-400 border-amber-300 shadow-amber-950' : 
                    'bg-emerald-500 border-emerald-400 shadow-emerald-950'
                  }`} />
                </div>
              </div>

              {/* Fila de Progreso del Ciclo */}
              <div className="flex items-center justify-between text-xs bg-[#090d10]/40 border border-[#1e293b]/70 p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span>Semana <b>{carpa.semana}</b> · Día <b>{carpa.dia}</b></span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-bold">Total Ciclo: 8w</span>
                </div>
              </div>

              {/* TELEMETRÍA DE SENSORES EN VIVO CON SPARKLINE Y LÍMITES PLAN */}
              <div className="grid grid-cols-2 gap-3.5">
                
                {/* 1. Sensor Temperatura */}
                {renderSensorCard(
                  'Temperatura',
                  carpa.sensores.temp.actual,
                  '°C',
                  carpa.sensores.temp.esperado,
                  3, // tolerancia
                  carpa.sensores.temp.historico,
                  <Thermometer className="w-4 h-4 text-orange-500" />
                )}

                {/* 2. Sensor Humedad */}
                {renderSensorCard(
                  'Humedad Relativa',
                  carpa.sensores.humedad.actual,
                  '%',
                  carpa.sensores.humedad.esperado,
                  10, // tolerancia
                  carpa.sensores.humedad.historico,
                  <Droplet className="w-4 h-4 text-blue-400" />
                )}

                {/* 3. VPD (Déficit Presión Vapor) */}
                {renderSensorCard(
                  'Déficit Vapor (VPD)',
                  carpa.sensores.vpd.actual,
                  ' kPa',
                  carpa.sensores.vpd.esperado,
                  0.3, // tolerancia
                  carpa.sensores.vpd.historico,
                  <Activity className="w-4 h-4 text-purple-400" />
                )}

                {/* 4. CO2 */}
                {renderSensorCard(
                  'Nivel CO₂',
                  carpa.sensores.co2.actual,
                  ' ppm',
                  carpa.sensores.co2.esperado,
                  150, // tolerancia
                  carpa.sensores.co2.historico,
                  <Sun className="w-4 h-4 text-emerald-400" />
                )}

              </div>

              {/* Botón rápido para ir al análisis de este lote */}
              <div className="border-t border-[#1e293b]/50 pt-3 flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">
                  {carpa.totalDesvios} desvíos acumulados en ciclo
                </span>
                <Link
                  href="/informe"
                  onClick={() => setSelectedLoteId(carpa.lote.id)}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group/btn"
                >
                  <span>Ver Informe Nerd</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                </Link>
              </div>

            </div>
          );
        })}
      </div>

      {/* 4. PANEL INFERIOR: ALIMENTACIÓN EN TIEMPO REAL DE DESVÍOS REGISTRADOS HOY */}
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

        {/* Listado de desvíos */}
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
                
                {/* Info Izquierda */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground tracking-wide">{desvio.carpaNombre}</span>
                    <span className="text-[10px] text-muted-foreground font-bold bg-[#10161d] px-2 py-0.5 rounded border border-[#1e293b]">
                      {desvio.geneticaNombre}
                    </span>
                    <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                      esGrave ? 'text-red-400 bg-red-500/10' :
                      esModerado ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-500/10'
                    }`}>
                      {desvio.gravedadGeneral}
                    </span>
                  </div>
                  
                  {/* Breve descripción del desvío */}
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

                {/* Info Derecha (Hora y Acción) */}
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

// RENDER HELPER PARA TARJETAS DE SENSORES EN VIVO
function renderSensorCard(
  title: string,
  actual: number,
  unit: string,
  esperado: number,
  tolerancia: number,
  historico: number[],
  Icon: React.ReactNode
) {
  const diff = Math.abs(actual - esperado);
  const estaFuera = diff >= tolerancia;

  // sparkline SVG cálculo
  const width = 80;
  const height = 24;
  const points = historico.map((val, idx) => {
    const x = (idx / (historico.length - 1)) * width;
    
    // mapear rango al tamaño vertical del SVG
    const minVal = Math.min(...historico) - 1;
    const maxVal = Math.max(...historico) + 1;
    const range = maxVal - minVal || 1;
    const y = height - ((val - minVal) / range) * height;
    
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={`p-3 rounded-xl bg-[#090d10]/40 border text-left transition-all ${
      estaFuera ? 'border-amber-500/20 bg-amber-500/[0.01]' : 'border-[#1e293b]/70 hover:border-[#1e293b]'
    }`}>
      
      {/* Label */}
      <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider pb-1">
        <span className="truncate pr-1">{title}</span>
        {Icon}
      </div>

      {/* Valor Actual y Diferencia */}
      <div className="flex items-baseline gap-1.5">
        <span className={`font-extrabold text-base tracking-wide ${estaFuera ? 'text-amber-400 font-black' : 'text-foreground'}`}>
          {actual}{unit}
        </span>
        
        {diff > 0 && (
          <span className={`text-[9px] font-bold ${estaFuera ? 'text-amber-400' : 'text-muted-foreground'}`}>
            ({actual > esperado ? `+${(actual - esperado).toFixed(1)}` : (actual - esperado).toFixed(1)})
          </span>
        )}
      </div>

      {/* Rango Esperado del Plan y Mini Sparkline */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1e293b]/30 mt-1">
        <div>
          <span className="text-[8px] text-muted-foreground block uppercase font-bold">Plan</span>
          <span className="text-[10px] font-bold text-foreground">{esperado}{unit}</span>
        </div>
        
        {/* Mini Sparkline SVG */}
        {historico.length > 0 && (
          <svg className="w-16 h-6 overflow-visible pr-0.5">
            <polyline
              fill="none"
              stroke={estaFuera ? '#f59e0b' : '#10b981'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        )}
      </div>

    </div>
  );
}
