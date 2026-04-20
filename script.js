// ========== GLOBAL VARIABLES ==========
let allPokemon = [];
let cartItems = [];
let customerName = '';
let customerIgn = '';
let selectedAdmin = '';
let filters = { shundo: false, shiny164: false, regional: false, pvp: false };
let currentSearch = '';
let currentDebutData = null;

// Apps Script URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx6i6Yn7ezXqwJKgZF3Mbq_MbgNeb4mQ8weT0Qipu0c9ASFRVK6l-HIdH83xFbJOeI4/exec';

// Pricing cache
let pricingCache = {};
let coinPrices = { 5600: 24, 15500: 45, 31000: 85 };

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadSpawns();
    loadRaids();
    loadEvents();
    loadPricing();
    setupTabListeners();
});

function setupTabListeners() {
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
}

// ========== PRICING ==========
async function loadPricing() {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'getPricing' })
        });
        const data = await response.json();
        if (data.status === 'success' && data.prices) {
            pricingCache = data.prices;
            coinPrices = {
                5600: parseFloat(data.prices['Coins_5600'] || 24),
                15500: parseFloat(data.prices['Coins_15500'] || 45),
                31000: parseFloat(data.prices['Coins_31000'] || 85)
            };
            updateCoinPriceDisplay();
        }
    } catch (e) {
        console.error('Error loading pricing:', e);
    }
}

function updateCoinPriceDisplay() {
    const price5600 = document.getElementById('coinPrice5600');
    const price15500 = document.getElementById('coinPrice15500');
    const price31000 = document.getElementById('coinPrice31000');
    if (price5600) price5600.textContent = coinPrices[5600];
    if (price15500) price15500.textContent = coinPrices[15500];
    if (price31000) price31000.textContent = coinPrices[31000];
}

// ========== SPAWNS ==========
async function loadSpawns() {
    const container = document.getElementById('spawnsList');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading spawns...</div>';
    
    try {
        const response = await fetch('https://shungo.app/api/shungo/data/spawns');
        const data = await response.json();
        const spawnData = data.result || [];
        
        const pokemonList = [];
        for (let i = 0; i < Math.min(spawnData.length, 200); i++) {
            const item = spawnData[i];
            const pokedexId = item[0];
            const spawnRate = item[2];
            const isShiny = item[3];
            
            const name = await getPokemonName(pokedexId);
            const isPermaboosted = [144,145,146,150,243,244,245,249,250,251,380,381,382,383,384,480,481,482,483,484,485,486,487,488,785,786,787,788,888,889,894,895].includes(pokedexId);
            
            pokemonList.push({
                id: pokedexId,
                name: name,
                spawnRate: spawnRate,
                isShiny: isShiny,
                shinyRate: isShiny ? (isPermaboosted ? '✨ 1/64' : '✨ 1/512') : '❌ Not available',
                isRegional: isRegionalPokemon(name),
                isTopPvP: isTopPvPPokemon(name)
            });
        }
        
        pokemonList.sort((a, b) => b.spawnRate - a.spawnRate);
        allPokemon = pokemonList;
        displaySpawns();
    } catch (e) {
        container.innerHTML = '<div class="loading">Failed to load spawns</div>';
    }
}

function isRegionalPokemon(name) {
    const regionals = ['Farfetch\'d', 'Kangaskhan', 'Mr. Mime', 'Tauros', 'Corsola', 'Heracross', 'Illumise', 'Lunatone', 'Relicanth', 'Seviper', 'Solrock', 'Torkoal', 'Tropius', 'Volbeat', 'Zangoose', 'Carnivine', 'Chatot', 'Pachirisu', 'Shellos', 'Maractus', 'Sigilyph', 'Hawlucha', 'Klefki', 'Comfey', 'Stonjourner'];
    return regionals.some(r => name.includes(r));
}

function isTopPvPPokemon(name) {
    const pvpPokemon = ['Aegislash', 'Carbink', 'Giratina', 'Zygarde', 'Clodsire', 'Registeel', 'Azumarill', 'Lucario', 'Altaria', 'Cresselia', 'Forretress', 'Tentacruel', 'Moltres', 'Jellicent', 'Cobalion', 'Regidrago', 'Dialga', 'Metagross', 'Garchomp', 'Snorlax'];
    return pvpPokemon.some(p => name.includes(p));
}

