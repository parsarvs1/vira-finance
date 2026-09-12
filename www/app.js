// =========================
// VIRA — TRANSACTION SYSTEM
// =========================

// =========================
// ELEMENTS
// =========================

const addExpenseButton = document.getElementById("addExpenseButton");

const expenseModal = document.getElementById("expenseModal");

const closeExpenseModal = document.getElementById("closeExpenseModal");

const modalOverlay = document.querySelector(".modal-overlay");

const expenseForm = document.getElementById("expenseForm");

const typeButtons = document.querySelectorAll(".type-button");

// =========================
// STORAGE
// =========================

const STORAGE_KEY = "vira_transactions";

// =========================
// TRANSACTION TYPE
// =========================

let selectedTransactionType = "expense";

// =========================
// GET TRANSACTIONS
// =========================

function getTransactions() {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Could not read Vira transactions:", error);

    return [];
  }
}

// =========================
// SAVE TRANSACTIONS
// =========================

function saveTransactions(transactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

/* =====================================================
   PROCESS RECURRING TRANSACTIONS
===================================================== */

function getRecurringPeriodKey(date, frequency) {
  const currentDate = new Date(date);

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  if (frequency === "daily") {
    return `${year}-${month}-${day}`;
  }

  if (frequency === "weekly") {
    const firstDayOfYear = new Date(year, 0, 1);

    const difference = Math.floor(
      (currentDate - firstDayOfYear) / (24 * 60 * 60 * 1000),
    );

    const weekNumber = Math.floor(difference / 7);

    return `${year}-week-${weekNumber}`;
  }

  if (frequency === "yearly") {
    return `${year}`;
  }

  // monthly
  return `${year}-${month}`;
}

function isRecurringDue(item) {
  if (!item.startDate) {
    return false;
  }

  const today = new Date();
  const startDate = new Date(`${item.startDate}T00:00:00`);

  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  return startDate <= today;
}

function processRecurringTransactions() {
  const recurringItems = getRecurring();

  if (recurringItems.length === 0) {
    return;
  }

  const transactions = getTransactions();

  let transactionsChanged = false;

  recurringItems.forEach((item) => {
    if (!isRecurringDue(item)) {
      return;
    }

    const periodKey = getRecurringPeriodKey(new Date(), item.frequency);

    const alreadyAdded = transactions.some(
      (transaction) =>
        transaction.recurringId === item.id &&
        transaction.recurringPeriod === periodKey,
    );

    if (alreadyAdded) {
      return;
    }

    const recurringTransaction = {
      id: Date.now() + Math.random(),

      type: item.type,

      amount: Number(item.amount),

      description: item.title,

      category: item.category,

      currency: "USD",

      date: new Date().toISOString(),

      recurringId: item.id,

      recurringPeriod: periodKey,
    };

    transactions.unshift(recurringTransaction);

    transactionsChanged = true;
  });

  if (transactionsChanged) {
    saveTransactions(transactions);
  }
}

// =========================
// OPEN MODAL
// =========================

function openModal() {
  expenseModal.classList.remove("hidden");

  document.getElementById("expenseAmount").focus();
}

// =========================
// CLOSE MODAL
// =========================

function closeModal() {
  expenseModal.classList.add("hidden");

  expenseForm.reset();

  selectedTransactionType = "expense";

  updateTypeButtons();
}

// =========================
// MODAL EVENTS
// =========================

addExpenseButton.addEventListener("click", openModal);

closeExpenseModal.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", closeModal);

// =========================
// TYPE BUTTONS
// =========================

typeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedTransactionType = button.dataset.type;

    updateTypeButtons();
  });
});

// =========================
// UPDATE TYPE BUTTONS
// =========================

function updateTypeButtons() {
  typeButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.type === selectedTransactionType,
    );
  });

  updateCategoryOptions();
}

// =========================
// CATEGORY OPTIONS
// =========================

function updateCategoryOptions() {
  const categorySelect = document.getElementById("expenseCategory");

  if (selectedTransactionType === "income") {
    categorySelect.innerHTML = `

            <option value="Salary">
                Salary
            </option>

            <option value="Freelance">
                Freelance
            </option>

            <option value="Business">
                Business
            </option>

            <option value="Investment">
                Investment
            </option>

            <option value="Gift">
                Gift
            </option>

            <option value="Other">
                Other
            </option>

        `;
  } else {
    categorySelect.innerHTML = `

            <option value="Food">
                Food
            </option>

            <option value="Transport">
                Transport
            </option>

            <option value="Shopping">
                Shopping
            </option>

            <option value="Bills">
                Bills
            </option>

            <option value="Entertainment">
                Entertainment
            </option>

            <option value="Other">
                Other
            </option>

        `;
  }
}

// =========================
// ADD TRANSACTION
// =========================

expenseForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const amountInput = document.getElementById("expenseAmount");

  const descriptionInput = document.getElementById("expenseDescription");

  const categoryInput = document.getElementById("expenseCategory");

  const amount = Number(amountInput.value);

  const description = descriptionInput.value.trim();

  const category = categoryInput.value;

  // Validation

  if (!amount || amount <= 0) {
    alert("Please enter a valid amount.");

    return;
  }

  if (!description) {
    alert("Please enter a description.");

    return;
  }

  // Create transaction

  const transaction = {
    id: Date.now(),

    type: selectedTransactionType,

    amount: amount,

    description: description,

    category: category,

    currency: "USD",

    date: new Date().toISOString(),
  };

  // Get old transactions

  const transactions = getTransactions();

  // Add new transaction

  transactions.unshift(transaction);

  // Save

  saveTransactions(transactions);

  // Reset

  expenseForm.reset();

  // Close

  closeModal();

  // Update UI

  renderDashboard();

  console.log("Transaction added:", transaction);
});

