import { useEffect, useState } from 'react'
import {
  WEEKS,
  colourForIndex,
  colourForWeek,
  endBalances,
  formatRM,
  largestAmount,
  largestMagnitude,
  loadState,
  lowestWeek,
  saveState,
  shareOfLargest,
  shareOfScale,
  weekLabel,
} from './lib/cashflow'

function HeaderIcon() {
  return (
    <svg
      className="page-header__icon"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="15"
        rx="2.5"
        fill="none"
        stroke="#b45309"
        strokeWidth="1.6"
      />
      <path d="M3 10h18" stroke="#b45309" strokeWidth="1.6" />
      <circle cx="8" cy="15" r="1.6" fill="#b45309" />
    </svg>
  )
}

function Header() {
  return (
    <header className="page-header">
      <HeaderIcon />
      <div>
        <h1>Cashflow 8</h1>
        <p className="page-header__purpose">
          See the bank balance at the end of each of the next 8 weeks.
        </p>
        <p className="sample-tag">Sample data</p>
      </div>
    </header>
  )
}

function Hero({ startingBalance, payments }) {
  const lowest = lowestWeek(startingBalance, payments)
  const isShort = lowest.balance < 0
  const finalWeek = endBalances(startingBalance, payments)[7]

  return (
    <section className="hero surfaces-enter" aria-labelledby="hero-label">
      <p className="hero__label" id="hero-label">
        Lowest week
      </p>
      <p
        className={
          isShort ? 'hero__figure hero__figure--short' : 'hero__figure'
        }
      >
        {formatRM(lowest.balance)}
      </p>
      <p className="hero__line">
        {isShort
          ? `Week ${lowest.week} goes short. Move a payment to fix it.`
          : 'Never below zero. You make it through 8 weeks.'}
      </p>
      <p className="hero__foot">
        {formatRM(finalWeek.balance)} in the bank at the end of week 8.
      </p>
    </section>
  )
}

function WeekStrip({ startingBalance, payments }) {
  const balances = endBalances(startingBalance, payments)
  const scale = largestMagnitude(balances.map((item) => item.balance))

  return (
    <ol className="week-strip">
      {balances.map(({ week, balance }) => {
        const isShort = balance < 0
        const share = shareOfScale(balance, scale)
        return (
          <li className="week-block" key={week}>
            <span
              className="week-block__rule"
              style={{ background: colourForWeek(week) }}
            />
            <span className="week-block__label">Week {week}</span>
            <span
              className={
                isShort
                  ? 'week-block__balance week-block__balance--short'
                  : 'week-block__balance'
              }
            >
              {formatRM(balance)}
            </span>
            <span className="week-block__bar-track" aria-hidden="true">
              <span
                className="week-block__bar"
                style={{
                  width: `${Math.max(share * 100, balance === 0 ? 0 : 4)}%`,
                  background: isShort ? 'var(--warning)' : colourForWeek(week),
                }}
              />
            </span>
            {isShort ? <span className="week-block__short">Short</span> : null}
          </li>
        )
      })}
    </ol>
  )
}

function StartingBalance({ startingBalance, onChange }) {
  return (
    <section className="settings">
      <label className="field" htmlFor="starting-balance">
        <span className="field__label">Bank balance today</span>
        <span className="field__control">
          <span className="field__prefix">RM</span>
          <input
            id="starting-balance"
            name="starting-balance"
            type="number"
            step="0.01"
            min="0"
            value={startingBalance}
            onChange={(event) => {
              const next = Number(event.target.value)
              onChange(Number.isFinite(next) ? next : 0)
            }}
            className="field__input"
          />
        </span>
      </label>
      <p className="settings__value">{formatRM(startingBalance)}</p>
    </section>
  )
}