async function getPokemonName(id) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`);
        const data = await response.json();
        const englishName = data.names.find(n => n.language.name === 'en');
        return englishName ? englishName.name : `Pokemon #${id}`;
    } catch {
        return `Pokemon #${id}`;
    }
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
    if (filters.regional) {
        filtered = filtered.filter(p => p.isRegional);
    }
    if (filters.pvp) {
        filtered = filtered.filter(p => p.isTopPvP);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading">No spawns found</div>';
        return;
    }
    
    container.innerHTML = filtered.map(p => {
        let badgeClass = '', badgeText = '';
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
                        ${p.isRegional ? '<span style="background:#2196F3;font-size:10px;padding:2px 6px;border-radius:12px;margin-left:4px;">🌍 Regional</span>' : ''}
                        ${p.isTopPvP ? '<span style="background:#F44336;font-size:10px;padding:2px 6px;border-radius:12px;margin-left:4px;">🏆 PvP</span>' : ''}
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
    btn.classList.toggle('active');
    displaySpawns();
}

// ========== SPAWN ORDER DIALOG ==========
let currentSpawnPokemon = null;
let spawnQuantities = { shundo: 0, hundo: 0, shiny: 0 };

function showSpawnOrderDialog(pokemon) {
    currentSpawnPokemon = pokemon;
    spawnQuantities = { shundo: 0, hundo: 0, shiny: 0 };
    
    const shundoPrice = pricingCache['Spawn_Shundo'] || 5;
    const hundoPrice = pricingCache['Spawn_Hundo'] || 3;
    const shinyPrice = pricingCache['Spawn_Shiny'] || 2;
    
    document.getElementById('modalTitle').textContent = `Order ${pokemon.name}`;
    document.getElementById('modalBody').innerHTML = `
        <div class="order-stats">
            <div>Spawn Rate: ${pokemon.spawnRate.toFixed(2)}%</div>
            <div>Shiny: ${pokemon.shinyRate}</div>
        </div>
        
        ${pokemon.spawnRate >= 0.65 && pokemon.isShiny ? `
        <div class="order-section">
            <div class="section-title">✨ SHUNDO (100% IV + SHINY) - $${shundoPrice} EACH</div>
            <div class="quantity-selector">
                <button class="qty-btn" onclick="updateSpawnQty('shundo', -1)">-</button>
                <span id="shundoQty" class="qty-num">0</span>
                <button class="qty-btn" onclick="updateSpawnQty('shundo', 1)">+</button>
                <span id="shundoPrice" class="item-price">$0.00</span>
            </div>
        </div>
        ` : ''}
        
        <div class="order-section">
            <div class="section-title">💯 HUNDO (100% IV) - $${hundoPrice} EACH</div>
            <div class="quantity-selector">
                <button class="qty-btn" onclick="updateSpawnQty('hundo', -1)">-</button>
                <span id="hundoQty" class="qty-num">0</span>
                <button class="qty-btn" onclick="updateSpawnQty('hundo', 1)">+</button>
                <span id="hundoPrice" class="item-price">$0.00</span>
            </div>
        </div>
        
        <div class="order-section">
            <div class="section-title">✨ SHINY (Random IVs) - $${shinyPrice} EACH</div>
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
    
    const priceMap = { shundo: pricingCache['Spawn_Shundo'] || 5, hundo: pricingCache['Spawn_Hundo'] || 3, shiny: pricingCache['Spawn_Shiny'] || 2 };
    
    const qtyElem = document.getElementById(`${type}Qty`);
    const priceElem = document.getElementById(`${type}Price`);
    if (qtyElem) qtyElem.textContent = newQty;
    if (priceElem) {
        const price = newQty * priceMap[type];
        priceElem.textContent = `$${price.toFixed(2)}`;
    }
}

function addSpawnOrderToCart() {
    const { shundo, hundo, shiny } = spawnQuantities;
    
    if (shundo > 0) {
        addToCart({ type: 'shundo', pokemonName: currentSpawnPokemon.name, quantity: shundo, price: shundo * (pricingCache['Spawn_Shundo'] || 5) });
    }
    if (hundo > 0) {
        addToCart({ type: 'hundo', pokemonName: currentSpawnPokemon.name, quantity: hundo, price: hundo * (pricingCache['Spawn_Hundo'] || 3) });
    }
    if (shiny > 0) {
        addToCart({ type: 'shiny', pokemonName: currentSpawnPokemon.name, quantity: shiny, price: shiny * (pricingCache['Spawn_Shiny'] || 2) });
    }
    
    closeModal();
    showToast('Added to cart!');
}

// ========== RAIDS ==========
async function loadRaids() {
    const container = document.getElementById('raidsList');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading raids...</div>';
    
    try {
        const [scrapedResponse, dynaResponse] = await Promise.all([
            fetch('https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.min.json'),
            fetch('https://raw.githubusercontent.com/Skatecrete/pogo-raid-data/main/current_raids.json')
        ]);
        
        const scrapedRaids = await scrapedResponse.json();
        const dynaRaids = await dynaResponse.json();
        
        const regularRaids = { tier6: [], tier5: [], tier4: [], tier3: [], tier2: [], tier1: [], mega: [], shadow5: [], shadow3: [], shadow1: [] };
        
        for (const raid of scrapedRaids) {
            const tier = raid.tier;
            const name = raid.name;
            const id = await getPokemonIdFromName(name);
            const raidObj = { name, tier, id, isShiny: raid.canBeShiny, image: raid.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png` };
            
            const tierLower = tier.toLowerCase();
            const nameLower = name.toLowerCase();
            
            if (nameLower.includes('shadow') || tierLower.includes('shadow')) {
                if (tierLower.includes('5-star') || tierLower.includes('legendary') || nameLower.includes('latias') || nameLower.includes('latios')) {
                    regularRaids.shadow5.push(raidObj);
                } else if (tierLower.includes('3-star')) {
                    regularRaids.shadow3.push(raidObj);
                } else {
                    regularRaids.shadow1.push(raidObj);
                }
            } else if (tierLower.includes('mega')) {
                regularRaids.mega.push(raidObj);
            } else if (tierLower.includes('6-star')) {
                regularRaids.tier6.push(raidObj);
            } else if (tierLower.includes('5-star')) {
                regularRaids.tier5.push(raidObj);
            } else if (tierLower.includes('4-star')) {
                regularRaids.tier4.push(raidObj);
            } else if (tierLower.includes('3-star')) {
                regularRaids.tier3.push(raidObj);
            } else if (tierLower.includes('2-star')) {
                regularRaids.tier2.push(raidObj);
            } else if (tierLower.includes('1-star')) {
                regularRaids.tier1.push(raidObj);
            }
        }
        
        const dynamaxRaids = [];
        const tierMapping = {
            'dynamax_tier1': '⚡ DYNAMAX TIER 1', 'dynamax_tier2': '⚡⚡ DYNAMAX TIER 2', 'dynamax_tier3': '⚡⚡⚡ DYNAMAX TIER 3',
            'dynamax_tier4': '⚡⚡⚡⚡ DYNAMAX TIER 4', 'dynamax_tier5': '⚡⚡⚡⚡⚡ DYNAMAX TIER 5', 'gigantamax': '💥 GIGANTAMAX'
        };
        
        const invalidNames = ['bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire', 'flying', 'ghost', 'grass', 'ground', 'ice', 'normal', 'poison', 'psychic', 'rock', 'steel', 'water', 'Search...'];
        
        for (const [key, title] of Object.entries(tierMapping)) {
            if (dynaRaids[key] && dynaRaids[key].length) {
                for (const name of dynaRaids[key]) {
                    if (!name || name.length < 2 || invalidNames.includes(name) || invalidNames.includes(name.toLowerCase())) continue;
                    const id = await getPokemonIdFromName(name);
                    dynamaxRaids.push({ name, tier: title, id, isShiny: true, image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png` });
                }
            }
        }
        
        displayRaids(regularRaids, dynamaxRaids);
    } catch (e) {
        container.innerHTML = '<div class="loading">Failed to load raids</div>';
    }
}

async function getPokemonIdFromName(name) {
    const cleanName = name.replace('Shadow ', '').replace('Mega ', '').replace('D-Max ', '').trim().toLowerCase();
    const simpleMap = { 'dratini': 147, 'gligar': 207, 'cacnea': 331, 'joltik': 595, 'lapras': 131, 'stantler': 234, 'latios': 381, 'latias': 380 };
    if (simpleMap[cleanName]) return simpleMap[cleanName];
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${cleanName}`);
        const data = await response.json();
        return data.id;
    } catch {
        return 25;
    }
}

function displayRaids(regularRaids, dynamaxRaids) {
    const container = document.getElementById('raidsList');
    if (!container) return;
    
    const categoryOrder = [
        { key: 'tier6', title: '⭐⭐⭐⭐⭐⭐ 6-STAR RAIDS' }, { key: 'tier5', title: '⭐⭐⭐⭐⭐ 5-STAR RAIDS' },
        { key: 'tier4', title: '⭐⭐⭐⭐ 4-STAR RAIDS' }, { key: 'tier3', title: '⭐⭐⭐ 3-STAR RAIDS' },
        { key: 'tier2', title: '⭐⭐ 2-STAR RAIDS' }, { key: 'tier1', title: '⭐ 1-STAR RAIDS' },
        { key: 'mega', title: '🔴 MEGA RAIDS' }, { key: 'shadow5', title: '🌑 SHADOW LEGENDARY (5-STAR)' },
        { key: 'shadow3', title: '🌑 SHADOW 3-STAR RAIDS' }, { key: 'shadow1', title: '🌑 SHADOW 1-STAR RAIDS' }
    ];
    
    const dynaOrder = [
        { key: 'dynamax_tier5', title: '⚡⚡⚡⚡⚡ DYNAMAX TIER 5' }, { key: 'dynamax_tier4', title: '⚡⚡⚡⚡ DYNAMAX TIER 4' },
        { key: 'dynamax_tier3', title: '⚡⚡⚡ DYNAMAX TIER 3' }, { key: 'dynamax_tier2', title: '⚡⚡ DYNAMAX TIER 2' },
        { key: 'dynamax_tier1', title: '⚡ DYNAMAX TIER 1' }, { key: 'gigantamax', title: '💥 GIGANTAMAX' }
    ];
    
    let html = '';
    
    for (const cat of categoryOrder) {
        if (regularRaids[cat.key] && regularRaids[cat.key].length) {
            html += `<div class="raid-header"><h4>${cat.title}</h4></div><div class="raids-grid">`;
            html += regularRaids[cat.key].map(r => `
                <div class="raid-card" onclick='showRaidOrderDialog(${JSON.stringify(r).replace(/'/g, "&#39;")})'>
                    <div class="raid-image-container">
                        ${r.name.includes('Shadow') ? '<div class="shadow-underlay"></div>' : ''}
                        ${r.tier.includes('Dynamax') || r.tier.includes('Gigantamax') ? '<div class="dynamax-underlay"></div>' : ''}
                        <img src="${r.image}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'">
                    </div>
                    <span>${r.name}${r.isShiny ? ' ✨' : ''}</span>
                </div>
            `).join('');
            html += `</div>`;
        }
    }
    
    const dynaByTier = {};
    for (const raid of dynamaxRaids) {
        if (!dynaByTier[raid.tier]) dynaByTier[raid.tier] = [];
        dynaByTier[raid.tier].push(raid);
    }
    
    for (const dyna of dynaOrder) {
        if (dynaByTier[dyna.title] && dynaByTier[dyna.title].length) {
            html += `<div class="raid-header"><h4>${dyna.title}</h4></div><div class="raids-grid">`;
            html += dynaByTier[dyna.title].map(r => `
                <div class="raid-card" onclick='showDynamaxOrderDialog(${JSON.stringify(r).replace(/'/g, "&#39;")})'>
                    <div class="raid-image-container">
                        <div class="dynamax-underlay"></div>
                        <img src="${r.image}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'">
                    </div>
                    <span>${r.name}</span>
                </div>
            `).join('');
            html += `</div>`;
        }
    }
    
    container.innerHTML = html || '<div class="loading">No raids available</div>';
}

// ========== RAID ORDER DIALOGS ==========
let selectedRaidPack = { quantity: 0, price: 0 };
let currentRaid = null;
let dynamaxQuantity = 0;

function showRaidOrderDialog(raid) {
    currentRaid = raid;
    selectedRaidPack = { quantity: 0, price: 0 };
    
    document.getElementById('modalTitle').textContent = `Order ${raid.name} Raids`;
    document.getElementById('modalBody').innerHTML = `
        <div class="order-stats"><div>Tier: ${raid.tier}</div><div>Shiny Available: ${raid.isShiny ? '✨ Yes' : '❌ No'}</div></div>
        <div class="order-section">
            <div class="section-title">📦 RAID PACKS</div>
            <div class="raid-packs">
                <button class="pack-btn" onclick="selectRaidPack(10, ${pricingCache['Raid_Normal_10'] || 7})">10 Raids - $${pricingCache['Raid_Normal_10'] || 7}</button>
                <button class="pack-btn" onclick="selectRaidPack(20, ${pricingCache['Raid_Normal_20'] || 12})">20 Raids - $${pricingCache['Raid_Normal_20'] || 12}</button>
                <button class="pack-btn" onclick="selectRaidPack(50, ${pricingCache['Raid_Normal_50'] || 20})">50 Raids - $${pricingCache['Raid_Normal_50'] || 20}</button>
            </div>
            <div id="raidSelectedInfo" style="margin-top:12px;text-align:center"></div>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = `<button class="cancel-btn" onclick="closeModal()">Cancel</button><button class="confirm-btn" onclick="addRaidToCart()">Add to Cart</button>`;
    document.getElementById('orderModal').style.display = 'flex';
}

function selectRaidPack(quantity, price) {
    selectedRaidPack = { quantity, price };
    document.getElementById('raidSelectedInfo').innerHTML = `Selected: ${quantity} Raids - $${price}`;
}

function addRaidToCart() {
    if (!selectedRaidPack.quantity) { showToast('Please select a raid pack'); return; }
    addToCart({ type: 'raid', pokemonName: currentRaid.name, raidTier: currentRaid.tier, quantity: selectedRaidPack.quantity, price: selectedRaidPack.price });
    closeModal();
}

function showDynamaxOrderDialog(raid) {
    currentRaid = raid;
    dynamaxQuantity = 0;
    
    document.getElementById('modalTitle').textContent = `Order ${raid.name}`;
    document.getElementById('modalBody').innerHTML = `
        <div class="order-stats"><div>Tier: ${raid.tier}</div></div>
        <div class="order-section">
            <div class="section-title">⚡ SELECT QUANTITY (4 for $${pricingCache['Raid_Dynamax_4'] || 10} or $${pricingCache['Raid_Dynamax_Single'] || 2.50} each)</div>
            <div class="quantity-selector">
                <button class="qty-btn" onclick="updateDynamaxQty(-1)">-</button>
                <span id="dynamaxQty" class="qty-num">0</span>
                <button class="qty-btn" onclick="updateDynamaxQty(1)">+</button>
                <span id="dynamaxPrice" class="item-price">$0.00</span>
            </div>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = `<button class="cancel-btn" onclick="closeModal()">Cancel</button><button class="confirm-btn" onclick="addDynamaxToCart()">Add to Cart</button>`;
    document.getElementById('orderModal').style.display = 'flex';
}

function updateDynamaxQty(delta) {
    dynamaxQuantity = Math.max(0, dynamaxQuantity + delta);
    const qtyElem = document.getElementById('dynamaxQty');
    const priceElem = document.getElementById('dynamaxPrice');
    if (qtyElem) qtyElem.textContent = dynamaxQuantity;
    if (priceElem) {
        const price = Math.floor(dynamaxQuantity / 4) * (pricingCache['Raid_Dynamax_4'] || 10) + (dynamaxQuantity % 4) * (pricingCache['Raid_Dynamax_Single'] || 2.5);
        priceElem.textContent = `$${price.toFixed(2)}`;
    }
}

function addDynamaxToCart() {
    if (!dynamaxQuantity) { showToast('Please select a quantity'); return; }
    const price = Math.floor(dynamaxQuantity / 4) * (pricingCache['Raid_Dynamax_4'] || 10) + (dynamaxQuantity % 4) * (pricingCache['Raid_Dynamax_Single'] || 2.5);
    addToCart({ type: 'dynamax', pokemonName: currentRaid.name, raidTier: currentRaid.tier, quantity: dynamaxQuantity, price: price });
    closeModal();
}

// ========== CART FUNCTIONS ==========
function addToCart(item) {
    const existingIndex = cartItems.findIndex(i => i.type === item.type && i.pokemonName === item.pokemonName && i.raidTier === item.raidTier);
    if (existingIndex >= 0) {
        cartItems[existingIndex].quantity += item.quantity;
        cartItems[existingIndex].price = calculateItemPrice(cartItems[existingIndex]);
    } else {
        cartItems.push(item);
    }
    updateCartDisplay();
    showToast(`Added ${item.quantity}x ${item.pokemonName} to cart`);
}

function calculateItemPrice(item) {
    if (item.type === 'shundo') return item.quantity * (pricingCache['Spawn_Shundo'] || 5);
    if (item.type === 'hundo') return item.quantity * (pricingCache['Spawn_Hundo'] || 3);
    if (item.type === 'shiny') return item.quantity * (pricingCache['Spawn_Shiny'] || 2);
    if (item.type === 'raid') return item.price;
    if (item.type === 'dynamax') return item.price;
    if (item.type === 'coins') return item.price;
    return 0;
}

function getCartTotal() {
    return cartItems.reduce((sum, item) => sum + (item.price || calculateItemPrice(item)), 0);
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
    
    if (!cartItems.length) {
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
                    <div class="cart-item-price">$${(item.price || calculateItemPrice(item)).toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateCartQuantity(${idx}, ${item.quantity - 1})">-</button>
                    <span style="min-width:30px;text-align:center">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateCartQuantity(${idx}, ${item.quantity + 1})">+</button>
                    <button class="delete-btn" onclick="removeFromCart(${idx})">🗑️</button>
                </div>
            </div>
        `).join('');
    }
}

function updateCartQuantity(index, newQuantity) {
    if (newQuantity <= 0) {
        cartItems.splice(index, 1);
    } else {
        cartItems[index].quantity = newQuantity;
        cartItems[index].price = calculateItemPrice(cartItems[index]);
    }
    updateCartDisplay();
}

function removeFromCart(index) {
    cartItems.splice(index, 1);
    updateCartDisplay();
}

function clearCart() {
    cartItems = [];
    updateCartDisplay();
}

function addCoinToCart(amount) {
    const price = coinPrices[amount];
    addToCart({ type: 'coins', pokemonName: `${amount} Coins`, quantity: 1, price: price, coinAmount: amount });
}

// ========== CHECKOUT ==========
function showCustomerDialog() {
    document.getElementById('modalTitle').textContent = 'Who are you?!';
    document.getElementById('modalBody').innerHTML = `
        <input type="text" id="customerName" placeholder="Your Name *" class="rsvp-input" value="${customerName}">
        <input type="text" id="customerIgn" placeholder="In-Game Name (PoGo Name) *" class="rsvp-input" value="${customerIgn}">
        <div class="disclaimer">*Timed Events cannot have a predetermined time slot</div>
    `;
    document.getElementById('modalFooter').innerHTML = `<button class="cancel-btn" onclick="closeModal()">Cancel</button><button class="confirm-btn" onclick="saveCustomerInfo()">Save</button>`;
    document.getElementById('orderModal').style.display = 'flex';
}

function saveCustomerInfo() {
    const name = document.getElementById('customerName')?.value.trim();
    const ign = document.getElementById('customerIgn')?.value.trim();
    if (!name || !ign) { showToast('Please enter both name and in-game name'); return; }
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
    const notes = document.getElementById('notesInput')?.value || '';
    
    let paymentHtml = '';
    if (admin === 'Dan') {
        paymentHtml = `<div class="payment-option"><strong>💰 PayPal</strong><a href="https://paypal.me/danstudz" target="_blank" class="payment-link">Pay with PayPal</a><div class="disclaimer">⚠️ Please send with Friends and Family option</div></div>
                       <div class="payment-option"><strong>💚 CashApp</strong><a href="https://cash.app/\$DanStudz" target="_blank" class="payment-link">Pay with CashApp</a></div>
                       <div class="payment-option"><strong>💙 Venmo</strong><a href="https://venmo.com/DanStudz" target="_blank" class="payment-link">Pay with Venmo</a></div>`;
    } else if (admin === 'Thomas') {
        paymentHtml = `<div class="payment-option"><strong>💰 PayPal</strong><a href="https://www.paypal.me/Thomas061298" target="_blank" class="payment-link">Pay with PayPal</a><div class="disclaimer">⚠️ Please send with Friends and Family option</div></div>`;
    } else {
        paymentHtml = `<div class="payment-option"><strong>⏳ Payment Options Coming Soon</strong><div class="disclaimer">Please contact Kingi directly for payment options</div></div>`;
    }
    
    document.getElementById('modalTitle').textContent = 'Complete Order';
    document.getElementById('modalBody').innerHTML = `
        <div class="order-summary" style="background:#0d0d1a;padding:12px;border-radius:12px;margin-bottom:16px">
            <strong>Customer:</strong> ${customerName} (${customerIgn})<br>
            <strong>Admin:</strong> ${admin}<br>
            <strong>Total:</strong> $${total.toFixed(2)}
        </div>
        ${notes ? `<div class="order-section"><div class="section-title">📝 Notes</div><div>${notes}</div></div>` : ''}
        ${paymentHtml}
        <div class="disclaimer">Once payment is received, your order will be placed in queue 🧙</div>
    `;
    document.getElementById('modalFooter').innerHTML = `<button class="cancel-btn" onclick="closeModal()">Cancel</button><button class="confirm-btn" onclick="submitOrder()">Submit Order</button>`;
    document.getElementById('orderModal').style.display = 'flex';
}

async function submitOrder() {
    if (!cartItems.length) {
        showToast('Add items to your cart first');
        return;
    }
    
    showLoading('Submitting order...');
    
    const notes = document.getElementById('notesInput')?.value || '';
    const fullCustomerName = `${customerName} (${customerIgn})`;
    
    const orderData = {
        type: 'submitOrder',
        customerName: fullCustomerName,
        otherRequests: notes,
        paymentMethod: 'Web Order',
        assignedAdmin: selectedAdmin,
        items: cartItems.map(item => ({
            type: item.type,
            pokemonName: item.pokemonName,
            quantity: item.quantity,
            price: item.price || calculateItemPrice(item),
            raidTier: item.raidTier,
            coinAmount: item.coinAmount
        }))
    };
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await response.json();
        
        hideLoading();
        if (data.status === 'success') {
            showToast('Order submitted! You gained Aura 😎');
            clearCart();
            document.getElementById('notesInput').value = '';
            closeModal();
        } else {
            showToast('Order failed. Please try again or contact admin.');
        }
    } catch (e) {
        hideLoading();
        showToast('Network error. Please try again.');
    }
}

// ========== EVENTS WITH POKEMON IMAGES ==========
async function loadEvents() {
    try {
        const response = await fetch('https://leekduck.com/feeds/events.json');
        const events = await response.json();
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
        
        displayCurrentEvents(currentEvents);
        displayUpcomingEvents(upcomingEvents);
        loadDebutData();
    } catch (e) {
        console.error('Error loading events:', e);
    }
}

function displayCurrentEvents(events) {
    const container = document.getElementById('currentEventsList');
    if (!container) return;
    
    if (!events.length) {
        container.innerHTML = '<div class="loading">No current events</div>';
        return;
    }
    
    container.innerHTML = events.map(e => `
        <div class="event-card-with-img">
            <img src="${getEventPokemonImage(e.name)}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'">
            <div class="event-info">
                <div class="event-name">${e.name}</div>
                <div class="event-heading">${e.heading || 'Event'}</div>
                <div class="event-time">🟢 ${new Date(e.start).toLocaleString()}</div>
                <div class="event-time">🔴 ${new Date(e.end).toLocaleString()}</div>
            </div>
            <div class="event-buttons">
                <button class="event-view-btn" onclick="window.open('${e.link}', '_blank')">View</button>
            </div>
        </div>
    `).join('');
}

function displayUpcomingEvents(events) {
    const container = document.getElementById('upcomingEventsList');
    if (!container) return;
    
    if (!events.length) {
        container.innerHTML = '<div class="loading">No upcoming events</div>';
        return;
    }
    
    container.innerHTML = events.map(e => `
        <div class="event-card-with-img">
            <img src="${getEventPokemonImage(e.name)}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'">
            <div class="event-info">
                <div class="event-name">${e.name}</div>
                <div class="event-heading">${e.heading || 'Event'}</div>
                <div class="event-time">🟢 Starts: ${new Date(e.start).toLocaleString()}</div>
                <div class="event-time">🔴 Ends: ${new Date(e.end).toLocaleString()}</div>
            </div>
            <div class="event-buttons">
                <button class="event-view-btn" onclick="window.open('${e.link}', '_blank')">View</button>
                <button class="event-rsvp-btn" onclick='showRSVPDialog("${e.name.replace(/'/g, "\\'")}", "${e.link}", "${new Date(e.start).toLocaleString()}", "${new Date(e.end).toLocaleString()}")'>RSVP</button>
            </div>
        </div>
    `).join('');
}

function getEventPokemonImage(eventName) {
    const pokemonMap = {
        'Pikachu': 25, 'Slowbro': 80, 'Zamazenta': 889, 'Regieleki': 894,
        'Houndoom': 229, 'Latias': 380, 'Regidrago': 895, 'Kyogre': 382,
        'Groudon': 383, 'Tapu Koko': 785, 'Tapu Lele': 786, 'Manectric': 310,
        'Aerodactyl': 142, 'Alakazam': 65, 'Sharpedo': 319, 'Banette': 354,
        'Latios': 381, 'Tinkatink': 957, 'Woobat': 527, 'Trapinch': 328,
        'Drilbur': 529, 'Regirock': 377, 'Shuckle': 213
    };
    
    for (const [pokemon, id] of Object.entries(pokemonMap)) {
        if (eventName.includes(pokemon)) {
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
        }
    }
    return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';
}

// ========== DEBUT DATA ==========
async function loadDebutData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/Skatecrete/pogo-raid-data/main/debuts.json');
        const data = await response.json();
        const debuts = data.debuts || [];
        
        const nzTime = new Date().toLocaleString('en-US', { timeZone: 'Pacific/Auckland' });
        const todayNz = new Date(nzTime);
        todayNz.setHours(0, 0, 0, 0);
        
        let activeDebut = null;
        for (const debut of debuts) {
            const dateMatch = debut.event_date.match(/(\w+)\s+(\d+)(?:st|nd|rd|th)?/);
            if (dateMatch) {
                const month = dateMatch[1];
                const day = parseInt(dateMatch[2]);
                const year = new Date().getFullYear();
                const monthMap = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
                const startDate = new Date(year, monthMap[month], day);
                
                if (startDate >= todayNz) {
                    activeDebut = debut;
                    break;
                }
            }
        }
        
        if (activeDebut) {
            displayDebutBanner(activeDebut);
        }
    } catch (e) {
        console.error('Error loading debut data:', e);
    }
}

function displayDebutBanner(debut) {
    const banner = document.getElementById('debutBanner');
    const eventNameElem = document.getElementById('debutEventName');
    const countdownElem = document.getElementById('debutCountdown');
    const viewEventBtn = document.getElementById('debutViewEventBtn');
    
    if (!banner) return;
    
    eventNameElem.textContent = debut.event_name;
    viewEventBtn.onclick = () => findAndOpenLeekDuckEvent(debut.event_name);
    currentDebutData = debut;
    
    const endMatch = debut.event_date.match(/-\s*(\w+)\s+(\d+)(?:st|nd|rd|th)?\s+(\d{4})/);
    if (endMatch) {
        const monthMap = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
        const endDate = new Date(parseInt(endMatch[3]), monthMap[endMatch[1]], parseInt(endMatch[2]));
        const now = new Date();
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        countdownElem.textContent = daysLeft > 0 ? `Ends in ${daysLeft} days` : 'Ends soon!';
    }
    
    banner.style.display = 'block';
}

function showDebutDetails() {
    if (!currentDebutData) return;
    const allPokemon = [...(currentDebutData.new_pokemon || []), ...(currentDebutData.new_shiny || [])];
    const isShiny = currentDebutData.new_shiny || [];
    
    let html = '<div class="order-stats"><div>New Pokémon Debuts</div></div>';
    for (const pokemon of allPokemon) {
        const isShinyPokemon = isShiny.includes(pokemon);
        html += `
            <div class="order-section">
                <div class="section-title">${isShinyPokemon ? '✨ NEW SHINY ✨' : '🌟 NEW POKÉMON 🌟'}</div>
                <div>${pokemon}</div>
            </div>
        `;
    }
    
    document.getElementById('modalTitle').textContent = 'Debut Pokémon';
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('modalFooter').innerHTML = '<button class="confirm-btn" onclick="closeModal()">Close</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

async function findAndOpenLeekDuckEvent(eventName) {
    try {
        const response = await fetch('https://leekduck.com/feeds/events.json');
        const events = await response.json();
        const event = events.find(e => e.name.includes(eventName) || eventName.includes(e.name));
        if (event && event.link) {
            window.open(event.link, '_blank');
        } else {
            showToast('Event link not found');
        }
    } catch (e) {
        showToast('Could not open event');
    }
}

function showRSVPDialog(eventName, eventLink, startDate, endDate) {
    document.getElementById('modalTitle').textContent = `RSVP for ${eventName}`;
    document.getElementById('modalBody').innerHTML = `
        <input type="text" id="rsvpName" placeholder="Your Name *" class="rsvp-input">
        <input type="text" id="rsvpIgn" placeholder="In-Game Name *" class="rsvp-input">
        <div class="admin-select">
            <button class="admin-option dan" onclick='submitRSVP("${eventName.replace(/'/g, "\\'")}", "${eventLink}", "${startDate}", "${endDate}", "Dan")'>Dan (Skatecrete)</button>
            <button class="admin-option kingi" onclick='submitRSVP("${eventName.replace(/'/g, "\\'")}", "${eventLink}", "${startDate}", "${endDate}", "Kingi")'>Kingi (zEViLvSTON4z)</button>
            <button class="admin-option thomas" onclick='submitRSVP("${eventName.replace(/'/g, "\\'")}", "${eventLink}", "${startDate}", "${endDate}", "Thomas")'>Thomas (RampageGamer)</button>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = '';
    document.getElementById('orderModal').style.display = 'flex';
}

