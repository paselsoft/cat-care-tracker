// =========================
// GITHUB SYNC MODULE
// =========================

// GitHub Token Management
function loadGitHubToken() {
    githubToken = localStorage.getItem('githubToken');
}

function saveGitHubToken(token) {
    githubToken = token;
    localStorage.setItem('githubToken', token);
}

function showSyncConfigModal() {
    document.getElementById('githubToken').value = githubToken || '';
    document.getElementById('syncConfigModal').classList.add('active');
}

function closeSyncConfigModal() {
    document.getElementById('syncConfigModal').classList.remove('active');
}

async function saveSyncConfig() {
    const token = document.getElementById('githubToken').value.trim();
    if (!token) {
        showToast('Inserisci un token valido');
        return;
    }

    saveGitHubToken(token);
    closeSyncConfigModal();
    updateSyncUI();

    // Prova a sincronizzare
    const success = await syncFromGitHub();
    if (success) {
        showToast('Configurazione salvata! ✅');
    }
}

function updateSyncUI() {
    const statusDot = document.querySelector('.sync-dot');
    const statusText = document.getElementById('syncStatusText');
    const configBtn = document.getElementById('syncConfigBtn');
    const syncNowBtn = document.getElementById('syncNowBtn');
    const lastSyncEl = document.getElementById('lastSyncTime');

    if (!githubToken) {
        statusDot.className = 'sync-dot offline';
        statusText.textContent = 'Non configurato';
        configBtn.textContent = '⚙️ Configura';
        syncNowBtn.disabled = true;
        lastSyncEl.textContent = 'Mai';
        return;
    }

    statusDot.className = 'sync-dot online';
    statusText.textContent = 'Connesso';
    configBtn.textContent = '⚙️ Modifica';
    syncNowBtn.disabled = false;

    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
        const date = new Date(lastSync);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / 60000);

        if (diffMinutes < 1) lastSyncEl.textContent = 'Ora';
        else if (diffMinutes < 60) lastSyncEl.textContent = `${diffMinutes} min fa`;
        else lastSyncEl.textContent = date.toLocaleString('it-IT');
    }
}

// =========================
// SMART SYNC LOGIC
// =========================

