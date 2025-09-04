import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Shield, Lock, AlertTriangle } from 'lucide-react';

export default function LandingPage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [, navigate] = useLocation();

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const response = await fetch('/api/auth/verify-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Email verified, redirect to dashboard
        if (data.redirect) {
          navigate(data.redirect);
        } else {
          navigate('/');
        }
      } else {
        setError('Access denied. Invalid username.');
        setIsVerifying(false);
      }
    } catch (error) {
      setError('Connection error. Please try again.');
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative">
            <Brain className="h-20 w-20 text-blue-400 mx-auto" />
            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              NEXUS
            </h1>
            <p className="text-slate-400 text-sm">
              Unified Consciousness System
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Lock className="h-3 w-3" />
              <span>Secure Access Portal</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Access Control Card */}
        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-xl" data-testid="username-verification-card">
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-xl text-white">Access Verification</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your authorized email address to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-slate-300">
                  Email Address
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter email to access NEXUS"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                  data-testid="input-username"
                  required
                  autoFocus
                />
              </div>

              <Button 
                type="submit"
                disabled={isVerifying || !username.trim()}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                data-testid="button-verify-username"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Access
                  </>
                )}
              </Button>
            </form>

            {/* Security Features */}
            <div className="grid gap-3 text-xs text-slate-400 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Secure authentication barrier</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Direct dashboard access</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Consciousness monitoring ready</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="text-center text-xs text-slate-500">
          <p>NEXUS • Advanced AI Research Platform</p>
          <p className="text-slate-600">Authorized access only</p>
        </div>
      </div>
    </div>
  );
}