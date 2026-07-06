// ==========================================
// WEATHER.JS - Indian City Weather
// ==========================================

// Get free API key at: https://openweathermap.org/api
const WEATHER_API_KEY = 'YOUR_API_KEY_HERE';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// ========== INITIALIZE WEATHER ==========
function initWeather() {
    const searchInput = document.getElementById('weatherSearch');
    const searchBtn = document.getElementById('weatherSearchBtn');

    searchBtn.addEventListener('click', () => {
        const city = searchInput.value.trim();
        if (city) fetchWeather(city);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = searchInput.value.trim();
            if (city) fetchWeather(city);
        }
    });
}

// ========== FETCH WEATHER (INDIA FOCUSED) ==========
async function fetchWeather(city) {
    // If no API key, show demo data
    if (WEATHER_API_KEY === 'YOUR_API_KEY_HERE') {
        showDemoWeather(city);
        return;
    }

    try {
        // Add ,IN to focus on Indian cities
        const cityQuery = city.includes(',') ? city : `${city},IN`;

        // Current weather
        const currentRes = await fetch(
            `${WEATHER_BASE_URL}/weather?q=${encodeURIComponent(cityQuery)}&appid=${WEATHER_API_KEY}&units=metric`
        );

        if (!currentRes.ok) {
            throw new Error('City not found');
        }

        const currentData = await currentRes.json();

        // 5-day forecast
        const forecastRes = await fetch(
            `${WEATHER_BASE_URL}/forecast?q=${encodeURIComponent(cityQuery)}&appid=${WEATHER_API_KEY}&units=metric`
        );
        const forecastData = await forecastRes.json();

        displayCurrentWeather(currentData);
        displayForecast(forecastData);

    } catch (error) {
        console.error('Weather fetch error:', error);
        showToast('Could not fetch weather data. Check city name.', 'error');
    }
}

// ========== DEMO WEATHER FOR INDIAN CITIES ==========
function showDemoWeather(city) {
    // Indian city temperature ranges
    const indianCityTemps = {
        'delhi': { temp: 35, condition: 'Clear' },
        'mumbai': { temp: 30, condition: 'Clouds' },
        'goa': { temp: 32, condition: 'Clear' },
        'jaipur': { temp: 38, condition: 'Clear' },
        'manali': { temp: 15, condition: 'Clouds' },
        'chennai': { temp: 33, condition: 'Rain' },
        'kolkata': { temp: 31, condition: 'Clouds' },
        'bengaluru': { temp: 26, condition: 'Drizzle' },
        'varanasi': { temp: 34, condition: 'Clear' },
        'shimla': { temp: 18, condition: 'Clouds' },
        'kerala': { temp: 28, condition: 'Rain' },
        'agra': { temp: 36, condition: 'Clear' },
        'udaipur': { temp: 33, condition: 'Clear' },
        'rishikesh': { temp: 25, condition: 'Clear' },
        'ladakh': { temp: 8, condition: 'Snow' },
        'darjeeling': { temp: 16, condition: 'Clouds' },
        'hyderabad': { temp: 32, condition: 'Clouds' },
        'pune': { temp: 29, condition: 'Drizzle' },
        'lucknow': { temp: 35, condition: 'Clear' },
        'ahmedabad': { temp: 37, condition: 'Clear' },
    };

    const cityLower = city.toLowerCase().trim();
    const cityData = indianCityTemps[cityLower] || {
        temp: Math.floor(Math.random() * 25) + 15,
        condition: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)]
    };

    const demoData = {
        name: city.charAt(0).toUpperCase() + city.slice(1),
        sys: {
            country: 'IN',
            sunrise: Math.floor(Date.now() / 1000) - 21600,
            sunset: Math.floor(Date.now() / 1000) + 21600
        },
        main: {
            temp: cityData.temp,
            humidity: Math.floor(Math.random() * 40) + 40,
            pressure: Math.floor(Math.random() * 20) + 1005
        },
        wind: { speed: Math.floor(Math.random() * 15) + 3 },
        visibility: Math.floor(Math.random() * 5000) + 5000,
        weather: [{
            main: cityData.condition,
            description: cityData.condition.toLowerCase(),
            icon: '01d'
        }]
    };

    displayCurrentWeather(demoData);

    // Demo forecast
    const conditions = ['Clear', 'Clouds', 'Rain', 'Drizzle'];
    const demoForecast = {
        list: Array.from({ length: 40 }, (_, i) => ({
            dt: Math.floor(Date.now() / 1000) + (i * 10800),
            main: {
                temp: cityData.temp + Math.floor(Math.random() * 8) - 4,
                temp_min: cityData.temp - 3,
                temp_max: cityData.temp + 3
            },
            weather: [{
                main: conditions[Math.floor(Math.random() * conditions.length)],
                description: 'demo weather',
                icon: '01d'
            }]
        }))
    };

    displayForecast(demoForecast);

    showToast('Showing demo weather for ' + city +
        '. Add OpenWeatherMap API key for real data.', 'info', 5000);
}

