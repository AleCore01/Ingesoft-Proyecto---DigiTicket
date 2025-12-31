import React from "react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  error?: string;
  name?: string;
  autoComplete?: string;
};

const blockKeys = new Set(["e", "E", "+", "-", ".", ","]);

export default function NumericInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  required,
  error,
  name,
  autoComplete,
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = e.target.value.replace(/\D+/g, "");
    onChange(maxLength ? onlyDigits.slice(0, maxLength) : onlyDigits);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (blockKeys.has(e.key)) e.preventDefault();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    const onlyDigits = text.replace(/\D+/g, "");
    onChange(maxLength ? onlyDigits.slice(0, maxLength) : onlyDigits);
  };

  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        maxLength={maxLength}
        required={required}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gradient-middle focus:border-transparent transition-all duration-200"
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
