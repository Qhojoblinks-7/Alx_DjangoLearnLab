# Testing and Quality Assurance Strategy

## Overview

This document outlines a comprehensive testing strategy for the Social Media API, a complex system integrating REST APIs, WebSockets, Celery asynchronous tasks, external services (Mux, AWS S3), and React frontend with Redux state management.

## Testing Pyramid

```
End-to-End Tests (E2E)
    ↕️
Integration Tests
    ↕️
Unit Tests
    ↕️
Static Analysis & Linting
```

## 1. Static Analysis & Code Quality

### Tools Configuration

#### Python Backend
```bash
# requirements-dev.txt
black==23.12.1
isort==5.13.2
flake8==7.0.0
mypy==1.8.0
pytest==7.4.4
pytest-django==4.8.0
pytest-cov==4.1.0
pytest-mock==3.12.0
requests-mock==1.12.1
moto[s3]==4.2.14
channels[daphne]==4.1.0
celery[redis]==5.3.4
```

#### React Frontend
```json
// package.json devDependencies
{
  "testing-library/jest-dom": "^6.1.5",
  "testing-library/react": "^13.4.0",
  "testing-library/user-event": "^14.5.1",
  "@testing-library/jest-dom": "^6.1.5",
  "@testing-library/react": "^13.4.0",
  "@testing-library/react-hooks": "^8.0.1",
  "msw": "^1.3.2",
  "jest-environment-jsdom": "^29.7.0"
}
```

### Code Quality Gates

#### Pre-commit Hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3

  - repo: https://github.com/pycqa/isort
    rev: 5.13.2
    hooks:
      - id: isort

  - repo: https://github.com/pycqa/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
```

#### CI/CD Quality Gates
```yaml
# .github/workflows/ci.yml
- name: Run Tests
  run: |
    pytest --cov=. --cov-report=xml
    black --check .
    isort --check-only .
    flake8 .

- name: Coverage Check
  run: |
    coverage report --fail-under=85
```

## 2. Unit Testing Strategy

### Backend Unit Tests

#### Model Tests
```python
# posts/tests/test_models.py
import pytest
from django.test import TestCase
from posts.models import Post, MediaFile

class PostModelTest(TestCase):
    def test_post_creation(self):
        post = Post.objects.create(
            title="Test Post",
            content="Test content"
        )
        self.assertEqual(post.title, "Test Post")

    def test_media_url_generation(self):
        # Test S3 URL generation
        media = MediaFile.objects.create(
            file_name="test.jpg",
            media_type="image"
        )
        # Mock S3 URL generation
        self.assertIn("test.jpg", media.get_url_for_size('full'))
```

#### Serializer Tests
```python
# posts/tests/test_serializers.py
from django.test import TestCase
from posts.serializers import PostSerializer
from posts.models import Post

class PostSerializerTest(TestCase):
    def test_post_serialization_with_s3_urls(self):
        post = Post.objects.create(content="Test")
        serializer = PostSerializer(post)
        data = serializer.data

        # Test that URLs are properly generated
        self.assertIn('media_url', data)
        # Mock S3 URL should be present
```

#### Utility Function Tests
```python
# posts/tests/test_s3_utils.py
from django.test import TestCase
from unittest.mock import patch, MagicMock
from posts.s3_utils import get_presigned_url_for_media, upload_media_to_s3

class S3UtilsTest(TestCase):
    @patch('posts.s3_utils.boto3.client')
    def test_presigned_url_generation(self, mock_boto3):
        mock_client = MagicMock()
        mock_boto3.return_value = mock_client
        mock_client.generate_presigned_url.return_value = "https://presigned-url"

        url = get_presigned_url_for_media("test-key")
        self.assertEqual(url, "https://presigned-url")
        mock_client.generate_presigned_url.assert_called_once()
```

### Frontend Unit Tests

#### Component Tests
```javascript
// src/components/__tests__/PostCreator.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import formsReducer from '../../store/formsSlice';
import PostCreator from '../PostCreator';

