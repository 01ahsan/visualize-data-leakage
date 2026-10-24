export type Matrix = number[][];

/** Items at the given indices (rows are shared references, not copies). */
export function takeRows<T>(rows: readonly T[], idx: readonly number[]): T[] {
  return idx.map((i) => rows[i]);
}

/** Rows `idx` of a column-major matrix, restricted to columns `cols`. */
export function rowsFromColumns(
  columns: readonly ArrayLike<number>[],
  idx: readonly number[],
  cols: readonly number[],
): Matrix {
  return idx.map((i) => cols.map((j) => columns[j][i]));
}
