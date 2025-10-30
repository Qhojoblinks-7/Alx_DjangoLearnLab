import React, { useRef, useState, useEffect } from 'react';
import { Smile, Image, Gift, Send, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';

// --- Emoji Picker Component ---
const EmojiPicker = ({ isOpen, onClose, onSelectEmoji }) => {
    const emojis = [
        '😀', '😂', '😊', '😍', '🥰', '😘', '😉', '😎', '🤔', '😮',
        '😢', '😭', '😤', '😡', '🥺', '😴', '🤤', '😵', '🤐', '🤗',
        '👍', '👎', '👌', '✌️', '🤞', '👏', '🙌', '🤝', '🙏', '✍️',
        '❤️', '💔', '💕', '💖', '💯', '🔥', '⭐', '✨', '💫', '🌟'
    ];

    if (!isOpen) return null;

    return (
        <div data-emoji-picker className="absolute bottom-full left-0 mb-2 bg-dark-card border border-gray-700 rounded-lg p-3 shadow-lg z-20 max-w-xs">
            <div className="grid grid-cols-10 gap-1">
                {emojis.map((emoji, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            onSelectEmoji(emoji);
                            onClose();
                        }}
                        className="w-8 h-8 hover:bg-gray-700 rounded flex items-center justify-center text-lg transition-colors"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- GIF Picker Component ---
const GifPicker = ({ isOpen, onClose, onSelectGif }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [gifs, setGifs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Mock GIF data - in real implementation, this would call Giphy/Tenor API
    const mockGifs = [
        { id: '1', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', title: 'Happy' },
        { id: '2', url: 'https://media.giphy.com/media/3o7TKMt1VVNk0JEwdW/giphy.gif', title: 'Excited' },
        { id: '3', url: 'https://media.giphy.com/media/l0MYJnJQ4EiYLvKJy/giphy.gif', title: 'Thinking' },
        { id: '4', url: 'https://media.giphy.com/media/3o7TKz9qX9Z8JfZ4Z2/giphy.gif', title: 'Love' },
        { id: '5', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', title: 'Sad' },
        { id: '6', url: 'https://media.giphy.com/media/3o7TKVHxFg8ZvYzZ4E/giphy.gif', title: 'Angry' },
        { id: '7', url: 'https://media.giphy.com/media/l0MYyDa8S9ghhBFxq/giphy.gif', title: 'Surprised' },
        { id: '8', url: 'https://media.giphy.com/media/3o7TKMt1VVNk0JEwdW/giphy.gif', title: 'Sleepy' },
    ];

    useEffect(() => {
        if (isOpen) {
            setGifs(mockGifs);
        }
    }, [isOpen]);

    const handleSearch = (term) => {
        setSearchTerm(term);
        setIsLoading(true);
        // Mock search delay
        setTimeout(() => {
            const filtered = mockGifs.filter(gif =>
                gif.title.toLowerCase().includes(term.toLowerCase())
            );
            setGifs(filtered);
            setIsLoading(false);
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div data-gif-picker className="absolute bottom-full left-0 mb-2 bg-dark-card border border-gray-700 rounded-lg shadow-lg z-20 w-80 max-h-96 overflow-hidden">
            {/* Search Header */}
            <div className="p-3 border-b border-gray-700">
                <input
                    type="text"
                    placeholder="Search GIFs..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-dark-bg border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-sport-accent focus:outline-none"
                />
            </div>

            {/* GIF Grid */}
            <div className="p-3 max-h-64 overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sport-accent"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {gifs.map((gif) => (
                            <button
                                key={gif.id}
                                onClick={() => {
                                    onSelectGif(gif);
                                    onClose();
                                }}
                                className="relative group rounded overflow-hidden hover:ring-2 hover:ring-sport-accent transition-all"
                            >
                                <img
                                    src={gif.url}
                                    alt={gif.title}
                                    className="w-full h-20 object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                    <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        {gif.title}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Enhanced Text Input Component ---
const EnhancedTextInput = ({
    value,
    onChange,
    onSubmit,
    placeholder = "Type a message...",
    disabled = false,
    isLoading = false,
    showAttachments = true,
    context = 'chat', // 'chat', 'comment', 'reply'
    className = "",
    ...props
}) => {
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    // State for enhanced features
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [selectedGif, setSelectedGif] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Handle emoji selection
    const handleEmojiSelect = (emoji) => {
        onChange(value + emoji);
        setIsEmojiPickerOpen(false);
        textareaRef.current?.focus();
    };

    // Handle GIF selection
    const handleGifSelect = (gif) => {
        setSelectedGif(gif);
        setIsGifPickerOpen(false);
    };

    // Handle image selection
    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedMedia(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle image button click
    const handleImageButtonClick = () => {
        fileInputRef.current?.click();
    };

    // Handle remove image
    const handleRemoveImage = () => {
        setSelectedMedia(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle remove GIF
    const handleRemoveGif = () => {
        setSelectedGif(null);
    };

    // Handle keyboard events
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (!e.shiftKey) {
                // Enter alone submits the message
                e.preventDefault();
                if ((!value.trim() && !selectedMedia && !selectedGif) || disabled || isLoading || isEmojiPickerOpen || isGifPickerOpen) {
                    return;
                }
                onSubmit(e);
            }
            // Shift+Enter allows new line (default behavior)
        }
    };

    // Handle click outside to close popups
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close emoji picker if click is outside
            if (isEmojiPickerOpen) {
                const emojiPicker = document.querySelector('[data-emoji-picker]');
                const emojiButton = document.querySelector('[data-emoji-button]');
                if (emojiPicker && !emojiPicker.contains(event.target) && !emojiButton.contains(event.target)) {
                    setIsEmojiPickerOpen(false);
                }
            }

            // Close GIF picker if click is outside
            if (isGifPickerOpen) {
                const gifPicker = document.querySelector('[data-gif-picker]');
                const gifButton = document.querySelector('[data-gif-button]');
                if (gifPicker && !gifPicker.contains(event.target) && !gifButton.contains(event.target)) {
                    setIsGifPickerOpen(false);
                }
            }
        };

        if (isEmojiPickerOpen || isGifPickerOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isEmojiPickerOpen, isGifPickerOpen]);

    // Determine button text and size based on context
    const getButtonConfig = () => {
        switch (context) {
            case 'comment':
                return { text: 'Comment', size: 'sm' };
            case 'reply':
                return { text: 'Reply', size: 'sm' };
            case 'chat':
            default:
                return { text: null, size: 'icon' };
        }
    };

    const buttonConfig = getButtonConfig();

    return (
        <div className={`relative ${className}`}>
            {/* Media Previews */}
            {(imagePreview || selectedGif) && (
                <div className="mb-3 flex items-center space-x-2">
                    {imagePreview && (
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="Selected image"
                                className="w-16 h-16 object-cover rounded-lg border border-gray-600"
                            />
                            <button
                                onClick={handleRemoveImage}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    {selectedGif && (
                        <div className="relative">
                            <img
                                src={selectedGif.url}
                                alt={selectedGif.title}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-600"
                            />
                            <button
                                onClick={handleRemoveGif}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    <div className="text-sm text-gray-400">
                        {selectedMedia?.name || selectedGif?.title}
                    </div>
                </div>
            )}

            {/* Message Input with Embedded Buttons */}
            <div className="relative">
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="pl-12 pr-12 bg-dark-card border-gray-700 focus:border-sport-accent rounded-2xl text-white min-h-[40px] max-h-[120px] resize-none overflow-y-auto"
                    disabled={disabled || isLoading}
                    rows={1}
                    style={{
                        height: 'auto',
                        minHeight: '40px',
                        maxHeight: '120px'
                    }}
                    onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    {...props}
                />

                {/* Left Side - Attachment Buttons */}
                {showAttachments && (
                    <div className="absolute left-2 bottom-2 flex items-center space-x-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-sport-accent hover:bg-sport-accent/10 rounded-full"
                            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                            data-emoji-button
                        >
                            <Smile className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-sport-accent hover:bg-sport-accent/10 rounded-full"
                            onClick={handleImageButtonClick}
                        >
                            <Image className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-sport-accent hover:bg-sport-accent/10 rounded-full"
                            onClick={() => setIsGifPickerOpen(!isGifPickerOpen)}
                            data-gif-button
                        >
                            <Gift className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Right Side - Send Button */}
                <Button
                    onClick={onSubmit}
                    size={buttonConfig.size}
                    className={`absolute right-2 bottom-2 bg-sport-accent hover:bg-sport-accent/90 text-black rounded-full disabled:opacity-50 ${
                        buttonConfig.size === 'icon' ? 'h-8 w-8' : ''
                    }`}
                    disabled={(!value.trim() && !selectedMedia && !selectedGif) || disabled || isLoading || isEmojiPickerOpen || isGifPickerOpen}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : buttonConfig.text ? (
                        buttonConfig.text
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Emoji Picker */}
            <EmojiPicker
                isOpen={isEmojiPickerOpen}
                onClose={() => setIsEmojiPickerOpen(false)}
                onSelectEmoji={handleEmojiSelect}
            />

            {/* GIF Picker */}
            <GifPicker
                isOpen={isGifPickerOpen}
                onClose={() => setIsGifPickerOpen(false)}
                onSelectGif={handleGifSelect}
            />

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
            />
        </div>
    );
};

export default EnhancedTextInput;