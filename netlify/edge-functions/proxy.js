// 注意：在Netlify平台上，控制台配置的环境变量优先级高于toml文件中配置的环境变量
// Deno.env.get()会首先尝试获取控制台设置的环境变量，然后是toml文件中的配置，最后才使用默认值
const upstream = Deno.env.get('UPSTREAM_DOMAIN') || 'baidu.com'; // 目标代理域名，从环境变量读取，无法读取则使用默认值baidu.com
const upstream_v4 = Deno.env.get('UPSTREAM_V4_DOMAIN') || upstream; // IPv4代理域名，默认使用主域名
const blocked_region = ['TK'];
// 自定义域名，从环境变量读取，无法读取且未设置默认值时将无法使用
const customDomain = Deno.env.get('CUSTOM_DOMAIN') || 'your-custom-domain.com';
const replace_dict = {
  $upstream: '$custom_domain',
  [`${upstream}/`]: `${customDomain}/`, // 默认替换规则
  // 如存在其他资源可添加 '源站域名': '代理域名',
  // 例如：'google.com': 'google.cn',
};

const AUTH_CONFIG = {
  // 控制台配置的环境变量优先级高于toml文件，确保敏感信息（如密码哈希）可以安全地在控制台配置
  PASSWORD_HASH: Deno.env.get('AUTH_PASSWORD_HASH') || 'da7886fb8f45b3bf6e77884f97ae5fb4275ee792ecaa629fa2869d7a251d0c0d5fbf1a5a68f6365d67bbfd7e03a4b0fd0857204bf9fbc44bcaa5f7ac5b0e3b8d', // 直接填入你的正确哈希（本地测试用）
  ENABLE_PASSWORD: getEnvBoolean('ENABLE_PASSWORD', true), // 默认启用密码验证，从环境变量读取，无法读取则使用默认值true
  COOKIE_NAME: 'proxy_auth', // Cookie名称，默认'proxy_auth'
  COOKIE_EXPIRE_MINUTES: parseInt(Deno.env.get('COOKIE_EXPIRE_MINUTES') || '60', 10), // Cookie有效期（分钟），从环境变量读取，默认60分钟
  VERIFY_PATH: '/api/verify', // 验证路径，默认'/api/verify'
};

// 辅助函数：从环境变量获取布尔值，兼容布尔值和0/1数字
function getEnvBoolean(envName, defaultValue) {
  const envValue = Deno.env.get(envName);
  if (envValue === null || envValue === undefined) return defaultValue;
  
  // 确保envValue是字符串类型
  const strValue = String(envValue);
  
  // 兼容0和1的情况
  if (strValue === '0' || strValue.toLowerCase() === 'false') return false;
  if (strValue === '1' || strValue.toLowerCase() === 'true') return true;
  
  // 解析为布尔值
  return Boolean(strValue);
}

