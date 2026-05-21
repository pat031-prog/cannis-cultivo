'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/lib/context/AppContext';
import { mockDb, Lote, RegistroDiario, RegistroAccion } from '@/lib/supabase/mockDb';
import { AnalisisDesvio } from '@/lib/desvios/calculadora';
import { 
  Droplet,
  Sliders,
  Activity,
  Terminal
} from 'lucide-react';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

type FiltroChip = 'todos' | 'graves' | 'moderados' | 'ph_ec' | 'omitidos';

// ─── CHIP CONSTANTS ───────────────────────────────────────────────────────────

const CHIPS: { id: FiltroChip; label: string }[] = [
  { id: 'todos',    label: 'All Events' },
  { id: 'graves',   label: 'Critical' },
  { id: 'moderados',label: 'Warnings' },
  { id: 'ph_ec',    label: 'I/O Desync' },
  { id: 'omitidos', label: 'Dropped' },
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    <div className="space-y-8 pb-16 bg-black text-neutral-300 min-h-screen font-sans">
      
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 pt-8 border-b border-[#222] pb-6">
        <div className="max-w-2xl">
          <h1 className="text-xl font-mono text-neutral-100 flex items-center gap-3">
            <Terminal className="w-5 h-5 text-neutral-400" strokeWidth={1.5} />
            ~/audit-log
          </h1>
          <p className="text-neutral-500 text-xs mt-2 font-mono">
            System execution trace: IO synchronization, environmental deltas, and process dropping events.
          </p>
        </div>

        {/* Lote Selector */}
        <div className="flex items-center gap-2 self-start md:self-center bg-[#0a0a0a] border border-[#222]">
          <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest pl-3">Target</span>
          <select
            value={loteId}
            onChange={(e) => setLoteId(e.target.value)}
            className="text-xs bg-transparent text-neutral-200 px-3 py-1.5 focus:outline-none focus:border-neutral-700 font-mono min-h-[44px] min-w-[44px]"
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

      {lote && (
        <div className="px-6 flex flex-col xl:grid xl:grid-cols-12 gap-8 items-start">

          {/* ── LEFT: CHARTS + ENV CARDS (7/12) ──────────────────────── */}
          <div className="xl:col-span-6 space-y-8 w-full">

            {/* GRÁFICO 1: pH */}
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="font-mono text-sm text-neutral-200 flex items-center gap-2 uppercase tracking-wide">
                    <Droplet className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                    pH Vector
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-px bg-white" />
                    <span className="text-neutral-200">OUT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-px bg-neutral-600 border-b border-dashed border-neutral-600" />
                    <span className="text-neutral-500">REF</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto bg-[#0a0a0a] border border-[#222] p-4">
                {chartData.length > 0 ? (
                  renderCustomLineChart(chartData, 'ph_plan', 'ph_real', '#525252', '#ffffff', [5.0, 7.5])
                ) : (
                  <div className="h-32 flex items-center justify-center text-xs font-mono text-neutral-600">
                    ERR_NO_DATA
                  </div>
                )}
              </div>
            </div>

            {/* GRÁFICO 2: EC */}
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="font-mono text-sm text-neutral-200 flex items-center gap-2 uppercase tracking-wide">
                    <Sliders className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                    EC Vector
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-px bg-white" />
                    <span className="text-neutral-200">OUT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-px bg-neutral-600 border-b border-dashed border-neutral-600" />
                    <span className="text-neutral-500">REF</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto bg-[#0a0a0a] border border-[#222] p-4">
                {chartData.length > 0 ? (
                  renderCustomLineChart(chartData, 'ec_plan', 'ec_real', '#525252', '#ffffff', [0.5, 3.0])
                ) : (
                  <div className="h-32 flex items-center justify-center text-xs font-mono text-neutral-600">
                    ERR_NO_DATA
                  </div>
                )}
              </div>
            </div>

            {/* CRUCE DE SENSORES Y ANOMALÍAS */}
            <div className="space-y-4">
              <div>
                <h3 className="font-mono text-sm text-neutral-200 flex items-center gap-2 uppercase tracking-wide">
                  <Activity className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                  Environment Matrix
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0a0a0a] border border-[#222] p-4 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Peak Temp</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono text-neutral-200">26.8°C</span>
                    <span className="text-[10px] font-mono text-red-500 border border-[#222] px-1.5 py-0.5">
                      [Δ +1.8°C]
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 block truncate">
                    Zone 3 (T+35d) WARN_TEMP
                  </span>
                </div>

                <div className="bg-[#0a0a0a] border border-[#222] p-4 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">VPD Status</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono text-neutral-200">1.12 kPa</span>
                    <span className="text-[10px] font-mono text-[#10b981] border border-[#222] px-1.5 py-0.5">
                      [SYNC]
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 block truncate">
                    Target range locked (92% uptime)
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT: AUDIT LOG (6/12) ───────────────────────────────── */}
          <div className="xl:col-span-6 w-full space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-mono text-sm text-neutral-200 flex items-center gap-2 uppercase tracking-wide">
                <Terminal className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                Event Trace
              </h3>
              
              {/* FILTER TABS INLINE */}
              <div className="flex gap-0.5 bg-[#0a0a0a] border border-[#222] p-0.5 overflow-x-auto no-scrollbar">
                {CHIPS.map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => setFiltroChip(chip.id)}
                    className={`px-3 py-1 text-[10px] font-mono uppercase transition-colors min-h-[44px] min-w-[44px] whitespace-nowrap flex-shrink-0 ${
                      filtroChip === chip.id
                        ? 'bg-[#222] text-neutral-100'
                        : 'bg-transparent text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dense Data Table */}
            <div className="border border-[#222] bg-[#0a0a0a] max-h-[700px] overflow-y-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#0a0a0a] border-b border-[#222] z-10">
                  <tr>
                    <th className="py-2 px-3 text-[10px] font-mono text-neutral-500 uppercase font-normal w-24">Timestamp</th>
                    <th className="py-2 px-3 text-[10px] font-mono text-neutral-500 uppercase font-normal">Operation</th>
                    <th className="py-2 px-3 text-[10px] font-mono text-neutral-500 uppercase font-normal text-right">Deltas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {registrosFiltrados.slice().reverse().map((rd) => {
                    const lotObj   = lote;
                    const diaCiclo = lotObj ? mockDb.calcularDiaDeCiclo(lotObj.fecha_inicio, rd.fecha) : 1;

                    const desviosDia    = desvios.filter(d => d.fecha === rd.fecha);
                    const esGrave       = desviosDia.some(d => d.gravedadGeneral === 'grave');
                    const esModerado    = desviosDia.some(d => d.gravedadGeneral === 'moderada');
                    const tieneDesvios  = desviosDia.length > 0;

                    const realRiego = rd.acciones?.find(a =>
                      a.tipo === 'riego' || a.tipo === 'fertilizacion'
                    );

                    const otrasAcciones = rd.acciones?.filter(ra => ra.tipo !== 'riego' && ra.tipo !== 'fertilizacion') || [];

                    const desvioParams = desviosDia
                      .filter(d => d.tipoDesvio === 'parametro_distinto')
                      .flatMap(d => d.desviosCampos)
                      .filter(dc => dc.campo === 'pH' || dc.campo === 'EC (mS/cm)');

                    // Determine row indicator color
                    let indicatorClass = "bg-transparent";
                    if (esGrave) indicatorClass = "bg-red-500";
                    else if (esModerado) indicatorClass = "bg-yellow-500";
                    else if (rd.acciones?.some(a => a.hecha)) indicatorClass = "bg-neutral-500";
                    
                    return (
                      <React.Fragment key={rd.id}>
                        {/* Main row */}
                        <tr className="hover:bg-[#111] group">
                          <td className="py-2.5 px-3 align-top w-24">
                            <div className="flex items-center gap-2">
                              <div className={`w-1 h-3 ${indicatorClass}`} />
                              <span className="text-[10px] font-mono text-neutral-400">T+{diaCiclo}</span>
                            </div>
                            <div className="text-[9px] font-mono text-neutral-600 pl-3 mt-1">
                              {rd.fecha.slice(5)}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 align-top">
                            {realRiego ? (
                              <div className="space-y-1">
                                <div className="text-[11px] font-mono text-neutral-200">
                                  {realRiego.tipo === 'fertilizacion' ? 'EXEC_FERT' : 'EXEC_IRR'}
                                </div>
                                <div className="text-[10px] font-mono text-neutral-500 flex gap-3">
                                  {realRiego.parametros_real.ph != null && <span>pH:{realRiego.parametros_real.ph}</span>}
                                  {realRiego.parametros_real.ec != null && <span>ec:{realRiego.parametros_real.ec}</span>}
                                  {realRiego.parametros_real.ml_agua != null && <span>vol:{realRiego.parametros_real.ml_agua}</span>}
                                </div>
                              </div>
                            ) : (
                              <div className="text-[11px] font-mono text-neutral-500">IDLE</div>
                            )}

                            {/* Otras Acciones Inline */}
                            {otrasAcciones.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {otrasAcciones.map((ra, rIdx) => (
                                  <span key={rIdx} className={`text-[9px] font-mono px-1 border ${ra.hecha ? 'border-neutral-700 text-neutral-400' : 'border-[#222] text-red-500 line-through'}`}>
                                    {ra.tipo.toUpperCase()}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Desvios notas */}
                            {desviosDia.some(d => d.tipoDesvio === 'no_realizada') && (
                              <div className="mt-1 text-[9px] font-mono text-red-500">
                                {desviosDia
                                  .filter(d => d.tipoDesvio === 'no_realizada')
                                  .map((d, i) => <span key={i}>ERR_DROP: {d.accionTipo.toUpperCase()}<br/></span>)
                                }
                              </div>
                            )}
                            {desviosDia.some(d => d.notas) && (
                              <div className="mt-1 text-[9px] font-mono text-neutral-500 border-l border-neutral-700 pl-2">
                                {desviosDia.filter(d => d.notas).map((d, i) => <span key={i}>"{d.notas}"<br/></span>)}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 align-top text-right">
                            {tieneDesvios && desvioParams.length > 0 ? (
                              <div className="flex flex-col items-end gap-1">
                                {desvioParams.map((dc, i) => {
                                  const delta = dc.magnitud;
                                  const sign  = delta !== null && delta > 0 ? '+' : '';
                                  const label = dc.campo === 'pH' ? 'pH' : 'EC';
                                  const val = delta !== null ? delta.toFixed(1) : '—';
                                  return (
                                    <span key={i} className="text-[10px] font-mono text-red-500 border border-[#222] px-1 whitespace-nowrap bg-black">
                                      [Δ {label} {sign}{val}]
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-[10px] font-mono text-neutral-600">—</span>
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}

                  {registrosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-[11px] font-mono text-neutral-600">
                        0 events found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
  const height  = 160;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };

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
  const gridCount = 4;
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
          stroke="#222"
          strokeWidth="1"
        />
        <text
          x={padding.left - 5} y={y + 3}
          fill="#525252"
          fontSize="9"
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
        if (data.length > 10 && idx % 3 !== 0 && idx !== data.length - 1 && idx !== 0) return null;
        
        return (
          <text key={idx} x={x} y={height - 2} fill="#525252" fontSize="8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" textAnchor="middle">
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
          strokeDasharray="2,2"
          points={planPoints.join(' ')}
          className="opacity-50"
        />
      )}

      {/* Real line (solid, clean) */}
      {realPoints.length > 1 && (
        <polyline
          fill="none"
          stroke={colorReal}
          strokeWidth="1.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
          points={realPoints.join(' ')}
        />
      )}

      {/* Data point squares instead of circles for technical look */}
      {data.map((d, idx) => {
        const rVal = d[keyReal] as number | null;
        if (rVal === null || rVal === undefined) return null;

        const x     = padding.left + (idx / (data.length - 1)) * usableWidth;
        const yReal = padding.top + usableHeight - ((rVal - minVal) / valRange) * usableHeight;

        return (
          <rect
            key={idx}
            x={x - 1.5} y={yReal - 1.5}
            width="3" height="3"
            fill={colorReal}
          />
        );
      })}
    </svg>
  );
}
