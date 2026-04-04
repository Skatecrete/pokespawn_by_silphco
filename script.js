// Global variables
let allPokemon = [];
let cartItems = [];
let customerName = '';
let customerIgn = '';
let selectedAdmin = '';
let filters = { shundo: false, shiny164: false };
let currentSearch = '';

// Pricing
const PRICES = {
    shundo: 5.0,
    hundo: 3.0,
    shiny: 2.0,
    raid10: 7.0,
    raid20: 12.0,
    raid50: 20.0,
    dynamax4: 10.0,
    dynamaxSingle: 2.5
};

// ========== FETCH DATA ==========

async function fetchSpawns() {
    try {
        const response = await fetch('https://shungo.app/api/shungo/data/spawns');
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error fetching spawns:', error);
        return [];
    }
}

async function fetchAllRaids() {
    try {
        const scrapedResponse = await fetch('https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.min.json');
        const scrapedRaids = await scrapedResponse.json();
        
        const dynaResponse = await fetch('https://raw.githubusercontent.com/Skatecrete/pogo-raid-data/main/current_raids.json');
        const dynaRaids = await dynaResponse.json();
        
        return { scrapedRaids, dynaRaids };
    } catch (error) {
        console.error('Error fetching raids:', error);
        return null;
    }
}

async function fetchEvents() {
    try {
        const response = await fetch('https://leekduck.com/feeds/events.json');
        return await response.json();
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}

async function getPokemonName(id) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`);
        const data = await response.json();
        return data.names.find(n => n.language.name === 'en').name;
    } catch {
        return `Pokemon #${id}`;
    }
}

async function getPokemonIdFromName(name) {
    const cleanName = name.replace('Shadow ', '').replace('Mega ', '').replace('D-Max ', '').trim().toLowerCase();
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${cleanName}`);
        const data = await response.json();
        return data.id;
    } catch {
        return 25;
    }
}

// ========== CART FUNCTIONS ==========

function addToCart(item) {
    const existingIndex = cartItems.findIndex(i => 
        i.type === item.type && 
        i.pokemonName === item.pokemonName &&
        i.raidTier === item.raidTier
    );
    
    if (existingIndex >= 0) {
        cartItems[existingIndex].quantity += item.quantity;
        cartItems[existingIndex].price = calculateItemPrice(cartItems[existingIndex]);
    } else {
        cartItems.push(item);
    }
    
    updateCartDisplay();
    showToast(`Added ${item.quantity}x ${item.pokemonName} to cart`);
}

function removeFromCart(index) {
    cartItems.splice(index, 1);
    updateCartDisplay();
}

function updateQuantity(index, newQuantity) {
    if (newQuantity <= 0) {
        cartItems.splice(index, 1);
    } else {
        cartItems[index].quantity = newQuantity;
        cartItems[index].price = calculateItemPrice(cartItems[index]);
    }
    updateCartDisplay();
}

function calculateItemPrice(item) {
    if (item.type === 'shundo') return item.quantity * PRICES.shundo;
    if (item.type === 'hundo') return item.quantity * PRICES.hundo;
    if (item.type === 'shiny') return item.quantity * PRICES.shiny;
    if (item.type === 'raid') {
        const qty = item.quantity;
        let price = 0;
        let remaining = qty;
        while (remaining >= 50) { price += 20; remaining -= 50; }
        while (remaining >= 20) { price += 12; remaining -= 20; }
        while (remaining >= 10) { price += 7; remaining -= 10; }
        price += remaining * 0.70;
        return price;
    }
    if (item.type === 'dynamax') {
        return Math.floor(item.quantity / 4) * 10 + (item.quantity % 4) * 2.5;
    }
    return 0;
}

function getCartTotal() {
    return cartItems.reduce((sum, item) => sum + item.price, 0);
}

function updateCartDisplay() {
    const cartContainer = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartCount = document.getElementById('cartCount');
    const emptyCartMsg = document.getElementById('emptyCartMsg');
    
    const total = getCartTotal();
    const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    
    if (cartCount) cartCount.textContent = `${itemCount} items`;
    if (cartTotal) cartTotal.textContent = total.toFixed(2);
    
    if (cartItems.length === 0) {
        if (cartContainer) cartContainer.innerHTML = '';
        if (emptyCartMsg) emptyCartMsg.style.display = 'block';
        return;
    }
    
    if (emptyCartMsg) emptyCartMsg.style.display = 'none';
    
    if (cartContainer) {
        cartContainer.innerHTML = cartItems.map((item, idx) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.pokemonName} ${item.raidTier ? `(${item.raidTier})` : ''}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateQuantity(${idx}, ${item.quantity - 1})">-</button>
                    <span style="min-width:30px;text-align:center">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${idx}, ${item.quantity + 1})">+</button>
                    <button class="delete-btn" onclick="removeFromCart(${idx})">🗑️</button>
                </div>
            </div>
        `).join('');
    }
}

