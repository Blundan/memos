# CampusFound · 校园寻物

基于开源项目 [usememos/memos](https://github.com/usememos/memos)（MIT 许可）二次开发的**校园失物招领平台**。
单文件二进制 / 单容器即可运行，无需安装数据库，适合学生会、社团、班级在校园内网或一台旧电脑上自托管。

```
丢了东西 → 发「寻物启事」        捡到东西 → 发「失物招领」
              ↘               ↙
         按地点 / 状态 / 时间检索
                    ↓
             双方取得联系 → 标记「已寻回」
```

## 一键部署（三选一）

### 方式 A：Docker（推荐，服务器部署）

```bash
git clone https://github.com/<你的用户名>/memos.git campusfound
cd campusfound
docker compose -f deploy/docker-compose.yml up -d --build
```

启动后访问 `http://服务器IP:5230`，数据持久化在 `deploy/campus-data/`。

### 方式 B：一键脚本（个人电脑，无需命令行知识）

- **Windows**：在 PowerShell 中进入仓库目录，执行 `deploy\start-campus.ps1`
- **macOS / Linux**：`sh deploy/start-campus.sh`

脚本会自动下载已发布的二进制并启动（若未发布 Release，装有 Docker 时自动转为 Docker 构建启动）。
首次访问网页会引导创建管理员账号，全程零配置。

### 方式 C：源码构建

```bash
# 前端
cd web && pnpm i && pnpm release
# 后端（会把前端产物嵌入二进制）
cd .. && go build -o campusfound ./cmd/memos
MEMOS_DATA=./data ./campusfound
```

## 功能使用

| 功能 | 说明 |
| --- | --- |
| 双向发布 | 编辑器中点选「我丢了东西 / 我捡到了东西」标记物品状态，普通发布不带状态 |
| 地点 | 编辑器地点输入框直接填写楼栋/教室（如“图书馆3楼”），无需地图 |
| 匿名发布 | 可选匿名，其他同学只能看到“匿名同学”；管理员和本人仍可见真实身份（用于处理违规），脱敏在服务端完成 |
| 状态检索 | 列表上方的筛选栏：全部 / 寻物 / 招领 / 已寻回 |
| 地点检索 | 筛选栏地点搜索框输入关键词（如“图书馆”）回车 |
| 标记已寻回 | 找回后编辑该条动态，把状态改为「已寻回」 |
| 数据导出 | 筛选栏右侧「导出 CSV」，按当前筛选条件导出全部记录（UTF-8 带 BOM，Excel 直接打开），用于向学校汇报或成果展示 |

## 与原项目的边界（重要）

本项目遵守 MIT 协议，原项目版权归 [usememos](https://github.com/usememos) 及其贡献者所有。以下是明确的边界清单：

**来自原项目（未改动或仅轻微改动）**：Go 后端框架与 gRPC/Connect API、React 前端框架、SQLite 存储层、用户/权限系统、附件、评论、标签、Markdown 编辑器、多语言、主题系统等全部基础设施。

**本项目新增（CampusFound 部分）**：

| 层 | 内容 |
| --- | --- |
| proto | `MemoPayload.item_status`、`MemoPayload.is_anonymous` 字段（`proto/store/memo.proto`、`proto/api/v1/memo_service.proto`） |
| 后端 | 创建/更新链路的状态校验与匿名脱敏（`server/api/v1/memo_create_helpers.go` 等）；筛选引擎新增 `item_status`、`location` 字段与 `FieldKindJSONString` 渲染器（`filter/`）；单元测试 `filter/campus_test.go` |
| 前端 | `web/src/components/CampusFound/`（编辑器控件、卡片徽章、筛选栏、CSV 导出）及对编辑器/卡片/列表的挂载改动；`campus.*` 中英文词条 |
| 部署 | `deploy/`（Dockerfile、docker-compose、一键启动脚本） |
| 文档 | 本文件 |

两条 commit 记录即全部增量：`feat(campus): add lost-and-found item status...`（后端）与 `feat(campus): composer fields, card badges...`（前端）。

## 管理员建议

- 在「实例设置」中将注册模式设为**关闭**或**邀请码**，防止校外人员注册；
- 定期导出 CSV 归档（导出按钮即汇报材料）；
- 匿名发布的服务端豁免仅限实例管理员，请谨慎分配管理员角色。

## 致谢

- [usememos/memos](https://github.com/usememos/memos) — MIT License
