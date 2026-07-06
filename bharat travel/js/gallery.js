// ==========================================
// GALLERY.JS - India Trip Photo Gallery
// ==========================================

let currentLightboxIndex = 0;
let galleryPhotos = [];
let currentGalleryFilter = 'all';

// ========== INITIALIZE GALLERY ==========
function initGallery() {
    document.getElementById('photoUpload').addEventListener('change', handlePhotoUpload);

    document.querySelectorAll('.gallery-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.gallery-filters .filter-btn')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentGalleryFilter = btn.dataset.filter;
            const trip = getCurrentTrip();
            if (trip) renderGallery(trip);
        });
    });

    document.getElementById('gridViewBtn').addEventListener('click',
        () => setGalleryView('grid'));
    document.getElementById('masonryViewBtn').addEventListener('click',
        () => setGalleryView('masonry'));

    initLightbox();
}

function setGalleryView(view) {
    const grid = document.getElementById('galleryGrid');
    document.querySelectorAll('.gallery-view-toggle .view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    if (view === 'masonry') {
        grid.classList.add('masonry-view');
    } else {
        grid.classList.remove('masonry-view');
    }
}

// ========== PHOTO UPLOAD ==========
function handlePhotoUpload(e) {
    const trip = getCurrentTrip();
    if (!trip) {
        showToast('Please create or select a trip first!', 'warning');
        return;
    }

    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    let processed = 0;

    files.forEach(file => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const photo = {
                id: generateId(),
                src: event.target.result,
                name: file.name,
                caption: file.name.replace(/\.[^/.]+$/, ''),
                date: new Date().toISOString(),
                favorite: false
            };

            trip.photos.push(photo);
            processed++;

            if (processed === files.length) {
                saveTrips();
                renderGallery(trip);
                updateStats();
                showToast(`${files.length} photo(s) uploaded! 📸`, 'success');
            }
        };

        reader.readAsDataURL(file);
    });

    e.target.value = '';
}

// ========== PHOTO MANAGEMENT ==========
function toggleFavorite(photoId) {
    const trip = getCurrentTrip();
    if (!trip) return;

    const photo = trip.photos.find(p => p.id === photoId);
    if (photo) {
        photo.favorite = !photo.favorite;
        saveTrips();
        renderGallery(trip);
        showToast(photo.favorite ? 'Added to favorites ❤️' :
            'Removed from favorites', 'info', 2000);
    }
}

function deletePhoto(photoId) {
    const trip = getCurrentTrip();
    if (!trip) return;

    if (confirm('Delete this photo?')) {
        trip.photos = trip.photos.filter(p => p.id !== photoId);
        saveTrips();
        renderGallery(trip);
        updateStats();
        showToast('Photo deleted', 'info', 2000);
    }
}

function editCaption(photoId) {
    const trip = getCurrentTrip();
    if (!trip) return;

    const photo = trip.photos.find(p => p.id === photoId);
    if (!photo) return;

    const newCaption = prompt('Enter photo caption:', photo.caption);
    if (newCaption !== null) {
        photo.caption = newCaption;
        saveTrips();
        renderGallery(trip);
    }
}

// ========== RENDER GALLERY ==========
function renderGallery(trip) {
    const grid = document.getElementById('galleryGrid');
    const emptyState = document.getElementById('noPhotosMessage');

    if (!trip || trip.photos.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    let photos = [...trip.photos];

    if (currentGalleryFilter === 'favorite') {
        photos = photos.filter(p => p.favorite);
    }

    if (photos.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        emptyState.querySelector('h3').textContent =
            currentGalleryFilter === 'favorite' ? 'No favorites yet!' : 'No photos yet!';
        return;
    }

    emptyState.style.display = 'none';
    galleryPhotos = photos;

    grid.innerHTML = photos.map((photo, index) => `
        <div class="photo-card" data-index="${index}">
            <img src="${photo.src}" alt="${photo.caption}"
                 loading="lazy"
                 onclick="openLightbox(${index})">

            <div class="photo-overlay">
                <div class="photo-caption">${photo.caption}</div>
                <div class="photo-date">${formatDate(photo.date)}</div>
            </div>

            <div class="photo-actions">
                <button onclick="event.stopPropagation(); toggleFavorite('${photo.id}')"
                        class="${photo.favorite ? 'favorited' : ''}"
                        title="${photo.favorite ? 'Unfavorite' : 'Favorite'}">
                    <i class="fas fa-heart"></i>
                </button>
                <button onclick="event.stopPropagation(); editCaption('${photo.id}')"
                        title="Edit Caption">
                    <i class="fas fa-pen"></i>
                </button>
                <button onclick="event.stopPropagation(); deletePhoto('${photo.id}')"
                        title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ========== LIGHTBOX ==========
function initLightbox() {
    document.getElementById('closeLightbox').addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev').addEventListener('click',
        () => navigateLightbox(-1));
    document.getElementById('lightboxNext').addEventListener('click',
        () => navigateLightbox(1));

    document.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);

    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox.classList.contains('active')) return;

        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
        if (e.key === 'Escape') closeLightbox();
    });
}

function openLightbox(index) {
    currentLightboxIndex = index;
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateLightboxImage();
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function navigateLightbox(direction) {
    currentLightboxIndex += direction;

    if (currentLightboxIndex < 0) {
        currentLightboxIndex = galleryPhotos.length - 1;
    } else if (currentLightboxIndex >= galleryPhotos.length) {
        currentLightboxIndex = 0;
    }

    updateLightboxImage();
}

function updateLightboxImage() {
    if (galleryPhotos.length === 0) return;

    const photo = galleryPhotos[currentLightboxIndex];
    document.getElementById('lightboxImage').src = photo.src;
    document.getElementById('lightboxCaption').textContent = photo.caption;
    document.getElementById('lightboxCounter').textContent =
        `${currentLightboxIndex + 1} / ${galleryPhotos.length}`;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initGallery);