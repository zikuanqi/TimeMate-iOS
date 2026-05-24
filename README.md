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

后端 API 使用 FastAPI + SQLite，见仓库 [TimeMate](https://github.com/zikuanqi/TimeMate) 中的 `backend/` 目录。

启动后端：

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

默认 API 地址：`http://localhost:8000/api`