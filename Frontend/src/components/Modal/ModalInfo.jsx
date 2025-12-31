import React from "react";
import { AlertCircle } from "lucide-react";

const ModalInfo = ({ isOpen, onClose, title = "Información", children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-14 h-14 rounded-full bg-fuchsia-100 flex items-center justify-center mb-3">
            <AlertCircle className="w-7 h-7 text-fuchsia-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <div className="text-sm text-gray-600 space-y-2 mb-6">
          {children}
        </div>
        <div className="flex justify-center">
          <button 
            onClick={onClose} 
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold px-6 py-3 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalInfo;
