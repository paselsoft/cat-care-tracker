// =========================
// FOOD MANAGEMENT MODULE
// =========================

// Product Modal Listeners
function initProductModalListeners() {
    // No specific listeners needed for selects anymore as they are populated dynamically
}

function initFoodData() {
    // Ensure brands and flavors exist in appData
    if (!appData.food.brands) {
        appData.food.brands = ['Natural Code', 'Schesir', 'Oasy', 'Life Cat', 'Farmina'];
    }
    if (!appData.food.flavors) {
        appData.food.flavors = ['Tonno', 'Pollo', 'Tacchino', 'Tonno e Pollo', 'Tonno e Tacchino', 'Pollo e Tacchino', 'Manzo', 'Pesce', 'Misto'];
    }
}

function populateFoodSelects() {
    const brandSelect = document.getElementById('productBrand');
    const flavorSelect = document.getElementById('productFlavor');

    // Save current selection if any
    const currentBrand = brandSelect.value;
    const currentFlavor = flavorSelect.value;

    // Clear and repopulate Brands
    brandSelect.innerHTML = '<option value="">Seleziona marca...</option>';
    appData.food.brands.sort().forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandSelect.appendChild(option);
    });

    // Clear and repopulate Flavors
    flavorSelect.innerHTML = '<option value="">Seleziona gusto...</option>';
    appData.food.flavors.sort().forEach(flavor => {
        const option = document.createElement('option');
        option.value = flavor;
        option.textContent = flavor;
        flavorSelect.appendChild(option);
    });

    // Restore selection if it still exists
    if (appData.food.brands.includes(currentBrand)) brandSelect.value = currentBrand;
    if (appData.food.flavors.includes(currentFlavor)) flavorSelect.value = currentFlavor;
}

let currentListType = null; // 'brands' or 'flavors'
let currentBrandFilter = null; // Global filter state

function renderBrandFilters() {
    const filterContainer = document.getElementById('brandFilters');
    if (!filterContainer) return;

    const brands = appData.food.brands || [];

    // Add "All" option
    let html = `
        <button class="brand-filter-btn ${currentBrandFilter === null ? 'active' : ''}" 
                onclick="setBrandFilter(null)">
            Tutte
        </button>
    `;

    // Add brands
    brands.sort().forEach(brand => {
        html += `
            <button class="brand-filter-btn ${currentBrandFilter === brand ? 'active' : ''}" 
                    onclick="setBrandFilter('${brand.replace(/'/g, "\\'")}')">
                ${brand}
            </button>
        `;
    });

    filterContainer.innerHTML = html;
}

function setBrandFilter(brand) {
    currentBrandFilter = brand;
    renderBrandFilters();
    updateFoodLists();
    triggerHaptic('light');
}

function openManageListModal(type) {
    currentListType = type;
    const title = type === 'brands' ? 'Gestisci Marche' : 'Gestisci Gusti';
    document.getElementById('listManagerTitle').textContent = title;
    document.getElementById('newItemInput').value = '';
    renderListItems();
    document.getElementById('listManagerModal').classList.add('active');
}

function closeListManagerModal() {
    document.getElementById('listManagerModal').classList.remove('active');
    currentListType = null;
    populateFoodSelects(); // Refresh dropdowns in main modal
}

