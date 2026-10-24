# Enable Update 59 social features

The website update does not deploy Firestore security rules.

In Firebase Console, choose rhythms-29351, then Firestore Database > Rules. Copy the complete contents of firestore59.rules into the editor and click Publish. This changes permissions for comments and ratings; it does not delete saved data.

New comments have unique IDs and an authorId, so one player can post multiple comments. Existing comments remain visible. Rhythm authors can rate their own rhythms. Each account can have only one current vote on a rhythm and one on each comment. Comments can be deleted only by their author or the rhythm author. Profile pictures come from the existing public profile. Private saves remain owner-only.

After publishing the rules, refresh the game. Test a rhythm rating, two separate comments, and a comment rating.
