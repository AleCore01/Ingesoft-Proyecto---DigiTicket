"use client"

import React from "react";
import { Search } from "lucide-react";

const SearchBar = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="relative w-full flex items-center">
      {/* Input de búsqueda */}
      <input
        type="text"
        placeholder="Buscar..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-12 pr-4 py-3 rounded-full shadow-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-100 text-sm placeholder-black"
      />

      {/* Icono de búsqueda */}
      <div className="px-2 absolute left-3 top-1/2 transform -translate-y-1/2 text-black">
        <Search size={18} />
      </div>
    </div>
  );
};

export default SearchBar;