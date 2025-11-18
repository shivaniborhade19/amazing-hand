import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavigationControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  showPrevious: boolean;
  showNext: boolean;
  
}

export default function NavigationControls({
  onPrevious,
  onNext,
  showPrevious,
  showNext,
}: NavigationControlsProps) {
  // Define the common styling for the circular, outlined buttons
  const buttonStyle = "absolute top-1/2 transform -translate-y-1/2 " +
                      "w-12 h-12 rounded-full border-2 border-gray-400 " + // Increased border size and visibility
                      "hover:border-gray-500 hover:bg-gray-100/90 hover:shadow-lg " + // Enhanced hover effect
                      "transition-all duration-300 bg-white/70 backdrop-blur-sm z-50"; // Added blur/transparency

  // Define the icon style
  const iconStyle = "w-6 h-6 text-gray-700 group-hover:text-gray-900 transition-colors duration-300";


  return (
    <>
      {showPrevious && (
        <Button
          // We use 'group' to enable styling of the child icon on hover
          className={`left-8 ${buttonStyle} group`} 
          onClick={onPrevious}
        >
          <ChevronLeft className={iconStyle} />
        </Button>
      )}

      {showNext && (
        <Button
          // We use 'group' to enable styling of the child icon on hover
          className={`right-8 ${buttonStyle} group`} 
          onClick={onNext}
        >
          <ChevronRight className={iconStyle} />
        </Button>
      )}
    </>
  );
}
