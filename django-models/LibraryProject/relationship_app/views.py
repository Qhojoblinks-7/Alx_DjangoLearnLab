from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import DetailView
from django.contrib.auth.views import LoginView, LogoutView
from django.contrib.auth.forms import UserCreationForm
from django.urls import reverse_lazy
from django.views.generic import CreateView
from django.contrib.auth.decorators import user_passes_test, permission_required
from django.http import HttpResponseForbidden
from django.contrib import messages
from django.contrib.auth import login
from .models import Book, Library
from .forms import BookForm  # Assuming we have a form, but for simplicity, we'll use modelform


# Function-based view to list all books
def list_books(request):
    books = Book.objects.all()
    return render(request, 'relationship_app/list_books.html', {'books': books})

# Class-based view to display details of a specific library
class LibraryDetailView(DetailView):
    model = Library
    template_name = 'relationship_app/library_detail.html'
    context_object_name = 'library'

# Login view
class CustomLoginView(LoginView):
    template_name = 'relationship_app/login.html'

# Logout view
class CustomLogoutView(LogoutView):
    template_name = 'relationship_app/logout.html'

# Register view
class RegisterView(CreateView):
    form_class = UserCreationForm
    template_name = 'relationship_app/register.html'
    success_url = reverse_lazy('login')

# Role-based views
def role_check(user, role):
    return user.is_authenticated and hasattr(user, 'userprofile') and user.userprofile.role == role

@user_passes_test(lambda u: role_check(u, 'Admin'))
def admin_view(request):
    return render(request, 'relationship_app/admin_view.html')

@user_passes_test(lambda u: role_check(u, 'Librarian'))
def librarian_view(request):
    return render(request, 'relationship_app/librarian_view.html')

@user_passes_test(lambda u: role_check(u, 'Member'))
def member_view(request):
    return render(request, 'relationship_app/member_view.html')

# Book CRUD views with permissions
@permission_required('relationship_app.can_add_book', raise_exception=True)
def add_book(request):
    if request.method == 'POST':
        form = BookForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Book added successfully.')
            return redirect('list_books')
    else:
        form = BookForm()
    return render(request, 'relationship_app/add_book.html', {'form': form})

@permission_required('relationship_app.can_change_book', raise_exception=True)
def edit_book(request, pk):
    book = get_object_or_404(Book, pk=pk)
    if request.method == 'POST':
        form = BookForm(request.POST, instance=book)
        if form.is_valid():
            form.save()
            messages.success(request, 'Book updated successfully.')
            return redirect('list_books')
    else:
        form = BookForm(instance=book)
    return render(request, 'relationship_app/edit_book.html', {'form': form})

@permission_required('relationship_app.can_delete_book', raise_exception=True)
def delete_book(request, pk):
    book = get_object_or_404(Book, pk=pk)
    if request.method == 'POST':
        book.delete()
        messages.success(request, 'Book deleted successfully.')
        return redirect('list_books')
    return render(request, 'relationship_app/delete_book.html', {'book': book})
