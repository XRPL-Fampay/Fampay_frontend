import { apiService } from './api';
import WalletService from './walletService';
import GroupService from './groupService';
import type { 
  DuesPayment, 
  EscrowDetails, 
  PayDuesForm,
  CashoutForm,
  CashoutCard 
} from '../types';

export class PaymentService {
  /**
   * 즉시 회비 납부
   */
  static async payDues(form: PayDuesForm): Promise<DuesPayment> {
    try {
      const groupId = GroupService.getCurrentGroupId();
      const walletAddress = WalletService.getCurrentWalletAddress();

      if (!groupId || !walletAddress) {
        throw new Error('그룹 또는 지갑 정보를 찾을 수 없습니다.');
      }

      const amount = parseFloat(form.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('유효하지 않은 금액입니다.');
      }

      // 잔액 확인
      const balance = await WalletService.getBalance(walletAddress);
      if (balance < amount) {
        throw new Error('잔액이 부족합니다.');
      }

      // 회비 납부 요청
      const payment = await apiService.payDues({
        groupId,
        fromWallet: walletAddress,
        duesType: form.duesType,
        amount,
        memo: form.memo || undefined
      });

      return payment;
    } catch (error) {
      console.error('Failed to pay dues:', error);
      throw new Error('회비 납부에 실패했습니다.');
    }
  }

  /**
   * 정기 회비 설정
   */
  static async createRecurringDues(form: PayDuesForm): Promise<EscrowDetails> {
    try {
      if (!form.isRecurring || !form.frequency) {
        throw new Error('정기 회비 설정이 올바르지 않습니다.');
      }

      const groupId = GroupService.getCurrentGroupId();
      const walletAddress = WalletService.getCurrentWalletAddress();

      if (!groupId || !walletAddress) {
        throw new Error('그룹 또는 지갑 정보를 찾을 수 없습니다.');
      }

      const amount = parseFloat(form.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('유효하지 않은 금액입니다.');
      }

      // 잔액 확인 (첫 번째 납부분)
      const balance = await WalletService.getBalance(walletAddress);
      if (balance < amount) {
        throw new Error('잔액이 부족합니다.');
      }

      // 정기 회비 에스크로우 생성
      const escrow = await apiService.createEscrow({
        groupId,
        fromWallet: walletAddress,
        duesType: form.duesType,
        amount,
        frequency: form.frequency,
        memo: form.memo || undefined
      });

      return escrow;
    } catch (error) {
      console.error('Failed to create recurring dues:', error);
      throw new Error('정기 회비 설정에 실패했습니다.');
    }
  }

