import { computed } from 'vue'
import { useThemePreference } from './useThemePreference'

/**
 * Composable để tạo chart options chuẩn cho tất cả các trang
 * Đảm bảo charts không bị che khuất và hiển thị đẹp
 */
export function useChartOptions () {
    const { isDark } = useThemePreference()

    /**
     * Tạo base chart options với padding và settings chuẩn
     * @param {Object} options - Options tùy chỉnh
     * @param {string} options.type - Loại chart (bar, line, area, pie, donut, etc.)
     * @param {Array} options.colors - Màu sắc cho chart
     * @param {boolean} options.hasRotatedLabels - Có labels bị xoay không (cần padding bottom lớn hơn)
     * @param {boolean} options.hasLegend - Có legend không (cần padding top lớn hơn)
     * @param {number} options.height - Chiều cao chart
     * @param {Object} options.xaxis - Xaxis config tùy chỉnh
     * @param {Object} options.yaxis - Yaxis config tùy chỉnh
     * @param {Object} options.legend - Legend config tùy chỉnh
     * @param {Object} options.grid - Grid config tùy chỉnh
     */
    const createChartOptions = (options = {}) => {
        const {
            type = 'line',
            colors = ['var(--color-primary)'],
            hasRotatedLabels = false,
            hasLegend = true,
            height = 300,
            xaxis: customXaxis = {},
            yaxis: customYaxis = {},
            legend: customLegend = {},
            grid: customGrid = {},
            ...restOptions
        } = options

        const isBar = type === 'bar'
        const isCircular = ['pie', 'donut', 'radialBar'].includes(type)
        const dark = isDark.value

        // Base label style - rõ ràng hơn trong dark theme
        const baseLabelStyle = {
            colors: dark ? '#EFF2F6' : '#64748b',
            fontSize: '12px',
            fontFamily: 'var(--font-family-sans)',
            fontWeight: dark ? 500 : 400
        }

        // Grid padding - tăng bottom nếu có rotated labels, tăng top nếu có legend
        const gridPadding = {
            top: hasLegend ? 40 : 8,
            bottom: hasRotatedLabels ? 40 : 20,
            left: 12,
            right: 12,
            ...customGrid.padding
        }

        // Xaxis labels config
        const xaxisLabels = {
            style: { ...baseLabelStyle },
            ...(hasRotatedLabels && {
                rotate: -45,
                rotateAlways: true,
                maxHeight: 60,
                offsetY: 5
            }),
            ...customXaxis.labels
        }

        // Yaxis labels config - thêm maxWidth để không bị che
        const yaxisLabels = {
            style: { ...baseLabelStyle },
            maxWidth: 80,
            ...customYaxis.labels
        }

        // Legend config - đảm bảo không bị che khuất
        const baseLegendConfig = {
            position: 'top',
            horizontalAlign: 'right',
            fontFamily: 'var(--font-family-sans)',
            fontSize: '12px',
            labels: {
                colors: dark ? '#EFF2F6' : '#475569',
                fontWeight: dark ? 500 : 400
            },
            itemMargin: {
                horizontal: 10,
                vertical: 5
            },
            offsetY: -5
        }

        // Merge với custom legend, giữ nguyên offsetY nếu đã có
        const legendConfig = {
            ...baseLegendConfig,
            ...customLegend,
            labels: {
                ...baseLegendConfig.labels,
                ...(customLegend.labels || {})
            },
            itemMargin: {
                ...baseLegendConfig.itemMargin,
                ...(customLegend.itemMargin || {})
            }
        }

        // Base options
        const baseOptions = {
            chart: {
                type,
                height,
                toolbar: { show: true },
                foreColor: dark ? '#EFF2F6' : '#475569',
                background: 'transparent',
                ...restOptions.chart
            },
            stroke: isCircular
                ? { colors: ['#ffffff'], width: 2 }
                : { curve: 'smooth', width: isBar ? 0 : 3 },
            dataLabels: { enabled: false },
            colors,
            grid: {
                strokeDashArray: 4,
                borderColor: dark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.35)',
                padding: gridPadding,
                ...customGrid
            },
            tooltip: {
                theme: dark ? 'dark' : 'light',
                shared: true,
                intersect: false,
                ...restOptions.tooltip
            },
            ...restOptions
        }

        // Thêm xaxis cho non-circular charts
        if (!isCircular) {
            baseOptions.xaxis = {
                labels: xaxisLabels,
                axisBorder: {
                    color: dark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(203, 213, 225, 0.6)',
                    strokeWidth: dark ? 1.5 : 1
                },
                axisTicks: {
                    color: dark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(203, 213, 225, 0.6)',
                    strokeWidth: dark ? 1.5 : 1
                },
                ...customXaxis
            }
        }

        // Thêm yaxis
        baseOptions.yaxis = {
            labels: yaxisLabels,
            ...customYaxis
        }

        // Thêm legend nếu có
        if (hasLegend) {
            baseOptions.legend = legendConfig
        }

        // Fill options
        if (!isCircular) {
            baseOptions.fill = isBar
                ? { type: 'solid', opacity: 0.8 }
                : {
                    type: 'gradient',
                    gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.4,
                        opacityTo: 0.1,
                        stops: [0, 90, 100]
                    }
                }
        }

        return baseOptions
    }

    /**
     * Tạo computed chart options với reactive theme
     */
    const createComputedChartOptions = (options = {}) => computed(() => createChartOptions(options))

    return {
        createChartOptions,
        createComputedChartOptions,
        isDark
    }
}

