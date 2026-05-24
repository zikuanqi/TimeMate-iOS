# TimeMate iOS

时间管理 App，基于 Expo (React Native) 构建，适配 iOS 平台。

## 功能

- **日历周视图** - 时间块 CRUD，按小时展示每日安排
- **任务管理** - 任务创建、优先级/状态筛选、进度追踪
- **番茄钟** - SVG 倒计时环、中断标记、每日统计
- **分析仪表盘** - 专注时长柱状图、任务分布、高效时段热力图
- **AI 对话** - 多会话管理、AI 时间规划助手

## 技术栈

- Expo ~52 / React Native 0.76
- TypeScript
- React Navigation 7 (Bottom Tabs)
- Zustand 状态管理
- react-native-svg
- FastAPI 后端（独立部署）

## 启动

```bash
npm install
npx expo start
```

按 `i` 在 iOS 模拟器中打开，或扫描二维码在真机上运行。

## 后端

后端 API 内置于 `backend/` 目录，使用 FastAPI + SQLite：

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

启动后访问 http://localhost:8000/docs 查看 API 文档。
API 基地址：`http://localhost:8000/api`

## 环境变量

复制 `.env.example` 为 `.env`，配置生产环境 API 地址：

```bash
cp .env.example .env
# 编辑 .env，将 EXPO_PUBLIC_API_URL 改为线上地址
```

## 发布到 App Store

### 1. 安装 EAS CLI

```bash
npm install -g eas-cli
eas login
```

### 2. 编辑 `eas.json`

将 `submit.production.ios` 中的：
- `appleId` → 你的 Apple ID 邮箱
- `ascAppId` → App Store Connect 中的 App ID
- `appleTeamId` → 开发者团队 ID

### 3. 构建并提交

```bash
# 构建生产 IPA
eas build --platform ios --profile production

# 构建 + 自动提交至 App Store Connect
eas submit --platform ios --profile production
```

### 发布前检查清单

| 检查项 | 文件/位置 |
|------|----------|
| 应用图标 | `assets/icon.png`（1024x1024） |
| 启动屏 | `assets/splash.png` |
| 环境变量 | `.env` → `EXPO_PUBLIC_API_URL` |
| 隐私政策 | `app.json` → `ios.privacyPolicyUrl` |
| 联系方式 | `app.json` → `ios.supportUrl` |
| Bundle ID | `app.json` → `ios.bundleIdentifier` |
| Apple ID | `eas.json` → `submit.production.ios` |