# Netlify Edge Functions 代理项目

#### 切换至[English Documentation](README_EN.md)

这是一个基于Netlify Edge Functions实现的反向代理服务，提供密码验证保护和灵活的URL重写功能。
<br>一般情况下，如果源站没有使用反爬虫机制与访问验证机制则可直接镜像源站内容。
<br>此项目应在合规的情况下使用，在某些情况下可能会违反源站的服务条款，或直接造成违反法律行为，用户需自行承担风险。

>目前Cloudflare条款收紧策略，明确表示不得使用其作为虚拟专用网络或其他类似代理的服务，这就导致了Worker无法使用其作为反向代理。于是基于某作者（忘记出处了，抱歉）的代码进行修改，并查阅其他托管平台并最终选择Netlify，因为没有相关条款限制再加上许多项目都是基于Netlify进行托管的，故采用，但是依旧可以通过Cloudflare的CDN进行部署，只是代理可能产生的风险在Cloudflare上。
<br>详见**[Cloudflare条款](https://www.cloudflare-cn.com/terms/)**
<br>第2.2.1条：(j) use the Services to provide a virtual private network or other similar proxy services.

## 功能特点

- **密码验证保护**：通过SHA-512哈希验证密码，确保只有授权用户可以访问。
- **SSL环境检测**：通过主机名识别本地环境（localhost/127.0.0.1）不强制使用SSL环境，避免SSL协议错误。
- **多URL重写**：支持域名替换和路径保留，可根据需要自定义URL规则。
- **跨域请求处理**：配置适当的CORS头，确保跨域资源正常加载。
- **缓存配置功能**：支持可配置的缓存机制，通过环境变量控制缓存时间，提高访问速度和减少源站请求。
- **IP转发功能**：通过X-Forwarded-For和X-Real-IP头传递客户端真实IP，避免被源站拦截。

## 本地开发

### 环境要求

- Node.js 14+
- Netlify CLI

### 安装步骤

1. 安装Netlify CLI
   ```bash
   npm install -g netlify-cli
   ```

2. 克隆项目后进入目录
   ```bash
   cd [项目目录]
   ```

3. 启动本地开发服务器
   ```bash
   netlify dev --offline
   ```

4. 访问 http://localhost:[端口号]

## 密码验证

默认密码：`13904400`

如需修改密码，请：
1. 使用项目提供的 `hash_tool.js` 工具计算新密码的SHA-512哈希值
2. 在 `netlify.toml` 文件中更新 `AUTH_PASSWORD_HASH` 环境变量为新的哈希值，生产环境部署时需要在Netlify控制台配置该环境变量。

## 密码哈希工具使用说明

项目包含 `hash_tool.js` 工具，用于生成和验证SHA-512哈希值：

### 功能特点
- 生成密码的SHA-512哈希值
- 验证密码与哈希值是否匹配
- 支持命令行参数和交互式操作

### 使用方法

#### 命令行参数模式

生成哈希值：
```bash
node hash_tool.js --generate [密码]
# 或简写
node hash_tool.js -g [密码]
```

验证哈希值：
```bash
node hash_tool.js --verify [密码] [哈希值]
# 或简写
node hash_tool.js -v [密码] [哈希值]
```

显示帮助信息：
```bash
node hash_tool.js --help
# 或简写
node hash_tool.js -h
```

#### 交互式模式

直接运行程序进入交互式菜单：
```bash
node hash_tool.js
```

然后根据提示选择操作模式：
1. 生成密码哈希值
2. 验证密码与哈希值
3. 显示帮助

### 使用示例

生成新密码的哈希值：
```bash
node hash_tool.js -g [新密码]
```

验证密码与哈希值：
```bash
node hash_tool.js -v [测试密码] daef4953b9783365cad6615223720506cc46c5167cd16ab500fa597aa08ff964eb24fb19687f34d7665f778fcb6c5358fc0a5b81e1662cf90f73a2671c53f991
```

## 配置说明

### 环境变量配置

> **说明**：在Netlify平台上，控制台配置的环境变量优先级高于 `netlify.toml` 文件中配置的环境变量。
> 这是Netlify的默认行为，确保了敏感信息可以安全地在控制台配置，同时允许在toml中设置默认值用于本地开发。

项目支持以下关键环境变量配置，可在 `netlify.toml` 文件中设置或在Netlify控制台配置：

| 环境变量 | 描述 | 默认值 |
|---------|------|-------|
| **UPSTREAM_DOMAIN** | 目标代理域名，建议根据实际情况修改为目标源站域名 | github.com |
| **UPSTREAM_V4_DOMAIN** | IPv4代理域名，用于特殊场景如图片搜索，如果源站只支持IPv4访问，建议修改为源站的IPv4地址 | - |
| **CUSTOM_DOMAIN** | 自定义域名，用于URL重写，作为访问的入口域名 | - |
| **AUTH_PASSWORD_HASH** | 密码的SHA-512哈希值 | - |
| **ENABLE_PASSWORD** | 启用/禁用密码验证（布尔值，兼容0与1） | true |
| **COOKIE_EXPIRE_MINUTES** | Cookie有效期（分钟） | 60 |
| **NETLIFY_ENV** | 环境标识 | production |
| **CACHE_TTL** | 缓存过期时间（秒），设置为0可禁用缓存 | 7200（120分钟） |

### netlify.toml

主要配置文件，包含：
- 环境变量设置
- Edge Functions路径映射
- HTTP头配置

### proxy.js

核心代理逻辑，包含：
- 密码验证机制
- URL重写规则
- 请求/响应处理
- 本地环境检测

## 部署到Netlify

1. 将代码推送到GitHub/GitLab仓库
2. 在Netlify控制台连接仓库
3. 配置环境变量（**强烈建议**在Netlify控制台配置而不是硬编码在toml中）
   - 控制台配置的环境变量将覆盖toml文件中的同名配置
   - 这确保了敏感信息（如密码哈希）不会被提交到代码仓库
4. 部署完成后，访问Netlify提供的URL

## 生产环境注意事项

- 确保在生产环境中将 `NETLIFY_ENV` 设置为 `"production"`
- 使用HTTPS确保安全访问
- 定期更新验证密码
- 根据需要调整 `COOKIE_EXPIRE_MINUTES` 来控制会话有效期
- 监控代理请求日志，及时发现异常
- 建议在Netlify控制台配置敏感环境变量，而非硬编码在配置文件中


