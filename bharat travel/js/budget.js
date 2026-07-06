// ==========================================
// BUDGET.JS - Budget in Indian Rupees (₹)
// ==========================================

let expenseChart = null;

// ========== INITIALIZE BUDGET ==========
function initBudget() {
    document.getElementById('expenseForm').addEventListener('submit', handleExpenseSubmit);

    document.getElementById('expenseFilterCategory').addEventListener('change', (e) => {
        const trip = getCurrentTrip();
        if (trip) renderExpenseList(trip, e.target.value);
    });

    document.getElementById('exportExpensesBtn').addEventListener('click', exportExpensesCSV);
}

// ========== EXPENSE MANAGEMENT ==========
function handleExpenseSubmit(e) {
    e.preventDefault();

    const trip = getCurrentTrip();
    if (!trip) {
        showToast('Please create or select a trip first!', 'warning');
        return;
    }

    const expense = {
        id: generateId(),
        name: document.getElementById('expenseName').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        category: document.getElementById('expenseCategory').value,
        date: document.getElementById('expenseDate').value,
        createdAt: new Date().toISOString()
    };

    trip.expenses.push(expense);
    saveTrips();
    renderBudget(trip);

    e.target.reset();
    showToast('Expense added! ₹' + expense.amount, 'success', 2000);
}

function deleteExpense(expenseId) {
    const trip = getCurrentTrip();
    if (!trip) return;

    trip.expenses = trip.expenses.filter(e => e.id !== expenseId);
    saveTrips();
    renderBudget(trip);
    showToast('Expense deleted', 'info', 2000);
}

// ========== INDIA CATEGORY HELPERS ==========
function getCategoryEmoji(category) {
    const emojis = {
        hotel: '🏨',
        train: '🚆',
        bus: '🚌',
        cab: '🚕',
        flight: '✈️',
        food: '🍽️',
        tickets: '🎟️',
        shopping: '🛍️',
        fuel: '⛽',
        guide: '🧑‍🏫',
        insurance: '🛡️',
        other: '📌'
    };
    return emojis[category] || '📌';
}

function getCategoryColor(category) {
    const colors = {
        hotel: '#6C63FF',
        train: '#42A5F5',
        bus: '#66BB6A',
        cab: '#FFA726',
        flight: '#AB47BC',
        food: '#FF6584',
        tickets: '#26C6DA',
        shopping: '#EC407A',
        fuel: '#8D6E63',
        guide: '#5C6BC0',
        insurance: '#78909C',
        other: '#BDBDBD'
    };
    return colors[category] || '#78909C';
}

function getCategoryLabel(category) {
    const labels = {
        hotel: 'Hotel / Stay',
        train: 'Train',
        bus: 'Bus',
        cab: 'Cab / Auto',
        flight: 'Flight',
        food: 'Food & Dining',
        tickets: 'Entry Tickets',
        shopping: 'Shopping',
        fuel: 'Fuel / Petrol',
        guide: 'Tour Guide',
        insurance: 'Travel Insurance',
        other: 'Other'
    };
    return labels[category] || category;
}

// ========== RENDER BUDGET ==========
function renderBudget(trip) {
    if (!trip) return;

    const totalBudget = trip.budget || 0;
    const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = totalBudget - totalSpent;
    const days = getDaysBetween(trip.startDate, trip.endDate) || 1;
    const dailyAvg = totalSpent / days;
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Update cards with ₹ values
    document.getElementById('totalBudgetDisplay').textContent = formatCurrency(totalBudget);
    document.getElementById('totalSpentDisplay').textContent = formatCurrency(totalSpent);
    document.getElementById('remainingBudgetDisplay').textContent = formatCurrency(remaining);
    document.getElementById('dailyAvgDisplay').textContent = formatCurrency(dailyAvg);

    // Update progress
    document.getElementById('budgetPercentage').textContent = `${Math.round(percentage)}%`;
    const progressFill = document.getElementById('budgetProgressFill');
    progressFill.style.width = `${Math.min(percentage, 100)}%`;

    progressFill.classList.remove('warning', 'danger');
    if (percentage > 90) {
        progressFill.classList.add('danger');
    } else if (percentage > 70) {
        progressFill.classList.add('warning');
    }

    // Remaining color
    const remainingDisplay = document.getElementById('remainingBudgetDisplay');
    remainingDisplay.style.color = remaining >= 0 ? 'var(--india-green)' : 'var(--accent-red)';

    // Render chart
    renderExpenseChart(trip);

    // Render expense list
    renderExpenseList(trip);
}

