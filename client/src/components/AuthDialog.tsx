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

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  triggerContent?: React.ReactNode;
  customTitle?: string;
  onSuccess?: (palette: Palette) => void;
}

export default function AuthDialog({ isOpen, onOpenChange, triggerContent, customTitle, onSuccess }: AuthDialogProps) {
  const [isLogin, setIsLogin] = useState(false);
  const { login, register } = useUser();
  const { toast } = useToast();

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
        // Call onSuccess callback with palette data before closing dialog
        if (!isLogin && onSuccess && result.palette) {
          onSuccess(result.palette);
        }

        // Close dialog and show success message
        onOpenChange(false);
        form.reset();
        
        toast({
          title: isLogin ? "Welcome back!" : "Account created",
          description: isLogin ? "Successfully logged in" : "Your account has been created",
        });
        
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
              <Button type="submit" className="w-full">
                {isLogin ? "Log in" : "Create an account"}
              </Button>
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
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
