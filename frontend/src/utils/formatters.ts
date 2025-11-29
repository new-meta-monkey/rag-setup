/**
 * Data formatting utilities
 */

/**
 * Format chunk metrics for display
 */
export function formatChunkMetrics(metrics: {
  total_chunks: number;
  avg_chunk_size: number;
  max_chunk_size: number;
  min_chunk_size: number;
}): string {
  return `Total: ${metrics.total_chunks} | Avg: ${Math.round(metrics.avg_chunk_size)} | Max: ${metrics.max_chunk_size} | Min: ${metrics.min_chunk_size}`;
}

/**
 * Format query time for display
 */
export function formatQueryTime(seconds: number): string {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`;
  }
  return `${seconds.toFixed(2)}s`;
}

/**
 * Format model name for display
 */
export function formatModelName(model: string): string {
  return model
    .replace(/-/g, ' ')
    .replace(/\//g, ' / ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

