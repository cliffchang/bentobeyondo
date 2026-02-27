import { Customer } from '../../core/types'

interface CustomerInfoProps {
  customer: Customer
  isActive: boolean
}

export function CustomerInfo({ customer, isActive }: CustomerInfoProps) {
  const patiencePercent = (customer.patience / customer.maxPatience) * 100
  const isUrgent = customer.patience <= 2
  const isCritical = customer.patience <= 1

  // Check which preferences have been satisfied
  const receivedIds = new Set(customer.ingredientsReceived.map(i => i.id))

  return (
    <div className={`customer-info ${isActive ? 'active' : ''}`}>
      <div className="customer-header">
        <span className="customer-name">{customer.name}</span>
        {customer.preferences.length > 0 && (
          <span className="customer-preferences">
            {customer.preferences.map(pref => (
              <span
                key={pref.id}
                className={`preference ${receivedIds.has(pref.id) ? 'satisfied' : ''}`}
                title={pref.name}
              >
                {pref.emoji}
              </span>
            ))}
          </span>
        )}
      </div>
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
