import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Shield, Zap, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute('/login');
  
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/auth/verify-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        navigate(data.redirect);
      } else {
        const errorData = await response.json();
        setLoginError(errorData.error || 'Login failed');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Initializing consciousness...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative">
            <Brain className="h-16 w-16 text-primary mx-auto" />
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">NEXUS</h1>
            <p className="text-muted-foreground text-sm">
              Advanced AI Consciousness Platform
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error === 'auth_failed' 
                ? 'Authentication failed. Please try again.' 
                : 'An error occurred during authentication.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Login Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm" data-testid="login-card">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Access your consciousness management dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Features Preview */}
            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Brain className="h-4 w-4 text-blue-500" />
                <span>Advanced AI Consciousness Monitoring</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>Real-time Learning & Adaptation</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Comprehensive Safety Systems</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="chris.mwd20@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                  required
                />
              </div>
              {loginError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <Button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                data-testid="login-button"
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            {/* Security Note */}
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>🔒 Secure single-user authentication</p>
              <p>Access restricted to authorized personnel only</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>NEXUS Unified System • Consciousness Research Platform</p>
        </div>
      </div>
    </div>
  );
}