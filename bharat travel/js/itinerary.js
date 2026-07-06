// ==========================================
// ITINERARY.JS - Day-by-Day Trip Planning
// India Based
// ==========================================

let currentView = 'timeline';

// ========== INITIALIZE ITINERARY ==========
function initItinerary() {
    document.getElementById('addDayBtn').addEventListener('click', addDay);

    document.getElementById('timelineViewBtn').addEventListener('click',
        () => setView('timeline'));
    document.getElementById('cardsViewBtn').addEventListener('click',
        () => setView('cards'));

    document.getElementById('activityForm').addEventListener('submit', handleActivitySubmit);
    document.getElementById('closeActivityModal').addEventListener('click',
        () => closeModal('activityModal'));
}

function setView(view) {
    currentView = view;
    document.querySelectorAll('.itinerary-view-toggle .view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    const timeline = document.getElementById('itineraryTimeline');
    if (view === 'cards') {
        timeline.style.display = 'grid';
        timeline.style.gridTemplateColumns = 'repeat(auto-fill, minmax(350px, 1fr))';
        timeline.style.gap = '1.5rem';
        timeline.classList.add('cards-view');
    } else {
        timeline.style.display = 'block';
        timeline.style.gridTemplateColumns = '';
        timeline.classList.remove('cards-view');
    }
}

// ========== DAY MANAGEMENT ==========
function addDay() {
    const trip = getCurrentTrip();
    if (!trip) {
        showToast('Please create or select a trip first!', 'warning');
        return;
    }

    const dayNumber = trip.itinerary.length + 1;
    const startDate = new Date(trip.startDate);
    startDate.setDate(startDate.getDate() + dayNumber - 1);

    const day = {
        id: generateId(),
        dayNumber: dayNumber,
        date: startDate.toISOString().split('T')[0],
        title: `Day ${dayNumber}`,
        activities: []
    };

    trip.itinerary.push(day);
    saveTrips();
    renderItinerary(trip);

    showToast(`Day ${dayNumber} added!`, 'success', 2000);
}

function removeDay(dayIndex) {
    const trip = getCurrentTrip();
    if (!trip) return;

    if (confirm('Delete this day and all its activities?')) {
        trip.itinerary.splice(dayIndex, 1);

        trip.itinerary.forEach((day, i) => {
            day.dayNumber = i + 1;
            day.title = `Day ${i + 1}`;
        });

        saveTrips();
        renderItinerary(trip);
        showToast('Day removed', 'info');
    }
}

// ========== ACTIVITY MANAGEMENT ==========
function openAddActivity(dayIndex) {
    document.getElementById('activityDayIndex').value = dayIndex;
    document.getElementById('activityEditIndex').value = -1;
    document.getElementById('activityForm').reset();
    document.getElementById('activityDayIndex').value = dayIndex;
    openModal('activityModal');
}

function editActivity(dayIndex, activityIndex) {
    const trip = getCurrentTrip();
    if (!trip) return;

    const activity = trip.itinerary[dayIndex].activities[activityIndex];

    document.getElementById('activityDayIndex').value = dayIndex;
    document.getElementById('activityEditIndex').value = activityIndex;
    document.getElementById('activityName').value = activity.name;
    document.getElementById('activityTime').value = activity.time;
    document.getElementById('activityDuration').value = activity.duration || '';
    document.getElementById('activityCategory').value = activity.category;
    document.getElementById('activityLocation').value = activity.location || '';
    document.getElementById('activityCost').value = activity.cost || '';
    document.getElementById('activityNotes').value = activity.notes || '';

    openModal('activityModal');
}

function deleteActivity(dayIndex, activityIndex) {
    const trip = getCurrentTrip();
    if (!trip) return;

    trip.itinerary[dayIndex].activities.splice(activityIndex, 1);
    saveTrips();
    renderItinerary(trip);
    showToast('Activity removed', 'info', 2000);
}

function handleActivitySubmit(e) {
    e.preventDefault();

    const trip = getCurrentTrip();
    if (!trip) return;

    const dayIndex = parseInt(document.getElementById('activityDayIndex').value);
    const editIndex = parseInt(document.getElementById('activityEditIndex').value);

    const activity = {
        id: generateId(),
        name: document.getElementById('activityName').value,
        time: document.getElementById('activityTime').value,
        duration: parseFloat(document.getElementById('activityDuration').value) || 0,
        category: document.getElementById('activityCategory').value,
        location: document.getElementById('activityLocation').value,
        cost: parseFloat(document.getElementById('activityCost').value) || 0,
        notes: document.getElementById('activityNotes').value
    };

    if (editIndex >= 0) {
        trip.itinerary[dayIndex].activities[editIndex] = activity;
        showToast('Activity updated!', 'success', 2000);
    } else {
        trip.itinerary[dayIndex].activities.push(activity);
        showToast('Activity added!', 'success', 2000);
    }

    // Sort activities by time
    trip.itinerary[dayIndex].activities.sort((a, b) => a.time.localeCompare(b.time));

    saveTrips();
    renderItinerary(trip);
    closeModal('activityModal');
    e.target.reset();
}

// ========== INDIA CATEGORY HELPERS ==========
function getCategoryIcon(category) {
    const icons = {
        sightseeing: '🏛️',
        temple: '🛕',
        food: '🍽️',
        train: '🚆',
        bus: '🚌',
        cab: '🚕',
        flight: '✈️',
        hotel: '🏨',
        shopping: '🛍️',
        adventure: '🎯',
        relaxation: '🧘',
        culture: '🎭',
        nightlife: '🌙',
        photography: '📸',
        other: '📌'
    };
    return icons[category] || '📌';
}

function formatTime12h(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

// ========== RENDER ITINERARY ==========
function renderItinerary(trip) {
    const timeline = document.getElementById('itineraryTimeline');
    const emptyState = document.getElementById('noItineraryMessage');

    if (!trip || trip.itinerary.length === 0) {
        timeline.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    timeline.innerHTML = trip.itinerary.map((day, dayIndex) => `
        <div class="day-block" data-day-index="${dayIndex}">
            <div class="day-marker">${day.dayNumber}</div>
            <div class="day-header">
                <div>
                    <div class="day-title">${day.title}</div>
                    <div class="day-date">${formatDate(day.date)}</div>
                </div>
                <div class="day-actions">
                    <button class="btn btn-sm btn-primary"
                            onclick="openAddActivity(${dayIndex})">
                        <i class="fas fa-plus"></i> Activity
                    </button>
                    <button class="btn btn-sm btn-outline"
                            onclick="removeDay(${dayIndex})"
                            style="color: var(--accent-red); border-color: var(--accent-red);">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <div class="activity-list">
                ${day.activities.length === 0
                    ? `<div style="text-align: center; padding: 1.5rem;
                         color: var(--text-tertiary); font-size: 0.9rem;">
                         <i class="fas fa-calendar-plus"
                            style="display: block; font-size: 1.5rem; margin-bottom: 0.5rem;
                            opacity: 0.3;"></i>
                         No activities yet. Click "Activity" to add one.
                       </div>`
                    : day.activities.map((activity, actIndex) => `
                        <div class="activity-item">
                            <div class="activity-time">
                                <div class="time">${formatTime12h(activity.time)}</div>
                                ${activity.duration
                                    ? `<div class="duration">${activity.duration}h</div>`
                                    : ''}
                            </div>
                            <div class="activity-category-icon">
                                ${getCategoryIcon(activity.category)}
                            </div>
                            <div class="activity-details">
                                <div class="activity-name">${activity.name}</div>
                                ${activity.location
                                    ? `<div class="activity-location">
                                        <i class="fas fa-map-marker-alt"></i>
                                        ${activity.location}
                                       </div>` : ''}
                                ${activity.notes
                                    ? `<div class="activity-notes">${activity.notes}</div>`
                                    : ''}
                            </div>
                            ${activity.cost > 0
                                ? `<div class="activity-cost">${formatCurrency(activity.cost)}</div>`
                                : ''}
                            <div class="activity-actions">
                                <button class="edit-btn"
                                        onclick="editActivity(${dayIndex}, ${actIndex})"
                                        title="Edit">
                                    <i class="fas fa-pen"></i>
                                </button>
                                <button class="delete-btn"
                                        onclick="deleteActivity(${dayIndex}, ${actIndex})"
                                        title="Delete">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `).join('');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initItinerary);