function renderListItems() {
    const listContainer = document.getElementById('manageListItems');
    const items = currentListType === 'brands' ? appData.food.brands : appData.food.flavors;

    listContainer.innerHTML = items.sort().map(item => `
        <div class="list-item-row">
            <span>${item}</span>
            <div class="list-actions">
                <button class="action-btn edit-btn" onclick="editListItem('${item.replace(/'/g, "\\'")}')">✏️</button>
                <button class="action-btn delete-btn" onclick="deleteListItem('${item.replace(/'/g, "\\'")}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function addListItem() {
    const input = document.getElementById('newItemInput');
    const value = input.value.trim();

    if (!value) return;

    const list = currentListType === 'brands' ? appData.food.brands : appData.food.flavors;

    if (list.includes(value)) {
        showToast('Elemento già esistente');
        return;
    }

    list.push(value);
    saveData(); // Persist changes
    input.value = '';
    renderListItems();
    showToast('Aggiunto!');
}

function editListItem(oldName) {
    const newName = prompt(`Modifica "${oldName}":`, oldName);
    if (newName && newName.trim() !== "" && newName !== oldName) {
        updateListItem(oldName, newName.trim());
    }
}

function updateListItem(oldName, newName) {
    const list = currentListType === 'brands' ? appData.food.brands : appData.food.flavors;

    // Check if new name already exists
    if (list.includes(newName)) {
        showToast('Questo nome esiste già');
        return;
    }

    // Update list
    const index = list.indexOf(oldName);
    if (index !== -1) {
        list[index] = newName;
    }

    // Propagate change to products
    let updatedCount = 0;
    appData.food.products.forEach(p => {
        if (currentListType === 'brands' && p.brand === oldName) {
            p.brand = newName;
            updatedCount++;
        } else if (currentListType === 'flavors' && p.flavor === oldName) {
            p.flavor = newName;
            updatedCount++;
        }
    });

    saveData();
    renderListItems();

    if (updatedCount > 0) {
        showToast(`Aggiornato e applicato a ${updatedCount} prodotti!`);
    } else {
        showToast('Aggiornato!');
    }
}

function deleteListItem(item) {
    if (!confirm(`Eliminare "${item}"?`)) return;

    if (currentListType === 'brands') {
        appData.food.brands = appData.food.brands.filter(i => i !== item);
    } else {
        appData.food.flavors = appData.food.flavors.filter(i => i !== item);
    }

    saveData();
    renderListItems();
}

function updateFoodUI() {
    if (!appData.food) {
        appData.food = { products: [], lastUpdated: null };
    }

    updateFoodSummary();
    renderBrandFilters(); // v2.7.0
    updateFoodLists();
    updatePreferences();
    checkLowStock();
}

function updateFoodSummary() {
    const products = appData.food.products || [];

    // Conta scatolette totali
    const totalCans = products
        .filter(p => p.type === 'scatoletta')
        .reduce((sum, p) => sum + (p.quantity || 0), 0);

    // Somma kg crocchette
    const totalKibble = products
        .filter(p => p.type === 'crocchette')
        .reduce((sum, p) => sum + (p.quantity || 0), 0);

    document.getElementById('totalCans').textContent = totalCans;
    document.getElementById('totalKibble').textContent = totalKibble;
}

function updateFoodLists() {
    const products = appData.food.products || [];

    // Lista scatolette
    const cansList = document.getElementById('cansList');
    const cans = products
        .filter(p => p.type === 'scatoletta')
        .filter(p => !currentBrandFilter || p.brand === currentBrandFilter) // v2.7.0
        .sort((a, b) => a.brand.localeCompare(b.brand) || a.flavor.localeCompare(b.flavor));

    if (cans.length === 0) {
        cansList.innerHTML = `
            <div class="empty-prefs">
                <div class="empty-state-icon">🥫</div>
                <p>Nessuna scatoletta aggiunta</p>
            </div>`;
    } else {
        cansList.innerHTML = cans.map(p => renderFoodItem(p)).join('');
    }

    // Lista crocchette
    const kibbleList = document.getElementById('kibbleList');
    const kibble = products
        .filter(p => p.type === 'crocchette')
        .filter(p => !currentBrandFilter || p.brand === currentBrandFilter) // v2.7.0
        .sort((a, b) => a.brand.localeCompare(b.brand) || a.flavor.localeCompare(b.flavor));

    if (kibble.length === 0) {
        kibbleList.innerHTML = `
            <div class="empty-prefs">
                <div class="empty-state-icon">🥣</div>
                <p>Nessuna crocchetta aggiunta</p>
            </div>`;
    } else {
        kibbleList.innerHTML = kibble.map(p => renderFoodItem(p)).join('');
    }

    // Add Swipe Listeners to all food items
    document.querySelectorAll('.food-item').forEach(item => {
        addSwipeAction(item,
            () => { // Left: Delete
                const id = item.querySelector('.delete-btn, .food-action-btn:last-child').getAttribute('onclick').match(/'([^']+)'/)[1];
                deleteProduct(id);
            },
            () => { // Right: Edit
                const id = item.querySelector('.edit-btn, .food-action-btn:first-child').getAttribute('onclick').match(/'([^']+)'/)[1];
                editProduct(id);
            }
        );
    });
}

function renderFoodItem(product) {
    const isLowStock = product.type === 'scatoletta' && product.quantity < LOW_STOCK_THRESHOLD;
    const ratingEmoji = {
        'love': '❤️',
        'like': '👍',
        'ok': '😐',
        'dislike': '👎'
    };

    const catsEmoji = [];
    if (product.likesMinou) catsEmoji.push('🐱');
    if (product.likesMatisse) catsEmoji.push('🐱');

    return `
        <div class="food-item ${isLowStock ? 'low-stock' : ''}">
            <span class="food-item-icon">${product.type === 'scatoletta' ? '🥫' : '🥣'}</span>
            <div class="food-item-info">
                <div class="food-item-name">${product.brand} - ${product.flavor}</div>
                <div class="food-item-details">
                    <span>${product.size || ''}</span>
                    <span>${ratingEmoji[product.rating] || '👍'}</span>
                    <span class="food-item-cats">${catsEmoji.join('')}</span>
                </div>
            </div>
            <div class="food-item-qty">
                <button class="qty-btn minus" onclick="updateQuantity('${product.id}', -1)">−</button>
                <span class="qty-value ${isLowStock ? 'low' : ''}">${product.quantity}</span>
                <button class="qty-btn plus" onclick="updateQuantity('${product.id}', 1)">+</button>
            </div>
            <div class="food-item-actions">
                <button class="food-action-btn" onclick="editProduct('${product.id}')">✏️</button>
                <button class="food-action-btn" onclick="deleteProduct('${product.id}')">🗑️</button>
            </div>
        </div>
    `;
}

function updatePreferences() {
    const products = appData.food.products || [];

    const ratingEmoji = {
        'love': '❤️',
        'like': '👍',
        'ok': '😐',
        'dislike': '👎'
    };

    // Preferenze Minou
    const minouPrefs = document.getElementById('minouPrefs');
    const minouProducts = products.filter(p => p.likesMinou && p.rating !== 'dislike');

    if (minouProducts.length === 0) {
        minouPrefs.innerHTML = `
            <div class="empty-prefs">
                <div class="empty-state-icon">😿</div>
                <p>Nessuna preferenza</p>
            </div>`;
    } else {
        minouPrefs.innerHTML = minouProducts.slice(0, 5).map(p => `
            <div class="pref-item">
                <span class="pref-item-name">${p.brand} ${p.flavor}</span>
                <span class="pref-item-rating">${ratingEmoji[p.rating]}</span>
            </div>
        `).join('');
    }

    // Preferenze Matisse
    const matissePrefs = document.getElementById('matissePrefs');
    const matisseProducts = products.filter(p => p.likesMatisse && p.rating !== 'dislike');

    if (matisseProducts.length === 0) {
        matissePrefs.innerHTML = `
            <div class="empty-prefs">
                <div class="empty-state-icon">😿</div>
                <p>Nessuna preferenza</p>
            </div>`;
    } else {
        matissePrefs.innerHTML = matisseProducts.slice(0, 5).map(p => `
            <div class="pref-item">
                <span class="pref-item-name">${p.brand} ${p.flavor}</span>
                <span class="pref-item-rating">${ratingEmoji[p.rating]}</span>
            </div>
        `).join('');
    }
}

function checkLowStock() {
    const products = appData.food.products || [];
    const lowStockProducts = products.filter(p =>
        p.type === 'scatoletta' && p.quantity < LOW_STOCK_THRESHOLD
    );

    const alertEl = document.getElementById('lowStockAlert');
    const alertText = document.getElementById('lowStockText');

    if (lowStockProducts.length > 0) {
        alertEl.style.display = 'flex';
        if (lowStockProducts.length === 1) {
            alertText.textContent = `${lowStockProducts[0].brand} ${lowStockProducts[0].flavor} sta finendo!`;
        } else {
            alertText.textContent = `${lowStockProducts.length} prodotti stanno finendo!`;
        }
    } else {
        alertEl.style.display = 'none';
    }
}

function updateQuantity(productId, delta) {
    const product = appData.food.products.find(p => String(p.id) === String(productId));
    if (product) {
        product.quantity = Math.max(0, product.quantity + delta);
        saveData();
        updateFoodUI();
        triggerHaptic('light');
    }
}

function showAddProductModal(type) {
    currentProductType = type;
    editingProductId = null;
    currentRating = 'like';
    let currentBrandFilter = null; // v2.7.0

    document.getElementById('productModalTitle').textContent =
        type === 'scatoletta' ? 'Aggiungi Scatoletta' : 'Aggiungi Crocchette';

    // Ensure selects are populated
    populateFoodSelects();

    // Reset form
    document.getElementById('productBrand').value = '';
    document.getElementById('productFlavor').value = '';
    document.getElementById('productQuantity').value = type === 'scatoletta' ? '1' : '1';
    document.getElementById('likesMinou').checked = true;
    document.getElementById('likesMatisse').checked = true;

    // Mostra/nascondi formato
    document.getElementById('sizeWrapper').style.display = type === 'scatoletta' ? 'block' : 'none';
    document.getElementById('productSize').value = '85g';

    // Reset rating
    document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.rating-btn[data-rating="like"]').classList.add('active');

    document.getElementById('productModal').classList.add('active');
}

function editProduct(productId) {
    const product = appData.food.products.find(p => String(p.id) === String(productId));
    if (!product) return;

    editingProductId = productId;
    currentProductType = product.type;
    currentRating = product.rating || 'like';

    document.getElementById('productModalTitle').textContent = 'Modifica Prodotto';

    populateFoodSelects();

    // Popola form
    document.getElementById('productBrand').value = product.brand;
    document.getElementById('productFlavor').value = product.flavor;

    document.getElementById('productQuantity').value = product.quantity;
    document.getElementById('likesMinou').checked = product.likesMinou;
    document.getElementById('likesMatisse').checked = product.likesMatisse;

    document.getElementById('sizeWrapper').style.display = product.type === 'scatoletta' ? 'block' : 'none';
    if (product.size) document.getElementById('productSize').value = product.size;

    // Set rating
    document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.rating-btn[data-rating="${currentRating}"]`).classList.add('active');

    document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    editingProductId = null;
}

