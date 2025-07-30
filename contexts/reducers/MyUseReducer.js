const MyUseReducer = (currentState, action) => {
    switch (action.type) {
        case 'login':
        return {
            ...currentState,
            user: action.payload,
            isLoggedIn: true,
        }
        case 'logout':
        return {
            ...currentState,
            user: null,
            isLoggedIn: false,
        };
        default:
            return currentState;
    }
};

const initialState = {
    user: null,
    isLoggedIn: false,
};

export default MyUseReducer;