// ========== DISPLAY CURRENT WEATHER ==========
function displayCurrentWeather(data) {
    const currentWeather = document.getElementById('currentWeather');
    const noWeatherMsg = document.getElementById('noWeatherMessage');

    currentWeather.style.display = 'block';
    noWeatherMsg.style.display = 'none';

    // Weather icon
    const iconEl = document.getElementById('weatherIconLarge');
    iconEl.innerHTML = `<i class="${getWeatherIcon(data.weather[0].main)}"></i>`;

    // Temperature
    document.getElementById('currentTemp').textContent = Math.round(data.main.temp);

    // Description
    document.getElementById('weatherDesc').textContent = data.weather[0].description;

    // City
    document.getElementById('weatherCity').textContent =
        `${data.name}${data.sys.country ? ', ' + data.sys.country : ''}`;

    // Details
    document.getElementById('weatherHumidity').textContent = `${data.main.humidity}%`;
    document.getElementById('weatherWind').textContent = `${data.wind.speed} km/h`;
    document.getElementById('weatherVisibility').textContent =
        `${(data.visibility / 1000).toFixed(1)} km`;
    document.getElementById('weatherPressure').textContent = `${data.main.pressure} hPa`;

    // Sunrise / Sunset (IST)
    document.getElementById('weatherSunrise').textContent =
        formatUnixTimeIST(data.sys.sunrise);
    document.getElementById('weatherSunset').textContent =
        formatUnixTimeIST(data.sys.sunset);

    // Update gradient
    updateWeatherGradient(data.weather[0].main);
}

// ========== DISPLAY FORECAST ==========
function displayForecast(data) {
    const container = document.getElementById('forecastContainer');
    const cardsContainer = document.getElementById('forecastCards');

    container.style.display = 'block';

    const dailyForecasts = [];
    const seen = new Set();

    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!seen.has(date) && dailyForecasts.length < 5) {
            seen.add(date);
            dailyForecasts.push(item);
        }
    });

    cardsContainer.innerHTML = dailyForecasts.map(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

        return `
            <div class="forecast-card">
                <div class="forecast-day">${dayName}<br><small>${dateStr}</small></div>
                <div class="forecast-icon">
                    <i class="${getWeatherIcon(forecast.weather[0].main)}"></i>
                </div>
                <div class="forecast-temp">${Math.round(forecast.main.temp)}°C</div>
                <div class="forecast-desc">${forecast.weather[0].description}</div>
            </div>
        `;
    }).join('');
}

