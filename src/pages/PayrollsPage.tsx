import { PayrollList } from '../features/payrolls/PayrollList'
import { PayrollCreateWizard } from '../features/payrolls/PayrollCreateWizard'
import { useLocation } from 'react-router-dom'

export function PayrollsPage() {
  const location = useLocation()
  const isCreate = location.pathname.endsWith('/new')

  return (
    <div className="container-page space-y-4">
      {isCreate ? <PayrollCreateWizard /> : <PayrollList />}
    </div>
  )
}
