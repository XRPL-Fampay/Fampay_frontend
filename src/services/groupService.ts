import { apiService } from './api';
import WalletService from './walletService';
import type { 
  Group, 
  GroupMember, 
  CreateGroupForm, 
  JoinGroupForm,
  DashboardData 
} from '../types';

export class GroupService {
  private static readonly GROUP_STORAGE_KEY = 'grouppay_group_id';
  private static readonly HOST_STORAGE_KEY = 'grouppay_is_host';

  /**
   * 그룹 생성
   */
  static async createGroup(form: CreateGroupForm): Promise<{
    group: Group;
    inviteLink: string;
  }> {
    try {
      // 지갑 주소 유효성 검사
      if (!WalletService.isValidAddress(form.walletAddress)) {
        throw new Error('유효하지 않은 지갑 주소입니다.');
      }

      const response = await apiService.createGroup({
        name: form.groupName,
        hostWalletAddress: form.walletAddress
      });

      // 로컬 스토리지에 그룹 정보 저장
      this.saveGroupToStorage(response.groupId, true);
      localStorage.setItem('walletAddress', form.walletAddress);

      return {
        group: response.group,
        inviteLink: response.inviteLink
      };
    } catch (error) {
      console.error('Failed to create group:', error);
      throw new Error('그룹 생성에 실패했습니다.');
    }
  }

  /**
   * 그룹 참여
   */
  static async joinGroup(form: JoinGroupForm): Promise<{
    group: Group;
    member: GroupMember;
  }> {
    try {
      // 지갑 주소 유효성 검사
      if (!WalletService.isValidAddress(form.walletAddress)) {
        throw new Error('유효하지 않은 지갑 주소입니다.');
      }

      const response = await apiService.joinGroup({
        inviteCode: form.inviteCode,
        nickname: form.nickname,
        walletAddress: form.walletAddress
      });

      // 로컬 스토리지에 그룹 정보 저장
      this.saveGroupToStorage(response.group.id, false);
      localStorage.setItem('walletAddress', form.walletAddress);

      return {
        group: response.group,
        member: response.member
      };
    } catch (error) {
      console.error('Failed to join group:', error);
      throw new Error('그룹 참여에 실패했습니다.');
    }
  }

  /**
   * 현재 그룹 정보 조회
   */
  static async getCurrentGroup(): Promise<Group | null> {
    try {
      const groupId = this.getCurrentGroupId();
      if (!groupId) return null;

      return await apiService.getGroupInfo(groupId);
    } catch (error) {
      console.error('Failed to get current group:', error);
      return null;
    }
  }

  /**
   * 그룹 멤버 목록 조회
   */
  static async getGroupMembers(groupId?: string): Promise<GroupMember[]> {
    try {
      const targetGroupId = groupId || this.getCurrentGroupId();
      if (!targetGroupId) {
        throw new Error('그룹 ID를 찾을 수 없습니다.');
      }

      const members = await apiService.getGroupMembers(targetGroupId);
      return members;
    } catch (error) {
      console.error('Failed to get group members:', error);
      throw new Error('그룹 멤버 조회에 실패했습니다.');
    }
  }

  /**
   * 대시보드 데이터 조회
   */
  static async getDashboardData(): Promise<DashboardData> {
    try {
      const groupId = this.getCurrentGroupId();
      const walletAddress = WalletService.getCurrentWalletAddress();

      if (!groupId || !walletAddress) {
        throw new Error('그룹 또는 지갑 정보를 찾을 수 없습니다.');
      }

      return await apiService.getDashboardData(groupId, walletAddress);
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw new Error('대시보드 데이터 조회에 실패했습니다.');
    }
  }

  /**
   * 그룹 총 잔액 계산
   */
  static async calculateGroupTotalBalance(groupId?: string): Promise<number> {
    try {
      const members = await this.getGroupMembers(groupId);
      
      // 모든 멤버의 잔액을 합산
      const balances = await Promise.all(
        members.map(member => WalletService.getBalance(member.walletAddress))
      );

      return balances.reduce((total, balance) => total + balance, 0);
    } catch (error) {
      console.error('Failed to calculate group total balance:', error);
      return 0;
    }
  }

