import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../store/authSlice.js'
import PostCard from './PostCard.jsx'

// Mock all the dependencies
vi.mock('./ProfilePicture.jsx', () => ({
  default: ({ user }) => <div data-testid="profile-picture">{user.username}</div>
}))

vi.mock('./LikeButton.jsx', () => ({
  default: ({ initialLikesCount }) => (
    <button data-testid="like-button">
      Like ({initialLikesCount})
    </button>
  )
}))

vi.mock('./RepostButton.jsx', () => ({
  default: ({ initialRepostsCount }) => (
    <button data-testid="repost-button">
      Repost ({initialRepostsCount})
    </button>
  )
}))

vi.mock('./ShareButton.jsx', () => ({
  default: () => (
    <button data-testid="share-button">Share</button>
  )
}))

vi.mock('./PostDetailDrawer.jsx', () => ({
  default: ({ isOpen }) => (
    <div data-testid="post-drawer" data-open={isOpen}>
      Drawer Content
    </div>
  )
}))

vi.mock('./PostCommentModal.jsx', () => ({
  default: ({ isOpen }) => (
    <div data-testid="post-modal" data-open={isOpen}>
      Modal Content
    </div>
  )
}))

vi.mock('./PostActionsMenu.jsx', () => ({
  default: () => (
    <button data-testid="actions-menu">Actions</button>
  )
}))

vi.mock('./hooks/useViewTracking.js', () => ({
  default: vi.fn(() => ({ current: null }))
}))

vi.mock('./lib/api.js', () => ({
  authenticatedFetch: vi.fn()
}))

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: { id: 1, username: 'testuser' },
        token: 'test-token',
        ...initialState.auth,
      },
    },
  })
}

const renderWithProviders = (component, store) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  )
}

describe('PostCard', () => {
  const mockPost = {
    id: 1,
    title: 'Test Post Title',
    content: 'This is a test post with @mention and #hashtag',
    video: null,
    created_at: '2024-01-01T00:00:00Z',
    likes_count: 5,
    comments_count: 3,
    reposts_count: 2,
    is_liked: false,
    is_reposted: false,
    views_count: 10,
    author: {
      id: 1,
      username: 'testauthor',
    },
    recent_comments: [
      {
        id: 1,
        author: { username: 'commenter1' },
        content: 'Great post @testauthor!',
      },
    ],
  }

  let store

  beforeEach(() => {
    store = createMockStore()
  })

  it('should render post title with processed entities', () => {
    renderWithProviders(<PostCard post={mockPost} />, store)

    // Title should be rendered with ProcessedText wrapper
    const titleElement = screen.getByText('Test Post Title')
    expect(titleElement).toBeInTheDocument()
    expect(titleElement.closest('div')).toHaveClass('text-gray-300')
  })

  it('should render post content with processed entities', () => {
    renderWithProviders(<PostCard post={mockPost} />, store)

    // Content should be processed for mentions and hashtags
    const contentElement = screen.getByText(/This is a test post/)
    expect(contentElement).toBeInTheDocument()
  })

  it('should render author information', () => {
    renderWithProviders(<PostCard post={mockPost} />, store)

    expect(screen.getByText('testauthor')).toBeInTheDocument()
    expect(screen.getByText('@testauthor')).toBeInTheDocument()
  })

  it('should render interaction buttons', () => {
    renderWithProviders(<PostCard post={mockPost} />, store)

    expect(screen.getByTestId('like-button')).toBeInTheDocument()
    expect(screen.getByTestId('repost-button')).toBeInTheDocument()
    expect(screen.getByTestId('share-button')).toBeInTheDocument()
  })

  it('should render view count', () => {
    renderWithProviders(<PostCard post={mockPost} />, store)

    const viewCount = screen.getByText('10')
    expect(viewCount).toBeInTheDocument()
  })

  it('should render comment preview when comments exist', () => {
    renderWithProviders(<PostCard post={mockPost} />, store)

    expect(screen.getByText('Recent replies')).toBeInTheDocument()
    expect(screen.getByText('Great post @testauthor!')).toBeInTheDocument()
  })

  it('should not render comment preview when no comments', () => {
    const postWithoutComments = {
      ...mockPost,
      comments_count: 0,
      recent_comments: [],
    }

    renderWithProviders(<PostCard post={postWithoutComments} />, store)

    expect(screen.queryByText('Recent replies')).not.toBeInTheDocument()
  })

  it('should open comment modal on desktop when comment button clicked', async () => {
    // Mock window.innerWidth for desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const user = userEvent.setup()
    renderWithProviders(<PostCard post={mockPost} />, store)

    const commentButton = screen.getByRole('button', { name: /3/ }) // Button with comment count
    await user.click(commentButton)

    const modal = screen.getByTestId('post-modal')
    expect(modal).toHaveAttribute('data-open', 'true')
  })

  it('should open comment drawer on mobile when comment button clicked', async () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    })

    const user = userEvent.setup()
    renderWithProviders(<PostCard post={mockPost} />, store)

    const commentButton = screen.getByRole('button', { name: /3/ })
    await user.click(commentButton)

    const drawer = screen.getByTestId('post-drawer')
    expect(drawer).toHaveAttribute('data-open', 'true')
  })

  it('should render video placeholder when video exists', () => {
    const postWithVideo = {
      ...mockPost,
      video: 'test-video.mp4',
    }

    renderWithProviders(<PostCard post={postWithVideo} />, store)

    expect(screen.getByText(/Video Player/)).toBeInTheDocument()
  })

  it('should not render video section when no video', () => {
    renderWithProviders(<PostCard post={mockPost} />, store)

    expect(screen.queryByText(/Video Player/)).not.toBeInTheDocument()
  })

  it('should handle posts without content', () => {
    const postWithoutContent = {
      ...mockPost,
      content: null,
    }

    expect(() => {
      renderWithProviders(<PostCard post={postWithoutContent} />, store)
    }).not.toThrow()
  })

  it('should handle posts without views_count', () => {
    const postWithoutViews = {
      ...mockPost,
      views_count: null,
    }

    renderWithProviders(<PostCard post={postWithoutViews} />, store)

    // Should not crash and view count should not be displayed
    expect(screen.queryByText('10')).not.toBeInTheDocument()
  })

  it('should apply correct CSS classes', () => {
    renderWithProviders(<PostCard post={mockPost} />, store)

    const card = screen.getByRole('article') // Card should be an article
    expect(card).toHaveClass('p-4', 'border-gray-700', 'bg-dark-card')
  })

  it('should render formatted date', () => {
    renderWithProviders(<PostCard post={mockPost} />, store)

    // Should show a formatted date (exact format may vary)
    const dateElement = screen.getByText(/·/)
    expect(dateElement).toBeInTheDocument()
  })
})