// =========================
// MONEY FORMAT
// =========================

function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// =========================
// DATE FORMAT
// =========================

function formatDate(dateString) {
  const date = new Date(dateString);

  const now = new Date();

  const difference = now - date;

  const oneDay = 24 * 60 * 60 * 1000;

  if (difference < oneDay) {
    return "Today";
  }

  if (difference < oneDay * 2) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// =========================
// CATEGORY ICON
// =========================

function getCategoryIcon(category) {
  const icons = {
    Food: "🍔",

    Transport: "🚗",

    Shopping: "🛍",

    Bills: "📄",

    Entertainment: "🎮",

    Salary: "💼",

    Freelance: "💻",

    Business: "🏢",

    Investment: "📈",

    Gift: "🎁",

    Other: "📦",
  };

  return icons[category] || "📦";
}

// =========================
// DASHBOARD
// =========================

function renderDashboard() {
  processRecurringTransactions();

  const transactions = getTransactions();

  // =========================
  // INCOME
  // =========================

  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  // =========================
  // EXPENSES
  // =========================

  const expenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  // =========================
  // BALANCE
  // =========================

  const balance = income - expenses;

  // =========================
  // DASHBOARD ELEMENTS
  // =========================

  const balanceElement = document.querySelector(".balance-value");

  const balanceCards = document.querySelectorAll(".small-balance");

  // Balance

  if (balanceElement) {
    balanceElement.textContent = formatMoney(balance);
  }

  // Income

  if (balanceCards[0]) {
    balanceCards[0].textContent = formatMoney(income);
  }

  // Expenses

  if (balanceCards[1]) {
    balanceCards[1].textContent = formatMoney(expenses);
  }

  // Render transactions

  renderTransactions(transactions);

  // Render categories

  renderCategories(transactions);
}

// =========================
// TRANSACTIONS
// =========================

function renderTransactions(transactions) {
  const transactionList = document.querySelector(".transaction-list");

  if (!transactionList) {
    return;
  }

  const latest = transactions.slice(0, 5);

  if (latest.length === 0) {
    transactionList.innerHTML = `

            <div class="empty-state">

                <span>💳</span>

                <p>No transactions yet.</p>

                <small>
                    Add your first transaction to get started.
                </small>

            </div>

        `;

    return;
  }

  transactionList.innerHTML = latest
    .map((transaction) => {
      const icon = getCategoryIcon(transaction.category);

      const isIncome = transaction.type === "income";

      const amountPrefix = isIncome ? "+" : "-";

      const amountClass = isIncome ? "income" : "expense";

      return `

                    <div class="transaction">

                        <div class="transaction-left">

                            <span
                                class="transaction-icon"
                            >
                                ${icon}
                            </span>

                            <div>

                                <strong>
                                    ${escapeHTML(transaction.description)}
                                </strong>

                                <small>
                                    ${transaction.category}
                                    ·
                                    ${formatDate(transaction.date)}
                                </small>

                            </div>

                        </div>

                        <strong class="${amountClass}">
                            ${amountPrefix}${formatMoney(transaction.amount)}
                        </strong>

                    </div>

                `;
    })
    .join("");
}

// =========================
// CATEGORIES
// =========================

function renderCategories(transactions) {
  const categoryList = document.querySelector(".category-list");

  if (!categoryList) {
    return;
  }

  const expenses = transactions.filter(
    (transaction) => transaction.type === "expense",
  );

  const categoryTotals = {};

  expenses.forEach((transaction) => {
    const category = transaction.category;

    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }

    categoryTotals[category] += transaction.amount;
  });

  const total = expenses.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );

  const categories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (categories.length === 0) {
    categoryList.innerHTML = `

            <div class="empty-category">
                No spending data yet.
            </div>

        `;

    return;
  }

  categoryList.innerHTML = categories
    .map(([category, amount]) => {
      const percent = total > 0 ? Math.round((amount / total) * 100) : 0;

      return `

                    <div class="category-item">

                        <div class="category-info">

                            <span
                                class="category-icon"
                            >
                                ${getCategoryIcon(category)}
                            </span>

                            <div>

                                <strong>
                                    ${category}
                                </strong>

                                <small>
                                    ${formatMoney(amount)}
                                </small>

                            </div>

                        </div>

                        <span
                            class="category-percent"
                        >
                            ${percent}%
                        </span>

                    </div>

                `;
    })
    .join("");
}

// =========================
// SECURITY
// =========================

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =========================
// TRANSACTIONS PAGE
// =========================

const transactionsNav = document.getElementById("transactionsNav");

const dashboardPage = document.getElementById("dashboardPage");

const transactionsPage = document.getElementById("transactionsPage");

const transactionsAddButton = document.getElementById("transactionsAddButton");

const transactionSearch = document.getElementById("transactionSearch");

const transactionTypeFilter = document.getElementById("transactionTypeFilter");

