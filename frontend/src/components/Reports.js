import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faExchangeAlt, faChartBar, faWallet, faSignOutAlt, faBars } from '@fortawesome/free-solid-svg-icons';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

function Reports({ user, setUser }) {
  const [expenses, setExpenses] = useState([]);
  const [timeRange, setTimeRange] = useState('Last 6 Months');
  const [view, setView] = useState('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpenses();

    const interval = setInterval(fetchExpenses, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in.');
        navigate('/');
        return;
      }
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError(err.response?.data?.msg || 'Failed to fetch expenses.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/', { replace: true });
  };

  // Filter expenses by time range
  const now = new Date('2025-04-15');
  const filteredExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    if (timeRange === 'Last 6 Months') {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      return expDate >= sixMonthsAgo;
    } else if (timeRange === 'Last Year') {
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      return expDate >= oneYearAgo;
    }
    return true; // All Time
  });

  // Helper to get earliest expense month index
  const earliestExpenseMonth = () => {
    if (expenses.length === 0) return now.getMonth();
    const earliestDate = new Date(Math.min(...expenses.map(exp => new Date(exp.date))));
    return earliestDate.getMonth();
  };

  // Generate months starting from earliest expense
  const getMonths = () => {
    if (expenses.length === 0) return [];
    const earliestDate = new Date(Math.min(...expenses.map(exp => new Date(exp.date))));
    const months = [];
    const currentDate = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    while (currentDate <= endDate) {
      months.push(currentDate.toLocaleString('default', { month: 'short' }));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return months;
  };

  const months = getMonths();

  // Aggregate data
  const incomeData = months.map((month, index) => {
    const startDate = new Date(now.getFullYear(), earliestExpenseMonth() + index, 1);
    return filteredExpenses
      .filter(exp => exp.type === 'Income' && new Date(exp.date).getMonth() === startDate.getMonth() && new Date(exp.date).getFullYear() === startDate.getFullYear())
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
  });

  const expenseData = months.map((month, index) => {
    const startDate = new Date(now.getFullYear(), earliestExpenseMonth() + index, 1);
    return filteredExpenses
      .filter(exp => exp.type === 'Expense' && new Date(exp.date).getMonth() === startDate.getMonth() && new Date(exp.date).getFullYear() === startDate.getFullYear())
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
  });

  // Overview Bar Graph
  const barData = {
    labels: months,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        backgroundColor: '#22c55e',
        borderColor: '#22c55e',
        borderWidth: 1,
      },
      {
        label: 'Expenses',
        data: expenseData,
        backgroundColor: '#dc2626',
        borderColor: '#dc2626',
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          title: (context) => context[0].label,
          label: (context) => `${context.dataset.label}: ₹${context.raw.toFixed(2)}`,
        },
      },
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Month',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Amount (₹)',
        },
        beginAtZero: true,
      },
    },
  };

  // Income Line Graph
  const incomeLineData = {
    labels: months,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: '#22c55e',
        backgroundColor: '#22c55e',
        fill: false,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const lineOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          title: (context) => context[0].label,
          label: (context) => `Income: ₹${context.raw.toFixed(2)}`,
        },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Month',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Amount (₹)',
        },
        beginAtZero: true,
      },
    },
  };

  // Expense Line Graph
  const expenseLineData = {
    labels: months,
    datasets: [
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: '#dc2626',
        backgroundColor: '#dc2626',
        fill: false,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  // Expense Breakdown Pie Chart
  const categories = ['Food', 'Shopping', 'Bills', 'Entertainment', 'Salary', 'Other'];
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
    amount: filteredExpenses
      .filter(exp => exp.category === cat && exp.type === 'Expense')
      .reduce((sum, exp) => sum + Number(exp.amount), 0),
  })).filter(item => item.amount > 0);

  const totalExpense = expenseByCategory.reduce((sum, item) => sum + item.amount, 0);
  const pieData = {
    labels: expenseByCategory.map(item => item.category),
    datasets: [{
      data: expenseByCategory.map(item => item.amount),
      backgroundColor: expenseByCategory.map(item => categoryColors[item.category]),
      borderColor: '#ffffff',
      borderWidth: 2,
    }],
  };

  const pieOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const percentage = ((context.raw / totalExpense) * 100).toFixed(1);
            return `${context.label}: ₹${context.raw.toFixed(2)} (${percentage}%)`;
          },
        },
      },
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <h1>Hi, {user.fullName || 'User'}</h1>
      </header>

      {/* Sidebar */}
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
          <li className="active">
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

      {/* Main Content */}
      <main className="main-content">
        {error && <p className="error" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <h2 className="transactions-heading">Reports</h2>
        <div className="form-group report-filter">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="Last 6 Months">Last 6 Months</option>
            <option value="Last Year">Last Year</option>
            <option value="All Time">All Time</option>
          </select>
        </div>
        <div className="report-buttons">
          <button
            className={`report-btn ${view === 'Overview' ? 'active' : ''}`}
            onClick={() => setView('Overview')}
          >
            Overview
          </button>
          <button
            className={`report-btn ${view === 'Income' ? 'active' : ''}`}
            onClick={() => setView('Income')}
          >
            Income
          </button>
          <button
            className={`report-btn ${view === 'Expenses' ? 'active' : ''}`}
            onClick={() => setView('Expenses')}
          >
            Expenses
          </button>
        </div>

        {view === 'Overview' && (
          <div className="card report-card">
            <h3>Income vs Expenses</h3>
            {months.length === 0 ? (
              <p className="no-data">No transactions available</p>
            ) : (
              <div className="chart-container">
                <Bar data={barData} options={barOptions} />
              </div>
            )}
          </div>
        )}

        {view === 'Income' && (
          <div className="card report-card">
            <h3>Income Trend</h3>
            {months.length === 0 ? (
              <p className="no-data">No transactions available</p>
            ) : (
              <div className="chart-container">
                <Line data={incomeLineData} options={lineOptions} />
              </div>
            )}
          </div>
        )}

        {view === 'Expenses' && (
          <div className="card-row report-row">
            <div className="card report-card">
              <h3>Expense Trend</h3>
              {months.length === 0 ? (
                <p className="no-data">No transactions available</p>
              ) : (
                <div className="chart-container">
                  <Line data={expenseLineData} options={lineOptions} />
                </div>
              )}
            </div>
            <div className="card report-card">
              <h3>Expense Breakdown</h3>
              {expenseByCategory.length === 0 ? (
                <p className="no-data">No data available</p>
              ) : (
                <div className="pie-chart-container">
                  <Pie data={pieData} options={pieOptions} />
                  <div className="pie-legend">
                    {expenseByCategory.map(item => {
                      const percentage = ((item.amount / totalExpense) * 100).toFixed(1);
                      return (
                        <div key={item.category} className="legend-item">
                          <span
                            className="legend-color"
                            style={{ backgroundColor: categoryColors[item.category] }}
                          ></span>
                          <span>{item.category}: {percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Reports;
