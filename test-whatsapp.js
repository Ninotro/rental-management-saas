const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+15558351371';

console.log('Configurazione:');
console.log('TWILIO_ACCOUNT_SID:', accountSid ? 'configurato' : 'MANCANTE');
console.log('TWILIO_AUTH_TOKEN:', authToken ? 'configurato' : 'MANCANTE');
console.log('TWILIO_WHATSAPP_FROM:', from);

if (!accountSid || !authToken) {
  console.log('\nErrore: Credenziali Twilio non configurate nel file .env');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

console.log('\nInvio messaggio a +393913210542...');

client.messages.create({
  from: from,
  to: 'whatsapp:+393913210542',
  body: 'Ciao! Questo è un messaggio di test da BookYourStayPalermo.'
}).then(message => {
  console.log('\nMessaggio inviato con successo!');
  console.log('SID:', message.sid);
  console.log('Status:', message.status);
}).catch(err => {
  console.log('\nErrore invio:', err.message);
  if (err.code) {
    console.log('Codice errore:', err.code);
  }
});
