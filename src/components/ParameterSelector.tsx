import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Shuffle } from 'lucide-react';

interface ParameterSelectorProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onRandom: () => void;
}

const ParameterSelector: React.FC<ParameterSelectorProps> = ({
  label,
  options,
  value,
  onChange,
  onRandom,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="group">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative" ref={dropdownRef}>
        <div 
          className={`flex items-center justify-between w-full p-4 border-2 rounded-lg bg-white cursor-pointer transition-all ${
            value 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={`truncate ${value ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            {value || `Select ${label}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg focus:outline-none transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onRandom();
              }}
              title="Random selection"
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-20 w-full mt-2 bg-white border-2 border-blue-200 rounded-lg shadow-xl">
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                <ul className="py-2">
                  {filteredOptions.map((option, index) => (
                    <li
                      key={index}
                      className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors text-sm ${
                        option === value ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-700'
                      }`}
                      onClick={() => handleSelect(option)}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No options found for "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParameterSelector;