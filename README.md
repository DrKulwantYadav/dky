# Dr. Kulwant Yadav — Professional Website

A patient-friendly professional website built with Next.js 16 and the App Router. The project is configured for deployment on Vercel.

## Local development

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run build
npm start
```

## Deploy on Vercel

1. Push this directory to a Git repository.
2. Import the repository into Vercel.
3. Keep the detected framework as **Next.js**.
4. Add `NEXT_PUBLIC_SITE_URL` with the final production URL, such as `https://example.com`.
5. Deploy.

Vercel uses the standard `npm run build` command. No custom output directory is required.

## Community Health Initiatives setup

1. Apply `supabase/migrations/202610040001_community_initiatives.sql` to the same Supabase project as the admin dashboard. It creates the content tables, RLS policies, indexes, and two unpublished editable drafts. Existing `admin` and `super_admin` accounts can manage them; `staff` cannot.
2. Configure `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in the Vercel project environment. The secret must remain server-side. Use a Cloudinary account that accepts signed uploads from the site origin.
3. Deploy the application once for this feature. Thereafter, admins can edit, upload, publish, and unpublish at `/admin/community` without deploying again. On-demand revalidation refreshes the listing, initiative page, and sitemap.
4. Review the two drafts before publishing. Add verified dates, a cover with alt text, delivered services, captions, and any verified figures or coverage. Unknown details are intentionally blank. Upcoming initiatives also need a registration URL.

Uploads go directly from the browser to Cloudinary after an authenticated server signature. Supabase stores metadata and content only. Deleting media removes it from Cloudinary before the database record. Preview links under `/admin/community/[id]/preview` require an admin session and are excluded from indexing.

## Appointment request form

Apply `supabase/migrations/202610040002_regular_appointment_requests.sql` and then `supabase/migrations/202610040003_appointment_slots.sql` to the same Supabase project used by the admin dashboard. The first migration adds request-specific details; the second adds half-hour slots and an atomic four-patient capacity check. The earlier public date/time-window submission function is revoked by the slot migration so requests cannot bypass availability.

An administrator opens dates and sitting hours at **Admin → Appointment Slots**. Any booking link on the website opens the request form as a popup, except on the legacy World Heart Day camp page. The direct `/book-appointment` page remains available. The public form shows only available green slots and the ₹499 fee with ₹899 crossed out. It does not collect payment; Razorpay is a future integration. Successful requests appear under **Admin → Regular Registrations** and in dashboard counts. A request holds one place in the selected slot while the clinic confirms it. Public visitors cannot read patient, registration or slot-capacity data directly.

## Important content checks before launch

Confirm the clinic phone number, exact address, consultation timings, map link, online-consultation availability, diagnostic availability, and qualification/publication wording before making the site public.
