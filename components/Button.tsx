import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

export default function Button({ 
  children, 
  onClick, 
  disabled, 
  variant = 'primary',
  type = 'button',
  fullWidth = false
}: ButtonProps) {
  const styles = {
    primary: {
      backgroundColor: '#ffd624',
      color: '#000000',
      border: 'none'
    },
    secondary: {
      backgroundColor: '#000000',
      color: '#ffffff',
      border: '2px solid #ffd624'
    },
    danger: {
      backgroundColor: '#ff0000',
      color: '#ffffff',
      border: 'none'
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="py-4 px-8 font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
      style={{
        ...styles[variant],
        width: fullWidth ? '100%' : 'auto'
      }}
    >
      {children}
    </button>
  );
}
