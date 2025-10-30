from django.core.management.base import BaseCommand
from posts.models import Post


class Command(BaseCommand):
    help = 'Sync reposts_count field with actual repost counts'

    def handle(self, *args, **options):
        posts = Post.objects.all()
        updated_count = 0

        for post in posts:
            actual_reposts = post.reposts.count()
            if post.reposts_count != actual_reposts:
                post.reposts_count = actual_reposts
                post.save(update_fields=['reposts_count'])
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Updated Post {post.id}: {actual_reposts} reposts')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} posts')
        )