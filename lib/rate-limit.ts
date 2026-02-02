const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const CLEANUP_INTERVAL = 60000; // 1 minute
let lastCleanup = Date.now();

function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupRateLimit();
    lastCleanup = now;
  }
}

export function rateLimit(identifier: string, limit = 5, windowMs = 60000) {
  maybeCleanup();
  
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now >= record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { 
      success: false, 
      remaining: 0,
      resetTime: record.resetTime 
    };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}

export function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now >= value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}
