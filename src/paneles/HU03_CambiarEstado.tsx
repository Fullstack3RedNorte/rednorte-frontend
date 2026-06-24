import { useState } from 'react'
import {
  cambiarEstadoSolicitud,
  obtenerDetalleSolicitud,
} from '../api/solicitudes'
import { EscenarioCard } from '../components/EscenarioCard'
import {
  requiereFechaCita,
  requiereMotivo,
  transicionesPosibles,
} from '../utils/transiciones'
import type {
  CambiarEstadoRequest,
  EstadoSolicitud,
  SolicitudDetalleResponse,
  SolicitudResponse,
} from '../types/api'
import type { ApiResult } from '../api/client'

// ──────────────────────────────────────────────────────────────
// Presets de escenarios automáticos
// ──────────────────────────────────────────────────────────────

interface EscenarioCambioEstado {
  id: string
  titulo: string
  codigoEsperado: number
  variante: 'exito' | 'error'
  // Pista para el usuario sobre qué solicitud usar
  pistaSolicitud: string
  /** ID de la solicitud ficticia que se debe usar (asume data.sql cargado) */
  idSolicitud: number
  request: CambiarEstadoRequest
}

/**
 * Helper para generar una fecha futura en formato ISO LocalDateTime
 * que el backend acepta. Ej: "2026-07-15T10:30:00"
 */
function fechaFutura(diasAdelante: number): string {
  const d = new Date()
  d.setDate(d.getDate() + diasAdelante)
  d.setMinutes(0, 0, 0)
  // toISOString devuelve "2026-07-15T10:30:00.000Z"
  // Java LocalDateTime no acepta el sufijo Z ni los milisegundos, lo recortamos
  return d.toISOString().split('.')[0]
}

function fechaPasada(diasAtras: number): string {
  const d = new Date()
  d.setDate(d.getDate() - diasAtras)
  d.setMinutes(0, 0, 0)
  return d.toISOString().split('.')[0]
}

/**
 * Los IDs 1..6 vienen del data.sql ficticio del backend.
 *  #1 EN_ESPERA (Cardiología GES)
 *  #2 EN_ESPERA (Broncopulmonar URGENTE)
 *  #3 CITADO (Traumatología vulnerable)
 *  #5 ATENDIDO (Cardiología GES)
 */
const ESCENARIOS: EscenarioCambioEstado[] = [
  {
    id: 'citar-ok',
    titulo: 'Citar EN_ESPERA con fechaCita futura',
    codigoEsperado: 200,
    variante: 'exito',
    pistaSolicitud: '#2 está EN_ESPERA',
    idSolicitud: 2,
    request: {
      nuevoEstado: 'CITADO',
      fechaCita: fechaFutura(10),
      motivo: null,
    },
  },
  {
    id: 'citar-sin-fecha',
    titulo: 'Citar sin fechaCita (422)',
    codigoEsperado: 422,
    variante: 'error',
    pistaSolicitud: '#1 está EN_ESPERA',
    idSolicitud: 1,
    request: {
      nuevoEstado: 'CITADO',
      fechaCita: null,
      motivo: null,
    },
  },
  {
    id: 'citar-fecha-pasada',
    titulo: 'Citar con fechaCita en el pasado (422)',
    codigoEsperado: 422,
    variante: 'error',
    pistaSolicitud: '#1 está EN_ESPERA',
    idSolicitud: 1,
    request: {
      nuevoEstado: 'CITADO',
      fechaCita: fechaPasada(5),
      motivo: null,
    },
  },
  {
    id: 'transicion-invalida',
    titulo: 'Transición inválida EN_ESPERA → ATENDIDO (400)',
    codigoEsperado: 400,
    variante: 'error',
    pistaSolicitud: '#1 está EN_ESPERA',
    idSolicitud: 1,
    request: {
      nuevoEstado: 'ATENDIDO',
      fechaCita: null,
      motivo: null,
    },
  },
  {
    id: 'anular-sin-motivo',
    titulo: 'Anular sin motivo (422)',
    codigoEsperado: 422,
    variante: 'error',
    pistaSolicitud: '#1 está EN_ESPERA',
    idSolicitud: 1,
    request: {
      nuevoEstado: 'ANULADO',
      fechaCita: null,
      motivo: null,
    },
  },
  {
    id: 'id-inexistente',
    titulo: 'ID inexistente (404)',
    codigoEsperado: 404,
    variante: 'error',
    pistaSolicitud: '#9999 no existe',
    idSolicitud: 9999,
    request: {
      nuevoEstado: 'CITADO',
      fechaCita: fechaFutura(10),
      motivo: null,
    },
  },
]

// ──────────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────────