// ========== EXPENSE CHART ==========
function renderExpenseChart(trip) {
    const canvas = document.getElementById('expenseChart');
    const legendContainer = document.getElementById('chartLegend');

    // Group expenses by category
    const categoryTotals = {};
    trip.expenses.forEach(expense => {
        categoryTotals[expense.category] =
            (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    const colors = categories.map(c => getCategoryColor(c));

    // Destroy existing chart
    if (expenseChart) {
        expenseChart.destroy();
    }

    if (categories.length === 0) {
        canvas.style.display = 'none';
        legendContainer.innerHTML = `
            <p style="color: var(--text-tertiary); font-size: 0.85rem;">
                No expenses to show
            </p>`;
        return;
    }

    canvas.style.display = 'block';

    expenseChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: categories.map(c =>
                `${getCategoryEmoji(c)} ${getCategoryLabel(c)}`
            ),
            datasets: [{
                data: amounts,
                backgroundColor: colors,
                borderWidth: 3,
                borderColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--bg-card').trim() || '#fff',
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return ` ${formatCurrency(context.parsed)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Render legend with ₹
    legendContainer.innerHTML = categories.map((cat, i) => `
        <div class="legend-item">
            <div class="legend-color" style="background: ${colors[i]}"></div>
            <span>${getCategoryEmoji(cat)} ${getCategoryLabel(cat)}:
                  ${formatCurrency(amounts[i])}</span>
        </div>
    `).join('');
}

// ========== EXPENSE LIST ==========
function renderExpenseList(trip, filterCategory = 'all') {
    const list = document.getElementById('expenseList');
    const emptyState = document.getElementById('noExpensesMessage');

    let expenses = [...trip.expenses].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    if (filterCategory !== 'all') {
        expenses = expenses.filter(e => e.category === filterCategory);
    }

    if (expenses.length === 0) {
        list.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    list.innerHTML = expenses.map(expense => `
        <div class="expense-item">
            <div class="expense-icon"
                 style="background: ${getCategoryColor(expense.category)}20;
                        color: ${getCategoryColor(expense.category)};">
                ${getCategoryEmoji(expense.category)}
            </div>
            <div class="expense-info">
                <div class="name">${expense.name}</div>
                <div class="date">${formatDate(expense.date)} •
                     ${getCategoryLabel(expense.category)}</div>
            </div>
            <div class="expense-amount">-${formatCurrency(expense.amount)}</div>
            <button class="expense-delete"
                    onclick="deleteExpense('${expense.id}')"
                    title="Delete">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');
}

// ========== EXPORT CSV (INR) ==========
function exportExpensesCSV() {
    const trip = getCurrentTrip();
    if (!trip || trip.expenses.length === 0) {
        showToast('No expenses to export', 'warning');
        return;
    }

    const headers = ['Date', 'Description', 'Category', 'Amount (INR)'];
    const rows = trip.expenses.map(e => [
        e.date,
        `"${e.name}"`,
        getCategoryLabel(e.category),
        e.amount.toFixed(0)
    ]);

    // Add total row
    const total = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
    rows.push(['', '', 'TOTAL', total.toFixed(0)]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.name.replace(/\s+/g, '_')}_expenses_INR.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Expenses exported as CSV (₹ INR)!', 'success');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initBudget);