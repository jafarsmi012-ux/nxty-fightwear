"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productId: string; size: string; color: string } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; size: string; color: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "SET_ITEMS"; payload: CartItem[] };

const CART_STORAGE_KEY = "nxty_cart";

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingIndex = state.items.findIndex(
        (i) =>
          i.productId === action.payload.productId &&
          i.size === action.payload.size &&
          i.color === action.payload.color
      );
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += action.payload.quantity;
        return { items: newItems };
      }
      return { items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return {
        items: state.items.filter(
          (i) =>
            !(i.productId === action.payload.productId &&
              i.size === action.payload.size &&
              i.color === action.payload.color)
        ),
      };
    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return {
          items: state.items.filter(
            (i) =>
              !(i.productId === action.payload.productId &&
                i.size === action.payload.size &&
                i.color === action.payload.color)
          ),
        };
      }
      return {
        items: state.items.map((i) =>
          i.productId === action.payload.productId &&
          i.size === action.payload.size &&
          i.color === action.payload.color
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    }
    case "CLEAR_CART":
      return { items: [] };
    case "SET_ITEMS":
      return { items: action.payload };
    default:
      return state;
  }
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        dispatch({ type: "SET_ITEMS", payload: JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore
    }
  }, [state.items]);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const value: CartContextType = {
    items: state.items,
    addToCart: (item) => dispatch({ type: "ADD_ITEM", payload: item }),
    removeFromCart: (productId, size, color) =>
      dispatch({ type: "REMOVE_ITEM", payload: { productId, size, color } }),
    updateQuantity: (productId, size, color, quantity) =>
      dispatch({ type: "UPDATE_QUANTITY", payload: { productId, size, color, quantity } }),
    clearCart: () => dispatch({ type: "CLEAR_CART" }),
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
