
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import supabase from '../services/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email, password) => Promise<void>;
  signup: (email, password) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getUserProfile = async (supabaseUser: SupabaseUser): Promise<User> => {
    // Fetch the user's role from the public 'users' table
    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', supabaseUser.id)
        .single();

    let role: 'user' | 'admin' = 'user';
    if (error) {
        console.warn(`Could not fetch user role for ${supabaseUser.id}. Defaulting to 'user'. Error:`, error.message);
    } else if (data) {
        role = data.role === 'admin' ? 'admin' : 'user';
    }

    return {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        role: role,
    };
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getUserProfile(session.user);
        setUser(profile);
      }
      setLoading(false);
    };
    
    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
         if (session?.user) {
            const profile = await getUserProfile(session.user);
            setUser(profile);
        } else {
            setUser(null);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };
  
  const signup = async (email, password) => {
    // NOTE: You should have a Supabase Function (trigger) that creates a 
    // corresponding row in your public.users table whenever a new user signs up.
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
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
