# Changelog

Tutte le modifiche importanti al progetto Cat Care Tracker sono documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/).

---

## [2.6.4] - 2025-12-09
### Fixed
- **UI**: Fixed bug where Setup tab content was visible in all tabs.

## [2.6.3] - 2025-12-09
### Fixed
- **Data Cleanup**: Merged duplicate product entries.
- **UX**: Products are now automatically sorted by Brand and Flavor.
- **Code Quality**: Reduced usage of inline styles.

## [2.6.2] - 2025-12-09
### Features
- **Edit Brands/Flavors**: Added ability to rename brands and flavors.
- **Auto-Update**: Renaming a brand/flavor automatically updates all associated products.

## [2.6.1] - 2025-12-09
### Fixed
- **CSS**: Improved styles for List Manager modal (missing classes).
- **UX**: Added warning when adding a duplicate product.
- **Data**: Removed duplicate entries from history and product list.

## [2.6.0] - 2025-12-09
### Features
- **Dynamic Food Management**: Manage Brands and Flavors directly from the Setup tab.
- **Custom Lists**: Add or remove brands and flavors; they automatically appear in dropdowns.
- **UI**: Added "Gestione Cibo" section in Setup.

## [2.5.4] - 2025-12-09
### Fixes
- **Modal Overflow**: Added scrolling for modals on small screens (e.g. iPhone mini).

## [2.5.3] - 2025-12-09
### UI/UX Refinements
- **Setup Tab**: Renamed "Impostazioni" to "Setup" for better fit.
- **Swipe Logic**: Restricted pull-to-refresh to Home tab only.
- **Modal**: Compacted Food Modal styles for smaller screens.

## [2.5.2] - 2025-12-09
### Polished
- **Log Cleanup**: Removed debug console logs for production readiness.
- **Changelog**: Updated documentation to reflect all recent changes.

## [2.5.1] - 2025-12-09
### Fixed
- **Chart Container**: Added proper CSS class with fixed height to prevent layout shifts.
- **Dark Mode Chart**: Grid and text colors now adapt to system theme.
- **Swipe to Delete**: Verified and enabled on history items.
- **Cleanup**: Removed server.log from repository tracking.
- **Code Quality**: Removed obsolete comments.

## [2.5.0] - 2025-12-09
### Added
- **Weight Chart**: Interactive line chart to track cat weight trends.
- **Chart.js**: Integrated charting library.
- **Weight Input**: Specialized input field in "New Event" modal.

## [2.4.4] - 2025-12-09
### Fix e Pulizia
- **Manifest**: Risolto problema di scope duplicato nel file `manifest.json`.
- **Bug Fix**: Corretto confronto ID in `saveProduct()` per evitare errori nel salvataggio prodotti.
- **Cleanup**: Rimossi file temporanei e di backup per mantenere il progetto pulito.

## [2.4.3] - 2025-12-09
### Refactor e Fix (Post-Report Opus 4.5)
- **Code Quality**: Rimossa funzione duplicata `showAddHealthEvent` in `health.js` che creava confusione nel codice.
- **Bug Fix**: Unificata la logica di calcolo giorni in `app.js` (rimossa versione ridondante in `health.js`) e resa più robusta per evitare errori `NaN`.
- **Bug Fix**: Corretti i confronti ID in `food.js` per gestire correttamente sia ID numerici (vecchi) che stringa (nuovi).
- **Stability**: Migliorata la robustezza della sincronizzazione (`sync.js`) aggiungendo blocchi `try-finally` per garantire che lo stato "Syncing..." venga sempre resettato, anche in caso di errori imprevisti.

## [2.4.2] - 2025-12-08
### Refactor
- **CSS**: Estratto tutto il CSS inline da `index.html` in file separati (`variables.css`, `main.css`, `layout.css`, `components.css`).
- **Performance**: Alleggerito `index.html` del 70%.
- **Bug Fix**: Risolto problema "Zombie" 🧟‍♂️ sugli eventi eliminati che riapparivano dopo la sincronizzazione.
- **Bug Fix**: Risolto problema "Zombie" 🧟‍♂️ sugli eventi eliminati che riapparivano dopo la sincronizzazione.
- **UI**: Migliorato stile e visibilità del selettore data nelle modali (Pulizia e Modifica).
- **Critical Fix**: Risolto bug che nascondeva le finestre di conferma e modifica (errore di chiusura HTML).
- **Critical Fix**: Risolto conflitto JavaScript che impediva la chiusura delle modali (tasti "Annulla" bloccati).
- **Bug Fix**: Il tasto "Sincronizza ora" ora appare correttamente quando lo stato è "Connesso". Prima rimaneva nascosto.
- **Bug Fix**: **Risolto definitivamente** il problema della data "Zombie" 🧟 che riappariva dopo essere stata cancellata. (Introdotto meccanismo di "Self-Healing").
- **Bug Fix**: La home ora mostra sempre la *reale* ultima data di pulizia (anche se ne inserisci una passata manuale).
- **Feature**: Aggiunto controllo anti-duplicati (impedisce di inserire due pulizie identiche lo stesso giorno).

## [2.4.1] - 2025-10-27-08

### Corretto
- **Problema Sync Dati**: Risolto un bug critico che escludeva i dati di salute (`healthEvents` e `cats`) dal backup su GitHub. Ora il file `data.json` remoto si aggiornerà correttamente con tutte le informazioni.

## [2.4.0] - 2025-12-08

### Aggiunto
- **Eventi Condivisi**: Nuova opzione "Entrambe" nel modale salute per registrare un evento (visita, vaccino, ecc.) simultaneamente per Minou e Matisse.

### Corretto
- **Selezione Gatti**: Risolto bug che impediva l'evidenziazione corretta del gatto selezionato (spazio extra nell'ID).
- **Stabilità Console**: Rimossi errori "null reference" e "script not found" (pulizia codice morto).
- **Errore CORS**: Risolto problema di blocco sincronizzazione su rete locale rimuovendo header `Cache-Control`.

## [2.3.0] - 2025-12-08

### Aggiunto
- **Cancellazione Eventi Sanitari**: possibilità di eliminare eventi inseriti per errore nel diario clinico (con conferma di sicurezza a due step).

### Corretto
- **Fix Codice Visibile**: rimosso blocco di codice duplicato che appariva come testo nelle Impostazioni.
- **Fix Modali Sovrapposti**: risolto bug critico che fondeva la modale "Configura GitHub" con "Profilo Gatto", rendendo impossibile il salvataggio.
- **Fix Duplicazione Sync**: il sistema ora riconosce correttamente gli eventi già esistenti evitando duplicati durante la sincronizzazione (gestione ID stringa/numero).

## [2.2.0] - 2025-12-08

### Aggiunto
- **Sezione Salute & Veterinario** 🏥: nuovo modulo completo per la salute dei gatti
- **Gestione Profili**: schede dettagliate per Minou e Matisse con peso, data nascita e microchip
- **Diario Clinico**: timeline per tracciare vaccini 💉, visite veritarie 👨‍⚕️, antiparassitari 💊 e peso ⚖️
- **Scadenze Mediche**: sistema automatico di calcolo prossimi richiami e visualizzazione nelle card
- **Note salute**: possibilità di aggiungere note libere al diario
- **UI Migliorata**: nuove icone, badge di stato e layout ottimizzato per le schede gatti

## [2.2.1] - 2025-12-08

### Corretto
- **Fix Pagina Impostazioni**: risolto un problema che impediva la visualizzazione della pagina Impostazioni (era nidificata per errore).
- **Tab Salute**: rimosso duplicato della Tab Salute che causava conflitti.

### Migliorato
- **Barra di Navigazione**: nuovo design moderno, senza bordi, con icone più grandi ed evidenziazione attiva migliorata.
- **Header**: rimosso codice HTML visibile che compariva in alto (tag link malformato).
- **Integrità Dati**: aggiunto recupero automatico per app aggiornate da versioni precedenti (ripristina struttura `cats` mancante).

## [2.1.0] - 2025-12-08

### Aggiunto
- **Smart Sync (Unione Intelligente)**: sistema di sincronizzazione avanzato per uso multi-utente.
- Logica di merge automatico per toilette, storico e inventario cibo.
- Prevenzione sovrascrittura dati: "Pull-before-Push" automatico durante il salvataggio.
- Migliorata la gestione dei conflitti di sincronizzazione.

## [2.0.0] - 2025-12-07

