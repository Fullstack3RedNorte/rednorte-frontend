import { apiClient, safeRequest, type ApiResult } from './client'
import type {
  CambiarEstadoRequest,
  CrearSolicitudRequest,
  EstadoSolicitud,
  PageResponse,
  SolicitudDetalleResponse,
  SolicitudResponse,
} from '../types/api'

/**
 * POST /bff/lista-espera/solicitudes
 *
 * Crea una nueva solicitud de atención.
 */
export async function crearSolicitud(
  request: CrearSolicitudRequest
): Promise<ApiResult<SolicitudResponse>> {
  return safeRequest(() =>
    apiClient.post<SolicitudResponse>(
      '/bff/lista-espera/solicitudes',
      request
    )
  )
}

export interface ListarSolicitudesParams {
  especialidadId?: number
  estado?: EstadoSolicitud
  rutPaciente?: string
  page?: number
  size?: number
  ordenarPor?: string
}

/**
 * GET /bff/lista-espera/solicitudes
 */
export async function listarSolicitudes(
  params: ListarSolicitudesParams = {}
): Promise<ApiResult<PageResponse<SolicitudResponse>>> {
  return safeRequest(() =>
    apiClient.get<PageResponse<SolicitudResponse>>(
      '/bff/lista-espera/solicitudes',
      { params }
    )
  )
}

/**
 * GET /bff/lista-espera/solicitudes/{id}
 */
export async function obtenerDetalleSolicitud(
  id: number
): Promise<ApiResult<SolicitudDetalleResponse>> {
  return safeRequest(() =>
    apiClient.get<SolicitudDetalleResponse>(
      `/bff/lista-espera/solicitudes/${id}`
    )
  )
}

/**
 * PATCH /bff/lista-espera/solicitudes/{id}/estado
 *
 * Cambia el estado de una solicitud existente.
 *
 * Respuestas esperadas:
 *  - 200 OK → estado cambiado, retorna SolicitudResponse
 *  - 400 Bad Request → transición no válida (ej: EN_ESPERA → ATENDIDO)
 *  - 404 Not Found → id de solicitud inexistente
 *  - 422 Unprocessable Entity → validación cruzada:
 *      · fechaCita null al CITAR
 *      · fechaCita en el pasado
 *      · motivo vacío al ANULAR/DERIVAR
 */
export async function cambiarEstadoSolicitud(
  id: number,
  request: CambiarEstadoRequest
): Promise<ApiResult<SolicitudResponse>> {
  return safeRequest(() =>
    apiClient.patch<SolicitudResponse>(
      `/bff/lista-espera/solicitudes/${id}/estado`,
      request
    )
  )
}