function clearCart() {
    cartItems = [];
    updateCartDisplay();
}

function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#4CAF50;color:white;padding:10px 20px;border-radius:25px;z-index:1001;opacity:0;transition:opacity 0.3s';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

// ========== SPAWN FUNCTIONS ==========

async function loadSpawns() {
    const container = document.getElementById('spawnsList');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading spawns...</div>';
    
    const spawnData = await fetchSpawns();
    if (!spawnData || spawnData.length === 0) {
        container.innerHTML = '<div class="loading">Failed to load spawns</div>';
        return;
    }
    
    const pokemonList = [];
    for (let i = 0; i < Math.min(spawnData.length, 150); i++) {
        const item = spawnData[i];
        const pokedexId = item[0];
        const spawnRate = item[2];
        const isShiny = item[3];
        
        let name = await getPokemonName(pokedexId);
        
        pokemonList.push({
            id: pokedexId,
            name: name,
            spawnRate: spawnRate,
            isShiny: isShiny,
            shinyRate: isShiny ? (spawnRate >= 0.65 ? '✨ 1/64' : '✨ 1/512') : '❌ Not available'
        });
    }
    
    pokemonList.sort((a, b) => b.spawnRate - a.spawnRate);
    allPokemon = pokemonList;
    displaySpawns();
}

function displaySpawns() {
    const container = document.getElementById('spawnsList');
    if (!container) return;
    
    let filtered = [...allPokemon];
    
    if (currentSearch) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(currentSearch));
    }
    
    if (filters.shundo) {
        filtered = filtered.filter(p => p.spawnRate >= 0.65 && p.isShiny);
    }
    if (filters.shiny164) {
        filtered = filtered.filter(p => p.isShiny && p.spawnRate >= 0.65);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading">No spawns found</div>';
        return;
    }
    
    container.innerHTML = filtered.map(p => {
        let badgeClass = '';
        let badgeText = '';
        if (p.spawnRate >= 0.85) { badgeClass = 'badge-heavy'; badgeText = 'HEAVY'; }
        else if (p.spawnRate >= 0.65) { badgeClass = 'badge-medium'; badgeText = 'MEDIUM'; }
        else if (p.spawnRate >= 0.30) { badgeClass = 'badge-low'; badgeText = 'LOW'; }
        else { badgeClass = 'badge-minimal'; badgeText = 'MINIMAL'; }
        
        return `
            <div class="pokemon-card" onclick='showSpawnOrderDialog(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${p.id}.png" 
                     onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png'">
                <div class="pokemon-info">
                    <div class="pokemon-name">
                        ${p.name}
                        <span class="spawn-badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <div class="pokemon-details">
                        Rate: ${p.spawnRate.toFixed(2)}% | 
                        <span class="shiny-rate">${p.shinyRate}</span>
                    </div>
                </div>
                <button class="order-btn" onclick="event.stopPropagation(); showSpawnOrderDialog(${JSON.stringify(p).replace(/'/g, "&#39;")})">➕ Order</button>
            </div>
        `;
    }).join('');
}

function filterSpawns() {
    currentSearch = document.getElementById('spawnSearch')?.value.toLowerCase() || '';
    displaySpawns();
}

