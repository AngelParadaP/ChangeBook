/**
 * Validates if a URL is a valid, fetchable image URL
 * Excludes placeholder domains and invalid URLs to prevent server-side fetch errors
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // List of invalid/placeholder domains to exclude
    const invalidDomains = [
      'ejemplo.jpg',
      'placeholder.example.com',
      'example.com',
      'example.jpg',
      'localhost',
    ];
    
    // Check if hostname is in the invalid list or ends with invalid extensions
    const isInvalidDomain = invalidDomains.some(domain => 
      parsedUrl.hostname === domain || 
      parsedUrl.hostname.endsWith(`.${domain}`)
    );
    
    // Check if it's a proper http/https URL with a valid domain
    return (
      (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") &&
      parsedUrl.hostname.includes(".") &&
      !parsedUrl.hostname.endsWith(".jpg") &&
      !isInvalidDomain
    );
  } catch {
    return false;
  }
}
