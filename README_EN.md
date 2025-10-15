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
- **Cache Configuration Feature**: Supports configurable caching mechanism, controls cache time through environment variables, improves access speed and reduces origin server requests.
- **IP Forwarding Feature**: Passes client's real IP through X-Forwarded-For and X-Real-IP headers to avoid being blocked by origin servers.

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

### Environment Variable Configuration

> **Note**: On the Netlify platform, environment variables configured in the console take precedence over those configured in the `netlify.toml` file.
> This is Netlify's default behavior, ensuring that sensitive information can be safely configured in the console while allowing default values to be set in the toml for local development.

The project supports the following key environment variables, which can be set in the `netlify.toml` file or configured in the Netlify console:

| Environment Variable | Description | Default Value |
|---------------------|-------------|---------------|
| **UPSTREAM_DOMAIN** | Target proxy domain, recommended to modify according to the actual target source domain | baidu.com |
| **UPSTREAM_V4_DOMAIN** | IPv4 proxy domain, used for special scenarios such as image search. If the source only supports IPv4 access, it is recommended to modify it to the IPv4 address of the source | - |
| **CUSTOM_DOMAIN** | Custom domain name for URL rewriting, as the entry domain for access | - |
| **AUTH_PASSWORD_HASH** | SHA-512 hash value of the password | - |
| **ENABLE_PASSWORD** | Enable/disable password verification (boolean, compatible with 0 and 1) | true |
| **COOKIE_EXPIRE_MINUTES** | Cookie expiration time (minutes) | 60 |
| **NETLIFY_ENV** | Environment identifier | production |
| **CACHE_TTL** | Cache expiration time (seconds), set to 0 to disable caching | 7200 (120 minutes) |

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