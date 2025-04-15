import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faExchangeAlt, faChartBar, faWallet, faSignOutAlt, faBars, faPlus, faTimes, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

function Budgets({ user, setUser }) {
  const [budgets, setBudgets] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    budgetAmount: '',
    spentAmount: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBudgets();

    const interval = setInterval(fetchBudgets, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in.');
        navigate('/');
        return;
      }
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/budgets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBudgets(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError(err.response?.data?.msg || 'Failed to fetch budgets.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.budgetAmount || formData.budgetAmount <= 0) {
      setError('Please enter a valid name and budget amount');
      return;
    }
    const spentAmount = formData.spentAmount ? parseFloat(formData.spentAmount) : 0;
    if (spentAmount < 0) {
      setError('Spent amount cannot be negative');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in.');
        navigate('/');
        return;
      }
      const payload = {
        name: formData.name,
        budgetAmount: parseFloat(formData.budgetAmount),
        spentAmount: spentAmount,
      };
      if (editingId) {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/budgets/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/budgets`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setFormData({
        name: '',
        budgetAmount: '',
        spentAmount: '',
      });
      setEditingId(null);
      setShowForm(false);
      setError('');
      fetchBudgets();
    } catch (err) {
      console.error('Error saving budget:', err);
      setError(err.response?.data?.msg || 'Failed to save budget.');
    }
  };

  const handleEdit = (budget) => {
    setFormData({
      name: budget.name,
      budgetAmount: budget.budgetAmount.toString(),
      spentAmount: budget.spentAmount.toString(),
    });
    setEditingId(budget._id);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Session expired. Please log in.');
          navigate('/');
          return;
        }
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/budgets/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setError('');
        fetchBudgets();
      } catch (err) {
        console.error('Error deleting budget:', err);
        setError(err.response?.data?.msg || 'Failed to delete budget.');
      }
    }
  };

  const handleCloseForm = () => {
    setFormData({
      name: '',
      budgetAmount: '',
      spentAmount: '',
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/', { replace: true });
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
          <li className="active">
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
        <h2 className="transactions-heading">Budgets</h2>
        {error && <p className="error" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <div className="add-budget">
          <button className="add-budget-btn" onClick={() => setShowForm(true)}>
            <FontAwesomeIcon icon={faPlus} />
            New Budget
          </button>
        </div>
        <div className="budget-list">
          {budgets.length === 0 ? (
            <p className="no-data">No budgets available</p>
          ) : (
            budgets.map(budget => {
              const percentage = budget.budgetAmount > 0
                ? (budget.spentAmount / budget.budgetAmount) * 100
                : 0;
              const leftAmount = budget.budgetAmount - budget.spentAmount;
              return (
                <div key={budget._id} className="card budget-card">
                  <div className="budget-header">
                    <h3>{budget.name}</h3>
                    <div className="budget-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(budget)}
                        title="Edit Budget"
                      >
                        <FontAwesomeIcon icon={faEdit} style={{ color: '#000000' }} />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(budget._id)}
                        title="Delete Budget"
                      >
                        <FontAwesomeIcon icon={faTrash} style={{ color: '#dc2626' }} />
                      </button>
                    </div>
                  </div>
                  <div className="budget-details">
                    <span className="budget-spent">₹{budget.spentAmount.toFixed(2)}</span>
                    <span className="budget-total">of ₹{budget.budgetAmount.toFixed(2)}</span>
                  </div>
                  <div className="budget-progress">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="budget-footer">
                    <span>{percentage.toFixed(1)}% spent</span>
                    <span>₹{leftAmount.toFixed(2)} left</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {showForm && (
          <div className="popup-overlay">
            <div className="budget-popup">
              <button className="close-btn" onClick={handleCloseForm}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <form className="budget-form" onSubmit={handleSubmit}>
                <h3>{editingId ? 'Edit Budget' : 'Create New Budget'}</h3>
                {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Budget name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Budget Amount (₹)</label>
                  <input
                    type="number"
                    name="budgetAmount"
                    value={formData.budgetAmount}
                    onChange={handleChange}
                    placeholder="0"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Spent Amount (₹)</label>
                  <input
                    type="number"
                    name="spentAmount"
                    value={formData.spentAmount}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-buttons">
                  <button type="submit" className="submit-btn">
                    Save
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

export default Budgets;
