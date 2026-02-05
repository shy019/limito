export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spinner {
            animation: spin 1s linear infinite;
          }
        `
      }} />
      <div className="spinner" style={{
        width: '60px',
        height: '60px',
        border: '4px solid #333333',
        borderTop: '4px solid var(--accent-color, #ffd624)',
        borderRadius: '50%'
      }} />
    </div>
  );
}
