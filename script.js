// ========== GLOBAL VARIABLES ==========
let allPokemon = [];
let cartItems = [];
let customerName = '';
let customerIgn = '';
let selectedAdmin = '';
let filters = { shundo: false, shiny164: false, regional: false, greatLeague: false, ultraLeague: false, masterLeague: false, premierCup: false, ultraPremier: false };
let currentSearch = '';
let currentDebutData = null;

// ========== PRICING CACHE (Default values, updated by loadPricing) ==========
let pricingCache = {
    'Spawn_Shundo': 5,
    'Spawn_Hundo': 3,
    'Spawn_Hundo_Regional': 8,
    'Spawn_Shiny': 2,
    'Spawn_Shiny_Regional': 5,
    'Spawn_PvP': 5,
    'Spawn_Normal_Regional': 3,
    'Raid_Normal_10': 7,
    'Raid_Normal_20': 12,
    'Raid_Normal_50': 20,
    'Raid_Dynamax_4': 10,
    'Raid_Dynamax_Single': 2.5,
    'Coins_5600': 24,
    'Coins_15500': 45,
    'Coins_31000': 85
};

let coinPrices = { 
    5600: pricingCache['Coins_5600'], 
    15500: pricingCache['Coins_15500'], 
    31000: pricingCache['Coins_31000'] 
};

// Apps Script URL
// For submitting orders and RSVPs (POST) - still needs proxy
const SCRIPT_URL = 'https://corsproxy.io/?' + encodeURIComponent('https://script.google.com/macros/s/AKfycbx6i6Yn7ezXqwJKgZF3Mbq_MbgNeb4mQ8weT0Qipu0c9ASFRVK6l-HIdH83xFbJOeI4/exec');

// For reading history (GET) - use local JSON files (no CORS)
const ORDERS_JSON_URL = 'data/orders.json';
const RSVPS_JSON_URL = 'data/rsvps.json';

// ========== INITIALIZATION ==========
function setupTabListeners() {
    var btns = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener('click', function() {
            var tabId = this.dataset.tab;
            var allBtns = document.querySelectorAll('.tab-btn');
            for (var j = 0; j < allBtns.length; j++) {
                allBtns[j].classList.remove('active');
            }
            var allContents = document.querySelectorAll('.tab-content');
            for (var k = 0; k < allContents.length; k++) {
                allContents[k].classList.remove('active');
            }
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'spawns' && allPokemon.length === 0) loadSpawns();
            if (tabId === 'raids') loadRaids();
            if (tabId === 'current' || tabId === 'upcoming') {
                loadEvents();
                // Load debut data only when switching to Upcoming tab
                if (tabId === 'upcoming') {
                    loadDebutData();
                }
            }
        });
    }
}

function showKingiMessage() {
    showToast("Kingi's messenger link coming soon!");
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
    var price5600 = document.getElementById('coinPrice5600');
    var price15500 = document.getElementById('coinPrice15500');
    var price31000 = document.getElementById('coinPrice31000');
    if (price5600) price5600.textContent = coinPrices[5600];
    if (price15500) price15500.textContent = coinPrices[15500];
    if (price31000) price31000.textContent = coinPrices[31000];
}

// ========== SPAWNS ==========
async function loadSpawns() {
    var container = document.getElementById('spawnsList');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading spawns...</div>';
    
    try {
        // Fetch from your GitHub repo instead of Shungo API
        const response = await fetch('https://raw.githubusercontent.com/Skatecrete/pogo-raid-data/main/spawns.json');
        const data = await response.json();
        var spawnData = data.spawns || [];
        
        var pokemonList = [];
        for (var i = 0; i < Math.min(spawnData.length, 200); i++) {
            var item = spawnData[i];
            var pokedexId = item.id;
            var spawnRate = item.rate;
            var isShiny = item.shiny;
            var name = item.name;
            
            var isPermaboosted = [144,145,146,150,243,244,245,249,250,251,380,381,382,383,384,480,481,482,483,484,485,486,487,488,785,786,787,788,888,889,894,895].includes(pokedexId);
            
            pokemonList.push({
                id: pokedexId,
                name: name,
                spawnRate: spawnRate,
                isShiny: isShiny,
                shinyRate: isShiny ? (isPermaboosted ? '✨ 1/64' : '✨ 1/512') : '❌ Not available',
                isRegional: isRegionalPokemon(name),
                isTopGreatLeague: isTopGreatLeaguePokemon(name),
                isTopUltraLeague: isTopUltraLeaguePokemon(name),
                isTopMasterLeague: isTopMasterLeaguePokemon(name),
                isTopPremierCup: isTopPremierCupPokemon(name),
                isTopUltraPremier: isTopUltraPremierPokemon(name)
            });
        }
        
        pokemonList.sort(function(a, b) { return b.spawnRate - a.spawnRate; });
        allPokemon = pokemonList;
        displaySpawns();
    } catch (e) {
        console.error('Error loading spawns:', e);
        container.innerHTML = '<div class="loading">Failed to load spawns: ' + e.message + '</div>';
    }
}

function isRegionalPokemon(name) {
    var regionals = ['Farfetch\'d', 'Kangaskhan', 'Mr. Mime', 'Tauros', 'Corsola', 'Heracross', 'Illumise', 'Lunatone', 'Relicanth', 'Seviper', 'Solrock', 'Torkoal', 'Tropius', 'Volbeat', 'Zangoose', 'Carnivine', 'Chatot', 'Pachirisu', 'Shellos', 'Maractus', 'Sigilyph', 'Hawlucha', 'Klefki', 'Comfey', 'Stonjourner'];
    for (var i = 0; i < regionals.length; i++) {
        if (name.includes(regionals[i])) return true;
    }
    return false;
}

function isTopGreatLeaguePokemon(name) {
    var greatLeague = ['Aegislash', 'Carbink', 'Giratina', 'Zygarde', 'Clodsire', 'Registeel', 'Azumarill', 'Lucario', 'Altaria', 'Turtonator', 'Regidrago', 'Crustle', 'Skeledirge', 'Diggersby', 'Kommo-o', 'Torkoal', 'Clefable', 'Regirock', 'Genesect', 'Goodra', 'Latias', 'Machamp', 'Cetitan', 'Pangoro', 'Murkrow', 'Raikou', 'Rufflet'];
    for (var i = 0; i < greatLeague.length; i++) {
        if (name.includes(greatLeague[i])) return true;
    }
    return false;
}

function isTopUltraLeaguePokemon(name) {
    var ultraLeague = ['Zygarde', 'Giratina', 'Cresselia', 'Forretress', 'Registeel', 'Skeledirge', 'Pecharunt', 'Tentacruel', 'Moltres', 'Jellicent', 'Cobalion', 'Regidrago', 'Tinkaton', 'Grumpig', 'Dusknoir', 'Crustle', 'Lapras', 'Turtonator', 'Steelix', 'Lucario', 'Clefable', 'Lickilicky', 'Florges', 'Genesect', 'Dialga', 'Latias', 'Regirock'];
    for (var i = 0; i < ultraLeague.length; i++) {
        if (name.includes(ultraLeague[i])) return true;
    }
    return false;
}