const transactionCategoryFilter = document.getElementById(
  "transactionCategoryFilter",
);

const allTransactionsList = document.getElementById("allTransactionsList");

// =========================
// OPEN TRANSACTIONS
// =========================

// =========================
// ADD TRANSACTION BUTTON
// =========================

if (transactionsAddButton) {
  transactionsAddButton.addEventListener("click", openModal);
}

// =========================
// FILTER EVENTS
// =========================

if (transactionSearch) {
  transactionSearch.addEventListener("input", renderTransactionsPage);
}

if (transactionTypeFilter) {
  transactionTypeFilter.addEventListener("change", renderTransactionsPage);
}

if (transactionCategoryFilter) {
  transactionCategoryFilter.addEventListener("change", renderTransactionsPage);
}

// =========================
// CATEGORY FILTER
// =========================

function updateTransactionCategories(transactions) {
  const currentValue = transactionCategoryFilter.value;

  const categories = [
    ...new Set(transactions.map((transaction) => transaction.category)),
  ];

  transactionCategoryFilter.innerHTML = `

        <option value="all">
            All categories
        </option>

    `;

  categories.sort().forEach((category) => {
    const option = document.createElement("option");

    option.value = category;

    option.textContent = category;

    transactionCategoryFilter.appendChild(option);
  });

  if (categories.includes(currentValue)) {
    transactionCategoryFilter.value = currentValue;
  }
}

// =========================
// RENDER TRANSACTIONS PAGE
// =========================

function renderTransactionsPage() {
  if (!allTransactionsList) {
    return;
  }

  const transactions = getTransactions();

  // =========================
  // SUMMARY
  // =========================

  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const expenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const net = income - expenses;

  document.getElementById("transactionsIncome").textContent =
    formatMoney(income);

  document.getElementById("transactionsExpenses").textContent =
    formatMoney(expenses);

  document.getElementById("transactionsNet").textContent = formatMoney(net);

  // =========================
  // CATEGORY FILTER
  // =========================

  updateTransactionCategories(transactions);

  // =========================
  // SEARCH
  // =========================

  const search = transactionSearch.value.trim().toLowerCase();

  const type = transactionTypeFilter.value;

  const category = transactionCategoryFilter.value;

  // =========================
  // FILTER
  // =========================

  const filtered = transactions.filter((transaction) => {
    const matchesSearch = transaction.description
      .toLowerCase()
      .includes(search);

    const matchesType = type === "all" || transaction.type === type;

    const matchesCategory =
      category === "all" || transaction.category === category;

    return matchesSearch && matchesType && matchesCategory;
  });

  // =========================
  // EMPTY
  // =========================

  if (filtered.length === 0) {
    allTransactionsList.innerHTML = `

            <div class="no-transactions">

                <strong>
                    No transactions found
                </strong>

                <span>
                    Try changing your search or filters.
                </span>

            </div>

        `;

    return;
  }

  // =========================
  // RENDER
  // =========================

  allTransactionsList.innerHTML = filtered
    .map((transaction) => {
      const isIncome = transaction.type === "income";

      const prefix = isIncome ? "+" : "-";

      const amountClass = isIncome ? "income" : "expense";

      return `

                    <div
                        class="all-transaction"
                    >

                        <div
                            class="transaction-name"
                        >

                            <span
                                class="transaction-name-icon"
                            >
                                ${getCategoryIcon(transaction.category)}
                            </span>

                            <div>

                                <strong>
                                    ${escapeHTML(transaction.description)}
                                </strong>

                                <small>
                                    ${isIncome ? "Income" : "Expense"}
                                </small>

                            </div>

                        </div>


                        <div
                            class="transaction-category"
                        >
                            ${transaction.category}
                        </div>


                        <div
                            class="transaction-date"
                        >
                            ${formatDate(transaction.date)}
                        </div>


                        <div
                            class="transaction-amount ${amountClass}"
                        >
                            ${prefix}${formatMoney(transaction.amount)}
                        </div>


                        <button
                            class="delete-transaction"
                            data-id="${transaction.id}"
                            title="Delete"
                        >
                            🗑
                        </button>

                    </div>

                `;
    })
    .join("");

  // =========================
  // DELETE BUTTONS
  // =========================

  document.querySelectorAll(".delete-transaction").forEach((button) => {
    button.addEventListener("click", () => {
      deleteTransaction(Number(button.dataset.id));
    });
  });
}

// =========================
// DELETE TRANSACTION
// =========================

function deleteTransaction(transactionId) {
  const confirmed = confirm("Delete this transaction?");

  if (!confirmed) {
    return;
  }

  const transactions = getTransactions();

  const updated = transactions.filter(
    (transaction) => transaction.id !== transactionId,
  );

  saveTransactions(updated);

  // Update Dashboard

  renderDashboard();

  // Update Transactions

  renderTransactionsPage();
}

// =========================
// BUDGET SYSTEM
// =========================

const BUDGET_STORAGE_KEY = "vira_budgets";

// =========================
// BUDGET ELEMENTS
// =========================

const budgetNav = document.getElementById("budgetNav");

const budgetPage = document.getElementById("budgetPage");

const addBudgetButton = document.getElementById("addBudgetButton");

const budgetModal = document.getElementById("budgetModal");

const closeBudgetModal = document.getElementById("closeBudgetModal");

