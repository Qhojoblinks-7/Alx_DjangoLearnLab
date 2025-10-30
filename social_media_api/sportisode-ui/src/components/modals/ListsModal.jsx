// src/components/modals/ListsModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import ListManagement from '../ui/ListManagement';
import { authenticatedFetch } from '../lib/api';

const ListsModal = ({ isOpen, onClose, onAddToList, postId }) => {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  // Fetch user lists
  const { data: userLists, isLoading: isLoadingLists, refetch } = useQuery({
    queryKey: ['userLists'],
    queryFn: async () => {
      const response = await authenticatedFetch('/lists/');
      if (!response.ok) throw new Error('Failed to fetch lists');
      return response.json();
    },
    enabled: isOpen, // Only fetch when modal is open
  });

  // Initialize default lists mutation
  const initializeDefaultsMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedFetch('/lists/defaults/initialize/', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to initialize defaults');
      return response.json();
    },
    onSuccess: () => {
      refetch(); // Refetch lists after initialization
    },
    onError: () => {
      setErrorMessage('Failed to initialize default lists. Please try again.');
    },
  });

  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: async (listData) => {
      const response = await authenticatedFetch('/lists/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listData)
      });
      if (!response.ok) throw new Error('Failed to create list');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userLists']);
      setErrorMessage('');
    },
    onError: () => {
      setErrorMessage('Failed to create list. Please try again.');
    },
  });

  // Delete list mutation
  const deleteListMutation = useMutation({
    mutationFn: async (listId) => {
      const response = await authenticatedFetch(`/lists/${listId}/`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete list');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userLists']);
      setErrorMessage('');
    },
    onError: () => {
      setErrorMessage('Failed to delete list. Please try again.');
    },
  });

  // Add post to list mutation
  const addToListMutation = useMutation({
    mutationFn: async ({ listId, postId }) => {
      const response = await authenticatedFetch(`/lists/${listId}/add_post/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId })
      });
      if (!response.ok) throw new Error('Failed to add post to list');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userLists']);
      setErrorMessage('');
    },
    onError: () => {
      setErrorMessage('Failed to add post to list. Please try again.');
    },
  });

  // Memoized map for efficient list lookup by name
  const listsByName = useMemo(() => {
    if (!userLists || !Array.isArray(userLists)) return new Map();
    return new Map(userLists.map(list => [list.name, list]));
  }, [userLists]);

  // Initialize default lists on first load if none exist
  useEffect(() => {
    if (isOpen && userLists && userLists.length === 0) {
      initializeDefaultsMutation.mutate();
    }
  }, [isOpen, userLists, initializeDefaultsMutation]);

  const handleCreateList = async (listData) => {
    setIsLoadingAction(true);
    try {
      await createListMutation.mutateAsync(listData);
    } catch {
      // Error handled in mutation
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleEditList = (list) => {
    // For now, just show alert - could implement edit modal later
    setErrorMessage(`Edit functionality for "${list.name}" would open here`);
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
      return;
    }

    setIsLoadingAction(true);
    try {
      await deleteListMutation.mutateAsync(listId);
    } catch {
      // Error handled in mutation
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleSelectList = async (list) => {
    if (!postId) {
      setErrorMessage('No post selected');
      return;
    }

    let resolvedListId = list.id;

    // For lists with string IDs (default lists), resolve to actual numeric ID from userLists
    if (typeof list.id === 'string') {
      if (isLoadingLists) {
        setErrorMessage('Lists are still loading. Please wait.');
        return;
      }
      if (!userLists || !Array.isArray(userLists)) {
        setErrorMessage('Unable to load lists. Please refresh and try again.');
        return;
      }

      const resolvedList = listsByName.get(list.name);
      if (!resolvedList) {
        setErrorMessage('Selected list not found. Please try again.');
        return;
      }
      resolvedListId = resolvedList.id;
    }

    setIsLoadingAction(true);
    try {
      await addToListMutation.mutateAsync({ listId: resolvedListId, postId });
      onAddToList(resolvedListId, list.name);
      onClose();
    } catch {
      // Error handled in mutation
    } finally {
      setIsLoadingAction(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-dark-card border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white font-semibold">Manage Lists</DialogTitle>
          <DialogDescription className="text-gray-400">
            Organize your posts into custom lists for better content management.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 p-3 bg-red-900 border border-red-700 rounded text-red-200"
          >
            {errorMessage}
          </div>
        )}

        <ListManagement
          lists={userLists || []}
          onCreateList={handleCreateList}
          onEditList={handleEditList}
          onDeleteList={handleDeleteList}
          onSelectList={handleSelectList}
          isLoading={isLoadingLists || isLoadingAction}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ListsModal;