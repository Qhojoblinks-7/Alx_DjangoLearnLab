from rest_framework import serializers
from .models import Author, Book
from datetime import datetime

# Serializer for the Book model
# This serializer handles serialization of all fields in the Book model and includes custom validation for the publication_year.
class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'

    # Custom validation to ensure publication_year is not in the future
    def validate_publication_year(self, value):
        current_year = datetime.now().year
        if value > current_year:
            raise serializers.ValidationError("Publication year cannot be in the future.")
        return value

# Serializer for the Author model
# This serializer includes the author's name and a nested serialization of their related books.
class AuthorSerializer(serializers.ModelSerializer):
    # Nested serializer to include related books in the author representation
    books = BookSerializer(many=True, read_only=True)

    class Meta:
        model = Author
        fields = ['name', 'books']
