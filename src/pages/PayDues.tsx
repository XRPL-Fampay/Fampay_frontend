import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { 
  CreditCard, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  User,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useWalletBalance } from '../hooks/useWallet';
import { useGroup } from '../hooks/useGroup';
import PaymentService from '../services/paymentService';
import { AmountInput, QuickAmountButtons } from '../components/NumberPad';
import { PageHeader, PageContainer } from '../layouts/MainLayout';
import type { PayDuesForm } from '../types';

export const PayDues: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { balance, isLoading: balanceLoading } = useWalletBalance();
  const { currentGroup } = useGroup();
  
  const [formData, setFormData] = React.useState<PayDuesForm>({
    duesType: 'monthly',
    amount: '',
    memo: '',
    isRecurring: false,
    frequency: 'monthly'
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [paymentSuccess, setPaymentSuccess] = React.useState<{
    transactionHash?: string;
    escrowId?: string;
    amount: number;
    type: string;
  } | null>(null);

  // URL 파라미터에서 받는 사람 정보 추출
  const targetMember = location.state?.member;

  const duesTypes = [
    { value: 'monthly', label: '월 회비', description: '매월 정기 회비' },
    { value: 'special', label: '특별 회비', description: '특별한 목적의 회비' },
    { value: 'event', label: '행사비', description: '이벤트 및 행사 비용' }
  ];

  const frequencyOptions = [
    { value: 'daily', label: '매일' },
    { value: 'weekly', label: '매주' },
    { value: 'monthly', label: '매월' }
  ];

  const quickAmounts = [10, 20, 50, 100];

  const maxPayableAmount = React.useMemo(() => {
    return Math.max(0, balance - 0.001); // 수수료 고려
  }, [balance]);

  const handleAmountChange = (value: string) => {
    setFormData(prev => ({ ...prev, amount: value }));
  };

  const handleQuickAmountSelect = (amount: number) => {
    setFormData(prev => ({ ...prev, amount: amount.toString() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('유효한 금액을 입력해주세요.');
      return;
    }

    if (amount > maxPayableAmount) {
      toast.error('잔액이 부족합니다.');
      return;
    }

    if (formData.isRecurring) {
      const validation = PaymentService.validateRecurringPayment(formData);
      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (formData.isRecurring) {
        // 정기 회비 설정
        const escrow = await PaymentService.createRecurringDues(formData);
        setPaymentSuccess({
          escrowId: escrow.escrowId,
          amount,
          type: 'recurring'
        });
        toast.success('정기 회비가 설정되었습니다!');
      } else {
        // 즉시 회비 납부
        const payment = await PaymentService.payDues(formData);
        setPaymentSuccess({
          transactionHash: payment.transactionHash,
          amount,
          type: 'immediate'
        });
        toast.success('회비 납부가 완료되었습니다!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '회비 납부에 실패했습니다.';
      toast.error(errorMessage);
      console.error('Payment failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      duesType: 'monthly',
      amount: '',
      memo: '',
      isRecurring: false,
      frequency: 'monthly'
    });
    setPaymentSuccess(null);
  };

  const handleViewTransaction = () => {
    if (paymentSuccess?.transactionHash) {
      navigate(`/transaction/${paymentSuccess.transactionHash}`);
    } else if (paymentSuccess?.escrowId) {
      navigate('/escrow');
    }
  };

  // 결제 완료 화면
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader 
          title="결제 완료" 
          subtitle={paymentSuccess.type === 'recurring' ? '정기 회비 설정' : '회비 납부'}
        />
        
        <PageContainer className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 w-full max-w-sm">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {paymentSuccess.type === 'recurring' ? '정기 회비 설정 완료' : '납부 완료'}
              </h2>
              <p className="text-gray-600">
                {paymentSuccess.amount} XRP가 성공적으로 처리되었습니다.
              </p>
            </div>

            {paymentSuccess.transactionHash && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">거래 해시</p>
                <p className="font-mono text-xs text-gray-900 break-all">
                  {paymentSuccess.transactionHash}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleViewTransaction}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {paymentSuccess.type === 'recurring' ? '정기 회비 관리' : '거래 내역 보기'}
              </button>
              
              <button
                onClick={handleReset}
                className="w-full text-gray-600 py-3 px-6 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                다시 납부하기
              </button>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full text-blue-600 py-3 px-6 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                대시보드로 돌아가기
              </button>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader 
        title="회비 납부" 
        subtitle={targetMember ? `${targetMember.nickname}님께` : '그룹 회비 납부'}
        backButton
      />
      
      <PageContainer>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Member Info */}
          {targetMember && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">
                    {targetMember.nickname}님께 송금
                  </p>
                  <p className="text-sm text-blue-700">
                    {targetMember.walletAddress.slice(0, 8)}...{targetMember.walletAddress.slice(-6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dues Type Selection */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              회비 유형
            </label>
            <div className="space-y-3">
              {duesTypes.map((type) => (
                <label
                  key={type.value}
                  className={cn(
                    'flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors',
                    formData.duesType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="duesType"
                    value={type.value}
                    checked={formData.duesType === type.value}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      duesType: e.target.value as PayDuesForm['duesType']
                    }))}
                    className="hidden"
                  />
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                    formData.duesType === type.value
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  )}>
                    {formData.duesType === type.value && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{type.label}</p>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              납부 금액
            </label>
            
            <AmountInput
              value={formData.amount}
              onChange={handleAmountChange}
              currency="XRP"
              placeholder="0"
              maxLength={10}
              allowDecimal={true}
              showNumberPad={true}
              numberPadSize="md"
              disabled={isSubmitting}
              error={parseFloat(formData.amount) > maxPayableAmount ? '잔액이 부족합니다' : undefined}
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              빠른 선택
            </label>
            <QuickAmountButtons
              amounts={quickAmounts}
              onSelect={handleQuickAmountSelect}
              currentValue={formData.amount}
              currency="XRP"
              disabled={isSubmitting}
            />
          </div>

          {/* Memo */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모 (선택사항)
            </label>
            <textarea
              value={formData.memo}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                memo: e.target.value
              }))}
              placeholder="납부 목적이나 메모를 입력하세요"
              rows={3}
              maxLength={100}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.memo.length}/100
            </p>
          </div>

          {/* Recurring Payment Toggle */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">정기 납부 설정</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    isRecurring: e.target.checked
                  }))}
                  className="sr-only peer"
                  disabled={isSubmitting}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {formData.isRecurring && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    납부 주기
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      frequency: e.target.value as PayDuesForm['frequency']
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  >
                    {frequencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">정기 납부 안내</p>
                      <p>설정된 주기마다 자동으로 회비가 납부됩니다. 언제든지 취소할 수 있습니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Balance Warning */}
          {parseFloat(formData.amount) > maxPayableAmount && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    잔액 부족
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    사용 가능한 잔액: {maxPayableAmount.toFixed(6)} XRP
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Balance Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">현재 잔액</span>
              <span className="font-semibold text-gray-900">
                {balanceLoading ? '로딩 중...' : `${balance.toFixed(6)} XRP`}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isSubmitting || 
              !formData.amount || 
              parseFloat(formData.amount) <= 0 || 
              parseFloat(formData.amount) > maxPayableAmount ||
              balanceLoading
            }
            className={cn(
              'w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors',
              'flex items-center justify-center space-x-2',
              isSubmitting || parseFloat(formData.amount) > maxPayableAmount || !formData.amount
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            )}
          >
            <CreditCard className="w-5 h-5" />
            <span>
              {isSubmitting 
                ? '처리 중...' 
                : formData.isRecurring 
                  ? '정기 회비 설정하기' 
                  : '회비 납부하기'}
            </span>
          </button>
        </form>
      </PageContainer>
    </div>
  );
};

export default PayDues;