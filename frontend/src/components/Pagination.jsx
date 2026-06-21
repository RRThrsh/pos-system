const PAGE_SIZE = 20

function Pagination({ items, currentPage, onPageChange, page, totalPages: explicitTotalPages }) {
  const curPage = currentPage ?? page ?? 1
  const totalPages = explicitTotalPages ?? (items ? Math.ceil(items.length / PAGE_SIZE) : 0)
  if (totalPages <= 1) return null

  const start = items ? (curPage - 1) * PAGE_SIZE + 1 : 0
  const end = items ? Math.min(curPage * PAGE_SIZE, items.length) : 0

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= curPage - 1 && i <= curPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 text-sm">
      <span className="text-gray-500">
        {items ? `Showing ${start} to ${end} of ${items.length} entries` : `Page ${curPage} of ${totalPages}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={curPage === 1}
          onClick={() => onPageChange(curPage - 1)}
          className="px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1.5 rounded border text-sm font-medium transition-colors ${
                curPage === p
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          disabled={curPage === totalPages}
          onClick={() => onPageChange(curPage + 1)}
          className="px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export { PAGE_SIZE }
export default Pagination
