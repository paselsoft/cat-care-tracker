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

            // Aggiorna app data
            if (content.toilets) appData.toilets = content.toilets;
            if (content.history) appData.history = content.history;
            if (content.settings) appData.settings = content.settings;
            if (content.food) appData.food = content.food;

            saveLocalData();
            updateUI();
            updateFoodUI();

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
        // Get current SHA
        let sha = localStorage.getItem('githubFileSha');

        if (!sha) {
            try {
                const getResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
                    headers: { 'Authorization': `token ${githubToken}` }
                });
                if (getResponse.ok) {
                    const getData = await getResponse.json();
                    sha = getData.sha;
                    localStorage.setItem('githubFileSha', sha);
                }
            } catch (e) { }
        }

        const dataToSave = {
            toilets: appData.toilets,
            history: appData.history,
            food: appData.food,
            lastUpdated: new Date().toISOString()
        };

        const body = {
            message: `Sync data - ${new Date().toLocaleDateString('it-IT')}, ${new Date().toLocaleTimeString('it-IT')}`,
            content: btoa(JSON.stringify(dataToSave, null, 2)),
            branch: 'main'
        };

        if (sha) body.sha = sha;

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
