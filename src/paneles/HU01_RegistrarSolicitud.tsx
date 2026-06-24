import { useEffect, useState } from 'react'
import { listarEspecialidades } from '../api/especialidades'
import { crearSolicitud } from '../api/solicitudes'
import { TIPOS_VULNERABILIDAD } from '../api/tipos-vulnerabilidad'
import { EscenarioCard } from '../components/EscenarioCard'
import type {
  CrearSolicitudRequest,
  EspecialidadResponse,
  NivelUrgencia,
  SolicitudResponse,
} from '../types/api'
import type { ApiResult } from '../api/client'

// ──────────────────────────────────────────────────────────────
// Presets de escenarios
// Cada preset es un CrearSolicitudRequest precargable en el formulario.
// ──────────────────────────────────────────────────────────────

interface Escenario {
  id: string
  titulo: string
  codigoEsperado: number
  variante: 'exito' | 'error'
  preset: CrearSolicitudRequest
}

const RUT_BASE = '20111222-3' // RUT genérico de prueba

const ESCENARIOS: Escenario[] = [
  {
    id: 'ges',
    titulo: 'GES → prioridad 1',
    codigoEsperado: 201,
    variante: 'exito',
    preset: {
      rutPaciente: RUT_BASE,
      especialidadId: 1, // Cardiología
      diagnostico: 'Dolor torácico crónico con sospecha de cardiopatía isquémica',
      esGES: true,
      patologiaGES: 'Infarto agudo al miocardio',
      nivelUrgencia: 'GES',
      esVulnerable: false,
      tipoVulnerabilidadId: null,
    },
  },
  {
    id: 'urgente',
    titulo: 'URGENTE → prioridad 2',
    codigoEsperado: 201,
    variante: 'exito',
    preset: {
      rutPaciente: RUT_BASE,
      especialidadId: 2, // Broncopulmonar
      diagnostico: 'Dificultad respiratoria severa',
      esGES: false,
      patologiaGES: null,
      nivelUrgencia: 'URGENTE',
      esVulnerable: false,
      tipoVulnerabilidadId: null,
    },
  },
  {
    id: 'vulnerable',
    titulo: 'VULNERABLE → prioridad 3',
    codigoEsperado: 201,
    variante: 'exito',
    preset: {
      rutPaciente: RUT_BASE,
      especialidadId: 3, // Traumatología
      diagnostico: 'Dolor lumbar persistente en paciente embarazada',
      esGES: false,
      patologiaGES: null,
      nivelUrgencia: 'ELECTIVA',
      esVulnerable: true,
      tipoVulnerabilidadId: 2, // Embarazada
    },
  },
  {
    id: 'electiva',
    titulo: 'ELECTIVA → prioridad 4',
    codigoEsperado: 201,
    variante: 'exito',
    preset: {
      rutPaciente: RUT_BASE,
      especialidadId: 4, // Neurología
      diagnostico: 'Cefaleas recurrentes sin causa identificada',
      esGES: false,
      patologiaGES: null,
      nivelUrgencia: 'ELECTIVA',
      esVulnerable: false,
      tipoVulnerabilidadId: null,
    },
  },
  {
    id: 'especialidad-404',
    titulo: 'Especialidad inexistente',
    codigoEsperado: 404,
    variante: 'error',
    preset: {
      rutPaciente: RUT_BASE,
      especialidadId: 9999, // No existe
      diagnostico: 'Diagnóstico de prueba',
      esGES: false,
      patologiaGES: null,
      nivelUrgencia: 'ELECTIVA',
      esVulnerable: false,
      tipoVulnerabilidadId: null,
    },
  },
  {
    id: 'tipo-vulnerabilidad-404',
    titulo: 'Tipo vulnerabilidad inexistente',
    codigoEsperado: 404,
    variante: 'error',
    preset: {
      rutPaciente: RUT_BASE,
      especialidadId: 1,
      diagnostico: 'Diagnóstico con vulnerabilidad inválida',
      esGES: false,
      patologiaGES: null,
      nivelUrgencia: 'ELECTIVA',
      esVulnerable: true,
      tipoVulnerabilidadId: 9999, // No existe
    },
  },
  {
    id: 'campos-faltantes',
    titulo: 'Campos obligatorios faltantes',
    codigoEsperado: 400,
    variante: 'error',
    preset: {
      // rutPaciente vacío y faltan campos
      rutPaciente: '',
      especialidadId: 0,
      diagnostico: '',
      esGES: false,
      patologiaGES: null,
      nivelUrgencia: 'ELECTIVA',
      esVulnerable: false,
      tipoVulnerabilidadId: null,
    },
  },
]

