# Password reset

Deploy the callback and reset form changes before changing the Supabase email template.

In Supabase Authentication → URL Configuration, allow the exact recovery callback for each environment being tested:

- Production: `https://www.eaglegymnastics.co.uk/auth/callback?flow=password-recovery`
- Local development: `http://localhost:3000/auth/callback?flow=password-recovery`
- Preview: the preview deployment's origin followed by `/auth/callback?flow=password-recovery`

Keep existing signup, email change and password reset redirect URLs. The reset request uses the origin of the page the visitor is using.

In Authentication → Email Templates → Reset Password, paste [reset-password.html](email-templates/reset-password.html). The template uses a recovery token hash rather than `ConfirmationURL`, allowing recovery on another browser/device without the original browser's PKCE verifier. The production fallback handles redirects that Supabase replaces with the Site URL; it does not replace the need to allow localhost and preview callbacks.

Opening a token-hash link displays the new-password form without consuming the token. Submission checks the password policy, verifies the recovery token server-side, verifies the session's user, and updates that user's Auth password. No account, student, booking or payment records are created or changed. A password rejection after verification keeps the recovered session so the visitor can try another password. Invalid/expired/reused links return to the request form with an error. Existing PKCE callback links and implicit recovery sessions remain supported.

After deployment and template configuration, request one fresh reset email and use the newest email only. Verify:

1. Signed out, open the email and enter matching valid new passwords. Login succeeds with the new password and fails with the old one.
2. Open a fresh reset link on a different browser/device; the same flow succeeds.
3. Reopen a consumed link and use an expired link; neither updates a password, and each offers a fresh reset request.
4. Double click the request/update button; only one request is submitted. A network failure releases the button and displays an error.
5. Signup and secure email change still work through their existing callbacks.

The connected Supabase tools cannot update dashboard redirect settings or email templates. No database migration, Secure Email Change setting change, or service-role access is needed for password recovery.
