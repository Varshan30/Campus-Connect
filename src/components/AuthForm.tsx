import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { app } from "../firebase";

const auth = getAuth(app);

export default function AuthForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(auth.currentUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        const res = await signInWithEmailAndPassword(auth, email, password);
        setUser(res.user);
        navigate("/");
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        // Update user profile with display name
        await updateProfile(res.user, { displayName: name });
        // Reload user to get updated profile
        await res.user.reload();
        setUser(auth.currentUser);
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    navigate("/");
  };

  return (
    <Card className="w-full max-w-md mx-auto border-border/50 shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-display">
          {user ? "Welcome!" : isLogin ? "Welcome Back" : "Create Account"}
        </CardTitle>
        <CardDescription>
          {user
            ? `Signed in as ${user.email}`
            : isLogin
            ? "Sign in to manage your lost & found items"
            : "Join CampusFinds to help reunite items with owners"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {user ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">You are logged in.</p>
            <GradientButton onClick={handleLogout} type="button" className="w-full" size="lg">
              Logout
            </GradientButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <GradientButton type="submit" className="w-full" size="lg">
              {isLogin ? "Sign In" : "Create Account"}
            </GradientButton>

            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-medium hover:underline"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
