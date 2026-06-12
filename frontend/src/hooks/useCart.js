import { useState, useMemo } from 'react'
import { apiClient } from '../services/apiClient'

export function useCart() {
  const [cart, setCart] = useState([])
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId)
      if (!existingItem) return prevCart
      if (existingItem.quantity === 1) {
        return prevCart.filter((item) => item.id !== productId)
      }
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      )
    })
  }

  const incrementQuantity = (productId) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const checkout = async (paymentMethod = 'CASH') => {
    if (cart.length === 0) return
    setIsCheckingOut(true)
    
    const payload = {
      payment_method: paymentMethod,
      items: cart.map((item) => ({
        product_id: Number(item.id),
        quantity: item.quantity,
      })),
    }

    try {
      const response = await apiClient.post('/api/orders', payload)
      clearCart()
      return response
    } catch (err) {
      console.error('Checkout error:', err)
      throw err
    } finally {
      setIsCheckingOut(false)
    }
  }

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  const tax = useMemo(() => {
    return Math.round(subtotal * 0.1)
  }, [subtotal])

  const total = useMemo(() => {
    return subtotal + tax
  }, [subtotal, tax])

  return {
    cart,
    addToCart,
    removeFromCart,
    incrementQuantity,
    clearCart,
    checkout,
    isCheckingOut,
    subtotal,
    tax,
    total,
  }
}
