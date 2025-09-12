export const topics = {
  lessor: {
    pendingContract: (lessorId) => `/topic/notifications/init-contract${lessorId}`,
    activeContract: (lessorId) => `/topic/notifications/active-contract${lessorId}`,
    rejectContract: (contractId) => `/topic/notifications/reject-contract${contractId}`,
  },
};