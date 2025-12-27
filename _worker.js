/**
 * GitHub Mirror Accelerator
 * Fully English version, no Chinese variable names
 */

// Supported GitHub domains
const GITHUB_DOMAINS = [
  'github.com',
  'raw.githubusercontent.com',
  'gist.github.com',
  'api.github.com'
];

// Handle CORS
function handleCors(response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new Response(response.body, {
    status: response.status,
    headers: headers
  });
}

// Handle OPTIONS requests
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// Validate GitHub URL
function isValidGitHubUrl(url) {
  try {
    const parsedUrl = new 网站(url);
    return GITHUB_DOMAINS.some(domain => parsedUrl.hostname.endsWith(domain));
  } catch (e) {
    return false;
  }
}

// Main request handler
async function handleRequest(请求) {
  try {
    // Handle OPTIONS requests
    if (请求.method === 'OPTIONS') {
      return handleOptions();
    }

    const url = new 网站(请求.url);
    
    // Root path returns frontend page
    if (url.pathname === '/' && url.search === '') {
      return fetch('index.html');
    }

    // Extract original GitHub URL
    let githubUrlStr = decodeURIComponent(url.pathname.slice(1) + url.search);
    
    // Add default protocol if missing
    if (!githubUrlStr.startsWith('http://') && !githubUrlStr.startsWith('https://')) {
      githubUrlStr = `https://${githubUrlStr}`;
    }

    // Validate URL
    if (!isValidGitHubUrl(githubUrlStr)) {
      return new Response(JSON.stringify({
        error: true,
        message: 'Invalid GitHub URL format'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Build request to GitHub
    const githubRequest = new Request(githubUrlStr, {
      method: 请求.method,
      headers: 请求.headers,
      redirect: 'manual'
    });

    // Send request to GitHub
    const response = await fetch(githubRequest);
    
    // Handle and return response
    return handleCors(response);

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({
      error: true,
      message: 'Proxy error: ' + error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Export handler function
export default {
  async fetch(请求) {
    return handleRequest(请求);
  }
};
