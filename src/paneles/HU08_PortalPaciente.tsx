import { useState } from 'react'
import {
  consultarDetallePortal,
  consultarSolicitudesPortal,
} from '../api/portal'
import type {
  HistorialEstadoResponse,
  PageResponse,
  SolicitudDetallePortalResponse,
  SolicitudResumenResponse,
} from '../types/api'
import type { ApiResult } from '../api/client'

/**
 * RUTs de prueba que existen en el data.sql del backend.
 * Se ofrecen como sugerencias para facilitar la demo.
 */
const RUTS_SUGERIDOS = [
  { rut: '12345678-9', descripcion: 'Cardiología EN_ESPERA (GES)' },
  { rut: '11222333-4', descripcion: 'Traumatología CITADA' },
  { rut: '33444555-6', descripcion: 'Cardiología ATENDIDA' },
]

export function HU08PortalPaciente() {
  const [rutInput, setRutInput] = useState('')
  const [rutConsultado, setRutConsultado] = useState('')

  const [page, setPage] =
    useState<PageResponse<SolicitudResumenResponse> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  // Detalle de una solicitud
  const [idDetalle, setIdDetalle] = useState<number | null>(null)
  const [detalle, setDetalle] =
    useState<SolicitudDetallePortalResponse | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  async function consultar(rut: string = rutInput) {
    const rutLimpio = rut.trim()
    if (!rutLimpio) {
      setError('Ingrese su RUT para consultar')
      return
    }

    setCargando(true)
    setError(null)
    setPage(null)
    setIdDetalle(null)
    setDetalle(null)
    setRutConsultado(rutLimpio)

    const res = await consultarSolicitudesPortal(rutLimpio)
    if (res.ok) {
      setPage(res.data)
    } else {
      setError(res.error)
    }
    setCargando(false)
  }

  async function verHistorial(idSolicitud: number) {
    if (idDetalle === idSolicitud) {
      setIdDetalle(null)
      setDetalle(null)
      return
    }

    setIdDetalle(idSolicitud)
    setDetalle(null)
    setCargandoDetalle(true)

    const res = await consultarDetallePortal(idSolicitud, rutConsultado)
    if (res.ok) {
      setDetalle(res.data)
    }
    setCargandoDetalle(false)
  }

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          HU-08 — Portal del paciente
        </h2>
        <p className="text-slate-600 mt-1">
          Consulte el estado de sus solicitudes de atención usando su RUT.
        </p>
      </header>

      {/* Caja de consulta — diseño más amigable que las otras HUs */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Mi RUT
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={rutInput}
              onChange={(e) => setRutInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && consultar()}
              placeholder="ej: 12345678-9"
              className="input flex-1"
            />
            <button
              onClick={() => consultar()}
              disabled={cargando}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold px-5 py-2 rounded transition-colors whitespace-nowrap"
            >
              {cargando ? 'Consultando…' : 'Consultar'}
            </button>
          </div>

          {/* Sugerencias de RUTs para demo */}
          <div className="mt-3">
            <div className="text-xs text-slate-500 mb-1.5">
              RUTs de prueba disponibles:
            </div>
            <div className="flex flex-wrap gap-2">
              {RUTS_SUGERIDOS.map((s) => (
                <button
                  key={s.rut}
                  onClick={() => {
                    setRutInput(s.rut)
                    consultar(s.rut)
                  }}
                  className="text-[11px] bg-white border border-slate-300 hover:border-blue-500 rounded px-2 py-1 text-slate-700 transition-colors"
                  title={s.descripcion}
                >
                  <span className="font-mono">{s.rut}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-4">
          <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
            GET /bff/portal-pacientes/solicitudes?rutPaciente=...
          </code>
        </p>
      </section>

      {/* Estado de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-900 mb-4">
          {error}
        </div>
      )}

      {/* Resultados */}
      {page && page.content.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center text-sm text-amber-900">
          No hay solicitudes registradas para el RUT{' '}
          <span className="font-mono">{rutConsultado}</span>.
        </div>
      )}

      {page && page.content.length > 0 && (
        <section>
          <div className="text-sm text-slate-600 mb-3">
            {page.totalElements} solicitud
            {page.totalElements !== 1 ? 'es' : ''} encontrada
            {page.totalElements !== 1 ? 's' : ''} para{' '}
            <span className="font-mono text-slate-900">{rutConsultado}</span>:
          </div>

          <div className="space-y-3">
            {page.content.map((sol) => (
              <CardSolicitudPaciente
                key={sol.id}
                solicitud={sol}
                expandida={idDetalle === sol.id}
                detalle={idDetalle === sol.id ? detalle : null}
                cargandoDetalle={idDetalle === sol.id && cargandoDetalle}
                onVerHistorial={() => verHistorial(sol.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Card de solicitud (perspectiva del paciente)
// ──────────────────────────────────────────────────────────────

function CardSolicitudPaciente({
  solicitud,
  expandida,
  detalle,
  cargandoDetalle,
  onVerHistorial,
}: {
  solicitud: SolicitudResumenResponse
  expandida: boolean
  detalle: SolicitudDetallePortalResponse | null
  cargandoDetalle: boolean
  onVerHistorial: () => void
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-900">
          {solicitud.especialidad}
        </h3>
        <BadgeEstadoPaciente estado={solicitud.estado} />
      </div>

      <div className="text-sm text-slate-600 space-y-1">
        <div>
          Solicitud registrada{' '}
          <span className="text-slate-900">
            {tiempoTranscurrido(solicitud.fechaRegistro)}
          </span>
        </div>
        {solicitud.fechaCita ? (
          <div className="text-blue-900 bg-blue-50 rounded px-2 py-1 inline-block">
            📅 Su cita:{' '}
            <strong>{formatearFechaAmigable(solicitud.fechaCita)}</strong>
          </div>
        ) : (
          <div className="text-slate-500 italic">
            Aún no se ha asignado una fecha de cita.
          </div>
        )}
      </div>

      {/* Botón ver historial */}
      <button
        onClick={onVerHistorial}
        className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900"
      >
        {expandida ? '▼' : '▶'} Ver historial de mi solicitud
      </button>

      {expandida && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          {cargandoDetalle && (
            <div className="text-sm text-slate-500">Cargando historial…</div>
          )}
          {detalle && (
            <>
              <div className="text-xs text-slate-500 mb-2">
                {detalle.historial.length} cambio
                {detalle.historial.length !== 1 ? 's' : ''} de estado:
              </div>
              <div className="space-y-2">
                {detalle.historial.map((h, idx) => (
                  <EntradaHistorialPaciente key={idx} historial={h} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function EntradaHistorialPaciente({
  historial,
}: {
  historial: HistorialEstadoResponse
}) {
  return (
    <div className="bg-slate-50 rounded p-2.5 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <BadgeEstadoPaciente estado={historial.estadoNuevo} />
        <span className="text-xs text-slate-500">
          {formatearFechaAmigable(historial.fechaCambio)}
        </span>
      </div>
      {historial.motivo && (
        <div className="text-xs text-slate-700 italic">
          Motivo: {historial.motivo}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Badge de estado adaptado al lenguaje del paciente.
 * Mismos colores que en HU-02 pero con etiquetas más legibles si aplica.
 */
function BadgeEstadoPaciente({ estado }: { estado: string }) {
  const colores: Record<string, string> = {
    EN_ESPERA: 'bg-blue-100 text-blue-800 border-blue-300',
    CITADO: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    ATENDIDO: 'bg-green-100 text-green-800 border-green-300',
    AUSENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    CERRADO: 'bg-slate-200 text-slate-700 border-slate-300',
    ANULADO: 'bg-red-100 text-red-800 border-red-300',
    DERIVADO: 'bg-purple-100 text-purple-800 border-purple-300',
    VENCIDO: 'bg-gray-100 text-gray-700 border-gray-300',
  }
  const color = colores[estado] ?? 'bg-slate-100 text-slate-700'
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded border text-xs font-semibold ${color}`}
    >
      {estado.replace('_', ' ')}
    </span>
  )
}

function formatearFechaAmigable(iso: string): string {
  try {
    const fecha = new Date(iso)
    return fecha.toLocaleString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function tiempoTranscurrido(iso: string): string {
  try {
    const fecha = new Date(iso)
    const ahora = new Date()
    const dias = Math.floor(
      (ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (dias === 0) return 'hoy'
    if (dias === 1) return 'hace 1 día'
    if (dias < 30) return `hace ${dias} días`
    const meses = Math.floor(dias / 30)
    if (meses === 1) return 'hace 1 mes'
    return `hace ${meses} meses`
  } catch {
    return iso
  }
}