  /**
   * 정기 회비 목록 조회
   */
  static async getRecurringDuesList(): Promise<EscrowDetails[]> {
    try {
      const groupId = GroupService.getCurrentGroupId();
      if (!groupId) {
        throw new Error('그룹 정보를 찾을 수 없습니다.');
      }

      return await apiService.getEscrowList(groupId);
    } catch (error) {
      console.error('Failed to get recurring dues list:', error);
      throw new Error('정기 회비 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 정기 회비 취소
   */
  static async cancelRecurringDues(escrowId: string): Promise<void> {
    try {
      await apiService.cancelEscrow(escrowId);
    } catch (error) {
      console.error('Failed to cancel recurring dues:', error);
      throw new Error('정기 회비 취소에 실패했습니다.');
    }
  }

  /**
   * 멤버 간 직접 송금
   */
  static async sendToMember(
    toMemberAddress: string,
    amount: number,
    memo?: string
  ): Promise<string> {
    try {
      const walletAddress = WalletService.getCurrentWalletAddress();
      if (!walletAddress) {
        throw new Error('지갑 정보를 찾을 수 없습니다.');
      }

      if (!WalletService.isValidAddress(toMemberAddress)) {
        throw new Error('유효하지 않은 지갑 주소입니다.');
      }

      if (amount <= 0) {
        throw new Error('유효하지 않은 금액입니다.');
      }

      // 잔액 확인
      const balance = await WalletService.getBalance(walletAddress);
      if (balance < amount) {
        throw new Error('잔액이 부족합니다.');
      }

      // 그룹 멤버인지 확인
      const member = await GroupService.findMemberByAddress(toMemberAddress);
      if (!member) {
        throw new Error('그룹 멤버가 아닙니다.');
      }

      // XRP 송금
      const transactionHash = await WalletService.sendXRP(
        toMemberAddress,
        amount,
        memo
      );

      return transactionHash;
    } catch (error) {
      console.error('Failed to send to member:', error);
      throw new Error('멤버에게 송금하는데 실패했습니다.');
    }
  }

  /**
   * 등록된 카드 목록 조회
   */
  static async getCashoutCards(): Promise<CashoutCard[]> {
    try {
      return await apiService.getCashoutCards();
    } catch (error) {
      console.error('Failed to get cashout cards:', error);
      throw new Error('카드 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 현금화 요청
   */
  static async requestCashout(form: CashoutForm): Promise<void> {
    try {
      const walletAddress = WalletService.getCurrentWalletAddress();
      if (!walletAddress) {
        throw new Error('지갑 정보를 찾을 수 없습니다.');
      }

      const amount = parseFloat(form.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('유효하지 않은 금액입니다.');
      }

      // 잔액 확인
      const balance = await WalletService.getBalance(walletAddress);
      if (balance < amount) {
        throw new Error('잔액이 부족합니다.');
      }

      // 카드 유효성 확인
      const cards = await this.getCashoutCards();
      const selectedCard = cards.find(card => card.id === form.cardId);
      if (!selectedCard) {
        throw new Error('선택된 카드를 찾을 수 없습니다.');
      }

      // 현금화 요청
      await apiService.requestCashout({
        amount,
        cardId: form.cardId,
        walletAddress
      });
    } catch (error) {
      console.error('Failed to request cashout:', error);
      throw new Error('현금화 요청에 실패했습니다.');
    }
  }

  /**
   * 결제 가능한 최대 금액 계산
   */
  static async getMaxPayableAmount(): Promise<number> {
    try {
      const walletAddress = WalletService.getCurrentWalletAddress();
      if (!walletAddress) return 0;

      const balance = await WalletService.getBalance(walletAddress);
      
      // 거래 수수료를 고려하여 약간의 마진을 둠 (0.001 XRP)
      const txFee = 0.001;
      return Math.max(0, balance - txFee);
    } catch (error) {
      console.error('Failed to get max payable amount:', error);
      return 0;
    }
  }

  /**
   * 결제 내역 조회
   */
  static async getPaymentHistory(limit: number = 50) {
    try {
      const walletAddress = WalletService.getCurrentWalletAddress();
      if (!walletAddress) {
        throw new Error('지갑 정보를 찾을 수 없습니다.');
      }

      const transactions = await WalletService.getTransactionHistory(walletAddress, limit);
      
      // 회비 관련 거래만 필터링
      return transactions.filter(tx => 
        tx.type === 'dues' || 
        tx.memo?.includes('dues') ||
        tx.memo?.includes('회비')
      );
    } catch (error) {
      console.error('Failed to get payment history:', error);
      throw new Error('결제 내역 조회에 실패했습니다.');
    }
  }

  /**
   * 회비 타입별 통계
   */
  static async getDuesStatistics(period: 'month' | 'quarter' | 'year' = 'month') {
    try {
      const paymentHistory = await this.getPaymentHistory();
      
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      const periodTransactions = paymentHistory.filter(tx => 
        new Date(tx.timestamp) >= startDate
      );

      const statistics = {
        monthly: 0,
        special: 0,
        event: 0,
        total: 0,
        count: periodTransactions.length
      };

      periodTransactions.forEach(tx => {
        if (tx.memo?.includes('monthly') || tx.memo?.includes('월회비')) {
          statistics.monthly += tx.amount;
        } else if (tx.memo?.includes('special') || tx.memo?.includes('특별회비')) {
          statistics.special += tx.amount;
        } else if (tx.memo?.includes('event') || tx.memo?.includes('행사비')) {
          statistics.event += tx.amount;
        }
        statistics.total += tx.amount;
      });

      return statistics;
    } catch (error) {
      console.error('Failed to get dues statistics:', error);
      throw new Error('회비 통계 조회에 실패했습니다.');
    }
  }

  /**
   * 결제 상태 확인
   */
  static async checkPaymentStatus(transactionHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
      if (!WalletService.isValidAddress(transactionHash)) {
        return 'failed';
      }

      // XRPL에서 트랜잭션 상태 확인
      // 실제 구현에서는 xrplService.getTransaction()을 사용
      return 'confirmed'; // 임시
    } catch (error) {
      console.error('Failed to check payment status:', error);
      return 'failed';
    }
  }

  /**
   * 자동 결제 설정 유효성 검사
   */
  static validateRecurringPayment(form: PayDuesForm): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!form.isRecurring) {
      errors.push('정기 결제가 설정되지 않았습니다.');
    }

    if (!form.frequency) {
      errors.push('결제 주기를 선택해주세요.');
    }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('유효하지 않은 금액입니다.');
    }

    if (amount > 1000) {
      errors.push('정기 결제 금액은 1000 XRP를 초과할 수 없습니다.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default PaymentService;