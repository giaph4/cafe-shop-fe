/**
 * Conversation utility functions
 * MAINTAINABILITY FIX: Tách logic phức tạp ra khỏi store để dễ test và maintain
 */

/**
 * Compare two conversations for sorting
 * DOCUMENTATION FIX: Thêm chi tiết algorithm và examples
 * MAINTAINABILITY FIX: Tách logic compare ra khỏi store
 *
 * Algorithm:
 * 1. Pinned conversations luôn được ưu tiên (hiển thị đầu tiên)
 * 2. Nếu cả hai đều pinned hoặc không pinned, sort theo updatedAt (mới nhất trước)
 * 3. Nếu không có updatedAt, coi như timestamp = 0 (sẽ ở cuối)
 *
 * Sorting order:
 * - Pinned conversations (newest first)
 * - Unpinned conversations (newest first)
 *
 * @param {Object} a - First conversation object
 * @param {Object} b - Second conversation object
 * @param {boolean} [a.pinned] - Whether first conversation is pinned
 * @param {boolean} [b.pinned] - Whether second conversation is pinned
 * @param {string|Date} [a.updatedAt] - Last update time of first conversation
 * @param {string|Date} [b.updatedAt] - Last update time of second conversation
 * @returns {number} - Comparison result:
 *   - Negative number: a should come before b
 *   - Positive number: a should come after b
 *   - 0: a and b are equal in sort order
 *
 * @example
 * const conv1 = { id: 1, pinned: true, updatedAt: '2024-01-15T10:00:00Z' }
 * const conv2 = { id: 2, pinned: false, updatedAt: '2024-01-20T10:00:00Z' }
 * const conv3 = { id: 3, pinned: true, updatedAt: '2024-01-10T10:00:00Z' }
 *
 * compareConversations(conv1, conv2) // -1 (pinned comes first)
 * compareConversations(conv2, conv1) // 1 (unpinned comes after pinned)
 * compareConversations(conv1, conv3) // -1 (both pinned, newer first)
 *
 * // Sort array
 * [conv1, conv2, conv3].sort(compareConversations)
 * // Result: [conv1, conv3, conv2] (pinned first, then by date)
 */
export const compareConversations = (a, b) => {
    // Step 1: Pinned conversations first
    // Nếu a pinned và b không pinned -> a trước b
    if (a?.pinned && !b?.pinned) return -1
    // Nếu a không pinned và b pinned -> b trước a
    if (!a?.pinned && b?.pinned) return 1

    // Step 2: Sort by updatedAt (newest first)
    // Parse updatedAt thành timestamp, default = 0 nếu không có
    const aTime = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const bTime = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0
    // Return bTime - aTime để sort descending (newest first)
    return bTime - aTime
}

/**
 * Sort conversations array using compareConversations algorithm
 * DOCUMENTATION FIX: Thêm chi tiết và examples
 *
 * Note: This function mutates the input array (sorts in place)
 * Nếu muốn immutable sort, sử dụng: [...conversations].sort(compareConversations)
 *
 * @param {Array<Object>} conversations - Array of conversation objects to sort
 * @returns {Array<Object>} - Sorted array (same reference as input)
 *
 * @example
 * const conversations = [
 *   { id: 1, pinned: false, updatedAt: '2024-01-15T10:00:00Z' },
 *   { id: 2, pinned: true, updatedAt: '2024-01-20T10:00:00Z' },
 *   { id: 3, pinned: false, updatedAt: '2024-01-10T10:00:00Z' }
 * ]
 *
 * const sorted = sortConversations(conversations)
 * // Result: [
 * //   { id: 2, pinned: true, ... },  // Pinned first
 * //   { id: 1, pinned: false, ... }, // Then by date (newest)
 * //   { id: 3, pinned: false, ... }
 * // ]
 * // Note: sorted === conversations (same reference)
 */
export const sortConversations = (conversations) => {
    if (!Array.isArray(conversations)) return conversations
    return conversations.sort(compareConversations)
}

