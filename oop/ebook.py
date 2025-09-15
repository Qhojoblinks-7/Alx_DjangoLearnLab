# # This file demonstrates key OOP principles: classes, magic methods, inheritance, and composition.

# # --- 1. The Book Class and Magic Methods ---
# class Book:
#     """A blueprint for creating a book object."""
    
#     # __init__ is the constructor. It's called when a new object is created.
#     # It sets the initial state (attributes) of the object.
#     def __init__(self, title, author, pages):
#         self.title = title
#         self.author = author
#         self.pages = pages
#         print(f"Book '{self.title}' created.")

#     # __str__ is a magic method for a user-friendly string representation.
#     def __str__(self):
#         return f"{self.title} by {self.author} ({self.pages} pages)"

#     # __len__ is a magic method that allows us to use the len() function on our object.
#     def __len__(self):
#         return self.pages

#     # __del__ is the destructor, called when the object is about to be deleted.
#     def __del__(self):
#         print(f"Book '{self.title}' is being deleted.")

# # --- 2. Inheritance ---
# # An EBook is a type of Book. Inheritance allows EBook to reuse Book's code.
# class EBook(Book):
#     """A subclass that inherits from the Book class."""

#     def __init__(self, title, author, pages, file_size):
#         # The super() function calls the constructor of the parent class (Book).
#         super().__init__(title, author, pages)
#         # EBook adds a new, specific attribute.
#         self.file_size = file_size

#     # We can override the __str__ method to provide a new behavior.
#     def __str__(self):
#         return f"{self.title} by {self.author} ({self.pages} pages, {self.file_size}MB)"


# # --- 3. Composition ---
# # A Library is not a Book, but it HAS a collection of books.
# class Library:
#     """A class that is composed of Book objects."""

#     def __init__(self):
#         # This list attribute demonstrates composition.
#         self.books = []

#     def add_book(self, book):
#         """Adds a book object to the library's collection."""
#         self.books.append(book)
#         print(f"'{book.title}' added to the library.")

#     def total_pages(self):
#         """Returns the total number of pages in the library."""
#         total = 0
#         # This loop demonstrates polymorphism. It works on both Book and EBook objects.
#         for book in self.books:
#             total += len(book)  # Calls the __len__ magic method on each object
#         return total

# # --- Let's put it all together! ---

# # Creating objects from our classes.
# my_first_book = Book("The Hitchhiker's Guide to the Galaxy", "Douglas Adams", 200)
# my_second_book = EBook("Dune", "Frank Herbert", 896, 25)

# # Using magic methods.
# print(my_first_book)  # Calls the __str__ method
# print(my_second_book) # Calls the overridden __str__ method

# # Demonstrating polymorphism and composition.
# my_library = Library()
# my_library.add_book(my_first_book)
# my_library.add_book(my_second_book)

# print(f"\nTotal pages in the library: {my_library.total_pages()}")

# # The destructor is called when the program finishes and objects are cleaned up.
# # You will see the 'deleted' messages at the very end of the output.


# This file demonstrates the use of class methods and static methods.

# --- 1. The Book Class with New Methods ---
class Book:
    """A blueprint for creating a book object."""
    
    def __init__(self, title, author, pages):
        self.title = title
        self.author = author
        self.pages = pages
        print(f"Instance method called: Book '{self.title}' created.")

    # --- 2. A Class Method (@classmethod) ---
    @classmethod
    def from_string(cls, book_string):
        """
        Creates a Book instance from a formatted string.
        `cls` refers to the class itself (e.g., Book).
        """
        print(f"Class method called: Creating a book from a string.")
        title, author, pages = book_string.split(',')
        return cls(title.strip(), author.strip(), int(pages.strip()))

    # --- 3. A Static Method (@staticmethod) ---
    @staticmethod
    def is_valid_page_count(pages):
        """
        Checks if a given page count is a positive integer.
        This method doesn't use `self` or `cls`.
        """
        print(f"Static method called: Checking if {pages} is valid.")
        return isinstance(pages, int) and pages > 0

    # Instance method for a user-friendly string representation.
    def __str__(self):
        return f"{self.title} by {self.author} ({self.pages} pages)"

# --- Demonstration of all three method types ---

# 1. Using a regular instance method (the constructor) to create an object.
book1 = Book("The Hitchhiker's Guide to the Galaxy", "Douglas Adams", 200)

# 2. Using the class method as an alternative constructor.
# We call it on the class itself, not on an instance.
book_string = "Dune, Frank Herbert, 896"
book2 = Book.from_string(book_string)
print(f"Created book from string: {book2}")

# 3. Using the static method.
# It can be called on either the class or an instance.
print("\nValidating page counts...")
is_valid_1 = Book.is_valid_page_count(200)
is_valid_2 = book2.is_valid_page_count(-50)

print(f"Is 200 a valid page count? {is_valid_1}")
print(f"Is -50 a valid page count? {is_valid_2}")
