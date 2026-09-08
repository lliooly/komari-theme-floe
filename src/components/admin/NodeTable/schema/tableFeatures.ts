import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createSortedRowModel,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";

/**
 * The features used by the admin node table.
 *
 * TanStack Table v9 only exposes optional table APIs when their feature and
 * row-model slots are registered explicitly.
 */
export const nodeTableFeatures = tableFeatures({
  columnFilteringFeature,
  rowSortingFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
});

export type NodeTableFeatures = typeof nodeTableFeatures;
