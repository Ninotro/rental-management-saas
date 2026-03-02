const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// SID del messaggio inviato
const messageSid = 'MM420dbcd4c78943b1c4265db69a234ced';

async function checkStatus() {
  console.log('Controllo stato messaggio:', messageSid);
  console.log('');

  try {
    const message = await client.messages(messageSid).fetch();

    console.log('=== STATO MESSAGGIO ===');
    console.log('SID:', message.sid);
    console.log('Status:', message.status);
    console.log('Error Code:', message.errorCode || 'Nessuno');
    console.log('Error Message:', message.errorMessage || 'Nessuno');
    console.log('From:', message.from);
    console.log('To:', message.to);
    console.log('Date Created:', message.dateCreated);
    console.log('Date Sent:', message.dateSent);
    console.log('Date Updated:', message.dateUpdated);
    console.log('Direction:', message.direction);
    console.log('Price:', message.price, message.priceUnit);

  } catch (error) {
    console.error('Errore:', error.message);
  }

  // Controlla anche gli ultimi messaggi inviati
  console.log('\n=== ULTIMI 5 MESSAGGI ===\n');

  const messages = await client.messages.list({ limit: 5 });
  messages.forEach(msg => {
    console.log(`${msg.dateCreated} | ${msg.status.padEnd(10)} | ${msg.to} | ${msg.errorCode || 'OK'}`);
    if (msg.errorMessage) {
      console.log(`  └─ Errore: ${msg.errorMessage}`);
    }
  });
}

checkStatus();
