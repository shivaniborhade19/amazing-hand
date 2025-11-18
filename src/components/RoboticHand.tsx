import { useState } from "react";

interface InteractivePoint {
  id: string;
  x: number; // percentage
  y: number; // percentage
  label: string;
  code: string;
}

interface RoboticHandProps {
  isInteractive?: boolean;
  points?: InteractivePoint[];
  dotColor?: string;
  onInteraction?: (point: InteractivePoint) => void;
  onBackgroundClick?: () => void;
}

export default function RoboticHand({
  onInteraction,
  isInteractive,
  points = [],
  dotColor = "blue",
  onBackgroundClick,
}: RoboticHandProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full">
      {/* Background clickable layer */}
      {onBackgroundClick && (
        <div
          className="absolute inset-0 w-full h-full cursor-pointer"
          onClick={onBackgroundClick}
        />
      )}

      {/* Interactive Dots */}
      {isInteractive &&
        points.map((point) => (
          <button
            key={point.id}
            className={`absolute w-20 h-20 rounded-full border-2 transition-all duration-300 ${
              hoveredPoint === point.id ? "scale-200" : "hover:scale-125"
            }`}
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              transform: "translate(-50%, -50%)",
              borderColor: 'blue', 
              // example: blue for landing, red for split
              backgroundColor: 'transparent', // ✅ make it transparent
            }}
            onMouseEnter={() => setHoveredPoint(point.id)}
            onMouseLeave={() => setHoveredPoint(null)}
            onClick={(e) => {
              e.stopPropagation();
              onInteraction?.(point);
            }}
          />
        ))}
    </div>
  );
}