async function submitRSVP(eventName, eventLink, startDate, endDate, admin) {
    const name = document.getElementById('rsvpName')?.value.trim();
    const ign = document.getElementById('rsvpIgn')?.value.trim();
    
    if (!name || !ign) {
        showToast('Please enter your name and in-game name');
        return;
    }
    
    showLoading('Sending RSVP...');
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'addRSVP',
                customerName: name,
                ingameName: ign,
                eventName: eventName,
                eventStartDate: startDate,
                eventEndDate: endDate,
                eventLink: eventLink,
                assignedAdmin: admin
            })
        });
        const data = await response.json();
        
        hideLoading();
        if (data.status === 'success') {
            showToast(`RSVP sent to ${admin}! They will contact you.`);
            closeModal();
        } else {
            showToast('Failed to save RSVP. Please try again.');
        }
    } catch (e) {
        hideLoading();
        showToast('Network error. Please try again.');
    }
}

// ========== CUSTOMER HISTORY ==========
async function loadCustomerHistory() {
    const name = document.getElementById('historyName')?.value.trim();
    const ign = document.getElementById('historyIgn')?.value.trim();
    
    if (!name || !ign) {
        showToast('Enter both your name and in-game name');
        return;
    }
    
    showLoading('Loading your history...');
    
    try {
        // Format exactly like Android app: "Name (IGN)"
        const fullCustomerName = `${name} (${ign})`;
        
        console.log('Fetching orders for:', fullCustomerName);
        
        const orderResponse = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                type: 'getCustomerOrders', 
                customerName: fullCustomerName 
            })
        });
        
        const orderText = await orderResponse.text();
        console.log('Order Response Raw:', orderText);
        
        let orderData;
        try {
            orderData = JSON.parse(orderText);
        } catch (e) {
            console.error('Failed to parse order response:', e);
            orderData = { status: 'error', message: 'Invalid response' };
        }
        
        console.log('Order Data:', orderData);
        
        // Fetch RSVPs
        const rsvpResponse = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                type: 'getCustomerRSVPs', 
                customerName: name, 
                ingameName: ign 
            })
        });
        
        const rsvpText = await rsvpResponse.text();
        console.log('RSVP Response Raw:', rsvpText);
        
        let rsvpData;
        try {
            rsvpData = JSON.parse(rsvpText);
        } catch (e) {
            console.error('Failed to parse RSVP response:', e);
            rsvpData = { status: 'error', message: 'Invalid response' };
        }
        
        console.log('RSVP Data:', rsvpData);
        
        hideLoading();
        
        const orders = orderData.status === 'success' ? (orderData.orders || []) : [];
        const rsvps = rsvpData.status === 'success' ? (rsvpData.rsvps || []) : [];
        
        if (orders.length === 0 && rsvps.length === 0) {
            document.getElementById('historyEmpty').style.display = 'block';
            document.getElementById('historyOrders').style.display = 'none';
            document.getElementById('historyRSVPs').style.display = 'none';
            showToast('No orders or RSVPs found');
        } else {
            displayCustomerHistory(orders, rsvps);
        }
        
    } catch (e) {
        hideLoading();
        console.error('History error:', e);
        showToast('Failed to load history: ' + e.message);
    }
}

