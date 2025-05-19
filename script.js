// 1. Initial Setup & Data Structure
// DOM Elements
const expenseForm = document.getElementById('expenseForm');
const transactionsBody = document.getElementById('transactionsBody');
const noData = document.getElementById('noData');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const balanceEl = document.getElementById('balance');
const filterType = document.getElementById('filterType');
const filterCategory = document.getElementById('filterCategory');
const filterMonth = document.getElementById('filterMonth');
const resetFilters = document.getElementById('resetFilters');
const exportBtn = document.getElementById('exportBtn');
const chartEl = document.getElementById('chart');

// Initialize Chart
let myChart;

// Categories
const categories = [
  'food', 'transport', 'housing', 
  'entertainment', 'shopping', 'fees', 'other'
];

// Load transactions from localStorage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// 2. Form Submission & Data Handling
// Add new transaction
expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const transaction = {
    id: Date.now(),
    description: document.getElementById('description').value.trim(),
    amount: parseFloat(document.getElementById('amount').value),
    category: document.getElementById('category').value,
    date: document.getElementById('date').value,
    type: document.getElementById('type').value
  };
  
  transactions.push(transaction);
  saveTransactions();
  updateUI();
  expenseForm.reset();
});

// Save to localStorage
function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// 3. Transaction Display & Filtering
// Display transactions
function renderTransactions(filteredTransactions = transactions) {
  transactionsBody.innerHTML = '';
  
  if (filteredTransactions.length === 0) {
    noData.style.display = 'block';
    return;
  }
  
  noData.style.display = 'none';
  
  filteredTransactions.forEach(transaction => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(transaction.date)}</td>
      <td>${transaction.description}</td>
      <td>${capitalize(transaction.category)}</td>
      <td class="${transaction.type}">${capitalize(transaction.type)}</td>
      <td class="${transaction.type}">${formatCurrency(transaction.amount)}</td>
      <td>
        <button class="action-btn edit-btn" data-id="${transaction.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete-btn" data-id="${transaction.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    transactionsBody.appendChild(row);
  });
  
  // Add event listeners to action buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', deleteTransaction);
  });
  
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', editTransaction);
  });
}

// Filter transactions
function filterTransactions() {
  let filtered = [...transactions];
  
  // Filter by type
  if (filterType.value !== 'all') {
    filtered = filtered.filter(t => t.type === filterType.value);
  }
  
  // Filter by category
  if (filterCategory.value !== 'all') {
    filtered = filtered.filter(t => t.category === filterCategory.value);
  }
  
  // Filter by month
  if (filterMonth.value) {
    filtered = filtered.filter(t => t.date.startsWith(filterMonth.value));
  }
  
  renderTransactions(filtered);
  updateChart(filtered);
  updateStats(filtered);
}

// Initialize filters
function initFilters() {
  // Type filter (already in HTML)
  
  // Category filter
  filterCategory.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    filterCategory.innerHTML += `
      <option value="${cat}">${capitalize(cat)}</option>
    `;
  });
  
  // Month filter (current month as default)
  const today = new Date();
  filterMonth.value = today.toISOString().slice(0, 7);
  
  // Event listeners
  filterType.addEventListener('change', filterTransactions);
  filterCategory.addEventListener('change', filterTransactions);
  filterMonth.addEventListener('change', filterTransactions);
  resetFilters.addEventListener('click', () => {
    filterType.value = 'all';
    filterCategory.value = 'all';
    filterMonth.value = '';
    filterTransactions();
  });
}

// 4. Statistics & Chart Implementation
// Update statistics
function updateStats(transactionsToUse = transactions) {
  const income = transactionsToUse
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expense = transactionsToUse
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  totalIncomeEl.textContent = formatCurrency(income);
  totalExpenseEl.textContent = formatCurrency(expense);
  balanceEl.textContent = formatCurrency(income - expense);
}

