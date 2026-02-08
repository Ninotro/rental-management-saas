'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canManageUsers } from '@/lib/permissions'
import { Users, Plus, X, AlertCircle, Edit, Trash2 } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  active: boolean
  createdAt: string
}

export default function UsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user && !canManageUsers(session.user.role)) {
      router.push('/dashboard')
      return
    }

    fetchUsers()
  }, [session, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800'
      case 'STAFF':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteConfirm(null)
        fetchUsers()
      } else {
        const data = await response.json()
        alert(data.error || 'Errore nell\'eliminazione')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Errore nell\'eliminazione utente')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#3d4a3c]/20 rounded-full animate-spin border-t-[#3d4a3c]"></div>
          <Users className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#3d4a3c]" size={24} />
        </div>
        <p className="mt-4 text-slate-600 font-medium animate-pulse">Caricamento utenti...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#3d4a3c] via-[#4a5a49] to-[#3d4a3c] rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Gestione Utenti</h1>
            <p className="text-[#d4cdb0] text-lg">Gestisci gli utenti del sistema</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white px-5 py-3 rounded-2xl font-medium border border-white/20 transition-all duration-200"
          >
            <Plus size={20} />
            <span>Nuovo Utente</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Ruolo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Data Creazione
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-[#3d4a3c] to-[#4a5a49] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-lg ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-lg ${
                        user.active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.active ? 'Attivo' : 'Disabilitato'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 hover:bg-[#d4cdb0]/30 text-[#3d4a3c] rounded-lg transition-colors"
                        title="Modifica"
                      >
                        <Edit size={16} />
                      </button>
                      {session?.user?.id !== user.id && (
                        deleteConfirm === user.id ? (
                          <span className="inline-flex items-center gap-2 bg-red-50 rounded-lg px-3 py-1">
                            <span className="text-slate-600 text-xs">Confermi?</span>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="text-red-600 hover:text-red-900 font-medium text-xs"
                            >
                              Sì
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-slate-600 hover:text-slate-900 font-medium text-xs"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            title="Elimina"
                          >
                            <Trash2 size={16} />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchUsers}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  )
}

function CreateUserModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nella creazione utente')
      }
    } catch (err) {
      setError('Errore nella creazione utente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] px-6 py-5 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Plus size={20} />
              </div>
              <h2 className="text-xl font-bold">Crea Nuovo Utente</h2>
            </div>
          </div>
        </div>

        <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-xl flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome
            </label>
            <input
              type="text"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ruolo
            </label>
            <select
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
            >
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] text-white rounded-xl hover:from-[#4a5a49] hover:to-[#5a6a59] font-medium disabled:opacity-50 transition-all shadow-lg shadow-[#3d4a3c]/25"
            >
              {loading ? 'Creazione...' : 'Crea Utente'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

function EditUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    password: '',
    role: user.role,
    active: user.active,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        active: formData.active,
      }

      if (formData.password) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nell\'aggiornamento utente')
      }
    } catch (err) {
      setError('Errore nell\'aggiornamento utente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] px-6 py-5 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Edit size={20} />
              </div>
              <h2 className="text-xl font-bold">Modifica Utente</h2>
            </div>
          </div>
        </div>

        <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-xl flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome
            </label>
            <input
              type="text"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nuova Password (lascia vuoto per non modificare)
            </label>
            <input
              type="password"
              minLength={6}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ruolo
            </label>
            <select
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
            >
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex items-center p-3 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              id="active-checkbox"
              className="w-5 h-5 rounded-lg border-slate-300 text-[#3d4a3c] focus:ring-[#3d4a3c] mr-3"
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
            />
            <label htmlFor="active-checkbox" className="text-sm font-medium text-slate-700">
              Utente Attivo
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] text-white rounded-xl hover:from-[#4a5a49] hover:to-[#5a6a59] font-medium disabled:opacity-50 transition-all shadow-lg shadow-[#3d4a3c]/25"
            >
              {loading ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
