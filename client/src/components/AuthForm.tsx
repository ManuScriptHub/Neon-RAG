
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

interface AuthFormProps {
  isLogin: boolean;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface SignupFormData extends LoginFormData {
  username: string;
}

const AuthForm = ({ isLogin }: AuthFormProps) => {
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const { login, signup, isLoading, requestPasswordReset } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      if (isLogin) {
        await login(data.email, data.password);
      } else {
        await signup(data.username, data.email, data.password);
      }
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestPasswordReset(resetEmail);
      // Reset form after successful request
      setResetEmail("");
    } catch (error) {
      console.error("Reset password error:", error);
    }
  };

  if (isResetMode) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="mx-auto mb-4 rounded-full bg-gradient-to-r from-ragify-primary to-ragify-accent p-2">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Reset Password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email to receive password reset instructions
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-ragify-primary to-ragify-accent hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Instructions
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsResetMode(false)}
                disabled={isLoading}
              >
                Back to Login
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="mx-auto mb-4 rounded-full bg-gradient-to-r from-ragify-primary to-ragify-accent p-2">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Welcome back" : "Create an account"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin
              ? "Enter your email to sign in to your account"
              : "Enter your information to create an account"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  {...register("username", { required: !isLogin })}
                  disabled={isLoading}
                />
                {errors.username && (
                  <p className="text-sm font-medium text-destructive">Username is required</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                {...register("email", {
                  required: true,
                  pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                })}
                disabled={isLoading}
              />
              {errors.email?.type === "required" && (
                <p className="text-sm font-medium text-destructive">Email is required</p>
              )}
              {errors.email?.type === "pattern" && (
                <p className="text-sm font-medium text-destructive">Invalid email address</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm font-medium text-ragify-primary hover:underline"
                    onClick={() => setIsResetMode(true)}
                  >
                    Forgot password?
                  </Button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                {...register("password", { required: true })}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm font-medium text-destructive">Password is required</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-ragify-primary to-ragify-accent hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign in" : "Sign up"}
            </Button>

            <div className="text-center text-sm">
              {isLogin ? (
                <p>
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="font-medium text-ragify-primary hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-ragify-primary hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AuthForm;
