document.addEventListener('DOMContentLoaded', () => {

    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            productCards.forEach(card => {
                const category = card.getAttribute('data-category');

                if (filterValue === 'all' || filterValue === category) {
                    card.style.display = 'flex'; 
                    card.style.opacity = '0';
                    setTimeout(() => card.style.opacity = '1', 50);
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});


// ========== PAGINATION ==========
let currentPage = 1;
let itemsPerPage = 12;
let allProducts = []; 


document.addEventListener('DOMContentLoaded', function() {
    const productElements = document.querySelectorAll('.product-card'); 
    
    allProducts = Array.from(productElements).map((el, index) => ({
        id: index + 1,
        element: el
    }));
    
    displayProducts();
    displayPageNumbers();
});

function displayProducts() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    const productsGrid = document.getElementById('productsGrid'); 
    allProducts.forEach(product => {
        product.element.style.display = 'none';
    });
    
    for (let i = startIndex; i < endIndex && i < allProducts.length; i++) {
        allProducts[i].element.style.display = 'block';
    }
    
    updatePaginationButtons();
}

function displayPageNumbers() {
    const totalPages = Math.ceil(allProducts.length / itemsPerPage);
    const pageNumbersContainer = document.getElementById('pageNumbers');
    pageNumbersContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'page-btn';
        pageBtn.textContent = i;
        
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }

        pageBtn.addEventListener('click', function() {
            currentPage = i;
            displayProducts();
            displayPageNumbers();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        pageNumbersContainer.appendChild(pageBtn);
    }
}

function updatePaginationButtons() {
    const totalPages = Math.ceil(allProducts.length / itemsPerPage);
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayProducts();
        displayPageNumbers();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function nextPage() {
    const totalPages = Math.ceil(allProducts.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayProducts();
        displayPageNumbers();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function changeItemsPerPage() {
    const select = document.getElementById('itemsPerPage');
    itemsPerPage = parseInt(select.value);
    currentPage = 1; 
    displayProducts();
    displayPageNumbers();
}