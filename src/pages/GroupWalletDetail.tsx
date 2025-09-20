import React from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft,
  Settings,
  Eye,
  EyeOff,
  Home,
  CreditCard,
  Globe
} from 'lucide-react';
import { TransactionList } from '../components/TransactionList';

const GroupWalletDetail: React.FC = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = React.useState(true);

  const mockTransactions = [
    { id: 1, type: 'incoming', amount: 500, description: 'Payment History 1', date: '2025-09-20', hash: 'tx1' },
    { id: 2, type: 'outgoing', amount: 200, description: 'Payment History 2', date: '2025-09-20', hash: 'tx2' },
    { id: 3, type: 'incoming', amount: 300, description: 'Payment History 3', date: '2025-09-20', hash: 'tx3' }
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
        <h1 className="text-lg font-bold text-gray-900">Go Back</h1>
        <button 
          onClick={() => navigate('/group/settings')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Wallet Balance */}
        <div className="bg-[#509AD6]/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Study Abroad Wallet</h2>
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
          <div className="text-2xl font-bold text-[#509AD6]">
            {showBalance ? '10 RLUSD' : '****'}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
          
          <div className="space-y-3">
            {mockTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-[#509AD6]/5 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-900 font-medium">{transaction.description}</div>
                    <div className="text-gray-600 text-sm">{transaction.date}</div>
                  </div>
                  <div className={`text-lg font-semibold ${
                    transaction.type === 'incoming' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'incoming' ? '+' : '-'}{transaction.amount.toLocaleString()} RLUSD
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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

export default GroupWalletDetail;