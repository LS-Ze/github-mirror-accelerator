# GitHub Mirror Accelerator

一个基于Cloudflare Pages的GitHub镜像加速项目，提供友好的用户界面和高效的代理服务。

## 功能特点

- ✅ 支持GitHub文件、Release、Raw内容加速
- ✅ 简洁美观的用户界面
- ✅ 实时转换GitHub链接为加速链接
- ✅ 支持批量转换多个链接
- ✅ 自动识别GitHub链接格式
- ✅ 响应式设计，支持移动端
- ✅ 完整的CORS支持

## 部署方法

### 1. Fork仓库

点击右上角的"Fork"按钮将此仓库复制到您的GitHub账户。

### 2. 部署到Cloudflare Pages

1. 登录Cloudflare控制台
2. 进入 **Workers & Pages**
3. 点击 **创建应用程序** > **Pages**
4. 选择 **连接到Git**
5. 选择您Fork的仓库
6. 配置构建设置：
   - 生产分支：`main`
   - 构建命令：`exit 0`
   - 构建目录：`.`

### 3. 访问您的加速服务

部署完成后，您可以通过以下方式访问：
- 默认域名：`https://your-project-name.pages.dev`
- 自定义域名（可选）：配置您自己的域名

## 使用方法

### 基本使用

1. 在输入框中粘贴GitHub链接
2. 点击"加速转换"按钮
3. 复制生成的加速链接

### 支持的链接类型

- GitHub文件：`https://github.com/user/repo/blob/branch/file`
- GitHub Release：`https://github.com/user/repo/releases/download/tag/file`
- GitHub Raw：`https://raw.githubusercontent.com/user/repo/branch/file`
- GitHub Archive：`https://github.com/user/repo/archive/branch.zip`

## 技术架构

### 前端技术栈

- HTML5 + CSS3
- Tailwind CSS v3
- Font Awesome 图标
- JavaScript (ES6+)

### 后端技术栈

- Cloudflare Pages Functions
- Service Worker API
- Fetch API

### 性能优化

- 边缘网络部署，全球访问速度快
- 智能缓存策略
- 异步请求处理
- 资源压缩和优化

## 配置选项

### 环境变量（可选）

您可以在Cloudflare Pages设置中配置以下环境变量：

- `CACHE_MAX_AGE` - 缓存最大时间（默认：86400秒）
- `RATE_LIMIT` - 速率限制（默认：100次/分钟）
- `ALLOWED_ORIGINS` - 允许的跨域来源（默认：*）

## 开发指南

### 本地开发

1. 克隆仓库：`git clone https://github.com/your-username/github-mirror-accelerator.git`
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run dev`
4. 访问：`http://localhost:8787`

### 构建部署

```bash
# 构建生产版本
npm run build

# 本地预览
npm run preview
```

## 常见问题

### Q: 加速服务支持哪些文件类型？
A: 支持所有GitHub上的文件类型，包括代码文件、二进制文件、压缩包等。

### Q: 有使用限制吗？
A: 基于Cloudflare Pages的限制，免费计划每天支持10万次请求。

### Q: 可以用于商业用途吗？
A: 可以，但请遵守GitHub的使用条款和Cloudflare的服务条款。

### Q: 如何自定义界面？
A: 您可以修改`index.html`和`assets/css/style.css`来自定义界面样式。

## 贡献指南

1. Fork本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交Pull Request

## 许可证

本项目采用MIT许可证，详情请见LICENSE文件。

## 免责声明

本项目仅用于学习和研究目的，请勿用于非法用途。使用本服务即表示您同意遵守GitHub的使用条款和相关法律法规。