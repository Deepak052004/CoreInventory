import { useState, useRef, useEffect } from 'react';
import { ScanBarcode } from 'lucide-react';
import { Input } from './Input';

export default function BarcodeScanner({ onScan, placeholder = "Scan barcode or enter manually...", className = "" }) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Keep focus on the input if we want a hands-free scanning experience,
  // but for forms, we might just rely on the user clicking into the field.
  // We'll let the user decide by clicking into it.

  const handleKeyDown = (e) => {
    // Hardware scanners typically end the scan with an Enter key
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        onScan(inputValue.trim());
        setInputValue(''); // Reset for next scan
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-indigo-500' : 'text-slate-400'}`}>
        <ScanBarcode className="w-5 h-5" />
      </div>
      <Input 
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="pl-10 h-11 border-2 transition-all focus:border-indigo-500 dark:focus:border-indigo-400 shadow-sm"
        autoComplete="off"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
        Press Enter
      </div>
    </div>
  );
}