function displayCustomerHistory(orders, rsvps) {
    const ordersContainer = document.getElementById('ordersHistoryList');
    const rsvpsContainer = document.getElementById('rsvpsHistoryList');
    const ordersSection = document.getElementById('historyOrders');
    const rsvpsSection = document.getElementById('historyRSVPs');
    const emptySection = document.getElementById('historyEmpty');
    
    let hasData = false;
    
    if (orders && orders.length) {
        ordersSection.style.display = 'block';
        ordersContainer.innerHTML = orders.map(order => {
            // Parse items if it's a string
            let itemsDisplay = order.items || '';
            if (typeof order.items === 'string') {
                // Split by comma and format as bullet points
                const itemsList = order.items.split(', ');
                itemsDisplay = itemsList.map(item => `• ${item}`).join('<br>');
            } else if (Array.isArray(order.items)) {
                itemsDisplay = order.items.map(item => `• ${item.pokemon || item}`).join('<br>');
            }
            
            return `
                <div class="order-history-item" onclick='showOrderDetail(${JSON.stringify(order).replace(/'/g, "&#39;")})'>
                    <div class="order-history-header">
                        <span class="order-id">${order.orderId || 'Order'}</span>
                        <span class="order-total">$${(order.total || 0).toFixed(2)}</span>
                    </div>
                    <div class="order-details">${itemsDisplay || 'No items'}</div>
                    <div class="order-status ${order.status === 'Paid' ? 'status-paid' : 'status-pending'}">${order.status || 'Pending'}</div>
                    <div class="order-details">${order.date ? order.date.split(' ')[0] : ''}</div>
                </div>
            `;
        }).join('');
        hasData = true;
    } else {
        ordersSection.style.display = 'none';
    }
    
    if (rsvps && rsvps.length) {
        rsvpsSection.style.display = 'block';
        rsvpsContainer.innerHTML = rsvps.map(rsvp => `
            <div class="rsvp-history-item">
                <div class="rsvp-event-name" onclick="window.open('${rsvp.eventLink || ''}', '_blank')">${rsvp.eventName || 'Event'}</div>
                <div class="rsvp-event-date">📅 ${rsvp.eventDate || rsvp.eventStartDate || ''}</div>
                <div class="order-details">RSVP'd: ${rsvp.date ? rsvp.date.split(' ')[0] : ''}</div>
                <div class="order-status ${rsvp.status === 'Confirmed' ? 'status-paid' : 'status-pending'}">${rsvp.status || 'Pending'}</div>
            </div>
        `).join('');
        hasData = true;
    } else {
        rsvpsSection.style.display = 'none';
    }
    
    emptySection.style.display = hasData ? 'none' : 'block';
}

