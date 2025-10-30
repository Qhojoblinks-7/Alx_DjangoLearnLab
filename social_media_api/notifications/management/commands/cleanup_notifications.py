from django.core.management.base import BaseCommand
from notifications.models import Notification


class Command(BaseCommand):
    help = 'Clean up notifications with invalid ContentType references'

    def handle(self, *args, **options):
        invalid_count = 0
        total_count = Notification.objects.count()

        self.stdout.write(f'Checking {total_count} notifications...')

        for notification in Notification.objects.all():
            try:
                # Try to access the target to see if ContentType is valid
                target = notification.target
                if target is None and notification.content_type and notification.object_id:
                    # ContentType exists but target is None - likely invalid reference
                    self.stdout.write(f'Deleting notification {notification.id} with invalid target reference')
                    notification.delete()
                    invalid_count += 1
            except Exception as e:
                self.stdout.write(f'Deleting notification {notification.id} due to error: {e}')
                notification.delete()
                invalid_count += 1

        remaining_count = Notification.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f'Cleanup complete: Deleted {invalid_count} invalid notifications. '
                f'Remaining: {remaining_count}'
            )
        )