function setRating(rating) {
    currentRating = rating;
    document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.rating-btn[data-rating="${rating}"]`).classList.add('active');
}

function saveProduct() {
    const brand = document.getElementById('productBrand').value;
    const flavor = document.getElementById('productFlavor').value;

    const quantity = parseInt(document.getElementById('productQuantity').value) || 0;
    const size = currentProductType === 'scatoletta' ? document.getElementById('productSize').value : null;
    const likesMinou = document.getElementById('likesMinou').checked;
    const likesMatisse = document.getElementById('likesMatisse').checked;

    if (!brand || !flavor) {
        showToast('Inserisci marca e gusto');
        return;
    }

    // Auto-add new Brand/Flavor if missing (v2.6.7)
    if (!appData.food.brands.includes(brand)) {
        appData.food.brands.push(brand);
    }
    if (!appData.food.flavors.includes(flavor)) {
        appData.food.flavors.push(flavor);
    }

    // Check for similar product (v2.6.1)
    if (!editingProductId) {
        const similar = appData.food.products.find(p =>
            p.brand === brand &&
            p.flavor === flavor &&
            p.type === currentProductType
        );
        if (similar) {
            if (!confirm(`"${brand} - ${flavor}" esiste già. Vuoi aggiungere una copia?`)) {
                return;
            }
        }
    }

    if (editingProductId) {
        // Modifica prodotto esistente
        const product = appData.food.products.find(p => String(p.id) === String(editingProductId));
        if (product) {
            product.brand = brand;
            product.flavor = flavor;
            product.quantity = quantity;
            product.size = size;
            product.likesMinou = likesMinou;
            product.likesMatisse = likesMatisse;
            product.rating = currentRating;
        }
        showToast('Prodotto modificato! ✏️');
    } else {
        // Nuovo prodotto
        const newProduct = {
            id: Date.now().toString(),
            type: currentProductType,
            brand,
            flavor,
            quantity,
            size,
            likesMinou,
            likesMatisse,
            rating: currentRating,
            createdAt: new Date().toISOString()
        };

        appData.food.products.push(newProduct);
        showToast('Prodotto aggiunto! 🥫');
    }

    appData.food.lastUpdated = new Date().toISOString();
    saveData();
    updateFoodUI();
    closeProductModal();
    triggerHaptic('success');
}

function deleteProduct(productId) {
    if (confirm('Eliminare questo prodotto?')) {
        appData.food.products = appData.food.products.filter(p => String(p.id) !== String(productId));
        saveData();
        updateFoodUI();
        triggerHaptic('success');
        showToast('Prodotto eliminato');
    }
}
