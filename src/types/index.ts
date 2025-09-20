// Common types
export interface User {
  id: string;
  nickname: string;
  walletAddress: string;
  profileImage?: string;
  isHost: boolean;
}

export interface Group {
  id: string;
  name: string;
  hostWalletAddress: string;
  members: GroupMember[];
  totalBalance: number;
  createdAt: string;
  inviteLink: string;
}

export interface GroupMember {
  memberId: string;
  nickname: string;
  walletAddress: string;
  balance: number;
  profileImage?: string;
  joinedAt: string;
}

// Transaction types
export interface Transaction {
  hash: string;
  type: 'dues' | 'expense' | 'received' | 'sent';
  amount: number;
  from: string;
  to: string;
  memo?: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface DuesPayment {
  id: string;
  groupId: string;
  fromWallet: string;
  duesType: 'monthly' | 'special' | 'event';
  amount: number;
  memo?: string;
  transactionHash?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

// Escrow types
export interface EscrowDetails {
  escrowId: string;
  groupId: string;
  fromWallet: string;
  duesType: 'monthly' | 'special' | 'event';
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  memo?: string;
  nextExecution: string;
  isActive: boolean;
  createdAt: string;
}

// XRPL types
export interface XRPLBalance {
  balance: number;
  currency: string;
}

export interface XRPLTransaction {
  hash: string;
  type: string;
  amount: string;
  fee: string;
  account: string;
  destination?: string;
  date: string;
  validated: boolean;
}

// Wallet types
export interface WalletInfo {
  address: string;
  balance: number;
  sequence: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface CreateGroupRequest {
  name: string;
  hostWalletAddress: string;
}

export interface CreateGroupResponse {
  groupId: string;
  inviteLink: string;
  group: Group;
}

export interface JoinGroupRequest {
  inviteCode: string;
  nickname: string;
  walletAddress: string;
}

export interface JoinGroupResponse {
  success: boolean;
  group: Group;
  member: GroupMember;
}

// Cashout types
export interface CashoutCard {
  id: string;
  bankName: string;
  cardNumber: string;
  isDefault: boolean;
}

export interface CashoutRequest {
  amount: number;
  cardId: string;
  walletAddress: string;
}

// Form types
export interface CreateGroupForm {
  groupName: string;
  walletAddress: string;
}

export interface JoinGroupForm {
  inviteCode: string;
  nickname: string;
  walletAddress: string;
}

export interface PayDuesForm {
  duesType: 'monthly' | 'special' | 'event';
  amount: string;
  memo: string;
  isRecurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
}

export interface CashoutForm {
  amount: string;
  cardId: string;
}

// UI State types
export interface AppState {
  user: User | null;
  currentGroup: Group | null;
  isLoading: boolean;
  error: string | null;
}

export interface DashboardData {
  groupBalance: number;
  myBalance: number;
  members: GroupMember[];
  recentTransactions: Transaction[];
}