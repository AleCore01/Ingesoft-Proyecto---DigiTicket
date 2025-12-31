import React, { useEffect } from "react";
import { CircleCheckBig } from "lucide-react";

const ModalCheck = ({ isOpen, message, onClose, icon: Icon, autoCloseMs = 2000, closeOnOverlayClick = false }) => {
  useEffect(() => {
    if (!isOpen || autoCloseMs === null) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseMs);
    return () => clearTimeout(timer);
  }, [isOpen, onClose, autoCloseMs]);

  if (!isOpen) return null;

  // Icono por defecto: CircleCheckBig
  const DefaultIcon = () => (
    <CircleCheckBig 
      size={64}
      strokeWidth={2.5}
      className="text-green-500 mx-auto mb-4"
    />
  );

  const RenderIcon = Icon ? Icon : DefaultIcon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeOnOverlayClick ? onClose : undefined}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <RenderIcon />
        <p className="text-black text-lg font-semibold whitespace-pre-line">{message}</p>
      </div>
    </div>
  );
};

export default ModalCheck;