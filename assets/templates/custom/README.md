# 用户自定义模板目录

在此目录下的每个子文件夹代表一个自定义模板。

## 最小文件结构

```
my-template/
├── metadata.json     # 模板元数据 + 数据 schema（必需）
├── skeleton.html     # HTML 骨架（可选，可用默认渲染器）
└── theme.css         # 自定义主题 CSS（可选）
```

## metadata.json 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 模板显示名称 |
| layout.type | string | float / flex / grid / absolute |
| layout.columns | int | 列数（1-4） |
| data_schema | object | 定义需要的数据字段 |
| theme | object | preset 深色/浅色色板 |
| dependencies | object | 需要的 JS/CSS 库 |

参考 `metadata.example.json` 查看完整示例。

## 工作流程

1. 在此目录下创建 `my-template/` 文件夹
2. 编写 `metadata.json` 描述模板布局和数据需求
3. 可选：放入 `skeleton.html` 自定义 HTML 结构
4. 可选：放入 `theme.css` 自定义主题
5. 调用 `build_dashboard.py --template "my-template" --source-dir custom` 构建

## 提示

- 如不提供 skeleton.html，将使用默认 renderer 引擎，按 metadata.json 中的 layout 配置动态生成布局
- 数据通过 `window.DASHBOARD_DATA` 全局变量注入
- 图表使用 `echarts.init` + `DASHBOARD_DATA.charts[id].data` 绑定数据
