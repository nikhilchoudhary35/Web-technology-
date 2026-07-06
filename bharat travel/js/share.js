// ==========================================
// SHARE.JS - Trip Sharing & Export
// All errors fixed - India Based
// ==========================================

function initShare() {
    // Close modal
    const closeBtn = document.getElementById('closeShareModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            closeModal('shareModal');
        });
    }

    // Share buttons
    const whatsAppBtn = document.getElementById('shareWhatsApp');
    if (whatsAppBtn) whatsAppBtn.addEventListener('click', shareViaWhatsApp);

    const twitterBtn = document.getElementById('shareTwitter');
    if (twitterBtn) twitterBtn.addEventListener('click', shareViaTwitter);

    const facebookBtn = document.getElementById('shareFacebook');
    if (facebookBtn) facebookBtn.addEventListener('click', shareViaFacebook);

    const emailBtn = document.getElementById('shareEmail');
    if (emailBtn) emailBtn.addEventListener('click', shareViaEmail);

    // Copy link
    const copyBtn = document.getElementById('copyShareLink');
    if (copyBtn) copyBtn.addEventListener('click', copyShareData);

    // Export
    const jsonBtn = document.getElementById('exportJSON');
    if (jsonBtn) jsonBtn.addEventListener('click', exportTripJSON);

    const pdfBtn = document.getElementById('exportPDF');
    if (pdfBtn) pdfBtn.addEventListener('click', exportTripPDF);
}

// ========== OPEN SHARE MODAL ==========
function openShareModal() {
    const trip = getCurrentTrip();
    if (!trip) {
        showToast('Please select a trip first!', 'warning');
        return;
    }

    // Update preview
    const tripNameEl = document.getElementById('shareTripName');
    const tripDatesEl = document.getElementById('shareTripDates');
    const tripDestCountEl = document.getElementById('shareTripDestCount');
    const shareLinkText = document.getElementById('shareLinkText');

    if (tripNameEl) tripNameEl.textContent = trip.name;
    if (tripDatesEl) tripDatesEl.textContent = formatDate(trip.startDate) + ' - ' + formatDate(trip.endDate);
    if (tripDestCountEl) {
        tripDestCountEl.textContent =
            trip.destinations.length + ' destinations • ' + trip.itinerary.length + ' days planned';
    }

    // Generate share text
    const shareText = generateShareText(trip);
    if (shareLinkText) shareLinkText.value = shareText;

    openModal('shareModal');
}

// ========== GENERATE SHARE TEXT ==========
function generateShareText(trip) {
    if (!trip) return '';

    let text = '🇮🇳 ' + trip.name + '\n';
    text += '📅 ' + formatDate(trip.startDate) + ' - ' + formatDate(trip.endDate) + '\n';
    text += '💰 Budget: ' + formatCurrency(trip.budget) + '\n\n';

    if (trip.destinations && trip.destinations.length > 0) {
        text += '📍 Destinations:\n';
        for (let i = 0; i < trip.destinations.length; i++) {
            text += '  ' + (i + 1) + '. ' + trip.destinations[i].name + '\n';
        }
        text += '\n';
    }

    if (trip.itinerary && trip.itinerary.length > 0) {
        text += '📋 Itinerary:\n';
        for (let d = 0; d < trip.itinerary.length; d++) {
            var day = trip.itinerary[d];
            text += '\n  Day ' + day.dayNumber + ' (' + formatDate(day.date) + '):\n';
            for (let a = 0; a < day.activities.length; a++) {
                var act = day.activities[a];
                text += '    ' + shareFormatTime(act.time) + ' - ' + act.name;
                if (act.location) text += ' @ ' + act.location;
                if (act.cost > 0) text += ' [' + formatCurrency(act.cost) + ']';
                text += '\n';
            }
        }
        text += '\n';
    }

    var totalSpent = 0;
    if (trip.expenses && trip.expenses.length > 0) {
        for (let e = 0; e < trip.expenses.length; e++) {
            totalSpent += trip.expenses[e].amount;
        }
        text += '💳 Total Spent: ' + formatCurrency(totalSpent) + ' / ' + formatCurrency(trip.budget) + '\n';
    }

    text += '\n✨ Planned with Bharat Trip Planner';

    return text;
}

