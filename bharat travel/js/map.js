// ==========================================
// MAP.JS - Interactive Map (India Centered)
// ==========================================

let map = null;
let markers = [];
let markerGroup = null;

// ========== INITIALIZE MAP (INDIA CENTERED) ==========
function initMap() {
    // Map centered on India
    map = L.map('mapElement', {
        center: [22.9734, 78.6569],  // Center of India
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: true
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Create marker group
    markerGroup = L.featureGroup().addTo(map);

    // Click on map to add destination
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        reverseGeocode(lat, lng);
    });

    // Initialize search
    initMapSearch();

    // Initialize panel toggle
    initDestinationsPanel();

    // Map action buttons
    document.getElementById('clearMarkersBtn').addEventListener('click', clearAllMarkers);
    document.getElementById('fitBoundsBtn').addEventListener('click', fitAllMarkers);
}

// ========== MAP SEARCH (INDIA RESTRICTED) ==========
function initMapSearch() {
    const searchInput = document.getElementById('mapSearch');
    const searchBtn = document.getElementById('mapSearchBtn');
    const searchResults = document.getElementById('searchResults');

    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length < 3) {
            searchResults.classList.remove('active');
            return;
        }

        debounceTimer = setTimeout(() => searchLocation(query), 500);
    });

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) searchLocation(query);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) searchLocation(query);
        }
    });

    // Close search results on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.map-toolbar')) {
            searchResults.classList.remove('active');
        }
    });
}

