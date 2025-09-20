import React from 'react';
import { useNavigate } from 'react-router';
import { 
  TrendingUp,
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Users,
  Clock,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useWalletBalance } from '../hooks/useWallet';
import { AmountInput, QuickAmountButtons } from '../components/NumberPad';
import { PageHeader, PageContainer } from '../layouts/MainLayout';

interface StakingForm {
  amount: string;
  duration: number; // in days
  apy: number;
}

interface GroupMember {
  id: string;
  address: string;
  nickname?: string;
  approvalRequested: boolean;
  approved: boolean;
}

export const CreateStaking: React.FC = () => {
  const navigate = useNavigate();
  const { balance, isLoading: balanceLoading } = useWalletBalance();
  
  const [formData, setFormData] = React.useState<StakingForm>({
    amount: '',
    duration: 30,
    apy: 8.5 // Hard-coded APY
  });
  
  // Mock group members - in real app, this would come from group data
  const [groupMembers, setGroupMembers] = React.useState<GroupMember[]>([
    {
      id: '1',
      address: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
      nickname: 'Alice',
      approvalRequested: false,
      approved: false
    },
    {
      id: '2', 
      address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      nickname: 'Bob',
      approvalRequested: false,
      approved: false
    },
    {
      id: '3',
      address: 'rDNzE9Q2JvJzd9eUKnbQZ7mEkFN5vfQ8Hf',
      nickname: 'Charlie',
      approvalRequested: false,
      approved: false
    }
  ]);
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [stakingSuccess, setStakingSuccess] = React.useState<{
    poolId: string;
    amount: number;
    apy: number;
    duration: number;
  } | null>(null);

  const durationOptions = [
    { value: 7, label: '7 Days', apy: 5.0 },
    { value: 30, label: '30 Days', apy: 8.5 },
    { value: 90, label: '90 Days', apy: 12.0 },
    { value: 180, label: '180 Days', apy: 15.5 },
    { value: 365, label: '1 Year', apy: 20.0 }
  ];

  const quickAmounts = [100, 500, 1000, 5000];

  const maxStakableAmount = React.useMemo(() => {
    return Math.min(10000, Math.max(0, balance - 1)); // Max 10,000 RLUSD, keep 1 RLUSD for fees
  }, [balance]);

  const selectedDuration = durationOptions.find(d => d.value === formData.duration);
  const estimatedReward = React.useMemo(() => {
    const amount = parseFloat(formData.amount) || 0;
    const apy = selectedDuration?.apy || 0;
    return (amount * apy / 100 * formData.duration / 365);
  }, [formData.amount, formData.duration, selectedDuration?.apy]);

  const handleAmountChange = (value: string) => {
    setFormData(prev => ({ ...prev, amount: value }));
  };

  const handleQuickAmountSelect = (amount: number) => {
    setFormData(prev => ({ ...prev, amount: amount.toString() }));
  };

  const handleDurationChange = (duration: number) => {
    const option = durationOptions.find(d => d.value === duration);
    if (option) {
      setFormData(prev => ({ 
        ...prev, 
        duration: duration,
        apy: option.apy 
      }));
    }
  };

  const handleRequestApproval = (memberId: string) => {
    setGroupMembers(prev => 
      prev.map(member => 
        member.id === memberId 
          ? { ...member, approvalRequested: true }
          : member
      )
    );
    toast.success('Approval request sent successfully!');
    
    // Auto-approve after 5 seconds
    setTimeout(() => {
      setGroupMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, approved: true }
            : member
        )
      );
      toast.success('Member approved the staking request!');
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    if (amount > maxStakableAmount) {
      if (balance >= amount + 1) {
        toast.error('Maximum staking amount is 10,000 RLUSD.');
      }
      return;
    }

    if (amount < 10) {
      toast.error('Minimum staking amount is 10 RLUSD.');
      return;
    }

    setIsSubmitting(true);

    try {
      const poolId = Math.random().toString(36).substring(2, 11);
      setStakingSuccess({
        poolId,
        amount,
        apy: formData.apy,
        duration: formData.duration
      });
      
      toast.success('Staking pool created successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create staking pool.';
      toast.error(errorMessage);
      console.error('Staking creation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      amount: '',
      duration: 30,
      apy: 8.5
    });
    setStakingSuccess(null);
  };


  // Success screen
  if (stakingSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader 
          title="Staking Created" 
          subtitle="Waiting for member approvals"
        />
        
        <PageContainer className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 w-full max-w-sm">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Staking Pool Created
              </h2>
              <p className="text-gray-600">
                {stakingSuccess.amount.toLocaleString()} RLUSD has been allocated for staking.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pool ID</span>
                <span className="font-mono text-gray-900">{stakingSuccess.poolId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">APY</span>
                <span className="font-semibold text-green-600">{stakingSuccess.apy}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Duration</span>
                <span className="text-gray-900">{stakingSuccess.duration} days</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader 
        title="Create Staking Pool" 
        subtitle="Stake your RLUSD and earn rewards"
        backButton
      />
      
      <PageContainer>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Input */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Staking Amount
            </label>
            
            <AmountInput
              value={formData.amount}
              onChange={handleAmountChange}
              currency="RLUSD"
              placeholder="0"
              maxLength={10}
              allowDecimal={true}
              showNumberPad={true}
              numberPadSize="md"
              disabled={isSubmitting}
              error={parseFloat(formData.amount) > maxStakableAmount && balance >= parseFloat(formData.amount) + 1 ? 
                'Maximum 10,000 RLUSD allowed' : 
                undefined}
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Quick Select
            </label>
            <QuickAmountButtons
              amounts={quickAmounts}
              onSelect={handleQuickAmountSelect}
              currentValue={formData.amount}
              currency="RLUSD"
              disabled={isSubmitting}
            />
          </div>

          {/* Duration Selection */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Staking Duration
            </label>
            <div className="grid grid-cols-1 gap-3">
              {durationOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors',
                    formData.duration === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="duration"
                      value={option.value}
                      checked={formData.duration === option.value}
                      onChange={() => handleDurationChange(option.value)}
                      className="hidden"
                    />
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                      formData.duration === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    )}>
                      {formData.duration === option.value && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{option.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{option.apy}% APY</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Group Members Approval */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm font-medium text-gray-700">
                Request Member Approvals
              </h3>
            </div>
            <div className="space-y-3">
              {groupMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {member.nickname || 'Member'}
                      </span>
                      {member.approved && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      {member.address.slice(0, 12)}...{member.address.slice(-8)}
                    </p>
                  </div>
                  <div>
                    {member.approved ? (
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Approved
                      </span>
                    ) : member.approvalRequested ? (
                      <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRequestApproval(member.id)}
                        disabled={isSubmitting}
                        className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                      >
                        Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">
                  {groupMembers.filter(m => m.approved).length}/{groupMembers.length} members approved
                </span>
                <br />
                <span className="text-xs">
                  Majority approval required to activate staking pool
                </span>
              </p>
            </div>
          </div>

          {/* Reward Calculation */}
          {formData.amount && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Estimated Rewards</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-green-700">Total Rewards</p>
                  <p className="text-xl font-bold text-green-900">
                    +{estimatedReward.toFixed(2)} RLUSD
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Final Amount</p>
                  <p className="text-xl font-bold text-green-900">
                    {(parseFloat(formData.amount) + estimatedReward).toFixed(2)} RLUSD
                  </p>
                </div>
              </div>
            </div>
          )}



          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isSubmitting || 
              !formData.amount || 
              parseFloat(formData.amount) <= 0 || 
              parseFloat(formData.amount) < 10 ||
              balanceLoading
            }
            className={cn(
              'w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors',
              'flex items-center justify-center space-x-2',
              isSubmitting || !formData.amount || parseFloat(formData.amount) < 10
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            )}
          >
            <TrendingUp className="w-5 h-5" />
            <span>
              {isSubmitting 
                ? 'Creating Pool...' 
                : 'Create Staking Pool'}
            </span>
          </button>

          {/* Info Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Staking Information</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Your funds will be locked for the selected duration</li>
                  <li>• Member approval is required before activation</li>
                  <li>• Rewards are calculated based on APY</li>
                  <li>• Staking amount: 10 - 10,000 RLUSD</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </PageContainer>
    </div>
  );
};

export default CreateStaking;