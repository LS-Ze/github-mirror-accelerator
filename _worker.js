/**
 * GitHub Mirror Accelerator - Cloudflare Pages Functions
 * 处理GitHub资源的代理请求，提供高速下载服务
 */

// 配置选项
const CONFIG = {
  // 缓存配置
  CACHE_MAX_AGE: 86400, // 24小时
  CACHE_STALE_WHILE_REVALIDATE: 3600, // 1小时
  
  // 速率限制
  RATE_LIMIT: 100, // 每分钟请求数
  RATE_LIMIT_WINDOW: 60, // 时间窗口（秒）
  
  // GitHub相关配置
  GITHUB_DOMAINS: [
    'github.com',
    'raw.githubusercontent.com',
    'gist.github.com',
    'api.github.com'
  ],
  
  // 支持的路径模式
  SUPPORTED_PATHS: [
    /^\/github\.com\/.+?\/.+?\/(?:blob|raw|releases|archive|info|git-)/i,
    /^\/raw\.githubusercontent\.com\/.+?\/.+?\/.+?\//i,
    /^\/gist\.githubusercontent\.com\/.+?\/.+?\//i
  ],
  
  // CORS配置
  CORS: {
    ALLOWED_ORIGINS: '*',
    ALLOWED_METHODS: 'GET, HEAD, OPTIONS',
    ALLOWED_HEADERS: 'Content-Type, Authorization, User-Agent',
    MAX_AGE: 86400
  }
};

// 内存缓存用于速率限制
const rateLimitCache = new Map();

/**
 * 处理CORS预请求
 */
function handleOptions(request) {
  const headers = new Headers();
  
  // 设置CORS头部
  headers.set('Access-Control-Allow-Origin', CONFIG.CORS.ALLOWED_ORIGINS);
  headers.set('Access-Control-Allow-Methods', CONFIG.CORS.ALLOWED_METHODS);
  headers.set('Access-Control-Allow-Headers', CONFIG.CORS.ALLOWED_HEADERS);
  headers.set('Access-Control-Max-Age', CONFIG.CORS.MAX_AGE.toString());
  
  return new Response(null, {
    status: 204,
    headers: headers
  });
}

/**
 * 检查速率限制
 */
function checkRateLimit(ip) {
  if (!ip) return { allowed: true };
  
  const now = Date.now();
  const windowStart = now - (CONFIG.RATE_LIMIT_WINDOW * 1000);
  
  // 获取该IP的请求记录
  let requests = rateLimitCache.get(ip) || [];
  
  // 清理过期的请求记录
  requests = requests.filter(timestamp => timestamp > windowStart);
  
  // 检查是否超过限制
  if (requests.length >= CONFIG.RATE_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      reset: Math.ceil((windowStart + CONFIG.RATE_LIMIT_WINDOW * 1000 - now) / 1000)
    };
  }
  
  // 添加新的请求记录
  requests.push(now);
  rateLimitCache.set(ip, requests);
  
  return {
    allowed: true,
    remaining: CONFIG.RATE_LIMIT - requests.length,
    reset: Math.ceil((windowStart + CONFIG.RATE_LIMIT_WINDOW * 1000 - now) / 1000)
  };
}

/**
 * 验证请求的GitHub URL
 */
function validateGitHubUrl(url) {
  try {
    const parsedUrl = new URL(url);
    
    // 检查是否是支持的GitHub域名
    if (!CONFIG.GITHUB_DOMAINS.some(domain => parsedUrl.hostname.endsWith(domain))) {
      return { valid: false, message: '不支持的域名' };
    }
    
    // 检查路径是否符合支持的模式
    const path = parsedUrl.pathname;
    const isValidPath = CONFIG.SUPPORTED_PATHS.some(pattern => pattern.test(path));
    
    if (!isValidPath) {
      return { valid: false, message: '不支持的路径格式' };
    }
    
    return { valid: true, url: parsedUrl };
  } catch (error) {
    return { valid: false, message: '无效的URL格式' };
  }
}

/**
 * 构建GitHub请求
 */
function buildGitHubRequest(request, githubUrl) {
  const headers = new Headers(request.headers);
  
  // 移除Cloudflare特定的头部
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ipcountry');
  headers.delete('cf-ray');
  headers.delete('cf-visitor');
  headers.delete('x-forwarded-for');
  headers.delete('x-real-ip');
  
  // 设置适当的User-Agent
  if (!headers.has('User-Agent')) {
    headers.set('User-Agent', 'GitHub-Mirror-Accelerator/1.0');
  }
  
  // 构建请求
  return new Request(githubUrl.toString(), {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'manual'
  });
}

