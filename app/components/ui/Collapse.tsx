// <Collapse title={summary} content={data} className="stat" />
export const Collapse = ({
  title,
  content,
  className = '',
}: {
  title?: string
  content: object | string
  className?: string
}) => {
  const summary = title || 'Data'
  const data = typeof content === 'object' ? JSON.stringify(content, null, 2) : content
  return (
    <div className={`mx-auto my-3 ${className}`}>
      <details className='collapse collapse-arrow min-w-72 max-w-72 sm:max-w-100 lg:max-w-136 border border-neutral bg-base-200'>
        <summary className='collapse-title text-accent break-words'>{summary}</summary>
        <pre className='collapse-content rounded-box min-w-68 max-w-68 sm:max-w-96 lg:max-w-132 m-1 bg-neutral text-xs text-success text-left overflow-x-auto'>
          <code>{data}</code>
        </pre>
      </details>
    </div>
  )
}
