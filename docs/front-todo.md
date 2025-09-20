# Frontend Todo List

## 1. 프로젝트 설정 (30분)
- [x] React + TypeScript 프로젝트 생성 (Vite)
- [x] 필요 패키지 설치
  - [x] axios
  - [x] react-router (v7)
  - [x] tailwindcss (v4)
  - [x] @tanstack/react-query (상태관리)
  - [x] lucide-react (아이콘)
  - [x] sonner (토스트)
  - [x] next-themes (다크모드)
  - [x] shadcn/ui 컴포넌트 (clsx, tailwind-merge, class-variance-authority)
  - [ ] xrpl (XRPL SDK)
- [ ] 모바일 반응형 레이아웃 설정

## 2. 라우팅 구조 (30분)
- [ ] `/` - 랜딩/로그인 페이지
- [ ] `/group/create` - 그룹 생성 (운영진)
- [ ] `/group/join` - 그룹 참여 (멤버)
- [ ] `/home` - 메인 대시보드
- [ ] `/dues` - 회비 납부 화면
- [ ] `/escrow` - 정기 회비 관리
- [ ] `/cashout` - 현금화

## 3. 인증 및 그룹 관리 (1시간)
### 운영진 플로우
- [ ] 그룹 생성 폼
- [ ] 지갑 주소 연결
- [ ] 초대 링크 생성 UI
- [ ] 멤버 관리 화면

### 예시 코드 - 그룹 생성
```typescript
// components/CreateGroup.tsx
import { useState } from 'react';
import axios from 'axios';

function CreateGroup() {
  const [groupName, setGroupName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [groupData, setGroupData] = useState(null);
  
  const handleCreate = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/group/create', {
        name: groupName,
        hostWalletAddress: walletAddress
      });
      
      setGroupData(response.data);
      // Save to localStorage
      localStorage.setItem('groupId', response.data.groupId);
      localStorage.setItem('isHost', 'true');
      localStorage.setItem('walletAddress', walletAddress);
      
    } catch (error) {
      console.error('Group creation failed:', error);
    }
    setLoading(false);
  };
  
  return (
    <div className="p-4">
      <input 
        type="text" 
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        placeholder="그룹 모임 이름"
        className="w-full p-2 border rounded mb-4"
      />
      <input 
        type="text" 
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
        placeholder="XRPL 지갑 주소 (rXXX...)"
        className="w-full p-2 border rounded"
      />
      <button 
        onClick={handleCreate}
        disabled={loading || !walletAddress}
        className="mt-4 w-full bg-blue-500 text-white p-3 rounded"
      >
        {loading ? '생성 중...' : '모임통장 생성'}
      </button>
      
      {groupData && (
        <div className="mt-4 p-4 bg-yellow-100 rounded">
          <p>초대 링크: {groupData.inviteLink}</p>
          <p className="text-green-600 mt-2">
            ✅ 모임통장이 생성되었습니다
          </p>
        </div>
      )}
    </div>
  );
}
```

### 멤버 플로우
- [ ] 초대 링크로 조인
- [ ] 닉네임/프로필 설정
- [ ] 지갑 주소 입력 및 연결

## 4. 메인 대시보드 (1시간)
- [ ] 그룹 총 잔액 큰 카드 UI
- [ ] 그룹 멤버 리스트
  - [ ] 프로필 이미지/이름
  - [ ] 각자 잔액 표시
  - [ ] 터치 시 회비 납부 화면 이동
- [ ] 최근 거래 내역 (5개)
- [ ] 내 개인 잔액 표시

