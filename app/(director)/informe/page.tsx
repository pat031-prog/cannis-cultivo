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
    <div className="space-y-10 pb-16 bg-[#121413] text-stone-300 min-h-screen font-sans">
      
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 pt-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-serif text-stone-100 flex items-center gap-3">
            <ChartIcon className="w-6 h-6 text-[#8b9a8a]" strokeWidth={1.5} />
            Logbook Botánico
          </h1>
          <p className="text-stone-400 text-sm mt-2 font-serif leading-relaxed">
            Registro editorial de desvíos agronómicos: planificado versus ejecución real en conductividad (EC), acidez (pH) y omisiones de tareas.
          </p>
        </div>

        {/* Lote Selector */}
        <div className="flex items-center gap-3 self-start md:self-center bg-[#181a19] p-2 border border-[#2a2d2a]">
          <span className="text-xs text-stone-500 font-serif uppercase tracking-widest px-2">Lote</span>
          <select
            value={loteId}
            onChange={(e) => setLoteId(e.target.value)}
            className="text-sm bg-[#121413] border border-[#2a2d2a] text-stone-200 px-3 py-1.5 focus:outline-none focus:border-[#8b9a8a] font-serif"
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

      {/* ── FILTER CHIPS ────────────────────────────── */}
      <div className="px-6 border-b border-[#2a2d2a] pb-6">
        <div className="flex gap-3 flex-wrap">
          {CHIPS.map(chip => (
            <button
              key={chip.id}
              onClick={() => setFiltroChip(chip.id)}
              className={`px-4 py-1.5 text-xs font-serif tracking-wide border transition-colors ${
                filtroChip === chip.id
                  ? 'bg-[#8b9a8a]/10 border-[#8b9a8a]/40 text-[#8b9a8a]'
                  : 'bg-transparent border-[#2a2d2a] text-stone-500 hover:text-stone-300 hover:border-[#8b9a8a]/30'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {lote && (
        /* ── MAIN LAYOUT ─────────────────────────────────────────────────── */
        <div className="px-6 flex flex-col xl:grid xl:grid-cols-12 gap-12 items-start mt-6">

          {/* ── LEFT: CHARTS + ENV CARDS (7/12) ──────────────────────── */}
          <div className="xl:col-span-7 space-y-10 w-full">

            {/* GRÁFICO 1: pH */}
            <div className="space-y-6">
              <div className="flex items-end justify-between border-b border-[#2a2d2a] pb-4">
                <div>
                  <h3 className="font-serif text-xl text-stone-200 flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-[#8b9a8a]" strokeWidth={1.5} />
                    Acidez de Riego (pH)
                  </h3>
                  <p className="text-xs text-stone-500 font-serif mt-1.5 italic">
                    Acidez medida por el equipo vs. rango esperado
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-mono flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-px bg-[#8b9a8a]" />
                    <span className="text-[#8b9a8a]">REAL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-px bg-[#4a554e] border-b border-dashed border-[#4a554e]" />
                    <span className="text-stone-500">PLAN</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto bg-[#181a19] border border-[#2a2d2a] p-6">
                {chartData.length > 0 ? (
                  renderCustomLineChart(chartData, 'ph_plan', 'ph_real', '#4a554e', '#8b9a8a', [5.0, 7.5])
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm font-serif italic text-stone-500">
                    Registros insuficientes.
                  </div>
                )}
              </div>
            </div>

            {/* GRÁFICO 2: EC */}
            <div className="space-y-6">
              <div className="flex items-end justify-between border-b border-[#2a2d2a] pb-4">
                <div>
                  <h3 className="font-serif text-xl text-stone-200 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#d97757]" strokeWidth={1.5} />
                    Conductividad Eléctrica (EC)
                  </h3>
                  <p className="text-xs text-stone-500 font-serif mt-1.5 italic">
                    Concentración salina real vs. plan nutricional
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-mono flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-px bg-[#d97757]" />
                    <span className="text-[#d97757]">REAL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-px bg-[#4a554e] border-b border-dashed border-[#4a554e]" />
                    <span className="text-stone-500">PLAN</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto bg-[#181a19] border border-[#2a2d2a] p-6">
                {chartData.length > 0 ? (
                  renderCustomLineChart(chartData, 'ec_plan', 'ec_real', '#4a554e', '#d97757', [0.5, 3.0])
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm font-serif italic text-stone-500">
                    Registros insuficientes.
                  </div>
                )}
              </div>
            </div>

            {/* CRUCE DE SENSORES Y ANOMALÍAS */}
            <div className="space-y-6">
              <div className="border-b border-[#2a2d2a] pb-4">
                <h3 className="font-serif text-xl text-stone-200 flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-[#c28b33]" strokeWidth={1.5} />
                  Lecturas Ambientales
                </h3>
                <p className="text-xs text-stone-500 font-serif mt-1.5 italic">
                  Correlación de sensores en sala con fases del logbook.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-[#181a19] border border-[#2a2d2a] p-5 space-y-3">
                  <span className="text-xs font-serif uppercase tracking-widest text-stone-500">Temp Máxima</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-serif text-stone-200">26.8°C</span>
                    <span className="text-[11px] font-mono text-[#c28b33] bg-[#c28b33]/10 px-2 py-0.5 border border-[#c28b33]/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> +1.8°C
                    </span>
                  </div>
                  <span className="text-xs font-serif text-stone-500 block italic">
                    Carpa 3 (Semana 5 Día 1). Alarma temporal.
                  </span>
                </div>

                <div className="bg-[#181a19] border border-[#2a2d2a] p-5 space-y-3">
                  <span className="text-xs font-serif uppercase tracking-widest text-stone-500">Déficit de Vapor</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-serif text-[#8b9a8a]">1.12 kPa</span>
                    <span className="text-[11px] font-mono text-[#8b9a8a] bg-[#8b9a8a]/10 px-2 py-0.5 border border-[#8b9a8a]/30">
                      ÓPTIMO
                    </span>
                  </div>
                  <span className="text-xs font-serif text-stone-500 block italic">
                    VPD estable en rango de floración (92% de la semana).
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT: TIMELINE (5/12) ───────────────────────────────── */}
          <div className="xl:col-span-5 w-full space-y-6">

            <div className="flex items-end justify-between border-b border-[#2a2d2a] pb-4">
              <h3 className="font-serif text-xl text-stone-200 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#8b9a8a]" strokeWidth={1.5} />
                Línea de Tiempo
              </h3>
              <span className="text-xs text-stone-500 font-mono">
                {registrosFiltrados.length} entradas
              </span>
            </div>

            {/* Scrollable timeline logbook */}
            <div className="max-h-[800px] overflow-y-auto pr-4 space-y-0 no-scrollbar relative">
              {registrosFiltrados.slice().reverse().map((rd, rdIndex) => {
                const lotObj   = lote;
                const diaCiclo = lotObj ? mockDb.calcularDiaDeCiclo(lotObj.fecha_inicio, rd.fecha) : 1;
                const sem      = Math.floor((diaCiclo - 1) / 7) + 1;
                const dia      = ((diaCiclo - 1) % 7) + 1;

                const plan     = mockDb.plantillas.find(p => p.id === lotObj?.plantilla_id);
                const diaPlan  = plan?.dias?.find(d => d.semana === sem && d.dia === dia);

                const desviosDia    = desvios.filter(d => d.fecha === rd.fecha);
                const esGrave       = desviosDia.some(d => d.gravedadGeneral === 'grave');
                const esModerado    = desviosDia.some(d => d.gravedadGeneral === 'moderada');
                const tieneDesvios  = desviosDia.length > 0;

                const esHoy = rd.fecha === fechaHoy;

                const planAcciones = diaPlan?.acciones?.filter(a =>
                  a.tipo === 'riego' || a.tipo === 'fertilizacion'
                ) || [];
                const planPrimario = planAcciones[0] ?? null;

                const realRiego = rd.acciones?.find(a =>
                  a.tipo === 'riego' || a.tipo === 'fertilizacion'
                );

                const otrasAcciones = rd.acciones?.filter(ra => ra.tipo !== 'riego' && ra.tipo !== 'fertilizacion') || [];

                const desvioParams = desviosDia
                  .filter(d => d.tipoDesvio === 'parametro_distinto')
                  .flatMap(d => d.desviosCampos)
                  .filter(dc => dc.campo === 'pH' || dc.campo === 'EC (mS/cm)');

                return (
                  <div key={rd.id} className="relative pl-6 pb-10 border-l border-[#2a2d2a] last:border-0 last:pb-0">
                    
                    {/* Logbook Timeline Node */}
                    <div className={`absolute -left-[3.5px] top-1.5 w-1.5 h-1.5 rounded-full ${
                      esGrave    ? 'bg-[#d97757]' :
                      esModerado ? 'bg-[#c28b33]' :
                                   'bg-[#8b9a8a]'
                    }`} />

                    {/* Day header */}
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="text-lg font-serif text-stone-200">
                        Día {diaCiclo}
                      </span>
                      <span className="text-xs text-stone-500 font-mono tracking-wider">
                        {rd.fecha} · S{sem}D{dia}
                      </span>
                      {esHoy && (
                        <span className="text-[10px] px-1.5 py-0.5 border border-[#8b9a8a]/30 text-[#8b9a8a] font-serif uppercase tracking-widest">
                          Hoy
                        </span>
                      )}
                    </div>

                    {/* ── LOGBOOK ENTRY ─────────────────────────────────────── */}
                    <div className="space-y-6 text-sm">

                      {/* PLAN vs REAL Comparison */}
                      {(planPrimario || realRiego) && (
                        <div className="grid grid-cols-2 gap-6 bg-[#181a19] p-5 border border-[#2a2d2a]">
                          
                          {/* LEFT: PLAN (Ghosted) */}
                          <div className="space-y-3">
                            <div className="text-[10px] font-serif uppercase tracking-widest text-stone-600 border-b border-[#2a2d2a] pb-2">
                              Planificado
                            </div>
                            {planPrimario ? (
                              <div className="space-y-2 font-serif text-stone-500">
                                <div className="capitalize font-medium">
                                  {planPrimario.tipo === 'fertilizacion' ? 'Riego / Nutrición' : planPrimario.tipo}
                                </div>
                                {planPrimario.parametros.ph_objetivo != null && (
                                  <div className="flex justify-between">
                                    <span>pH</span><span className="font-mono">{planPrimario.parametros.ph_objetivo}</span>
                                  </div>
                                )}
                                {planPrimario.parametros.ec_objetivo != null && (
                                  <div className="flex justify-between">
                                    <span>EC</span><span className="font-mono">{planPrimario.parametros.ec_objetivo}</span>
                                  </div>
                                )}
                                {planPrimario.parametros.ml_agua != null && (
                                  <div className="flex justify-between">
                                    <span>Vol</span><span className="font-mono">{planPrimario.parametros.ml_agua}ml</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-stone-600 italic font-serif">Reposo hidrológico</p>
                            )}
                          </div>

                          {/* RIGHT: REAL (Solid) */}
                          <div className="space-y-3">
                            <div className="text-[10px] font-serif uppercase tracking-widest text-stone-400 border-b border-[#2a2d2a] pb-2">
                              Ejecutado
                            </div>
                            {realRiego?.hecha ? (
                              <div className="space-y-2 font-serif text-stone-200">
                                <div className="capitalize font-medium text-stone-100">
                                  {realRiego.tipo === 'fertilizacion' ? 'Riego / Nutrición' : realRiego.tipo}
                                </div>
                                {realRiego.parametros_real.ph != null && (
                                  <div className="flex justify-between">
                                    <span className="text-stone-400">pH</span><span className="font-mono">{realRiego.parametros_real.ph}</span>
                                  </div>
                                )}
                                {realRiego.parametros_real.ec != null && (
                                  <div className="flex justify-between">
                                    <span className="text-stone-400">EC</span><span className="font-mono">{realRiego.parametros_real.ec}</span>
                                  </div>
                                )}
                                {realRiego.parametros_real.ml_agua != null && (
                                  <div className="flex justify-between">
                                    <span className="text-stone-400">Vol</span><span className="font-mono">{realRiego.parametros_real.ml_agua}ml</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-[#d97757] font-serif italic">
                                Tarea omitida
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Deviations flat chips */}
                      {tieneDesvios && desvioParams.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {desvioParams.map((dc, i) => {
                            const delta = dc.magnitud;
                            const sign  = delta !== null && delta > 0 ? '+' : '';
                            const label = dc.campo === 'pH' ? 'pH' : 'EC';
                            return (
                              <span
                                key={i}
                                className="text-[11px] font-mono px-2 py-1 bg-[#d97757]/10 text-[#d97757] border border-[#d97757]/30"
                              >
                                Δ {label} {sign}{delta !== null ? delta.toFixed(1) : '—'}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Other actions (medición, poda, defoliación, etc.) */}
                      {otrasAcciones.length > 0 && (
                        <div className="space-y-3 pt-2">
                          {otrasAcciones.map((ra, rIdx) => {
                            const err = desviosDia.find(d => d.registroAccionId === ra.id);
                            return (
                              <div key={rIdx} className="flex items-start gap-3">
                                {ra.hecha ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#8b9a8a] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-[#d97757] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                )}
                                <div className="flex-1 flex items-center justify-between">
                                  <span className={`font-serif text-sm ${ra.hecha ? 'text-stone-300' : 'text-stone-600 line-through'}`}>
                                    {ra.tipo.charAt(0).toUpperCase() + ra.tipo.slice(1)}
                                  </span>
                                  {err && (
                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                                      err.gravedadGeneral === 'grave'
                                        ? 'bg-[#d97757]/10 text-[#d97757] border-[#d97757]/30'
                                        : 'bg-[#c28b33]/10 text-[#c28b33] border-[#c28b33]/30'
                                    }`}>
                                      DESVÍO
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Detalle ampliado de desvíos (omisiones u otros) */}
                      {tieneDesvios && desviosDia.some(d => d.tipoDesvio === 'no_realizada') && (
                        <div className="bg-[#d97757]/5 p-3 border border-[#d97757]/20 space-y-2">
                          {desviosDia
                            .filter(d => d.tipoDesvio === 'no_realizada')
                            .map((d, dIdx) => (
                              <p key={dIdx} className="text-[#d97757] font-serif text-xs italic">
                                Omitido: {d.accionTipo.toLowerCase()} requerida.
                              </p>
                            ))
                          }
                        </div>
                      )}

                      {/* Notes */}
                      {desviosDia.some(d => d.notas) && (
                        <div className="pt-4 border-t border-[#2a2d2a]/50">
                          {desviosDia.filter(d => d.notas).map((d, dIdx) => (
                            <p key={dIdx} className="text-xs text-stone-500 font-serif italic leading-relaxed">
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
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <ArrowRight className="w-5 h-5 text-stone-600" strokeWidth={1} />
                  <p className="text-sm font-serif italic text-stone-500">Logbook sin entradas para este filtro.</p>
                </div>
              )}
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
  const height  = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

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
          stroke="#2a2d2a"
          strokeWidth="1"
        />
        <text
          x={padding.left - 10} y={y + 3}
          fill="#6b706d"
          fontSize="10"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
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
        // Only show every Nth label or if it's the first/last
        if (data.length > 10 && idx % 2 !== 0 && idx !== data.length - 1 && idx !== 0) return null;
        
        return (
          <text key={idx} x={x} y={height - 5} fill="#6b706d" fontSize="9" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" textAnchor="middle">
            {d.fecha.slice(5)}
          </text>
        );
      })}

      {/* Plan line (dashed, thin) */}
      {planPoints.length > 1 && (
        <polyline
          fill="none"
          stroke={colorPlan}
          strokeWidth="1"
          strokeDasharray="4,4"
          points={planPoints.join(' ')}
          className="opacity-60"
        />
      )}

      {/* Real line (solid, clean) */}
      {realPoints.length > 1 && (
        <polyline
          fill="none"
          stroke={colorReal}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={realPoints.join(' ')}
        />
      )}

      {/* Data point circles */}
      {data.map((d, idx) => {
        const rVal = d[keyReal] as number | null;
        if (rVal === null || rVal === undefined) return null;

        const x     = padding.left + (idx / (data.length - 1)) * usableWidth;
        const yReal = padding.top + usableHeight - ((rVal - minVal) / valRange) * usableHeight;

        return (
          <circle
            key={idx}
            cx={x} cy={yReal}
            r="2"
            fill={colorReal}
            stroke="#121413"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}
