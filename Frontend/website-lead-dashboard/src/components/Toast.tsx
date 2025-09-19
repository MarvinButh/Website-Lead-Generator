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

  const alertClass = type === "success" ? "alert-success" : type === "error" ? "alert-error" : "alert-info";
  const icon = type === "success" ? "✓" : type === "error" ? "⚠" : "i";

  return (
    <div className={`alert ${alertClass} shadow-lg max-w-sm w-full pointer-events-auto`}>
      <div className="text-sm font-bold leading-none">{icon}</div>
      <div className="text-sm flex-1">{message}</div>
      <button onClick={() => onClose && onClose()} className="btn btn-sm btn-circle btn-ghost">✕</button>
    </div>
  );
}