const mockStore = configureStore({
  reducer: {
    forms: formsReducer,
    auth: () => ({ user: { id: 1, username: 'testuser' } })
  }
});

describe('PostCreator', () => {
  it('renders post creation form', () => {
    render(
      <Provider store={mockStore}>
        <PostCreator onClose={() => {}} />
      </Provider>
    );

    expect(screen.getByPlaceholderText(/what's happening/i)).toBeInTheDocument();
  });

  it('handles file upload', async () => {
    render(
      <Provider store={mockStore}>
        <PostCreator onClose={() => {}} />
      </Provider>
    );

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/media-upload/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
    });
  });
});
```

#### Redux State Tests
```javascript
// src/store/__tests__/formsSlice.test.js
import formsReducer, {
  updatePostContent,
  addMediaFile,
  submitPostCreation
} from '../formsSlice';

describe('formsSlice', () => {
  const initialState = {
    postCreation: {
      content: '',
      mediaFiles: [],
      mediaPreviews: [],
      uploads: [],
      isSubmitting: false,
      submitError: null,
    }
  };

  it('should handle updatePostContent', () => {
    const actual = formsReducer(
      initialState,
      updatePostContent('Hello World')
    );
    expect(actual.postCreation.content).toEqual('Hello World');
  });

  it('should handle addMediaFile', () => {
    const file = new File(['test'], 'test.jpg');
    const preview = { url: 'blob:url', type: 'image' };

    const actual = formsReducer(
      initialState,
      addMediaFile({ file, preview })
    );

    expect(actual.postCreation.mediaFiles).toHaveLength(1);
    expect(actual.postCreation.uploads).toHaveLength(1);
    expect(actual.postCreation.uploads[0].status).toEqual('pending');
  });
});
```

## 3. Integration Testing Strategy

### API Integration Tests

#### REST API Tests with Mocks
```python
# posts/tests/test_api_integration.py
import pytest
from django.test import TestCase
from unittest.mock import patch, MagicMock
from posts.views import GetUploadURLView

class APIIntegrationTest(TestCase):
    @patch('posts.s3_utils.boto3.client')
    def test_upload_url_generation(self, mock_boto3):
        # Mock S3 client
        mock_client = MagicMock()
        mock_boto3.return_value = mock_client
        mock_client.generate_presigned_url.return_value = "https://presigned-url"

        # Test the view
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.post('/api/posts/upload-url/', {
            'file_name': 'test.jpg',
            'content_type': 'image/jpeg'
        })

        view = GetUploadURLView()
        view.request = request

        response = view.post(request)
        self.assertEqual(response.status_code, 200)

        data = response.data
        self.assertIn('upload_url', data)
        self.assertIn('key', data)
```

#### WebSocket Integration Tests
```python
# posts/tests/test_websockets.py
import pytest
from channels.testing import WebsocketCommunicator
from posts.consumers import NotificationConsumer
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase

class WebSocketTest(TransactionTestCase):
    async def test_notification_consumer(self):
        user = get_user_model().objects.create_user('testuser', 'test@example.com')

        # Create WebSocket communicator
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            f'/ws/notifications/{user.id}/'
        )

        # Connect
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        # Send a test message
        await communicator.send_json_to({
            'type': 'notification',
            'message': 'Test notification'
        })

        # Receive response
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'notification_received')

        # Close connection
        await communicator.disconnect()
```

### External Service Integration Tests

#### Mux API Mocking
```python
# posts/tests/test_mux_integration.py
import pytest
from unittest.mock import patch, MagicMock
from posts.streaming_service import MuxStreamingService

