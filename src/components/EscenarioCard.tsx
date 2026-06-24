import type { ReactNode } from 'react'
import type { ApiResult } from '../api/client'

interface EscenarioCardProps<T> {
  /** Título corto del escenario */
  titulo: string
  /** Endpoint llamado (para mostrar visualmente) */
  endpoint: string
  /** Código HTTP esperado (200, 201, 400, 404, 422, etc.) */
  codigoEsperado: number
  /** Variante visual: éxito (verde) o error (rojo) */
  variante: 'exito' | 'error'
  /** Estado del resultado: null si no se ejecutó */
  resultado: ApiResult<T> | null
  /** Indica si está cargando */
  cargando: boolean
  /** Callback al hacer click en Ejecutar */
  onEjecutar: () => void
  /** Render personalizado del contenido cuando el resultado es exitoso */
  renderExito?: (data: T) => ReactNode
}

export function EscenarioCard<T>({
  titulo,
  endpoint,
  codigoEsperado,
  variante,
  resultado,
  cargando,
  onEjecutar,
  renderExito,
}: EscenarioCardProps<T>) {
  const colorBadgeEsperado =
    variante === 'exito'
      ? 'bg-green-100 text-green-800 border-green-300'
      : 'bg-red-100 text-red-800 border-red-300'

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm">{titulo}</h3>
          <p className="text-xs text-slate-500 mt-1 break-all">
            <code className="bg-slate-100 px-1.5 py-0.5 rounded">
              {endpoint}
            </code>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            esperado:{' '}
            <span
              className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ${colorBadgeEsperado}`}
            >
              {codigoEsperado}
            </span>
          </p>
        </div>
        <button
          onClick={onEjecutar}
          disabled={cargando}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold px-3 py-1.5 rounded text-sm transition-colors shrink-0"
        >
          {cargando ? '…' : 'Ejecutar'}
        </button>
      </div>

      {resultado && (
        <ResultadoEscenario
          resultado={resultado}
          codigoEsperado={codigoEsperado}
          renderExito={renderExito}
        />
      )}
    </div>
  )
}

function ResultadoEscenario<T>({
  resultado,
  codigoEsperado,
  renderExito,
}: {
  resultado: ApiResult<T>
  codigoEsperado: number
  renderExito?: (data: T) => ReactNode
}) {
  const codigoReal = resultado.status
  const coincide = codigoReal === codigoEsperado

  const colorBadgeReal = coincide
    ? 'bg-green-100 text-green-800 border-green-300'
    : 'bg-orange-100 text-orange-800 border-orange-300'

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-slate-500">Respuesta:</span>
        <span
          className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${colorBadgeReal}`}
        >
          {codigoReal ?? 'N/A'}
        </span>
        {!coincide && (
          <span className="text-xs text-orange-700">
            (esperado: {codigoEsperado})
          </span>
        )}
      </div>

      {resultado.ok ? (
        renderExito ? (
          renderExito(resultado.data)
        ) : (
          <pre className="bg-slate-50 border border-slate-200 rounded p-2 text-xs overflow-x-auto">
            {JSON.stringify(resultado.data, null, 2)}
          </pre>
        )
      ) : (
        <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-900">
          {resultado.error}
        </div>
      )}
    </div>
  )
}
