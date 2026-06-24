/**
 * Catálogo de tipos de vulnerabilidad disponibles.
 *
 * ⚠️ Hardcodeado intencionalmente: el MS Lista de Espera no expone
 * un endpoint GET para listar tipos de vulnerabilidad. Esta lista
 * es un espejo del data.sql del backend.
 *
 * Si el backend agrega nuevos tipos, hay que sincronizar acá manualmente.
 * Documentado como deuda técnica.
 */
export interface TipoVulnerabilidad {
  id: number
  nombre: string
}

export const TIPOS_VULNERABILIDAD: TipoVulnerabilidad[] = [
  { id: 1, nombre: 'Adulto mayor' },
  { id: 2, nombre: 'Embarazada' },
  { id: 3, nombre: 'Discapacidad' },
]
