# CP — Copy: the text the site shows (`src/translations/*`)
Auditor notes: the English and Spanish copy is mostly plain and human: short labels, honest errors, few buzzwords, no hype.
The problems are elsewhere. About 115 keys (×9 languages) are left over from screens that no longer exist. The public
"compare with friends" page makes three claims the product no longer keeps. The same things have several names: link,
connect, sign in; library, collection, vault; pin, goal, "to get". Em dashes are still in live strings in every language,
and a few person-nouns and phrases are gendered in 7 languages. The welcome, landing and app read as one voice. Errors are
honest but often stop at "Could not X", with no next step.

Method: `en.ts` and `es.ts` read in full, plus `seoPages.ts` and `vaultGuide.ts`; `vaultGuideMore.ts` and the other seven
languages got mechanical checks only (em dashes, gendered forms, untranslated strings, placeholder parity, key parity). Dead
keys come from a scratch script that flattens `en` and greps `src/` (no tests, no translations) for `T.x.y`, local aliases
(`const L = T.libraryDetail`) and dynamic access (`T.userTheme[\`name_${id}\`]`, `T.groups[c]`, `T.rankings[p]`…). Every
candidate was then checked by hand.

## Findings

### CP-01 · HIGH · rule (honesty, Public pages)
- **Where:** `src/translations/seoPages.ts:284-296` (en) and `:309-321` (es), page `/track/achievements-with-friends`
- **What:** This public page, built to be quoted by search engines and chat AIs, makes three claims the product no longer keeps.
  1. `sections[0].points[1]` "Open their profile: … public groups, **pinned achievements** and recent activity". Pinned achievements ("Achievements to get") are private: CLAUDE.md, "Achievement showcase", says nothing shows them to anyone else. Others see the **showcase**.
  2. `sections[1].text` "**Nobody is told who follows them.**" Since 2026-10-20 everyone has a Followers tab of their own.
  3. `faq[0]` "Can people outside CheevoVault see my profile? → **No.** Only signed-in users". Signed out, `/user/<name>` shows a `ProfileTeaser` and its link preview, and `/rankings` lists name, avatar, level and points.
- **Fix:**
  1. EN "Open their profile: their platforms, favourite games, public groups, achievement showcase and recent activity." / ES "Abre su perfil: sus plataformas, juegos favoritos, grupos públicos, vitrina de logros y actividad reciente."
  2. EN "Your profile can be made private at any time. A public profile shows signed-in users your progress, never your email or your keys. Only you see who follows you and who you follow." / ES "… Solo tú ves quién te sigue y a quién sigues."
  3. EN a: "Only a small card: your name, level and Vault Points, as the public rankings show them. Your games and activity are for signed-in users, and only while your profile is public. A private profile shows nothing." / ES "Solo una tarjeta: tu nombre, nivel y Puntos Vault, como en los rankings públicos. Tus juegos y tu actividad solo los ven usuarios con sesión, y solo si tu perfil es público. Un perfil privado no muestra nada."
  - Bump `updated` to the change date (it feeds the sitemap).

### CP-02 · HIGH · rule (error says the wrong thing)
- **Where:** `src/components/reset-password-form/ResetPasswordForm.tsx:52,54` reads `registerForm.errorCreating`
- **What:** If setting a new password fails (any error but `invalid-token`, or a network error), the message is "**Error creating account**" (ES "Error al crear la cuenta"). Someone recovering an account is told an account creation failed. The text itself (`registerForm.errorCreating`) is also the weakest error on the site: no subject, no next step.
- **Fix:** add `passwordReset.saveFailed`: EN "Could not save your new password. Try again in a moment." / ES "No se pudo guardar la contraseña nueva. Inténtalo de nuevo en un momento." Reword `registerForm.errorCreating`: EN "Could not create your account. Try again in a moment." / ES "No se pudo crear tu cuenta. Inténtalo de nuevo en un momento." (Also check RegisterUserForm, EditProfileModal and LocationModal: they show `data.error` raw, see the cross-area notes.)

