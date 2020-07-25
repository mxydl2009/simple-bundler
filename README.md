## 手写一个简单的类似webpack的打包器

打包流程：
1. 定义依赖分析函数，读取文件内容，分析得到该文件导入的依赖项
2. 定义分析依赖图标列表的函数，传入项目的入口文件，调用依赖分析函数，得到所有文件的依赖关系图列表

- cli-highlight包：用于在终端高亮显示信息
- @babel/parser：分析JavaScript文件,解析为AST（JavaScript对象）
- @babel/traverse: 与@babel/parser一起使用，遍历AST,对其中的节点进行操作，如更新、删除等等
  - traverse(ast, options): 其中，options是一个选项对象，包含了一系列Hooks函数
  - 对特定类型的节点可以使用特定的函数,节点类型参考@babel/types
    - 对ESModule的导入节点使用options.ImportDeclaration(path) {},path是参数，其中path.node是指向导入声明的节点
    - 对函数声明的节点使用options.FunctionDeclaration(path) {}
    - 进入节点使用options.enter(path) {}
    - 退出节点使用options.exit(path) {}
- @babel/core: 将AST转换为JavaScript代码，需要配合@babel/preset-env