const budgetOverlay = budgetModal?.querySelector(".modal-overlay");

const budgetForm = document.getElementById("budgetForm");

const budgetList = document.getElementById("budgetList");

const noBudget = document.getElementById("noBudget");

// =========================
// GET BUDGETS
// =========================

function getBudgets() {
  const data = localStorage.getItem(BUDGET_STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Could not read Vira budgets:", error);

    return [];
  }
}

// =========================
// SAVE BUDGETS
// =========================

function saveBudgets(budgets) {
  localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
}

// =========================
// OPEN BUDGET PAGE
// =========================

// =========================
// TRANSACTIONS NAVIGATION
// =========================

if (transactionsNav) {
  transactionsNav.addEventListener("click", () => {
    showPage("transactions");
  });
}

// =========================
// BUDGET NAVIGATION
// =========================

if (budgetNav) {
  budgetNav.addEventListener("click", () => {
    showPage("budget");
  });
}

// =========================
// OPEN BUDGET MODAL
// =========================

if (addBudgetButton) {
  addBudgetButton.addEventListener("click", () => {
    budgetModal.classList.remove("hidden");
  });
}

// =========================
// CLOSE BUDGET MODAL
// =========================

function closeBudgetModalWindow() {
  budgetModal.classList.add("hidden");

  budgetForm.reset();
}

if (closeBudgetModal) {
  closeBudgetModal.addEventListener("click", closeBudgetModalWindow);
}

if (budgetOverlay) {
  budgetOverlay.addEventListener("click", closeBudgetModalWindow);
}

// =========================
// ADD BUDGET
// =========================

if (budgetForm) {
  budgetForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const category = document.getElementById("budgetCategory").value;

    const amount = Number(document.getElementById("budgetAmount").value);

    if (!amount || amount <= 0) {
      alert("Please enter a valid budget amount.");

      return;
    }

    const budgets = getBudgets();

    // Prevent duplicate category

    const existingIndex = budgets.findIndex(
      (budget) => budget.category === category,
    );

    const budget = {
      id: Date.now(),

      category: category,

      amount: amount,
    };

    if (existingIndex !== -1) {
      budgets[existingIndex] = budget;
    } else {
      budgets.push(budget);
    }

    saveBudgets(budgets);

    closeBudgetModalWindow();

    renderBudgetPage();
  });
}

// =========================
// CALCULATE CATEGORY SPENDING
// =========================

function getCategorySpent(category) {
  const transactions = getTransactions();

  return transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" && transaction.category === category,
    )
    .reduce((total, transaction) => total + transaction.amount, 0);
}

// =========================
// RENDER BUDGET PAGE
// =========================

function renderBudgetPage() {
  if (!budgetList) {
    return;
  }

  const budgets = getBudgets();

  // =========================
  // OVERVIEW
  // =========================

  const totalBudget = budgets.reduce(
    (total, budget) => total + budget.amount,
    0,
  );

  const totalSpent = budgets.reduce(
    (total, budget) => total + getCategorySpent(budget.category),
    0,
  );

  const remaining = totalBudget - totalSpent;

  document.getElementById("totalBudget").textContent = formatMoney(totalBudget);

  document.getElementById("totalBudgetSpent").textContent =
    formatMoney(totalSpent);

  document.getElementById("totalBudgetRemaining").textContent =
    formatMoney(remaining);

  // =========================
  // EMPTY
  // =========================

  if (budgets.length === 0) {
    budgetList.innerHTML = "";

    noBudget.classList.remove("hidden");

    return;
  }

  noBudget.classList.add("hidden");

  // =========================
  // BUDGET CARDS
  // =========================

  budgetList.innerHTML = budgets
    .map((budget) => {
      const spent = getCategorySpent(budget.category);

      const percentage =
        budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

      const progress = Math.min(percentage, 100);

      let status = "good";

      let statusText = "You're on track";

      if (percentage >= 90) {
        status = "danger";

        statusText =
          percentage >= 100 ? "Budget exceeded" : "Almost at your limit";
      } else if (percentage >= 70) {
        status = "warning";

        statusText = "You're getting close";
      }

      return `

                    <div
                        class="budget-card"
                    >

                        <div
                            class="budget-card-header"
                        >

                            <div
                                class="budget-category"
                            >

                                <span
                                    class="budget-category-icon"
                                >
                                    ${getCategoryIcon(budget.category)}
                                </span>

                                <div>

                                    <strong>
                                        ${budget.category}
                                    </strong>

                                    <small>
                                        Monthly budget
                                    </small>

                                </div>

                            </div>


                            <button
                                class="delete-budget"
                                data-id="${budget.id}"
                                title="Delete budget"
                            >
                                🗑
                            </button>

                        </div>


                        <div
                            class="budget-numbers"
                        >

                            <span
                                class="budget-spent"
                            >
                                ${formatMoney(spent)} spent
                            </span>

                            <span
                                class="budget-limit"
                            >
                                ${formatMoney(budget.amount)}
                            </span>

                        </div>


                        <div
                            class="budget-progress"
                        >

                            <div
                                class="budget-progress-bar ${status}"
                                style="width: ${progress}%"
                            ></div>

                        </div>


                        <div
                            class="budget-status ${status}"
                        >
                            ${statusText}
                            ·
                            ${percentage}%
                        </div>

                    </div>

                `;
    })
    .join("");

  // =========================
  // DELETE
  // =========================

  document.querySelectorAll(".delete-budget").forEach((button) => {
    button.addEventListener("click", () => {
      const confirmed = confirm("Delete this budget?");

      if (!confirmed) {
        return;
      }

      const id = Number(button.dataset.id);

      const budgets = getBudgets();

      const updated = budgets.filter((budget) => budget.id !== id);

      saveBudgets(updated);

      renderBudgetPage();
    });
  });
}

