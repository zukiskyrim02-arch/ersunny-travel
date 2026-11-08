export function AdminPager({
  total,
  page,
  pageSize,
  pageCount,
  onPageChange,
  className = "",
}: {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (total === 0) return null;

  return (
    <div className={`admin-pager${className ? ` ${className}` : ""}`}>
      <span>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
      </span>
      <div>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
