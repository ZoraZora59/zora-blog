// 轻量 XSS 过滤：对评论内容中的 HTML 特殊字符进行转义，
// 避免访客通过 <script> / 事件属性等写入可执行代码。
const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char] ?? char);
}

// 轻量邮箱格式校验：覆盖大多数 RFC 5322 合法地址，不引入额外依赖。
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value);
}
