import { create } from 'zustand';
import { Transaction, RiskLabel } from '@/types/model';

export type TransactionState = {
  transactions: Transaction[];
  initializeIfEmpty: (initial: Transaction[]) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  clearTransactions: () => void;
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  initializeIfEmpty: (initial) => set((state) => state.transactions.length === 0 ? { transactions: initial } : state),
  addTransaction: (tx) => set((state) => ({ transactions: [tx, ...state.transactions] })),
  updateTransaction: (id, updates) => set((state) => ({
    transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
  })),
  clearTransactions: () => set({ transactions: [] }),
}));