### 예시 코드 - 대시보드
```typescript
// components/Dashboard.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [groupBalance, setGroupBalance] = useState(0);
  const [myBalance, setMyBalance] = useState(0);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    const groupId = localStorage.getItem('groupId');
    const walletAddress = localStorage.getItem('walletAddress');
    
    // Fetch my balance
    const balanceRes = await axios.get(`/api/wallet/${walletAddress}/balance`);
    setMyBalance(balanceRes.data.balance);
    
    // Fetch group info and total balance
    const groupRes = await axios.get(`/api/group/${groupId}`);
    setMembers(groupRes.data.members);
    setGroupBalance(groupRes.data.totalBalance);
    
    // Fetch recent transactions
    const txRes = await axios.get(`/api/wallet/${walletAddress}/transactions`);
    setTransactions(txRes.data.slice(0, 5));
  };
  
  return (
    <div className="p-4">
      {/* Group Balance Card */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-lg">
        <p className="text-sm opacity-80">그룹 총 잔액</p>
        <p className="text-3xl font-bold">{groupBalance} XRP</p>
      </div>
      
      {/* My Balance */}
      <div className="mt-4 bg-gray-100 p-4 rounded-lg">
        <p className="text-sm text-gray-600">내 잔액</p>
        <p className="text-xl font-bold">{myBalance} XRP</p>
      </div>
      
      {/* Members List */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">그룹 멤버</h3>
        {members.map(member => (
          <div 
            key={member.memberId}
            onClick={() => navigate(`/dues?to=${member.memberId}`)}
            className="flex items-center p-3 bg-white rounded-lg mb-2 shadow"
          >
            <div className="w-12 h-12 bg-gray-300 rounded-full mr-3" />
            <div className="flex-1">
              <p className="font-medium">{member.nickname}</p>
              <p className="text-sm text-gray-500">{member.balance} XRP</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent Transactions */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">최근 거래</h3>
        {transactions.map(tx => (
          <div key={tx.hash} className="p-2 border-b">
            <p className="text-sm">{tx.type === 'dues' ? '회비납부' : tx.type === 'expense' ? '지출' : '수신'}</p>
            <p className="text-xs text-gray-500">{tx.amount} XRP</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 5. 회비 납부 화면 (1.5시간)
### 즉시 납부
- [ ] 납부 항목 선택 (월회비, 특별회비 등)
- [ ] 큰 숫자 패드 UI
- [ ] 금액 입력 필드
- [ ] 메모 입력 (선택사항)
- [ ] 스와이프 확인 제스처

### 예시 코드 - 회비 납부 화면
```typescript
// components/PayDues.tsx
import { useState } from 'react';
import axios from 'axios';

