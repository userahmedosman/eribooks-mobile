import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api';

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
  async (customerId, { rejectWithValue }) => {
    try {
      return await api.subscriptions.getUserSubscriptions(customerId);
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

export const confirmSubscriptionPayment = createAsyncThunk(
  'subscriptions/confirmPayment',
  async (arg, { rejectWithValue }) => {
    try {
      const isObject = typeof arg === 'object' && arg !== null;
      const subscriptionId = isObject ? arg.subscriptionId : arg;
      const paypalData = isObject ? { ...arg } : {};
      if (isObject) delete paypalData.subscriptionId;
      return await api.subscriptions.confirmPayment(subscriptionId, paypalData);
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptionPlans.pending, (state) => { state.plansLoading = true; state.plansError = null; })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => { state.plansLoading = false; state.plans = action.payload || []; })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => { state.plansLoading = false; state.plansError = action.payload; })

      .addCase(fetchUserSubscriptions.pending, (state) => { state.subscriptionsLoading = true; state.subscriptionsError = null; })
      .addCase(fetchUserSubscriptions.fulfilled, (state, action) => { state.subscriptionsLoading = false; state.userSubscriptions = action.payload || []; })
      .addCase(fetchUserSubscriptions.rejected, (state, action) => { state.subscriptionsLoading = false; state.subscriptionsError = action.payload; })

      .addCase(purchaseSubscription.pending, (state) => { state.purchaseLoading = true; state.purchaseError = null; state.purchaseResponse = null; })
      .addCase(purchaseSubscription.fulfilled, (state, action) => { state.purchaseLoading = false; state.purchaseResponse = action.payload; })
      .addCase(purchaseSubscription.rejected, (state, action) => { state.purchaseLoading = false; state.purchaseError = action.payload; })

      .addCase(confirmSubscriptionPayment.pending, (state) => { state.purchaseLoading = true; state.purchaseError = null; })
      .addCase(confirmSubscriptionPayment.fulfilled, (state, action) => {
        state.purchaseLoading = false;
        const updated = action.payload?.subscription || (action.payload?.id ? action.payload : null);
        if (updated) {
          const index = state.userSubscriptions.findIndex((s) => s.id === updated.id);
          if (index !== -1) state.userSubscriptions[index] = updated;
          else state.userSubscriptions.push(updated);
        }
      })
      .addCase(confirmSubscriptionPayment.rejected, (state, action) => { state.purchaseLoading = false; state.purchaseError = action.payload; })

      .addCase(cancelSubscription.fulfilled, (state, action) => {
        const { subscriptionId } = action.payload;
        const index = state.userSubscriptions.findIndex((s) => s.id === subscriptionId);
        if (index !== -1) state.userSubscriptions[index].isActive = false;
      });
  },
});

export const { clearPurchaseState, clearErrors } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
