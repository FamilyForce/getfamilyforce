-- Month 2 bullet pronoun fix — gender-neutral rewrite 2026-04-12
-- Rule: DB window content never uses she/her/him/he — always "your baby" / "your child"
-- MONTH_CONTENT editorial text (opening/context/closing/dyk/theme) uses female default
-- and is swapped at runtime by applyPronouns() in email-digest.ts

UPDATE milestone_windows SET what_to_do =
'* Get close. Babies can only focus clearly at 8–12 inches. Your face needs to be in range.
* Smile, talk, and wait. Give your baby time to respond. The social smile takes a beat — it''s not instant.
* Respond to every smile: smile back, say something, make it a two-way exchange.
* Try different expressions and tones. Some babies respond more to high-pitched voices. Some respond more to animated faces.
* Not there yet at 8 weeks? Keep trying. The range is 6–12 weeks. If it''s absent at 3 months, flag it.'
WHERE slug = 'social-social-smile-appears';

UPDATE milestone_windows SET what_to_do =
'* Narrate everything you do: "I''m changing your diaper now. Left leg first."
* When your baby coos, coo back. When they look at something, look at it too and name it.
* Put the phone down during feeding and face-to-face time. Your face is the most interesting thing in their world right now.
* Pause after responding to see if your baby initiates again. You''re teaching them the rhythm of conversation.
* Books count as serve and return: point at pictures, wait for them to look, name what they see.'
WHERE slug = 'language-serve-return';
