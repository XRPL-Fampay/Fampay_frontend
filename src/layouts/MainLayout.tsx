import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { 
  Home, 
  CreditCard, 
  Settings, 
  User, 
  LogOut,
  Bell,
  Menu,
  X,
  Wallet,
  Users,
  ArrowLeftRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useWallet } from '../hooks/useWallet';
import { useGroup } from '../hooks/useGroup';
import WalletHeader from '../components/WalletHeader';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { disconnectWallet, address } = useWallet();
  const { currentGroup, isHost, leaveGroup } = useGroup();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const navigationItems = [
    {
      label: '홈',
      icon: Home,
      path: '/dashboard',
      description: '대시보드'
    },
    {
      label: '회비납부',
      icon: CreditCard,
      path: '/dues',
      description: '회비 납부'
    },
    {
      label: '정기회비',
      icon: ArrowLeftRight,
      path: '/escrow',
      description: '정기 회비 관리'
    },
    {
      label: '현금화',
      icon: Wallet,
      path: '/cashout',
      description: '잔액 현금화'
    }
  ];

  const handleLogout = async () => {
    try {
      await leaveGroup.mutateAsync();
      disconnectWallet();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Menu and Logo */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GP</span>
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">GroupPay</h1>
                  {currentGroup && (
                    <p className="text-xs text-gray-500 truncate max-w-32">
                      {currentGroup.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Wallet and Notifications */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <WalletHeader 
                compact={true}
                showBalance={true}
                showNetworkStatus={true}
              />
              
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors sm:hidden"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
          <div className="bg-white w-80 h-full p-6 overflow-y-auto">
            {/* User Info */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {isHost ? '운영진' : '멤버'}
                  </p>
                  {address && (
                    <p className="text-sm text-gray-500">
                      {formatAddress(address)}
                    </p>
                  )}
                </div>
              </div>
              
              {currentGroup && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {currentGroup.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    멤버 {currentGroup.members.length}명
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="space-y-2 mb-6">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors text-left',
                    isActiveRoute(item.path)
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </button>
              ))}
            </nav>

            {/* Settings and Logout */}
            <div className="border-t border-gray-200 pt-6 space-y-2">
              <button
                onClick={() => {
                  navigate('/settings');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-left"
              >
                <Settings className="w-5 h-5" />
                <span>설정</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="w-5 h-5" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-md mx-auto w-full">
        {children || <Outlet />}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 sticky bottom-0 z-40">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors',
                  isActiveRoute(item.path)
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5',
                  isActiveRoute(item.path) && 'text-blue-600'
                )} />
                <span className={cn(
                  'text-xs font-medium',
                  isActiveRoute(item.path) && 'text-blue-600'
                )}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute top-16 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">알림</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    새로운 회비 납부
                  </p>
                  <p className="text-xs text-gray-500">
                    홍길동님이 월회비를 납부했습니다.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">5분 전</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    정기 회비 실행
                  </p>
                  <p className="text-xs text-gray-500">
                    월회비 자동 납부가 완료되었습니다.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">1시간 전</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowNotifications(false)}
              className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              모든 알림 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backButton?: boolean;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  backButton = false,
  className
}) => {
  const navigate = useNavigate();

  return (
    <div className={cn('px-4 py-6 bg-white border-b border-gray-200', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {backButton && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        {action && (
          <div>{action}</div>
        )}
      </div>
    </div>
  );
};

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  padding = true
}) => {
  return (
    <div className={cn(
      'flex-1 bg-gray-50',
      padding && 'p-4',
      className
    )}>
      {children}
    </div>
  );
};

export default MainLayout;