### CP-03 · HIGH · dead
- **Where:** `src/translations/en.ts` and the eight other languages, same keys
- **What:** **115 keys no component reads** (about 1,035 strings over nine languages). These were checked by hand against aliases and dynamic access. Most are left over from the old stats page, the old side panel, the RA-only home, the old search, and a time when Steam was "coming soon":
  - `sidePanel.` welcome, signIn, searchConsole, noResults
  - `mainPage.` noGamesInProgress, seeMore, noWantToPlay, noWantToPlaySub, normal, hardcore, noGamesCompleted, noGamesCompletedSub
  - `userData.` welcome, theme, totalPoints, totalSoftcorePoints, signInSteam, userId, steamId, connectedAccounts, gamesTracked, inProgress, completedSC, completedHC, recentAchievementsLoaded, favoriteGameSoon, favoriteGameChange
  - `userConfig.accountSettings`, `userCharts.games`, `userPage.` viewData, hideData, editName
  - `userStats.` total, completions, achievementsUnlocked, registeredGames, completedSC, completedHC
  - `gameInfoTable.` sortOrder, sortPoints, sortRarity, missableWarning, expandTable, collapseTable, author
  - `gameComments.` empty, showMore · `authPage.tagline` · `toast.saveFailed` · `loginForm.noAccount`
  - `categoryPage.` steamComingSoon, steamComingSoonSub, showLess · `statusGameItem.firstToLast` · `gameInfoPage.id`
  - `lineChart.` achievementsLast7Days, noActivity
  - `mainStart.` welcome, description: read only by `src/components/main-start/MainStart.tsx`, which nothing imports
  - `search.` typeToSearch, hint, platformAll, platformRa, platformSteam
  - `cards.` almostThere, almostThereSub, noGamesInProgress, left, masteryBadge, earnedOf, steamPerfect100, noSteamPerfectSub, steamProgress, steamAvgCompletion, recentPerfects
  - `groups.` iconPlaceholder, isPublic, comingSoon, emptyGroup, decadeAll
  - `streak.` bestStreak, totalStreaks, topN
  - `charts.`: everything but `failedToLoad` and `completionDistTitle` (12 keys: popularUnplayed, popularPlayedAll, topTen, yearHeatmap×6, consoleCompletionTitle, games, done, consoleBreakdownTitle)
  - `userSearch.clearRecent`
  - `publicProfile.` notFound, recentActivity, viewStreak, searchUsers, searchUsersPlaceholder, userTab, gamesTab, searchUsersHint, loadError
  - `steam.` sortDefault, onlineWarning, gamesOwned · `xbox.` lastPlayed, platform
  - `rankings.` colPlatforms, teaserEmpty · `plurals.seeLeft` · `homeLayout.` shapeHint, weekGain
- Several dead keys are also the worst copy in the files: `authPage.tagline` ("A RetroAchievements alternative — Steam achievement integration in progress…", ES "Un sustitutivo a RetroAchievements — … trackear"), `categoryPage.steamComingSoonSub` ("We're working on it — stay tuned"), `gameInfoTable.missableWarning` (an emoji ⚠ in copy), and 5 of the 20 em dashes in `en.ts`.
- **Fix:** delete them from all nine files in one change (the `Translations` type forces it), and delete `MainStart.tsx`. A small test that fails on an unread key would keep it clean; the scratch script is about 40 lines.
- **Size:** about 115 lines per language, about 1,035 lines in all.

### CP-04 · MED · rule (stale claim on the landing)
- **Where:** `landing.progressText` (en.ts:420, es.ts:419, and the same in all 9 languages: de "auf beiden Konten"…)
- **What:** "…and what you played this week **across both accounts**". It dates from RA + Steam; there are three platforms now. This is the public landing.
- **Fix:** EN "Completion stats, day streaks, your rarest unlocks, and what you played this week on every platform." / ES "Estadísticas de progreso, rachas de días, tus logros más raros y lo que has jugado esta semana en todas tus plataformas." Do the same in the other 7.

