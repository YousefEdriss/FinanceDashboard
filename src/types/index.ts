export interface SpendingCategories {
  outings: number;
  carMaintenance: number;
  gas: number;
  personalStuff: number;
  debts: number;
  supermarket: number;
}

export interface FreelancingEntry {
  id: string;
  amount: number;
  date: string;
  note: string;
}

export interface SpendingEntry {
  id: string;
  amount: number;
  category: keyof SpendingCategories;
  date: string; // 'YYYY-MM-DD'
  note?: string;
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  currency: 'EGP' | 'USD';
}

export interface NetWorthSnapshot {
  date: string;
  value: number;
}

export interface FinanceData {
  savings: number;
  incomingMonthly: number;
  freelancingEntries: FreelancingEntry[];
  spendingEntries: SpendingEntry[];
  netWorthHistory: NetWorthSnapshot[];
  cashEGP: number;
  goldGrams: number;
  usdAmount: number;
  goldPricePerGram: number;
  usdToEGP: number;
  subscriptions: Subscription[];
}

export interface FreelancingTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyData {
  date: string;
  training: boolean;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  hydrated: boolean;
  studiedNew: boolean;
  completedWorkTasks: boolean;
  freelancingTasks: FreelancingTask[];
}
