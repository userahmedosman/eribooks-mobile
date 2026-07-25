import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api';
import { isSubscriptionExpired, getSubscriptionExpiryDate } from './subscriptionUtils';

export const fetchSubscriptionPlans = createAsyncThunk(
  'subscriptions/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      return await api.subscriptions.getPlans();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserSubscriptions = createAsyncThunk(
  'subscriptions/fetchUserSubscriptions',
  async (customerId, { getState, rejectWithValue }) => {
    try {
      const response = await api.subscriptions.getUserSubscriptions(customerId);
      const rawSubscriptions = response?.value ?? (Array.isArray(response) ? response : []);

      // Get plans to evaluate duration
      const state = getState();
      let plans = state.subscriptions?.plans || [];
      if (plans.length === 0) {
        try {
          plans = await api.subscriptions.getPlans();
        } catch (e) {
          console.warn('[Subscription] Could not fetch plans during expiration check:', e.message);
        }
      }

      const subscriptions = [...rawSubscriptions];
      let hasAutoCancelledExpired = false;

      // Inspect active subscriptions to cancel if duration has been exceeded
      for (let i = 0; i < subscriptions.length; i++) {
        const sub = subscriptions[i];
        if (sub.isActive && isSubscriptionExpired(sub, plans)) {
          const expiryDate = getSubscriptionExpiryDate(sub, plans);
          console.log(
            `[Subscription] Subscription #${sub.id} (${sub.planName}) expired on ${expiryDate?.toISOString()}. Auto-cancelling...`
          );
          hasAutoCancelledExpired = true;

          try {
            await api.subscriptions.cancel(sub.id, 'Subscription plan duration exceeded');
          } catch (cancelError) {
            console.warn(`[Subscription] Remote cancel call failed for #${sub.id}:`, cancelError.message);
          }

          subscriptions[i] = {
            ...sub,
            isActive: false,
            isExpired: true,
            expiredAt: new Date().toISOString(),
          };
        }
      }

      return {
        subscriptions,
        hasAutoCancelledExpired,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const purchaseSubscription = createAsyncThunk(
  'subscriptions/purchase',
  async (purchaseData, { rejectWithValue }) => {
    try {
      return await api.subscriptions.purchase(purchaseData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const confirmNewPayment = createAsyncThunk(
  'subscriptions/confirmNewPayment',
  async ({ customerId, subscriptionPlanId, paypalSubscriptionId }, { rejectWithValue }) => {
    try {
      return await api.subscriptions.confirmNewPayment({ customerId, subscriptionPlanId, paypalSubscriptionId });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'subscriptions/cancel',
  async ({ subscriptionId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.subscriptions.cancel(subscriptionId, reason);
      return { subscriptionId, ...response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  plans: [],
  plansLoading: false,
  plansError: null,
  userSubscriptions: [],
  subscriptionsLoading: false,
  subscriptionsError: null,
  purchaseLoading: false,
  purchaseError: null,
  purchaseResponse: null,
  cancelLoading: false,
  cancelError: null,
  lastAutoCancelledExpired: false,
};

const subscriptionSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {
    clearPurchaseState: (state) => {
      state.purchaseLoading = false;
      state.purchaseError = null;
      state.purchaseResponse = null;
    },
    clearErrors: (state) => {
      state.plansError = null;
      state.subscriptionsError = null;
      state.purchaseError = null;
      state.cancelError = null;
    },
    checkLocalExpiration: (state) => {
      const plans = state.plans || [];
      state.userSubscriptions.forEach((sub, index) => {
        if (sub.isActive && isSubscriptionExpired(sub, plans)) {
          state.userSubscriptions[index].isActive = false;
          state.userSubscriptions[index].isExpired = true;
          state.lastAutoCancelledExpired = true;
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptionPlans.pending, (state) => { state.plansLoading = true; state.plansError = null; })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => {
        state.plansLoading = false;
        state.plans = action.payload || [];
        // Check local expiration after plans are loaded
        const plans = state.plans;
        state.userSubscriptions.forEach((sub, index) => {
          if (sub.isActive && isSubscriptionExpired(sub, plans)) {
            state.userSubscriptions[index].isActive = false;
            state.userSubscriptions[index].isExpired = true;
            state.lastAutoCancelledExpired = true;
          }
        });
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => { state.plansLoading = false; state.plansError = action.payload; })

      .addCase(fetchUserSubscriptions.pending, (state) => { state.subscriptionsLoading = true; state.subscriptionsError = null; })
      .addCase(fetchUserSubscriptions.fulfilled, (state, action) => {
        state.subscriptionsLoading = false;
        state.userSubscriptions = action.payload?.subscriptions || [];
        if (action.payload?.hasAutoCancelledExpired) {
          state.lastAutoCancelledExpired = true;
        }
      })
      .addCase(fetchUserSubscriptions.rejected, (state, action) => { state.subscriptionsLoading = false; state.subscriptionsError = action.payload; })

      .addCase(purchaseSubscription.pending, (state) => { state.purchaseLoading = true; state.purchaseError = null; state.purchaseResponse = null; })
      .addCase(purchaseSubscription.fulfilled, (state, action) => { state.purchaseLoading = false; state.purchaseResponse = action.payload; })
      .addCase(purchaseSubscription.rejected, (state, action) => { state.purchaseLoading = false; state.purchaseError = action.payload; })

      .addCase(confirmNewPayment.pending, (state) => { state.purchaseLoading = true; state.purchaseError = null; })
      .addCase(confirmNewPayment.fulfilled, (state) => { state.purchaseLoading = false; })
      .addCase(confirmNewPayment.rejected, (state, action) => { state.purchaseLoading = false; state.purchaseError = action.payload; })

      .addCase(cancelSubscription.pending, (state) => { state.cancelLoading = true; state.cancelError = null; })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.cancelLoading = false;
        const { subscriptionId } = action.payload;
        const index = state.userSubscriptions.findIndex((s) => s.id === subscriptionId);
        if (index !== -1) state.userSubscriptions[index].isActive = false;
      })
      .addCase(cancelSubscription.rejected, (state, action) => { state.cancelLoading = false; state.cancelError = action.payload; });
  },
});

export const { clearPurchaseState, clearErrors, checkLocalExpiration } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
