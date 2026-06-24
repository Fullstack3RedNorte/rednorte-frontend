import { Layout } from './components/Layout'
import { HU01RegistrarSolicitud } from './paneles/HU01_RegistrarSolicitud'
import { HU09Especialidades } from './paneles/HU09_Especialidades'

/**
 * Punto de entrada de la app.
 *
 * Registra los paneles disponibles en un mapa que el Layout consume
 * para decidir qué mostrar según la HU activa.
 *
 * En las próximas iteraciones agregamos:
 *   'HU-02': <HU02ConsultarLista />,
 *   'HU-03': <HU03CambiarEstado />,
 *   'HU-08': <HU08PortalPaciente />,
 */
function App() {
  return (
    <Layout
      paneles={{
        'HU-09': <HU09Especialidades />,
        'HU-01': <HU01RegistrarSolicitud />,
      }}
    />
  )
}

export default App
