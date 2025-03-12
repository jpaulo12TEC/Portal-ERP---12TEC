import React from "react";

type CheckboxProps = {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  className?: string;
};

const Checkbox = ({ checked, onChange, label, className }: CheckboxProps) => {
  return (
    <label className={`flex items-center space-x-2 ${className}`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="cursor-pointer" />
      {label && <span>{label}</span>}
    </label>
  );
};

export default Checkbox;
