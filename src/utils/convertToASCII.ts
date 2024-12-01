export function convertToAscii(input: string) {
  // remove non ascii
  const ascii = input.replace(/[^\x00-\x7F]+/g, "");
  return ascii;
}
