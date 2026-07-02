import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Shared article renderer. GFM adds tables, autolinks and strikethrough.
// Raw HTML is intentionally NOT enabled, so admin-authored content stays safe.
export default function Markdown({ children }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{children || ''}</ReactMarkdown>;
}
