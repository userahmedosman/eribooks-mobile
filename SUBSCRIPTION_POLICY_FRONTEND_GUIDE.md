# 📋 Subscription Policy - Frontend Usage Guide

## Overview

The subscription system now enforces **strict rules**:
1. ✅ Users can only have **ONE active subscription at a time**
2. ✅ Users **cannot subscribe to the same plan twice** while active
3. ✅ Users must **cancel current subscription** to switch to a different plan

---

## User Experience Flow

### Scenario 1: New User (No Active Subscription)
```
User clicks "Subscribe to Premium"
       ↓
Form displays plan details
       ↓
User approves payment
       ↓
✅ SUCCESS - Subscription created
```

### Scenario 2: User Tries Duplicate (Already Has Plan)
```
User has ACTIVE Premium subscription
       ↓
User clicks "Subscribe to Premium"
       ↓
❌ ERROR: "You already have an active subscription to the Premium plan. 
          To subscribe to a different plan, please cancel your current 
          subscription first."
```

### Scenario 3: User Tries Different Plan (Has Active)
```
User has ACTIVE Basic subscription
       ↓
User clicks "Subscribe to Premium"
       ↓
❌ ERROR: "You already have an active subscription to the Basic plan. 
          Only one active subscription is allowed per user. 
          Please cancel your current subscription before subscribing 
          to the Premium plan."
```

### Scenario 4: Cancel Then Subscribe
```
User cancels their subscription
       ↓
User clicks "Subscribe to Premium"
       ↓
✅ SUCCESS - New subscription created
```

---

## API Integration

### Subscription Endpoints

**Purchase Subscription**
```javascript
POST /api/subscriptions/purchase
Headers: { Authorization: Bearer {token} }
Body: {
  customerId: 1,
  subscriptionPlanId: 1,
  returnUrl: "https://app.example.com/success",
  cancelUrl: "https://app.example.com/cancel"
}

Response: {
  success: true,
  paymentAttemptId: 1,
  paypalSubscriptionId: "I-ABC123XYZ",
  paypalApprovalUrl: "https://paypal.com/..."
}
```

**Confirm Payment**
```javascript
POST /api/subscriptions/confirm-new-payment
Headers: { Authorization: Bearer {token} }
Body: {
  customerId: 1,
  subscriptionPlanId: 1,
  paypalSubscriptionId: "I-ABC123XYZ"
}

Response: {
  success: true,
  subscriptionId: 1,
  message: "Subscription activated successfully"
}
```

**Cancel Subscription**
```javascript
POST /api/subscriptions/{subscriptionId}/cancel
Headers: { Authorization: Bearer {token} }

Response: {
  success: true,
  message: "Subscription cancelled successfully"
}
```

**Get Current Subscriptions**
```javascript
GET /api/subscriptions/{customerId}
Headers: { Authorization: Bearer {token} }

Response: {
  value: [
    {
      id: 1,
      planName: "Premium",
      isActive: true,
      startDate: "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

## Frontend Implementation

### Check Current Subscription

```javascript
import { useState, useEffect } from 'react'

