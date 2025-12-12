/**
 * Shared Validation Utilities
 * Chuẩn hóa validation patterns cho toàn bộ ứng dụng
 */

import * as yup from 'yup'

/**
 * Vietnamese phone number regex pattern
 */
export const PHONE_REGEX = /^(\+?84|0)\d{9}$/

/**
 * Email regex pattern
 */
export const EMAIL_REGEX = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/

/**
 * Validate Vietnamese phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const validatePhone = (phone) => {
    if (!phone) return false
    return PHONE_REGEX.test(phone.trim())
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
    if (!email) return false
    return EMAIL_REGEX.test(email.trim())
}

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is not empty
 */
export const validateRequired = (value) => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    return true
}

/**
 * Yup schema for Vietnamese phone number
 */
export const phoneSchema = yup
    .string()
    .trim()
    .required('Số điện thoại là bắt buộc.')
    .matches(PHONE_REGEX, 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại 10 số, bắt đầu bằng 0 hoặc +84.')

/**
 * Yup schema for email (optional)
 */
export const emailSchema = yup
    .string()
    .trim()
    .nullable()
    .transform((value) => (value === '' ? null : value))
    .email('Email không hợp lệ.')
    .max(120, 'Email tối đa 120 ký tự.')

/**
 * Yup schema for required string
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Field name for error message
 * @returns {yup.StringSchema}
 */
export const requiredStringSchema = (maxLength = 255, fieldName = 'Trường này') => yup
    .string()
    .trim()
    .required(`${fieldName} là bắt buộc.`)
    .max(maxLength, `${fieldName} tối đa ${maxLength} ký tự.`)

/**
 * Yup schema for optional string
 * @param {number} maxLength - Maximum length
 * @returns {yup.StringSchema}
 */
export const optionalStringSchema = (maxLength = 255) => yup
    .string()
    .trim()
    .nullable()
    .transform((value) => (value === '' ? null : value))
    .max(maxLength, `Tối đa ${maxLength} ký tự.`)

/**
 * Yup schema for positive number
 * @param {string} fieldName - Field name for error message
 * @returns {yup.NumberSchema}
 */
export const positiveNumberSchema = (fieldName = 'Giá trị') => yup
    .number()
    .typeError(`${fieldName} phải là số.`)
    .positive(`${fieldName} phải lớn hơn 0.`)
    .required(`${fieldName} là bắt buộc.`)

