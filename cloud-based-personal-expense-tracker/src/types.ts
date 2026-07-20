/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom: boolean;
  userId?: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
  paymentMethod: string;
  createdAt: string;
}

export type PaymentMethod = 'Cash' | 'Credit Card' | 'Debit Card' | 'UPI/Bank Transfer' | 'Other';

export interface DashboardSummary {
  welcomeMessage: string;
  totalExpenses: number;
  monthlyExpenses: number;
  todayExpenses: number;
  expenseCount: number;
  recentTransactions: (Expense & { category?: Category })[];
  monthlyTrend: { month: string; amount: number }[];
  categoryDistribution: { categoryId: string; categoryName: string; amount: number; percentage: number; color: string }[];
}

export interface ReportSummary {
  totalSpending: number;
  monthlySummary: { month: string; amount: number; count: number }[];
  categorySummary: { categoryId: string; categoryName: string; amount: number; count: number; color: string }[];
  yearlySummary: { year: string; amount: number }[];
}
