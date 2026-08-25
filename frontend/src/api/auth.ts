import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile } from '../types/clinical';

export interface LoginCredentials {
  email: string;
  password?: string;
  organizationId?: string;
}

export async function loginWithSupabase(credentials: LoginCredentials): Promise<{
  user: UserProfile;
  accessToken: string;
}> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password || '',
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session || !data.user) {
      throw new Error('No session returned from Supabase Auth.');
    }

    const user: UserProfile = {
      id: data.user.id,
      email: data.user.email || credentials.email,
      full_name: data.user.user_metadata?.full_name || 'Dr. Clinical User',
      role: data.user.user_metadata?.role || 'Attending Cardiologist',
      hospital_name: credentials.organizationId || 'St. Jude Heart & Vascular Institute',
      department: 'Cardiology Decision Support',
    };

    localStorage.setItem('hf_demo_access_token', data.session.access_token);
    localStorage.setItem('hf_user_profile', JSON.stringify(user));

    return { user, accessToken: data.session.access_token };
  }

  // Fallback demo auth when Supabase credentials are not configured
  if (!credentials.email || !credentials.email.includes('@')) {
    throw new Error('Please enter a valid clinical email address');
  }

  const demoUser: UserProfile = {
    id: 'user_clinician_' + Math.floor(Math.random() * 10000),
    email: credentials.email,
    full_name: 'Dr. Sarah Jenkins, MD',
    role: 'Attending Cardiologist',
    hospital_name: credentials.organizationId || 'St. Jude Heart & Vascular Center',
    department: 'Department of Cardiovascular Medicine',
  };

  const demoToken = 'sb_demo_jwt_' + Date.now();
  localStorage.setItem('hf_demo_access_token', demoToken);
  localStorage.setItem('hf_user_profile', JSON.stringify(demoUser));

  return { user: demoUser, accessToken: demoToken };
}

export async function logoutFromSupabase(): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut().catch(() => {});
  }
  localStorage.removeItem('hf_demo_access_token');
  localStorage.removeItem('hf_user_profile');
}

export async function loginWithGoogle(): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      throw new Error(error.message);
    }
  } else {
    throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
  }
}

export async function getCurrentUserSession(): Promise<UserProfile | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session?.user) {
        const user = data.session.user;
        const profile: UserProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Dr. Clinical User',
          role: user.user_metadata?.role || 'Attending Cardiologist',
          hospital_name: 'St. Jude Heart & Vascular Institute',
          department: 'Cardiology Decision Support',
        };
        localStorage.setItem('hf_demo_access_token', data.session.access_token);
        localStorage.setItem('hf_user_profile', JSON.stringify(profile));
        return profile;
      }
    } catch (e) {
      console.warn('Error reading Supabase session:', e);
    }
  }

  const saved = localStorage.getItem('hf_user_profile');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  return null;
}
