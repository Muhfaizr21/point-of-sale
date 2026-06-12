import { useState, useMemo } from 'react'
import { apiClient } from '../services/apiClient'

export function useCart() {
  const [cart, setCart] = useState([])
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CASH')

  const addToCart = (product, variationName = null) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.id === product.id && item.variation_name === variationName
      )
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id && item.variation_name === variationName
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      
      // Calculate price based on selected variation
      let itemPrice = product.price
      if (variationName && product.variations) {
        const v = product.variations.find(v => v.name === variationName)
        if (v) itemPrice = v.price
      }

      return [...prevCart, { 
        ...product, 
        variation_name: variationName, 
        price: itemPrice, // override base price
        quantity: 1 
      }]
    })
  }

  const removeFromCart = (productId, variationName = null) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.id === productId && item.variation_name === variationName
      )
      if (!existingItem) return prevCart
      if (existingItem.quantity === 1) {
        return prevCart.filter(
          (item) => !(item.id === productId && item.variation_name === variationName)
        )
      }
      return prevCart.map((item) =>
        item.id === productId && item.variation_name === variationName
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    })
  }

  const incrementQuantity = (productId, variationName = null) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId && item.variation_name === variationName
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const checkout = async () => {
    if (cart.length === 0) return
    setIsCheckingOut(true)

    const payload = {
      customer: customerName || 'Umum',
      payment_method: paymentMethod,
      discount,
      items: cart.map((item) => ({
        product_id: Number(item.id),
        variation_name: item.variation_name || "",
        quantity: item.quantity,
      })),
    }

    try {
      const response = await apiClient.post('/api/orders', payload)
      clearCart()
      setCustomerName('')
      setDiscount(0)
      setPaymentMethod('CASH')
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

  const discountAmount = useMemo(() => {
    return Math.min(discount, subtotal)
  }, [discount, subtotal])

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount)
  }, [subtotal, discountAmount])

  return {
    cart,
    addToCart,
    removeFromCart,
    incrementQuantity,
    clearCart,
    checkout,
    isCheckingOut,
    customerName,
    setCustomerName,
    discount,
    setDiscount,
    paymentMethod,
    setPaymentMethod,
    subtotal,
    discountAmount,
    total,
  }
}
