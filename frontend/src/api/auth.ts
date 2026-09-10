import { supabase } from './supabase';
import { UserProfile } from '../types/clinical';

export interface LoginCredentials {
  email: string;
  password: string;
  organizationId?: string;
}

export interface SignupCredentials {
  fullName: string;
  email: string;
  password: string;
  organizationId: string;
}

function mapUserProfile(user: any): UserProfile {
  const metadata = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email || '',
    full_name: metadata.full_name || user.email?.split('@')[0] || 'Clinical User',
    role: metadata.role || 'Attending Cardiologist',
    // Keep this empty when it has not been configured yet. This is important
    // because Google OAuth does not collect the hospital name.
    hospital_name: metadata.hospital_name || '',
    department: metadata.department || 'Cardiology Decision Support',
  };
}

export async function loginWithSupabase(
  credentials: LoginCredentials
): Promise<{ user: UserProfile; accessToken: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email.trim(),
    password: credentials.password,
  });

  if (error) throw new Error(error.message);
  if (!data.session || !data.user) {
    throw new Error('Supabase did not return a valid session.');
  }

  // Do not overwrite an existing hospital name during sign-in. A user who
  // has not configured one yet will be sent through the same onboarding flow
  // used by Google OAuth.
  if (credentials.organizationId?.trim()) {
    const { data: updatedData, error: updateError } = await supabase.auth.updateUser({
      data: { hospital_name: credentials.organizationId.trim() },
    });

    if (!updateError && updatedData.user) {
      data.user = updatedData.user;
    }
  }

  return {
    user: mapUserProfile(data.user),
    accessToken: data.session.access_token,
  };
}

export async function signupWithSupabase(
  credentials: SignupCredentials
): Promise<{ needsEmailConfirmation: boolean }> {
  const emailRedirectTo = `${window.location.origin}/`;

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email.trim(),
    password: credentials.password,
    options: {
      emailRedirectTo,
      data: {
        full_name: credentials.fullName.trim(),
        hospital_name: credentials.organizationId.trim(),
        role: 'Hospital Administrator',
        department: 'Clinical Decision Support',
      },
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) {
    throw new Error('Supabase did not create the account. Please try again.');
  }

  return {
    needsEmailConfirmation: !data.session,
  };
}

export async function loginWithGoogle(): Promise<void> {
  const redirectTo = `${window.location.origin}/`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw new Error(error.message);
}

export async function completeHospitalSetup(hospitalName: string): Promise<UserProfile> {
  const trimmedHospitalName = hospitalName.trim();

  if (!trimmedHospitalName) {
    throw new Error('Please enter your hospital or clinic name.');
  }

  const { data, error } = await supabase.auth.updateUser({
    data: {
      hospital_name: trimmedHospitalName,
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) {
    throw new Error('Unable to save the hospital name. Please try again.');
  }

  return mapUserProfile(data.user);
}

export async function logoutFromSupabase(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getCurrentUserSession(): Promise<UserProfile | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return mapUserProfile(data.user);
}