function toggleFilter(filter) {
    filters[filter] = !filters[filter];
    const btn = event.target;
    if (filters[filter]) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
    displaySpawns();
}

// Spawn Order Dialog
let currentSpawnPokemon = null;
let spawnQuantities = { shundo: 0, hundo: 0, shiny: 0 };

function showSpawnOrderDialog(pokemon) {
    currentSpawnPokemon = pokemon;
    spawnQuantities = { shundo: 0, hundo: 0, shiny: 0 };
    
    document.getElementById('modalTitle').textContent = `Order ${pokemon.name}`;
    document.getElementById('modalBody').innerHTML = `
        <div class="order-stats">
            <div>Spawn Rate: ${pokemon.spawnRate.toFixed(2)}%</div>
            <div>Shiny: ${pokemon.shinyRate}</div>
        </div>
        
        ${pokemon.spawnRate >= 0.65 && pokemon.isShiny ? `
        <div class="order-section">
            <div class="section-title">✨ SHUNDO (100% IV + SHINY) - $5 EACH</div>
            <div class="quantity-selector">
                <button class="qty-btn" onclick="updateSpawnQty('shundo', -1)">-</button>
                <span id="shundoQty" class="qty-num">0</span>
                <button class="qty-btn" onclick="updateSpawnQty('shundo', 1)">+</button>
                <span id="shundoPrice" class="item-price">$0.00</span>
            </div>
        </div>
        ` : ''}
        
        <div class="order-section">
            <div class="section-title">💯 HUNDO (100% IV) - $3 EACH</div>
            <div class="quantity-selector">
                <button class="qty-btn" onclick="updateSpawnQty('hundo', -1)">-</button>
                <span id="hundoQty" class="qty-num">0</span>
                <button class="qty-btn" onclick="updateSpawnQty('hundo', 1)">+</button>
                <span id="hundoPrice" class="item-price">$0.00</span>
            </div>
        </div>
        
        <div class="order-section">
            <div class="section-title">✨ SHINY (Random IVs) - $2 EACH</div>
            <div class="quantity-selector">
                <button class="qty-btn" onclick="updateSpawnQty('shiny', -1)">-</button>
                <span id="shinyQty" class="qty-num">0</span>
                <button class="qty-btn" onclick="updateSpawnQty('shiny', 1)">+</button>
                <span id="shinyPrice" class="item-price">$0.00</span>
            </div>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="cancel-btn" onclick="closeModal()">Cancel</button>
        <button class="confirm-btn" onclick="addSpawnOrderToCart()">Add to Cart</button>
    `;
    document.getElementById('orderModal').style.display = 'flex';
}

function updateSpawnQty(type, delta) {
    const newQty = Math.max(0, spawnQuantities[type] + delta);
    spawnQuantities[type] = newQty;
    
    const qtyElem = document.getElementById(`${type}Qty`);
    const priceElem = document.getElementById(`${type}Price`);
    if (qtyElem) qtyElem.textContent = newQty;
    if (priceElem) {
        const price = newQty * (type === 'shundo' ? 5 : type === 'hundo' ? 3 : 2);
        priceElem.textContent = `$${price.toFixed(2)}`;
    }
}

function addSpawnOrderToCart() {
    const { shundo, hundo, shiny } = spawnQuantities;
    
    if (shundo > 0) {
        addToCart({ type: 'shundo', pokemonName: currentSpawnPokemon.name, pokemonId: currentSpawnPokemon.id, quantity: shundo, price: shundo * 5 });
    }
    if (hundo > 0) {
        addToCart({ type: 'hundo', pokemonName: currentSpawnPokemon.name, pokemonId: currentSpawnPokemon.id, quantity: hundo, price: hundo * 3 });
    }
    if (shiny > 0) {
        addToCart({ type: 'shiny', pokemonName: currentSpawnPokemon.name, pokemonId: currentSpawnPokemon.id, quantity: shiny, price: shiny * 2 });
    }
    
    closeModal();
    showToast('Added to cart!');
}