### CP-05 · MED · naming (RA linking called a sign-in)
- **Where:**
  - `raLoginModal.title` "Sign in to RetroAchievements", `raLoginModal.signIn` "Sign in"
  - `userData.signInRA` (ConnectAccounts), `profileRa.signIn` "Sign in with RetroAchievements" (MainPageProfileRa)
  - `userConfig.signOutRA` "Sign out from RA"; ES "Desvincular RA". The button unlinks (`UserPlatforms.tsx:106`).
  - ES also has "Iniciar sesion" with no accent in 4 of these
- **What:** CLAUDE.md, "Sign up with RetroAchievements", says linking with a key is **never a sign-in**, and the FAQ and `whyKey` say so too. Yet the button and modal say "Sign in". The unlink button says "Sign out" in English and "Unlink" in Spanish, so the two languages disagree on what it does.
- **Fix:** EN "Connect RetroAchievements" (title and `userData.signInRA`), "Connect" (button), "Disconnect RetroAchievements" (`signOutRA`) / ES "Conectar RetroAchievements", "Conectar", "Desvincular RetroAchievements". Rename the keys (`connectRA`, `unlinkRA`) so the next person does not copy the word.

### CP-06 · MED · rule (gender-neutral wording)
- **Where:**
  - `rankings.tiers` (the reader's own rank, "Your level: …"): es Novato/Cazador/Veterano/Experto/Maestro/Gran maestro; it Novizio/Cacciatore/Esperto/Maestro; pt Novato/Caçador/Veterano/Mestre; fr Apprenti/Chasseur/Maître; de Neuling/Lehrling/Jäger/Experte/Meister/Großmeister; pl Nowicjusz/Uczeń/Łowca/Mistrz/Arcymistrz; ru Новичок/Ученик/Охотник. ja is neutral.
  - `deleteAccount.lastAdmin`: es "Eres **el único** administrador", it "Sei l'unico amministratore", pt "É o único administrador", fr "Vous êtes le seul administrateur", de "Du bist der einzige Admin", pl "Jesteś jedynym administratorem", ru "Вы единственный администратор"
  - `search.yourRank`: es "eres **el** #{n}", pt "você é **o** #{n}"
  - `welcome.ra.linkedAs`: es and pt "Conectado como {name}" (reads as the person; fr "Connecté en tant que")
- **What:** CLAUDE.md, i18n: "nothing that assumes the reader's gender".
- **Fix:**
  - Tiers: name the rank, not the person. ES "Inicio, Aprendizaje, Caza, Veteranía, Pericia, Maestría, Gran maestría, Leyenda" (the same pattern in it/pt/fr/de/pl/ru: abstract nouns). Or keep the nouns and say it is the user's call (they are titles, like a game's).
  - lastAdmin: ES "Nadie más tiene permisos de administración. Dáselos a otra persona antes de eliminar tu cuenta." EN can stay.
  - yourRank: ES "puesto #{n}" / PT "posição #{n}".
  - linkedAs: ES "Cuenta conectada: {name}".

### CP-07 · MED · naming (connect / link / disconnect / unlink)
- **Where:**
  - en: `userData.steamConnect/steamDisconnect`, `psn.connect/disconnect`, `xbox.connect/disconnect` ("Connect/Disconnect"); toasts `toast.*Linked/*Unlinked` ("linked/unlinked"); `userGame.linkAccount` "Link it"; `connect.subtitle` "platforms you link"
  - es: `steamDisconnect` "**Desvincular** Steam" with `steamDisconnecting` "**Desconectando**…"; `psn.disconnect` "Desvincular PSN" with `psn.disconnecting` "Desconectando…"; `connect.subtitle` "enlaces / enlazarlas"; everywhere else "vincular"
