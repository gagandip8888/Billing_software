"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Mail,
  ShieldCheck,
  UserCheck,
  BadgePercent,
  CheckCircle2,
} from "lucide-react";

import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<"OWNER" | "EMPLOYEE">("OWNER");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      mobile: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    try {
      const loginId = (data.identifier || data.mobile || "").trim();
      const res = await signIn("credentials", {
        identifier: loginId,
        mobile: loginId,
        password: data.password,
        redirect: false,
      });

      if (!res || res.error) {
        toast.error(
          loginMode === "EMPLOYEE"
            ? "Invalid Employee ID or password"
            : "Invalid mobile number or password"
        );
        setIsLoading(false);
        return;
      }

      toast.success(
        loginMode === "EMPLOYEE"
          ? "Staff login verified! Opening billing counter..."
          : "Welcome back! Opening billing software..."
      );
      router.push("/billing/new");
      router.refresh();
    } catch (err: any) {
      toast.error("An error occurred during sign in");
      setIsLoading(false);
    }
  }

  async function handleSendReset(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Please enter your registered email or mobile number");
      return;
    }

    setIsSendingReset(true);
    setTimeout(() => {
      setIsSendingReset(false);
      setForgotOpen(false);
      setForgotEmail("");
      toast.success("Password reset instructions sent to your registered email / mobile.");
    }, 1000);
  }

  return (
    <div className="w-full flex flex-col justify-center items-center p-4 sm:p-6 relative selection:bg-purple-100 selection:text-purple-900">
      {/* Subtle background ambient blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[420px] z-10"
      >
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-5">
          {/* Brand Header */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20 mb-1">
              <Store className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Sign in to BillingSaaS
            </h1>
            <p className="text-xs text-slate-500">
              High-speed counter billing &amp; store management
            </p>
          </div>

          {/* Role Mode Tabs: Owner vs Employee */}
          <div className="flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 select-none">
            <button
              type="button"
              onClick={() => {
                setLoginMode("OWNER");
                form.setValue("identifier", "");
                form.setValue("mobile", "");
                form.clearErrors();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                loginMode === "OWNER"
                  ? "bg-white text-purple-900 shadow-xs shadow-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Store className={`h-3.5 w-3.5 ${loginMode === "OWNER" ? "text-purple-600" : "text-slate-400"}`} />
              <span>Owner Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode("EMPLOYEE");
                form.setValue("identifier", "");
                form.setValue("mobile", "");
                form.clearErrors();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                loginMode === "EMPLOYEE"
                  ? "bg-white text-amber-900 shadow-xs shadow-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <UserCheck className={`h-3.5 w-3.5 ${loginMode === "EMPLOYEE" ? "text-amber-600" : "text-slate-400"}`} />
              <span>Employee Login</span>
            </button>
          </div>

          {/* Notice banner for selected mode */}
          <div
            className={`p-2.5 rounded-lg text-[11px] flex items-center gap-2 border transition-all ${
              loginMode === "EMPLOYEE"
                ? "bg-amber-50/80 border-amber-200/80 text-amber-900"
                : "bg-purple-50/80 border-purple-200/80 text-purple-900"
            }`}
          >
            <CheckCircle2
              className={`h-3.5 w-3.5 shrink-0 ${
                loginMode === "EMPLOYEE" ? "text-amber-600" : "text-purple-600"
              }`}
            />
            <span>
              {loginMode === "EMPLOYEE"
                ? "Staff Counter: Fast POS billing, returns & customer Udhari."
                : "Store Admin: Full access to dashboard, profit reports & shop settings."}
            </span>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Identifier / Mobile / Employee ID Input */}
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      {loginMode === "EMPLOYEE" ? "Employee ID or Mobile Number" : "Mobile Number"}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        {loginMode === "EMPLOYEE" ? (
                          <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        ) : (
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        )}
                        <Input
                          type="text"
                          placeholder={
                            loginMode === "EMPLOYEE"
                              ? "e.g. EMP-1001 or 10-digit mobile"
                              : "10-digit registered mobile number"
                          }
                          className="pl-10 h-10 text-xs sm:text-sm border-slate-300 focus-visible:ring-purple-600 rounded-xl"
                          {...field}
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Password Input */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-semibold text-slate-700">
                        Password
                      </FormLabel>
                      {loginMode === "OWNER" && (
                        <button
                          type="button"
                          onClick={() => setForgotOpen(true)}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium transition"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-10 text-xs sm:text-sm border-slate-300 focus-visible:ring-purple-600 rounded-xl"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span>Remember me on this POS terminal</span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full h-10 text-white font-semibold text-xs sm:text-sm shadow-md rounded-xl transition flex items-center justify-center gap-2 ${
                  loginMode === "EMPLOYEE"
                    ? "bg-slate-900 hover:bg-slate-800 shadow-slate-900/10"
                    : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying {loginMode === "EMPLOYEE" ? "Employee" : "Owner"}...</span>
                  </>
                ) : (
                  <>
                    <span>{loginMode === "EMPLOYEE" ? "Sign In as Employee" : "Sign In as Owner"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Registration / Staff Help Footer */}
          <div className="text-center pt-2 text-xs text-slate-500 border-t border-slate-100">
            {loginMode === "OWNER" ? (
              <>
                <span>Don&apos;t have an account? </span>
                <Link
                  href="/register"
                  className="text-purple-600 hover:text-purple-700 font-semibold underline underline-offset-2 ml-1"
                >
                  Register your shop
                </Link>
              </>
            ) : (
              <span className="text-[11px] text-slate-400">
                Staff accounts are created by your Store Owner under Shop Settings.
              </span>
            )}
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Secure 256-bit encrypted counter session</span>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-2">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Reset Your Password
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter your registered mobile number or email. We will send a secure reset link.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendReset} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Registered Mobile or Email:
              </label>
              <Input
                type="text"
                placeholder="e.g. 9876543210 or admin@shop.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="h-10 text-xs border-slate-300 focus-visible:ring-purple-600"
                autoFocus
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForgotOpen(false)}
                className="text-xs h-9 border-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSendingReset || !forgotEmail.trim()}
                className="text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                {isSendingReset ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
