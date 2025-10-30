// src/components/ui/TextEntity.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Styled Mention component for @username references
 * @param {Object} props
 * @param {string} props.username - The username without @
 * @param {React.ReactNode} props.children - The full mention text (@username)
 * @param {Function} props.onClick - Optional click handler
 */
export const Mention = ({ username, children, onClick }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (onClick) {
      onClick(username);
    } else {
      // Default behavior: navigate to user profile
      navigate(`/${username}`);
    }
  };

  return (
    <span
      className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium transition-colors duration-200 underline decoration-blue-400/30 hover:decoration-blue-300/50 underline-offset-2"
      onClick={handleClick}
      role="link"
      tabIndex={0}
      aria-label={`Mention of user ${username}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
    >
      {children}
    </span>
  );
};

/**
 * Styled Hashtag component for #topic references
 * @param {Object} props
 * @param {string} props.tag - The hashtag without #
 * @param {React.ReactNode} props.children - The full hashtag text (#topic)
 * @param {Function} props.onClick - Optional click handler
 */
export const Hashtag = ({ tag, children, onClick }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (onClick) {
      onClick(tag);
    } else {
      // Default behavior: navigate to communities page
      navigate('/communities');
    }
  };

  return (
    <span
      className="text-green-400 hover:text-green-300 cursor-pointer font-medium transition-colors duration-200 underline decoration-green-400/30 hover:decoration-green-300/50 underline-offset-2"
      onClick={handleClick}
      role="link"
      tabIndex={0}
      aria-label={`Hashtag ${tag}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
    >
      {children}
    </span>
  );
};

/**
 * Wrapper component for processed text content
 * Provides consistent styling and spacing
 */
export const ProcessedText = ({ children, className = "" }) => {
  return (
    <div className={`text-gray-300 leading-relaxed ${className}`}>
      {children}
    </div>
  );
};