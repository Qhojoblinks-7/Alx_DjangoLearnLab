# CRUD Operations Summary

This document summarizes the CRUD operations performed on the Book model in the Django application.

## Create Operation
- **Command:** 
```python
book = Book(title="1984", author="George Orwell", publication_year=1949)
book.save()
```
- **Expected Output:** 
```plaintext
Book instance created successfully.
```

## Retrieve Operation
- **Command:** 
```python
book = Book.objects.get(title="1984")
print(book.title, book.author, book.publication_year)
```
- **Expected Output:** 
```plaintext
1984 George Orwell 1949
```

## Update Operation
- **Command:** 
```python
book.title = "Nineteen Eighty-Four"
book.save()
```
- **Expected Output:** 
```plaintext
Book title updated successfully to Nineteen Eighty-Four.
```

## Delete Operation
- **Command:** 
```python
book.delete()
```
- **Expected Output:** 
```plaintext
Book instance deleted successfully.
```

This summary provides a quick reference for the CRUD operations performed on the Book model, including the commands used and the expected outputs.
