// ════════════════════════════════════════════════════════════════════════════
// GLOBAL HOOKS  src/hooks/useDebounce.js + useOnClickOutside.js
// ════════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";

export const useDebounce = (value, delay = 400) => {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
};
