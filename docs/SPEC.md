# Spec: VA Time Tracker

## Problem
As a virtual assistant (VA), I write my work start and finish times on paper each day. Tracking them manually takes time, and I sometimes lose the paper and the personal record it contains.

## Solution
A personal time tracker lets the VA sign in, start and end a Session, and see saved Time records with the work date and start and end times. Records are stored in Supabase and are available on devices where the VA signs in.

## The user
One VA: the project owner, tracking their own work through a personal account.

## User stories
1. As a VA, I want to create an account and log in, so that my Time records are private to me.
2. As a VA, I want to start a Session with one action, so that I can record when I begin work.
3. As a VA, I want to see the start time while a Session is active, so that I know it has been recorded.
4. As a VA, I want to end the active Session with one action, so that I can record when I finish work.
5. As a VA, I want a completed Time record to include its work date, start time, and end time, so that I can tell when I worked.
6. As a VA, I want to see my saved Time records after logging in, so that I can find my records without relying on paper.
7. As a VA, I want to log out, so that another person using my device cannot access my account.
8. As a VA, I want to delete one Time record after confirming, so that I can erase an unwanted record.

## Screens
- **Sign up / Log in:** Lets the VA create an account or log in with email and password.
- **Time tracker:** After login, shows “Hello, VA,” a Start action when no Session is active, the active Session's start time and an End action while it is active, a table of the VA's Time records below the controls with a Delete action on each row, and a Log out action.

## Data
- **`time_records` table:** `id` uniquely identifies a Time record; `user_id` identifies its owning Supabase Auth account; `started_at` stores the Session start date and time; `ended_at` stores the end date and time and is empty while a Session is active.
- Enable Row Level Security (RLS). Only the authenticated owner of a row may read, create, update, or delete that row, enforced by matching `user_id` to the signed-in account. Signed-out visitors and other accounts may not access it.
- Store records in the hosted Supabase project. The date and times are displayed in the VA's local time zone. Do not store a name, work type, client details, or other private work information.

## Login
Yes. Use Supabase Auth with email and password. The tracker and records are available only after logging in.

## Done for the demo
- [x] On the live URL, the VA can create an account and log in.
- [x] The signed-in VA can start a Session and see its start time.
- [x] The VA can end the active Session.
- [x] Ending a Session saves its start and end date-times to the VA's `time_records`.
- [x] The signed-in VA can see their saved Time records after refreshing or logging in again.
- [x] A signed-out visitor cannot read or change Time records, and one account cannot read or change another account's records.
- [x] The VA can log out, and the tracker is no longer accessible until logging in again.
- [x] No client information or other personal work details are requested.
- [ ] The VA can delete one selected Time record after confirming, and it disappears from the table.

## Out of scope
- Client details, payroll, reports, or work-type labels.
- Collecting a name for a personalized greeting.
- Multiple user roles, teams, or shared Time records.
- Editing Time records after they have been saved.
