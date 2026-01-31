'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard, Receipt, Plus, Download, X, AlertCircle, Home, BarChart3, PieChart, Edit, Trash2 } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Transaction {
  id: string
  bookingId: string | null
  amount: number
  type: string
  date: string
  description: string
  booking: {
    guestName: string
    property: {
      name: string
    }
  } | null
}

interface Booking {
  id: string
  guestName: string
  totalPrice: number
  status: string
  checkIn: string
  checkOut: string
  createdAt: string
  property: {
    name: string
  }
}

interface Expense {
  id: string
  propertyId: string | null
  amount: number
  category: string
  date: string
  description: string
  property?: {
    name: string
  }
}

interface FinancialStats {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  thisMonthRevenue: number
  thisMonthExpenses: number
  revenueGrowth: number
  expenseGrowth: number
}

interface Property {
  id: string
  name: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function FinancialsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    thisMonthRevenue: 0,
    thisMonthExpenses: 0,
    revenueGrowth: 0,
    expenseGrowth: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false)
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false)
  const [showDeleteExpenseModal, setShowDeleteExpenseModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [period, setPeriod] = useState('thisMonth') // thisMonth, lastMonth, thisYear
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [transactions, bookings, expenses, period])

  const fetchData = async () => {
    try {
      const [transactionsRes, bookingsRes, expensesRes, propertiesRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/bookings'),
        fetch('/api/expenses'),
        fetch('/api/properties'),
      ])

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json()
        setTransactions(transactionsData)
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        setBookings(bookingsData)
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json()
        setExpenses(expensesData)
      }

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json()
        setProperties(propertiesData)
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Filter by period
    let filteredTransactions = transactions
    let filteredBookings = bookings.filter(b => b.status !== 'CANCELLED') // Escludi prenotazioni cancellate
    let filteredExpenses = expenses

    if (period === 'thisMonth') {
      filteredTransactions = transactions.filter(t => {
        const date = new Date(t.date)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
      filteredBookings = bookings.filter(b => {
        if (b.status === 'CANCELLED') return false
        const date = new Date(b.createdAt)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
      filteredExpenses = expenses.filter(e => {
        const date = new Date(e.date)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
    } else if (period === 'lastMonth') {
      filteredTransactions = transactions.filter(t => {
        const date = new Date(t.date)
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      })
      filteredBookings = bookings.filter(b => {
        if (b.status === 'CANCELLED') return false
        const date = new Date(b.createdAt)
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      })
      filteredExpenses = expenses.filter(e => {
        const date = new Date(e.date)
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      })
    } else if (period === 'thisYear') {
      filteredTransactions = transactions.filter(t => {
        const date = new Date(t.date)
        return date.getFullYear() === currentYear
      })
      filteredBookings = bookings.filter(b => {
        if (b.status === 'CANCELLED') return false
        const date = new Date(b.createdAt)
        return date.getFullYear() === currentYear
      })
      filteredExpenses = expenses.filter(e => {
        const date = new Date(e.date)
        return date.getFullYear() === currentYear
      })
    }

    // Calcola ricavi da transactions e bookings
    const revenueFromTransactions = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const revenueFromBookings = filteredBookings.reduce((sum, b) => sum + Number(b.totalPrice), 0)
    const totalRevenue = revenueFromTransactions + revenueFromBookings
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

    // Calculate growth (compare current period to previous)
    let revenueGrowth = 0
    let expenseGrowth = 0

    if (period === 'thisMonth') {
      const lastMonthTransactions = transactions.filter(t => {
        const date = new Date(t.date)
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      })
      const lastMonthBookings = bookings.filter(b => {
        if (b.status === 'CANCELLED') return false
        const date = new Date(b.createdAt)
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      })
      const lastMonthExpenses = expenses.filter(e => {
        const date = new Date(e.date)
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      })
      const lastMonthRevenueFromTransactions = lastMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
      const lastMonthRevenueFromBookings = lastMonthBookings.reduce((sum, b) => sum + Number(b.totalPrice), 0)
      const lastMonthRevenue = lastMonthRevenueFromTransactions + lastMonthRevenueFromBookings
      const lastMonthExpensesTotal = lastMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

      revenueGrowth = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0
      expenseGrowth = lastMonthExpensesTotal > 0 ? ((totalExpenses - lastMonthExpensesTotal) / lastMonthExpensesTotal) * 100 : 0
    }

    setStats({
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      thisMonthRevenue: totalRevenue,
      thisMonthExpenses: totalExpenses,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      expenseGrowth: Math.round(expenseGrowth * 10) / 10,
    })

    // Prepare monthly trend data (last 6 months)
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - i, 1)
      const targetMonth = targetDate.getMonth()
      const targetYear = targetDate.getFullYear()

      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date)
        return date.getMonth() === targetMonth && date.getFullYear() === targetYear
      })

      const monthBookings = bookings.filter(b => {
        if (b.status === 'CANCELLED') return false
        const date = new Date(b.createdAt)
        return date.getMonth() === targetMonth && date.getFullYear() === targetYear
      })

      const monthExpenses = expenses.filter(e => {
        const date = new Date(e.date)
        return date.getMonth() === targetMonth && date.getFullYear() === targetYear
      })

      const revenueFromTransactions = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
      const revenueFromBookings = monthBookings.reduce((sum, b) => sum + Number(b.totalPrice), 0)
      const revenue = revenueFromTransactions + revenueFromBookings
      const expense = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

      monthlyTrends.push({
        month: targetDate.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
        ricavi: revenue,
        spese: expense,
        profitto: revenue - expense,
      })
    }
    setMonthlyData(monthlyTrends)

    // Prepare category breakdown data
    const categoryMap: { [key: string]: number } = {}
    filteredExpenses.forEach(expense => {
      const category = expense.category
      categoryMap[category] = (categoryMap[category] || 0) + Number(expense.amount)
    })

    const categoryBreakdown = Object.entries(categoryMap).map(([name, value]) => ({
      name: getCategoryLabel(name),
      value,
    }))
    setCategoryData(categoryBreakdown)
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'MAINTENANCE': 'Manutenzione',
      'UTILITIES': 'Utenze',
      'CLEANING': 'Pulizie',
      'SUPPLIES': 'Forniture',
      'COMMISSION': 'Commissioni',
      'TAX': 'Tasse',
      'INSURANCE': 'Assicurazione',
      'OTHER': 'Altro',
    }
    return labels[category] || category
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Finanziario</h1>
          <p className="text-slate-600">Monitora ricavi, spese e profitti</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-3 rounded-xl font-medium shadow-lg transition-all"
          >
            <Plus size={20} />
            <span>Aggiungi Spesa</span>
          </button>
          <button className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-medium shadow-lg transition-all">
            <Download size={20} />
            <span>Esporta Report</span>
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setPeriod('thisMonth')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'thisMonth'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Questo Mese
          </button>
          <button
            onClick={() => setPeriod('lastMonth')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'lastMonth'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Mese Scorso
          </button>
          <button
            onClick={() => setPeriod('thisYear')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'thisYear'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Quest'Anno
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div className="flex items-center space-x-1 text-green-100 text-sm">
              <TrendingUp size={16} />
              <span>+{stats.revenueGrowth}%</span>
            </div>
          </div>
          <h3 className="text-green-100 text-sm font-medium mb-1">Ricavi Totali</h3>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingDown size={24} />
            </div>
            <div className="flex items-center space-x-1 text-red-100 text-sm">
              <TrendingDown size={16} />
              <span>{stats.expenseGrowth}%</span>
            </div>
          </div>
          <h3 className="text-red-100 text-sm font-medium mb-1">Spese Totali</h3>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalExpenses)}</p>
        </div>

        <div className={`bg-gradient-to-br ${
          stats.netProfit >= 0
            ? 'from-blue-500 to-indigo-600'
            : 'from-orange-500 to-red-600'
        } rounded-2xl p-6 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign size={24} />
            </div>
          </div>
          <h3 className="text-white/80 text-sm font-medium mb-1">Profitto Netto</h3>
          <p className="text-3xl font-bold">{formatCurrency(stats.netProfit)}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expenses Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Trend Finanziario</h2>
              <p className="text-sm text-slate-600">Ultimi 6 mesi</p>
            </div>
            <BarChart3 className="text-blue-600" size={24} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorRicavi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSpese" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value) => `€${Number(value).toFixed(2)}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="ricavi"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRicavi)"
                name="Ricavi"
              />
              <Area
                type="monotone"
                dataKey="spese"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorSpese)"
                name="Spese"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Spese per Categoria</h2>
              <p className="text-sm text-slate-600">Periodo selezionato</p>
            </div>
            <PieChart className="text-purple-600" size={24} />
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value) => `€${Number(value).toFixed(2)}`}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-500">
              <p>Nessuna spesa nel periodo selezionato</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions and Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions and Bookings */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Entrate Recenti</h2>
            <CreditCard className="text-green-600" size={24} />
          </div>
          <div className="space-y-3">
            {/* Mostra prima le transactions, poi le prenotazioni */}
            {transactions.slice(0, 5).map(transaction => (
              <div
                key={`transaction-${transaction.id}`}
                className="p-4 border border-slate-200 rounded-lg hover:border-green-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {transaction.booking?.guestName || 'Pagamento generico'}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {transaction.booking?.property.name || transaction.description || 'N/A'}
                    </p>
                  </div>
                  <span className="text-green-600 font-bold">
                    +{formatCurrency(Number(transaction.amount))}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{formatDate(transaction.date)}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{transaction.type}</span>
                </div>
              </div>
            ))}
            {/* Mostra le prenotazioni non cancellate che non hanno ancora una transaction */}
            {bookings
              .filter(b => {
                if (b.status === 'CANCELLED') return false
                // Mostra solo se non c'è già una transaction per questa prenotazione
                return !transactions.some(t => t.bookingId === b.id)
              })
              .slice(0, 5 - transactions.length)
              .map(booking => (
                <div
                  key={`booking-${booking.id}`}
                  className="p-4 border border-slate-200 rounded-lg hover:border-green-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{booking.guestName}</h3>
                      <p className="text-sm text-slate-600">{booking.property.name}</p>
                    </div>
                    <span className="text-green-600 font-bold">
                      +{formatCurrency(Number(booking.totalPrice))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{formatDate(booking.createdAt)}</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Prenotazione</span>
                  </div>
                </div>
              ))}
            {transactions.length === 0 && bookings.filter(b => b.status !== 'CANCELLED').length === 0 && (
              <p className="text-center py-8 text-slate-500">Nessuna entrata registrata</p>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Spese Recenti</h2>
            <Receipt className="text-red-600" size={24} />
          </div>
          <div className="space-y-3">
            {expenses.slice(0, 5).map(expense => (
              <div
                key={expense.id}
                className="p-4 border border-slate-200 rounded-lg hover:border-red-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{getCategoryLabel(expense.category)}</h3>
                    <p className="text-sm text-slate-600">
                      {expense.property?.name || 'Spesa generale'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-red-600 font-bold">
                      -{formatCurrency(Number(expense.amount))}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setSelectedExpense(expense)
                          setShowEditExpenseModal(true)
                        }}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                        title="Modifica"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedExpense(expense)
                          setShowDeleteExpenseModal(true)
                        }}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
                        title="Elimina"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{formatDate(expense.date)}</span>
                  <span className="px-2 py-1 bg-slate-100 rounded truncate max-w-[200px]">
                    {expense.description}
                  </span>
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <p className="text-center py-8 text-slate-500">Nessuna spesa registrata</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <AddExpenseModal
          properties={properties}
          onClose={() => setShowAddExpenseModal(false)}
          onSuccess={() => {
            fetchData()
            setShowAddExpenseModal(false)
          }}
        />
      )}

      {/* Edit Expense Modal */}
      {showEditExpenseModal && selectedExpense && (
        <EditExpenseModal
          expense={selectedExpense}
          properties={properties}
          onClose={() => {
            setShowEditExpenseModal(false)
            setSelectedExpense(null)
          }}
          onSuccess={() => {
            fetchData()
            setShowEditExpenseModal(false)
            setSelectedExpense(null)
          }}
        />
      )}

      {/* Delete Expense Modal */}
      {showDeleteExpenseModal && selectedExpense && (
        <DeleteExpenseModal
          expense={selectedExpense}
          onClose={() => {
            setShowDeleteExpenseModal(false)
            setSelectedExpense(null)
          }}
          onSuccess={() => {
            fetchData()
            setShowDeleteExpenseModal(false)
            setSelectedExpense(null)
          }}
        />
      )}
    </div>
  )
}

