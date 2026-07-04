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
  paidMonth?: string; // 'YYYY-MM' when last paid
}

export interface NetWorthSnapshot {
  date: string;
  value: number;
  weekKey?: string; // 'YYYY-WNN' for auto weekly snapshots
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
  reminderDismissedMonth?: string; // 'YYYY-MM'
}

export interface FreelancingTask {
  id: string;
  text: string;
  completed: boolean;
}

// Custom habit definition (stored in cloud)
export interface HabitDef {
  id: string;
  label: string;
  desc: string;
  color: string;
}

export interface DailyData {
  date: string;
  // New customizable format
  habits?: HabitDef[];
  habitsDone?: Record<string, boolean>;
  workTasks?: FreelancingTask[];
  // Old format fields (kept for migration)
  training?: boolean;
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  hydrated?: boolean;
  studiedNew?: boolean;
  completedWorkTasks?: boolean;
  freelancingTasks?: FreelancingTask[];
}
