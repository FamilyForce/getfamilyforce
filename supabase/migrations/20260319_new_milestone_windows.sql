-- Migration: Add 18 new milestone windows to fill content gaps (months 14-35)
-- Created: 2026-03-19

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('self-help-open-cup', 'Transition off the sippy cup to an open cup', 'motor', 57, 69, 74, 'advisory', 3, 'milestone',
   'The AAP recommends transitioning away from sippy cups by 18 months. Prolonged sippy cup use encourages a sucking pattern that is different from normal cup drinking, can affect dental arch development, and keeps children reliant on a vessel they should be outgrowing. The open cup builds true oral motor coordination.',
   '* Introduce a small, weighted open cup or a straw cup at one meal per day to start
* Expect spills and keep portions small — an inch of water is plenty for practice
* Let them hold it themselves even if it means a wet shirt; that is how it is learned
* Keep the sippy for on-the-go if needed but phase it out at the table');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('cognitive-cause-effect-exploration', 'Cause and effect play — switches, buttons, containers', 'cognitive', 61, 69, 82, 'advisory', 3, 'milestone',
   'Between 14 and 19 months, toddlers enter a phase of obsessive cause and effect exploration. They flip light switches repeatedly. They open and close every drawer. They drop things off the high chair tray and watch them fall. This is not mischief. It is structured scientific inquiry. Each repetition confirms a hypothesis: if I do X, Y happens. This is the foundation of logical reasoning.',
   '* Allow the switch flipping, the drawer opening, the container dumping — within reason and safety
* Narrate what is happening: "You pushed the button and the music started. You did that!"
* Set up simple cause-effect toys: pop-up toys, push-button music, simple puzzles with feedback
* Avoid stopping the behavior unless safety is involved');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('motor-stairs-descending', 'Walking downstairs with support', 'motor', 66, 70, 78, 'advisory', 3, 'milestone',
   'Going up stairs with support typically emerges around 12 to 13 months. Going down is harder and comes later — usually 15 to 18 months. Descending requires the child to shift weight forward onto a lower step while maintaining balance, a significantly more difficult coordination task. Until this is established, stairs remain a fall risk in both directions.',
   '* Teach feet-first descent: turn the child around to face the stairs and let them step down backward
* Demonstrate and repeat the technique; backward descent is safer and comes first
* Keep stair gates in place during this learning window — supervised practice is not the same as unsupervised access
* Forward-facing descent with support comes around 18 to 24 months');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('self-help-self-dressing-assist', 'Helping with getting dressed — arms through sleeves, pulling up pants', 'motor', 70, 78, 86, 'advisory', 3, 'milestone',
   'Around 17 to 20 months, children begin actively cooperating with dressing rather than going limp or squirming away. They push an arm through a sleeve, lift a foot for a sock, attempt to pull pants up. These are not just self-help skills — they are early steps in physical self-awareness, sequencing, and independence. Encouraging them now builds the groundwork for full dressing independence at 3 to 4 years.',
   '* Narrate each step: "Now we put this arm through here. Your turn — can you push your arm through?"
* Give them the final step: start the sock yourself, then let them pull it up the last inch
* Use loose, easy clothing — elastic waists, stretchy materials — to reduce frustration
* Celebrate every attempt: "You helped get dressed today!"');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('self-help-potty-readiness', 'Potty training readiness — signs to watch for before you start', 'cognitive', 79, 95, 113, 'advisory', 2, 'milestone',
   'Most children show readiness signs between 18 and 24 months, though the range runs from 18 to 36 months. Starting before a child is ready leads to a longer, more frustrating process with more accidents and more resistance. Waiting for readiness signs — rather than starting at a fixed age — is the single most reliable predictor of a faster, lower-conflict potty training experience. This is also the foundation of FamilyForce''s potty training playbook.',
   '* Watch for the key readiness signs: staying dry for 2 or more hours, signaling a need before going (not after), showing interest in the toilet or underwear, being able to follow simple two-step instructions, and being able to pull pants up and down
* Do not start if the child cannot yet signal need — early training without signaling is toilet timing, not training
* Begin talking about the toilet naturally: let them see you use it, name body parts, read potty books
* Buy a floor potty and leave it out without pressure; familiarity reduces fear when training begins');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('language-question-asking', 'The question explosion — "What''s that?" and "Why?"', 'language', 83, 92, 100, 'advisory', 3, 'milestone',
   'Between 20 and 23 months, most toddlers begin asking constant questions, most frequently "What''s that?" followed shortly by "Why?" This is not random noise. It is a language acquisition strategy: the child is using you as a dictionary. Each question answered builds vocabulary and, more importantly, builds the understanding that words are tools for getting information. By 24 months the "why" questions shift from labeling to causal reasoning — a major cognitive leap.',
   '* Answer every question, even the obvious ones. "That''s a mailbox. The mail carrier puts letters in it."
* Resist the urge to answer with a question back ("What do you think it is?") at this stage — they are asking because they genuinely do not know
* When you do not know the answer, say so and look it up together: "I don''t know — let''s find out"
* Expect the same question multiple times. Repetition is how they cement new words.');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('motor-throw-overarm', 'Overarm throwing develops', 'motor', 92, 96, 108, 'advisory', 3, 'milestone',
   'Early ball play (months 6 to 12) involves rolling and dropping. Around 21 to 25 months, children develop the shoulder rotation and weight shift needed for a true overarm throw. This is a significant bilateral coordination milestone: the throwing arm swings forward while the opposite leg steps forward. It also requires the child to release the object at the right moment, which requires timing and planning.',
   '* Demonstrate an overarm throw with a soft ball and invite them to copy
* Use soft, light balls — foam, cloth, or a small rubber ball — in a space where the throw can go far
* Throwing at a target (a bucket, a couch cushion on the floor) adds motivation and direction
* Celebrate range and enthusiasm over accuracy — accuracy comes much later');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('cognitive-draw-copy-lines', 'Drawing and copying lines and circles', 'cognitive', 92, 100, 109, 'advisory', 3, 'milestone',
   'Around 21 to 25 months, children move from scribbling (which is purposeful mark-making without a target form) to copying. They begin to produce vertical lines, horizontal lines, and eventually circles when shown a model. This is a significant fine motor and cognitive milestone: they must visually analyze a shape, plan the hand movement, and execute it. These are the same skills required for writing letters.',
   '* Draw a vertical line slowly and ask them to make one just like it
* Use large crayons or chunky markers — they provide better grip feedback than thin pencils
* Praise the attempt, not the result. A wobbly vertical line is a real vertical line.
* Progress goes: vertical line → horizontal line → circle → cross. Do not rush the sequence.');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('cognitive-humor-jokes', 'Using humor intentionally — first jokes and silly words', 'cognitive', 109, 117, 121, 'advisory', 3, 'milestone',
   'Between 25 and 28 months, children begin using humor deliberately — saying the wrong word on purpose, making a funny face to get a reaction, turning a routine into a game with a punchline. This is one of the most significant markers of emerging theory of mind: the child understands that you have expectations, and they can subvert those expectations for effect. It is also the first evidence of social intelligence applied to entertainment.',
   '* Play along. When they call a dog a cat on purpose and wait for your reaction, give them the laugh. That is exactly what they are going for.
* Introduce simple silly games: "Is your nose your elbow? Nooooo!" — let them take the joke role
* Read silly books together: Julia Donaldson, Mo Willems. Toddler humor literature is its own genre.
* Laugh at their jokes, including the ones that make no sense. The intent is what matters.');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('motor-tricycle-balance-bike', 'Tricycle or balance bike — first wheeled independence', 'motor', 113, 121, 126, 'advisory', 3, 'milestone',
   'Around 26 to 29 months, children develop the leg strength and coordination to pedal a tricycle or propel a balance bike. This is a major gross motor milestone and one of the most motivating forms of independent movement available to toddlers. Beyond the physical benefits, wheeled transport gives children a sense of spatial independence — they can move themselves somewhere they choose to go.',
   '* For balance bikes: no pedals, child propels by walking then lifts feet to glide. Start there if introducing from scratch.
* For tricycles: position the seat so legs have a slight bend at the bottom of the pedal stroke
* Start on a flat, smooth surface — grass is too hard, slopes are dangerous
* Helmet from day one, always. It builds the habit before speed makes it necessary.');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('self-help-undressing-independently', 'Undressing independently — socks, shoes, and loose pants', 'motor', 113, 121, 126, 'advisory', 3, 'milestone',
   'Between 26 and 29 months, children develop the fine motor ability to undress themselves: pulling off socks, removing shoes (especially velcro), and pulling down loose pants. Undressing always precedes dressing — it requires less precision. This is a practical independence skill and is directly relevant to toilet training, where the ability to pull pants down quickly matters a great deal.',
   '* Let them undress themselves at bath time and bedtime — it takes longer but builds the skill
* Velcro shoes and elastic waists are the right starting equipment
* Break it into steps and let them do the last part first: you loosen the shoe, they pull it off
* Praise the effort: "You took your sock off all by yourself!"');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('self-help-tooth-brushing', 'Tooth brushing — child takes a turn', 'safety', 117, 130, 139, 'advisory', 3, 'milestone',
   'The American Academy of Pediatric Dentistry recommends brushing from the first tooth, done by the parent with a rice-grain amount of fluoride toothpaste. By 27 to 32 months, children are ready to hold the brush and take a turn. This is not just oral hygiene — it is a lifelong habit being formed. Children who brush independently (with supervision) from this age have significantly better dental outcomes than those who are passive recipients.',
   '* Parent brushes first, child takes a turn second — not the other way around. Their technique is not yet sufficient to do it alone.
* Let them pick their toothbrush (character brushes work) and their toothpaste flavor
* Make it a routine, not a battle: same time, same sequence, every day
* Electric toothbrushes are fine and often more effective at this age than manual');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('motor-handedness-emerging', 'Dominant hand solidifies — and why you should not try to change it', 'motor', 113, 130, 139, 'advisory', 3, 'milestone',
   'Between 26 and 32 months, most children settle into a consistent hand preference for drawing, eating, and throwing. This is neurological, not behavioral — the dominant hemisphere of the brain is establishing control over the contralateral hand. Approximately 10 percent of children are left-handed. Attempting to switch a child''s dominant hand causes stress, disrupts motor learning, and in some cases has lasting effects on speech and language development.',
   '* Observe which hand the child naturally reaches with for drawing, spoon use, and throwing
* Place objects in the midline — let them choose which hand to use, do not hand objects to the right hand specifically
* If left-handedness is emerging, buy left-handed scissors when they reach preschool age
* Tell grandparents and caregivers: this is not something to correct');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('social-named-friendships', 'Named friendships — "I want to play with Ella"', 'social', 131, 139, 147, 'advisory', 3, 'milestone',
   'Between 30 and 34 months, children begin to form specific social preferences — requesting particular children by name, showing excitement when they know a certain friend will be present, and expressing something that looks like genuine friendship. This is the emergence of selective social bonding beyond the family. It is one of the earliest signs of the social intelligence that will drive peer relationships throughout childhood.',
   '* Take the preference seriously. If they ask for Ella, try to arrange it.
* Facilitate the playdate: same-age, low-key, short (60 to 90 minutes), small numbers (one friend is enough)
* Stay nearby but let them navigate the social dynamic — resist the urge to direct the play
* Debrief naturally afterward: "Did you have fun with Ella? What did you play?"');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('motor-balance-one-foot', 'Balancing on one foot for 2 seconds', 'motor', 131, 143, 152, 'advisory', 3, 'milestone',
   'Standing briefly on one foot is a balance milestone that emerges around 30 to 35 months. It requires the child to shift their center of gravity over a single support point while the raised leg is controlled — a demanding vestibular and proprioceptive task. This is the direct precursor to hopping, skipping, and the single-leg balance needed for kicking accuracy and stair climbing with alternating feet.',
   '* Make it a game: "Can you stand on one foot like a flamingo?"
* Hold their hand at first and gradually reduce support
* Count out loud while they balance — makes it concrete and motivating
* Practice during normal routines: standing on one foot to put on a sock is a real-world application');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('cognitive-preschool-readiness', 'Preschool readiness — what to look for before the first day', 'cognitive', 135, 143, 147, 'advisory', 2, 'milestone',
   'Many children start preschool between ages 2.5 and 3. Preschool readiness is not about knowing colors or counting — it is about the skills that allow a child to function in a group setting: separating from parents without extended distress, following basic two-step instructions, communicating their needs verbally, and managing basic self-help tasks (going to the bathroom, washing hands, handling a snack). A child who is not ready will have a harder start, not a faster one.',
   '* Practice separation in low-stakes settings: grandparent visits, playdates without parents, church or community programs
* Check the practical self-help list: can they pull pants up and down? Wash hands? Communicate hunger or need for the bathroom?
* Visit the preschool together before the first day — familiarity dramatically reduces first-day anxiety
* Read books about starting school: "The Kissing Hand," "Wemberly Worried," "First Day Jitters"');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('self-help-dressing-simple-clothes', 'Dressing independently with simple clothes', 'motor', 135, 147, 152, 'advisory', 3, 'milestone',
   'Between 31 and 35 months, most children can put on simple clothing independently: a shirt pulled over the head, pants with an elastic waist, socks, and velcro shoes. This is a significant independence milestone with practical implications — it is also a preschool readiness requirement. Children who can dress themselves have meaningfully more autonomy and self-confidence in the morning routine and in group care settings.',
   '* Start with the easiest items: loose pants and socks. Let them try while you narrate.
* Teach front-from-back with a simple cue: "tag goes in the back"
* Put out tomorrow''s clothes the night before and let them get dressed independently in the morning — remove time pressure
* Avoid buttons, snaps, and laces during the learning phase. Elastic and velcro only.');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('cognitive-number-quantity', 'Understanding that numbers mean quantities — give me two blocks', 'cognitive', 135, 147, 152, 'advisory', 3, 'milestone',
   'Many children can rote count to 10 by age 2 without understanding that the numbers represent quantities. Cardinal number understanding — knowing that "two" means exactly two objects — emerges between 30 and 35 months and is a fundamentally different cognitive achievement. It is one of the earliest building blocks of mathematical reasoning. Children who understand cardinality at this stage have consistently stronger math outcomes in primary school.',
   '* Play "give me" games: "Can you give me two crackers? Can you give me one more?"
* Count objects together by pointing to each one: "One bear, two bears, three bears. Three bears!" (emphasizing the last number as the total)
* Avoid drilling — embed counting in normal activities: setting the table, getting socks out of the drawer, counting steps on the stairs
* Books with counting (Eric Carle''s "The Very Hungry Caterpillar") reinforce this without pressure');
