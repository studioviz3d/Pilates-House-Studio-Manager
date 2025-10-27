import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../firebase';
import { UserRole } from '../../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  studioId: string | null;
  userRole: UserRole;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [studioId, setStudioId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.Customer);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Force refresh to get the latest claims after signup
          const tokenResult = await firebaseUser.getIdTokenResult(true);
          const claims = tokenResult.claims;
          setStudioId((claims.studioId as string) ?? null);
          setUserRole((claims.role as UserRole) ?? UserRole.Admin); // Default new users to Admin
        } catch (error) {
          console.error("Error fetching user claims:", error);
          setStudioId(null);
          setUserRole(UserRole.Customer);
        }
      } else {
        setStudioId(null);
        setUserRole(UserRole.Customer);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    studioId,
    userRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
