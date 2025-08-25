book.title = "Nineteen Eighty-Four"
book.save()
Book.objects.get(id=book.id)
# <Book: Nineteen Eighty-Four by George Orwell (1949)>
