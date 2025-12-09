// =========================
// TOILETS MODULE
// =========================

// Actions State
let currentToilet = null;
let currentEditId = null;

function updateToiletCards() {
    ['grande', 'piccolo'].forEach(toilet => {
        const lastClean = appData.toilets[toilet].lastClean;
        const lastCleanEl = document.getElementById(`${toilet}LastClean`);
        const statusEl = document.getElementById(`${toilet}Status`);
        const progressEl = document.getElementById(`${toilet}Progress`);

        if (lastClean) {
            const date = new Date(lastClean);
            lastCleanEl.classList.remove('skeleton', 'skeleton-text');
            lastCleanEl.style.width = '';
            lastCleanEl.textContent = formatDate(date);

            const daysSince = getDaysSince(date);
            const progress = Math.min((daysSince / CLEANING_INTERVAL) * 100, 100);

            progressEl.style.width = `${progress}%`;

            if (daysSince >= CLEANING_INTERVAL) {
                statusEl.className = 'status-badge urgent';
                statusEl.innerHTML = '<span>⚠️</span> Da pulire!';
                progressEl.className = 'progress-fill urgent';
            } else if (daysSince >= CLEANING_INTERVAL - 3) {
                statusEl.className = 'status-badge warning';
                statusEl.innerHTML = '<span>⏰</span> Quasi';
                progressEl.className = 'progress-fill warning';
            } else {
                statusEl.className = 'status-badge ok';
                statusEl.innerHTML = '<span>✓</span> Pulita';
                progressEl.className = 'progress-fill ok';
            }
        } else {
            lastCleanEl.classList.remove('skeleton', 'skeleton-text');
            lastCleanEl.style.width = '';
            lastCleanEl.textContent = 'Mai pulita';
            statusEl.className = 'status-badge urgent';
            statusEl.innerHTML = '<span>⚠️</span> Da pulire!';
            progressEl.style.width = '100%';
            progressEl.className = 'progress-fill urgent';
        }
    });
}

function updateNextAlert() {
    // Find which toilet needs cleaning next
    const grandeDate = appData.toilets.grande.lastClean ? new Date(appData.toilets.grande.lastClean) : null;
    const piccoloDate = appData.toilets.piccolo.lastClean ? new Date(appData.toilets.piccolo.lastClean) : null;

    let nextToilet, nextCleanDate;

    if (!grandeDate && !piccoloDate) {
        // Nessuna pulizia registrata - pulisci oggi
        nextToilet = 'grande';
        nextCleanDate = new Date();
    } else if (!grandeDate && piccoloDate) {
        // Solo Piccolo è stato pulito - Grande va pulito 15 giorni dopo Piccolo
        nextToilet = 'grande';
        nextCleanDate = new Date(piccoloDate);
        nextCleanDate.setDate(nextCleanDate.getDate() + CLEANING_INTERVAL);
    } else if (grandeDate && !piccoloDate) {
        // Solo Grande è stato pulito - Piccolo va pulito 15 giorni dopo Grande
        nextToilet = 'piccolo';
        nextCleanDate = new Date(grandeDate);
        nextCleanDate.setDate(nextCleanDate.getDate() + CLEANING_INTERVAL);
    } else {
        // Entrambi sono stati puliti - calcola quale scade prima
        const grandeNext = new Date(grandeDate);
        grandeNext.setDate(grandeNext.getDate() + CLEANING_INTERVAL);
        const piccoloNext = new Date(piccoloDate);
        piccoloNext.setDate(piccoloNext.getDate() + CLEANING_INTERVAL);

        if (grandeNext <= piccoloNext) {
            nextToilet = 'grande';
            nextCleanDate = grandeNext;
        } else {
            nextToilet = 'piccolo';
            nextCleanDate = piccoloNext;
        }
    }

    const toiletName = nextToilet === 'grande' ? 'Bagno Grande' : 'Bagno Piccolo';
    document.getElementById('nextToilet').textContent = toiletName;
    document.getElementById('nextDate').textContent = formatDate(nextCleanDate);

    const daysUntil = getDaysUntil(nextCleanDate);
    let daysText;
    if (daysUntil < 0) {
        daysText = `${Math.abs(daysUntil)} giorni fa!`;
    } else if (daysUntil === 0) {
        daysText = 'Oggi!';
    } else if (daysUntil === 1) {
        daysText = 'Domani';
    } else {
        daysText = `tra ${daysUntil} giorni`;
    }
    document.getElementById('nextDays').textContent = daysText;

    // Schedule notification
    if (appData.settings.notifications) {
        scheduleNotification(toiletName, nextCleanDate);
    }
}

