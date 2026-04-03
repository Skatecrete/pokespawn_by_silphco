// Global variables
let allPokemon = [];
let filters = { regional: false, shundo: false, pvp: false, shiny164: false };
let currentSearch = '';

// Fetch spawns from Shungo API
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

// Fetch raids from GitHub
async function fetchRaids() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/Skatecrete/pogo-raid-data/main/current_raids.json');
        return await response.json();
    } catch (error) {
        console.error('Error fetching raids:', error);
        return null;
    }
}

// Fetch events from LeekDuck
async function fetchEvents() {
    try {
        const response = await fetch('https://leekduck.com/feeds/events.json');
        return await response.json();
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}

// Get Pokemon name by ID
async function getPokemonName(id) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`);
    const data = await response.json();
    return data.names.find(n => n.language.name === 'en').name;
}

// Load and display spawns
async function loadSpawns() {
    const container = document.getElementById('spawnsList');
    container.innerHTML = '<div class="loading">Loading spawns...</div>';
    
    const spawnData = await fetchSpawns();
    if (!spawnData || spawnData.length === 0) {
        container.innerHTML = '<div class="loading">Failed to load spawns</div>';
        return;
    }
    
    // Process spawn data
    const pokemonList = [];
    for (let i = 0; i < Math.min(spawnData.length, 100); i++) {
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
    displaySpawns(allPokemon);
}

function displaySpawns(pokemonList) {
    const container = document.getElementById('spawnsList');
    
    let filtered = [...pokemonList];
    
    // Apply search
    if (currentSearch) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(currentSearch));
    }
    
    // Apply filters
    if (filters.regional) {
        // Regional filter would need a list - simplified for now
        filtered = filtered;
    }
    if (filters.shundo) {
        filtered = filtered.filter(p => p.spawnRate >= 0.65 && p.isShiny);
    }
    if (filters.pvp) {
        // PvP filter simplified
        filtered = filtered;
    }
    if (filters.shiny164) {
        filtered = filtered.filter(p => p.isShiny && p.spawnRate >= 0.65);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading">No spawns found</div>';
        return;
    }
    
    container.innerHTML = filtered.map(p => `
        <div class="pokemon-card">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${p.id}.png" 
                 onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png'">
            <div class="pokemon-info">
                <div class="pokemon-name">
                    ${p.name}
                    ${p.spawnRate >= 0.85 ? '<span class="spawn-badge" style="background:#F44336">HEAVY</span>' : ''}
                    ${p.spawnRate >= 0.65 && p.spawnRate < 0.85 ? '<span class="spawn-badge" style="background:#FF9800">MEDIUM</span>' : ''}
                    ${p.spawnRate >= 0.30 && p.spawnRate < 0.65 ? '<span class="spawn-badge" style="background:#4CAF50">LOW</span>' : ''}
                    ${p.spawnRate < 0.30 ? '<span class="spawn-badge" style="background:#2196F3">MINIMAL</span>' : ''}
                </div>
                <div class="pokemon-details">
                    Rate: ${p.spawnRate.toFixed(2)}% | 
                    <span class="shiny-rate">${p.shinyRate}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function filterSpawns() {
    currentSearch = document.getElementById('spawnSearch').value.toLowerCase();
    displaySpawns(allPokemon);
}

function toggleFilter(filter) {
    filters[filter] = !filters[filter];
    displaySpawns(allPokemon);
}

// Load and display raids
async function loadRaids() {
    const container = document.getElementById('raidsList');
    container.innerHTML = '<div class="loading">Loading raids...</div>';
    
    const raidData = await fetchRaids();
    if (!raidData) {
        container.innerHTML = '<div class="loading">Failed to load raids</div>';
        return;
    }
    
    const categories = [
        { key: 'dynamax_tier5', name: '⚡⚡⚡⚡⚡ DYNAMAX TIER 5', color: '#FF5722' },
        { key: 'dynamax_tier4', name: '⚡⚡⚡⚡ DYNAMAX TIER 4', color: '#FF9800' },
        { key: 'dynamax_tier3', name: '⚡⚡⚡ DYNAMAX TIER 3', color: '#FFC107' },
        { key: 'dynamax_tier2', name: '⚡⚡ DYNAMAX TIER 2', color: '#4CAF50' },
        { key: 'dynamax_tier1', name: '⚡ DYNAMAX TIER 1', color: '#2196F3' },
        { key: 'gigantamax', name: '💥 GIGANTAMAX', color: '#9C27B0' }
    ];
    
    let html = '';
    for (const cat of categories) {
        if (raidData[cat.key] && raidData[cat.key].length > 0) {
            html += `
                <div class="raid-category">
                    <h4>${cat.name}</h4>
                    <div class="raids-grid">
                        ${raidData[cat.key].map(raid => `<span class="raid-badge">${raid}</span>`).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    if (html === '') {
        html = '<div class="loading">No raids available</div>';
    }
    
    container.innerHTML = html;
}

// Load and display events
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
    
    // Display current events
    const currentContainer = document.getElementById('currentEventsList');
    if (currentEvents.length === 0) {
        currentContainer.innerHTML = '<div class="loading">No current events</div>';
    } else {
        currentContainer.innerHTML = currentEvents.map(e => `
            <div class="event-card">
                <div class="event-title">${e.name}</div>
                <div class="event-date">📅 ${new Date(e.start).toLocaleDateString()} - ${new Date(e.end).toLocaleDateString()}</div>
                <a href="${e.link}" target="_blank" class="event-link">🔗 View Event →</a>
            </div>
        `).join('');
    }
    
    // Display upcoming events
    const upcomingContainer = document.getElementById('upcomingEventsList');
    if (upcomingEvents.length === 0) {
        upcomingContainer.innerHTML = '<div class="loading">No upcoming events</div>';
    } else {
        upcomingContainer.innerHTML = upcomingEvents.map(e => `
            <div class="event-card">
                <div class="event-title">${e.name}</div>
                <div class="event-date">🟢 Starts: ${new Date(e.start).toLocaleString()}</div>
                <div class="event-date">🔴 Ends: ${new Date(e.end).toLocaleString()}</div>
                <a href="${e.link}" target="_blank" class="event-link">🔗 View Event →</a>
            </div>
        `).join('');
    }
}

// Order system
function selectAdmin(admin) {
    const paymentSection = document.getElementById('paymentSection');
    const paymentOptions = document.getElementById('paymentOptions');
    
    paymentSection.style.display = 'block';
    
    if (admin === 'Dan') {
        paymentOptions.innerHTML = `
            <div class="payment-option">
                <strong>💰 PayPal</strong>
                <a href="https://paypal.me/danstudz" target="_blank">Pay with PayPal</a>
                <div style="font-size:11px; color:#FFA500; margin-top:8px;">⚠️ Please send with Friends and Family option</div>
            </div>
            <div class="payment-option">
                <strong>💚 CashApp</strong>
                <a href="https://cash.app/\$DanStudz" target="_blank">Pay with CashApp</a>
            </div>
            <div class="payment-option">
                <strong>💙 Venmo</strong>
                <a href="https://venmo.com/DanStudz" target="_blank">Pay with Venmo</a>
            </div>
            <div class="disclaimer">Once payment is received, your order will be placed in queue 🧙</div>
        `;
    } else if (admin === 'Thomas') {
        paymentOptions.innerHTML = `
            <div class="payment-option">
                <strong>💰 PayPal</strong>
                <a href="https://www.paypal.me/Thomas061298" target="_blank">Pay with PayPal</a>
                <div style="font-size:11px; color:#FFA500; margin-top:8px;">⚠️ Please send with Friends and Family option</div>
            </div>
            <div class="disclaimer">Once payment is received, your order will be placed in queue 🧙</div>
        `;
    } else if (admin === 'Kingi') {
        paymentOptions.innerHTML = `
            <div class="payment-option">
                <strong>⏳ Payment Options Coming Soon</strong>
                <div style="font-size:12px; color:#FFA500; margin-top:8px;">Please contact Kingi directly for payment options</div>
            </div>
        `;
    }
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        // Load data when tab is opened
        if (tabId === 'spawns' && allPokemon.length === 0) loadSpawns();
        if (tabId === 'raids') loadRaids();
        if (tabId === 'current' || tabId === 'upcoming') loadEvents();
    });
});

// Initial load
loadSpawns();