function PaymentForm({ onAdd }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState('in')
  const [week, setWeek] = useState('1')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Give the payment a name.')
      return
    }

    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter an amount above zero.')
      return
    }

    onAdd({
      name: trimmedName,
      amount: parsedAmount,
      direction,
      week,
    })

    setName('')
    setAmount('')
    setDirection('in')
    setWeek('1')
    setError('')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} noValidate>
      <label className="field field--name" htmlFor="payment-name">
        <span className="field__label">Name</span>
        <input
          id="payment-name"
          name="name"
          type="text"
          placeholder="Shop rent"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="field__input"
        />
      </label>

      <label className="field" htmlFor="payment-amount">
        <span className="field__label">Amount</span>
        <span className="field__control">
          <span className="field__prefix">RM</span>
          <input
            id="payment-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="field__input"
          />
        </span>
      </label>

      <fieldset className="field field--radio">
        <legend className="field__label">Direction</legend>
        <label className="radio">
          <input
            type="radio"
            name="direction"
            value="in"
            checked={direction === 'in'}
            onChange={() => setDirection('in')}
          />
          <span>In</span>
        </label>
        <label className="radio">
          <input
            type="radio"
            name="direction"
            value="out"
            checked={direction === 'out'}
            onChange={() => setDirection('out')}
          />
          <span>Out</span>
        </label>
      </fieldset>

      <label className="field" htmlFor="payment-week">
        <span className="field__label">Week</span>
        <select
          id="payment-week"
          name="week"
          value={week}
          onChange={(event) => setWeek(event.target.value)}
          className="field__input"
        >
          {WEEKS.map((value) => (
            <option key={value} value={String(value)}>
              Week {value}
            </option>
          ))}
          <option value="every">Every week from this week</option>
        </select>
      </label>

      <button type="submit" className="button button--accent">
        Add payment
      </button>

      {error ? <p className="form-error">{error}</p> : null}
    </form>
  )
}

