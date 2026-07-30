import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginPageProps {
    onLogin: (role: UserRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('coach@egerton.fc');
    const [password, setPassword] = useState('password123');
    const [role, setRole] = useState<UserRole>('COACH');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        onLogin(role);
    };

    const handleRoleSelect = (selectedRole: UserRole) => {
        setRole(selectedRole);
        if (selectedRole === 'COACH') {
            setEmail('coach@egerton.fc');
        } else {
            setEmail('captain@egerton.fc');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden select-none">
            {/* Background Graphic Rings */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full border-[10px] border-primary/5 pointer-events-none"></div>
            <div className="absolute bottom-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full border-[10px] border-primary/5 pointer-events-none"></div>

            <div className="w-full max-w-md bg-surface-container-low border border-outline-variant/30 shadow-2xl rounded-xl p-8 relative z-10 glass-panel">
                {/* Crest representation */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden border border-primary/30 shadow-lg mb-4">
                        <img
                            className="w-full h-full object-cover"
                            alt="Egerton FC Crest"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZhG6dvXVnCTj57MdspJa73P-F8qYvkI0_9IJGuRTnRHwc8G4kixfeSPzaw6Kpzrf1agcR4SzQVcmUmrbJk5sdlCe3FL8ViUpi6vOevQ2rM_XCry_Q3s_ejoAkBJ24eTcZvL0vsc9qfJnfdKqPEaDtMEBE-UW90XIpwBcKj06Pt3AQz2K0_y6ux1217HyL0tw44OZ7jGDbwkIn4XUsGHS04JKiSJ-E7sKC3e7bqltCB7L7MwXX1KeyB3cB9GgAonsdpktmZK2HkJgN"
                        />
                    </div>
                    <h1 className="font-display-md text-display-md font-bold text-on-surface tracking-tight text-center">Egerton FC</h1>
                    <p className="font-label-sm text-[10px] text-primary uppercase tracking-[0.25em] mt-1">High Performance System</p>
                </div>

                {error && (
                    <div className="mb-4 bg-error-container/20 border border-error text-error px-3 py-2.5 rounded-lg text-xs font-semibold">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Role select tabs */}
                    <div className="space-y-2">
                        <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block">Access Gate</label>
                        <div className="grid grid-cols-2 gap-2 bg-surface-container-high/40 p-1.5 rounded-xl border border-outline-variant/20">
                            <button
                                type="button"
                                onClick={() => handleRoleSelect('COACH')}
                                className={`py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${role === 'COACH'
                                    ? 'bg-primary text-on-primary shadow-lg font-bold'
                                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                                    }`}
                            >
                                Coach Mode
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRoleSelect('CAPTAIN')}
                                className={`py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${role === 'CAPTAIN'
                                    ? 'bg-primary text-on-primary shadow-lg font-bold'
                                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                                    }`}
                            >
                                Captain Mode
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block">System Email Address</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-surface-container-highest/20 border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 text-xs transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="name@egerton.fc"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block">Access Security Token</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-surface-container-highest/20 border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 text-xs transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full py-4 bg-primary text-on-primary font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer"
                        >
                            Sign In to Portal
                        </button>
                    </div>
                </form>

                <p className="text-[10px] text-center text-on-surface-variant/60 font-semibold uppercase mt-8 tracking-wider">
                    Secured by Egerton Athletics Board
                </p>
            </div>
        </div>
    );
};
