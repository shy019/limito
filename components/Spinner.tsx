export default function Spinner({ size = 24, color = 'var(--accent-color, #ffd624)' }: { size?: number; color?: string }) {
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      border: `3px solid rgba(255, 255, 255, 0.1)`,
      borderTop: `3px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
