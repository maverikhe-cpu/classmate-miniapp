# AGENTS.md

本文件面向 AI 编码代理，介绍本项目的结构、开发方式与约定。

## 项目概述

**同学圈**（classmate-miniapp）是一个微信小程序，服务于 9122 班同学（约 111 人）重新建立联系。核心功能四个标签页：

- **活动**（`pages/index`）：浏览、筛选、报名、创建同学聚会活动；活动详情页含相册（多人并发上传）、从相册选封面
- **回忆**（`pages/album`）：上传和浏览老照片，支持标签、模糊日期（"记不清了"）
- **通讯录**（`pages/contacts`）：同学名录 + 地图分布，按城市/班级筛选
- **我的**（`pages/profile`）：个人资料编辑、我参与的活动

首次使用需经过 onboarding 流程（`pages/onboarding`，也是 `entryPagePath`）：输入真实姓名 → 与云端 `classmates` 名册匹配验证身份 → 完善资料 → 绑定微信账号。

- AppID：`wxbdb0473db912cea9`（企业小程序）
- 基础库：3.3.4（`project.config.json`），私有配置中为 3.16.1
- 云开发环境：`cloud1-d7gakdyxk317f169d`（`wx.cloud.init` 未指定 env，走默认环境）

## 技术栈与运行时架构

- **前端**：原生微信小程序（WXML / WXSS / JS / JSON），无框架、无前端构建步骤、无 npm 依赖。页面申请 `scope.userLocation` 权限用于同学地图。
- **后端**：微信云开发（云函数 + 云数据库 + 云存储），未使用自建服务器。
- **云函数**：Node.js，每个函数独立目录，唯一依赖 `wx-server-sdk@~2.6.3`。
- **数据库集合**（共 4 个）：`users`（注册用户）、`classmates`（班级名册，含绑定状态）、`activities`（活动，含 `photos` 相册与 `coverImage` 封面）、`classPhotos`（照片）。
- **重要架构约束**：客户端不直接写数据库，所有读写都通过 `wx.cloud.callFunction` 走云函数（历史上专门为此重写过，见提交 "cloud function rewrites for client-side DB restrictions"）。图片通过 `wx.cloud.uploadFile` 直传云存储。
- **分享卡片图**：`onShareAppMessage` 的 `imageUrl` 按优先级取 `coverImage` → 相册首张照片 fileID → `/images/share-default.png`（500×400 品牌默认图）。微信分享图支持云存储 fileID。
- 启动流程（`miniprogram/app.js`）：`onLaunch` 调用 `login` 云函数获取 openid 和 onboarded 状态；`ensureOnboarded()` 未完成 onboarding 时重定向到 onboarding 页。

## 目录结构

```
miniprogram/            # 小程序前端（project.config.json 的 miniprogramRoot）
  app.js / app.json / app.wxss / sitemap.json
  pages/<page-name>/    # 11 个页面，每页 .js/.json/.wxml/.wxss 四件套
  components/           # 5 个自定义组件：activity-card, calendar-picker,
                        #   city-picker, fuzzy-date-picker, photo-card
  utils/                # 共享工具与静态数据：util.js(时间/活动状态), locations.js(国家城市),
                        #   cityCoords.js(地图坐标), categories.js(活动分类),
                        #   photoTags.js(照片标签/模糊日期), markdown.js(轻量 md→rich-text)
  images/               # tab 图标、默认头像、share-default.png(分享默认图)等静态资源
cloudfunctions/         # 26 个云函数（project.config.json 的 cloudfunctionRoot）
  <functionName>/       # 每个含 index.js + package.json
tests/                  # E2E 自动化测试（miniprogram-automator）
  run.js                # 测试入口/运行器
  helper.js / config.js # 连接 DevTools、waitFor 等公共方法、路径常量
  specs/<area>.test.js  # 5 个套件：activity, album, contacts, onboarding, profile
project.config.json     # 微信开发者工具项目配置（根目录，勿与 miniprogram/ 下的混淆）
project.private.config.json  # 本机私有配置
```

云函数按职责分组：

- 用户与名册：`login`、`bindClassmate`、`getUnboundClassmates`、`updateProfile`、`updateAvatar`
- 活动：`getActivities`、`getActivityDetail`、`createActivity`、`updateActivity`、`signupActivity`、`cancelSignup`、`addActivityPhotos`、`deleteActivityPhoto`、`setActivityCover`
- 照片：`classPhotos`、`getPhotoDetail`、`uploadClassPhoto`、`updatePhoto`、`deleteClassPhoto`
- 仅后端、前端尚未接入：`likeClassPhoto`、`addClassPhotoComment`、`suggestPhotoDate`（`classPhotos` 记录已预留 `comments`/`likeCount`/`likedBy`/`dateSuggestions` 字段）
- 运维/管理（开发者工具中手动调用，客户端无入口）：`seedData`（导入 `classmates.json` 名册，支持 seed/status/reset/reseed）、`resetUsers`、`cleanupUsers`（数据修复，支持 dryRun/clean）

## 构建、开发与部署命令

无构建步骤。本地开发：

1. 用微信开发者工具打开**项目根目录**（根 `project.config.json` 已指向 `miniprogram/` 与 `cloudfunctions/`）。
2. 修改云函数后必须重新部署才生效，两种方式：
   - 开发者工具中对函数目录右键"上传并部署：云端安装依赖"；
   - 或用 DevTools CLI（注意必须带 `-r`，否则只传代码不装依赖，函数运行时报 `Cannot find module 'wx-server-sdk'`）：
     ```sh
     /Applications/wechatwebdevtools.app/Contents/MacOS/cli \
       cloud functions deploy --env cloud1-d7gakdyxk317f169d \
       --names <fnName> --project <项目根目录> -r
     ```
     同一函数刚部署完会处于 Creating/Updating 状态，立即重试会报 `FailedOperation.UpdateFunctionCode`，等 30~60 秒再试。
