/**
 * Makes an API request with automatic retry on failure
 * 
 * @param {Function} apiCall - Async function that returns an axios promise
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.retryDelay - Base delay between retries in ms (default: 1000)
 * @param {boolean} options.exponentialBackoff - Whether to use exponential backoff (default: true)
 * @returns {Promise} - The API response
 */
export const withRetry = async (apiCall, options = {}) => {
  const { 
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wait before retrying, but not on first attempt
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} of ${maxRetries}`);
        
        // Calculate delay - use exponential backoff if enabled
        const delay = exponentialBackoff 
          ? retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000 
          : retryDelay;
          
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry for certain error types
      if (
        error.response && 
        (error.response.status === 401 || // Unauthorized
         error.response.status === 403 || // Forbidden
         error.response.status === 404 || // Not Found
         error.response.status === 429)   // Rate Limited
      ) {
        console.log(`Not retrying for status code: ${error.response.status}`);
        break;
      }
      
      if (attempt === maxRetries) {
        break;
      }
    }
  }
  
  throw lastError;
};
