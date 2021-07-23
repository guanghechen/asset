<header>
  <h1 align="center">
    <a href="https://github.com/guanghechen/yozora/tree/main/packages/handbook-api#readme">@guanghechen/handbook-api</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@guanghechen/handbook-api">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@guanghechen/handbook-api.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@guanghechen/handbook-api">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@guanghechen/handbook-api.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@guanghechen/handbook-api">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@guanghechen/handbook-api.svg"
      />
    </a>
    <a href="#install">
      <img
        alt="Module formats: cjs, esm"
        src="https://img.shields.io/badge/module_formats-cjs%2C%20esm-green.svg"
      />
    </a>
    <a href="https://github.com/nodejs/node">
      <img
        alt="Node.js Version"
        src="https://img.shields.io/node/v/@guanghechen/handbook-api"
      />
    </a>
    <a href="https://github.com/facebook/jest">
      <img
        alt="Tested with Jest"
        src="https://img.shields.io/badge/tested_with-jest-9c465e.svg"
      />
    </a>
    <a href="https://github.com/prettier/prettier">
      <img
        alt="Code Style: prettier"
        src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"
      />
    </a>
  </div>
</header>
<br/>

## Install

* npm

  ```bash
  npm install --save @guanghechen/handbook-api
  ```

* yarn

  ```bash
  yarn add @guanghechen/handbook-api
  ```

## Usage

* Prepare a workspace directory, for example:

  ```
  /home/demo/handbook/doc/
  ├── css
  │   └── box-model
  │       ├── position.md
  │       └── z-index.md
  └── react
      ├── demo.md
      └── hooks
          ├── effect.md
          └── issue.md
  ```

* Use `@guanghechen/handbook-api` in typescript

  ```typescript
  import fs from 'fs-extra'
  import path from 'path'
  import {
    HandbookConfig,
    HandbookDataProvider,
    SitePathConfig,
    resolveHandbookConfig,
  } from '@guanghechen/handbook-api'

  async function handle(
    workspace: string,
    handbookSourceRoot: string,
    handbookDataRoot: string,
  ): Promise<void> {
    const handbookNames = fs.readdirSync(path.resolve(workspace, handbookSourceRoot))
      .filter(p => fs.statSync(path.resolve(workspace, handbookSourceRoot, p)).isDirectory())

    const sitePathConfig: SitePathConfig = { urlRoot: '/', workspace }
    for (const handbookName of handbookNames) {
      const config: HandbookConfig = resolveHandbookConfig(
        {
          urlRoot: `/handbook/${ handbookName }`,
          sourceRoot: path.join(handbookSourceRoot, handbookName),
          dataRoot: path.join(handbookDataRoot, handbookName),
        },
        sitePathConfig,
      )
      const provider = new HandbookDataProvider(config)
      await provider.build()
    }
  }


  handle('/home/demo/handbook', 'doc', 'doc-data')
  ```

  * Then, the generated data will be placed in the `/home/demo/handbook/doc-data/` directory, something like below:

    ```
    /home/demo/handbook/doc-data/
    ├── css
    │   ├── asset.map.json
    │   ├── category.map.json
    │   ├── post
    │   │   ├── ec62f7df24449f80e7a984e10c557f2d50aba760.json
    │   │   └── f5d337022ef180f9fcd4fc0c401e0e99963fe642.json
    │   └── tag.map.json
    └── react
        ├── asset.map.json
        ├── category.map.json
        ├── post
        │   ├── 6d5ad184c9c5a81616173733457d677fcc5e4a42.json
        │   └── b5a99a469e1a68e159ab502291806b8b28933c84.json
        └── tag.map.json
    ```


### Options

## Examples
