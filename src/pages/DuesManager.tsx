import React from 'react';
import { useNavigate } from 'react-router';
import { 
  RefreshCw, 
  Plus, 
  Calendar, 
  Settings, 
  Trash2,
  Clock,
  CheckCircle,
  Pause,
  Play,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import PaymentService from '../services/paymentService';
import { PageHeader, PageContainer } from '../layouts/MainLayout';
import type { EscrowDetails } from '../types';

export const DuesManager: React.FC = () => {
  const navigate = useNavigate();
  
  // Redirect to new staking manager
  React.useEffect(() => {
    navigate('/staking', { replace: true });
  }, [navigate]);

  const [dues, setDues] = React.useState<EscrowDetails[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [cancelling, setCancelling] = React.useState<string | null>(null);

  const fetchDues = React.useCallback(async () => {
    try {
      const duesList = await PaymentService.getRecurringDuesList();
      setDues(duesList);
    } catch (error) {
      console.error('Failed to fetch dues:', error);
      toast.error('정기 회비 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDues();
  }, [fetchDues]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDues();
      toast.success('목록이 새로고침되었습니다.');
    } catch (error) {
      toast.error('새로고침에 실패했습니다.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelDues = async (escrowId: string, duesType: string) => {
    if (!confirm(`${getDuesTypeLabel(duesType)} 정기 회비를 취소하시겠습니까?`)) {
      return;
    }

    setCancelling(escrowId);
    try {
      await PaymentService.cancelRecurringDues(escrowId);
      await fetchDues();
      toast.success('정기 회비가 취소되었습니다.');
    } catch (error) {
      toast.error('정기 회비 취소에 실패했습니다.');
      console.error('Failed to cancel dues:', error);
    } finally {
      setCancelling(null);
    }
  };

  const getDuesTypeLabel = (type: string) => {
    switch (type) {
      case 'monthly':
        return '월 회비';
      case 'special':
        return '특별 회비';
      case 'event':
        return '행사비';
      default:
        return '회비';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return '매일';
      case 'weekly':
        return '매주';
      case 'monthly':
        return '매월';
      default:
        return frequency;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  const getNextExecutionStatus = (nextExecution: string) => {
    const now = new Date();
    const executeDate = new Date(nextExecution);
    const diffMs = executeDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffMs < 0) {
      return { status: 'overdue', text: '실행 예정', color: 'text-red-600' };
    } else if (diffHours < 24) {
      return { 
        status: 'soon', 
        text: `${Math.floor(diffHours)}시간 후`, 
        color: 'text-orange-600' 
      };
    } else if (diffDays < 7) {
      return { 
        status: 'upcoming', 
        text: `${Math.floor(diffDays)}일 후`, 
        color: 'text-blue-600' 
      };
    } else {
      return { 
        status: 'scheduled', 
        text: formatDate(nextExecution), 
        color: 'text-gray-600' 
      };
    }
  };

  const getDuesTypeIcon = (type: string) => {
    switch (type) {
      case 'monthly':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'special':
        return <Settings className="w-5 h-5 text-purple-600" />;
      case 'event':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <RefreshCw className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader 
          title="정기 회비 관리" 
          subtitle="자동 회비 설정을 관리하세요"
          backButton
        />
        
        <PageContainer>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader 
        title="정기 회비 관리" 
        subtitle="자동 회비 설정을 관리하세요"
        backButton
        action={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={cn(
              'p-2 hover:bg-gray-100 rounded-lg transition-all',
              refreshing && 'animate-spin'
            )}
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        }
      />
      
      <PageContainer>
        <div className="space-y-6">
          {/* Add New Button */}
          <button
            onClick={() => navigate('/dues')}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>새 정기 회비 설정</span>
          </button>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">활성 설정</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {dues.filter(d => d.isActive).length}개
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">총 금액</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(dues.reduce((sum, d) => sum + d.amount, 0))} XRP
              </p>
            </div>
          </div>

          {/* Dues List */}
          {dues.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                설정된 정기 회비가 없습니다
              </h3>
              <p className="text-gray-600 mb-6">
                정기적으로 자동 납부되는 회비를 설정해보세요.
              </p>
              <button
                onClick={() => navigate('/dues')}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                첫 번째 정기 회비 설정하기
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {dues.map((duesItem) => {
                const nextStatus = getNextExecutionStatus(duesItem.nextExecution);
                
                return (
                  <div
                    key={duesItem.escrowId}
                    className={cn(
                      'bg-white rounded-lg p-6 border-2 transition-colors',
                      duesItem.isActive 
                        ? 'border-gray-200 hover:border-gray-300' 
                        : 'border-gray-100 bg-gray-50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          {getDuesTypeIcon(duesItem.duesType)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {getDuesTypeLabel(duesItem.duesType)}
                            </h3>
                            {!duesItem.isActive && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                비활성
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-2xl font-bold text-gray-900">
                              {formatAmount(duesItem.amount)} XRP
                            </p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center space-x-1">
                                <RefreshCw className="w-4 h-4" />
                                <span>{getFrequencyLabel(duesItem.frequency)}</span>
                              </span>
                              
                              <span className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span className={nextStatus.color}>
                                  {nextStatus.text}
                                </span>
                              </span>
                            </div>

                            {duesItem.memo && (
                              <p className="text-sm text-gray-500 mt-2">
                                {duesItem.memo}
                              </p>
                            )}

                            <p className="text-xs text-gray-400">
                              생성일: {formatDate(duesItem.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {duesItem.isActive && nextStatus.status === 'overdue' && (
                          <div className="p-1">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleCancelDues(duesItem.escrowId, duesItem.duesType)}
                          disabled={cancelling === duesItem.escrowId}
                          className={cn(
                            'p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors',
                            cancelling === duesItem.escrowId && 'opacity-50 cursor-not-allowed'
                          )}
                          title="정기 회비 취소"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Status Bar */}
                    {duesItem.isActive && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">다음 실행</span>
                          <span className={cn('font-medium', nextStatus.color)}>
                            {formatDate(duesItem.nextExecution)}
                          </span>
                        </div>
                        
                        {/* Progress bar for upcoming payments */}
                        {nextStatus.status === 'soon' && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: '75%' }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  정기 회비 안내
                </p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• 설정된 주기마다 자동으로 회비가 납부됩니다</li>
                  <li>• 잔액이 부족한 경우 자동 납부가 실패할 수 있습니다</li>
                  <li>• 언제든지 정기 회비를 취소할 수 있습니다</li>
                  <li>• 실행 24시간 전에 알림을 받을 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Spacing */}
          <div className="pb-20"></div>
        </div>
      </PageContainer>
    </div>
  );
};

export default DuesManager;