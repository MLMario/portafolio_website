'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Helper function to generate heading IDs
  const generateId = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          h1({ children, ...props }) {
            const text = String(children)
            const id = generateId(text)
            return <h1 id={id} {...props}>{children}</h1>
          },
          h2({ children, ...props }) {
            const text = String(children)
            const id = generateId(text)
            return <h2 id={id} {...props}>{children}</h2>
          },
          h3({ children, ...props }) {
            const text = String(children)
            const id = generateId(text)
            return <h3 id={id} {...props}>{children}</h3>
          },
          h4({ children, ...props }) {
            const text = String(children)
            const id = generateId(text)
            return <h4 id={id} {...props}>{children}</h4>
          },
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const codeString = String(children).replace(/\n$/, '')

            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {codeString}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          img({ node, src, alt, ...props }) {
            return (
              <span className="block my-8">
                <img
                  src={src}
                  alt={alt || ''}
                  className="rounded-lg border"
                  loading="lazy"
                  {...props}
                />
                {alt && (
                  <span className="block mt-2 text-center text-sm text-muted-foreground">
                    {alt}
                  </span>
                )}
              </span>
            )
          },
          table({ children, ...props }) {
            return (
              <div className="my-6 overflow-x-auto">
                <table className="w-full" {...props}>
                  {children}
                </table>
              </div>
            )
          },
          a({ node, href, children, ...props }) {
            const isExternal = href?.startsWith('http')
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
