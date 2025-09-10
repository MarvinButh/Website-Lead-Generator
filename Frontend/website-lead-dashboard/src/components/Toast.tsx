"use client";
import React, { useEffect } from "react";

type ToastProps = {
  id?: string;
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
};

export default function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const bg = type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-gray-800";
  const icon = type === "success" ? "✓" : type === "error" ? "⚠" : "i";

  return (
    <div className={`pointer-events-auto max-w-sm w-full ${bg} text-white shadow-lg rounded-md p-3 flex items-start gap-3`}>
      <div className="text-sm font-bold leading-none">{icon}</div>
      <div className="text-sm flex-1">{message}</div>
      <button onClick={() => onClose && onClose()} className="text-white text-opacity-80 hover:text-opacity-100 ml-2">✕</button>
    </div>
  );
}
