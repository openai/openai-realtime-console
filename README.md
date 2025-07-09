# OpenAI Realtime WebRTC Expo Demo

## Set up Supabase

- `cp supabase/functions/.env.example supabase/functions/.env`
- Set your `OPENAI_API_KEY`
- Run `supabase start` to serve your functions locally

## Prebuild

- `npx expo prebuild`
- `npx expo run:android`
- `npx expo run:ios`

## Deploy (needed to run on physical device)

```bash
supabase link
supabase functions deploy
supabase secrets set --env-file supabase/functions/.env
```

Now update your `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in your `.env.local` file.