- **What:** One action has two or three names. In Spanish the button and its own in-progress label even disagree.
- **Fix:** pick one pair per language: EN connect/disconnect on buttons, "connected/disconnected" in toasts; ES conectar/desvincular plus "Desvinculando…". Fix `connect.subtitle` ES: "CheevoVault lee tus logros de las plataformas que conectes. Puedes conectarlas todas."

### CP-08 · MED · naming ("No achievements" means two things)
- **Where:**
  - `categories.wantToPlay` and `mainPage.wantToPlay`, `search.wantToPlay`: "No achievements" (= you earned none yet)
  - `steam.noAchievements` "No achievements", `xbox.noAchievements` "This game has no achievements" (= the game has none)
  - es: categories "Ningún logro conseguido" but search "Sin logros"
- **What:** The same English string means "you have not started" and "the game has none". In a header link (`MainHeader.tsx:105`) it reads as the second.
- **Fix:** EN "Not started" (already the wording of `groups.filter0`) / ES "Sin empezar" for the three category keys.

### CP-09 · MED · rule (R-02, em dashes)
- **Where (counts per file):**

  | file | count |
  |---|---|
  | `en.ts` | 20 |
  | `es.ts` | 13 |
  | `de.ts` | 13 |
  | `fr.ts` | 16 |
  | `it.ts` | 12 |
  | `ja.ts` | 7 |
  | `pl.ts` | 16 |
  | `pt.ts` | 13 |
  | `ru.ts` | 33 |
  | `seoPages.ts` | 0 |
  | `vaultGuide.ts` | 0 |
  | `vaultGuideMore.ts` | 1 (ru, line 468) |

- **Live ones in en/es** (the dead ones go with CP-03):
  - `userPage.raKeyInvalid` → EN "RetroAchievements no longer accepts your API key. It may have been revoked or regenerated: connect your account again to get your data back." (es already uses a colon)
  - `passwordReset.verifySent` → EN "Link sent. Check your inbox."
  - `categoryPage.noWantToPlaySub` → EN "Games you have not earned anything in yet, and your Want to Play list on RetroAchievements, show up here"
  - `cards.dailyAchievements` / `mostActiveGames` / `mastered100` → "Daily achievements · last 7 days", "Most active games · last 30 days", "Mastered & Completed · 100%" (the site already uses "·" as its separator). ES "Logros diarios · últimos 7 días", "Juegos más activos · últimos 30 días", "Masterizados y completados · 100%"
  - `steam.likelyOnlineHint` → EN "Probably needs online play (estimated from its description)" / ES "Probablemente requiere jugar online (estimado por su descripción)"
  - `aiExport.questionPlaceholder` → EN "E.g. I only have the story-choice ones left. How do I get them?"
  - privacy (en 533, 534, 541; es 540) and terms (en 615; es 614) → commas or parentheses: "…shows its trophies publicly. It does not prove the account is yours." / "…and, only if you accept, to measure visits…" / "…(which comes from RetroAchievements, Steam and PlayStation)…"
- **Fix:** the same in the other 7 languages (ru has the most); also check the en dash (`–`) used as a range, which is fine.

### CP-10 · MED · rule (Xbox on a public page)
- **Where:**
  - `vaultGuide.ts:37` intro ("Xbox in gamerscore") and `example.platforms.xbox` (rendered as an Xbox bar by `rankings-guide-example/RankingsGuideExample.tsx:21`)
  - the same in all 9 languages
  - `/rankings/how` is public and in the sitemap
- **What:** CLAUDE.md keeps Xbox out of the public pages and the welcome while it is admin-only (`seoPages.test.ts` checks only `SEO_PAGES`). The guide tells every visitor Xbox counts the same, and none of them can link it. This is a tension, not a broken test: the rule names the SEO pages, landing and welcome.
- **Fix:** drop Xbox from the intro sentence and the example bar while `XBOX_ADMIN_ONLY` is true. EN "Each platform counts achievements its own way: PlayStation in bronze, silver and gold, RetroAchievements in points, Steam not at all." / ES "…: PlayStation en bronce, plata y oro, RetroAchievements en puntos y Steam no los cuenta." Ask the owner first: the formula does cover Xbox.

