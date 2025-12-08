# 🐱 Cat Care Tracker

App PWA per tracciare la pulizia delle toilette per gatti.

Creata per **Minou** e **Matisse** 🐱🐱

## 📱 Funzionalità

### Gestione Toilette
- Dashboard con stato delle 2 toilette (Bagno Grande e Bagno Piccolo)
- Barra di progresso che mostra quanto tempo è passato dall'ultima pulizia
- Alert colorato per la prossima pulizia programmata
- Intervallo di pulizia: 15 giorni per toilette

### Gestione Cibo 🍽️
- Inventario scatolette e crocchette
- Gestione quantità con pulsanti +/-
- Avviso scorte basse (sotto 15 scatolette)
- Preferenze per ogni gatta (Minou e Matisse)
- Valutazioni prodotti: ❤️ Adorano, 👍 Piace, 😐 Ok, 👎 No

### Registrazione Pulizie
- Pulsante "Segna come pulita" con selezione data
- Storico completo delle pulizie
- Possibilità di modificare la data delle pulizie registrate
- Eliminazione voci dallo storico

### Sincronizzazione
- Sincronizzazione dati con GitHub
- Funziona su tutti i dispositivi
- Configurazione semplice con Personal Access Token

### PWA Features
- Installabile su smartphone (Android e iOS)
- Funziona offline
- Tema automatico (chiaro/scuro) basato sulle impostazioni del dispositivo
- Notifiche promemoria (giorno prima e giorno stesso)
- Pull to refresh per aggiornamenti

## 🚀 Installazione

### Da browser
1. Apri https://paselsoft.github.io/cat-care-tracker/
2. **Android**: tocca "Aggiungi a schermata Home" o menu → "Installa app"
3. **iOS**: tocca icona condivisione → "Aggiungi alla schermata Home"

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
- LocalStorage per persistenza dati
- Service Worker per funzionalità offline
- Google Fonts (Quicksand, Nunito)
- GitHub API per sincronizzazione

## 📋 Roadmap

- [x] Gestione pulizia toilette
- [x] Storico pulizie con modifica data
- [x] Gestione cibo (scatolette e crocchette)
- [x] Inventario scorte
- [x] Avvisi scorte basse
- [x] Sincronizzazione GitHub
- [ ] Statistiche e grafici

## 📄 Licenza

Progetto personale - Paolo @ UMC Siena

---

Made with ❤️ for Minou & Matisse
