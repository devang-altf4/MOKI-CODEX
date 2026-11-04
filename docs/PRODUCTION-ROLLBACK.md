# Possibility Engine release — rollback

The previous production version is preserved at commit `8be4e9020d87de14fee47400e26c7b0862b2160f` and GitHub branch `codex/backup-pre-possibility-engine-2026-11-04`.

The previous live Vercel deployment is `dpl_2tBb6JLFL1GT2124M1mHvYBiKgUq`, URL `https://moki-52j30oy97-maybedevang29-gmailcoms-projects.vercel.app`.

Project: `prj_UQIIVvi8mpbjAkkUyuQMnmxqVyVw` / `moki`, team `team_wkg72Q40USNX1in6RkcxeLyX`.

To restore the previous release, request Vercel rollback to that deployment ID in the same project. Verify `www.mokisystems.us` and the apex redirect afterwards. Rollback changes deployment auto-assignment behaviour; explicitly promote the desired production deployment before resuming automatic releases.

Offline backups are in `artifacts/backups/2026-11-04-pre-engine/`: the exact previous source ZIP, verified complete Git bundle and approved local design ZIP. They are excluded from the repository. Environment values and visitor data are not included; the existing Vercel environment and MongoDB data are retained in place.

The new homepage is built from `site/`. The existing React routes are retained as `legacy.html`, and all existing API handlers remain under `/api/`. Reverting the release commit restores the original build configuration as well as the original homepage.
