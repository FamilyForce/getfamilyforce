-- Month 2 window bullet expansion — corrected by jackhowdy 2026-04-12

UPDATE milestone_windows SET what_to_do =
'* Schedule on time. Vaccines are timed to the immune system''s development — delays matter.
* For fever post-vaccine: infant acetaminophen is appropriate after 2 months. Ask your pediatrician about dosing at the visit. A rectal temperature of 100.4°F (38°C) or higher in a baby under 3 months requires a call regardless of vaccine status.
* Bring your tummy time progress update. Your pediatrician will ask and tell you what to expect before the 4-month visit.
* Ask about the social smile — whether you''ve seen it, and what to do if you haven''t by 3 months.'
WHERE slug = 'screening-visit-2months';

UPDATE milestone_windows SET what_to_do =
'* Get close. Babies can only focus clearly at 8–12 inches. Your face needs to be in range.
* Smile, talk, and wait. Give her time to respond. The social smile takes a beat — it''s not instant.
* Respond to every smile: smile back, say something, make it a two-way exchange.
* Try different expressions and tones. Some babies respond more to high-pitched voices. Some respond more to animated faces.
* Not there yet at 8 weeks? Keep trying. The range is 6–12 weeks. If it''s absent at 3 months, flag it.'
WHERE slug = 'social-social-smile-appears';

UPDATE milestone_windows SET what_to_do =
'* Narrate everything you do: "I''m changing your diaper now. Left leg first."
* When your baby coos, coo back. When they look at something, look at it too and name it.
* Put the phone down during feeding and face-to-face time. Your face is the most interesting thing in their world right now.
* Pause after responding to see if she initiates again. You''re teaching her the rhythm of conversation.
* Books count as serve and return: point at pictures, wait for her to look, name what she sees.'
WHERE slug = 'language-serve-return';