/**
 * 处理GitHub响应
 */
function handleGitHubResponse(response, baseOrigin) {
  const headers = new Headers(response.headers);
  
  // 设置CORS头部
  headers.set('Access-Control-Allow-Origin', CONFIG.CORS.ALLOWED_ORIGINS);
  
  // 设置缓存头部
  if (response.status === 200) {
    headers.set('Cache-Control', `public, max-age=${CONFIG.CACHE_MAX_AGE}, stale-while-revalidate=${CONFIG.CACHE_STALE_WHILE_REVALIDATE}`);
  } else {
    headers.delete('Cache-Control');
  }
  
  // 处理重定向
  if (response.status >= 300 && response.status < 400) {
    const location = headers.get('Location');
    if (location) {
      // 如果是GitHub内部重定向，使用我们的代理
      try {
        const locationUrl = new URL(location);
        if (CONFIG.GITHUB_DOMAINS.some(domain => locationUrl.hostname.endsWith(domain))) {
          const proxyLocation = `${baseOrigin}/${encodeURIComponent(locationUrl.toString())}`;
          headers.set('Location', proxyLocation);
        }
      } catch (e) {
        // 忽略无效的URL
      }
    }
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

/**
 * 处理错误响应
 */
function handleError(message, status = 500) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', CONFIG.CORS.ALLOWED_ORIGINS);
  headers.set('Content-Type', 'application/json');
  
  return new Response(JSON.stringify({
    error: true,
    message: message,
    status: status
  }), {
    status: status,
    headers: headers
  });
}

/**
 * 主请求处理函数
 */
async function handleRequest(request, ctx) {
  try {
    // 处理OPTIONS请求
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    // 只允许GET和HEAD请求
    if (!['GET', 'HEAD'].includes(request.method)) {
      return handleError('只支持GET和HEAD请求', 405);
    }
    
    const url = new URL(request.url);
    const baseOrigin = url.origin;
    
    // 根路径请求，返回前端页面
    if (url.pathname === '/' && url.search === '') {
      return fetch('index.html');
    }
    
    // 提取原始GitHub URL
    let githubUrlStr = decodeURIComponent(url.pathname.slice(1) + url.search);
    
    // 如果URL不包含协议，添加https://
    if (!githubUrlStr.startsWith('http://') && !githubUrlStr.startsWith('https://')) {
      githubUrlStr = `https://${githubUrlStr}`;
    }
    
    // 验证GitHub URL
    const validation = validateGitHubUrl(githubUrlStr);
    if (!validation.valid) {
      return handleError(`无效的GitHub链接: ${validation.message}`, 400);
    }
    
    const githubUrl = validation.url;
    
    // 检查速率限制
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for');
    const rateLimit = checkRateLimit(ip);
    
    if (!rateLimit.allowed) {
      const headers = new Headers();
      headers.set('Access-Control-Allow-Origin', CONFIG.CORS.ALLOWED_ORIGINS);
      headers.set('X-RateLimit-Limit', CONFIG.RATE_LIMIT.toString());
      headers.set('X-RateLimit-Remaining', '0');
      headers.set('X-RateLimit-Reset', rateLimit.reset.toString());
      
      return new Response(JSON.stringify({
        error: true,
        message: '请求过于频繁，请稍后再试',
        rateLimit: {
          limit: CONFIG.RATE_LIMIT,
          remaining: 0,
          reset: rateLimit.reset
        }
      }), {
        status: 429,
        headers: headers
      });
    }
    
    // 构建缓存键
    const cacheKey = new Request(githubUrl.toString(), 请求);
    const cache = caches.default;
    
    // 尝试从缓存获取
    let response = await cache.match(cacheKey);
    
    // 如果缓存未命中，从GitHub获取
    if (!response) {
      try {
        // 构建GitHub请求
        const githubRequest = buildGitHubRequest(请求, githubUrl);
        
        // 发送请求到GitHub
        response = await fetch(githubRequest);
        
        // 如果响应成功，缓存起来
        if (response.status === 200) {
          const responseToCache = handleGitHubResponse(response.clone(), baseOrigin);
          ctx.waitUntil(cache.put(cacheKey, responseToCache));
        }
      } catch (fetchError) {
        console.error('GitHub fetch error:', fetchError);
        return handleError(`无法连接到GitHub: ${fetchError.message}`, 503);
      }
    }
    
    // 处理响应并返回
    return handleGitHubResponse(response, baseOrigin);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return handleError(`代理错误: ${error.message}`, 500);
  }
}

// 导出处理函数
export default {
  async fetch(请求, env, ctx) {
    return handleRequest(请求, ctx);
  }
};
