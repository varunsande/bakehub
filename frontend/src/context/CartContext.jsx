import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('bakehub_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bakehub_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === product.productId &&
          item.weight === product.weight &&
          item.isEggless === product.isEggless
      );

      if (existing) {
        return prev.map((item) =>
          item.productId === product.productId &&
          item.weight === product.weight &&
          item.isEggless === product.isEggless
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId, weight, isEggless) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.weight === weight &&
            item.isEggless === isEggless
          )
      )
    );
  };

  const updateQuantity = (
    productId,
    weight,
    isEggless,
    quantity,
    deliveryDate
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, weight, isEggless);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId &&
        item.weight === weight &&
        item.isEggless === isEggless
          ? { ...item, quantity, ...(deliveryDate ? { deliveryDate } : {}) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
