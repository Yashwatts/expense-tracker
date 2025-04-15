import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faExchangeAlt, faChartBar, faWallet, faSignOutAlt, faBars, faArrowUp, faArrowDown, faUtensils, faShoppingCart, faMoneyBill, faFilm, faBriefcase, faQuestion, faSearch, faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';

function Transactions({ user, setUser }) {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('All Time');
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
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/expenses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data);
      setFilteredExpenses(res.data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      alert('Failed to fetch transactions. Please try again.');
    }
  };

  useEffect(() => {
    filterExpenses();
  }, [searchQuery, selectedCategory, selectedTimeRange, expenses]);

  const filterExpenses = () => {
    let filtered = expenses;

    if (searchQuery) {
      filtered = filtered.filter(exp =>
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(exp => exp.category === selectedCategory);
    }

    const now = new Date('2025-04-15');
    filtered = filtered.filter(exp => {
      const expDate = new Date(exp.date);
      if (selectedTimeRange === 'Today') {
        return expDate.toDateString() === now.toDateString();
      } else if (selectedTimeRange === 'This Week') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return expDate >= weekStart && expDate <= now;
      } else if (selectedTimeRange === 'This Month') {
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      } else if (selectedTimeRange === 'This Year') {
        return expDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    setFilteredExpenses(filtered);
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
        await axios.put(`http://localhost:5000/api/expenses/${editingId}`, payload, {
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
        await axios.delete(`http://localhost:5000/api/expenses/${id}`, {
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

  const categories = ['Food', 'Shopping', 'Bills', 'Entertainment', 'Salary', 'Other'];
  const categoryIcons = {
    Food: faUtensils,
    Shopping: faShoppingCart,
    Bills: faMoneyBill,
    Entertainment: faFilm,
    Salary: faBriefcase,
    Other: faQuestion,
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
          <li>
            <Link to="/dashboard">
              <FontAwesomeIcon icon={faTachometerAlt} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li className="active">
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
        <h2 className="transactions-heading">Transactions</h2>
        <div className="card filter-card">
          <h3>Filter Transactions</h3>
          <div className="filter-row">
            <div className="form-group filter-item search-group">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Search by title or category"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="form-group filter-item">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group filter-item">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
              >
                <option value="All Time">All Time</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="This Year">This Year</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card transactions-card">
          <h3>All Transactions</h3>
          {filteredExpenses.length === 0 ? (
            <p className="no-data">No transactions found</p>
          ) : (
            <div className="transaction-list">
              {filteredExpenses.map(exp => (
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
                    Update Transaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Transactions;