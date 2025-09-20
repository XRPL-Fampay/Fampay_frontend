import React from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft,
  Users,
  Settings,
  Plus,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const GroupWalletNew: React.FC = () => {
  const navigate = useNavigate();
  const [walletName, setWalletName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [members, setMembers] = React.useState([
    { id: 1, xrplAddress: '', invited: false }
  ]);
  const [isCreating, setIsCreating] = React.useState(false);

  const handleAddMember = () => {
    const newId = Math.max(...members.map(m => m.id)) + 1;
    setMembers([...members, { id: newId, xrplAddress: '', invited: false }]);
  };

  const handleRemoveMember = (id: number) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const handleMemberChange = (id: number, field: string, value: string) => {
    setMembers(members.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleInviteMember = (id: number) => {
    setMembers(members.map(m => 
      m.id === id ? { ...m, invited: true } : m
    ));
  };

  const handleCreateWallet = async () => {
    if (!walletName.trim()) {
      toast.error('Wallet name is required');
      return;
    }

    // Validate member addresses
    const validMembers = members.filter(m => m.xrplAddress.trim());
    const memberAddresses = validMembers.map(m => m.xrplAddress.trim());

    setIsCreating(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: walletName,
          description: description.trim() || undefined,
          memberAddresses: memberAddresses
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      const group = await response.json();
      
      toast.success('Group wallet created successfully!');
      
      // Show credential results if available
      if (group.memberCredentials && group.memberCredentials.length > 0) {
        const successCount = group.memberCredentials.filter((c: any) => c.success).length;
        const totalCount = group.memberCredentials.length;
        
        if (successCount === totalCount) {
          toast.success(`Credentials issued to all ${totalCount} members`);
        } else {
          toast.warning(`Credentials issued to ${successCount}/${totalCount} members`);
        }
      }

      // Navigate to group detail or home
      navigate(`/group/detail/${group.id}`);
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group wallet');
    } finally {
      setIsCreating(false);
    }
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
        <h1 className="text-lg font-bold text-gray-900">New Group Wallet</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto pb-24">
        {/* Wallet Basic Info */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-[#509AD6]" />
            <span>Basic Settings</span>
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Name
              </label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Enter wallet name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#509AD6] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter wallet description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#509AD6] focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Member Management */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#509AD6]" />
              <span>Member Management</span>
            </h2>
            <button
              onClick={handleAddMember}
              className="flex items-center space-x-1 bg-[#509AD6] text-white px-3 py-2 rounded-lg hover:bg-[#4A8BC2] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add</span>
            </button>
          </div>

          <div className="space-y-3">
            {members.map((member, index) => (
              <div key={member.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Member {index + 1}
                  </span>
                  {members.length > 1 && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="XRPL Address (e.g., rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH)"
                    value={member.xrplAddress || ''}
                    onChange={(e) => handleMemberChange(member.id, 'xrplAddress', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#509AD6] focus:border-transparent"
                  />
                  
                  <div className="flex justify-end">
                    {member.invited ? (
                      <span className="flex items-center space-x-1 text-green-600 text-sm">
                        <Check className="w-4 h-4" />
                        <span>Invited</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInviteMember(member.id)}
                        disabled={!member.xrplAddress}
                        className="px-3 py-1 text-sm bg-[#509AD6] text-white rounded hover:bg-[#4A8BC2] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Invite
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Auto Dues Setting</span>
              <input type="checkbox" className="rounded text-[#509AD6] focus:ring-[#509AD6]" />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Enable Notifications</span>
              <input type="checkbox" className="rounded text-[#509AD6] focus:ring-[#509AD6]" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Public Wallet</span>
              <input type="checkbox" className="rounded text-[#509AD6] focus:ring-[#509AD6]" />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleCreateWallet}
            disabled={!walletName || isCreating}
            className="w-full bg-[#509AD6] text-white py-3 rounded-lg font-medium hover:bg-[#4A8BC2] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isCreating ? 'Creating...' : 'Create Wallet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupWalletNew;