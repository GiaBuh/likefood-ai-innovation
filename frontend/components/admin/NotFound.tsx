import React from 'react';

interface NotFoundProps {
  onGoHome: () => void;
}

const NotFound: React.FC<NotFoundProps> = ({ onGoHome }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: '5rem', marginBottom: '0.5rem', fontWeight: 700, color: '#64748b' }}>404</div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
        Không tìm thấy trang
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem', textAlign: 'center', maxWidth: 360 }}>
        Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <button
        onClick={onGoHome}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          color: '#fff',
          background: '#3b82f6',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = '#2563eb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = '#3b82f6';
        }}
      >
        Về trang chủ
      </button>
    </div>
  );
};

export default NotFound;
