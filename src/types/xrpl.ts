// XRPL 4.3.0에 맞춘 타입 정의

export interface XRPLClientConfig {
  server: string;
  network: 'testnet' | 'mainnet' | 'devnet';
}

export interface XRPLWallet {
  address: string;
  publicKey: string;
  privateKey?: string;
  seed?: string;
}

export interface XRPLAccountInfo {
  account: string;
  balance: string;
  flags: number;
  ledgerEntryType: string;
  ownerCount: number;
  previousTxnID: string;
  previousTxnLgrSeq: number;
  sequence: number;
}

export interface XRPLPaymentTransaction {
  TransactionType: 'Payment';
  Account: string;
  Destination: string;
  Amount: string;
  Fee?: string;
  Sequence?: number;
  LastLedgerSequence?: number;
  Memos?: Array<{
    Memo: {
      MemoData?: string;
      MemoFormat?: string;
      MemoType?: string;
    };
  }>;
}

export interface XRPLSubmitResult {
  resultCode: string;
  resultMessage: string;
  hash: string;
  validated?: boolean;
}

export interface XRPLTransactionResponse {
  account: string;
  ledger_index_max: number;
  ledger_index_min: number;
  limit: number;
  marker?: string;
  transactions: Array<{
    meta: any;
    tx: any;
    validated: boolean;
  }>;
}

export interface XRPLLedgerEntry {
  hash: string;
  inLedger: number;
  ledger_index: number;
  meta: any;
  transaction: any;
  validated: boolean;
}

export interface XRPLAccountTxOptions {
  account: string;
  ledger_index_min?: number;
  ledger_index_max?: number;
  binary?: boolean;
  forward?: boolean;
  limit?: number;
  marker?: string;
}

export interface XRPLServerInfo {
  build_version: string;
  complete_ledgers: string;
  hostid: string;
  io_latency_ms: number;
  jq_trans_overflow: string;
  last_close: {
    converge_time_s: number;
    proposers: number;
  };
  load_factor: number;
  peers: number;
  pubkey_node: string;
  server_state: string;
  state_accounting: any;
  uptime: number;
  validated_ledger: {
    age: number;
    base_fee_xrp: number;
    hash: string;
    reserve_base_xrp: number;
    reserve_inc_xrp: number;
    seq: number;
  };
  validation_quorum: number;
}

export interface XRPLError {
  name: string;
  message: string;
  code?: string;
  data?: any;
}

// Utility types for XRPL operations
export type XRPAmount = string; // XRP amounts as strings (in drops)
export type XRPLAddress = string; // Valid XRPL address format

export interface XRPLConnectionStatus {
  isConnected: boolean;
  url: string;
  error?: string;
}

export interface XRPLBalanceInfo {
  address: string;
  balance: number; // in XRP (not drops)
  currency: 'XRP';
  lastUpdated: string;
}

export interface XRPLPaymentParams {
  fromAddress: string;
  toAddress: string;
  amount: number; // in XRP
  memo?: string;
}

export interface XRPLTransactionHistory {
  transactions: XRPLLedgerEntry[];
  hasMore: boolean;
  marker?: string;
}