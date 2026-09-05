export function bdt(amount: number): string {
  return `৳${amount.toLocaleString("en-US")}`;
}

export const DELIVERY_INSIDE_DHAKA = 80;
export const DELIVERY_OUTSIDE_DHAKA = 150;

export function deliveryFee(district: string): number {
  return district === "Dhaka" ? DELIVERY_INSIDE_DHAKA : DELIVERY_OUTSIDE_DHAKA;
}
