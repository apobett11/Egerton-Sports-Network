// You are writing code for a system governed by our Master Architecture Contract.
// Commandment C-01 (JWT Authentication) and C-02 (Role-Based Access Control) govern this context.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, User } from '../types';

interface AuthContextType {
    isLoggedIn: boolean;
    currentRole: UserRole;
    currentUser: User | null;
    isLoading: boolean;
    login: (role: UserRole, email: string, token: string) => Promise<boolean>;
    logout: () => void;
    checkPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [currentRole, setCurrentRole] = useState<UserRole>('GUEST');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // Load session sync
        const sessionActive = localStorage.getItem('team-session') === 'active';
        const role = (localStorage.getItem('team-role') as UserRole) || 'GUEST';
        const email = localStorage.getItem('team-email') || '';
        const name = localStorage.getItem('team-username') || 'Spectator';

        if (sessionActive && role !== 'GUEST') {
            setIsLoggedIn(true);
            setCurrentRole(role);
            setCurrentUser({
                id: 'u-user-current',
                name: role === 'COACH' ? 'Coach Marcus' : 'Captain Thorne',
                email: email,
                role: role,
                teamId: 't-egerton-fc'
            });
        } else {
            // Default spectating role
            setIsLoggedIn(role !== 'GUEST');
            setCurrentRole(role);
            if (role === 'GUEST') {
                setCurrentUser({
                    id: 'u-guest',
                    name: 'Spectator Guest',
                    email: 'spectator@egerton.fc',
                    role: 'GUEST',
                    teamId: 't-egerton-fc'
                });
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (role: UserRole, email: string, token: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            // Emulate backend endpoint validation
            // Real production would send POST /api/auth/login and retrieve JWT
            const mockJwt = 'mock-jwt-token-xyz-123';

            localStorage.setItem('team-session', 'active');
            localStorage.setItem('team-role', role);
            localStorage.setItem('team-jwt', mockJwt);
            localStorage.setItem('team-email', email);
            localStorage.setItem('team-username', role === 'COACH' ? 'Marcus Thorne' : 'Leo Van Dijk');

            setCurrentRole(role);
            setIsLoggedIn(true);
            setCurrentUser({
                id: 'u-user-current',
                name: role === 'COACH' ? 'Coach Marcus' : 'Captain Leo',
                email: email,
                role: role,
                teamId: 't-egerton-fc'
            });

            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('team-session');
        localStorage.removeItem('team-role');
        localStorage.removeItem('team-jwt');
        localStorage.removeItem('team-email');
        localStorage.removeItem('team-username');

        setIsLoggedIn(false);
        setCurrentRole('GUEST');
        setCurrentUser({
            id: 'u-guest',
            name: 'Spectator Guest',
            email: 'spectator@egerton.fc',
            role: 'GUEST',
            teamId: 't-egerton-fc'
        });
    };

    /**
     * RBAC Policy Checker
     */
    const checkPermission = (requiredRole: UserRole): boolean => {
        if (currentRole === 'COACH') return true; // Coach has root privileges
        if (currentRole === requiredRole) return true;
        return false;
    };

    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            currentRole,
            currentUser,
            isLoading,
            login,
            logout,
            checkPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Component-level guard for gated UI widgets.
 */
export const RoleGuard: React.FC<{
    allowedRoles: UserRole[];
    fallback?: React.ReactNode;
    children: React.ReactNode;
}> = ({ allowedRoles, fallback = null, children }) => {
    const { currentRole } = useAuth();

    // Coach can always view everything
    if (currentRole === 'COACH' || allowedRoles.includes(currentRole)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
