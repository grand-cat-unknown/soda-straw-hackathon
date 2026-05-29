import { ApiError } from "./http.js";

export function assertObject(value, label = "body") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "invalid_request", `Request ${label} must be an object.`);
  }
}

export function optionalNumber(value, fallback, field) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new ApiError(400, "invalid_field", `${field} must be a number.`);
  }

  return number;
}

export function optionalString(value, fallback, field) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, "invalid_field", `${field} must be a string.`);
  }

  return value;
}

export function optionalStringArray(value, fallback, field) {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ApiError(400, "invalid_field", `${field} must be an array of strings.`);
  }

  return value;
}
