const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_WHATSAPP_FROM;

// Numero di test (modifica con il tuo numero)
const TEST_PHONE_NUMBER = '+393913210542';

console.log('===========================================');
console.log('  TEST TEMPLATE WHATSAPP TWILIO');
console.log('===========================================\n');

console.log('Configurazione:');
console.log('TWILIO_ACCOUNT_SID:', accountSid ? '✓ configurato' : '✗ MANCANTE');
console.log('TWILIO_AUTH_TOKEN:', authToken ? '✓ configurato' : '✗ MANCANTE');
console.log('TWILIO_WHATSAPP_FROM:', from || 'NON CONFIGURATO');
console.log('Numero di test:', TEST_PHONE_NUMBER);
console.log('');

if (!accountSid || !authToken) {
  console.log('\nErrore: Credenziali Twilio non configurate nel file .env');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function listTemplates() {
  console.log('\n--- LISTA TEMPLATE DISPONIBILI ---\n');

  try {
    // Usa la Content API per listare i template
    const response = await fetch('https://content.twilio.com/v1/Content', {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      }
    });

    const data = await response.json();

    if (data.contents && data.contents.length > 0) {
      console.log(`Trovati ${data.contents.length} template:\n`);

      for (const template of data.contents) {
        console.log(`  SID: ${template.sid}`);
        console.log(`  Nome: ${template.friendly_name}`);
        console.log(`  Lingua: ${template.language}`);

        // Controlla lo stato di approvazione WhatsApp
        const approvalResponse = await fetch(
          `https://content.twilio.com/v1/Content/${template.sid}/ApprovalRequests`,
          {
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
            }
          }
        );
        const approvalData = await approvalResponse.json();

        if (approvalData.whatsapp) {
          console.log(`  Stato WhatsApp: ${approvalData.whatsapp.status}`);
          if (approvalData.whatsapp.rejection_reason) {
            console.log(`  Motivo rifiuto: ${approvalData.whatsapp.rejection_reason}`);
          }
        } else {
          console.log('  Stato WhatsApp: non sottoposto per approvazione');
        }

        // Mostra il contenuto del template
        if (template.types && template.types['twilio/text']) {
          console.log(`  Testo: ${template.types['twilio/text'].body}`);
        }

        console.log('  ---');
      }

      return data.contents;
    } else {
      console.log('Nessun template trovato.');
      return [];
    }
  } catch (error) {
    console.error('Errore nel recupero template:', error.message);
    return [];
  }
}

async function sendTemplateMessage(contentSid, variables = {}) {
  console.log('\n--- INVIO MESSAGGIO TEMPLATE ---\n');
  console.log('ContentSid:', contentSid);
  console.log('Destinatario:', TEST_PHONE_NUMBER);
  console.log('Variabili:', JSON.stringify(variables));

  try {
    const messageParams = {
      from: from,
      to: `whatsapp:${TEST_PHONE_NUMBER}`,
      contentSid: contentSid,
    };

    if (Object.keys(variables).length > 0) {
      messageParams.contentVariables = JSON.stringify(variables);
    }

    const message = await client.messages.create(messageParams);

    console.log('\n✓ Messaggio inviato con successo!');
    console.log('  SID:', message.sid);
    console.log('  Status:', message.status);
    console.log('  To:', message.to);

    return message;
  } catch (error) {
    console.error('\n✗ Errore invio messaggio:', error.message);
    if (error.code) {
      console.error('  Codice errore:', error.code);
    }
    if (error.moreInfo) {
      console.error('  Info:', error.moreInfo);
    }
    return null;
  }
}

async function main() {
  // 1. Lista i template disponibili
  const templates = await listTemplates();

  // 2. Se ci sono template approvati, prova ad inviarne uno
  if (templates.length > 0) {
    console.log('\n===========================================');
    console.log('  PROVA INVIO TEMPLATE');
    console.log('===========================================');

    // Cerca un template approvato
    for (const template of templates) {
      const approvalResponse = await fetch(
        `https://content.twilio.com/v1/Content/${template.sid}/ApprovalRequests`,
        {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          }
        }
      );
      const approvalData = await approvalResponse.json();

      if (approvalData.whatsapp && approvalData.whatsapp.status === 'approved') {
        console.log(`\nTentativo invio template approvato: ${template.friendly_name}`);

        // Prepara le variabili di test
        const testVariables = {
          "1": "Mario Rossi",
          "2": "Villa Palermo",
          "3": "15/03/2025",
          "4": "18/03/2025",
          "5": "BOOK-TEST123"
        };

        await sendTemplateMessage(template.sid, testVariables);
        break;
      }
    }
  } else {
    console.log('\nNessun template da testare.');
    console.log('Prova prima a creare un template tramite l\'interfaccia web.');
  }
}

main().catch(console.error);
