// 空 PostCSS 配置:阻止 PostCSS 向上查找到父目录(NextClient 官网)的
// tailwind/postcss 配置,避免其泄漏进本项目的构建。
export default { plugins: {} };
