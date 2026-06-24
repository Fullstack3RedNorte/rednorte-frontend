import { useState, type ReactNode } from 'react'

/**
 * Definición de cada historia de usuario disponible en el front.
 * Cuando agreguemos un nuevo panel, lo registramos acá.
 */
export interface HuItem {
  id: string
  titulo: string
  resumen: string
  estado: 'implementada' | 'pendiente'
}

const HU_DISPONIBLES: HuItem[] = [
  {
    id: 'HU-09',
    titulo: 'HU-09 — Especialidades',
    resumen: 'Listar especialidades activas',
    estado: 'implementada',
  },
  {
    id: 'HU-01',
    titulo: 'HU-01 — Registrar solicitud',
    resumen: 'Crear solicitud con priorización automática',
    estado: 'implementada',
  },
  {
    id: 'HU-02',
    titulo: 'HU-02 — Consultar lista',
    resumen: 'Listar y filtrar solicitudes',
    estado: 'pendiente',
  },
  {
    id: 'HU-03',
    titulo: 'HU-03 — Cambiar estado',
    resumen: 'Modificar estado de una solicitud',
    estado: 'pendiente',
  },
  {
    id: 'HU-08',
    titulo: 'HU-08 — Portal paciente',
    resumen: 'Consulta pública por RUT',
    estado: 'pendiente',
  },
]

interface LayoutProps {
  /** Mapa de id de HU → componente del panel correspondiente */
  paneles: Record<string, ReactNode>
}

export function Layout({ paneles }: LayoutProps) {
  // Por default arrancamos en la primera HU implementada
  const [huActiva, setHuActiva] = useState<string>('HU-09')

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">RedNorte</h1>
          <p className="text-xs text-slate-400 mt-1">Front orientado a pruebas</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {HU_DISPONIBLES.map((hu) => {
            const isActiva = hu.id === huActiva
            const isPendiente = hu.estado === 'pendiente'

            return (
              <button
                key={hu.id}
                onClick={() => !isPendiente && setHuActiva(hu.id)}
                disabled={isPendiente}
                className={`
                  w-full text-left px-6 py-3 transition-colors border-l-4
                  ${
                    isActiva
                      ? 'bg-slate-800 border-blue-500 text-white'
                      : 'border-transparent text-slate-300 hover:bg-slate-800'
                  }
                  ${isPendiente ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="font-semibold text-sm">{hu.titulo}</div>
                <div className="text-xs text-slate-400 mt-0.5">{hu.resumen}</div>
                {isPendiente && (
                  <span className="inline-block mt-1 text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                    Pendiente
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-400">
          BFF: {import.meta.env.VITE_BFF_URL}
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {paneles[huActiva] ?? (
            <div className="text-slate-500 text-center mt-20">
              Selecciona una historia de usuario implementada.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