// =========================
// VIRA PAGE NAVIGATION
// =========================

const dashboardNav = document.querySelector(
  ".navigation .nav-item:first-child",
);

// ==================== ANALYTICS ====================

const analyticsNav = document.getElementById("analyticsNav");
const analyticsPage = document.getElementById("analyticsPage");

const analyticsIncome = document.getElementById("analyticsIncome");
const analyticsExpenses = document.getElementById("analyticsExpenses");
const analyticsNet = document.getElementById("analyticsNet");
const analyticsTransactions = document.getElementById("analyticsTransactions");

const analyticsIncomeBar = document.getElementById("analyticsIncomeBar");
const analyticsExpenseBar = document.getElementById("analyticsExpenseBar");

const analyticsIncomeBarValue = document.getElementById(
  "analyticsIncomeBarValue",
);

const analyticsExpenseBarValue = document.getElementById(
  "analyticsExpenseBarValue",
);

const analyticsCategories = document.getElementById("analyticsCategories");

const analyticsDailyChart = document.getElementById("analyticsDailyChart");

function renderAnalyticsPage() {
  const transactions = getTransactions();

  let income = 0;
  let expenses = 0;

  transactions.forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;

    if (transaction.type === "income") {
      income += amount;
    }

    if (transaction.type === "expense") {
      expenses += amount;
    }
  });

  const net = income - expenses;

  if (analyticsIncome) {
    analyticsIncome.textContent = formatMoney(income);
  }

  if (analyticsExpenses) {
    analyticsExpenses.textContent = formatMoney(expenses);
  }

  if (analyticsNet) {
    analyticsNet.textContent = formatMoney(net);
  }

  if (analyticsTransactions) {
    analyticsTransactions.textContent = transactions.length;
  }

  // ==================== RECEIPTS ====================

  const receiptsNav = document.getElementById("receiptsNav");
  const receiptsPage = document.getElementById("receiptsPage");

  const addReceiptButton = document.getElementById("addReceiptButton");
  const receiptOverlay = document.getElementById("receiptOverlay");
  const closeReceiptModal = document.getElementById("closeReceiptModal");
  const receiptForm = document.getElementById("receiptForm");

  const receiptImage = document.getElementById("receiptImage");
  const receiptAmount = document.getElementById("receiptAmount");
  const receiptCategory = document.getElementById("receiptCategory");
  const receiptDescription = document.getElementById("receiptDescription");
  const receiptDate = document.getElementById("receiptDate");

  const receiptsList = document.getElementById("receiptsList");
  const noReceipts = document.getElementById("noReceipts");

  const receiptsCount = document.getElementById("receiptsCount");
  const receiptsTotal = document.getElementById("receiptsTotal");

  const RECEIPTS_STORAGE_KEY = "vira_receipts";
  function getReceipts() {
    return JSON.parse(localStorage.getItem(RECEIPTS_STORAGE_KEY) || "[]");
  }

  function saveReceipts(receipts) {
    localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(receipts));
  }

  function openReceiptModal() {
    receiptOverlay?.classList.remove("hidden");

    if (receiptDate) {
      receiptDate.value = new Date().toISOString().split("T")[0];
    }
  }

  function closeReceiptModalHandler() {
    receiptOverlay?.classList.add("hidden");
    receiptForm?.reset();
  }

  function renderReceiptsPage() {
    const receipts = getReceipts();

    const total = receipts.reduce((sum, receipt) => {
      return sum + (Number(receipt.amount) || 0);
    }, 0);

    if (receiptsCount) {
      receiptsCount.textContent = receipts.length;
    }

    if (receiptsTotal) {
      receiptsTotal.textContent = formatMoney(total);
    }

    if (!receiptsList || !noReceipts) return;

    if (receipts.length === 0) {
      receiptsList.innerHTML = "";
      noReceipts.classList.remove("hidden");
      return;
    }

    noReceipts.classList.add("hidden");

    receiptsList.innerHTML = receipts
      .slice()
      .reverse()
      .map((receipt) => {
        const imageHTML = receipt.image
          ? `
          <img
            class="receipt-thumbnail"
            src="${receipt.image}"
            alt="Receipt image"
          >
        `
          : `
          <div class="receipt-thumbnail receipt-placeholder">
            🧾
          </div>
        `;

        return `
        <article class="receipt-item">

          <div class="receipt-item-main">

            ${imageHTML}

            <div class="receipt-info">

              <h4>
                ${escapeHTML(receipt.description || "Untitled receipt")}
              </h4>

              <p>
                ${escapeHTML(receipt.category || "Other")}
                ·
                ${escapeHTML(receipt.date || "")}
              </p>

            </div>

          </div>

          <div class="receipt-item-side">

            <strong>
              ${formatMoney(Number(receipt.amount) || 0)}
            </strong>

            <button
              class="delete-receipt-button"
              type="button"
              data-receipt-id="${receipt.id}"
            >
              Delete
            </button>

          </div>

        </article>
      `;
      })
      .join("");
  }
  if (receiptForm) {
    receiptForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const amount = Number(receiptAmount?.value);

      if (!amount || amount <= 0) {
        return;
      }

      const file = receiptImage?.files?.[0];

      const createReceipt = (imageData = "") => {
        const receipts = getReceipts();

        const newReceipt = {
          id: Date.now(),
          amount,
          category: receiptCategory?.value || "Other",
          description: receiptDescription?.value.trim() || "",
          date: receiptDate?.value || new Date().toISOString().split("T")[0],
          image: imageData,
        };

        receipts.push(newReceipt);
        saveReceipts(receipts);

        closeReceiptModalHandler();
        renderReceiptsPage();
      };

      if (file) {
        const reader = new FileReader();

        reader.onload = () => {
          createReceipt(reader.result);
        };

        reader.readAsDataURL(file);
      } else {
        createReceipt();
      }
    });
  }
  addReceiptButton?.addEventListener("click", openReceiptModal);

  closeReceiptModal?.addEventListener("click", closeReceiptModalHandler);

  receiptOverlay?.addEventListener("click", (event) => {
    if (event.target === receiptOverlay) {
      closeReceiptModalHandler();
    }
  });
  if (receiptsList) {
    receiptsList.addEventListener("click", (event) => {
      const deleteButton = event.target.closest(".delete-receipt-button");

      if (!deleteButton) return;

      const receiptId = Number(deleteButton.dataset.receiptId);

      const updatedReceipts = getReceipts().filter(
        (receipt) => receipt.id !== receiptId,
      );

      saveReceipts(updatedReceipts);
      renderReceiptsPage();
    });
  }
  // ==================== INCOME VS EXPENSES ====================

  const maxValue = Math.max(income, expenses);

  if (analyticsIncomeBar) {
    analyticsIncomeBar.style.width =
      maxValue > 0 ? `${(income / maxValue) * 100}%` : "0%";
  }

  if (analyticsExpenseBar) {
    analyticsExpenseBar.style.width =
      maxValue > 0 ? `${(expenses / maxValue) * 100}%` : "0%";
  }

  if (analyticsIncomeBarValue) {
    analyticsIncomeBarValue.textContent = formatMoney(income);
  }

  if (analyticsExpenseBarValue) {
    analyticsExpenseBarValue.textContent = formatMoney(expenses);
  }

  // ==================== EXPENSE BY CATEGORY ====================

  if (analyticsCategories) {
    const categoryTotals = {};

    transactions.forEach((transaction) => {
      if (transaction.type !== "expense") return;

      const category = transaction.category || "Other";
      const amount = Number(transaction.amount) || 0;

      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });

    const categories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    if (categories.length === 0) {
      analyticsCategories.innerHTML = `
        <div class="empty-state">
          No expense data yet.
        </div>
      `;
    } else {
      const maxCategoryValue = categories[0][1];

      analyticsCategories.innerHTML = categories
        .map(([category, amount]) => {
          const percentage =
            maxCategoryValue > 0 ? (amount / maxCategoryValue) * 100 : 0;

          return `
            <div class="category-analytics-item">

              <div class="category-analytics-top">

                <div class="category-analytics-name">
                  <span class="category-icon">
                    ${getCategoryIcon(category)}
                  </span>

                  <span>${escapeHTML(category)}</span>
                </div>

                <strong>${formatMoney(amount)}</strong>

              </div>

              <div class="category-analytics-track">
                <div
                  class="category-analytics-bar"
                  style="width: ${percentage}%"
                ></div>
              </div>

            </div>
          `;
        })
        .join("");
    }
  }

  // ==================== LAST 7 DAYS ====================

  if (analyticsDailyChart) {
    const today = new Date();

    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      days.push({
        date,
        amount: 0,
      });
    }

    transactions.forEach((transaction) => {
      if (transaction.type !== "expense") return;

      const transactionDate = new Date(transaction.date);

      if (Number.isNaN(transactionDate.getTime())) return;

      transactionDate.setHours(0, 0, 0, 0);

      const matchingDay = days.find(
        (day) => day.date.getTime() === transactionDate.getTime(),
      );

      if (matchingDay) {
        matchingDay.amount += Number(transaction.amount) || 0;
      }
    });

    const maxDailyValue = Math.max(...days.map((day) => day.amount), 0);

    analyticsDailyChart.innerHTML = days
      .map((day) => {
        const height =
          maxDailyValue > 0 ? (day.amount / maxDailyValue) * 100 : 0;

        const label = day.date.toLocaleDateString("en-US", {
          weekday: "short",
        });

        return `
          <div class="daily-chart-item">

            <div class="daily-chart-value">
              ${formatMoney(day.amount)}
            </div>

            <div class="daily-chart-track">
              <div
                class="daily-chart-bar"
                style="height: ${height}%"
              ></div>
            </div>

            <span class="daily-chart-label">
              ${label}
            </span>

          </div>
        `;
      })
      .join("");
  }
}

