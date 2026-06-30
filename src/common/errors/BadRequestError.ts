import { AppError } from "./AppError.js";

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, 400, "ND_4000");
  }
}