export const cleanParams = (params = {}) => {
    const result = {}
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        result[key] = value
    })
    return result
}
