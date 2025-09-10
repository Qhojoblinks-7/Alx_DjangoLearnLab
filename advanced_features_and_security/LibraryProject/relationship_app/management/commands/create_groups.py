from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission

class Command(BaseCommand):
    help = 'Create user groups and assign permissions'

    def handle(self, *args, **options):
        # Get permissions
        view_perm = Permission.objects.get(codename='can_view_book', content_type__app_label='bookshelf')
        create_perm = Permission.objects.get(codename='can_create_book', content_type__app_label='bookshelf')
        edit_perm = Permission.objects.get(codename='can_edit_book', content_type__app_label='bookshelf')
        delete_perm = Permission.objects.get(codename='can_delete_book', content_type__app_label='bookshelf')

        # Create groups
        viewers, created = Group.objects.get_or_create(name='Viewers')
        if created:
            viewers.permissions.add(view_perm)
            self.stdout.write(self.style.SUCCESS('Created Viewers group with can_view_book permission'))

        editors, created = Group.objects.get_or_create(name='Editors')
        if created:
            editors.permissions.add(view_perm, create_perm, edit_perm)
            self.stdout.write(self.style.SUCCESS('Created Editors group with view, create, edit permissions'))

        admins, created = Group.objects.get_or_create(name='Admins')
        if created:
            admins.permissions.add(view_perm, create_perm, edit_perm, delete_perm)
            self.stdout.write(self.style.SUCCESS('Created Admins group with all permissions'))

        self.stdout.write(self.style.SUCCESS('Groups setup complete'))
