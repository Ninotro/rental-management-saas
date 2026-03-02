const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_WHATSAPP_FROM;

const client = twilio(accountSid, authToken);

// Numero di test
const TO_NUMBER = '+393913210542';

// Template istruzioni_check_in con variabili (quello con {{1}}, {{2}}, {{3}}, {{4}})
// SID: HXd0eadd6e199e798236faf9490f7a2cb5 - Camera 302
const TEMPLATE_SID = 'HXd0eadd6e199e798236faf9490f7a2cb5';

async function sendTemplate() {
  console.log('===========================================');
  console.log('  TEST TEMPLATE ISTRUZIONI CHECK-IN');
  console.log('===========================================\n');

  console.log('From:', from);
  console.log('To:', TO_NUMBER);
  console.log('Template SID:', TEMPLATE_SID);
  console.log('');

  // Variabili del template:
  // {{1}} = guest_name
  // {{2}} = property_name
  // {{3}} = check_in_date
  // {{4}} = check_out_date
  const contentVariables = {
    "1": "Mario Rossi",
    "2": "EmanuelaHome Camera 302",
    "3": "13/02/2026",
    "4": "15/02/2026"
  };

  console.log('Variabili:', JSON.stringify(contentVariables, null, 2));
  console.log('\nInvio in corso...\n');

  try {
    const message = await client.messages.create({
      from: from,
      to: `whatsapp:${TO_NUMBER}`,
      contentSid: TEMPLATE_SID,
      contentVariables: JSON.stringify(contentVariables)
    });

    console.log('✓ Messaggio inviato!');
    console.log('  SID:', message.sid);
    console.log('  Status:', message.status);

    // Aspetta 3 secondi e controlla lo stato
    console.log('\nAttendo 3 secondi per controllare lo stato...');
    await new Promise(r => setTimeout(r, 3000));

    const updated = await client.messages(message.sid).fetch();
    console.log('\n=== STATO AGGIORNATO ===');
    console.log('Status:', updated.status);
    console.log('Error Code:', updated.errorCode || 'Nessuno');
    console.log('Error Message:', updated.errorMessage || 'Nessuno');

  } catch (error) {
    console.error('✗ Errore:', error.message);
    console.error('  Code:', error.code);
    console.error('  More Info:', error.moreInfo);
  }
}

sendTemplate();
