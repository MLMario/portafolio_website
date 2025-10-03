/**
 * Structured logging utility for production debugging
 * Outputs JSON logs in production for better parsing in Vercel logs
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogMetadata {
  [key: string]: unknown
}

const isProd = process.env.NODE_ENV === 'production'

function formatLog(level: LogLevel, message: string, meta?: LogMetadata): string {
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }

  return isProd ? JSON.stringify(logEntry) : `[${level.toUpperCase()}] ${message} ${meta ? JSON.stringify(meta) : ''}`
}

export const logger = {
  /**
   * Log informational messages
   */
  info: (message: string, meta?: LogMetadata) => {
    console.log(formatLog('info', message, meta))
  },

  /**
   * Log error messages with optional error object
   */
  error: (message: string, error?: Error | unknown, meta?: LogMetadata) => {
    const errorMeta = error instanceof Error
      ? {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          ...meta,
        }
      : { errorData: error, ...meta }

    console.error(formatLog('error', message, errorMeta))
  },

  /**
   * Log warning messages
   */
  warn: (message: string, meta?: LogMetadata) => {
    console.warn(formatLog('warn', message, meta))
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (message: string, meta?: LogMetadata) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLog('debug', message, meta))
    }
  },

  /**
   * Log API request/response for debugging
   */
  apiRequest: (method: string, path: string, meta?: LogMetadata) => {
    logger.info(`API Request: ${method} ${path}`, meta)
  },

  /**
   * Log API response with status and duration
   */
  apiResponse: (method: string, path: string, status: number, durationMs?: number, meta?: LogMetadata) => {
    logger.info(`API Response: ${method} ${path} - ${status}`, {
      status,
      durationMs,
      ...meta,
    })
  },
}

/**
 * Create a timer to measure operation duration
 */
export function createTimer() {
  const start = Date.now()
  return {
    end: () => Date.now() - start,
  }
}
