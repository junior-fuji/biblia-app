export default async function handler(req, res) {
    res.status(200).json({
      ok: true,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || null,
      hasAnon: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    });
  }