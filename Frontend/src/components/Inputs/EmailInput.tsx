import React from "react";

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  name?: string;
  autoComplete?: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(v: string) {
  return emailRegex.test(v);
}

export default function EmailInput({
  label = "Correo electrónico",
  value,
  onChange,
  placeholder = "correo.electronico@email.com",
  required,
  error,
  name,
  autoComplete = "email",
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // sanea espacios invisibles o típicos errores de paste
    const cleaned = e.target.value.replace(/\s+/g, "");
    onChange(cleaned);
  };

  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <input
        type="email"
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        required={required}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gradient-middle focus:border-transparent transition-all duration-200"
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
