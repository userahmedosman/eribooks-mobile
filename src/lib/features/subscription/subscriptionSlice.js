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
      const response = await api.subscriptions.getUserSubscriptions(customerId);
      // Backend returns { value: [...] } — unwrap to always store a flat array
      return response?.value ?? (Array.isArray(response) ? response : []);
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
      // Preserve errorCode if the backend provides it in the error payload
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

export const { clearPurchaseState, clearErrors } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
