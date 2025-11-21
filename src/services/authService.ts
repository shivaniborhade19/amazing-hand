import { env } from "@/lib/env";

const USER_INFO_KEY = "userInfo";

export interface User {
  id: string;
  accessToken: string;
}

export const saveUserInfo = (user: User) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
  }
};

export const getUserInfo = (): User | null => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(USER_INFO_KEY);
    return data ? JSON.parse(data) : null;
  }
  return null;
};

export const removeUserInfo = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_INFO_KEY);
  }
};

export const fetchUserInfo = async (accessToken: string): Promise<User> => {
  const url = `${env.AUTH_BASE_URL.split("/ui")[0]}/v1/me`
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Tenant-ID": env.TENANT_ID,
      "X-Tenant-Name": env.TENANT_NAME,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }

  const json = await response.json();

  const data = json?.data;

  const sessionToken = data?.user_active_sessions?.access_token;

  if (!data?.id || !sessionToken) {
    console.error("Invalid /me response:", json);
    throw new Error("Invalid login — missing access_token or id");
  }

  const user: User = {
    id: data.id,
    accessToken: sessionToken,
  };

  saveUserInfo(user);
  return user;
};
