import { supabaseAdmin } from './supabase';

export interface CompleteUserData {
  id: string;
  email: string;
  provider: string;
  created_at: string;
  updated_at: string;
  // Profile data
  name: string;
  username: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  bio?: string;
  location?: string;
  website?: string;
  // Role data
  role: string;
  // Activation data
  is_activated: boolean;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  bio?: string;
  location?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  assigned_by?: string;
  assigned_at: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserActivation {
  id: string;
  user_id: string;
  activation_token: string;
  is_activated: boolean;
  activated_at?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogEntry {
  type: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Get complete user data by joining all related tables
 */
export async function getCompleteUserData(userId: string): Promise<CompleteUserData | null> {
  try {
    // First, get the base user data
    const { data: user, error: userError } = await supabaseAdmin
      .from('auth_user')
      .select('id, email, provider, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching auth_user:', userError);
      return null;
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user_profiles:', profileError);
    }

    // Get role data
    const { data: role, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .single();

    if (roleError) {
      console.error('Error fetching user_roles:', roleError);
    }

    // Get activation data
    const { data: activation, error: activationError } = await supabaseAdmin
      .from('user_activation')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (activationError) {
      console.error('Error fetching user_activation:', activationError);
    }

    return {
      // Base user data
      id: user.id,
      email: user.email,
      provider: user.provider,
      created_at: user.created_at,
      updated_at: user.updated_at,
      // Profile data
      name: profile?.name || 'User',
      username: profile?.username || `user_${user.id.substring(0, 8)}`,
      avatar_url: profile?.avatar_url,
      phone: profile?.phone,
      date_of_birth: profile?.date_of_birth,
      gender: profile?.gender,
      bio: profile?.bio,
      location: profile?.location,
      website: profile?.website,
      // Role data
      role: role?.role || 'user',
      // Activation data
      is_activated: activation?.is_activated || false,
    };
  } catch (error) {
    console.error('Error in getCompleteUserData:', error);
    return null;
  }
}

/**
 * Get complete user data by email
 */
export async function getCompleteUserDataByEmail(email: string): Promise<CompleteUserData | null> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('auth_user')
      .select('id')
      .eq('email', email)
      .single();

    if (error || !user) {
      return null;
    }

    return await getCompleteUserData(user.id);
  } catch (error) {
    console.error('Error in getCompleteUserDataByEmail:', error);
    return null;
  }
}

/**
 * Create a new user with all necessary records
 */
export async function createNewUser(userData: {
  id: string;
  email: string;
  name: string;
  username?: string;
  provider?: string;
  is_activated?: boolean;
}): Promise<{ success: boolean; error?: string; user?: CompleteUserData }> {
  try {
    const { id, email, name, username, provider = 'email', is_activated = false } = userData;

    // Create auth_user record
    const { error: authError } = await supabaseAdmin
      .from('auth_user')
      .insert({
        id,
        email,
        provider,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (authError) {
      console.error('Error creating auth_user:', authError);
      return { success: false, error: 'Failed to create user account' };
    }

    // Create user_profile record
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: id,
        name,
        username: username || `user_${id.substring(0, 8)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Error creating user_profile:', profileError);
      return { success: false, error: 'Failed to create user profile' };
    }

    // Create user_role record (default to 'user')
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: id,
        role: 'user',
        assigned_at: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (roleError) {
      console.error('Error creating user_role:', roleError);
      return { success: false, error: 'Failed to create user role' };
    }

    // Create user_activation record
    const activationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const { error: activationError } = await supabaseAdmin
      .from('user_activation')
      .insert({
        user_id: id,
        activation_token: activationToken,
        is_activated,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (activationError) {
      console.error('Error creating user_activation:', activationError);
      return { success: false, error: 'Failed to create activation record' };
    }

    // Get the complete user data
    const user = await getCompleteUserData(id);
    if (!user) {
      return { success: false, error: 'Failed to retrieve created user data' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Error in createNewUser:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Check if a user exists by email
 */
export async function checkUserExists(email: string): Promise<{ exists: boolean; user?: CompleteUserData }> {
  try {
    const user = await getCompleteUserDataByEmail(email);
    return { exists: !!user, user };
  } catch (error) {
    console.error('Error in checkUserExists:', error);
    return { exists: false };
  }
}

/**
 * Get user role
 */
export async function getUserRole(userId: string): Promise<string> {
  try {
    const { data: role, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return 'user';
    }

    return role?.role || 'user';
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return 'user';
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const role = await getUserRole(userId);
    return role === 'admin' || role === 'owner';
  } catch (error) {
    console.error('Error in isUserAdmin:', error);
    return false;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: 'Failed to update profile' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get user activation status
 */
export async function getUserActivationStatus(userId: string): Promise<{ is_activated: boolean; activation_token?: string }> {
  try {
    const { data: activation, error } = await supabaseAdmin
      .from('user_activation')
      .select('is_activated, activation_token')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching activation status:', error);
      return { is_activated: false };
    }

    return {
      is_activated: activation?.is_activated || false,
      activation_token: activation?.activation_token,
    };
  } catch (error) {
    console.error('Error in getUserActivationStatus:', error);
    return { is_activated: false };
  }
}

/**
 * Debug user records - check which tables have records for a user
 */
export async function debugUserRecords(userId: string): Promise<{
  auth_user: boolean;
  user_profile: boolean;
  user_role: boolean;
  user_activation: boolean;
}> {
  try {
    const [authUser, profile, role, activation] = await Promise.all([
      supabaseAdmin.from('auth_user').select('id').eq('id', userId).single(),
      supabaseAdmin.from('user_profiles').select('id').eq('user_id', userId).single(),
      supabaseAdmin.from('user_roles').select('id').eq('user_id', userId).single(),
      supabaseAdmin.from('user_activation').select('id').eq('user_id', userId).single(),
    ]);

    return {
      auth_user: !authUser.error && !!authUser.data,
      user_profile: !profile.error && !!profile.data,
      user_role: !role.error && !!role.data,
      user_activation: !activation.error && !!activation.data,
    };
  } catch (error) {
    console.error('Error in debugUserRecords:', error);
    return {
      auth_user: false,
      user_profile: false,
      user_role: false,
      user_activation: false,
    };
  }
}

/**
 * Activate user account
 */
export async function activateUser(activationToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: activation, error } = await supabaseAdmin
      .from('user_activation')
      .select('*')
      .eq('activation_token', activationToken)
      .single();

    if (error || !activation) {
      return { success: false, error: 'Invalid activation token' };
    }

    if (activation.is_activated) {
      return { success: false, error: 'Account already activated' };
    }

    if (new Date(activation.expires_at) < new Date()) {
      return { success: false, error: 'Activation token expired' };
    }

    // Update activation status
    const { error: updateError } = await supabaseAdmin
      .from('user_activation')
      .update({
        is_activated: true,
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('activation_token', activationToken);

    if (updateError) {
      console.error('Error activating user:', updateError);
      return { success: false, error: 'Failed to activate account' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in activateUser:', error);
    return { success: false, error: 'Internal server error' };
  }
}

 