import { Client, Wallet, xrpToDrops, type Payment } from 'xrpl';
import type {
  XRPLClientConfig,
  XRPLWallet,
  XRPLAccountInfo,
  XRPLPaymentTransaction,
  XRPLSubmitResult,
  XRPLTransactionHistory,
  XRPLBalanceInfo,
  XRPLPaymentParams,
  XRPLConnectionStatus,
  XRPLTransactionResponse
} from '../types/xrpl';

class XRPLService {
  private client: Client | null = null;
  private config: XRPLClientConfig;

  constructor(config: XRPLClientConfig = {
    server: 'wss://s.devnet.rippletest.net:51233',
    network: 'devnet'
  }) {
    this.config = config;
  }

  /**
   * XRPL 클라이언트 연결
   */
  async connect(): Promise<void> {
    try {
      if (this.client && this.client.isConnected()) {
        return;
      }

      this.client = new Client(this.config.server);
      await this.client.connect();
      console.log('XRPL Client connected to:', this.config.server);
    } catch (error) {
      console.error('Failed to connect to XRPL:', error);
      throw new Error(`XRPL connection failed: ${error}`);
    }
  }

  /**
   * XRPL 클라이언트 연결 해제
   */
  async disconnect(): Promise<void> {
    if (this.client && this.client.isConnected()) {
      await this.client.disconnect();
      this.client = null;
      console.log('XRPL Client disconnected');
    }
  }

  /**
   * 연결 상태 확인
   */
  getConnectionStatus(): XRPLConnectionStatus {
    return {
      isConnected: this.client ? this.client.isConnected() : false,
      url: this.config.server
    };
  }

  /**
   * 새 지갑 생성
   */
  async createWallet(): Promise<XRPLWallet> {
    try {
      await this.connect();
      
      const wallet = Wallet.generate();
      
      return {
        address: wallet.address,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        seed: wallet.seed
      };
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw new Error(`Wallet creation failed: ${error}`);
    }
  }

  /**
   * 시드에서 지갑 로드
   */
  loadWalletFromSeed(seed: string): XRPLWallet {
    try {
      const wallet = Wallet.fromSeed(seed);
      
      return {
        address: wallet.address,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        seed: wallet.seed
      };
    } catch (error) {
      console.error('Failed to load wallet from seed:', error);
      throw new Error(`Wallet loading failed: ${error}`);
    }
  }

  /**
   * testnet faucet에서 XRP 받기
   */
  async fundWallet(address: string): Promise<void> {
    try {
      await this.connect();
      
      if (!this.client) {
        throw new Error('XRPL client not connected');
      }

      const wallet = { address } as Wallet;
      await this.client.fundWallet(wallet);
      
      console.log(`Funded wallet ${address} from testnet faucet`);
    } catch (error) {
      console.error('Failed to fund wallet:', error);
      throw new Error(`Wallet funding failed: ${error}`);
    }
  }

  /**
   * 계정 정보 조회
   */
  async getAccountInfo(address: string): Promise<XRPLAccountInfo> {
    try {
      await this.connect();
      
      if (!this.client) {
        throw new Error('XRPL client not connected');
      }

      const response = await this.client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      });

