// Centralized logging utility

interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private log(level: keyof LogLevel, message: string, data?: any) {
    if (this.isProduction && level === 'DEBUG') {
      return; // Don't log debug messages in production
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;

    // Map log levels to console methods
    const consoleMethod = level === 'DEBUG' ? 'log' : level.toLowerCase() as keyof Console;

    if (data) {
      (console[consoleMethod] as any)(prefix, message, data);
    } else {
      (console[consoleMethod] as any)(prefix, message);
    }
  }

  debug(message: string, data?: any) {
    this.log('DEBUG', message, data);
  }

  info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: any) {
    this.log('WARN', message, data);
  }

  error(message: string, error?: any) {
    this.log('ERROR', message, error);
  }

  // Security-specific logging
  security(message: string, data?: any) {
    if (this.isProduction) {
      // In production, you might want to send this to a security monitoring service
      console.error(`[SECURITY] ${message}`, data);
    } else {
      console.warn(`[SECURITY] ${message}`, data);
    }
  }

  // Database operation logging
  database(operation: string, query?: string, error?: any) {
    if (error) {
      this.error(`Database ${operation} failed`, { query, error });
    } else if (this.isDevelopment) {
      this.debug(`Database ${operation}`, { query });
    }
  }

  // API request logging
  apiRequest(method: string, path: string, userId?: string, error?: any) {
    if (error) {
      this.error(`API ${method} ${path} failed`, { userId, error });
    } else if (this.isDevelopment) {
      this.debug(`API ${method} ${path}`, { userId });
    }
  }
}

export const logger = new Logger();

// Utility function to safely log errors without exposing sensitive data
export function logError(context: string, error: any, additionalData?: any) {
  logger.error(`Error in ${context}`, {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    ...additionalData
  });
}

// Utility function for conditional development logging
export function devLog(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(message, data);
  }
}