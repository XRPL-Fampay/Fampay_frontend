import React from 'react';
import { Crown, Send, MoreVertical, User } from 'lucide-react';
import { cn } from '../lib/utils';
import type { GroupMember } from '../types';

interface MemberCardProps {
  member: GroupMember;
  isHost?: boolean;
  isCurrentUser?: boolean;
  showBalance?: boolean;
  showActions?: boolean;
  onClick?: (member: GroupMember) => void;
  onSendMoney?: (member: GroupMember) => void;
  onMoreActions?: (member: GroupMember) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  isHost = false,
  isCurrentUser = false,
  showBalance = true,
  showActions = true,
  onClick,
  onSendMoney,
  onMoreActions,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const avatarSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: {
      name: 'text-sm',
      balance: 'text-xs',
      address: 'text-xs'
    },
    md: {
      name: 'text-base',
      balance: 'text-sm',
      address: 'text-xs'
    },
    lg: {
      name: 'text-lg',
      balance: 'text-base',
      address: 'text-sm'
    }
  };

  const formatBalance = (balance: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(balance);
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getInitials = (nickname: string): string => {
    return nickname
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (balance: number): string => {
    if (balance > 100) return 'text-green-600';
    if (balance > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div 
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200',
        'hover:shadow-md hover:border-gray-300',
        onClick && 'cursor-pointer hover:scale-[1.02]',
        isCurrentUser && 'border-blue-200 bg-blue-50',
        sizeClasses[size],
        className
      )}
      onClick={() => onClick?.(member)}
    >
      <div className="flex items-center justify-between">
        {/* Left: Avatar and Info */}
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className={cn(
            'rounded-full flex items-center justify-center text-white font-medium',
            avatarSizeClasses[size],
            member.profileImage ? 'overflow-hidden' : 'bg-gradient-to-r from-blue-500 to-purple-600'
          )}>
            {member.profileImage ? (
              <img 
                src={member.profileImage} 
                alt={member.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className={textSizeClasses[size].name}>
                {getInitials(member.nickname)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className={cn(
                'font-medium text-gray-900 truncate',
                textSizeClasses[size].name
              )}>
                {member.nickname}
              </h3>
              {isHost && (
                <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              )}
              {isCurrentUser && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  나
                </span>
              )}
            </div>
            
            {showBalance && (
              <div className="flex items-center space-x-2 mt-1">
                <span className={cn(
                  'font-semibold',
                  textSizeClasses[size].balance,
                  getStatusColor(member.balance)
                )}>
                  {formatBalance(member.balance)} XRP
                </span>
              </div>
            )}
            
            <p className={cn(
              'text-gray-500 truncate mt-1',
              textSizeClasses[size].address
            )}>
              {formatAddress(member.walletAddress)}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        {showActions && !isCurrentUser && (
          <div className="flex items-center space-x-2">
            {onSendMoney && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendMoney(member);
                }}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="송금하기"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
            
            {onMoreActions && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoreActions(member);
                }}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                title="더보기"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface MemberListProps {
  members: GroupMember[];
  currentUserAddress?: string;
  hostAddress?: string;
  onMemberClick?: (member: GroupMember) => void;
  onSendMoney?: (member: GroupMember) => void;
  onMoreActions?: (member: GroupMember) => void;
  className?: string;
  showBalance?: boolean;
  showActions?: boolean;
  emptyMessage?: string;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  currentUserAddress,
  hostAddress,
  onMemberClick,
  onSendMoney,
  onMoreActions,
  className,
  showBalance = true,
  showActions = true,
  emptyMessage = '그룹 멤버가 없습니다.'
}) => {
  if (members.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {members.map((member) => (
        <MemberCard
          key={member.memberId}
          member={member}
          isHost={member.walletAddress === hostAddress}
          isCurrentUser={member.walletAddress === currentUserAddress}
          showBalance={showBalance}
          showActions={showActions}
          onClick={onMemberClick}
          onSendMoney={onSendMoney}
          onMoreActions={onMoreActions}
        />
      ))}
    </div>
  );
};

interface SimpleMemberCardProps {
  member: GroupMember;
  isSelected?: boolean;
  onClick?: (member: GroupMember) => void;
  className?: string;
}

export const SimpleMemberCard: React.FC<SimpleMemberCardProps> = ({
  member,
  isSelected = false,
  onClick,
  className
}) => {
  const getInitials = (nickname: string): string => {
    return nickname
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div 
      className={cn(
        'flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200',
        'cursor-pointer hover:bg-gray-50',
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300',
        className
      )}
      onClick={() => onClick?.(member)}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
        {member.profileImage ? (
          <img 
            src={member.profileImage} 
            alt={member.nickname}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          getInitials(member.nickname)
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {member.nickname}
        </p>
        <p className="text-sm text-gray-500 truncate">
          {member.walletAddress.slice(0, 8)}...{member.walletAddress.slice(-6)}
        </p>
      </div>

      {/* Balance */}
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">
          {new Intl.NumberFormat('ko-KR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
          }).format(member.balance)}
        </p>
        <p className="text-xs text-gray-500">XRP</p>
      </div>
    </div>
  );
};

export default MemberCard;