from .models import Author, Book, Library, Librarian

# Query all books by a specific author
def books_by_author(author_name):
    author = Author.objects.get(name=author_name)
    books = Book.objects.filter(author=author)
    return books

# List all books in a library
def books_in_library(library_name):
    library = Library.objects.get(name=library_name)
    books = library.books.all()
    return books

# Retrieve the librarian for a library
def librarian_for_library(library_name):
    library = Library.objects.get(name=library_name)
    librarian = Librarian.objects.get(library=library)
    return librarian

# Example usage
if __name__ == "__main__":
    # Assuming data exists
    print("Books by J.K. Rowling:", books_by_author("J.K. Rowling"))
    print("Books in Central Library:", books_in_library("Central Library"))
    print("Librarian for Central Library:", librarian_for_library("Central Library"))
