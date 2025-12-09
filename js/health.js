// =========================
// HEALTH & VET MODULE
// =========================

let currentCatId = null; // 'minou' or 'matisse'

function updateHealthUI() {
    updateCatCards();
    updateHealthTimeline();
}

function updateCatCards() {
    ['minou', 'matisse'].forEach(catId => {
        const cat = appData.cats[catId];
        const card = document.querySelector(`.cat-profile-card.${catId}`);
        if (!card) return;

        // Update basic info
        card.querySelector('.cat-weight').textContent = cat.weight ? `${cat.weight} kg` : '-- kg';

        // Find next deadline for this cat
        const nextEvent = getNextEventForCat(catId);
        const badge = card.querySelector('.next-event-badge');

        if (nextEvent) {
            const days = getDaysUntil(nextEvent.nextDueDate);
            badge.textContent = `${getEventTypeLabel(nextEvent.type)}: ${days === 0 ? 'Oggi' : days + 'gg'}`;
            badge.className = 'next-event-badge ' + (days < 7 ? 'urgent' : 'upcoming');
        } else {
            badge.textContent = 'Nessuna scadenza';
            badge.className = 'next-event-badge';
        }
    });
}

function getNextEventForCat(catId) {
    if (!appData.healthEvents) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Filtra eventi futuri con nextDueDate
    const futureEvents = appData.healthEvents
        .filter(e => e.catId === catId && e.nextDueDate && new Date(e.nextDueDate) >= now)
        .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));

    return futureEvents.length > 0 ? futureEvents[0] : null;
}

