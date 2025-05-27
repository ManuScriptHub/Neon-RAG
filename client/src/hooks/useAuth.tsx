
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCookies } from "react-cookie";
import { authService, User, LoginData, RegisterData, handleAuthError } from "@/services/auth";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  userId: string | null;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Cookie configuration
const COOKIE_OPTIONS = {
  path: '/',
  maxAge: 86400, // 1 day in seconds
  sameSite: 'strict' as const,
  secure: window.location.protocol === 'https:'
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cookies, setCookie, removeCookie] = useCookies(['ragify-user', 'ragify-userId']);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in from cookies
    const storedUser = cookies['ragify-user'];
    if (storedUser) {
      try {
        setUser(typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser);
      } catch (error) {
        console.error("Failed to parse stored user", error);
        removeCookie('ragify-user');
        removeCookie('ragify-userId');
      }
    }
    setIsLoading(false);
  }, [cookies, removeCookie]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const loginData: LoginData = { email, password };
      const userData = await authService.login(loginData);
      
      setUser(userData);
      
      // Store user info in cookies
      setCookie('ragify-user', JSON.stringify(userData), COOKIE_OPTIONS);
      setCookie('ragify-userId', userData.userId, COOKIE_OPTIONS);

      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
      navigate("/knowledge-base");
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const registerData: RegisterData = { username, email, password };
      const userData = await authService.register(registerData);
      
      setUser(userData);
      
      // Store user info in cookies
      setCookie('ragify-user', JSON.stringify(userData), COOKIE_OPTIONS);
      setCookie('ragify-userId', userData.userId, COOKIE_OPTIONS);

      toast({
        title: "Registration successful",
        description: `Welcome to RAG-ify, ${userData.username}!`,
      });
      navigate("/knowledge-base");
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to change your password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await authService.changePassword({
        userId: user.userId,
        currentPassword,
        newPassword,
      });
      
      toast({
        title: "Success",
        description: "Your password has been updated successfully",
      });
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    setIsLoading(true);
    try {
      await authService.requestPasswordReset(email);
      
      toast({
        title: "Password Reset Requested",
        description: "If your email is registered, you will receive password reset instructions",
      });
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    removeCookie('ragify-user');
    removeCookie('ragify-userId');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        userId: user?.userId || null,
        changePassword,
        requestPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
