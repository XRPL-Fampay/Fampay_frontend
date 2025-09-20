import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { 
  ApiResponse, 
  CreateGroupRequest, 
  CreateGroupResponse,
  JoinGroupRequest,
  JoinGroupResponse,
  Group,
  DuesPayment,
  EscrowDetails,
  Transaction,
  CashoutRequest,
  CashoutCard
} from '../types';

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * 요청/응답 인터셉터 설정
   */
  private setupInterceptors(): void {
    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        // 인증 토큰이 있다면 헤더에 추가
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 지갑 주소를 헤더에 추가
        const walletAddress = localStorage.getItem('walletAddress');
        if (walletAddress) {
          config.headers['X-Wallet-Address'] = walletAddress;
        }

        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('Response error:', error.response?.status, error.response?.data);
        
        // 인증 에러 처리
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('walletAddress');
          window.location.href = '/';
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * 그룹 생성
   */
  async createGroup(data: CreateGroupRequest): Promise<CreateGroupResponse> {
    try {
      const response = await this.client.post<ApiResponse<CreateGroupResponse>>(
        '/group/create',
        data
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || '그룹 생성에 실패했습니다.');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to create group:', error);
      throw new Error('그룹 생성에 실패했습니다.');
    }
  }

  /**
   * 그룹 참여
   */
  async joinGroup(data: JoinGroupRequest): Promise<JoinGroupResponse> {
    try {
      const response = await this.client.post<ApiResponse<JoinGroupResponse>>(
        '/group/join',
        data
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || '그룹 참여에 실패했습니다.');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to join group:', error);
      throw new Error('그룹 참여에 실패했습니다.');
    }
  }

  /**
   * 그룹 정보 조회
   */
  async getGroupInfo(groupId: string): Promise<Group> {
    try {
      const response = await this.client.get<ApiResponse<Group>>(
        `/group/${groupId}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || '그룹 정보 조회에 실패했습니다.');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get group info:', error);
      throw new Error('그룹 정보 조회에 실패했습니다.');
    }
  }

  /**
   * 그룹 멤버 목록 조회
   */
  async getGroupMembers(groupId: string) {
    try {
      const response = await this.client.get(`/group/${groupId}/members`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to get group members:', error);
      throw new Error('그룹 멤버 조회에 실패했습니다.');
    }
  }

  /**
   * 지갑 잔액 조회
   */
  async getWalletBalance(address: string): Promise<number> {
    try {
      const response = await this.client.get(`/wallet/${address}/balance`);
      return response.data.data.balance;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      throw new Error('잔액 조회에 실패했습니다.');
    }
  }

  /**
   * 지갑 거래 내역 조회
   */
  async getWalletTransactions(address: string, limit: number = 20): Promise<Transaction[]> {
    try {
      const response = await this.client.get(
        `/wallet/${address}/transactions?limit=${limit}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to get wallet transactions:', error);
      throw new Error('거래 내역 조회에 실패했습니다.');
    }
  }

  /**
   * 회비 납부
   */
  async payDues(data: {
    groupId: string;
    fromWallet: string;
    duesType: string;
    amount: number;
    memo?: string;
  }): Promise<DuesPayment> {
    try {
      const response = await this.client.post<ApiResponse<DuesPayment>>(
        '/payment/dues',
        data
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || '회비 납부에 실패했습니다.');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to pay dues:', error);
      throw new Error('회비 납부에 실패했습니다.');
    }
  }

  /**
   * 정기 회비 설정 생성
   */
  async createEscrow(data: {
    groupId: string;
    fromWallet: string;
    duesType: string;
    amount: number;
    frequency: string;
    memo?: string;
  }): Promise<EscrowDetails> {
    try {
      const response = await this.client.post<ApiResponse<EscrowDetails>>(
        '/escrow/create',
        data
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || '정기 회비 설정에 실패했습니다.');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to create escrow:', error);
      throw new Error('정기 회비 설정에 실패했습니다.');
    }
  }

  /**
   * 정기 회비 목록 조회
   */
  async getEscrowList(groupId: string): Promise<EscrowDetails[]> {
    try {
      const response = await this.client.get<ApiResponse<EscrowDetails[]>>(
        `/escrow/list?groupId=${groupId}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || '정기 회비 목록 조회에 실패했습니다.');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get escrow list:', error);
      throw new Error('정기 회비 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 정기 회비 취소
   */
  async cancelEscrow(escrowId: string): Promise<void> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(
        `/escrow/${escrowId}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || '정기 회비 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to cancel escrow:', error);
      throw new Error('정기 회비 취소에 실패했습니다.');
    }
  }

  /**
   * 등록된 카드 목록 조회
   */
  async getCashoutCards(): Promise<CashoutCard[]> {
    try {
      const response = await this.client.get<ApiResponse<CashoutCard[]>>(
        '/cashout/cards'
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || '카드 목록 조회에 실패했습니다.');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get cashout cards:', error);
      throw new Error('카드 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 현금화 요청
   */
  async requestCashout(data: CashoutRequest): Promise<void> {
    try {
      const response = await this.client.post<ApiResponse<void>>(
        '/cashout/request',
        data
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || '현금화 요청에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to request cashout:', error);
      throw new Error('현금화 요청에 실패했습니다.');
    }
  }

  /**
   * 대시보드 데이터 조회
   */
  async getDashboardData(groupId: string, walletAddress: string) {
    try {
      const [groupInfo, walletBalance, transactions] = await Promise.all([
        this.getGroupInfo(groupId),
        this.getWalletBalance(walletAddress),
        this.getWalletTransactions(walletAddress, 5)
      ]);

      return {
        groupBalance: groupInfo.totalBalance,
        myBalance: walletBalance,
        members: groupInfo.members,
        recentTransactions: transactions
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw new Error('대시보드 데이터 조회에 실패했습니다.');
    }
  }

  /**
   * 커스텀 요청 메서드
   */
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error) {
      console.error('Custom request failed:', error);
      throw error;
    }
  }

  /**
   * 베이스 URL 업데이트
   */
  updateBaseURL(newBaseURL: string): void {
    this.baseURL = newBaseURL;
    this.client.defaults.baseURL = newBaseURL;
  }

  /**
   * 인증 토큰 설정
   */
  setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  /**
   * 인증 토큰 제거
   */
  removeAuthToken(): void {
    localStorage.removeItem('auth_token');
    delete this.client.defaults.headers.Authorization;
  }
}

// Singleton 인스턴스 생성
export const apiService = new ApiService();

export default ApiService;