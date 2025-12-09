// =========================
// MAIN APP MODULE
// =========================

// Constants
const APP_VERSION = '2.6.1';
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
        lastUpdated: null,
        brands: ['Natural Code', 'Schesir', 'Oasy', 'Life Cat', 'Farmina'],
        flavors: ['Tonno', 'Pollo', 'Tacchino', 'Tonno e Pollo', 'Tonno e Tacchino', 'Pollo e Tacchino', 'Manzo', 'Pesce', 'Misto']
    },
    // New Health Section (v3.0.0)
    cats: {
        minou: {
            name: 'Minou',
            birthDate: '',
            weight: 0,
            chip: '',
            color: '#ffb7b2' // Pastel Red/Pink
        },
        matisse: {
            name: 'Matisse',
            birthDate: '',
            weight: 0,
            chip: '',
            color: '#b5ead7' // Pastel Green/Mint
        }
    },
    healthEvents: [] // { id, catId, type, date, note, cost, nextDueDate }
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
    // Self-Healing: Ensure lastClean matches actual history max date
    // (Fixes "Zombie Dates" if local storage got desynced)
    ['grande', 'piccolo'].forEach(toilet => {
        const events = appData.history.filter(h => h.toilet === toilet);
        if (events.length > 0) {
            const maxDate = events.reduce((latest, current) => {
                return new Date(current.date) > new Date(latest.date) ? current : latest;
            }).date;
            // Force update if different
            if (appData.toilets[toilet].lastClean !== maxDate) {

                appData.toilets[toilet].lastClean = maxDate;
            }
        } else {
            // If no history, lastClean MUST be null
            if (appData.toilets[toilet].lastClean) {
                appData.toilets[toilet].lastClean = null;
            }
        }
    });

    updateUI();
    updateFoodUI();
    checkInstallPrompt();
    requestNotificationPermission();
    initNavigation();
    initProductModalListeners();
    initPullToRefresh();

    // Aggiorna versione UI
    const versionEl = document.getElementById('appVersion');
    if (versionEl) versionEl.textContent = APP_VERSION;

    // Header scroll effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

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
        const parsed = JSON.parse(saved);
        // Merge saved data with default structure to ensure new fields (cats, healthEvents) exist
        if (appData.food) {
            initFoodData(); // Ensure defaults exist (v2.6.0)
            updateFoodUI();
        } appData = {
            ...appData,
            ...parsed,
            // Ensure deeply nested or new critical objects exist if missing in parsed
            cats: parsed.cats || appData.cats,
            healthEvents: parsed.healthEvents || appData.healthEvents,
            settings: { ...appData.settings, ...parsed.settings },
            toilets: { ...appData.toilets, ...parsed.toilets },
            food: { ...appData.food, ...parsed.food }
        };
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
    if (document.getElementById('dayBeforeToggle')) {
        document.getElementById('dayBeforeToggle').checked = appData.settings.dayBefore;
    }
    if (document.getElementById('notificationsToggle')) {
        document.getElementById('notificationsToggle').checked = appData.settings.notifications;
    }
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

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

// Global Modal Listener for Overlay Clicks
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        // Did user click strictly on the overlay?
        e.target.classList.remove('active');
    }
});

function closeModal(modalId) {
    if (modalId) {
        document.getElementById(modalId).classList.remove('active');
    } else {
        // Fallback: try to close any active modal
        document.querySelectorAll('.modal-overlay.active').forEach(el => el.classList.remove('active'));
    }
}

function updateUI() {
    updateToiletCards();
    updateNextAlert();
    updateHistory();
    if (typeof updateHealthUI === 'function') {
        updateHealthUI();
    }
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

    document.getElementById(`tab-${tab}`).classList.add('active');
    if (btn) {
        btn.classList.add('active');
    }
}

function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-item');
    navButtons.forEach(btn => {
        const tabName = btn.getAttribute('data-tab');

        // Use touchend for iOS, click for desktop
        btn.addEventListener('touchend', function (e) {
            e.preventDefault();
            e.stopPropagation();
            triggerHaptic('light');
            switchTab(tabName, this);
        }, { passive: false });

        btn.addEventListener('click', function (e) {
            // Only handle click if not a touch device
            if (!('ontouchend' in window)) {
                switchTab(tabName, this);
            } else {
                // Hybrid devices might fire both, ensure haptic if click is primary
                // triggerHaptic('light'); // Optional, usually touch handles it
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
        month: 'long',
        year: 'numeric'
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
    if (!date) return -1;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const then = new Date(date);
    // Invalida date check
    if (isNaN(then.getTime())) return -1;

    then.setHours(0, 0, 0, 0);
    return Math.floor((then - now) / (1000 * 60 * 60 * 24));
}

function addSwipeAction(element, onSwipeLeft) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    const threshold = 100;

    element.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        element.style.transition = 'none';
        currentX = startX; // Reset currentX
    }, { passive: true });

    element.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;

        // Only allow swipe left
        if (diff < 0) {
            element.style.transform = `translateX(${diff}px)`;
        }
    }, { passive: true });

    element.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        element.style.transition = 'transform 0.3s ease';

        const diff = currentX - startX;
        if (diff < -threshold) {
            // Swipe completato
            element.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                if (onSwipeLeft) onSwipeLeft();
            }, 300);
        } else {
            // Reset
            element.style.transform = '';
        }
    });
}

function triggerHaptic(type = 'medium') {
    if (!navigator.vibrate) return;

    // Solo se abilitato nelle impostazioni (opzionale, per ora sempre attivo se supportato)
    // if (!appData.settings.haptic) return; 

    switch (type) {
        case 'light':
            navigator.vibrate(10);
            break;
        case 'medium':
            navigator.vibrate(20);
            break;
        case 'heavy':
            navigator.vibrate(40);
            break;
        case 'success':
            navigator.vibrate([20, 50, 20]);
            break;
        case 'error':
            navigator.vibrate([50, 100, 50, 100, 50]);
            break;
        default:
            navigator.vibrate(20);
    }
}

function initPullToRefresh() {
    const pullIndicator = document.getElementById('pullToRefresh');
    const pullText = pullIndicator.querySelector('.pull-text');
    let startY = 0;
    let currentY = 0;
    let pulling = false;
    const threshold = 80;

    document.addEventListener('touchstart', (e) => {
        // Solo se siamo in cima alla pagina E siamo nella tab HOME
        const homeTab = document.getElementById('tab-home');
        if (window.scrollY === 0 && homeTab && homeTab.classList.contains('active')) {
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


            // Check for updates every minute
            setInterval(() => {
                reg.update();
            }, 60000);
        })
        .catch(err => console.error('Service Worker registration failed:', err));
}
