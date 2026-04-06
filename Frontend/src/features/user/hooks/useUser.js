// src/features/user/hooks/useUser.js
//
// FIX: Avatar upload was calling dispatch(setUser(data?.data?.user)) but
// the avatar upload endpoint returns { avatar, publicId } — NOT a full user.
// So setUser received { avatar: "url", publicId: "..." } which overwrote the
// entire Redux user object with just those two fields.
//
// Fix: merge the new avatar URL into the existing Redux user object.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { userApi } from "../api/user.api";
import { setUser, selectUser } from "../../auth/store/auth.slice";

export const useProfile = () =>
  useQuery({
    queryKey: ["profile"],
    queryFn: () => userApi.getProfile().then((r) => r.data.data.user),
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      // The API returns the updated user nested at data.data.user.user
      const updated = data?.data?.user?.user ?? data?.data?.user;
      if (updated) dispatch(setUser(updated));
      toast.success("Profile updated!");
    },
  });
};

export const useUpdatePassword = () =>
  useMutation({
    mutationFn: userApi.updatePassword,
    onSuccess: () => toast.success("Password updated!"),
  });

export const useUploadAvatar = () => {
  const qc = useQueryClient();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);

  return useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append("avatar", file);
      return userApi.uploadAvatar(fd);
    },
    onSuccess: ({ data }) => {
      // FIX: API returns { avatar: url, publicId: id } — merge with existing user
      const { avatar, publicId } = data?.data ?? {};
      if (avatar && currentUser) {
        dispatch(setUser({ ...currentUser, avatar, publicId }));
      }
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Avatar updated!");
    },
  });
};