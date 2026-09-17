import React from 'react';

interface EsnLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  textColor?: string;
}

export const EsnLogo: React.FC<EsnLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  textColor = 'text-slate-900 dark:text-white',
}) => {
  const iconDimensions = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  const titleSize = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
  }[size];

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Bespoke ESN Varsity Athletic Shield Insignia */}
      <div className={`${iconDimensions} relative flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Outer Varsity Shield in ESN Crimson Red */}
          <path
            d="M12 2L4 5.5V11.5C4 16.8 7.4 21.2 12 22.5C16.6 21.2 20 16.8 20 11.5V5.5L12 2Z"
            fill="#ff0046"
          />
          {/* Inner Navy Accent Trim */}
          <path
            d="M12 4L5.5 6.8V11.5C5.5 15.8 8.3 19.4 12 20.6C15.7 19.4 18.5 15.8 18.5 11.5V6.8L12 4Z"
            fill="#0e1e2d"
            opacity="0.3"
          />
          {/* Stylized Sharp 'E' Athletics Crest Monogram */}
          <path
            d="M8.5 7.5H15.5V9.3H11V11.2H14.5V13H11V15.2H15.5V17H8.5V7.5Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-black ${titleSize} tracking-tight uppercase font-sans ${textColor}`}>
            ESN
          </span>
          <span className="text-[8.5px] font-bold tracking-widest uppercase text-slate-400">
            EGERTON SPORTS NETWORK
          </span>
        </div>
      )}
    </div>
  );
};
