import { useState } from "react";

interface UseServiceSelectionReturn {
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  toggleSelectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isAllSelected: (ids: string[]) => boolean;
}

export function useServiceSelection(): UseServiceSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (ids: string[]) => {
    setSelectedIds((prev) =>
      prev.length === ids.length ? [] : ids
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const isAllSelected = (ids: string[]) => {
    return selectedIds.length === ids.length && ids.length > 0;
  };

  return {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
  };
}
