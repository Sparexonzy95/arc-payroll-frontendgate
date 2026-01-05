import { Card } from '../../../../components/ui/Card'
import { UI } from '../ui'

export function WizardShell({ children }: { children: React.ReactNode }) {
  return (
    <Card
      className="rounded-[18px] overflow-hidden"
      style={{
        background: UI.card,
        border: `1px solid ${UI.borderSoft}`,
        boxShadow: UI.shadow,
      }}
    >
      {children}
    </Card>
  )
}
