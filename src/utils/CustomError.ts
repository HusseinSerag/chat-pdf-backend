export class CustomError extends Error {
  code: number;
  constructor(m: string, c: number) {
    super(m);
    this.code = c;
  }
}
