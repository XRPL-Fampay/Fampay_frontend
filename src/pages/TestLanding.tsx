import React from 'react';

export const TestLanding: React.FC = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>GroupPay 테스트 페이지</h1>
      <p>페이지가 제대로 로드되었습니다!</p>
      <div style={{ marginTop: '20px' }}>
        <button style={{ padding: '10px 20px', margin: '10px' }}>
          새 모임통장 만들기
        </button>
        <button style={{ padding: '10px 20px', margin: '10px' }}>
          기존 모임통장 참여하기
        </button>
      </div>
      <div style={{ marginTop: '40px', color: '#666' }}>
        <p>현재 XRPL 패키지가 설치되지 않아 기본 기능이 비활성화되어 있습니다.</p>
        <p>npm install xrpl@3.0.0 명령어로 패키지를 설치해주세요.</p>
      </div>
    </div>
  );
};

export default TestLanding;