function updateHistory() {
    const historyList = document.getElementById('historyList');

    if (appData.history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <div class="empty-history-icon">📝</div>
                <p>Nessuna pulizia registrata</p>
            </div>
        `;
        return;
    }

    // Sort by date descending
    const sorted = [...appData.history].sort((a, b) => new Date(b.date) - new Date(a.date));

    historyList.innerHTML = sorted.map(item => {
        const toiletName = item.toilet === 'grande' ? 'Bagno Grande' : 'Bagno Piccolo';
        const date = new Date(item.date);
        return `
            <div class="history-item" data-id="${item.id}" onclick="showEditModal('${item.id}')">
                <div class="history-icon ${item.toilet}">🪣</div>
                <div class="history-details">
                    <div class="history-title">${toiletName}</div>
                    <div class="history-date">${formatDateFull(date)}</div>
                    <div class="history-edit-hint">Tocca per modificare</div>
                </div>
                <button class="history-delete" onclick="event.stopPropagation(); deleteHistoryItem('${item.id}')">🗑️</button>
            </div>
        `;
    }).join('');

    // Add Swipe Listeners
    document.querySelectorAll('.history-item').forEach(item => {
        addSwipeAction(item, () => {
            const id = item.getAttribute('data-id');
            deleteHistoryItem(id);
        });
    });
}

function showConfirmModal(toilet) {
    currentToilet = toilet;
    const toiletName = toilet === 'grande' ? 'Bagno Grande' : 'Bagno Piccolo';
    document.getElementById('modalText').textContent = `Hai pulito la toilette del ${toiletName}?`;

    // Imposta la data di oggi come default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('cleaningDate').value = today;

    document.getElementById('confirmModal').classList.add('active');
    document.getElementById('confirmBtn').onclick = () => confirmClean(toilet);
}

// function closeModal() removed - usage updated to use global


function showEditModal(id) {
    // Normalize ID to string for comparison, but keep original for saving if needed (though we use currentEditId)
    // Actually, appData.history ids might be numbers. 
    // Let's find using loose comparison or string conversion
    const item = appData.history.find(h => String(h.id) === String(id));
    if (!item) return;

    currentEditId = item.id; // Store the actual ID (number or string)
    const toiletName = item.toilet === 'grande' ? 'Bagno Grande' : 'Bagno Piccolo';
    document.getElementById('editModalText').textContent = `Modifica la data di pulizia del ${toiletName}`;
    document.getElementById('editDate').value = item.date;

    document.getElementById('editModal').classList.add('active');
    document.getElementById('editConfirmBtn').onclick = () => confirmEdit();
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    currentEditId = null;
}

function confirmEdit() {
    const newDate = document.getElementById('editDate').value;
    if (!newDate || !currentEditId) return;

    const item = appData.history.find(h => h.id === currentEditId);
    if (!item) return;

    // Aggiorna la data nello storico
    item.date = newDate;

    // Aggiorna l'ultima pulizia se necessario
    const toiletHistory = appData.history
        .filter(h => h.toilet === item.toilet)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (toiletHistory.length > 0) {
        appData.toilets[item.toilet].lastClean = toiletHistory[0].date;
    }

    saveData();
    updateUI();
    closeEditModal();
    showToast('Data modificata! ✏️');
}

function confirmClean(toilet) {
    const selectedDate = document.getElementById('cleaningDate').value;
    const cleanDate = selectedDate || new Date().toISOString().split('T')[0];

    // 1. Prevent Duplicates
    const alreadyExists = appData.history.some(h =>
        h.toilet === toilet && h.date === cleanDate
    );

    if (alreadyExists) {
        showToast('Pulizia già registrata per questa data! ⚠️');
        closeModal();
        return;
    }

    // 2. Add to History
    appData.history.push({
        id: Date.now(),
        toilet: toilet,
        date: cleanDate
    });

    // 3. Recalculate Last Clean (Max Date)
    // Don't just set it to cleanDate, because we might be adding an old date
    const toiletHistory = appData.history
        .filter(h => h.toilet === toilet);

    if (toiletHistory.length > 0) {
        // Find max date
        const latestInfo = toiletHistory.reduce((latest, current) => {
            return new Date(current.date) > new Date(latest.date) ? current : latest;
        });
        appData.toilets[toilet].lastClean = latestInfo.date;
    } else {
        appData.toilets[toilet].lastClean = cleanDate;
    }

    try {
        saveData(); // Sync might be async, but we don't await result for UI close
        updateUI();
    } catch (e) {
        console.error('Save/Update Error:', e);
    }

    // Always close modal
    closeModal('confirmModal');
    showToast('Pulizia registrata! 🎉');
}

function deleteHistoryItem(id) {
    const item = appData.history.find(h => String(h.id) === String(id));
    if (!item) return;

    // Use the actual ID found
    const targetId = item.id;

    // Check if this is the most recent clean for that toilet
    const toiletHistory = appData.history
        .filter(h => h.toilet === item.toilet)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    appData.history = appData.history.filter(h => h.id !== targetId);

    // UNCONDITIONALLY Recalculate Last Clean (Max Date)
    // ensuring true consistency even if data was previously desynced
    const remainingHistory = appData.history.filter(h => h.toilet === item.toilet);

    if (remainingHistory.length > 0) {
        const latestInfo = remainingHistory.reduce((latest, current) => {
            return new Date(current.date) > new Date(latest.date) ? current : latest;
        });
        appData.toilets[item.toilet].lastClean = latestInfo.date;
    } else {
        appData.toilets[item.toilet].lastClean = null;
    }

    saveData();
    updateUI();
    showToast('Voce eliminata');
}
