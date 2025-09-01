import React, { useState, useEffect } from "react";

 export const Loader = ({
  isLoading = true,
  message = "Loading...",
  showProgress = true,
  size = "medium",
}) => {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState("");


  // Animate dots in loading text
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Size variants
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-12 h-12",
    large: "w-16 h-16",
  };

  const containerSizes = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  };

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-6 p-8">
        {/* Main Spinner */}
        <div className="relative">
          {/* Outer spinning ring */}
          <div
            className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin`}
          >
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          </div>

          {/* Inner pulsing dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className={`text-center ${containerSizes[size]}`}>
          <h3 className="font-medium text-gray-800 mb-2">
            {message}
            {dots}
          </h3>

          {/* Progress Bar */}
          {showProgress && (
            <div className="w-64 max-w-xs">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Please wait</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-blue-400 rounded-full animate-bounce opacity-40`}
              style={{
                left: `${20 + i * 15}%`,
                top: `${40 + (i % 2) * 20}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${2 + i * 0.1}s`,
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};
