'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/lib/context/AppContext';
import { mockDb, Lote, RegistroDiario, RegistroAccion } from '@/lib/supabase/mockDb';
import { AnalisisDesvio } from '@/lib/desvios/calculadora';
import { 
  LineChart as ChartIcon,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Droplet,
  Thermometer,
  Sliders,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

type FiltroChip = 'todos' | 'graves' | 'moderados' | 'ph_ec' | 'omitidos';

// ─── CHIP CONSTANTS ───────────────────────────────────────────────────────────

const CHIPS: { id: FiltroChip; label: string }[] = [
  { id: 'todos',    label: 'Todos' },
  { id: 'graves',   label: 'Graves' },
  { id: 'moderados',label: 'Moderados' },
  { id: 'ph_ec',    label: 'pH/EC' },
  { id: 'omitidos', label: 'Omitidos' },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function VistaNerdPage() {
  const { lotes, selectedLoteId, setSelectedLoteId } = useAppContext();
  
  // Filtros locales
  const [loteId, setLoteId]           = useState<string>(selectedLoteId);
  const [filtroChip, setFiltroChip]   = useState<FiltroChip>('todos');

  // Datos del lote seleccionado
  const [lote,      setLote]      = useState<Lote | null>(null);
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [desvios,   setDesvios]   = useState<AnalisisDesvio[]>([]);
  
  // Datos para los gráficos
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  // Fecha de hoy
  const fechaHoy = new Date().toISOString().slice(0, 10);

  const cargarDatosLote = (id: string) => {
    const list = mockDb.getRegistrosDiarios(id).sort((a, b) => a.fecha.localeCompare(b.fecha));
    setRegistros(list);

    const devList = mockDb.getDesviosLote(id);
    setDesvios(devList);

    const lotObj  = mockDb.getLote(id);
    const plan    = mockDb.plantillas.find(p => p.id === lotObj?.plantilla_id);

    const dataGraficos: ChartPoint[] = list.map((rd) => {
      const diaCiclo  = lotObj ? mockDb.calcularDiaDeCiclo(lotObj.fecha_inicio, rd.fecha) : 1;
      const sem       = Math.floor((diaCiclo - 1) / 7) + 1;
      const dia       = ((diaCiclo - 1) % 7) + 1;
      const diaPlan   = plan?.dias?.find(d => d.semana === sem && d.dia === dia);
      const riegoPlan = diaPlan?.acciones?.find(a => a.tipo === 'riego' || a.tipo === 'fertilizacion');
      const riegoReal = rd.acciones?.find(a => a.tipo === 'riego' || a.tipo === 'fertilizacion');

      return {
        fecha:   rd.fecha.slice(5),
        diaCiclo,
        ph_plan: riegoPlan?.parametros?.ph_objetivo ?? null,
        ph_real: riegoReal?.hecha ? (riegoReal.parametros_real.ph ?? null) : null,
        ec_plan: riegoPlan?.parametros?.ec_objetivo ?? null,
        ec_real: riegoReal?.hecha ? (riegoReal.parametros_real.ec ?? null) : null,
      };
    }).filter(d => d.ph_plan !== null || d.ph_real !== null);

    setChartData(dataGraficos);
  };

  useEffect(() => {
    if (selectedLoteId) {
      const t = setTimeout(() => setLoteId(selectedLoteId), 0);
      return () => clearTimeout(t);
    }
  }, [selectedLoteId]);

  useEffect(() => {
    if (loteId) {
      const t = setTimeout(() => {
        setSelectedLoteId(loteId);
        const lot = mockDb.getLote(loteId);
        setLote(lot || null);
        if (lot) cargarDatosLote(lot.id);
      }, 0);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loteId]);

  // ─── FILTRADO ──────────────────────────────────────────────────────────────

  /** Devuelve los registros del día que pasan el filtro de chip activo */
  const diaPassesFiltro = (fecha: string): boolean => {
    const desviosDia = desvios.filter(d => d.fecha === fecha);
    switch (filtroChip) {
      case 'todos':      return true;
      case 'graves':     return desviosDia.some(d => d.gravedadGeneral === 'grave');
      case 'moderados':  return desviosDia.some(d => d.gravedadGeneral === 'moderada');
      case 'ph_ec':      return desviosDia.some(d => d.tipoDesvio === 'parametro_distinto');
      case 'omitidos':   return desviosDia.some(d => d.tipoDesvio === 'no_realizada');
    }
  };

  const registrosFiltrados = registros.filter(rd => diaPassesFiltro(rd.fecha));

  // ─── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-12">
      
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ChartIcon className="w-6 h-6 text-emerald-500" />
            Vista Nerd (Análisis de Desvíos)
          </h1>
          <p className="text-muted-foreground text-sm">
            Control de desvíos agronómicos de plan vs real en conductividad (EC), acidez (pH) y omisiones.
          </p>
        </div>

        {/* Lote Selector */}
        <div className="flex items-center gap-2 self-start md:self-center bg-[#10161d] p-1.5 rounded-lg border border-[#1e293b]">
          <span className="text-xs text-muted-foreground font-bold pl-2 pr-1 uppercase">Lote:</span>
          <select
            value={loteId}
            onChange={(e) => setLoteId(e.target.value)}
            className="text-xs bg-[#090d10] border border-[#1e293b] rounded-md px-2 py-1 focus:outline-none focus:border-emerald-500 font-bold min-h-[44px]"
          >
            {lotes.map(l => {
              const gen = mockDb.geneticas.find(g => g.id === l.plantilla_id || g.id === 'gen-1');
              return (
                <option key={l.id} value={l.id}>{l.codigo} ({gen?.nombre})</option>
              );
            })}
          </select>
        </div>
      </div>

      {/* ── FILTER CHIPS (horizontal scrollable) ────────────────────────────── */}
      <div className="overflow-x-auto flex gap-2 pb-2 flex-nowrap no-scrollbar">
        {CHIPS.map(chip => (
          <button
            key={chip.id}
            onClick={() => setFiltroChip(chip.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap cursor-pointer transition-all min-h-[44px] ${
              filtroChip === chip.id
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-[#10161d] border-[#1e293b] text-muted-foreground hover:text-foreground hover:border-emerald-500/30'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {lote && (
        /* ── MAIN LAYOUT ─────────────────────────────────────────────────── */
        <div className="flex flex-col xl:grid xl:grid-cols-3 gap-6 items-start">

          {/* ── LEFT: CHARTS + ENV CARDS (2/3 on xl) ──────────────────────── */}
          <div className="xl:col-span-2 space-y-6 w-full">

            {/* GRÁFICO 1: pH */}
            <div className="bg-[#10161d] border border-[#1e293b] p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                    <Droplet className="w-4 h-4 text-emerald-500" />
                    Histórico de Acidez de Riego (pH)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Superposición de pH real medido por el jardinero sobre el rango esperado del plan.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-emerald-500" />
                    <span className="text-emerald-400">pH REAL</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-slate-500 border border-dashed" />
                    <span className="text-muted-foreground">pH PLAN</span>
                  </div>
                </div>
              </div>

              {/* RESPONSIVE SVG CHART */}
              <div className="overflow-x-auto">
                {chartData.length > 0 ? (
                  renderCustomLineChart(chartData, 'ph_plan', 'ph_real', '#6b7280', '#10b981', [5.0, 7.5])
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-[#1e293b] rounded-xl">
                    No hay suficientes riegos registrados en este lote para graficar.
                  </div>
                )}
              </div>
            </div>

            {/* GRÁFICO 2: EC */}
            <div className="bg-[#10161d] border border-[#1e293b] p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    Conductividad Eléctrica (EC) del Sustrato
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Dosis salina / nutrientes reales administrados vs plan de nutrición del fenotipo.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-purple-500" />
                    <span className="text-purple-400">EC REAL</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-slate-500 border border-dashed" />
                    <span className="text-muted-foreground">EC PLAN</span>
                  </div>
                </div>
              </div>

              {/* RESPONSIVE SVG CHART */}
              <div className="overflow-x-auto">
                {chartData.length > 0 ? (
                  renderCustomLineChart(chartData, 'ec_plan', 'ec_real', '#6b7280', '#a855f7', [0.5, 3.0])
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-[#1e293b] rounded-xl">
                    No hay suficientes fertilizaciones registradas en este lote para graficar.
                  </div>
                )}
              </div>
            </div>

            {/* CRUCE DE SENSORES Y ANOMALÍAS */}
            <div className="bg-[#10161d] border border-[#1e293b] p-5 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <Thermometer className="w-4 h-4 text-orange-500" />
                Eventos Ambientales y Rangos Críticos
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Cruce de lecturas promedio diarias de sensores (carpa) correlacionadas con fases del plan.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#090d10]/40 border border-[#1e293b] p-4 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-foreground">Temperatura Máxima</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-foreground">26.8°C</span>
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" /> +1.8°C sobre plan
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block">
                    Registrado en Carpa 3 (Semana 5 Día 1). Alarma temporal.
                  </span>
                </div>

                <div className="bg-[#090d10]/40 border border-[#1e293b] p-4 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-foreground">Déficit de Vapor Promedio</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-emerald-400">1.12 kPa</span>
                    <span className="text-[10px] text-emerald-400 font-bold">Óptimo Transpiración</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block">
                    VPD se mantuvo en rango de floración estándar durante el 92% de la semana.
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT: TIMELINE (1/3 on xl) ───────────────────────────────── */}
          <div className="w-full space-y-4">

            {/* On xl+, show chip filter count summary */}
            <div className="hidden xl:flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                Línea de Tiempo · Plan vs Real
              </span>
              <span className="text-[10px] text-muted-foreground">
                {registrosFiltrados.length} días
              </span>
            </div>

            {/* TIMELINE CONTAINER */}
            <div className="bg-[#10161d] border border-[#1e293b] p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1e293b]/50 pb-2">
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Línea de Tiempo Real vs Plan
                </h3>
                <span className="text-[10px] text-muted-foreground font-bold">
                  {registrosFiltrados.length} / {registros.length} días
                </span>
              </div>

              {/* Scrollable timeline */}
              <div className="max-h-[600px] xl:max-h-[700px] overflow-y-auto pr-1 space-y-6 no-scrollbar relative pl-4 border-l border-[#1e293b]/70">
                {registrosFiltrados.slice().reverse().map((rd, rdIndex) => {
                  const lotObj   = lote;
                  const diaCiclo = lotObj ? mockDb.calcularDiaDeCiclo(lotObj.fecha_inicio, rd.fecha) : 1;
                  const sem      = Math.floor((diaCiclo - 1) / 7) + 1;
                  const dia      = ((diaCiclo - 1) % 7) + 1;

                  // Plan data for this day
                  const plan     = mockDb.plantillas.find(p => p.id === lotObj?.plantilla_id);
                  const diaPlan  = plan?.dias?.find(d => d.semana === sem && d.dia === dia);

                  // Desvíos del día
                  const desviosDia    = desvios.filter(d => d.fecha === rd.fecha);
                  const esGrave       = desviosDia.some(d => d.gravedadGeneral === 'grave');
                  const esModerado    = desviosDia.some(d => d.gravedadGeneral === 'moderada');
                  const tieneDesvios  = desviosDia.length > 0;

                  // Is today?
                  const esHoy = rd.fecha === fechaHoy;

                  // First entry (most recent) gets HOY badge only if it matches today
                  const mostRecent = rdIndex === 0;

                  // Collect plan actions (riego/fertilizacion) for the plan column
                  const planAcciones = diaPlan?.acciones?.filter(a =>
                    a.tipo === 'riego' || a.tipo === 'fertilizacion'
                  ) || [];
                  const planMedicion = diaPlan?.acciones?.find(a => a.tipo === 'medicion');
                  const planPrimario = planAcciones[0] ?? null;

                  // Collect real actions
                  const realRiego = rd.acciones?.find(a =>
                    a.tipo === 'riego' || a.tipo === 'fertilizacion'
                  );

                  // Deviation pills from desviosCampos
                  const desvioParams = desviosDia
                    .filter(d => d.tipoDesvio === 'parametro_distinto')
                    .flatMap(d => d.desviosCampos)
                    .filter(dc => dc.campo === 'pH' || dc.campo === 'EC (mS/cm)');

                  return (
                    <div key={rd.id} className="relative space-y-2">
                      
                      {/* Timeline dot */}
                      <div className={`absolute -left-[22px] top-2 w-3 h-3 rounded-full border shadow-sm ${
                        esGrave    ? 'bg-red-500 border-red-400' :
                        esModerado ? 'bg-amber-400 border-amber-300' :
                                     'bg-emerald-500 border-emerald-400'
                      }`} />

                      {/* Day header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-extrabold text-foreground">
                            Día {diaCiclo} de Cultivo
                          </span>
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            (Sem {sem} · Dia {dia})
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold">{rd.fecha}</span>
                      </div>

                      {/* ── DAY CARD ─────────────────────────────────────── */}
                      <div className={`relative p-3 rounded-xl border bg-[#090d10]/40 ${
                        esHoy      ? 'ring-2 ring-emerald-500/40 border-emerald-500/30' :
                        esGrave    ? 'border-red-500/20' :
                        esModerado ? 'border-amber-500/20' :
                                     'border-[#1e293b]'
                      }`}>

                        {/* HOY badge */}
                        {esHoy && (
                          <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                            HOY
                          </span>
                        )}

                        {/* ── PLAN vs REAL two-column layout ──────────────── */}
                        {(planPrimario || realRiego) && (
                          <div className="flex gap-3 mb-3">

                            {/* LEFT: PLAN */}
                            <div className="flex-1 min-w-0">
                              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 block mb-1">PLAN</span>
                              <div className="border-l-2 border-slate-600 pl-3 space-y-1">
                                {planPrimario ? (
                                  <>
                                    <p className="text-[10px] font-bold text-slate-400 capitalize">
                                      {planPrimario.tipo === 'fertilizacion' ? 'Riego / Nutrición' : planPrimario.tipo}
                                    </p>
                                    {planPrimario.parametros.ph_objetivo != null && (
                                      <p className="text-[10px] text-muted-foreground">
                                        pH: <b className="text-slate-300">{planPrimario.parametros.ph_objetivo}</b>
                                      </p>
                                    )}
                                    {planPrimario.parametros.ec_objetivo != null && (
                                      <p className="text-[10px] text-muted-foreground">
                                        EC: <b className="text-slate-300">{planPrimario.parametros.ec_objetivo} mS</b>
                                      </p>
                                    )}
                                    {planPrimario.parametros.ml_agua != null && (
                                      <p className="text-[10px] text-muted-foreground">
                                        Vol: <b className="text-slate-300">{planPrimario.parametros.ml_agua} ml</b>
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-[10px] text-muted-foreground italic">Sin riego planificado</p>
                                )}
                              </div>
                            </div>

                            {/* Dashed vertical divider */}
                            <div className="border-l border-dashed border-[#1e293b] self-stretch" />

                            {/* Deviation gap pills (between columns) */}
                            {tieneDesvios && desvioParams.length > 0 && (
                              <div className="flex flex-col justify-center gap-1 flex-shrink-0">
                                {desvioParams.map((dc, i) => {
                                  const delta = dc.magnitud;
                                  const sign  = delta !== null && delta > 0 ? '+' : '';
                                  const label = dc.campo === 'pH' ? 'pH' : 'EC';
                                  return (
                                    <span
                                      key={i}
                                      className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 whitespace-nowrap"
                                    >
                                      {label} {sign}{delta !== null ? delta.toFixed(1) : '—'}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* RIGHT: REAL */}
                            <div className="flex-1 min-w-0">
                              <span className={`text-[8px] font-bold uppercase tracking-wider block mb-1 ${
                                esGrave    ? 'text-red-400' :
                                esModerado ? 'text-amber-400' :
                                             'text-emerald-400'
                              }`}>REAL</span>
                              {realRiego?.hecha ? (
                                <div className={`border-l-2 pl-3 space-y-1 ${
                                  esGrave    ? 'border-red-500' :
                                  esModerado ? 'border-amber-400' :
                                               'border-emerald-500'
                                }`}>
                                  <p className={`text-[10px] font-bold capitalize ${
                                    esGrave ? 'text-red-300' : esModerado ? 'text-amber-300' : 'text-emerald-300'
                                  }`}>
                                    {realRiego.tipo === 'fertilizacion' ? 'Riego / Nutrición' : realRiego.tipo}
                                  </p>
                                  {realRiego.parametros_real.ph != null && (
                                    <p className="text-[10px] text-muted-foreground">
                                      pH: <b className="text-foreground">{realRiego.parametros_real.ph}</b>
                                    </p>
                                  )}
                                  {realRiego.parametros_real.ec != null && (
                                    <p className="text-[10px] text-muted-foreground">
                                      EC: <b className="text-foreground">{realRiego.parametros_real.ec} mS</b>
                                    </p>
                                  )}
                                  {realRiego.parametros_real.ml_agua != null && (
                                    <p className="text-[10px] text-muted-foreground">
                                      Vol: <b className="text-foreground">{realRiego.parametros_real.ml_agua} ml</b>
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="border-l-2 border-red-500/50 pl-3">
                                  <p className="text-[10px] text-red-400 italic">No ejecutado</p>
                                </div>
                              )}
                            </div>

                          </div>
                        )}

                        {/* Other actions (medición, poda, defoliación, etc.) */}
                        <div className="space-y-1.5">
                          {rd.acciones?.filter(ra =>
                            ra.tipo !== 'riego' && ra.tipo !== 'fertilizacion'
                          ).map((ra, rIdx) => (
                            <div key={rIdx} className="flex items-start justify-between gap-4 text-xs">
                              <div className="flex items-start gap-1.5">
                                {ra.hecha ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="space-y-0.5">
                                  <span className={`font-bold text-[11px] ${ra.hecha ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                                    {ra.tipo.charAt(0).toUpperCase() + ra.tipo.slice(1)}
                                  </span>
                                </div>
                              </div>

                              {/* Alerta de Desvío específico */}
                              {desviosDia.some(d => d.registroAccionId === ra.id) && (
                                <span className={`text-[8px] font-extrabold uppercase px-1 rounded flex items-center gap-0.5 ${
                                  desviosDia.find(d => d.registroAccionId === ra.id)?.gravedadGeneral === 'grave'
                                    ? 'text-red-400 bg-red-500/10'
                                    : 'text-amber-400 bg-amber-500/10'
                                }`}>
                                  <AlertTriangle className="w-2.5 h-2.5" /> DESVÍO
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Detalle ampliado de desvíos del día (no-realizada u otros) */}
                        {tieneDesvios && desviosDia.some(d => d.tipoDesvio === 'no_realizada') && (
                          <div className="mt-2 bg-black/30 p-2 rounded-lg border border-[#1e293b] space-y-1.5 text-[10px]">
                            {desviosDia
                              .filter(d => d.tipoDesvio === 'no_realizada')
                              .map((d, dIdx) => (
                                <span key={dIdx} className="text-red-400 font-bold block">
                                  Omitido: {d.accionTipo.toUpperCase()} obligatorio no se realizó.
                                </span>
                              ))
                            }
                          </div>
                        )}

                        {/* Notes */}
                        {desviosDia.some(d => d.notas) && (
                          <div className="mt-2 pt-2 border-t border-[#1e293b]/50">
                            {desviosDia.filter(d => d.notas).map((d, dIdx) => (
                              <p key={dIdx} className="text-[9px] text-muted-foreground italic">
                                &ldquo;{d.notas}&rdquo;
                              </p>
                            ))}
                          </div>
                        )}

                      </div>

                    </div>
                  );
                })}

                {registrosFiltrados.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                    <ArrowRight className="w-6 h-6 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">No hay días que coincidan con el filtro seleccionado.</p>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}

// ─── CHART TYPES ──────────────────────────────────────────────────────────────

interface ChartPoint {
  fecha:    string;
  diaCiclo: number;
  ph_plan:  number | null;
  ph_real:  number | null;
  ec_plan:  number | null;
  ec_real:  number | null;
}

// ─── SVG CHART HELPER ─────────────────────────────────────────────────────────

function renderCustomLineChart(
  data: ChartPoint[],
  keyPlan: keyof ChartPoint,
  keyReal: keyof ChartPoint,
  colorPlan: string,
  colorReal: string,
  domain: [number, number]
) {
  const width   = 500;
  const height  = 240;
  const padding = { top: 15, right: 15, bottom: 25, left: 35 };

  const usableWidth  = width  - padding.left - padding.right;
  const usableHeight = height - padding.top  - padding.bottom;

  const [minVal, maxVal] = domain;
  const valRange = maxVal - minVal;

  const planPoints: string[] = [];
  const realPoints: string[] = [];

  data.forEach((d, idx) => {
    const x = padding.left + (idx / (data.length - 1)) * usableWidth;

    const pVal = d[keyPlan] as number | null;
    const rVal = d[keyReal] as number | null;

    if (pVal !== null && pVal !== undefined) {
      const yPlan = padding.top + usableHeight - ((pVal - minVal) / valRange) * usableHeight;
      planPoints.push(`${x},${yPlan}`);
    }
    if (rVal !== null && rVal !== undefined) {
      const yReal = padding.top + usableHeight - ((rVal - minVal) / valRange) * usableHeight;
      realPoints.push(`${x},${yReal}`);
    }
  });

  // Grid lines
  const gridCount = 5;
  const gridLines: React.ReactNode[] = [];
  for (let i = 0; i < gridCount; i++) {
    const ratio = i / (gridCount - 1);
    const y     = padding.top + ratio * usableHeight;
    const value = (maxVal - ratio * valRange).toFixed(1);

    gridLines.push(
      <g key={i}>
        <line
          x1={padding.left} y1={y}
          x2={width - padding.right} y2={y}
          stroke="#1e293b"
          strokeWidth="0.8"
          strokeDasharray="4,4"
        />
        <text
          x={padding.left - 8} y={y + 3}
          fill="#94a3b8"
          fontSize="9.5"
          fontWeight="bold"
          textAnchor="end"
        >
          {value}
        </text>
      </g>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMinYMid meet"
      style={{ minWidth: '320px' }}
      className="w-full h-auto overflow-visible"
    >
      {gridLines}

      {/* X-axis labels */}
      {data.map((d, idx) => {
        const x = padding.left + (idx / (data.length - 1)) * usableWidth;
        return (
          <text key={idx} x={x} y={height - 5} fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">
            {d.fecha}
          </text>
        );
      })}

      {/* Plan line (dashed) */}
      {planPoints.length > 1 && (
        <polyline
          fill="none"
          stroke={colorPlan}
          strokeWidth="1.5"
          strokeDasharray="5,5"
          points={planPoints.join(' ')}
          className="opacity-70"
        />
      )}

      {/* Real line */}
      {realPoints.length > 1 && (
        <polyline
          fill="none"
          stroke={colorReal}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={realPoints.join(' ')}
        />
      )}

      {/* Data point circles */}
      {data.map((d, idx) => {
        const rVal = d[keyReal] as number | null;
        const pVal = d[keyPlan] as number | null;
        if (rVal === null || rVal === undefined) return null;

        const x     = padding.left + (idx / (data.length - 1)) * usableWidth;
        const yReal = padding.top + usableHeight - ((rVal - minVal) / valRange) * usableHeight;

        const absDiff = pVal !== null && pVal !== undefined ? Math.abs(rVal - pVal) : 0;
        const esDesvio = keyReal === 'ph_real' ? absDiff >= 0.2 : absDiff >= 0.15;

        return (
          <g key={idx}>
            <circle
              cx={x} cy={yReal}
              r={esDesvio ? 4.5 : 3.5}
              fill={esDesvio ? '#f59e0b' : colorReal}
              stroke="#090d10"
              strokeWidth="1.5"
              className={esDesvio ? 'animate-pulse' : ''}
            />
            {esDesvio && (
              <circle
                cx={x} cy={yReal}
                r="7"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1"
                className="animate-ping"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
