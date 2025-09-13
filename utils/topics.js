export const topics = {
  lessor: {
    pendingContract: (lessorId) => `/topic/notifications/init-contract${lessorId}`,
    activeContract: (lessorId) => `/topic/notifications/active-contract${lessorId}`,
    rejectContract: (contractId) => `/topic/notifications/reject-contract${contractId}`,
    createRental: (lessorId) => `/topic/notifications/create-rental${lessorId}`,
  },
  renter: {
    confirmRental: (renterId) => `/topic/notifications/confirm-rental${renterId}`,
    cancelRental: (renterId) => `/topic/notifications/cancel-rental${renterId}`,
    activeRental: (renterId) => `/topic/notifications/active-rental${renterId}`,
    completedRental: (renterId) => `/topic/notifications/completed-rental${renterId}`,
  }
};