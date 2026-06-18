import { apiClient, safeRequest, type ApiResult } from './client'
import type { EspecialidadResponse } from '../types/api'

/**
 * GET /bff/lista-espera/especialidades
 *
 * Lista las especialidades activas cargadas en el MS Lista de Espera.
 * Devuelve un array de EspecialidadResponse, o un error.
 */
export async function listarEspecialidades(): Promise<
  ApiResult<EspecialidadResponse[]>
> {
  return safeRequest(() =>
    apiClient.get<EspecialidadResponse[]>('/bff/lista-espera/especialidades')
  )
}
