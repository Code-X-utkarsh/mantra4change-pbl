import { NextResponse } from 'next/server';

/**
 * Creates a standard JSON success response.
 * @param data The payload to return.
 * @param status HTTP status code (default: 200).
 */
export function successResponse(data: object, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Creates a standard JSON error response.
 * @param message The error message to return.
 * @param status HTTP status code (default: 400).
 */
export function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}
