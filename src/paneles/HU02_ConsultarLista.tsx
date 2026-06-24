import { useEffect, useState } from 'react'
import { listarEspecialidades } from '../api/especialidades'
import {
  listarSolicitudes,
  obtenerDetalleSolicitud,
} from '../api/solicitudes'
import type {
  EspecialidadResponse,
  EstadoSolicitud,
  HistorialEstadoResponse,
  PageResponse,
  SolicitudDetalleResponse,
  SolicitudResponse,
} from '../types/api'

const ESTADOS: EstadoSolicitud[] = [
  'EN_ESPERA',
  'CITADO',
  'ATENDIDO',
  'AUSENTE',
  'CERRADO',
  'ANULADO',
  'DERIVADO',
  'VENCIDO',
]

const PAGE_SIZE = 10

interface Filtros {
  especialidadId: number | null
  estado: EstadoSolicitud | null
  rutPaciente: string
}

const FILTROS_INICIALES: Filtros = {
  especialidadId: null,
  estado: null,
  rutPaciente: '',
}

export function HU02ConsultarLista() {
  // Catálogo (cargado una vez)
  const [especialidades, setEspecialidades] = useState<EspecialidadResponse[]>([])

  // Filtros (lo que el usuario va escribiendo)
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES)

  // Resultado del listado
  const [page, setPage] = useState<PageResponse<SolicitudResponse> | null>(null)
  const [paginaActual, setPaginaActual] = useState(0)
  const [cargandoLista, setCargandoLista] = useState(false)
  const [errorLista, setErrorLista] = useState<string | null>(null)

  // Detalle expandido
  const [idDetalle, setIdDetalle] = useState<number | null>(null)
  const [detalle, setDetalle] = useState<SolicitudDetalleResponse | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null)

  // Cargar especialidades al montar
  useEffect(() => {
    listarEspecialidades().then((res) => {
      if (res.ok) setEspecialidades(res.data)
    })
  }, [])

  async function buscar(pagina: number = 0) {
    setCargandoLista(true)
    setErrorLista(null)
    setIdDetalle(null)
    setDetalle(null)

    const res = await listarSolicitudes({
      especialidadId: filtros.especialidadId ?? undefined,
      estado: filtros.estado ?? undefined,
      rutPaciente: filtros.rutPaciente.trim() || undefined,
      page: pagina,
      size: PAGE_SIZE,
    })

    if (res.ok) {
      setPage(res.data)
      setPaginaActual(pagina)
    } else {
      setErrorLista(res.error)
      setPage(null)
    }
    setCargandoLista(false)
  }

  function resetearFiltros() {
    setFiltros(FILTROS_INICIALES)
  }

  async function abrirDetalle(id: number) {
    if (idDetalle === id) {
      // Click sobre la misma fila → cerrar
      setIdDetalle(null)
      setDetalle(null)
      return
    }
    setIdDetalle(id)
    setDetalle(null)
    setErrorDetalle(null)
    setCargandoDetalle(true)

    const res = await obtenerDetalleSolicitud(id)
    if (res.ok) {
      setDetalle(res.data)
    } else {
      setErrorDetalle(res.error)
    }
    setCargandoDetalle(false)
  }

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          HU-02 — Consultar lista de espera
        </h2>
        <p className="text-slate-600 mt-1">
          Como médico clínico, quiero consultar la lista de espera con filtros y
          criterios de ordenamiento, para encontrar solicitudes específicas y
          tener visibilidad del estado general de la lista.
        </p>
      </header>

      <BarraFiltros
        filtros={filtros}
        setFiltros={setFiltros}
        especialidades={especialidades}
        onBuscar={() => buscar(0)}
        onResetear={resetearFiltros}
        cargando={cargandoLista}
      />

      <ResultadoLista
        page={page}
        cargando={cargandoLista}
        error={errorLista}
        idDetalle={idDetalle}
        onClickFila={abrirDetalle}
      />

      {page && page.totalPages > 1 && (
        <Paginacion
          paginaActual={paginaActual}
          totalPages={page.totalPages}
          onCambiarPagina={buscar}
        />
      )}

      {idDetalle !== null && (
        <PanelDetalle
          id={idDetalle}
          detalle={detalle}
          cargando={cargandoDetalle}
          error={errorDetalle}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Barra de filtros
// ──────────────────────────────────────────────────────────────

function BarraFiltros({
  filtros,
  setFiltros,
  especialidades,
  onBuscar,
  onResetear,
  cargando,
}: {
  filtros: Filtros
  setFiltros: (f: Filtros) => void
  especialidades: EspecialidadResponse[]
  onBuscar: () => void
  onResetear: () => void
  cargando: boolean
}) {
  return (
    <section className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Especialidad
          </label>
          <select
            value={filtros.especialidadId ?? ''}
            onChange={(e) =>
              setFiltros({
                ...filtros,
                especialidadId: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="input"
          >
            <option value="">— Todas —</option>
            {especialidades.map((esp) => (
              <option key={esp.id} value={esp.id}>
                {esp.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Estado
          </label>
          <select
            value={filtros.estado ?? ''}
            onChange={(e) =>
              setFiltros({
                ...filtros,
                estado: (e.target.value as EstadoSolicitud) || null,
              })
            }
            className="input"
          >
            <option value="">— Todos —</option>
            {ESTADOS.map((est) => (
              <option key={est} value={est}>
                {est}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            RUT del paciente
          </label>
          <input
            type="text"
            value={filtros.rutPaciente}
            onChange={(e) =>
              setFiltros({ ...filtros, rutPaciente: e.target.value })
            }
            placeholder="ej: 12345678-9"
            className="input"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={onBuscar}
            disabled={cargando}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold px-4 py-2 rounded text-sm transition-colors flex-1"
          >
            {cargando ? 'Buscando…' : 'Buscar'}
          </button>
          <button
            onClick={onResetear}
            disabled={cargando}
            className="border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-semibold px-3 py-2 rounded text-sm transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-3">
        <code className="bg-slate-100 px-1.5 py-0.5 rounded">
          GET /bff/lista-espera/solicitudes
        </code>
        {' '}— filtros opcionales, paginación ascendente por prioridad.
      </p>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────
// Tabla de resultados
// ──────────────────────────────────────────────────────────────

function ResultadoLista({
  page,
  cargando,
  error,
  idDetalle,
  onClickFila,
}: {
  page: PageResponse<SolicitudResponse> | null
  cargando: boolean
  error: string | null
  idDetalle: number | null
  onClickFila: (id: number) => void
}) {
  if (cargando) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
        Cargando…
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-900">
        Error al consultar: {error}
      </div>
    )
  }

  if (!page) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
        Presiona "Buscar" para listar las solicitudes.
      </div>
    )
  }

  if (page.content.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
        No se encontraron solicitudes con esos filtros.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-3">
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
        {page.totalElements} solicitud{page.totalElements !== 1 ? 'es' : ''}{' '}
        en total
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
          <tr>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Paciente</th>
            <th className="px-4 py-2 text-left">Especialidad</th>
            <th className="px-4 py-2 text-center">Prioridad</th>
            <th className="px-4 py-2 text-left">Estado</th>
            <th className="px-4 py-2 text-left">Registro</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {page.content.map((sol) => {
            const isAbierto = idDetalle === sol.id
            return (
              <tr
                key={sol.id}
                onClick={() => onClickFila(sol.id)}
                className={`border-t border-slate-100 cursor-pointer transition-colors ${
                  isAbierto ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <td className="px-4 py-2 font-mono text-slate-500">#{sol.id}</td>
                <td className="px-4 py-2 font-mono">{sol.rutPaciente}</td>
                <td className="px-4 py-2">{sol.especialidad}</td>
                <td className="px-4 py-2 text-center">
                  <BadgePrioridad prioridad={sol.prioridad} />
                </td>
                <td className="px-4 py-2">
                  <BadgeEstado estado={sol.estado} />
                </td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {formatearFecha(sol.fechaRegistro)}
                </td>
                <td className="px-4 py-2 text-right text-slate-400">
                  {isAbierto ? '▼' : '›'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Paginación
// ──────────────────────────────────────────────────────────────

function Paginacion({
  paginaActual,
  totalPages,
  onCambiarPagina,
}: {
  paginaActual: number
  totalPages: number
  onCambiarPagina: (n: number) => void
}) {
  return (
    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-2 mb-4">
      <button
        onClick={() => onCambiarPagina(paginaActual - 1)}
        disabled={paginaActual === 0}
        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-slate-300 disabled:cursor-not-allowed"
      >
        « Anterior
      </button>
      <span className="text-sm text-slate-600">
        Página <strong>{paginaActual + 1}</strong> de {totalPages}
      </span>
      <button
        onClick={() => onCambiarPagina(paginaActual + 1)}
        disabled={paginaActual + 1 >= totalPages}
        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-slate-300 disabled:cursor-not-allowed"
      >
        Siguiente »
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Panel de detalle
// ──────────────────────────────────────────────────────────────

function PanelDetalle({
  id,
  detalle,
  cargando,
  error,
}: {
  id: number
  detalle: SolicitudDetalleResponse | null
  cargando: boolean
  error: string | null
}) {
  const [historialAbierto, setHistorialAbierto] = useState(false)

  if (cargando) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 text-center text-slate-500 text-sm">
        Cargando detalle de #{id}…
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-900">
        Error al cargar el detalle: {error}
      </div>
    )
  }

  if (!detalle) return null

  return (
    <section className="bg-white border-2 border-blue-300 rounded-lg p-5">
      <h3 className="font-bold text-slate-900 mb-3">
        Detalle de la solicitud #{detalle.id}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
        <DatoDetalle label="Paciente" valor={detalle.rutPaciente} />
        <DatoDetalle label="Funcionario" valor={detalle.rutFuncionario} />
        <DatoDetalle label="Especialidad" valor={detalle.especialidad} />
        <DatoDetalle label="Nivel urgencia" valor={detalle.nivelUrgencia} />
        <DatoDetalle
          label="Prioridad"
          valor={<BadgePrioridad prioridad={detalle.prioridad} />}
        />
        <DatoDetalle
          label="Estado"
          valor={<BadgeEstado estado={detalle.estado} />}
        />
        <DatoDetalle
          label="Es GES"
          valor={detalle.esGES ? `Sí — ${detalle.patologiaGES ?? '(sin patología)'}` : 'No'}
        />
        <DatoDetalle
          label="Es vulnerable"
          valor={
            detalle.esVulnerable
              ? `Sí — ${detalle.tipoVulnerabilidad ?? '(sin tipo)'}`
              : 'No'
          }
        />
        <DatoDetalle
          label="Fecha registro"
          valor={formatearFecha(detalle.fechaRegistro)}
        />
        <DatoDetalle
          label="Fecha cita"
          valor={
            detalle.fechaCita ? formatearFecha(detalle.fechaCita) : 'Sin cita'
          }
        />
        <div className="md:col-span-2">
          <div className="text-xs text-slate-500 mb-1">Diagnóstico</div>
          <div className="text-slate-900">{detalle.diagnostico}</div>
        </div>
      </div>

      {/* Historial expandible */}
      <button
        onClick={() => setHistorialAbierto(!historialAbierto)}
        className="text-sm font-semibold text-blue-700 hover:text-blue-900"
      >
        {historialAbierto ? '▼' : '▶'} Historial ({detalle.historial.length}{' '}
        entrada{detalle.historial.length !== 1 ? 's' : ''})
      </button>

      {historialAbierto && (
        <div className="mt-3 space-y-2">
          {detalle.historial.map((h, idx) => (
            <EntradaHistorial key={idx} historial={h} />
          ))}
        </div>
      )}
    </section>
  )
}

function DatoDetalle({
  label,
  valor,
}: {
  label: string
  valor: React.ReactNode
}) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-slate-900 mt-0.5">{valor}</div>
    </div>
  )
}

function EntradaHistorial({
  historial,
}: {
  historial: HistorialEstadoResponse
}) {
  return (
    <div className="bg-slate-50 rounded p-3 text-sm">
      <div className="flex items-center gap-2 mb-1">
        {historial.estadoAnterior ? (
          <>
            <BadgeEstado estado={historial.estadoAnterior} />
            <span className="text-slate-400">→</span>
          </>
        ) : (
          <span className="text-xs text-slate-500 italic">Inicial:</span>
        )}
        <BadgeEstado estado={historial.estadoNuevo} />
      </div>
      <div className="text-xs text-slate-500">
        {formatearFecha(historial.fechaCambio)} · por{' '}
        <span className="font-mono">{historial.rutUsuarioResponsable}</span>
      </div>
      {historial.motivo && (
        <div className="text-xs text-slate-700 mt-1 italic">
          Motivo: {historial.motivo}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Badges visuales y helpers
// ──────────────────────────────────────────────────────────────

function BadgePrioridad({ prioridad }: { prioridad: number }) {
  const colores: Record<number, string> = {
    1: 'bg-red-100 text-red-800 border-red-300',
    2: 'bg-orange-100 text-orange-800 border-orange-300',
    3: 'bg-amber-100 text-amber-800 border-amber-300',
    4: 'bg-slate-100 text-slate-700 border-slate-300',
  }
  const color = colores[prioridad] ?? 'bg-slate-100 text-slate-700'
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded border text-xs font-bold ${color}`}
    >
      P{prioridad}
    </span>
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

function formatearFecha(iso: string): string {
  // El backend manda LocalDateTime como "2026-07-15T10:30:00"
  // Lo mostramos en formato más legible
  try {
    const fecha = new Date(iso)
    return fecha.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