// ========== RAID FUNCTIONS ==========

async function loadRaids() {
    const container = document.getElementById('raidsList');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading raids...</div>';
    
    const raidData = await fetchAllRaids();
    if (!raidData) {
        container.innerHTML = '<div class="loading">Failed to load raids</div>';
        return;
    }
    
    const { scrapedRaids, dynaRaids } = raidData;
    console.log('=== ALL SCRAPED RAIDS ===');
    for (const raid of scrapedRaids) {
    if (raid.name.toLowerCase().includes('shadow')) {
        console.log(`Shadow Raid: ${raid.name} | Tier: "${raid.tier}"`);
    }
}
    
    // Initialize all categories
    const regularRaids = {
        tier6: [], tier5: [], tier4: [], tier3: [], tier2: [], tier1: [],
        mega: [], shadow5: [], shadow3: [], shadow1: []
    };
    
    for (const raid of scrapedRaids) {
    const tier = raid.tier;
    const name = raid.name;
    const id = await getPokemonIdFromName(name);
    
    const raidObj = { 
        name: name, 
        tier: tier, 
        id: id, 
        isShiny: raid.canBeShiny, 
        image: raid.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`
    };
    
    // Convert to lowercase for easier checking
    const tierLower = tier.toLowerCase();
    const nameLower = name.toLowerCase();
    
    // Check for Shadow FIRST (before star checks)
    if (nameLower.includes('shadow') || tierLower.includes('shadow')) {
        if (tierLower.includes('5-star') || tierLower.includes('legendary') || nameLower.includes('latias') || nameLower.includes('latios')) {
            regularRaids.shadow5.push(raidObj);
        } else if (tierLower.includes('3-star')) {
            regularRaids.shadow3.push(raidObj);
        } else if (tierLower.includes('1-star')) {
            regularRaids.shadow1.push(raidObj);
        } else {
            // Default shadow to appropriate tier based on name
            if (nameLower.includes('latias') || nameLower.includes('latios') || nameLower.includes('mewtwo') || nameLower.includes('lugia')) {
                regularRaids.shadow5.push(raidObj);
            } else if (nameLower.includes('metagross') || nameLower.includes('salamence')) {
                regularRaids.shadow3.push(raidObj);
            } else {
                regularRaids.shadow1.push(raidObj);
            }
        }
    }
    // Check for Mega
    else if (tierLower.includes('mega')) {
        regularRaids.mega.push(raidObj);
    }
    // Check for regular tiers (non-shadow)
    else if (tierLower.includes('6-star')) {
        regularRaids.tier6.push(raidObj);
    }
    else if (tierLower.includes('5-star')) {
        regularRaids.tier5.push(raidObj);
    }
    else if (tierLower.includes('4-star')) {
        regularRaids.tier4.push(raidObj);
    }
    else if (tierLower.includes('3-star')) {
        regularRaids.tier3.push(raidObj);
    }
    else if (tierLower.includes('2-star')) {
        regularRaids.tier2.push(raidObj);
    }
    else if (tierLower.includes('1-star')) {
        regularRaids.tier1.push(raidObj);
        }
    }
    
    // Process Dynamax raids from your GitHub JSON
    const dynamaxRaids = [];
    const tierMapping = {
        'dynamax_tier1': '⚡ DYNAMAX TIER 1',
        'dynamax_tier2': '⚡⚡ DYNAMAX TIER 2',
        'dynamax_tier3': '⚡⚡⚡ DYNAMAX TIER 3',
        'dynamax_tier4': '⚡⚡⚡⚡ DYNAMAX TIER 4',
        'dynamax_tier5': '⚡⚡⚡⚡⚡ DYNAMAX TIER 5',
        'gigantamax': '💥 GIGANTAMAX'
    };
    
    // Filter out invalid names
    const invalidNames = ['bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire', 'flying', 'ghost', 'grass', 'ground', 'ice', 'normal', 'poison', 'psychic', 'rock', 'steel', 'water', 'Search...', 'Telegram', 'Facebook', 'Instagram', 'Discord'];
    
    for (const [key, title] of Object.entries(tierMapping)) {
        if (dynaRaids[key] && dynaRaids[key].length > 0) {
            for (const name of dynaRaids[key]) {
                // Skip invalid names
                if (!name || name.length < 2) continue;
                if (invalidNames.includes(name)) continue;
                if (invalidNames.includes(name.toLowerCase())) continue;
                
                const id = await getPokemonIdFromName(name);
                dynamaxRaids.push({
                    name: name,
                    tier: title,
                    id: id,
                    isShiny: true,
                    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`
                });
            }
        }
    }
    
    displayRaids(regularRaids, dynamaxRaids);
}

