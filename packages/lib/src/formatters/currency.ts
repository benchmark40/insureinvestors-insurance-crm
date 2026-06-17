const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "--";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "--";
  return usd.format(n);
}
