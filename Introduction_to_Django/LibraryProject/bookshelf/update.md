# Update Operation

Command to update the title of "1984" to "Nineteen Eighty-Four":

```python
from bookshelf.models import Book

# Get the book (assuming it was created with ID 1)
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
