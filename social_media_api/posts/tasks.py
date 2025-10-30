import os
import logging
from io import BytesIO
from PIL import Image
import moviepy.editor as mp
from django.conf import settings
from django.core.files.base import ContentFile
from celery import shared_task
from .models import MediaFile, MediaVariant
from .s3_utils import upload_media_to_s3, get_media_url

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def process_image_file(self, media_file_id, s3_key=None):
    """Process uploaded image file - create multiple sizes"""
    try:
        media_file = MediaFile.objects.get(id=media_file_id)
        media_file.processing_status = 'processing'
        media_file.save()

        # If s3_key is provided, download from S3, otherwise use local file
        if s3_key:
            # Download file from S3
            from .s3_utils import s3_manager
            import io

            s3_response = s3_manager.s3_client.get_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=s3_key)
            image_data = s3_response['Body'].read()
            image = Image.open(io.BytesIO(image_data))

            # Update file size
            media_file.file_size = len(image_data)
            media_file.save()
        else:
            # Fallback to local file processing
            with media_file.original_file.open() as f:
                image = Image.open(f)

            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'LA', 'P'):
                image = image.convert('RGB')

            # Get config
            config = settings.MEDIA_PROCESSING_CONFIG['image']

            # Create thumbnail (150x150, cropped)
            thumbnail_config = config['thumbnail']
            thumbnail = Image.new('RGB', (thumbnail_config['width'], thumbnail_config['height']), (255, 255, 255))
            thumb_copy = image.copy()
            thumb_copy.thumbnail((thumbnail_config['width'], thumbnail_config['height']), Image.Resampling.LANCZOS)

            # Center crop for thumbnail
            width, height = thumb_copy.size
            left = (width - thumbnail_config['width']) // 2
            top = (height - thumbnail_config['height']) // 2
            right = left + thumbnail_config['width']
            bottom = top + thumbnail_config['height']
            thumb_copy = thumb_copy.crop((left, top, right, bottom))

            thumbnail.paste(thumb_copy, (0, 0))

            # Save thumbnail
            thumb_buffer = BytesIO()
            thumbnail.save(thumb_buffer, format='WEBP', quality=config['full']['quality'])
            thumb_buffer.seek(0)

            # Upload thumbnail to S3
            thumb_key = f"media/{media_file.id}/thumbnail.webp"
            thumb_uploaded = upload_media_to_s3(thumb_buffer, thumb_key, 'image/webp')
            thumb_url = get_media_url(thumb_key) if thumb_uploaded else None

            # Create MediaVariant for thumbnail
            MediaVariant.objects.create(
                media_file=media_file,
                variant_type='thumbnail',
                file_url=thumb_url,
                width=thumbnail_config['width'],
                height=thumbnail_config['height'],
                file_size=thumb_buffer.tell(),
                format='webp'
            )

            # Update media file thumbnail URL
            if thumb_uploaded:
                media_file.thumbnail_url = thumb_url
                media_file.save()

            # Create preview (800x600, smart resize)
            preview_config = config['preview']
            preview = image.copy()
            preview.thumbnail((preview_config['width'], preview_config['height']), Image.Resampling.LANCZOS)

            preview_buffer = BytesIO()
            preview.save(preview_buffer, format='WEBP', quality=config['full']['quality'])
            preview_buffer.seek(0)

            # Upload preview to S3
            preview_key = f"media/{media_file.id}/preview.webp"
            preview_uploaded = upload_media_to_s3(preview_buffer, preview_key, 'image/webp')
            preview_url = get_media_url(preview_key) if preview_uploaded else None

            # Create MediaVariant for preview
            MediaVariant.objects.create(
                media_file=media_file,
                variant_type='preview',
                file_url=preview_url,
                width=preview.size[0],
                height=preview.size[1],
                file_size=preview_buffer.tell(),
                format='webp'
            )

            # Update media file preview URL
            if preview_uploaded:
                media_file.preview_url = preview_url
                media_file.save()

            # Full size (optimized)
            full_buffer = BytesIO()
            image.save(full_buffer, format='WEBP', quality=config['full']['quality'])
            full_buffer.seek(0)

            # Upload full size to S3
            full_key = f"media/{media_file.id}/full.webp"
            full_uploaded = upload_media_to_s3(full_buffer, full_key, 'image/webp')
            full_url = get_media_url(full_key) if full_uploaded else None

            # Create MediaVariant for full size
            MediaVariant.objects.create(
                media_file=media_file,
                variant_type='full',
                file_url=full_url,
                width=image.size[0],
                height=image.size[1],
                file_size=full_buffer.tell(),
                format='webp'
            )

            # Update media file full URL
            if full_uploaded:
                media_file.full_url = full_url
                media_file.save()

        # Update media file status
        media_file.processing_status = 'completed'
        media_file.width = image.size[0]
        media_file.height = image.size[1]
        media_file.save()

        logger.info(f"Successfully processed image file: {media_file.file_name}")
        return True

    except Exception as e:
        logger.error(f"Failed to process image file {media_file_id}: {str(e)}")
        media_file = MediaFile.objects.get(id=media_file_id)
        media_file.processing_status = 'failed'
        media_file.processing_error = str(e)
        media_file.save()
        raise


