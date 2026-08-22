export const MAX_VAULT_FIELD_BYTES = 512 * 1024; // 512KB

const encoder = new TextEncoder();

export function exceedsByteLimit(value: string, maxBytes: number): boolean {
  return encoder.encode(value).length > maxBytes;
}
