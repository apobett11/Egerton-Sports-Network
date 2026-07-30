/**
 * File Storage & Media Validation Utilities
 * Validates uploads, sanitizes filenames, checks MIME types, and prevents malicious paths.
 */

import { config } from './config';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

/**
 * Sanitizes a filename by removing illegal characters, directory traversal attempts, and spaces.
 */
export function sanitizeFilename(filename: string): string {
  const extensionIndex = filename.lastIndexOf('.');
  const name = extensionIndex !== -1 ? filename.substring(0, extensionIndex) : filename;
  const ext = extensionIndex !== -1 ? filename.substring(extensionIndex).toLowerCase() : '';

  // Remove non-alphanumeric chars except hyphen and underscore
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 64);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);

  return `${safeName}_${timestamp}_${randomSuffix}${ext}`;
}

/**
 * Validates file constraints (size, mime type).
 */
export function validateMediaFile(file: { name: string; size: number; type: string }): FileValidationResult {
  if (!file || !file.name) {
    return { valid: false, error: 'Invalid file object provided.' };
  }

  if (file.size > config.maxUploadSizeBytes) {
    const sizeMb = (config.maxUploadSizeBytes / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `File size exceeds maximum allowed limit of ${sizeMb}MB.` };
  }

  if (file.type && !config.allowedImageMimeTypes.includes(file.type.toLowerCase())) {
    return { valid: false, error: `File type '${file.type}' is not allowed. Supported types: JPG, PNG, WEBP, SVG.` };
  }

  return {
    valid: true,
    sanitizedFilename: sanitizeFilename(file.name),
  };
}

/**
 * HTML Sanitizer to prevent XSS in user-submitted free text (e.g., match reports, announcements, detail_text).
 */
export function sanitizeHtmlText(input?: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
