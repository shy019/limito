type LogLevel = 'info' | 'warn' | 'error' | 'success';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

function formatLog(entry: LogEntry): string {
  const emoji = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅',
  };

  return `${emoji[entry.level]} [${entry.timestamp}] ${entry.message}${entry.data ? ` | ${JSON.stringify(entry.data)}` : ''}`;
}

export const logger = {
  info: (message: string, data?: any) => {
    const entry: LogEntry = {
      level: 'info',
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    console.log(formatLog(entry));
  },

  warn: (message: string, data?: any) => {
    const entry: LogEntry = {
      level: 'warn',
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    console.warn(formatLog(entry));
  },

  error: (message: string, data?: any) => {
    const entry: LogEntry = {
      level: 'error',
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    console.error(formatLog(entry));
  },

  success: (message: string, data?: any) => {
    const entry: LogEntry = {
      level: 'success',
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    console.log(formatLog(entry));
  },
};
