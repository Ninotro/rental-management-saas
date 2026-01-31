# TODO List - Rental Management SaaS

## ✅ Completato

### Autenticazione e Utenti
- [x] Sistema di autenticazione con NextAuth.js
- [x] Gestione utenti con ruoli (ADMIN, MANAGER, STAFF)
- [x] CRUD completo per utenti
- [x] Middleware per protezione routes

### Strutture (Properties)
- [x] CRUD completo per proprietà
- [x] **Modal di modifica proprietà** (appena implementato)
- [x] **Preview immagini nella lista** (appena implementato)
- [x] **Gallery immagini multiple** (appena implementato)
- [x] Upload immagini con UUID
- [x] Impostazione immagine principale
- [x] Eliminazione immagini
- [x] API per tutte le operazioni

### Stanze (Rooms)
- [x] CRUD completo per stanze
- [x] 9 tipi di stanza (SINGLE, DOUBLE, TWIN, TRIPLE, QUAD, SUITE, STUDIO, APARTMENT, DORMITORY)
- [x] **Gallery immagini multiple espandibile** (appena implementato)
- [x] Upload, eliminazione e gestione immagini
- [x] Impostazione immagine principale per stanza
- [x] Caratteristiche: bagno privato, balcone, cucina
- [x] Prezzo base per stanza

### Prenotazioni Base
- [x] CRUD prenotazioni
- [x] Controllo conflitti
- [x] Associazione a proprietà e stanze

## 🔄 Da Fare - Alta Priorità

### 1. Testing e Verifica
- [ ] **Testare tutte le funzionalità appena implementate:**
  - [ ] Verificare upload immagini proprietà
  - [ ] Verificare modifica proprietà
  - [ ] Verificare gallery immagini proprietà
  - [ ] Verificare gallery immagini stanze
  - [ ] Testare impostazione immagine principale
  - [ ] Testare eliminazione immagini

### 2. Miglioramenti UI Immagini
- [ ] **Lightbox/Modal per visualizzazione immagini full-size**
  - Quando clicchi su un'immagine, aprire modal con visualizzazione grande
  - Navigazione tra immagini (prev/next)
  - Zoom immagine

- [ ] **Drag & Drop per riordinare immagini**
  - Permetti di cambiare l'ordine delle immagini trascinandole
  - Aggiorna campo `order` nel database

- [ ] **Upload multiplo**
  - Permetti di selezionare e caricare più immagini insieme
  - Progress bar per upload
  - Preview prima dell'upload

### 3. Sistema Calendario
- [ ] **Vista calendario per disponibilità**
  - Calendario mensile/settimanale
  - Visualizzazione prenotazioni esistenti
  - Blocco date per manutenzione
  - Codice colore per stati (libero, occupato, check-in, check-out)

- [ ] **Gestione disponibilità stanze**
  - Impostare periodi non disponibili
  - Gestire prezzi stagionali
  - Visualizzare occupazione in tempo reale

### 4. Integrazioni Canali OTA
- [ ] **Sincronizzazione Booking.com**
  - Importare prenotazioni da Booking.com
  - Aggiornare calendario automaticamente
  - Gestione rate plans e availability

- [ ] **Sincronizzazione Airbnb**
  - Importare prenotazioni da Airbnb
  - Sincronizzazione bidirezionale calendario
  - Gestione prezzi e disponibilità

## 📊 Da Fare - Media Priorità

