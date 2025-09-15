# This is the blueprint for all animals.
class Animal:
    def __init__(self, name):
        # We'll use a `try...except` block to ensure the name is a string.
        # This is an example of writing code that anticipates and handles errors.
        if not isinstance(name, str):
            # We use `raise` to manually trigger an exception if the condition is not met.
            raise TypeError("Animal name must be a string.")

        # __init__ is the constructor. It's called when a new object is created.
        # `self` refers to the specific object instance being created.
        # We use a single underscore to indicate encapsulation—don't access this directly!
        self._name = name
    
    # This is a method (a function in a class).
    def speak(self):
        # All animals will have a basic 'speak' behavior.
        print("The animal makes a sound.")


# Dog and Cat are subclasses that inherit from the Animal superclass.
class Dog(Animal):
    def __init__(self, name, breed):
        # The super() function calls the parent's constructor.
        # This gives our Dog object the `_name` attribute from the Animal class.
        super().__init__(name)
        # We can add new, specific attributes to the subclass.
        self.breed = breed
    
    # We can override the parent's method to provide a more specific behavior.
    def speak(self):
        # This is an example of polymorphism—the same method name, different behavior.
        print(f"{self._name} the {self.breed} says: Woof!")


class Cat(Animal):
    def __init__(self, name):
        # We also call the parent's constructor here.
        super().__init__(name)

    # We override the speak method again for the Cat.
    def speak(self):
        print(f"{self._name} says: Meow!")


# This new class demonstrates COMPOSITION.
# A Shelter "has a" list of Animal objects.
class Shelter:
    def __init__(self):
        # The shelter starts with an empty list to hold the animals.
        self._animals = []

    def add_animal(self, animal):
        # This method takes an Animal object and adds it to the list.
        print(f"Adding a {animal._name} to the shelter.")
        self._animals.append(animal)

    def list_animals(self):
        # This method iterates over the list and calls the speak() method on each animal.
        print("\n--- Listing all animals in the shelter ---")
        for animal in self._animals:
            animal.speak()


# Let's create our objects and see how they work!
# Creating objects (instances of the classes)
shelter = Shelter() # Our shelter object.

dog = Dog("Buddy", "Golden Retriever")
cat = Cat("Whiskers")

# Using the composition to add animals to the shelter.
shelter.add_animal(dog)
shelter.add_animal(cat)

# Using the Shelter's method to interact with the objects it contains.
shelter.list_animals()


# --- Demonstration of Error Handling ---
# We'll use a try...except block to handle the TypeError we added to the Animal class.
print("\n--- Demonstration of Exception Handling ---")
try:
    # This will work fine because the name is a string.
    valid_animal = Animal("Zoe")
    print(f"Successfully created a valid animal named {valid_animal._name}.")

    # This will cause a TypeError and trigger our `except` block.
    invalid_animal = Animal(123)
except TypeError as e:
    print(f"Caught a TypeError: {e}")
