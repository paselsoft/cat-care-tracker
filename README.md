# 🐱 Cat Care Tracker

App PWA per tracciare la pulizia delle toilette per gatti.

Creata per **Minou** e **Matisse** 🐱🐱

## 📱 Funzionalità

### Gestione Toilette
- Dashboard con stato delle 2 toilette (Bagno Grande e Bagno Piccolo)
- Barra di progresso che mostra quanto tempo è passato dall'ultima pulizia
- Alert colorato per la prossima pulizia programmata
- Intervallo di pulizia: 15 giorni per toilette

### Registrazione Pulizie
- Pulsante "Segna come pulita" con selezione data
- Storico completo delle pulizie
- Possibilità di modificare la data delle pulizie registrate
- Eliminazione voci dallo storico

### Gestione Cibo 🍽️
- Inventario completo prodotti (scatolette e crocchette)
- Database precaricato (Natural Code, Schesir, Oasy, Life Cat, Farmina)
- Gestione quantità con aggiornamento rapido (+/-)
- Avviso automatico scorte basse (< 15 unità)
- Tracciamento preferenze (Gusti: ❤️ Adorano, 👍 Piace, 😐 Ok, 👎 No)
- Gestione formati (50g, 70g, 85g, 400g)

### Salute & Veterinario 🏥
- **Profili Gatti**: Schede digitali con peso, età e microchip aggiornabili
- **Diario Clinico**: Storico completo di vaccini, visite, antiparassitari e misurazioni peso
- **Gestione Eventi**: Modifica, Cancellazione e Creazione Simultanea ("Entrambe")
- **Scadenze**: Visualizzazione chiara dei prossimi richiami o appuntamenti
- **Monitoraggio Peso**: Grafico dell'andamento del peso (in arrivo)

### Sincronizzazione ☁️
- **Smart Sync**: algoritmo di unione intelligente per uso condiviso (es. più persone stesse credenziali)
- Prevenzione conflitti e perdita dati
- Backup automatico dei dati su GitHub
- Sincronizzazione tra più dispositivi
- Funzionamento offline con sync alla riconnessione

### PWA Features
- Installabile su smartphone (Android e iOS)
- Funziona offline
- Tema automatico (chiaro/scuro) basato sulle impostazioni del dispositivo
- Notifiche promemoria (giorno prima e giorno stesso)
- Pull-to-refresh per aggiornamenti app

## 🚀 Installazione

### Da browser
1. Apri https://paselsoft.github.io/cat-care-tracker/
2. **Android**: tocca "Aggiungi a schermata Home" o menu → "Installa app"
3. **iOS**: tocca icona condivisione → "Aggiungi alla schermata Home"

### Configurazione Sincronizzazione
1. Genera un Personal Access Token su GitHub (scope: `repo` o public_repo`)
2. Inseriscilo nelle Impostazioni dell'app
3. I tuoi dati verranno salvati in un file `data.json` nel tuo repository

### Self-hosting
1. Clona il repository
2. Carica i file su un server con HTTPS
3. Accedi dall'URL del tuo server

## 📁 Struttura File

```
cat-care-tracker/
├── index.html      # App principale
├── manifest.json   # Configurazione PWA
├── sw.js          # Service Worker per offline
├── data.json      # Archivio dati sincronizzati
├── css/           # Fogli di stile
├── js/            # Logica applicativa
├── icons/         # Icone app
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   └── icon-512.png
├── README.md      # Questo file
└── CHANGELOG.md   # Storico modifiche
```

## 🛠️ Tecnologie

- HTML5, CSS3, JavaScript (vanilla)
- PWA (Progressive Web App)
- LocalStorage per persistenza locale
- GitHub API per sincronizzazione cloud
- Service Worker per funzionalità offline
- Google Fonts (Quicksand, Nunito)

## 📋 Roadmap

- [x] Gestione pulizia toilette
- [x] Storico pulizie con modifica data
- [x] Gestione cibo (scatolette e crocchette)
- [x] Inventario scorte
- [x] Avvisi scorte basse
- [x] Sezione Salute e Diario Veterinario
- [ ] Statistiche consumi e grafici peso

## 📄 Licenza

Progetto personale - Paolo @ UMC Siena

---

Made with ❤️ for Minou & Matisse
