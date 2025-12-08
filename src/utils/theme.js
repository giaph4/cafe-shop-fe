const THEME_KEY = 'app-theme'
export const LIGHT_THEME = 'light-theme'
export const COMFORT_THEME = 'comfort-theme'
export const DARK_THEME = 'dark-theme'
export const CAFE_THEME = 'cafe-theme'
export const MORNING_COFFEE_THEME = 'morning-coffee-theme'
export const TERRACOTTA_WARMTH_THEME = 'terracotta-warmth-theme'
export const CYBER_BLUE_THEME = 'cyber-blue-theme'
export const DEEP_PURPLE_SAAS_THEME = 'deep-purple-saas-theme'
export const COTTON_CANDY_THEME = 'cotton-candy-theme'
export const SUMMER_SKY_THEME = 'summer-sky-theme'
export const GOLDEN_HOUR_THEME = 'golden-hour-theme'
export const CLASSIC_NAVY_THEME = 'classic-navy-theme'
export const VINTAGE_SEA_THEME = 'vintage-sea-theme'
export const OLD_NEWSPAPER_THEME = 'old-newspaper-theme'
export const ELECTRIC_VIOLET_THEME = 'electric-violet-theme'
export const SPORTY_DARK_THEME = 'sporty-dark-theme'
export const DEEP_EMERALD_THEME = 'deep-emerald-theme'
export const DRIED_FLOWER_THEME = 'dried-flower-theme'
export const NORDIC_BLUE_THEME = 'nordic-blue-theme'
export const LATTE_ART_THEME = 'latte-art-theme'
export const ATLANTIS_THEME = 'atlantis-theme'
export const OLD_LIBRARY_THEME = 'old-library-theme'
export const INSTAGRAM_HOUR_THEME = 'instagram-hour-theme'
export const CONCRETE_STEEL_THEME = 'concrete-steel-theme'
export const Y2K_THEME = 'y2k-theme'
export const WEB_2_THEME = 'web-2-theme'
export const MINIMAL_FLAT_THEME = 'minimal-flat-theme'
export const MATERIAL_DESIGN_THEME = 'material-design-theme'
export const NEO_MINIMAL_THEME = 'neo-minimal-theme'
export const CYBER_NEON_THEME = 'cyber-neon-theme'
export const FUTURE_MINIMAL_THEME = 'future-minimal-theme'
export const HYPER_FUTURE_THEME = 'hyper-future-theme'
export const HOLOGRAM_CARD_THEME = 'hologram-card-theme'
export const RETRO_GAME_PIXEL_THEME = 'retro-game-pixel-theme'
export const PAPER_NOTEBOOK_THEME = 'paper-notebook-theme'
export const NEON_DESERT_THEME = 'neon-desert-theme'
export const LIQUID_GLASS_THEME = 'liquid-glass-theme'
export const SPACE_TERMINAL_THEME = 'space-terminal-theme'
export const TECH_OLD_CRT_THEME = 'tech-old-crt-theme'
export const ORIGAMI_UI_THEME = 'origami-ui-theme'
export const UNDERWATER_BLUE_THEME = 'underwater-blue-theme'
export const DNA_SPIRAL_THEME = 'dna-spiral-theme'
export const VAPOR_CLOUD_THEME = 'vapor-cloud-theme'

