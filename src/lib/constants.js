const { version, name } = require('../../package.json')

const userDest = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}`

// 用户配置的默认路径
// repo=itheima
// registry=github
// api=https://...
const configDest = `${userDest}/.itrc`

// 默认的配置
const defaultConfig = {
  repo: 'liweiwh',
  registry: 'github',
  api: 'https://api.github.com'
}

module.exports = {
  version,
  name,
  userDest,
  configDest,
  defaultConfig
}