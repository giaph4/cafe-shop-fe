import api from './axios'

// API 15: Get All Tables
export const getTables = async () => {
  const { data } = await api.get('/tables')
  return data
}

// API 17: Create Table
// (data: { name: "string", capacity: number })
export const createTable = async (tableData) => {
  const { data } = await api.post('/tables', tableData)
  return data
}

// API 18: Update Table Info (Name, Capacity)
// (data: { id: number, data: { name: "string", capacity: number } })
export const updateTable = async ({ id, data }) => {
  const { data: responseData } = await api.put(`/tables/${id}`, data)
  return responseData
}

// API 19: Update Table Status
// (data: { id: number, status: "AVAILABLE" | "SERVING" | "RESERVED" })
export const updateTableStatus = async ({ id, status }) => {
  const { data } = await api.patch(`/tables/${id}/status`, { status })
  return data
}

// API 20: Delete Table
export const deleteTable = async (id) => {
  await api.delete(`/tables/${id}`)
  return id
}