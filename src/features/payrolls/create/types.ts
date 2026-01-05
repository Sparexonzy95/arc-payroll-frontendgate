import type { PaymentPayload, ScheduleType } from '../../../api/payrolls'

export type Step = 1 | 2 | 3 | 4
export type ScheduleMode = 'immediate' | 'scheduled' | 'recurring'

export interface EmployeeRow extends PaymentPayload {
  index: number
}

export type { ScheduleType }
