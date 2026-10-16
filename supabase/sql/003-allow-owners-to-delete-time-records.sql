grant delete on public.time_records to authenticated;

create policy "Owners can delete their time records"
  on public.time_records
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
