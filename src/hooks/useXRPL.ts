import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { xrplService } from '../services/xrpl';
import type { 
  XRPLConnectionStatus, 
  XRPLBalanceInfo, 
  XRPLWallet,
  XRPLTransactionHistory,
  XRPLPaymentParams 
} from '../types/xrpl';

/**
 * XRPL 연결 상태 관리 훅
 */
export const useXRPLConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<XRPLConnectionStatus>({
    isConnected: false,
    url: ''
  });

  const connect = useCallback(async () => {
    try {
      await xrplService.connect();
      setConnectionStatus(xrplService.getConnectionStatus());
    } catch (error) {
      setConnectionStatus({
        isConnected: false,
        url: xrplService.getConnectionStatus().url,
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await xrplService.disconnect();
      setConnectionStatus({
        isConnected: false,
        url: ''
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }, []);

  useEffect(() => {
    // 컴포넌트 마운트 시 자동 연결
    connect();

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionStatus,
    connect,
    disconnect,
    isConnected: connectionStatus.isConnected
  };
};

/**
 * 지갑 잔액 조회 훅
 */
export const useXRPLBalance = (address: string | null, enabled: boolean = true) => {
  return useQuery<XRPLBalanceInfo, Error>({
    queryKey: ['xrpl-balance', address],
    queryFn: async () => {
      if (!address) throw new Error('Address is required');
      return await xrplService.getBalance(address);
    },
    enabled: enabled && !!address,
    refetchInterval: 30000, // 30초마다 잔액 업데이트
    staleTime: 10000, // 10초간 캐시 유지
  });
};

/**
 * 거래 내역 조회 훅
 */
export const useXRPLTransactions = (
  address: string | null,
  limit: number = 20,
  enabled: boolean = true
) => {
  return useQuery<XRPLTransactionHistory, Error>({
    queryKey: ['xrpl-transactions', address, limit],
    queryFn: async () => {
      if (!address) throw new Error('Address is required');
      return await xrplService.getTransactionHistory(address, limit);
    },
    enabled: enabled && !!address,
    refetchInterval: 60000, // 1분마다 거래 내역 업데이트
    staleTime: 30000, // 30초간 캐시 유지
  });
};

/**
 * XRP 송금 훅
 */
export const useXRPLPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ params, senderSeed }: { 
      params: XRPLPaymentParams; 
      senderSeed: string;
    }) => {
      return await xrplService.sendXRP(params, senderSeed);
    },
    onSuccess: (data, variables) => {
      // 송금 성공 시 잔액 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['xrpl-balance', variables.params.fromAddress] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['xrpl-balance', variables.params.toAddress] 
      });
      
      // 거래 내역 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['xrpl-transactions', variables.params.fromAddress] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['xrpl-transactions', variables.params.toAddress] 
      });
    },
  });
};

/**
 * 지갑 생성 훅
 */
export const useCreateWallet = () => {
  return useMutation<XRPLWallet, Error>({
    mutationFn: async () => {
      return await xrplService.createWallet();
    },
  });
};

/**
 * 테스트넷 펀딩 훅
 */
export const useFundWallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: string) => {
      return await xrplService.fundWallet(address);
    },
    onSuccess: (data, address) => {
      // 펀딩 성공 시 잔액 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['xrpl-balance', address] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['xrpl-transactions', address] 
      });
    },
  });
};

/**
 * 계정 정보 조회 훅
 */
export const useXRPLAccountInfo = (address: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['xrpl-account-info', address],
    queryFn: async () => {
      if (!address) throw new Error('Address is required');
      return await xrplService.getAccountInfo(address);
    },
    enabled: enabled && !!address,
    staleTime: 60000, // 1분간 캐시 유지
  });
};

/**
 * 트랜잭션 상세 조회 훅
 */
export const useXRPLTransaction = (hash: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['xrpl-transaction', hash],
    queryFn: async () => {
      if (!hash) throw new Error('Transaction hash is required');
      return await xrplService.getTransaction(hash);
    },
    enabled: enabled && !!hash,
    staleTime: 300000, // 5분간 캐시 유지 (트랜잭션은 변경되지 않음)
  });
};

/**
 * 서버 정보 조회 훅
 */
export const useXRPLServerInfo = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['xrpl-server-info'],
    queryFn: async () => {
      return await xrplService.getServerInfo();
    },
    enabled,
    refetchInterval: 300000, // 5분마다 서버 정보 업데이트
    staleTime: 60000, // 1분간 캐시 유지
  });
};

/**
 * 주소 유효성 검사 훅
 */
export const useValidateAddress = () => {
  return useCallback((address: string): boolean => {
    return xrplService.isValidAddress(address);
  }, []);
};

/**
 * 복합 XRPL 데이터 조회 훅 (잔액 + 거래내역)
 */
export const useXRPLWalletData = (address: string | null, enabled: boolean = true) => {
  const balanceQuery = useXRPLBalance(address, enabled);
  const transactionsQuery = useXRPLTransactions(address, 10, enabled);
  const accountInfoQuery = useXRPLAccountInfo(address, enabled);

  return {
    balance: balanceQuery.data,
    transactions: transactionsQuery.data,
    accountInfo: accountInfoQuery.data,
    isLoading: balanceQuery.isLoading || transactionsQuery.isLoading || accountInfoQuery.isLoading,
    isError: balanceQuery.isError || transactionsQuery.isError || accountInfoQuery.isError,
    error: balanceQuery.error || transactionsQuery.error || accountInfoQuery.error,
    refetch: () => {
      balanceQuery.refetch();
      transactionsQuery.refetch();
      accountInfoQuery.refetch();
    }
  };
};

/**
 * 실시간 잔액 업데이트 훅
 */
export const useRealtimeBalance = (
  address: string | null,
  onBalanceChange?: (balance: number) => void
) => {
  const [isPolling, setIsPolling] = useState(false);
  const { data: balanceInfo, refetch } = useXRPLBalance(address, !!address);

  const startPolling = useCallback(() => {
    if (!address || isPolling) return;

    setIsPolling(true);
    const interval = setInterval(async () => {
      try {
        const result = await refetch();
        if (result.data && onBalanceChange) {
          onBalanceChange(result.data.balance);
        }
      } catch (error) {
        console.error('Balance polling error:', error);
      }
    }, 15000); // 15초마다 업데이트

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [address, isPolling, refetch, onBalanceChange]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (balanceInfo && onBalanceChange) {
      onBalanceChange(balanceInfo.balance);
    }
  }, [balanceInfo, onBalanceChange]);

  return {
    balance: balanceInfo?.balance || 0,
    isPolling,
    startPolling,
    stopPolling
  };
};

/**
 * XRPL 네트워크 상태 모니터링 훅
 */
export const useXRPLNetworkStatus = () => {
  const { data: serverInfo, isError, error } = useXRPLServerInfo();
  const { connectionStatus } = useXRPLConnection();

  const networkStatus = {
    isHealthy: connectionStatus.isConnected && !isError,
    lastLedger: serverInfo?.validated_ledger?.seq || 0,
    networkLoad: serverInfo?.load_factor || 0,
    uptime: serverInfo?.uptime || 0,
    error: error?.message || connectionStatus.error
  };

  return networkStatus;
};