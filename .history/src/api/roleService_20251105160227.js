export const getAllRoles = async () => {
    const { data } = await api.get('/users/roles') // <-- Sửa đường dẫn ở đây
    return data
}