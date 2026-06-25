import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('ukpxxynmwscjhleqfsac');

if (!isDemoMode && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing in the client environment.'
  );
}

const mockUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'demo@example.com',
  user_metadata: { full_name: 'Demo User' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

const mockSession = {
  access_token: 'demo-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'demo-refresh-token',
  user: mockUser
};

const mockSupabase = {
  auth: {
    async getSession() {
      return { data: { session: mockSession }, error: null };
    },
    async getUser() {
      return { data: { user: mockUser }, error: null };
    },
    onAuthStateChange(callback) {
      setTimeout(() => {
        callback('SIGNED_IN', mockSession);
      }, 0);
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    },
    async signInWithPassword({ email, password }) {
      return { data: { user: mockUser, session: mockSession }, error: null };
    },
    async signUp({ email, password, options }) {
      return { data: { user: mockUser, session: mockSession }, error: null };
    },
    async signOut() {
      return { error: null };
    },
    async signInWithOAuth({ provider, options }) {
      return { data: { provider, url: '#' }, error: null };
    },
    async resetPasswordForEmail(email, options) {
      return { data: {}, error: null };
    }
  },
  from(tableName) {
    const builder = {
      insertPayload: null,
      select() { return this; },
      insert(payload) {
        this.insertPayload = payload;
        return this;
      },
      update() { return this; },
      eq() { return this; },
      order() { return this; },
      async maybeSingle() {
        try {
          if (this.insertPayload) {
            const res = await axios.put('/api/users/profile', {
              fullName: this.insertPayload.full_name,
              avatarUrl: this.insertPayload.avatar_url
            });
            return { data: res.data, error: null };
          }
          const res = await axios.get('/api/users/profile');
          return { data: res.data, error: null };
        } catch (e) {
          return { data: null, error: null };
        }
      },
      async single() {
        try {
          if (this.insertPayload) {
            const res = await axios.put('/api/users/profile', {
              fullName: this.insertPayload.full_name,
              avatarUrl: this.insertPayload.avatar_url
            });
            return { data: res.data, error: null };
          }
          const res = await axios.get('/api/users/profile');
          return { data: res.data, error: null };
        } catch (e) {
          return { data: null, error: e };
        }
      },
      async then(onFulfilled, onRejected) {
        try {
          const res = await axios.get('/api/users/profile');
          return Promise.resolve({ data: [res.data], error: null }).then(onFulfilled, onRejected);
        } catch (e) {
          return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
        }
      }
    };
    return builder;
  }
};

export const supabase = isDemoMode ? mockSupabase : createClient(supabaseUrl, supabaseAnonKey);