class MuxIntegrationTest:
    @patch('posts.streaming_service.mux')
    def test_create_live_stream(self, mock_mux):
        # Mock Mux API response
        mock_mux.live_streams.create.return_value = {
            'id': 'test-stream-id',
            'stream_key': 'test-key',
            'playback_ids': [{'id': 'playback-id'}]
        }

        service = MuxStreamingService()
        result = service.create_live_stream('Test Stream', 'Test Description')

        assert result['stream_key'] == 'test-key'
        mock_mux.live_streams.create.assert_called_once()
```

#### S3 Integration Tests
```python
# posts/tests/test_s3_integration.py
import boto3
import pytest
from moto import mock_s3

@mock_s3
class S3IntegrationTest:
    def setup_method(self):
        self.s3_client = boto3.client('s3', region_name='us-east-1')
        self.bucket_name = 'test-bucket'
        self.s3_client.create_bucket(Bucket=self.bucket_name)

    def test_s3_upload_integration(self):
        from posts.s3_utils import upload_media_to_s3

        # Create test file
        test_content = b'test file content'
        from io import BytesIO
        file_obj = BytesIO(test_content)

        # Upload file
        result = upload_media_to_s3(file_obj, 'test-key', 'text/plain')

        assert result is True

        # Verify file was uploaded
        response = self.s3_client.get_object(Bucket=self.bucket_name, Key='test-key')
        assert response['Body'].read() == test_content
```

## 4. End-to-End Testing Strategy

### E2E Test Scenarios

#### Post Creation with Media Upload
```python
# e2e/tests/test_post_creation.py
import pytest
from playwright.sync_api import Page

def test_create_post_with_media(page: Page):
    # Navigate to app
    page.goto("http://localhost:5173")

    # Login
    page.fill("[data-testid=email]", "user@example.com")
    page.fill("[data-testid=password]", "password")
    page.click("[data-testid=login-button]")

    # Create post with media
    page.fill("[data-testid=post-content]", "Test post with media")
    page.set_input_files("[data-testid=media-upload]", "test-image.jpg")
    page.click("[data-testid=post-button]")

    # Verify post appears in feed
    page.wait_for_selector("[data-testid=post-content]")
    assert "Test post with media" in page.text_content("[data-testid=post-content]")
```

#### Live Streaming E2E Test
```python
# e2e/tests/test_live_streaming.py
def test_live_stream_creation_and_viewing(page: Page, second_page: Page):
    # User 1 creates stream
    page.goto("http://localhost:5173")
    # ... login and create stream ...

    # User 2 views stream
    second_page.goto("http://localhost:5173")
    # ... navigate to stream and verify playback ...

    # Verify WebSocket notifications
    # ... check real-time updates ...
```

### API Mocking for E2E Tests

#### MSW (Mock Service Worker) Setup
```javascript
// src/mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  // Mock S3 upload URL generation
  rest.post('/api/posts/upload-url/', (req, res, ctx) => {
    return res(
      ctx.json({
        upload_url: 'https://mock-s3-url',
        key: 'mock-key'
      })
    );
  }),

  // Mock post creation
  rest.post('/api/posts/create/', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 1,
        content: 'Mock post',
        author: { username: 'testuser' }
      })
    );
  })
];
```

## 5. Asynchronous Task Testing

### Celery Task Tests
```python
# posts/tests/test_celery_tasks.py
import pytest
from unittest.mock import patch, MagicMock
from posts.tasks import process_image_file, process_video_file

class CeleryTaskTest:
    @patch('posts.tasks.upload_media_to_s3')
    @patch('posts.tasks.Image')
    def test_process_image_file(self, mock_image_class, mock_upload):
        # Mock PIL Image
        mock_image = MagicMock()
        mock_image_class.open.return_value = mock_image
        mock_image.convert.return_value = mock_image

        # Mock upload success
        mock_upload.return_value = True

        # Create test media file
        from posts.models import MediaFile
        media_file = MediaFile.objects.create(
            file_name='test.jpg',
            media_type='image'
        )

        # Run task
        result = process_image_file(media_file.id)

        assert result is True
        mock_upload.assert_called()
