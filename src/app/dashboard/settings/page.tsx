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
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-[#3d4a3c]/20 rounded-full animate-spin border-t-[#3d4a3c]"></div>
                    <SettingsIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#3d4a3c]" size={24} />
                </div>
                <p className="mt-4 text-slate-600 font-medium animate-pulse">Caricamento impostazioni...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#3d4a3c] via-[#4a5a49] to-[#3d4a3c] rounded-3xl p-8 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

                <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-2">Impostazioni Globali</h1>
                    <p className="text-[#d4cdb0] text-lg">
                        Configura i parametri generici validi per tutte le tue strutture.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tourist Tax Rules */}
                <section className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#d4cdb0]/30 to-[#d4cdb0]/10 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-[#3d4a3c] rounded-xl">
                            <ShieldCheck className="text-white" size={18} />
                        </div>
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
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent outline-none transition-all text-slate-900"
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
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent outline-none transition-all text-slate-900"
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
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent outline-none transition-all text-slate-900"
                                    value={formData.touristTaxExemptAge}
                                    onChange={(e) => setFormData({ ...formData, touristTaxExemptAge: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-4 p-4 bg-[#d4cdb0]/20 rounded-2xl flex gap-3 items-start border border-[#d4cdb0]/30">
                            <Info className="text-[#3d4a3c] shrink-0" size={20} />
                            <p className="text-sm text-slate-700">
                                Questi valori vengono applicati automaticamente a tutte le nuove riga di calcolo durante il check-in degli ospiti.
                                Le regole attuali (Palermo) sono solitamente 4€ per max 4 notti, esenti sotto i 12 anni.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Payment Methods */}
                <section className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#d4cdb0]/30 to-[#d4cdb0]/10 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-[#3d4a3c] rounded-xl">
                            <CreditCard className="text-white" size={18} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Metodi di Pagamento per gli Ospiti</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="p-2 bg-blue-100 rounded-xl text-blue-700 font-bold text-xs">PAYPAL</span>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Email PayPal (o Link PayPal.Me)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="esempio@email.it"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent outline-none transition-all text-slate-900"
                                        value={formData.paypalEmail}
                                        onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Verrà generato un pulsante di pagamento diretto.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="p-2 bg-slate-900 rounded-xl text-white font-bold text-xs uppercase">Revolut</span>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Tag Revolut (revolut.me/tuotag)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="tuotag"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent outline-none transition-all text-slate-900"
                                        value={formData.revolutTag}
                                        onChange={(e) => setFormData({ ...formData, revolutTag: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Solo il nome utente senza link completo.</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="p-2 bg-emerald-100 rounded-xl text-emerald-700 font-bold text-xs">BONIFICO BANCARIO</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        IBAN
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="IT00 X 0000 00000 000000000000"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent outline-none transition-all font-mono uppercase text-slate-900"
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
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent outline-none transition-all text-slate-900"
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
                    <div className="bg-red-50 text-red-800 p-4 rounded-2xl flex items-center gap-3 border border-red-200">
                        <AlertCircle size={20} />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 border border-emerald-200">
                        <CheckCircle size={20} />
                        <p className="font-medium">Impostazioni salvate con successo!</p>
                    </div>
                )}

                {/* Global Action Bar */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] hover:from-[#4a5a49] hover:to-[#5a6a59] text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-[#3d4a3c]/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
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