async function computeSHA512(plainText) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return Array.from(new Uint8Array(hashBuffer)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function getAuthCookie(headers) {
  const cookieStr = headers.get('cookie') || '';
  const cookieArr = cookieStr.split('; ');
  for (const cookie of cookieArr) {
    const [name, value] = cookie.split('=');
    if (name === AUTH_CONFIG.COOKIE_NAME) return value;
  }
  return null;
}

function generateAuthHTML() {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proxy Verification</title>
    <style>
      body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: Arial, sans-serif; background: #f0f2f5; }
      .auth-box { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 300px; }
      h1 { text-align: center; color: #333; margin-bottom: 1.5rem; }
      #password { width: 100%; padding: 0.8rem; margin: 0.5rem 0 1rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
      #submit { width: 100%; padding: 0.8rem; background: #165DFF; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
      #submit:hover { background: #0E4BDB; }
      #error { color: #ff4d4f; text-align: center; margin-top: 1rem; height: 1.2rem; }
    </style>
  </head>
  <body>
    <div class="auth-box">
      <h1>Enter Proxy Password</h1>
      <input type="password" id="password" placeholder="Input verification password" required>
      <button id="submit">Verify</button>
      <div id="error"></div>
    </div>
    <script>
      const passwordInput = document.getElementById('password');
      const submitBtn = document.getElementById('submit');
      const errorDiv = document.getElementById('error');

      submitBtn.addEventListener('click', async () => {
        const password = passwordInput.value.trim();
        if (!password) {
          errorDiv.textContent = 'Please enter password!';
          return;
        }
        try {
          const response = await fetch('${AUTH_CONFIG.VERIFY_PATH}', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
            credentials: 'same-origin'
          });
          const data = await response.json();
          if (data.success) {
            window.location.reload();
          } else {
            errorDiv.textContent = data.message || 'Incorrect password!';
          }
        } catch (err) {
          errorDiv.textContent = 'Verification failed, try again!';
        }
      });

      passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitBtn.click();
      });
    </script>
  </body>
  </html>
  `;
}

function setAuthCookie(request) {
  const expireDate = new Date();
  expireDate.setTime(expireDate.getTime() + AUTH_CONFIG.COOKIE_EXPIRE_MINUTES * 60 * 1000); // 使用分钟计算有效期
  // 通过主机名检测本地环境（localhost或127.0.0.1）
  const url = new URL(request.url);
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  const isProduction = Deno.env.get('NETLIFY_ENV') === 'production';
  const isHttps = !isLocalhost && isProduction && request.url.startsWith('https:');
  return `${AUTH_CONFIG.COOKIE_NAME}=valid; expires=${expireDate.toUTCString()}; path=/; SameSite=Lax; ${isHttps ? 'Secure; HttpOnly;' : ''}`;
}

export default async function handler(request) {
  return fetchAndApply(request);
}

async function fetchAndApply(request) {
  const url = new URL(request.url);
  const requestHeaders = request.headers;

  // 1. 处理验证请求（不变）
  if (url.pathname === AUTH_CONFIG.VERIFY_PATH && request.method === 'POST') {
    try {
      const requestBody = await request.json();
      const inputPassword = requestBody.password || '';
      const inputHash = await computeSHA512(inputPassword);
      const presetHash = AUTH_CONFIG.PASSWORD_HASH;

      if (inputHash === presetHash) {
        return new Response(JSON.stringify({ success: true, message: 'Verification passed!' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': setAuthCookie(request),
          },
        });
      } else {
        return new Response(JSON.stringify({ success: false, message: 'Incorrect password!' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (err) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid request!' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 2. 检查验证状态（新增：根据ENABLE_PASSWORD环境变量决定是否跳过验证）
  if (AUTH_CONFIG.ENABLE_PASSWORD) {
    const authCookie = getAuthCookie(requestHeaders);
    if (!authCookie || authCookie !== 'valid') {
      return new Response(generateAuthHTML(), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      });
    }
  }

  // 3. 反代逻辑（完整传递路径和参数）
  const region = requestHeaders.get('x-nf-client-country')?.toUpperCase() || '';
  const url_host = url.host;

  // 在本地环境（localhost或127.0.0.1）禁用HTTP转HTTPS重定向，避免SSL协议错误
  // NETLIFY_ENV环境变量同样遵循控制台配置优先于toml文件的规则
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  const isProduction = Deno.env.get('NETLIFY_ENV') === 'production';
  if (url.protocol === 'http:' && !isLocalhost && isProduction) {
    url.protocol = 'https:';
    return Response.redirect(url.href, 301);
  }

  // 图片搜索场景适配时，保留完整URL
  const isImageSearch = url.href.includes('tbm=isch') || url.href.includes('/img');
  const upstream_domain = isImageSearch ? upstream_v4 : upstream;
  // 关键：重新构造目标URL，确保路径（pathname）和参数（search）不丢失
  const targetUrl = new URL(url.pathname + url.search, `https://${upstream_domain}`); // 完整拼接路径+参数

  // 黑名单区域拦截
  if (blocked_region.includes(region)) {
    return new Response('Access denied: WorkersProxy is not available in your region yet.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // 构造请求头（增加 Accept 头，避免目标网站返回404）
  const new_request_headers = new Headers(requestHeaders);
  new_request_headers.set('Host', upstream_domain);
  new_request_headers.set('Referer', targetUrl.href); 
  new_request_headers.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'); // 模拟浏览器请求头
  new_request_headers.delete('cookie'); // 避免跨域Cookie冲突
  new_request_headers.delete('x-nf-client-country'); // 删除Netlify特有头，避免目标网站识别

  try {
    // 发起请求时使用完整的 targetUrl
    const original_response = await fetch(targetUrl.href, {
      method: request.method,
      headers: new_request_headers,
      body: request.body,
      redirect: 'follow',
      cache: 'no-store', // 禁用缓存，避免404缓存
    });

    // 处理目标网站返回的404（增加日志，方便排查）
    if (original_response.status === 404) {
      console.error(`Target site returned 404: ${targetUrl.href}`); // 本地测试时查看终端日志
      return new Response(`Proxy failed: Target URL ${targetUrl.href} returns 404`, {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // 后续响应处理
    const new_response_headers = new Headers(original_response.headers);
    new_response_headers.delete('content-security-policy');
    new_response_headers.delete('content-security-policy-report-only');
    new_response_headers.delete('clear-site-data');
    new_response_headers.set('cache-control', 'public, max-age=14400');
    new_response_headers.set('access-control-allow-origin', '*');
    new_response_headers.set('access-control-allow-credentials', 'true');

    const content_type = new_response_headers.get('content-type') || '';
    let response_body;
    if (content_type.includes('text/html') && content_type.includes('UTF-8')) {
      let html_text = await original_response.text();
      html_text = await replace_response_text(html_text, upstream_domain, url_host);
      response_body = html_text;
    } else {
      response_body = original_response.body;
    }

    return new Response(response_body, {
      status: original_response.status,
      statusText: original_response.statusText,
      headers: new_response_headers,
    });
  } catch (err) {
    // 捕获请求错误（如目标域名无法解析）
    console.error(`Proxy request failed: ${err.message}`);
    return new Response(`Proxy error: ${err.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// 原有内容替换函数（确保替换时保留路径）
async function replace_response_text(text, upstream_domain, custom_domain) {
  for (const [search_str, replace_str] of Object.entries(replace_dict)) {
    const resolved_search = search_str === '$upstream' ? `https://${upstream_domain}` : search_str; // 完整匹配带https的域名
    const resolved_replace = replace_str === '$custom_domain' ? `https://${custom_domain}` : replace_str;
    text = text.replace(new RegExp(resolved_search, 'g'), resolved_replace);
  }
  return text;
}