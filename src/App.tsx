import { Layout } from './components/Layout'
import { HU01RegistrarSolicitud } from './paneles/HU01_RegistrarSolicitud'
import { HU02ConsultarLista } from './paneles/HU02_ConsultarLista'
import { HU03CambiarEstado } from './paneles/HU03_CambiarEstado'
import { HU08PortalPaciente } from './paneles/HU08_PortalPaciente'
import { HU09Especialidades } from './paneles/HU09_Especialidades'

/**
 * Punto de entrada de la app.
 *
 * Estado del front (versión final):
 *   ✓ HU-09 — Especialidades
 *   ✓ HU-01 — Registrar solicitud (7 escenarios)
 *   ✓ HU-02 — Consultar lista (filtros + detalle + historial)
 *   ✓ HU-03 — Cambiar estado (flujo guiado + 6 escenarios)
 *   ✓ HU-08 — Portal paciente (perspectiva del paciente)
 *
 * HU-04, 05, 06, 07 quedan fuera del alcance: dependen del
 * MS Reasignación que no fue implementado en este semestre.
 */
function App() {
  return (
    <Layout
      paneles={{
        'HU-09': <HU09Especialidades />,
        'HU-01': <HU01RegistrarSolicitud />,
        'HU-02': <HU02ConsultarLista />,
        'HU-03': <HU03CambiarEstado />,
        'HU-08': <HU08PortalPaciente />,
      }}
    />
  )
}

export default App
