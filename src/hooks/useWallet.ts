import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, isValidAddress } from 'xrpl';
import { xrplService } from '../services/xrpl';
import { useXRPLBalance } from './useXRPL';
import type { WalletInfo, Transaction } from '../types';

/**
 * 지갑 상태 관리 훅
 */
export const useWallet = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 환경 변수에서 지갑 시드 로드
  useEffect(() => {
    const walletSeed = import.meta.env.VITE_WALLET_SEED;
    if (walletSeed) {
      try {
        const seedWallet = Wallet.fromSeed(walletSeed);
        setWallet(seedWallet);
        setIsConnected(true);
        setGlobalWallet(seedWallet);
      } catch (error) {
        console.error('Failed to load wallet from seed:', error);
      }
    }
  }, []);

  // 새 지갑 생성
  const createWallet = useMutation({
    mutationFn: async () => {
      const newWallet = Wallet.generate();
      console.log('New wallet created:', newWallet.address);
      console.log('Save this seed to .env as VITE_WALLET_SEED:', newWallet.seed);
      return newWallet;
    },
    onSuccess: (newWallet) => {
      setWallet(newWallet);
      setIsConnected(true);
      setGlobalWallet(newWallet);
    },
  });

  // 시드로 지갑 복구
  const restoreWallet = useCallback((seed: string) => {
    try {
      const restoredWallet = Wallet.fromSeed(seed);
      setWallet(restoredWallet);
      setIsConnected(true);
      setGlobalWallet(restoredWallet);
      return restoredWallet;
    } catch (error) {
      console.error('Failed to restore wallet:', error);
      throw error;
    }
  }, []);

  // 지갑 연결 해제
  const disconnectWallet = useCallback(() => {
    setWallet(null);
    setIsConnected(false);
    setGlobalWallet(null);
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
// Global wallet instance for sharing across hooks
let globalWallet: Wallet | null = null;

export const setGlobalWallet = (wallet: Wallet | null) => {
  globalWallet = wallet;
};

export const getGlobalWallet = () => globalWallet;

export const useWalletBalance = (address?: string) => {
  const walletAddress = address || globalWallet?.address || import.meta.env.VITE_WALLET_ADDRESS;
  
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
    balance: balanceQuery.data?.[0]?.value ? parseFloat(balanceQuery.data[0].value) : 0,
    isLoading: balanceQuery.isLoading,
    error: balanceQuery.error,
    refreshBalance,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * 지갑 정보 조회 훅
 */
export const useWalletInfo = (address?: string) => {
  const walletAddress = address || globalWallet?.address || import.meta.env.VITE_WALLET_ADDRESS;

  return useQuery<WalletInfo, Error>({
    queryKey: ['wallet-info', walletAddress],
    queryFn: async () => {
      if (!walletAddress) throw new Error('Wallet address not found');
      const accountInfo = await xrplService.getAccountInfo(walletAddress);
      const balanceData = await xrplService.getBalance(walletAddress);
      const balance = parseFloat(balanceData[0]?.value || '0');
      
      return {
        address: accountInfo.account,
        balance,
        sequence: accountInfo.sequence
      };
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
  const walletAddress = globalWallet?.address || import.meta.env.VITE_WALLET_ADDRESS;

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
      if (!globalWallet && !import.meta.env.VITE_WALLET_SEED) {
        throw new Error('Wallet not connected');
      }
      const walletSeed = import.meta.env.VITE_WALLET_SEED;
      const fromAddress = globalWallet?.address || import.meta.env.VITE_WALLET_ADDRESS;
      
      return await xrplService.sendXRP({
        fromAddress,
        toAddress,
        amount,
        memo
      }, walletSeed);
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
  const walletAddress = address || globalWallet?.address || import.meta.env.VITE_WALLET_ADDRESS;

  const transactionsQuery = useQuery<Transaction[], Error>({
    queryKey: ['wallet-transactions', walletAddress, limit],
    queryFn: async () => {
      if (!walletAddress) throw new Error('Wallet address not found');
      const history = await xrplService.getTransactionHistory(walletAddress, limit);
      
      return history.transactions.map((tx: any) => {
        const transaction = tx.transaction;
        
        let type: Transaction['type'] = 'received';
        if (transaction.Account === walletAddress) {
          type = 'sent';
        }
        
        const memo = transaction.Memos?.[0]?.Memo?.MemoData 
          ? Buffer.from(transaction.Memos[0].Memo.MemoData, 'hex').toString('utf-8')
          : undefined;
          
        if (memo?.includes('dues')) {
          type = 'dues';
        } else if (memo?.includes('expense')) {
          type = 'expense';
        }
        
        return {
          hash: transaction.hash || tx.hash,
          type,
          amount: parseFloat(transaction.Amount) / 1000000,
          from: transaction.Account,
          to: transaction.Destination || '',
          memo,
          timestamp: new Date(transaction.date * 1000 + 946684800000).toISOString(),
          status: tx.validated ? 'confirmed' : 'pending'
        } as Transaction;
      });
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
  const walletAddress = globalWallet?.address || import.meta.env.VITE_WALLET_ADDRESS;

  return useMutation({
    mutationFn: async (address?: string) => {
      const targetAddress = address || walletAddress;
      if (!targetAddress) throw new Error('Wallet address not found');
      
      return await xrplService.fundWallet(targetAddress);
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
    return isValidAddress(address);
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
      hasValidAddress: wallet ? isValidAddress(wallet.address) : false,
      isStoredSecurely: !!import.meta.env.VITE_WALLET_SEED, // 환경 변수 체크
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
      const connected = !!globalWallet || !!import.meta.env.VITE_WALLET_SEED;
      const currentAddress = globalWallet?.address || import.meta.env.VITE_WALLET_ADDRESS || null;
      
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
    checkConnection: () => !!globalWallet || !!import.meta.env.VITE_WALLET_SEED
  };
};