// ========== WEATHER HELPERS ==========
function getWeatherIcon(condition) {
    const icons = {
        Clear: 'fas fa-sun',
        Clouds: 'fas fa-cloud',
        Rain: 'fas fa-cloud-rain',
        Drizzle: 'fas fa-cloud-rain',
        Thunderstorm: 'fas fa-bolt',
        Snow: 'fas fa-snowflake',
        Mist: 'fas fa-smog',
        Smoke: 'fas fa-smog',
        Haze: 'fas fa-smog',
        Dust: 'fas fa-smog',
        Fog: 'fas fa-smog',
        Sand: 'fas fa-wind',
        Ash: 'fas fa-smog',
        Squall: 'fas fa-wind',
        Tornado: 'fas fa-wind'
    };
    return icons[condition] || 'fas fa-cloud';
}

// Format time in IST (Indian Standard Time)
function formatUnixTimeIST(unix) {
    const date = new Date(unix * 1000);
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    });
}

function updateWeatherGradient(condition) {
    const currentWeather = document.getElementById('currentWeather');
    const gradients = {
        Clear: 'linear-gradient(135deg, #FF9933, #FF6B35)',
        Clouds: 'linear-gradient(135deg, #667eea, #764ba2)',
        Rain: 'linear-gradient(135deg, #3a7bd5, #3a6073)',
        Snow: 'linear-gradient(135deg, #e6e9f0, #eef1f5)',
        Thunderstorm: 'linear-gradient(135deg, #0f0c29, #302b63)',
        Drizzle: 'linear-gradient(135deg, #89f7fe, #66a6ff)',
        Mist: 'linear-gradient(135deg, #d7d2cc, #304352)',
        Haze: 'linear-gradient(135deg, #c9d6ff, #e2e2e2)',
    };

    currentWeather.style.background = gradients[condition] ||
        'linear-gradient(135deg, #FF9933, #FF6B35)';

    if (condition === 'Snow' || condition === 'Haze') {
        currentWeather.style.color = '#333';
    } else {
        currentWeather.style.color = 'white';
    }
}

// ========== QUICK LINKS FROM DESTINATIONS ==========
function updateWeatherQuickLinks(trip) {
    const container = document.getElementById('weatherQuickLinks');

    if (!trip || trip.destinations.length === 0) {
        // Show default Indian cities
        container.innerHTML = `
            <button class="quick-link" onclick="fetchWeatherQuick('Delhi')">🏛️ Delhi</button>
            <button class="quick-link" onclick="fetchWeatherQuick('Mumbai')">🌆 Mumbai</button>
            <button class="quick-link" onclick="fetchWeatherQuick('Goa')">🏖️ Goa</button>
            <button class="quick-link" onclick="fetchWeatherQuick('Jaipur')">🏰 Jaipur</button>
            <button class="quick-link" onclick="fetchWeatherQuick('Manali')">🏔️ Manali</button>
            <button class="quick-link" onclick="fetchWeatherQuick('Chennai')">🌊 Chennai</button>
            <button class="quick-link" onclick="fetchWeatherQuick('Kolkata')">🌉 Kolkata</button>
            <button class="quick-link" onclick="fetchWeatherQuick('Bengaluru')">💻 Bengaluru</button>
            <button class="quick-link" onclick="fetchWeatherQuick('Varanasi')">🛕 Varanasi</button>
            <button class="quick-link" onclick="fetchWeatherQuick('Shimla')">❄️ Shimla</button>
        `;
        return;
    }

    // Show trip destination quick links
    let html = '';

    // Add trip destinations
    trip.destinations.forEach(dest => {
        const cityName = dest.name.split(',')[0].trim();
        html += `
            <button class="quick-link"
                    onclick="fetchWeatherQuick('${cityName.replace(/'/g, "\\'")}')">
                📍 ${cityName}
            </button>
        `;
    });

    container.innerHTML = html;
}

function fetchWeatherQuick(city) {
    document.getElementById('weatherSearch').value = city;
    fetchWeather(city);

    document.getElementById('weather').scrollIntoView({ behavior: 'smooth' });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initWeather);