import { createContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const storedCart = localStorage.getItem('cartItems');
            return storedCart ? JSON.parse(storedCart) : [];
        } catch {
            return [];
        }
    });

    // Save cart to local storage on change
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        const existItem = cartItems.find((x) => x.product === product._id);
        if (existItem) {
            setCartItems(
                cartItems.map((x) =>
                    x.product === product._id ? { ...existItem, qty: existItem.qty + 1 } : x
                )
            );
        } else {
            setCartItems([...cartItems, { ...product, product: product._id, qty: 1 }]);
        }
    };

    const removeFromCart = (id) => {
        setCartItems(cartItems.filter((x) => x.product !== id));
    };

    const updateCartItemQty = (id, newQty) => {
        if (newQty < 1) {
            removeFromCart(id);
            return;
        }
        setCartItems(cartItems.map(x => x.product === id ? { ...x, qty: newQty } : x));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const cartTotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateCartItemQty, clearCart, cartTotal }}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;
