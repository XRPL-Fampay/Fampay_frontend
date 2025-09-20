import React from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft,
  Eye,
  EyeOff,
  ArrowUpRight,
  Home,
  CreditCard,
  Globe
} from 'lucide-react';

const GroupWalletList: React.FC = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = React.useState(true);

  const groupWallets = [
    { id: 1, name: '월렛 이름1', balance: 1000 },
    { id: 2, name: '월렛 이름2', balance: 2500 },
    { id: 3, name: '월렛 이름3', balance: 800 },
    { id: 4, name: '월렛 이름4', balance: 3200 },
    { id: 5, name: '월렛 이름5', balance: 1800 }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">그룹 월렛 리스트</h1>
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          {showBalance ? (
            <Eye className="w-5 h-5 text-gray-600" />
          ) : (
            <EyeOff className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Wallet List */}
      <div className="p-4 space-y-3 max-w-md mx-auto">
        {groupWallets.map((wallet) => (
          <button
            key={wallet.id}
            onClick={() => navigate(`/group/detail/${wallet.id}`)}
            className="w-full bg-white rounded-xl p-4 text-left hover:bg-gray-50 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-900 font-semibold text-lg">{wallet.name}</div>
                <div className="text-[#509AD6] text-sm font-medium mt-1">
                  {showBalance ? `잔액: ${wallet.balance.toLocaleString()} RLUSD` : '****'}
                </div>
              </div>
              <ArrowUpRight className="w-6 h-6 text-gray-400" />
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto flex">
          <button 
            onClick={() => navigate('/')}
            className="flex-1 flex flex-col items-center py-3 px-4 text-gray-500 hover:bg-gray-50"
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-sm font-medium">Home</span>
          </button>
          <button className="flex-1 flex flex-col items-center py-3 px-4 bg-[#509AD6] text-white">
            <CreditCard className="w-5 h-5 mb-1" />
            <span className="text-sm font-medium">Payment</span>
          </button>
          <button 
            onClick={() => navigate('/dues')}
            className="flex-1 flex flex-col items-center py-3 px-4 text-gray-500 hover:bg-gray-50"
          >
            <Globe className="w-5 h-5 mb-1" />
            <span className="text-sm font-medium">Staking</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupWalletList;