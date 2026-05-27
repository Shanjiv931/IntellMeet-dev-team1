const levels = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const logger = {
  format(level, message, meta) {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
      });
    }
    const metaStr = meta && Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
    
    // ANSI color escape codes for professional development view
    let color = '\x1b[37m'; // White
    if (level === levels.ERROR) color = '\x1b[31m'; // Red
    else if (level === levels.WARN) color = '\x1b[33m'; // Yellow
    else if (level === levels.INFO) color = '\x1b[36m'; // Cyan
    else if (level === levels.DEBUG) color = '\x1b[35m'; // Magenta

    return `${color}[${timestamp}] [${level}] ${message}${metaStr}\x1b[0m`;
  },

  info(message, meta) {
    console.log(this.format(levels.INFO, message, meta));
  },

  error(message, error, meta) {
    const errorMeta = error ? { error: error.message, stack: error.stack } : {};
    console.error(this.format(levels.ERROR, message, { ...errorMeta, ...meta }));
  },

  warn(message, meta) {
    console.warn(this.format(levels.WARN, message, meta));
  },

  debug(message, meta) {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
      console.log(this.format(levels.DEBUG, message, meta));
    }
  }
};

export default logger;
