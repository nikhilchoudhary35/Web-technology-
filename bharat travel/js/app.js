// ==========================================
// APP.JS - Main Application Controller
// Bharat Trip Planner - India Based
// ==========================================

// ========== DATA STORE ==========
const AppState = {
    currentTrip: null,
    trips: [],
    theme: 'light'
};

// ========== LOCAL STORAGE HELPERS ==========
const Storage = {
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage set error:', e);
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    }
};

// ========== TOAST NOTIFICATIONS ==========
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    toast.innerHTML = `
        <i class="toast-icon ${icons[type]}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        removeToast(toast);
    });

    setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
    if (!toast.parentElement) return;
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
}

// ========== UTILITY FUNCTIONS ==========
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-IN', options);
}

// ===== INDIAN RUPEE FORMATTER =====
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount || 0);
}

function getDaysBetween(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// ========== THEME MANAGEMENT ==========
function initTheme() {
    const savedTheme = Storage.get('theme') || 'light';
    AppState.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

function toggleTheme() {
    AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', AppState.theme);
    Storage.set('theme', AppState.theme);
    updateThemeIcon();
    showToast(`Switched to ${AppState.theme} mode`, 'info', 2000);
}

function updateThemeIcon() {
    const icon = document.querySelector('#themeToggle i');
    icon.className = AppState.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// ========== MODAL MANAGEMENT ==========
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = '';
}

// ========== NAVBAR ==========
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        updateActiveNavLink();
    });

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');

    let currentSection = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === currentSection) {
            link.classList.add('active');
        }
    });
}

// ========== QUICK SEARCH DESTINATION (from hero tags) ==========
function quickSearchDestination(place) {
    const trip = getCurrentTrip();
    if (!trip) {
        showToast('Please create a trip first!', 'warning');
        document.getElementById('startPlanningBtn').click();
        return;
    }

    // Scroll to map section
    document.getElementById('map').scrollIntoView({ behavior: 'smooth' });

    // Set search input and trigger search
    setTimeout(() => {
        document.getElementById('mapSearch').value = place;
        document.getElementById('mapSearchBtn').click();
    }, 500);
}

// ========== TRIP MANAGEMENT ==========
function loadTrips() {
    AppState.trips = Storage.get('trips') || [];
    updateStats();
}

function saveTrips() {
    Storage.set('trips', AppState.trips);
    updateStats();
}

function getCurrentTrip() {
    if (!AppState.currentTrip) return null;
    return AppState.trips.find(t => t.id === AppState.currentTrip);
}

function setCurrentTrip(tripId) {
    AppState.currentTrip = tripId;
    Storage.set('currentTripId', tripId);

    const trip = getCurrentTrip();
    if (trip) {
        if (typeof initMapWithTrip === 'function') initMapWithTrip(trip);
        if (typeof renderItinerary === 'function') renderItinerary(trip);
        if (typeof renderBudget === 'function') renderBudget(trip);
        if (typeof renderGallery === 'function') renderGallery(trip);
        if (typeof updateWeatherQuickLinks === 'function') updateWeatherQuickLinks(trip);

        showToast(`Loaded trip: ${trip.name}`, 'success');
    }
}

function createTrip(data) {
    const trip = {
        id: generateId(),
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        budget: parseFloat(data.budget) || 0,
        description: data.description || '',
        coverImage: data.coverImage || '',
        destinations: [],
        itinerary: [],
        expenses: [],
        photos: [],
        createdAt: new Date().toISOString()
    };

    AppState.trips.push(trip);
    saveTrips();
    return trip;
}

function updateTrip(tripId, data) {
    const index = AppState.trips.findIndex(t => t.id === tripId);
    if (index !== -1) {
        AppState.trips[index] = { ...AppState.trips[index], ...data };
        saveTrips();
        return AppState.trips[index];
    }
    return null;
}

function deleteTrip(tripId) {
    AppState.trips = AppState.trips.filter(t => t.id !== tripId);
    if (AppState.currentTrip === tripId) {
        AppState.currentTrip = null;
        Storage.remove('currentTripId');
    }
    saveTrips();
}

function renderTripsList() {
    const tripsList = document.getElementById('tripsList');
    const noTripsMessage = document.getElementById('noTripsMessage');

    if (AppState.trips.length === 0) {
        tripsList.style.display = 'none';
        noTripsMessage.style.display = 'block';
        return;
    }

    tripsList.style.display = 'grid';
    noTripsMessage.style.display = 'none';

    tripsList.innerHTML = AppState.trips.map(trip => `
        <div class="trip-card ${trip.id === AppState.currentTrip ? 'active-trip' : ''}"
             data-trip-id="${trip.id}">
            <div class="trip-card-cover">
                ${trip.coverImage
                    ? `<img src="${trip.coverImage}" alt="${trip.name}"
                           onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fas fa-suitcase\\'></i>'">`
                    : '<i class="fas fa-suitcase"></i>'
                }
            </div>
            <div class="trip-card-body">
                <h3>${trip.name}</h3>
                <div class="trip-dates">
                    <i class="fas fa-calendar-alt"></i>
                    ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}
                </div>
                <div class="trip-budget-info">
                    <i class="fas fa-indian-rupee-sign"></i> Budget: ${formatCurrency(trip.budget)}
                </div>
            </div>
            <div class="trip-card-actions">
                <button class="trip-select-btn" onclick="selectTrip('${trip.id}')">
                    <i class="fas fa-check"></i> Select
                </button>
                <button class="trip-edit-btn" onclick="editTrip('${trip.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="trip-delete-btn" onclick="confirmDeleteTrip('${trip.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function selectTrip(tripId) {
    setCurrentTrip(tripId);
    closeModal('tripsListModal');
    renderTripsList();
}

