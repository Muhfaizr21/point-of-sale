import { useState, useMemo } from 'react'
import { apiClient } from '../services/apiClient'

export function useCart() {
  const [cart, setCart] = useState([])
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [splitMode, setSplitMode] = useState(false)
  const [splitPayments, setSplitPayments] = useState([])

  const addToCart = (product, variationName = null) => {
    setCart((prevCart) => {
      if (product._bundle) {
        const existingItem = prevCart.find(
          (item) => item._bundleId === product._bundleId
        )
        if (existingItem) {
          return prevCart.map((item) =>
            item._bundleId === product._bundleId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
        return [...prevCart, {
          _bundle: true,
          _bundleId: product._bundleId,
          bundleName: product.bundleName,
          id: `bundle-${product._bundleId}`,
          name: product.bundleName,
          price: product.price,
          quantity: 1,
        }]
      }

      const existingItem = prevCart.find(
        (item) => !item._bundle && item.id === product.id && item.variation_name === variationName
      )
      if (existingItem) {
        return prevCart.map((item) =>
          !item._bundle && item.id === product.id && item.variation_name === variationName
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      
      let itemPrice = product.price
      if (variationName && product.variations) {
        const v = product.variations.find(v => v.name === variationName)
        if (v) itemPrice = v.price
      }

      return [...prevCart, { 
        ...product, 
        variation_name: variationName, 
        price: itemPrice,
        quantity: 1 
      }]
    })
  }

  const removeFromCart = (productId, variationName = null) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => {
        if (item._bundle) return item._bundleId === productId
        return item.id === productId && item.variation_name === variationName
      })
      if (!existingItem) return prevCart
      if (existingItem.quantity === 1) {
        return prevCart.filter((item) => {
          if (item._bundle) return item._bundleId !== productId
          return !(item.id === productId && item.variation_name === variationName)
        })
      }
      return prevCart.map((item) => {
        if (item._bundle && item._bundleId === productId) return { ...item, quantity: item.quantity - 1 }
        if (!item._bundle && item.id === productId && item.variation_name === variationName) return { ...item, quantity: item.quantity - 1 }
        return item
      })
    })
  }

  const incrementQuantity = (productId, variationName = null) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item._bundle && item._bundleId === productId) return { ...item, quantity: item.quantity + 1 }
        if (!item._bundle && item.id === productId && item.variation_name === variationName) return { ...item, quantity: item.quantity + 1 }
        return item
      })
    )
  }

  const clearCart = () => {
    setCart([])
    setSplitMode(false)
    setSplitPayments([])
  }

  const checkout = async () => {
    if (cart.length === 0) return
    setIsCheckingOut(true)

    // Read tax & fee settings from localStorage
    let taxRate = 0, svcChargeRate = 0, rounding = false
    try {
      const t = JSON.parse(localStorage.getItem('taxSettings') || '{}')
      taxRate = t.ppn_enabled ? (t.ppn_rate || 11) : 0
      svcChargeRate = t.service_charge_enabled ? (t.service_charge_rate || 5) : 0
      rounding = t.rounding || false
    } catch {}

    const payload = {
      customer: customerName || 'Umum',
      notes,
      payment_method: splitMode ? 'SPLIT' : paymentMethod,
      discount,
      tax_rate: taxRate,
      service_charge_rate: svcChargeRate,
      rounding,
      items: cart.filter(item => !item._bundle).map((item) => ({
        product_id: Number(item.id),
        variation_name: item.variation_name || "",
        quantity: item.quantity,
      })),
      bundles: cart.filter(item => item._bundle).map((item) => ({
        bundle_id: item._bundleId,
        quantity: item.quantity,
      })),
    }

    if (splitMode) {
      payload.split_payments = splitPayments.filter(sp => sp.amount > 0)
    }

    try {
      const response = await apiClient.post('/api/orders', payload)
      clearCart()
      setCustomerName('')
      setNotes('')
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
    // Cap at 50% of subtotal (sync with backend)
    const maxDisc = Math.floor(subtotal / 2)
    return Math.min(discount, maxDisc)
  }, [discount, subtotal])



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
    notes,
    setNotes,
    discount,
    setDiscount,
    paymentMethod,
    setPaymentMethod,
    splitMode,
    setSplitMode,
    splitPayments,
    setSplitPayments,
    subtotal,
    discountAmount,
  }
}
