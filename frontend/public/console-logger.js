// Save console logs to localStorage so they persist through page reloads
(function() {
  const MAX_LOGS = 100;
  const LOGS_KEY = 'jb_pinturas_console_logs';
  
  // Get existing logs or start fresh
  let logs = [];
  try {
    const stored = localStorage.getItem(LOGS_KEY);
    if (stored) {
      logs = JSON.parse(stored);
    }
  } catch (e) {
    logs = [];
  }
  
  // Override console methods
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  
  function addLog(type, args) {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    logs.push({
      type,
      timestamp,
      message
    });
    
    // Keep only last MAX_LOGS
    if (logs.length > MAX_LOGS) {
      logs.shift();
    }
    
    // Save to localStorage
    try {
      localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save logs to localStorage');
    }
  }
  
  console.log = function(...args) {
    originalLog.apply(console, args);
    addLog('log', args);
  };
  
  console.error = function(...args) {
    originalError.apply(console, args);
    addLog('error', args);
  };
  
  console.warn = function(...args) {
    originalWarn.apply(console, args);
    addLog('warn', args);
  };
  
  console.info = function(...args) {
    originalInfo.apply(console, args);
    addLog('info', args);
  };
  
  // Function to retrieve and display logs
  window.showConsoleLogs = function() {
    const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
    console.clear();
    console.log('%c=== JB PINTURAS CONSOLE LOGS ===', 'color: blue; font-weight: bold; font-size: 14px;');
    logs.forEach(log => {
      const style = {
        'error': 'color: red; font-weight: bold;',
        'warn': 'color: orange;',
        'info': 'color: blue;',
        'log': 'color: black;'
      }[log.type] || 'color: black;';
      
      console.log(
        `%c[${log.type.toUpperCase()}] ${log.timestamp}: ${log.message}`,
        style
      );
    });
    console.log('%c=== END OF LOGS ===', 'color: blue; font-weight: bold;');
    return logs;
  };
  
  // Function to clear logs
  window.clearConsoleLogs = function() {
    localStorage.removeItem(LOGS_KEY);
    console.log('Console logs cleared');
  };
  
  console.log('🔍 Console logger initialized. Use window.showConsoleLogs() to view all logs');
})();
