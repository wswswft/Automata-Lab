# Automata Playground

[简体中文](README.zh-CN.md) | English

Automata Playground is a [Next.js](https://nextjs.org/) based visual playground for building, editing, and running finite automata, nondeterministic finite automata, and Turing machines.

## Features

- Visually edit DFA states and transitions
- Visually edit NFA states and nondeterministic transitions
- Visually edit Turing machine states and transitions
- Run automata and inspect the execution process
- Import and export automata as JSON data
- Export static files for deployment to GitHub Pages or other static hosting services

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The home page redirects to the DFA page automatically.

## Available Scripts

```bash
npm run dev
```

Starts the local development server.

```bash
npm run build
```

Builds the production version.

```bash
npm run export
```

Builds and exports static files to the `docs/` directory.

```bash
npm run start
```

Starts the production server.

```bash
npm run lint
```

Runs the Next.js ESLint checks.

## Main Directories

- `pages/`: Next.js pages, including DFA, NFA, Turing machine, and dynamic route pages
- `components/`: UI components
- `modules/`: automata data handling, graph operations, and utility functions
- `observables/`: MobX state data
- `styles/`: style files
- `public/`: static assets
- `docs/`: static export output
