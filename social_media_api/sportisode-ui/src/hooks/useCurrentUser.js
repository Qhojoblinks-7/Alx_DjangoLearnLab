// src/hooks/useCurrentUser.js

import { useSelector } from 'react-redux';

/**
 * Custom hook to retrieve the current authenticated user's data from the Redux store.
 * * Contract: H-USER-01, H-USER-02
 * * @returns {Object|null} The user object (e.g., {id, username, name, profile_picture}) 
 * or null if the user is not authenticated.
 */
export const useCurrentUser = () => {
    // Access the state slice that holds the user information
    // We assume the state structure is `state.auth.user`
    const user = useSelector((state) => state.auth.user);

    // Return the user object, which is required for displaying the profile 
    // picture and linking in the ReplyComposer.
    return user;
};