# Talent Bridge Job Portal Simulator

## Deploy
1. Upload this folder to a Netlify site or connect the folder/repository.
2. In Netlify → Site configuration → Environment variables, add:
   - `HRMS_API_URL` = your secure HRMS external application endpoint
   - `HRMS_API_TOKEN` = a dedicated integration token
3. Redeploy the site.

The browser calls:
`/.netlify/functions/apply`

The Netlify Function then calls your HRMS server-side.

## Important
Do not put the HRMS token in `index.html` or browser JavaScript.

## Expected HRMS integration
The function currently sends the HRMS application as `multipart/form-data` with:
- source
- job_id
- job_title
- name
- email
- phone
- experience
- location
- cover_note
- resume

Once the exact HRMS route/field names are known, update only `netlify/functions/apply.js`.

The simulator has a 4 MB CV limit for this first integration test.


## v2 runtime note
The Netlify Function uses the current Web Request/Response API (`Response`, `request.formData()`).
No HRMS credentials are included in the repository.
