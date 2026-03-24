import { createContext, useState } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {

  const [cart, setCart] = useState([]);

  const addToCart = (product) => {

    const existing = cart.find(p => p.id === product.id);
    if (existing) {
      setCart(cart.map(p =>
        p.id === product.id
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ));

    } else {

      setCart([...cart, { ...product, quantity: 1 }]);

    }

  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}