// Add Expense Modal Component
function AddExpenseModal({
  properties,
  onClose,
  onSuccess,
}: {
  properties: Property[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    propertyId: '',
    amount: '',
    category: 'MAINTENANCE',
    date: new Date().toISOString().split('T')[0],
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = [
    { value: 'MAINTENANCE', label: 'Manutenzione' },
    { value: 'UTILITIES', label: 'Utenze' },
    { value: 'CLEANING', label: 'Pulizie' },
    { value: 'SUPPLIES', label: 'Forniture' },
    { value: 'COMMISSION', label: 'Commissioni' },
    { value: 'TAX', label: 'Tasse' },
    { value: 'INSURANCE', label: 'Assicurazione' },
    { value: 'OTHER', label: 'Altro' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          propertyId: formData.propertyId || null,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nella creazione spesa')
      }
    } catch (err) {
      setError('Errore nella creazione spesa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Aggiungi Spesa</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-4 flex items-center">
            <AlertCircle size={18} className="mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Struttura (Opzionale)
            </label>
            <select
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.propertyId}
              onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
            >
              <option value="">Spesa generale</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Categoria *
            </label>
            <select
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Importo (€) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data *
            </label>
            <input
              type="date"
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descrizione *
            </label>
            <textarea
              required
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrivi la spesa..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creazione...' : 'Aggiungi Spesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Expense Modal Component
function EditExpenseModal({
  expense,
  properties,
  onClose,
  onSuccess,
}: {
  expense: Expense
  properties: Property[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    propertyId: expense.propertyId || '',
    amount: expense.amount.toString(),
    category: expense.category,
    date: new Date(expense.date).toISOString().split('T')[0],
    description: expense.description,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = [
    { value: 'MAINTENANCE', label: 'Manutenzione' },
    { value: 'UTILITIES', label: 'Utenze' },
    { value: 'CLEANING', label: 'Pulizie' },
    { value: 'SUPPLIES', label: 'Forniture' },
    { value: 'COMMISSION', label: 'Commissioni' },
    { value: 'TAX', label: 'Tasse' },
    { value: 'INSURANCE', label: 'Assicurazione' },
    { value: 'OTHER', label: 'Altro' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          propertyId: formData.propertyId || null,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nell\'aggiornamento spesa')
      }
    } catch (err) {
      setError('Errore nell\'aggiornamento spesa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Modifica Spesa</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-4 flex items-center">
            <AlertCircle size={18} className="mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Struttura (Opzionale)
            </label>
            <select
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.propertyId}
              onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
            >
              <option value="">Spesa generale</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Categoria *
            </label>
            <select
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Importo (€) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data *
            </label>
            <input
              type="date"
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descrizione *
            </label>
            <textarea
              required
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrivi la spesa..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Delete Expense Modal Component
function DeleteExpenseModal({
  expense,
  onClose,
  onSuccess,
}: {
  expense: Expense
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'MAINTENANCE': 'Manutenzione',
      'UTILITIES': 'Utenze',
      'CLEANING': 'Pulizie',
      'SUPPLIES': 'Forniture',
      'COMMISSION': 'Commissioni',
      'TAX': 'Tasse',
      'INSURANCE': 'Assicurazione',
      'OTHER': 'Altro',
    }
    return labels[category] || category
  }

  const handleDelete = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nell\'eliminazione spesa')
      }
    } catch (err) {
      setError('Errore nell\'eliminazione spesa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Elimina Spesa</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-4 flex items-center">
            <AlertCircle size={18} className="mr-2" />
            {error}
          </div>
        )}

        <div className="mb-6">
          <p className="text-slate-700 mb-4">
            Sei sicuro di voler eliminare questa spesa? Questa azione non può essere annullata.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Categoria:</span>
              <span className="text-sm font-medium text-slate-900">{getCategoryLabel(expense.category)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Importo:</span>
              <span className="text-sm font-medium text-red-600">
                €{Number(expense.amount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Struttura:</span>
              <span className="text-sm font-medium text-slate-900">
                {expense.property?.name || 'Spesa generale'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Descrizione:</span>
              <span className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                {expense.description}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Eliminazione...' : 'Elimina Spesa'}
          </button>
        </div>
      </div>
    </div>
  )
}
