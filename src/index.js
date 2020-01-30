const program = require('commander')
const path = require('path')

const { version } = require('../package.json')

program.version(version)

const mapActions = {
  init: {
    alias: 'i',
    description: 'create init a project!',
    examples: [
      'heima init <project-name>',
      'heima i <project-name>'
    ]
  },
  config: {
    alias: 'c',
    description: 'get or set project config!',
    examples: [
      'heima config set or get <property>',
      'heima c or s <property>'
    ]
  },
  '*': {
    alias: '',
    description: 'command not found!',
    examples: []
  }
}

Object.keys(mapActions).forEach((key) => { 
  // 获取用户的参数，指令 init create add remove....
  program
    .command(key)
    .alias(mapActions[key].alias)
    .description(mapActions[key].description)
    .action(() => {
      if (key === '*') {
        console.log(mapActions[key].description);
      } else { 
        // create init <projectName>
        require(path.resolve(__dirname, `./actions/${key}`))(...process.argv.splice(3))
      }
    })
})

// 自定义help
program.on('--help', () => { 
  console.log('\nExamples');
  Object.keys(mapActions).forEach((key) => { 
    mapActions[key].examples.forEach((example) => { 
      console.log(` ${example}`);
    })
  })
})



// 安装对应的依赖

program.parse(process.argv)