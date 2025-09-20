import React from 'react';
import { useNavigate } from 'react-router';
import { 
  Users, 
  CreditCard, 
  Zap, 
  Shield, 
  ArrowRight,
  CheckCircle,
  Wallet
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useWallet } from '../hooks/useWallet';
import { useGroup } from '../hooks/useGroup';
import WalletHeader from '../components/WalletHeader';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, createWallet } = useWallet();
  const { isInGroup } = useGroup();
  
  // 이미 로그인된 상태라면 대시보드로 리다이렉트
  React.useEffect(() => {
    if (isConnected && isInGroup) {
      navigate('/dashboard');
    }
  }, [isConnected, isInGroup, navigate]);

  const features = [
    {
      icon: Users,
      title: '그룹 모임통장',
      description: '친구들과 함께 모임비를 쉽게 관리하세요'
    },
    {
      icon: CreditCard,
      title: '간편한 회비 납부',
      description: '번거로운 계좌이체 없이 바로 납부'
    },
    {
      icon: Zap,
      title: '정기 회비 자동화',
      description: '매월 자동으로 회비가 납부됩니다'
    },
    {
      icon: Shield,
      title: 'XRPL 블록체인',
      description: '안전하고 투명한 거래 보장'
    }
  ];

  const benefits = [
    '실시간 잔액 확인',
    '투명한 거래 내역',
    '자동 회비 관리',
    '모바일 최적화',
    '낮은 수수료',
    '빠른 송금 속도'
  ];

  const handleCreateWallet = async () => {
    try {
      await createWallet.mutateAsync();
      navigate('/group/create');
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  const handleJoinGroup = () => {
    if (isConnected) {
      navigate('/group/join');
    } else {
      // 지갑이 없으면 먼저 지갑 생성 후 참여 페이지로
      navigate('/wallet/create?redirect=/group/join');
    }
  };

  const handleRestoreWallet = () => {
    navigate('/wallet/restore');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left: Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GP</span>
                </div>
                <h1 className="font-bold text-gray-900">GroupPay</h1>
              </div>

              {/* Right: Wallet Header */}
              <WalletHeader 
                compact={true}
                showBalance={true}
                showNetworkStatus={true}
              />
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-green-500 to-blue-600 text-white px-6 py-12 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold mb-3">
            GroupPay
          </h1>
          <p className="text-lg opacity-90 mb-8">
            XRPL 기반 그룹 모임통장
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleCreateWallet}
              disabled={createWallet.isPending}
              className={cn(
                'w-full bg-white text-blue-600 py-4 px-6 rounded-xl font-semibold text-lg',
                'transition-all duration-200 hover:bg-gray-50 hover:scale-105',
                'flex items-center justify-center space-x-2',
                createWallet.isPending && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Users className="w-5 h-5" />
              <span>
                {createWallet.isPending ? '지갑 생성 중...' : '새 모임통장 만들기'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleJoinGroup}
              className="w-full bg-white bg-opacity-20 border border-white border-opacity-30 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 hover:bg-opacity-30 flex items-center justify-center space-x-2"
            >
              <span>기존 모임통장 참여하기</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          
          {isConnected && (
            <button
              onClick={handleRestoreWallet}
              className="mt-4 text-white text-opacity-80 text-sm underline hover:text-opacity-100 transition-colors"
            >
              다른 지갑으로 복구하기
            </button>
          )}
        </div>

        {/* Features Section */}
        <div className="flex-1 px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            왜 GroupPay인가요?
          </h2>
          
          <div className="space-y-6 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">
              주요 기능
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-gray-900 text-center">
              이용 방법
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">모임통장 생성</p>
                  <p className="text-sm text-gray-600">운영진이 그룹을 만들고 초대링크 공유</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">멤버 참여</p>
                  <p className="text-sm text-gray-600">초대링크로 간편하게 참여</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">회비 관리</p>
                  <p className="text-sm text-gray-600">자동화된 회비 납부 및 관리</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  안전한 블록체인 기술
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  XRPL 네트워크를 사용하여 모든 거래가 투명하고 안전하게 처리됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            GroupPay는 XRPL 테스트넷을 사용합니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;