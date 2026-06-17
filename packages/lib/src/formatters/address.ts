type AddressLike = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

export function formatAddress(a: AddressLike): string {
  const line1 = [a.addressLine1, a.addressLine2].filter(Boolean).join(", ");
  const cityStateZip = [a.city, a.state].filter(Boolean).join(", ") + (a.zipCode ? ` ${a.zipCode}` : "");
  return [line1, cityStateZip].filter((s) => s.trim().length > 0).join(" • ");
}
