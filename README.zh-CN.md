# Automata-Lab

简体中文 | [English](README.md)

Automata-Lab 是一个基于 [Next.js](https://nextjs.org/) 的自动机可视化实验平台，用于构建、编辑和运行有限自动机、非确定有限自动机与图灵机。

## 项目说明

Automata-Lab 是基于 [Automata-Playground](https://github.com/ErnestThePoet/Automata-Playground) 二次开发的自动机可视化实验平台，新增 NFA 支持、DFA/NFA 互转、五元组定义面板、开始状态入射箭头和更方便的 JSON 导出。

## 致谢

特别感谢 [ErnestThePoet](https://github.com/ErnestThePoet) 创作并开源原项目 [Automata-Playground](https://github.com/ErnestThePoet/Automata-Playground)。本项目建立在原项目的基础之上，原项目的界面设计、图编辑模型和自动机可视化流程为本项目提供了重要基础。

## 功能

- 可视化编辑 DFA 状态与转移
- 可视化编辑 NFA 状态与非确定转移
- 可视化编辑图灵机状态与转移
- 运行自动机并观察执行过程
- 导入与导出自动机 JSON 数据
- 支持静态导出，便于部署到 GitHub Pages 等静态站点

## 快速开始

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。首页会自动跳转到 DFA 页面。

## 可用脚本

```bash
npm run dev
```

启动本地开发服务器。

```bash
npm run build
```

构建生产版本。

```bash
npm run export
```

构建并导出静态文件到 `docs/` 目录。

```bash
npm run start
```

启动生产服务器。

```bash
npm run lint
```

运行 Next.js ESLint 检查。

## 主要目录

- `pages/`：Next.js 页面，包括 DFA、NFA、图灵机和动态路由页面
- `components/`：界面组件
- `modules/`：自动机数据处理、图操作和工具函数
- `observables/`：MobX 状态数据
- `styles/`：样式文件
- `public/`：静态资源
- `docs/`：静态导出结果
