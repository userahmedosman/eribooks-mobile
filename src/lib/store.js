import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './features/cart/cartSlice';
import productReducer from './features/product/productSlice';
import ratingReducer from './features/rating/ratingSlice';
import authReducer from './features/auth/authSlice';
import subscriptionReducer from './features/subscription/subscriptionSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    product: productReducer,
    rating: ratingReducer,
    auth: authReducer,
    subscriptions: subscriptionReducer,
  },
});
