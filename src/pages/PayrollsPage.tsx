import { useLocation } from 'react-router-dom'
import { PayrollList } from '../features/payrolls/PayrollList'
import { PayrollCreateWizard } from '../features/payrolls/create/PayrollCreateWizard'

export function PayrollsPage() {
  const location = useLocation()
  const isCreate = location.pathname.endsWith('/new')

  return <div className="space-y-4">{isCreate ? <PayrollCreateWizard /> : <PayrollList />}</div>
}
