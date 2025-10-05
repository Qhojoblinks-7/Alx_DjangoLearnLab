from django.db import models

# Model representing an Author
# This model stores information about book authors, including their name.
class Author(models.Model):
    # The name field stores the author's full name as a string.
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

# Model representing a Book
# This model stores information about books, linked to their authors via a foreign key.
class Book(models.Model):
    # The title field stores the book's title as a string.
    title = models.CharField(max_length=200)
    # The author field establishes a one-to-many relationship from Author to Book.
    author = models.ForeignKey(Author, on_delete=models.CASCADE)
    # The publication_year field stores the year the book was published as an integer.
    publication_year = models.IntegerField()

    def __str__(self):
        return self.title
