
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed";
  
  let variantStyles = "";
  switch (variant) {
    case 'primary':
      variantStyles = "text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500";
      break;
    case 'secondary':
      variantStyles = "text-primary-700 bg-primary-100 hover:bg-primary-200 focus:ring-primary-500";
      break;
    case 'danger':
      variantStyles = "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500";
      break;
  }

  return (
    <button
      {...props}
      className={`${baseStyles} ${variantStyles}`}
    >
      {children}
    </button>
  );
};

export default Button;
    