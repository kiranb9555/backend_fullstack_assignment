export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(
    message: string,
    statusCode = 500,
    code = "ND_5000"
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}