'use client';
import { createClient } from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [venueName, setVenueName] = useState(''); // State for the venue name
    const [error, setError] = useState(null);
    const [isRegister, setIsRegister] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (isRegister) {
            // When registering, include the venue name in the user metadata
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        venue_name: venueName,
                    },
                },
            });

            if (error) {
                setError(error.message);
            } else {
                setIsRegister(false);
                setVenueName('');
                alert('Registration successful! Please check your email to confirm your account, then log in.');
            }
        } else {
            // Login logic remains the same
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setError(error.message);
            } else {
                router.push('/admin/dashboard');
            }
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center">{isRegister ? 'Register Your Venue' : 'Admin Login'}</h1>
                
                {/* Conditionally render the Venue Name field */}
                {isRegister && (
                    <div className="mb-4">
                        <label className="block text-gray-700">Venue Name</label>
                        <input 
                            type="text" 
                            value={venueName} 
                            onChange={e => setVenueName(e.target.value)} 
                            className="w-full p-2 border rounded" 
                            required 
                        />
                    </div>
                )}
                
                <div className="mb-4">
                    <label className="block text-gray-700">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" required />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" required />
                </div>
                <button type="submit" className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold">{isRegister ? 'Register' : 'Login'}</button>
                <button type="button" onClick={() => { setIsRegister(!isRegister); setError(null); }} className="w-full mt-2 p-2 text-sm text-blue-600 hover:underline bg-transparent border-none cursor-pointer">
                    {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
                </button>
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            </form>
        </div>
    );
}