import axios from 'axios'

/**
 * Cliente HTTP centralizado para llamar al BFF Gateway.
 *
 * - baseURL viene de la variable de entorno VITE_BFF_URL.
 * - timeout de 10 segundos para evitar que la UI se cuelgue
 *   esperando una respuesta del BFF caído.
 * - Content-Type JSON por default.
 *
 * Todas las funciones de api/* importan este cliente.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BFF_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Tipo común para representar el resultado de una llamada a la API
 * en formato "discriminated union": o salió bien (ok) o salió mal (error).
 *
 * Esto evita usar try/catch en cada panel y permite renderizar el estado
 * de error directamente desde el resultado.
 */
export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number | null }

/**
 * Ejecuta una llamada axios y la envuelve en un ApiResult<T>.
 *
 * Útil dentro de las funciones de api/* — convierten las excepciones
 * de axios en un objeto que la UI puede inspeccionar sin try/catch.
 */
export async function safeRequest<T>(
  request: () => Promise<{ data: T; status: number }>
): Promise<ApiResult<T>> {
  try {
    const response = await request()
    return { ok: true, data: response.data, status: response.status }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? null
      const backendMessage =
        (err.response?.data as { message?: string } | undefined)?.message ||
        err.message
      return { ok: false, error: backendMessage, status }
    }
    return { ok: false, error: 'Error desconocido', status: null }
  }
}
