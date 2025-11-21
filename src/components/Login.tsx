import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchUserInfo } from "@/services/authService";
import { v4 as uuidv4 } from "uuid";
import { env } from "@/lib/env";

interface LoginProps {
  onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const LOGIN_URL = useMemo(() => {
    const baseUrl = env.AUTH_BASE_URL;
    const tenantId = env.TENANT_ID;

    const clientId = uuidv4();
    const redirectUri = window.location.origin;

    const params = new URLSearchParams({
      tenantId,
      clientId,
      redirect_uri: redirectUri,
      minify: "true",
      postParent: "true",
    });

    return `${baseUrl}?${params.toString()}`;
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const allowedOrigin = env.AUTH_BASE_URL.split("/auth")[0];

      if (event.origin !== allowedOrigin) {
        console.warn(
          `Rejected message from unexpected origin: ${event.origin}`
        );
        return;
      }

      if (event.data?.accessToken) {
        try {
          await fetchUserInfo(event.data.accessToken);
          onLogin();
          setIsDialogOpen(false);
        } catch (error) {
          console.error("Login failed:", error);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onLogin]);

  return (
    <Dialog open={isDialogOpen}
     onOpenChange={(open) => setIsDialogOpen(open)}
     >
      <DialogContent className="w-[90vw] max-w-3xl">
        <DialogHeader>
          <DialogTitle />
          <DialogDescription />
        </DialogHeader>
        <div style={{ height: "80vh" }}>
          <iframe
            src={LOGIN_URL}
            width="100%"
            height="100%"
            style={{ border: "none" }}
            title="Login"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Login;