function isTopMasterLeaguePokemon(name) {
    var masterLeague = ['Zygarde', 'Eternatus', 'Dialga', 'Giratina', 'Meloetta', 'Yveltal', 'Kyurem', 'Reshiram', 'Palkia', 'Zekrom', 'Zamazenta', 'Lugia', 'Ho-Oh', 'Metagross', 'Goodra', 'Lunala', 'Xerneas', 'Urshifu', 'Garchomp', 'Latias'];
    for (var i = 0; i < masterLeague.length; i++) {
        if (name.includes(masterLeague[i])) return true;
    }
    return false;
}

function isTopPremierCupPokemon(name) {
    var premierCup = ['Zygarde', 'Eternatus', 'Meloetta', 'Dialga', 'Kyurem', 'Giratina', 'Palkia', 'Zamazenta', 'Zacian', 'Metagross', 'Goodra', 'Urshifu', 'Garchomp', 'Moltres', 'Hydreigon', 'Gholdengo', 'Marshadow', 'Ho-Oh', 'Kommo-o', 'Genesect', 'Baxcalibur'];
    for (var i = 0; i < premierCup.length; i++) {
        if (name.includes(premierCup[i])) return true;
    }
    return false;
}

function isTopUltraPremierPokemon(name) {
    var ultraPremier = ['Forretress', 'Zygarde', 'Jellicent', 'Tinkaton', 'Moltres', 'Skeledirge', 'Mewtwo', 'Regidrago', 'Pecharunt', 'Cresselia', 'Turtonator', 'Giratina', 'Cradily', 'Lucario', 'Lapras', 'Crustle', 'Tentacruel', 'Ninetales', 'Florges', 'Dialga', 'Genesect', 'Toucannon', 'Goodra', 'Kingdra', 'Talonflame', 'Lickilicky'];
    for (var i = 0; i < ultraPremier.length; i++) {
        if (name.includes(ultraPremier[i])) return true;
    }
    return false;
}

async function getPokemonName(id) {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon-species/' + id + '/');
        const data = await response.json();
        var names = data.names;
        for (var i = 0; i < names.length; i++) {
            if (names[i].language.name === 'en') {
                return names[i].name;
            }
        }
        return 'Pokemon #' + id;
    } catch {
        return 'Pokemon #' + id;
    }
}

