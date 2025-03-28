/**
 * Makes an API request with automatic retry on failure
 * 
 * @param {Function} apiCall - Async function that returns an axios promise
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Promise} - The API response
 */
export const withRetry = async (apiCall, options = {}) => {
  const { 
    maxRetries = 3,
    retryDelay = 1000,
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wait before retrying, but not on first attempt
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} of ${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry for certain error types
      if (
        error.response && 
        (error.response.status === 401 || // Unauthorized
         error.response.status === 403 || // Forbidden
         error.response.status === 404)   // Not Found
      ) {
        break;
      }
      
      // If it's the last attempt, don't retry
      if (attempt === maxRetries) {
        break;
      }
    }
  }
  
  throw lastError;
};
