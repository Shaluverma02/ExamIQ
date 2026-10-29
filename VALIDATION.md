# Application validation — 12 October 2026

## Changes

- Removed the demo account picker, embedded demo passwords, client fake session helper, and server automatic demo account creation.
- Deactivated the five existing accounts identified by demo email and demo name, without deleting academic records.
- Updated the existing real Super Admin credentials and saved seed settings in the ignored root `.env`.
- Added server validation for login, registration, password reset, mobile verification, profile updates, college administrator creation, exam fields, question options/scoring, and code execution inputs.
- Registration accepts only an active, registered institution open to self-registration; groups must belong to that institution.
- College administrators cannot grant Super Admin permissions or alter administrator accounts. Administrators cannot deactivate themselves or change their own role.
- Student requests cannot retrieve answer keys directly from the question bank.
- Magic links reject disabled/unverified mobile accounts. Password reset finishes at the normal sign-in screen.
- Authentication responses and normal user queries omit password-reset, magic-link, and verification secrets.
- Partial profile updates preserve existing skills/projects/experience.
- Exam updates validate dates and passing marks against retained settings.
- Faculty cannot delete another faculty's assessment or modify/delete another faculty's coding problem. Updates preserve resource ownership.
- Proctor heartbeats require a student with an active attempt.
- All roles can change their own password from My profile by entering the current password, a new password, and confirmation. Successful changes replace the current session token, revoke older tokens, and clear pending password-reset/magic links.
- Malformed JSON and oversized question uploads return client errors.

## Verification

`npm.cmd run test:flows` runs the original regression suite and real HTTP/MongoDB scenarios. The temporary test database is uniquely named and cleaned up; tests do not seed/reset the application database.

Verified flows include all five role logins, email normalization, rejected malformed credentials, registration/duplicates, college isolation and role restrictions, profile updates, college admin creation, categories/courses, groups/rosters, question creation/editing, exam validation, assignment publication, student start/resume, answer save, submission/scoring, retake limits, certificates/public verification, Excel export, statistics, notifications, JavaScript execution and judged submission, hidden test masking, interview/language-assessment/roadmap reads, monitoring, recruiter drives/rules, password reset/token reuse rejection, and deactivated-account rejection.

Existing regression tests also check scheduled/expired assignments, delayed/manual result release, question imports and sections, college deletion, retakes, and protected attempt data.

Frontend production build verified with Vite. Live API and frontend endpoints checked locally.

## Limits

- Automated browser interaction, camera/microphone/screen-sharing permissions, and visual layout were not tested.
- Email/SMS delivery and external Gemini responses were not exercised. SMS and Gemini credentials are absent from the current environment; configured SMTP values have not been verified against the provider.
- JavaScript judging was exercised. Python is currently a Windows Store alias, and C/C++/Java compilers were not found on PATH, so these languages were not verified on this machine.
- Vite emits a nonblocking warning about a bundle larger than 500 kB.
