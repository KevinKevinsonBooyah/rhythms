# Enable public rhythms and profile cosmetics

The game update is deployed through GitHub Pages. These new Firestore collections also need permission rules in your Firebase project.

1. Open Firebase Console and select **rhythms-29351**.
2. Open **Build → Firestore Database → Rules**.
3. Copy your current rules somewhere as a backup.
4. Replace the rules editor with the complete contents of **firestore57.rules** in this repository.
5. Click **Publish** and refresh Rhythms.

The file preserves the existing profile, leaderboard, and private save rules and adds publicRhythms and profileStyles. Only the author can publish/remove their rhythms. Only signed-in players can post a comment or rating, with one editable comment and one changeable rating per rhythm. Authors can remove comments on their own rhythms. Private saves remain owner-only.

In Rhythm Maker, save a composition, then choose Saved rhythms → Display on profile. Open a player through the leaderboard to play their displayed rhythms. Buying/equipping a profile cosmetic updates your local profile immediately and publishes the style once these rules are enabled.