      const accountData = response.result.account_data;
      return {
        account: accountData.Account,
        balance: accountData.Balance,
        flags: accountData.Flags,
        ledgerEntryType: accountData.LedgerEntryType,
        ownerCount: accountData.OwnerCount,
        previousTxnID: accountData.PreviousTxnID,
        previousTxnLgrSeq: accountData.PreviousTxnLgrSeq,
        sequence: accountData.Sequence
      };
    } catch (error) {
      console.error('Failed to get account info:', error);
      throw new Error(`Account info retrieval failed: ${error}`);
    }
  }

  /**
   * XRP 잔액 조회 (XRPL 4.3.0 방식)
   */
  async getBalance(address: string): Promise<XRPLBalanceInfo> {
    try {
      await this.connect();
      
      if (!this.client) {
        throw new Error('XRPL client not connected');
      }

      const balanceInXRP = await this.client.getXrpBalance(address);

      return {
        address,
        balance: typeof balanceInXRP === 'string' ? parseFloat(balanceInXRP) : balanceInXRP,
        currency: 'XRP',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw new Error(`Balance retrieval failed: ${error}`);
    }
  }

  /**
   * XRP 송금
   */
  async sendXRP(params: XRPLPaymentParams, senderSeed: string): Promise<XRPLSubmitResult> {
    try {
      await this.connect();
      
      if (!this.client) {
        throw new Error('XRPL client not connected');
      }

      const wallet = Wallet.fromSeed(senderSeed);
      
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: params.fromAddress,
        Destination: params.toAddress,
        Amount: xrpToDrops(params.amount.toString())
      };

      // 메모 추가 (선택사항)
      if (params.memo) {
        payment.Memos = [{
          Memo: {
            MemoData: Buffer.from(params.memo, 'utf-8').toString('hex'),
            MemoType: Buffer.from('text/plain', 'utf-8').toString('hex')
          }
        }];
      }

      // 트랜잭션 준비 및 서명
      const prepared = await this.client.autofill(payment);
      const signed = wallet.sign(prepared);
      
      // 트랜잭션 제출
      const result = await this.client.submitAndWait(signed.tx_blob);

      const meta = result.result.meta;
      const transactionResult = typeof meta === 'object' && meta !== null && 'TransactionResult' in meta 
        ? (meta as any).TransactionResult 
        : 'unknown';
      
      return {
        resultCode: transactionResult,
        resultMessage: 'Transaction submitted',
        hash: result.result.hash,
        validated: result.result.validated
      };
    } catch (error) {
      console.error('Failed to send XRP:', error);
      throw new Error(`XRP transfer failed: ${error}`);
    }
  }

  /**
   * 거래 내역 조회
   */
  async getTransactionHistory(
    address: string,
    limit: number = 20,
    marker?: string
  ): Promise<XRPLTransactionHistory> {
    try {
      await this.connect();
      
      if (!this.client) {
        throw new Error('XRPL client not connected');
      }

      const response: { result: XRPLTransactionResponse } = await this.client.request({
        command: 'account_tx',
        account: address,
        limit,
        marker
      });

      const transactions = response.result.transactions.map(tx => ({
        hash: tx.tx.hash,
        inLedger: tx.tx.inLedger,
        ledger_index: tx.tx.ledger_index,
        meta: tx.meta,
        transaction: tx.tx,
        validated: tx.validated
      }));

      return {
        transactions,
        hasMore: !!response.result.marker,
        marker: response.result.marker
      };
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw new Error(`Transaction history retrieval failed: ${error}`);
    }
  }

  /**
   * 특정 트랜잭션 조회
   */
  async getTransaction(hash: string): Promise<any> {
    try {
      await this.connect();
      
      if (!this.client) {
        throw new Error('XRPL client not connected');
      }

      const response = await this.client.request({
        command: 'tx',
        transaction: hash
      });

      return response.result;
    } catch (error) {
      console.error('Failed to get transaction:', error);
      throw new Error(`Transaction retrieval failed: ${error}`);
    }
  }

  /**
   * 서버 정보 조회
   */
  async getServerInfo(): Promise<any> {
    try {
      await this.connect();
      
      if (!this.client) {
        throw new Error('XRPL client not connected');
      }

      const response = await this.client.request({
        command: 'server_info'
      });

      return response.result;
    } catch (error) {
      console.error('Failed to get server info:', error);
      throw new Error(`Server info retrieval failed: ${error}`);
    }
  }

  /**
   * 주소 유효성 검사
   */
  isValidAddress(address: string): boolean {
    try {
      // XRPL 주소는 'r'로 시작하고 특정 형식을 따름
      return /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
    } catch {
      return false;
    }
  }

  /**
   * 트랜잭션 해시 유효성 검사
   */
  isValidTransactionHash(hash: string): boolean {
    try {
      return /^[A-F0-9]{64}$/i.test(hash);
    } catch {
      return false;
    }
  }
}

// Singleton 인스턴스 생성
export const xrplService = new XRPLService();

// 기본 설정
export const XRPL_CONFIG = {
  TESTNET_SERVER: 'wss://s.altnet.rippletest.net:51233',
  DEVNET_SERVER: 'wss://s.devnet.rippletest.net:51233',
  MAINNET_SERVER: 'wss://xrplcluster.com'
};

// 기본 인스턴스는 DEVNET 사용
export const devnetXrplService = new XRPLService({
  server: XRPL_CONFIG.DEVNET_SERVER,
  network: 'devnet'
});

export default XRPLService;