function showOrderDetail(order) {
    let itemsHtml = '';
    if (order.items) {
        if (typeof order.items === 'string') {
            const itemsList = order.items.split(', ');
            itemsHtml = itemsList.map(item => `<div>• ${item}</div>`).join('');
        } else if (Array.isArray(order.items)) {
            itemsHtml = order.items.map(item => `<div>• ${item.pokemon || item}</div>`).join('');
        }
    }
    
    document.getElementById('modalTitle').textContent = `Order ${order.orderId || 'Details'}`;
    document.getElementById('modalBody').innerHTML = `
        <div class="order-stats">
            <div><strong>Date:</strong> ${order.date || 'N/A'}</div>
            <div><strong>Customer:</strong> ${order.customer || 'N/A'}</div>
            <div><strong>Status:</strong> <span class="${order.status === 'Paid' ? 'status-paid' : 'status-pending'}">${order.status || 'Pending'}</span></div>
            <div><strong>Payment:</strong> ${order.paymentMethod || 'N/A'}</div>
            <div><strong>Total:</strong> <span class="status-paid">$${(order.total || 0).toFixed(2)}</span></div>
        </div>
        ${itemsHtml ? `<div class="order-section"><div class="section-title">📦 Items</div>${itemsHtml}</div>` : ''}
        ${order.otherRequests ? `<div class="order-section"><div class="section-title">📝 Notes</div><div>${order.otherRequests}</div></div>` : ''}
    `;
    document.getElementById('modalFooter').innerHTML = '<button class="confirm-btn" onclick="closeModal()">Close</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

// ========== UTILITIES ==========
function showLoading(message) {
    const modal = document.getElementById('loadingModal');
    const msgElem = document.getElementById('loadingMessage');
    if (msgElem) msgElem.textContent = message;
    if (modal) modal.style.display = 'flex';
}

function hideLoading() {
    const modal = document.getElementById('loadingModal');
    if (modal) modal.style.display = 'none';
}

function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Make functions global
window.filterSpawns = filterSpawns;
window.toggleFilter = toggleFilter;
window.showSpawnOrderDialog = showSpawnOrderDialog;
window.updateSpawnQty = updateSpawnQty;
window.addSpawnOrderToCart = addSpawnOrderToCart;
window.showRaidOrderDialog = showRaidOrderDialog;
window.selectRaidPack = selectRaidPack;
window.addRaidToCart = addRaidToCart;
window.showDynamaxOrderDialog = showDynamaxOrderDialog;
window.updateDynamaxQty = updateDynamaxQty;
window.addDynamaxToCart = addDynamaxToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.addCoinToCart = addCoinToCart;
window.showCustomerDialog = showCustomerDialog;
window.saveCustomerInfo = saveCustomerInfo;
window.selectAdminAndPay = selectAdminAndPay;
window.submitOrder = submitOrder;
window.showRSVPDialog = showRSVPDialog;
window.submitRSVP = submitRSVP;
window.loadCustomerHistory = loadCustomerHistory;
window.showDebutDetails = showDebutDetails;
window.closeModal = closeModal;
