'use client'

import { useEffect, useState } from 'react'
import { FileText, Calendar, Users, Moon, Calculator, Euro, ChevronLeft, ChevronRight, Download, Building2 } from 'lucide-react'

interface PropertyReport {
  propertyId: string
  propertyName: string
  totalGuests: number
  totalNights: number
  totalTaxableNights: number
  totalTax: number
  exemptGuests: number
  taxRate: number
  maxNights: number
}

interface ReportData {
  year: number
  month: number
  monthName: string
  properties: PropertyReport[]
  totals: {
    totalGuests: number
    totalNights: number
    totalTaxableNights: number
    totalTax: number
    exemptGuests: number
  }
}

export default function TouristTaxReportPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [year, month])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dashboard/tourist-tax-report?year=${year}&month=${month}`)
      if (response.ok) {
        const data = await response.json()
        setReport(data)
      }
    } catch (error) {
      console.error('Errore nel caricamento del report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]

  const exportToCSV = () => {
    if (!report) return

    const headers = ['Struttura', 'Ospiti', 'Notti', 'Ospiti x Notti (max 4)', 'Totale Tassa', 'Ospiti Esenti']
    const rows = report.properties.map(p => [
      p.propertyName,
      p.totalGuests,
      p.totalNights,
      p.totalTaxableNights,
      p.totalTax.toFixed(2),
      p.exemptGuests,
    ])
    rows.push([
      'TOTALE',
      report.totals.totalGuests,
      report.totals.totalNights,
      report.totals.totalTaxableNights,
      report.totals.totalTax.toFixed(2),
      report.totals.exemptGuests,
    ])

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `tassa-soggiorno-${year}-${month.toString().padStart(2, '0')}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Euro className="text-amber-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Report Tassa di Soggiorno</h1>
            <p className="text-slate-600">Riepilogo mensile per struttura</p>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          disabled={!report || loading}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
        >
          <Download size={18} />
          <span>Esporta CSV</span>
        </button>
      </div>

      {/* Month Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center space-x-2">
            <Calendar className="text-amber-600" size={20} />
            <span className="text-xl font-semibold text-slate-900">
              {monthNames[month - 1]} {year}
            </span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Ospiti Totali</p>
                  <p className="text-2xl font-bold text-slate-900">{report.totals.totalGuests}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Moon className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Notti Totali</p>
                  <p className="text-2xl font-bold text-slate-900">{report.totals.totalNights}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calculator className="text-orange-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Notti Tassabili</p>
                  <p className="text-2xl font-bold text-slate-900">{report.totals.totalTaxableNights}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-sm p-4 text-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Euro className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-white/80">Totale Tassa</p>
                  <p className="text-2xl font-bold">{formatCurrency(report.totals.totalTax)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-sm p-4 text-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Euro className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-white/80">Netto (-10%)</p>
                  <p className="text-2xl font-bold">{formatCurrency(report.totals.totalTax * 0.9)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Report Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      <div className="flex items-center space-x-2">
                        <Building2 size={16} />
                        <span>Struttura</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      <div className="flex items-center justify-center space-x-2">
                        <Users size={16} />
                        <span>Ospiti</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      <div className="flex items-center justify-center space-x-2">
                        <Moon size={16} />
                        <span>Notti</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      <div className="flex items-center justify-center space-x-2">
                        <Calculator size={16} />
                        <span>Ospiti x Notti</span>
                      </div>
                      <span className="text-xs text-slate-500 font-normal">(max 4 notti)</span>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      <div className="flex items-center justify-center space-x-2">
                        <Euro size={16} />
                        <span>Totale Tassa</span>
                      </div>
                      <span className="text-xs text-slate-500 font-normal">(x 4)</span>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      <div className="flex items-center justify-center space-x-2">
                        <Euro size={16} />
                        <span>Netto</span>
                      </div>
                      <span className="text-xs text-slate-500 font-normal">(-10%)</span>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                      Esenti
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.properties.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        <FileText className="mx-auto mb-3 text-slate-400" size={48} />
                        <p>Nessun dato disponibile per questo mese</p>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {report.properties.map((property) => (
                        <tr key={property.propertyId} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-900">{property.propertyName}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-slate-700 font-semibold">{property.totalGuests}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-slate-700 font-semibold">{property.totalNights}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-orange-600 font-bold">{property.totalTaxableNights}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-amber-600 font-bold text-lg">
                              {formatCurrency(property.totalTax)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-emerald-600 font-bold text-lg">
                              {formatCurrency(property.totalTax * 0.9)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-slate-500">{property.exemptGuests}</span>
                          </td>
                        </tr>
                      ))}
                      {/* Totals Row */}
                      <tr className="bg-amber-50 border-t-2 border-amber-200">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900">TOTALE</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-slate-900">{report.totals.totalGuests}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-slate-900">{report.totals.totalNights}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-orange-600 text-lg">{report.totals.totalTaxableNights}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-amber-600 text-xl">
                            {formatCurrency(report.totals.totalTax)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-emerald-600 text-xl">
                            {formatCurrency(report.totals.totalTax * 0.9)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-slate-700">{report.totals.exemptGuests}</span>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-semibold text-amber-800 mb-2">Come viene calcolata la tassa</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• La tassa di soggiorno è di <strong>4 per notte/ospite</strong></li>
              <li>• Ogni ospite paga per un <strong>massimo di 4 notti</strong> consecutive</li>
              <li>• La colonna "Ospiti x Notti" mostra il numero di notti tassabili (massimo 4 per ospite)</li>
              <li>• Il totale è calcolato come: Notti Tassabili × 4</li>
              <li>• Gli ospiti esenti (minori, residenti, ecc.) non sono inclusi nel calcolo</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-slate-500">
          Errore nel caricamento del report
        </div>
      )}
    </div>
  )
}
