import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex justify-center items-center gap-x-4 mt-8">
      <button
        className="btn-inset px-4 py-1 bg-purple rounded-xl disabled:opacity-50
                   text-white text-[12px]
                   transition-transform transform hover:scale-105"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Anterior
      </button>
      
      <span className="text-[12px]">
        Página {currentPage} de {totalPages}
      </span>

      <button
        className="btn-inset px-4 py-1 bg-purple rounded-xl disabled:opacity-50
                   text-white text-[12px]
                   transition-transform transform hover:scale-105"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Siguiente
      </button>
    </div>
  );
};

export default Pagination;