### Aggiunto
- **Nuova sezione Cibo** 🍽️ con gestione completa scorte
- **Inventario prodotti**: scatolette (Natural Code, Schesir, Oasy, Life Cat) e crocchette (Farmina)
- **Gestione quantità**: pulsanti +/- per aggiornare velocemente le scorte
- **Avviso scorte basse**: notifica quando le scatolette scendono sotto 15 unità
- **Preferenze gatte**: traccia quali gusti piacciono a Minou e Matisse
- **Valutazioni prodotti**: ❤️ Adorano, 👍 Piace, 😐 Ok, 👎 No
- **Formati scatolette**: supporto per 50g, 70g, 85g e 400g
- **Gusti preconfigurati**: tonno, pollo, tacchino, misti e personalizzati
- **Riepilogo scorte**: visualizzazione totale scatolette e kg crocchette
- Nuova tab "Cibo" nella navigazione (ora 4 tab)
- Sincronizzazione dati cibo con GitHub

---

## [1.5.2] - 2025-12-07

### Corretto
- **Fix definitivo layout Android**: riscritta completamente la barra di navigazione con layout più semplice
- Altezza fissa navbar (60px) per consistenza su tutti i dispositivi
- Rimossi stili complessi che causavano problemi su Android
- Aggiunto supporto corretto per safe-area su iOS

---

## [1.5.1] - 2025-12-07

### Corretto
- **Fix layout Android**: la barra di navigazione ora si visualizza correttamente su tutti i dispositivi Android
- Ridotte dimensioni pulsanti navigazione per adattarsi a schermi più piccoli
- Corretto problema di scroll orizzontale sulla navbar
- Migliorato layout responsive per dispositivi con diverse dimensioni schermo

---

## [1.5.0] - 2025-12-07

### Aggiunto
- **Sincronizzazione GitHub**: i dati vengono salvati su GitHub e sincronizzati tra tutti i dispositivi
- Nuova sezione "Sincronizzazione" nelle impostazioni
- Configurazione Personal Access Token GitHub
- Pulsante "Sincronizza ora" per forzare la sincronizzazione
- Indicatore stato connessione (online/offline/errore)
- Visualizzazione ultima sincronizzazione

### Modificato
- I dati vengono salvati sia localmente che su GitHub
- All'avvio l'app scarica i dati più recenti da GitHub

---

## [1.4.0] - 2025-12-07

### Aggiunto
- **Pull to Refresh**: scorri verso il basso dalla cima della pagina per aggiornare l'app e scaricare nuove versioni
- Controllo automatico aggiornamenti Service Worker ogni minuto
- Cancellazione cache automatica durante il refresh

---

## [1.3.0] - 2025-12-07

### Corretto
- Bug nel calcolo della prossima pulizia: quando una sola toilette era stata pulita, la data mostrata era errata (oggi invece di 15 giorni dopo)

---

## [1.2.0] - 2025-12-07

### Aggiunto
- **Date picker nella conferma pulizia**: ora è possibile selezionare la data quando si registra una pulizia (utile per registrazioni retroattive)
- **Modifica data nello storico**: toccando una voce nello storico si apre un modal per modificare la data
- Hint "Tocca per modificare" sotto ogni voce dello storico

### Modificato
- Le voci dello storico ora sono cliccabili
- Migliorata l'interazione touch sulle voci dello storico

---

## [1.1.0] - 2025-12-07

### Corretto
- Problema touch sui pulsanti della barra di navigazione su iPhone
- Area touch dei pulsanti troppo piccola su dispositivi iOS

### Modificato
- Aumentata l'area touch dei pulsanti navigazione (padding 14px × 28px, min 80px × 56px)
- Aggiunto `touch-action: manipulation` per disabilitare double-tap zoom
- Implementati event listener `touchend` dedicati per iOS
- Migliorata gestione safe area per iPhone

---

## [1.0.0] - 2025-12-07

### Aggiunto
- Prima release dell'app
- Dashboard con stato delle 2 toilette (Bagno Grande e Bagno Piccolo)
- Barra di progresso per ogni toilette
- Alert "Prossima pulizia" con calcolo automatico
- Pulsante "Segna come pulita" per ogni toilette
- Storico pulizie con possibilità di eliminazione
- Tema automatico (chiaro/scuro) basato su preferenze sistema
- Supporto notifiche (giorno prima e giorno stesso)
- Funzionalità offline tramite Service Worker
- Installabile come PWA su Android e iOS
- Dati iniziali: Bagno Grande pulito il 29/11/2025

### Caratteristiche tecniche
- Single-file HTML con CSS e JS inline
- LocalStorage per persistenza dati
- Service Worker per cache e offline
- Manifest.json per installazione PWA
- Icone in varie dimensioni per tutti i dispositivi
