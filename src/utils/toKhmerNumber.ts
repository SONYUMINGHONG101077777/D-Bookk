const KHMER_DIGITS = ["០","១","២","៣","៤","៥","៦","៧","៨","៩"];
export function toKhmerNumber(input: number | string): string {
  const s = String(input);
  let out = "";
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") {
      out += KHMER_DIGITS[ch.charCodeAt(0) - 48];
    } else {
      out += ch;
    }
  }
  return out;
}