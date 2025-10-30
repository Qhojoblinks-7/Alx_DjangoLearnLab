import { describe, it, expect } from 'vitest'
import { processTextWithEntities, hasEntities, extractMentions, extractHashtags } from './textProcessor.jsx'

describe('textProcessor', () => {
  describe('processTextWithEntities', () => {
    it('should return empty array for null/undefined input', () => {
      expect(processTextWithEntities(null)).toEqual([])
      expect(processTextWithEntities(undefined)).toEqual([])
      expect(processTextWithEntities('')).toEqual([])
    })

    it('should return plain text span for text without entities', () => {
      const result = processTextWithEntities('Hello world')
      expect(result).toHaveLength(1)
      expect(result[0].props.children).toBe('Hello world')
    })

    it('should process mentions correctly', () => {
      const result = processTextWithEntities('Hello @john!')
      expect(result).toHaveLength(3) // "Hello ", <Mention>, "!"

      // Check plain text
      expect(result[0].props.children).toBe('Hello ')

      // Check mention component
      expect(result[1].props.username).toBe('john')
      expect(result[1].props.children).toBe('@john')

      // Check remaining text
      expect(result[2].props.children).toBe('!')
    })

    it('should process hashtags correctly', () => {
      const result = processTextWithEntities('Check out #sports!')
      expect(result).toHaveLength(3) // "Check out ", <Hashtag>, "!"

      expect(result[0].props.children).toBe('Check out ')
      expect(result[1].props.tag).toBe('sports')
      expect(result[1].props.children).toBe('#sports')
      expect(result[2].props.children).toBe('!')
    })

    it('should process both mentions and hashtags in same text', () => {
      const result = processTextWithEntities('@alice shared #awesome content!')
      expect(result).toHaveLength(5)

      expect(result[0].props.children).toBe('')
      expect(result[1].props.username).toBe('alice')
      expect(result[2].props.children).toBe(' shared ')
      expect(result[3].props.tag).toBe('awesome')
      expect(result[4].props.children).toBe(' content!')
    })

    it('should handle multiple entities', () => {
      const result = processTextWithEntities('@user1 and @user2 love #sport and #football')
      expect(result).toHaveLength(7)

      expect(result[1].props.username).toBe('user1')
      expect(result[3].props.username).toBe('user2')
      expect(result[5].props.tag).toBe('sport')
      expect(result[6].props.tag).toBe('football')
    })

    it('should handle entities at start and end', () => {
      const result = processTextWithEntities('@start middle #end')
      expect(result).toHaveLength(3)

      expect(result[0].props.username).toBe('start')
      expect(result[1].props.children).toBe(' middle ')
      expect(result[2].props.tag).toBe('end')
    })

    it('should handle consecutive entities', () => {
      const result = processTextWithEntities('@user1@user2#tag1#tag2')
      expect(result).toHaveLength(4)

      expect(result[0].props.username).toBe('user1')
      expect(result[1].props.username).toBe('user2')
      expect(result[2].props.tag).toBe('tag1')
      expect(result[3].props.tag).toBe('tag2')
    })
  })

  describe('hasEntities', () => {
    it('should return false for null/undefined/empty input', () => {
      expect(hasEntities(null)).toBe(false)
      expect(hasEntities(undefined)).toBe(false)
      expect(hasEntities('')).toBe(false)
    })

    it('should return true when mentions are present', () => {
      expect(hasEntities('Hello @user!')).toBe(true)
      expect(hasEntities('@user')).toBe(true)
    })

    it('should return true when hashtags are present', () => {
      expect(hasEntities('Check #tag!')).toBe(true)
      expect(hasEntities('#tag')).toBe(true)
    })

    it('should return true when both mentions and hashtags are present', () => {
      expect(hasEntities('@user #tag')).toBe(true)
    })

    it('should return false when no entities are present', () => {
      expect(hasEntities('Hello world')).toBe(false)
      expect(hasEntities('user tag')).toBe(false)
    })
  })

  describe('extractMentions', () => {
    it('should return empty array for null/undefined/empty input', () => {
      expect(extractMentions(null)).toEqual([])
      expect(extractMentions(undefined)).toEqual([])
      expect(extractMentions('')).toEqual([])
    })

    it('should extract single mention', () => {
      expect(extractMentions('Hello @user!')).toEqual(['user'])
    })

    it('should extract multiple mentions', () => {
      expect(extractMentions('@alice and @bob')).toEqual(['alice', 'bob'])
    })

    it('should remove duplicates', () => {
      expect(extractMentions('@user @user')).toEqual(['user'])
    })

    it('should handle mentions with special characters', () => {
      expect(extractMentions('@user_name @user-name')).toEqual(['user_name', 'user-name'])
    })

    it('should not extract invalid mentions', () => {
      expect(extractMentions('@ @user @')).toEqual(['user'])
    })
  })

  describe('extractHashtags', () => {
    it('should return empty array for null/undefined/empty input', () => {
      expect(extractHashtags(null)).toEqual([])
      expect(extractHashtags(undefined)).toEqual([])
      expect(extractHashtags('')).toEqual([])
    })

    it('should extract single hashtag', () => {
      expect(extractHashtags('Check #sports!')).toEqual(['sports'])
    })

    it('should extract multiple hashtags', () => {
      expect(extractHashtags('#nba #football')).toEqual(['nba', 'football'])
    })

    it('should remove duplicates', () => {
      expect(extractHashtags('#tag #tag')).toEqual(['tag'])
    })

    it('should handle hashtags with special characters', () => {
      expect(extractHashtags('#tag_name #tag-name')).toEqual(['tag_name', 'tag-name'])
    })

    it('should not extract invalid hashtags', () => {
      expect(extractHashtags('# #tag #')).toEqual(['tag'])
    })
  })
})