const fs = require('fs')
const { configDest, defaultConfig} = require('../lib/constants')
const { encode, decode } = require('ini')

module.exports = (action, k, v) => {
  const file = fs.existsSync(configDest)
  const obj = {}
  // 获取本地的配置文件中的配置
  if (file) { 
    const content = fs.readFileSync(configDest, 'utf8')
    const contentObj = decode(content)
    Object.assign(obj, contentObj)
  }
  if (action === 'get') {
    const result = obj[k] || defaultConfig[k]
    console.log(result);
    return result
  } else if (action === 'set') {
    obj[k] = v
    // 把内容进行了转换，转换成了 key=value的形式，写入到configDest中去
    fs.writeFileSync(configDest, encode(obj))
    console.log(`${k}=${v}`);
  }
}
