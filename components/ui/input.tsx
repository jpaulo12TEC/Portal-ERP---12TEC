import React from "react";

type InputProps = {
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
};

const Input = ({ type = "text", value, onChange, placeholder, className }: InputProps) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`border px-3 py-2 bg-white rounded ${className}`}
    />
  );
};

export default Input;
