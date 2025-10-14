const crypto = require('crypto');
const readline = require('readline');

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 禁用字符选择功能（暂停输入字符选择）
process.stdin.setRawMode(false);

// 计算SHA-512哈希值的函数
function computeSHA512(plainText) {
  const hash = crypto.createHash('sha512');
  hash.update(plainText);
  return hash.digest('hex');
}

// 生成密码哈希值
function generateHash(password) {
  const hash = computeSHA512(password);
  console.log('\n=== 哈希值生成结果 ===');
  console.log(`原始密码: ${password}`);
  console.log(`SHA-512哈希值: ${hash}`);
  console.log('====================\n');
  return hash;
}

// 验证哈希值
function verifyHash(password, targetHash) {
  const computedHash = computeSHA512(password);
  const isMatch = computedHash === targetHash;
  
  console.log('\n=== 哈希值验证结果 ===');
  console.log(`原始密码: ${password}`);
  console.log(`计算的哈希值: ${computedHash}`);
  console.log(`目标哈希值: ${targetHash}`);
  console.log(`匹配结果: ${isMatch ? '✓ 验证通过' : '✗ 验证失败'}`);
  console.log('====================\n');
  
  return isMatch;
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: null,      // 'generate' 或 'verify'
    password: null,
    hash: null
  };
  
  // 简单的命令行参数解析
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--generate' || args[i] === '-g') {
      options.mode = 'generate';
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        options.password = args[i + 1];
        i++;
      }
    } else if (args[i] === '--verify' || args[i] === '-v') {
      options.mode = 'verify';
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        options.password = args[i + 1];
        i++;
        if (args[i + 1] && !args[i + 1].startsWith('-')) {
          options.hash = args[i + 1];
          i++;
        }
      }
    } else if (args[i] === '--help' || args[i] === '-h') {
      showHelp();
      process.exit(0);
    }
  }
  
  return options;
}

// 显示帮助信息
function showHelp() {
  console.log('\nSHA-512哈希值生成与验证工具');
  console.log('===========================');
  console.log('用法:');
  console.log('  node hash_tool.js --generate [password]   生成密码的哈希值');
  console.log('  node hash_tool.js --verify [password] [hash]  验证密码与哈希值是否匹配');
  console.log('  node hash_tool.js --help                  显示帮助信息');
  console.log('\n参数:');
  console.log('  --generate, -g   生成模式');
  console.log('  --verify, -v     验证模式');
  console.log('  --help, -h       显示帮助信息');
  console.log('\n示例:');
  console.log('  node hash_tool.js -g 123456');
  console.log('  node hash_tool.js -v 123456 e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855...');
  console.log('');
}

// 交互式生成哈希
function interactiveGenerate() {
  rl.question('请输入要生成哈希值的密码: ', (password) => {
    generateHash(password);
    rl.close();
  });
}

// 交互式验证哈希
function interactiveVerify() {
  rl.question('请输入要验证的密码: ', (password) => {
    rl.question('请输入目标哈希值: ', (hash) => {
      verifyHash(password, hash);
      rl.close();
    });
  });
}

// 交互式选择模式
function interactiveMode() {
  console.log('\n请选择操作模式:');
  console.log('1. 生成密码哈希值');
  console.log('2. 验证密码与哈希值');
  console.log('3. 显示帮助');
  
  rl.question('请输入选择 [1-3]: ', (choice) => {
    switch (choice) {
      case '1':
        interactiveGenerate();
        break;
      case '2':
        interactiveVerify();
        break;
      case '3':
        showHelp();
        rl.close();
        break;
      default:
        console.log('无效的选择，请重新运行程序。');
        rl.close();
    }
  });
}

// 主函数
function main() {
  console.log('====================================');
  console.log('    SHA-512 哈希值生成与验证工具    ');
  console.log('====================================');
  
  const options = parseArgs();
  
  if (options.mode === 'generate') {
    if (options.password) {
      generateHash(options.password);
      rl.close();
    } else {
      interactiveGenerate();
    }
  } else if (options.mode === 'verify') {
    if (options.password && options.hash) {
      verifyHash(options.password, options.hash);
      rl.close();
    } else {
      interactiveVerify();
    }
  } else {
    // 如果没有指定模式，显示交互式菜单
    interactiveMode();
  }
}

// 运行主函数
main();