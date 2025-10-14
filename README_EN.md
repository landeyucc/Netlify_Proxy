# Netlify Edge Functions Proxy Project
#### Switch to [中文文档](README.md)

This is a reverse proxy service implemented using Netlify Edge Functions, providing password verification protection and flexible URL rewriting capabilities.
<br>Under normal circumstances, if the source website does not use anti-crawler mechanisms or access verification, you can directly mirror the content of the source website.
<br>This project should be used in compliance with regulations, as in some cases it may violate the source website's terms of service or directly cause illegal behavior. Users assume all risks.

## Features

- **Password Verification Protection**: Uses SHA-512 hash to verify passwords, ensuring only authorized users can access.
- **SSL Environment Detection**: Identifies local environments (localhost/127.0.0.1) through hostname to avoid SSL protocol errors by not enforcing SSL.
- **Multiple URL Rewrites**: Supports domain name replacement and path preservation, with customizable URL rules as needed.
- **Cross-Origin Request Handling**: Configures appropriate CORS headers to ensure cross-origin resources load properly.
- **Intelligent Cache System**: Sets different caching strategies based on resource types to improve response speed and reduce bandwidth usage.

## Local Development

### Requirements

- Node.js 14+
- Netlify CLI

### Installation Steps

1. Install Netlify CLI
   ```bash
   npm install -g netlify-cli
   ```

2. Clone the project and navigate to the directory
   ```bash
   cd [project-directory]
   ```

3. Start the local development server
   ```bash
   netlify dev --offline
   ```

4. Visit http://localhost:[port-number]

## Environment Variable Configuration

The proxy service supports multiple environment variable configurations, which can be set in the `netlify.toml` file or configured in the Netlify console.

> **Note**: On the Netlify platform, environment variables configured in the console take precedence over those configured in the `netlify.toml` file.
> This is Netlify's default behavior, ensuring that sensitive information can be safely configured in the console while allowing default values to be set in the toml for local development.

### All Environment Variables Summary Table

| Environment Variable | Default Value | Type | Description |
|---------------------|---------------|------|-------------|
| `UPSTREAM_DOMAIN` | `baidu.com` | Proxy Config | Target proxy domain, recommended to modify to the target source domain |
| `UPSTREAM_V4_DOMAIN` | Same as UPSTREAM_DOMAIN | Proxy Config | IPv4 proxy domain, used for special scenarios such as image search |
| `CUSTOM_DOMAIN` | `your-domain.com` | Proxy Config | Custom domain name for URL rewriting, as the entry domain for access |
| `AUTH_PASSWORD_HASH` | `da7886fb8f45b3bf6e77884f97ae5fb4275ee792ecaa629fa2869d7a251d0c0d5fbf1a5a68f6365d67bbfd7e03a4b0fd0857204bf9fbc44bcaa5f7ac5b0e3b8d` | Auth Config | SHA-512 hash of password, corresponding to default password 13904400 |
| `ENABLE_PASSWORD` | `true` | Auth Config | Enable/disable password verification (boolean, compatible with 0 and 1) |
| `COOKIE_EXPIRE_MINUTES` | `60` | Auth Config | Cookie expiration time (minutes), default 60 minutes |
| `NETLIFY_ENV` | `production` | Env Config | Environment identifier (development/production) |
| `ENABLE_CACHE` | `true` | Cache Config | Whether to enable cache functionality |
| `CACHE_TTL` | `14400` (4 hours) | Cache Config | Standard cache time (seconds), suitable for dynamic content like HTML pages |
| `STATIC_CACHE_TTL` | `86400` (1 day) | Cache Config | Static resource cache time (seconds), suitable for CSS, JavaScript, and JSON files |
| `IMAGE_CACHE_TTL` | `604800` (7 days) | Cache Config | Image resource cache time (seconds), suitable for image files |

## Cache Description

The proxy service includes an intelligent cache system that automatically sets different caching strategies based on resource types to improve response speed and reduce bandwidth usage.

### Cache Type Strategies

- **HTML Pages**: Use standard cache time (default 4 hours)
- **Static Resources**: CSS, JavaScript, JSON and other files use longer cache time (default 1 day)
- **Image Resources**: Use the longest cache time (default 7 days)

### Cache Control

1. For local testing, cache configurations can be set in the `netlify.toml` file
2. In production environment, it is recommended to configure these environment variables in the Netlify console
3. A `X-Cache` header will be added to responses with value `HIT` (cache hit) or `MISS` (cache miss) for debugging purposes

## Password Verification

Default password: `13904400`

To change the password:
1. Use the provided `hash_tool.js` tool to compute the SHA-512 hash of your new password
2. Update the `AUTH_PASSWORD_HASH` environment variable in the `netlify.toml` file with the new hash value. For production deployment, you need to configure this environment variable in the Netlify console.

## Password Hash Tool Usage

The project includes a `hash_tool.js` tool for generating and verifying SHA-512 hash values:

### Features
- Generate SHA-512 hash of passwords
- Verify if a password matches a hash value
- Support for command-line arguments and interactive operation

### Usage Methods

#### Command-Line Argument Mode

Generate hash value:
```bash
node hash_tool.js --generate [password]
# or shorthand
node hash_tool.js -g [password]
```

Verify hash value:
```bash
node hash_tool.js --verify [password] [hash]
# or shorthand
node hash_tool.js -v [password] [hash]
```

Display help information:
```bash
node hash_tool.js --help
# or shorthand
node hash_tool.js -h
```

#### Interactive Mode

Run the program directly to enter interactive menu:
```bash
node hash_tool.js
```

Then select the operation mode as prompted:
1. Generate password hash value
2. Verify password and hash value
3. Display help

### Usage Examples

Generate hash for a new password:
```bash
node hash_tool.js -g [new-password]
```

Verify password and hash value:
```bash
node hash_tool.js -v [test-password] daef4953b9783365cad6615223720506cc46c5167cd16ab500fa597aa08ff964eb24fb19687f34d7665f778fcb6c5358fc0a5b81e1662cf90f73a2671c53f991
```

## Configuration Instructions

### netlify.toml

Main configuration file, including:
- Environment variable settings
- Edge Functions path mapping
- HTTP header configuration

### proxy.js

Core proxy logic, including:
- Password verification mechanism
- URL rewriting rules
- Request/response handling
- Local environment detection

## Deployment to Netlify

1. Push the code to GitHub/GitLab repository
2. Connect the repository in the Netlify console
3. Configure environment variables (**strongly recommended** to configure in the Netlify console rather than hardcoding in toml)
   - Environment variables configured in the console will override the same configurations in the toml file
   - This ensures that sensitive information (such as password hashes) is not committed to the code repository
4. After deployment is complete, access the URL provided by Netlify

## Production Environment Notes

- Ensure `NETLIFY_ENV` is set to `"production"` in the production environment
- Use HTTPS to ensure secure access
- Update verification passwords regularly
- Adjust `COOKIE_EXPIRE_MINUTES` as needed to control session duration
- Monitor proxy request logs to detect anomalies in a timely manner
- It is recommended to configure sensitive environment variables in the Netlify console rather than hardcoding them in configuration files