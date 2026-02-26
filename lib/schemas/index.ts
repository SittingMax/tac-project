/**
 * WGS Portal - Zod Validation Schemas
 * Centralized exports for all validation schemas
 */

// Customer schemas
export {
  customerUpsertSchema,
  type CustomerUpsertInput,
  type CustomerRow,
  type CustomerFilters,
  defaultCustomerValues,
  customerRowToFormValues,
} from './customers.schema';

// Shipment schemas
export {
  createShipmentSchema,
  updateShipmentStatusSchema,
  shipmentFilterSchema,
  ShipmentStatus,
  packageDimensionsSchema,
  addressSchema,
  isValidAWB,
  isValidStatusTransition,
  VALID_STATUS_TRANSITIONS,
  AWB_PATTERN,
  type CreateShipmentInput,
  type UpdateShipmentStatusInput,
  type ShipmentFilterInput,
  type ShipmentStatusType,
} from './shipment.schema';

// Auth schemas
export {
  loginSchema,
  registerSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  updateProfileSchema,
  UserRole,
  hasPermission,
  canAccess,
  ROLE_HIERARCHY,
  type LoginInput,
  type RegisterInput,
  type PasswordResetRequestInput,
  type PasswordResetInput,
  type UpdateProfileInput,
  type UserRoleType,
} from './auth.schema';
