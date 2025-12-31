import React from "react";

const ModalWarning = ({isOpen, onClose, onConfirm, title, message}) => { 
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        {/* Mensaje centrado */}
        <div className="text-center mb-6">
          {title ? (
            <p className="text-black text-lg font-bold">
              {title}
            </p>
          ) : (
            <>
              <p className="text-black text-lg font-bold">
                ¿Está seguro de realizar
              </p>
              <p className="text-black text-lg font-bold">
                esta acción?
              </p>
            </>
          )}
          {message && (
            <p className="text-gray-600 text-sm mt-2">
              {message}
            </p>
          )}
        </div>
        
        {/* Botones centrados */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onConfirm}
            className="btn-inset px-8 py-1 text-white bg-purple rounded-xl hover:bg-fuchsia-700 hover:text-white"
          >
            Sí
          </button>
          <button
            onClick={onClose}
            className="btn-inset px-8 py-1 bg-gray-200 text-gray rounded-xl hover:bg-gray-300 hover:text-gray-700"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalWarning;