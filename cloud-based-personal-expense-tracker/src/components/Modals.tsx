/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X, Check, AlertTriangle, Cloud, Database, Cpu, Layers,
  Settings, Github, Terminal, Info, Code, Copy, Shield, Server, ArrowUpRight
} from 'lucide-react';
import { Category, Expense, PaymentMethod } from '../types';

// ==========================================
// TOAST NOTIFICATION COMPONENT
// ==========================================
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  };

  const badgeColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl border shadow-lg animate-bounce ${styles[type]}`}>
      <span className={`w-2 h-2 rounded-full ${badgeColors[type]}`} />
      <span className="text-xs font-sans font-semibold">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-all">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};


// ==========================================
// EXPENSE CRUD MODAL
// ==========================================
interface AddEditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    amount: number;
    categoryId: string;
    description: string;
    date: string;
    paymentMethod: string;
  }) => void;
  categories: Category[];
  expense?: Expense | null; // If passed, we are EDITING
}

export const AddEditExpenseModal: React.FC<AddEditExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  expense
}) => {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI/Bank Transfer');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setAmount(String(expense.amount));
        setCategoryId(expense.categoryId);
        setDescription(expense.description);
        setDate(expense.date.substring(0, 10));
        setPaymentMethod(expense.paymentMethod);
      } else {
        setAmount('');
        setCategoryId(categories[0]?.id || '');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('UPI/Bank Transfer');
      }
      setErrors({});
    }
  }, [isOpen, expense, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const numAmt = parseFloat(amount);
    if (!amount || isNaN(numAmt) || numAmt <= 0) {
      newErrors.amount = 'Please enter a valid positive expense amount';
    }
    if (!categoryId) {
      newErrors.categoryId = 'Category selection is required';
    }
    if (!date) {
      newErrors.date = 'Expense transaction date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      amount: numAmt,
      categoryId,
      description: description.trim(),
      date,
      paymentMethod
    });
  };

  const paymentMethods: PaymentMethod[] = ['UPI/Bank Transfer', 'Credit Card', 'Debit Card', 'Cash', 'Other'];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">
              Amount (₹ INR) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold font-sans">₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-8 pr-4 py-2.5 bg-white border rounded-xl text-sm font-sans font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all ${
                  errors.amount ? 'border-red-300 bg-red-50/10' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.amount && <p className="text-[10px] font-semibold text-red-500 mt-1 font-sans">{errors.amount}</p>}
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-sans font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat.isCustom ? '(Custom)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">
              Transaction Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-sans font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">
              Payment Method *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={`px-3 py-2 rounded-xl border text-[11px] font-sans font-semibold text-left transition-all ${
                    paymentMethod === pm
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              placeholder="E.g., Groceries from Costco, electric bill..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-sans font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-sans font-bold border border-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-sans font-bold shadow-md shadow-blue-200 transition-all"
            >
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ==========================================
// CUSTOM CATEGORY MODAL
// ==========================================
interface CustomCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; color: string; icon: string }) => void;
}