function updateHealthTimeline() {
    const container = document.getElementById('healthTimeline');
    if (!appData.healthEvents || appData.healthEvents.length === 0) {
        container.innerHTML = '<p class="empty-state" style="text-align: center; color: var(--text-muted); padding: 20px;">Nessun evento registrato</p>';
        return;
    }

    // Sort events by date descending
    const sortedEvents = [...appData.healthEvents].sort((a, b) => {
        // Usa data evento o scadenza futura se presente
        const dateA = a.date ? new Date(a.date) : new Date();
        const dateB = b.date ? new Date(b.date) : new Date();
        return dateB - dateA;
    });

    container.innerHTML = sortedEvents.map(evt => {
        const catName = appData.cats[evt.catId].name;
        const icon = getEventIcon(evt.type);
        const dateDisplay = new Date(evt.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

        return `
            <div class="timeline-item ${evt.type}" onclick="editHealthEvent(${evt.id})" style="cursor: pointer;">
                <div class="timeline-icon">${icon}</div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="cat-tag ${evt.catId}">${catName}</span>
                        <span class="timeline-date">${dateDisplay}</span>
                    </div>
                    <h4>${getEventTypeLabel(evt.type)} ${evt.note ? '- ' + evt.note : ''}</h4>
                    ${evt.cost ? `<p class="timeline-cost">Prezzo: €${evt.cost}</p>` : ''}
                    ${evt.nextDueDate ? `<p style="font-size: 0.8rem; color: var(--warning); margin-top: 4px;">📅 Scadenza: ${new Date(evt.nextDueDate).toLocaleDateString()}</p>` : ''}
                    <div style="font-size: 0.7rem; color: var(--text-muted); text-align: right; margin-top: 5px;">Tocca per modificare ✏️</div>
                </div>
            </div>
        `;
    }).join('');
}

// === Profile Management ===

function showCatProfile(catId) {
    currentCatId = catId;
    const cat = appData.cats[catId];

    document.getElementById('catProfileTitle').textContent = `Profilo ${cat.name} `;
    document.getElementById('catWeight').value = cat.weight || 4.0;
    document.getElementById('catBirthDate').value = cat.birthDate || '';
    document.getElementById('catChip').value = cat.chip || '';

    // Style adjustments
    const icon = document.getElementById('catProfileIcon');
    if (catId === 'minou') {
        icon.style.backgroundColor = '#fef3c7'; // Amber for Minou
    } else {
        icon.style.backgroundColor = '#dbeafe'; // Blue for Matisse
    }

    showModal('catProfileModal');
}

function adjustWeight(delta) {
    const input = document.getElementById('catWeight');
    let val = parseFloat(input.value) || 4.0;
    val = Math.max(0.1, val + delta);
    input.value = val.toFixed(1);
}

function saveCatProfile() {
    if (!currentCatId) return;

    const weight = parseFloat(document.getElementById('catWeight').value);
    const birthDate = document.getElementById('catBirthDate').value;
    const chip = document.getElementById('catChip').value;

    appData.cats[currentCatId].weight = weight;
    appData.cats[currentCatId].birthDate = birthDate;
    appData.cats[currentCatId].chip = chip;

    saveData(); // Save and sync
    updateCatCards();
    closeModal('catProfileModal');
}

// === Utility ===

function getEventIcon(type) {
    const icons = {
        'vaccine': '💉',
        'vet': '👨‍⚕️',
        'meds': '💊',
        'weight': '⚖️',
        'note': '📝'
    };
    return icons[type] || '📝';
}

function getEventTypeLabel(type) {
    const labels = {
        'vaccine': 'Vaccino',
        'vet': 'Visita Veterinaria',
        'meds': 'Antiparassitario',
        'weight': 'Misurazione Peso',
        'note': 'Nota'
    };
    return labels[type] || 'Evento';
}

// getDaysUntil is now imported from app.js


// === Health Event Management ===

// function showAddHealthEvent() { ... } // Duplicate removed, using the one at line 265


function selectEventCat(catId) {
    currentCatId = catId;

    // Update visual selection
    document.querySelectorAll('.cat-select-btn').forEach(btn => {
        btn.classList.remove('active');
        // Fix: Removed trailing space in ID selector
        if (btn.id === `eventCat${catId.charAt(0).toUpperCase() + catId.slice(1)}`) {
            btn.classList.add('active');
        }
    });
}



function editHealthEvent(id) {
    const event = appData.healthEvents.find(e => e.id === id);
    if (!event) {
        console.warn('Evento non trovato:', id);
        showToast('Evento non trovato');
        return;
    }

    // Populate fields
    document.getElementById('eventId').value = event.id;
    document.getElementById('eventType').value = event.type;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventNote').value = event.note || '';
    document.getElementById('eventCost').value = event.cost || '';
    document.getElementById('eventNextDate').value = event.nextDueDate || '';

    // Select Cat
    selectEventCat(event.catId);

    // Disable "Both" option when editing specific event
    const btnBoth = document.getElementById('eventCatBoth');
    if (btnBoth) btnBoth.style.display = 'none';

    // Show delete button
    const btnDelete = document.getElementById('btnDeleteHealthEvent');
    if (btnDelete) btnDelete.style.display = 'block';

    showModal('healthEventModal');
}

function deleteHealthEvent() {
    const btn = document.getElementById('btnDeleteHealthEvent');

    if (btn.dataset.confirm === 'true') {
        // Second click: Perform delete
        const id = document.getElementById('eventId').value;
        if (!id) return;

        appData.healthEvents = appData.healthEvents.filter(e => e.id !== parseInt(id));
        saveData();
        updateHealthUI();
        closeModal('healthEventModal');

        // Reset button for next time
        btn.innerText = 'Elimina';
        btn.dataset.confirm = 'false';
        btn.classList.remove('confirm-danger');
    } else {
        // First click: Ask for confirmation
        btn.innerText = 'Conferma?';
        btn.dataset.confirm = 'true';
        btn.classList.add('confirm-danger');

        // Reset after 3 seconds
        setTimeout(() => {
            if (document.getElementById('healthEventModal').classList.contains('active')) {
                btn.innerText = 'Elimina';
                btn.dataset.confirm = 'false';
                btn.classList.remove('confirm-danger');
            }
        }, 3000);
    }
}

function showAddHealthEvent() {
    // Reset modal fields
    document.getElementById('eventId').value = ''; // Clear ID for new event
    document.getElementById('eventType').value = 'vaccine';
    document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('eventNote').value = '';
    document.getElementById('eventCost').value = '';
    document.getElementById('eventNextDate').value = '';

    // Default cat: minou (or last one) - Default to Minou for now
    selectEventCat('minou');

    // Show Check Both option
    const btnBoth = document.getElementById('eventCatBoth');
    if (btnBoth) btnBoth.style.display = 'inline-block';

    // Hide delete button for new event
    const btnDelete = document.getElementById('btnDeleteHealthEvent');
    if (btnDelete) btnDelete.style.display = 'none';

    showModal('healthEventModal');
}

function saveHealthEvent() {
    try {
        if (!currentCatId) {
            alert('Errore: Nessun gatto selezionato');
            return;
        }

        const id = document.getElementById('eventId').value;
        const type = document.getElementById('eventType').value;
        const date = document.getElementById('eventDate').value;
        const note = document.getElementById('eventNote').value;
        const costInput = document.getElementById('eventCost').value;
        const cost = costInput ? parseFloat(costInput) : 0;
        const nextDueDate = document.getElementById('eventNextDate').value;

        if (!date) {
            alert('Inserisci almeno la data');
            return;
        }

        if (!appData.healthEvents) {
            appData.healthEvents = [];
        }

        // Handle "Both" selection (Create 2 events)
        if (currentCatId === 'both' && !id) {
            // Event for Minou
            const eventMinou = {
                id: Date.now(),
                catId: 'minou',
                type: type,
                date: date,
                note: note,
                cost: cost > 0 ? (Math.round(cost * 100) / 100) : null,
                nextDueDate: nextDueDate || null
            };
            appData.healthEvents.push(eventMinou);

            // Event for Matisse (slight delay for unique ID)
            const eventMatisse = {
                id: Date.now() + 1,
                catId: 'matisse',
                type: type,
                date: date,
                note: note,
                cost: cost > 0 ? (Math.round(cost * 100) / 100) : null,
                nextDueDate: nextDueDate || null
            };
            appData.healthEvents.push(eventMatisse);

        } else {
            // Single event (New or Edit)
            const eventData = {
                id: id ? parseInt(id) : Date.now(),
                catId: currentCatId,
                type: type,
                date: date,
                note: note,
                cost: cost > 0 ? (Math.round(cost * 100) / 100) : null,
                nextDueDate: nextDueDate || null
            };

            if (id) {
                // Update existing
                const index = appData.healthEvents.findIndex(e => e.id === parseInt(id));
                if (index !== -1) {
                    appData.healthEvents[index] = eventData;
                }
            } else {
                // Create new
                appData.healthEvents.push(eventData);
            }
        }

        saveData(); // Save and sync
        updateHealthUI();
        closeModal('healthEventModal');
    } catch (e) {
        console.error('Errore durante il salvataggio:', e);
        alert('Si è verificato un errore durante il salvataggio: ' + e.message);
    }
}
