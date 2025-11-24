/**
 * Role Constants
 * Tất cả constants liên quan đến roles được tập trung tại đây
 */

/**
 * Role values
 */
export const ROLES = Object.freeze({
    ADMIN: 'ROLE_ADMIN',
    MANAGER: 'ROLE_MANAGER',
    STAFF: 'ROLE_STAFF'
})

/**
 * Role display names
 */
export const ROLE_NAMES = Object.freeze({
    [ROLES.ADMIN]: 'Quản trị viên',
    [ROLES.MANAGER]: 'Quản lý',
    [ROLES.STAFF]: 'Nhân viên'
})

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS = Object.freeze({
    [ROLES.ADMIN]: 'Quyền quản trị viên - Toàn quyền truy cập hệ thống',
    [ROLES.MANAGER]: 'Quyền quản lý - Quản lý nhân viên và ca làm việc',
    [ROLES.STAFF]: 'Quyền nhân viên - Thực hiện đơn hàng và chấm công'
})

/**
 * Check if user has required role
 * @param {string[]} userRoles - User roles
 * @param {string|string[]} requiredRoles - Required role(s)
 * @returns {boolean} True if user has required role
 */
export const hasRole = (userRoles, requiredRoles) => {
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
        return false
    }
    
    const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    
    return required.some(role => userRoles.includes(role))
}

/**
 * Check if user has any of the required roles
 * @param {string[]} userRoles - User roles
 * @param {string[]} requiredRoles - Required roles
 * @returns {boolean} True if user has at least one required role
 */
export const hasAnyRole = (userRoles, requiredRoles) => {
    return hasRole(userRoles, requiredRoles)
}

/**
 * Check if user has all required roles
 * @param {string[]} userRoles - User roles
 * @param {string[]} requiredRoles - Required roles
 * @returns {boolean} True if user has all required roles
 */
export const hasAllRoles = (userRoles, requiredRoles) => {
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
        return false
    }
    
    if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
        return false
    }
    
    return requiredRoles.every(role => userRoles.includes(role))
}

/**
 * Get role display name
 * @param {string} role - Role value
 * @returns {string} Role display name
 */
export const getRoleName = (role) => {
    return ROLE_NAMES[role] || role
}

/**
 * Get role description
 * @param {string} role - Role value
 * @returns {string} Role description
 */
export const getRoleDescription = (role) => {
    return ROLE_DESCRIPTIONS[role] || ''
}

/**
 * Get all available roles
 * @returns {string[]} Array of all role values
 */
export const getAllRoles = () => {
    return Object.values(ROLES)
}

/**
 * Get roles for select/dropdown
 * @returns {Array<{value: string, label: string, description: string}>} Roles for select
 */
export const getRolesForSelect = () => {
    return Object.values(ROLES).map(role => ({
        value: role,
        label: getRoleName(role),
        description: getRoleDescription(role)
    }))
}

