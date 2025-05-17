/**
 * Utility functions for parsing different database file formats
 * This file provides client-side previews before sending to server
 */

/**
 * Extract file extension from filename
 * @param {string} filename - The name of the file
 * @returns {string} The file extension without the dot
 */
export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

/**
 * Check if the file is a supported database type
 * @param {File} file - The file object
 * @returns {boolean} True if supported, false otherwise
 */
export const isSupportedDatabaseFile = (file) => {
  if (!file) return false;
  
  const extension = getFileExtension(file.name).toLowerCase();
  const supportedExtensions = ['db', 'sqlite', 'sql', 'csv', 'xlsx'];
  
  return supportedExtensions.includes(extension);
};

/**
 * Get a brief preview of the database file content
 * This just handles text files (CSV/SQL) as binary formats need server processing
 * @param {File} file - The file object
 * @returns {Promise<string>} A preview of the file contents
 */
export const getFilePreview = async (file) => {
  if (!file) return 'No file selected';
  
  const extension = getFileExtension(file.name).toLowerCase();
  
  // Only preview text-based files
  if (['sql', 'csv'].includes(extension)) {
    try {
      // Read just the first 2KB for preview
      const preview = await readFileChunk(file, 0, 2048);
      return preview;
    } catch (error) {
      console.error('Error reading file preview:', error);
      return 'Error reading file preview';
    }
  }
  
  return `Binary file format (${extension}). Upload to analyze contents.`;
};

/**
 * Read a chunk of a file
 * @param {File} file - The file to read
 * @param {number} start - Start position
 * @param {number} length - Number of bytes to read
 * @returns {Promise<string>} The file contents as text
 */
async function readFileChunk(file, start, length) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    
    reader.onerror = (e) => {
      reject(new Error('Error reading file'));
    };
    
    const blob = file.slice(start, start + length);
    reader.readAsText(blob);
  });
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};