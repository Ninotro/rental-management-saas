import fs from 'fs'
import path from 'path'

const LOG_DIR = path.join(process.cwd(), 'logs')
const TWILIO_LOG_FILE = path.join(LOG_DIR, 'twilio.log')

// Assicurati che la cartella logs esista
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }
}

function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19)
}

export function logTwilio(level: 'INFO' | 'ERROR' | 'DEBUG', message: string, data?: unknown) {
  ensureLogDir()

  const timestamp = formatDate(new Date())
  const logEntry = `[${timestamp}] [${level}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n${'='.repeat(80)}\n`

  fs.appendFileSync(TWILIO_LOG_FILE, logEntry)

  // Log anche in console per debug
  if (level === 'ERROR') {
    console.error(`[TWILIO ${level}] ${message}`)
  }
}

export function clearTwilioLog() {
  ensureLogDir()
  fs.writeFileSync(TWILIO_LOG_FILE, `=== TWILIO LOG - Iniziato ${formatDate(new Date())} ===\n\n`)
}
