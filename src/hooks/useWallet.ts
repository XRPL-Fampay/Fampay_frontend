import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WalletService from '../services/walletService';
import { useXRPLBalance, useXRPLTransactions } from './useXRPL';
import type { XRPLWallet, WalletInfo, Transaction } from '../types';

/**
 * 지갑 상태 관리 훅
 */
export const useWallet = () => {
  const [wallet, setWallet] = useState<XRPLWallet | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 저장된 지갑 로드
  useEffect(() => {
    const savedWallet = WalletService.loadWalletFromStorage();
    if (savedWallet) {
      setWallet(savedWallet);
      setIsConnected(true);
    }
  }, []);

  // 새 지갑 생성
  const createWallet = useMutation({
    mutationFn: async () => {
      return await WalletService.createWallet();
    },
    onSuccess: (newWallet) => {
      setWallet(newWallet);
      setIsConnected(true);
    },
  });

  // 시드로 지갑 복구
  const restoreWallet = useCallback((seed: string) => {
    try {
      const restoredWallet = WalletService.restoreWalletFromSeed(seed);
      setWallet(restoredWallet);
      setIsConnected(true);
      return restoredWallet;
    } catch (error) {
      console.error('Failed to restore wallet:', error);
      throw error;
    }
  }, []);

  // 지갑 연결 해제
  const disconnectWallet = useCallback(() => {
    WalletService.disconnectWallet();
    setWallet(null);
    setIsConnected(false);
  }, []);

  return {
    wallet,
    isConnected,
    address: wallet?.address || null,
    createWallet,
    restoreWallet,
    disconnectWallet,
    isCreating: createWallet.isPending
  };
};

/**
 * 지갑 잔액 관리 훅
 */
export const useWalletBalance = (address?: string) => {
  const walletAddress = address || WalletService.getCurrentWalletAddress();
  
  const balanceQuery = useXRPLBalance(walletAddress);

  const refreshBalance = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      await balanceQuery.refetch();
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [walletAddress, balanceQuery]);

  return {
    balance: balanceQuery.data?.balance || 0,
    isLoading: balanceQuery.isLoading,
    error: balanceQuery.error,
    refreshBalance,
    lastUpdated: balanceQuery.data?.lastUpdated
  };
};

/**
 * 지갑 정보 조회 훅
 */
export const useWalletInfo = (address?: string) => {
  const walletAddress = address || WalletService.getCurrentWalletAddress();

  return useQuery<WalletInfo, Error>({
    queryKey: ['wallet-info', walletAddress],
    queryFn: async () => {
      if (!walletAddress) throw new Error('Wallet address not found');
      return await WalletService.getWalletInfo(walletAddress);
    },
    enabled: !!walletAddress,
    staleTime: 30000, // 30초간 캐시 유지
  });
};

/**
 * XRP 송금 훅
 */
export const useSendXRP = () => {
  const queryClient = useQueryClient();
  const walletAddress = WalletService.getCurrentWalletAddress();

  return useMutation({
    mutationFn: async ({ 
      toAddress, 
      amount, 
      memo 
    }: { 
      toAddress: string; 
      amount: number; 
      memo?: string;
    }) => {
      return await WalletService.sendXRP(toAddress, amount, memo);
    },
    onSuccess: () => {
      // 송금 성공 시 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['xrpl-balance', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['xrpl-transactions', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['wallet-info', walletAddress] });
    },
  });
};

/**
 * 거래 내역 관리 훅
 */
export const useWalletTransactions = (address?: string, limit: number = 20) => {
  const walletAddress = address || WalletService.getCurrentWalletAddress();

  const transactionsQuery = useQuery<Transaction[], Error>({
    queryKey: ['wallet-transactions', walletAddress, limit],
    queryFn: async () => {
      if (!walletAddress) throw new Error('Wallet address not found');
      return await WalletService.getTransactionHistory(walletAddress, limit);
    },
    enabled: !!walletAddress,
    staleTime: 30000, // 30초간 캐시 유지
  });

  const refreshTransactions = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      await transactionsQuery.refetch();
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
    }
  }, [walletAddress, transactionsQuery]);

  // 특정 타입의 거래만 필터링
  const getTransactionsByType = useCallback((type: Transaction['type']) => {
    return transactionsQuery.data?.filter(tx => tx.type === type) || [];
  }, [transactionsQuery.data]);

  // 최근 거래 가져오기
  const getRecentTransactions = useCallback((count: number = 5) => {
    return transactionsQuery.data?.slice(0, count) || [];
  }, [transactionsQuery.data]);

  return {
    transactions: transactionsQuery.data || [],
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    refreshTransactions,
    getTransactionsByType,
    getRecentTransactions
  };
};

