import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GroupService from '../services/groupService';
import type { 
  Group, 
  GroupMember, 
  CreateGroupForm, 
  JoinGroupForm,
  DashboardData 
} from '../types';

/**
 * 그룹 상태 관리 훅
 */
export const useGroup = () => {
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(
    GroupService.getCurrentGroupId()
  );
  const [isHost, setIsHost] = useState<boolean>(
    GroupService.isCurrentUserHost()
  );

  // 현재 그룹 정보 조회
  const currentGroupQuery = useQuery<Group | null, Error>({
    queryKey: ['current-group', currentGroupId],
    queryFn: async () => {
      if (!currentGroupId) return null;
      return await GroupService.getCurrentGroup();
    },
    enabled: !!currentGroupId,
    staleTime: 60000, // 1분간 캐시 유지
  });

  // 그룹 생성
  const createGroup = useMutation({
    mutationFn: async (form: CreateGroupForm) => {
      return await GroupService.createGroup(form);
    },
    onSuccess: (data) => {
      setCurrentGroupId(data.group.id);
      setIsHost(true);
    },
  });

  // 그룹 참여
  const joinGroup = useMutation({
    mutationFn: async (form: JoinGroupForm) => {
      return await GroupService.joinGroup(form);
    },
    onSuccess: (data) => {
      setCurrentGroupId(data.group.id);
      setIsHost(false);
    },
  });

  // 그룹 탈퇴
  const leaveGroup = useMutation({
    mutationFn: async () => {
      return await GroupService.leaveGroup();
    },
    onSuccess: () => {
      setCurrentGroupId(null);
      setIsHost(false);
    },
  });

  return {
    currentGroup: currentGroupQuery.data,
    currentGroupId,
    isHost,
    isInGroup: !!currentGroupId,
    isLoading: currentGroupQuery.isLoading,
    error: currentGroupQuery.error,
    createGroup,
    joinGroup,
    leaveGroup,
    refetch: currentGroupQuery.refetch
  };
};

/**
 * 그룹 멤버 관리 훅
 */
export const useGroupMembers = (groupId?: string) => {
  const targetGroupId = groupId || GroupService.getCurrentGroupId();

  const membersQuery = useQuery<GroupMember[], Error>({
    queryKey: ['group-members', targetGroupId],
    queryFn: async () => {
      if (!targetGroupId) throw new Error('Group ID not found');
      return await GroupService.getGroupMembers(targetGroupId);
    },
    enabled: !!targetGroupId,
    staleTime: 30000, // 30초간 캐시 유지
  });

  // 특정 멤버 찾기
  const findMember = useCallback((walletAddress: string) => {
    return membersQuery.data?.find(member => member.walletAddress === walletAddress) || null;
  }, [membersQuery.data]);

  // 현재 사용자 정보 찾기
  const getCurrentMember = useCallback(() => {
    const currentWalletAddress = localStorage.getItem('walletAddress');
    if (!currentWalletAddress) return null;
    return findMember(currentWalletAddress);
  }, [findMember]);

  // 호스트 찾기
  const getHost = useCallback(() => {
    return membersQuery.data?.find(member => {
      // 호스트 판별 로직 (실제 구현에서는 서버에서 제공해야 함)
      const groupData = JSON.parse(localStorage.getItem('grouppay_current_group') || '{}');
      return member.walletAddress === groupData.hostWalletAddress;
    }) || null;
  }, [membersQuery.data]);

  return {
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    error: membersQuery.error,
    findMember,
    getCurrentMember,
    getHost,
    refetch: membersQuery.refetch
  };
};

/**
 * 대시보드 데이터 훅
 */
export const useDashboard = () => {
  const dashboardQuery = useQuery<DashboardData, Error>({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      return await GroupService.getDashboardData();
    },
    enabled: GroupService.isInGroup(),
    staleTime: 30000, // 30초간 캐시 유지
    refetchInterval: 60000, // 1분마다 자동 갱신
  });

  return {
    dashboardData: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch
  };
};

/**
 * 그룹 잔액 계산 훅
 */
