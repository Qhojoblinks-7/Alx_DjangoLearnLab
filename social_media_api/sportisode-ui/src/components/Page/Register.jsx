// src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { submitRegister, updateRegisterField, setRegisterTouched, validateField } from '../../store/formsSlice';
import { loginUser } from '../../store/authSlice';

// Shadcn/ui Imports
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldSet,
} from "../components/ui/field";
import { Alert, AlertDescription } from '../components/ui/alert';
import { Eye, EyeOff, Check, X } from 'lucide-react';

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const dispatch = useDispatch();
    const { register } = useSelector((state) => state.forms);
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const {
        username,
        email,
        password,
        confirmPassword,
        errors: validationErrors,
        touched,
        isSubmitting,
        submitError,
    } = register;

    // Redirect authenticated users immediately
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        dispatch(updateRegisterField({ field: id, value }));

        // Validate field if it has been touched
        if (touched[id]) {
            dispatch(validateField({ form: 'register', field: id, value }));
        }
    };

    const handleBlur = (e) => {
        const { id, value } = e.target;
        dispatch(setRegisterTouched(id));
        dispatch(validateField({ form: 'register', field: id, value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields
        const fields = ['username', 'email', 'password', 'confirmPassword'];
        fields.forEach(field => {
            const value = register[field];
            dispatch(setRegisterTouched(field));
            dispatch(validateField({ form: 'register', field, value }));
        });

        // Check if there are any validation errors
        const hasErrors = Object.values(validationErrors).some(error => error);
        if (hasErrors) {
            return;
        }

        // Submit the form
        const resultAction = await dispatch(submitRegister({
            username,
            email,
            password,
            confirmPassword,
        }));

        if (submitRegister.fulfilled.match(resultAction)) {
            // Auto-login after successful registration
            await dispatch(loginUser({ email, password }));
            navigate('/');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen p-4 bg-dark-bg">
            <Card className="w-full max-w-lg bg-dark-card border-gray-700 shadow-2xl">
                
                <CardHeader className="space-y-1">
                    <CardTitle className="text-3xl font-semibold text-center text-white">Join SPORTISODE</CardTitle>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Your Profile Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">Your Profile</h3>

                            {/* Username Field */}
                            <Field>
                                <FieldLabel htmlFor="username" className="text-white">
                                    Choose your Sportisode handle
                                </FieldLabel>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="sportsfan123"
                                    value={username}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`bg-dark-bg border-gray-600 focus:border-[#00BFFF] text-white transition-all duration-200 ${
                                        validationErrors.username ? 'border-red-500' : ''
                                    }`}
                                    required
                                    autoComplete="username"
                                    aria-describedby={validationErrors.username ? "username-error" : undefined}
                                />
                                {validationErrors.username && (
                                    <div className="flex items-center mt-1 text-red-400 text-sm" id="username-error">
                                        <X className="w-4 h-4 mr-1" />
                                        {validationErrors.username}
                                    </div>
                                )}
                            </Field>

                            {/* Email Field */}
                            <Field>
                                <FieldLabel htmlFor="email" className="text-white">Email Address</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="coach@example.com"
                                    value={email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`bg-dark-bg border-gray-600 focus:border-[#00BFFF] text-white transition-all duration-200 ${
                                        validationErrors.email ? 'border-red-500' : ''
                                    }`}
                                    required
                                    autoComplete="email"
                                    aria-describedby={validationErrors.email ? "email-error" : undefined}
                                />
                                {validationErrors.email && (
                                    <div className="flex items-center mt-1 text-red-400 text-sm" id="email-error">
                                        <X className="w-4 h-4 mr-1" />
                                        {validationErrors.email}
                                    </div>
                                )}
                            </Field>
                        </div>

                        {/* Security Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">Security</h3>

                            {/* Password Field */}
                            <Field>
                                <FieldLabel htmlFor="password" className="text-white">Create Password</FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`bg-dark-bg border-gray-600 focus:border-[#00BFFF] text-white transition-all duration-200 pr-10 ${
                                            validationErrors.password ? 'border-red-500' : ''
                                        }`}
                                        required
                                        autoComplete="new-password"
                                        aria-describedby={validationErrors.password ? "password-error" : undefined}
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
                                {validationErrors.password && (
                                    <div className="flex items-center mt-1 text-red-400 text-sm" id="password-error">
                                        <X className="w-4 h-4 mr-1" />
                                        {validationErrors.password}
                                    </div>
                                )}
                            </Field>

                            {/* Confirm Password Field */}
                            <Field>
                                <FieldLabel htmlFor="confirmPassword" className="text-white">Confirm Password</FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Re-enter your password"
                                        value={confirmPassword}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`bg-dark-bg border-gray-600 focus:border-[#00BFFF] text-white transition-all duration-200 pr-10 ${
                                            validationErrors.confirmPassword ? 'border-red-500' : confirmPassword && password === confirmPassword ? 'border-green-500' : ''
                                        }`}
                                        required
                                        autoComplete="new-password"
                                        aria-describedby={validationErrors.confirmPassword ? "confirm-password-error" : undefined}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    {confirmPassword && password === confirmPassword && (
                                        <Check className="absolute right-12 top-1/2 transform -translate-y-1/2 text-green-400 w-4 h-4" />
                                    )}
                                </div>
                                {validationErrors.confirmPassword && (
                                    <div className="flex items-center mt-1 text-red-400 text-sm" id="confirm-password-error">
                                        <X className="w-4 h-4 mr-1" />
                                        {validationErrors.confirmPassword}
                                    </div>
                                )}
                            </Field>
                        </div>
                        
                        {/* Server-Side Error Message Area */}
                        {(error || submitError) && (
                            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
                                <AlertDescription className="flex items-center">
                                    <X className="w-4 h-4 mr-2" />
                                    {submitError || error}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isSubmitting || Object.keys(validationErrors).length > 0}
                            className="w-full bg-[#00BFFF] text-black font-extrabold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-6 py-3 text-lg transform hover:scale-105 active:scale-95"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                                    Creating Account...
                                </div>
                            ) : (
                                'Join the Squad! ⚽'
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col">
                    <p className="text-center text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-sport-accent font-medium hover:underline text-[#00BFFF]">
                            Sign In
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Register;