// src/components/LiveStreamCreator.jsx

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Calendar, Lock, Unlock, Copy, ExternalLink, Play, Monitor } from 'lucide-react';

import { Textarea } from './components/ui/textarea';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import ProfilePicture from './ProfilePicture';

import { createLiveStreamAsync, setActiveModal } from '../store/liveStreamSlice';

const LiveStreamCreator = ({ onClose }) => {
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const { creatingStream, createStreamError, createdStream, activeModal } = useSelector(state => state.liveStream);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        scheduled_start: '',
        thumbnail_url: '',
        tags: '',
        is_private: false,
    });

    const showBroadcasting = activeModal === 'broadcasting' && createdStream;

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const trimmedTitle = formData.title.trim();
        const trimmedDescription = formData.description.trim();

        if (trimmedTitle.length === 0) {
            alert("A live stream must have a title.");
            return;
        }

        const streamData = {
            title: trimmedTitle,
            is_private: formData.is_private,
        };

        // Add optional fields if they have values
        if (trimmedDescription) {
            streamData.description = trimmedDescription;
        }
        if (formData.scheduled_start) {
            streamData.scheduled_start = formData.scheduled_start; // Send as string from datetime-local input
        }
        if (formData.thumbnail_url) {
            streamData.thumbnail_url = formData.thumbnail_url;
        }
        if (formData.tags) {
            streamData.tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }

        dispatch(createLiveStreamAsync(streamData));
    };

    const isButtonDisabled = creatingStream || formData.title.trim().length === 0;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <div className="p-4">
            {showBroadcasting && createdStream ? (
                // Broadcasting Instructions View
                <div className="space-y-4">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Play className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Stream Created Successfully!</h3>
                        <p className="text-gray-300">Your stream is ready. Use the details below to start broadcasting.</p>
                    </div>

                    <div className="bg-dark-card border border-gray-700 rounded-lg p-4 space-y-4">
                        <div>
                            <Label className="text-white font-semibold flex items-center">
                                <Monitor className="h-4 w-4 mr-2" />
                                Broadcasting Software Setup
                            </Label>
                            <p className="text-sm text-gray-400 mt-1">
                                Use OBS Studio or similar software to broadcast your stream.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <Label className="text-white text-sm">Server/RTMP URL</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <Input
                                        value={createdStream.stream_url || "rtmp://global-live.mux.com:5222/app"}
                                        readOnly
                                        className="bg-gray-800 border-gray-600 text-white text-sm"
                                    />
                                    <Button
                                        onClick={() => copyToClipboard(createdStream.stream_url || "rtmp://global-live.mux.com:5222/app")}
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label className="text-white text-sm">Stream Key</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <Input
                                        value={createdStream.stream_key || "Not available"}
                                        readOnly
                                        className="bg-gray-800 border-gray-600 text-white text-sm font-mono"
                                    />
                                    <Button
                                        onClick={() => copyToClipboard(createdStream.stream_key || "Not available")}
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                            <h4 className="text-blue-400 font-semibold text-sm mb-2">Setup Instructions:</h4>
                            <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                                <li>Download and open OBS Studio</li>
                                <li>Go to Settings → Stream</li>
                                <li>Select "Custom" as the service</li>
                                <li>Paste the Server URL and Stream Key above</li>
                                <li>Click "Start Streaming" in OBS</li>
                                <li>Your stream will appear live on the platform!</li>
                            </ol>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                        <Button
                            onClick={() => dispatch(setActiveModal('create'))}
                            variant="outline"
                        >
                            Back to Form
                        </Button>
                        <div className="flex space-x-2">
                            <Button
                                onClick={() => window.open('https://obsproject.com/download', '_blank')}
                                variant="outline"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Download OBS
                            </Button>
                            <Button onClick={onClose}>
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                // Stream Creation Form View
                <>
                    <div className="flex space-x-3">
                        <ProfilePicture user={user} size="h-10 w-10" />

                        <div className="flex-1">
                    {/* Title Input */}
                    <div className="mb-4">
                        <Label htmlFor="title" className="text-white text-sm font-medium">Stream Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="What's your live stream about?"
                            maxLength={100}
                            className="bg-transparent border-gray-700 focus-visible:ring-sport-accent text-white mt-1"
                        />
                    </div>

                    {/* Description Textarea */}
                    <div className="mb-4">
                        <Label htmlFor="description" className="text-white text-sm font-medium">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Describe your live stream..."
                            maxLength={500}
                            className="bg-transparent border-gray-700 focus-visible:ring-sport-accent text-white resize-none min-h-[100px] mt-1"
                            rows={4}
                        />
                    </div>

                    {/* Scheduled Start */}
                    <div className="mb-4">
                        <Label htmlFor="scheduled_start" className="text-white text-sm font-medium flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Scheduled Start (Optional)
                        </Label>
                        <Input
                            id="scheduled_start"
                            type="datetime-local"
                            value={formData.scheduled_start}
                            onChange={(e) => handleInputChange('scheduled_start', e.target.value)}
                            className="bg-transparent border-gray-700 focus-visible:ring-sport-accent text-white mt-1"
                        />
                    </div>

                    {/* Thumbnail URL */}
                    <div className="mb-4">
                        <Label htmlFor="thumbnail_url" className="text-white text-sm font-medium">Thumbnail URL (Optional)</Label>
                        <Input
                            id="thumbnail_url"
                            value={formData.thumbnail_url}
                            onChange={(e) => handleInputChange('thumbnail_url', e.target.value)}
                            placeholder="https://example.com/thumbnail.jpg"
                            className="bg-transparent border-gray-700 focus-visible:ring-sport-accent text-white mt-1"
                        />
                    </div>

                    {/* Tags */}
                    <div className="mb-4">
                        <Label htmlFor="tags" className="text-white text-sm font-medium">Tags (Optional)</Label>
                        <Input
                            id="tags"
                            value={formData.tags}
                            onChange={(e) => handleInputChange('tags', e.target.value)}
                            placeholder="sports, football, live (comma separated)"
                            className="bg-transparent border-gray-700 focus-visible:ring-sport-accent text-white mt-1"
                        />
                    </div>

                    {/* Privacy Toggle */}
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={() => handleInputChange('is_private', !formData.is_private)}
                            className="flex items-center space-x-2 text-white hover:text-sport-accent transition-colors"
                        >
                            {formData.is_private ? (
                                <Lock className="h-4 w-4" />
                            ) : (
                                <Unlock className="h-4 w-4" />
                            )}
                            <span className="text-sm">
                                {formData.is_private ? 'Private Stream' : 'Public Stream'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-700 mt-4">
                <div className="text-sm text-gray-500">
                    {formData.title.length}/100 characters
                </div>

                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                        {formData.description.length}/500 characters
                    </span>
                    <Button
                        onClick={handleSubmit}
                        disabled={isButtonDisabled}
                        className={`rounded-full font-bold px-4 py-2 ${isButtonDisabled ? 'bg-sport-accent/50 cursor-not-allowed' : 'bg-sport-accent text-black hover:bg-sport-accent/90'}`}
                    >
                        {creatingStream ? 'Creating...' : 'Go Live'}
                    </Button>
                </div>
            </div>
            {createStreamError && <p className="text-red-500 text-sm mt-2">Could not create live stream: {createStreamError}</p>}
        </>
        )}
    </div>
    );
};

export default LiveStreamCreator;