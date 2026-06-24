import { Layout } from './components/Layout'
import { HU01RegistrarSolicitud } from './paneles/HU01_RegistrarSolicitud'
import { HU02ConsultarLista } from './paneles/HU02_ConsultarLista'
import { HU03CambiarEstado } from './paneles/HU03_CambiarEstado'
import { HU09Especialidades } from './paneles/HU09_Especialidades'

/**
 * Punto de entrada de la app.
 *
 * En la próxima iteración agregamos:
 *   'HU-08': <HU08PortalPaciente />,
 */
function App() {
  return (
    <Layout
      paneles={{
        'HU-09': <HU09Especialidades />,
        'HU-01': <HU01RegistrarSolicitud />,
        'HU-02': <HU02ConsultarLista />,
        'HU-03': <HU03CambiarEstado />,
      }}
    />
  )
}

export default App
