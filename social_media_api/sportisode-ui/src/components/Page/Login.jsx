// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { submitLogin, updateLoginField } from '../../store/formsSlice';

// --- Shadcn/ui Imports ---
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { // New explicit Field component imports
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../components/ui/field";
import { Alert, AlertDescription } from '../components/ui/alert'; // Useful for server errors
import { Eye, EyeOff, X } from 'lucide-react';


const Login = () => {
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const { login } = useSelector((state) => state.forms);
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const { username, password } = login;

    // Redirect authenticated users immediately
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic client-side validation check
        if (!username || !password) return;

        // Dispatch the async thunk
        const resultAction = await dispatch(submitLogin({ username, password }));

        if (submitLogin.fulfilled.match(resultAction)) {
            navigate('/'); // Redirect on success
        }
        // Server error is handled by the Redux 'error' state
    };
    
    // Remove local error state - using Redux state now

    return (
        <div className="flex justify-center items-center min-h-screen p-4" style={{ backgroundColor: '#15202B' }}>
            <Card className="w-full max-w-md shadow-2xl" style={{ backgroundColor: '#1E2732', borderColor: '#374151' }}>
                
                <CardHeader className="space-y-1">
                    <CardTitle className="text-3xl font-semibold text-center text-white">SPORTISODE</CardTitle>
                    <p className="text-center text-lg text-gray-400">Sign in to your account</p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit}>
                        {/* Use FieldSet for semantic grouping */}
                        <FieldSet>
                            <FieldGroup className="space-y-6">

                                {/* --- Username Field --- */}
                                <Field>
                                    <FieldLabel htmlFor="username" className="text-gray-100">Username</FieldLabel>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Your Sportisode username"
                                        value={username}
                                        onChange={(e) => dispatch(updateLoginField({ field: 'username', value: e.target.value }))}
                                        style={{
                                            backgroundColor: '#15202B',
                                            borderColor: '#4B5563',
                                            color: 'white'
                                        }}
                                        className="focus:border-[#00BFFF]"
                                        required
                                        autoComplete="off"
                                    />
                                    {/* Placeholder for client-side error (if using Zod/RHF) */}
                                    {/* <FieldError>Username is required</FieldError> */}
                                </Field>

                                {/* --- Password Field --- */}
                                <Field>
                                    <FieldLabel htmlFor="password" className="text-white">Password</FieldLabel>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => dispatch(updateLoginField({ field: 'password', value: e.target.value }))}
                                            style={{
                                                backgroundColor: '#15202B',
                                                borderColor: '#4B5563',
                                                color: 'white'
                                            }}
                                            className="focus:border-[#00BFFF] pr-10 transition-all duration-200"
                                            required
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                        
                        {/* Server-Side Error Message Area (from Redux Thunk) */}
                        {error && (
                            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
                                <AlertDescription className="flex items-center">
                                    <X className="w-4 h-4 mr-2" />
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* --- Submit Button --- */}
                        <Button
                            type="submit"
                            disabled={loading === 'pending'}
                            className="w-full text-black font-extrabold transition-all duration-200 mt-6 py-3 text-lg transform hover:scale-105 active:scale-95"
                            style={{
                                backgroundColor: '#00BFFF',
                                opacity: loading === 'pending' ? 0.9 : 1
                            }}
                        >
                            {loading === 'pending' ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                                    Authenticating...
                                </div>
                            ) : (
                                'Welcome Back!'
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col">
                    <p className="text-center text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium hover:underline" style={{ color: '#00BFFF' }}>
                            Sign Up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;