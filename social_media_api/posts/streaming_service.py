"""
Streaming Service Integration Module

Handles integration with external live streaming services (Mux, AWS MediaLive, etc.)
for video ingestion, transcoding, and delivery.
"""

import os
import logging
from typing import Dict, Optional, Tuple
from django.conf import settings
from mux_python import ApiClient, Configuration
from mux_python.api.live_streams_api import LiveStreamsApi
from mux_python.models.create_live_stream_request import CreateLiveStreamRequest
from mux_python.models.update_live_stream_request import UpdateLiveStreamRequest

logger = logging.getLogger(__name__)


class StreamingServiceError(Exception):
    """Custom exception for streaming service errors"""
    pass


class MuxStreamingService:
    """
    Mux Video API integration for live streaming.

    Handles:
    - Creating live streams in Mux
    - Managing stream lifecycle (start/stop)
    - Retrieving stream URLs and keys
    - Processing webhooks from Mux
    """

    def __init__(self):
        self.token_id = getattr(settings, 'MUX_TOKEN_ID', os.getenv('MUX_TOKEN_ID'))
        self.token_secret = getattr(settings, 'MUX_TOKEN_SECRET', os.getenv('MUX_TOKEN_SECRET'))
        self.webhook_secret = getattr(settings, 'MUX_WEBHOOK_SECRET', os.getenv('MUX_WEBHOOK_SECRET'))

        if not all([self.token_id, self.token_secret]):
            raise StreamingServiceError("Mux credentials not configured")

        # Configure Mux API client
        configuration = Configuration()
        configuration.username = self.token_id
        configuration.password = self.token_secret

        self.api_client = ApiClient(configuration)
        self.live_streams_api = LiveStreamsApi(self.api_client)

    def create_live_stream(self, title: str, description: str = "") -> Dict:
        """
        Create a new live stream in Mux.

        Args:
            title: Stream title
            description: Optional stream description

        Returns:
            Dict containing stream details:
            {
                'stream_key': str,
                'rtmp_url': str,
                'playback_url': str,
                'mux_stream_id': str
            }
        """
        try:
            # Create live stream request
            create_request = CreateLiveStreamRequest(
                playback_policy=["public"],
                new_asset_settings={
                    "playback_policy": ["public"]
                }
            )

            # Add metadata
            if title:
                create_request.stream_key = f"{title.lower().replace(' ', '_')[:20]}_{os.urandom(4).hex()}"

            logger.info(f"Creating Mux live stream: {title}")

            # Create the stream
            api_response = self.live_streams_api.create_live_stream(create_request)

            return {
                'stream_key': api_response.data.stream_key,
                'rtmp_url': f"rtmp://global-live.mux.com:5222/app",
                'playback_url': api_response.data.playback_ids[0].id if api_response.data.playback_ids else None,
                'mux_stream_id': api_response.data.id,
                'status': 'created'
            }

        except Exception as e:
            logger.error(f"Failed to create Mux live stream: {e}")
            raise StreamingServiceError(f"Failed to create live stream: {str(e)}")

    def get_stream_status(self, mux_stream_id: str) -> Dict:
        """
        Get the current status of a live stream.

        Args:
            mux_stream_id: Mux stream ID

        Returns:
            Dict with stream status information
        """
        try:
            api_response = self.live_streams_api.get_live_stream(mux_stream_id)

            return {
                'status': api_response.data.status,
                'playback_url': api_response.data.playback_ids[0].id if api_response.data.playback_ids else None,
                'stream_key': api_response.data.stream_key,
                'created_at': api_response.data.created_at,
                'is_live': api_response.data.status == 'active'
            }

        except Exception as e:
            logger.error(f"Failed to get stream status: {e}")
            raise StreamingServiceError(f"Failed to get stream status: {str(e)}")

    def delete_live_stream(self, mux_stream_id: str) -> bool:
        """
        Delete a live stream from Mux.

        Args:
            mux_stream_id: Mux stream ID

        Returns:
            True if successful
        """
        try:
            self.live_streams_api.delete_live_stream(mux_stream_id)
            logger.info(f"Deleted Mux live stream: {mux_stream_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete Mux live stream: {e}")
            raise StreamingServiceError(f"Failed to delete live stream: {str(e)}")

    def enable_live_stream(self, mux_stream_id: str) -> bool:
        """
        Enable/start a live stream.

        Args:
            mux_stream_id: Mux stream ID

        Returns:
            True if successful
        """
        try:
            update_request = UpdateLiveStreamRequest(status="enabled")
            self.live_streams_api.update_live_stream(mux_stream_id, update_request)
            logger.info(f"Enabled Mux live stream: {mux_stream_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to enable live stream: {e}")
            raise StreamingServiceError(f"Failed to enable live stream: {str(e)}")

    def disable_live_stream(self, mux_stream_id: str) -> bool:
        """
        Disable/stop a live stream.

        Args:
            mux_stream_id: Mux stream ID

        Returns:
            True if successful
        """
        try:
            update_request = UpdateLiveStreamRequest(status="disabled")
            self.live_streams_api.update_live_stream(mux_stream_id, update_request)
            logger.info(f"Disabled Mux live stream: {mux_stream_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to disable live stream: {e}")
            raise StreamingServiceError(f"Failed to disable live stream: {str(e)}")


# Global service instance
_streaming_service = None


def get_streaming_service() -> MuxStreamingService:
    """Get the global streaming service instance"""
    global _streaming_service
    if _streaming_service is None:
        _streaming_service = MuxStreamingService()
    return _streaming_service


def create_live_stream(title: str, description: str = "") -> Dict:
    """
    Convenience function to create a live stream.

    Args:
        title: Stream title
        description: Optional description

    Returns:
        Dict with stream details
    """
    service = get_streaming_service()
    return service.create_live_stream(title, description)


def get_stream_status(mux_stream_id: str) -> Dict:
    """
    Convenience function to get stream status.

    Args:
        mux_stream_id: Mux stream ID

    Returns:
        Dict with status information
    """
    service = get_streaming_service()
    return service.get_stream_status(mux_stream_id)


def delete_stream(mux_stream_id: str) -> bool:
    """
    Convenience function to delete a stream.

    Args:
        mux_stream_id: Mux stream ID

    Returns:
        True if successful
    """
    service = get_streaming_service()
    return service.delete_live_stream(mux_stream_id)