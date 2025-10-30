// Basic JavaScript for Django Blog
document.addEventListener('DOMContentLoaded', function() {
    console.log('Django Blog loaded successfully!');

    // Add any interactive functionality here
    const articles = document.querySelectorAll('article');
    articles.forEach(article => {
        article.addEventListener('click', function() {
            console.log('Article clicked:', this.querySelector('h3').textContent);
        });
    });
});