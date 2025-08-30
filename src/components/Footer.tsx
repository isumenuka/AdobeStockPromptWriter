import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 mt-6 sm:mt-8">
      <div className="max-w-4xl mx-auto px-4 text-center text-gray-600 text-xs sm:text-sm">
        <p>Adobe Stock Supporter © {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
};

export default Footer;