function PayDues() {
  const [duesType, setDuesType] = useState('monthly');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  
  const handlePay = async () => {
    try {
      const groupId = localStorage.getItem('groupId');
      const walletAddress = localStorage.getItem('walletAddress');
      
      if (isRecurring) {
        // Create recurring dues payment
        await axios.post('/api/escrow/create', {
          groupId,
          fromWallet: walletAddress,
          duesType,
          amount: parseFloat(amount),
          frequency: 'monthly',
          memo
        });
      } else {
        // Immediate dues payment
        await axios.post('/api/payment/dues', {
          groupId,
          fromWallet: walletAddress,
          duesType,
          amount: parseFloat(amount),
          memo
        });
      }
      
      alert('회비 납부 완료!');
      navigate('/home');
      
    } catch (error) {
      alert('납부 실패: ' + error.message);
    }
  };
  
  const NumberPad = () => {
    const numbers = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];
    
    return (
      <div className="grid grid-cols-3 gap-2 mt-4">
        {numbers.map(num => (
          <button
            key={num}
            onClick={() => {
              if (num === '⌫') {
                setAmount(amount.slice(0, -1));
              } else {
                setAmount(amount + num);
              }
            }}
            className="p-4 bg-gray-100 rounded text-xl font-medium"
          >
            {num}
          </button>
        ))}
      </div>
    );
  };
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">회비 납부</h2>
      
      {/* Dues Type Selection */}
      <select 
        value={duesType}
        onChange={(e) => setDuesType(e.target.value)}
        className="w-full p-3 border rounded mb-4"
      >
        <option value="monthly">월 회비</option>
        <option value="special">특별 회비</option>
        <option value="event">행사비</option>
      </select>
      
      {/* Amount Display */}
      <div className="text-center py-8">
        <input
          type="text"
          value={amount}
          readOnly
          placeholder="0"
          className="text-4xl font-bold text-center w-full"
        />
        <p className="text-gray-500 mt-2">XRP</p>
      </div>
      
      {/* Number Pad */}
      <NumberPad />
      
      {/* Memo */}
      <input
        type="text"
        placeholder="메모 (선택사항)"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        className="w-full p-3 border rounded mt-4"
      />
      
      {/* Recurring Toggle */}
      <label className="flex items-center mt-4">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="mr-2"
        />
        정기 납부 설정
      </label>
      
      {/* Pay Button */}
      <button
        onClick={handlePay}
        className="w-full bg-green-500 text-white p-4 rounded-lg mt-6 text-lg font-medium"
      >
        회비 납부하기
      </button>
    </div>
  );
}
```

### 정기 회비 설정
- [ ] 주기 선택 (매일/매주/매월)
- [ ] 시작 날짜 선택
- [ ] 종료 조건 설정
- [ ] 확인 및 저장

## 6. 정기 회비 관리 (1시간)
- [ ] 활성 정기 회비 목록
  - [ ] 회비 유형 구분
  - [ ] 다음 실행 날짜
  - [ ] 금액 및 목적
- [ ] 정기 회비 상세 보기
- [ ] 수정/삭제 기능
- [ ] 납부 히스토리

### 예시 코드 - 정기 회비 관리
```typescript
// components/DuesManager.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function DuesManager() {
  const [dues, setDues] = useState([]);
  
  useEffect(() => {
    fetchDues();
  }, []);
  
  const fetchDues = async () => {
    const groupId = localStorage.getItem('groupId');
    const response = await axios.get(`/api/escrow/list?groupId=${groupId}`);
    setDues(response.data);
  };
  
  const cancelDues = async (escrowId) => {
    if (confirm('정기 회비를 취소하시겠습니까?')) {
      await axios.delete(`/api/escrow/${escrowId}`);
      fetchDues();
    }
  };
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">정기 회비 관리</h2>
      
      {dues.map(dues => (
        <div key={dues.escrowId} className="bg-white p-4 rounded-lg shadow mb-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">
                {dues.duesType === 'monthly' && '월 회비'}
                {dues.duesType === 'special' && '특별 회비'}
                {dues.duesType === 'event' && '행사비'}
              </p>
              <p className="text-2xl font-bold mt-1">{dues.amount} XRP</p>
              <p className="text-sm text-gray-500 mt-2">
                {dues.frequency === 'daily' && '매일'}
                {dues.frequency === 'weekly' && '매주'}
                {dues.frequency === 'monthly' && '매월'}
              </p>
              <p className="text-xs text-gray-400">
                다음 실행: {new Date(dues.nextExecution).toLocaleDateString()}
              </p>
            </div>
            
            <button
              onClick={() => cancelDues(dues.escrowId)}
              className="text-red-500 text-sm"
            >
              취소
            </button>
          </div>
        </div>
      ))}
      
      {dues.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          설정된 정기 회비가 없습니다
        </p>
      )}
    </div>
  );
}
```

## 7. 현금화 화면 (30분)
- [ ] 출금 가능 잔액 표시
- [ ] 금액 입력
- [ ] 등록된 카드 목록
- [ ] 선택 후 확인
- [ ] 트랜잭션 상태 표시

## 8. UI/UX 컴포넌트 (1시간)
- [ ] 로딩 스피너 (lucide-react 활용)
- [ ] 토스트 메시지 (sonner 활용)
- [ ] 모달 컴포넌트 (shadcn/ui Dialog)
- [ ] 바텀 시트
- [ ] 스와이프 제스처
- [ ] 숫자 패드
- [ ] 프로필 아바타

## 9. API 연동 (1.5시간)
### 그룹 관리
- [ ] POST `/api/group/create`
- [ ] POST `/api/group/join`
- [ ] GET `/api/group/info`

### 지갑 관리 (XRPL 직접 연동)
- [ ] XRPL Client 연결 (testnet)
- [ ] 지갑 잔액 조회 (getXrpBalance)
- [ ] 거래 내역 조회 (account_tx)
- [ ] GET `/api/wallet/:address/balance`
- [ ] GET `/api/wallet/:address/transactions`

### 회비 납부
- [ ] POST `/api/payment/dues`
- [ ] POST `/api/escrow/create`
- [ ] GET `/api/escrow/list`
- [ ] DELETE `/api/escrow/:id`

### 현금화
- [ ] POST `/api/cashout/request`
- [ ] GET `/api/cashout/cards`

## 10. 상태 관리 (30분)
- [ ] @tanstack/react-query로 서버 상태 관리
- [ ] 유저 정보 (운영진/멤버 구분)
- [ ] 그룹 정보
- [ ] 지갑 주소 및 잔액
- [ ] 거래 내역
- [ ] 정기 회비 목록

## 11. 에러 처리 (30분)
- [ ] API 에러 핸들링
- [ ] 네트워크 에러 처리
- [ ] 폼 유효성 검사
- [ ] 사용자 피드백 UI

## 12. 모바일 최적화 (30분)
- [ ] 터치 최적화
- [ ] 스크롤 성능
- [ ] 이미지 최적화
- [ ] PWA 설정 (선택사항)