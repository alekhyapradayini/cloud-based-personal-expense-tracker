/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Search, Filter, DollarSign, Calendar, Trash2, Edit2, Info,
  Download, HelpCircle, UserCheck, Lock, Mail, Check, Loader2,
  AlertCircle, LayoutDashboard, CreditCard, Tags, BarChart3, User,
  TrendingUp, Terminal, Cloud, ShieldCheck, Database, RefreshCw, KeyRound, CheckCircle2,
  X, ChevronRight
} from 'lucide-react';
import * as Icons from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { TrendChart, CategoryChart } from './components/Charts';
import {
  AddEditExpenseModal, CustomCategoryModal, ViewExpenseModal,
  DeleteConfirmModal, AwsDevOpsModal, Toast
} from './components/Modals';
import { Category, Expense, DashboardSummary, ReportSummary, User as UserType } from './types';

// Dynamic category icon helper
export const getCategoryIcon = (iconName: string, color?: string) => {
  const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
  return <IconComponent className="w-4 h-4" style={{ color }} />;
};

export default function App() {
  // Authentication states
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<UserType | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot-password'>('login');
  
  // Auth Form inputs
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Application Shell states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  
  // Modals & Panels visibility
  const [isAwsDevOpsOpen, setIsAwsDevOpsOpen] = useState(false);
  const [isAddEditExpenseOpen, setIsAddEditExpenseOpen] = useState(false);
  const [isCustomCategoryOpen, setIsCustomCategoryOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isViewExpenseOpen, setIsViewExpenseOpen] = useState(false);

  // Focus entity states
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<(Expense & { category?: Category }) | null>(null);

  // Main operational states
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<(Expense & { category?: Category })[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  
  // Filters & Searching
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Profile Edit inputs
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Feedback Toasts
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [serverOnline, setServerOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Set default relative baseURL for axios requests
  axios.defaults.baseURL = '';

  // Intercept authentication responses & attach tokens
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      fetchUserData();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  // Load backend content on component mount or tab shift
  useEffect(() => {
    if (token && user) {
      fetchCategories();
      fetchExpenses();
      if (activeTab === 'dashboard') fetchDashboardData();
      if (activeTab === 'reports') fetchReportData();
    }
  }, [token, user, activeTab]);

  // Network synchronization routines
  const fetchUserData = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data);
      setProfileName(res.data.name);
      setProfileEmail(res.data.email);
      setServerOnline(true);
    } catch (err) {
      console.error('Error verifying JWT session', err);
      // If unauthorized, wipe token
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        handleLogout();
      } else {
        setServerOnline(false);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories', err);
    }
  };

  const fetchExpenses = async () => {
    try {
      // Formulate query params
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (filterCategory) params.categoryId = filterCategory;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (filterMinAmount) params.minAmount = filterMinAmount;
      if (filterMaxAmount) params.maxAmount = filterMaxAmount;
      if (filterPaymentMethod) params.paymentMethod = filterPaymentMethod;

      const res = await axios.get('/api/expenses', { params });
      setExpenses(res.data);
    } catch (err) {
      console.error('Error fetching expenses', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/dashboard');
      setDashboardSummary(res.data);
    } catch (err) {
      console.error('Error building dashboard summary', err);
    }
  };

  const fetchReportData = async () => {
    try {
      const res = await axios.get('/api/reports');
      setReportSummary(res.data);
    } catch (err) {
      console.error('Error fetching reports summary', err);
    }
  };

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword) {
      setAuthError('Please fill in all email and password fields');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await axios.post('/api/auth/login', {
        email: authEmail,
        password: authPassword
      });
      setToken(res.data.token);
      showToast('Logged in successfully', 'success');
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Invalid credentials or connection failure');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authName || !authEmail || !authPassword) {
      setAuthError('Please fill in all registration fields');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await axios.post('/api/auth/register', {
        name: authName,
        email: authEmail,
        password: authPassword
      });
      setToken(res.data.token);
      showToast('Registered account successfully!', 'success');
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Server registration failure');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSimulateForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) {
      setAuthError('Please enter a recovery email address');
      return;
    }
    setAuthLoading(true);
    setTimeout(() => {
      setRecoverySuccess(true);
      setAuthLoading(false);
      setAuthError('');
    }, 1200);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setActiveTab('dashboard');
    showToast('Securely logged out from AWS sandbox session', 'info');
  };

  // Expense CRUD Operations
  const handleSaveExpense = async (data: any) => {
    try {
      if (selectedExpense) {
        // Edit Mode
        await axios.put(`/api/expenses/${selectedExpense.id}`, data);
        showToast('Expense record updated successfully', 'success');
      } else {
        // Create Mode
        await axios.post('/api/expenses', data);
        showToast('Expense recorded successfully', 'success');
      }
      setIsAddEditExpenseOpen(false);
      setSelectedExpense(null);
      refreshData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save expense', 'error');
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    try {
      await axios.delete(`/api/expenses/${selectedExpense.id}`);
      showToast('Expense record permanently deleted from RDS', 'success');
      setIsDeleteConfirmOpen(false);
      setSelectedExpense(null);
      refreshData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete expense', 'error');
    }
  };

  // Category Creation Operation
  const handleCreateCategory = async (data: any) => {
    try {
      await axios.post('/api/categories', data);
      showToast(`Custom category "${data.name}" provisioned`, 'success');
      setIsCustomCategoryOpen(false);
      fetchCategories();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create category', 'error');
    }
  };

  // Profile Customizations
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileLoading(true);
    try {
      const res = await axios.put('/api/auth/profile', {
        name: profileName,
        email: profileEmail,
      });
      setUser(res.data.user);
      setProfileMessage({ text: 'AWS profile details updated successfully', type: 'success' });
    } catch (err: any) {
      setProfileMessage({ text: err.response?.data?.error || 'Profile update failed', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    if (!currentPassword || !newPassword) {
      setProfileMessage({ text: 'Current and new password are required', type: 'error' });
      return;
    }
    setProfileLoading(true);
    try {
      await axios.put('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setProfileMessage({ text: 'Password modified successfully', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setProfileMessage({ text: err.response?.data?.error || 'Password update failed', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Data helpers
  const refreshData = () => {
    setRefreshing(true);
    fetchCategories();
    fetchExpenses();
    fetchDashboardData();
    fetchReportData();
    setTimeout(() => setRefreshing(false), 800);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  // Trigger search with filters
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExpenses();
    showToast('Search filters synchronized', 'success');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterMinAmount('');
    setFilterMaxAmount('');
    setFilterPaymentMethod('');
    setTimeout(() => {
      axios.get('/api/expenses').then((res) => {
        setExpenses(res.data);
        showToast('All filters cleared', 'info');
      });
    }, 50);
  };

  // Compile CSV Client-Side and Download
  const triggerCsvDownload = () => {
    if (expenses.length === 0) {
      showToast('No transaction nodes found to compile', 'error');
      return;
    }

    const headers = ['Record ID', 'Owner ID', 'Amount (INR)', 'Category', 'Description', 'Date', 'Payment Method', 'Created On'];
    const rows = expenses.map((exp) => [
      exp.id,
      exp.userId,
      exp.amount.toFixed(2),
      exp.category?.name || 'Others',
      exp.description || 'N/A',
      exp.date,
      exp.paymentMethod,
      exp.createdAt,
    ]);

    // Format content with comma separations and quotes
    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AWS_FinOps_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV compilation complete! Report downloaded.', 'success');
  };

  // Render Login Layout if Unauthenticated
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        {/* Branding Sidebar Hero */}
        <div className="md:w-5/12 bg-slate-900 text-white p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20" />

          <div className="z-10">
            <div className="flex items-center space-x-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                <Cloud className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight font-sans">FinAWS Portal</span>
            </div>

            <div className="space-y-6 max-w-sm">
              <h1 className="text-3xl font-extrabold tracking-tight font-sans text-white">
                Personal Expense Tracker via AWS & DevOps
              </h1>
              <p className="text-gray-400 text-xs font-sans leading-relaxed">
                Experience high-performance cloud expense tracking. Seamlessly manage budgets, generate visual spending summaries, and track transactions securely on AWS Cloud.
              </p>
            </div>
          </div>

          <div className="z-10 pt-10 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3 font-mono">
              Certified Cloud Platform Stack
            </h4>
            <div className="grid grid-cols-2 gap-4 text-[11px] text-gray-400 font-sans">
              <div className="flex items-center space-x-2">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>AWS RDS MySQL</span>
              </div>
              <div className="flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>Docker & EKS</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>JWT Encryption</span>
              </div>
              <div className="flex items-center space-x-2">
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                <span>FinOps CloudWatch</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel Panel */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white md:bg-slate-50">
          <div className="max-w-md w-full bg-white p-8 md:rounded-2xl md:border md:border-gray-100 md:shadow-xl transition-all">
            {authView === 'login' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 font-sans tracking-tight">Secure Account Sign In</h2>
                  <p className="text-xs text-gray-400 font-sans mt-1">Provide your credentials to access your Expense Tracker</p>
                </div>

                {authError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-sans font-semibold">{authError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-sans font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700 font-sans">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthView('forgot-password');
                          setAuthError('');
                        }}
                        className="text-xs text-blue-600 hover:underline font-sans font-semibold"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-sans font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-sans font-bold text-xs rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center space-x-2"
                  >
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    <span>{authLoading ? 'Verifying Credentials...' : 'Secure Sign In'}</span>
                  </button>
                </form>

                <div className="text-center text-xs text-gray-400 font-sans pt-2">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setAuthView('register');
                      setAuthError('');
                    }}
                    className="text-blue-600 hover:underline font-semibold font-sans"
                  >
                    Create an account
                  </button>
                </div>
              </div>
            )}

            {authView === 'register' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 font-sans tracking-tight">Create Account</h2>
                  <p className="text-xs text-gray-400 font-sans mt-1">Register a new account to start tracking your expenses</p>
                </div>

                {authError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-sans font-semibold">{authError}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">Full Name</label>
                    <input
                      type="text"
                      placeholder="Alexander Watson"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-sans font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="alexander@company.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-sans font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        placeholder="Minimum 8 characters"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-sans font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-sans font-bold text-xs rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center space-x-2"
                  >
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>{authLoading ? 'Creating Account...' : 'Sign Up'}</span>
                  </button>
                </form>

                <div className="text-center text-xs text-gray-400 font-sans pt-2">
                  Already registered?{' '}
                  <button
                    onClick={() => {
                      setAuthView('login');
                      setAuthError('');
                    }}
                    className="text-blue-600 hover:underline font-semibold font-sans"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            )}

            {authView === 'forgot-password' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 font-sans tracking-tight">Reset Password</h2>
                  <p className="text-xs text-gray-400 font-sans mt-1">Reset your password via email link simulation</p>
                </div>

                {recoverySuccess ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl space-y-1.5">
                      <div className="flex items-center space-x-2 font-bold font-sans">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Email Sent Successfully</span>
                      </div>
                      <p className="font-sans font-medium leading-relaxed">
                        A simulated password reset link has been successfully generated and sent to <span className="font-bold">{recoveryEmail}</span>.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setAuthView('login');
                        setRecoverySuccess(false);
                        setRecoveryEmail('');
                      }}
                      className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-sans font-bold border border-gray-200 transition-all"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSimulateForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">Registered Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          placeholder="name@company.com"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-sans font-medium"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
                    >
                      {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      <span>{authLoading ? 'Sending...' : 'Send Reset Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthView('login');
                        setAuthError('');
                      }}
                      className="text-xs text-gray-500 hover:text-gray-800 font-sans font-semibold text-center"
                    >
                      Back to Sign In
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Operational Application Shell
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar Panel */}
      <div className={`hidden md:block z-20`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Sidebar overlay drawer */}
      {sidebarMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={() => setSidebarMobileOpen(false)} />
          <div className="relative z-50 bg-white w-64 shadow-xl flex flex-col justify-between animate-in slide-in-from-left duration-200">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setSidebarMobileOpen(false);
              }}
              user={user}
              onLogout={handleLogout}
              collapsed={false}
              setCollapsed={() => {}}
            />
            <button
              onClick={() => setSidebarMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Core Shell Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          user={user}
          activeTab={activeTab}
          setSidebarOpen={() => setSidebarMobileOpen(true)}
          onShowAwsDevOps={() => setIsAwsDevOpsOpen(true)}
        />

        {/* Server Disconnected Banner */}
        {!serverOnline && (
          <div className="bg-amber-500 text-white text-xs font-semibold px-6 py-2.5 flex items-center justify-between shadow-inner">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Syncing latency detected. Reconnecting to secure cloud server...</span>
            </div>
            <button
              onClick={fetchUserData}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-[10px] font-bold"
            >
              Retry Sync
            </button>
          </div>
        )}

        {/* Primary Screen Area */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
          
          {/* Quick Stats Summary Strip (Dashboard & Reports tab only) */}
          {['dashboard', 'reports'].includes(activeTab) && dashboardSummary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all">
                <span className="text-[10px] uppercase font-bold text-gray-400 font-sans tracking-wide block">Total Balance Spent</span>
                <h3 className="text-xl font-black text-gray-900 font-sans mt-1.5">
                  ₹{dashboardSummary.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <span className="text-[9px] bg-blue-50 border border-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full mt-2 inline-block font-sans">
                  Cloud Secured
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all">
                <span className="text-[10px] uppercase font-bold text-gray-400 font-sans tracking-wide block">This Month's Spend</span>
                <h3 className="text-xl font-black text-gray-900 font-sans mt-1.5">
                  ₹{dashboardSummary.monthlyExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold px-1.5 py-0.5 rounded-full mt-2 inline-block font-sans">
                  Current Month
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all">
                <span className="text-[10px] uppercase font-bold text-gray-400 font-sans tracking-wide block">Today's Transactions</span>
                <h3 className="text-xl font-black text-gray-900 font-sans mt-1.5">
                  ₹{dashboardSummary.todayExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <span className="text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold px-1.5 py-0.5 rounded-full mt-2 inline-block font-sans">
                  Realtime Sync
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all">
                <span className="text-[10px] uppercase font-bold text-gray-400 font-sans tracking-wide block">Total Expenses</span>
                <h3 className="text-xl font-black text-gray-900 font-sans mt-1.5">
                  {dashboardSummary.expenseCount} items
                </h3>
                <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded-full mt-2 inline-block font-sans">
                  Cloud Synced
                </span>
              </div>
            </div>
          )}

          {/* ==================================================
              TAB: DASHBOARD OVERVIEW
              ================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Alert Card */}
              <div className="bg-blue-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-blue-200 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12" />
                <div className="relative z-10 max-w-lg space-y-2">
                  <h2 className="text-xl font-extrabold font-sans tracking-tight">
                    {dashboardSummary?.welcomeMessage || `Welcome, ${user.name}!`}
                  </h2>
                  <p className="text-blue-100 text-xs font-sans leading-relaxed">
                    Your expenses are securely saved and backed up. Manage your budget, log daily expenditures, and track analytical trends with ease.
                  </p>
                </div>
                <div className="relative z-10 mt-4 md:mt-0 flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedExpense(null);
                      setIsAddEditExpenseOpen(true);
                    }}
                    className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold font-sans rounded-xl shadow-md cursor-pointer transition-all flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Expense</span>
                  </button>
                  <button
                    onClick={refreshData}
                    className={`p-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl transition-all ${refreshing ? 'animate-spin' : ''}`}
                    title="Sync with Cloud"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Analytical Charts Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Spend Monthly Line Trend */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 font-sans flex items-center space-x-1.5">
                      <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
                      <span>Monthly Spend Trajectory</span>
                    </h3>
                    <p className="text-[10px] text-gray-400 font-sans">Trajectory values recorded across trailing 6 months</p>
                  </div>
                  <div className="mt-6 flex-1 flex items-center">
                    {dashboardSummary?.monthlyTrend ? (
                      <TrendChart data={dashboardSummary.monthlyTrend} />
                    ) : (
                      <div className="flex-1 flex items-center justify-center h-48 text-gray-400 text-xs">Compiling trend analytics...</div>
                    )}
                  </div>
                </div>

                {/* Category Donut Allocation */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 font-sans flex items-center space-x-1.5">
                      <Tags className="w-4.5 h-4.5 text-blue-600" />
                      <span>Budget Allocations</span>
                    </h3>
                    <p className="text-[10px] text-gray-400 font-sans">Percentage distribution categorized by core filters</p>
                  </div>
                  <div className="mt-6">
                    {dashboardSummary?.categoryDistribution ? (
                      <CategoryChart data={dashboardSummary.categoryDistribution} />
                    ) : (
                      <div className="flex items-center justify-center h-48 text-gray-400 text-xs">Awaiting allocations data...</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Transaction Log lists */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 font-sans">Recent Expenses</h3>
                    <p className="text-[10px] text-gray-400 font-sans">A list of your five most recently recorded expenses</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className="text-xs text-blue-600 hover:underline font-bold font-sans flex items-center space-x-1"
                  >
                    <span>View all expenses</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {expenses.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-xs font-sans">
                    <p>No transactions logged yet.</p>
                    <button
                      onClick={() => setIsAddEditExpenseOpen(true)}
                      className="text-blue-600 hover:underline mt-2 font-bold block mx-auto"
                    >
                      Add your first expense
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                          <th className="p-4 font-sans">Expense Details</th>
                          <th className="p-4 font-sans">Date</th>
                          <th className="p-4 font-sans">Payment Method</th>
                          <th className="p-4 font-sans">Amount</th>
                          <th className="p-4 text-right font-sans">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {expenses.slice(0, 5).map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50/50 transition-all font-sans">
                            <td className="p-4 flex items-center space-x-3.5">
                              <div
                                className="w-8.5 h-8.5 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${exp.category?.color || '#3b82f6'}15` }}
                              >
                                {getCategoryIcon(exp.category?.icon || 'HelpCircle', exp.category?.color)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-gray-800 truncate max-w-[200px]">
                                  {exp.description || `${exp.category?.name || 'Other'} Expense`}
                                </h4>
                                <span className="text-[10px] text-gray-400 font-mono">Category: {exp.category?.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-gray-600">{exp.date}</td>
                            <td className="p-4">
                              <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-semibold text-gray-600">
                                {exp.paymentMethod}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-gray-900">₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="p-4 text-right space-x-1">
                              <button
                                onClick={() => {
                                  setViewingExpense(exp);
                                  setIsViewExpenseOpen(true);
                                }}
                                className="px-2.5 py-1.5 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 transition-all"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedExpense(exp);
                                  setIsAddEditExpenseOpen(true);
                                }}
                                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-all inline-block"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedExpense(exp);
                                  setIsDeleteConfirmOpen(true);
                                }}
                                className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all inline-block"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================
              TAB: EXPENSE MANAGEMENT
              ================================================== */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              {/* Search, Action Filter Bar */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search expense descriptions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-sans font-medium"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                      className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold font-sans transition-all flex items-center space-x-1.5 cursor-pointer ${
                        showFiltersPanel
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>{showFiltersPanel ? 'Hide Filters' : 'Show Filters'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedExpense(null);
                        setIsAddEditExpenseOpen(true);
                      }}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-sans shadow-md shadow-blue-200 transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Expense</span>
                    </button>
                  </div>
                </div>

                {/* Extended Multi-Filters Drawer */}
                {showFiltersPanel && (
                  <form onSubmit={handleApplyFilters} className="bg-slate-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase font-sans mb-1.5">Category Filter</label>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase font-sans mb-1.5">Payment Method</label>
                      <select
                        value={filterPaymentMethod}
                        onChange={(e) => setFilterPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      >
                        <option value="">All Methods</option>
                        <option value="UPI/Bank Transfer">UPI/Bank Transfer</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Cash">Cash</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase font-sans mb-1.5">Start Date</label>
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase font-sans mb-1.5">End Date</label>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase font-sans mb-1.5">Min Spend (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 500"
                        value={filterMinAmount}
                        onChange={(e) => setFilterMinAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase font-sans mb-1.5">Max Spend (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 10000"
                        value={filterMaxAmount}
                        onChange={(e) => setFilterMaxAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-end justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold font-sans"
                      >
                        Reset All
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-sans shadow-sm"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Expense Logs table list container */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 font-sans">All Expenses ({expenses.length} items)</h3>
                  <button
                    onClick={triggerCsvDownload}
                    className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl text-xs font-bold font-sans flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Ledger</span>
                  </button>
                </div>

                {expenses.length === 0 ? (
                  <div className="p-16 text-center space-y-3 font-sans text-gray-400">
                    <p className="text-xs">No transactions align with the specified search filters.</p>
                    <button
                      onClick={handleClearFilters}
                      className="px-4 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold rounded-lg"
                    >
                      Reset Filter Criteria
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                          <th className="p-4 font-sans">Expense Details</th>
                          <th className="p-4 font-sans">Date</th>
                          <th className="p-4 font-sans">Payment Method</th>
                          <th className="p-4 font-sans font-medium">Expense ID</th>
                          <th className="p-4 font-sans">Amount (INR)</th>
                          <th className="p-4 text-right font-sans">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {expenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50/50 transition-all font-sans">
                            <td className="p-4 flex items-center space-x-3.5">
                              <div
                                className="w-8.5 h-8.5 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${exp.category?.color || '#3b82f6'}15` }}
                              >
                                {getCategoryIcon(exp.category?.icon || 'HelpCircle', exp.category?.color)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-gray-800 truncate max-w-[200px]">
                                  {exp.description || `${exp.category?.name || 'Other'} Expense`}
                                </h4>
                                <span className="text-[10px] text-gray-400 font-mono">Category: {exp.category?.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-gray-600">{exp.date}</td>
                            <td className="p-4">
                              <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-semibold text-gray-600">
                                {exp.paymentMethod}
                              </span>
                            </td>
                            <td className="p-4 text-gray-400 font-mono">{exp.id}</td>
                            <td className="p-4 font-bold text-gray-900">₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="p-4 text-right space-x-1">
                              <button
                                onClick={() => {
                                  setViewingExpense(exp);
                                  setIsViewExpenseOpen(true);
                                }}
                                className="px-2.5 py-1.5 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 transition-all"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedExpense(exp);
                                  setIsAddEditExpenseOpen(true);
                                }}
                                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-all inline-block"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedExpense(exp);
                                  setIsDeleteConfirmOpen(true);
                                }}
                                className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all inline-block"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================
              TAB: CATEGORY MANAGER
              ================================================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Category Header */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 font-sans">Active Budget Classifications</h3>
                  <p className="text-xs text-gray-500 font-sans mt-0.5">
                    Categorize transaction nodes to run clean, automated analytics logs. Default labels are Multi-AZ compliant.
                  </p>
                </div>
                <button
                  onClick={() => setIsCustomCategoryOpen(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-sans shadow-md shadow-blue-200 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Category</span>
                </button>
              </div>

              {/* Categories Grid layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const catExpenses = expenses.filter((e) => e.categoryId === cat.id);
                  const totalSum = catExpenses.reduce((sum, e) => sum + e.amount, 0);

                  return (
                    <div
                      key={cat.id}
                      className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-40"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${cat.color}15` }}
                          >
                            {getCategoryIcon(cat.icon, cat.color)}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm font-sans">{cat.name}</h4>
                            <span className="text-[9px] font-mono font-medium text-gray-400">
                              ID: {cat.id}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase font-sans ${
                            cat.isCustom ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {cat.isCustom ? 'Custom' : 'Standard'}
                        </span>
                      </div>

                      <div className="pt-4 border-t border-gray-50 flex items-baseline justify-between">
                        <span className="text-[10px] text-gray-400 font-sans">Total spent</span>
                        <div className="text-right">
                          <span className="text-base font-black text-gray-950 font-sans">
                            ₹{totalSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <p className="text-[9px] text-gray-500 font-sans">across {catExpenses.length} transactions</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================
              TAB: REPORTS & SUMMARY
              ================================================== */}
          {activeTab === 'reports' && reportSummary && (
            <div className="space-y-6">
              {/* Report Hero */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 font-sans">Compiled Analytical Summaries</h3>
                  <p className="text-xs text-gray-500 font-sans mt-0.5">
                    Consolidated financial balances generated across billing parameters
                  </p>
                </div>
                <button
                  onClick={triggerCsvDownload}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-sans shadow-md shadow-blue-200 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Report</span>
                </button>
              </div>

              {/* Monthly breakdown table list */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Monthly summary ledger */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="p-4.5 bg-slate-50 border-b border-gray-100">
                    <h4 className="text-xs font-bold text-gray-800 font-sans">Monthly Ledger Breakdown</h4>
                  </div>
                  {reportSummary.monthlySummary.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs font-sans">No monthly history compiled.</div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/50 text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                          <th className="p-3.5 font-sans">Month</th>
                          <th className="p-3.5 font-sans">Total Expenses</th>
                          <th className="p-3.5 font-sans text-right">Sum (INR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportSummary.monthlySummary.map((m) => (
                          <tr key={m.month} className="hover:bg-slate-50/50 transition-all font-sans">
                            <td className="p-3.5 font-semibold text-gray-800">{m.month}</td>
                            <td className="p-3.5 text-gray-500 font-sans">{m.count} expenses</td>
                            <td className="p-3.5 text-right font-bold text-slate-900">₹{m.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Categories allocation breakdown list */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="p-4.5 bg-slate-50 border-b border-gray-100">
                    <h4 className="text-xs font-bold text-gray-800 font-sans">Category Allocations Breakdown</h4>
                  </div>
                  {reportSummary.categorySummary.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs font-sans">No categorization summary compiled.</div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/50 text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                          <th className="p-3.5 font-sans">Classification</th>
                          <th className="p-3.5 font-sans">Total Expenses</th>
                          <th className="p-3.5 font-sans text-right">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportSummary.categorySummary.map((c) => (
                          <tr key={c.categoryId} className="hover:bg-slate-50/50 transition-all font-sans">
                            <td className="p-3.5 flex items-center space-x-2.5">
                              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                              <span className="font-semibold text-gray-800">{c.categoryName}</span>
                            </td>
                            <td className="p-3.5 text-gray-500 font-sans">{c.count} expenses</td>
                            <td className="p-3.5 text-right font-bold text-slate-900">₹{c.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Yearly Summary Ledger block */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden max-w-md">
                <div className="p-4.5 bg-slate-50 border-b border-gray-100">
                  <h4 className="text-xs font-bold text-gray-800 font-sans">Yearly Breakdown</h4>
                </div>
                {reportSummary.yearlySummary.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-xs font-sans">No yearly history compiled.</div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 text-gray-500 font-semibold border-b border-gray-100">
                      <tr>
                        <th className="p-3.5 font-sans">Year</th>
                        <th className="p-3.5 font-sans text-right">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportSummary.yearlySummary.map((y) => (
                        <tr key={y.year} className="hover:bg-slate-50/50 transition-all font-sans">
                          <td className="p-3.5 font-semibold text-gray-800">{y.year}</td>
                          <td className="p-3.5 text-right font-bold text-blue-600">₹{y.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ==================================================
              TAB: MY PROFILE SETTINGS
              ================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Tab Header */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-sans">Profile Settings</h3>
                <p className="text-xs text-gray-500 font-sans mt-0.5">
                  Update your personal details or change your password. Changes are securely saved to the database.
                </p>
              </div>

              {profileMessage && (
                <div className={`p-4 rounded-xl text-xs border flex items-center space-x-2 ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-red-50 border-red-100 text-red-800'
                }`}>
                  {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  <span className="font-sans font-semibold">{profileMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Profile card metadata info */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 border-2 border-blue-200 font-black flex items-center justify-center text-3xl mb-4 relative shadow-inner">
                    {user.name.substring(0, 2).toUpperCase()}
                    <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  
                  <h4 className="font-bold text-gray-900 font-sans text-sm">{user.name}</h4>
                  <p className="text-xs text-gray-400 font-sans mt-0.5">{user.email}</p>
                  
                  <div className="mt-5 w-full bg-slate-50 border border-gray-100 rounded-xl p-3 text-left space-y-2 text-[10px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cluster ID:</span>
                      <span className="text-gray-800 font-bold">aws-prod-77</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Database Engine:</span>
                      <span className="text-gray-800 font-bold">MySQL 8.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Role ARN:</span>
                      <span className="text-gray-800 font-bold truncate max-w-[140px]">arn:aws:iam::3902:role</span>
                    </div>
                  </div>
                </div>

                {/* Edit Form layouts */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Edit details form */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                    <h4 className="text-xs font-bold text-gray-900 uppercase font-sans border-b border-gray-100 pb-3 mb-4">
                      General Information
                    </h4>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">Full Name</label>
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-sans font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">Email Address</label>
                          <input
                            type="email"
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-sans font-medium"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        {profileLoading ? 'Updating...' : 'Update Details'}
                      </button>
                    </form>
                  </div>

                  {/* Edit password details form */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                    <h4 className="text-xs font-bold text-gray-900 uppercase font-sans border-b border-gray-100 pb-3 mb-4 flex items-center space-x-1">
                      <KeyRound className="w-4 h-4 text-gray-400" />
                      <span>Security Settings</span>
                    </h4>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">Current Password</label>
                          <input
                            type="password"
                            placeholder="••••••••••••"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-sans font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">New Password</label>
                          <input
                            type="password"
                            placeholder="••••••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-sans font-medium"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs rounded-xl shadow-md shadow-blue-200 transition-all cursor-pointer"
                      >
                        {profileLoading ? 'Updating...' : 'Change Password'}
                      </button>
                    </form>
                  </div>

                </div>
              </div>
            </div>
          )}

        </main>

        {/* Console Footing panel */}
        <footer className="bg-white border-t border-gray-200 py-4.5 px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 font-sans">
          <span>
            © 2026 FinAWS Console • Designed for AWS DevOps Final Submission Project
          </span>
          <div className="flex space-x-4 mt-2.5 sm:mt-0 font-medium">
            <span className="flex items-center space-x-1">
              <Cloud className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-gray-500">EC2 & RDS Secured</span>
            </span>
            <span className="flex items-center space-x-1">
              <Terminal className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-gray-500">K8s Orchestrated</span>
            </span>
          </div>
        </footer>
      </div>

      {/* ==================================================
          MODAL CONTEXT OVERLAYS
          ================================================== */}
      
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Add / Edit Expense overlay */}
      <AddEditExpenseModal
        isOpen={isAddEditExpenseOpen}
        onClose={() => {
          setIsAddEditExpenseOpen(false);
          setSelectedExpense(null);
        }}
        onSave={handleSaveExpense}
        categories={categories}
        expense={selectedExpense}
      />

      {/* Custom Category selector overlay */}
      <CustomCategoryModal
        isOpen={isCustomCategoryOpen}
        onClose={() => setIsCustomCategoryOpen(false)}
        onCreate={handleCreateCategory}
      />

      {/* View/Audit Expense modal */}
      <ViewExpenseModal
        isOpen={isViewExpenseOpen}
        onClose={() => {
          setViewingExpense(null);
          setIsViewExpenseOpen(false);
        }}
        expense={viewingExpense}
      />

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setSelectedExpense(null);
        }}
        onConfirm={handleDeleteExpense}
      />

      {/* AWS Architecture and DevOps Info Suite */}
      <AwsDevOpsModal
        isOpen={isAwsDevOpsOpen}
        onClose={() => setIsAwsDevOpsOpen(false)}
      />

    </div>
  );
}
