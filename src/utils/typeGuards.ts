export type RawChart = {
  title: string;
  data: Array<[number, number | null | Array<number | null>]>;
};

export function isMultiSeries(
  entry: RawChart
): entry is { title: string; data: Array<[number, Array<number | null>]> } {
  return entry.data.some(([, value]) => Array.isArray(value));
}
