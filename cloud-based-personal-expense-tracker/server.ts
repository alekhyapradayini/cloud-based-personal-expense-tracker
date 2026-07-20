/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'aws-devops-secret-key-987654321';

// Base Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Turn off for simpler Vite Dev Server integration in iframe
}));
app.use(cors());
app.use(express.json());

// Initialize Local Relational Database
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Food', icon: 'Utensils', color: '#f59e0b', isCustom: false },
  { id: 'cat-2', name: 'Travel', icon: 'MapPin', color: '#3b82f6', isCustom: false },
  { id: 'cat-3', name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899', isCustom: false },
  { id: 'cat-4', name: 'Bills', icon: 'CreditCard', color: '#ef4444', isCustom: false },
  { id: 'cat-5', name: 'Medical', icon: 'Activity', color: '#10b981', isCustom: false },
  { id: 'cat-6', name: 'Entertainment', icon: 'Tv', color: '#6366f1', isCustom: false },
  { id: 'cat-7', name: 'Education', icon: 'BookOpen', color: '#14b8a6', isCustom: false },
  { id: 'cat-8', name: 'Investment', icon: 'TrendingUp', color: '#10b981', isCustom: false },
  { id: 'cat-9', name: 'Others', icon: 'HelpCircle', color: '#6b7280', isCustom: false },
];

async function initDB() {
  try {
    await fs.access(DB_FILE);
  } catch {
    const initialDB = {
      users: [],
      expenses: [],
      categories: DEFAULT_CATEGORIES,
    };
    await fs.writeFile(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
  }
}

async function readDB() {
  await initDB();
  const data = await fs.readFile(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

async function writeDB(data: any) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Authentication Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }
    req.user = user;
    next();
  });
}

// ==========================================
// AUTHENTICATION APIS
// ==========================================

