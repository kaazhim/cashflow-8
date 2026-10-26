export const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8]

export const PALETTE = ['#b45309', '#0f766e', '#1d4ed8', '#7e22ce', '#a16207']

export const SAMPLE_STARTING_BALANCE = 3000

export const SAMPLE_PAYMENTS = [
  {
    id: 'sample-1',
    name: 'Walk-in sales',
    amount: 1200,
    direction: 'in',
    kind: { type: 'every', fromWeek: 1 },
  },
  {
    id: 'sample-2',
    name: 'Supplier for flour, butter and eggs',
    amount: 1000,
    direction: 'out',
    kind: { type: 'every', fromWeek: 1 },
  },
  {
    id: 'sample-3',
    name: 'New oven deposit',
    amount: 1250,
    direction: 'out',
    kind: { type: 'once', week: 2 },
  },
  {
    id: 'sample-4',
    name: 'Shop rent',
    amount: 1500,
    direction: 'out',
    kind: { type: 'once', week: 4 },
  },
  {
    id: 'sample-5',
    name: "Helper's pay",
    amount: 1700,
    direction: 'out',
    kind: { type: 'once', week: 4 },
  },
  {
    id: 'sample-6',
    name: 'Office order from Syarikat Contoh',
    amount: 2400,
    direction: 'in',
    kind: { type: 'once', week: 5 },
  },
  {
    id: 'sample-7',
    name: "Helper's pay",
    amount: 1700,
    direction: 'out',
    kind: { type: 'once', week: 8 },
  },
]

export const STORAGE_KEY = 'cashflow8.v1'

export function colourForWeek(week) {
  return PALETTE[(week - 1) % PALETTE.length]
}

export function colourForIndex(index) {
  return PALETTE[index % PALETTE.length]
}

export function largestAmount(payments) {
  return payments.reduce(
    (largest, payment) => Math.max(largest, payment.amount),
    0,
  )
}

export function shareOfLargest(amount, largest) {
  if (!largest || largest <= 0) {
    return 0
  }
  return Math.min(1, Math.max(0, amount / largest))
}

export function shareOfScale(value, scale) {
  return shareOfLargest(Math.abs(value), scale)
}

export function largestMagnitude(values) {
  return values.reduce(
    (largest, value) => Math.max(largest, Math.abs(value)),
    0,
  )
}

export function weekLabel(payment) {
  if (payment.kind.type === 'every') {
    return `Every week from week ${payment.kind.fromWeek}`
  }
  return `Week ${payment.kind.week}`
}

export function landsInWeek(payment, week) {
  if (payment.kind.type === 'every') {
    return payment.kind.fromWeek <= week
  }
  return payment.kind.week === week
}

export function weekNet(week, payments) {
  return payments.reduce((total, payment) => {
    if (!landsInWeek(payment, week)) {
      return total
    }
    return payment.direction === 'in'
      ? total + payment.amount
      : total - payment.amount
  }, 0)
}

export function endBalances(startingBalance, payments) {
  let balance = startingBalance
  return WEEKS.map((week) => {
    balance += weekNet(week, payments)
    return { week, balance }
  })
}

export function lowestWeek(startingBalance, payments) {
  const balances = endBalances(startingBalance, payments)
  return balances.reduce((lowest, current) =>
    current.balance < lowest.balance ? current : lowest,
  )
}

export function formatRM(value) {
  const rounded = Math.round(Math.abs(value) * 100) / 100
  const text = rounded.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return value < 0 ? `-RM${text}` : `RM${text}`
}

function isValidPayment(payment) {
  if (!payment || typeof payment !== 'object') {
    return false
  }
  const { id, name, amount, direction, kind } = payment
  if (typeof id !== 'string' || typeof name !== 'string' || !name.trim()) {
    return false
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return false
  }
  if (direction !== 'in' && direction !== 'out') {
    return false
  }
  if (!kind || typeof kind !== 'object') {
    return false
  }
  if (kind.type === 'once') {
    return Number.isInteger(kind.week) && kind.week >= 1 && kind.week <= 8
  }
  if (kind.type === 'every') {
    return (
      Number.isInteger(kind.fromWeek) &&
      kind.fromWeek >= 1 &&
      kind.fromWeek <= 8
    )
  }
  return false
}

export function sampleState() {
  return {
    startingBalance: SAMPLE_STARTING_BALANCE,
    payments: SAMPLE_PAYMENTS,
  }
}

export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = sampleState()
      saveState(seeded)
      return seeded
    }

    const parsed = JSON.parse(raw)
    const startingBalance = Number(parsed?.startingBalance)
    const payments = Array.isArray(parsed?.payments) ? parsed.payments : null

    if (!Number.isFinite(startingBalance) || payments === null) {
      throw new Error('Unreadable saved state')
    }
    if (!payments.every(isValidPayment)) {
      throw new Error('Unreadable saved payments')
    }

    return { startingBalance, payments }
  } catch {
    return sampleState()
  }
}

export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    return false
  }
  return true
}