import PlayerSportsPage from './pages/PlayerSportsPage'
import RoleDashboard from './pages/RoleDashboard'
import { resolveTenant } from './tenant'

export default function App() {
  const tenant = resolveTenant()
  if (tenant === 'player') return <PlayerSportsPage />
  return <RoleDashboard role={tenant} />
}