// ──────────────────────────────────────────────────────────────
// Panel principal
// ──────────────────────────────────────────────────────────────

export function HU01RegistrarSolicitud() {
  const [especialidades, setEspecialidades] = useState<EspecialidadResponse[]>([])
  const [form, setForm] = useState<CrearSolicitudRequest>(ESCENARIOS[0].preset)
  const [resultados, setResultados] = useState<
    Record<string, ApiResult<SolicitudResponse> | null>
  >({})
  const [cargandoId, setCargandoId] = useState<string | null>(null)

  // Cargar las especialidades al montar (para el dropdown)
  useEffect(() => {
    listarEspecialidades().then((res) => {
      if (res.ok) setEspecialidades(res.data)
    })
  }, [])

  function aplicarPreset(escenario: Escenario) {
    setForm(escenario.preset)
  }

  async function ejecutarEscenario(escenario: Escenario) {
    // Aplicar el preset al formulario para que el usuario vea qué se envía
    aplicarPreset(escenario)

    setCargandoId(escenario.id)
    const res = await crearSolicitud(escenario.preset)
    setResultados((prev) => ({ ...prev, [escenario.id]: res }))
    setCargandoId(null)
  }

  async function ejecutarFormulario() {
    setCargandoId('manual')
    const res = await crearSolicitud(form)
    setResultados((prev) => ({ ...prev, manual: res }))
    setCargandoId(null)
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          HU-01 — Registrar solicitud de atención
        </h2>
        <p className="text-slate-600 mt-1">
          Como médico clínico, quiero registrar una solicitud de atención para un
          paciente para ingresarlo a la lista de espera con su prioridad clínica
          calculada automáticamente.
        </p>
      </header>

      {/* Formulario editable */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">
          Formulario (editable, también es disparado por los escenarios)
        </h3>
        <FormularioSolicitud
          form={form}
          setForm={setForm}
          especialidades={especialidades}
        />
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={ejecutarFormulario}
            disabled={cargandoId === 'manual'}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold px-4 py-2 rounded transition-colors"
          >
            {cargandoId === 'manual' ? 'Enviando…' : 'Enviar formulario'}
          </button>
          <span className="text-xs text-slate-500">
            POST /bff/lista-espera/solicitudes
          </span>
        </div>
        {resultados.manual && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <ResultadoManual resultado={resultados.manual} />
          </div>
        )}
      </section>

      {/* Escenarios */}
      <section>
        <h3 className="font-semibold text-slate-900 mb-3">
          Escenarios automáticos
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Cada botón "Ejecutar" precarga el formulario con datos del escenario y
          envía la petición.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ESCENARIOS.map((esc) => (
            <EscenarioCard<SolicitudResponse>
              key={esc.id}
              titulo={esc.titulo}
              endpoint="POST /bff/lista-espera/solicitudes"
              codigoEsperado={esc.codigoEsperado}
              variante={esc.variante}
              resultado={resultados[esc.id] ?? null}
              cargando={cargandoId === esc.id}
              onEjecutar={() => ejecutarEscenario(esc)}
              renderExito={(data) => <ResumenSolicitud data={data} />}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────────────────────

function FormularioSolicitud({
  form,
  setForm,
  especialidades,
}: {
  form: CrearSolicitudRequest
  setForm: (form: CrearSolicitudRequest) => void
  especialidades: EspecialidadResponse[]
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Campo label="RUT del paciente">
        <input
          type="text"
          value={form.rutPaciente}
          onChange={(e) => setForm({ ...form, rutPaciente: e.target.value })}
          placeholder="12345678-9"
          className="input"
        />
      </Campo>

      <Campo label="Especialidad">
        <select
          value={form.especialidadId || ''}
          onChange={(e) =>
            setForm({ ...form, especialidadId: Number(e.target.value) })
          }
          className="input"
        >
          <option value="">— Selecciona —</option>
          {especialidades.map((esp) => (
            <option key={esp.id} value={esp.id}>
              {esp.nombre}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Diagnóstico" colSpan={2}>
        <textarea
          value={form.diagnostico}
          onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
          rows={2}
          className="input"
        />
      </Campo>

      <Campo label="Nivel de urgencia">
        <div className="flex gap-3">
          {(['GES', 'URGENTE', 'ELECTIVA'] as NivelUrgencia[]).map((nu) => (
            <label key={nu} className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="nivelUrgencia"
                checked={form.nivelUrgencia === nu}
                onChange={() => setForm({ ...form, nivelUrgencia: nu })}
              />
              {nu}
            </label>
          ))}
        </div>
      </Campo>

      <Campo label="es GES">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.esGES}
            onChange={(e) => setForm({ ...form, esGES: e.target.checked })}
          />
          <span className="text-sm text-slate-600">
            {form.esGES ? 'Sí' : 'No'}
          </span>
        </div>
      </Campo>

      {form.esGES && (
        <Campo label="Patología GES" colSpan={2}>
          <input
            type="text"
            value={form.patologiaGES ?? ''}
            onChange={(e) =>
              setForm({ ...form, patologiaGES: e.target.value || null })
            }
            placeholder="Ej: Infarto agudo al miocardio"
            className="input"
          />
        </Campo>
      )}

      <Campo label="es Vulnerable">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.esVulnerable}
            onChange={(e) =>
              setForm({
                ...form,
                esVulnerable: e.target.checked,
                tipoVulnerabilidadId: e.target.checked
                  ? form.tipoVulnerabilidadId
                  : null,
              })
            }
          />
          <span className="text-sm text-slate-600">
            {form.esVulnerable ? 'Sí' : 'No'}
          </span>
        </div>
      </Campo>

      {form.esVulnerable && (
        <Campo label="Tipo de vulnerabilidad">
          <select
            value={form.tipoVulnerabilidadId ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                tipoVulnerabilidadId: e.target.value
                  ? Number(e.target.value)
                  : null,
              })
            }
            className="input"
          >
            <option value="">— Selecciona —</option>
            {TIPOS_VULNERABILIDAD.map((tv) => (
              <option key={tv.id} value={tv.id}>
                {tv.nombre}
              </option>
            ))}
          </select>
        </Campo>
      )}
    </div>
  )
}

function Campo({
  label,
  children,
  colSpan = 1,
}: {
  label: string
  children: React.ReactNode
  colSpan?: 1 | 2
}) {
  return (
    <div className={colSpan === 2 ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

function ResumenSolicitud({ data }: { data: SolicitudResponse }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded p-2 text-xs space-y-1">
      <div>
        <span className="text-slate-500">ID:</span>{' '}
        <span className="font-mono">#{data.id}</span>
      </div>
      <div>
        <span className="text-slate-500">Especialidad:</span>{' '}
        <span className="font-semibold">{data.especialidad}</span>
      </div>
      <div>
        <span className="text-slate-500">Prioridad:</span>{' '}
        <span className="font-bold text-blue-700">{data.prioridad}</span>
      </div>
      <div>
        <span className="text-slate-500">Estado:</span> {data.estado}
      </div>
    </div>
  )
}

function ResultadoManual({
  resultado,
}: {
  resultado: ApiResult<SolicitudResponse>
}) {
  const color = resultado.ok
    ? 'bg-green-100 text-green-800 border-green-300'
    : 'bg-red-100 text-red-800 border-red-300'

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${color}`}
        >
          {resultado.status ?? 'N/A'}
        </span>
        <span className="text-sm text-slate-600">
          {resultado.ok ? 'Solicitud creada' : 'Error'}
        </span>
      </div>
      {resultado.ok ? (
        <ResumenSolicitud data={resultado.data} />
      ) : (
        <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-900">
          {resultado.error}
        </div>
      )}
    </div>
  )
}
