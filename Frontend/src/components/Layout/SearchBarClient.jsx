import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { eventsService } from "../../services/eventsService";

const SearchBarClient = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // === Buscar eventos ===
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await eventsService.search({ title: query }, { signal: controller.signal });
        const data = response?.data ?? response ?? [];
        setResults(data.slice(0, 5)); // mostrar solo los primeros 5
      } catch (error) {
        if (error.name !== "AbortError") console.error("Error buscando eventos:", error);
      }
    }, 400); // debounce

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // === Click fuera para cerrar ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id) => {
    setQuery("");
    setResults([]);
    navigate(`/eventosCliente/${id}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* === Barra de búsqueda === */}
      <div className="flex items-center bg-gray-100 border border-gray-300 rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-fuchsia-500 transition">
        <Search className="text-gray-500 mr-2" size={18} />
        <input
          type="text"
          placeholder="Buscar eventos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500"
        />
      </div>

      {/* === Resultados === */}
      {isFocused && results.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
          {results.map((event) => (
            <div
              key={event.id}
              onClick={() => handleSelect(event.id)}
              className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer transition"
            >
              <img
                src={event.image || "https://i.ibb.co/VqWc8jn/reggaeton6.jpg"}
                alt={event.title}
                className="w-12 h-12 object-cover rounded-lg"
              />
              <span className="text-gray-800 font-medium truncate">
                {event.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBarClient;