function displayRaids(regularRaids, dynamaxRaids) {
    const container = document.getElementById('raidsList');
    if (!container) return;
    
    // Define correct order exactly like Android app
    const categoryOrder = [
        { key: 'tier6', title: '⭐⭐⭐⭐⭐⭐ 6-STAR RAIDS' },
        { key: 'tier5', title: '⭐⭐⭐⭐⭐ 5-STAR RAIDS' },
        { key: 'tier4', title: '⭐⭐⭐⭐ 4-STAR RAIDS' },
        { key: 'tier3', title: '⭐⭐⭐ 3-STAR RAIDS' },
        { key: 'tier2', title: '⭐⭐ 2-STAR RAIDS' },
        { key: 'tier1', title: '⭐ 1-STAR RAIDS' },
        { key: 'mega', title: '🔴 MEGA RAIDS' },
        { key: 'shadow5', title: '🌑 SHADOW LEGENDARY (5-STAR)' },
        { key: 'shadow3', title: '🌑 SHADOW 3-STAR RAIDS' },
        { key: 'shadow1', title: '🌑 SHADOW 1-STAR RAIDS' }
    ];
    
    // Dynamax order
    const dynaOrder = [
        { key: 'dynamax_tier5', title: '⚡⚡⚡⚡⚡ DYNAMAX TIER 5' },
        { key: 'dynamax_tier4', title: '⚡⚡⚡⚡ DYNAMAX TIER 4' },
        { key: 'dynamax_tier3', title: '⚡⚡⚡ DYNAMAX TIER 3' },
        { key: 'dynamax_tier2', title: '⚡⚡ DYNAMAX TIER 2' },
        { key: 'dynamax_tier1', title: '⚡ DYNAMAX TIER 1' },
        { key: 'gigantamax', title: '💥 GIGANTAMAX' }
    ];
    
    let html = '';
    
    // Add regular raids in correct order
    for (const cat of categoryOrder) {
        if (regularRaids[cat.key] && regularRaids[cat.key].length > 0) {
            html += `
                <div class="raid-header">
                    <h4>${cat.title}</h4>
                </div>
                <div class="raids-grid">
                    ${regularRaids[cat.key].map(r => `
                        <div class="raid-card" onclick='showRaidOrderDialog(${JSON.stringify(r).replace(/'/g, "&#39;")})'>
                            <img src="${r.image}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'">
                            <span>${r.name}${r.isShiny ? ' ✨' : ''}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }
    
    // Group dynamax raids by tier
    const dynaByTier = {};
    for (const raid of dynamaxRaids) {
        // Skip "Search..." from Gigantamax
        if (raid.name === 'Search...') continue;
        if (!dynaByTier[raid.tier]) dynaByTier[raid.tier] = [];
        dynaByTier[raid.tier].push(raid);
    }
    
    // Add Dynamax/Gigantamax in correct order
    for (const dyna of dynaOrder) {
        if (dynaByTier[dyna.title] && dynaByTier[dyna.title].length > 0) {
            html += `
                <div class="raid-header">
                    <h4>${dyna.title}</h4>
                </div>
                <div class="raids-grid">
                    ${dynaByTier[dyna.title].map(r => `
                        <div class="raid-card" onclick='showDynamaxOrderDialog(${JSON.stringify(r).replace(/'/g, "&#39;")})'>
                            <img src="${r.image}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'">
                            <span>${r.name}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }
    
    if (html === '') {
        html = '<div class="loading">No raids available</div>';
    }
    
    container.innerHTML = html;
}

