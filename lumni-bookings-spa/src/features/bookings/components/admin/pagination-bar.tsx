const MAX_PAGE_BUTTONS = 5

/** Up to five page numbers around the current page, kept within 1..totalPages. */
function visiblePages(page: number, totalPages: number): number[] {
  const first = Math.max(
    1,
    Math.min(
      page - Math.floor(MAX_PAGE_BUTTONS / 2),
      totalPages - MAX_PAGE_BUTTONS + 1,
    ),
  )
  const last = Math.min(totalPages, first + MAX_PAGE_BUTTONS - 1)
  return Array.from({ length: last - first + 1 }, (_, index) => first + index)
}

const STEP_CLASS =
  'min-h-11 rounded-[10px] border border-line-strong bg-white px-3.5 text-sm text-ink disabled:cursor-not-allowed disabled:border-line disabled:text-line-strong'

interface PaginationBarProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: PaginationBarProps) {
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="m-0 text-sm text-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={STEP_CLASS}
        >
          Previous
        </button>
        {visiblePages(page, totalPages).map((number) =>
          number === page ? (
            <button
              key={number}
              type="button"
              aria-current="page"
              aria-label={`Page ${number}`}
              className="min-h-11 min-w-11 rounded-[10px] bg-ink text-sm font-bold text-white"
            >
              {number}
            </button>
          ) : (
            <button
              key={number}
              type="button"
              aria-label={`Page ${number}`}
              onClick={() => onPageChange(number)}
              className="min-h-11 min-w-11 rounded-[10px] border border-line-strong bg-white text-sm text-ink hover:bg-canvas"
            >
              {number}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={STEP_CLASS}
        >
          Next
        </button>
      </div>
    </nav>
  )
}
