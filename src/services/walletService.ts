import { xrplService } from './xrpl';
import type { WalletInfo, XRPLBalanceInfo, Transaction } from '../types';
import type { XRPLWallet, XRPLTransactionHistory } from '../types/xrpl';

export class WalletService {
  private static readonly WALLET_STORAGE_KEY = 'grouppay_wallet';
  private static readonly SEED_STORAGE_KEY = 'grouppay_wallet_seed';

  /**
   * 새 지갑 생성
   */
  static async createWallet(): Promise<XRPLWallet> {
    try {
      const wallet = await xrplService.createWallet();
      
      // 로컬 스토리지에 저장 (실제 운영에서는 보안 고려 필요)
      this.saveWalletToStorage(wallet);
      
      return wallet;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw new Error('지갑 생성에 실패했습니다.');
    }
  }

  /**
   * 시드로 지갑 복구
   */
  static restoreWalletFromSeed(seed: string): XRPLWallet {
    try {
      const wallet = xrplService.loadWalletFromSeed(seed);
      this.saveWalletToStorage(wallet);
      return wallet;
    } catch (error) {
      console.error('Failed to restore wallet:', error);
      throw new Error('지갑 복구에 실패했습니다.');
    }
  }

  /**
   * 저장된 지갑 로드
   */
  static loadWalletFromStorage(): XRPLWallet | null {
    try {
      const walletData = localStorage.getItem(this.WALLET_STORAGE_KEY);
      if (!walletData) return null;

      const wallet = JSON.parse(walletData) as XRPLWallet;
      
      // 주소 유효성 검사
      if (!xrplService.isValidAddress(wallet.address)) {
        this.clearWalletFromStorage();
        return null;
      }

      return wallet;
    } catch (error) {
      console.error('Failed to load wallet from storage:', error);
      this.clearWalletFromStorage();
      return null;
    }
  }

  /**
   * 지갑을 로컬 스토리지에 저장
   */
  static saveWalletToStorage(wallet: XRPLWallet): void {
    try {
      // 보안상 민감한 정보는 별도 저장
      const publicWalletData = {
        address: wallet.address,
        publicKey: wallet.publicKey
      };

      localStorage.setItem(this.WALLET_STORAGE_KEY, JSON.stringify(publicWalletData));
      
      // 시드는 별도 저장 (실제 운영에서는 암호화 필요)
      if (wallet.seed) {
        localStorage.setItem(this.SEED_STORAGE_KEY, wallet.seed);
      }
    } catch (error) {
      console.error('Failed to save wallet to storage:', error);
    }
  }

  /**
   * 저장된 지갑 데이터 삭제
   */
  static clearWalletFromStorage(): void {
    localStorage.removeItem(this.WALLET_STORAGE_KEY);
    localStorage.removeItem(this.SEED_STORAGE_KEY);
  }

  /**
   * 지갑 잔액 조회
   */
  static async getBalance(address: string): Promise<number> {
    try {
      const balanceInfo = await xrplService.getBalance(address);
      return balanceInfo.balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw new Error('잔액 조회에 실패했습니다.');
    }
  }

  /**
   * 지갑 정보 조회
   */
  static async getWalletInfo(address: string): Promise<WalletInfo> {
    try {
      const accountInfo = await xrplService.getAccountInfo(address);
      const balance = await this.getBalance(address);

      return {
        address: accountInfo.account,
        balance,
        sequence: accountInfo.sequence
      };
    } catch (error) {
      console.error('Failed to get wallet info:', error);
      throw new Error('지갑 정보 조회에 실패했습니다.');
    }
  }

