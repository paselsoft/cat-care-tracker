// =========================
// FOOD MANAGEMENT MODULE
// =========================

// Product Modal Listeners
function initProductModalListeners() {
    document.getElementById('productBrand').addEventListener('change', function() {
        const customWrapper = document.getElementById('customBrandWrapper');
        customWrapper.style.display = this.value === 'Altro' ? 'block' : 'none';
    });

    document.getElementById('productFlavor').addEventListener('change', function() {
        const customWrapper = document.getElementById('customFlavorWrapper');
        customWrapper.style.display = this.value === 'Altro' ? 'block' : 'none';
    });
}

function updateFoodUI() {
    if (!appData.food) {
        appData.food = { products: [], lastUpdated: null };
    }

    updateFoodSummary();
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
    const cans = products.filter(p => p.type === 'scatoletta');

    if (cans.length === 0) {
        cansList.innerHTML = '<div class="empty-prefs">Nessuna scatoletta aggiunta</div>';
    } else {
        cansList.innerHTML = cans.map(p => renderFoodItem(p)).join('');
    }

    // Lista crocchette
    const kibbleList = document.getElementById('kibbleList');
    const kibble = products.filter(p => p.type === 'crocchette');

    if (kibble.length === 0) {
        kibbleList.innerHTML = '<div class="empty-prefs">Nessuna crocchetta aggiunta</div>';
    } else {
        kibbleList.innerHTML = kibble.map(p => renderFoodItem(p)).join('');
    }
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
        minouPrefs.innerHTML = '<div class="empty-prefs">Nessuna preferenza</div>';
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
        matissePrefs.innerHTML = '<div class="empty-prefs">Nessuna preferenza</div>';
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
    const product = appData.food.products.find(p => p.id === productId);
    if (product) {
        product.quantity = Math.max(0, product.quantity + delta);
        saveData();
        updateFoodUI();
    }
}

function showAddProductModal(type) {
    currentProductType = type;
    editingProductId = null;
    currentRating = 'like';

    document.getElementById('productModalTitle').textContent =
        type === 'scatoletta' ? 'Aggiungi Scatoletta' : 'Aggiungi Crocchette';

    // Reset form
    document.getElementById('productBrand').value = '';
    document.getElementById('customBrand').value = '';
    document.getElementById('customBrandWrapper').style.display = 'none';
    document.getElementById('productFlavor').value = '';
    document.getElementById('customFlavor').value = '';
    document.getElementById('customFlavorWrapper').style.display = 'none';
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
    const product = appData.food.products.find(p => p.id === productId);
    if (!product) return;

    editingProductId = productId;
    currentProductType = product.type;
    currentRating = product.rating || 'like';

    document.getElementById('productModalTitle').textContent = 'Modifica Prodotto';

    // Popola form
    if (['Natural Code', 'Schesir', 'Oasy', 'Life Cat', 'Farmina'].includes(product.brand)) {
        document.getElementById('productBrand').value = product.brand;
        document.getElementById('customBrandWrapper').style.display = 'none';
    } else {
        document.getElementById('productBrand').value = 'Altro';
        document.getElementById('customBrand').value = product.brand;
        document.getElementById('customBrandWrapper').style.display = 'block';
    }

    if (['Tonno', 'Pollo', 'Tacchino', 'Tonno e Pollo', 'Tonno e Tacchino', 'Pollo e Tacchino', 'Manzo', 'Pesce', 'Misto'].includes(product.flavor)) {
        document.getElementById('productFlavor').value = product.flavor;
        document.getElementById('customFlavorWrapper').style.display = 'none';
    } else {
        document.getElementById('productFlavor').value = 'Altro';
        document.getElementById('customFlavor').value = product.flavor;
        document.getElementById('customFlavorWrapper').style.display = 'block';
    }

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
    let brand = document.getElementById('productBrand').value;
    if (brand === 'Altro') {
        brand = document.getElementById('customBrand').value.trim();
    }

    let flavor = document.getElementById('productFlavor').value;
    if (flavor === 'Altro') {
        flavor = document.getElementById('customFlavor').value.trim();
    }

    const quantity = parseInt(document.getElementById('productQuantity').value) || 0;
    const size = currentProductType === 'scatoletta' ? document.getElementById('productSize').value : null;
    const likesMinou = document.getElementById('likesMinou').checked;
    const likesMatisse = document.getElementById('likesMatisse').checked;

    if (!brand || !flavor) {
        showToast('Inserisci marca e gusto');
        return;
    }

    if (editingProductId) {
        // Modifica prodotto esistente
        const product = appData.food.products.find(p => p.id === editingProductId);
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
}

function deleteProduct(productId) {
    if (confirm('Eliminare questo prodotto?')) {
        appData.food.products = appData.food.products.filter(p => p.id !== productId);
        saveData();
        updateFoodUI();
        showToast('Prodotto eliminato');
    }
}
