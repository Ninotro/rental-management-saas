function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19)
}

export function logTwilio(level: 'INFO' | 'ERROR' | 'DEBUG', message: string, data?: unknown) {
  const timestamp = formatDate(new Date())
  const prefix = `[TWILIO][${timestamp}][${level}]`

  const logMessage = data
    ? `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`
    : `${prefix} ${message}`

  if (level === 'ERROR') {
    console.error(logMessage)
  } else {
    console.log(logMessage)
  }
}

export function clearTwilioLog() {
  console.log('[TWILIO] Log cleared')
}