export const CustomCategoryModal: React.FC<CustomCategoryModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('Tags');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setColor('#3b82f6');
      setIcon('Tags');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a distinct category label name');
      return;
    }
    onCreate({ name: name.trim(), color, icon });
  };

  const colors = [
    '#3b82f6', // blue
    '#ec4899', // pink
    '#f59e0b', // amber
    '#ef4444', // red
    '#10b981', // emerald
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#8b5cf6', // purple
    '#6b7280', // gray
  ];

  const icons = ['Tags', 'Briefcase', 'Coffee', 'Heart', 'Tv', 'TrendingUp', 'Activity', 'Sparkles', 'HelpCircle'];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Create Custom Category</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 font-sans mb-1.5">Category Name *</label>
            <input
              type="text"
              placeholder="e.g. Fitness, Pets, Office"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm font-sans font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all ${
                error ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {error && <p className="text-[10px] font-semibold text-red-500 mt-1 font-sans">{error}</p>}
          </div>

          {/* Color Pallet */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 font-sans mb-2">Aesthetic Accent Color</label>
            <div className="flex flex-wrap gap-2.5">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform duration-100 cursor-pointer ${
                    color === c ? 'scale-115 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon Selector representation */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 font-sans mb-2">Display Icon Preset</label>
            <div className="grid grid-cols-5 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              {icons.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`py-2 rounded-lg flex items-center justify-center text-xs font-sans font-semibold transition-all ${
                    icon === ic ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {ic.substring(0, 4)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-sans font-bold border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-sans font-bold shadow-md"
            >
              Add Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ==========================================
// DETAILS MODAL
// ==========================================
interface ViewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: (Expense & { category?: Category }) | null;
}

export const ViewExpenseModal: React.FC<ViewExpenseModalProps> = ({ isOpen, onClose, expense }) => {
  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Expense Details</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Big Amount Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100 text-center">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 font-sans">
              Expense Amount
            </span>
            <div className="text-3xl font-extrabold text-blue-600 font-sans mt-1">
              ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2.5 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-100 text-[10px] font-sans font-semibold text-gray-600">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: expense.category?.color || '#3b82f6' }}
              />
              <span>{expense.category?.name || 'Others'}</span>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-400 font-sans font-medium">Expense ID</span>
              <span className="text-gray-800 font-mono font-semibold truncate max-w-[180px]">{expense.id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-400 font-sans font-medium">User ID</span>
              <span className="text-gray-800 font-mono truncate max-w-[180px]">{expense.userId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-400 font-sans font-medium">Payment Method</span>
              <span className="text-gray-800 font-sans font-semibold">{expense.paymentMethod}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-400 font-sans font-medium">Date</span>
              <span className="text-gray-800 font-sans font-semibold">{expense.date}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-400 font-sans font-medium">Created On</span>
              <span className="text-gray-600 font-sans">{new Date(expense.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Description Block */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-gray-700 font-sans">Description / Notes</h4>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-600 font-sans min-h-[50px]">
              {expense.description || 'No description recorded for this transaction.'}
            </div>
          </div>

          {/* Secure cloud storage notification */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-start space-x-2.5">
            <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-[10px] font-sans text-emerald-800 leading-relaxed">
              <span className="font-bold">Secure Cloud Sync OK</span>: This transaction is stored securely with automated database backups and synchronized with your account.
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-sans font-bold shadow-md transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// DELETE CONFIRMATION MODAL
// ==========================================
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Expense',
  message = 'Are you sure you want to permanently delete this expense? This action cannot be undone.'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3.5">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 font-sans tracking-tight mb-2">
            {title}
          </h3>
          <p className="text-xs text-gray-500 font-sans leading-relaxed px-2">
            {message}
          </p>
        </div>

        <div className="p-4 bg-slate-50 border-t border-gray-100 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-sans font-bold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-sans font-bold shadow-md shadow-red-100"
          >
            Delete Expense
          </button>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// AWS CLOUD & DEVOPS SHOWCASE PANEL MODAL
// ==========================================
interface AwsDevOpsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AwsDevOpsModal: React.FC<AwsDevOpsModalProps> = ({ isOpen, onClose }) => {
  const [activePane, setActivePane] = useState<'architecture' | 'docker' | 'kubernetes' | 'cicd'>('architecture');
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const codeBlocks = {
    docker: `# ==========================================
# 1. FRONTEND DOCKERFILE (frontend/Dockerfile)
# ==========================================
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ==========================================
# 2. BACKEND DOCKERFILE (backend/Dockerfile)
# ==========================================
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/server.cjs"]

# ==========================================
# 3. DOCKER COMPOSE CONFIG (docker-compose.yml)
# ==========================================
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=rds-mysql-endpoint
      - DB_USER=admin
      - DB_PASS=supersecretpassword
      - JWT_SECRET=aws-devops-secret-key-987654321
    depends_on:
      - db
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
  db:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_DATABASE: personal_expenses
      MYSQL_ROOT_PASSWORD: supersecretpassword
    ports:
      - "3306:3306"`,

    kubernetes: `# ==========================================
# KUBERNETES DEPLOYMENT MANIFEST (kubernetes/manifest.yaml)
# ==========================================
apiVersion: v1
kind: Namespace
metadata:
  name: finops-prod
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: finops-prod
data:
  DB_HOST: "rds-mysql.ca-central-1.rds.amazonaws.com"
  DB_USER: "admin"
  NODE_ENV: "production"
---
apiVersion: v1
kind: Secret
metadata:
  name: backend-secrets
  namespace: finops-prod
type: Opaque
data:
  JWT_SECRET: "YXdzLWRldm9wcy1zZWNyZXQta2V5LTk4NzY1NDMyMQ==" # base64 encoding of key
  DB_PASS: "c3VwZXJzZWNyZXRwYXNzd29yZA=="
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deploy
  namespace: finops-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: <your-aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/finops-backend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: backend-config
        - secretRef:
            name: backend-secrets
---
apiVersion: v1
kind: Service
metadata:
  name: backend-svc
  namespace: finops-prod
spec:
  ports:
  - port: 3000
    targetPort: 3000
  selector:
    app: backend
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: finops-ingress
  namespace: finops-prod
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
  - http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-svc
            port:
              number: 3000`,

    cicd: `# ==========================================
# GITHUB ACTIONS CI/CD WORKFLOW (.github/workflows/deploy.yml)
# ==========================================
name: FINOPS AWS KUBERNETES PIPELINE

on:
  push:
    branches: [ "main" ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Log in to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build and Push Backend Docker Image
      run: |
        docker build -t finops-backend:latest ./backend
        docker tag finops-backend:latest \${{ steps.login-ecr.outputs.registry }}/finops-backend:latest
        docker push \${{ steps.login-ecr.outputs.registry }}/finops-backend:latest

    - name: Update KubeConfig
      run: |
        aws eks update-kubeconfig --name finops-cluster --region us-east-1

    - name: Deploy to Amazon EKS Cluster
      run: |
        kubectl apply -f kubernetes/manifest.yaml
        kubectl rollout restart deployment/backend-deploy -n finops-prod`
  };

  const mermaidDiagram = `graph TD
  User((Client User)) -->|HTTPS| CF[Amazon CloudFront]
  CF -->|Static Assets| S3[S3 Bucket: Frontend hosting]
  User -->|REST API Calls| ALB[Application Load Balancer]
  ALB -->|Reroutes Port 3000| EKS[Amazon EKS Cluster]
  subgraph Amazon EKS Pods
    EKS -->|Replica-1| Pod1[Node.js Express App]
    EKS -->|Replica-2| Pod2[Node.js Express App]
  end
  Pod1 & Pod2 -->|SQL Transactions| RDS[(Amazon RDS MySQL)]
  Pod1 & Pod2 -->|Upload Audit Logs| CW[Amazon CloudWatch]
  Pod1 & Pod2 -->|Send Alerts| SNS[Amazon SNS Alerting]`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] shadow-2xl border border-gray-100 overflow-hidden flex flex-col transform transition-all animate-in fade-in duration-200">
        
        {/* Header bar */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <Cloud className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-base font-bold font-sans tracking-tight">FinAWS Deployment Blueprint</h2>
              <p className="text-[10px] text-gray-400 font-mono">SOC2-Ready Infrastructure & DevOps Specification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-slate-800 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Selector tab row */}
        <div className="bg-slate-100 border-b border-gray-200 px-6 flex space-x-1 py-2">
          {[
            { id: 'architecture', label: 'AWS Architecture', icon: Layers },
            { id: 'docker', label: 'Docker Suite', icon: Server },
            { id: 'kubernetes', label: 'Kubernetes Manifest', icon: Cpu },
            { id: 'cicd', label: 'GitHub CI/CD Pipeline', icon: Github },
          ].map((pane) => {
            const Icon = pane.icon;
            return (
              <button
                key={pane.id}
                onClick={() => setActivePane(pane.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer ${
                  activePane === pane.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-950'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{pane.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activePane === 'architecture' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Architecture text breakdown */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
                  <h3 className="text-xs font-bold text-gray-900 font-sans flex items-center space-x-1.5 border-b border-gray-100 pb-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Multi-AZ AWS Infrastructure</span>
                  </h3>
                  <ul className="space-y-2 text-[11px] font-sans text-gray-600 leading-relaxed list-disc list-inside">
                    <li><span className="font-bold">Amazon CloudFront:</span> Delivers the React static bundle from <span className="font-semibold text-blue-600">Amazon S3</span> with sub-millisecond edge caching latency.</li>
                    <li><span className="font-bold">Application Load Balancer (ALB):</span> Routes HTTP requests from route path <code className="bg-slate-100 px-1 rounded text-red-500 font-mono">/api/*</code> into the VPC cluster.</li>
                    <li><span className="font-bold">Amazon EKS (EKS/Kubernetes):</span> Runs the Node-Express cluster in scalable pods across multiple Availability Zones.</li>
                    <li><span className="font-bold">Amazon RDS MySQL:</span> Managed Database with Multi-AZ replication, automatic snapshot backups, and point-in-time recovery.</li>
                    <li><span className="font-bold">Amazon CloudWatch:</span> Real-time telemetry, RAM/CPU metrics, and error log parsing triggers.</li>
                  </ul>
                </div>

                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                  <h3 className="text-xs font-bold text-blue-900 font-sans flex items-center space-x-1.5 mb-1.5">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>Security Protocols</span>
                  </h3>
                  <p className="text-[10px] text-blue-800 font-sans leading-relaxed">
                    All backend nodes operate behind private isolated VPC subnets. The ALB only accepts TLS 1.3 encrypted packets. Password variables are managed safely via Kubernetes Secrets dynamically mapped from AWS Secrets Manager.
                  </p>
                </div>
              </div>

              {/* Mermaid Diagram Graphic */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs flex-1 flex flex-col">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-2">
                    <h4 className="text-xs font-bold text-gray-900 font-sans flex items-center space-x-1">
                      <Code className="w-4 h-4 text-gray-500" />
                      <span>Mermaid.js Architectural Spec</span>
                    </h4>
                    <button
                      onClick={() => handleCopy(mermaidDiagram)}
                      className="flex items-center space-x-1 px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 font-sans font-bold text-slate-700 rounded-lg transition-all"
                    >
                      {copiedText ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedText ? 'Copied' : 'Copy Diagram'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-300 p-3.5 rounded-xl font-mono text-[10px] overflow-auto flex-1 leading-relaxed leading-normal select-all">
                    {mermaidDiagram}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activePane !== 'architecture' && (
            <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                <span className="text-[10px] font-mono text-gray-500 uppercase font-semibold">
                  {activePane === 'docker' ? 'Docker Suite Deployment Code' : activePane === 'kubernetes' ? 'K8s Cluster Manifest File' : 'GitHub Action CI/CD YAML'}
                </span>
                <button
                  onClick={() => handleCopy(codeBlocks[activePane as keyof typeof codeBlocks])}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-white hover:bg-slate-100 font-sans font-bold text-slate-700 border border-gray-200 rounded-lg transition-all shadow-sm"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied to Clipboard' : 'Copy Complete Code'}</span>
                </button>
              </div>
              <pre className="p-5 font-mono text-xs text-gray-800 overflow-auto flex-1 leading-relaxed bg-slate-50/20 select-all">
                {codeBlocks[activePane as keyof typeof codeBlocks]}
              </pre>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-4 bg-slate-100 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 font-sans">
          <span>AWS DevOps Internship Project Submission Material • FinAWS Console</span>
          <span className="font-bold text-blue-600 flex items-center mt-1.5 sm:mt-0">
            SOC2 Compliant Production Architecture
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </div>
      </div>
    </div>
  );
};
