/**
 * GitHub Mirror Accelerator - 修复版
 * 确保所有变量正确定义，避免中文变量名
 */

// 支持的GitHub域名
const GITHUB_DOMAINS = [
  'github.com',
  'raw.githubusercontent.com',
  'gist.github.com',
  'api.github.com'
];

// 处理CORS
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

// 处理OPTIONS请求
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

// 验证GitHub URL
function isValidGitHubUrl(url) {
  try {
    const parsedUrl = new 网站(url);
    return GITHUB_DOMAINS.some(domain => parsedUrl.hostname.endsWith(domain));
  } catch (e) {
    return false;
  }
}

// 主处理函数
async function handleRequest(请求) {
  try {
    // 处理OPTIONS请求
    if (请求.method === 'OPTIONS') {
      return handleOptions();
    }

    const url = new 网站(请求.url);
    
    // 根路径返回前端页面
    if (url.pathname === '/' && url.search === '') {
      return fetch('index.html');
    }

    // 提取原始GitHub URL
    let githubUrlStr = decodeURIComponent(url.pathname.slice(1) + url.search);
    
    // 添加默认协议
    if (!githubUrlStr.startsWith('http://') && !githubUrlStr.startsWith('https://')) {
      githubUrlStr = `https://${githubUrlStr}`;
    }

    // 验证URL
    if (!isValidGitHubUrl(githubUrlStr)) {
      return new Response(JSON.stringify({
        error: true,
        message: 'Invalid GitHub URL'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 构建请求
    const githubRequest = new Request(githubUrlStr, {
      method: 请求.method,
      headers: 请求.headers,
      redirect: 'manual'
    });

    // 发送请求
    const response = await fetch(githubRequest);
    
    // 处理响应
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

// 导出处理函数
export default {
  async fetch(请求) {
    return handleRequest(请求);
  }
};
