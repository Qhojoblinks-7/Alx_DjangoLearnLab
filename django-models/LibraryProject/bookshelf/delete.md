# Delete Operation

Command to delete the book and confirm the deletion:

```python
from bookshelf.models import Book

# Get the book (assuming it was created with ID 1)
book = Book.objects.get(id=1)

# Delete the book
book.delete()

# Confirm deletion by trying to retrieve all books
all_books = Book.objects.all()
print(f"Books remaining: {all_books.count()}")
```

Expected output:
```
Books remaining: 0
