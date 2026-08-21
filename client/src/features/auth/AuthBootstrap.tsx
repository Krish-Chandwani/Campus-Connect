import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useGetMeQuery } from "./authApi";
import { logout, setUser } from "./authSlice";

/** If a token exists, load the current user from GET /api/auth/me */
export default function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  const { data, isError } = useGetMeQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (data?.user) {
      dispatch(setUser(data.user));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (isError && token) {
      dispatch(logout());
    }
  }, [isError, token, dispatch]);

  return null;
}