export const useGroupBalance = (groupId?: string) => {
  const targetGroupId = groupId || GroupService.getCurrentGroupId();

  const groupBalanceQuery = useQuery<number, Error>({
    queryKey: ['group-total-balance', targetGroupId],
    queryFn: async () => {
      if (!targetGroupId) throw new Error('Group ID not found');
      return await GroupService.calculateGroupTotalBalance(targetGroupId);
    },
    enabled: !!targetGroupId,
    staleTime: 60000, // 1분간 캐시 유지
    refetchInterval: 120000, // 2분마다 자동 갱신
  });

  return {
    totalBalance: groupBalanceQuery.data || 0,
    isLoading: groupBalanceQuery.isLoading,
    error: groupBalanceQuery.error,
    refetch: groupBalanceQuery.refetch
  };
};

/**
 * 초대 링크 관리 훅
 */
export const useInviteLink = () => {
  const generateLink = useCallback((inviteCode: string) => {
    return GroupService.generateInviteLink(inviteCode);
  }, []);

  const extractCode = useCallback((inviteLink: string) => {
    return GroupService.extractInviteCode(inviteLink);
  }, []);

  const copyToClipboard = useCallback(async (inviteLink: string) => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, []);

  const shareLink = useCallback(async (inviteLink: string, groupName: string) => {
    const shareData = {
      title: `${groupName} 모임통장 초대`,
      text: `${groupName} 모임통장에 참여하세요!`,
      url: inviteLink
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      } else {
        // Web Share API가 지원되지 않는 경우 클립보드에 복사
        return await copyToClipboard(inviteLink);
      }
    } catch (error) {
      console.error('Failed to share link:', error);
      return false;
    }
  }, [copyToClipboard]);

  return {
    generateLink,
    extractCode,
    copyToClipboard,
    shareLink
  };
};

/**
 * 그룹 액세스 검증 훅
 */
export const useGroupAccess = () => {
  const validateAccess = useMutation({
    mutationFn: async () => {
      return await GroupService.validateGroupAccess();
    },
  });

  return {
    validateAccess,
    isValidating: validateAccess.isPending,
    isValid: validateAccess.data,
    error: validateAccess.error
  };
};

/**
 * 그룹 설정 관리 훅 (호스트용)
 */
export const useGroupSettings = () => {
  const queryClient = useQueryClient();
  const isHost = GroupService.isCurrentUserHost();

  const updateSettings = useMutation({
    mutationFn: async (settings: Partial<Group>) => {
      return await GroupService.updateGroupSettings(settings);
    },
    onSuccess: () => {
      // 설정 업데이트 성공 시 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['current-group'] });
    },
  });

  const updateMemberPermissions = useMutation({
    mutationFn: async ({ memberId, permissions }: { memberId: string; permissions: any }) => {
      return await GroupService.updateMemberPermissions(memberId, permissions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
    },
  });

  return {
    isHost,
    updateSettings,
    updateMemberPermissions,
    canManageSettings: isHost
  };
};

/**
 * 그룹 통계 훅
 */
export const useGroupStatistics = (groupId?: string) => {
  const { members } = useGroupMembers(groupId);
  const { totalBalance } = useGroupBalance(groupId);

  const statistics = {
    memberCount: members.length,
    totalBalance,
    averageBalance: members.length > 0 ? totalBalance / members.length : 0,
    activeMembers: members.filter(member => member.balance > 0).length,
    topContributor: members.reduce((max, member) => 
      member.balance > (max?.balance || 0) ? member : max, 
      null as GroupMember | null
    ),
  };

  return statistics;
};

/**
 * URL에서 초대 코드 추출 훅
 */
export const useInviteCodeFromURL = () => {
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const extractFromCurrentURL = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    setInviteCode(code);
    return code;
  }, []);

  const clearInviteCode = useCallback(() => {
    setInviteCode(null);
    // URL에서 초대 코드 파라미터 제거
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    window.history.replaceState({}, '', url.toString());
  }, []);

  return {
    inviteCode,
    extractFromCurrentURL,
    clearInviteCode
  };
};

/**
 * 그룹 검색 및 필터링 훅
 */
export const useGroupSearch = () => {
  const { members } = useGroupMembers();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = members.filter(member =>
    member.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchMember = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    filteredMembers,
    searchMember,
    clearSearch,
    resultCount: filteredMembers.length
  };
};