// =========================
// MAIN APP MODULE
// =========================

// Constants
const CLEANING_INTERVAL = 15; // days
const LOW_STOCK_THRESHOLD = 15; // scatolette
const GITHUB_REPO = 'paselsoft/cat-care-tracker';
const GITHUB_FILE = 'data.json';

// App State
let appData = {
    toilets: {
        grande: { lastClean: null },
        piccolo: { lastClean: null }
    },
    history: [],
    settings: {
        notifications: false,
        dayBefore: true
    },
    food: {
        products: [],
        lastUpdated: null
    }
};

let githubToken = null;
let isSyncing = false;
let currentProductType = 'scatoletta';
let editingProductId = null;
let currentRating = 'like';
let deferredPrompt;

// =========================
// INITIALIZATION
// =========================

document.addEventListener('DOMContentLoaded', async () => {
    loadLocalData();
    loadGitHubToken();
    updateSyncUI();
    updateUI();
    updateFoodUI();
    checkInstallPrompt();
    requestNotificationPermission();
    initNavigation();
    initProductModalListeners();
    initPullToRefresh();

    // Se abbiamo il token, sincronizza all'avvio
    if (githubToken) {
        await syncFromGitHub();
    }
});

// =========================
// DATA MANAGEMENT
// =========================

function loadLocalData() {
    const saved = localStorage.getItem('catCareData');
    if (saved) {
        appData = JSON.parse(saved);
    } else {
        // Initial data: Bagno Grande cleaned on 29/11/2025
        appData.toilets.grande.lastClean = '2025-11-29';
        appData.history.push({
            id: Date.now(),
            toilet: 'grande',
            date: '2025-11-29'
        });
        saveData();
    }

    // Load settings
    document.getElementById('dayBeforeToggle').checked = appData.settings.dayBefore;
    document.getElementById('notificationsToggle').checked = appData.settings.notifications;
}

function saveLocalData() {
    localStorage.setItem('catCareData', JSON.stringify(appData));
}

function saveData() {
    saveLocalData();
    // Sincronizza con GitHub se configurato
    if (githubToken) {
        syncToGitHub();
    }
}

function saveSettings() {
    appData.settings.dayBefore = document.getElementById('dayBeforeToggle').checked;
    saveLocalData();
}

// =========================
// UI UPDATES
// =========================

function updateUI() {
    updateToiletCards();
    updateNextAlert();
    updateHistory();
}

// =========================
// NAVIGATION
// =========================

function switchTab(tab, btn) {
    // Prevent double-tap zoom on iOS
    if (window.lastTap && (Date.now() - window.lastTap) < 300) {
        return;
    }
    window.lastTap = Date.now();

    document.querySelectorAll('.tabs-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    document.getElementById(`tab${tab}`).classList.add('active');
    if (btn) {
        btn.classList.add('active');
    }
}

function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-item');
    navButtons.forEach(btn => {
        const tabName = btn.getAttribute('data-tab');

        // Use touchend for iOS, click for desktop
        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            switchTab(tabName, this);
        }, { passive: false });

        btn.addEventListener('click', function(e) {
            // Only handle click if not a touch device
            if (!('ontouchend' in window)) {
                switchTab(tabName, this);
            }
        });
    });
}

// =========================
// NOTIFICATIONS
// =========================

async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        // Will be requested when user enables notifications
    }
}

async function toggleNotifications() {
    const toggle = document.getElementById('notificationsToggle');

    if (toggle.checked) {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                appData.settings.notifications = true;
                showToast('Notifiche attivate! 🔔');
            } else {
                toggle.checked = false;
                showToast('Permesso negato');
            }
        } else {
            toggle.checked = false;
            showToast('Notifiche non supportate');
        }
    } else {
        appData.settings.notifications = false;
        showToast('Notifiche disattivate');
    }

    saveLocalData();
}

