import React from 'react';
import { useNavigate } from 'react-router';
import { 
  TrendingUp,
  Plus,
  Settings,
  Trash2,
  Clock,
  CheckCircle,
  Pause,
  Play,
  AlertCircle,
  Users,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useWalletBalance } from '../hooks/useWallet';
import { PageHeader, PageContainer } from '../layouts/MainLayout';

interface StakingPool {
  id: string;
  amount: number;
  apy: number;
  duration: number; // in days
  approvals: string[];
  requiredApprovals: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
}

export const StakingManager: React.FC = () => {
  const navigate = useNavigate();
  const { balance } = useWalletBalance();
  
  const [stakingPools, setStakingPools] = React.useState<StakingPool[]>([
    {
      id: '1',
      amount: 1000,
      apy: 8.5,
      duration: 30,
      approvals: ['member1', 'member2'],
      requiredApprovals: 3,
      isActive: true,
      startDate: '2024-01-15',
      endDate: '2024-02-14',
      createdAt: '2024-01-10',
      status: 'active'
    },
    {
      id: '2',
      amount: 500,
      apy: 12.0,
      duration: 90,
      approvals: ['member1'],
      requiredApprovals: 3,
      isActive: false,
      createdAt: '2024-01-12',
      status: 'pending'
    }
  ]);
  
  const [isLoading, setIsLoading] = React.useState(false);

  const totalStaked = stakingPools
    .filter(pool => pool.status === 'active')
    .reduce((sum, pool) => sum + pool.amount, 0);

  const estimatedYearlyReward = stakingPools
    .filter(pool => pool.status === 'active')
    .reduce((sum, pool) => sum + (pool.amount * pool.apy / 100), 0);

  const handleCancelStaking = async (poolId: string) => {
    if (!confirm('Are you sure you want to cancel this staking pool?')) {
      return;
    }

    setStakingPools(prev => 
      prev.map(pool => 
        pool.id === poolId 
          ? { ...pool, status: 'cancelled' as const }
          : pool
      )
    );
    toast.success('Staking pool cancelled successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Pending Approval';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader 
          title="Staking Management" 
          subtitle="Manage your RLUSD staking pools"
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
        title="Staking Management" 
        subtitle="Manage your RLUSD staking pools"
        backButton
      />
      
      <PageContainer>
        <div className="space-y-6">
          {/* Create New Staking Button */}
          <button
            onClick={() => navigate('/staking/new')}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Staking Pool</span>
          </button>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Total Staked</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalStaked.toLocaleString()} RLUSD
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Yearly Rewards</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {estimatedYearlyReward.toFixed(2)} RLUSD
              </p>
            </div>
          </div>

          {/* Available Balance */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Available for Staking</p>
                <p className="text-2xl font-bold text-blue-900">{balance.toFixed(2)} RLUSD</p>
              </div>
              <div className="text-blue-600">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Staking Pools List */}
          {stakingPools.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Staking Pools Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first staking pool to start earning rewards.
              </p>
              <button
                onClick={() => navigate('/staking/new')}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create Your First Staking Pool
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {stakingPools.map((pool) => (
                <div
                  key={pool.id}
                  className="bg-white rounded-lg p-6 border-2 border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            Staking Pool #{pool.id}
                          </h3>
                          <span className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                            getStatusColor(pool.status)
                          )}>
                            {getStatusLabel(pool.status)}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-2xl font-bold text-gray-900">
                            {pool.amount.toLocaleString()} RLUSD
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="w-4 h-4" />
                              <span>APY: {pool.apy}%</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{pool.duration} days</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{pool.approvals.length}/{pool.requiredApprovals} approvals</span>
                            </div>
                            
                            {pool.endDate && (
                              <div className="flex items-center space-x-1">
                                <AlertCircle className="w-4 h-4" />
                                <span>{calculateDaysRemaining(pool.endDate)} days left</span>
                              </div>
                            )}
                          </div>

                          {pool.status === 'active' && pool.endDate && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{formatDate(pool.endDate)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${Math.max(10, 100 - (calculateDaysRemaining(pool.endDate) / pool.duration * 100))}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-gray-400">
                            Created: {formatDate(pool.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {pool.status === 'pending' && (
                        <div className="p-1">
                          <Clock className="w-4 h-4 text-yellow-600" />
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleCancelStaking(pool.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancel Staking Pool"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Staking Information
                </p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Staking rewards are calculated annually (APY)</li>
                  <li>• Member approval is required before staking activation</li>
                  <li>• Funds are locked for the specified duration</li>
                  <li>• Early withdrawal may result in penalty fees</li>
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

export default StakingManager;