// Safe time formatter for share module
function shareFormatTime(time24) {
    if (!time24) return '';
    var parts = time24.split(':');
    var h = parseInt(parts[0]);
    var m = parts[1];
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return h12 + ':' + m + ' ' + ampm;
}

// ========== SOCIAL SHARING ==========
function shareViaWhatsApp() {
    var trip = getCurrentTrip();
    if (!trip) return;

    var text = encodeURIComponent(generateShareText(trip));
    window.open('https://wa.me/?text=' + text, '_blank');
    showToast('Opening WhatsApp...', 'success', 2000);
}

function shareViaTwitter() {
    var trip = getCurrentTrip();
    if (!trip) return;

    var tweetText = '🇮🇳 Planning my India trip: ' + trip.name + '! ' +
        trip.destinations.length + ' amazing destinations from ' +
        formatDate(trip.startDate) + ' to ' + formatDate(trip.endDate) +
        ' 🚆✈️ #BharatTrip #IncredibleIndia #Travel';

    var text = encodeURIComponent(tweetText);
    window.open('https://twitter.com/intent/tweet?text=' + text, '_blank');
    showToast('Opening Twitter...', 'success', 2000);
}

function shareViaFacebook() {
    var trip = getCurrentTrip();
    if (!trip) return;

    var text = encodeURIComponent(generateShareText(trip));
    window.open('https://www.facebook.com/sharer/sharer.php?quote=' + text, '_blank');
    showToast('Opening Facebook...', 'success', 2000);
}

function shareViaEmail() {
    var trip = getCurrentTrip();
    if (!trip) return;

    var subject = encodeURIComponent('My India Trip Plan: ' + trip.name);
    var body = encodeURIComponent(generateShareText(trip));
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
    showToast('Opening email client...', 'success', 2000);
}

// ========== COPY SHARE DATA ==========
function copyShareData() {
    var textarea = document.getElementById('shareLinkText');
    if (!textarea) return;

    textarea.select();
    textarea.setSelectionRange(0, 99999);

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textarea.value)
            .then(function () {
                showToast('Trip data copied to clipboard! 📋', 'success');
            })
            .catch(function () {
                document.execCommand('copy');
                showToast('Trip data copied! 📋', 'success');
            });
    } else {
        document.execCommand('copy');
        showToast('Trip data copied! 📋', 'success');
    }
}

