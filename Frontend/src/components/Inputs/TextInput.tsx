"use client"

import type React from "react"

interface TextInputProps {
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required = false,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-medium mb-2">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field ${error ? "border-red-500 focus:ring-red-500" : ""}`}
        required={required}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${label}-error` : undefined}
      />
      {error && (
        <p id={`${label}-error`} className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default TextInput
