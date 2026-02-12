import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import algonomyLogo from "@/assets/algonomy-logo.png";

const Login = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId.trim() || !password.trim()) {
      toast({
        title: "Missing credentials",
        description: "Please enter both user ID and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Store login state
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("userId", userId);
    
    toast({
      title: "Welcome!",
      description: `Logged in as ${userId}`,
    });
    
    navigate("/home");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/10">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Algonomy Logo */}
          <div className="flex justify-center">
            <img src={algonomyLogo} alt="Algonomy" className="h-16 object-contain" />
          </div>
          
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Maya Conversational Intelligence
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              AI-Powered Merchandising Intelligence
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="text"
                placeholder="Enter your user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <p className="text-center text-xs text-muted-foreground mt-6">
            © 2024 Algonomy. All rights reserved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
