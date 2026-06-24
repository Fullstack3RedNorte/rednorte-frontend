import { apiClient, safeRequest, type ApiResult } from './client'
import type {
  CrearSolicitudRequest,
  SolicitudResponse,
} from '../types/api'

/**
 * POST /bff/lista-espera/solicitudes
 *
 * Crea una nueva solicitud de atención.
 * El backend calcula la prioridad automáticamente según los campos
 * esGES, nivelUrgencia y esVulnerable.
 *
 * Respuestas esperadas:
 *  - 201 Created → solicitud creada, retorna SolicitudResponse
 *  - 400 Bad Request → campos obligatorios faltantes
 *  - 404 Not Found → especialidadId o tipoVulnerabilidadId inexistente
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
