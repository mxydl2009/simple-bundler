## 手写一个简单的类似webpack的打包器

打包流程：
1. 定义依赖分析函数，读取文件内容，分析得到该文件导入的依赖项
  - code => AST => 得到导入声明,记录导入声明中的依赖项路径 => AST->code => 返回记录当前文件、依赖项和转译后的code的对象
2. 定义分析依赖图标列表的函数，传入项目的入口文件，递归调用依赖分析函数，得到所有文件的依赖关系图列表，返回该列表。
  - 核心在于如何递归调用依赖分析函数，这里使用广度优先的算法，通过对根节点的分析开始，依次构建得到下一层级的节点，对这一层级的节点按顺序分析，得到下一层级节点再次按顺序分析，直到无法再得到下一层级节点为止。
  - 每一轮的依赖分析，都将依赖项push到列表中。这样保证了按顺序的广度优先分析。

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
