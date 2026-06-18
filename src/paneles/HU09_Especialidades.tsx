import { useState } from 'react'
import { listarEspecialidades } from '../api/especialidades'
import type { EspecialidadResponse } from '../types/api'
import type { ApiResult } from '../api/client'

/**
 * Panel HU-09 — Consultar especialidades disponibles
 *
 * Escenarios cubiertos:
 *  - Listar especialidades activas (200 OK con array de especialidades)
 *  - Manejo de error (BFF caído, MS caído, network error, etc.)
 *
 * Este panel sirve también como prueba de fuego del pipeline
 * front → BFF → MS Lista de Espera → MySQL.
 */
export function HU09Especialidades() {
  const [resultado, setResultado] = useState<
    ApiResult<EspecialidadResponse[]> | null
  >(null)
  const [cargando, setCargando] = useState(false)

  async function ejecutar() {
    setCargando(true)
    const res = await listarEspecialidades()
    setResultado(res)
    setCargando(false)
  }

  return (
    <div>
      {/* Encabezado del panel */}
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          HU-09 — Consultar especialidades disponibles
        </h2>
        <p className="text-slate-600 mt-1">
          Como médico clínico, quiero consultar las especialidades disponibles
          para registrar solicitudes correctamente.
        </p>
      </header>

      {/* Escenario único */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              Listar especialidades activas
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                GET /bff/lista-espera/especialidades
              </code>
              <span className="ml-2">esperado: <strong>200 OK</strong></span>
            </p>
          </div>
          <button
            onClick={ejecutar}
            disabled={cargando}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold px-4 py-2 rounded transition-colors"
          >
            {cargando ? 'Cargando…' : 'Ejecutar'}
          </button>
        </div>

        {/* Resultado */}
        {resultado && (
          <ResultadoPanel resultado={resultado} />
        )}
      </div>
    </div>
  )
}

/**
 * Sub-componente que renderiza el resultado de la llamada.
 * Muestra código HTTP coloreado y el contenido (success o error).
 */
function ResultadoPanel({
  resultado,
}: {
  resultado: ApiResult<EspecialidadResponse[]>
}) {
  const colorBadge = resultado.ok
    ? 'bg-green-100 text-green-800 border-green-300'
    : 'bg-red-100 text-red-800 border-red-300'

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${colorBadge}`}
        >
          {resultado.status ?? 'N/A'}
        </span>
        <span className="text-sm text-slate-600">
          {resultado.ok ? 'Respuesta exitosa' : 'Error'}
        </span>
      </div>

      {resultado.ok ? (
        <ListaEspecialidades data={resultado.data} />
      ) : (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-900">
          {resultado.error}
        </div>
      )}
    </div>
  )
}

function ListaEspecialidades({ data }: { data: EspecialidadResponse[] }) {
  if (data.length === 0) {
    return (
      <div className="text-slate-500 text-sm italic">
        No hay especialidades activas.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-500 mb-2">
        {data.length} especialidad{data.length !== 1 ? 'es' : ''} encontrada
        {data.length !== 1 ? 's' : ''}
      </div>
      <ul className="space-y-1.5">
        {data.map((esp) => (
          <li
            key={esp.id}
            className="flex items-baseline gap-3 bg-slate-50 rounded px-3 py-2"
          >
            <span className="text-xs font-mono text-slate-400">#{esp.id}</span>
            <span className="font-semibold text-slate-900">{esp.nombre}</span>
            <span className="text-sm text-slate-600">{esp.descripcion}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
