import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'social_media_api.settings')

app = Celery('social_media_api')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Configure periodic tasks (Celery Beat)
app.conf.beat_schedule = {
    # Daily sync of leagues and teams data at 2 AM
    'sync-api-football-data-daily': {
        'task': 'sports.tasks.sync_api_football_data',
        'schedule': crontab(hour=2, minute=0),  # Every day at 2:00 AM
    },
    # Hourly sync of fixtures data
    'sync-api-football-fixtures-hourly': {
        'task': 'sports.tasks.sync_api_football_fixtures',
        'schedule': crontab(minute=0),  # Every hour
    },
}


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')