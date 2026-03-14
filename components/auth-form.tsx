"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getClientSupabase } from "@/lib/supabase/client";

export function AuthForm() {
  const supabase = getClientSupabase();
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const action = isRegister ? supabase.auth.signUp : supabase.auth.signInWithPassword;
    const { error } = await action({ email, password });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus(isRegister ? "Registration successful. Check email verification if enabled." : "Login successful.");

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isRegister ? "Create account" : "Sign in"}</CardTitle>
        <CardDescription>Use Supabase Auth for role-driven workflows.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input placeholder="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            placeholder="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button className="w-full" type="submit">
            {isRegister ? "Register" : "Login"}
          </Button>
          <button
            type="button"
            className="text-sm text-primary underline"
            onClick={() => setIsRegister((previous) => !previous)}
          >
            {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
          </button>
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
