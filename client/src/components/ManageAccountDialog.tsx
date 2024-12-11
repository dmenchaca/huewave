
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertCircleIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "../hooks/use-user";

interface ManageAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManageAccountDialog({ isOpen, onOpenChange }: ManageAccountDialogProps) {
  // State and hooks
  const { user } = useUser();
  const { toast } = useToast();
  const [email, setEmail] = useState(user?.email || "");
  const [confirmDelete, setConfirmDelete] = useState("");

  // Mutations
  const updateAccountMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await fetch("/api/user", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/user", { method: "DELETE" });
      if (!response.ok) throw new Error(await response.text());
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted",
      });
      onOpenChange(false);
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Event handlers
  const handleUpdateAccount = () => {
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your email",
      });
      return;
    }
    updateAccountMutation.mutate({ email });
  };

  const handleDeleteAccount = () => {
    if (confirmDelete !== "DELETE") {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please type "DELETE" to confirm',
      });
      return;
    }
    deleteAccountMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account details and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Account Details Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Account Details</h3>
            <Input
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <Button 
              onClick={handleUpdateAccount}
              disabled={updateAccountMutation.isPending}
            >
              {updateAccountMutation.isPending ? "Updating..." : "Update Account"}
            </Button>
          </div>
          
          {/* Danger Zone Section */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertCircleIcon className="h-4 w-4" />
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground">
              Once you delete your account, there is no going back. This action is permanent.
            </p>
            <div className="space-y-2">
              <Input
                placeholder='Type "DELETE" to confirm'
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
              />
              <Button 
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending || confirmDelete !== "DELETE"}
              >
                {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