async function searchLocation(query) {
    const searchResults = document.getElementById('searchResults');

    try {
        // INDIA RESTRICTED SEARCH using countrycodes=in
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=6`
        );
        const data = await response.json();

        if (data.length === 0) {
            searchResults.innerHTML = `
                <div class="search-result-item">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>No results found in India</span>
                </div>
            `;
            searchResults.classList.add('active');
            return;
        }

        searchResults.innerHTML = data.map(item => `
            <div class="search-result-item"
                 onclick="addDestinationFromSearch(${item.lat}, ${item.lon}, '${item.display_name.replace(/'/g, "\\'")}')">
                <i class="fas fa-map-marker-alt"></i>
                <span>${item.display_name}</span>
            </div>
        `).join('');

        searchResults.classList.add('active');

    } catch (error) {
        console.error('Search error:', error);
        showToast('Search failed. Please try again.', 'error');
    }
}

function addDestinationFromSearch(lat, lon, name) {
    const shortName = name.split(',').slice(0, 3).join(',').trim();
    addDestination(parseFloat(lat), parseFloat(lon), shortName);

    document.getElementById('searchResults').classList.remove('active');
    document.getElementById('mapSearch').value = '';

    // Pan to location
    map.flyTo([lat, lon], 10, { duration: 1.5 });
}

// ========== REVERSE GEOCODE ==========
async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();

        const name = data.display_name
            ? data.display_name.split(',').slice(0, 3).join(',').trim()
            : `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        addDestination(lat, lng, name);

    } catch (error) {
        addDestination(lat, lng, `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }
}

// ========== DESTINATION MANAGEMENT ==========
function addDestination(lat, lng, name) {
    const trip = getCurrentTrip();
    if (!trip) {
        showToast('Please create or select a trip first!', 'warning');
        return;
    }

    const destination = {
        id: generateId(),
        name: name,
        lat: lat,
        lng: lng,
        addedAt: new Date().toISOString()
    };

    trip.destinations.push(destination);
    saveTrips();

    addMarkerToMap(destination, trip.destinations.length);
    renderDestinationsList(trip);
    updateStats();

    showToast(`Added: ${name}`, 'success', 2000);
}

function removeDestination(destId) {
    const trip = getCurrentTrip();
    if (!trip) return;

    trip.destinations = trip.destinations.filter(d => d.id !== destId);
    saveTrips();

    refreshMarkers(trip);
    renderDestinationsList(trip);
    updateStats();

    showToast('Destination removed', 'info', 2000);
}

function addMarkerToMap(destination, index) {
    // Custom India-themed marker
    const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background: linear-gradient(135deg, #FF9933, #FF6B35, #138808);
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
            box-shadow: 0 2px 8px rgba(255, 107, 53, 0.4);
            border: 2px solid white;
        ">${index}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    const marker = L.marker([destination.lat, destination.lng], { icon })
        .addTo(markerGroup)
        .bindPopup(`
            <div style="text-align: center; padding: 5px;">
                <strong style="font-size: 14px;">${destination.name}</strong>
                <br>
                <small style="color: #666;">
                    ${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}
                </small>
                <br>
                <button onclick="removeDestination('${destination.id}')"
                    style="margin-top: 8px; padding: 4px 12px; background: #EF5350;
                    color: white; border: none; border-radius: 6px; cursor: pointer;
                    font-size: 12px;">
                    Remove
                </button>
            </div>
        `);

    markers.push({ id: destination.id, marker });
}

function clearAllMarkers() {
    const trip = getCurrentTrip();
    if (!trip) return;

    if (confirm('Remove all destinations from this trip?')) {
        trip.destinations = [];
        saveTrips();
        markerGroup.clearLayers();
        markers = [];
        renderDestinationsList(trip);
        updateStats();
        showToast('All destinations cleared', 'info');
    }
}

function fitAllMarkers() {
    if (markerGroup.getLayers().length > 0) {
        map.fitBounds(markerGroup.getBounds().pad(0.1));
    } else {
        // Reset to India view
        map.flyTo([22.9734, 78.6569], 5, { duration: 1 });
        showToast('No destinations to fit. Showing India map.', 'info');
    }
}

function refreshMarkers(trip) {
    markerGroup.clearLayers();
    markers = [];

    trip.destinations.forEach((dest, index) => {
        addMarkerToMap(dest, index + 1);
    });
}

function renderDestinationsList(trip) {
    const list = document.getElementById('destinationsList');
    const count = document.getElementById('destCount');

    count.textContent = trip.destinations.length;

    if (trip.destinations.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
                <i class="fas fa-map-pin" style="font-size: 2rem; opacity: 0.3;
                   margin-bottom: 0.5rem; display: block;"></i>
                <p style="font-size: 0.85rem;">Click on the India map or search
                   to add destinations</p>
            </div>
        `;
        return;
    }

    list.innerHTML = trip.destinations.map((dest, index) => `
        <div class="destination-item">
            <div class="dest-marker">${index + 1}</div>
            <div class="dest-info">
                <div class="dest-name">${dest.name}</div>
                <div class="dest-coords">${dest.lat.toFixed(4)}, ${dest.lng.toFixed(4)}</div>
            </div>
            <div class="dest-actions">
                <button onclick="flyToDestination(${dest.lat}, ${dest.lng})" title="Go to">
                    <i class="fas fa-crosshairs"></i>
                </button>
                <button onclick="removeDestination('${dest.id}')" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function flyToDestination(lat, lng) {
    map.flyTo([lat, lng], 12, { duration: 1.5 });
}

// ========== DESTINATIONS PANEL ==========
function initDestinationsPanel() {
    const panel = document.getElementById('destinationsPanel');
    const toggleBtn = document.getElementById('toggleDestPanel');

    toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
        const icon = toggleBtn.querySelector('i');
        icon.className = panel.classList.contains('collapsed')
            ? 'fas fa-chevron-left'
            : 'fas fa-chevron-right';
    });
}

// ========== LOAD MAP WITH TRIP ==========
function initMapWithTrip(trip) {
    if (!map) {
        initMap();
    }

    markerGroup.clearLayers();
    markers = [];

    trip.destinations.forEach((dest, index) => {
        addMarkerToMap(dest, index + 1);
    });

    if (trip.destinations.length > 0) {
        setTimeout(() => fitAllMarkers(), 500);
    }

    renderDestinationsList(trip);
}

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initMap, 3000);
});