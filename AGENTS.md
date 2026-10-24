<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Students sign in with a university ID mapped to a synthetic email (`idToEmail` in src/lib/academic.ts); auto-confirm is on because those addresses cannot receive mail, so password reset goes through the registrar.
- Academic calculations (GPA, hours, next exam, today's sessions) live as pure functions in src/lib/academic.ts with tests beside them; UI must not hand-code statistics.
- New signups are seeded with demo academic data by the `handle_new_user` trigger; roles live in `public.user_roles` (checked via `has_role`), never in profile fields.
- Protected pages live under src/routes/_authenticated (client-only gate, redirects to `/`, the login page).
