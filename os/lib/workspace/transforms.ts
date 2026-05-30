export function identity(value: unknown): unknown {
  return value;
}

export const graphTransforms: Record<string, (value: unknown) => unknown> = {
  identity,
};

export function applyGraphTransform(name: string | undefined, value: unknown): unknown {
  if (!name) return value;
  return (graphTransforms[name] ?? identity)(value);
}
