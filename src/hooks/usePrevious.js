import { useRef, useEffect } from 'react';

/**
 * A custom hook that stores the previous value of a variable
 * @param {any} value - The value to track
 * @returns {any} - The previous value
 */
function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

export default usePrevious;
