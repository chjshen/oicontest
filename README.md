# OIContest - 信息学竞赛测试管理工具

## 使用样例

假设你要组织一次名为 `my_contest` 的比赛，包含两道题：

```bash
oicontest init my_contest
cd my_contest
oicontest addproblem      # 添加第一道题，按提示输入
oicontest addproblem      # 添加第二道题

oicontest listproblem     # 查看题目列表

oicontest edit            # 编辑比赛信息或题目ID

oicontest swapindex       # 调整题目顺序

oicontest genhtml         # 生成 HTML 题面
# 用浏览器打开 html/my_contest.html 并打印为 PDF，保存到当前目录

oicontest genlemon        # 生成 LEMON 评测包（如需评测）

oicontest export          # 导出学生/教师考试包

cd ..
oicontest package         # 打包整个 contest 目录，便于同行分发
```

---

# 功能特性
- 🚀 **测试初始化**：一键创建标准 contest 目录结构，自动生成全局配置文件和必要子目录。
- 📝 **题目管理**：交互式添加、删除、列出题目，自动生成题目目录、配置、样例、附加文件等。
- 🔀 **题目顺序调整**：支持单个、批量、拖拽式三种模式，灵活调整题目在比赛中的显示顺序。
- 📄 **HTML 题面生成**：自动生成带题目汇总表的 HTML 题面，支持数学公式，推荐用浏览器打印为 PDF。
- 🍋 **LEMON 评测包**：一键生成 LEMON 评测系统兼容的评测包（ZIP），自动整理测试数据、校验器、题目配置。
- ⚙️ **测试编辑**：随时修改测试基本信息（名称、时长、作者等），支持题目ID重命名，自动同步目录和配置。
- 📦 **考试包导出**：一键导出学生/教师用考试包（student.zip/teacher.zip），包含题面、PDF、附加文件、标准答案和题解，自动修正图片/链接路径。
- 🗂️ **目录打包**：一键生成当前 contest 目录结构说明（readme.txt，树形结构），并整体 zip 打包，便于同行分发交流。
- 🔌 **插件支持**：可扩展的插件系统（开发中）。
- 🔄 **OJ 导入**：支持导入 HydroOJ 等平台的题目（开发中）。

---

# 命令详解

## 1. 初始化测试
```bash
oicontest init <contest_dir>
```
- 交互式创建比赛目录结构，生成全局配置文件。
- `<contest_dir>` 为比赛目录名（如 my_contest）。

## 2. 添加题目
```bash
oicontest addproblem
```
- 交互式添加题目，自动生成题目目录、配置、样例、附加文件等。
- 支持多次添加。

## 3. 列出题目
```bash
oicontest listproblem
```
- 显示所有题目的详细信息，包括 ID、标题、时空限制、分值、验证状态等。

## 4. 删除题目
```bash
oicontest delproblem
```
- 删除指定题目及其目录，自动更新全局配置。

## 5. 编辑测试信息/题目ID
```bash
oicontest edit
```
- 编辑比赛基本信息（名称、时长、作者、开始时间等）。
- 支持修改已添加题目的 ID，自动重命名目录、同步 config.json。

## 6. 调整题目顺序
```bash
oicontest swapindex
```
- 支持单个、批量、拖拽式三种顺序调整方式。
- 自动更新全局配置中的题目顺序。

## 7. 生成 HTML 题面
```bash
oicontest genhtml
```
- 自动生成带题目汇总表的 HTML 文件（在 html/ 目录下）。
- 支持数学公式渲染。
- 推荐用浏览器打开 HTML 并打印为 PDF。

## 8. 生成 LEMON 评测包
```bash
oicontest genlemon
```
- 自动生成 LEMON 评测系统兼容的评测包（output/ 目录下的 ZIP 文件）。
- 整理测试数据、校验器、题目配置。

## 9. 查看测试状态
```bash
oicontest status
```
- 显示比赛当前状态、题目验证进度、题目总数等。

## 10. 导出考试包（学生/教师）
```bash
oicontest export
```
- student.zip：包含所有题目的 HTML、PDF、additional_file，图片/链接自动转为相对路径，便于离线考试。
- teacher.zip：包含 student.zip 全部内容，并额外包含所有题目的标准答案（std.cpp）和题解（solution），每题单独目录。
- PDF 只在 contest 目录下查找，HTML 在 html/ 目录下查找。
- 没有 PDF 时会提示先用 `oicontest genhtml` 生成 HTML 并打印 PDF。
- 所有 zip 文件生成在 contest 根目录。

## 11. 打包 contest 目录（含目录结构说明）
```bash
oicontest package
```
- 自动生成 contest 目录结构说明（readme.txt，树形结构）。
- 自动将 contest 目录整体 zip，zip 文件放在 contest 的上级目录。
- zip 文件名为 `[contest目录名].zip`。
- 该功能适用于命题人、教研组等同行之间分发、交流、归档整套 contest 资料，便于快速了解目录结构和内容。

---

# 目录结构示例
```bash
my_contest/
├── oicontest.json       # 测试配置文件
├── problem/             # 题目目录
│   ├── problem1/        # 单个题目
│   │   ├── config.json  # 题目配置
│   │   ├── problem.md   # 题目描述
│   │   ├── sample/      # 样例文件
│   │   ├── src/         # 源代码
│   │   └── testdata/    # 测试数据
├── html/                # 生成的 HTML 题面
└── output/              # LEMON 评测包
```

---

# 配置文件说明
- `oicontest.json`：contest 全局配置
- `problem/[id]/config.json`：单题配置
- `problem/[id]/status.json`：单题状态
- `problem/[id]/problem.yaml`、`testdata/config.yaml`：题目元数据

---

# 常见问题
- **PDF 题面如何生成？**
  - 推荐用 `oicontest genhtml` 生成 HTML 后，浏览器打印为 PDF。
- **如何批量分发题库？**
  - 用 `oicontest package` 生成 zip 包和目录说明。
- **如何导入 HydroOJ 题包？**
  - 用 `oicontest import` 命令，支持自动识别 zip 包格式。

---

# 贡献指南
1. Fork 本仓库
2. 新建分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'feat: xxx'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

---

# 许可证
本项目采用 [MIT 许可证](LICENSE)。

---

# 联系方式
如有任何问题或建议，请联系：19311565@qq.com

---

# 更新日志

### v1.1.0
- 新增 `oicontest export` 命令：一键导出学生/教师考试包（student.zip/teacher.zip），包含题面、PDF、题目附加文件、标准答案和题解，自动处理本地图片/链接路径。
- 新增 `oicontest package` 命令：自动生成 contest 目录结构说明（readme.txt），并整体 zip 打包，便于同行分发交流。
- 支持题目 ID 编辑、题目顺序调整、目录重命名等多项增强。

---