### CP-11 · MED · naming (the same thing under several names)
- **Library (ES):**
  - "biblioteca" (`header.status`, `cards.searchTitle`, welcome)
  - "librería" (`search.hint`, `search.noResults`, `search.libraryOnly`, `userData.favoriteGameNoGames`): a calque, since librería means bookshop
  - "colección" (`userPage.library` "Tu colección"; EN says "Your vault")
  - "bóveda" (`welcome.goToVault`, `welcome.intro.title`)
  - → "biblioteca" for the game list, "bóveda" only where EN says vault, so `userPage.library` ES "Tu bóveda". Replace every "librería".
- **Vault Points (ES):** "Puntos Vault" everywhere except `welcome.intro.perks[3].title` "**Vault Points** y rankings" → "Puntos Vault y rankings".
- **Masteries (ES):** `userStats.masteries` "Masterías" (not Spanish), `cards.recentMasteries` "Maestrías", `cards.mastered` "Masterizado", `gameStatus.mastered` "Maestría" → "Maestrías" / "Masterizado" for the status.
- **Steam's privacy setting (ES), three spellings:** "Detalles de juegos" (`steam.privateProfileHint`), "detalles de juego" (`steamLink.errors.private`, `userPage.steamConnectHint`), "Detalles del juego" (`rankings.fillPrivateSteam`) → one spelling, the one Steam shows in Spanish.
- **Developer and publisher (ES):** `gameInfoPage.developer/publisher` "Desarrollador/Editor" vs `libraryDetail.developer/publisher` "Desarrolladora/Distribuidora" → one pair.
- **Email (ES):** "Email" (`userData.email`, `editProfileModal.fields.email`) vs "Correo" (`passwordReset.*`, privacy) → "Correo".
- **In progress (ES):** "En progreso" (`categories`, `search`) vs "En curso" (`groups.filterProgress`, `userProfile.playing`) → one.
- **PSN vs PlayStation (EN):** "Connect PSN" (`psn.connect`) vs "Connect PlayStation" (`welcome.psn.connect`) → "PlayStation" in buttons, "PSN" only for the online ID.

### CP-12 · MED · rule (toasts and errors: what to do next)
- **Where:**
  - `toast.followFailed`, `pinsFailed`, `orderFailed`, `achievementsFailed`, `groupDeleteFailed`, `gameRemoveFailed`, `unlinkFailed`, `gameHideFailed`, `gameShowFailed`, `gameRestoreFailed`, `showcaseFailed`, `loadAchievementsFailed`
  - `editProfileModal.errorGeneric` "Something went wrong. Try again." (used by 4 modals)
  - `charts.failedToLoad` "Failed to load"
  - `pinnedGames.error` "Couldn't update pin, please try again"
  - `psn.errors.failed` / `xbox.errors.*` "Please try again"
  - retry labels "Retry" (`gameInfoPage`, `steam`, `psn`, `xbox`) vs "Try again" (`groups`, `publicProfile`, `rankings`, `steamAuth`)
- **What:**
  - Each toast says what failed, which is good, but most stop there. Only `steamLinkFailed` and a few modal errors add a next step.
  - The voice drifts: "Couldn't … please" in `pinnedGames.error`, "Please" in PSN and Xbox, plain "Try again." elsewhere.
  - `charts.failedToLoad` does not say what failed.
  - `pinnedGames.error` is also untranslated in 7 languages (see CP-15).
