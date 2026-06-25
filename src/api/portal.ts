import { apiClient, safeRequest, type ApiResult } from './client'
import type {
  PageResponse,
  SolicitudDetallePortalResponse,
  SolicitudResumenResponse,
} from '../types/api'

/**
 * GET /bff/portal-pacientes/solicitudes?rutPaciente={rut}
 *
 * Lista las solicitudes del paciente identificado por RUT.
 * A diferencia del endpoint del MS Lista de Espera, ESTE endpoint
 * exige rutPaciente como parámetro obligatorio.
 *
 * Respuestas esperadas:
 *  - 200 OK → PageResponse<SolicitudResumenResponse>
 *  - 400 Bad Request → falta el parámetro rutPaciente
 *  - 503 Service Unavailable → MS Lista de Espera caído
 */
export async function consultarSolicitudesPortal(
  rutPaciente: string,
  page: number = 0,
  size: number = 20
): Promise<ApiResult<PageResponse<SolicitudResumenResponse>>> {
  return safeRequest(() =>
    apiClient.get<PageResponse<SolicitudResumenResponse>>(
      '/bff/portal-pacientes/solicitudes',
      { params: { rutPaciente, page, size } }
    )
  )
}

/**
 * GET /bff/portal-pacientes/solicitudes/{id}?rutPaciente={rut}
 *
 * Obtiene el detalle de una solicitud específica del paciente.
 *
 * Respuestas esperadas:
 *  - 200 OK → SolicitudDetallePortalResponse con historial
 *  - 404 Not Found → id inexistente
 */
export async function consultarDetallePortal(
  id: number,
  rutPaciente: string
): Promise<ApiResult<SolicitudDetallePortalResponse>> {
  return safeRequest(() =>
    apiClient.get<SolicitudDetallePortalResponse>(
      `/bff/portal-pacientes/solicitudes/${id}`,
      { params: { rutPaciente } }
    )
  )
}
