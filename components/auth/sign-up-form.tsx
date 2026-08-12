"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { signUpAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    fullName: z.string().min(1, "Your name is required"),
    mode: z.enum(["create", "join"]),
    orgName: z.string().optional(),
    orgCode: z.string().optional(),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "create" && !data.orgName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Company/workspace name is required", path: ["orgName"] });
    }
    if (data.mode === "join" && !data.orgCode?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Organization code is required", path: ["orgCode"] });
    }
  });

type FormValues = z.infer<typeof schema>;

export function SignUpForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { mode: "create" } });

  const mode = watch("mode");

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    const formData = new FormData();
    formData.set("fullName", values.fullName);
    formData.set("mode", values.mode);
    formData.set("orgName", values.orgName ?? "");
    formData.set("orgCode", values.orgCode ?? "");
    formData.set("email", values.email);
    formData.set("password", values.password);

    startTransition(async () => {
      const result = await signUpAction(formData);
      if (result && "error" in result) {
        setServerError(result.error);
      } else {
        setSubmitted(values.email);
      }
    });
  };

  if (submitted) {
    return (
      <div className="text-center">
        <MailCheck className="mx-auto size-10 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to <span className="font-medium">{submitted}</span>.
          Click it to activate your workspace, then sign in.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Create your workspace</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Set up your account to get started.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" placeholder="Jane Doe" {...register("fullName")} />
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Workspace</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "create" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setValue("mode", "create")}
            >
              Create new
            </Button>
            <Button
              type="button"
              variant={mode === "join" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setValue("mode", "join")}
            >
              Join existing
            </Button>
          </div>
        </div>

        {mode === "create" ? (
          <div className="space-y-1.5">
            <Label htmlFor="orgName">Company / workspace name</Label>
            <Input id="orgName" placeholder="Acme Inc." {...register("orgName")} />
            {errors.orgName && (
              <p className="text-xs text-destructive">{errors.orgName.message}</p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="orgCode">Organization code</Label>
            <Input id="orgCode" placeholder="T-62850" {...register("orgCode")} />
            <p className="text-xs text-muted-foreground">
              Ask your workspace admin for this — it's shown in their Settings → Organization tab.
            </p>
            {errors.orgCode && (
              <p className="text-xs text-destructive">{errors.orgCode.message}</p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account…" : "Sign Up"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