- **Fix:**
  - One shape: "Could not <verb> <thing>. Try again." / "No se pudo <…>. Inténtalo de nuevo." For toasts after an optimistic rollback, say the state is back: EN "Could not save the new order. It is back as it was." / ES "No se pudo guardar el nuevo orden. Ha vuelto a como estaba." (this is CLAUDE.md's "a silent failure is a bug" made visible).
  - `pinnedGames.error` EN "Could not update the pin. Try again." / ES "No se pudo actualizar el fijado. Inténtalo de nuevo."
  - `charts.failedToLoad` EN "This section could not load" / ES "Esta sección no se pudo cargar".
  - `errorGeneric` EN "Could not save it. Try again in a moment." / ES "No se pudo guardar. Inténtalo de nuevo en un momento."
  - Drop "Please".
  - One retry word per language: EN "Try again", ES "Reintentar" (already consistent in ES).

### CP-13 · MED · naming ("Achievements to get")
- **Where:**
  - `favorites.addFavorite` "Pin as a goal", `removeFavorite` "Unpin goal"
  - `gameExpanded.pinAchievementAria`/`pinAchievementModalTitle` "Pin an achievement"
  - `gameExpanded.loadError` "Could not load pinned achievements", ES "No se pudieron cargar los logros **pineados**"
  - `welcome.intro.perks[1].detail` "a list of the achievements you are going for"
- **What:** CLAUDE.md renamed the feature "Achievements to get" (the old "Logros fijados"). The UI calls it pin, goal, pinned and "pineados" (Spanglish), all in one flow, while "pin" also means pinned **games**.
- **Fix:** EN "Add to achievements to get" / "Remove from achievements to get" / "Could not load your achievements to get"; ES "Añadir a logros por conseguir" / "Quitar de logros por conseguir" / "No se pudieron cargar tus logros por conseguir".

### CP-14 · MED · rule (i18n: English left in 7 languages)
- **Where:** de, fr, it, ja, pl, pt, ru all keep the English text for 11 keys. 5 of them are live:
  - `pinnedGames.error` (toast-like error on pin)
  - `achievement.noComments` (AchievementModal)
  - `gameComments.loading` (screen-reader text)
  - `gameComments.error`
  - `charts.completionDistTitle` (CompletionDistribution)
  - the other 6 are dead (CP-03)
- **Fix:** translate these 5 in the 7 files.

### CP-15 · LOW · rule (spelling, ES)
- **Where:** "Iniciar **sesion**" in `userData.signInRA`, `signInSteam`, `raLoginModal.title`, `raLoginModal.signIn`, `profileRa.signIn`; "Ver **mas**..." (`mainPage.seeMore`, dead); "Busca **en** tu librería" (CP-11)
- **Fix:** "sesión", "más". Most of these go away with CP-05.

### CP-16 · LOW · copy (welcome intro)
- **Where:** `welcome.intro.body`, `welcome.intro.perks[1].detail` and `highlights[1]` (en and es)
- **What:**
  - "Thanks for choosing CheevoVault" is a chatbot-style opener.
  - "you are in within two minutes" is a number nobody measured (R-17).
  - "groups of games (public or private, **to share**)" contradicts itself: a private group is not shared.
- **Fix:**
  - EN "Every achievement, from every platform, in one place. Connect your accounts and make it yours: every step can be skipped." / ES "Todos tus logros, de todas tus plataformas, en un sitio. Conecta tus cuentas y déjalo a tu gusto: puedes saltarte cualquier paso."
  - Groups: EN "groups of games, private or public on your profile" / ES "grupos de juegos, privados o públicos en tu perfil".

### CP-17 · LOW · copy (Vault Points guide, en/es)
- **Where:** `vaultGuide.ts` `rarity.text`, `updates.points[0]`, `faq[1].a`
- **What:**
  - "Ten times rarer adds one more time its value, up to four times." is hard to parse.
  - "seconds for Steam and PlayStation": PSN is read at 100 games a pass and 300 games every 15 min for the whole app (CLAUDE.md, Vault Points), so a large PSN library takes longer.
  - "the admins check with real data" overstates: the balance tests use example games (`vaultExamples.ts`).
- **Fix:**
  - EN "Each time an achievement is ten times rarer, it is worth its value once more, up to four times." / ES "Cada vez que un logro es diez veces más raro, vale su valor una vez más, hasta cuatro veces."
  - EN "seconds for Steam, longer for a large PlayStation or RetroAchievements library" / ES "segundos en Steam, algo más con una biblioteca grande de PlayStation o RetroAchievements".
  - EN "it is built so that it does not, and tests check that the same game scores within 10 % on every platform." / ES "está hecho para que no, y unos tests comprueban que el mismo juego puntúa con menos de un 10 % de diferencia en cada plataforma."

### CP-18 · LOW · copy (public pages, small staleness)
- **Where:** `seoPages.ts:232` (en) and `:264` (es), `track/retroachievements-steam-playstation` FAQ "Why does Steam show an empty library?"
- **What:** Since the 2026-10-16 audit, a private Steam profile shows a "private" message, not an empty library (CLAUDE.md, "How each platform fails").
- **Fix:** EN q "Why does CheevoVault say my Steam profile is private?" a "Your game details are private in Steam's privacy settings. Make them public and reload the page." / ES q "¿Por qué dice CheevoVault que mi perfil de Steam es privado?" a "Los detalles de juegos son privados en los ajustes de privacidad de Steam. Hazlos públicos y recarga la página."
- The rest of the four pages passes R-28 and the honesty rule: each comparison says where the other site is better, and every claim about Exophase and PSNProfiles is checkable.

### CP-19 · LOW · copy (one-off awkward strings)
- `rankings.fillSkipped` "{n} the platform would not answer for" → EN "{n} with no answer from the platform" (ES is fine).
- `homeLayout.fontBarlowHint` "The current design, compact and lively." "Current" is wrong now that it is one choice of three → EN "The default: compact, condensed headings." / ES "La de serie: compacta, títulos estrechos."
- `passwordReset.notConfigured` "Ask the site owner to reset it for you." It gives no way to reach them → EN "Password emails are not switched on yet. Write to the address on the privacy page to reset it." / ES "El envío de correos aún no está activo. Escribe a la dirección de la página de privacidad para restablecerla."
- `aiExport.intro` second sentence is long and circular → EN "It sees what you have and what you have left, and can plan the rest with you." / ES "Verá lo que tienes y lo que te falta, y podrá planear el resto contigo."
- `xbox.errors.rate-limited` "Xbox data is rate-limited right now" is jargon (admins only) → EN "Xbox is busy. Try again in a few minutes."
- `landing.faqLead` "What people ask before creating an account." claims a fact the site does not have (R-17) → EN "Before you sign up" / ES "Antes de registrarte".
- `rankings.zoneOf` "top {pct} %" and `fillA11y` "{pct} %" use a space before % in EN, unlike the rest of EN ("80%") → EN "top {pct}%".

## Cross-area notes
- **Raw server errors shown to people:** `RegisterUserForm.tsx:89`, `EditProfileModal.tsx:76` and `LocationModal.tsx:42` fall back to `data.error`, an English code or sentence from the API, before the translated text. A non-English reader can see "username-taken" or similar. The component auditor should check every `?? data.error`.
- **Dead components keep keys alive:** `MainStart.tsx` is imported by nothing. Other unimported components (checked by area auditors) may hold more of these keys. A key read only by a dead file is still dead.
- **`SectionFallback.tsx:24`** draws `charts.failedToLoad` in `uppercase tracking-widest` at 10 px inside a `role="alert"`. That is hard to read for an error (UI auditor).
- **Duplicated words across sections:** `close` (×8 sections), `cancel`, `retry` (×7), `filterAll`, `earned/locked` (steam, psn, xbox). A small `common` section would cut about 30 keys. Optional: the per-section copies let each screen differ.
- **A guard test for dead keys** (the scratch script is about 40 lines) would stop CP-03 coming back; it belongs next to `load.test.ts`.

## Coverage — `en.ts` top-level sections

| Section | Verdict |
|---|---|
| header | ok |
| sidePanel | CP-03 (4 of 6 dead) |
| categories | CP-08 |
| statusSort, statusGrid | ok |
| libraryFilters, libraryDetail, libraryLayout | ok |
| mainPage | CP-03 (8 of 12 dead), CP-08 |
| pinnedGames | CP-12, CP-14 |
| userData | CP-03 (15 dead), CP-05, CP-07, CP-11, CP-15 |
| userTheme | ok (read dynamically, all live) |
| userConfig | CP-03, CP-05 (`signOutRA`) |
| userCharts | CP-03 |
| changePassword | ok |
| editProfileModal | CP-12 (`errorGeneric`) |
| userPage | CP-03, CP-09 (`raKeyInvalid`), CP-11 (ES `library`) |
| userStats | CP-03 (6 dead), CP-11 (ES Masterías) |
| gameInfoTable | CP-03 (7 dead) |
| achievement | CP-14 (`noComments`) |
| gameComments | CP-03, CP-14 |
| gameStatus | ok |
| raLoginModal | CP-05 |
| authPage | CP-03 (`tagline` dead, stale, em dash) |
| connect | CP-07 (ES enlazar) |
| landing | CP-04, CP-19 (`faqLead`); FAQ passes R-28 |
| publicPages | ok |
| toast | CP-12, CP-03 (`saveFailed`) |
| cookies, mainFooter, passwordInput | ok |
| deleteAccount | CP-06 (`lastAdmin`, 7 languages) |
| privacy | CP-09 (3 em dashes EN, 1 ES); content checked against CLAUDE.md, accurate |
| terms | CP-09 (1 em dash) |
| loginForm | CP-03 (`noAccount`) |
| passwordReset | CP-02, CP-09 (`verifySent`), CP-19 (`notConfigured`) |
| registerForm | CP-02 (`errorCreating`) |
| steamAuth | ok |
| categoryPage | CP-03 (Steam "coming soon"), CP-09 |
| statusGameItem | CP-03 (`firstToLast`) |
| errorBoundary, notFound | ok (the 404 joke is deliberate voice) |
| gameInfoPage | CP-03 (`id`), CP-11 (ES developer/publisher) |
| pieChart, profileStats | ok |
| profileRa | CP-05 |
| lineChart | CP-03 (2 dead) |
| gameExpanded | CP-13 |
| profileSt, gamesList | ok |
| mainStart | CP-03 (dead component) |
| profileAchievements | ok |
| favorites | CP-13 |
| loadingPage | ok |
| search | CP-03 (5 dead), CP-06 (`yourRank`), CP-11 (ES librería) |
| dayModal | ok |
| cards | CP-03 (11 dead), CP-09 (3 em dashes) |
| groups | CP-03 (5 dead) |
| streak | CP-03 (3 dead) |
| pointsStats | ok |
| charts | CP-03 (12 of 14 dead), CP-12, CP-14 |
| userProfile, userGame | ok |
| userSearch | CP-03 (`clearRecent`) |
| following | ok |
| showcase, friends | ok |
| publicProfile | CP-03 (9 dead) |
| steam | CP-03 (3 dead), CP-09 (`likelyOnlineHint`), CP-11 |
| steamLink | CP-11 (ES spelling) |
| psn | CP-07, CP-11 (PSN vs PlayStation) |
| xbox | CP-03 (2 dead), CP-07, CP-19 |
| achievementDetail | ok |
| aiExport | CP-09, CP-19 |
| rankings | CP-03 (2 dead), CP-06 (tiers), CP-19 |
| plurals | CP-03 (`seeLeft`) |
| welcome | CP-06 (`linkedAs`), CP-11 (ES Vault Points), CP-13, CP-16; all live, voice consistent |
| homeLayout | CP-03 (2 dead), CP-19 |
| `seoPages.ts` | CP-01, CP-18 |
| `vaultGuide.ts` | CP-10, CP-17 |
| `vaultGuideMore.ts` | CP-09 (1 em dash, ru), CP-10 (Xbox in 7 languages) |
| de/fr/it/ja/pl/pt/ru | mechanical: CP-04, CP-06, CP-09, CP-14; no missing keys, no placeholder mismatches |