```

### Task Queue Integration Tests
```python
# posts/tests/test_task_queue.py
import pytest
from django.test import override_settings
from posts.tasks import process_image_file

@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class TaskQueueTest:
    def test_task_execution_in_queue(self):
        # Test that tasks are properly queued and executed
        from posts.models import MediaFile
        media_file = MediaFile.objects.create(
            file_name='test.jpg',
            media_type='image'
        )

        # This should execute synchronously due to CELERY_TASK_ALWAYS_EAGER
        result = process_image_file.delay(media_file.id)

        assert result.get() is True
```

## 6. Performance and Load Testing

### API Load Testing
```python
# performance/tests/test_api_load.py
import pytest
from locust import HttpUser, task, between

class SocialMediaUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def view_feed(self):
        self.client.get("/api/feed/home/")

    @task(2)
    def create_post(self):
        self.client.post("/api/posts/create/", {
            "content": "Load test post"
        })

    @task(1)
    def upload_media(self):
        # Test media upload performance
        files = {'media': ('test.jpg', open('test.jpg', 'rb'), 'image/jpeg')}
        self.client.post("/api/posts/create/", files)
```

### WebSocket Load Testing
```python
# performance/tests/test_websocket_load.py
import asyncio
import websockets
import pytest

async def test_websocket_connections():
    # Test multiple concurrent WebSocket connections
    connections = []
    for i in range(100):
        uri = f"ws://localhost:8000/ws/notifications/{i}/"
        connection = await websockets.connect(uri)
        connections.append(connection)

    # Test broadcasting to multiple connections
    # ... implementation ...

    # Cleanup
    for conn in connections:
        await conn.close()
```

## 7. Security Testing

### Authentication & Authorization Tests
```python
# security/tests/test_auth.py
import pytest
from django.test import TestCase
from posts.models import Post

class SecurityTest(TestCase):
    def test_unauthorized_access_prevention(self):
        # Test that unauthorized users cannot access private streams
        response = self.client.get('/api/posts/live/stream/1/')
        self.assertEqual(response.status_code, 401)

    def test_s3_presigned_url_security(self):
        # Test that presigned URLs expire correctly
        from posts.s3_utils import get_presigned_url_for_media

        url = get_presigned_url_for_media('test-key', expiration=1)
        # Wait for expiration
        import time
        time.sleep(2)

        # Try to access expired URL
        response = self.client.put(url, {})
        self.assertEqual(response.status_code, 403)
```

## 8. CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7
        ports:
          - 6379:6379
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run Django checks
        run: python manage.py check

      - name: Run tests with coverage
        run: pytest --cov=. --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run E2E tests
        run: npm run test:e2e
```

## 9. Test Coverage Goals

### Coverage Targets
- **Backend**: Minimum 85% coverage
- **Frontend**: Minimum 80% coverage
- **Critical Paths**: 95%+ coverage for payment, auth, media upload flows

### Coverage Configuration
```ini
# .coveragerc
[run]
source = .
omit =
    */migrations/*
    */tests/*
    */venv/*
    manage.py

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
    if __name__ == .__main__.:
    class .*\bProtocol\):
    @(abc\.)?abstractmethod
```

## 10. Monitoring and Alerting

### Test Result Monitoring
```python
# monitoring/tests/test_monitoring.py
import pytest
from django.test import TestCase
from unittest.mock import patch

class MonitoringTest(TestCase):
    @patch('posts.tasks.process_image_file.delay')
    def test_task_failure_alerting(self, mock_task):
        # Mock task failure
        mock_task.side_effect = Exception("Task failed")

        # Test that failures are properly logged/alerted
        from posts.views import CreatePostView
        # ... test implementation ...

        # Verify error logging
        # ... assertions ...
```

This comprehensive testing strategy ensures that all components of the complex Social Media API system work correctly together, from individual functions to end-to-end user workflows, with proper mocking of external services and comprehensive error handling.