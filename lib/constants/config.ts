export const APP_CONFIG = {
  name: 'SSU-Note',
  description: 'Smart Study University Note',
  version: '0.1.0',
} as const

export const AI_CONFIG = {
  processingDelay: 2000, // Mock delay in milliseconds
  maxContentLength: 10000,
} as const

export const FILE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['pdf', 'image', 'audio', 'video'] as const,
} as const