const THEME_CLASSES = [
    LIGHT_THEME,
    COMFORT_THEME,
    DARK_THEME,
    CAFE_THEME,
    MORNING_COFFEE_THEME,
    TERRACOTTA_WARMTH_THEME,
    CYBER_BLUE_THEME,
    DEEP_PURPLE_SAAS_THEME,
    COTTON_CANDY_THEME,
    SUMMER_SKY_THEME,
    GOLDEN_HOUR_THEME,
    CLASSIC_NAVY_THEME,
    VINTAGE_SEA_THEME,
    OLD_NEWSPAPER_THEME,
    ELECTRIC_VIOLET_THEME,
    SPORTY_DARK_THEME,
    DEEP_EMERALD_THEME,
    DRIED_FLOWER_THEME,
    NORDIC_BLUE_THEME,
    LATTE_ART_THEME,
    ATLANTIS_THEME,
    OLD_LIBRARY_THEME,
    INSTAGRAM_HOUR_THEME,
    CONCRETE_STEEL_THEME,
    Y2K_THEME,
    WEB_2_THEME,
    MINIMAL_FLAT_THEME,
    MATERIAL_DESIGN_THEME,
    NEO_MINIMAL_THEME,
    CYBER_NEON_THEME,
    FUTURE_MINIMAL_THEME,
    HYPER_FUTURE_THEME,
    HOLOGRAM_CARD_THEME,
    RETRO_GAME_PIXEL_THEME,
    PAPER_NOTEBOOK_THEME,
    NEON_DESERT_THEME,
    LIQUID_GLASS_THEME,
    SPACE_TERMINAL_THEME,
    TECH_OLD_CRT_THEME,
    ORIGAMI_UI_THEME,
    UNDERWATER_BLUE_THEME,
    DNA_SPIRAL_THEME,
    VAPOR_CLOUD_THEME
]

const isValidTheme = (theme) => THEME_CLASSES.includes(theme)

export const getStoredTheme = () => {
    if (typeof localStorage === 'undefined') return ''
    return localStorage.getItem(THEME_KEY) || ''
}

export const getPreferredTheme = () => {
    if (typeof window === 'undefined') return LIGHT_THEME
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME
}

export const resolveInitialTheme = () => {
    const stored = getStoredTheme()
    if (isValidTheme(stored)) return stored
    return getPreferredTheme()
}

// Dark themes that need dark mode styling
const DARK_THEMES = [
    DARK_THEME,
    CYBER_BLUE_THEME,
    GOLDEN_HOUR_THEME,
    CLASSIC_NAVY_THEME,
    ELECTRIC_VIOLET_THEME,
    SPORTY_DARK_THEME,
    OLD_LIBRARY_THEME,
    CYBER_NEON_THEME,
    HYPER_FUTURE_THEME,
    SPACE_TERMINAL_THEME,
    TECH_OLD_CRT_THEME
]

export const applyThemeClass = (theme) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    THEME_CLASSES.forEach((cls) => root.classList.remove(cls))
    const applied = isValidTheme(theme) ? theme : LIGHT_THEME
    root.classList.add(applied)
    root.setAttribute('data-theme', applied)
    root.setAttribute('data-bs-theme', DARK_THEMES.includes(applied) ? 'dark' : 'light')
}

export const persistTheme = (theme) => {
    if (typeof localStorage === 'undefined') return
    const stored = isValidTheme(theme) ? theme : LIGHT_THEME
    localStorage.setItem(THEME_KEY, stored)
}

export const toggleThemeValue = (current) => {
    const index = THEME_CLASSES.indexOf(current)
    return THEME_CLASSES[(index + 1) % THEME_CLASSES.length] || LIGHT_THEME
}

export const normalizeTheme = (theme) => (isValidTheme(theme) ? theme : LIGHT_THEME)

export const THEME_SEQUENCE = [...THEME_CLASSES]