function displaySpawns() {
    var container = document.getElementById('spawnsList');
    if (!container) return;
    
    var filtered = allPokemon.slice();
    
    if (currentSearch) {
        filtered = filtered.filter(function(p) { return p.name.toLowerCase().includes(currentSearch); });
    }
    
    if (filters.shundo) {
        filtered = filtered.filter(function(p) { return p.spawnRate >= 0.65 && p.isShiny; });
    }
    if (filters.shiny164) {
        filtered = filtered.filter(function(p) { return p.isShiny && p.spawnRate >= 0.65; });
    }
    if (filters.regional) {
        filtered = filtered.filter(function(p) { return p.isRegional; });
    }
    if (filters.greatLeague) {
        filtered = filtered.filter(function(p) { return p.isTopGreatLeague; });
    }
    if (filters.ultraLeague) {
        filtered = filtered.filter(function(p) { return p.isTopUltraLeague; });
    }
    if (filters.masterLeague) {
        filtered = filtered.filter(function(p) { return p.isTopMasterLeague; });
    }
    if (filters.premierCup) {
        filtered = filtered.filter(function(p) { return p.isTopPremierCup; });
    }
    if (filters.ultraPremier) {
        filtered = filtered.filter(function(p) { return p.isTopUltraPremier; });
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading">No spawns found</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < filtered.length; i++) {
        var p = filtered[i];
        
        // Check for NOPE (spawn rate below 0.01%)
        var isNope = p.spawnRate < 0.01;
        
        var badgeClass = '', badgeText = '';
        if (!isNope) {
            if (p.spawnRate >= 0.85) { badgeClass = 'badge-heavy'; badgeText = 'HEAVY'; }
            else if (p.spawnRate >= 0.65) { badgeClass = 'badge-medium'; badgeText = 'MEDIUM'; }
            else if (p.spawnRate >= 0.30) { badgeClass = 'badge-low'; badgeText = 'LOW'; }
            else { badgeClass = 'badge-minimal'; badgeText = 'MINIMAL'; }
        }
        
        // Build tags HTML
        var tagsHtml = '';
        if (p.isRegional) tagsHtml += '<span class="pokemon-tag tag-regional">🌍 Regional</span>';
        if (p.isTopGreatLeague) tagsHtml += '<span class="pokemon-tag tag-great">🏆 Great League</span>';
        if (p.isTopUltraLeague) tagsHtml += '<span class="pokemon-tag tag-ultra">🏆 Ultra League</span>';
        if (p.isTopMasterLeague) tagsHtml += '<span class="pokemon-tag tag-master">🏆 Master League</span>';
        if (p.isTopPremierCup) tagsHtml += '<span class="pokemon-tag tag-premier">🏆 Premier Cup</span>';
        if (p.isTopUltraPremier) tagsHtml += '<span class="pokemon-tag tag-ultra-premier">🏆 Ultra Premier</span>';
        
        html += '<div class="pokemon-card" onclick=\'showSpawnOrderDialog(' + JSON.stringify(p).replace(/'/g, "&#39;") + ')\'>';
        html += '<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/' + p.id + '.png" onerror="this.src=\'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + p.id + '.png\'">';
        html += '<div class="pokemon-info">';
        
        // Pokemon name with NOPE badge or spawn badge
        html += '<div class="pokemon-name">' + p.name;
        if (isNope) {
            html += '<span class="spawn-badge badge-nope">💀 NOPE</span>';
        } else if (badgeText) {
            html += '<span class="spawn-badge ' + badgeClass + '">' + badgeText + '</span>';
        }
        html += '</div>';
        
        html += '<div class="pokemon-tags">' + tagsHtml + '</div>';
        
        // Spawn rate and shiny rate - spawn rate in bright green
        html += '<div class="pokemon-details"><span class="spawn-rate-green">Spawn Rate: ' + p.spawnRate.toFixed(2) + '%</span> | <span class="shiny-rate">' + p.shinyRate + '</span></div>';
        html += '</div>';
        html += '<button class="order-btn" onclick="event.stopPropagation(); showSpawnOrderDialog(' + JSON.stringify(p).replace(/'/g, "&#39;") + ')">➕ Order</button>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function filterSpawns() {
    var searchInput = document.getElementById('spawnSearch');
    currentSearch = searchInput ? searchInput.value.toLowerCase() : '';
    displaySpawns();
}

function toggleFilter(filter) {
    filters[filter] = !filters[filter];
    var btn = event.target;
    if (filters[filter]) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
    displaySpawns();
}

// ========== SPAWN ORDER DIALOG ==========
var currentSpawnPokemon = null;
var spawnQuantities = { shundo: 0, hundo: 0, shiny: 0 };

function showSpawnOrderDialog(pokemon) {
    currentSpawnPokemon = pokemon;
    spawnQuantities = { shundo: 0, hundo: 0, shiny: 0 };
    
    var shundoPrice = pricingCache['Spawn_Shundo'] || 5;
    var hundoPrice = pricingCache['Spawn_Hundo'] || 3;
    var shinyPrice = pricingCache['Spawn_Shiny'] || 2;
    
    document.getElementById('modalTitle').textContent = 'Order ' + pokemon.name;
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
    document.getElementById('modalFooter').innerHTML = '<button class="cancel-btn" onclick="closeModal()">Cancel</button><button class="confirm-btn" onclick="addSpawnOrderToCart()">Add to Cart</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

function updateSpawnQty(type, delta) {
    var newQty = Math.max(0, spawnQuantities[type] + delta);
    spawnQuantities[type] = newQty;
    
    var priceMap = { shundo: pricingCache['Spawn_Shundo'] || 5, hundo: pricingCache['Spawn_Hundo'] || 3, shiny: pricingCache['Spawn_Shiny'] || 2 };
    
    var qtyElem = document.getElementById(type + 'Qty');
    var priceElem = document.getElementById(type + 'Price');
    if (qtyElem) qtyElem.textContent = newQty;
    if (priceElem) {
        var price = newQty * priceMap[type];
        priceElem.textContent = '$' + price.toFixed(2);
    }
}

function addSpawnOrderToCart() {
    var shundo = spawnQuantities.shundo;
    var hundo = spawnQuantities.hundo;
    var shiny = spawnQuantities.shiny;
    
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
    var container = document.getElementById('raidsList');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading raids...</div>';
    
    try {
        var scrapedResponse = await fetch('https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.min.json');
        var dynaResponse = await fetch('https://raw.githubusercontent.com/Skatecrete/pogo-raid-data/main/current_raids.json');
        
        var scrapedRaids = await scrapedResponse.json();
        var dynaRaids = await dynaResponse.json();
        
        var regularRaids = { tier6: [], tier5: [], tier4: [], tier3: [], tier2: [], tier1: [], mega: [], shadow5: [], shadow3: [], shadow1: [] };
        
        for (var i = 0; i < scrapedRaids.length; i++) {
            var raid = scrapedRaids[i];
            var tier = raid.tier;
            var name = raid.name;
            var id = await getPokemonIdFromName(name);
            var raidObj = { name: name, tier: tier, id: id, isShiny: raid.canBeShiny, image: raid.image || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/' + id + '.png' };
            
            var tierLower = tier.toLowerCase();
            var nameLower = name.toLowerCase();
            
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
        
        var dynamaxRaids = [];
        var tierMapping = {
            'dynamax_tier1': '⚡ DYNAMAX TIER 1', 'dynamax_tier2': '⚡⚡ DYNAMAX TIER 2', 'dynamax_tier3': '⚡⚡⚡ DYNAMAX TIER 3',
            'dynamax_tier4': '⚡⚡⚡⚡ DYNAMAX TIER 4', 'dynamax_tier5': '⚡⚡⚡⚡⚡ DYNAMAX TIER 5', 'gigantamax': '💥 GIGANTAMAX'
        };
        
        var invalidNames = ['bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire', 'flying', 'ghost', 'grass', 'ground', 'ice', 'normal', 'poison', 'psychic', 'rock', 'steel', 'water', 'Search...'];
        
        for (var key in tierMapping) {
            if (dynaRaids[key] && dynaRaids[key].length) {
                for (var j = 0; j < dynaRaids[key].length; j++) {
                    var raidName = dynaRaids[key][j];
                    if (!raidName || raidName.length < 2 || invalidNames.includes(raidName) || invalidNames.includes(raidName.toLowerCase())) continue;
                    var raidId = await getPokemonIdFromName(raidName);
                    dynamaxRaids.push({ name: raidName, tier: tierMapping[key], id: raidId, isShiny: true, image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/' + raidId + '.png' });
                }
            }
        }
        
        displayRaids(regularRaids, dynamaxRaids);
    } catch (e) {
        container.innerHTML = '<div class="loading">Failed to load raids</div>';
    }
}

async function getPokemonIdFromName(name) {
    var cleanName = name.replace('Shadow ', '').replace('Mega ', '').replace('D-Max ', '').trim().toLowerCase();
    
    // Special form mappings for PokeAPI
    var formMap = {
        'alolan marowak': 'marowak-alola',
        'alolan vulpix': 'vulpix-alola',
        'alolan sandshrew': 'sandshrew-alola',
        'alolan sandslash': 'sandslash-alola',
        'alolan diglett': 'diglett-alola',
        'alolan dugtrio': 'dugtrio-alola',
        'alolan meowth': 'meowth-alola',
        'alolan persian': 'persian-alola',
        'alolan geodude': 'geodude-alola',
        'alolan graveler': 'graveler-alola',
        'alolan golem': 'golem-alola',
        'alolan grimer': 'grimer-alola',
        'alolan muk': 'muk-alola',
        'alolan exeggutor': 'exeggutor-alola',
        'alolan raichu': 'raichu-alola',
        'galarian meowth': 'meowth-galar',
        'galarian ponyta': 'ponyta-galar',
        'galarian rapidash': 'rapidash-galar',
        'galarian slowpoke': 'slowpoke-galar',
        'galarian farfetchd': 'farfetchd-galar',
        'galarian zigzagoon': 'zigzagoon-galar',
        'galarian linoone': 'linoone-galar',
        'galarian darumaka': 'darumaka-galar',
        'galarian yamask': 'yamask-galar',
        'galarian stunfisk': 'stunfisk-galar',
        'hisuian growlithe': 'growlithe-hisui',
        'hisuian voltorb': 'voltorb-hisui',
        'hisuian sneasel': 'sneasel-hisui',
        'hisuian avalugg': 'avalugg-hisui'
    };
    
    var apiName = formMap[cleanName] || cleanName;
    
    // Simple ID map for common shadow Pokémon (fallback)
    var simpleMap = { 
        'dratini': 147, 'gligar': 207, 'cacnea': 331, 'joltik': 595, 
        'lapras': 131, 'stantler': 234, 'latios': 381, 'latias': 380,
        'marowak-alola': 105, 'marowak': 105
    };
    
    if (simpleMap[apiName]) return simpleMap[apiName];
    
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon/' + apiName);
        if (response.ok) {
            const data = await response.json();
            return data.id;
        }
        // If fails, try without form
        var baseName = cleanName.split(' ')[0];
        if (simpleMap[baseName]) return simpleMap[baseName];
        return 25; // Pikachu as default
    } catch {
        return 25;
    }
}

function displayRaids(regularRaids, dynamaxRaids) {
    var container = document.getElementById('raidsList');
    if (!container) return;
    
    var categoryOrder = [
        { key: 'tier6', title: '⭐⭐⭐⭐⭐⭐ 6-STAR RAIDS' }, { key: 'tier5', title: '⭐⭐⭐⭐⭐ 5-STAR RAIDS' },
        { key: 'tier4', title: '⭐⭐⭐⭐ 4-STAR RAIDS' }, { key: 'tier3', title: '⭐⭐⭐ 3-STAR RAIDS' },
        { key: 'tier2', title: '⭐⭐ 2-STAR RAIDS' }, { key: 'tier1', title: '⭐ 1-STAR RAIDS' },
        { key: 'mega', title: '🔴 MEGA RAIDS' }, { key: 'shadow5', title: '🌑 SHADOW LEGENDARY (5-STAR)' },
        { key: 'shadow3', title: '🌑 SHADOW 3-STAR RAIDS' }, { key: 'shadow1', title: '🌑 SHADOW 1-STAR RAIDS' }
    ];
    
    var dynaOrder = [
        { key: 'dynamax_tier5', title: '⚡⚡⚡⚡⚡ DYNAMAX TIER 5' }, { key: 'dynamax_tier4', title: '⚡⚡⚡⚡ DYNAMAX TIER 4' },
        { key: 'dynamax_tier3', title: '⚡⚡⚡ DYNAMAX TIER 3' }, { key: 'dynamax_tier2', title: '⚡⚡ DYNAMAX TIER 2' },
        { key: 'dynamax_tier1', title: '⚡ DYNAMAX TIER 1' }, { key: 'gigantamax', title: '💥 GIGANTAMAX' }
    ];
    
    var html = '';
    
    for (var c = 0; c < categoryOrder.length; c++) {
        var cat = categoryOrder[c];
        if (regularRaids[cat.key] && regularRaids[cat.key].length) {
            html += '<div class="raid-header"><h4>' + cat.title + '</h4></div><div class="raids-grid">';
            for (var r = 0; r < regularRaids[cat.key].length; r++) {
                var raid = regularRaids[cat.key][r];
                html += '<div class="raid-card" onclick=\'showRaidOrderDialog(' + JSON.stringify(raid).replace(/'/g, "&#39;") + ')\'>';
                html += '<div class="raid-image-container">';
                if (raid.name.includes('Shadow')) html += '<div class="shadow-underlay"></div>';
                if (raid.tier.includes('Dynamax') || raid.tier.includes('Gigantamax')) html += '<div class="dynamax-underlay"></div>';
                html += '<img src="' + raid.image + '" onerror="this.src=\'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png\'">';
                html += '</div>';
                html += '<span>' + raid.name + (raid.isShiny ? ' ✨' : '') + '</span>';
                html += '</div>';
            }
            html += '</div>';
        }
    }
    
    var dynaByTier = {};
    for (var d = 0; d < dynamaxRaids.length; d++) {
        var raid = dynamaxRaids[d];
        if (!dynaByTier[raid.tier]) dynaByTier[raid.tier] = [];
        dynaByTier[raid.tier].push(raid);
    }
    
    for (var dt = 0; dt < dynaOrder.length; dt++) {
        var dyna = dynaOrder[dt];
        if (dynaByTier[dyna.title] && dynaByTier[dyna.title].length) {
            html += '<div class="raid-header"><h4>' + dyna.title + '</h4></div><div class="raids-grid">';
            for (var dr = 0; dr < dynaByTier[dyna.title].length; dr++) {
                var raid = dynaByTier[dyna.title][dr];
                html += '<div class="raid-card" onclick=\'showDynamaxOrderDialog(' + JSON.stringify(raid).replace(/'/g, "&#39;") + ')\'>';
                html += '<div class="raid-image-container"><div class="dynamax-underlay"></div><img src="' + raid.image + '" onerror="this.src=\'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png\'"></div>';
                html += '<span>' + raid.name + '</span>';
                html += '</div>';
            }
            html += '</div>';
        }
    }
    
    container.innerHTML = html || '<div class="loading">No raids available</div>';
}

// ========== RAID ORDER DIALOGS ==========
var selectedRaidPack = { quantity: 0, price: 0 };
var currentRaid = null;
var dynamaxQuantity = 0;

function showRaidOrderDialog(raid) {
    currentRaid = raid;
    selectedRaidPack = { quantity: 0, price: 0 };
    
    document.getElementById('modalTitle').textContent = 'Order ' + raid.name + ' Raids';
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
    document.getElementById('modalFooter').innerHTML = '<button class="cancel-btn" onclick="closeModal()">Cancel</button><button class="confirm-btn" onclick="addRaidToCart()">Add to Cart</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

function selectRaidPack(quantity, price) {
    selectedRaidPack = { quantity: quantity, price: price };
    document.getElementById('raidSelectedInfo').innerHTML = 'Selected: ' + quantity + ' Raids - $' + price;
}

function addRaidToCart() {
    if (!selectedRaidPack.quantity) { showToast('Please select a raid pack'); return; }
    addToCart({ type: 'raid', pokemonName: currentRaid.name, raidTier: currentRaid.tier, quantity: selectedRaidPack.quantity, price: selectedRaidPack.price });
    closeModal();
}

function showDynamaxOrderDialog(raid) {
    currentRaid = raid;
    dynamaxQuantity = 0;
    
    document.getElementById('modalTitle').textContent = 'Order ' + raid.name;
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
    document.getElementById('modalFooter').innerHTML = '<button class="cancel-btn" onclick="closeModal()">Cancel</button><button class="confirm-btn" onclick="addDynamaxToCart()">Add to Cart</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

function updateDynamaxQty(delta) {
    dynamaxQuantity = Math.max(0, dynamaxQuantity + delta);
    var qtyElem = document.getElementById('dynamaxQty');
    var priceElem = document.getElementById('dynamaxPrice');
    if (qtyElem) qtyElem.textContent = dynamaxQuantity;
    if (priceElem) {
        var price = Math.floor(dynamaxQuantity / 4) * (pricingCache['Raid_Dynamax_4'] || 10) + (dynamaxQuantity % 4) * (pricingCache['Raid_Dynamax_Single'] || 2.5);
        priceElem.textContent = '$' + price.toFixed(2);
    }
}

function addDynamaxToCart() {
    if (!dynamaxQuantity) { showToast('Please select a quantity'); return; }
    var price = Math.floor(dynamaxQuantity / 4) * (pricingCache['Raid_Dynamax_4'] || 10) + (dynamaxQuantity % 4) * (pricingCache['Raid_Dynamax_Single'] || 2.5);
    addToCart({ type: 'dynamax', pokemonName: currentRaid.name, raidTier: currentRaid.tier, quantity: dynamaxQuantity, price: price });
    closeModal();
}

// ========== CART FUNCTIONS ==========
function addToCart(item) {
    var existingIndex = -1;
    for (var i = 0; i < cartItems.length; i++) {
        if (cartItems[i].type === item.type && cartItems[i].pokemonName === item.pokemonName && cartItems[i].raidTier === item.raidTier) {
            existingIndex = i;
            break;
        }
    }
    if (existingIndex >= 0) {
        cartItems[existingIndex].quantity += item.quantity;
        cartItems[existingIndex].price = calculateItemPrice(cartItems[existingIndex]);
    } else {
        cartItems.push(item);
    }
    saveCart();  // ← ADD THIS
    updateCartDisplay();
    showToast('Added ' + item.quantity + 'x ' + item.pokemonName + ' to cart');
}

function calculateItemPrice(item) {
    if (item.type === 'shundo') return item.quantity * (pricingCache['Spawn_Shundo'] || 5);
    if (item.type === 'hundo') return item.quantity * (pricingCache['Spawn_Hundo'] || 3);
    if (item.type === 'shiny') return item.quantity * (pricingCache['Spawn_Shiny'] || 2);
    if (item.type === 'coins') return item.price; // Coins price is fixed per pack
    
    if (item.type === 'raid') {
        var quantity = item.quantity;
        var price = 0;
        var remaining = quantity;
        var raidPrice10 = pricingCache['Raid_Normal_10'] || 7;
        var raidPrice20 = pricingCache['Raid_Normal_20'] || 12;
        var raidPrice50 = pricingCache['Raid_Normal_50'] || 20;
        var singleRaidPrice = raidPrice10 / 10;
        
        // Use 50-packs first (best value)
        var fiftyPacks = Math.floor(remaining / 50);
        price += fiftyPacks * raidPrice50;
        remaining = remaining % 50;
        
        // Then use 20-packs
        var twentyPacks = Math.floor(remaining / 20);
        price += twentyPacks * raidPrice20;
        remaining = remaining % 20;
        
        // Then use 10-packs
        var tenPacks = Math.floor(remaining / 10);
        price += tenPacks * raidPrice10;
        remaining = remaining % 10;
        
        // Remaining individual raids
        price += remaining * singleRaidPrice;
        
        return price;
    }
    
    if (item.type === 'dynamax') {
        var quantity = item.quantity;
        var dynamaxPricePer4 = pricingCache['Raid_Dynamax_4'] || 10;
        var dynamaxPriceSingle = pricingCache['Raid_Dynamax_Single'] || 2.5;
        var price = Math.floor(quantity / 4) * dynamaxPricePer4 + (quantity % 4) * dynamaxPriceSingle;
        return price;
    }
    
    return 0;
}

function getCartTotal() {
    var total = 0;
    for (var i = 0; i < cartItems.length; i++) {
        total += (cartItems[i].price || calculateItemPrice(cartItems[i]));
    }
    return total;
}

function updateCartDisplay() {
    var cartContainer = document.getElementById('cartItems');
    var cartTotalElem = document.getElementById('cartTotal');
    var cartCountElem = document.getElementById('cartCount');
    var emptyCartMsg = document.getElementById('emptyCartMsg');
    
    var total = getCartTotal();
    var itemCount = 0;
    for (var i = 0; i < cartItems.length; i++) {
        itemCount += cartItems[i].quantity;
    }
    
    if (cartCountElem) cartCountElem.textContent = itemCount + ' items';
    if (cartTotalElem) cartTotalElem.textContent = total.toFixed(2);
    
    if (!cartItems.length) {
        if (cartContainer) cartContainer.innerHTML = '';
        if (emptyCartMsg) emptyCartMsg.style.display = 'block';
        return;
    }
    
    if (emptyCartMsg) emptyCartMsg.style.display = 'none';
    
    if (cartContainer) {
        var html = '';
        for (var j = 0; j < cartItems.length; j++) {
            var item = cartItems[j];
            html += '<div class="cart-item">';
            html += '<div class="cart-item-info">';
            html += '<div class="cart-item-name">' + item.pokemonName + (item.raidTier ? ' (' + item.raidTier + ')' : '') + '</div>';
            html += '<div class="cart-item-price">$' + (item.price || calculateItemPrice(item)).toFixed(2) + '</div>';
            html += '</div>';
            html += '<div class="cart-item-controls">';
            html += '<button class="qty-btn" onclick="updateCartQuantity(' + j + ', ' + (item.quantity - 1) + ')">-</button>';
            html += '<span style="min-width:30px;text-align:center">' + item.quantity + '</span>';
            html += '<button class="qty-btn" onclick="updateCartQuantity(' + j + ', ' + (item.quantity + 1) + ')">+</button>';
            html += '<button class="delete-btn" onclick="removeFromCart(' + j + ')">🗑️</button>';
            html += '</div></div>';
        }
        cartContainer.innerHTML = html;
    }
}

function updateCartQuantity(index, newQuantity) {
    if (newQuantity <= 0) {
        cartItems.splice(index, 1);
    } else {
        cartItems[index].quantity = newQuantity;
        cartItems[index].price = calculateItemPrice(cartItems[index]);
    }
    saveCart();  // ← ADD THIS
    updateCartDisplay();
}

function removeFromCart(index) {
    cartItems.splice(index, 1);
    saveCart();  // ← ADD THIS
    updateCartDisplay();
}

function addCoinToCart(amount) {
    var price = coinPrices[amount];
    addToCart({ type: 'coins', pokemonName: amount + ' Coins', quantity: 1, price: price, coinAmount: amount });
}

// ========== PERSISTENT CART ==========
function saveCart() {
    localStorage.setItem('pokespawn_cart', JSON.stringify(cartItems));
}

function loadCart() {
    var savedCart = localStorage.getItem('pokespawn_cart');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
        updateCartDisplay();
    }
}

function clearCart() {
    cartItems = [];
    saveCart();
    updateCartDisplay();
}

// ========== CHECKOUT ==========
function showCustomerDialog() {
    var savedTimePref = localStorage.getItem('timePreference') || 'Whenever Possible';
    
    document.getElementById('modalTitle').textContent = 'Who are you?! Reveal Yourself!';
    document.getElementById('modalBody').innerHTML = `
        <input type="text" id="customerName" placeholder="Your First Name *" class="rsvp-input" value="${customerName}">
        <input type="text" id="customerIgn" placeholder="In-Game Name (PoGo Name) *" class="rsvp-input" value="${customerIgn}">
        
        <div style="margin-top: 12px; margin-bottom: 8px;">
            <label style="font-size: 13px; font-weight: bold;">⏰ Preferred Time to Start Order</label>
        </div>
        <select id="timePreference" class="rsvp-input" style="background: #2a2a3e; color: white;">
            <option value="Whenever Possible" ${savedTimePref === 'Whenever Possible' ? 'selected' : ''}>Whenever Possible</option>
            <option value="Morning (US)" ${savedTimePref === 'Morning (US)' ? 'selected' : ''}>Morning (US)</option>
            <option value="Midday (US)" ${savedTimePref === 'Midday (US)' ? 'selected' : ''}>Midday (US)</option>
            <option value="Night/Overnight (US)" ${savedTimePref === 'Night/Overnight (US)' ? 'selected' : ''}>Night/Overnight (US)</option>
        </select>
        
        <div class="disclaimer" style="margin-top: 12px;">*Timed Events cannot have a predetermined time slot, nor can all orders be considered at certain times given the amount of orders we may have.</div>
    `;
    document.getElementById('modalFooter').innerHTML = '<button class="cancel-btn" onclick="closeModal()">Cancel</button><button class="confirm-btn" onclick="saveCustomerInfo()">Save</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

function saveCustomerInfo() {
    var name = document.getElementById('customerName')?.value.trim();
    var ign = document.getElementById('customerIgn')?.value.trim();
    var timePref = document.getElementById('timePreference')?.value || 'Whenever Possible';
    
    if (!name || !ign) {
        showToast('Please enter both name and in-game name');
        return;
    }
    
    customerName = name;
    customerIgn = ign;
    
    // Save time preference to localStorage for next time
    localStorage.setItem('timePreference', timePref);
    
    closeModal();
    showAdminSelection(timePref);
}

var currentTimePreference = '';

function showAdminSelection(timePref) {
    currentTimePreference = timePref;
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
    var total = getCartTotal();
    var notes = document.getElementById('notesInput')?.value || '';
    
    // Add time preference to notes if not "Whenever Possible"
    var finalNotes = notes;
    if (currentTimePreference && currentTimePreference !== 'Whenever Possible') {
        finalNotes = finalNotes ? finalNotes + '\n\n⏰ Time Preference: ' + currentTimePreference : '⏰ Time Preference: ' + currentTimePreference;
    }
    
    var paymentHtml = '';
    if (admin === 'Dan') {
        paymentHtml = `
            <div class="payment-option">
                <strong>💰 PayPal</strong>
                <div class="copy-row">
                    <span class="payment-username">@danstudz</span>
                    <button class="copy-btn" onclick="copyToClipboard('@danstudz')">Copy</button>
                </div>
                <div class="disclaimer">⚠️ Please send with Friends and Family option</div>
            </div>
            <div class="payment-option">
                <strong>💚 CashApp</strong>
                <div class="copy-row">
                    <span class="payment-username">$DanStudz</span>
                    <button class="copy-btn" onclick="copyToClipboard('$DanStudz')">Copy</button>
                </div>
            </div>
            <div class="payment-option">
                <strong>💙 Venmo</strong>
                <div class="copy-row">
                    <span class="payment-username">@DanStudz</span>
                    <button class="copy-btn" onclick="copyToClipboard('@DanStudz')">Copy</button>
                </div>
            </div>
        `;
    } else if (admin === 'Thomas') {
        paymentHtml = `
            <div class="payment-option">
                <strong>💰 PayPal</strong>
                <div class="copy-row">
                    <span class="payment-username">@Thomas061298</span>
                    <button class="copy-btn" onclick="copyToClipboard('@Thomas061298')">Copy</button>
                </div>
                <div class="disclaimer">⚠️ Please send with Friends and Family option</div>
            </div>
        `;
    } else {
        paymentHtml = `
            <div class="payment-option">
                <strong>⏳ Payment Options Coming Soon</strong>
                <div class="disclaimer">Please contact Kingi directly for payment options</div>
            </div>
        `;
    }
    
    document.getElementById('modalTitle').textContent = 'Complete Order';
    document.getElementById('modalBody').innerHTML = `
        <div class="order-summary" style="background:#0d0d1a;padding:12px;border-radius:12px;margin-bottom:16px">
            <strong>Customer:</strong> ${customerName} (${customerIgn})<br>
            <strong>Admin:</strong> ${admin}<br>
            <strong>Total:</strong> $${total.toFixed(2)}
            ${currentTimePreference && currentTimePreference !== 'Whenever Possible' ? '<br><strong>Time Preference:</strong> ' + currentTimePreference : ''}
        </div>
        ${finalNotes ? '<div class="order-section"><div class="section-title">📝 Notes</div><div>' + finalNotes + '</div></div>' : ''}
        ${paymentHtml}
        <div class="disclaimer">Once payment is received, your order will be placed in queue 🧙</div>
    `;
    document.getElementById('modalFooter').innerHTML = '<button class="cancel-btn" onclick="closeModal()">Cancel</button><button class="confirm-btn" onclick="submitOrder()">Submit Order</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast('Copied: ' + text);
}

async function submitOrder() {
    if (!cartItems.length) {
        showToast('Add items to your cart first');
        return;
    }
    
    showLoading('Submitting order...');
    
    var notes = document.getElementById('notesInput')?.value || '';
    var fullCustomerName = customerName + ' (' + customerIgn + ')';
    
    var finalNotes = notes;
    if (currentTimePreference && currentTimePreference !== 'Whenever Possible') {
        finalNotes = finalNotes ? finalNotes + '\n\nTime Preference: ' + currentTimePreference : 'Time Preference: ' + currentTimePreference;
    }
    
    var orderData = {
        type: 'submitOrder',
        customerName: fullCustomerName,
        otherRequests: finalNotes,
        paymentMethod: 'Web Order',
        assignedAdmin: selectedAdmin,
        items: cartItems.map(function(item) {
            return {
                type: item.type,
                pokemonName: item.pokemonName,
                quantity: item.quantity,
                price: item.price || calculateItemPrice(item),
                raidTier: item.raidTier,
                coinAmount: item.coinAmount
            };
        })
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
            clearCart();  // This now clears localStorage too
            localStorage.removeItem('pokespawn_cart');  // ← ADD THIS
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

// ========== EVENTS ==========
async function loadEvents() {
    try {
        const response = await fetch('https://leekduck.com/feeds/events.json');
        var events = await response.json();
        var now = new Date();
        now.setHours(0, 0, 0, 0);
        
        var currentEvents = [];
        var upcomingEvents = [];
        
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            var startDate = new Date(event.start);
            var endDate = new Date(event.end);
            startDate.setHours(0, 0, 0, 0);
            
            if (startDate <= now && endDate >= now) {
                currentEvents.push(event);
            } else if (startDate > now) {
                upcomingEvents.push(event);
            }
        }
        
        displayCurrentEvents(currentEvents);
        displayUpcomingEvents(upcomingEvents);
        
        var activeTab = document.querySelector('.tab-content.active')?.id;
        if (activeTab === 'upcoming') {
            loadDebutData();
        }
    } catch (e) {
        console.error('Error loading events:', e);
    }
}

function getEventImage(eventName) {
    // Pokemon name to ID mapping
    var pokemonMap = {
        'Pikachu': 25, 'Slowbro': 80, 'Zamazenta': 889, 'Regieleki': 894,
        'Houndoom': 229, 'Latias': 380, 'Regidrago': 895, 'Kyogre': 382,
        'Groudon': 383, 'Tapu Koko': 785, 'Tapu Lele': 786, 'Manectric': 310,
        'Aerodactyl': 142, 'Alakazam': 65, 'Sharpedo': 319, 'Banette': 354,
        'Latios': 381, 'Tinkatink': 957, 'Woobat': 527, 'Trapinch': 328,
        'Drilbur': 529, 'Regirock': 377, 'Shuckle': 213
    };
    
    for (var pokemon in pokemonMap) {
        if (eventName.includes(pokemon)) {
            return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + pokemonMap[pokemon] + '.png';
        }
    }
    // No Pokemon found - return emoji
    return '😎';
}

function displayCurrentEvents(events) {
    var container = document.getElementById('currentEventsList');
    if (!container) return;
    
    if (!events.length) {
        container.innerHTML = '<div class="loading">No current events</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < events.length; i++) {
        var e = events[i];
        var imageSrc = getEventImage(e.name);
        var isEmoji = !imageSrc.startsWith('http');
        
        html += '<div class="event-card-with-img">';
        if (isEmoji) {
            html += '<div class="event-emoji">' + imageSrc + '</div>';
        } else {
            html += '<img src="' + imageSrc + '" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<div class=\\\'event-emoji\\\'😎</div>\'">';
        }
        html += '<div class="event-info">';
        html += '<div class="event-name">' + e.name + '</div>';
        html += '<div class="event-heading">' + (e.heading || 'Event') + '</div>';
        html += '<div class="event-time">🟢 ' + new Date(e.start).toLocaleString() + '</div>';
        html += '<div class="event-time">🔴 ' + new Date(e.end).toLocaleString() + '</div>';
        html += '</div>';
        html += '<div class="event-buttons">';
        html += '<button class="event-view-btn" onclick="window.open(\'' + e.link + '\', \'_blank\')">View</button>';
        html += '</div></div>';
    }
    container.innerHTML = html;
}

function displayUpcomingEvents(events) {
    var container = document.getElementById('upcomingEventsList');
    if (!container) return;
    
    if (!events.length) {
        container.innerHTML = '<div class="loading">No upcoming events</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < events.length; i++) {
        var e = events[i];
        var imageSrc = getEventImage(e.name);
        var isEmoji = !imageSrc.startsWith('http');
        
        html += '<div class="event-card-with-img">';
        if (isEmoji) {
            html += '<div class="event-emoji">' + imageSrc + '</div>';
        } else {
            html += '<img src="' + imageSrc + '" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<div class=\\\'event-emoji\\\'😎</div>\'">';
        }
        html += '<div class="event-info">';
        html += '<div class="event-name">' + e.name + '</div>';
        html += '<div class="event-heading">' + (e.heading || 'Event') + '</div>';
        html += '<div class="event-time">🟢 Starts: ' + new Date(e.start).toLocaleString() + '</div>';
        html += '<div class="event-time">🔴 Ends: ' + new Date(e.end).toLocaleString() + '</div>';
        html += '</div>';
        html += '<div class="event-buttons">';
        html += '<button class="event-view-btn" onclick="window.open(\'' + e.link + '\', \'_blank\')">View</button>';
        html += '<button class="event-rsvp-btn" onclick=\'showRSVPDialog("' + e.name.replace(/'/g, "\\'") + '", "' + e.link + '", "' + new Date(e.start).toLocaleString() + '", "' + new Date(e.end).toLocaleString() + '")\'>RSVP</button>';
        html += '</div></div>';
    }
    container.innerHTML = html;
}

// ========== DEBUT DATA (Only for Upcoming) ==========
async function loadDebutData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/Skatecrete/pogo-raid-data/main/debuts.json');
        const data = await response.json();
        var debuts = data.debuts || [];
        
        // Use NZ time
        var nzTime = new Date().toLocaleString('en-US', { timeZone: 'Pacific/Auckland' });
        var todayNz = new Date(nzTime);
        todayNz.setHours(0, 0, 0, 0);
        
        var upcomingDebut = null;
        var closestStartDate = null;
        
        for (var i = 0; i < debuts.length; i++) {
            var debut = debuts[i];
            var dateMatch = debut.event_date.match(/(\w+)\s+(\d+)(?:st|nd|rd|th)?/);
            if (dateMatch) {
                var month = dateMatch[1];
                var day = parseInt(dateMatch[2]);
                var year = new Date().getFullYear();
                var monthMap = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
                var startDate = new Date(year, monthMap[month], day);
                
                // Only show if start date is IN THE FUTURE (not today or past)
                if (startDate > todayNz) {
                    // Find the closest upcoming debut
                    if (closestStartDate === null || startDate < closestStartDate) {
                        closestStartDate = startDate;
                        upcomingDebut = debut;
                    }
                }
            }
        }
        
        if (upcomingDebut) {
            displayDebutBanner(upcomingDebut, closestStartDate);
        }
    } catch (e) {
        console.error('Error loading debut data:', e);
    }
}

function displayDebutBanner(debut, startDate) {
    var banner = document.getElementById('debutBanner');
    var eventNameElem = document.getElementById('debutEventName');
    var countdownElem = document.getElementById('debutCountdown');
    var viewEventBtn = document.getElementById('debutViewEventBtn');
    
    if (!banner) return;
    
    eventNameElem.textContent = debut.event_name;
    viewEventBtn.onclick = function() { findAndOpenLeekDuckEvent(debut.event_name); };
    currentDebutData = debut;
    
    // Calculate days until event starts
    var now = new Date();
    var daysUntil = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil > 0) {
        countdownElem.textContent = '⏰ Starts in ' + daysUntil + ' days';
        countdownElem.style.color = '#4CAF50';
    } else if (daysUntil === 0) {
        countdownElem.textContent = '⏰ Starts today!';
        countdownElem.style.color = '#FFA500';
    } else {
        // Event already started - don't show in upcoming
        banner.style.display = 'none';
        return;
    }
    
    banner.style.display = 'block';
}

function showDebutDetails() {
    if (!currentDebutData) return;
    var allPokemon = (currentDebutData.new_pokemon || []).concat(currentDebutData.new_shiny || []);
    var isShiny = currentDebutData.new_shiny || [];
    
    var html = '<div class="order-stats"><div>New Pokémon Debuts</div></div>';
    for (var i = 0; i < allPokemon.length; i++) {
        var pokemon = allPokemon[i];
        var isShinyPokemon = isShiny.includes(pokemon);
        html += '<div class="order-section">';
        html += '<div class="section-title">' + (isShinyPokemon ? '✨ NEW SHINY ✨' : '🌟 NEW POKÉMON 🌟') + '</div>';
        html += '<div>' + pokemon + '</div>';
        html += '</div>';
    }
    
    document.getElementById('modalTitle').textContent = 'Debut Pokémon';
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('modalFooter').innerHTML = '<button class="confirm-btn" onclick="closeModal()">Close</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

async function findAndOpenLeekDuckEvent(eventName) {
    try {
        const response = await fetch('https://leekduck.com/feeds/events.json');
        var events = await response.json();
        var foundEvent = null;
        for (var i = 0; i < events.length; i++) {
            if (events[i].name.includes(eventName) || eventName.includes(events[i].name)) {
                foundEvent = events[i];
                break;
            }
        }
        if (foundEvent && foundEvent.link) {
            window.open(foundEvent.link, '_blank');
        } else {
            showToast('Event link not found');
        }
    } catch (e) {
        showToast('Could not open event');
    }
}

function showRSVPDialog(eventName, eventLink, startDate, endDate) {
    document.getElementById('modalTitle').textContent = 'RSVP for ' + eventName;
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
    var name = document.getElementById('rsvpName')?.value.trim();
    var ign = document.getElementById('rsvpIgn')?.value.trim();
    
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
            showToast('RSVP sent to ' + admin + '! They will contact you.');
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
    var name = document.getElementById('historyName')?.value.trim();
    var ign = document.getElementById('historyIgn')?.value.trim();
    
    if (!name || !ign) {
        showToast('Enter both your name and in-game name');
        return;
    }
    
    showLoading('Loading your history...');
    
    try {
        var fullCustomerName = name + ' (' + ign + ')';
        
        // Fetch from local JSON files
        var ordersResponse = await fetch('data/orders.json');
        var rsvpsResponse = await fetch('data/rsvps.json');
        
        var allOrders = await ordersResponse.json();
        var allRSVPs = await rsvpsResponse.json();
        
        // Filter orders for this customer
        var customerOrderRows = allOrders.filter(function(order) {
            return order.customer === fullCustomerName;
        });
        
        // GROUP items by orderId
        var groupedOrders = {};
        for (var i = 0; i < customerOrderRows.length; i++) {
            var row = customerOrderRows[i];
            var orderId = row.orderId;
            
            if (!groupedOrders[orderId]) {
                groupedOrders[orderId] = {
                    orderId: orderId,
                    date: row.date,
                    customer: row.customer,
                    status: row.status,
                    paymentMethod: row.paymentMethod,
                    otherRequests: row.otherRequests,
                    assignedAdmin: row.assignedAdmin,
                    total: 0,
                    items: []
                };
            }
            
            // Add item to this order
            groupedOrders[orderId].items.push({
                huntType: row.huntType,
                raidType: row.raidType,
                pokemon: row.pokemon,
                quantity: row.quantity,
                coins: row.coins,
                price: row.itemPrice
            });
            
            groupedOrders[orderId].total += row.itemPrice;
        }
        
        // Convert grouped object back to array
        var customerOrders = Object.values(groupedOrders);
        
        // Sort by date (newest first)
        customerOrders.sort(function(a, b) {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Filter RSVPs for this customer
        var customerRSVPs = allRSVPs.filter(function(rsvp) {
            return rsvp.customer === fullCustomerName;
        });
        
        hideLoading();
        
        if (customerOrders.length > 0 || customerRSVPs.length > 0) {
            displayCustomerHistory(customerOrders, customerRSVPs);
        } else {
            document.getElementById('historyEmpty').style.display = 'block';
            document.getElementById('historyOrders').style.display = 'none';
            document.getElementById('historyRSVPs').style.display = 'none';
            showToast('No history found');
        }
        
    } catch (e) {
        hideLoading();
        console.error('History error:', e);
        showToast('Failed to load history');
    }
}

function displayCustomerHistory(orders, rsvps) {
    var ordersContainer = document.getElementById('ordersHistoryList');
    var rsvpsContainer = document.getElementById('rsvpsHistoryList');
    var ordersSection = document.getElementById('historyOrders');
    var rsvpsSection = document.getElementById('historyRSVPs');
    var emptySection = document.getElementById('historyEmpty');
    
    var hasData = false;
    
    if (orders && orders.length) {
        ordersSection.style.display = 'block';
        var ordersHtml = '';
        for (var i = 0; i < orders.length; i++) {
            var order = orders[i];
            
            // Build items display from grouped items
            var itemsDisplay = '';
            for (var j = 0; j < order.items.length; j++) {
                var item = order.items[j];
                var huntType = item.huntType || '';
                var pokemon = item.pokemon || '';
                var quantity = item.quantity || '1';
                var coins = item.coins || '';
                var price = item.price || 0;
                
                if (huntType === 'Coins') {
                    itemsDisplay += '• ' + coins + ' Coins x' + quantity + ' - $' + price.toFixed(2) + '<br>';
                } else if (huntType === 'Raid') {
                    var raidType = item.raidType || '';
                    itemsDisplay += '• ' + huntType + ': ' + pokemon + ' (' + raidType + ') x' + quantity + ' - $' + price.toFixed(2) + '<br>';
                } else {
                    itemsDisplay += '• ' + huntType + ': ' + pokemon + ' x' + quantity + ' - $' + price.toFixed(2) + '<br>';
                }
            }
            
            var statusClass = (order.status === 'Paid' || order.status === 'Completed') ? 'status-paid' : 'status-pending';
            var statusText = order.status || 'Pending';
            var orderDate = order.date ? order.date.split('T')[0] : '';
            
            ordersHtml += '<div class="order-history-item" onclick=\'showOrderDetail(' + JSON.stringify(order).replace(/'/g, "&#39;") + ')\'>';
            ordersHtml += '<div class="order-history-header">';
            ordersHtml += '<span class="order-id">' + (order.orderId || 'Order') + '</span>';
            ordersHtml += '<span class="order-total">$' + order.total.toFixed(2) + '</span>';
            ordersHtml += '</div>';
            ordersHtml += '<div class="order-details">' + itemsDisplay + '</div>';
            ordersHtml += '<div class="order-status ' + statusClass + '">' + statusText + '</div>';
            ordersHtml += '<div class="order-details">' + orderDate + '</div>';
            ordersHtml += '</div>';
        }
        ordersContainer.innerHTML = ordersHtml;
        hasData = true;
    } else {
        ordersSection.style.display = 'none';
    }
    
    if (rsvps && rsvps.length) {
        rsvpsSection.style.display = 'block';
        var rsvpsHtml = '';
        for (var i = 0; i < rsvps.length; i++) {
            var rsvp = rsvps[i];
            var statusClass = (rsvp.status === 'Confirmed') ? 'status-paid' : 'status-pending';
            rsvpsHtml += '<div class="rsvp-history-item">';
            rsvpsHtml += '<div class="rsvp-event-name" onclick="window.open(\'' + (rsvp.eventLink || '') + '\', \'_blank\')">' + (rsvp.eventName || 'Event') + '</div>';
            rsvpsHtml += '<div class="rsvp-event-date">📅 ' + (rsvp.eventStartDate || rsvp.eventDate || '') + '</div>';
            rsvpsHtml += '<div class="order-details">RSVP\'d: ' + (rsvp.date ? rsvp.date.split('T')[0] : '') + '</div>';
            rsvpsHtml += '<div class="order-status ' + statusClass + '">' + (rsvp.status || 'Pending') + '</div>';
            rsvpsHtml += '</div>';
        }
        rsvpsContainer.innerHTML = rsvpsHtml;
        hasData = true;
    } else {
        rsvpsSection.style.display = 'none';
    }
    
    emptySection.style.display = hasData ? 'none' : 'block';
}

function showOrderDetail(order) {
    var itemsHtml = '';
    if (order.items && order.items.length) {
        for (var i = 0; i < order.items.length; i++) {
            var item = order.items[i];
            var huntType = item.huntType || '';
            var pokemon = item.pokemon || '';
            var quantity = item.quantity || '1';
            var coins = item.coins || '';
            var price = item.price || 0;
            
            if (huntType === 'Coins') {
                itemsHtml += '<div>• ' + coins + ' Coins x' + quantity + ' - $' + price.toFixed(2) + '</div>';
            } else if (huntType === 'Raid') {
                var raidType = item.raidType || '';
                itemsHtml += '<div>• ' + huntType + ': ' + pokemon + ' (' + raidType + ') x' + quantity + ' - $' + price.toFixed(2) + '</div>';
            } else {
                itemsHtml += '<div>• ' + huntType + ': ' + pokemon + ' x' + quantity + ' - $' + price.toFixed(2) + '</div>';
            }
        }
    } else if (typeof order.items === 'string') {
        var itemsList = order.items.split(', ');
        for (var i = 0; i < itemsList.length; i++) {
            itemsHtml += '<div>• ' + itemsList[i] + '</div>';
        }
    }
    
    document.getElementById('modalTitle').textContent = 'Order ' + (order.orderId || 'Details');
    document.getElementById('modalBody').innerHTML = `
        <div class="order-stats">
            <div><strong>Date:</strong> ${order.date ? order.date.split(' ')[0] : 'N/A'}</div>
            <div><strong>Customer:</strong> ${order.customer || 'N/A'}</div>
            <div><strong>Status:</strong> <span class="${order.status === 'Paid' ? 'status-paid' : 'status-pending'}">${order.status || 'Pending'}</span></div>
            <div><strong>Payment:</strong> ${order.paymentMethod || 'N/A'}</div>
            <div><strong>Total:</strong> <span class="status-paid">$${(order.total || 0).toFixed(2)}</span></div>
        </div>
        ${itemsHtml ? '<div class="order-section"><div class="section-title">📦 Items</div>' + itemsHtml + '</div>' : ''}
        ${order.otherRequests ? '<div class="order-section"><div class="section-title">📝 Notes</div><div>' + order.otherRequests + '</div></div>' : ''}
    `;
    document.getElementById('modalFooter').innerHTML = '<button class="confirm-btn" onclick="closeModal()">Close</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

// ========== UTILITIES ==========
function showLoading(message) {
    var modal = document.getElementById('loadingModal');
    var msgElem = document.getElementById('loadingMessage');
    if (msgElem) msgElem.textContent = message;
    if (modal) modal.style.display = 'flex';
}

function hideLoading() {
    var modal = document.getElementById('loadingModal');
    if (modal) modal.style.display = 'none';
}

function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(function() { toast.style.opacity = '0'; }, 2000);
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
window.showDebutDetails = showDebutDetails;
window.showKingiMessage = showKingiMessage;
window.closeModal = closeModal;
