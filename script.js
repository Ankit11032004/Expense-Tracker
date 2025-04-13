document.addEventListener('DOMContentLoaded', function() {
    const categories = {
        income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'],
        expense: ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Rent', 'Healthcare', 'Education', 'Shopping', 'Other Expenses']
    };

    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const filterCategory = document.getElementById('filter-category');
    const editModal = new bootstrap.Modal(document.getElementById('editModal'));
    const editForm = document.getElementById('edit-form');
    const saveChangesBtn = document.getElementById('save-changes');
    const totalIncomeElement = document.getElementById('total-income');
    const totalExpenseElement = document.getElementById('total-expense');
    const netBalanceElement = document.getElementById('net-balance');
    
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    init();
    
    function init() {
        document.getElementById('date').valueAsDate = new Date();
        updateCategoryDropdowns();
        updateTransactionList();
        updateSummary();
        transactionForm.addEventListener('submit', addTransaction);
        document.getElementById('type').addEventListener('change', updateCategories);
        filterCategory.addEventListener('change', updateTransactionList);
        saveChangesBtn.addEventListener('click', saveEditedTransaction);
    }
    
    function updateCategoryDropdowns() {
        const typeSelect = document.getElementById('type');
        const categorySelect = document.getElementById('category');
        const editCategorySelect = document.getElementById('edit-category');
        const filterCategorySelect = document.getElementById('filter-category');
        
        categorySelect.innerHTML = '<option value="" selected disabled>Select category</option>';
        editCategorySelect.innerHTML = '';
        filterCategorySelect.innerHTML = '<option value="all">All Categories</option>';
        
        const selectedType = typeSelect.value || 'income';
        
        if (selectedType) {
            categories[selectedType].forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
                const editOption = option.cloneNode(true);
                editCategorySelect.appendChild(editOption);
            });
        }
        
        Object.values(categories).forEach(typeCategories => {
            typeCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                filterCategorySelect.appendChild(option.cloneNode(true));
            });
        });
    }
    
    function updateCategories() {
        updateCategoryDropdowns();
    }
    
    function addTransaction(e) {
        e.preventDefault();
        
        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const description = document.getElementById('description').value;
  
        if (!type || !category || !amount || !date || !description) {
            alert('Please fill in all fields');
            return;
        }
        
        if (amount <= 0) {
            alert('Amount must be greater than 0');
            return;
        }

        const transaction = {
            id: Date.now(),
            type,
            category,
            amount,
            date,
            description
        };
        
        transactions.push(transaction);
        saveTransactions();
        updateTransactionList();
        updateSummary();
        transactionForm.reset();
        document.getElementById('date').valueAsDate = new Date();
    }
    
    function updateTransactionList() {
        transactionList.innerHTML = '';
        const filterValue = filterCategory.value;
        const filteredTransactions = filterValue === 'all' 
            ? transactions 
            : transactions.filter(t => t.category === filterValue);
        
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        filteredTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.className = `new-transaction ${transaction.type}-row`;
            const formattedDate = new Date(transaction.date).toLocaleDateString();
            const formattedAmount = transaction.amount.toFixed(2);
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category}</td>
                <td><span class="badge rounded-pill ${transaction.type === 'income' ? 'bg-success' : 'bg-danger'}">${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span></td>
                <td class="${transaction.type === 'income' ? 'text-success' : 'text-danger'} fw-bold">${transaction.type === 'income' ? '+' : '-'}$${formattedAmount}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${transaction.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${transaction.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            
            transactionList.appendChild(row);
        });
        
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', editTransaction);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteTransaction);
        });
    }
    
    function editTransaction(e) {
        const id = parseInt(e.target.closest('button').getAttribute('data-id'));
        const transaction = transactions.find(t => t.id === id);
        
        if (transaction) {
            document.getElementById('edit-id').value = transaction.id;
            document.getElementById('edit-type').value = transaction.type;
            document.getElementById('edit-amount').value = transaction.amount;
            document.getElementById('edit-date').value = transaction.date;
            document.getElementById('edit-description').value = transaction.description;
            
            const editCategorySelect = document.getElementById('edit-category');
            editCategorySelect.innerHTML = '';
            
            categories[transaction.type].forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                if (category === transaction.category) {
                    option.selected = true;
                }
                editCategorySelect.appendChild(option);
            });
            
            editModal.show();
        }
    }
    
    function saveEditedTransaction() {
        const id = parseInt(document.getElementById('edit-id').value);
        const type = document.getElementById('edit-type').value;
        const category = document.getElementById('edit-category').value;
        const amount = parseFloat(document.getElementById('edit-amount').value);
        const date = document.getElementById('edit-date').value;
        const description = document.getElementById('edit-description').value;
        
        if (!type || !category || !amount || !date || !description) {
            alert('Please fill in all fields');
            return;
        }
        
        if (amount <= 0) {
            alert('Amount must be greater than 0');
            return;
        }
        
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = {
                id,
                type,
                category,
                amount,
                date,
                description
            };
            
            saveTransactions();
            updateTransactionList();
            updateSummary();
            editModal.hide();
        }
    }
    
    function deleteTransaction(e) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            const id = parseInt(e.target.closest('button').getAttribute('data-id'));
            transactions = transactions.filter(t => t.id !== id);
            saveTransactions();
            updateTransactionList();
            updateSummary();
        }
    }
    
    function updateSummary() {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const netBalance = totalIncome - totalExpense;
        
        totalIncomeElement.textContent = `$${totalIncome.toFixed(2)}`;
        totalExpenseElement.textContent = `$${totalExpense.toFixed(2)}`;
        netBalanceElement.textContent = `$${netBalance.toFixed(2)}`;
        
        if (netBalance >= 0) {
            netBalanceElement.parentElement.parentElement.className = 'card text-white bg-primary h-100';
        } else {
            netBalanceElement.parentElement.parentElement.className = 'card text-white bg-warning h-100';
        }
    }
    
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
});