// Theme metadata for UI display
export const THEME_METADATA = {
    [LIGHT_THEME]: {
        name: 'Chế độ sáng',
        category: 'Cơ bản',
        icon: 'bi-sun',
        description: 'Màu Bootstrap chuẩn, nhiều màu accent, tương phản cao, chuyên nghiệp',
        colors: ['#0D6EFD', '#FFFFFF', '#212529']
    },
    [COMFORT_THEME]: {
        name: 'Chế độ nhẹ nhàng',
        category: 'Cơ bản',
        icon: 'bi-droplet-half',
        description: 'Màu sắc thanh lịch, dịu mắt, hài hòa',
        colors: ['#6B8E9F', '#FAFBFC', '#4B5563']
    },
    [DARK_THEME]: {
        name: 'Chế độ tối',
        category: 'Cơ bản',
        icon: 'bi-moon-stars',
        description: 'Giao diện tối, bảo vệ mắt',
        colors: ['#5D6D7E', '#1A252F', '#1F2937']
    },
    [CAFE_THEME]: {
        name: 'Theme Cafe',
        category: 'Cafe & Ấm áp',
        icon: 'bi-cup-hot',
        description: 'Tông màu cafe ấm áp',
        colors: ['#8B6F47', '#FEF9F3', '#FFFFFF']
    },
    [MORNING_COFFEE_THEME]: {
        name: 'Morning Coffee',
        category: 'Minimalist & Earthy',
        icon: 'bi-flower1',
        description: 'Xanh rêu, be, kem tự nhiên',
        colors: ['#84A98C', '#F7F7F7', '#E9DAC1']
    },
    [TERRACOTTA_WARMTH_THEME]: {
        name: 'Terracotta Warmth',
        category: 'Minimalist & Earthy',
        icon: 'bi-sunset',
        description: 'Cam đất, cát, xanh rêu',
        colors: ['#BC6C25', '#FEFAE0', '#DDA15E']
    },
    [CYBER_BLUE_THEME]: {
        name: 'Cyber Blue',
        category: 'Modern & Tech',
        icon: 'bi-lightning-charge',
        description: 'Neon cyan, midnight, hiện đại',
        colors: ['#66FCF1', '#0B0C10', '#1F2833']
    },
    [DEEP_PURPLE_SAAS_THEME]: {
        name: 'Deep Purple SaaS',
        category: 'Modern & Tech',
        icon: 'bi-code-slash',
        description: 'Tím công nghệ, chuyên nghiệp',
        colors: ['#6C63FF', '#FFFFFF', '#E2E2FF']
    },
    [COTTON_CANDY_THEME]: {
        name: 'Cotton Candy',
        category: 'Pastel & Soft',
        icon: 'bi-heart',
        description: 'Hồng đậm, rõ ràng, tương phản cao',
        colors: ['#E91E63', '#FFFFFF', '#1A1A1A']
    },
    [SUMMER_SKY_THEME]: {
        name: 'Summer Sky',
        category: 'Pastel & Soft',
        icon: 'bi-sun',
        description: 'Coral đậm, teal, tương phản tốt',
        colors: ['#E53935', '#FFFFFF', '#00ACC1']
    },
    [GOLDEN_HOUR_THEME]: {
        name: 'Golden Hour',
        category: 'Luxury & Professional',
        icon: 'bi-gem',
        description: 'Vàng, đen, sang trọng',
        colors: ['#D4AF37', '#121212', '#333333']
    },
    [CLASSIC_NAVY_THEME]: {
        name: 'Classic Navy',
        category: 'Luxury & Professional',
        icon: 'bi-briefcase',
        description: 'Navy, teal, chuyên nghiệp',
        colors: ['#64FFDA', '#0A192F', '#112240']
    },
    [VINTAGE_SEA_THEME]: {
        name: 'Vintage Sea',
        category: 'Retro & Nostalgic',
        icon: 'bi-palette',
        description: 'Persian green, charcoal, hoài cổ',
        colors: ['#2A9D8F', '#264653', '#F0EBE3']
    },
    [OLD_NEWSPAPER_THEME]: {
        name: 'Old Newspaper',
        category: 'Retro & Nostalgic',
        icon: 'bi-newspaper',
        description: 'Ink black, paper beige, cổ điển',
        colors: ['#A63C3C', '#F0EBE3', '#2B2B2B']
    },
    [ELECTRIC_VIOLET_THEME]: {
        name: 'Electric Violet',
        category: 'Gen Z & Acid',
        icon: 'bi-lightning',
        description: 'Hot pink, grape, năng động',
        colors: ['#FF006E', '#240046', '#7B2CBF']
    },
    [SPORTY_DARK_THEME]: {
        name: 'Sporty Dark',
        category: 'Gen Z & Acid',
        icon: 'bi-trophy',
        description: 'Neon green, jet black, thể thao',
        colors: ['#CCFF00', '#121212', '#2C2C2C']
    },
    [DEEP_EMERALD_THEME]: {
        name: 'Deep Emerald',
        category: 'Elegant Nature',
        icon: 'bi-tree',
        description: 'Jade, dark forest, sang trọng',
        colors: ['#40916C', '#1B4332', '#D8F3DC']
    },
    [DRIED_FLOWER_THEME]: {
        name: 'Dried Flower',
        category: 'Elegant Nature',
        icon: 'bi-flower2',
        description: 'Deep wine, warm taupe, nữ tính',
        colors: ['#5E303F', '#F3E0DC', '#C08497']
    },
    [NORDIC_BLUE_THEME]: {
        name: 'Nordic Blue',
        category: 'Scandinavian',
        icon: 'bi-snow',
        description: 'Slate grey, cloud blue, Bắc Âu',
        colors: ['#3C4858', '#F9FAFC', '#8492A6']
    },
    [LATTE_ART_THEME]: {
        name: 'Latte Art',
        category: 'Coffee & Cozy',
        icon: 'bi-cup-hot',
        description: 'Roasted bean, milk foam, ấm áp',
        colors: ['#6D4C41', '#FFF8E1', '#3E2723']
    },
    [ATLANTIS_THEME]: {
        name: 'Atlantis',
        category: 'Deep Ocean',
        icon: 'bi-water',
        description: 'Lagoon, abyss, chuyên nghiệp',
        colors: ['#0A9396', '#FFFFFF', '#001219']
    },
    [OLD_LIBRARY_THEME]: {
        name: 'Old Library',
        category: 'Dark Academia',
        icon: 'bi-book',
        description: 'Charcoal, antique gold, huyền bí',
        colors: ['#C5A059', '#1C1C1C', '#F5F5DC']
    },
    [INSTAGRAM_HOUR_THEME]: {
        name: 'Instagram Hour',
        category: 'Vibrant Sunset',
        icon: 'bi-sunset',
        description: 'Deep purple, hot pink, năng động',
        colors: ['#8338EC', '#FFFFFF', '#FF006E']
    },
    [CONCRETE_STEEL_THEME]: {
        name: 'Concrete & Steel',
        category: 'Monochromatic Grey',
        icon: 'bi-square',
        description: 'Đơn sắc xám, tối giản, tinh tế',
        colors: ['#333333', '#FFFFFF', '#000000']
    },
    [Y2K_THEME]: {
        name: 'Y2K',
        category: '2000-2005 Era',
        icon: 'bi-stars',
        description: 'Neon blue, tím nhạt, Windows XP',
        colors: ['#00D4FF', '#FFFFFF', '#B794F6']
    },
    [WEB_2_THEME]: {
        name: 'Web 2.0',
        category: '2006-2010 Era',
        icon: 'bi-globe',
        description: 'Xanh dương, cam, trắng sáng',
        colors: ['#0078D4', '#FFFFFF', '#FF6B35']
    },
    [MINIMAL_FLAT_THEME]: {
        name: 'Minimal Flat',
        category: '2011-2015 Era',
        icon: 'bi-square-fill',
        description: 'Pastel, xám nhạt, phẳng hoàn toàn',
        colors: ['#4CAF50', '#FFFFFF', '#9E9E9E']
    },
    [MATERIAL_DESIGN_THEME]: {
        name: 'Material Design',
        category: '2016-2018 Era',
        icon: 'bi-layers',
        description: 'Xanh dương, hồng đậm, shadow tầng',
        colors: ['#2196F3', '#FFFFFF', '#E91E63']
    },
    [NEO_MINIMAL_THEME]: {
        name: 'Neo Minimal',
        category: '2019-2022 Era',
        icon: 'bi-grid-3x3',
        description: 'Trắng, đen, xám graphite, accent đỏ',
        colors: ['#EF4444', '#FFFFFF', '#6B7280']
    },
    [CYBER_NEON_THEME]: {
        name: 'Cyber Neon',
        category: '2023-2025 Era',
        icon: 'bi-lightning',
        description: 'Đen, tím neon, xanh cyan, glow',
        colors: ['#A855F7', '#0A0A0F', '#06B6D4']
    },
    [FUTURE_MINIMAL_THEME]: {
        name: 'Future Minimal',
        category: '2026-2030 Era',
        icon: 'bi-circle',
        description: 'Trắng, bạc, xanh dương lạnh',
        colors: ['#3B82F6', '#FFFFFF', '#94A3B8']
    },
    [HYPER_FUTURE_THEME]: {
        name: 'Hyper Future',
        category: '2030+ Era',
        icon: 'bi-infinity',
        description: 'Gradient tím xanh, đen sâu, hologram',
        colors: ['#8B5CF6', '#000000', '#06B6D4']
    },
    [HOLOGRAM_CARD_THEME]: {
        name: 'Hologram Card',
        category: 'Special Effects',
        icon: 'bi-stars',
        description: 'Hologram đổi màu, shimmer, gradient',
        colors: ['#9D4EDD', '#FFFFFF', '#4CC9F0']
    },
    [RETRO_GAME_PIXEL_THEME]: {
        name: 'Retro Game Pixel',
        category: 'Special Effects',
        icon: 'bi-grid-3x3',
        description: 'Pixel art 16-bit, font vuông, nút game',
        colors: ['#6A4C93', '#FFFFFF', '#FF6B6B']
    },
    [PAPER_NOTEBOOK_THEME]: {
        name: 'Paper Notebook',
        category: 'Special Effects',
        icon: 'bi-file-earmark-text',
        description: 'Giấy caro, viền xé, sticker',
        colors: ['#2C3E50', '#FDFDF8', '#95A5A6']
    },
    [NEON_DESERT_THEME]: {
        name: 'Neon Desert',
        category: 'Special Effects',
        icon: 'bi-sunset',
        description: 'Cát cam nóng, neon xanh, tribal',
        colors: ['#FF6B35', '#FFF8F0', '#00F5FF']
    },
    [LIQUID_GLASS_THEME]: {
        name: 'Liquid Glass',
        category: 'Special Effects',
        icon: 'bi-droplet',
        description: 'Trong suốt như nước, hover phồng',
        colors: ['#00B4D8', '#FFFFFF', '#90E0EF']
    },
    [SPACE_TERMINAL_THEME]: {
        name: 'Space Terminal',
        category: 'Special Effects',
        icon: 'bi-terminal',
        description: 'Xanh bảng điều khiển, mono font',
        colors: ['#00FF41', '#000000', '#0A192F']
    },
    [TECH_OLD_CRT_THEME]: {
        name: 'Tech Old CRT',
        category: 'Special Effects',
        icon: 'bi-display',
        description: 'Xanh lá CRT, scanline, nhấp nháy',
        colors: ['#39FF14', '#000000', '#0A0A0A']
    },
    [ORIGAMI_UI_THEME]: {
        name: 'Origami UI',
        category: 'Special Effects',
        icon: 'bi-file-earmark',
        description: 'Gấp nếp giấy, shadow sắc cạnh',
        colors: ['#2196F3', '#FFFFFF', '#FF9800']
    },
    [UNDERWATER_BLUE_THEME]: {
        name: 'Underwater Blue',
        category: 'Special Effects',
        icon: 'bi-water',
        description: 'Xanh biển đậm, sóng nhẹ, bubble',
        colors: ['#006994', '#FFFFFF', '#00B4D8']
    },
    [DNA_SPIRAL_THEME]: {
        name: 'DNA Spiral',
        category: 'Special Effects',
        icon: 'bi-diagram-3',
        description: 'Chuỗi DNA, chấm sáng, node gene',
        colors: ['#7209B7', '#FFFFFF', '#560BAD']
    },
    [VAPOR_CLOUD_THEME]: {
        name: 'Vapor Cloud',
        category: 'Special Effects',
        icon: 'bi-cloud',
        description: 'Khói mờ, gradient tím sương',
        colors: ['#B794F6', '#FFFFFF', '#E9D5FF']
    }
}

// Get themes by category
export const getThemesByCategory = () => {
    const categories = {}
    Object.entries(THEME_METADATA).forEach(([theme, meta]) => {
        if (!categories[meta.category]) {
            categories[meta.category] = []
        }
        categories[meta.category].push({ theme, ...meta })
    })
    return categories
}
