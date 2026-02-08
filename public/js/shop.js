const navLinks = document.getElementById('nav-links');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeMenuBtn = document.getElementById('close-menu-btn');

mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.add('active');
});

closeMenuBtn.addEventListener('click', () => {
    navLinks.classList.remove('active');
});

document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        navLinks.classList.remove('active');
    }
});



document.addEventListener('DOMContentLoaded', () => {

    // --- FILTER LOGIC ---
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


// ================= CART FUNCTIONALITY =================

let cart = JSON.parse(localStorage.getItem('SHOPPING_CART')) || [];

const cartIcon = document.querySelector('.cart-icon-wrapper');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartTotalAmount = document.getElementById('cartTotalAmount');
const cartBadge = document.querySelector('.cart-badge');

function toggleCart() {
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
}

cartIcon.addEventListener('click', toggleCart);
closeCartBtn.addEventListener('click', toggleCart);
cartOverlay.addEventListener('click', toggleCart);

function addToCart(btnElement) {

    const productCard = btnElement.closest('.product-card');

    const title = productCard.querySelector('.product-title').innerText;
    const priceText = productCard.querySelector('.current-price').innerText;
    const imageSrc = productCard.querySelector('.card-image').src;

    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));

    const existingItem = cart.find(item => item.title === title);

    if (existingItem) {
        existingItem.quantity += 1;
        showToast(`Increased quantity of <strong>${title}</strong>`, 'cart');
    } else {
        const newItem = {
            title,
            price,
            image: imageSrc,
            quantity: 1
        };
        cart.push(newItem);
        showToast(`Added <strong>${title}</strong> to cart!`, 'cart');
    }

    updateCart();
    // Optional: Open cart immediately when added
    // if(!cartSidebar.classList.contains('active')) toggleCart();
}

function removeFromCart(title) {
    cart = cart.filter(item => item.title !== title);
    updateCart();
    showToast('Item removed', 'trash');
}

function changeQuantity(title, change) {
    const item = cart.find(i => i.title === title);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(title);
            return;
        }
    }
    updateCart();
}

function updateCart() {
    localStorage.setItem('SHOPPING_CART', JSON.stringify(cart));

    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartBadge.innerText = totalItems;

    cartItemsContainer.innerHTML = '';
    let totalPrice = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is currently empty.</div>';
    } else {
        cart.forEach(item => {
            totalPrice += item.price * item.quantity;

            const cartItemEl = document.createElement('div');
            cartItemEl.classList.add('cart-item');
            cartItemEl.innerHTML = `
                <img src="${item.image}" alt="${item.title}">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">৳${item.price}</div>
                    <div class="cart-item-quantity">
                        <button class="qty-btn" onclick="changeQuantity('${item.title}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="changeQuantity('${item.title}', 1)">+</button>
                    </div>
                </div>
                <div class="remove-btn" onclick="removeFromCart('${item.title}')">
                    <i class="fa-solid fa-trash"></i>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemEl);
        });
    }

    cartTotalAmount.innerText = '৳' + totalPrice.toFixed(2);
}

document.addEventListener('DOMContentLoaded', () => {
    updateCart();
});

document.querySelector('.checkout-btn').addEventListener('click', () => {
    if (cart.length === 0) {
        showToast("Your cart is empty!", "cart");
        return;
    }
    window.location.href = '/checkout.html';
});