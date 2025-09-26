/**
 * Response interface for successful supplier ID updates
 */
export interface UpdateSupplierSuccessResponse {
  success: true;
  data: {
    updatedCount: number;
    shopId: number;
    market: string;
    supplierId: number;
    [key: string]: any; // Allow additional fields from Whale API
  };
}

/**
 * Response interface for error responses
 */
export interface UpdateSupplierErrorResponse {
  error: string;
}

/**
 * Union type for all possible update supplier responses
 */
export type UpdateSupplierResponse =
  | UpdateSupplierSuccessResponse
  | UpdateSupplierErrorResponse;

/**
 * Type guard to check if response is a success response
 */
export function isSuccessResponse(
  response: UpdateSupplierResponse,
): response is UpdateSupplierSuccessResponse {
  return 'success' in response && response.success === true;
}

/**
 * Type guard to check if response is an error response
 */
export function isErrorResponse(
  response: UpdateSupplierResponse,
): response is UpdateSupplierErrorResponse {
  return 'error' in response;
}
