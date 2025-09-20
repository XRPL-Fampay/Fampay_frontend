import React from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  Crown,
  UserMinus,
  Home,
  CreditCard,
  Globe
} from 'lucide-react';

const GroupWalletSettings: React.FC = () => {
  const navigate = useNavigate();
  
  const members = [
    { id: 1, name: '홍길동', role: 'admin', joinDate: '2024-01-01' },
    { id: 2, name: '김철수', role: 'member', joinDate: '2024-01-05' },
    { id: 3, name: '이영희', role: 'member', joinDate: '2024-01-10' },
    { id: 4, name: '박민수', role: 'member', joinDate: '2024-01-15' }
  ];

  const handleRemoveMember = (memberId: number) => {
    console.log('Remove member:', memberId);
  };

  const handleAddMember = () => {
    navigate('/group/invite');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">그룹 설정</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Member Management Section */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#509AD6]" />
              <h2 className="text-lg font-semibold text-gray-900">인원 관리</h2>
            </div>
            <button
              onClick={handleAddMember}
              className="flex items-center space-x-1 bg-[#509AD6] text-white px-3 py-2 rounded-lg hover:bg-[#4A8BC2] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">초대</span>
            </button>
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#509AD6]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#509AD6] font-semibold text-sm">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{member.name}</span>
                      {member.role === 'admin' && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      가입일: {member.joinDate}
                    </div>
                  </div>
                </div>
                
                {member.role !== 'admin' && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wallet Settings */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">월렛 설정</h2>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-gray-900">월렛 이름 변경</span>
              <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-gray-900">알림 설정</span>
              <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-red-600">
              <span>월렛 삭제</span>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto flex">
          <button 
            onClick={() => navigate('/')}
            className="flex-1 flex flex-col items-center py-3 px-4 text-gray-500 hover:bg-gray-50"
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-sm font-medium">Home</span>
          </button>
          <button className="flex-1 flex flex-col items-center py-3 px-4 bg-[#509AD6] text-white">
            <CreditCard className="w-5 h-5 mb-1" />
            <span className="text-sm font-medium">Payment</span>
          </button>
          <button 
            onClick={() => navigate('/dues')}
            className="flex-1 flex flex-col items-center py-3 px-4 text-gray-500 hover:bg-gray-50"
          >
            <Globe className="w-5 h-5 mb-1" />
            <span className="text-sm font-medium">Staking</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupWalletSettings;