import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faExchangeAlt, faChartBar, faWallet, faPlus, faSignOutAlt, faBars, faArrowUp, faArrowDown, faUtensils, faShoppingCart, faMoneyBill, faFilm, faBriefcase, faQuestion, faTimes, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard({ user, setUser }) {
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [formData, setFormData] = useState({
    type: 'Expense',
    title: '',
    amount: '',
    category: '',
    date: '2025-04-15',
    recurring: false,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpenses();
    fetchBudgets();
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      alert('Failed to fetch transactions. Please try again.');
    }
  };

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/budgets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBudgets(res.data);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      alert('Failed to fetch budgets. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
      };
      if (editingId) {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/expenses/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/expenses`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setFormData({
        type: 'Expense',
        title: '',
        amount: '',
        category: '',
        date: '2025-04-15',
        recurring: false,
      });
      setEditingId(null);
      setShowForm(false);
      fetchExpenses();
    } catch (err) {
      console.error('Error saving transaction:', err);
      alert('Failed to save transaction. Please try again.');
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      type: expense.type,
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date.split('T')[0],
      recurring: expense.recurring || false,
    });
    setEditingId(expense._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/expenses/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchExpenses();
      } catch (err) {
        console.error('Error deleting transaction:', err);
        alert('Failed to delete transaction. Please try again.');
      }
    }
  };

  const handleCloseForm = () => {
    setFormData({
      type: 'Expense',
      title: '',
      amount: '',
      category: '',
      date: '2025-04-15',
      recurring: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/', { replace: true });
  };

  const totalIncome = expenses
    .filter(exp => exp.type === 'Income')
    .reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalExpenses = expenses
    .filter(exp => exp.type === 'Expense')
    .reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalBalance = totalIncome - totalExpenses;

  const categories = ['Food', 'Shopping', 'Bills', 'Entertainment', 'Salary', 'Other'];
  const categoryIcons = {
    Food: faUtensils,
    Shopping: faShoppingCart,
    Bills: faMoneyBill,
    Entertainment: faFilm,
    Salary: faBriefcase,
    Other: faQuestion,
  };
  const categoryColors = {
    Food: '#eab308',
    Shopping: '#3b82f6',
    Bills: '#ef4444',
    Entertainment: '#8b5cf6',
    Salary: '#22c55e',
    Other: '#6b7280',
  };

  const expenseByCategory = categories.map(cat => ({
    category: cat,
    amount: expenses
      .filter(exp => exp.category === cat && exp.type === 'Expense')
      .reduce((sum, exp) => sum + Number(exp.amount), 0),
  })).filter(item => item.amount > 0);

  const pieData = {
    labels: expenseByCategory.map(item => item.category),
    datasets: [{
      data: expenseByCategory.map(item => item.amount),
      backgroundColor: expenseByCategory.map(item => categoryColors[item.category] || '#6b7280'),
      borderColor: '#ffffff',
      borderWidth: 2,
    }],
  };

  const pieOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ₹${context.raw.toFixed(2)}`,
        },
      },
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <h1>Hi, {user.fullName || 'User'}</h1>
      </header>

      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <ul>
          <li className="active">
            <Link to="/dashboard">
              <FontAwesomeIcon icon={faTachometerAlt} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/transactions">
              <FontAwesomeIcon icon={faExchangeAlt} />
              <span>Transactions</span>
            </Link>
          </li>
          <li>
            <Link to="/reports">
              <FontAwesomeIcon icon={faChartBar} />
              <span>Reports</span>
            </Link>
          </li>
          <li>
            <Link to="/budgets">
              <FontAwesomeIcon icon={faWallet} />
              <span>Budgets</span>
            </Link>
          </li>
        </ul>
        <button className="logout-btn" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} />
          Logout
        </button>
      </nav>

      <main className="main-content">
        <div className="card-row">
          <div className="card balance-card">
            <h3>Total Balance</h3>
            <p>₹{totalBalance.toFixed(2)}</p>
          </div>
          <div className="card income-card">
            <h3>Total Income</h3>
            <p>₹{totalIncome.toFixed(2)}</p>
          </div>
          <div className="card expense-card">
            <h3>Total Expenses</h3>
            <p>₹{totalExpenses.toFixed(2)}</p>
          </div>
        </div>

        <div className="card-row">
          <div className="card transactions-card">
            <div className="transactions-header">
              <h3>Recent Transactions</h3>
              <Link to="/transactions">
                <button className="view-all-btn">View All</button>
              </Link>
            </div>
            {expenses.length === 0 ? (
              <p className="no-data">No data available</p>
            ) : (
              <div className="transaction-list">
                {expenses.slice(0, 5).map(exp => (
                  <div key={exp._id} className="transaction-item">
                    <div className="transaction-left">
                      <FontAwesomeIcon
                        icon={exp.type === 'Expense' ? faArrowDown : faArrowUp}
                        className={exp.type === 'Expense' ? 'expense-arrow' : 'income-arrow'}
                      />
                      <div className="transaction-details">
                        <span className="transaction-title">{exp.title}</span>
                        <span className="transaction-date">{new Date(exp.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="transaction-right">
                      <span className={exp.type === 'Expense' ? 'expense-amount' : 'income-amount'}>
                        {exp.type === 'Expense' ? '-₹' : '+₹'}{exp.amount.toFixed(2)}
                      </span>
                      <div className="transaction-category">
                        <FontAwesomeIcon icon={categoryIcons[exp.category] || faQuestion} />
                        <span>{exp.category}</span>
                      </div>
                      <div className="transaction-actions">
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(exp)}
                          title="Edit Transaction"
                        >
                          <FontAwesomeIcon icon={faEdit} style={{ color: '#000000' }} />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(exp._id)}
                          title="Delete Transaction"
                        >
                          <FontAwesomeIcon icon={faTrash} style={{ color: '#dc2626' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card breakdown-card">
            <h3>Expense Breakdown</h3>
            {expenseByCategory.length === 0 ? (
              <p className="no-data">No data available</p>
            ) : (
              <div className="pie-chart-container">
                <Pie data={pieData} options={pieOptions} />
                <div className="pie-legend">
                  {expenseByCategory.map(item => (
                    <div key={item.category} className="legend-item">
                      <span
                        className="legend-color"
                        style={{ backgroundColor: categoryColors[item.category] }}
                      ></span>
                      <span>{item.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="add-transaction">
          <button className="add-btn" onClick={() => setShowForm(true)}>
            <FontAwesomeIcon icon={faPlus} />
            Add Transaction
          </button>
          {showForm && (
            <div className="popup-overlay">
              <div className="transaction-popup">
                <button className="close-btn" onClick={handleCloseForm}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <form className="transaction-form" onSubmit={handleSubmit}>
                  <h3>{editingId ? 'Edit Transaction' : 'Enter Transaction Details'}</h3>
                  <div className="form-group radio-group">
                    <label>
                      <input
                        type="radio"
                        name="type"
                        value="Expense"
                        checked={formData.type === 'Expense'}
                        onChange={handleChange}
                      />
                      Expense
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="type"
                        value="Income"
                        checked={formData.type === 'Income'}
                        onChange={handleChange}
                      />
                      Income
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter title"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="₹0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="recurring"
                        checked={formData.recurring}
                        onChange={handleChange}
                      />
                      Monthly recurring
                    </label>
                  </div>
                  <div className="form-buttons">
                    <button type="submit" className="submit-btn">
                      {editingId ? 'Update Transaction' : 'Add Transaction'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="card budget-process-card">
          <h3>Budget Process</h3>
          {budgets.length === 0 ? (
            <p className="no-data">No budgets available</p>
          ) : (
            <div className="budget-process-list">
              {budgets.map(budget => {
                const percentage = budget.budgetAmount > 0
                  ? (budget.spentAmount / budget.budgetAmount) * 100
                  : 0;
                return (
                  <div key={budget._id} className="budget-process-item">
                    <div className="budget-process-header">
                      <span className="budget-process-name">{budget.name}</span>
                      <span className="budget-process-amount">
                        ₹{budget.spentAmount.toFixed(2)} / ₹{budget.budgetAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="budget-progress">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
