const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: 'https://expensevault.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schemas
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  recurring: { type: Boolean, default: false },
});
const Expense = mongoose.model('Expense', expenseSchema);

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  budgetAmount: { type: Number, required: true },
  spentAmount: { type: Number, default: 0 },
});
const Budget = mongoose.model('Budget', budgetSchema);

// Authentication Middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ msg: 'Invalid token' });
  }
};

// Signup
app.post('/api/signup', async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || fullName.trim() === '') {
    return res.status(400).json({ msg: 'Full name is required' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ msg: 'Valid email is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ fullName, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: { fullName, email } });
  } catch (err) {
    console.error('Signup error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: 'Invalid user data' });
    }
    res.status(500).json({ msg: 'Failed to register user' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { fullName: user.fullName, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get Expenses
app.get('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.userId }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Add Expense
app.post('/api/expenses', authMiddleware, async (req, res) => {
  const { type, title, amount, category, date, recurring } = req.body;
  if (!type || !['Expense', 'Income'].includes(type)) {
    return res.status(400).json({ msg: 'Valid type (Expense or Income) is required' });
  }
  if (!title || title.trim() === '') {
    return res.status(400).json({ msg: 'Title is required' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ msg: 'Amount must be greater than 0' });
  }
  if (!category || category.trim() === '') {
    return res.status(400).json({ msg: 'Category is required' });
  }
  if (!date || isNaN(new Date(date).getTime())) {
    return res.status(400).json({ msg: 'Valid date is required' });
  }
  try {
    const expense = new Expense({
      userId: req.userId,
      type,
      title,
      amount,
      category,
      date,
      recurring: recurring || false,
    });
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    console.error('Post expense error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update Expense
app.put('/api/expenses/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { type, title, amount, category, date, recurring } = req.body;
  if (!type || !['Expense', 'Income'].includes(type)) {
    return res.status(400).json({ msg: 'Valid type (Expense or Income) is required' });
  }
  if (!title || title.trim() === '') {
    return res.status(400).json({ msg: 'Title is required' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ msg: 'Amount must be greater than 0' });
  }
  if (!category || category.trim() === '') {
    return res.status(400).json({ msg: 'Category is required' });
  }
  if (!date || isNaN(new Date(date).getTime())) {
    return res.status(400).json({ msg: 'Valid date is required' });
  }
  try {
    const expense = await Expense.findOne({ _id: id, userId: req.userId });
    if (!expense) return res.status(404).json({ msg: 'Expense not found' });

    expense.type = type;
    expense.title = title;
    expense.amount = amount;
    expense.category = category;
    expense.date = date;
    expense.recurring = recurring || false;
    await expense.save();

    res.json(expense);
  } catch (err) {
    console.error('Put expense error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete Expense
app.delete('/api/expenses/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await Expense.findOne({ _id: id, userId: req.userId });
    if (!expense) return res.status(404).json({ msg: 'Expense not found' });

    await expense.deleteOne();
    res.json({ msg: 'Expense deleted' });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get Budgets
app.get('/api/budgets', authMiddleware, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    res.json(budgets);
  } catch (err) {
    console.error('Get budgets error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Add Budget
app.post('/api/budgets', authMiddleware, async (req, res) => {
  const { name, budgetAmount, spentAmount } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ msg: 'Name is required' });
  }
  if (!budgetAmount || budgetAmount <= 0) {
    return res.status(400).json({ msg: 'Budget amount must be greater than 0' });
  }
  if (spentAmount && spentAmount < 0) {
    return res.status(400).json({ msg: 'Spent amount cannot be negative' });
  }
  try {
    const budget = new Budget({
      userId: req.userId,
      name,
      budgetAmount,
      spentAmount: spentAmount || 0,
    });
    await budget.save();
    res.status(201).json(budget);
  } catch (err) {
    console.error('Post budget error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update Budget
app.put('/api/budgets/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, budgetAmount, spentAmount } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ msg: 'Name is required' });
  }
  if (!budgetAmount || budgetAmount <= 0) {
    return res.status(400).json({ msg: 'Budget amount must be greater than 0' });
  }
  if (spentAmount && spentAmount < 0) {
    return res.status(400).json({ msg: 'Spent amount cannot be negative' });
  }
  try {
    const budget = await Budget.findOne({ _id: id, userId: req.userId });
    if (!budget) return res.status(404).json({ msg: 'Budget not found' });

    budget.name = name;
    budget.budgetAmount = budgetAmount;
    budget.spentAmount = spentAmount || 0;
    await budget.save();

    res.json(budget);
  } catch (err) {
    console.error('Put budget error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete Budget
app.delete('/api/budgets/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const budget = await Budget.findOne({ _id: id, userId: req.userId });
    if (!budget) return res.status(404).json({ msg: 'Budget not found' });

    await budget.deleteOne();
    res.json({ msg: 'Budget deleted' });
  } catch (err) {
    console.error('Delete budget error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