function PaymentRow({ payment, index, largest, onMove, onRemove }) {
  const [confirming, setConfirming] = useState(false)
  const isEvery = payment.kind.type === 'every'
  const isIn = payment.direction === 'in'
  const week = payment.kind.type === 'once' ? payment.kind.week : null
  const share = shareOfLargest(payment.amount, largest)
  const colour = colourForIndex(index)

  return (
    <li className="payment-row">
      <span
        className="payment-row__mark"
        style={{ background: colour }}
        aria-hidden="true"
      />
      <div className="payment-row__main">
        <div className="payment-row__top">
          <div>
            <p className="payment-row__name">{payment.name}</p>
            <p className="payment-row__direction">{isIn ? 'In' : 'Out'}</p>
          </div>
          <p
            className={
              isIn
                ? 'payment-row__amount payment-row__amount--in'
                : 'payment-row__amount'
            }
          >
            {formatRM(payment.amount)}
          </p>
        </div>
        <div className="payment-row__bar-track">
          <span
            className={
              isIn
                ? 'payment-row__bar payment-row__bar--in'
                : 'payment-row__bar'
            }
            style={{
              width: `${share * 100}%`,
              background: colour,
            }}
          />
        </div>
        <div className="payment-row__bottom">
          <p className="payment-row__week">{weekLabel(payment)}</p>
          <div className="payment-row__controls">
            {confirming ? (
              <>
                <span className="payment-row__confirm">
                  Remove {payment.name}?
                </span>
                <button
                  type="button"
                  className="button button--small button--danger"
                  onClick={() => {
                    setConfirming(false)
                    onRemove(payment.id)
                  }}
                >
                  Yes, remove
                </button>
                <button
                  type="button"
                  className="button button--small"
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {isEvery ? null : (
                  <>
                    <button
                      type="button"
                      className="button button--small"
                      onClick={() => onMove(payment.id, -1)}
                      disabled={week <= 1}
                    >
                      Earlier
                    </button>
                    <button
                      type="button"
                      className="button button--small"
                      onClick={() => onMove(payment.id, 1)}
                      disabled={week >= 8}
                    >
                      Later
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="button button--remove"
                  onClick={() => setConfirming(true)}
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

const SORT_OPTIONS = [
  { value: 'added', label: 'Added order' },
  { value: 'amount-desc', label: 'Amount, high to low' },
  { value: 'amount-asc', label: 'Amount, low to high' },
  { value: 'week-asc', label: 'Week, first to last' },
  { value: 'week-desc', label: 'Week, last to first' },
  { value: 'name-asc', label: 'Name, A to Z' },
]

function paymentWeekNumber(payment) {
  return payment.kind.type === 'once' ? payment.kind.week : payment.kind.fromWeek
}

function sortPayments(payments, sort) {
  const sorted = [...payments]

  switch (sort) {
    case 'amount-desc':
      return sorted.sort((a, b) => b.amount - a.amount)
    case 'amount-asc':
      return sorted.sort((a, b) => a.amount - b.amount)
    case 'week-asc':
      return sorted.sort(
        (a, b) => paymentWeekNumber(a) - paymentWeekNumber(b),
      )
    case 'week-desc':
      return sorted.sort(
        (a, b) => paymentWeekNumber(b) - paymentWeekNumber(a),
      )
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    default:
      return sorted
  }
}

function PaymentList({ payments, onAdd, onMove, onRemove }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('added')
  const [notice, setNotice] = useState('')

  const trimmedQuery = query.trim().toLowerCase()
  const matches = payments.filter((payment) =>
    payment.name.toLowerCase().includes(trimmedQuery),
  )
  const visible = sortPayments(matches, sort)
  const largest = largestAmount(payments)
  const isFiltered = trimmedQuery !== '' || sort !== 'added'

  function resetFilters() {
    setQuery('')
    setSort('added')
  }

  function handleRemove(payment) {
    onRemove(payment.id)
    setNotice(`Removed ${payment.name}.`)
  }

  return (
    <section
      className="payments surfaces-enter"
      aria-labelledby="payments-label"
    >
      <h2 className="section-label" id="payments-label">
        Payments
      </h2>
      <PaymentForm onAdd={onAdd} />

      <p className="list-notice" role="status" aria-live="polite">
        {notice}
      </p>

      <div className="list-tools">
        <label className="field list-tools__search" htmlFor="payment-search">
          <span className="field__label">Search by name</span>
          <input
            id="payment-search"
            name="search"
            type="search"
            placeholder="Search payments"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="field__input"
          />
        </label>

        <label className="field" htmlFor="payment-sort">
          <span className="field__label">Sort by</span>
          <select
            id="payment-sort"
            name="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="field__input"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="button button--small list-tools__reset"
          onClick={resetFilters}
          disabled={!isFiltered}
        >
          Reset filters
        </button>
      </div>

      {payments.length === 0 ? (
        <p className="payment-list__empty">No payments yet. Add one above.</p>
      ) : visible.length === 0 ? (
        <p className="payment-list__empty">
          No payments match “{query.trim()}”. Clear the search to see all{' '}
          {payments.length} payments.
        </p>
      ) : (
        <ul className="payment-list">
          {visible.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              index={payments.findIndex((item) => item.id === payment.id)}
              largest={largest}
              onMove={onMove}
              onRemove={handleRemove}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function App() {
  const [state, setState] = useState(loadState)
  const { startingBalance, payments } = state

  useEffect(() => {
    saveState(state)
  }, [state])

  function addPayment({ name, amount, direction, week }) {
    setState((current) => {
      const newPayment = {
        id: crypto.randomUUID(),
        name,
        amount,
        direction,
        kind:
          week === 'every'
            ? { type: 'every', fromWeek: 1 }
            : { type: 'once', week: Number(week) },
      }
      return { ...current, payments: [...current.payments, newPayment] }
    })
  }

  function movePayment(id, delta) {
    setState((current) => ({
      ...current,
      payments: current.payments.map((payment) => {
        if (payment.id !== id || payment.kind.type !== 'once') {
          return payment
        }
        const nextWeek = Math.min(8, Math.max(1, payment.kind.week + delta))
        return { ...payment, kind: { type: 'once', week: nextWeek } }
      }),
    }))
  }

  function removePayment(id) {
    setState((current) => ({
      ...current,
      payments: current.payments.filter((payment) => payment.id !== id),
    }))
  }

  function setStartingBalance(nextValue) {
    setState((current) => ({ ...current, startingBalance: nextValue }))
  }

  return (
    <main className="page">
      <Header />
      <p className="goal">
        Keep every week <strong>above zero</strong>.
      </p>
      <Hero startingBalance={startingBalance} payments={payments} />
      <WeekStrip startingBalance={startingBalance} payments={payments} />
      <StartingBalance
        startingBalance={startingBalance}
        onChange={setStartingBalance}
      />
      <PaymentList
        payments={payments}
        onAdd={addPayment}
        onMove={movePayment}
        onRemove={removePayment}
      />
    </main>
  )
}

export default App