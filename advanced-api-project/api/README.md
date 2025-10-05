# API App - Book Views

This module implements generic views for the Book model using Django REST Framework.

## Views

- **BookListView**: Retrieves a list of all books. Accessible to all users.
- **BookDetailView**: Retrieves details of a single book by ID. Accessible to all users.
- **BookCreateView**: Allows authenticated users to create a new book.
- **BookUpdateView**: Allows authenticated users to update an existing book.
- **BookDeleteView**: Allows authenticated users to delete a book.

## Permissions

- Read operations (list and detail) are open to all users.
- Write operations (create, update, delete) require authentication.

## URL Patterns

- `/books/` - List all books (GET)
- `/books/<int:pk>/` - Retrieve a book by ID (GET)
- `/books/create/` - Create a new book (POST)
- `/books/<int:pk>/update/` - Update a book (PUT/PATCH)
- `/books/<int:pk>/delete/` - Delete a book (DELETE)

## Testing

Use tools like Postman or curl to test each endpoint. Ensure permissions are enforced correctly by testing with and without authentication.

Example curl commands:

```bash
# List books
curl http://localhost:8000/api/books/

# Get book details
curl http://localhost:8000/api/books/1/

# Create book (requires authentication)
curl -X POST -H "Authorization: Token <your_token>" -d "title=New Book&author=1&publication_year=2023" http://localhost:8000/api/books/create/

# Update book (requires authentication)
curl -X PUT -H "Authorization: Token <your_token>" -d "title=Updated Book&author=1&publication_year=2023" http://localhost:8000/api/books/1/update/

# Delete book (requires authentication)
curl -X DELETE -H "Authorization: Token <your_token>" http://localhost:8000/api/books/1/delete/
