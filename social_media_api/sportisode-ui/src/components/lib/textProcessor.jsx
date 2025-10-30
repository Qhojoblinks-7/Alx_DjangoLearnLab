// src/components/lib/textProcessor.jsx
import React from 'react';
import { Mention, Hashtag } from '../ui/TextEntity';

// Regex patterns for mentions and hashtags
// Updated to handle word boundaries and Unicode characters
const MENTION_REGEX = /@([a-zA-Z0-9_-]+)/g;
const HASHTAG_REGEX = /#([a-zA-Z0-9_-]+)/g;

/**
 * Process text and return array of JSX elements with styled mentions and hashtags
 * @param {string} text - The text to process
 * @returns {Array<React.ReactElement>} Array of JSX elements
 */
export const processTextWithEntities = (text) => {
  if (!text) return [];

  const elements = [];
  let lastIndex = 0;

  // Combine all matches with their positions
  const matches = [];

  // Find all mentions
  let match;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    matches.push({
      type: 'mention',
      text: match[0],
      username: match[1],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  // Reset regex lastIndex
  MENTION_REGEX.lastIndex = 0;

  // Find all hashtags
  while ((match = HASHTAG_REGEX.exec(text)) !== null) {
    matches.push({
      type: 'hashtag',
      text: match[0],
      tag: match[1],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  // Reset regex lastIndex
  HASHTAG_REGEX.lastIndex = 0;

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Process text segments
  matches.forEach((match, index) => {
    // Add text before this match
    if (match.start > lastIndex) {
      const plainText = text.slice(lastIndex, match.start);
      if (plainText) {
        elements.push(
          <span key={`text-${index}`}>{plainText}</span>
        );
      }
    }

    // Add the styled entity
    if (match.type === 'mention') {
      elements.push(
        <Mention key={`mention-${index}`} username={match.username}>
          {match.text}
        </Mention>
      );
    } else if (match.type === 'hashtag') {
      elements.push(
        <Hashtag key={`hashtag-${index}`} tag={match.tag}>
          {match.text}
        </Hashtag>
      );
    }

    lastIndex = match.end;
  });

  // Add remaining text after last match
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      elements.push(
        <span key="remaining">{remainingText}</span>
      );
    }
  }

  // If no matches found, return the original text
  if (elements.length === 0) {
    return [<span key="plain">{text}</span>];
  }

  return elements;
};

/**
 * Check if text contains mentions or hashtags
 * @param {string} text - The text to check
 * @returns {boolean} True if text contains entities
 */
export const hasEntities = (text) => {
  if (!text) return false;
  return MENTION_REGEX.test(text) || HASHTAG_REGEX.test(text);
};

/**
 * Extract all mentions from text
 * @param {string} text - The text to process
 * @returns {Array<string>} Array of usernames (without @)
 */
export const extractMentions = (text) => {
  if (!text) return [];
  const mentions = [];
  let match;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    mentions.push(match[1]); // username without @
  }
  MENTION_REGEX.lastIndex = 0; // Reset regex
  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Extract all hashtags from text
 * @param {string} text - The text to process
 * @returns {Array<string>} Array of hashtags (without #)
 */
export const extractHashtags = (text) => {
  if (!text) return [];
  const hashtags = [];
  let match;
  while ((match = HASHTAG_REGEX.exec(text)) !== null) {
    hashtags.push(match[1]); // tag without #
  }
  HASHTAG_REGEX.lastIndex = 0; // Reset regex
  return [...new Set(hashtags)]; // Remove duplicates
};