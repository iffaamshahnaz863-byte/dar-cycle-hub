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
    // Step 1: Sign up the user in Supabase Auth.
    // Email confirmation is enabled by default in Supabase.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Signup successful, but no user data returned.");

    // Step 2: Insert a corresponding profile into the public 'users' table.
    // This relies on RLS policies allowing a newly signed-up user to insert their own profile.
    const { error: insertError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: authData.user.email,
      role: 'user', // New users default to the 'user' role.
    });
    
    if (insertError) {
      // This is a critical error. The auth user was created, but their public profile was not.
      // A more robust solution would be a database trigger, but this client-side insert
      // handles the user's request.
      console.error("Critical: User created in auth, but profile creation failed:", insertError);
      throw new Error(`Account created, but we couldn't set up your profile. Please contact support. Error: ${insertError.message}`);
    }
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
    // FIX: Changed 'Auth.Provider' in the error message to 'AuthProvider' to prevent a potential parsing error.
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
