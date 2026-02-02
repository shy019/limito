import { ReactNode } from 'react';
import BackgroundOverlay from './BackgroundOverlay';

interface PageContainerProps {
  children: ReactNode;
  withBackground?: boolean;
}

export default function PageContainer({ children, withBackground = true }: PageContainerProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {withBackground && <BackgroundOverlay />}
      {children}
    </div>
  );
}
