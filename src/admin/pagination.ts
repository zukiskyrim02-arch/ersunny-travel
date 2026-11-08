import { useMemo, useState } from "react";

export const ADMIN_PAGE_SIZE = 8;

export function usePagination<T>(items: readonly T[], pageSize = ADMIN_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  function resetPage() {
    setPage(1);
  }

  function goToIndex(index: number) {
    setPage(Math.floor(Math.max(0, index) / pageSize) + 1);
  }

  return {
    page: safePage,
    setPage,
    pageCount,
    pageSize,
    paged,
    total: items.length,
    resetPage,
    goToIndex,
  };
}
