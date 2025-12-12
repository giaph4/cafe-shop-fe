import { defineStore } from 'pinia'
import { computed, ref, shallowReactive } from 'vue'
import {
    endCurrentShiftSession,
    forceEndShiftSession,
    getCurrentShiftSession,
    listActiveSessionsByWorkShift,
    normalizeShiftSession,
    normalizeShiftSessionList,
    shiftSessionEvents,
    startShiftSession
} from '@/api/shiftSessionService'
import { useShiftSessionEvents } from '@/composables/useShiftSessionEvents'

const toKey = (value) => {
    if (value === null || value === undefined) return null
    const number = Number(value)
    return Number.isFinite(number) ? number : null
}

export const useShiftSessionStore = defineStore('shiftSession', () => {
    const currentSession = ref(null)
    const currentLoading = ref(false)
    const currentError = ref(null)

    const startSubmitting = ref(false)
    const endSubmitting = ref(false)
    const lastActionError = ref(null)

    const forceSubmitting = shallowReactive(new Map())
    const forceErrors = shallowReactive(new Map())

    const activeSessions = shallowReactive(new Map())
    const activeLoading = shallowReactive(new Map())
    const activeErrors = shallowReactive(new Map())

    const lastEvent = ref(null)

    const setCurrentSession = (payload) => {
        currentSession.value = payload ? { ...payload } : null
    }

    const setForceSubmitting = (sessionId, value) => {
        const key = toKey(sessionId)
        if (key === null) return
        forceSubmitting.set(key, Boolean(value))
    }

    const setForceError = (sessionId, error) => {
        const key = toKey(sessionId)
        if (key === null) return
        if (error) {
            forceErrors.set(key, error)
        } else {
            forceErrors.delete(key)
        }
    }

    const getActiveSessions = (workShiftId) => {
        const key = toKey(workShiftId)
        return key === null ? [] : (activeSessions.get(key) || [])
    }

    const isActiveLoading = (workShiftId) => {
        const key = toKey(workShiftId)
        return key !== null && Boolean(activeLoading.get(key))
    }

    const getActiveError = (workShiftId) => {
        const key = toKey(workShiftId)
        return key === null ? null : activeErrors.get(key) || null
    }

    const upsertActiveSession = (session) => {
        if (!session?.id || !session?.workShiftId) return
        const key = toKey(session.workShiftId)
        if (key === null) return
        const list = getActiveSessions(key)
        const next = [...list]
        const index = next.findIndex((item) => item.id === session.id)
        if (index === -1) {
            next.push(session)
        } else {
            next.splice(index, 1, session)
        }
        next.sort((a, b) => {
            const aTime = a.startAt ? new Date(a.startAt).getTime() : 0
            const bTime = b.startAt ? new Date(b.startAt).getTime() : 0
            return aTime - bTime
        })
        activeSessions.set(key, next)
    }

    const removeActiveSession = (session) => {
        if (!session?.id || !session?.workShiftId) return
        const key = toKey(session.workShiftId)
        if (key === null) return
        const list = getActiveSessions(key)
        if (!list.length) return
        const next = list.filter((item) => item.id !== session.id)
        activeSessions.set(key, next)
    }

    const loadCurrentSession = async () => {
        currentLoading.value = true
        currentError.value = null
        try {
            const session = await getCurrentShiftSession()
            setCurrentSession(session)
            return session
        } catch (error) {
            currentError.value = error
            setCurrentSession(null)
            throw error
        } finally {
            currentLoading.value = false
        }
    }

    const startSession = async ({ workShiftId, adminOverride = false } = {}) => {
        startSubmitting.value = true
        lastActionError.value = null
        try {
            const session = await startShiftSession({ workShiftId, adminOverride })
            setCurrentSession(session)
            upsertActiveSession(session)
            return session
        } catch (error) {
            lastActionError.value = error
            throw error
        } finally {
            startSubmitting.value = false
        }
    }

    const endSession = async () => {
        endSubmitting.value = true
        lastActionError.value = null
        try {
            const session = await endCurrentShiftSession()
            setCurrentSession(session)
            removeActiveSession(session)
            return session
        } catch (error) {
            lastActionError.value = error
            throw error
        } finally {
            endSubmitting.value = false
        }
    }

    const forceEndSession = async (sessionId, reason) => {
        const key = toKey(sessionId)
        if (key === null) {
            throw new Error('Session ID không hợp lệ.')
        }
        setForceSubmitting(key, true)
        setForceError(key, null)
        lastActionError.value = null
        try {
            const session = await forceEndShiftSession(key, reason)
            if (currentSession.value?.id === session.id) {
                setCurrentSession(session)
            }
            removeActiveSession(session)
            return session
        } catch (error) {
            setForceError(key, error)
            lastActionError.value = error
            throw error
        } finally {
            setForceSubmitting(key, false)
        }
    }

    const fetchActiveSessions = async (workShiftId) => {
        const key = toKey(workShiftId)
        if (key === null) return []
        activeLoading.set(key, true)
        activeErrors.delete(key)
        try {
            const list = await listActiveSessionsByWorkShift(key)
            const normalized = normalizeShiftSessionList(list)
            activeSessions.set(key, normalized)
            return normalized
        } catch (error) {
            if (error?.status === 404) {
                activeSessions.set(key, [])
                activeErrors.delete(key)
                return []
            }
            activeErrors.set(key, error)
            throw error
        } finally {
            activeLoading.set(key, false)
        }
    }

    const handleSessionEvent = (payload) => {
        const eventType = payload?.eventType || payload?.type
        const normalizedSession = normalizeShiftSession(payload?.session)
        lastEvent.value = {
            type: eventType,
            session: normalizedSession,
            report: payload?.report || null,
            raw: payload
        }

        if (!eventType || !normalizedSession) {
            return
        }

        if (currentSession.value?.id === normalizedSession.id) {
            setCurrentSession(normalizedSession)
        }

        if (eventType === shiftSessionEvents.STARTED) {
            upsertActiveSession(normalizedSession)
        } else if (eventType === shiftSessionEvents.ENDED || eventType === shiftSessionEvents.FORCED) {
            removeActiveSession(normalizedSession)
        }
    }

    const {
        connect: connectRealtime,
        disconnect: disconnectRealtime,
        ensureConnected: ensureRealtime,
        connected: realtimeConnected,
        connecting: realtimeConnecting,
        lastError: realtimeError
    } = useShiftSessionEvents(handleSessionEvent)

    ensureRealtime()

    const isSessionActive = computed(() => currentSession.value?.status === 'ACTIVE')
    const isForceSubmitting = (sessionId) => {
        const key = toKey(sessionId)
        return key !== null && Boolean(forceSubmitting.get(key))
    }

    const getForceError = (sessionId) => {
        const key = toKey(sessionId)
        return key === null ? null : forceErrors.get(key) || null
    }

    return {
        currentSession,
        currentLoading,
        currentError,
        startSubmitting,
        endSubmitting,
        lastActionError,
        isSessionActive,
        loadCurrentSession,
        startSession,
        endSession,
        forceEndSession,
        fetchActiveSessions,
        getActiveSessions,
        isActiveLoading,
        getActiveError,
        isForceSubmitting,
        getForceError,
        lastEvent,
        connectRealtime,
        disconnectRealtime,
        ensureRealtime,
        realtimeConnected,
        realtimeConnecting,
        realtimeError
    }
})
