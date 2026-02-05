-- FinanzApp Database Schema

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT NOT NULL DEFAULT 'tag',
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'card')),
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  description TEXT,
  method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'transfer', 'other')) DEFAULT 'other',
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed')) DEFAULT 'confirmed',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL, -- Format: YYYY-MM
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  limit_amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month, category_id)
);

-- Credits table (loans, credit cards, etc.)
CREATE TABLE IF NOT EXISTS credits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  remaining_amount DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  monthly_payment DECIMAL(12, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  next_payment_date DATE NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'yearly')) DEFAULT 'monthly',
  status TEXT NOT NULL CHECK (status IN ('active', 'paid', 'overdue')) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Payments table
CREATE TABLE IF NOT EXISTS credit_payments (
  id TEXT PRIMARY KEY,
  credit_id TEXT NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'overdue')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
CREATE INDEX IF NOT EXISTS idx_credits_status ON credits(status);
CREATE INDEX IF NOT EXISTS idx_credit_payments_credit ON credit_payments(credit_id);
CREATE INDEX IF NOT EXISTS idx_credit_payments_date ON credit_payments(date);

-- Insert demo categories
INSERT INTO categories (id, name, type, icon, color) VALUES
  ('cat-1', 'Salario', 'income', 'banknote', '#22c55e'),
  ('cat-2', 'Freelance', 'income', 'laptop', '#3b82f6'),
  ('cat-3', 'Inversiones', 'income', 'trending-up', '#8b5cf6'),
  ('cat-4', 'Comida', 'expense', 'utensils', '#f97316'),
  ('cat-5', 'Transporte', 'expense', 'car', '#eab308'),
  ('cat-6', 'Entretenimiento', 'expense', 'film', '#ec4899'),
  ('cat-7', 'Servicios', 'expense', 'zap', '#14b8a6'),
  ('cat-8', 'Salud', 'expense', 'heart', '#ef4444'),
  ('cat-9', 'Educación', 'expense', 'book-open', '#6366f1'),
  ('cat-10', 'Ropa', 'expense', 'shirt', '#f43f5e'),
  ('cat-11', 'Hogar', 'expense', 'home', '#84cc16'),
  ('cat-12', 'Otros Ingresos', 'income', 'plus-circle', '#10b981'),
  ('cat-13', 'Otros Gastos', 'expense', 'minus-circle', '#6b7280')
ON CONFLICT (id) DO NOTHING;

-- Insert demo accounts
INSERT INTO accounts (id, name, type, balance, color) VALUES
  ('acc-1', 'Efectivo', 'cash', 5000, '#22c55e'),
  ('acc-2', 'Banco Principal', 'bank', 45000, '#3b82f6'),
  ('acc-3', 'Tarjeta de Crédito', 'card', -8500, '#ef4444')
ON CONFLICT (id) DO NOTHING;

-- Insert demo transactions
INSERT INTO transactions (id, type, amount, date, category_id, account_id, description, method, status, tags) VALUES
  ('tx-1', 'income', 35000, CURRENT_DATE - INTERVAL '5 days', 'cat-1', 'acc-2', 'Pago quincenal', 'transfer', 'confirmed', ARRAY['trabajo']),
  ('tx-2', 'expense', 1500, CURRENT_DATE - INTERVAL '4 days', 'cat-4', 'acc-3', 'Supermercado', 'card', 'confirmed', ARRAY['comida', 'semanal']),
  ('tx-3', 'expense', 800, CURRENT_DATE - INTERVAL '3 days', 'cat-5', 'acc-1', 'Gasolina', 'cash', 'confirmed', ARRAY['auto']),
  ('tx-4', 'expense', 450, CURRENT_DATE - INTERVAL '2 days', 'cat-6', 'acc-3', 'Netflix y Spotify', 'card', 'confirmed', ARRAY['suscripción']),
  ('tx-5', 'income', 5000, CURRENT_DATE - INTERVAL '1 day', 'cat-2', 'acc-2', 'Proyecto web', 'transfer', 'confirmed', ARRAY['freelance']),
  ('tx-6', 'expense', 2500, CURRENT_DATE, 'cat-7', 'acc-2', 'Luz y agua', 'transfer', 'pending', ARRAY['servicios', 'mensual']),
  ('tx-7', 'expense', 350, CURRENT_DATE - INTERVAL '6 days', 'cat-8', 'acc-1', 'Farmacia', 'cash', 'confirmed', ARRAY['salud']),
  ('tx-8', 'expense', 1200, CURRENT_DATE - INTERVAL '7 days', 'cat-4', 'acc-3', 'Restaurante', 'card', 'confirmed', ARRAY['comida', 'salida'])
ON CONFLICT (id) DO NOTHING;

-- Insert demo budgets for current month
INSERT INTO budgets (id, month, category_id, limit_amount) VALUES
  ('budget-1', TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 'cat-4', 8000),
  ('budget-2', TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 'cat-5', 3000),
  ('budget-3', TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 'cat-6', 2000),
  ('budget-4', TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 'cat-7', 2500),
  ('budget-5', TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 'cat-11', 3000)
ON CONFLICT (id) DO NOTHING;

-- Insert demo credits
INSERT INTO credits (id, name, total_amount, remaining_amount, interest_rate, monthly_payment, start_date, end_date, next_payment_date, frequency, status, notes) VALUES
  ('credit-1', 'Crédito Automotriz', 250000, 180000, 12.5, 5800, CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '5 years', CURRENT_DATE + INTERVAL '1 month', 'monthly', 'active', 'Crédito BBVA para auto Honda Civic 2023'),
  ('credit-2', 'Tarjeta de Crédito Oro', 15000, 8500, 36, 2500, CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '3 months', CURRENT_DATE + INTERVAL '10 days', 'monthly', 'active', 'Deuda de tarjeta - pagar lo antes posible'),
  ('credit-3', 'Préstamo Personal', 50000, 35000, 18, 3200, CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '2 years', CURRENT_DATE + INTERVAL '1 month', 'monthly', 'active', 'Préstamo para remodelación del hogar')
ON CONFLICT (id) DO NOTHING;

-- Insert demo credit payments (upcoming)
INSERT INTO credit_payments (id, credit_id, amount, date, status, notes) VALUES
  ('payment-1', 'credit-1', 5800, CURRENT_DATE + INTERVAL '15 days', 'pending', 'Pago mensual auto'),
  ('payment-2', 'credit-2', 2500, CURRENT_DATE + INTERVAL '10 days', 'pending', 'Pago mínimo tarjeta'),
  ('payment-3', 'credit-3', 3200, CURRENT_DATE + INTERVAL '15 days', 'pending', 'Pago mensual préstamo'),
  ('payment-4', 'credit-1', 5800, CURRENT_DATE + INTERVAL '45 days', 'pending', 'Pago mensual auto'),
  ('payment-5', 'credit-2', 2500, CURRENT_DATE + INTERVAL '40 days', 'pending', 'Pago mínimo tarjeta'),
  ('payment-6', 'credit-3', 3200, CURRENT_DATE + INTERVAL '45 days', 'pending', 'Pago mensual préstamo')
ON CONFLICT (id) DO NOTHING;