function scheduleNotification(toiletName, date) {
    // For a real PWA, you'd use the Push API with a backend
    // This is a simplified local notification approach
    if ('serviceWorker' in navigator && appData.settings.notifications) {
        const now = new Date();
        const notifDate = new Date(date);

        // Day before notification
        if (appData.settings.dayBefore) {
            const dayBefore = new Date(notifDate);
            dayBefore.setDate(dayBefore.getDate() - 1);
            dayBefore.setHours(9, 0, 0, 0);

            if (dayBefore > now) {
                const delay = dayBefore - now;
                setTimeout(() => {
                    showNotification(`Promemoria: domani pulire ${toiletName}`, 'Non dimenticare la pulizia programmata! 🐱');
                }, delay);
            }
        }

        // Same day notification
        notifDate.setHours(9, 0, 0, 0);
        if (notifDate > now) {
            const delay = notifDate - now;
            setTimeout(() => {
                showNotification(`Oggi: pulire ${toiletName}`, 'È il giorno della pulizia! ✨');
            }, delay);
        }
    }
}

function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'icons/icon-192.png',
            badge: 'icons/icon-192.png',
            tag: 'cat-care-reminder'
        });
    }
}

// =========================
// TOAST
// =========================

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastText').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// =========================
// INSTALL PROMPT
// =========================

function checkInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        if (!localStorage.getItem('installDismissed')) {
            document.getElementById('installPrompt').style.display = 'block';
        }
    });

    document.getElementById('installBtn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                showToast('App installata! 🎉');
            }
            deferredPrompt = null;
            document.getElementById('installPrompt').style.display = 'none';
        }
    });

    document.getElementById('installDismiss').addEventListener('click', () => {
        document.getElementById('installPrompt').style.display = 'none';
        localStorage.setItem('installDismissed', 'true');
    });
}

// =========================
// UTILITY FUNCTIONS
// =========================

function formatDate(date) {
    return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short'
    });
}

function formatDateShort(date) {
    return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short'
    });
}

function formatDateFull(date) {
    return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function getDaysSince(date) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const then = new Date(date);
    then.setHours(0, 0, 0, 0);
    return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function getDaysUntil(date) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const then = new Date(date);
    then.setHours(0, 0, 0, 0);
    return Math.floor((then - now) / (1000 * 60 * 60 * 24));
}

// =========================
// PULL TO REFRESH
// =========================

function initPullToRefresh() {
    const pullIndicator = document.getElementById('pullToRefresh');
    const pullText = pullIndicator.querySelector('.pull-text');
    let startY = 0;
    let currentY = 0;
    let pulling = false;
    const threshold = 80;

    document.addEventListener('touchstart', (e) => {
        // Solo se siamo in cima alla pagina
        if (window.scrollY === 0) {
            startY = e.touches[0].pageY;
            pulling = true;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!pulling) return;

        currentY = e.touches[0].pageY;
        const pullDistance = currentY - startY;

        if (pullDistance > 0 && window.scrollY === 0) {
            // Mostra l'indicatore proporzionalmente
            if (pullDistance > 30) {
                pullIndicator.classList.add('visible');

                if (pullDistance >= threshold) {
                    pullText.textContent = 'Rilascia per aggiornare';
                } else {
                    pullText.textContent = 'Scorri per aggiornare';
                }
            }
        }
    }, { passive: true });

    document.addEventListener('touchend', () => {
        if (!pulling) return;

        const pullDistance = currentY - startY;

        if (pullDistance >= threshold && window.scrollY === 0) {
            // Esegui il refresh
            pullIndicator.classList.add('refreshing');
            pullText.textContent = 'Aggiornamento...';

            // Cancella la cache del Service Worker e ricarica
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                caches.keys().then(names => {
                    return Promise.all(names.map(name => caches.delete(name)));
                }).then(() => {
                    setTimeout(() => {
                        window.location.reload(true);
                    }, 500);
                });
            } else {
                setTimeout(() => {
                    window.location.reload(true);
                }, 500);
            }
        } else {
            pullIndicator.classList.remove('visible');
        }

        pulling = false;
        startY = 0;
        currentY = 0;
    }, { passive: true });
}

// =========================
// SERVICE WORKER
// =========================

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => {
            console.log('Service Worker registered');

            // Check for updates every minute
            setInterval(() => {
                reg.update();
            }, 60000);
        })
        .catch(err => console.error('Service Worker registration failed:', err));
}
