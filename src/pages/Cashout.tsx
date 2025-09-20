import React from 'react';
import { useNavigate } from 'react-router';
import { 
  CreditCard, 
  Plus, 
  Wallet, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Building,
  Shield,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useWalletBalance } from '../hooks/useWallet';
import PaymentService from '../services/paymentService';
import { AmountInput, QuickAmountButtons } from '../components/NumberPad';
import { PageHeader, PageContainer } from '../layouts/MainLayout';
import type { CashoutCard, CashoutForm } from '../types';

export const Cashout: React.FC = () => {
  const navigate = useNavigate();
  const { balance, isLoading: balanceLoading } = useWalletBalance();
  
  const [cards, setCards] = React.useState<CashoutCard[]>([]);
  const [isLoadingCards, setIsLoadingCards] = React.useState(true);
  const [formData, setFormData] = React.useState<CashoutForm>({
    amount: '',
    cardId: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [cashoutSuccess, setCashoutSuccess] = React.useState<{
    amount: number;
    cardName: string;
  } | null>(null);

  const quickAmounts = [10, 50, 100, Math.floor(balance * 0.9)].filter(amount => amount > 0);

  const maxCashoutAmount = React.useMemo(() => {
    return Math.max(0, balance - 0.001); // 수수료 고려
  }, [balance]);

  // 카드 목록 로드
  React.useEffect(() => {
    const fetchCards = async () => {
      try {
        const cardList = await PaymentService.getCashoutCards();
        setCards(cardList);
        
        // 기본 카드 선택
        const defaultCard = cardList.find(card => card.isDefault) || cardList[0];
        if (defaultCard) {
          setFormData(prev => ({ ...prev, cardId: defaultCard.id }));
        }
      } catch (error) {
        console.error('Failed to fetch cards:', error);
        // 데모용 카드 데이터
        const demoCards: CashoutCard[] = [
          {
            id: '1',
            bankName: '국민은행',
            cardNumber: '**** **** **** 1234',
            isDefault: true
          },
          {
            id: '2',
            bankName: '신한은행',
            cardNumber: '**** **** **** 5678',
            isDefault: false
          }
        ];
        setCards(demoCards);
        setFormData(prev => ({ ...prev, cardId: demoCards[0].id }));
      } finally {
        setIsLoadingCards(false);
      }
    };

    fetchCards();
  }, []);

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

    if (amount > maxCashoutAmount) {
      toast.error('잔액이 부족합니다.');
      return;
    }

    if (!formData.cardId) {
      toast.error('출금할 카드를 선택해주세요.');
      return;
    }

    const selectedCard = cards.find(card => card.id === formData.cardId);
    if (!selectedCard) {
      toast.error('선택된 카드를 찾을 수 없습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      await PaymentService.requestCashout(formData);
      setCashoutSuccess({
        amount,
        cardName: `${selectedCard.bankName} ${selectedCard.cardNumber}`
      });
      toast.success('현금화 요청이 완료되었습니다!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '현금화 요청에 실패했습니다.';
      toast.error(errorMessage);
      console.error('Cashout failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      amount: '',
      cardId: cards.find(card => card.isDefault)?.id || cards[0]?.id || ''
    });
    setCashoutSuccess(null);
  };

  const getBankIcon = (bankName: string) => {
    // 은행별 아이콘 매핑 (실제로는 은행 로고 이미지 사용)
    return <Building className="w-6 h-6 text-blue-600" />;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  // 현금화 완료 화면
  if (cashoutSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader 
          title="현금화 완료" 
          subtitle="요청이 처리되었습니다"
        />
        
        <PageContainer className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 w-full max-w-sm">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                현금화 요청 완료
              </h2>
              <p className="text-gray-600">
                {cashoutSuccess.amount} XRP가 처리되었습니다.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">금액</span>
                <span className="font-medium text-gray-900">
                  {formatAmount(cashoutSuccess.amount)} XRP
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">출금 계좌</span>
                <span className="font-medium text-gray-900">
                  {cashoutSuccess.cardName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">처리 시간</span>
                <span className="font-medium text-gray-900">
                  1-3 영업일
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900">
                    처리 안내
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    현금화 요청이 완료되었습니다. 1-3 영업일 내에 선택하신 계좌로 입금됩니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleReset}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                다시 현금화하기
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
        title="현금화" 
        subtitle="XRP를 현금으로 출금하세요"
        backButton
      />
      
      <PageContainer>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Balance */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">출금 가능한 잔액</p>
                <p className="text-3xl font-bold">
                  {balanceLoading ? '로딩 중...' : `${formatAmount(maxCashoutAmount)} XRP`}
                </p>
              </div>
              <Wallet className="w-12 h-12 opacity-80" />
            </div>
          </div>

          {/* Amount Input */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              출금 금액
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
              error={parseFloat(formData.amount) > maxCashoutAmount ? '잔액이 부족합니다' : undefined}
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

          {/* Card Selection */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">
                출금 계좌
              </label>
              <button
                type="button"
                onClick={() => navigate('/cards/add')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>계좌 추가</span>
              </button>
            </div>
            
            {isLoadingCards ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                      <div className="w-12 h-8 bg-gray-300 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : cards.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">등록된 계좌가 없습니다.</p>
                <button
                  type="button"
                  onClick={() => navigate('/cards/add')}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  첫 번째 계좌 추가하기
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cards.map((card) => (
                  <label
                    key={card.id}
                    className={cn(
                      'flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors',
                      formData.cardId === card.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="cardId"
                      value={card.id}
                      checked={formData.cardId === card.id}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cardId: e.target.value
                      }))}
                      className="hidden"
                    />
                    
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                        {getBankIcon(card.bankName)}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{card.bankName}</p>
                        <p className="text-sm text-gray-600">{card.cardNumber}</p>
                      </div>
                      
                      {card.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          기본
                        </span>
                      )}
                    </div>
                    
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                      formData.cardId === card.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    )}>
                      {formData.cardId === card.id && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Warning */}
          {parseFloat(formData.amount) > maxCashoutAmount && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    잔액 부족
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    출금 가능한 금액: {formatAmount(maxCashoutAmount)} XRP
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fee Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">수수료 안내</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">출금 금액</span>
                <span className="text-gray-900">
                  {formData.amount ? `${formatAmount(parseFloat(formData.amount))} XRP` : '0 XRP'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">네트워크 수수료</span>
                <span className="text-gray-900">0.001 XRP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">서비스 수수료</span>
                <span className="text-gray-900">무료</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-medium">
                <span className="text-gray-900">실제 출금액</span>
                <span className="text-gray-900">
                  {formData.amount 
                    ? `${formatAmount(Math.max(0, parseFloat(formData.amount) - 0.001))} XRP` 
                    : '0 XRP'}
                </span>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  보안 안내
                </p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• 출금은 1-3 영업일 내에 처리됩니다</li>
                  <li>• 본인 명의 계좌로만 출금 가능합니다</li>
                  <li>• 최소 출금 금액은 10 XRP입니다</li>
                  <li>• 일일 출금 한도는 1,000 XRP입니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isSubmitting || 
              !formData.amount || 
              !formData.cardId ||
              parseFloat(formData.amount) <= 0 || 
              parseFloat(formData.amount) > maxCashoutAmount ||
              parseFloat(formData.amount) < 10 ||
              balanceLoading ||
              cards.length === 0
            }
            className={cn(
              'w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors',
              'flex items-center justify-center space-x-2',
              (isSubmitting || 
               parseFloat(formData.amount) > maxCashoutAmount || 
               !formData.amount || 
               !formData.cardId ||
               parseFloat(formData.amount) < 10 ||
               cards.length === 0)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            )}
          >
            <Wallet className="w-5 h-5" />
            <span>
              {isSubmitting ? '처리 중...' : '현금화 요청하기'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </PageContainer>
    </div>
  );
};

export default Cashout;