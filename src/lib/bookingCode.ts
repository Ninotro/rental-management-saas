/**
 * Genera un codice univoco per la prenotazione
 * Formato: BOOK-ABC123 (BOOK- + 6 caratteri alfanumerici)
 */
export function generateBookingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'BOOK-'

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    code += chars[randomIndex]
  }

  return code
}

/**
 * Verifica se un codice di prenotazione ha il formato corretto
 */
export function isValidBookingCode(code: string): boolean {
  const regex = /^BOOK-[A-Z0-9]{6}$/
  return regex.test(code)
}
