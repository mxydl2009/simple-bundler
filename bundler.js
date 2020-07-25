const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const babel = require('@babel/core')

// 判断是否为{}对象的方法
const isEmptyObject = (obj) => {
  for(key in obj) {
    return false
  }
  return true
}
// 读取文件内容，分析依赖
const moduleAnalyzer = (filename) => {
  // 读取入口文件内容
  const content = fs.readFileSync(filename, 'utf-8')
  // 解析文件内容，转换为AST
  const ast = parser.parse(content, {
    sourceType: 'module'
  })
  // 声明一个用来存储依赖模块的对象,键为导入模块的相对路径，值为导入模块的绝对路径（相对于项目根目录）
  const dependencies = Object.create(null)
  // 遍历AST节点，获取导入声明的节点，将导入声明的节点的source的value属性值存储到依赖对象中
  traverse(ast, {
    ImportDeclaration({ node }) {
      // 获取入口文件的所在目录
      const dirname = path.dirname(filename)
      // 拼接路径
      const newFile = './' + path.join(dirname, node.source.value)
      // 相对路径和绝对路径作为键值对一起存储
      dependencies[node.source.value] = newFile
    }
  })
  // 分析更新AST后，使用babel.transformFromAstSync将AST转换为代码code
  // 将ES6语法转为浏览器能运行的语法
  const { code } = babel.transformFromAstSync(ast, null, {
    presets: ['@babel/preset-env']
  })
  const res = {
    filename,
    code
  }

  // 返回分析结果，包含了入口文件、依赖对象和入口文件经过转译后的代码
  if(isEmptyObject(dependencies)) {
    return res
  } else {
    return Object.assign(res, { dependencies })
  }
}

// 构建依赖关系图谱列表
const makeDependenciesGraph = (entry) => {
  const entryModule = moduleAnalyzer(entry)
  // 
  const graphList = [ entryModule ]
  for(let i = 0; i < graphList.length; i ++) {
    const item = graphList[i]
    const { dependencies } = item
    if(dependencies) {
      for(dependency in dependencies) {
        const res = moduleAnalyzer(dependencies[dependency])
        graphList.push(res)
      }
    }
  }
  const graph = {}
  graphList.forEach(item => {
    graph[item.filename] = {
      dependencies: item.dependencies,
      code: item.code
    }
  })
  return graph
}

// 从依赖图谱列表生成浏览器可用代码
const generateCode = (entry) => {
  const graph = makeDependenciesGraph(entry)
  // 使用JSON.stringify为了避免下面用${graph}时变为'[object Object]'
  // 实际这段字符串在浏览器中作为JavaScript代码运行时，graphCode实际上就是一个对象
  const graphCode = JSON.stringify(graph)
  // 返回的代码要包含在IIFE中
  return `
    (function (graph) {
      function require(module) {
        // localRequire函数用来将加载相对路径转换为加载绝对路径后返回结果
        // 主要是由于这里存储的键为绝对路径，在依赖图中只能利用绝对路径来加载模块
        function localRequire(relativePath) {
          return require(graph[module].dependencies[relativePath])
        }
        // 在定义exports时，由于是在IIFE之前，所以赋值语句必须要有分号作为结尾，否则要出错
        var exports = {};
        (function(require, exports, code) {
          eval(code)
        })(localRequire, exports, graph[module].code)
        return exports
      }
      require('${entry}')
    })(${graphCode})
  `
}

const code = generateCode('./src/index.js')

// 将code写到'./dist/bundle.js'文件中
fs.writeFile('./dist/bundle.js', code, (err) => {
  if(err) {
    fs.mkdir('./dist', (err) => {
      if(err) {
        console.log('fail')
      }
      fs.writeFileSync('./dist/bundle.js', code)
    })
  }
})