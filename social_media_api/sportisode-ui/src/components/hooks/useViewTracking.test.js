import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useViewTracking from './useViewTracking.js'

// Mock the authenticatedFetch function
vi.mock('../../lib/api.js', () => ({
  authenticatedFetch: vi.fn()
}))

import { authenticatedFetch } from '../../lib/api.js'

describe('useViewTracking', () => {
  let mockIntersectionObserver
  let mockObserve
  let mockUnobserve
  let mockDisconnect

  beforeEach(() => {
    // Setup IntersectionObserver mock
    mockObserve = vi.fn()
    mockUnobserve = vi.fn()
    mockDisconnect = vi.fn()

    mockIntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    }))

    globalThis.IntersectionObserver = mockIntersectionObserver

    // Mock authenticatedFetch
    authenticatedFetch.mockResolvedValue({ ok: true })

    // Mock timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.clearAllMocks()
  })

  it('should return a ref object', () => {
    const { result } = renderHook(() => useViewTracking(1))
    expect(result.current).toHaveProperty('current')
    expect(result.current.current).toBeNull()
  })

  it('should setup IntersectionObserver with correct options', () => {
    renderHook(() => useViewTracking(1, {
      threshold: 0.5,
      timeThreshold: 500
    }))

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        threshold: 0.5,
        rootMargin: '0px',
      }
    )
  })

  it('should observe element when ref is set', () => {
    const { result } = renderHook(() => useViewTracking(1))

    // Simulate element being set
    const mockElement = document.createElement('div')
    act(() => {
      result.current.current = mockElement
    })

    expect(mockObserve).toHaveBeenCalledWith(mockElement)
  })

  it('should not observe when disabled', () => {
    renderHook(() => useViewTracking(1, { enabled: false }))

    expect(mockObserve).not.toHaveBeenCalled()
  })

  it('should call recordView after time threshold when element becomes visible', () => {
    const { result } = renderHook(() => useViewTracking(1, {
      timeThreshold: 500
    }))

    const mockElement = document.createElement('div')
    result.current.current = mockElement

    // Simulate element becoming visible
    const mockCallback = mockIntersectionObserver.mock.calls[0][0]
    act(() => {
      mockCallback([{ isIntersecting: true }])
    })

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(authenticatedFetch).toHaveBeenCalledWith('/posts/1/view/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        view_type: 'feed',
        timestamp: expect.any(String),
      }),
    })
  })

  it('should not call recordView if element becomes invisible before threshold', () => {
    const { result } = renderHook(() => useViewTracking(1, {
      timeThreshold: 500
    }))

    const mockElement = document.createElement('div')
    result.current.current = mockElement

    // Simulate element becoming visible
    const mockCallback = mockIntersectionObserver.mock.calls[0][0]
    act(() => {
      mockCallback([{ isIntersecting: true }])
    })

    // Simulate element becoming invisible before threshold
    act(() => {
      mockCallback([{ isIntersecting: false }])
    })

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(authenticatedFetch).not.toHaveBeenCalled()
  })

  it('should not record view twice for same post', async () => {
    const { result } = renderHook(() => useViewTracking(1, {
      timeThreshold: 100
    }))

    const mockElement = document.createElement('div')
    result.current.current = mockElement

    const mockCallback = mockIntersectionObserver.mock.calls[0][0]

    // First view
    act(() => {
      mockCallback([{ isIntersecting: true }])
    })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Second view attempt
    act(() => {
      mockCallback([{ isIntersecting: true }])
    })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(authenticatedFetch).toHaveBeenCalledTimes(1)
  })

  it('should reset view tracking when postId changes', () => {
    const { rerender } = renderHook(
      ({ postId }) => useViewTracking(postId),
      { initialProps: { postId: 1 } }
    )

    const mockElement = document.createElement('div')

    // Set element and trigger view
    act(() => {
      rerender({ postId: 1 })
      const hookResult = renderHook(() => useViewTracking(1))
      hookResult.result.current.current = mockElement
    })

    // Change postId
    act(() => {
      rerender({ postId: 2 })
    })

    // Should be able to view again
    const mockCallback = mockIntersectionObserver.mock.calls[0][0]
    act(() => {
      mockCallback([{ isIntersecting: true }])
    })
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(authenticatedFetch).toHaveBeenCalledWith('/posts/2/view/', expect.any(Object))
  })

  it('should handle API errors gracefully', () => {
    authenticatedFetch.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useViewTracking(1, {
      timeThreshold: 100
    }))

    const mockElement = document.createElement('div')
    result.current.current = mockElement

    const mockCallback = mockIntersectionObserver.mock.calls[0][0]
    act(() => {
      mockCallback([{ isIntersecting: true }])
    })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Should not throw error, just log warning
    expect(authenticatedFetch).toHaveBeenCalled()
  })

  it('should cleanup timers and observers on unmount', () => {
    const { unmount } = renderHook(() => useViewTracking(1))

    unmount()

    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('should use custom view type', () => {
    const { result } = renderHook(() => useViewTracking(1, {
      viewType: 'detail',
      timeThreshold: 100
    }))

    const mockElement = document.createElement('div')
    result.current.current = mockElement

    const mockCallback = mockIntersectionObserver.mock.calls[0][0]
    act(() => {
      mockCallback([{ isIntersecting: true }])
    })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(authenticatedFetch).toHaveBeenCalledWith('/posts/1/view/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        view_type: 'detail',
        timestamp: expect.any(String),
      }),
    })
  })
})