let selectedRaidPack = { quantity: 0, price: 0 };
let currentRaid = null;
let dynamaxQuantity = 0;

function showRaidOrderDialog(raid) {
    currentRaid = raid;
    selectedRaidPack = { quantity: 0, price: 0 };
    
    document.getElementById('modalTitle').textContent = `Order ${raid.name} Raids`;
    document.getElementById('modalBody').innerHTML = `
        <div class="order-stats">
            <div>Tier: ${raid.tier}</div>
            <div>Shiny Available: ${raid.isShiny ? '✨ Yes' : '❌ No'}</div>
        </div>
        
        <div class="order-section">
            <div class="section-title">📦 RAID PACKS</div>
            <div class="raid-packs">
                <button class="pack-btn" onclick="selectRaidPack(10, 7)">10 Raids - $7</button>
                <button class="pack-btn" onclick="selectRaidPack(20, 12)">20 Raids - $12</button>
                <button class="pack-btn" onclick="selectRaidPack(50, 20)">50 Raids - $20</button>
            </div>
            <div id="raidSelectedInfo" style="margin-top: 12px; text-align: center;"></div>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="cancel-btn" onclick="closeModal()">Cancel</button>
        <button class="confirm-btn" onclick="addRaidToCart()">Add to Cart</button>
    `;
    document.getElementById('orderModal').style.display = 'flex';
}

function selectRaidPack(quantity, price) {
    selectedRaidPack = { quantity, price };
    document.getElementById('raidSelectedInfo').innerHTML = `Selected: ${quantity} Raids - $${price}`;
}

function addRaidToCart() {
    if (selectedRaidPack.quantity === 0) {
        showToast('Please select a raid pack');
        return;
    }
    addToCart({ type: 'raid', pokemonName: currentRaid.name, raidTier: currentRaid.tier, pokemonId: currentRaid.id, quantity: selectedRaidPack.quantity, price: selectedRaidPack.price });
    closeModal();
}

function showDynamaxOrderDialog(raid) {
    currentRaid = raid;
    dynamaxQuantity = 0;
    
    document.getElementById('modalTitle').textContent = `Order ${raid.name}`;
    document.getElementById('modalBody').innerHTML = `
        <div class="order-stats">
            <div>Tier: ${raid.tier}</div>
        </div>
        
        <div class="order-section">
            <div class="section-title">⚡ SELECT QUANTITY (4 for $10 or $2.50 each)</div>
            <div class="quantity-selector">
                <button class="qty-btn" onclick="updateDynamaxQty(-1)">-</button>
                <span id="dynamaxQty" class="qty-num">0</span>
                <button class="qty-btn" onclick="updateDynamaxQty(1)">+</button>
                <span id="dynamaxPrice" class="item-price">$0.00</span>
            </div>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="cancel-btn" onclick="closeModal()">Cancel</button>
        <button class="confirm-btn" onclick="addDynamaxToCart()">Add to Cart</button>
    `;
    document.getElementById('orderModal').style.display = 'flex';
}

function updateDynamaxQty(delta) {
    const newQty = Math.max(0, dynamaxQuantity + delta);
    dynamaxQuantity = newQty;
    const qtyElem = document.getElementById('dynamaxQty');
    const priceElem = document.getElementById('dynamaxPrice');
    if (qtyElem) qtyElem.textContent = newQty;
    if (priceElem) {
        const price = Math.floor(newQty / 4) * 10 + (newQty % 4) * 2.5;
        priceElem.textContent = `$${price.toFixed(2)}`;
    }
}

function addDynamaxToCart() {
    if (dynamaxQuantity === 0) {
        showToast('Please select a quantity');
        return;
    }
    const price = Math.floor(dynamaxQuantity / 4) * 10 + (dynamaxQuantity % 4) * 2.5;
    addToCart({ type: 'dynamax', pokemonName: currentRaid.name, raidTier: currentRaid.tier, pokemonId: currentRaid.id, quantity: dynamaxQuantity, price: price });
    closeModal();
}

