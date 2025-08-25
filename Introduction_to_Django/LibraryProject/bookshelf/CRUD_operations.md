# CRUD Operations for Book Model

## Create
```python
from bookshelf.models import Book

# Create a new book
book = Book.objects.create(title="1984", author="George Orwell", publication_year=1949)
```

Expected output:
```
Created book: 1984 by George Orwell (1949)
```

## Read
```python
from bookshelf.models import Book

# Retrieve all books
all_books = Book.objects.all()
print(f"Total books: {all_books.count()}")

# Retrieve specific book by ID
book = Book.objects.get(id=1)
print(f"Title: {book.title}")
print(f"Author: {book.author}")
print(f"Publication Year: {book.publication_year}")
```

Expected output:
```
Total books: 1
Title: 1984
Author: George Orwell
Publication Year: 1949
```

## Update
```python
from bookshelf.models import Book

# Get the book to update
book = Book.objects.get(id=1)

# Update the title
book.title = "Nineteen Eighty-Four"
book.save()

# Verify the update
updated_book = Book.objects.get(id=1)
print(f"Updated title: {updated_book.title}")
```

Expected output:
```
Updated title: Nineteen Eighty-Four
```

## Delete
```python
from bookshelf.models import Book

# Get the book to delete
book = Book.objects.get(id=1)

# Delete the book
book.delete()

# Confirm deletion
remaining_books = Book.objects.all()
print(f"Books remaining: {remaining_books.count()}")
```

Expected output:
```
Books remaining: 0
