// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '$lib/supabase/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			admin?: boolean;
			supabase: import('@supabase/supabase-js').SupabaseClient | null;
			session: Session | null;
			user: import('@supabase/supabase-js').User | null;
			profile: Profile | null;
		}
		interface PageData {
			session: Session | null;
			user: { id: string; email: string | null } | null;
			profile: Profile | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
