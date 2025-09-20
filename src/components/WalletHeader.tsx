import React, { useState } from 'react';
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  ChevronDown, 
  RefreshCw, 
  Settings,
  LogOut,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useWallet, useWalletBalance } from '../hooks/useWallet';
import { useXRPLConnection } from '../hooks/useXRPL';

interface WalletHeaderProps {
  className?: string;
  showBalance?: boolean;
  showNetworkStatus?: boolean;
  compact?: boolean;
}

export const WalletHeader: React.FC<WalletHeaderProps> = ({
  className,
  showBalance = true,
  showNetworkStatus = true,
  compact = false
}) => {
  const { wallet, isConnected, disconnectWallet } = useWallet();
  const { balance, isLoading: balanceLoading, refreshBalance } = useWalletBalance();
  const { connectionStatus, disconnect } = useXRPLConnection();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showBalanceValue, setShowBalanceValue] = useState(true);

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(balance);
  };

  const copyAddress = async () => {
    if (!wallet?.address) return;
    
    try {
      await navigator.clipboard.writeText(wallet.address);
      toast.success('주소가 클립보드에 복사되었습니다');
    } catch (error) {
      toast.error('주소 복사에 실패했습니다');
    }
  };

  const openInExplorer = () => {
    if (!wallet?.address) return;
    
    // XRPL Devnet Explorer
    const explorerUrl = `https://devnet.xrpl.org/accounts/${wallet.address}`;
    window.open(explorerUrl, '_blank');
  };


  const handleDisconnect = async () => {
    try {
      await disconnect();
      disconnectWallet();
      toast.success('지갑 연결이 해제되었습니다');
    } catch (error) {
      toast.error('연결 해제에 실패했습니다');
    }
  };

  const handleRefreshBalance = async () => {
    try {
      await refreshBalance();
      toast.success('잔액이 업데이트되었습니다');
    } catch (error) {
      toast.error('잔액 업데이트에 실패했습니다');
    }
  };

  if (!isConnected || !wallet) {
    return (
      <div className={cn(
        'flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg',
        className
      )}>
        <Wallet className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">지갑이 연결되지 않음</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn(
        'flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border',
        className
      )}>
        {/* Network Status */}
        {showNetworkStatus && (
          <div className="flex items-center space-x-1">
            <div className={cn(
              'w-2 h-2 rounded-full',
              connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className="text-xs text-gray-500">DEVNET</span>
          </div>
        )}
        
        {/* Wallet Info */}
        <div className="flex items-center space-x-2">
          <Wallet className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">
            {formatAddress(wallet.address)}
          </span>
        </div>

        {/* Balance */}
        {showBalance && (
          <div className="flex items-center space-x-1">
            <span className="text-sm font-semibold text-green-600">
              {showBalanceValue ? `${formatBalance(balance)} XRP` : '••••••'}
            </span>
            <button
              onClick={() => setShowBalanceValue(!showBalanceValue)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {showBalanceValue ? (
                <Eye className="w-3 h-3 text-gray-400" />
              ) : (
                <EyeOff className="w-3 h-3 text-gray-400" />
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 px-4 py-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors w-full"
      >
        {/* Network Status */}
        {showNetworkStatus && (
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-3 h-3 rounded-full',
              connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className="text-sm text-gray-600">DEVNET</span>
          </div>
        )}

        {/* Wallet Icon */}
        <div className="flex items-center space-x-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900">
              {formatAddress(wallet.address)}
            </div>
            {showBalance && (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">
                  {balanceLoading ? '로딩 중...' : showBalanceValue ? `${formatBalance(balance)} XRP` : '••••••'}
                </span>
              </div>
            )}
          </div>
        </div>

        <ChevronDown className={cn(
          'w-4 h-4 text-gray-400 transition-transform ml-auto',
          showDropdown && 'transform rotate-180'
        )} />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border shadow-lg z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">지갑 주소</span>
              <button
                onClick={copyAddress}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                <Copy className="w-3 h-3" />
                <span>복사</span>
              </button>
            </div>
            <div className="text-xs font-mono text-gray-600 break-all">
              {wallet.address}
            </div>
          </div>

          {showBalance && (
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">XRP 잔액</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setShowBalanceValue(!showBalanceValue)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {showBalanceValue ? (
                      <Eye className="w-3 h-3 text-gray-400" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={handleRefreshBalance}
                    disabled={balanceLoading}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn('w-3 h-3', balanceLoading && 'animate-spin')} />
                    <span>새로고침</span>
                  </button>
                </div>
              </div>
              <div className="text-lg font-semibold text-green-600">
                {balanceLoading ? '로딩 중...' : showBalanceValue ? `${formatBalance(balance)} XRP` : '••••••'}
              </div>
            </div>
          )}

          <div className="p-2">
            <button
              onClick={openInExplorer}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>탐색기에서 보기</span>
            </button>
            
            <button
              onClick={() => {/* TODO: 테스트넷 펀딩 기능 */}}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>테스트넷 XRP 받기</span>
            </button>

            <button
              onClick={() => {/* TODO: 지갑 설정 */}}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>지갑 설정</span>
            </button>

            <div className="border-t mt-1 pt-1">
              <button
                onClick={handleDisconnect}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>지갑 연결 해제</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletHeader;