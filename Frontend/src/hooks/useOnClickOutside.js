// ════════════════════════════════════════════════════════════════════════════
// GLOBAL HOOKS  src/hooks/useDebounce.js + useOnClickOutside.js
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";

export const useOnClickOutside = (ref, handler) => {
  const handlerRef = useRef(handler);

  // Update handler ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (event) => {
      const el = ref?.current;
      
      // Do nothing if clicking inside the element
      if (!el || el.contains(event.target)) {
        return;
      }

      // Call the handler with the event
      handlerRef.current(event);
    };

    // Add event listeners
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    // Cleanup function
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref]); // ref dependency
};