// ========== EVENT FUNCTIONS ==========

async function loadEvents() {
    const events = await fetchEvents();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const currentEvents = [];
    const upcomingEvents = [];
    
    for (const event of events) {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        startDate.setHours(0, 0, 0, 0);
        
        if (startDate <= now && endDate >= now) {
            currentEvents.push(event);
        } else if (startDate > now) {
            upcomingEvents.push(event);
        }
    }
    
    const currentContainer = document.getElementById('currentEventsList');
    if (currentContainer) {
        if (currentEvents.length === 0) {
            currentContainer.innerHTML = '<div class="loading">No current events</div>';
        } else {
            currentContainer.innerHTML = currentEvents.map(e => `
                <div class="event-card">
                    <div class="event-title">${e.name}</div>
                    <div class="event-date">🟢 ${new Date(e.start).toLocaleString()}</div>
                    <div class="event-date">🔴 ${new Date(e.end).toLocaleString()}</div>
                    <a href="${e.link}" target="_blank" class="event-link">🔗 View Event →</a>
                </div>
            `).join('');
        }
    }
    
    const upcomingContainer = document.getElementById('upcomingEventsList');
    if (upcomingContainer) {
        if (upcomingEvents.length === 0) {
            upcomingContainer.innerHTML = '<div class="loading">No upcoming events</div>';
        } else {
            upcomingContainer.innerHTML = upcomingEvents.map(e => `
                <div class="event-card">
                    <div class="event-title">${e.name}</div>
                    <div class="event-date">🟢 Starts: ${new Date(e.start).toLocaleString()}</div>
                    <div class="event-date">🔴 Ends: ${new Date(e.end).toLocaleString()}</div>
                    <a href="${e.link}" target="_blank" class="event-link">🔗 View Event →</a>
                    <button class="rsvp-btn" onclick='showRSVPDialog("${e.name}", "${e.link}", "${new Date(e.start).toLocaleString()}", "${new Date(e.end).toLocaleString()}")'>📝 RSVP</button>
                </div>
            `).join('');
        }
    }
}

function showRSVPDialog(eventName, eventLink, startDate, endDate) {
    document.getElementById('modalTitle').textContent = `RSVP for ${eventName}`;
    document.getElementById('modalBody').innerHTML = `
        <input type="text" id="rsvpName" placeholder="Your Name *" class="rsvp-input">
        <input type="text" id="rsvpIgn" placeholder="In-Game Name *" class="rsvp-input">
        <div class="admin-select">
            <button class="admin-option dan" onclick='submitRSVP("${eventName}", "${eventLink}", "${startDate}", "${endDate}", "Dan")'>Dan (Skatecrete)</button>
            <button class="admin-option kingi" onclick='submitRSVP("${eventName}", "${eventLink}", "${startDate}", "${endDate}", "Kingi")'>Kingi (zEViLvSTON4z)</button>
            <button class="admin-option thomas" onclick='submitRSVP("${eventName}", "${eventLink}", "${startDate}", "${endDate}", "Thomas")'>Thomas (RampageGamer)</button>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = '';
    document.getElementById('orderModal').style.display = 'flex';
}

function submitRSVP(eventName, eventLink, startDate, endDate, admin) {
    const name = document.getElementById('rsvpName')?.value.trim();
    const ign = document.getElementById('rsvpIgn')?.value.trim();
    
    if (!name || !ign) {
        showToast('Please enter your name and in-game name');
        return;
    }
    
    showToast(`RSVP sent to ${admin}! They will contact you.`);
    closeModal();
}

// ========== ORDER CHECKOUT ==========

function showCustomerDialog() {
    document.getElementById('modalTitle').textContent = 'Who are you?!';
    document.getElementById('modalBody').innerHTML = `
        <input type="text" id="customerName" placeholder="Your Name *" class="rsvp-input" value="${customerName}">
        <input type="text" id="customerIgn" placeholder="In-Game Name (PoGo Name) *" class="rsvp-input" value="${customerIgn}">
        <div class="disclaimer">*Timed Events cannot have a predetermined time slot</div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="cancel-btn" onclick="closeModal()">Cancel</button>
        <button class="confirm-btn" onclick="saveCustomerInfo()">Save</button>
    `;
    document.getElementById('orderModal').style.display = 'flex';
}

function saveCustomerInfo() {
    const name = document.getElementById('customerName')?.value.trim();
    const ign = document.getElementById('customerIgn')?.value.trim();
    
    if (!name || !ign) {
        showToast('Please enter both name and in-game name');
        return;
    }
    
    customerName = name;
    customerIgn = ign;
    closeModal();
    showAdminSelection();
}

function showAdminSelection() {
    document.getElementById('modalTitle').textContent = 'Choose Your Admin';
    document.getElementById('modalBody').innerHTML = `
        <div class="admin-select">
            <button class="admin-option dan" onclick="selectAdminAndPay('Dan')">Dan (Skatecrete)</button>
            <button class="admin-option kingi" onclick="selectAdminAndPay('Kingi')">Kingi (zEViLvSTON4z)</button>
            <button class="admin-option thomas" onclick="selectAdminAndPay('Thomas')">Thomas (RampageGamer)</button>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = '';
    document.getElementById('orderModal').style.display = 'flex';
}

