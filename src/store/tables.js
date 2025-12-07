import { defineStore } from 'pinia'
import { ref, computed, shallowReactive } from 'vue'
import { getTables, getTableById, updateTableStatus } from '@/api/tableService'
import { useTableEvents } from '@/composables/useWebSocketEvents'
import logger from '@/utils/logger'

/**
 * Pinia store để quản lý table state và real-time updates
 * Store này cung cấp:
 * - Danh sách tables với caching
 * - Real-time updates qua WebSocket khi table status thay đổi
 * - Methods để update table status
 */
export const useTableStore = defineStore('tables', () => {
    // State
    const tables = ref([])
    const loading = ref(false)
    const error = ref(null)
    const lastUpdated = ref(null)
    
    // WebSocket connection state
    const wsConnected = ref(false)
    const wsConnecting = ref(false)
    const wsError = ref(null)
    const lastTableEvent = ref(null)

    // Table lookup map for quick access by ID
    const tablesMap = computed(() => {
        const map = new Map()
        tables.value.forEach(table => {
            if (table?.id) {
                map.set(table.id, table)
            }
        })
        return map
    })

    // Computed: Get table by ID
    const getTableById = (id) => {
        return tablesMap.value.get(id) || null
    }

    // Computed: Get tables by status
    const getTablesByStatus = (status) => {
        return tables.value.filter(table => table?.status === status)
    }

    // Computed: Get available tables (EMPTY or AVAILABLE)
    const availableTables = computed(() => {
        return tables.value.filter(table => 
            table?.status === 'EMPTY' || table?.status === 'AVAILABLE'
        )
    })

    // Computed: Get serving tables
    const servingTables = computed(() => {
        return tables.value.filter(table => table?.status === 'SERVING')
    })

    // Computed: Get reserved tables
    const reservedTables = computed(() => {
        return tables.value.filter(table => table?.status === 'RESERVED')
    })

    /**
     * Load tables from API
     * @param {boolean} force - Force reload even if data exists
     */
    const loadTables = async (force = false) => {
        if (loading.value && !force) return
        
        // If we have recent data and not forcing, skip
        if (!force && tables.value.length > 0 && lastUpdated.value) {
            const age = Date.now() - lastUpdated.value
            if (age < 30000) { // 30 seconds cache
                return
            }
        }

        loading.value = true
        error.value = null

        try {
            const data = await getTables()
            const tablesArray = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : [])
            tables.value = tablesArray
            lastUpdated.value = Date.now()
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Không thể tải danh sách bàn.'
            logger.error('Failed to load tables:', err)
        } finally {
            loading.value = false
        }
    }

    /**
     * Update table status
     * @param {number} tableId - Table ID
     * @param {string} status - New status
     */
    const updateStatus = async (tableId, status) => {
        if (!tableId || !status) {
            throw new Error('Table ID and status are required')
        }

        try {
            const updatedTable = await updateTableStatus({ id: tableId, status })
            
            // Update local state
            const index = tables.value.findIndex(t => t.id === tableId)
            if (index !== -1) {
                tables.value[index] = { ...tables.value[index], ...updatedTable }
            } else {
                // If table not in list, add it
                tables.value.push(updatedTable)
            }
            
            lastUpdated.value = Date.now()
            return updatedTable
        } catch (err) {
            logger.error('Failed to update table status:', err)
            throw err
        }
    }

    /**
     * Handle WebSocket event for table status update
     * @param {Object} payload - Event payload from WebSocket
     */
    const handleTableEvent = (payload) => {
        if (!payload) return

        const eventType = payload.eventType || payload.type
        const tableData = payload.table || payload.data

        if (!tableData || !tableData.id) {
            logger.warn('Invalid table event payload:', payload)
            return
        }

        lastTableEvent.value = payload

        switch (eventType) {
            case 'TABLE_STATUS_UPDATED':
            case 'TABLE_UPDATED':
                // Update table in local state
                const index = tables.value.findIndex(t => t.id === tableData.id)
                if (index !== -1) {
                    tables.value[index] = { ...tables.value[index], ...tableData }
                } else {
                    // If table not in list, add it
                    tables.value.push(tableData)
                }
                lastUpdated.value = Date.now()
                break

            case 'TABLE_CREATED':
                // Add new table if not exists
                if (!tables.value.find(t => t.id === tableData.id)) {
                    tables.value.push(tableData)
                    lastUpdated.value = Date.now()
                }
                break

            case 'TABLE_DELETED':
                // Remove table from list
                const deleteIndex = tables.value.findIndex(t => t.id === tableData.id)
                if (deleteIndex !== -1) {
                    tables.value.splice(deleteIndex, 1)
                    lastUpdated.value = Date.now()
                }
                break

            default:
                logger.warn('Unknown table event type:', eventType)
        }
    }

    // WebSocket connection management
    const {
        connected: wsConnectedRef,
        connecting: wsConnectingRef,
        lastError: wsErrorRef,
        connect: wsConnect,
        disconnect: wsDisconnect,
        ensureConnected: wsEnsureConnected
    } = useTableEvents(handleTableEvent)

    // Sync WebSocket state
    const syncWsState = () => {
        wsConnected.value = wsConnectedRef.value
        wsConnecting.value = wsConnectingRef.value
        wsError.value = wsErrorRef.value
    }

    // Watch WebSocket state changes (using watch from vue)
    // Note: We'll sync manually on connect/disconnect calls instead of using watch
    // to avoid circular dependency issues

    /**
     * Connect to WebSocket for real-time updates
     */
    const connectWebSocket = () => {
        wsEnsureConnected()
        // Sync state after a short delay to allow connection to establish
        setTimeout(syncWsState, 100)
    }

    /**
     * Disconnect from WebSocket
     */
    const disconnectWebSocket = () => {
        wsDisconnect()
        syncWsState()
    }

    // Periodically sync WebSocket state (every 1 second)
    let syncInterval = null
    const startSyncInterval = () => {
        if (syncInterval) return
        syncInterval = setInterval(syncWsState, 1000)
    }
    const stopSyncInterval = () => {
        if (syncInterval) {
            clearInterval(syncInterval)
            syncInterval = null
        }
    }

    // Start sync interval when store is created
    startSyncInterval()

    /**
     * Clear all state
     */
    const clear = () => {
        stopSyncInterval()
        tables.value = []
        loading.value = false
        error.value = null
        lastUpdated.value = null
        disconnectWebSocket()
    }

    return {
        // State
        tables,
        loading,
        error,
        lastUpdated,
        wsConnected,
        wsConnecting,
        wsError,
        lastTableEvent,

        // Computed
        tablesMap,
        availableTables,
        servingTables,
        reservedTables,

        // Methods
        getTableById,
        getTablesByStatus,
        loadTables,
        updateStatus,
        connectWebSocket,
        disconnectWebSocket,
        clear
    }
})