function mergeData(local, remote) {
    const merged = { ...local };

    // 1. Merge Toilets (Keep latest cleaning date)
    if (remote.toilets) {
        merged.toilets = { ...local.toilets };

        // Grande
        const localGrande = local.toilets.grande?.lastClean;
        const remoteGrande = remote.toilets.grande?.lastClean;
        if (!localGrande || (remoteGrande && new Date(remoteGrande) > new Date(localGrande))) {
            merged.toilets.grande = remote.toilets.grande;
        }

        // Piccolo
        const localPiccolo = local.toilets.piccolo?.lastClean;
        const remotePiccolo = remote.toilets.piccolo?.lastClean;
        if (!localPiccolo || (remotePiccolo && new Date(remotePiccolo) > new Date(localPiccolo))) {
            merged.toilets.piccolo = remote.toilets.piccolo;
        }
    }

    // 2. Merge History (Union by ID)
    if (remote.history && Array.isArray(remote.history)) {
        const localMap = new Map(local.history.map(item => [item.id, item]));
        remote.history.forEach(item => {
            // Se l'item remoto non esiste o è diverso (opzionale: logica conflitto), lo aggiungiamo/sovrascriviamo
            // Qui assumiamo che l'ID sia univoco (timestamp). 
            // Se esiste già, usiamo quello con la data 'lastUpdated' più recente se esistesse, 
            // ma per semplicità facciamo "union": se manca aggiungi.
            if (!localMap.has(item.id)) {
                localMap.set(item.id, item);
            }
        });
        // Converti map in array e ordina per data decrescente
        merged.history = Array.from(localMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 3. Merge Food (Union by Product ID/Name)
    if (remote.food && remote.food.products) {
        const mergedProducts = [...local.food.products];
        // Crea una mappa dei prodotti locali per ricerca veloce
        const localProdMap = new Map(mergedProducts.map(p => [p.id, p]));

        remote.food.products.forEach(remoteProd => {
            if (localProdMap.has(remoteProd.id)) {
                // Il prodotto esiste in entrambi. 
                // Strategia semplice: se il remoto è più recente (basato su un ipotetico timestamp) o diverso, bisognerebbe scegliere.
                // Per ora: Remote Wins sulla quantità per evitare che modifiche vecchie locali sovrascrivano i dati nuovi
                // MA preserviamo modifiche locali se non c'è conflitto palese. 
                // Soluzione pratica: sovrascrivi con remoto per mantenere consistenza, 
                // l'utente locale dovrà ri-aggiornare se aveva cambiato proprio quello.

                // Miglioramento: Sommare le differenze sarebbe ideale ma rischioso senza un log delle transazioni.
                // "Remote Wins" sulle proprietà è più sicuro per coerenza globale.
                const localProd = localProdMap.get(remoteProd.id);
                Object.assign(localProd, remoteProd);
            } else {
                // Nuovo prodotto dal remoto
                mergedProducts.push(remoteProd);
            }
        });

        merged.food = { ...local.food, products: mergedProducts };
        // Aggiorna anche lastUpdated prendendo il più recente
        const localTime = local.food.lastUpdated ? new Date(local.food.lastUpdated).getTime() : 0;
        const remoteTime = remote.food.lastUpdated ? new Date(remote.food.lastUpdated).getTime() : 0;
        merged.food.lastUpdated = (remoteTime > localTime) ? remote.food.lastUpdated : local.food.lastUpdated;
    }

    // 4. Merge Cats (Remote wins properties, but preserve local changes if no conflict)
    if (remote.cats) {
        if (!merged.cats) merged.cats = { ...local.cats }; // Init if missing

        ['minou', 'matisse'].forEach(catKey => {
            const localCat = merged.cats[catKey];
            const remoteCat = remote.cats[catKey];

            if (remoteCat) {
                // Semplice merge object: remote sovrascrive properties in conflitto
                // Ideale: timestamp modifica profilo
                Object.assign(localCat, remoteCat);
            }
        });
    }

    // 5. Merge Health Events (Union by ID)
    if (remote.healthEvents && Array.isArray(remote.healthEvents)) {
        if (!merged.healthEvents) merged.healthEvents = [];
        // Use String IDs for map to handle potential type mismatches (number vs string)
        const localEvMap = new Map(merged.healthEvents.map(e => [String(e.id), e]));

        remote.healthEvents.forEach(evt => {
            const evtIdStr = String(evt.id);
            if (!localEvMap.has(evtIdStr)) {
                // Aggiungi evento mancante
                merged.healthEvents.push(evt);
            } else {
                // Evento esistente: remote wins per aggiornamenti
                Object.assign(localEvMap.get(evtIdStr), evt);
            }
        });

        // Ordina per data evento decrescente
        merged.healthEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 6. Merge Settings (Remote wins for shared config)
    if (remote.settings) {
        // Sync dayBefore ma non notifiche (che richiedono permessi locali)
        if (remote.settings.dayBefore !== undefined) {
            merged.settings.dayBefore = remote.settings.dayBefore;
        }
    }

    return merged;
}

async function syncFromGitHub() {
    if (!githubToken || isSyncing) return false;

    isSyncing = true;
    const statusDot = document.querySelector('.sync-dot');
    statusDot.className = 'sync-dot syncing';

    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const content = JSON.parse(atob(data.content));

            // Salva SHA per prossime push
            localStorage.setItem('githubFileSha', data.sha);

            // SMART MERGE
            console.log('Merging remote data...');
            appData = mergeData(appData, content);

            // Aggiorna app data
            // Nota: mergeData ha già fatto il grosso, ma qui ci assicuriamo che struttura sia completa
            // In realtà con appData = mergeData(...) fatto sopra, questo blocco if/if serviva solo nella versione vecchia.
            // Ora appData è già l'oggetto mergiato completo.
            // Possiamo rimuovere i vecchi if singoli se ci fidiamo del mergeData, 
            // ma per sicurezza lasciamo sync.js pulito:
            // appData = mergeData(appData, content); <--- questo è già fatto sopra nel codice

            // Verifichiamo solo integrità (opzionale)
            if (!appData.cats) appData.cats = content.cats;
            if (!appData.healthEvents) appData.healthEvents = content.healthEvents;

            saveLocalData();
            updateUI();
            updateFoodUI();
            // TODO: updateHealthUI(); <-- Da implementare

            localStorage.setItem('lastSyncTime', new Date().toISOString());
            updateSyncUI();

            statusDot.className = 'sync-dot online';
            isSyncing = false;
            return true;
        } else {
            console.error('Sync error:', response.status);
            statusDot.className = 'sync-dot error';
            isSyncing = false;
            return false;
        }
    } catch (error) {
        console.error('Sync error:', error);
        statusDot.className = 'sync-dot error';
        isSyncing = false;
        return false;
    }
}

async function syncToGitHub() {
    if (!githubToken || isSyncing) return false;

    isSyncing = true;
    const statusDot = document.querySelector('.sync-dot');
    statusDot.className = 'sync-dot syncing';

    try {
        // 1. GET latest remote data first (to avoid overwriting others' changes)
        let latestSha = localStorage.getItem('githubFileSha');
        let remoteContent = null;

        try {
            const getResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Cache-Control': 'no-cache' // Ensure we get fresh data
                }
            });

            if (getResponse.ok) {
                const getData = await getResponse.json();
                latestSha = getData.sha;
                remoteContent = JSON.parse(atob(getData.content));
                localStorage.setItem('githubFileSha', latestSha);
            }
        } catch (e) {
            console.warn('Could not fetch latest data before push:', e);
        }

        // 2. MERGE local with latest remote (if available)
        if (remoteContent) {
            appData = mergeData(appData, remoteContent);
            saveLocalData(); // Save merged state locally immediately
            updateUI();      // Refresh UI with merged data
            updateFoodUI();
        }

        // 3. PREPARE data to save
        const dataToSave = {
            toilets: appData.toilets,
            history: appData.history,
            food: appData.food,
            settings: appData.settings, // Includiamo settings nel backup
            lastUpdated: new Date().toISOString()
        };

        const body = {
            message: `Sync data - ${new Date().toLocaleDateString('it-IT')} (Smart Merge)`,
            content: btoa(JSON.stringify(dataToSave, null, 2)),
            branch: 'main'
        };

        if (latestSha) body.sha = latestSha;

        // 4. PUSH merged data
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            const result = await response.json();
            localStorage.setItem('githubFileSha', result.content.sha);
            localStorage.setItem('lastSyncTime', new Date().toISOString());
            updateSyncUI();
            statusDot.className = 'sync-dot online';
            isSyncing = false;
            return true;
        } else {
            const error = await response.json();
            console.error('Push error:', error);

            // Se errore è "Conflict" (409), dovremmo riprovare il ciclo GET -> MERGE -> PUSH
            if (response.status === 409) {
                console.log('Conflict detected, retrying sync...');
                isSyncing = false; // Reset flag to allow recursion
                // Simple exponential backoff or retry once could be implemented here
                // For now, just show error and let user try again
                showToast('Conflitto rilevato. Riprova tra poco.');
            }

            statusDot.className = 'sync-dot error';
            isSyncing = false;
            return false;
        }
    } catch (error) {
        console.error('Push error:', error);
        statusDot.className = 'sync-dot error';
        isSyncing = false;
        return false;
    }
}

async function syncNow() {
    showToast('Sincronizzazione in corso...');
    const success = await syncFromGitHub();
    if (success) {
        showToast('Sincronizzazione completata! ✅');
    } else {
        showToast('Errore di sincronizzazione ❌');
    }
}
