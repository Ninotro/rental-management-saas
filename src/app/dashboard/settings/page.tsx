'use client'

import { useState, useEffect } from 'react'
import {
    Save,
    Settings as SettingsIcon,
    CreditCard,
    Info,
    AlertCircle,
    CheckCircle,
    ShieldCheck
} from 'lucide-react'

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        touristTaxRate: '4.00',
        touristTaxMaxNights: '4',
        touristTaxExemptAge: '12',
        paypalEmail: '',
        revolutTag: '',
        bankAccountIBAN: '',
        bankAccountHolder: '',
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings')
            if (response.ok) {
                const data = await response.json()
                setFormData({
                    touristTaxRate: data.touristTaxRate.toString(),
                    touristTaxMaxNights: data.touristTaxMaxNights.toString(),
                    touristTaxExemptAge: data.touristTaxExemptAge.toString(),
                    paypalEmail: data.paypalEmail || '',
                    revolutTag: data.revolutTag || '',
                    bankAccountIBAN: data.bankAccountIBAN || '',
                    bankAccountHolder: data.bankAccountHolder || '',
                })
            }
        } catch (err) {
            console.error('Error fetching settings:', err)
            setError('Errore nel caricamento delle impostazioni')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        setSuccess(false)

        try {
            const response = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    touristTaxRate: parseFloat(formData.touristTaxRate) || 0,
                    touristTaxMaxNights: parseInt(formData.touristTaxMaxNights) || 0,
                    touristTaxExemptAge: parseInt(formData.touristTaxExemptAge) || 0,
                })
            })

            if (response.ok) {
                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
            } else {
                setError('Errore durante il salvataggio')
            }
        } catch (err) {
            setError('Errore di connessione')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <SettingsIcon size={36} className="text-blue-600" />
                    Impostazioni Globali
                </h1>
                <p className="text-slate-600 font-medium">
                    Configura i parametri generici validi per tutte le tue strutture.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tourist Tax Rules */}
                <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                        <ShieldCheck className="text-blue-600" size={20} />
                        <h2 className="text-lg font-bold text-slate-900">Configurazione Tassa di Soggiorno</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Importo (€/persona/notte)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900"
                                    value={formData.touristTaxRate}
                                    onChange={(e) => setFormData({ ...formData, touristTaxRate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Massimo Notti Tassate
                                </label>
                                <input
                                    type="number"
                                    required
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900"
                                    value={formData.touristTaxMaxNights}
                                    onChange={(e) => setFormData({ ...formData, touristTaxMaxNights: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Età Esenzione (sotto i X anni)
                                </label>
                                <input
                                    type="number"
                                    required
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900"
                                    value={formData.touristTaxExemptAge}
                                    onChange={(e) => setFormData({ ...formData, touristTaxExemptAge: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-4 p-4 bg-blue-50 rounded-2xl flex gap-3 items-start">
                            <Info className="text-blue-600 shrink-0" size={20} />
                            <p className="text-sm text-blue-800">
                                Questi valori vengono applicati automaticamente a tutte le nuove riga di calcolo durante il check-in degli ospiti.
                                Le regole attuali (Palermo) sono solitamente 4€ per max 4 notti, esenti sotto i 12 anni.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Payment Methods */}
                <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                        <CreditCard className="text-blue-600" size={20} />
                        <h2 className="text-lg font-bold text-slate-900">Metodi di Pagamento per gli Ospiti</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="p-2 bg-blue-100 rounded-lg text-blue-700 font-bold text-xs">PAYPAL</span>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Email PayPal (o Link PayPal.Me)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="esempio@email.it"
                                        className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900"
                                        value={formData.paypalEmail}
                                        onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Verrà generato un pulsante di pagamento diretto.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="p-2 bg-slate-900 rounded-lg text-white font-bold text-xs uppercase">Revolut</span>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Tag Revolut (revolut.me/tuotag)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="tuotag"
                                        className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900"
                                        value={formData.revolutTag}
                                        onChange={(e) => setFormData({ ...formData, revolutTag: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Solo il nome utente senza link completo.</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="p-2 bg-emerald-100 rounded-lg text-emerald-700 font-bold text-xs">BONIFICO BANCARIO</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        IBAN
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="IT00 X 0000 00000 000000000000"
                                        className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono uppercase text-slate-900"
                                        value={formData.bankAccountIBAN}
                                        onChange={(e) => setFormData({ ...formData, bankAccountIBAN: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Intestatario del Conto
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nome Cognome o Società"
                                        className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900"
                                        value={formData.bankAccountHolder}
                                        onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Form Messages */}
                {error && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-2xl flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <AlertCircle size={20} />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 text-green-800 p-4 rounded-2xl flex items-center gap-3 border border-green-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <CheckCircle size={20} />
                        <p className="font-medium">Impostazioni salvate con successo!</p>
                    </div>
                )}

                {/* Global Action Bar */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <Save size={24} />
                        )}
                        <span>Salva Impostazioni</span>
                    </button>
                </div>
            </form>
        </div>
    )
}
