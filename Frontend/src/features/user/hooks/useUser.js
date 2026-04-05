// ════════════════════════════════════════════════════════════════════════════
// USER HOOK  src/features/user/hooks/useUser.js
// ════════════════════════════════════════════════════════════════════════════
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { userApi } from "../api/user.api";
import { setUser } from "../../auth/store/auth.slice";

export const useProfile = () =>
  useQuery({ queryKey: ["profile"], queryFn: () => userApi.getProfile().then((r) => r.data.data.user) });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  const dispatch = useDispatch();
  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      dispatch(setUser(data.data.user.user));
      toast.success("Profile updated!");
    },
  });
};

export const useUpdatePassword = () =>
     useMutation({ 
          mutationFn: userApi.updatePassword, 
          onSuccess: () => toast.success("Password updated!") 
     });

export const useUploadAvatar = () => {
  const qc = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append("avatar", file);
      return userApi.uploadAvatar(fd);
    },
    onSuccess: ({ data }) => {
     
     const user = data?.data?.user;
      // Redux update 
      if (user) {
        dispatch(setUser(user));
      }
       // React Query refetch
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Avatar updated!");
    },
  });
};