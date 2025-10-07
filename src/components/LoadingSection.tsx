// Reusable loading component for better UX
interface LoadingSectionProps {
  height?: string;
  className?: string;
}

export default function LoadingSection({ 
  height = "h-96", 
  className = "" 
}: LoadingSectionProps) {
  return (
    <div className={`${height} bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse rounded-lg mx-4 my-8 ${className}`}>
      <div className="flex items-center justify-center h-full">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
