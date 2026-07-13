// Anks Boutique - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // Quantity selectors
    document.querySelectorAll('.quantity-selector').forEach(function(selector) {
        const minusBtn = selector.querySelector('.qty-minus');
        const plusBtn = selector.querySelector('.qty-plus');
        const input = selector.querySelector('.qty-input');
        
        if (minusBtn) {
            minusBtn.addEventListener('click', function() {
                let val = parseInt(input.value) || 1;
                if (val > 1) {
                    input.value = val - 1;
                    input.dispatchEvent(new Event('change'));
                }
            });
        }
        
        if (plusBtn) {
            plusBtn.addEventListener('click', function() {
                let val = parseInt(input.value) || 1;
                let max = parseInt(input.getAttribute('max')) || 99;
                if (val < max) {
                    input.value = val + 1;
                    input.dispatchEvent(new Event('change'));
                }
            });
        }
    });
    
    // Auto-dismiss alerts
    document.querySelectorAll('.alert').forEach(function(alert) {
        setTimeout(function() {
            alert.style.opacity = '0';
            alert.style.transition = 'opacity 0.5s ease';
            setTimeout(function() {
                alert.remove();
            }, 500);
        }, 4000);
    });
    
    // Add to cart animation
    document.querySelectorAll('.add-to-cart-form').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            const btn = this.querySelector('.btn');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '✓ Adăugat';
                btn.style.background = '#22c55e';
                setTimeout(function() {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                }, 1500);
            }
        });
    });
});
