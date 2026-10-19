# Demo request capture

The owner authorized release on 2026-10-18 after removal of the simulated call.
Configure and verify the hosted MongoDB connection before promoting the release.

## Visitor flow

- The invitation opens only when the visitor clicks Request a demo. There is no
  automatic timer, repeat invitation, or popup session flag.
- Desktop navigation, the phone menu, and the footer have a Request a demo button
  to reopen it. Escape, the close button, or an outside click dismisses it.
- Both the popup and contact page save through the same `/api/leads` endpoint.
- Visitors can check multiple services in either form. Leaving every option
  unchecked means they would like help finding a starting point. Every chosen
  service is included in the saved `services` array and optional email draft.
- Success is shown only after MongoDB acknowledges the save. A saved enquiry is
  not a booking, an email delivery, or a live call.
- The existing email draft remains available after submission. If saving fails,
  the visitor can retry with their details intact or send the draft themselves.
  Retrying the same submission reuses its ID to prevent duplicate records.

## Server configuration

Use the official MongoDB Node driver. Node 22 is supported. Keep both variables
on the server, without a `VITE_` prefix:

```dotenv
MONGODB_URI=your_atlas_connection_string
MONGODB_DATABASE=moki
```

Local values are in ignored `.env.local`. The shared client reuses a small pool
in warm server processes. The collection is `moki.demo_requests` by default.
Each document contains the enquiry fields, a request ID, an internal content
hash for safe retries, the source/page, creation time, and `status: "new"`. It
does not store the visitor's IP, browser fingerprint, or chat transcript.
New enquiries use a `services` array; existing documents retain their previous
single `service` field. The API still accepts older single-service form requests.

To view entries, open Atlas **Browse Collections → moki → demo_requests**. Atlas
stores these enquiries in MongoDB; no automatic Excel sync or email delivery
is connected by this change.

## Before an approved release

1. Add `MONGODB_URI` and `MONGODB_DATABASE` to the intended Vercel environment.
   These values are deliberately absent from GitHub and the browser bundle.
2. Confirm Atlas Network Access permits that deployment's outbound connection.
   A local successful test does not prove Vercel network access. Keep the
   intended production domain in `PUBLIC_ORIGIN` (or leave it unset for
   same-host preview validation).
3. After the owner approves release, submit a labelled test enquiry on the
   deployed site and read it back in Atlas. Preserve the existing Gemini setup.

The endpoint validates types, lengths, services, origin and request format;
rejects the honeypot; limits request size and per-process submission rates; and
returns sanitized errors. Per-process limits are not a distributed anti-spam
service. Only POST is exposed; there is no public list/export endpoint.

## Validation at this checkpoint

- Sixteen server tests pass using fake stores/providers. They cover input
  rejection, origin/size checks, retries, missing configuration, safe errors,
  rate limits, and waiting for database acknowledgement.
- A labelled popup test was saved and read back in the supplied Atlas database.
  Replaying it twice through the local API still produced one document.
- Responsive UI verification uses the single existing browser tab. Browser
  specs mock lead submissions so normal automated tests do not write to Atlas.
