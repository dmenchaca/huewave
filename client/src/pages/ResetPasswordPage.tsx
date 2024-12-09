import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  // navigate is imported directly from wouter
  const [location] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  
  // Get token from URL query parameters and decode it
  const token = new URLSearchParams(location.split('?')[1]).get('token');
  
  // Validate token when component mounts
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        console.error('[Password Reset] No token found in URL');
        setIsValidating(false);
        toast({
          variant: "destructive",
          title: "Invalid Reset Link",
          description: "No reset token found in the URL. Please request a new password reset.",
        });
        return;
      }

      console.log('[Password Reset] Validating token:', {
        token: token.substring(0, 8) + '...',
        tokenLength: token.length,
        url: window.location.href.split('?')[0],
        timestamp: new Date().toISOString()
      });

      try {
        console.log('[Password Reset] Validating token...', {
          token: token.substring(0, 8) + '...',
          tokenLength: token.length
        });
        
        const encodedToken = encodeURIComponent(token);
        const response = await fetch(`/api/validate-reset-token?token=${encodedToken}`);
        const data = await response.json();
        
        console.log('[Password Reset] Token validation response:', {
          status: response.status,
          valid: data.valid,
          error: data.error,
          expiryWarning: data.expiryWarning,
          timestamp: new Date().toISOString()
        });
        
        setIsValidToken(data.valid);
        
        if (!data.valid) {
          const errorMessage = data.expired 
            ? 'Your password reset link has expired. Please request a new one.'
            : data.error === 'Invalid token format'
            ? 'The password reset link is malformed. Please request a new one.'
            : data.error === 'Invalid token'
            ? 'This password reset link is invalid. Please request a new one.'
            : data.error || 'Invalid or expired reset token';

          console.error('[Password Reset] Token validation failed:', errorMessage);
          
          toast({
            variant: "destructive",
            title: "Invalid Reset Link",
            description: errorMessage,
          });
        } else {
          console.log('[Password Reset] Token validation successful');
          
          // Show expiry warning if present
          if (data.expiryWarning) {
            toast({
              variant: "warning",
              title: "Warning",
              description: data.expiryWarning,
            });
          }
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to validate reset token';
        console.error('[Password Reset] Token validation error:', {
          error: errorMessage,
          stack: error.stack
        });
        
        setIsValidToken(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while validating your reset link. Please try again.",
        });
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token, toast]);
  
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-sm space-y-4 p-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-background border-t-foreground mx-auto"></div>
          <p className="text-muted-foreground">Validating reset token...</p>
        </div>
      </div>
    );
  }

  if (!token || !isValidToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-sm space-y-4 p-4">
          <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
          <p className="text-muted-foreground">
            The password reset link is invalid or has expired. Please request a new password reset.
          </p>
          <Button onClick={() => window.location.href = "/"} className="w-full">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: ResetPasswordForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: values.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to reset password");
      }

      toast({
        title: "Success",
        description: "Your password has been reset successfully",
      });

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reset password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-sm space-y-6 p-4">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  Resetting Password...
                </span>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
