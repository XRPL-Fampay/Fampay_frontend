import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  XCircle,
  Filter,
  Search,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
  showSearch?: boolean;
  showFilter?: boolean;
  showDate?: boolean;
  className?: string;
  emptyMessage?: string;
  maxItems?: number;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isLoading = false,
  onTransactionClick,
  showSearch = false,
  showFilter = false,
  showDate = true,
  className,
  emptyMessage = '거래 내역이 없습니다.',
  maxItems
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterType, setFilterType] = React.useState<Transaction['type'] | 'all'>('all');

  const filteredTransactions = React.useMemo(() => {
    let filtered = transactions;

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.memo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 타입 필터
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    // 최대 개수 제한
    if (maxItems) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [transactions, searchTerm, filterType, maxItems]);

  const getTransactionIcon = (type: Transaction['type'], amount: number) => {
    switch (type) {
      case 'sent':
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      case 'received':
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'dues':
        return <ArrowUpRight className="w-5 h-5 text-blue-600" />;
      case 'expense':
        return <ArrowUpRight className="w-5 h-5 text-orange-600" />;
      default:
        return amount > 0 
          ? <ArrowDownLeft className="w-5 h-5 text-green-600" />
          : <ArrowUpRight className="w-5 h-5 text-red-600" />;
    }
  };

  const getTransactionTitle = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'sent':
        return '송금';
      case 'received':
        return '수신';
      case 'dues':
        return '회비 납부';
      case 'expense':
        return '지출';
      default:
        return '거래';
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatAmount = (amount: number, type: Transaction['type']) => {
    const prefix = type === 'received' ? '+' : '-';
    return `${prefix}${new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(Math.abs(amount))}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffHours < 24 * 7) {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      });
    } else {
      return date.toLocaleDateString('ko-KR', { 
        year: '2-digit', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-lg animate-pulse">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
            <div className="text-right space-y-2">
              <div className="h-4 bg-gray-300 rounded w-16"></div>
              <div className="h-3 bg-gray-300 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filter */}
      {(showSearch || showFilter) && (
        <div className="space-y-3">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="거래 내역 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {showFilter && (
            <div className="flex space-x-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as Transaction['type'] | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">모든 거래</option>
                <option value="received">수신</option>
                <option value="sent">송금</option>
                <option value="dues">회비</option>
                <option value="expense">지출</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.hash}
              transaction={transaction}
              onClick={onTransactionClick}
              showDate={showDate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
  showDate?: boolean;
  className?: string;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onClick,
  showDate = true,
  className
}) => {
  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'sent':
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      case 'received':
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'dues':
        return <ArrowUpRight className="w-5 h-5 text-blue-600" />;
      case 'expense':
        return <ArrowUpRight className="w-5 h-5 text-orange-600" />;
      default:
        return <ArrowUpRight className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionTitle = (transaction: Transaction) => {
    if (transaction.memo) {
      return transaction.memo.length > 20 
        ? `${transaction.memo.slice(0, 20)}...`
        : transaction.memo;
    }

    switch (transaction.type) {
      case 'sent':
        return '송금';
      case 'received':
        return '수신';
      case 'dues':
        return '회비 납부';
      case 'expense':
        return '지출';
      default:
        return '거래';
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatAmount = (amount: number, type: Transaction['type']) => {
    const isIncoming = type === 'received';
    const prefix = isIncoming ? '+' : '-';
    const colorClass = isIncoming ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={`font-semibold ${colorClass}`}>
        {prefix}{new Intl.NumberFormat('ko-KR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6
        }).format(Math.abs(amount))} XRP
      </span>
    );
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}시간 전`;
    } else if (diffHours < 24 * 7) {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      });
    } else {
      return date.toLocaleDateString('ko-KR', { 
        year: '2-digit', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div 
      className={cn(
        'flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200',
        'transition-all duration-200 hover:shadow-md hover:border-gray-300',
        onClick && 'cursor-pointer hover:bg-gray-50',
        className
      )}
      onClick={() => onClick?.(transaction)}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {getTransactionIcon(transaction.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="font-medium text-gray-900 truncate">
            {getTransactionTitle(transaction)}
          </p>
          {getStatusIcon(transaction.status)}
        </div>
        
        <div className="flex items-center space-x-2 mt-1">
          <p className="text-sm text-gray-500">
            {transaction.type === 'sent' ? '받는 사람' : '보낸 사람'}: {formatAddress(
              transaction.type === 'sent' ? transaction.to : transaction.from
            )}
          </p>
          {showDate && (
            <>
              <span className="text-gray-300">•</span>
              <p className="text-sm text-gray-500">
                {formatDate(transaction.timestamp)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Amount and Arrow */}
      <div className="flex items-center space-x-2">
        <div className="text-right">
          <div className="text-base">
            {formatAmount(transaction.amount, transaction.type)}
          </div>
        </div>
        
        {onClick && (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </div>
    </div>
  );
};

interface TransactionSummaryProps {
  transactions: Transaction[];
  period?: 'today' | 'week' | 'month';
  className?: string;
}

export const TransactionSummary: React.FC<TransactionSummaryProps> = ({
  transactions,
  period = 'month',
  className
}) => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      const weekStart = now.getDate() - now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), weekStart);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  const periodTransactions = transactions.filter(tx => 
    new Date(tx.timestamp) >= startDate
  );

  const summary = {
    totalIncoming: 0,
    totalOutgoing: 0,
    duesTotal: 0,
    transactionCount: periodTransactions.length
  };

  periodTransactions.forEach(tx => {
    if (tx.type === 'received') {
      summary.totalIncoming += tx.amount;
    } else if (tx.type === 'sent' || tx.type === 'dues' || tx.type === 'expense') {
      summary.totalOutgoing += tx.amount;
    }
    
    if (tx.type === 'dues') {
      summary.duesTotal += tx.amount;
    }
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today':
        return '오늘';
      case 'week':
        return '이번 주';
      case 'month':
        return '이번 달';
    }
  };

  return (
    <div className={cn('bg-white p-4 rounded-lg border border-gray-200', className)}>
      <h3 className="font-semibold text-gray-900 mb-4">
        {getPeriodLabel()} 거래 요약
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">수신</p>
          <p className="text-lg font-semibold text-green-600">
            +{formatAmount(summary.totalIncoming)} XRP
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">송금</p>
          <p className="text-lg font-semibold text-red-600">
            -{formatAmount(summary.totalOutgoing)} XRP
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">회비 납부</p>
          <p className="text-lg font-semibold text-blue-600">
            {formatAmount(summary.duesTotal)} XRP
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">거래 횟수</p>
          <p className="text-lg font-semibold text-gray-900">
            {summary.transactionCount}회
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionList;