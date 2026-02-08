document.addEventListener('DOMContentLoaded', () => {
            
            const filterBtns = document.querySelectorAll('.filter-btn');
            const productCards = document.querySelectorAll('.product-card');

            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove active class from all buttons
                    filterBtns.forEach(b => b.classList.remove('active'));
                    // Add active class to clicked button
                    btn.classList.add('active');

                    const filterValue = btn.getAttribute('data-filter');

                    productCards.forEach(card => {
                        const category = card.getAttribute('data-category');
                        
                        if (filterValue === 'all' || filterValue === category) {
                            card.style.display = 'flex'; // Restore display
                            // Small animation reset
                            card.style.opacity = '0';
                            setTimeout(() => card.style.opacity = '1', 50);
                        } else {
                            card.style.display = 'none';
                        }
                    });
                });
            });
        });