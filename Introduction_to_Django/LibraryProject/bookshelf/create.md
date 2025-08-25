# Create Operation

Command to create a Book instance with title "1984", author "George Orwell", and publication year 1949:

```python
from bookshelf.models import Book

book = Book.objects.create(title='1984', author='George Orwell', publication_year=1949)
```

Expected output:
```
Created book: 1984 by George Orwell (1949)