// =========================
// ALL PAGES
// =========================

const viraPages = {
  dashboard: document.getElementById("dashboardPage"),
  transactions: document.getElementById("transactionsPage"),
  budget: document.getElementById("budgetPage"),
  analytics: document.getElementById("analyticsPage"),
  receipts: document.getElementById("receiptsPage"),
  recurring: document.getElementById("recurringPage"),
  settings: document.getElementById("settingsPage"),
};

// =========================
// SHOW PAGE
// =========================

function showPage(pageName) {
  // Hide every page

  Object.values(viraPages).forEach((page) => {
    if (page) {
      page.classList.add("hidden");
    }
  });

  // Show selected page

  const selectedPage = viraPages[pageName];

  if (selectedPage) {
    selectedPage.classList.remove("hidden");
  }

  // Update sidebar active state

  document.querySelectorAll(".navigation .nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  if (pageName === "dashboard") {
    dashboardNav?.classList.add("active");

    renderDashboard();
  }

  if (pageName === "transactions") {
    transactionsNav?.classList.add("active");

    renderTransactionsPage();
  }

  if (pageName === "budget") {
    budgetNav?.classList.add("active");

    renderBudgetPage();
  }
  if (pageName === "analytics") {
    analyticsNav?.classList.add("active");
    renderAnalyticsPage();
  }
  if (pageName === "receipts") {
    receiptsNav?.classList.add("active");
    renderReceiptsPage();
  }
}

