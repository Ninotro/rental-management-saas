export const translations = {
  it: {
    // Header
    title: 'Check-in Online',
    subtitle: 'Completa il check-in per la tua prenotazione',

    // Booking Summary
    bookingSummary: 'Riepilogo Prenotazione',
    structure: 'Struttura',
    stayDates: 'Date soggiorno',
    guests: 'Ospiti',
    guest: 'ospite',
    total: 'Totale',

    // Form Sections
    guestData: 'Dati Ospite',
    requiredByLaw: '(Richiesto per legge)',
    personalData: 'Dati Personali',
    identityDocument: 'Documento di Identità',
    uploadDocument: 'Carica Documento (Opzionale)',
    uploadDocumentDesc: 'Carica foto del fronte e retro del documento',

    // Guest Management
    addGuest: 'Aggiungi Ospite',
    removeGuest: 'Rimuovi Ospite',
    guestNumber: 'Ospite',

    // Personal Fields
    firstName: 'Nome',
    lastName: 'Cognome',
    nationality: 'Nazionalità',
    dateOfBirth: 'Data di Nascita',
    birthCity: 'Città di Nascita',
    birthProvince: 'Provincia di Nascita',
    birthCountry: 'Paese di Nascita',
    residenceCountry: 'Paese di Residenza',
    residenceStreet: 'Via e Numero Civico',
    postalCode: 'CAP',
    residenceCity: 'Città',
    residenceProvince: 'Provincia',
    fiscalCode: 'Codice Fiscale',

    // Document Fields
    documentType: 'Tipo Documento',
    documentNumber: 'Numero Documento',
    documentIssuePlace: 'Luogo Rilascio Documento',
    documentFront: 'Fronte Documento',
    documentBack: 'Retro Documento',

    // Sex
    sex: 'Sesso',
    male: 'Maschio',
    female: 'Femmina',

    // Contact Preference
    contactPreference: 'Preferenza contatto',
    contactPreferenceQuestion: 'Dove preferisci ricevere le indicazioni per l\'ingresso?',

    // Document Types
    idCard: "Carta d'Identità",
    passport: 'Passaporto',
    drivingLicense: 'Patente di Guida',

    // Upload
    clickToUpload: 'Clicca per caricare',
    uploadingFile: 'Upload in corso...',
    changeFile: 'Clicca per cambiare',
    maxSize: 'max 10MB',

    // Document Upload Required
    uploadDocumentRequired: 'Carica Documento (Obbligatorio)',
    uploadDocumentRequiredDesc: 'Carica foto del fronte e retro del documento e un selfie',
    selfie: 'Selfie con Documento',
    selfieDesc: 'Scatta un selfie tenendo il documento accanto al viso',
    documentFrontRequired: 'La foto del fronte del documento è obbligatoria',
    documentBackRequired: 'La foto del retro del documento è obbligatoria',
    selfieRequired: 'Il selfie con documento è obbligatorio',

    // Privacy
    privacyNotice: 'I dati forniti saranno utilizzati esclusivamente per adempiere agli obblighi di legge relativi alla registrazione degli ospiti presso le autorità competenti (Questura). I tuoi dati personali saranno trattati nel rispetto del GDPR.',

    // Buttons
    submit: 'Completa Check-in',
    submitting: 'Invio in corso...',
    cancel: 'Annulla',

    // Success
    successTitle: 'Check-in Completato!',
    successMessage: 'Grazie per aver completato il check-in. I tuoi dati sono stati inviati con successo.',
    confirmationEmail: 'Riceverai una email di conferma a breve.',

    // Errors
    error: 'Errore',
    bookingNotFound: 'Prenotazione non trovata. Verifica il codice.',
    loadingError: 'Errore nel caricamento dei dati',
    allFieldsRequired: 'Tutti i campi obbligatori devono essere compilati',
    uploadError: "Errore nell'upload del documento",

    // Placeholders
    placeholderStreet: 'Via Roma, 123',
    placeholderPostalCode: '00100',
    placeholderCity: 'Roma',
    placeholderProvince: 'RM',
    placeholderFiscalCode: 'RSSMRA80A01H501U',
    placeholderDocNumber: 'AA1234567',
    // Tourist Tax
    touristTaxTitle: 'Tassa di Soggiorno',
    touristTaxDesc: 'Il Comune di Palermo prevede il pagamento di una tassa di soggiorno.',
    touristTaxInfo: 'Maggiori informazioni',
    touristTaxTotal: 'Totale Tassa di Soggiorno',
    touristTaxPay: 'Paga con PayPal',
    touristTaxRevolut: 'Paga con Revolut',
    touristTaxBankTransfer: 'Paga con Bonifico',
    touristTaxIBAN: 'IBAN',
    touristTaxHolder: 'Intestatario',
    touristTaxExempt: 'Sono esente dal pagamento',
    touristTaxExemptReason: 'Motivo esenzione',
    touristTaxExemptUnder12: 'Minore di 14 anni',
    touristTaxExemptResident: 'Residente a Palermo',
    touristTaxExemptAssistant: 'Accompagnatore malati (max 2)',
    touristTaxExemptStudent: 'Studente universitario/Scolaresca',
    touristTaxExemptSelect: 'Seleziona motivo...',

    // Billing / Invoice
    billingTitle: 'Dati di Fatturazione',
    billingDesc: 'Compila questa sezione se hai bisogno di fattura',
    wantsInvoice: 'Richiedo fattura',
    invoiceType: 'Tipo intestatario',
    invoiceTypePrivate: 'Persona fisica',
    invoiceTypeCompany: 'Azienda / Partita IVA',
    companyName: 'Ragione Sociale',
    vatNumber: 'Partita IVA',
    sdiCode: 'Codice SDI',
    sdiCodeDesc: 'Codice destinatario per fatturazione elettronica (7 caratteri)',
    pecEmail: 'PEC',
    pecEmailDesc: 'In alternativa al codice SDI',
    billingAddress: 'Indirizzo di fatturazione',
    billingCity: 'Città',
    billingProvince: 'Provincia',
    billingPostalCode: 'CAP',
    billingCountry: 'Paese',
    billingFieldsRequired: 'Se richiedi fattura, compila tutti i campi obbligatori',
    fiscalCodeRequired: 'Il codice fiscale è obbligatorio per la fatturazione',
    vatNumberRequired: 'La partita IVA è obbligatoria per le aziende',
  },

  en: {
    // ... previous en translations ...
    // Tourist Tax
    touristTaxTitle: 'Tourist Tax',
    touristTaxDesc: 'The Municipality of Palermo requires the payment of a tourist tax.',
    touristTaxInfo: 'More information',
    touristTaxTotal: 'Total Tourist Tax',
    touristTaxPay: 'Pay with PayPal',
    touristTaxRevolut: 'Pay with Revolut',
    touristTaxBankTransfer: 'Pay with Bank Transfer',
    touristTaxIBAN: 'IBAN',
    touristTaxHolder: 'Account Holder',
    touristTaxExempt: 'I am exempt from payment',
    touristTaxExemptReason: 'Exemption reason',
    touristTaxExemptUnder12: 'Under 14 years old',
    touristTaxExemptResident: 'Palermo resident',
    touristTaxExemptAssistant: 'Patient assistant (max 2)',
    touristTaxExemptStudent: 'University student/School group',
    touristTaxExemptSelect: 'Select reason...',
    // Header
    title: 'Online Check-in',
    subtitle: 'Complete your booking check-in',

    // Booking Summary
    bookingSummary: 'Booking Summary',
    structure: 'Property',
    stayDates: 'Stay Dates',
    guests: 'Guests',
    guest: 'guest',
    total: 'Total',

    // Form Sections
    guestData: 'Guest Information',
    requiredByLaw: '(Required by law)',
    personalData: 'Personal Information',
    identityDocument: 'Identity Document',
    uploadDocument: 'Upload Document (Optional)',
    uploadDocumentDesc: 'Upload front and back photos of your document',

    // Guest Management
    addGuest: 'Add Guest',
    removeGuest: 'Remove Guest',
    guestNumber: 'Guest',

    // Personal Fields
    firstName: 'First Name',
    lastName: 'Last Name',
    nationality: 'Nationality',
    dateOfBirth: 'Date of Birth',
    birthCity: 'Birth City',
    birthProvince: 'Birth Province',
    birthCountry: 'Country of Birth',
    residenceCountry: 'Country of Residence',
    residenceStreet: 'Street Address',
    postalCode: 'Postal Code',
    residenceCity: 'City',
    residenceProvince: 'Province/State',
    fiscalCode: 'Tax ID / SSN',

    // Document Fields
    documentType: 'Document Type',
    documentNumber: 'Document Number',
    documentIssuePlace: 'Document Issue Place',
    documentFront: 'Document Front',
    documentBack: 'Document Back',

    // Sex
    sex: 'Sex',
    male: 'Male',
    female: 'Female',

    // Contact Preference
    contactPreference: 'Contact preference',
    contactPreferenceQuestion: 'Where do you prefer to receive check-in instructions?',

    // Document Types
    idCard: 'ID Card',
    passport: 'Passport',
    drivingLicense: 'Driving License',

    // Upload
    clickToUpload: 'Click to upload',
    uploadingFile: 'Uploading...',
    changeFile: 'Click to change',
    maxSize: 'max 10MB',

    // Document Upload Required
    uploadDocumentRequired: 'Upload Document (Required)',
    uploadDocumentRequiredDesc: 'Upload front and back photos of your document and a selfie',
    selfie: 'Selfie with Document',
    selfieDesc: 'Take a selfie holding your document next to your face',
    documentFrontRequired: 'Front photo of document is required',
    documentBackRequired: 'Back photo of document is required',
    selfieRequired: 'Selfie with document is required',

    // Privacy
    privacyNotice: 'The data provided will be used exclusively to comply with legal obligations related to guest registration with the competent authorities (Police). Your personal data will be processed in accordance with GDPR.',

    // Buttons
    submit: 'Complete Check-in',
    submitting: 'Submitting...',
    cancel: 'Cancel',

    // Success
    successTitle: 'Check-in Complete!',
    successMessage: 'Thank you for completing the check-in. Your data has been successfully submitted.',
    confirmationEmail: 'You will receive a confirmation email shortly.',

    // Errors
    error: 'Error',
    bookingNotFound: 'Booking not found. Please check the code.',
    loadingError: 'Error loading data',
    allFieldsRequired: 'All required fields must be filled',
    uploadError: 'Error uploading document',

    // Placeholders
    placeholderStreet: '123 Main Street',
    placeholderPostalCode: '12345',
    placeholderCity: 'New York',
    placeholderProvince: 'NY',
    placeholderFiscalCode: 'ABC123456789',
    placeholderDocNumber: 'AB1234567',

    // Billing / Invoice
    billingTitle: 'Billing Information',
    billingDesc: 'Fill this section if you need an invoice',
    wantsInvoice: 'I need an invoice',
    invoiceType: 'Billing type',
    invoiceTypePrivate: 'Private individual',
    invoiceTypeCompany: 'Company / VAT registered',
    companyName: 'Company Name',
    vatNumber: 'VAT Number',
    sdiCode: 'SDI Code',
    sdiCodeDesc: 'Italian e-invoicing recipient code (7 characters)',
    pecEmail: 'PEC Email',
    pecEmailDesc: 'Alternative to SDI code',
    billingAddress: 'Billing Address',
    billingCity: 'City',
    billingProvince: 'Province/State',
    billingPostalCode: 'Postal Code',
    billingCountry: 'Country',
    billingFieldsRequired: 'If you request an invoice, please fill all required fields',
    fiscalCodeRequired: 'Tax ID is required for invoicing',
    vatNumberRequired: 'VAT number is required for companies',
  },
}

export type Language = 'it' | 'en'
export type TranslationKey = keyof typeof translations.it
