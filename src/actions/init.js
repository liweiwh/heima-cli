// 初始化项目
const path = require('path')
const fs = require('fs')
const Inquirer = require('inquirer')
const del = require('del')
const axios = require('axios')
const ora = require('ora')
const { promisify } = require('util')
const downloadGitRepo = promisify(require('download-git-repo'))
const MetalSmith = require('metalsmith')
const { render } = promisify(require('consolidate').ejs)
const ncp = promisify(require('ncp'))
const shelljs = require('shelljs')
const config = require('./config')
const baseURL = config('get', 'api')
const defaultRepo = config('get', 'repo')
// const defaultRegistry = config('get', 'registry')

axios.defaults.baseURL = baseURL

// 判断并创建目录
const existDir = async (projectName) => { 
  // 判断目录是否存在，如果不存在则创建；如果存在，提示用户是否覆盖
  // cli -> cli/projectName -> prompt -> y -> makedir
  const dir = path.resolve('.')
  const createDir = dir + '/' + projectName
  if (fs.existsSync(createDir)) {
    // 提示用户是否覆盖
    // Inquirer
    const result = await Inquirer.prompt({
      name: 'create dir',
      type: 'confirm',
      message: 'Overwrite your existed Directory?',
      default: true
    })
    if (result) {
      // delete directory
      await del(createDir)
      // 创建目录
      fs.mkdirSync(createDir)
    } else {
      process.exit(1)
    }

  } else { 
    // 创建目录
    fs.mkdirSync(createDir)
  }
  return createDir
}

// 等待axios请求完成
const waitLoading = (fn, message) => async (...args) => { 
  const spinner = ora(message)
  spinner.start()
  const result = await fn(...args)
  spinner.succeed()
  return result
}

// 拉取远程的github仓库
const fetchRepoList = async () => { 
  const { data } = await axios.get(`/users/${defaultRepo}/repos`)
  const repoName = data.map(item => item.name).filter((item) => /^vue-template.*/.test(item))
  return repoName
}

// 拉取远程仓库的tags
const fetchRepoTags = async (repo) => { 
  const { data } = await axios.get(`/repos/${defaultRepo}/${repo}/tags`)
  const tagName = data.map(item => item.name)
  return tagName
}

// 下载git代码
const download = async (repo, dest) => { 
  const result = downloadGitRepo(repo, dest)
  return result
}

module.exports = async (args) => {
  // 让用户选择对应的仓库 + tags
  const dest = await existDir(args)
  const repos = await waitLoading(fetchRepoList, '获取远程仓库！')()
  const { repo } = await Inquirer.prompt({
    name: 'repo',
    type: 'list',
    message: '请选择下载对应的模块仓库',
    choices: repos
  })
  const tags = await waitLoading(fetchRepoTags, '获取仓库标签！')(repo)
  const { tag } = await Inquirer.prompt({
    name: 'tag',
    type: 'list',
    message: '请选择对应的仓库标签！',
    choices: tags
  })
  // 下载模板代码
  let repoURL = `liweiwh/${repo}`
  if (tag) { 
    repoURL = `liweiwh/${repo}#${tag}`
  }
  // 需要一个缓存目录去存储template ~/.temp
  const downloadDest = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.temp`
  if (!fs.existsSync(downloadDest)) {
    fs.mkdirSync(downloadDest)
  }
  const target = `${downloadDest}/${repo}`
  await waitLoading(download, '下载远程模板')(repoURL, target)
  // 读取远程模板中是否有对应的prompt.js文件
  if (fs.existsSync(path.join(target, 'prompt.js'))) { 
    // 读取promt.js中对应的变量（用户输入）
    // 对files进行render处理
    // 删除prompt.js文件
    await new Promise((resolve, reject) => {
      MetalSmith(__dirname)
        .source(target)
        .destination(dest)
        // 步骤一：获取对应的模板变量
        .use(async (files, metal, done) => {
          const result = await Inquirer.prompt(require(path.join(target, 'prompt.js')))
          const data = metal.metadata()
          Object.assign(data, result)
          delete files['prompt.js']
          done()
        })
        // 步骤二：对项目中的文件进行统一的处理
        .use(async (files, metal, done) => {
          Object.keys(files).forEach(async (file) => {
            // 获取文件中的内容
            let content = files[file].contents.toString()
            if (file.includes('.js') || file.includes('.json')) {
              if (content.includes('<%')) {
                content = await render(content, metal.metadata())
                files[file].contents = Buffer.from(content)
              }
            }
          })
          done()
        })
        .build(async (err) => {
          await del(target, {force: true})
          if (!err) {
            resolve()
          } else {
            reject()
          }
        })
    })
  } else {
    // 复制项目到dest目录
    await ncp(target, dest)
  }

  shelljs.cd(dest)
  shelljs.exec('npm install')
}