import { Customer } from '../../core/types'

interface CustomerInfoProps {
  customer: Customer
  isActive: boolean
}

export function CustomerInfo({ customer, isActive }: CustomerInfoProps) {
  const patiencePercent = (customer.patience / customer.maxPatience) * 100
  const isUrgent = customer.patience <= 2
  const isCritical = customer.patience <= 1

  return (
    <div className={`customer-info ${isActive ? 'active' : ''}`}>
      <div className="customer-name">{customer.name}</div>
      <div className="patience-container">
        <div
          className={`patience-bar ${isUrgent ? 'urgent' : ''} ${isCritical ? 'critical' : ''}`}
          style={{ width: `${patiencePercent}%` }}
        />
        <span className="patience-text">{customer.patience}</span>
      </div>
    </div>
  )
}
