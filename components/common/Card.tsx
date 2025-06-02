
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  bodyClassName?: string;
  // सफलता prop is not used for border color in the new design.
}

const Card: React.FC<CardProps> = ({ title, children, className = '', titleClassName= '', bodyClassName='' }) => {
  const baseBorderColor = 'border-grey-100'; // Uses Tailwind class mapping to var(--grey-100)

  return (
    <div className={`bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] rounded-lg overflow-hidden border ${baseBorderColor} ${className}`}>
      {title && (
        <div className={`px-6 py-3 sm:px-6 bg-gray-50 border-b ${baseBorderColor} ${titleClassName}`}> {/* Header padding: px-6, py-3 */}
          <h3 className="text-base leading-6 font-medium text-textHeader">{title}</h3>
        </div>
      )}
      {/* Default body padding adjusted to px-6 (24px) horizontal, py-4 (16px) vertical */}
      <div className={`px-6 py-4 ${bodyClassName}`}> 
        {children}
      </div>
    </div>
  );
};

export default Card;