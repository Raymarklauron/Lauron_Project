# 02 — Connected to Supabase

**What to build:** Connect the live app to the hosted Supabase project. The VA can create an account, log in, see their own saved Time records (or an empty state), and log out. Supabase access is limited to the signed-in owner.

**Blocked by:** 01.

**Status:** done

- [x] Confirm the Supabase URL and publishable key are configured locally and in Vercel.
- [x] Create the `time_records` table with the fields defined in the spec.
- [x] Enable Row Level Security and add owner-only read, create, and update policies.
- [x] The VA can sign up, log in, read their records, and log out on the live site.
- [x] Signed-out visitors and a different account cannot read or change the VA's records.
- [x] Works on the live URL.
