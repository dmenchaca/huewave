import { useState } from "react";
import { useUser } from "../hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema } from "@db/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import confetti from 'canvas-confetti';

interface Palette {
  id: number;
  name: string;
  colors: string[];
  created_at: string;
}

interface AuthResponse {
  ok: boolean;
  message?: string;
  user?: {
    id: number;
    email: string;
  };
  palette?: Palette;
}

interface ResetPasswordResponse {
  message: string;
}

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  triggerContent?: React.ReactNode;
  customTitle?: string;
  onSuccess?: (palette: Palette) => void;
}

export default function AuthDialog({ isOpen, onOpenChange, triggerContent, customTitle, onSuccess }: AuthDialogProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSubmitted, setResetSubmitted] = useState(false);
  const { login, register, isFetching } = useUser();
  const { toast } = useToast();

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your email",
      });
      return;
    }

    try {
      const response = await fetch("/api/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const result: ResetPasswordResponse = await response.json();
      setResetSubmitted(true);
      toast({
        title: "Password Reset",
        description: result.message,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (values: { email: string; password: string }) => {
    try {
      const result: AuthResponse = await (isLogin ? login(values) : register(values));
      if (result.ok) {
        // First update palette and colors
        if (!isLogin && onSuccess && result.palette) {
          onSuccess(result.palette);
        }
        
        // If logging in, check for stored palette
        if (isLogin) {
          try {
            // Wait a brief moment to ensure session is properly initialized
            await new Promise(resolve => setTimeout(resolve, 100));
            
            console.log('Checking for stored palette after login');
            const response = await fetch('/api/palettes/stored');
            const responseText = await response.text();
            console.log('Raw response from stored palette endpoint:', responseText);
            
            if (response.ok) {
              const storedPalette = JSON.parse(responseText);
              console.log('Retrieved stored palette:', storedPalette);
              
              if (storedPalette && storedPalette.colors && Array.isArray(storedPalette.colors)) {
                console.log('Found valid stored palette, attempting to save');
                // Save the stored palette
                const savePaletteResponse = await fetch('/api/palettes', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    name: storedPalette.name || 'My Palette',
                    colors: storedPalette.colors
                  })
                });
                
                const savePaletteText = await savePaletteResponse.text();
                console.log('Save palette response:', savePaletteText);
                
                if (savePaletteResponse.ok) {
                  const savedPalette = JSON.parse(savePaletteText);
                  console.log('Successfully saved palette:', savedPalette);
                  
                  console.log('Clearing stored palette');
                  // Clear the stored palette
                  const clearResponse = await fetch('/api/clear-stored-palette', { 
                    method: 'POST',
                    credentials: 'include'
                  });
                  console.log('Clear stored palette response:', await clearResponse.text());
                  
                  if (onSuccess) {
                    console.log('Calling onSuccess with saved palette');
                    onSuccess(savedPalette);
                  }
                  
                  toast({
                    title: "Palette saved",
                    description: "Your palette has been saved to your account",
                  });
                } else {
                  console.error('Failed to save palette:', savePaletteText);
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to save palette to your account",
                  });
                }
              } else {
                console.log('No valid stored palette found in response:', storedPalette);
              }
            } else {
              console.error('Failed to retrieve stored palette:', responseText);
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to retrieve stored palette",
              });
            }
          } catch (error) {
            console.error('Error handling stored palette:', error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to save stored palette",
            });
          }
        }
        
        // Then reset form and show success message
        form.reset();
        toast({
          title: isLogin ? "Welcome back!" : "Account created",
          description: isLogin ? "Successfully logged in" : "Your account has been created",
        });
        
        // Finally close dialog
        onOpenChange(false);
        
        if (!isLogin) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: isLogin ? "Login failed" : "Registration failed",
          description: result.message
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {triggerContent}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{customTitle || (isLogin ? "Log in" : "Create account")}</DialogTitle>
          <DialogDescription>
            {isLogin 
              ? "Welcome back! Please log in to continue."
              : "Create an account to save your palette"
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} placeholder="Enter your email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={isFetching}>
                {isFetching ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                    {isLogin ? "Logging in..." : "Creating account..."}
                  </span>
                ) : (
                  isLogin ? "Log in" : "Create an account"
                )}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              {/* Google OAuth button - Temporarily commented out
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/auth/google'}
              >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>
              */}
              {isResetPassword ? (
                resetSubmitted ? (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">Check your email for reset instructions.</p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setIsResetPassword(false);
                        setResetSubmitted(false);
                        setResetEmail("");
                      }}
                    >
                      Back to login
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                    <Button
                      type="button"
                      className="w-full"
                      onClick={handleResetPassword}
                    >
                      Send Reset Link
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setIsResetPassword(false)}
                    >
                      Back to login
                    </Button>
                  </div>
                )
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin 
                      ? "Need an account? Register" 
                      : "Already have an account? Login"
                    }
                  </Button>
                  {isLogin && (
                    <Button
                      type="button"
                      variant="link"
                      className="w-full"
                      onClick={() => setIsResetPassword(true)}
                    >
                      Forgot password?
                    </Button>
                  )}
                </>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
