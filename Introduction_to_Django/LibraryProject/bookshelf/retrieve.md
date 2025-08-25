# Retrieve Operation

Command to retrieve and display all attributes of the book:

```python
from bookshelf.models import Book

# Retrieve the book (assuming it was created with ID 1)
book = Book.objects.get(id=1)
print(f"Title: {book.title}")
print(f"Author: {book.author}")
print(f"Publication Year: {book.publication_year}")
```

Expected output:
```
Title: 1984
Author: George Orwell
Publication Year: 1949
