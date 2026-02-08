const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const messageSid = 'SMc46e2013c89c15e35cf45dad55b1a1c4';

client.messages(messageSid)
  .fetch()
  .then(message => {
    console.log('=== Stato Messaggio ===');
    console.log('SID:', message.sid);
    console.log('Status:', message.status);
    console.log('Da:', message.from);
    console.log('A:', message.to);
    console.log('Corpo:', message.body);
    console.log('Data invio:', message.dateSent);
    console.log('Codice errore:', message.errorCode || 'Nessuno');
    console.log('Messaggio errore:', message.errorMessage || 'Nessuno');
  })
  .catch(err => {
    console.log('Errore:', err.message);
  });
