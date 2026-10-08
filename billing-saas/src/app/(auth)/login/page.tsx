"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Receipt, Loader2, Lock, Phone } from "lucide-react";

import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      mobile: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        mobile: data.mobile,
        password: data.password,
        redirect: false,
      });

      if (!res || res.error) {
        toast.error("Invalid mobile number or password");
        setIsLoading(false);
        return;
      }

      toast.success("Welcome back! Redirecting to dashboard...");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error("An error occurred during sign in");
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <CardHeader className="text-center pb-4 space-y-1">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 shadow-inner">
          <Receipt className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Sign In to Shop
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Access your billing register, inventory, and customer ledger
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-700">
                    Registered Mobile Number
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        className="pl-9 h-10 text-sm"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-semibold text-slate-700">
                      Password
                    </FormLabel>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-9 h-10 text-sm"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="pt-0 flex flex-col items-center justify-center text-xs text-slate-500 border-t border-slate-100 py-4">
        <div>
          New shop owner?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
          >
            Register your shop
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
