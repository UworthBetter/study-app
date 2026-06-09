# 学习通题库应用

一个基于 React + TypeScript 的题库应用，支持单选、多选、判断题，可导入 Word 和 PDF 文档自动识别题目。

## 功能特性

- 支持单选题、多选题、判断题
- 练习模式和考试模式
- 从 Word (.docx) 和 PDF 文档导入题目
- 使用 PyMuPDF 后端解析 PDF，提高识别准确率
- 题目数据本地存储

## 快速开始

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
npm run server:install
```

### 启动应用

```bash
# 启动后端 PDF 解析服务
npm run server

# 在另一个终端启动前端开发服务器
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
study-app/
├── src/                    # 前端源代码
│   ├── App.tsx            # 主应用组件
│   └── main.tsx           # 入口文件
├── server/                 # 后端服务
│   ├── app.py             # Flask 服务器
│   └── pdf_parser.py      # PyMuPDF PDF 解析器
├── requirements.txt        # Python 依赖
├── package.json           # Node.js 依赖和脚本
└── README.md              # 项目说明
```

## 使用说明

1. 启动后端服务：`npm run server`
2. 启动前端开发服务器：`npm run dev`
3. 在浏览器中打开应用
4. 点击"导入新章节"上传 Word 或 PDF 文档
5. 系统会自动识别文档中的题目
6. 选择章节开始练习或考试

## PDF 解析说明

本项目使用 PyMuPDF 替代了前端的 PDF.js 解析，主要优势：

- 更准确的文本提取和布局分析
- 更好的跨页和分栏处理
- 支持更多 PDF 特性

后端服务运行在 `http://127.0.0.1:5000`，提供 `/api/parse-pdf` 接口用于 PDF 解析。

## 技术栈

- **前端**: React 19, TypeScript, Tailwind CSS, Vite
- **后端**: Python, Flask, PyMuPDF
- **文档解析**: mammoth (Word), PyMuPDF (PDF)