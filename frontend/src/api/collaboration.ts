import axiosClient from './axiosClient'

export const collaborationApi = {
  createOrGetCollab: async (bookId: number, chapterId?: number) => {
    const params = chapterId ? { chapter_id: chapterId } : undefined
    const res = await axiosClient.post(`/api/v1/collab/books/${bookId}`, {}, { params })
    return res.data
  },
  getCollabByBook: async (bookId: number, chapterId?: number) => {
    const params = chapterId ? { chapter_id: chapterId } : undefined
    const res = await axiosClient.get(`/api/v1/collab/books/${bookId}`, { params })
    return res.data
  },
  saveSnapshot: async (collabId: number, snapshotB64: string) => {
    const res = await axiosClient.post(`/api/v1/collab/${collabId}/snapshot`, { snapshot_b64: snapshotB64 })
    return res.data
  },
  getWsToken: async (collabId: number) => {
    const res = await axiosClient.get(`/api/v1/collab/ws-token`, { params: { collab_id: collabId } })
    return res.data
  },
  inviteCollaborator: async (collabId: number, payload: any) => {
    const res = await axiosClient.post(`/api/v1/collab/${collabId}/invite`, payload)
    return res.data
  },
  listCollaborators: async (collabId: number) => {
    const res = await axiosClient.get(`/api/v1/collab/${collabId}/collaborators`)
    return res.data
  }
}
