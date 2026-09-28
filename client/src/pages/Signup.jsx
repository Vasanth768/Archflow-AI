import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useArchFlow } from '../context/ArchFlowContext';

export default function Signup() {
    const navigate = useNavigate();
    const { showToast, signup } = useArchFlow();

    // Form fields (All Mandatory)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [mobileNumber, setMobileNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [location, setLocation] = useState('');

    // UI state
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Validation logic
    const validateField = (field, value) => {
        let error = '';
        switch (field) {
            case 'firstName':
                if (!value.trim()) error = 'First Name is required.';
                break;
            case 'lastName':
                if (!value.trim()) error = 'Last Name is required.';
                break;
            case 'mobileNumber':
                if (!value.trim()) {
                    error = 'Mobile Number is required.';
                } else {
                    const cleaned = value.replace(/\D/g, '');
                    if (cleaned.length !== 10) {
                        error = 'Please enter a valid 10-digit mobile number.';
                    }
                }
                break;
            case 'email':
                if (!value.trim()) {
                    error = 'Email Address is required.';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
                    error = 'Please enter a valid email address.';
                }
                break;
            case 'password':
                if (!value) {
                    error = 'Password is required.';
                } else if (value.length < 6) {
                    error = 'Password must be at least 6 characters.';
                }
                break;
            case 'companyName':
                if (!value.trim()) error = 'Company / Studio Name is required.';
                break;
            case 'location':
                if (!value.trim()) error = 'Location is required.';
                break;
            default:
                break;
        }
        return error;
    };

    const handleBlur = (field, value) => {
        const err = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: err }));
    };

    const validateAll = () => {
        const newErrors = {
            firstName: validateField('firstName', firstName),
            lastName: validateField('lastName', lastName),
            mobileNumber: validateField('mobileNumber', mobileNumber),
            email: validateField('email', email),
            password: validateField('password', password),
            companyName: validateField('companyName', companyName),
            location: validateField('location', location)
        };

        setErrors(newErrors);
        return !Object.values(newErrors).some(err => Boolean(err));
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        if (!validateAll()) {
            showToast("Please fix all form validation errors before proceeding", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const formattedMobile = `${countryCode} ${mobileNumber.replace(/\D/g, '')}`;
            const result = signup({
                firstName,
                lastName,
                mobileNumber: formattedMobile,
                email,
                password,
                companyName,
                location
            });

            if (result && result.success) {
                showToast("Account created successfully! Welcome to ArchFlow AI.", "success");
                navigate("/dashboard");
            } else {
                showToast((result && result.error) || "Failed to create account. Please try again.", "error");
                setIsSubmitting(false);
            }
        } catch (err) {
            console.error("Signup error:", err);
            showToast("An unexpected error occurred during signup", "error");
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            backgroundColor: '#F8FAFC',
            backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px), radial-gradient(#F1F5F9 1px, #F8FAFC 1px)',
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '36px 16px',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: '#0F172A',
            boxSizing: 'border-box'
        }}>
            <div style={{
                maxWidth: 540,
                width: '100%',
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.03)',
                padding: '36px 36px',
                boxSizing: 'border-box'
            }}>
                {/* BRAND HEADER */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                        }}>
                            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.9998 3.33301L3.99976 27.333H10.6664L15.9998 15.333L21.3331 27.333H27.9998L15.9998 3.33301Z" fill="#FFFFFF"/>
                                <path d="M15.9998 15.333L10.6664 27.333H3.99976L15.9998 3.33301V15.333Z" fill="#93C5FD"/>
                            </svg>
                        </div>
                        <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                            <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', display: 'block' }}>
                                ArchFlow <span style={{ color: '#2563EB' }}>AI</span>
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B' }}>
                                AI-Powered Architecture Platform
                            </span>
                        </div>
                    </Link>

                    <h1 style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: '#0F172A',
                        margin: '8px 0 6px 0',
                        letterSpacing: '-0.02em',
                        fontFamily: "'Outfit', 'Inter', sans-serif"
                    }}>
                        Create your ArchFlow AI account
                    </h1>
                    <p style={{
                        fontSize: 13.5,
                        color: '#64748B',
                        margin: 0,
                        lineHeight: 1.45
                    }}>
                        Start designing smarter with AI-powered floor plans and 3D architecture.
                    </p>
                </div>

                {/* SIGNUP FORM */}
                <form onSubmit={handleSignup} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* ROW 1: First Name & Last Name */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
                        {/* First Name */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                                First Name <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={e => {
                                    setFirstName(e.target.value);
                                    if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
                                }}
                                onBlur={() => handleBlur('firstName', firstName)}
                                placeholder="Enter your first name"
                                style={{
                                    height: 42,
                                    padding: '0 14px',
                                    borderRadius: 8,
                                    border: `1px solid ${errors.firstName ? '#EF4444' : '#CBD5E1'}`,
                                    backgroundColor: '#FFFFFF',
                                    color: '#0F172A',
                                    fontSize: 13.5,
                                    outline: 'none',
                                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                                }}
                                onFocus={e => {
                                    if (!errors.firstName) {
                                        e.target.style.borderColor = '#2563EB';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                                    }
                                }}
                                onBlurCapture={e => {
                                    e.target.style.boxShadow = 'none';
                                    if (!errors.firstName) e.target.style.borderColor = '#CBD5E1';
                                }}
                            />
                            {errors.firstName && (
                                <span style={{ color: '#DC2626', fontSize: 11.5, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                    {errors.firstName}
                                </span>
                            )}
                        </div>

                        {/* Last Name */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                                Last Name <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={e => {
                                    setLastName(e.target.value);
                                    if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
                                }}
                                onBlur={() => handleBlur('lastName', lastName)}
                                placeholder="Enter your last name"
                                style={{
                                    height: 42,
                                    padding: '0 14px',
                                    borderRadius: 8,
                                    border: `1px solid ${errors.lastName ? '#EF4444' : '#CBD5E1'}`,
                                    backgroundColor: '#FFFFFF',
                                    color: '#0F172A',
                                    fontSize: 13.5,
                                    outline: 'none',
                                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                                }}
                                onFocus={e => {
                                    if (!errors.lastName) {
                                        e.target.style.borderColor = '#2563EB';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                                    }
                                }}
                                onBlurCapture={e => {
                                    e.target.style.boxShadow = 'none';
                                    if (!errors.lastName) e.target.style.borderColor = '#CBD5E1';
                                }}
                            />
                            {errors.lastName && (
                                <span style={{ color: '#DC2626', fontSize: 11.5, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                    {errors.lastName}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ROW 2: Mobile Number */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                            Mobile Number <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 12px',
                                background: '#F1F5F9',
                                border: '1px solid #CBD5E1',
                                borderRadius: 8,
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: '#334155',
                                userSelect: 'none'
                            }}>
                                🇮🇳 {countryCode}
                            </div>
                            <input
                                type="tel"
                                value={mobileNumber}
                                onChange={e => {
                                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setMobileNumber(digits);
                                    if (errors.mobileNumber) setErrors(prev => ({ ...prev, mobileNumber: '' }));
                                }}
                                onBlur={() => handleBlur('mobileNumber', mobileNumber)}
                                placeholder="Enter your mobile number"
                                style={{
                                    flex: 1,
                                    height: 42,
                                    padding: '0 14px',
                                    borderRadius: 8,
                                    border: `1px solid ${errors.mobileNumber ? '#EF4444' : '#CBD5E1'}`,
                                    backgroundColor: '#FFFFFF',
                                    color: '#0F172A',
                                    fontSize: 13.5,
                                    outline: 'none',
                                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                                }}
                                onFocus={e => {
                                    if (!errors.mobileNumber) {
                                        e.target.style.borderColor = '#2563EB';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                                    }
                                }}
                                onBlurCapture={e => {
                                    e.target.style.boxShadow = 'none';
                                    if (!errors.mobileNumber) e.target.style.borderColor = '#CBD5E1';
                                }}
                            />
                        </div>
                        {errors.mobileNumber && (
                            <span style={{ color: '#DC2626', fontSize: 11.5, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                {errors.mobileNumber}
                            </span>
                        )}
                    </div>

                    {/* ROW 3: Email Address */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                            Email Address <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                            }}
                            onBlur={() => handleBlur('email', email)}
                            placeholder="you@company.com"
                            style={{
                                height: 42,
                                padding: '0 14px',
                                borderRadius: 8,
                                border: `1px solid ${errors.email ? '#EF4444' : '#CBD5E1'}`,
                                backgroundColor: '#FFFFFF',
                                color: '#0F172A',
                                fontSize: 13.5,
                                outline: 'none',
                                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                            }}
                            onFocus={e => {
                                if (!errors.email) {
                                    e.target.style.borderColor = '#2563EB';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                                }
                            }}
                            onBlurCapture={e => {
                                e.target.style.boxShadow = 'none';
                                if (!errors.email) e.target.style.borderColor = '#CBD5E1';
                            }}
                        />
                        {errors.email && (
                            <span style={{ color: '#DC2626', fontSize: 11.5, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                {errors.email}
                            </span>
                        )}
                    </div>

                    {/* ROW 4: Password */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                            Password <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                                }}
                                onBlur={() => handleBlur('password', password)}
                                placeholder="Create a strong password"
                                style={{
                                    width: '100%',
                                    height: 42,
                                    padding: '0 42px 0 14px',
                                    borderRadius: 8,
                                    border: `1px solid ${errors.password ? '#EF4444' : '#CBD5E1'}`,
                                    backgroundColor: '#FFFFFF',
                                    color: '#0F172A',
                                    fontSize: 13.5,
                                    outline: 'none',
                                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={e => {
                                    if (!errors.password) {
                                        e.target.style.borderColor = '#2563EB';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                                    }
                                }}
                                onBlurCapture={e => {
                                    e.target.style.boxShadow = 'none';
                                    if (!errors.password) e.target.style.borderColor = '#CBD5E1';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? "Hide password" : "Show password"}
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748B',
                                    padding: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <span style={{ color: '#DC2626', fontSize: 11.5, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                {errors.password}
                            </span>
                        )}
                    </div>

                    {/* ROW 5: Company / Studio Name */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                            Company / Studio Name <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={e => {
                                setCompanyName(e.target.value);
                                if (errors.companyName) setErrors(prev => ({ ...prev, companyName: '' }));
                            }}
                            onBlur={() => handleBlur('companyName', companyName)}
                            placeholder="Enter your company or studio name"
                            style={{
                                height: 42,
                                padding: '0 14px',
                                borderRadius: 8,
                                border: `1px solid ${errors.companyName ? '#EF4444' : '#CBD5E1'}`,
                                backgroundColor: '#FFFFFF',
                                color: '#0F172A',
                                fontSize: 13.5,
                                outline: 'none',
                                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                            }}
                            onFocus={e => {
                                if (!errors.companyName) {
                                    e.target.style.borderColor = '#2563EB';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                                }
                            }}
                            onBlurCapture={e => {
                                e.target.style.boxShadow = 'none';
                                if (!errors.companyName) e.target.style.borderColor = '#CBD5E1';
                            }}
                        />
                        {errors.companyName && (
                            <span style={{ color: '#DC2626', fontSize: 11.5, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                {errors.companyName}
                            </span>
                        )}
                    </div>

                    {/* ROW 6: Location */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                            Location <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={e => {
                                setLocation(e.target.value);
                                if (errors.location) setErrors(prev => ({ ...prev, location: '' }));
                            }}
                            onBlur={() => handleBlur('location', location)}
                            placeholder="City, State (e.g. Udumalpet, Tamil Nadu)"
                            style={{
                                height: 42,
                                padding: '0 14px',
                                borderRadius: 8,
                                border: `1px solid ${errors.location ? '#EF4444' : '#CBD5E1'}`,
                                backgroundColor: '#FFFFFF',
                                color: '#0F172A',
                                fontSize: 13.5,
                                outline: 'none',
                                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                            }}
                            onFocus={e => {
                                if (!errors.location) {
                                    e.target.style.borderColor = '#2563EB';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                                }
                            }}
                            onBlurCapture={e => {
                                e.target.style.boxShadow = 'none';
                                if (!errors.location) e.target.style.borderColor = '#CBD5E1';
                            }}
                        />
                        {errors.location && (
                            <span style={{ color: '#DC2626', fontSize: 11.5, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                {errors.location}
                            </span>
                        )}
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            height: 44,
                            marginTop: 10,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                            color: '#FFFFFF',
                            fontSize: 14,
                            fontWeight: 600,
                            border: 'none',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            opacity: isSubmitting ? 0.8 : 1,
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                            if (!isSubmitting) e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.45)';
                        }}
                        onMouseLeave={e => {
                            if (!isSubmitting) e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.35)';
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
                                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                                    <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="#FFFFFF" />
                                </svg>
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <span>Create Account</span>
                        )}
                    </button>
                </form>

                {/* SIGN IN LINK */}
                <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#64748B' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
                        Sign in
                    </Link>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