3. 首次初始化环境时，在开发者工具的云函数调试中手动调用 `seedData`（`{ action: 'seed' }`）导入名册。

**云函数超时时间**：所有云函数执行超时已统一调整为 **20 秒**（创建时默认仅 3 秒，冷启动约 5 秒会被平台杀掉，曾导致 `callFunction` 偶发失败，长操作后尤其高发）。调整命令（tcb CLI 需登录拥有 `cloud1-d7gakdyxk317f169d` 的账号）：

```sh
tcb config update fn <fnName> --timeout 20 -e cloud1-d7gakdyxk317f169d
```

新建云函数后记得同样把超时改为 20 秒。客户端对关键调用（`addActivityPhotos`、`getActivityDetail`）另加了一次自动重试兜底。

**云存储权限**：必须保持为**"所有用户可读，仅创建者可写"（READONLY）**——照片/头像 fileID 由客户端 `<image>` 直接渲染，若误设为"仅创建者可读写"（PRIVATE），其他用户全部加载失败而管理员自查无感。曾因此导致发布后用户反馈照片打不开。查看/调整：

```sh
tcb storage get-acl -e cloud1-d7gakdyxk317f169d
tcb storage set-acl --acl READONLY -e cloud1-d7gakdyxk317f169d
```

发布通过开发者工具的"上传/预览"流程进行，无 CI/CD。

## 测试

仅有 E2E 测试，无单元测试。测试通过 `miniprogram-automator` 驱动真实模拟器：

```sh
cd tests
npm install        # 首次运行
npm test                    # 全部套件
npm run test:onboarding     # 单套件：onboarding / activity / profile / contacts
node run.js album           # album 无 npm script，用 run.js 直接传套件名
```

前提条件（脚本连不上时会提示）：

1. 微信开发者工具已打开并加载本项目；
2. 设置 → 安全 → 服务端口已开启；
3. 仅支持 macOS：DevTools CLI 路径硬编码为 `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`（见 `tests/config.js`、`tests/helper.js`）。

编写新测试的约定：

- 在 `tests/specs/<area>.test.js` 中导出 `{ name, tests: [{ name, fn }] }`，并在 `tests/run.js` 的 `specs` 表中注册套件名。
- 测试函数接收 `mp`（MiniProgram 实例），用 `page.$` / `page.$$` 选择器断言，失败时 `throw new Error(...)`；等待用 `helper.sleep` / `waitFor` / `waitForText`，默认超时 10s（慢操作 20s）。
- 测试名描述被验证的行为（英文），界面文案断言用中文。
- 写一次性验证脚本时可直接基于 `tests/helper.js` 的 `getMiniProgram()`；常用技巧：`page.setData` 注入数据验证渲染、`page.callMethod` 直接调页面方法绕过原生弹层、`mp.evaluate` 在小程序上下文里直接调 `wx.cloud.callFunction` 做云函数端到端验证。原生 UI（选图面板、action sheet）无法被自动化驱动，需真机验证。

## 代码风格与命名约定

- 全部使用两空格缩进（JS / JSON / WXML / WXSS）。
- JS 使用 CommonJS（`require` / `module.exports`），不使用 ES Module；不引入新依赖——小程序端零依赖，云函数只依赖 `wx-server-sdk`。
- 页面、组件目录用 kebab-case（如 `activity-detail`、`photo-card`）；云函数目录用 camelCase 动词短语（如 `getActivityDetail`、`updateProfile`）。
- 页面四件套各司其职：逻辑在 `.js`、结构在 `.wxml`、样式在 `.wxss`、页面元信息与组件声明在 `.json`；公共逻辑优先放 `miniprogram/utils/` 而非重复实现。
- 云函数统一模式：`cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })`；返回 `{ success: false, error: '中文错误信息' }` 表示失败；异常用 `console.error('<fnName> error:', err)` 记录后返回错误信息，不抛出。
- UI 文案、代码注释、文档均使用中文。
- 提交信息使用 Conventional Commits：`feat: ...` / `fix: ...` / `chore: ...`，必要时注明影响范围（如 `fix: onboarding login flow`）。功能分支用 `feature/<name>`，合入 main 采用 fast-forward。PR 应包含行为摘要、测试结果，可见 UI 变更附截图。

## 安全与配置注意事项

- **内容安全现状**：云函数目前**未接入** `msgSecCheck` / `imgSecCheck`（代码库中不存在 `contentSecurity.js` / `config.json`），用户发布的文本与图片仅靠客户端体验约束。若后续要接入微信内容安全 API，注意需要同时在函数目录加 `config.json` 声明 openapi 权限并重新部署。
- **权限模型**：以 openid 标识用户；服务端权限校验都在云函数内做（如发起人才可编辑/设封面、成员才可上传照片、上传者或发起人才可删照片），客户端的按钮显隐只是体验层，改动时以云函数校验为准。
- **身份模型**：`bindClassmate` 将微信用户与 `classmates` 名册记录一对一绑定（`bound`/`boundOpenid`），已绑定记录不可重复绑定。
- **敏感数据**：`cloudfunctions/seedData/classmates.json` 含 111 条真实同学信息（姓名、电话、住址等），不要外泄或用于无关用途。
- `project.private.config.json` 视为本机配置，不要提交私有环境值或密钥。
- `.gitignore` 已忽略 `node_modules/`、`miniprogram_npm/`、云函数的 `node_modules/` 与 `package-lock.json`。