  /**
   * XRP 송금
   */
  static async sendXRP(
    toAddress: string,
    amount: number,
    memo?: string
  ): Promise<string> {
    try {
      const wallet = this.loadWalletFromStorage();
      if (!wallet) {
        throw new Error('지갑이 로드되지 않았습니다.');
      }

      const seed = localStorage.getItem(this.SEED_STORAGE_KEY);
      if (!seed) {
        throw new Error('지갑 인증 정보를 찾을 수 없습니다.');
      }

      const result = await xrplService.sendXRP({
        fromAddress: wallet.address,
        toAddress,
        amount,
        memo
      }, seed);

      if (result.resultCode !== 'tesSUCCESS') {
        throw new Error(`송금 실패: ${result.resultMessage}`);
      }

      return result.hash;
    } catch (error) {
      console.error('Failed to send XRP:', error);
      throw new Error('XRP 송금에 실패했습니다.');
    }
  }

  /**
   * 거래 내역 조회
   */
  static async getTransactionHistory(
    address: string,
    limit: number = 20
  ): Promise<Transaction[]> {
    try {
      const history = await xrplService.getTransactionHistory(address, limit);
      
      return history.transactions.map(tx => {
        const transaction = tx.transaction;
        
        // 거래 타입 결정
        let type: Transaction['type'] = 'received';
        if (transaction.Account === address) {
          type = 'sent';
        }

        // 메모에서 거래 목적 파악
        const memo = this.extractMemoFromTransaction(transaction);
        if (memo && memo.includes('dues')) {
          type = 'dues';
        } else if (memo && memo.includes('expense')) {
          type = 'expense';
        }

        return {
          hash: transaction.hash || tx.hash,
          type,
          amount: parseFloat(transaction.Amount) / 1000000, // drops to XRP
          from: transaction.Account,
          to: transaction.Destination || '',
          memo,
          timestamp: new Date(transaction.date * 1000 + 946684800000).toISOString(),
          status: tx.validated ? 'confirmed' : 'pending'
        };
      });
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw new Error('거래 내역 조회에 실패했습니다.');
    }
  }

  /**
   * 트랜잭션에서 메모 추출
   */
  private static extractMemoFromTransaction(transaction: any): string | undefined {
    try {
      if (!transaction.Memos || !Array.isArray(transaction.Memos)) {
        return undefined;
      }

      const memo = transaction.Memos[0]?.Memo;
      if (!memo?.MemoData) {
        return undefined;
      }

      return Buffer.from(memo.MemoData, 'hex').toString('utf-8');
    } catch (error) {
      console.error('Failed to extract memo:', error);
      return undefined;
    }
  }

  /**
   * testnet에서 XRP 받기
   */
  static async fundFromFaucet(address: string): Promise<void> {
    try {
      await xrplService.fundWallet(address);
    } catch (error) {
      console.error('Failed to fund from faucet:', error);
      throw new Error('테스트넷 자금 지원에 실패했습니다.');
    }
  }

  /**
   * 주소 유효성 검사
   */
  static isValidAddress(address: string): boolean {
    return xrplService.isValidAddress(address);
  }

  /**
   * 현재 로그인된 지갑 주소 가져오기
   */
  static getCurrentWalletAddress(): string | null {
    const wallet = this.loadWalletFromStorage();
    return wallet?.address || null;
  }

  /**
   * 지갑이 로그인되어 있는지 확인
   */
  static isWalletConnected(): boolean {
    return this.getCurrentWalletAddress() !== null;
  }

  /**
   * 지갑 연결 해제
   */
  static disconnectWallet(): void {
    this.clearWalletFromStorage();
    
    // 그룹 관련 정보도 삭제
    localStorage.removeItem('groupId');
    localStorage.removeItem('isHost');
  }

  /**
   * 실시간 잔액 업데이트를 위한 폴링
   */
  static startBalancePolling(
    address: string,
    onUpdate: (balance: number) => void,
    interval: number = 30000
  ): () => void {
    const pollBalance = async () => {
      try {
        const balance = await this.getBalance(address);
        onUpdate(balance);
      } catch (error) {
        console.error('Balance polling error:', error);
      }
    };

    const intervalId = setInterval(pollBalance, interval);
    
    // 초기 조회
    pollBalance();

    // 정리 함수 반환
    return () => clearInterval(intervalId);
  }
}

export default WalletService;