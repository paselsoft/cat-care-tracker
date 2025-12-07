# Changelog

Tutte le modifiche importanti al progetto Cat Care Tracker sono documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/).

---

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
