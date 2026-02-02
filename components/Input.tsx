interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
}

export default function Input({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  required = false,
  error = false
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none font-bold transition-all"
      style={{
        borderColor: error ? '#ff0000' : 'rgba(255, 255, 255, 0.3)',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: '#ffffff',
        width: 'calc(100% - 7px)'
      }}
    />
  );
}
