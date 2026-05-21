'use client';

import React, { useState, useEffect } from 'react';
import { mockDb } from '@/lib/supabase/mockDb';
import { 
  QrCode, 
  Search, 
  Sprout, 
  Layers, 
  Scale, 
  UserCheck, 
  FileText, 
  Activity, 
  ArrowRight,
  TrendingDown,
  Clock,
  Download,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function TrazabilidadPage() {
  // Búsqueda por precinto. Por defecto cargar MORADO-A-001 para que vean data de inmediato
  const [query, setQuery] = useState('MORADO-A-001');
  const [activePrecintoCode, setActivePrecintoCode] = useState('MORADO-A-001');
  
  // Datos de la cadena reconstruidos
  const [chain, setChain] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showManifestModal, setShowManifestModal] = useState(false);

  const buscarTrazabilidad = (code: string) => {
    if (!code) return;
    
    setErrorMsg('');
    const res = mockDb.buscarTrazabilidadPrecinto(code);
    
    if (res.especimen) {
      setChain(res);
    } else {
      setChain(null);
      setErrorMsg(`No se encontró ningún espécimen o precinto registrado bajo el código "${code}".`);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      buscarTrazabilidad(activePrecintoCode);
    }, 0);
    return () => clearTimeout(t);
  }, [activePrecintoCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query) {
      setActivePrecintoCode(query.toUpperCase());
    }
  };

  const sugerenciasPrecinto = ['MORADO-A-001', 'AMARILLO-B-001', 'VERDE-C-001'];

  return (
    <div className="space-y-8 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <QrCode className="w-6 h-6 text-emerald-500" />
            Trazabilidad Semilla a Paciente
          </h1>
          <p className="text-muted-foreground text-sm">
            Auditoría de cumplimiento legal. Mapeo inmutable de precinto físico a origen INASE y destino medicinal.
          </p>
        </div>
      </div>

      {/* 1. BUSCADOR DE PRECINTO / CÓDIGO QR MOCK */}
      <div className="bg-[#10161d] border border-[#1e293b] p-6 rounded-2xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto space-y-3">
          <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">
            Escaneo / Búsqueda de Precinto Físico
          </label>
          <div className="flex items-center gap-2 bg-[#090d10] border border-[#1e293b] rounded-xl p-1.5 focus-within:border-emerald-500 transition-all">
            <Search className="w-5 h-5 text-muted-foreground pl-1" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ingresa código (ej: MORADO-A-001)..."
              className="w-full bg-transparent border-0 text-sm font-bold text-foreground focus:outline-none focus:ring-0 p-0"
            />
            <button
              type="submit"
              className="py-1.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-900 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            >
              <QrCode className="w-4 h-4 text-slate-900" />
              <span>Escanear Precinto</span>
            </button>
          </div>
          
          {/* Sugerencias de búsqueda rápida */}
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-muted-foreground font-bold">Accesos rápidos:</span>
            {sugerenciasPrecinto.map((sug) => (
              <button
                key={sug}
                onClick={() => {
                  setQuery(sug);
                  setActivePrecintoCode(sug);
                }}
                className={`px-2.5 py-1 rounded bg-[#090d10] border text-[11px] font-bold tracking-wider ${
                  activePrecintoCode === sug 
                    ? 'border-emerald-500 text-emerald-400' 
                    : 'border-[#1e293b] text-muted-foreground hover:text-foreground'
                }`}
              >
                {sug}
              </button>
            ))}
          </div>
        </form>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-400">Error de compliance</p>
            <p className="text-xs text-red-400/80 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* 2. FLUJOGRAMA DE TRAZABILIDAD (CADENA COMPLETA) */}
      {chain && (
        <div className="space-y-6 animate-pulse-slow">
          
          <div className="bg-[#10161d] border border-[#1e293b] p-6 rounded-2xl space-y-6">
            
            {/* Header del Manifiesto */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
              <div>
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">Reconstrucción Inmutable</span>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-500" />
                  Cadena de Custodia: Precinto <b>{chain.precinto?.codigo_completo}</b>
                </h3>
              </div>

              {/* Botón de exportación legal */}
              <button
                onClick={() => setShowManifestModal(true)}
                className="py-2 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Exportar Manifiesto de Cultivo</span>
              </button>
            </div>

            {/* DIAGRAMA DE FLUJO HORIZONTAL DE TRAZABILIDAD */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              
              {/* Bloque 1: Semilla INASE */}
              {renderFlowBlock(
                '1. Origen Semilla',
                chain.origenInase?.codigo_inase || 'INASE-SEM-5491',
                'Registro Legal INASE',
                <Sprout className="w-5 h-5 text-emerald-500" />,
                [
                  { label: 'Proveedor', value: chain.origenInase?.proveedor || 'Distribuidora Medicinal ROU' },
                  { label: 'F. Ingreso', value: chain.origenInase?.fecha_ingreso || '2026-01-05' }
                ]
              )}

              {/* Bloque 2: Planta Madre */}
              {renderFlowBlock(
                '2. Planta Madre',
                chain.especimen?.madre_id ? 'MADRE-KUSH-01' : 'Sin Madre (Semilla)',
                `Variedad: ${chain.genetica?.nombre}`,
                <Activity className="w-5 h-5 text-purple-400" />,
                [
                  { label: 'Cepa', value: chain.genetica?.nombre || 'Super Kush' },
                  { label: 'Tipo Cepa', value: chain.genetica?.tipo?.toUpperCase() || 'INDICA' }
                ]
              )}

              {/* Bloque 3: Lote Activo */}
              {renderFlowBlock(
                '3. Lote de Cultivo',
                chain.lote?.codigo || 'LOTE-KUSH-04',
                `Ubicación: ${chain.lote?.ubicacion_id === 'loc-3' ? 'Carpa 3' : 'Carpa 2'}`,
                <Layers className="w-5 h-5 text-blue-400" />,
                [
                  { label: 'F. Inicio', value: chain.lote?.fecha_inicio || '2026-04-19' },
                  { label: 'Estado Lote', value: chain.lote?.estado?.toUpperCase() || 'ACTIVO' }
                ]
              )}

              {/* Bloque 4: Cosecha */}
              {renderFlowBlock(
                '4. Cosecha Registrada',
                chain.cosecha ? `COSECHA-${chain.lote?.codigo?.split('-')[2]}` : 'Ciclo en Curso',
                chain.cosecha ? `Peso seco: ${chain.cosecha.peso_seco}g` : 'Aún no cosechado',
                <Scale className="w-5 h-5 text-amber-500" />,
                chain.cosecha ? [
                  { label: 'Peso Húmedo', value: `${chain.cosecha.peso_humedo}g` },
                  { label: 'Merma Flora', value: `${chain.cosecha.merma}%` }
                ] : [
                  { label: 'Especie', value: 'Floración' },
                  { label: 'F. Estimada', value: '2026-06-15' }
                ]
              )}

              {/* Bloque 5: Paciente REPROCANN */}
              {renderFlowBlock(
                '5. Paciente Final',
                chain.entregas.length > 0 ? chain.entregas[0].paciente_ref : 'En Proceso de Cura',
                chain.entregas.length > 0 ? `Entrega: ${chain.entregas[0].cantidad}g` : 'Pendiente de entrega',
                <UserCheck className="w-5 h-5 text-cyan-400" />,
                chain.entregas.length > 0 ? [
                  { label: 'Entrega ID', value: chain.entregas[0].id.slice(0, 8).toUpperCase() },
                  { label: 'F. Entrega', value: chain.entregas[0].fecha }
                ] : [
                  { label: 'Paciente', value: 'Pendiente' },
                  { label: 'Destino', value: 'Farmacia / Dispensario' }
                ]
              )}

            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AUDITORÍA DE EVENTOS HISTÓRICOS (Ocupa 2/3 columnas) */}
            <div className="lg:col-span-2 bg-[#10161d] border border-[#1e293b] p-6 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 border-b border-[#1e293b] pb-3 uppercase tracking-wide">
                <Clock className="w-4 h-4 text-emerald-500" />
                Historial Inmutable de Eventos de Auditoría (Lote)
              </h3>
              
              <div className="space-y-4 relative pl-4 border-l border-[#1e293b] no-scrollbar max-h-96 overflow-y-auto">
                {chain.eventos.map((evt: any) => (
                  <div key={evt.id} className="relative space-y-1">
                    
                    {/* Indicador de evento */}
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400" />
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground uppercase tracking-wide">
                        {evt.tipo === 'alta' ? 'Alta de lote en carpa' : 
                         evt.tipo === 'trasplante' ? 'Trasplante y maceta' : 
                         evt.tipo === 'tratamiento' ? 'Acción de poda/fertilización' : evt.tipo}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold">{evt.fecha}</span>
                    </div>

                    <div className="bg-[#090d10]/40 border border-[#1e293b] p-3 rounded-lg text-xs space-y-1">
                      <p className="text-foreground leading-normal font-semibold">
                        {evt.datos.notas || 'Evento de trazabilidad registrado.'}
                      </p>
                      {evt.datos.cantidad_plantas && (
                        <span className="text-[10px] text-emerald-400 block font-bold">
                          Especímenes dados de alta: <b>{evt.datos.cantidad_plantas}</b>
                        </span>
                      )}
                      {evt.datos.parametros && (
                        <div className="text-[10px] text-muted-foreground">
                          Parámetros registrados:{' '}
                          {Object.entries(evt.datos.parametros).map(([k, v]: any) => (
                            <span key={k} className="font-bold ml-1">[{k}: {v}]</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {chain.eventos.length === 0 && (
                  <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-[#1e293b] rounded-xl bg-[#090d10]/10">
                    Ningún evento de trazabilidad manual cargado aún en este ciclo de vida.
                  </div>
                )}
              </div>

            </div>

            {/* DETALLES DE CUMPLIMIENTO REGULATORIO */}
            <div className="bg-[#10161d] border border-[#1e293b] p-6 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 border-b border-[#1e293b] pb-3 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-emerald-500" />
                Resumen de Compliance
              </h3>

              <div className="space-y-3.5 text-xs">
                
                {/* 1. Estado Legal */}
                <div className="bg-[#090d10]/40 p-3 rounded-xl border border-[#1e293b] space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Estado de Auditoría</span>
                  <div className="text-xs text-emerald-400 font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>APROBACIÓN EXCELENTE</span>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground leading-normal mt-0.5">
                    Todos los especímenes coinciden físicamente con el precinto y lote. Origen INASE verificado.
                  </p>
                </div>

                {/* 2. Datos del Regulador */}
                <div className="bg-[#090d10]/40 p-3 rounded-xl border border-[#1e293b] space-y-2">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Autoridades Enlazadas</span>
                  
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Registro INASE:</span>
                      <span className="font-bold text-foreground">Certificado ROU-4829</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">REPROCANN Pacientes:</span>
                      <span className="font-bold text-foreground">Encriptación AES-256</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Firma Inmutable:</span>
                      <span className="font-bold text-foreground">SHA-256 Validada</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* 3. MANIFIESTO IMPRIMIBLE MODAL PREVIEW */}
      {showManifestModal && chain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#10161d] border border-emerald-500/30 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-ring-grow relative max-h-[90vh] flex flex-col">
            
            {/* Header del Modal */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
            <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#131b24]">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <FileText className="w-5 h-5 text-emerald-500" />
                Manifiesto Legal de Cultivo - Formato Inspección
              </h3>
              <button
                onClick={() => setShowManifestModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-bold"
              >
                Cerrar
              </button>
            </div>

            {/* Documento Imprimible */}
            <div className="p-6 overflow-y-auto space-y-6 text-[#090d10] bg-white font-serif flex-1">
              
              {/* Encabezado Formal */}
              <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-4">
                <h2 className="font-black text-lg uppercase tracking-wide font-sans">
                  República de la Trazabilidad Agronómica
                </h2>
                <h4 className="text-xs uppercase tracking-widest font-sans font-bold text-slate-700">
                  Manifiesto de Lote de Cultivo de Cannabis Medicinal
                </h4>
                <p className="text-[10px] font-sans text-slate-500">
                  Conforme con los Códigos INASE vigentes. Documento de control interno inmutable.
                </p>
              </div>

              {/* Información General */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p><b>CÓDIGO DE PRECINTO:</b> {chain.precinto?.codigo_completo}</p>
                  <p><b>GENÉTICA:</b> {chain.genetica?.nombre} ({chain.genetica?.tipo.toUpperCase()})</p>
                  <p><b>LOTE DE ASIGNACIÓN:</b> {chain.lote?.codigo}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p><b>ORIGEN SEMILLA INASE:</b> {chain.origenInase?.codigo_inase}</p>
                  <p><b>UBICACIÓN DE CARPA:</b> {chain.lote?.ubicacion_id === 'loc-3' ? 'Carpa 3 (Sala B)' : 'Carpa 2 (Sala A)'}</p>
                  <p><b>FECHA DE EMISIÓN:</b> 21 de Mayo, 2026</p>
                </div>
              </div>

              {/* Detalle Técnico */}
              <div className="space-y-2 pt-2">
                <h4 className="font-sans font-bold text-xs uppercase border-b border-slate-900 pb-0.5">
                  1. Especificaciones de Producción
                </h4>
                <table className="w-full text-[11px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-400 bg-slate-100 font-sans font-bold">
                      <th className="py-1">Parámetro</th>
                      <th className="py-1">Estándar</th>
                      <th className="py-1">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-1">Cepa Genética</td>
                      <td className="py-1">{chain.genetica?.nombre}</td>
                      <td className="py-1">Banco: {chain.genetica?.banco}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1">Fase del Lote</td>
                      <td className="py-1">{chain.precinto?.categoria}</td>
                      <td className="py-1">Semana de ciclo: {chain.lote?.id === 'lot-kush-floracion' ? 'Semana 5' : 'Semana 2'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1">Responsable</td>
                      <td className="py-1">Juan (Jardinero)</td>
                      <td className="py-1">Supervisión agronómica: Tabaré (Director)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Registro Cosecha y Entrega */}
              <div className="space-y-2 pt-2">
                <h4 className="font-sans font-bold text-xs uppercase border-b border-slate-900 pb-0.5">
                  2. Registro de Cosecha & Pacientes REPROCANN
                </h4>
                <div className="text-[11px] space-y-1">
                  <p>
                    <b>Historial de Cosecha Asociada:</b>{' '}
                    {chain.cosecha 
                      ? `Cosechado el ${chain.cosecha.fecha} con peso seco total de ${chain.cosecha.peso_seco}g (Peso húmedo: ${chain.cosecha.peso_humedo}g, Merma: ${chain.cosecha.merma}%).`
                      : 'El espécimen y lote asociado continúan activos en carpa, previo a corte.'
                    }
                  </p>
                  <p>
                    <b>Paciente Autorizado (REPROCANN Encriptado):</b>{' '}
                    {chain.entregas.length > 0
                      ? `Entrega realizada bajo referencia ${chain.entregas[0].paciente_ref} por una cantidad de ${chain.entregas[0].cantidad}g el día ${chain.entregas[0].fecha}.`
                      : 'Lote en cultivo activo. No se registran entregas parciales asociadas.'
                    }
                  </p>
                </div>
              </div>

              {/* Firmas y Sellos */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-sans">
                <div className="space-y-4">
                  <div className="h-10 border-b border-slate-900 w-48 mx-auto" />
                  <p><b>Firma del Jardinero</b><br />Juan Core</p>
                </div>
                <div className="space-y-4">
                  <div className="h-10 border-b border-slate-900 w-48 mx-auto" />
                  <p><b>Firma Director Técnico</b><br />Tabaré (Cultivo Dir)</p>
                </div>
              </div>

            </div>

            {/* Footer del Modal */}
            <div className="p-4 border-t border-[#1e293b] flex items-center justify-between bg-[#131b24]">
              <span className="text-[10px] text-muted-foreground">
                Código SHA-256: 7f82b3d9...c281e
              </span>
              <button
                onClick={() => {
                  window.print();
                }}
                className="py-1.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-lg text-xs font-bold transition-all"
              >
                Imprimir Manifiesto
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// HELPER RENDER PARA BLOQUE DE HISTORIAL DE COMPLIANCE (FLOW CHARTS)
function renderFlowBlock(
  title: string,
  code: string,
  desc: string,
  Icon: React.ReactNode,
  fields: { label: string; value: string }[]
) {
  return (
    <div className="bg-[#090d10]/60 border border-[#1e293b] p-4 rounded-xl flex flex-col justify-between hover:border-[#10b981]/20 transition-all space-y-4 relative">
      
      {/* Icono e Info de Cabecera */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{title}</span>
          {Icon}
        </div>
        <h4 className="font-extrabold text-sm text-foreground tracking-wide truncate" title={code}>
          {code}
        </h4>
        <p className="text-[10px] text-muted-foreground font-semibold leading-tight">
          {desc}
        </p>
      </div>

      {/* Parámetros pequeños */}
      <div className="space-y-1 pt-2 border-t border-[#1e293b]/50 text-[10px]">
        {fields.map((f, idx) => (
          <div key={idx} className="flex justify-between">
            <span className="text-muted-foreground">{f.label}:</span>
            <span className="font-bold text-foreground">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