// =========================
// DASHBOARD NAVIGATION
// =========================

if (dashboardNav) {
  dashboardNav.addEventListener("click", () => {
    showPage("dashboard");
  });
}
if (analyticsNav) {
  analyticsNav.addEventListener("click", () => {
    showPage("analytics");
  });
}
if (receiptsNav) {
  receiptsNav.addEventListener("click", () => {
    showPage("receipts");
  });
}
const recurringNav = document.getElementById("recurringNav");
if (recurringNav) {
  recurringNav.addEventListener("click", () => {
    showPage("recurring");
    renderRecurringPage();
  });
}
const settingsNav = document.getElementById("settingsNav");

if (settingsNav) {
  settingsNav.addEventListener("click", () => {
    showPage("settings");
    renderSettingsPage();
  });
}

/* =====================================================
   RECURRING SYSTEM
===================================================== */

const recurringStorageKey = "viraRecurring";

const recurringOverlay = document.getElementById("recurringOverlay");
const recurringForm = document.getElementById("recurringForm");
const addRecurringButton = document.getElementById("addRecurringButton");
const closeRecurringModal = document.getElementById("closeRecurringModal");

const recurringList = document.getElementById("recurringList");
const noRecurring = document.getElementById("noRecurring");

const recurringCount = document.getElementById("recurringCount");
const recurringTotal = document.getElementById("recurringTotal");

const recurringType = document.getElementById("recurringType");
const recurringTitle = document.getElementById("recurringTitle");
const recurringAmount = document.getElementById("recurringAmount");
const recurringCategory = document.getElementById("recurringCategory");
const recurringFrequency = document.getElementById("recurringFrequency");
const recurringStartDate = document.getElementById("recurringStartDate");
const recurringDescription = document.getElementById("recurringDescription");

function getRecurring() {
  try {
    return JSON.parse(localStorage.getItem(recurringStorageKey)) || [];
  } catch (error) {
    console.error("Could not load recurring transactions:", error);
    return [];
  }
}

function saveRecurring(recurringItems) {
  localStorage.setItem(recurringStorageKey, JSON.stringify(recurringItems));
}

