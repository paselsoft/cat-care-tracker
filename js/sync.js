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
        syncNowBtn.style.display = 'none';
        lastSyncEl.textContent = 'Mai';
        return;
    }

    statusDot.className = 'sync-dot online';
    statusText.textContent = 'Connesso';
    configBtn.textContent = '⚙️ Modifica';
    syncNowBtn.style.display = 'inline-block';
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
        const localMap = new Map(local.history.map(item => [String(item.id), item]));
        const lastSync = localStorage.getItem('lastSyncTime');
        const lastSyncTime = lastSync ? new Date(lastSync).getTime() : 0;

        remote.history.forEach(item => {
            const itemIdStr = String(item.id);
            const itemTime = parseInt(item.id); // ID is timestamp

            if (!localMap.has(itemIdStr)) {
                // HEURISTIC: check creation time vs last sync
                if (itemTime > lastSyncTime || lastSyncTime === 0) {
                    localMap.set(item.id, item);
                }
            } else {
                // Overwrite with remote (optional, assumes remote is newer/better)
                localMap.set(item.id, item);
            }
        });
        // Converti map in array e ordina per data decrescente
        merged.history = Array.from(localMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 3. Merge Food (Union by Product ID/Name)
    if (remote.food && remote.food.products) {
        const mergedProducts = [...local.food.products];
        const localProdMap = new Map(mergedProducts.map(p => [String(p.id), p]));
        const lastSync = localStorage.getItem('lastSyncTime');
        const lastSyncTime = lastSync ? new Date(lastSync).getTime() : 0;

        remote.food.products.forEach(remoteProd => {
            const prodIdStr = String(remoteProd.id);
            const prodTime = parseInt(remoteProd.id);

            if (localProdMap.has(prodIdStr)) {
                // Il prodotto esiste in entrambi. 
                // Strategia semplice: sovrascrivi con remoto per mantenere consistenza, 
                const localProd = localProdMap.get(prodIdStr);
                Object.assign(localProd, remoteProd);
            } else {
                // Nuovo prodotto dal remoto
                // HEURISTIC: Aggiungi solo se è più recente dell'ultimo sync (quindi creato altrove dopo il nostro sync)
                // oppure se non abbiamo mai sincronizzato (lastSyncTime == 0)
                if (prodTime > lastSyncTime || lastSyncTime === 0) {
                    mergedProducts.push(remoteProd);
                }
                // Se è vecchio e non lo abbiamo, significa che lo abbiamo cancellato noi. Ignora.
            }
        });

        merged.food = { ...local.food, products: mergedProducts };
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
        const lastSync = localStorage.getItem('lastSyncTime');
        const lastSyncTime = lastSync ? new Date(lastSync).getTime() : 0;

        remote.healthEvents.forEach(evt => {
            const evtIdStr = String(evt.id);
            const evtTime = parseInt(evt.id); // ID is timestamp

            if (!localEvMap.has(evtIdStr)) {
                // Aggiungi evento mancante SOLO se è nuovo (creato altrove) o siamo in "init" (lastSyncTime == 0)
                if (evtTime > lastSyncTime || lastSyncTime === 0) {
                    merged.healthEvents.push(evt);
                }
                // Altrimenti: era un evento vecchio che non abbiamo più -> CANCELLATO localmente. Non ripristinare.
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

            // Verifichiamo solo integrità (opzionale)
            if (!appData.cats) appData.cats = content.cats;
            if (!appData.healthEvents) appData.healthEvents = content.healthEvents;

            saveLocalData();
            updateUI();
            updateFoodUI();
            if (typeof updateHealthUI === 'function') updateHealthUI();

            localStorage.setItem('lastSyncTime', new Date().toISOString());
            updateSyncUI();

            statusDot.className = 'sync-dot online';
            return true;
        } else {
            console.error('Sync error:', response.status);
            statusDot.className = 'sync-dot error';
            return false;
        }
    } catch (error) {
        console.error('Sync error:', error);
        statusDot.className = 'sync-dot error';
        return false;
    } finally {
        isSyncing = false;
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
            // Add timestamp to prevent caching without using Cache-Control header (which triggers CORS preflight issues on file://)
            const getResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}?t=${Date.now()}`, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
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
            cats: appData.cats,
            healthEvents: appData.healthEvents,
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
            return true;
        } else {
            const error = await response.json();
            console.error('Push error:', error);

            // Se errore è "Conflict" (409), dovremmo riprovare il ciclo GET -> MERGE -> PUSH
            if (response.status === 409) {
                console.log('Conflict detected, retrying sync...');
                // Simple exponential backoff or retry once could be implemented here
                // For now, just show error and let user try again
                showToast('Conflitto rilevato. Riprova tra poco.');
            }

            statusDot.className = 'sync-dot error';
            return false;
        }
    } catch (error) {
        console.error('Push error:', error);
        statusDot.className = 'sync-dot error';
        return false;
    } finally {
        isSyncing = false;
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
