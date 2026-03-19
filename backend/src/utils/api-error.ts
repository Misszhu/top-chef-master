import type { ErrorCode } from './api-response';

export class ApiError extends Error {
  status: number;
  code: ErrorCode;
  details?: Record<string, unknown>;

  constructor(status: number, code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