// Register User
app.post('/api/auth/register', async (req: any, res: any) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = await readDB();
    const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: `usr-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    await writeDB(db);

    const token = jwt.sign({ id: newUser.id, email: newUser.email, name: newUser.name }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, createdAt: newUser.createdAt }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login User
app.post('/api/auth/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await readDB();
    const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get Profile Info
app.get('/api/auth/me', authenticateToken, async (req: any, res: any) => {
  try {
    const db = await readDB();
    const user = db.users.find((u: any) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error fetching user details' });
  }
});

// Update Profile Detail
app.put('/api/auth/profile', authenticateToken, async (req: any, res: any) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const db = await readDB();
    const userIdx = db.users.findIndex((u: any) => u.id === req.user.id);
    if (userIdx === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email taken by someone else
    const emailConflict = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.id !== req.user.id);
    if (emailConflict) {
      return res.status(400).json({ error: 'Email already taken by another account' });
    }

    db.users[userIdx].name = name;
    db.users[userIdx].email = email.toLowerCase();
    await writeDB(db);

    res.json({
      message: 'Profile updated successfully',
      user: { id: db.users[userIdx].id, name: db.users[userIdx].name, email: db.users[userIdx].email, createdAt: db.users[userIdx].createdAt }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Change Password
app.put('/api/auth/change-password', authenticateToken, async (req: any, res: any) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required' });
    }

    const db = await readDB();
    const user = db.users.find((u: any) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await writeDB(db);

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error updating password' });
  }
});


// ==========================================
// CATEGORY CRUD APIS
// ==========================================

// Get All Categories
app.get('/api/categories', authenticateToken, async (req: any, res: any) => {
  try {
    const db = await readDB();
    // Return standard categories + user's custom categories
    const list = db.categories.filter((c: any) => !c.isCustom || c.userId === req.user.id);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

// Create Custom Category (Admin/User Custom)
app.post('/api/categories', authenticateToken, async (req: any, res: any) => {
  try {
    const { name, icon, color } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const db = await readDB();
    const isDup = db.categories.some((c: any) => c.name.toLowerCase() === name.toLowerCase() && (!c.isCustom || c.userId === req.user.id));
    if (isDup) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    const newCategory = {
      id: `cat-${Date.now()}`,
      name,
      icon: icon || 'HelpCircle',
      color: color || '#3b82f6',
      isCustom: true,
      userId: req.user.id,
    };

    db.categories.push(newCategory);
    await writeDB(db);

    res.status(201).json({ message: 'Category created successfully', category: newCategory });
  } catch (error) {
    res.status(500).json({ error: 'Error creating category' });
  }
});


// ==========================================
// EXPENSE CRUD APIS
// ==========================================

// Create Expense
app.post('/api/expenses', authenticateToken, async (req: any, res: any) => {
  try {
    const { amount, categoryId, description, date, paymentMethod } = req.body;
    if (!amount || !categoryId || !date || !paymentMethod) {
      return res.status(400).json({ error: 'Amount, category, date, and payment method are required' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const db = await readDB();
    const catExists = db.categories.some((c: any) => c.id === categoryId && (!c.isCustom || c.userId === req.user.id));
    if (!catExists) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const newExpense = {
      id: `exp-${Date.now()}`,
      userId: req.user.id,
      amount: numericAmount,
      categoryId,
      description: description || '',
      date,
      paymentMethod,
      createdAt: new Date().toISOString(),
    };

    db.expenses.push(newExpense);
    await writeDB(db);

    res.status(201).json({ message: 'Expense added successfully', expense: newExpense });
  } catch (error) {
    res.status(500).json({ error: 'Error creating expense' });
  }
});

// Get Expenses with Search and Filter
app.get('/api/expenses', authenticateToken, async (req: any, res: any) => {
  try {
    const { search, categoryId, startDate, endDate, minAmount, maxAmount, paymentMethod } = req.query;
    const db = await readDB();

    let userExpenses = db.expenses.filter((e: any) => e.userId === req.user.id);

    // Apply Search Filter (on Description)
    if (search) {
      const q = String(search).toLowerCase();
      userExpenses = userExpenses.filter((e: any) => e.description.toLowerCase().includes(q));
    }

    // Category Filter
    if (categoryId) {
      userExpenses = userExpenses.filter((e: any) => e.categoryId === categoryId);
    }

    // Date Filters
    if (startDate) {
      userExpenses = userExpenses.filter((e: any) => e.date >= String(startDate));
    }
    if (endDate) {
      userExpenses = userExpenses.filter((e: any) => e.date <= String(endDate));
    }

    // Amount Filters
    if (minAmount) {
      userExpenses = userExpenses.filter((e: any) => e.amount >= parseFloat(String(minAmount)));
    }
    if (maxAmount) {
      userExpenses = userExpenses.filter((e: any) => e.amount <= parseFloat(String(maxAmount)));
    }

    // Payment Method Filter
    if (paymentMethod) {
      userExpenses = userExpenses.filter((e: any) => e.paymentMethod === String(paymentMethod));
    }

    // Sort by Date Descending
    userExpenses.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Join with Categories
    const responseExpenses = userExpenses.map((exp: any) => {
      const cat = db.categories.find((c: any) => c.id === exp.categoryId);
      return {
        ...exp,
        category: cat || { id: exp.categoryId, name: 'Others', icon: 'HelpCircle', color: '#6b7280' },
      };
    });

    res.json(responseExpenses);
  } catch (error) {
    res.status(500).json({ error: 'Error listing expenses' });
  }
});

// Update Expense
app.put('/api/expenses/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { amount, categoryId, description, date, paymentMethod } = req.body;

    const db = await readDB();
    const expIdx = db.expenses.findIndex((e: any) => e.id === id && e.userId === req.user.id);
    if (expIdx === -1) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (amount !== undefined) {
      const numAmt = parseFloat(amount);
      if (isNaN(numAmt) || numAmt <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }
      db.expenses[expIdx].amount = numAmt;
    }

    if (categoryId !== undefined) {
      const catExists = db.categories.some((c: any) => c.id === categoryId && (!c.isCustom || c.userId === req.user.id));
      if (!catExists) {
        return res.status(400).json({ error: 'Invalid category' });
      }
      db.expenses[expIdx].categoryId = categoryId;
    }

    if (description !== undefined) {
      db.expenses[expIdx].description = description;
    }

    if (date !== undefined) {
      db.expenses[expIdx].date = date;
    }

    if (paymentMethod !== undefined) {
      db.expenses[expIdx].paymentMethod = paymentMethod;
    }

    await writeDB(db);
    res.json({ message: 'Expense updated successfully', expense: db.expenses[expIdx] });
  } catch (error) {
    res.status(500).json({ error: 'Error updating expense' });
  }
});

// Delete Expense
app.delete('/api/expenses/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const db = await readDB();

    const expIdx = db.expenses.findIndex((e: any) => e.id === id && e.userId === req.user.id);
    if (expIdx === -1) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    db.expenses.splice(expIdx, 1);
    await writeDB(db);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting expense' });
  }
});


// ==========================================
// ANALYTICAL & DASHBOARD APIS
// ==========================================

app.get('/api/dashboard', authenticateToken, async (req: any, res: any) => {
  try {
    const db = await readDB();
    const userExpenses = db.expenses.filter((e: any) => e.userId === req.user.id);

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthPrefix = new Date().toISOString().substring(0, 7); // "YYYY-MM"

    let totalExpenses = 0;
    let monthlyExpenses = 0;
    let todayExpenses = 0;

    userExpenses.forEach((exp: any) => {
      totalExpenses += exp.amount;
      if (exp.date.startsWith(currentMonthPrefix)) {
        monthlyExpenses += exp.amount;
      }
      if (exp.date === todayStr) {
        todayExpenses += exp.amount;
      }
    });

    // Recent Transactions (top 5 with Category)
    userExpenses.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentTransactions = userExpenses.slice(0, 5).map((exp: any) => {
      const cat = db.categories.find((c: any) => c.id === exp.categoryId);
      return {
        ...exp,
        category: cat || { id: exp.categoryId, name: 'Others', icon: 'HelpCircle', color: '#6b7280' },
      };
    });

    // Category Distribution (last 30 days)
    const categoryTotals: Record<string, number> = {};
    userExpenses.forEach((exp: any) => {
      categoryTotals[exp.categoryId] = (categoryTotals[exp.categoryId] || 0) + exp.amount;
    });

    const categoryDistribution = Object.keys(categoryTotals).map((catId) => {
      const cat = db.categories.find((c: any) => c.id === catId) || { name: 'Others', color: '#6b7280' };
      const amount = categoryTotals[catId];
      return {
        categoryId: catId,
        categoryName: cat.name,
        amount,
        percentage: totalExpenses > 0 ? parseFloat(((amount / totalExpenses) * 100).toFixed(1)) : 0,
        color: cat.color,
      };
    }).sort((a, b) => b.amount - a.amount);

    // Monthly Trend (Last 6 Months)
    const monthlyMap: Record<string, number> = {};
    // Seed last 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mLabel = d.toISOString().substring(0, 7); // "YYYY-MM"
      monthlyMap[mLabel] = 0;
    }

    userExpenses.forEach((exp: any) => {
      const mLabel = exp.date.substring(0, 7);
      if (monthlyMap[mLabel] !== undefined) {
        monthlyMap[mLabel] += exp.amount;
      }
    });

    const monthlyTrend = Object.keys(monthlyMap).map((month) => {
      // Format to readable label like "Jan 2026"
      const [year, mNum] = month.split('-');
      const mName = new Date(parseInt(year), parseInt(mNum) - 1).toLocaleString('default', { month: 'short' });
      return {
        month: `${mName} ${year}`,
        amount: parseFloat(monthlyMap[month].toFixed(2)),
      };
    });

    res.json({
      welcomeMessage: `Welcome back, ${req.user.name}!`,
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      monthlyExpenses: parseFloat(monthlyExpenses.toFixed(2)),
      todayExpenses: parseFloat(todayExpenses.toFixed(2)),
      expenseCount: userExpenses.length,
      recentTransactions,
      monthlyTrend,
      categoryDistribution,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error preparing dashboard analytics' });
  }
});

// Reports summary API
app.get('/api/reports', authenticateToken, async (req: any, res: any) => {
  try {
    const db = await readDB();
    const userExpenses = db.expenses.filter((e: any) => e.userId === req.user.id);

    let totalSpending = 0;
    const monthlyMap: Record<string, { amount: number; count: number }> = {};
    const categoryMap: Record<string, { amount: number; count: number }> = {};
    const yearlyMap: Record<string, number> = {};

    userExpenses.forEach((exp: any) => {
      totalSpending += exp.amount;

      // Monthly
      const mLabel = exp.date.substring(0, 7); // "YYYY-MM"
      if (!monthlyMap[mLabel]) {
        monthlyMap[mLabel] = { amount: 0, count: 0 };
      }
      monthlyMap[mLabel].amount += exp.amount;
      monthlyMap[mLabel].count += 1;

      // Category
      const catId = exp.categoryId;
      if (!categoryMap[catId]) {
        categoryMap[catId] = { amount: 0, count: 0 };
      }
      categoryMap[catId].amount += exp.amount;
      categoryMap[catId].count += 1;

      // Yearly
      const yLabel = exp.date.substring(0, 4); // "YYYY"
      yearlyMap[yLabel] = (yearlyMap[yLabel] || 0) + exp.amount;
    });

    const monthlySummary = Object.keys(monthlyMap).map((month) => {
      const [year, mNum] = month.split('-');
      const mName = new Date(parseInt(year), parseInt(mNum) - 1).toLocaleString('default', { month: 'short' });
      return {
        month: `${mName} ${year}`,
        amount: parseFloat(monthlyMap[month].amount.toFixed(2)),
        count: monthlyMap[month].count,
      };
    }).sort((a, b) => b.month.localeCompare(a.month));

    const categorySummary = Object.keys(categoryMap).map((catId) => {
      const cat = db.categories.find((c: any) => c.id === catId) || { name: 'Others', color: '#6b7280' };
      return {
        categoryId: catId,
        categoryName: cat.name,
        amount: parseFloat(categoryMap[catId].amount.toFixed(2)),
        count: categoryMap[catId].count,
        color: cat.color,
      };
    }).sort((a, b) => b.amount - a.amount);

    const yearlySummary = Object.keys(yearlyMap).map((year) => ({
      year,
      amount: parseFloat(yearlyMap[year].toFixed(2)),
    })).sort((a, b) => b.year.localeCompare(a.year));

    res.json({
      totalSpending: parseFloat(totalSpending.toFixed(2)),
      monthlySummary,
      categorySummary,
      yearlySummary,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error generating reports summary' });
  }
});


// ==========================================
// VITE CLIENT DEV SERVER / PRODUCTION SERVING
// ==========================================

async function startServer() {
  await initDB();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