// Initialize Chart
function initChart() {
  const ctx = chartEl.getContext('2d');
  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories.map(capitalize),
      datasets: [{
        label: 'Expenses by Category',
        data: categories.map(cat => 0),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', 
          '#4BC0C0', '#9966FF', '#FF9F40'
        ]
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Update Chart
function updateChart(transactionsToUse = transactions) {
  const expenseData = categories.map(cat => {
    return transactionsToUse
      .filter(t => t.type === 'expense' && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
  });
  
  myChart.data.datasets[0].data = expenseData;
  myChart.update();
}

// Edit transaction
function editTransaction(e) {
  const id = parseInt(e.currentTarget.getAttribute('data-id'));
  const transaction = transactions.find(t => t.id === id);
  
  if (!transaction) return;

  // Fill form with transaction data
  document.getElementById('description').value = transaction.description;
  document.getElementById('amount').value = transaction.amount;
  document.getElementById('category').value = transaction.category;
  document.getElementById('date').value = transaction.date;
  document.getElementById('type').value = transaction.type;
  
  // Remove the old transaction
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  
  // Scroll to form
  document.getElementById('description').focus();
}

// Delete transaction
function deleteTransaction(e) {
  const id = parseInt(e.currentTarget.getAttribute('data-id'));
  
//   if (confirm('Are you sure you want to delete this transaction?')) {
    
//   }
  transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateUI();
}

// Export to CSV
exportBtn.addEventListener('click', () => {
  if (transactions.length === 0) {
    alert('No transactions to export');
    return;
  }
  
  // Get filtered transactions or all if no filters
  let transactionsToExport = transactions;
  if (filterType.value !== 'all' || filterCategory.value !== 'all' || filterMonth.value) {
    transactionsToExport = getFilteredTransactions();
  }
  
  // Convert to CSV
  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
  const csvRows = [
    headers.join(','),
    ...transactionsToExport.map(t => 
      `${t.date},"${t.description}",${t.category},${t.type},${t.amount}`
    )
  ];
  
  const csvContent = csvRows.join('\n');
  
  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Helper function for filters
function getFilteredTransactions() {
  let filtered = [...transactions];
  
  if (filterType.value !== 'all') {
    filtered = filtered.filter(t => t.type === filterType.value);
  }
  
  if (filterCategory.value !== 'all') {
    filtered = filtered.filter(t => t.category === filterCategory.value);
  }
  
  if (filterMonth.value) {
    filtered = filtered.filter(t => t.date.startsWith(filterMonth.value));
  }
  
  return filtered;
}

// Initialize app with all features
function init() {
  // Load any existing transactions
  if (localStorage.getItem('transactions')) {
    transactions = JSON.parse(localStorage.getItem('transactions'));
  }

  // Set default date to today
  document.getElementById('date').valueAsDate = new Date();

  // Initialize filters
  initFilters();

  // Initialize chart
  initChart();

  // Update UI with current data
  updateUI();

  // Add sample data if empty (for demo)
  if (transactions.length === 0) {
    addSampleData();
  }
}

function addSampleData() {
  const sampleData = [
    {
      id: 1,
      description: "Grocery shopping",
      amount: 85.32,
      category: "food",
      date: new Date().toISOString().slice(0, 10),
      type: "expense"
    },
    {
      id: 2,
      description: "Freelance payment",
      amount: 1200,
      category: "other",
      date: new Date().toISOString().slice(0, 10),
      type: "income"
    },
    {
      id: 3,
      description: "Gas bill",
      amount: 45.50,
      category: "housing",
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      type: "expense"
    }
  ];

  transactions = sampleData;
  saveTransactions();
  updateUI();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);

// Format date for display
function formatDate(dateStr) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString(undefined, options);
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Update all UI elements
function updateUI() {
  renderTransactions();
  updateStats();
  updateChart();
  updateCategoryFilter();
}

// Start the app
init();

