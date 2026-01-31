import { UserRole } from '@prisma/client'

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    [UserRole.ADMIN]: 3,
    [UserRole.MANAGER]: 2,
    [UserRole.STAFF]: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export const isAdmin = (userRole: UserRole): boolean => {
  return userRole === UserRole.ADMIN
}

export const isManager = (userRole: UserRole): boolean => {
  return userRole === UserRole.MANAGER || userRole === UserRole.ADMIN
}

export const canManageUsers = (userRole: UserRole): boolean => {
  return isAdmin(userRole)
}

export const canViewAllProperties = (userRole: UserRole): boolean => {
  return isManager(userRole)
}

export const canManageBookings = (userRole: UserRole): boolean => {
  return isManager(userRole)
}

export const canViewFinancials = (userRole: UserRole): boolean => {
  return isManager(userRole)
}
