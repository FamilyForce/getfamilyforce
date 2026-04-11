-- ─── jack_bridge column + month-7 window content updates ────────────────────
-- Adds jack_bridge (italic one-liner below title in email cards)
-- Updates babyproofing, name response, and dairy intro windows to match
-- the approved month7-redesign.html mockup exactly.

ALTER TABLE milestone_windows ADD COLUMN IF NOT EXISTS jack_bridge TEXT;

-- safety-babyproofing: 9 bullets with bold sub-headings
UPDATE milestone_windows SET
  jack_bridge    = 'Once she''s mobile, you''ll wish you''d done this last week.',
  why_it_matters = 'The window between birth and crawling is the time to babyproof. Mobility happens faster than almost all first-time parents expect — often overnight. The goal is to make your home safe before she can reach hazards independently.',
  what_to_do     = '* Get on your hands and knees and look at your home from baby''s height — this reveals hazards invisible from standing
* **Stairs:** hardware-mounted gates at the top, drilled into the wall. Pressure-mounted gates are only safe at the bottom or between rooms — never at the top of stairs.
* **Outlet covers:** plug all unused outlets
* **Cabinet locks:** cleaning products, medications, and anything under the sink
* **Furniture anchoring:** bookshelves, dressers, and TVs to the wall. Tip-over accidents kill children every year.
* **Blind cord safety:** loop or secure all window blind cords out of reach
* **Small objects:** anything that fits through a toilet paper tube is a choking hazard — do a sweep of the floor
* **Sharp edges:** coffee table corners, hearth edges
* **Water:** never leave water in a bucket or bathtub unattended, even an inch'
WHERE slug = 'safety-babyproofing';

-- language-responds-to-name: 4 bullets + jack_bridge
UPDATE milestone_windows SET
  jack_bridge    = 'This is more than a party trick — it''s a key social-cognitive milestone.',
  why_it_matters = 'Reliable name response — turning specifically toward her own name rather than any voice or sound — typically develops between 5 and 7 months. It signals that the brain has formed a stable representation of self and that language processing is advancing. Not responding consistently to their name by 7 months is a red flag for hearing issues and is also one of the core early screening indicators for autism spectrum disorder.',
  what_to_do     = '* Use their name frequently and consistently, not just nicknames
* Test when she''s not looking at you: call her name from across the room and see if she turns
* Make name calling a positive event: say the name, she turns, you smile and engage
* If reliable name response isn''t there by 9 months, flag it at the next well visit — it''s a developmental marker on the M-CHAT'
WHERE slug = 'language-responds-to-name';

-- nutrition-dairy-intro: 5 bullets + jack_bridge
UPDATE milestone_windows SET
  jack_bridge    = 'No cow''s milk to drink yet — but yogurt and cheese start now.',
  why_it_matters = 'While babies should not drink cow''s milk as a beverage until 12 months, they can and should have dairy products like yogurt and cheese starting around 6 months. Early exposure helps prevent milk protein allergies — the same principle that changed guidance on peanut and egg introduction.',
  what_to_do     = '* Offer plain, full-fat Greek yogurt — no added sugar. It''s an excellent source of protein, fat, and calcium.
* Provide small pieces of pasteurised, mild cheese: cheddar, mozzarella, or cream cheese work well. Always confirm it''s pasteurised — raw milk cheeses carry a severe infection risk for infants.
* Introduce one at a time over a few days to monitor for reactions
* Watch for skin rashes, hives, excessive spitting up, or changes in stool
* Once tolerated, offer dairy regularly — consistency is how tolerance is maintained'
WHERE slug = 'nutrition-dairy-intro';
