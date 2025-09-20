import React from 'react';
import { useNavigate } from 'react-router';
import { Users, Copy, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useGroup } from '../../hooks/useGroup';
import { useWallet } from '../../hooks/useWallet';
import { PageHeader, PageContainer } from '../../layouts/MainLayout';
import type { CreateGroupForm } from '../../types';

export const CreateGroup: React.FC = () => {
  const navigate = useNavigate();
  const { createGroup } = useGroup();
  const { wallet, isConnected, createWallet } = useWallet();
  
  const [formData, setFormData] = React.useState<CreateGroupForm>({
    groupName: '',
    walletAddress: wallet?.address || ''
  });
  const [createdGroup, setCreatedGroup] = React.useState<{
    groupId: string;
    inviteLink: string;
    groupName: string;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);

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
    
    if (!formData.groupName.trim()) {
      toast.error('모임 이름을 입력해주세요.');
      return;
    }

    if (!formData.walletAddress) {
      toast.error('지갑 주소가 필요합니다.');
      return;
    }

    try {
      const result = await createGroup.mutateAsync(formData);
      
      setCreatedGroup({
        groupId: result.group.id,
        inviteLink: result.inviteLink,
        groupName: formData.groupName
      });
      
      toast.success('모임통장이 성공적으로 생성되었습니다!');
    } catch (error) {
      toast.error('모임통장 생성에 실패했습니다.');
      console.error('Group creation failed:', error);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!createdGroup?.inviteLink) return;

    try {
      await navigator.clipboard.writeText(createdGroup.inviteLink);
      setCopied(true);
      toast.success('초대 링크가 복사되었습니다!');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('링크 복사에 실패했습니다.');
    }
  };

  const handleShareInviteLink = async () => {
    if (!createdGroup?.inviteLink) return;

    const shareData = {
      title: `${createdGroup.groupName} 모임통장 초대`,
      text: `${createdGroup.groupName} 모임통장에 참여하세요!`,
      url: createdGroup.inviteLink
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Web Share API가 지원되지 않는 경우 클립보드에 복사
        await handleCopyInviteLink();
      }
    } catch (error) {
      console.error('Share failed:', error);
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

  // 지갑이 없는 경우
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader 
          title="모임통장 생성" 
          subtitle="새로운 그룹을 만들어보세요"
          backButton
        />
        
        <PageContainer className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                지갑이 필요합니다
              </h2>
              <p className="text-gray-600">
                모임통장을 생성하려면 먼저 지갑을 만들어야 합니다.
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

  // 그룹 생성 완료 화면
  if (createdGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PageHeader 
          title="모임통장 생성 완료" 
          subtitle="멤버들을 초대해보세요"
        />
        
        <PageContainer className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-900 mb-2">
              모임통장이 생성되었습니다!
            </h2>
            <p className="text-green-700">
              이제 친구들에게 초대 링크를 공유해보세요.
            </p>
          </div>

          {/* Group Info */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">모임 정보</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">모임 이름</span>
                <span className="font-medium text-gray-900">
                  {createdGroup.groupName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">운영진</span>
                <span className="font-medium text-gray-900">나</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">그룹 ID</span>
                <span className="font-mono text-sm text-gray-900">
                  {createdGroup.groupId}
                </span>
              </div>
            </div>
          </div>

          {/* Invite Link */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">초대 링크</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 break-all">
                {createdGroup.inviteLink}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleCopyInviteLink}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>복사됨!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>링크 복사하기</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleShareInviteLink}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors hover:bg-green-700 flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>공유하기</span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              멤버 초대 방법
            </h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. 위의 초대 링크를 복사하거나 공유합니다</li>
              <li>2. 친구들이 링크를 통해 앱에 접속합니다</li>
              <li>3. 친구들이 지갑을 생성하고 그룹에 참여합니다</li>
              <li>4. 모든 멤버가 모임통장을 함께 사용할 수 있습니다</li>
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
              onClick={() => navigate('/group/members')}
              className="w-full text-gray-600 py-3 px-6 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              멤버 관리하기
            </button>
          </div>
        </PageContainer>
      </div>
    );
  }

  // 그룹 생성 폼
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader 
        title="모임통장 생성" 
        subtitle="새로운 그룹을 만들어보세요"
        backButton
      />
      
      <PageContainer>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Name */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              모임 이름 *
            </label>
            <input
              type="text"
              value={formData.groupName}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                groupName: e.target.value
              }))}
              placeholder="예: 대학동기 모임, 축구동호회"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              멤버들이 쉽게 알아볼 수 있는 이름으로 지어주세요.
            </p>
          </div>

          {/* Wallet Address */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지갑 주소 (운영진)
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
              운영진으로 등록될 지갑 주소입니다.
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  운영진 권한
                </p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• 멤버 초대 및 관리</li>
                  <li>• 그룹 설정 변경</li>
                  <li>• 회비 항목 설정</li>
                  <li>• 거래 내역 관리</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={createGroup.isPending || !formData.groupName.trim()}
            className={cn(
              'w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg',
              'transition-colors hover:bg-blue-700',
              (createGroup.isPending || !formData.groupName.trim()) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {createGroup.isPending ? '생성 중...' : '모임통장 생성하기'}
          </button>
        </form>
      </PageContainer>
    </div>
  );
};

export default CreateGroup;