import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginSignup from './components/LoginSignup';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Reports from './components/Reports';
import Budgets from './components/Budgets';
import './App.css';

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && user) {
      setUser(null);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" /> : <LoginSignup setUser={setUser} />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/" />}
        />
        <Route
          path="/transactions"
          element={user ? <Transactions user={user} setUser={setUser} /> : <Navigate to="/" />}
        />
        <Route
          path="/reports"
          element={user ? <Reports user={user} setUser={setUser} /> : <Navigate to="/" />}
        />
        <Route
          path="/budgets"
          element={user ? <Budgets user={user} setUser={setUser} /> : <Navigate to="/" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;