/**
 * 테스트넷 펀딩 훅
 */
export const useFundWallet = () => {
  const queryClient = useQueryClient();
  const walletAddress = WalletService.getCurrentWalletAddress();

  return useMutation({
    mutationFn: async (address?: string) => {
      const targetAddress = address || walletAddress;
      if (!targetAddress) throw new Error('Wallet address not found');
      
      return await WalletService.fundFromFaucet(targetAddress);
    },
    onSuccess: (data, address) => {
      const targetAddress = address || walletAddress;
      // 펀딩 성공 시 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['xrpl-balance', targetAddress] });
      queryClient.invalidateQueries({ queryKey: ['xrpl-transactions', targetAddress] });
      queryClient.invalidateQueries({ queryKey: ['wallet-info', targetAddress] });
    },
  });
};

/**
 * 주소 유효성 검사 훅
 */
export const useAddressValidation = () => {
  const validateAddress = useCallback((address: string): boolean => {
    return WalletService.isValidAddress(address);
  }, []);

  const validateAddressWithFeedback = useCallback((address: string): {
    isValid: boolean;
    error?: string;
  } => {
    if (!address) {
      return { isValid: false, error: '주소를 입력해주세요.' };
    }

    if (!validateAddress(address)) {
      return { isValid: false, error: '유효하지 않은 XRPL 주소입니다.' };
    }

    return { isValid: true };
  }, [validateAddress]);

  return {
    validateAddress,
    validateAddressWithFeedback
  };
};

/**
 * 실시간 잔액 모니터링 훅
 */
export const useBalanceMonitoring = (
  onBalanceChange?: (oldBalance: number, newBalance: number) => void
) => {
  const { balance } = useWalletBalance();
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (balance !== undefined && balance !== previousBalance) {
      if (onBalanceChange && previousBalance > 0) {
        onBalanceChange(previousBalance, balance);
      }
      setPreviousBalance(balance);
    }
  }, [balance, previousBalance, onBalanceChange]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  return {
    currentBalance: balance,
    previousBalance,
    balanceChange: balance - previousBalance,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  };
};

/**
 * 지갑 보안 검사 훅
 */
export const useWalletSecurity = () => {
  const { wallet } = useWallet();

  const checkSecurity = useCallback(() => {
    const checks = {
      hasWallet: !!wallet,
      hasValidAddress: wallet ? WalletService.isValidAddress(wallet.address) : false,
      isStoredSecurely: !!localStorage.getItem('grouppay_wallet_seed'), // 임시 체크
    };

    const securityScore = Object.values(checks).filter(Boolean).length;
    const maxScore = Object.keys(checks).length;

    return {
      checks,
      score: securityScore,
      maxScore,
      percentage: (securityScore / maxScore) * 100,
      isSecure: securityScore === maxScore
    };
  }, [wallet]);

  const securityStatus = checkSecurity();

  return {
    ...securityStatus,
    recommendations: {
      needsWallet: !securityStatus.checks.hasWallet,
      needsValidAddress: !securityStatus.checks.hasValidAddress,
      needsSecureStorage: !securityStatus.checks.isStoredSecurely,
    }
  };
};

/**
 * 지갑 연결 상태 체크 훅
 */
export const useWalletConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = () => {
      const connected = WalletService.isWalletConnected();
      const currentAddress = WalletService.getCurrentWalletAddress();
      
      setIsConnected(connected);
      setAddress(currentAddress);
    };

    checkConnection();

    // 주기적으로 연결 상태 확인
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    address,
    checkConnection: () => WalletService.isWalletConnected()
  };
};