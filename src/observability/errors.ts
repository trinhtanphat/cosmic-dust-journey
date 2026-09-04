const safeClass = (value: string | undefined) => {
  if (value && /^[A-Za-z][A-Za-z0-9_.:-]{0,79}$/.test(value)) return value;
  return 'Error';
};

export function classifyRuntimeError(value: unknown): string {
  if (value instanceof Error) return safeClass(value.name || value.constructor?.name);
  if (value === null) return 'NullRejection';
  if (typeof value === 'string') return 'StringRejection';
  if (typeof value === 'number') return 'NumberRejection';
  if (typeof value === 'boolean') return 'BooleanRejection';
  if (typeof value === 'undefined') return 'UndefinedRejection';
  if (typeof value === 'symbol') return 'SymbolRejection';
  if (typeof value === 'bigint') return 'BigIntRejection';
  if (typeof value === 'function') return 'FunctionRejection';
  return 'ObjectRejection';
}