function SubscriptionStatus({ customerId }) {
  const [activeSubscription, setActiveSubscription] = useState(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      const response = await fetch(
        `/api/subscriptions/${customerId}`,
        { credentials: 'include' }
      )
      const data = await response.json()

      // Get the active subscription (if any)
      const active = data.value?.find(s => s.isActive)
      setActiveSubscription(active)
    }

    fetchSubscription()
  }, [customerId])

  if (!activeSubscription) {
    return <p>No active subscription</p>
  }

  return (
    <div>
      <p>Current Plan: <strong>{activeSubscription.planName}</strong></p>
      <p>Active Since: {activeSubscription.startDate}</p>
    </div>
  )
}
```

### Handle Subscription Purchase

```javascript
function SubscribeToPlan({ plan, customerId, onSuccess }) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    setError(null)

    try {
      // Step 1: Initiate purchase
      const response = await fetch('/api/subscriptions/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerId,
          subscriptionPlanId: plan.id,
          returnUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription/cancel`
        })
      })

      const result = await response.json()

      // Handle errors
      if (!result.success) {
        setError(result.errorMessage)
        return
      }

      // Step 2: Redirect to PayPal for approval
      window.location.href = result.paypalApprovalUrl

    } catch (error) {
      setError('Failed to process subscription. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button 
        onClick={handleSubscribe}
        disabled={loading}
        className="subscribe-btn"
      >
        {loading ? 'Processing...' : `Subscribe to ${plan.name}`}
      </button>
    </div>
  )
}
```

### Confirm Payment After PayPal Approval

```javascript
function SubscriptionSuccess({ customerId, planId, paypalSubscriptionId }) {
  const [confirming, setConfirming] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const response = await fetch(
          '/api/subscriptions/confirm-new-payment',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              customerId,
              subscriptionPlanId: planId,
              paypalSubscriptionId
            })
          }
        )

        const result = await response.json()

        if (!result.success) {
          setError(result.errorMessage)
        } else {
          // Subscription successful
          window.location.href = '/dashboard'
        }
      } catch (error) {
        setError('Failed to confirm subscription')
        console.error(error)
      } finally {
        setConfirming(false)
      }
    }

    confirmPayment()
  }, [])

  if (confirming) return <div>Confirming your subscription...</div>
  if (error) return <div className="error">{error}</div>

  return <div>Subscription activated! Redirecting...</div>
}
```

### Cancel Subscription

```javascript
function CancelSubscription({ subscriptionId, onCancelled }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCancel = async () => {
    if (!window.confirm('Are you sure? You will lose access to this plan.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
          credentials: 'include'
        }
      )

      const result = await response.json()

      if (!result.success) {
        setError(result.errorMessage)
      } else {
        onCancelled()
      }
    } catch (error) {
      setError('Failed to cancel subscription')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <div className="error-message">{error}</div>}

      <button 
        onClick={handleCancel}
        disabled={loading}
        className="cancel-btn"
      >
        {loading ? 'Cancelling...' : 'Cancel Subscription'}
      </button>
    </div>
  )
}
```

---

## Error Codes & Messages

### User-Facing Error Messages

| Scenario | Error Code | Frontend Action |
|----------|-----------|-----------------|
| Already subscribed to same plan | `DUPLICATE_PLAN_SUBSCRIPTION` | Show error, don't allow subscribe |
| Already has different active plan | `ACTIVE_SUBSCRIPTION_EXISTS` | Show error with current plan, suggest cancel first |
| Plan not available | `INVALID_PLAN` | Show error, redirect to plans page |
| Payment not approved | `PAYPAL_NOT_ACTIVE` | Show error, ask to try again |

### Example Error Display

```javascript
function handleSubscriptionError(errorMessage, errorCode) {
  const messages = {
    'DUPLICATE_PLAN_SUBSCRIPTION': `You already have an active subscription to this plan. 
                                   To subscribe to another plan, cancel this one first.`,
    'ACTIVE_SUBSCRIPTION_EXISTS': `You can only have one active subscription at a time. 
                                  Cancel your current subscription to switch plans.`,
    'INVALID_PLAN': 'This subscription plan is no longer available.',
    'PAYPAL_NOT_ACTIVE': 'Payment was not approved. Please try again.'
  }

  const displayMessage = messages[errorCode] || errorMessage
  showErrorNotification(displayMessage)
}
```

---

## UI/UX Recommendations

### Subscription Plans Page

```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│     Basic Plan      │    Premium Plan     │    Pro Plan         │
├─────────────────────┼─────────────────────┼─────────────────────┤
│ $4.99/month         │ $9.99/month         │ $19.99/month        │
│                     │                     │                     │
│ • 10 books/month    │ • Unlimited books   │ • Everything         │
│ • Standard support  │ • Audio access      │ • Priority support   │
│                     │ • Offline reading   │ • API access         │
│                     │                     │                     │
│ [Subscribe] ✓       │ [Subscribe]         │ [Subscribe]          │
│ (You're here!)      │ (Click to start)    │ (Click to start)    │
└─────────────────────┴─────────────────────┴─────────────────────┘

Status Bar:
"You have an active Basic plan. To upgrade, cancel your current subscription first."
```

### Account/Dashboard

```
Active Subscription
├─ Plan: Premium
├─ Price: $9.99/month
├─ Active Since: Jan 15, 2024
├─ Renews: Feb 15, 2024
└─ [Cancel Subscription] button

Available Actions:
• If NO active: Show upgrade buttons
• If HAS active: Show cancel button + message about switching
```

---

## Testing Checklist

- [ ] User with no subscription can subscribe
- [ ] User cannot subscribe to same plan twice (shows error)
- [ ] User cannot subscribe to different plan without cancelling first (shows error)
- [ ] User can cancel subscription
- [ ] User can subscribe after cancelling
- [ ] Error messages are clear and helpful
- [ ] Payment flow works (redirect to PayPal)
- [ ] Success page confirms subscription
- [ ] Active subscription shows in user dashboard

---

## Common Implementation Pattern

```javascript
// Step 1: Check if user has active subscription
async function getActiveSubscription(customerId) {
  const response = await fetch(`/api/subscriptions/${customerId}`, 
    { credentials: 'include' })
  const data = await response.json()
  return data.value?.find(s => s.isActive)
}

// Step 2: Show appropriate UI based on status
function SubscriptionUI({ customerId }) {
  const [activeSubscription, setActiveSubscription] = useState(null)

  useEffect(() => {
    getActiveSubscription(customerId).then(setActiveSubscription)
  }, [customerId])

  if (activeSubscription) {
    return <CurrentSubscriptionView subscription={activeSubscription} />
  } else {
    return <UpgradePlansView />
  }
}
```

---

## Summary

| Action | User State | Allowed | Result |
|--------|-----------|---------|--------|
| Subscribe | No active | ✅ YES | Subscription created |
| Subscribe same plan | Has active plan A | ❌ NO | Error shown |
| Subscribe different plan | Has active plan A | ❌ NO | Error: cancel first |
| Cancel | Has active | ✅ YES | Subscription cancelled |
| Subscribe after cancel | No active | ✅ YES | Subscription created |

**Key Point:** Users see ONE clear error message telling them exactly what to do.

---

**Status:** ✅ Ready to implement
**Backend:** ✅ Enforces strict policy
**Frontend:** Follow patterns above
