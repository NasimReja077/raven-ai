// AUTH HOOKS  src/features/auth/hooks/useAuth.js

import { useMutation, useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../api/auth.api";
import {
  setUser,
  setToken,
  clearAuth,
  logoutThunk,
  selectUser,
  selectIsAuth,
  selectAuthLoading,
} from "../store/auth.slice";

// custom hook
export const useAuthState = () => ({
  user: useSelector(selectUser),
  isAuth: useSelector(selectIsAuth),
  isLoading: useSelector(selectAuthLoading),
});

// useMutation hook is used for server-side write operations such as creating, updating, or deleting data.
// useMutation - POST/PUT/DELETE
// useQuery - GET data
// useDispatch() - send action
// useSelector() - state read

export const useLogin = () => {
  const dispatch = useDispatch();
  const nav = useNavigate();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      // window.__accessToken = data.accessToken;
      dispatch(setToken(data.accessToken));
      dispatch(setUser(data.user));
      toast.success("Welcome back!");
      nav("/");
    },
  });
};

export const useSignup = () => {
  const nav = useNavigate();
  return useMutation({
    mutationFn: (d) => authApi.signup(d),
    onSuccess: (_, vars) => {
      toast.success("Check your email for OTP!");
      nav(`/verify-otp?email=${encodeURIComponent(vars.email)}`);
    },
  });
};

export const useVerifyOTP = () => {
  const dispatch = useDispatch();
  const nav = useNavigate();
  return useMutation({
    mutationFn: authApi.verifyOTP,
    onSuccess: ({ data }) => {
      // window.__accessToken = data.accessToken;
      dispatch(setToken(data.accessToken));
      dispatch(setUser(data.user));
      toast.success("Email verified!");
      nav("/");
    },
  });
};

export const useResendOTP = () =>
  useMutation({
    mutationFn: authApi.resendOTP,
    onSuccess: () => toast.success("OTP resent!"),
  });

export const useForgotPassword = () =>
  useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => toast.success("Reset link sent!"),
  });

export const useResetPassword = () => {
  const nav = useNavigate();
  return useMutation({
    mutationFn: ({ token, ...d }) => authApi.resetPassword(token, d),
    onSuccess: () => {
      toast.success("Password reset!");
      nav("/login");
    },
  });
};

export const useLogout = () => {
  const dispatch = useDispatch();
  const nav = useNavigate();
  return useMutation({
    mutationFn: () => dispatch(logoutThunk()),
    onSuccess: () => {
      dispatch(clearAuth());
      nav("/login");
    },
  });
};

export const useMe = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: authApi.getMe,
  });
};