  /**
   * 초대 링크 생성
   */
  static generateInviteLink(inviteCode: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/group/join?code=${inviteCode}`;
  }

  /**
   * 초대 코드 추출
   */
  static extractInviteCode(inviteLink: string): string | null {
    try {
      const url = new URL(inviteLink);
      return url.searchParams.get('code');
    } catch (error) {
      console.error('Failed to extract invite code:', error);
      return null;
    }
  }

  /**
   * 그룹 정보를 로컬 스토리지에 저장
   */
  static saveGroupToStorage(groupId: string, isHost: boolean): void {
    localStorage.setItem(this.GROUP_STORAGE_KEY, groupId);
    localStorage.setItem(this.HOST_STORAGE_KEY, isHost.toString());
  }

  /**
   * 현재 그룹 ID 가져오기
   */
  static getCurrentGroupId(): string | null {
    return localStorage.getItem(this.GROUP_STORAGE_KEY);
  }

  /**
   * 현재 사용자가 호스트인지 확인
   */
  static isCurrentUserHost(): boolean {
    const isHost = localStorage.getItem(this.HOST_STORAGE_KEY);
    return isHost === 'true';
  }

  /**
   * 그룹에 참여되어 있는지 확인
   */
  static isInGroup(): boolean {
    return this.getCurrentGroupId() !== null;
  }

  /**
   * 그룹 정보 삭제
   */
  static clearGroupFromStorage(): void {
    localStorage.removeItem(this.GROUP_STORAGE_KEY);
    localStorage.removeItem(this.HOST_STORAGE_KEY);
  }

  /**
   * 그룹 탈퇴
   */
  static async leaveGroup(): Promise<void> {
    try {
      // 실제 구현에서는 서버에 탈퇴 요청을 보내야 함
      this.clearGroupFromStorage();
    } catch (error) {
      console.error('Failed to leave group:', error);
      throw new Error('그룹 탈퇴에 실패했습니다.');
    }
  }

  /**
   * 그룹 상태 검증
   */
  static async validateGroupAccess(): Promise<boolean> {
    try {
      const groupId = this.getCurrentGroupId();
      const walletAddress = WalletService.getCurrentWalletAddress();

      if (!groupId || !walletAddress) {
        return false;
      }

      // 그룹이 존재하고 사용자가 멤버인지 확인
      const group = await apiService.getGroupInfo(groupId);
      const isMember = group.members.some(
        member => member.walletAddress === walletAddress
      );

      return isMember;
    } catch (error) {
      console.error('Failed to validate group access:', error);
      return false;
    }
  }

  /**
   * 그룹 멤버 검색
   */
  static async findMemberByAddress(
    walletAddress: string,
    groupId?: string
  ): Promise<GroupMember | null> {
    try {
      const members = await this.getGroupMembers(groupId);
      return members.find(member => member.walletAddress === walletAddress) || null;
    } catch (error) {
      console.error('Failed to find member by address:', error);
      return null;
    }
  }

  /**
   * 현재 사용자의 그룹 내 정보 조회
   */
  static async getCurrentMemberInfo(): Promise<GroupMember | null> {
    try {
      const walletAddress = WalletService.getCurrentWalletAddress();
      if (!walletAddress) return null;

      return await this.findMemberByAddress(walletAddress);
    } catch (error) {
      console.error('Failed to get current member info:', error);
      return null;
    }
  }

  /**
   * 그룹 설정 업데이트 (호스트만 가능)
   */
  static async updateGroupSettings(settings: Partial<Group>): Promise<void> {
    try {
      if (!this.isCurrentUserHost()) {
        throw new Error('호스트만 그룹 설정을 변경할 수 있습니다.');
      }

      // 실제 구현에서는 서버에 업데이트 요청을 보내야 함
      console.log('Group settings update requested:', settings);
    } catch (error) {
      console.error('Failed to update group settings:', error);
      throw new Error('그룹 설정 업데이트에 실패했습니다.');
    }
  }

  /**
   * 멤버 권한 관리 (호스트만 가능)
   */
  static async updateMemberPermissions(
    memberId: string,
    permissions: any
  ): Promise<void> {
    try {
      if (!this.isCurrentUserHost()) {
        throw new Error('호스트만 멤버 권한을 변경할 수 있습니다.');
      }

      // 실제 구현에서는 서버에 권한 업데이트 요청을 보내야 함
      console.log('Member permissions update requested:', { memberId, permissions });
    } catch (error) {
      console.error('Failed to update member permissions:', error);
      throw new Error('멤버 권한 업데이트에 실패했습니다.');
    }
  }
}

export default GroupService;