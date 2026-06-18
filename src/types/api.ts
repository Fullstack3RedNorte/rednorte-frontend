// =============================================================
// Tipos espejo de los DTOs del backend RedNorte
// Sincronizados con MS-ListaEspera y MS-PortalPacientes (junio 2026)
// =============================================================

// ----- Enums -----
export type EstadoSolicitud =
  | 'EN_ESPERA'
  | 'CITADO'
  | 'ATENDIDO'
  | 'AUSENTE'
  | 'CERRADO'
  | 'ANULADO'
  | 'DERIVADO'
  | 'VENCIDO'

export type NivelUrgencia = 'GES' | 'URGENTE' | 'ELECTIVA'

// ----- Requests (lo que el front envía) -----
export interface CrearSolicitudRequest {
  rutPaciente: string
  especialidadId: number
  diagnostico: string
  esGES: boolean
  patologiaGES?: string | null
  nivelUrgencia: NivelUrgencia
  esVulnerable: boolean
  tipoVulnerabilidadId?: number | null
}

export interface CambiarEstadoRequest {
  nuevoEstado: EstadoSolicitud
  motivo?: string | null
  fechaCita?: string | null // ISO 8601: "2026-07-15T10:30:00"
}

// ----- Responses (lo que el backend retorna) -----
export interface EspecialidadResponse {
  id: number
  nombre: string
  descripcion: string
}

export interface SolicitudResponse {
  id: number
  rutPaciente: string
  especialidad: string
  prioridad: number
  estado: EstadoSolicitud
  fechaRegistro: string
  fechaCita: string | null
}

export interface HistorialEstadoResponse {
  estadoAnterior: EstadoSolicitud | null
  estadoNuevo: EstadoSolicitud
  motivo: string | null
  fechaCambio: string
  rutUsuarioResponsable: string
}

export interface SolicitudDetalleResponse {
  id: number
  rutPaciente: string
  rutFuncionario: string
  especialidad: string
  diagnostico: string
  esGES: boolean
  patologiaGES: string | null
  nivelUrgencia: NivelUrgencia
  esVulnerable: boolean
  tipoVulnerabilidad: string | null
  prioridad: number
  estado: EstadoSolicitud
  fechaRegistro: string
  fechaActualizacion: string
  fechaCita: string | null
  historial: HistorialEstadoResponse[]
}

// ----- Paginación genérica -----
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  currentPage: number
}

// ----- DTOs específicos del Portal Pacientes -----
export interface SolicitudResumenResponse {
  id: number
  especialidad: string
  estado: string
  fechaRegistro: string
  fechaCita: string | null
}

export interface SolicitudDetallePortalResponse {
  id: number
  especialidad: string
  estado: string
  fechaRegistro: string
  fechaCita: string | null
  historial: HistorialEstadoResponse[]
}