const allProducts = [
    {
        id: 1,
        type: "bag",
        code: "HSB001",
        title: "Luxury Leather Tote",
        price: "৳2499",
        oldPrice: "৳2000", 
        image: "/assets/ladies-bag/1.jpg",
        rating: "4",
        review: 45,
        badge: { text: "-20% OFF", class: "badge-new" }
    },

    {
        id: 2,
        type: "sneaker",
        code: "HSS001",
        title: "Air Jordan Retro",
        price: "৳8500",
        image: "/assets/sneakers/1.jpeg",
        rating: "5",
        review: 12,
        badge: null
    },
    {
        id: 3,
        type: "sneaker",
        code: "HSS001",
        title: "Urban Runner",
        price: "৳3200",
        oldPrice: "৳2500", 
        image: "/assets/sneakers/2.jpeg",
        rating: "4",
        review: 8,
        badge: { text: "-20% OFF", class: "badge-new" }
    },
    {
        id: 4,
        type: "kids-item",
        code: "HSK001",
        title: "Kids Toys",
        price: "৳3200",
        image: "/assets/kids item/2.jpeg",
        rating: "4",
        review: 8,
        badge: { text: "HOT", class: "badge-new" }
    },
    {
        id: 5,
        type: "gadgets-accessories",
        code: "HSGA001",
        title: "Noise Cancelling Earphone",
        price: "৳3200",
        image: "/assets/gadgets/4.webp",
        rating: "4",
        review: 8,
        badge: { text: "NEW", class: "badge-new" }
    },
    {
        id: 6,
        type: "ladies-item",
        code: "HSCL001",
        title: "Premium Clothes",
        price: "৳3200",
        oldPrice: "৳3000", 
        image: "/assets/ladies items/3.jpeg",
        rating: "4",
        review: 8,
        badge: { text: "-20% OFF", class: "badge-new" }
    },

];





const renderCategory = (targetType, containerId) => {
    const container = document.getElementById(containerId);

    const filteredProducts = allProducts.filter(product => product.type === targetType);

    let htmlContent = "";

    filteredProducts.forEach(product => {
        const stars = "★".repeat(product.rating) + "☆".repeat(5 - product.rating);

        const badgeHtml = product.badge
            ? `<span class="badge ${product.badge.class}">${product.badge.text}</span>`
            : '';

        const oldPriceHtml = product.oldPrice
            ? `<span class="old-price">${product.oldPrice}</span>`
            : '';

        htmlContent += `
      <article class="product-card">
          <div class="card-image-wrapper">
              ${badgeHtml}
              <img src="${product.image}" alt="${product.title}" class="card-image">
          </div>
          <div class="card-content">
              <span class="product-category">${product.code.toUpperCase()}</span>
              <h3 class="product-title">${product.title}</h3>
             <div class="rating">
                    ${stars} <span>(${product.review})</span>
            </div>
              <div class="card-footer">
                    <div class="price-group">
                      <span class="current-price">${product.price}</span>
                      ${oldPriceHtml}
                  </div>
                  <button class="add-cart-btn" onclick="addToCart(this)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                  <span>Add to Cart</span
                  </button>
              </div>
          </div>
      </article>
    `;
    });

    container.innerHTML = htmlContent;
};

renderCategory('bag', 'bags-container');
renderCategory('sneaker', 'sneakers-container');
renderCategory('ladies-item', 'ladies-item-container');
renderCategory('kids-item', 'kids-item-container');
renderCategory('gadgets-accessories', 'gadgets-accessories-container');