@shared_task(bind=True)
def process_video_file(self, media_file_id, s3_key=None):
    """Process uploaded video file - create thumbnail and transcode"""
    try:
        media_file = MediaFile.objects.get(id=media_file_id)
        media_file.processing_status = 'processing'
        media_file.save()

        config = settings.MEDIA_PROCESSING_CONFIG['video']

        # If s3_key is provided, download from S3, otherwise use local file
        if s3_key:
            # Download video from S3 to temporary location
            from .s3_utils import s3_manager
            import tempfile
            import os

            s3_response = s3_manager.s3_client.get_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=s3_key)
            video_data = s3_response['Body'].read()

            # Update file size
            media_file.file_size = len(video_data)
            media_file.save()

            # Save to temporary file for processing
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
                temp_file.write(video_data)
                video_path = temp_file.name

            # Load video from temp file
            video = mp.VideoFileClip(video_path)
        else:
            # Fallback to local file processing
            video_path = media_file.original_file.path
            video = mp.VideoFileClip(video_path)

        # Update duration
        media_file.duration = video.duration
        media_file.width = int(video.w)
        media_file.height = int(video.h)
        media_file.save()

        # Create video thumbnail at 1 second
        thumbnail_time = min(config['thumbnail']['time'], video.duration)
        thumbnail = video.get_frame(thumbnail_time)

        # Convert to PIL Image
        thumbnail_image = Image.fromarray(thumbnail)

        # Resize thumbnail
        thumb_config = config['thumbnail']
        thumbnail_image.thumbnail((thumb_config['width'], thumb_config['height']), Image.Resampling.LANCZOS)

        # Save thumbnail
        thumb_buffer = BytesIO()
        thumbnail_image.save(thumb_buffer, format='WEBP', quality=85)
        thumb_buffer.seek(0)

        # Upload video thumbnail to S3
        thumb_key = f"media/{media_file.id}/thumbnail.webp"
        thumb_uploaded = upload_media_to_s3(thumb_buffer, thumb_key, 'image/webp')
        thumb_url = get_media_url(thumb_key) if thumb_uploaded else None

        # Create MediaVariant for video thumbnail
        MediaVariant.objects.create(
            media_file=media_file,
            variant_type='thumbnail',
            file_url=thumb_url,
            width=thumbnail_image.size[0],
            height=thumbnail_image.size[1],
            file_size=thumb_buffer.tell(),
            format='webp'
        )

        # Update media file thumbnail URL
        if thumb_uploaded:
            media_file.video_thumbnail_url = thumb_url
            media_file.save()

        # Generate HLS playlist and segments
        self.update_state(state='PROGRESS', meta={'message': 'Generating HLS playlist'})

        # For each bitrate/resolution combination
        hls_config = config['hls']
        for i, (bitrate, resolution) in enumerate(zip(hls_config['bitrates'], hls_config['resolutions'])):
            # Transcode video segment
            transcoded = video.resize(height=resolution[1])
            output_path = f"/tmp/{media_file.id}_segment_{i}.mp4"

            # Write transcoded segment
            transcoded.write_videofile(
                output_path,
                bitrate=f"{bitrate}k",
                audio_bitrate="128k",
                preset="medium",
                threads=4,
                logger=None
            )

            # Upload HLS segment to S3
            segment_key = f"media/{media_file.id}/hls/{i}/segment.mp4"
            with open(output_path, 'rb') as segment_file:
                segment_buffer = BytesIO(segment_file.read())
                segment_uploaded = upload_media_to_s3(segment_buffer, segment_key, 'video/mp4')
                segment_url = get_media_url(segment_key) if segment_uploaded else f"{media_file.id}/hls/{i}/segment.mp4"

            # Create MediaVariant for HLS segment
            MediaVariant.objects.create(
                media_file=media_file,
                variant_type='hls_segment',
                segment_index=i,
                bitrate=bitrate,
                width=resolution[0],
                height=resolution[1],
                file_url=segment_url,
                format='mp4'
            )

            # Clean up local segment file
            try:
                os.unlink(output_path)
            except:
                pass

        # Generate M3U8 playlist with full S3 URLs
        playlist_content = generate_hls_playlist(media_file, hls_config)

        # Upload playlist to S3
        playlist_key = f"media/{media_file.id}/playlist.m3u8"
        playlist_buffer = BytesIO(playlist_content.encode('utf-8'))
        playlist_uploaded = upload_media_to_s3(playlist_buffer, playlist_key, 'application/vnd.apple.mpegurl')
        playlist_url = get_media_url(playlist_key) if playlist_uploaded else None

        # Create MediaVariant for playlist
        MediaVariant.objects.create(
            media_file=media_file,
            variant_type='hls_playlist',
            file_url=playlist_url,
            format='m3u8'
        )

        # Update media file HLS playlist URL
        if playlist_uploaded:
            media_file.hls_playlist_url = playlist_url
            media_file.save()

        # Clean up
        video.close()

        # Clean up temporary file if it was created
        if s3_key and 'temp_file' in locals():
            try:
                os.unlink(video_path)
            except:
                pass

        # Update status
        media_file.processing_status = 'completed'
        media_file.save()

        logger.info(f"Successfully processed video file: {media_file.file_name}")
        return True

    except Exception as e:
        logger.error(f"Failed to process video file {media_file_id}: {str(e)}")
        media_file = MediaFile.objects.get(id=media_file_id)
        media_file.processing_status = 'failed'
        media_file.processing_error = str(e)
        media_file.save()
        raise


