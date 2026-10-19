-- 0029: every account signs in with a @frontline.sa work email.
-- Moves the legacy synthetic @ilmi.local logins over (username part unchanged)
-- and records the address on the profile. Run together with the release that
-- ships src/lib/email.ts and the updated admin-users function.

update auth.users
   set email = split_part(email, '@', 1) || '@frontline.sa',
       updated_at = now()
 where email like '%@ilmi.local';

update auth.identities
   set identity_data = jsonb_set(identity_data, '{email}',
         to_jsonb(split_part(identity_data->>'email', '@', 1) || '@frontline.sa')),
       updated_at = now()
 where provider = 'email' and identity_data->>'email' like '%@ilmi.local';

update public.profiles p
   set contact_email = u.email
  from auth.users u
 where u.id = p.id and u.email like '%@frontline.sa';
