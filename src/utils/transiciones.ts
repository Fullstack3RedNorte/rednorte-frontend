import type { EstadoSolicitud } from '../types/api'

/**
 * Mapa de transiciones válidas del State Pattern.
 * Espejo de la lógica del backend (SolicitudServiceImpl).
 *
 * Estados terminales (sin transiciones de salida):
 *   CERRADO, ANULADO, DERIVADO, VENCIDO
 *
 * Documentado en HU v2.1 (apéndice de State Pattern).
 */
export const TRANSICIONES_VALIDAS: Record<EstadoSolicitud, EstadoSolicitud[]> = {
  EN_ESPERA: ['CITADO', 'ANULADO', 'VENCIDO'],
  CITADO: ['ATENDIDO', 'AUSENTE', 'ANULADO', 'DERIVADO', 'VENCIDO'],
  ATENDIDO: ['CERRADO', 'DERIVADO'],
  AUSENTE: ['EN_ESPERA', 'CERRADO'],
  // Estados terminales
  CERRADO: [],
  ANULADO: [],
  DERIVADO: [],
  VENCIDO: [],
}

/**
 * Estados que requieren motivo obligatorio al transicionar HACIA ellos.
 */
export const ESTADOS_CON_MOTIVO_OBLIGATORIO: EstadoSolicitud[] = [
  'ANULADO',
  'DERIVADO',
]

/**
 * Estados que requieren fechaCita obligatoria al transicionar HACIA ellos.
 */
export const ESTADOS_CON_FECHA_CITA_OBLIGATORIA: EstadoSolicitud[] = ['CITADO']

/**
 * Helpers
 */
export function transicionesPosibles(
  estadoActual: EstadoSolicitud
): EstadoSolicitud[] {
  return TRANSICIONES_VALIDAS[estadoActual] ?? []
}

export function esEstadoTerminal(estado: EstadoSolicitud): boolean {
  return transicionesPosibles(estado).length === 0
}

export function requiereMotivo(nuevoEstado: EstadoSolicitud): boolean {
  return ESTADOS_CON_MOTIVO_OBLIGATORIO.includes(nuevoEstado)
}

export function requiereFechaCita(nuevoEstado: EstadoSolicitud): boolean {
  return ESTADOS_CON_FECHA_CITA_OBLIGATORIA.includes(nuevoEstado)
}
