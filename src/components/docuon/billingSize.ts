const decimal = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });

export function billingSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1_048_576) return decimal.format(bytes / 1024) + ' KiB';
  return decimal.format(bytes / 1_048_576) + ' MiB';
}