// ========== EXPORT JSON ==========
function exportTripJSON() {
    var trip = getCurrentTrip();
    if (!trip) {
        showToast('No trip selected!', 'warning');
        return;
    }

    // Create clean copy without large photo data
    var exportData = {};
    exportData.id = trip.id;
    exportData.name = trip.name;
    exportData.startDate = trip.startDate;
    exportData.endDate = trip.endDate;
    exportData.budget = trip.budget;
    exportData.description = trip.description || '';
    exportData.destinations = trip.destinations || [];
    exportData.itinerary = trip.itinerary || [];
    exportData.expenses = trip.expenses || [];
    exportData.photos = [];
    exportData.currency = 'INR';
    exportData.country = 'India';
    exportData.exportedAt = new Date().toISOString();
    exportData.exportedFrom = 'Bharat Trip Planner';

    // Add photo count but not actual data
    if (trip.photos && trip.photos.length > 0) {
        for (var i = 0; i < trip.photos.length; i++) {
            exportData.photos.push({
                id: trip.photos[i].id,
                caption: trip.photos[i].caption,
                date: trip.photos[i].date,
                favorite: trip.photos[i].favorite,
                src: '[Photo data excluded]'
            });
        }
    }

    var json = JSON.stringify(exportData, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = trip.name.replace(/\s+/g, '_') + '_india_trip.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    showToast('Trip exported as JSON! 📁', 'success');
}

// ========== EXPORT / PRINT PDF ==========
function exportTripPDF() {
    var trip = getCurrentTrip();
    if (!trip) {
        showToast('No trip selected!', 'warning');
        return;
    }

    var totalSpent = 0;
    if (trip.expenses) {
        for (var i = 0; i < trip.expenses.length; i++) {
            totalSpent += trip.expenses[i].amount;
        }
    }

    var html = '<!DOCTYPE html><html><head>';
    html += '<title>' + trip.name + ' - India Trip Plan</title>';
    html += '<style>';
    html += '* { margin: 0; padding: 0; box-sizing: border-box; }';
    html += 'body { font-family: "Segoe UI", sans-serif; padding: 40px; color: #333; }';
    html += 'h1 { color: #FF6B35; margin-bottom: 5px; }';
    html += 'h2 { color: #FF6B35; margin: 30px 0 15px; border-bottom: 2px solid #FF9933; padding-bottom: 5px; }';
    html += '.header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #FF9933; padding-bottom: 20px; }';
    html += '.india-flag { font-size: 2rem; margin-bottom: 10px; }';
    html += '.meta { color: #666; margin: 5px 0; }';
    html += '.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0; }';
    html += '.card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; }';
    html += '.card-label { font-size: 12px; color: #888; }';
    html += '.card-value { font-size: 20px; font-weight: 700; }';
    html += 'table { width: 100%; border-collapse: collapse; margin: 10px 0; }';
    html += 'th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }';
    html += 'th { background: #FFF3E0; }';
    html += '.day-title { background: #FF6B35; color: white; padding: 8px 15px; border-radius: 5px; margin: 15px 0 10px; }';
    html += '.footer { text-align: center; margin-top: 40px; color: #888; border-top: 1px solid #ddd; padding-top: 15px; }';
    html += '@media print { body { padding: 20px; } }';
    html += '</style></head><body>';

    // Header
    html += '<div class="header">';
    html += '<div class="india-flag">🇮🇳</div>';
    html += '<h1>' + trip.name + '</h1>';
    html += '<p class="meta">📅 ' + formatDate(trip.startDate) + ' - ' + formatDate(trip.endDate) + '</p>';
    html += '<p class="meta">💰 Budget: ' + formatCurrency(trip.budget) + '</p>';
    if (trip.description) {
        html += '<p class="meta">' + trip.description + '</p>';
    }
    html += '</div>';

    // Destinations
    if (trip.destinations && trip.destinations.length > 0) {
        html += '<h2>📍 Indian Destinations</h2><ol>';
        for (var d = 0; d < trip.destinations.length; d++) {
            html += '<li style="margin: 5px 0;">' + trip.destinations[d].name + '</li>';
        }
        html += '</ol>';
    }

    // Budget Summary
    var remaining = trip.budget - totalSpent;
    var usage = trip.budget > 0 ? Math.round((totalSpent / trip.budget) * 100) : 0;

    html += '<h2>💰 Budget Summary (₹)</h2>';
    html += '<div class="grid">';
    html += '<div class="card"><div class="card-label">Total Budget</div><div class="card-value">' + formatCurrency(trip.budget) + '</div></div>';
    html += '<div class="card"><div class="card-label">Total Spent</div><div class="card-value">' + formatCurrency(totalSpent) + '</div></div>';
    html += '<div class="card"><div class="card-label">Remaining</div><div class="card-value" style="color:' + (remaining >= 0 ? '#138808' : '#EF5350') + '">' + formatCurrency(remaining) + '</div></div>';
    html += '<div class="card"><div class="card-label">Usage</div><div class="card-value">' + usage + '%</div></div>';
    html += '</div>';

    // Itinerary
    if (trip.itinerary && trip.itinerary.length > 0) {
        html += '<h2>📋 Itinerary</h2>';
        for (var it = 0; it < trip.itinerary.length; it++) {
            var day = trip.itinerary[it];
            html += '<div class="day-title">Day ' + day.dayNumber + ' (' + formatDate(day.date) + ')</div>';
            if (day.activities && day.activities.length > 0) {
                html += '<table><thead><tr><th>Time</th><th>Activity</th><th>Location</th><th>Cost (₹)</th></tr></thead><tbody>';}}}}