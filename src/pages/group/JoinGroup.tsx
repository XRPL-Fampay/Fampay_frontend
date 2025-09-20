import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { UserPlus, Users, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useGroup, useInviteCodeFromURL } from '../../hooks/useGroup';
import { useWallet } from '../../hooks/useWallet';
import { PageHeader, PageContainer } from '../../layouts/MainLayout';
import type { JoinGroupForm } from '../../types';

export const JoinGroup: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { joinGroup } = useGroup();
  const { wallet, isConnected, createWallet } = useWallet();
  const { inviteCode, extractFromCurrentURL, clearInviteCode } = useInviteCodeFromURL();
  
  const [formData, setFormData] = React.useState<JoinGroupForm>({
    inviteCode: '',
    nickname: '',
    walletAddress: wallet?.address || ''
  });
  const [joinedGroup, setJoinedGroup] = React.useState<{
    groupName: string;
    groupId: string;
  } | null>(null);

  // URL에서 초대 코드 추출
  React.useEffect(() => {
    const code = extractFromCurrentURL();
    if (code) {
      setFormData(prev => ({
        ...prev,
        inviteCode: code
      }));
    }
  }, [extractFromCurrentURL]);

  // 지갑 주소 자동 업데이트
  React.useEffect(() => {
    if (wallet?.address) {
      setFormData(prev => ({
        ...prev,
        walletAddress: wallet.address
      }));
    }
  }, [wallet?.classicAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.inviteCode.trim()) {
      toast.error('초대 코드를 입력해주세요.');
      return;
    }

    if (!formData.nickname.trim()) {
      toast.error('닉네임을 입력해주세요.');
      return;
    }

    if (!formData.walletAddress) {
      toast.error('지갑 주소가 필요합니다.');
      return;
    }

    try {
      const result = await joinGroup.mutateAsync(formData);
      
      setJoinedGroup({
        groupName: result.group.name,
        groupId: result.group.id
      });
      
      // URL에서 초대 코드 제거
      clearInviteCode();
      
      toast.success('모임통장에 성공적으로 참여했습니다!');
    } catch (error) {
      toast.error('모임통장 참여에 실패했습니다.');
      console.error('Group joining failed:', error);
    }
  };

  const handleCreateWallet = async () => {
    try {
      await createWallet.mutateAsync();
      toast.success('새 지갑이 생성되었습니다!');
    } catch (error) {
      toast.error('지갑 생성에 실패했습니다.');
    }
  };

  const handleContinueToDashboard = () => {
    navigate('/dashboard');
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      
      // URL에서 초대 코드 추출
      const urlMatch = text.match(/code=([^&]+)/);
      const code = urlMatch ? urlMatch[1] : text.trim();
      
      setFormData(prev => ({
        ...prev,
        inviteCode: code
      }));
      
      toast.success('초대 코드가 입력되었습니다.');
    } catch (error) {
      toast.error('클립보드 읽기에 실패했습니다.');
    }
  };

  // 지갑이 없는 경우
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader 
          title="모임통장 참여" 
          subtitle="초대받은 그룹에 참여하세요"
          backButton
        />
        
        <PageContainer className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                지갑이 필요합니다
              </h2>
              <p className="text-gray-600">
                모임통장에 참여하려면 먼저 지갑을 만들어야 합니다.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleCreateWallet}
                disabled={createWallet.isPending}
                className={cn(
                  'w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium',
                  'transition-colors hover:bg-blue-700',
                  createWallet.isPending && 'opacity-50 cursor-not-allowed'
                )}
              >
                {createWallet.isPending ? '지갑 생성 중...' : '새 지갑 만들기'}
              </button>
              
              <button
                onClick={() => navigate('/wallet/restore')}
                className="w-full text-blue-600 py-3 px-6 rounded-lg font-medium border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                기존 지갑 복구하기
              </button>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  // 참여 완료 화면
  if (joinedGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader 
          title="참여 완료" 
          subtitle="모임통장에 성공적으로 참여했습니다"
        />
        
        <PageContainer className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-900 mb-2">
              참여 완료!
            </h2>
            <p className="text-green-700">
              이제 {joinedGroup.groupName} 모임통장을 이용할 수 있습니다.
            </p>
          </div>

          {/* Group Info */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">참여한 모임</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">모임 이름</span>
                <span className="font-medium text-gray-900">
                  {joinedGroup.groupName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">내 역할</span>
                <span className="font-medium text-gray-900">멤버</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">그룹 ID</span>
                <span className="font-mono text-sm text-gray-900">
                  {joinedGroup.groupId}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              다음 단계
            </h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. 대시보드에서 그룹 잔액과 멤버를 확인하세요</li>
              <li>2. 필요한 경우 테스트넷에서 XRP을 받아보세요</li>
              <li>3. 회비 납부 기능을 사용해보세요</li>
              <li>4. 정기 회비를 설정할 수 있습니다</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContinueToDashboard}
              className="w-full bg-gray-900 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors hover:bg-gray-800"
            >
              대시보드로 이동
            </button>
            
            <button
              onClick={() => navigate('/wallet/fund')}
              className="w-full text-blue-600 py-3 px-6 rounded-lg font-medium border border-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>테스트넷 XRP 받기</span>
            </button>
          </div>
        </PageContainer>
      </div>
    );
  }

  // 참여 폼
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader 
        title="모임통장 참여" 
        subtitle="초대받은 그룹에 참여하세요"
        backButton
      />
      
      <PageContainer>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invite Code */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              초대 코드 *
            </label>
            <div className="space-y-3">
              <input
                type="text"
                value={formData.inviteCode}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  inviteCode: e.target.value
                }))}
                placeholder="초대 코드 또는 링크를 입력하세요"
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                클립보드에서 붙여넣기
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              운영진이 공유한 초대 링크나 코드를 입력해주세요.
            </p>
          </div>

          {/* Nickname */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              닉네임 *
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                nickname: e.target.value
              }))}
              placeholder="예: 홍길동, 김철수"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={20}
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              다른 멤버들이 알아볼 수 있는 이름으로 지어주세요.
            </p>
          </div>

          {/* Wallet Address */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지갑 주소
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.walletAddress}
                readOnly
                className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              회비 납부와 수신에 사용될 지갑 주소입니다.
            </p>
          </div>

          {/* Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <UserPlus className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  멤버 권한
                </p>
                <ul className="text-xs text-green-700 mt-1 space-y-1">
                  <li>• 그룹 잔액 및 멤버 조회</li>
                  <li>• 회비 납부 및 송금</li>
                  <li>• 정기 회비 설정</li>
                  <li>• 거래 내역 확인</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={joinGroup.isPending || !formData.inviteCode.trim() || !formData.nickname.trim()}
            className={cn(
              'w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold text-lg',
              'transition-colors hover:bg-green-700',
              (joinGroup.isPending || !formData.inviteCode.trim() || !formData.nickname.trim()) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {joinGroup.isPending ? '참여 중...' : '모임통장 참여하기'}
          </button>
        </form>
      </PageContainer>
    </div>
  );
};

export default JoinGroup;