### 5. Dashboard Finanziario
- [x] **Dashboard con metriche:**
  - Ricavi totali (giornalieri, mensili, annuali)
  - Grafici trend ricavi/spese (ultimi 6 mesi)
  - Breakdown spese per categoria
  - Calcolo crescita percentuale
  - Filtri per periodo (questo mese, mese scorso, quest'anno)

- [x] **Gestione Spese**
  - CRUD per spese (GET, POST implementati)
  - Categorie: manutenzione, utenze, pulizie, forniture, commissioni, tasse, assicurazione, altro
  - Associazione spese a proprietà specifiche o generali
  - [ ] Upload ricevute/fatture (da implementare)
  - [ ] Edit/Delete spese (da implementare)

- [ ] **Reports**
  - [ ] Export Excel/PDF
  - [x] Filtri per periodo
  - [x] Calcolo profitto netto

### 6. Sistema Prezzi Dinamici
- [ ] **Modello RoomPrice**
  - Prezzi per periodo (alta/bassa stagione)
  - Prezzi per giorno settimana
  - Supplementi (festivi, eventi)
  - Sconti per lunghi periodi

- [ ] **Calcolo automatico prezzi prenotazione**
  - Calcolare prezzo totale basato su:
    - Periodo soggiorno
    - Numero ospiti
    - Tipo stanza
    - Prezzi dinamici applicabili

### 7. Gestione Ospiti
- [ ] **Database ospiti**
  - Anagrafica completa
  - Storico prenotazioni
  - Preferenze e note
  - Documenti identità

- [ ] **Comunicazioni**
  - Invio email automatiche (conferma, promemoria, checkout)
  - Template email personalizzabili
  - Email pre check-in con istruzioni

## 🎨 Da Fare - Bassa Priorità

### 8. UX/UI Improvements
- [ ] **Mobile responsive**
  - Ottimizzare layout per mobile
  - Touch gestures per gallery
  - Menu mobile migliorato

- [ ] **Loading states**
  - Skeleton loaders
  - Animated placeholders
  - Better error messages

- [ ] **Accessibility**
  - ARIA labels
  - Keyboard navigation
  - Screen reader support

### 9. Performance
- [ ] **Ottimizzazione immagini**
  - Compressione automatica upload
  - Generazione thumbnails
  - Lazy loading
  - WebP format support

- [ ] **Caching**
  - Redis per session
  - Cache API responses
  - Ottimizzare query database

### 10. Funzionalità Aggiuntive
- [ ] **Sistema pulizie**
  - Assegnazione pulizie a staff
  - Checklist pulizia stanze
  - Tracking status pulizia

- [ ] **Manutenzione**
  - Registro interventi manutenzione
  - Promemoria manutenzione periodica
  - Tracking costi manutenzione

- [ ] **Multi-lingua**
  - i18n setup
  - Traduzioni IT/EN
  - Cambio lingua dinamico

## 📝 Note Tecniche

### API Routes Creati
- `/api/properties` - GET, POST
- `/api/properties/[id]` - GET, PATCH, DELETE
- `/api/properties/[id]/images` - GET, POST, DELETE
- `/api/properties/[id]/images/[imageId]/primary` - PATCH (nuovo!)
- `/api/properties/[id]/rooms` - GET, POST
- `/api/rooms/[id]` - GET, PATCH, DELETE
- `/api/rooms/[id]/images` - GET, POST, DELETE
- `/api/rooms/[id]/images/[imageId]/primary` - PATCH (nuovo!)
- `/api/bookings` - GET, POST
- `/api/bookings/[id]` - GET, PATCH, DELETE
- `/api/users` - GET, POST
- `/api/users/[id]` - GET, PATCH, DELETE

### Modelli Database Implementati
- User (con ruoli)
- Property (con hasRooms flag)
- Room (9 tipi, prezzi, caratteristiche)
- PropertyImage (con isPrimary, order)
- RoomImage (con isPrimary, order)
- Booking (con propertyId e roomId nullable)
- Transaction
- Expense
- CalendarEvent
- RoomCalendarEvent
- RoomPrice

### Prossimi Passi Immediati
1. Implementare sistema prezzi dinamici per stanze
2. Completare CRUD spese (Edit/Delete)
3. Implementare export PDF/Excel per report finanziari
4. Iniziare integrazioni con Booking.com/Airbnb
5. Aggiungere upload ricevute per spese

---

**Ultimo aggiornamento:** 2026-01-05 (Sessione 3)
**Stato:** Dashboard finanziario completo con grafici, sistema prenotazioni migliorato con statistiche e ricerca, fix schema database per spese.

## 🎉 Completato in questa sessione (2026-01-05 - Sessione 2)

### 1. **Lightbox Immagini Full-Size** ✅
- Creato componente `ImageLightbox.tsx` riutilizzabile
- Navigazione tra immagini con tasti freccia e tastiera (ESC per chiudere)
- Visualizzazione thumbnails in basso
- Azioni disponibili nel lightbox:
  - Imposta come principale
  - Elimina immagine
- Integrato in property e room galleries
- Click su immagine apre lightbox automaticamente

### 2. **Upload Multiplo Immagini** ✅
- Modificato `UploadImageModal` per supportare selezione multipla
- Preview di tutte le immagini selezionate prima dell'upload
- Progress bar durante l'upload
- Possibilità di rimuovere singole immagini dalla selezione
- Pulsante "Aggiungi Altre" per aggiungere più file
- Badge "Principale" sulla prima immagine
- Upload sequenziale con contatore (es: "Caricamento 3/5...")
- Attributo `multiple` sul file input

### 3. **Sistema Calendario** ✅
- Creato componente `Calendar.tsx` riutilizzabile
- Vista calendario mensile completa
- Visualizzazione eventi con codice colore:
  - Bianco: Libero
  - Blu: Prenotato
  - Rosso: Bloccato/Manutenzione
  - Arancione: Misto
- Badge Check-in e Check-out sulle date pertinenti
- Evidenziazione data corrente con ring blu
- Navigazione mese precedente/successivo
- Click su data per vedere dettagli eventi
- Legenda colori integrata

### 4. **Pagina Calendario Dashboard** ✅
- Creata `/dashboard/calendar` page completa
- Filtri per proprietà e stanze
- Statistiche in card:
  - Prenotazioni totali
  - Confermate
  - In attesa
  - Cancellate
- Visualizzazione eventi del giorno selezionato
- Link nella sidebar del dashboard

### 5. **Fix Colore Testo Input** ✅
- Aggiunto `text-slate-900` a tutti gli input
- Applicato a:
  - PropertyEditModal
  - CreatePropertyModal
  - Tutti i form della applicazione
- Testo ora visibile durante la digitazione

### 6. **Sistema Blocco Date/Manutenzione** ✅
- Creato API routes `/api/calendar-events` (GET, POST)
- Creato API route `/api/calendar-events/[id]` (DELETE, PATCH)
- Integrato nel calendario esistente
- Modal `BlockDateModal` per creare eventi bloccati
- Tipi supportati: BLOCKED, MAINTENANCE
- Selezione struttura, periodo, titolo e descrizione
- Eventi visualizzati nel calendario con codice colore rosso

### 7. **Dashboard Finanziario** ✅
- Creata pagina `/dashboard/financials` completa
- Card statistiche con gradiente:
  - Ricavi totali (verde)
  - Spese totali (rosso)
  - Profitto netto (blu/arancione in base al valore)
- Filtri per periodo: Questo Mese, Mese Scorso, Quest'Anno
- Lista entrate recenti (da transazioni)
- Lista spese recenti
- Formato valuta italiana (€)
- Growth indicators (placeholder per calcolo reale)
- Pulsanti "Aggiungi Spesa" e "Esporta Report"

### 8. **API Routes Finanziarie** ✅
- `/api/transactions` (GET, POST) - Gestione transazioni
- `/api/expenses` (GET, POST) - Gestione spese
- Include relazioni con booking e property
- Filtri per propertyId e category
- Ordinamento per data decrescente

### 9. **Modal Aggiungi Spesa** ✅
- Componente `AddExpenseModal` completo
- Selezione struttura (opzionale per spese generali)
- Categorie predefinite:
  - Manutenzione, Utenze, Pulizie, Forniture
  - Commissioni, Tasse, Assicurazione, Altro
- Input importo con decimali (€)
- Data picker
- Descrizione obbligatoria
- Validazione form completa
- Integrato nel dashboard finanziario

## 🎉 Completato in questa sessione (2026-01-05 - Sessione 3)

### 10. **Grafici e Visualizzazioni Finanziarie** ✅
- Installata libreria Recharts per data visualization
- Implementato **Area Chart** per trend finanziario:
  - Grafico a aree con gradiente per ricavi (verde) e spese (rosso)
  - Visualizzazione ultimi 6 mesi
  - Tooltips con valori formattati in Euro
  - Asse Y con formato abbreviato (€Xk)
  - Grid e legend personalizzati
- Implementato **Pie Chart** per breakdown spese per categoria:
  - Visualizzazione percentuali per categoria
  - 8 colori distinti per le categorie
  - Labels con nome e percentuale
  - Tooltips con valori in Euro
  - Messaggio placeholder se nessuna spesa presente
- Implementato **calcolo crescita reale**:
  - Confronto mese corrente vs mese precedente
  - Percentuale di crescita ricavi
  - Percentuale di crescita spese
  - Valori arrotondati a 1 decimale
- Layout responsive con grid 2+1 colonne
- Integrato nella pagina `/dashboard/financials`
- Chart data si aggiorna automaticamente al cambio periodo

### 11. **Fix Schema Expense e API** ✅
- Aggiornato schema Prisma per modello Expense:
  - Aggiunto campo `propertyId` (opzionale) per associare spese a proprietà
  - Aggiunto campo `receiptUrl` (opzionale) per salvare ricevute
  - Aggiunta relazione con Property
- Aggiornato API `/api/expenses`:
  - Aggiunto `createdById` dalla sessione utente
  - Fix validazione campi obbligatori
  - Gestione corretta di propertyId e receiptUrl opzionali
- Eseguito database migration con `prisma db push`
- Rigenerato Prisma Client
- Fix risolto: ora le spese si salvano correttamente

### 12. **Sistema Gestione Prenotazioni Completo** ✅
- Implementato **Modal Creazione Prenotazione** completo:
  - Selezione struttura con fetch dinamico da API
  - Selezione stanza (se la struttura ha hasRooms = true)
  - Caricamento stanze dinamico in base alla struttura selezionata
  - Dati ospite: nome, email, telefono (opzionale), numero ospiti
  - Validazione numero massimo ospiti in base a stanza/proprietà
  - Date check-in e check-out con input date picker
  - Prezzo totale con decimali
  - Selezione stato: Pending, Confirmed, Checked-in, Checked-out, Cancelled
  - Selezione canale: Direct, Booking.com, Airbnb, Other
  - Campo note opzionale
  - Validazione completa form lato client
  - Error handling con messaggi utente
- Implementato **Dashboard Statistiche Prenotazioni**:
  - Card "Totale Prenotazioni" (blu)
  - Card "Confermate" (verde)
  - Card "In Attesa" (giallo/arancione)
  - Card "Ricavi Totali" (viola/rosa) con esclusione cancellate
  - Gradiente moderno e icone
- Implementato **Ricerca Funzionante**:
  - Ricerca per nome ospite
  - Ricerca per email ospite
  - Ricerca per nome struttura
  - Filtro in tempo reale
  - Case-insensitive
- Miglioramenti UI:
  - Visualizzazione nome stanza nella lista (se presente)
  - Formato "Struttura - Stanza - Città"
  - Input text con colore slate-900 per visibilità
- Integrazione completa con API `/api/bookings`

### 13. **Prenotazioni Sempre Collegate a Stanze** ✅
- Modificato sistema prenotazioni per rendere **roomId obbligatorio**:
  - Campo stanza sempre visibile e richiesto nel form
  - Validazione lato client per roomId obbligatorio
  - Select stanza disabilitato finché non si seleziona una struttura
  - Messaggio di warning se la struttura non ha stanze
  - Reset roomId quando si cambia struttura
- Aggiornato API `/api/bookings`:
  - roomId obbligatorio nella validazione
  - Check conflitti ora basato sulla stanza specifica (non sulla proprietà)
  - Include relazione room nel GET e POST
  - Messaggio errore più chiaro: "La stanza non è disponibile"
- Logica migliorata:
  - Fetch stanze sempre eseguito quando si seleziona una proprietà
  - Proprietà senza stanze mostrano avviso all'utente
  - Sistema richiede creazione stanze prima di prenotare
- **Benefici**:
  - Gestione più precisa delle disponibilità
  - Evita conflitti tra stanze diverse della stessa struttura
  - Dati più strutturati e query più efficienti
  - Miglior tracking e analytics per stanza