export function HU03CambiarEstado() {
  // Flujo guiado
  const [idInput, setIdInput] = useState('')
  const [solicitudCargada, setSolicitudCargada] =
    useState<SolicitudDetalleResponse | null>(null)
  const [errorCargar, setErrorCargar] = useState<string | null>(null)
  const [cargandoCargar, setCargandoCargar] = useState(false)

  const [nuevoEstado, setNuevoEstado] = useState<EstadoSolicitud | ''>('')
  const [motivo, setMotivo] = useState('')
  const [fechaCita, setFechaCita] = useState('')

  const [resultadoManual, setResultadoManual] =
    useState<ApiResult<SolicitudResponse> | null>(null)
  const [enviandoManual, setEnviandoManual] = useState(false)

  // Escenarios automáticos
  const [resultadosEscenarios, setResultadosEscenarios] = useState<
    Record<string, ApiResult<SolicitudResponse> | null>
  >({})
  const [cargandoEscenario, setCargandoEscenario] = useState<string | null>(null)

  async function cargarSolicitud() {
    const id = Number(idInput)
    if (!id) {
      setErrorCargar('Ingresa un ID válido')
      return
    }
    setCargandoCargar(true)
    setErrorCargar(null)
    setSolicitudCargada(null)
    setNuevoEstado('')
    setMotivo('')
    setFechaCita('')
    setResultadoManual(null)

    const res = await obtenerDetalleSolicitud(id)
    if (res.ok) {
      setSolicitudCargada(res.data)
    } else {
      setErrorCargar(res.error)
    }
    setCargandoCargar(false)
  }

  async function ejecutarCambioManual() {
    if (!solicitudCargada || !nuevoEstado) return

    const request: CambiarEstadoRequest = {
      nuevoEstado,
      motivo: motivo.trim() || null,
      fechaCita: fechaCita || null,
    }
    setEnviandoManual(true)
    const res = await cambiarEstadoSolicitud(solicitudCargada.id, request)
    setResultadoManual(res)
    setEnviandoManual(false)

    // Si salió bien, recargar el detalle para reflejar el nuevo estado
    if (res.ok) {
      const detalleActualizado = await obtenerDetalleSolicitud(
        solicitudCargada.id
      )
      if (detalleActualizado.ok) {
        setSolicitudCargada(detalleActualizado.data)
        setNuevoEstado('')
        setMotivo('')
        setFechaCita('')
      }
    }
  }

  async function ejecutarEscenario(esc: EscenarioCambioEstado) {
    setCargandoEscenario(esc.id)
    const res = await cambiarEstadoSolicitud(esc.idSolicitud, esc.request)
    setResultadosEscenarios((prev) => ({ ...prev, [esc.id]: res }))
    setCargandoEscenario(null)
  }

  // Opciones del dropdown filtradas según el estado actual de la solicitud cargada
  const transicionesDisponibles = solicitudCargada
    ? transicionesPosibles(solicitudCargada.estado)
    : []

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          HU-03 — Modificar estado de solicitud
        </h2>
        <p className="text-slate-600 mt-1">
          Como médico clínico, quiero modificar el estado de una solicitud para
          reflejar los cambios en el ciclo de vida del paciente.
        </p>
      </header>

      {/* ───── Flujo guiado ───── */}
      <section className="bg-white rounded-lg border border-slate-200 p-5 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Flujo guiado</h3>

        {/* Paso 1 — Cargar solicitud */}
        <div className="mb-4">
          <div className="text-xs font-bold text-slate-500 uppercase mb-2">
            Paso 1 — Cargar solicitud
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1 max-w-xs">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                ID de la solicitud
              </label>
              <input
                type="number"
                value={idInput}
                onChange={(e) => setIdInput(e.target.value)}
                placeholder="ej: 1"
                className="input"
              />
            </div>
            <button
              onClick={cargarSolicitud}
              disabled={cargandoCargar || !idInput}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold px-4 py-2 rounded text-sm transition-colors"
            >
              {cargandoCargar ? 'Cargando…' : 'Cargar'}
            </button>
          </div>
          {errorCargar && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded p-2 text-sm text-red-900">
              {errorCargar}
            </div>
          )}
          {solicitudCargada && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3 text-sm">
              <div className="font-semibold text-blue-900">
                Solicitud #{solicitudCargada.id} — {solicitudCargada.especialidad}
              </div>
              <div className="text-blue-800 text-xs mt-1">
                Paciente: {solicitudCargada.rutPaciente} · Estado actual:{' '}
                <BadgeEstado estado={solicitudCargada.estado} /> · Prioridad{' '}
                {solicitudCargada.prioridad}
              </div>
            </div>
          )}
        </div>

        {/* Paso 2 — Elegir transición (solo si hay solicitud cargada) */}
        {solicitudCargada && (
          <div className="mb-4">
            <div className="text-xs font-bold text-slate-500 uppercase mb-2">
              Paso 2 — Elegir transición
            </div>

            {transicionesDisponibles.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
                <strong>Estado terminal:</strong> "{solicitudCargada.estado}" no
                admite transiciones de salida. No se puede modificar.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Nuevo estado
                    </label>
                    <select
                      value={nuevoEstado}
                      onChange={(e) =>
                        setNuevoEstado(e.target.value as EstadoSolicitud)
                      }
                      className="input"
                    >
                      <option value="">— Selecciona —</option>
                      {transicionesDisponibles.map((est) => (
                        <option key={est} value={est}>
                          {est}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      Solo se muestran transiciones válidas desde "
                      {solicitudCargada.estado}".
                    </p>
                  </div>

                  {nuevoEstado && requiereFechaCita(nuevoEstado) && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Fecha de cita <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={fechaCita}
                        onChange={(e) => setFechaCita(e.target.value)}
                        className="input"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Obligatoria, debe ser futura.
                      </p>
                    </div>
                  )}

                  {nuevoEstado && requiereMotivo(nuevoEstado) && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Motivo <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder={`Razón para ${nuevoEstado.toLowerCase()}`}
                        className="input"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Obligatorio para {nuevoEstado}.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Paso 3 — Ejecutar */}
        {solicitudCargada && transicionesDisponibles.length > 0 && (
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase mb-2">
              Paso 3 — Ejecutar
            </div>
            <button
              onClick={ejecutarCambioManual}
              disabled={enviandoManual || !nuevoEstado}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-semibold px-4 py-2 rounded text-sm transition-colors"
            >
              {enviandoManual ? 'Enviando…' : 'Enviar cambio de estado'}
            </button>
            <span className="ml-3 text-xs text-slate-500">
              PATCH /bff/lista-espera/solicitudes/{solicitudCargada.id}/estado
            </span>

            {resultadoManual && (
              <ResultadoManual resultado={resultadoManual} />
            )}
          </div>
        )}
      </section>

      {/* ───── Grilla de escenarios automáticos ───── */}
      <section>
        <h3 className="font-semibold text-slate-900 mb-3">
          Escenarios automáticos
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Estos escenarios apuntan a las solicitudes ficticias cargadas por el
          data.sql. Si alguien las modificó manualmente, los códigos de
          respuesta pueden variar.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ESCENARIOS.map((esc) => (
            <EscenarioCard<SolicitudResponse>
              key={esc.id}
              titulo={esc.titulo}
              endpoint={`PATCH /solicitudes/${esc.idSolicitud}/estado`}
              codigoEsperado={esc.codigoEsperado}
              variante={esc.variante}
              resultado={resultadosEscenarios[esc.id] ?? null}
              cargando={cargandoEscenario === esc.id}
              onEjecutar={() => ejecutarEscenario(esc)}
              renderExito={(data) => (
                <div className="bg-green-50 border border-green-200 rounded p-2 text-xs space-y-1">
                  <div>
                    <span className="text-slate-500">ID:</span>{' '}
                    <span className="font-mono">#{data.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Estado:</span>{' '}
                    <BadgeEstado estado={data.estado} />
                  </div>
                  {data.fechaCita && (
                    <div>
                      <span className="text-slate-500">Fecha cita:</span>{' '}
                      <span className="text-slate-800">{data.fechaCita}</span>
                    </div>
                  )}
                </div>
              )}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────────────────────

function ResultadoManual({
  resultado,
}: {
  resultado: ApiResult<SolicitudResponse>
}) {
  const color = resultado.ok
    ? 'bg-green-100 text-green-800 border-green-300'
    : 'bg-red-100 text-red-800 border-red-300'

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${color}`}
        >
          {resultado.status ?? 'N/A'}
        </span>
        <span className="text-sm text-slate-600">
          {resultado.ok ? 'Estado actualizado' : 'Error'}
        </span>
      </div>
      {resultado.ok ? (
        <div className="bg-green-50 border border-green-200 rounded p-2 text-xs space-y-1">
          <div>
            <span className="text-slate-500">Solicitud:</span>{' '}
            <span className="font-mono">#{resultado.data.id}</span>
          </div>
          <div>
            <span className="text-slate-500">Estado nuevo:</span>{' '}
            <BadgeEstado estado={resultado.data.estado} />
          </div>
          {resultado.data.fechaCita && (
            <div>
              <span className="text-slate-500">Fecha cita:</span>{' '}
              {resultado.data.fechaCita}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-900">
          {resultado.error}
        </div>
      )}
    </div>
  )
}

function BadgeEstado({ estado }: { estado: EstadoSolicitud }) {
  const colores: Record<EstadoSolicitud, string> = {
    EN_ESPERA: 'bg-blue-100 text-blue-800 border-blue-300',
    CITADO: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    ATENDIDO: 'bg-green-100 text-green-800 border-green-300',
    AUSENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    CERRADO: 'bg-slate-200 text-slate-700 border-slate-300',
    ANULADO: 'bg-red-100 text-red-800 border-red-300',
    DERIVADO: 'bg-purple-100 text-purple-800 border-purple-300',
    VENCIDO: 'bg-gray-100 text-gray-700 border-gray-300',
  }
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded border text-[10px] font-semibold ${colores[estado]}`}
    >
      {estado}
    </span>
  )
}
