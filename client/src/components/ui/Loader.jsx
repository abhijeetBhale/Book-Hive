import React from 'react';
import DotWaveLoader from './DotWaveLoader';

// Drop-in replacement for Lucide React Loader component
const Loader = ({ size = 24, className = '', color = '#C44BEF', ...props }) => {
  // If animate-spin class is used, show the dot wave loader
  if (className.includes('animate-spin')) {
    return <DotWaveLoader size={size} color={color} speed={0.6} />;
  }
  
  // Fallback to a simple spinning circle for other cases
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color }}
      {...props}
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
};

export default Loader;