"use client";

import React from "react";
import { AlertTriangle, X, CheckCircle2 } from "lucide-react";
import { COLORS, GRADIENTS } from "../../constants/colors";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: AlertTriangle,
      iconColor: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-100 dark:bg-red-900/20",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-yellow-600 dark:text-yellow-400",
      iconBg: "bg-yellow-100 dark:bg-yellow-900/20",
      button: "bg-yellow-600 hover:bg-yellow-700 text-white",
    },
    info: {
      icon: CheckCircle2,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-900/20",
      button: `${GRADIENTS.PRIMARY} text-white`,
    },
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={`relative ${COLORS.BACKGROUND.CARD} ${COLORS.BORDER.DEFAULT} border rounded-xl shadow-2xl max-w-md w-full p-6 z-10 animate-in fade-in-0 zoom-in-95 duration-200`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${COLORS.TEXT.MUTED} hover:${COLORS.TEXT.DEFAULT} transition-colors`}
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${style.iconBg} mb-4`}
        >
          <Icon className={`w-8 h-8 ${style.iconColor}`} />
        </div>

        {/* Title */}
        <h2 className={`text-xl font-bold ${COLORS.TEXT.DEFAULT} mb-2`}>
          {title}
        </h2>

        {/* Message */}
        <p className={`${COLORS.TEXT.MUTED} mb-6`}>{message}</p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 ${COLORS.BACKGROUND.MUTED} ${COLORS.BORDER.DEFAULT} border ${COLORS.TEXT.DEFAULT} rounded-lg font-medium hover:${COLORS.BACKGROUND.SECONDARY} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 ${style.button} rounded-lg font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