function selectAdminAndPay(admin) {
    selectedAdmin = admin;
    const total = getCartTotal();
    
    let paymentHtml = '';
    if (admin === 'Dan') {
        paymentHtml = `
            <div class="payment-option">
                <strong>💰 PayPal</strong>
                <a href="https://paypal.me/danstudz" target="_blank">Pay with PayPal</a>
                <div class="disclaimer-small">⚠️ Please send with Friends and Family option</div>
            </div>
            <div class="payment-option">
                <strong>💚 CashApp</strong>
                <a href="https://cash.app/\$DanStudz" target="_blank">Pay with CashApp</a>
            </div>
            <div class="payment-option">
                <strong>💙 Venmo</strong>
                <a href="https://venmo.com/DanStudz" target="_blank">Pay with Venmo</a>
            </div>
        `;
    } else if (admin === 'Thomas') {
        paymentHtml = `
            <div class="payment-option">
                <strong>💰 PayPal</strong>
                <a href="https://www.paypal.me/Thomas061298" target="_blank">Pay with PayPal</a>
                <div class="disclaimer-small">⚠️ Please send with Friends and Family option</div>
            </div>
        `;
    } else {
        paymentHtml = `
            <div class="payment-option">
                <strong>⏳ Payment Options Coming Soon</strong>
                <div class="disclaimer-small">Please contact Kingi directly for payment options</div>
            </div>
        `;
    }
    
    document.getElementById('modalTitle').textContent = 'Complete Order';
    document.getElementById('modalBody').innerHTML = `
        <div class="order-summary" style="background:#0d0d1a;padding:12px;border-radius:12px;margin-bottom:16px;">
            <strong>Customer:</strong> ${customerName} (${customerIgn})<br>
            <strong>Admin:</strong> ${admin}<br>
            <strong>Total:</strong> $${total.toFixed(2)}
        </div>
        ${paymentHtml}
        <div class="disclaimer">Once payment is received, your order will be placed in queue 🧙</div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="cancel-btn" onclick="closeModal()">Cancel</button>
        <button class="confirm-btn" onclick="submitOrder()">Submit Order</button>
    `;
    document.getElementById('orderModal').style.display = 'flex';
}

function submitOrder() {
    showToast('Order submitted! You gained Aura 😎');
    clearCart();
    closeModal();
}

function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// ========== TAB SWITCHING ==========
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        if (tabId === 'spawns' && allPokemon.length === 0) loadSpawns();
        if (tabId === 'raids') loadRaids();
        if (tabId === 'current' || tabId === 'upcoming') loadEvents();
    });
});

// Initial load
loadSpawns();
