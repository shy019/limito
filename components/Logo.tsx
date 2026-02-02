import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  href?: string;
}

const sizes = {
  sm: 'text-3xl',
  md: 'text-5xl',
  lg: 'text-8xl',
  xl: 'text-9xl'
};

export default function Logo({ size = 'md', color = '#ffffff', href }: LogoProps) {
  const content = (
    <span className={`logo ${sizes[size]}`} style={{ color }}>
      LIMITØ
    </span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
