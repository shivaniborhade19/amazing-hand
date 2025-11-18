import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Fixed credentials - change these to your desired values
const ADMIN_USERNAME = 'TenxerLabs';
const ADMIN_PASSWORD = 'Tenxer12345';

interface LoginProps {
  onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem('isAuthenticated', 'true');
      // small delay helps modal close before auto-upload fires
      setTimeout(() => {
        onLogin(); // ✅ parent handles hiding modal + triggering upload
      }, 150);
    } else {
      setError('Invalid username or password');
    }
    
    
    setIsLoading(false);
  };

  return (
    
    <Card className="w-full bg-[#fff9ef]">

      <CardHeader className="space-y-1 text-center p-4 pb-2"> {/* 2. Reduced padding here (p-4 pb-2) */}
          <CardTitle className="text-xl font-bold">Log In</CardTitle> {/* 3. Smaller title (text-xl) */}
          <CardDescription className="text-xs">
            Enter credentials to upload code 
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2"> {/* 4. Reduced padding here (p-4 pt-2) */}
          <form onSubmit={handleSubmit} className="space-y-3"> {/* 5. Reduced space (space-y-3) */}
            <div className="space-y-1"> {/* 6. Reduced space (space-y-1) */}
              <Label htmlFor="username" className="text-sm">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In & Uploding'}
            </Button>
          </form>
          </CardContent>
      </Card>
    
    // </div>
  );
};

export default Login;