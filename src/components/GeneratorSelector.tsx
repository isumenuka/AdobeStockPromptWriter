import React from 'react';
import { Sparkles, Waves, Cloud, Frame, Palette } from 'lucide-react';

interface GeneratorSelectorProps {
  selectedGenerator: 'texture' | 'abstractwave' | 'sky' | 'whiteframe' | 'gradientflow';
  onGeneratorChange: (generator: 'texture' | 'abstractwave' | 'sky' | 'whiteframe' | 'gradientflow') => void;
}

const GeneratorSelector: React.FC<GeneratorSelectorProps> = ({
  selectedGenerator,
  onGeneratorChange,
}) => {
  const generators = [
    {
      id: 'gradientflow' as const,
      name: 'GradientFlow',
      icon: Palette,
      color: 'purple',
      description: 'Abstract gradients'
    },
    {
      id: 'texture' as const,
      name: 'Texture',
      icon: Sparkles,
      color: 'amber',
      description: 'Material surfaces'
    },
    {
      id: 'abstractwave' as const,
      name: 'AbstractWave',
      icon: Waves,
      color: 'blue',
      description: 'Flowing designs'
    },
    {
      id: 'sky' as const,
      name: 'Sky',
      icon: Cloud,
      color: 'sky',
      description: 'Atmospheric scenes'
    },
    {
      id: 'whiteframe' as const,
      name: 'White Frame',
      icon: Frame,
      color: 'gray',
      description: 'Interior mockups'
    }
  ];

  const getColors = (color: string, isSelected: boolean) => {
    const colorMap = {
      purple: {
        bg: isSelected ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200 hover:border-purple-200 hover:bg-purple-25',
        text: isSelected ? 'text-purple-900' : 'text-gray-700 hover:text-purple-700',
        icon: isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600',
        accent: isSelected ? 'bg-purple-600' : ''
      },
      amber: {
        bg: isSelected ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 hover:border-amber-200 hover:bg-amber-25',
        text: isSelected ? 'text-amber-900' : 'text-gray-700 hover:text-amber-700',
        icon: isSelected ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-amber-100 group-hover:text-amber-600',
        accent: isSelected ? 'bg-amber-600' : ''
      },
      blue: {
        bg: isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-25',
        text: isSelected ? 'text-blue-900' : 'text-gray-700 hover:text-blue-700',
        icon: isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600',
        accent: isSelected ? 'bg-blue-600' : ''
      },
      sky: {
        bg: isSelected ? 'bg-sky-50 border-sky-200' : 'bg-white border-gray-200 hover:border-sky-200 hover:bg-sky-25',
        text: isSelected ? 'text-sky-900' : 'text-gray-700 hover:text-sky-700',
        icon: isSelected ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-sky-100 group-hover:text-sky-600',
        accent: isSelected ? 'bg-sky-600' : ''
      },
      gray: {
        bg: isSelected ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-25',
        text: isSelected ? 'text-gray-900' : 'text-gray-700 hover:text-gray-800',
        icon: isSelected ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:text-gray-700',
        accent: isSelected ? 'bg-gray-600' : ''
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="text-center">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Choose Your Generator</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Select the type of content you want to create</p>
        </div>
      </div>

      {/* Generator Grid */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {generators.map((generator) => {
            const isSelected = selectedGenerator === generator.id;
            const colors = getColors(generator.color, isSelected);
            const Icon = generator.icon;
            
            return (
              <button
                key={generator.id}
                onClick={() => onGeneratorChange(generator.id)}
                className={`group relative flex flex-col items-center p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${colors.bg}`}
              >
                {/* Icon */}
                <div className={`p-2 sm:p-3 rounded-lg mb-2 sm:mb-3 transition-all duration-200 ${colors.icon}`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                
                {/* Text */}
                <div className="text-center">
                  <div className={`font-semibold text-xs sm:text-sm mb-1 transition-colors ${colors.text}`}>
                    {generator.name}
                  </div>
                  <div className="text-xs text-gray-500 leading-tight hidden sm:block">
                    {generator.description}
                  </div>
                </div>

                {/* Active indicator */}
                {isSelected && (
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 sm:w-8 h-1 rounded-t-full ${colors.accent}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current selection info */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            {(() => {
              const currentGenerator = generators.find(g => g.id === selectedGenerator);
              const Icon = currentGenerator?.icon || Sparkles;
              const colors = getColors(currentGenerator?.color || 'gray', true);
              
              return (
                <>
                  <div className={`p-2 rounded-lg ${colors.icon} flex-shrink-0`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {currentGenerator?.name} Generator
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {selectedGenerator === 'gradientflow' && 
                        "Create stunning abstract gradient backgrounds with flowing colors, grainy textures, and artistic blur effects."
                      }
                      {selectedGenerator === 'texture' && 
                        "Generate professional texture prompts with realistic materials, color combinations, and lighting effects."
                      }
                      {selectedGenerator === 'abstractwave' && 
                        "Design beautiful abstract wavy layers with smooth gradients, depth effects, and harmonious color palettes."
                      }
                      {selectedGenerator === 'sky' && 
                        "Create breathtaking atmospheric sky scenes with celestial objects, cloud formations, and dramatic lighting."
                      }
                      {selectedGenerator === 'whiteframe' && 
                        "Generate professional interior mockups with empty white frames, furniture arrangements, and atmospheric lighting."
                      }
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratorSelector;