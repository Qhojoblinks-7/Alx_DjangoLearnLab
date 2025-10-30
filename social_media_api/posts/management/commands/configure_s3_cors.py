from django.core.management.base import BaseCommand
from django.conf import settings
from posts.s3_utils import s3_manager


class Command(BaseCommand):
    help = 'Configure CORS policy for S3 bucket'

    def handle(self, *args, **options):
        self.stdout.write('Configuring CORS for S3 bucket...')

        success = s3_manager.configure_bucket_cors()

        if success:
            self.stdout.write(
                self.style.SUCCESS('Successfully configured CORS for S3 bucket')
            )
        else:
            self.stdout.write(
                self.style.ERROR('Failed to configure CORS for S3 bucket')
            )