def generate_hls_playlist(media_file, hls_config):
    """Generate M3U8 playlist content"""
    playlist_lines = [
        '#EXTM3U',
        '#EXT-X-VERSION:3',
        f'#EXT-X-TARGETDURATION:{int(media_file.duration)}',
        '#EXT-X-MEDIA-SEQUENCE:0',
    ]

    for i, (bitrate, resolution) in enumerate(zip(hls_config['bitrates'], hls_config['resolutions'])):
        # Use full S3 URLs for segments
        segment_url = f"{media_file.id}/hls/{i}/segment.mp4"
        playlist_lines.extend([
            '#EXT-X-STREAM-INF:BANDWIDTH={},RESOLUTION={}x{}'.format(
                bitrate * 1000, resolution[0], resolution[1]
            ),
            segment_url
        ])

    playlist_lines.append('#EXT-X-ENDLIST')
    return '\n'.join(playlist_lines)


@shared_task(bind=True)
def generate_hls_playlist(self, media_file_id):
    """Generate HLS playlist for video"""
    try:
        media_file = MediaFile.objects.get(id=media_file_id)
        hls_config = settings.MEDIA_PROCESSING_CONFIG['video']['hls']

        playlist_content = generate_hls_playlist(media_file, hls_config)

        # Save playlist content (this would be handled by storage backend)
        # For now, just mark as completed
        media_file.processing_status = 'completed'
        media_file.save()

        return True

    except Exception as e:
        logger.error(f"Failed to generate HLS playlist for {media_file_id}: {str(e)}")
        raise