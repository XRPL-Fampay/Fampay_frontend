import React from 'react';
import { useNavigate } from 'react-router';
import { 
  Eye,
  EyeOff,
  Plus,
  ArrowUpRight,
  Wallet,
  Users,
  Settings,
  RefreshCw,
  Home,
  CreditCard,
  Globe
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDashboard, useGroup } from '../../hooks/useGroup';
import { useWalletBalance } from '../../hooks/useWallet';
import { TransactionList } from '../../components/TransactionList';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardData, isLoading, refetch } = useDashboard();
  const { currentGroup } = useGroup();
  const { balance: myBalance } = useWalletBalance();
  
  const [showBalance, setShowBalance] = React.useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-300 rounded-xl mb-4"></div>
            <div className="h-32 bg-gray-300 rounded-xl mb-4"></div>
            <div className="h-48 bg-gray-300 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Moim Wallet</h1>
        </div>
        <button 
          onClick={() => navigate('/settings')}
          className="p-2 bg-gray-100 rounded-lg"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Balance Section */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">잔액 표시</span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1"
            >
              {showBalance ? (
                <Eye className="w-4 h-4 text-gray-500" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {showBalance ? `${myBalance.toFixed(2)} RLUSD` : '****'}
          </div>
        </div>

        {/* Group Wallet List */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">그룹 월렛 리스트</h2>
            <button
              onClick={() => navigate('/group/new')}
              className="w-8 h-8 bg-[#509AD6] rounded-lg flex items-center justify-center"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
          
          <div className="space-y-3">
            {[1, 2, 3].map((index) => (
              <button
                key={index}
                onClick={() => navigate(`/group/detail/${index}`)}
                className="w-full bg-[#509AD6]/10 rounded-lg p-4 text-left hover:bg-[#509AD6]/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-900 font-medium">월렛 이름{index}</div>
                    <div className="text-gray-600 text-sm">
                      {showBalance ? `잔액: ${(1000 * index).toLocaleString()} RLUSD` : '****'}
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 거래내역</h2>
          <TransactionList
            transactions={dashboardData?.recentTransactions || []}
            isLoading={isLoading}
            onTransactionClick={(tx) => navigate(`/transaction/${tx.hash}`)}
            maxItems={5}
            showSearch={false}
            showFilter={false}
            emptyMessage="거래 내역이 없습니다."
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto flex">
          <button className="flex-1 flex flex-col items-center py-3 px-4 bg-[#509AD6] text-white">
            <Home className="w-5 h-5 mb-1" />
            <span className="text-sm font-medium">Home</span>
          </button>
          <button 
            onClick={() => navigate('/group/list')}
            className="flex-1 flex flex-col items-center py-3 px-4 text-gray-500 hover:bg-gray-50"
          >
            <CreditCard className="w-5 h-5 mb-1" />
            <span className="text-sm font-medium">Payment</span>
          </button>
          <button 
            onClick={() => navigate('/dues')}
            className="flex-1 flex flex-col items-center py-3 px-4 text-gray-500 hover:bg-gray-50"
          >
            <Globe className="w-5 h-5 mb-1" />
            <span className="text-sm font-medium">All</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
