import React from 'react';
import { useNavigate } from 'react-router';
import { 
  RefreshCw, 
  Send, 
  Plus, 
  TrendingUp, 
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Eye,
  EyeOff,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useDashboard, useGroup } from '../hooks/useGroup';
import { useWalletBalance } from '../hooks/useWallet';
import BalanceCard from '../components/BalanceCard';
import { MemberList } from '../components/MemberCard';
import { TransactionList } from '../components/TransactionList';
import { MainLayout, PageContainer } from '../layouts/MainLayout';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardData, isLoading, refetch } = useDashboard();
  const { currentGroup, isHost } = useGroup();
  const { balance: myBalance, refreshBalance } = useWalletBalance();
  
  const [showBalance, setShowBalance] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        refreshBalance()
      ]);
      toast.success('데이터가 새로고침되었습니다.');
    } catch (error) {
      toast.error('새로고침에 실패했습니다.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleMemberClick = (member: any) => {
    navigate(`/dues?to=${member.memberId}`, {
      state: { member }
    });
  };

  const handleSendMoney = (member: any) => {
    navigate('/send', {
      state: { 
        toAddress: member.walletAddress,
        toName: member.nickname
      }
    });
  };

  const handleTransactionClick = (transaction: any) => {
    navigate(`/transaction/${transaction.hash}`);
  };

  const quickActions = [
    {
      label: '회비 납부',
      icon: Plus,
      path: '/dues',
      color: 'bg-blue-600 hover:bg-blue-700',
      description: '월회비, 특별회비 납부'
    },
    {
      label: '송금',
      icon: Send,
      path: '/send',
      color: 'bg-green-600 hover:bg-green-700',
      description: '멤버에게 송금'
    },
    {
      label: '정기회비',
      icon: RefreshCw,
      path: '/escrow',
      color: 'bg-purple-600 hover:bg-purple-700',
      description: '자동 회비 설정'
    }
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <PageContainer>
          <div className="space-y-6">
            {/* Loading Skeleton */}
            <div className="animate-pulse">
              <div className="h-32 bg-gray-300 rounded-xl mb-6"></div>
              <div className="h-20 bg-gray-300 rounded-lg mb-6"></div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-300 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {currentGroup?.name || '모임통장'}
              </h1>
              <p className="text-sm text-gray-500">
                {isHost ? '운영진' : '멤버'} • {currentGroup?.members.length || 0}명
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showBalance ? (
                  <Eye className="w-5 h-5 text-gray-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-600" />
                )}
              </button>
              
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
              
              {isHost && (
                <button
                  onClick={() => navigate('/settings')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Balance Cards */}
          <div className="space-y-4">
            {/* Group Total Balance */}
            <BalanceCard
              balance={showBalance ? (dashboardData?.groupBalance || 0) : 0}
              title="그룹 총 잔액"
              subtitle={`${currentGroup?.members.length || 0}명의 멤버`}
              gradient="green"
              size="lg"
              showHideToggle={false}
              showTrend={false}
              onClick={() => navigate('/group/balance')}
            />

            {/* My Balance */}
            <BalanceCard
              balance={showBalance ? myBalance : 0}
              title="내 잔액"
              subtitle="사용 가능한 금액"
              gradient="blue"
              size="md"
              showHideToggle={false}
              onClick={() => navigate('/wallet/balance')}
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">빠른 기능</h3>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className={cn(
                    'flex flex-col items-center space-y-2 p-4 rounded-lg text-white transition-colors',
                    action.color
                  )}
                >
                  <action.icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Group Members */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>그룹 멤버</span>
              </h3>
              <button
                onClick={() => navigate('/group/members')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                전체보기
              </button>
            </div>
            
            <MemberList
              members={dashboardData?.members.slice(0, 3) || []}
              currentUserAddress={currentGroup?.hostWalletAddress}
              hostAddress={currentGroup?.hostWalletAddress}
              onMemberClick={handleMemberClick}
              onSendMoney={handleSendMoney}
              showBalance={showBalance}
              showActions={true}
            />
            
            {(dashboardData?.members.length || 0) > 3 && (
              <button
                onClick={() => navigate('/group/members')}
                className="w-full mt-3 text-sm text-gray-600 hover:text-gray-800 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                +{(dashboardData?.members.length || 0) - 3}명 더보기
              </button>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>최근 거래</span>
              </h3>
              <button
                onClick={() => navigate('/transactions')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                전체보기
              </button>
            </div>
            
            <TransactionList
              transactions={dashboardData?.recentTransactions || []}
              isLoading={isLoading}
              onTransactionClick={handleTransactionClick}
              maxItems={5}
              showSearch={false}
              showFilter={false}
              emptyMessage="아직 거래 내역이 없습니다."
            />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">이번 달 회비</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Intl.NumberFormat('ko-KR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2
                    }).format(
                      dashboardData?.recentTransactions
                        ?.filter(tx => tx.type === 'dues')
                        ?.reduce((sum, tx) => sum + tx.amount, 0) || 0
                    )} XRP
                  </p>
                </div>
                <ArrowUpRight className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 거래 횟수</p>
                  <p className="text-lg font-bold text-gray-900">
                    {dashboardData?.recentTransactions?.length || 0}회
                  </p>
                </div>
                <ArrowDownLeft className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Bell className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  알림
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  새로운 멤버가 참여했습니다. 정기 회비 설정을 확인해보세요.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Spacing for Navigation */}
          <div className="pb-20"></div>
        </div>
      </PageContainer>
    </MainLayout>
  );
};

export default Dashboard;