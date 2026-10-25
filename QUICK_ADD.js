// Copy and paste this into your browser console (F12) to see a live feature!
// This will add a "Last Updated" indicator to your header

(function() {
  // Create the indicator element
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    text-align: center;
    padding: 0.75rem;
    background: rgba(102, 126, 234, 0.1);
    border-bottom: 1px solid rgba(102, 126, 234, 0.2);
    margin-bottom: 1rem;
    border-radius: 8px;
    margin: 0 2rem 1rem 2rem;
  `;
  
  // Create pulsing dot
  const dot = document.createElement('span');
  dot.style.cssText = `
    display: inline-block;
    width: 10px;
    height: 10px;
    background: #10b981;
    border-radius: 50%;
    margin-right: 8px;
    animation: pulse 2s infinite;
  `;
  
  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      50% { opacity: 0.5; box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    }
  `;
  document.head.appendChild(style);
  
  // Create text
  const text = document.createElement('span');
  text.style.cssText = `
    color: #667eea;
    font-weight: 600;
    font-family: monospace;
    font-size: 0.9rem;
  `;
  text.textContent = 'Live • Last updated: ';
  
  // Create time span
  const timeSpan = document.createElement('span');
  timeSpan.id = 'live-time';
  timeSpan.style.cssText = `
    color: #667eea;
    font-weight: 600;
    font-family: monospace;
    font-size: 0.9rem;
  `;
  
  // Assemble
  indicator.appendChild(dot);
  indicator.appendChild(text);
  indicator.appendChild(timeSpan);
  
  // Insert after header
  const header = document.querySelector('.header');
  if (header) {
    header.insertAdjacentElement('afterend', indicator);
  }
  
  // Update time
  function updateTime() {
    const now = new Date();
    timeSpan.textContent = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }
  
  updateTime();
  setInterval(updateTime, 1000);
  
  console.log('✅ Live indicator added! You should see a pulsing green dot above the search bar.');
  console.log('📝 To make this permanent, add the code from QUICK_ADD.js to your App.jsx');
})();