function editTrip(tripId) {
    const trip = AppState.trips.find(t => t.id === tripId);
    if (!trip) return;

    document.getElementById('tripName').value = trip.name;
    document.getElementById('tripStart').value = trip.startDate;
    document.getElementById('tripEnd').value = trip.endDate;
    document.getElementById('tripBudget').value = trip.budget;
    document.getElementById('tripDescription').value = trip.description;
    document.getElementById('tripCover').value = trip.coverImage;

    document.getElementById('modalTitle').textContent = 'Edit Trip';
    document.getElementById('tripFormBtnText').textContent = 'Update Trip';
    document.getElementById('tripForm').dataset.editId = tripId;

    closeModal('tripsListModal');
    openModal('tripModal');
}

function confirmDeleteTrip(tripId) {
    if (confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
        deleteTrip(tripId);
        renderTripsList();
        showToast('Trip deleted successfully', 'success');
    }
}

function updateStats() {
    const totalTrips = AppState.trips.length;
    let totalDest = 0;
    let totalPhotos = 0;

    AppState.trips.forEach(trip => {
        totalDest += (trip.destinations || []).length;
        totalPhotos += (trip.photos || []).length;
    });

    animateCounter('totalTrips', totalTrips);
    animateCounter('totalDestinations', totalDest);
    animateCounter('totalPhotos', totalPhotos);
}

function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const current = parseInt(el.textContent) || 0;
    if (current === target) return;

    const duration = 1000;
    const step = (target - current) / (duration / 16);
    let value = current;

    function update() {
        value += step;
        if ((step > 0 && value >= target) || (step < 0 && value <= target)) {
            el.textContent = target;
            return;
        }
        el.textContent = Math.round(value);
        requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

// ========== LOADER ==========
function initLoader() {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        loader.classList.add('hidden');
    }, 2500);
}

// ========== EVENT LISTENERS ==========
function initEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Start Planning button
    document.getElementById('startPlanningBtn').addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Create New Trip';
        document.getElementById('tripFormBtnText').textContent = 'Create Trip';
        document.getElementById('tripForm').reset();
        delete document.getElementById('tripForm').dataset.editId;
        openModal('tripModal');
    });

    // View Trips button
    document.getElementById('viewTripsBtn').addEventListener('click', () => {
        renderTripsList();
        openModal('tripsListModal');
    });

    // Share nav button
    document.getElementById('shareNavBtn').addEventListener('click', () => {
        if (typeof openShareModal === 'function') openShareModal();
    });

    // Trip Form submission
    document.getElementById('tripForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById('tripName').value,
            startDate: document.getElementById('tripStart').value,
            endDate: document.getElementById('tripEnd').value,
            budget: document.getElementById('tripBudget').value,
            description: document.getElementById('tripDescription').value,
            coverImage: document.getElementById('tripCover').value
        };

        const editId = e.target.dataset.editId;

        if (editId) {
            updateTrip(editId, data);
            showToast('Trip updated successfully!', 'success');
            if (AppState.currentTrip === editId) {
                setCurrentTrip(editId);
            }
        } else {
            const trip = createTrip(data);
            setCurrentTrip(trip.id);
            showToast('Trip created successfully! 🇮🇳', 'success');
        }

        closeModal('tripModal');
        e.target.reset();
        delete e.target.dataset.editId;
    });

    // Modal close buttons
    document.getElementById('closeTripModal').addEventListener('click',
        () => closeModal('tripModal'));
    document.getElementById('closeTripsListModal').addEventListener('click',
        () => closeModal('tripsListModal'));

    // Create first trip from empty state
    document.getElementById('createFirstTrip').addEventListener('click', () => {
        closeModal('tripsListModal');
        document.getElementById('startPlanningBtn').click();
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            const modal = overlay.closest('.modal');
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
            document.body.style.overflow = '';

            const lightbox = document.getElementById('lightbox');
            if (lightbox && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
            }
        }
    });
}

// ========== INITIALIZE APP ==========
function initApp() {
    initLoader();
    initTheme();
    initNavbar();
    loadTrips();
    initEventListeners();

    // Restore last active trip
    const lastTripId = Storage.get('currentTripId');
    if (lastTripId && AppState.trips.find(t => t.id === lastTripId)) {
        setTimeout(() => setCurrentTrip(lastTripId), 100);
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);