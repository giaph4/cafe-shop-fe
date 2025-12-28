/**
 * Performance Monitor - Tracks page load time, API calls, and performance metrics
 */

class PerformanceMonitor {
    constructor () {
        this.metrics = {
            pageLoadTimes: [],
            apiCalls: [],
            renderTimes: [],
            errors: []
        }
        this.observers = {
            performance: null,
            resource: null
        }
        this.startTime = performance.now()
        this.init()
    }

    /**
     * Initialize performance monitoring
     */
    init () {
        if (typeof window === 'undefined' || !window.performance) return

        // Theo dõi thời gian tải trang
        this.trackPageLoad()

        // Theo dõi tải tài nguyên
        this.trackResources()

        // Theo dõi các tác vụ dài
        this.trackLongTasks()

        // Theo dõi lỗi
        this.trackErrors()
    }

    /**
     * Track page load time
     */
    trackPageLoad () {
        if (typeof window === 'undefined') return

        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0]
            if (navigation) {
                const metrics = {
                    page: window.location.pathname,
                    timestamp: Date.now(),
                    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
                    tcp: navigation.connectEnd - navigation.connectStart,
                    ssl: navigation.secureConnectionStart > 0
                        ? navigation.connectEnd - navigation.secureConnectionStart
                        : 0,
                    ttfb: navigation.responseStart - navigation.requestStart,
                    download: navigation.responseEnd - navigation.responseStart,
                    domProcessing: navigation.domComplete - navigation.domInteractive,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    load: navigation.loadEventEnd - navigation.loadEventStart,
                    total: navigation.loadEventEnd - navigation.fetchStart
                }

                this.metrics.pageLoadTimes.push(metrics)
                this.saveMetrics()

                // Cảnh báo nếu trang tải chậm
                if (metrics.total > 3000) {
                    this.alertSlowPage(metrics)
                }
            }
        })
    }

    /**
     * Track resource loading
     */
    trackResources () {
        if (typeof window === 'undefined') return

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'resource') {
                    const resource = {
                        name: entry.name,
                        type: this.getResourceType(entry.name),
                        duration: entry.duration,
                        size: entry.transferSize || 0,
                        timestamp: Date.now()
                    }

                    this.metrics.apiCalls.push(resource)
                }
            }
            this.saveMetrics()
        })

        try {
            observer.observe({ entryTypes: ['resource'] })
            this.observers.resource = observer
        } catch (err) {
            // Resource tracking không được hỗ trợ trên trình duyệt này
        }
    }

    /**
     * Track long tasks
     */
    trackLongTasks () {
        if (typeof window === 'undefined') return

        // Chỉ theo dõi long tasks trong chế độ development
        const isDevelopment = import.meta.env.DEV
        const longTaskThreshold = 100 // Chỉ cảnh báo cho các tác vụ > 100ms (thay vì 50ms)

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.duration > longTaskThreshold) {
                    // Long task được phát hiện, chỉ log trong development
                    this.metrics.renderTimes.push({
                        duration: entry.duration,
                        startTime: entry.startTime,
                        timestamp: Date.now()
                    })
                }
            }
            this.saveMetrics()
        })

        try {
            observer.observe({ entryTypes: ['longtask'] })
            this.observers.performance = observer
        } catch (err) {
            // Long task tracking không được hỗ trợ trên trình duyệt này
        }
    }

    /**
     * Track errors
     */
    trackErrors () {
        if (typeof window === 'undefined') return

        window.addEventListener('error', (event) => {
            this.metrics.errors.push({
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                timestamp: Date.now()
            })
            this.saveMetrics()
        })

        window.addEventListener('unhandledrejection', (event) => {
            this.metrics.errors.push({
                message: event.reason?.message || 'Unhandled promise rejection',
                type: 'promise',
                timestamp: Date.now()
            })
            this.saveMetrics()
        })
    }

    /**
     * Track API call
     */
    trackApiCall (url, method, duration, status, size = 0) {
        this.metrics.apiCalls.push({
            name: url,
            type: 'api',
            method,
            duration,
            status,
            size,
            timestamp: Date.now()
        })
        this.saveMetrics()

        // Cảnh báo nếu API call chậm
        if (duration > 5000) {
            this.alertSlowApi(url, duration)
        }
    }

    /**
     * Track component render time
     */
    trackRender (componentName, duration) {
        this.metrics.renderTimes.push({
            component: componentName,
            duration,
            timestamp: Date.now()
        })
        this.saveMetrics()
    }

    /**
     * Get resource type from URL
     */
    getResourceType (url) {
        if (url.includes('/api/')) return 'api'
        if (url.match(/\.(js|mjs)$/)) return 'script'
        if (url.match(/\.css$/)) return 'stylesheet'
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image'
        if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font'
        return 'other'
    }

    /**
     * Alert slow page load
     */
    alertSlowPage (metrics) {
        // Trang tải chậm được phát hiện, chỉ log trong development
    }

    /**
     * Alert slow API call
     */
    alertSlowApi (url, duration) {
        // API call chậm được phát hiện, chỉ log trong development
    }

    /**
     * Get performance metrics
     */
    getMetrics () {
        const recentPageLoads = this.metrics.pageLoadTimes.slice(-10)
        const recentApiCalls = this.metrics.apiCalls.slice(-50)
        const recentRenders = this.metrics.renderTimes.slice(-20)
        const recentErrors = this.metrics.errors.slice(-10)

        return {
            pageLoad: {
                recent: recentPageLoads,
                average: this.calculateAverage(recentPageLoads, 'total'),
                min: this.calculateMin(recentPageLoads, 'total'),
                max: this.calculateMax(recentPageLoads, 'total')
            },
            apiCalls: {
                recent: recentApiCalls,
                average: this.calculateAverage(recentApiCalls, 'duration'),
                total: recentApiCalls.length,
                byType: this.groupByType(recentApiCalls)
            },
            render: {
                recent: recentRenders,
                average: this.calculateAverage(recentRenders, 'duration')
            },
            errors: {
                recent: recentErrors,
                total: recentErrors.length
            },
            uptime: Date.now() - this.startTime
        }
    }

    /**
     * Calculate average
     */
    calculateAverage (array, field) {
        if (!array.length) return 0
        const sum = array.reduce((acc, item) => acc + (item[field] || 0), 0)
        return Math.round(sum / array.length)
    }

    /**
     * Calculate min
     */
    calculateMin (array, field) {
        if (!array.length) return 0
        return Math.min(...array.map(item => item[field] || 0))
    }

    /**
     * Calculate max
     */
    calculateMax (array, field) {
        if (!array.length) return 0
        return Math.max(...array.map(item => item[field] || 0))
    }

    /**
     * Group by type
     */
    groupByType (array) {
        const grouped = {}
        array.forEach(item => {
            const type = item.type || 'other'
            if (!grouped[type]) {
                grouped[type] = { count: 0, totalDuration: 0 }
            }
            grouped[type].count++
            grouped[type].totalDuration += item.duration || 0
        })
        return grouped
    }

    /**
     * Save metrics to localStorage
     */
    saveMetrics () {
        try {
            // Chỉ giữ lại các metrics gần đây để tránh tràn bộ nhớ
            const toSave = {
                pageLoadTimes: this.metrics.pageLoadTimes.slice(-20),
                apiCalls: this.metrics.apiCalls.slice(-100),
                renderTimes: this.metrics.renderTimes.slice(-50),
                errors: this.metrics.errors.slice(-20)
            }
            localStorage.setItem('performance_metrics', JSON.stringify(toSave))
        } catch (err) {
            // Không thể lưu metrics vào localStorage
        }
    }

    /**
     * Load metrics from localStorage
     */
    loadMetrics () {
        try {
            const stored = localStorage.getItem('performance_metrics')
            if (stored) {
                const parsed = JSON.parse(stored)
                this.metrics = {
                    pageLoadTimes: parsed.pageLoadTimes || [],
                    apiCalls: parsed.apiCalls || [],
                    renderTimes: parsed.renderTimes || [],
                    errors: parsed.errors || []
                }
            }
        } catch (err) {
            // Không thể load metrics từ localStorage
        }
    }

    /**
     * Clear metrics
     */
    clearMetrics () {
        this.metrics = {
            pageLoadTimes: [],
            apiCalls: [],
            renderTimes: [],
            errors: []
        }
        try {
            localStorage.removeItem('performance_metrics')
        } catch (err) {
            // Không thể xóa metrics từ localStorage
        }
    }

    /**
     * Cleanup
     */
    destroy () {
        if (this.observers.performance) {
            this.observers.performance.disconnect()
        }
        if (this.observers.resource) {
            this.observers.resource.disconnect()
        }
    }
}

// Instance singleton
export const performanceMonitor = new PerformanceMonitor()

// Tải các metrics trước đó khi khởi tạo
performanceMonitor.loadMetrics()

export default performanceMonitor

