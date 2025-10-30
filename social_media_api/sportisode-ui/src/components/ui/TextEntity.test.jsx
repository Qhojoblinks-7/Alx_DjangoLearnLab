import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Mention, Hashtag, ProcessedText } from './TextEntity.jsx'

describe('TextEntity Components', () => {
  describe('Mention', () => {
    it('should render mention with correct text and username', () => {
      render(<Mention username="john">@john</Mention>)

      const mention = screen.getByText('@john')
      expect(mention).toBeInTheDocument()
      expect(mention).toHaveAttribute('aria-label', 'Mention of user john')
    })

    it('should have correct styling classes', () => {
      render(<Mention username="john">@john</Mention>)

      const mention = screen.getByText('@john')
      expect(mention).toHaveClass(
        'text-blue-400',
        'hover:text-blue-300',
        'cursor-pointer',
        'font-medium',
        'transition-colors',
        'underline',
        'underline-offset-2'
      )
    })

    it('should call onClick handler when clicked', async () => {
      const mockOnClick = vi.fn()
      const user = userEvent.setup()

      render(<Mention username="john" onClick={mockOnClick}>@john</Mention>)

      const mention = screen.getByText('@john')
      await user.click(mention)

      expect(mockOnClick).toHaveBeenCalledWith('john')
    })

    it('should be keyboard accessible', async () => {
      const mockOnClick = vi.fn()
      const user = userEvent.setup()

      render(<Mention username="john" onClick={mockOnClick}>@john</Mention>)

      const mention = screen.getByText('@john')
      expect(mention).toHaveAttribute('tabIndex', '0')

      mention.focus()
      await user.keyboard('{Enter}')

      expect(mockOnClick).toHaveBeenCalledWith('john')
    })

    it('should prevent event bubbling', async () => {
      const mockOnClick = vi.fn()
      const mockParentClick = vi.fn()
      const user = userEvent.setup()

      render(
        <div onClick={mockParentClick}>
          <Mention username="john" onClick={mockOnClick}>@john</Mention>
        </div>
      )

      const mention = screen.getByText('@john')
      await user.click(mention)

      expect(mockOnClick).toHaveBeenCalledWith('john')
      expect(mockParentClick).not.toHaveBeenCalled()
    })
  })

  describe('Hashtag', () => {
    it('should render hashtag with correct text and tag', () => {
      render(<Hashtag tag="sports">#sports</Hashtag>)

      const hashtag = screen.getByText('#sports')
      expect(hashtag).toBeInTheDocument()
      expect(hashtag).toHaveAttribute('aria-label', 'Hashtag sports')
    })

    it('should have correct styling classes', () => {
      render(<Hashtag tag="sports">#sports</Hashtag>)

      const hashtag = screen.getByText('#sports')
      expect(hashtag).toHaveClass(
        'text-green-400',
        'hover:text-green-300',
        'cursor-pointer',
        'font-medium',
        'transition-colors',
        'underline',
        'underline-offset-2'
      )
    })

    it('should call onClick handler when clicked', async () => {
      const mockOnClick = vi.fn()
      const user = userEvent.setup()

      render(<Hashtag tag="sports" onClick={mockOnClick}>#sports</Hashtag>)

      const hashtag = screen.getByText('#sports')
      await user.click(hashtag)

      expect(mockOnClick).toHaveBeenCalledWith('sports')
    })

    it('should be keyboard accessible', async () => {
      const mockOnClick = vi.fn()
      const user = userEvent.setup()

      render(<Hashtag tag="sports" onClick={mockOnClick}>#sports</Hashtag>)

      const hashtag = screen.getByText('#sports')
      expect(hashtag).toHaveAttribute('tabIndex', '0')

      hashtag.focus()
      await user.keyboard('{Enter}')

      expect(mockOnClick).toHaveBeenCalledWith('sports')
    })

    it('should prevent event bubbling', async () => {
      const mockOnClick = vi.fn()
      const mockParentClick = vi.fn()
      const user = userEvent.setup()

      render(
        <div onClick={mockParentClick}>
          <Hashtag tag="sports" onClick={mockOnClick}>#sports</Hashtag>
        </div>
      )

      const hashtag = screen.getByText('#sports')
      await user.click(hashtag)

      expect(mockOnClick).toHaveBeenCalledWith('sports')
      expect(mockParentClick).not.toHaveBeenCalled()
    })
  })

  describe('ProcessedText', () => {
    it('should render children with correct styling', () => {
      render(
        <ProcessedText>
          <span>Hello</span>
          <span>World</span>
        </ProcessedText>
      )

      const container = screen.getByText('Hello').parentElement
      expect(container).toHaveClass('text-gray-300', 'leading-relaxed')
    })

    it('should apply custom className', () => {
      render(
        <ProcessedText className="custom-class">
          <span>Test</span>
        </ProcessedText>
      )

      const container = screen.getByText('Test').parentElement
      expect(container).toHaveClass('text-gray-300', 'leading-relaxed', 'custom-class')
    })

    it('should render as div element', () => {
      render(
        <ProcessedText>
          <span>Content</span>
        </ProcessedText>
      )

      const container = screen.getByText('Content').parentElement
      expect(container.tagName).toBe('DIV')
    })
  })
})