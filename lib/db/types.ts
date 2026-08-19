export type SqlParam = string | number | null;

export type BoutiqueDatabase = {
  execAsync(source: string): Promise<void>;
  runAsync(
    source: string,
    ...params: Array<SqlParam | SqlParam[]>
  ): Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync<T>(source: string, ...params: Array<SqlParam | SqlParam[]>): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: Array<SqlParam | SqlParam[]>): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
};

export function normalizeSqlParams(params: Array<SqlParam | SqlParam[]>): SqlParam[] {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params as SqlParam[];
}
