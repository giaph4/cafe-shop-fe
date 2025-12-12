/**
 * Number utility functions
 * DRY FIX: Consolidate toNumberOrNull và toKey functions từ các stores
 *
 * Usage:
 * import { toNumberOrNull } from '@/utils/numberUtils'
 * const id = toNumberOrNull(value)
 */

/**
 * Convert value to number or return null if invalid
 * DRY FIX: Shared utility để tránh duplicate code
 *
 * @param {any} value - Value to convert
 * @returns {number|null} - Number nếu valid, null nếu invalid
 */
export const toNumberOrNull = (value) => {
    if (value === null || value === undefined) return null
    const number = Number(value)
    return Number.isFinite(number) ? number : null
}

/**
 * Alias for toNumberOrNull (for backward compatibility)
 * DRY FIX: toKey và toNumberOrNull là cùng logic
 *
 * @param {any} value - Value to convert
 * @returns {number|null} - Number nếu valid, null nếu invalid
 */
export const toKey = toNumberOrNull