function formatRecurringAmount(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getMonthlyAmount(item) {
  const amount = Number(item.amount) || 0;

  switch (item.frequency) {
    case "daily":
      return amount * 30;

    case "weekly":
      return amount * 4;

    case "yearly":
      return amount / 12;

    case "monthly":
    default:
      return amount;
  }
}

function openRecurringModal() {
  if (!recurringOverlay) return;

  recurringOverlay.classList.remove("hidden");

  if (recurringStartDate && !recurringStartDate.value) {
    recurringStartDate.value = new Date().toISOString().split("T")[0];
  }

  if (recurringTitle) {
    recurringTitle.focus();
  }
}

function closeRecurringModalWindow() {
  if (!recurringOverlay) return;

  recurringOverlay.classList.add("hidden");
}

function renderRecurringPage() {
  if (!recurringList) return;

  const recurringItems = getRecurring();

  recurringList.innerHTML = "";

  if (recurringCount) {
    recurringCount.textContent = recurringItems.length;
  }

  const totalMonthlyAmount = recurringItems.reduce((total, item) => {
    const monthlyAmount = getMonthlyAmount(item);

    if (item.type === "income") {
      return total + monthlyAmount;
    }

    return total - monthlyAmount;
  }, 0);

  if (recurringTotal) {
    recurringTotal.textContent = formatRecurringAmount(totalMonthlyAmount);
  }

  if (noRecurring) {
    noRecurring.classList.toggle("hidden", recurringItems.length > 0);
  }

  recurringItems.forEach((item) => {
    const recurringElement = document.createElement("div");

    recurringElement.className = "recurring-item";

    const sign = item.type === "income" ? "+" : "-";
    const amountClass = item.type === "income" ? "income" : "expense";

    const icon = item.type === "income" ? "↗" : "↘";

    recurringElement.innerHTML = `
      <div class="recurring-info">

        <div class="recurring-icon">
          ${icon}
        </div>

        <div class="recurring-details">
          <h4>${escapeRecurringHTML(item.title)}</h4>

          <p>
            ${escapeRecurringHTML(item.category)}
            •
            ${escapeRecurringHTML(item.startDate)}
          </p>

          ${
            item.description
              ? `<p>${escapeRecurringHTML(item.description)}</p>`
              : ""
          }
        </div>

      </div>

      <div class="recurring-meta">

        <span class="recurring-frequency">
          ${escapeRecurringHTML(item.frequency)}
        </span>

        <strong class="recurring-amount ${amountClass}">
          ${sign}${formatRecurringAmount(Number(item.amount))}
        </strong>

        <button
          class="delete-recurring-button"
          type="button"
          data-recurring-id="${item.id}"
          aria-label="Delete recurring transaction"
        >
          ×
        </button>

      </div>
    `;

    recurringList.appendChild(recurringElement);
  });
}

function escapeRecurringHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Open modal */

if (addRecurringButton) {
  addRecurringButton.addEventListener("click", openRecurringModal);
}

/* Close modal */

if (closeRecurringModal) {
  closeRecurringModal.addEventListener("click", closeRecurringModalWindow);
}

/* Close by clicking outside */

if (recurringOverlay) {
  recurringOverlay.addEventListener("click", (event) => {
    if (event.target === recurringOverlay) {
      closeRecurringModalWindow();
    }
  });
}

/* Save recurring transaction */

if (recurringForm) {
  recurringForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = recurringTitle.value.trim();
    const amount = Number(recurringAmount.value);

    if (!title || !amount || amount <= 0) {
      alert("Please enter a valid title and amount.");
      return;
    }

    const newRecurring = {
      id: Date.now().toString(),

      type: recurringType.value,

      title,

      amount,

      category: recurringCategory.value,

      frequency: recurringFrequency.value,

      startDate: recurringStartDate.value,

      description: recurringDescription.value.trim(),

      createdAt: new Date().toISOString(),
    };

    const recurringItems = getRecurring();

    recurringItems.unshift(newRecurring);

    saveRecurring(recurringItems);

    renderRecurringPage();

    recurringForm.reset();

    closeRecurringModalWindow();

    alert("Recurring transaction saved successfully.");
  });
}

/* Delete recurring transaction */

if (recurringList) {
  recurringList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".delete-recurring-button");

    if (!deleteButton) return;

    const recurringId = deleteButton.dataset.recurringId;

    const shouldDelete = confirm(
      "Are you sure you want to delete this recurring transaction?",
    );

    if (!shouldDelete) return;

    const updatedItems = getRecurring().filter(
      (item) => item.id !== recurringId,
    );

    saveRecurring(updatedItems);

    renderRecurringPage();
  });
}
function renderSettingsPage() {
  const userNameInput = document.getElementById("settingsUserName");
  const currencySelect = document.getElementById("settingsCurrency");
  const themeSelect = document.getElementById("settingsTheme");

  const saveUserNameBtn = document.getElementById("saveUserNameBtn");

  if (saveUserNameBtn) {
    saveUserNameBtn.addEventListener("click", () => {
      const userNameInput = document.getElementById("settingsUserName");

      const userName = userNameInput.value.trim();

      if (!userName) {
        alert("Please enter your name.");
        return;
      }

      localStorage.setItem("viraUserName", userName);

      alert("Name saved successfully.");
    });
  }
  const saveCurrencyBtn = document.getElementById("saveCurrencyBtn");

  if (saveCurrencyBtn) {
    saveCurrencyBtn.addEventListener("click", () => {
      const currencySelect = document.getElementById("settingsCurrency");

      const currency = currencySelect.value;

      localStorage.setItem("viraCurrency", currency);

      alert("Currency saved successfully.");
    });
  }
  const saveThemeBtn = document.getElementById("saveThemeBtn");

  if (saveThemeBtn) {
    saveThemeBtn.addEventListener("click", () => {
      const themeSelect = document.getElementById("settingsTheme");

      const theme = themeSelect.value;

      localStorage.setItem("viraTheme", theme);

      applyViraTheme(theme);

      alert("Theme saved successfully.");
    });
  }
  function applyViraTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("dark");
      return;
    }

    if (theme === "light") {
      document.body.classList.remove("dark");
      return;
    }

    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    document.body.classList.toggle("dark", prefersDark);
  }

  if (userNameInput) {
    userNameInput.value = localStorage.getItem("viraUserName") || "";
  }

  if (currencySelect) {
    currencySelect.value = localStorage.getItem("viraCurrency") || "USD";
  }

  if (themeSelect) {
    themeSelect.value = localStorage.getItem("viraTheme") || "system";
  }
}

/* ============================= */
/* LOAD SAVED THEME */
/* ============================= */
const theme = localStorage.getItem("viraTheme");
function loadSavedTheme() {
  const savedTheme = localStorage.getItem("viraTheme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  } else if (savedTheme === "light") {
    document.body.classList.remove("dark");
  } else {
    // System default
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    document.body.classList.toggle("dark", prefersDark);
  }
}

loadSavedTheme();

applyViraTheme(localStorage.getItem("viraTheme") || "system");
/* Initial render */
processRecurringTransactions();
renderRecurringPage();
// =========================
// START VIRA
// =========================

updateTypeButtons();

renderDashboard();
