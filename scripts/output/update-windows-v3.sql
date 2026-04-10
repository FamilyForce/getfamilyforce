-- ============================================================
-- Scout milestone_windows — v3 update
-- Generated: 2026-04-10 07:06 UTC
-- Source: scout-content-priority1-v3.md
--
-- Run in Supabase SQL Editor.
-- Verify after: SELECT slug, updated_at FROM milestone_windows
--               ORDER BY updated_at DESC LIMIT 30;
-- ============================================================

-- ── 1. Soft-delete removed duplicate windows ─────────────────
UPDATE milestone_windows SET active = false, updated_at = now()
  WHERE slug = 'language-joint-attention-pointing';
UPDATE milestone_windows SET active = false, updated_at = now()
  WHERE slug = 'motor-swaddle-stop';

-- ── 2. Update existing windows ───────────────────────────────
-- cognitive-animals-sounds
UPDATE milestone_windows SET
  title             = 'Names animals and their sounds',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 65,
  peak_age_weeks    = 78,
  close_age_weeks   = 104,
  why_it_matters    = 'Animal names and sounds are among the earliest vocabulary items children acquire because they are acoustically distinctive and emotionally engaging. Naming animals and their sounds builds vocabulary, categorization skills, and the ability to recall and produce learned associations. It is also a standard item on many early language screens.',
  what_to_do        = '* Name animals in books, at the park, in real life: "that is a dog. The dog says woof."
* Use animal sounds playfully in conversation and songs
* Animal matching games and puzzles extend this vocabulary naturally',
  what_not_to_worry = 'Children often learn the animal sound before the animal name, "woof" before "dog." Both count as communication and vocabulary development.',
  missed_window     = 'If your 18 month old cannot associate any animal with its name or sound, mention it at the 18 month visit as part of receptive vocabulary review.',
  source_citation   = 'CDC; Fenson et al. (1994), MacArthur Communicative Development Inventories',
  updated_at        = now()
  WHERE slug = 'cognitive-animals-sounds';

-- cognitive-attention-span
UPDATE milestone_windows SET
  title             = 'Build attention span through focused play',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 16,
  peak_age_weeks    = 52,
  close_age_weeks   = 156,
  why_it_matters    = 'Attention span in early childhood is largely shaped by experience. Research by Ruff and Rothbart shows that sustained, focused play with a single activity builds attentional capacity over time. Children who have time to explore a single activity deeply tend to develop stronger concentration. Background screens are the most studied disruptor of sustained attention in young children.',
  what_to_do        = '* Do not interrupt sustained play, if a child is engaged with a toy for 10 minutes, let them finish
* Offer fewer choices at once: one or two toys, not a room full
* Reduce background noise and screen time during play periods',
  what_not_to_worry = 'Normal attention spans at various ages: 3 to 5 minutes at age 1; 5 to 10 minutes at age 2; 10 to 15 minutes at age 3. These are for self chosen activities, not structured tasks.',
  missed_window     = 'If your 2 year old cannot focus on any single activity for more than 1 to 2 minutes, mention it at the 24 month visit. Reducing screen time and providing open-ended toys often makes a noticeable difference within weeks.',
  source_citation   = 'Ruff and Rothbart (1996), Attention in Early Development; AAP Screen Time',
  updated_at        = now()
  WHERE slug = 'cognitive-attention-span';

-- cognitive-big-little
UPDATE milestone_windows SET
  title             = 'Concept of size, big and little',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 91,
  peak_age_weeks    = 104,
  close_age_weeks   = 130,
  why_it_matters    = 'Size comparison (big and little, more and less, long and short) is an early mathematical concept. It emerges around 21 to 27 months through repeated comparison and labeling. It is a foundational concept for measurement, quantity, and early numeracy.',
  what_to_do        = '* Compare sizes explicitly in daily life: "this is the big spoon. That is the little spoon."
* Sort objects by size and narrate: "the big blocks go here, the little blocks go there"
* Books with size contrasts (like The Very Hungry Caterpillar or Goldilocks) embed this naturally',
  what_not_to_worry = 'Children at this age will frequently get big and little reversed, especially when applied to unfamiliar objects. Consistent modeling corrects this over time.',
  missed_window     = 'If your 30 month old has no concept of relative size at all, mention it at the 30 month visit.',
  source_citation   = 'CDC; Mix et al. (2002), Mathematical Cognition in Early Childhood',
  updated_at        = now()
  WHERE slug = 'cognitive-big-little';

-- cognitive-block-play
UPDATE milestone_windows SET
  title             = 'Block and construction play, spatial reasoning',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 52,
  peak_age_weeks    = 65,
  close_age_weeks   = 130,
  why_it_matters    = 'Block play is one of the most cognitively rich activities available to toddlers. Stacking, balancing, and building with blocks develops spatial reasoning, cause and effect, problem solving, and early mathematical thinking. Research by Casey et al. at Boston University found that block play in early childhood predicts mathematical reasoning at school age better than many formal pre-academic activities. It also builds persistence: blocks fall, plans fail, and the child has to try again.',
  what_to_do        = '* Provide a simple set of wooden unit blocks or large soft blocks from 12 months onward
* Build alongside the child without taking over their plan
* Name what you are doing: "I am making a tall tower. Yours is wider."
* Introduce challenge progressively: can they build as tall as their arm? Can they make a bridge?',
  what_not_to_worry = 'Knocking the tower down is part of playing with blocks, not the absence of construction skill. Children demolish towers hundreds of times before they become interested in protecting them.',
  missed_window     = 'If your 3 year old shows no interest in any construction or stacking activity at all, mention it at the 36 month visit as part of fine motor and play development review.',
  source_citation   = 'Casey et al. (2008). Block Play and Math Achievement; Hanline et al. (2010); CDC',
  updated_at        = now()
  WHERE slug = 'cognitive-block-play';

-- cognitive-cause-effect
UPDATE milestone_windows SET
  title             = 'Cause and effect, banging and dropping are learning',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 21,
  peak_age_weeks    = 26,
  close_age_weeks   = 34,
  why_it_matters    = 'When a baby bangs a toy on the tray, shakes a rattle, or drops something off a high chair for the 40th time, they are running a physics experiment. They are learning that their action predictably produces an effect. This is the foundational principle behind all problem solving, science, and logical reasoning. It is not misbehavior.',
  what_to_do        = '* Provide toys that respond to actions: rattles, activity gyms, pop up toys
* Let the repetition happen without stopping it prematurely
* Narrate what is happening: "you dropped it and it fell to the floor, again!"',
  what_not_to_worry = 'The repetition is the method. Babies repeat cause and effect actions hundreds of times to build the concept into a reliable mental model. Stopping the repetition stops the learning.',
  missed_window     = 'If your 8 month old shows no interest in producing effects with their actions and is entirely passive with objects, mention it at the 9 month visit. The pediatrician can help determine whether more observation is all that is needed.',
  source_citation   = 'Piaget (1952), Sensorimotor Stage; CDC',
  updated_at        = now()
  WHERE slug = 'cognitive-cause-effect';

-- cognitive-cause-effect-exploration
UPDATE milestone_windows SET
  title             = 'Cause and effect play. switches, buttons, containers',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 61,
  peak_age_weeks    = 69,
  close_age_weeks   = 82,
  why_it_matters    = 'Most toddlers enter a phase of obsessive cause and effect exploration between 14 and 19 months. They flip light switches repeatedly. They open and close every drawer. They drop things off the high chair tray and watch them fall. This is not mischief. It is structured scientific inquiry. Each repetition confirms a hypothesis: if I do X, Y happens. This is the foundation of logical reasoning.',
  what_to_do        = '* Allow the switch flipping, the drawer opening, the container dumping. within reason and safety
* Narrate what is happening: "You pushed the button and the music started. You did that!"
* Set up simple cause-effect toys: pop-up toys, push-button music, simple puzzles with feedback
* Avoid stopping the behavior unless safety is involved',
  what_not_to_worry = 'The repetition feels purposeless but is not. A toddler who dumps the container for the fifteenth time is running the same experiment to confirm consistent results. Let them confirm.',
  missed_window     = 'This phase winds down naturally by 18 to 19 months as the child''s interest shifts to more complex play. No intervention needed if it resolves on its own.',
  source_citation   = 'Piaget Sensorimotor Stage (1952); AAP Early Learning Guidelines',
  updated_at        = now()
  WHERE slug = 'cognitive-cause-effect-exploration';

-- cognitive-container-play
UPDATE milestone_windows SET
  title             = 'Container play, in and out',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 39,
  peak_age_weeks    = 43,
  close_age_weeks   = 56,
  why_it_matters    = 'Babies around 9 to 10 months become fascinated with putting objects into containers and taking them back out. This simple activity teaches spatial reasoning (something can be inside something else), cause and effect, and early classification. It is one of the earliest forms of logical play.',
  what_to_do        = '* Provide simple containers: a box, a bowl, a cup
* Show them how to put a block in and take it out, then step back
* Anything too small for their mouth and large enough to grasp works as a "putting in" object',
  what_not_to_worry = 'They will dump the container before filling it to the top. They will put things in and immediately take them out. This back and forth is the whole point.',
  missed_window     = 'Container play opens naturally when the baby can sit independently and grasp objects. If your 12 month old shows no interest in putting objects into any container, mention it at the 12 month visit. Most children respond quickly once given the right materials and some focused play time.',
  source_citation   = 'CDC; Piaget (1952)',
  updated_at        = now()
  WHERE slug = 'cognitive-container-play';

-- cognitive-counts-to-10
UPDATE milestone_windows SET
  title             = 'Counts to 10',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 104,
  peak_age_weeks    = 117,
  close_age_weeks   = 156,
  why_it_matters    = 'Reciting numbers in sequence to 10 by age 3 is an early numeracy milestone. It reflects the ability to memorize and reproduce a sequence, which is a precursor to true counting with one to one correspondence.',
  what_to_do        = '* Count everything in daily life: stairs, snacks, toys being put away
* Songs like "One Two Three Four Five, Once I Caught a Fish Alive" encode the sequence musically
* Counting books reinforce the sequence with visual anchors',
  what_not_to_worry = 'Reciting numbers to 10 is easier than understanding what they mean. Most children can count to 10 before they can accurately count 10 objects. Both skills are developing in parallel.',
  missed_window     = 'If your 3 year old cannot count to 5 at all, it is worth mentioning at the 36 month visit. Daily counting in routines and songs can make a noticeable difference in a short time.',
  source_citation   = 'CDC; Gelman and Gallistel (1978)',
  updated_at        = now()
  WHERE slug = 'cognitive-counts-to-10';

-- cognitive-draw-copy-lines
UPDATE milestone_windows SET
  title             = 'Drawing and copying lines and circles',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 92,
  peak_age_weeks    = 100,
  close_age_weeks   = 109,
  why_it_matters    = 'Most children move from scribbling (which is purposeful mark-making without a target form) to copying around 21 to 25 months. They begin to produce vertical lines, horizontal lines, and eventually circles when shown a model. This is a significant fine motor and cognitive milestone: they must visually analyze a shape, plan the hand movement, and execute it. These are the same skills required for writing letters.',
  what_to_do        = '* Draw a vertical line slowly and ask them to make one just like it
* Use large crayons or chunky markers. They provide better grip feedback than thin pencils
* Praise the attempt, not the result. A wobbly vertical line is a real vertical line.
* Progress goes: vertical line → horizontal line → circle → cross. Do not rush the sequence.',
  what_not_to_worry = 'Circles are harder than lines and may not appear until 24 to 27 months. A child who draws lines but not circles at 23 months is fully on track.',
  missed_window     = 'If your child shows no interest in mark-making at all by 24 months, mention it at the next visit. Avoidance of drawing can sometimes reflect fine motor or sensory differences, both of which respond well to early support. Continuing to offer low-pressure art opportunities in the meantime is always helpful.',
  source_citation   = 'Beery VMI Developmental Norms; Gesell (1940) motor development sequence',
  updated_at        = now()
  WHERE slug = 'cognitive-draw-copy-lines';

-- cognitive-function-of-objects
UPDATE milestone_windows SET
  title             = 'Knows function of common objects',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 78,
  peak_age_weeks    = 91,
  close_age_weeks   = 104,
  why_it_matters    = 'Most children understand that common objects have specific functions by around 18 to 24 months: spoons are for eating, cups are for drinking, brushes are for hair. This is called functional knowledge and it is the basis of pretend play (using a banana as a phone) and early categorization.',
  what_to_do        = '* Name objects and their function during daily routines: "this is a brush. We use it to brush hair."
* During pretend play, follow their lead, if they hand you the toy phone, answer it
* Simple object function questions ("what do we use to eat?") are appropriate from 18 months onward',
  what_not_to_worry = 'Knowing the function of an object does not mean using it correctly every time. A toddler who knows the spoon is for eating but uses it as a drumstick is still demonstrating functional knowledge.',
  missed_window     = 'If your 2 year old cannot demonstrate the function of common daily objects, mention it at the 24 month visit. Simple daily narration often closes this gap quickly.',
  source_citation   = 'CDC; Mandler (1992), How to Build a Baby''s Conceptual System',
  updated_at        = now()
  WHERE slug = 'cognitive-function-of-objects';

-- cognitive-humor-jokes
UPDATE milestone_windows SET
  title             = 'Using humor intentionally, first jokes and silly words',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 109,
  peak_age_weeks    = 117,
  close_age_weeks   = 121,
  why_it_matters    = 'Most children begin using humor deliberately around 25 to 28 months, saying the wrong word on purpose, making a funny face to get a reaction, turning a routine into a game with a punchline. This is one of the most significant markers of emerging theory of mind: the child understands that you have expectations, and they can subvert those expectations for effect. It is also the first evidence of social intelligence applied to entertainment.',
  what_to_do        = '* Play along. When they call a dog a cat on purpose and wait for your reaction, give them the laugh. That is exactly what they are going for.
* Introduce simple silly games: "Is your nose your elbow? Nooooo!", let them take the joke role
* Read silly books together: Julia Donaldson, Mo Willems. Toddler humor literature is its own genre.
* Laugh at their jokes, including the ones that make no sense. The intent is what matters.',
  what_not_to_worry = 'Toddler jokes are not funny to adults. That is fine. They are funny to toddlers. The developmental milestone is the intent, not the quality.',
  missed_window     = 'No clinical concern if humor development is slower. Intentional humor is not a red-flag milestone. Note only if broader social and communication development seems limited. Humor often emerges in its own time, and there is plenty you can do to encourage it through playful interaction and silly books.',
  source_citation   = 'Reddy (2001) theory of mind and humor development; Loizou (2005) infant humor',
  updated_at        = now()
  WHERE slug = 'cognitive-humor-jokes';

-- cognitive-identifies-body-parts
UPDATE milestone_windows SET
  title             = 'Identifies own body parts when asked',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 52,
  peak_age_weeks    = 65,
  close_age_weeks   = 78,
  why_it_matters    = 'Pointing to their nose, eyes, ears, or belly when asked shows vocabulary comprehension, body self awareness, and the ability to follow simple instructions. It is a standard checkpoint at the 15 and 18 month well child visits.',
  what_to_do        = '* Make it a daily game: "touch your nose!" paired with you touching yours
* Bath time is a natural opportunity: "let''s wash your ears"
* Songs like "Head, Shoulders, Knees and Toes" make this memorable',
  what_not_to_worry = 'Toddlers find it funny to point to the wrong body part on purpose. This does not mean they do not know the correct answer.',
  missed_window     = 'If your 18 month old cannot identify any body part on request, raise it at the 18 month visit. Body part recognition often clicks quickly once it''s given consistent, playful attention.',
  source_citation   = 'CDC Milestones (2024); AAP',
  updated_at        = now()
  WHERE slug = 'cognitive-identifies-body-parts';

-- cognitive-imitation-play
UPDATE milestone_windows SET
  title             = 'Imitation play, mimics adult actions',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 34,
  peak_age_weeks    = 39,
  close_age_weeks   = 52,
  why_it_matters    = 'Most babies begin to imitate simple actions they observe around 9 months: clapping, banging two objects together, waving. This is deferred imitation, copying something they have seen before. It is the foundation of pretend play, which builds imagination and social understanding. It also shows the mirror neuron system is functioning.',
  what_to_do        = '* Model simple actions and invite imitation: "I clap, now you clap"
* Play simple imitation games with household objects: stirring a bowl, talking on a toy phone
* React enthusiastically when they copy you',
  what_not_to_worry = 'Babies will not copy everything. They will selectively imitate actions that interest them. The observation of imitation in some context is what matters.',
  missed_window     = 'If your 12 month old shows no imitation of actions at all, mention it at the 12 month visit. Many babies start imitating more clearly in the months just after their first birthday.',
  source_citation   = 'Meltzoff (1988); CDC',
  updated_at        = now()
  WHERE slug = 'cognitive-imitation-play';

-- cognitive-matches-shapes-colors
UPDATE milestone_windows SET
  title             = 'Matches shapes and colors',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 78,
  peak_age_weeks    = 91,
  close_age_weeks   = 104,
  why_it_matters    = 'Sorting and matching by shape and color is an early classification skill. It shows the child can identify a shared property between objects and use it to group them. This is the foundation of logical and mathematical thinking.',
  what_to_do        = '* Use simple shape sorters and color sorting games
* Describe what you are doing as you sort: "this one is round, it goes with the other round ones"
* Do not force it as a drill. Make it playful.',
  what_not_to_worry = 'Getting it wrong is part of learning. A child who enthusiastically puts the wrong shape in the wrong hole is still building the concept.',
  missed_window     = 'If your 24 month old cannot match even two identical objects or recognize that two things are "the same," mention it at the 24 month visit. Early identification means early support, and sorting and matching skills often develop quickly with targeted activities.',
  source_citation   = 'CDC; Inhelder and Piaget (1964)',
  updated_at        = now()
  WHERE slug = 'cognitive-matches-shapes-colors';

-- cognitive-memory-recalls-events
UPDATE milestone_windows SET
  title             = 'Memory, recalls recent events',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 104,
  peak_age_weeks    = 117,
  close_age_weeks   = 156,
  why_it_matters    = 'The ability to recall and talk about a past event (not just respond to immediate stimuli) reflects the development of episodic memory and narrative thought. It is also a language milestone, "what did we do today?" is one of the most powerful daily language development prompts.',
  what_to_do        = '* Ask open ended recall questions about recent events: "what did we have for lunch?" "who did you see at the park?"
* Use photos as memory prompts to scaffold recall
* Model recall yourself: "today we went to the store. We bought apples."',
  what_not_to_worry = 'Memory at this age is patchy and often out of sequence. They will skip the most important parts and remember something random. This is normal.',
  missed_window     = 'If your 3 year old cannot recall or discuss any recent event at all, it is worth raising at the 36 month visit. Using photos and storytelling about recent events is a great way to support memory development at any point.',
  source_citation   = 'Nelson (1993), Episodic Memory Development; CDC',
  updated_at        = now()
  WHERE slug = 'cognitive-memory-recalls-events';

-- cognitive-mine-yours
UPDATE milestone_windows SET
  title             = 'Understands mine, yours, his, hers',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 78,
  peak_age_weeks    = 91,
  close_age_weeks   = 104,
  why_it_matters    = 'Possession concepts (mine, yours) require the child to understand perspective: the same object belongs to different people from different points of view. This is an early theory of mind skill and directly underlies the concept of sharing, which cannot be expected to work until this understanding is in place.',
  what_to_do        = '* Narrate possession consistently in daily interactions: "that is your cup. This is my cup."
* Use possessive pronouns in simple contexts throughout the day
* Picture books with clear ownership scenarios are useful at this age',
  what_not_to_worry = '"Mine" almost always comes before "yours", asserting possession of desired things is developmentally earlier than recognizing another person''s ownership. This is normal.',
  missed_window     = 'If your 24 month old has no concept of possession at all and treats all objects as equally available to everyone, note it as part of broader language and social development monitoring. This is a skill that tends to develop quickly once the language is in place.',
  source_citation   = 'Fasig (2000), Toddlers'' Understanding of Mine and Yours; CDC',
  updated_at        = now()
  WHERE slug = 'cognitive-mine-yours';

-- cognitive-more-all-done
UPDATE milestone_windows SET
  title             = 'Use more and all done at mealtimes',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 26,
  peak_age_weeks    = 34,
  close_age_weeks   = 52,
  why_it_matters    = '"More" and "all done" are among the most useful first communication concepts for both parents and babies. Babies understand these concepts before they can speak the words, which means they can be taught as signs or early words from 6 months onward. A baby who can signal "more" or "all done" communicates more effectively and shows less feeding related frustration.',
  what_to_do        = '* Use the words consistently at every meal: "do you want more?" (offer more) "all done?" (show clean hands or remove plate)
* Pair with simple signs if you use baby sign language: open and close hand for "more," wave hands flat for "all done"
* Respond immediately and consistently when the baby signals, this teaches that communication works',
  what_not_to_worry = 'Early signs and words will be approximate. A clapping motion used for "more" still counts. The function (communicating the request) matters more than the exact form.',
  missed_window     = 'If your 12 month old has no way to signal hunger, fullness, or wanting more (verbally or gesturally), discuss communication development at the 12 month visit.',
  source_citation   = 'Goodwyn et al. (2000), Baby Sign Language Research; CDC; AAP',
  updated_at        = now()
  WHERE slug = 'cognitive-more-all-done';

-- cognitive-music-rhythm
UPDATE milestone_windows SET
  title             = 'Music and rhythm response',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 0,
  peak_age_weeks    = 12,
  close_age_weeks   = 156,
  why_it_matters    = 'Infants are born with sophisticated musical sensitivity. Research by Sandra Trehub shows that babies can detect changes in rhythm, pitch, and melody from the first weeks of life. Music activates overlapping auditory, motor, and emotional brain networks simultaneously. Musical engagement in infancy and early childhood is associated with stronger language, memory, and mathematical reasoning.',
  what_to_do        = '* Play varied music (not just children''s music) and watch how your baby responds
* Move with them to music from birth: swaying, bouncing, rocking in rhythm
* From 6 months onward, give them instruments: a drum, shakers, a simple xylophone',
  what_not_to_worry = 'You do not need formal music classes for this. Dancing in the kitchen to any music you enjoy is the mechanism.',
  missed_window     = 'This stage is always active. Consistent musical engagement at any age produces measurable benefits. Start now if you haven''t yet.',
  source_citation   = 'Trehub (2003); Moreno et al. (2011), Music Training and Language; AAP',
  updated_at        = now()
  WHERE slug = 'cognitive-music-rhythm';

-- cognitive-number-quantity
UPDATE milestone_windows SET
  title             = 'Understanding that numbers mean quantities, "give me two blocks"',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 135,
  peak_age_weeks    = 147,
  close_age_weeks   = 152,
  why_it_matters    = 'Many children can rote count to 10 by age 2 without understanding that the numbers represent quantities. Most children develop cardinal number understanding, knowing that "two" means exactly two objects, around 30 to 35 months, and it is a fundamentally different cognitive achievement from rote counting. It is one of the earliest building blocks of mathematical reasoning. Children who understand cardinality at this stage have consistently stronger math outcomes in primary school.',
  what_to_do        = '* Play "give me" games: "Can you give me two crackers? Can you give me one more?"
* Count objects together by pointing to each one: "One bear, two bears, three bears. Three bears!" (emphasizing the last number as the total)
* Avoid drilling. Embed counting in normal activities: setting the table, getting socks out of the drawer, counting steps on the stairs
* Books with counting (Eric Carle''s "The Very Hungry Caterpillar") reinforce this without pressure',
  what_not_to_worry = 'Children often understand "one" and "two" before larger numbers. Being able to hand over "one" and "two" correctly while still grabbing a random handful for "four" is completely normal at 32 months.',
  missed_window     = 'No understanding of any number quantity by 36 months is worth noting at the well child visit as part of cognitive review. Everyday counting games and activities continue to build number sense at any stage.',
  source_citation   = 'Wynn (1992) infant number sense; Gelman & Gallistel (1978) counting principles; AAP Cognitive Milestones',
  updated_at        = now()
  WHERE slug = 'cognitive-number-quantity';

-- cognitive-object-permanence-emerging
UPDATE milestone_windows SET
  title             = 'Object permanence emerging, notices when toy disappears',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 17,
  peak_age_weeks    = 26,
  close_age_weeks   = 39,
  why_it_matters    = 'Object permanence is the understanding that things exist even when you cannot see them. Most babies begin showing early signs of this around 4 to 5 months, briefly looking for a toy that was in their hand and dropped. Fully established object permanence (actively searching for a hidden object) typically comes together for most babies by around 9 months. This is a foundational cognitive milestone described by Piaget.',
  what_to_do        = '* Play early peek a boo: cover your face, then uncover it
* Drop a toy just out of sight and watch to see if the baby looks for it
* Cover a toy partially with a cloth and see if they reach for it',
  what_not_to_worry = 'Early versions of this behavior are brief and inconsistent. Sustained interest in finding hidden objects comes a few months later.',
  missed_window     = 'If your 9 month old shows no interest in finding partially hidden objects, bring it up at the 9 month visit. Many babies develop this skill on a slightly different timeline and do just fine.',
  source_citation   = 'Piaget (1954), Object Permanence; CDC; Baillargeon (1987)',
  updated_at        = now()
  WHERE slug = 'cognitive-object-permanence-emerging';

-- cognitive-object-permanence-solid
UPDATE milestone_windows SET
  title             = 'Object permanence solid, searches for fully hidden objects',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 34,
  peak_age_weeks    = 39,
  close_age_weeks   = 52,
  why_it_matters    = 'By 9 months, most babies will actively search for an object completely hidden under a cloth or behind a barrier. This is the fully formed version of object permanence. It means the child is holding a mental representation of the object in their mind. Absent object permanence by 12 months is a cognitive flag.',
  what_to_do        = '* Hide a toy under a blanket in front of the baby and watch them lift it to find the toy
* Increase the difficulty: hide the toy under one of two cloths and see if they choose correctly
* Peek a boo continues to be valuable practice',
  what_not_to_worry = 'The "A not B error" is normal at this age: if you hide a toy in location B after always hiding it in location A, the baby will often look in location A. This is a normal phase of development.',
  missed_window     = 'If your 12 month old cannot find a toy hidden under a cloth, mention it at the 12 month well child visit. Pediatricians see a wide range of timelines for this milestone, and early conversations lead to early support if needed.',
  source_citation   = 'Piaget (1954); Baillargeon (2004); CDC',
  updated_at        = now()
  WHERE slug = 'cognitive-object-permanence-solid';

-- cognitive-outdoor-exploration
UPDATE milestone_windows SET
  title             = 'Outdoor exploration builds cognitive development',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 26,
  peak_age_weeks    = 52,
  close_age_weeks   = 156,
  why_it_matters    = 'Outdoor environments provide a uniquely rich cognitive development context. Nature is unpredictable, variable, and sensory rich in ways that indoor play environments rarely are. Research by Frances Kuo and others links outdoor time to better attention, reduced stress hormones, and improved executive function in children. It also provides unstructured problem solving opportunities.',
  what_to_do        = '* Aim for at least 60 minutes of outdoor time per day (WHO recommendation for ages 1 to 5)
* Let the environment drive the play, resist structuring every outdoor moment
* Mud, sand, sticks, rocks, and puddles are developmentally excellent play materials',
  what_not_to_worry = 'Weather protection (sunscreen, layers, rain gear) removes most barriers to outdoor time. "No bad weather, only bad clothing" is a reasonable operating principle.',
  missed_window     = 'If outdoor time is rare due to urban environment or climate, indoor sensory play (water, sand, playdough, painting) provides a partial substitute.',
  source_citation   = 'Kuo and Faber Taylor (2004), Outdoor Play and Attention; WHO Physical Activity Guidelines for Under 5s',
  updated_at        = now()
  WHERE slug = 'cognitive-outdoor-exploration';

-- cognitive-points-to-pictures
UPDATE milestone_windows SET
  title             = 'Points to pictures in books when named',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 47,
  peak_age_weeks    = 52,
  close_age_weeks   = 65,
  why_it_matters    = 'Pointing to the named picture in a book (where is the cat?) requires recognizing a 2D image as representing a real object and connecting a heard word to its meaning. It is a sign of receptive vocabulary growth and early reading readiness.',
  what_to_do        = '* During reading, pause and ask: "where is the dog?" and point to it yourself first to model
* Use simple books with one large image per page
* Build up from 1 picture per page to full illustrated scenes as skill grows',
  what_not_to_worry = 'They may point to the wrong picture and laugh. That is fine. The question is whether they can do it correctly sometimes, not always.',
  missed_window     = 'If your 15 month old cannot point to any named picture in a familiar book, mention it at the 15 month visit. Most toddlers catch up quickly with a bit of focused practice and encouragement.',
  source_citation   = 'CDC; AAP Literacy Guidelines',
  updated_at        = now()
  WHERE slug = 'cognitive-points-to-pictures';

-- cognitive-preschool-readiness
UPDATE milestone_windows SET
  title             = 'Preschool readiness, what to look for before the first day',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 135,
  peak_age_weeks    = 143,
  close_age_weeks   = 147,
  why_it_matters    = 'Many children start preschool between ages 2.5 and 3. Preschool readiness is not about knowing colors or counting. It is about the skills that allow a child to function in a group setting: separating from parents without extended distress, following basic two-step instructions, communicating their needs verbally, and managing basic self-help tasks (going to the bathroom, washing hands, handling a snack). A child who is not ready will have a harder start, not a faster one.',
  what_to_do        = '* Practice separation in low-stakes settings: grandparent visits, playdates without parents, church or community programs
* Check the practical self-help list: can they pull pants up and down? Wash hands? Communicate hunger or need for the bathroom?
* Visit the preschool together before the first day. Familiarity dramatically reduces first day anxiety
* Read books about starting school: "The Kissing Hand," "Wemberly Worried," "First Day Jitters"',
  what_not_to_worry = 'Some children cry at drop-off for weeks. That is not a sign of unreadiness. It is a sign of healthy attachment. The question is whether they can recover and engage once you are gone.',
  missed_window     = 'No ability to separate from a parent in any context by 36 months, not just preschool but with any trusted adult, is worth discussing with your pediatrician. Separation anxiety is very common and highly responsive to gentle, consistent practice and support.',
  source_citation   = 'AAP Bright Futures; Lightbridge Academy Preschool Readiness Checklist; Bowlby Attachment Theory',
  updated_at        = now()
  WHERE slug = 'cognitive-preschool-readiness';

-- cognitive-pretend-play-complex
UPDATE milestone_windows SET
  title             = 'Complex pretend play, multi step scenarios',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 78,
  peak_age_weeks    = 104,
  close_age_weeks   = 130,
  why_it_matters    = 'Complex pretend play (multi step scenarios like cooking dinner for dolls, taking toys on a trip, acting out a doctor visit) shows advanced symbolic thinking, narrative construction, and social understanding. It predicts language ability, creativity, and the capacity for perspective taking. Research by Jerome Singer and Sandra Russ links rich pretend play at 2 to 3 years to better emotional regulation and creativity at school age.',
  what_to_do        = '* Set up simple play scenarios: a play kitchen, a pretend doctor kit, stuffed animals as characters
* Join the play and follow their script, do not take over
* Introduce new elements to extend the scenario: "what does the baby want for dinner?"',
  what_not_to_worry = 'Children at this age frequently shift scenarios mid play. The lack of a sustained storyline is normal.',
  missed_window     = 'If your 3 year old has no pretend play and no symbolic use of objects at all, raise it at the 36 month visit. Many children who start pretend play a little later quickly develop rich imaginative scenarios once they get going.',
  source_citation   = 'Singer and Singer (1990); Russ (2004); CDC',
  updated_at        = now()
  WHERE slug = 'cognitive-pretend-play-complex';

-- cognitive-pretend-play-emerging
UPDATE milestone_windows SET
  title             = 'Pretend play emerging, feeds stuffed animal, uses toy phone',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 52,
  peak_age_weeks    = 65,
  close_age_weeks   = 78,
  why_it_matters    = 'Early pretend play (feeding a stuffed animal, pretending to drink from an empty cup, talking into a toy phone) shows the child can hold a mental representation of an action separate from the real action. This is a sign of symbolic thinking, which is foundational for language, reading, and abstract reasoning.',
  what_to_do        = '* Provide simple props: a toy phone, a stuffed animal, a small bowl and spoon
* Model pretend actions: pretend to drink from the empty cup and offer it to the baby
* Follow their lead, if they are feeding the bear, add to the story: "mmm, is the bear hungry?"',
  what_not_to_worry = 'Early pretend play looks very simple: one action, one object. Complex scenarios come later. A baby who picks up a banana and holds it to their ear has just pretended, that counts.',
  missed_window     = 'No pretend play at all by 18 months is worth raising with your pediatrician, as it is one of the indicators reviewed in the M-CHAT autism screening. Raising it early means you can get guidance and support while development is most responsive.',
  source_citation   = 'Ungerer and Sigman (1981); AAP; CDC',
  updated_at        = now()
  WHERE slug = 'cognitive-pretend-play-emerging';

-- cognitive-recognizes-caregiver
UPDATE milestone_windows SET
  title             = 'Recognizes and responds to primary caregiver',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 4,
  peak_age_weeks    = 8,
  close_age_weeks   = 17,
  why_it_matters    = 'The ability to distinguish the primary caregiver from strangers is one of the earliest signs of social cognition and memory. It begins with recognition by smell (from the first weeks) and grows to include face and voice recognition by 2 months. It is the neurological foundation for attachment.',
  what_to_do        = '* Spend face to face time without a screen or distraction
* Use your voice consistently as the primary soothing tool
* Let the baby see your face during feeds and diaper changes, not just the ceiling',
  what_not_to_worry = 'Recognition of the primary caregiver comes before recognition of secondary caregivers. A baby who lights up for their mother but is neutral about grandma is developing normally.',
  missed_window     = 'If your 4 month old shows no differential response to familiar versus unfamiliar faces or voices, raise this at the 4 month visit. Your pediatrician will help determine whether further observation is needed.',
  source_citation   = 'AAP; DeCasper and Fifer (1980), Neonatal Recognition of Mother''s Voice',
  updated_at        = now()
  WHERE slug = 'cognitive-recognizes-caregiver';

-- cognitive-same-different
UPDATE milestone_windows SET
  title             = 'Understands same and different',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 104,
  peak_age_weeks    = 117,
  close_age_weeks   = 130,
  why_it_matters    = 'The concept of same and different is a foundational logical operation. It is required for sorting, matching, classifying, and eventually reading (these two letters are the same; these are different). Most children develop this understanding somewhere around 24 to 30 months.',
  what_to_do        = '* Play matching games: "find the one that looks the same as this"
* Narrate sameness and difference in daily life: "you have the same shoes as your friend"
* Simple memory card matching games are excellent for this age',
  what_not_to_worry = 'They will confuse same and different verbally long after they can demonstrate the concept by sorting. Trust the action over the word.',
  missed_window     = 'If your 30 month old cannot complete a simple two piece matching task, raise it at the 30 month visit. Simple sorting games in daily life can help build this skill quickly.',
  source_citation   = 'CDC; Inhelder and Piaget (1964)',
  updated_at        = now()
  WHERE slug = 'cognitive-same-different';

-- cognitive-self-recognition-mirror
UPDATE milestone_windows SET
  title             = 'Recognizes self in mirror',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 12,
  peak_age_weeks    = 17,
  close_age_weeks   = 34,
  why_it_matters    = 'Self recognition in a mirror (the "rouge test", touching a spot on their own nose when they see it in the mirror) is one of the most studied cognitive milestones. Most children develop this awareness somewhere between 15 and 24 months, and it is considered a marker of self awareness and early theory of mind. Younger babies are social with the mirror, treating it as another baby; older babies recognize themselves.',
  what_to_do        = '* Give babies regular access to a safe, unbreakable mirror
* Comment on what they see: "that is you!"
* Watch for the transition from treating the reflection as a friend to touching their own face after seeing it in the mirror',
  what_not_to_worry = 'Enjoying the mirror without self recognition is completely normal through 12 months and beyond. The formal test involves applying a mark to the child''s face and seeing if they touch their own face versus the mirror.',
  missed_window     = 'Absent self recognition by 24 months alongside other social cognitive delays is worth raising with your pediatrician. Your pediatrician can help interpret what they''re seeing in the full context of your child''s development.',
  source_citation   = 'Amsterdam (1972); Gallup (1970); CDC',
  updated_at        = now()
  WHERE slug = 'cognitive-self-recognition-mirror';

-- cognitive-shape-sorter
UPDATE milestone_windows SET
  title             = 'Simple puzzles and shape sorters',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 43,
  peak_age_weeks    = 52,
  close_age_weeks   = 65,
  why_it_matters    = 'Shape sorters and simple puzzles (peg puzzles, single piece inset puzzles) develop spatial reasoning, problem solving, and visual discrimination. The child must recognize the shape, orient the piece, and match it to the correct space. Failure and adjustment is built into the activity. It is one of the earliest structured problem solving contexts.',
  what_to_do        = '* Start with 2 to 4 piece puzzles with large pieces and knob handles
* Shape sorters with 3 to 4 shapes are more manageable than the classic 10 shape version at first
* Resist inserting the piece for them, let them work it out, even if it takes minutes',
  what_not_to_worry = 'They will try to force the wrong piece into the wrong space. This is not a sign of low intelligence. It is the normal iteration of trial and error problem solving.',
  missed_window     = 'If your 15 month old has no interest in shape based activities and cannot fit even a peg into a round hole, mention it at the 15 month visit. Many children simply need more exposure and the right level of challenge.',
  source_citation   = 'CDC; Piaget (1952)',
  updated_at        = now()
  WHERE slug = 'cognitive-shape-sorter';

-- cognitive-simple-problem-solving
UPDATE milestone_windows SET
  title             = 'Simple problem solving',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 78,
  peak_age_weeks    = 104,
  close_age_weeks   = 130,
  why_it_matters    = 'Most children begin to solve simple physical problems around 18 months: using a stick to reach something, pulling a blanket to retrieve a toy on top of it, stacking boxes to reach a shelf. These are signs of means end thinking, the ability to plan a sequence of actions to reach a goal. It is an early indicator of executive function.',
  what_to_do        = '* Create simple problem solving opportunities: put a toy just out of reach and provide a tool or stepping stool
* Resist the urge to solve it for them, give them time to work it out
* Narrate the process after: "you pulled the blanket, and the toy came with it"',
  what_not_to_worry = 'The first attempts will fail. Repeated failure followed by a successful solution is exactly what builds problem solving capacity.',
  missed_window     = 'If your 2 year old cannot retrieve an object using any indirect method (pulling, using a tool, asking for help), it is worth noting at your next visit. Many children respond quickly to a few simple changes in how problem solving opportunities are set up at home.',
  source_citation   = 'CDC; Piaget; Willats (1990), Means End Reasoning in Infants',
  updated_at        = now()
  WHERE slug = 'cognitive-simple-problem-solving';

-- cognitive-time-concepts
UPDATE milestone_windows SET
  title             = 'Time concepts, morning, afternoon, night',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 104,
  peak_age_weeks    = 117,
  close_age_weeks   = 130,
  why_it_matters    = 'Most children develop understanding of basic time language (morning, afternoon, tonight, yesterday, tomorrow) between 24 and 30 months. It helps children anticipate daily structure, which reduces anxiety and improves cooperation. "We will go to the park this afternoon" only works as a communication tool if the child has a basic concept of afternoon.',
  what_to_do        = '* Use time language consistently in daily narration: "good morning," "this afternoon we are going to..."
* A visual daily schedule (pictures of the sequence of events) helps make abstract time concepts concrete
* Do not expect accuracy, a child who says "yesterday" for any past event is on track',
  what_not_to_worry = 'Past, present, and future tense in language take years to fully develop. "Yesterday" being used for last week, or "tomorrow" for any future event, is normal through age 4.',
  missed_window     = 'If your 3 year old has no concept of day/night or today/tomorrow, it is worth noting at the 36 month visit. Consistent daily use of time language is the best support and works quickly for most children.',
  source_citation   = 'CDC; Harner (1975), How and When Children Learn Temporal Language',
  updated_at        = now()
  WHERE slug = 'cognitive-time-concepts';

-- cognitive-visual-stimulation
UPDATE milestone_windows SET
  title             = 'Visual stimulation, high contrast patterns and faces',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 8,
  why_it_matters    = 'Newborns can only focus clearly at about 8 to 12 inches and see in limited color. High contrast black and white patterns activate the visual cortex more powerfully than pastel colors at this stage. Faces are the most interesting thing in a newborn''s world and the most important visual input for brain development.',
  what_to_do        = '* Hold your face close (8 to 12 inches) during alert time and make slow, exaggerated expressions
* Use black and white picture cards or books during tummy time
* Pastel nursery decor is fine, but not stimulating, use high contrast items during waking hours',
  what_not_to_worry = 'You do not need to buy anything special. Your face is the most powerful visual stimulus available.',
  missed_window     = 'This window matters most in the first 6 to 8 weeks. After that, color vision improves rapidly and high contrast loses its special advantage. Color vision continues to develop quickly, and rich visual engagement remains valuable well beyond this stage.',
  source_citation   = 'Fantz (1961), Visual Preferences of Newborns; AAP',
  updated_at        = now()
  WHERE slug = 'cognitive-visual-stimulation';

-- cognitive-visual-tracking
UPDATE milestone_windows SET
  title             = 'Visual tracking, smooth follow across midline',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 4,
  peak_age_weeks    = 8,
  close_age_weeks   = 17,
  why_it_matters    = 'Tracking a moving object smoothly with the eyes (rather than in jerky, uncoordinated movements) is an early sign that the visual and motor systems are integrating correctly. Crossing the midline of the body with the eyes, following an object from one side of the face to the other, is a specific developmental milestone checked at the 2 month visit.',
  what_to_do        = '* Slowly move a toy from one side to the other in front of the baby''s face
* Use a bright or high contrast object about 12 inches away
* Do this when the baby is alert and not tired',
  what_not_to_worry = 'Eyes that occasionally cross or wander in the first weeks are often normal as the muscles strengthen. It is sustained, alternating crossing that warrants attention.',
  missed_window     = 'If your baby cannot track a slowly moving object smoothly by 3 months, raise it at the 2 or 4 month visit. Your pediatrician will assess this directly. Most concerns are quickly evaluated and either resolved or addressed early.',
  source_citation   = 'CDC Milestones; AAP 2 Month Well Child Visit',
  updated_at        = now()
  WHERE slug = 'cognitive-visual-tracking';

-- language-1step-commands
UPDATE milestone_windows SET
  title             = 'Follows 1 step commands without gesture',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 52,
  peak_age_weeks    = 65,
  close_age_weeks   = 78,
  why_it_matters    = 'Following a one step command without a gesture (like "get your shoe" without pointing at it) shows that language comprehension has moved beyond simple word recognition. The brain is now processing the meaning of an instruction and directing the body to respond. This is a key checkpoint at the 15 and 18 month visits.',
  what_to_do        = '* Give single step instructions using clear, simple words: "sit down," "bring it here," "wave bye"
* Resist pointing or adding gestures, the goal is to test and build word comprehension alone
* Praise and repeat: "yes, that is your shoe, you found it"',
  what_not_to_worry = 'Children this age will sometimes comply and sometimes completely ignore you. Inconsistent response is normal. No response at all is what warrants attention.',
  missed_window     = 'If your 18 month old cannot follow a single command without you pointing or showing them, raise it at the 18 month visit. Language comprehension often develops quickly with focused interaction, and many children catch up well with targeted support.',
  source_citation   = 'CDC Milestones (2024); AAP 18 Month Visit Guidelines',
  updated_at        = now()
  WHERE slug = 'language-1step-commands';

-- language-2-word-combinations
UPDATE milestone_windows SET
  title             = 'Two word combinations',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 78,
  peak_age_weeks    = 91,
  close_age_weeks   = 104,
  why_it_matters    = 'Two word combinations, "more milk," "daddy go," "big dog", represent a qualitative leap in language. The child is not just labeling things; they''re constructing meaning. Most children reach this milestone after building a vocabulary of around 50 words, and it typically shows up somewhere between 18 and 24 months. Absent two word combinations by 24 months is a language red flag that nearly always correlates with the absence of the 50 word milestone.',
  what_to_do        = '* Model two word utterances naturally: when your child says "milk," expand to "more milk" or "cold milk"
* Don''t correct, expand. Corrections discourage output. Expansions model without punishing.
* Pair words with actions: "ball throw," "shoes on," "mama sit"',
  what_not_to_worry = 'Two word combinations don''t need to be grammatically correct. "More" + any noun counts. "Up" + any name counts. Grammar develops much later.',
  missed_window     = 'No two word combinations by 24 months: raise at the 24 month well child visit. This is assessed alongside vocabulary count and is a primary flag for speech evaluation referral. Early speech evaluation at 24 months is highly effective.',
  source_citation   = 'CDC Developmental Milestones (2024); AAP 24 Month Well Child Visit Guidelines; Nelson (2022), Language Development Research',
  updated_at        = now()
  WHERE slug = 'language-2-word-combinations';

-- language-2step-commands
UPDATE milestone_windows SET
  title             = 'Follows 2 step commands',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 91,
  peak_age_weeks    = 104,
  close_age_weeks   = 117,
  why_it_matters    = 'Following a two step command without prompts ("get your shoes and bring them to me") requires holding two pieces of information in working memory and executing them in sequence. This represents a significant leap in cognitive and language processing from the one step command stage.',
  what_to_do        = '* Start with two steps that are naturally connected: "go get your cup and put it on the table"
* Give the instruction once and wait, do not repeat immediately
* If they forget the second step, gently prompt: "and then what?"',
  what_not_to_worry = 'Two step commands are much harder when a child is tired, hungry, or distracted. Test this during calm alert times for accurate results.',
  missed_window     = 'If your 27 month old cannot follow a two step command, raise it at the 30 month visit. Working memory for instructions develops at different rates, and many children catch up quickly with daily practice.',
  source_citation   = 'CDC Milestones (2024); AAP',
  updated_at        = now()
  WHERE slug = 'language-2step-commands';

-- language-3-word-sentences
UPDATE milestone_windows SET
  title             = '3 word sentences',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 104,
  peak_age_weeks    = 117,
  close_age_weeks   = 130,
  why_it_matters    = 'Three word sentences, "I want milk," "daddy come here," "no more nap", mark the transition from telegraphic speech to early grammar. They typically appear between 24 and 30 months. By 30 months, most children are using 3 word sentences regularly. The presence of consistent 3 word sentences is a primary assessment point at the 30 month well child visit, which the AAP added specifically for developmental surveillance.',
  what_to_do        = '* Continue modeling slightly longer speech than what your child produces, if they use 2 word combos, you use 3 word sentences back to them
* Ask open ended questions: "What happened?" rather than "Did you like it?"
* Avoid finishing their sentences, give them time to complete the thought',
  what_not_to_worry = 'Grammar errors at this stage are normal and expected. "I goed" instead of "I went" is a sign of language development, not a mistake to correct.',
  missed_window     = 'No 3 word sentences by 30 months: this is a primary flag at the 30 month well child visit. Speech evaluation is likely to be recommended. The 30 month visit was added to the AAP schedule specifically to catch this. Early speech therapy at this age shows strong results.',
  source_citation   = 'CDC Developmental Milestones (2024); AAP 30 Month Well Child Visit; Tomasello & Brooks (1999), Grammar Acquisition',
  updated_at        = now()
  WHERE slug = 'language-3-word-sentences';

-- language-asks-why
UPDATE milestone_windows SET
  title             = 'Asks why, engage it fully',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 104,
  peak_age_weeks    = 117,
  close_age_weeks   = 130,
  why_it_matters    = 'The why question phase (which typically begins around 27 to 30 months and peaks between 3 and 4 years) represents a massive cognitive leap. The child has discovered that the world is explicable, that things have causes, and that you know things they do not. Every "why" is a causal reasoning request. Research by Chouinard (2007) found that children ask up to 100 questions per hour during this phase, and that the quality of the answers they receive significantly predicts scientific reasoning ability.',
  what_to_do        = '* Answer why questions genuinely and simply: "because water is heavier than oil"
* If you do not know the answer: "I do not know, let us find out"
* Use the question as a conversation opener rather than a one shot answer',
  what_not_to_worry = 'The questions will continue regardless of how well you answer. This is not a test you can pass or fail. It is a drive toward understanding that runs on its own engine.',
  missed_window     = 'If your 3 year old rarely asks why about anything, it is worth a brief mention at the next visit. Most children at this stage ask constantly, but the timing varies and many catch up quickly.',
  source_citation   = 'Chouinard (2007), Why Do Children Ask So Many Questions?; AAP; NAEYC',
  updated_at        = now()
  WHERE slug = 'language-asks-why';

-- language-babbling
UPDATE milestone_windows SET
  title             = 'Babbling, consonant sounds (ba, da, ma)',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 26,
  peak_age_weeks    = 34,
  close_age_weeks   = 39,
  why_it_matters    = 'Babbling, repeating consonant vowel combinations like "ba ba," "da da," "ma ma", is the bridge between cooing and words. It typically emerges between 6 and 9 months. Absent or significantly reduced babbling by 9 months is one of the most consistent early language red flags. Research shows that babbling frequency and variety predict vocabulary size at 18 months and beyond.',
  what_to_do        = '* Babble back. If they say "ba ba," say "ba ba" back, then add to it: "ba ba, ball."
* Use simple, slow speech when talking to your baby, research shows infant directed speech (what used to be called "baby talk") accelerates language acquisition
* Minimize background TV and audio, language learning requires conversation, not noise',
  what_not_to_worry = 'Babbling sounds like nonsense. It is nonsense, and it''s exactly right for this stage. You''re not teaching words yet. You''re teaching conversation rhythm.',
  missed_window     = 'If there is minimal or no babbling by 9 months, raise this at the 9 month well child visit. The pediatrician will assess and may refer to a speech language pathologist for evaluation. Early speech therapy intervention has strong evidence behind it.',
  source_citation   = 'CDC Developmental Milestones (2024); Oller et al., Babbling and Early Language Predictors; AAP Developmental Surveillance',
  updated_at        = now()
  WHERE slug = 'language-babbling';

-- language-bilingual-note
UPDATE milestone_windows SET
  title             = 'Bilingual households, total vocabulary is what counts',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 156,
  why_it_matters    = 'Bilingual children build vocabulary across two languages simultaneously. This means their count of words in any single language will appear smaller than a monolingual peer at the same age. This is normal and expected. Milestones should be assessed based on total vocabulary across both languages combined. Bilingualism does not cause language delays, research consistently shows it is cognitively beneficial.',
  what_to_do        = '* When pediatricians ask about vocabulary, add up words from both languages and report the combined total
* Maintain both languages consistently, do not sacrifice one to boost the other
* If a delay is suspected, request a speech evaluation from a bilingual clinician',
  what_not_to_worry = 'Mixing languages (code switching) is normal and not a sign of confusion. It is a sign of fluency in both languages.',
  missed_window     = 'Apply the same milestones but count total words across all languages. If the combined total is below threshold, that is when to seek evaluation. A speech-language pathologist experienced with bilingual children can assess accurately and support both languages.',
  source_citation   = 'Bialystok (2001), Bilingualism in Development; ASHA Bilingual Language Development',
  updated_at        = now()
  WHERE slug = 'language-bilingual-note';

-- language-body-parts-5
UPDATE milestone_windows SET
  title             = 'Names 5 body parts',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 78,
  peak_age_weeks    = 91,
  close_age_weeks   = 104,
  why_it_matters    = 'Pointing to or naming body parts on request is a sign of growing vocabulary and object identification. It also shows the child can follow instructions and understands that things have labels. By 24 months, most children can identify at least 5 body parts.',
  what_to_do        = '* Make it a game during bath time: "where is your nose? where is your belly?"
* Read books with pictures of faces and bodies and point to the parts
* Use the correct anatomical words, babies learn what you teach them',
  what_not_to_worry = 'They will point to the wrong body part sometimes and laugh. This is part of the game. The milestone is whether they can reliably identify a few specific parts on a good day, not every single time.',
  missed_window     = 'If your 2 year old cannot identify any body parts on request, bring it up at the 24 month visit. Many children are simply a little behind on vocabulary timing and catch up well with simple, consistent practice.',
  source_citation   = 'CDC Milestones (2024); Fenson et al.',
  updated_at        = now()
  WHERE slug = 'language-body-parts-5';

-- language-books-in-home
UPDATE milestone_windows SET
  title             = '20 or more children''s books in the home',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 0,
  peak_age_weeks    = 26,
  close_age_weeks   = 104,
  why_it_matters    = 'The number of books in a home is one of the strongest environmental predictors of child literacy outcomes, independent of income and parental education. Research by Evans et al. found that each additional 100 books in the home corresponded to measurably higher adult literacy. The effect at the child level is significant with as few as 20 books. Books that are visible and accessible (on low shelves, in baskets) are used more than books stored in closets.',
  what_to_do        = '* Aim for at least 20 children''s books accessible at the child''s level
* Library cards are free, borrow books regularly if purchasing is a barrier
* Rotate books seasonally to maintain novelty',
  what_not_to_worry = 'Board books that are chewed, loved, and worn out are working exactly as intended.',
  missed_window     = 'If books are scarce in your home, visit your local library this week. Many libraries also have board book lending and gift programs.',
  source_citation   = 'Evans et al. (2010), Family Scholarly Culture and Children''s Educational Attainment; AAP Literacy Promotion Guidelines',
  updated_at        = now()
  WHERE slug = 'language-books-in-home';

-- language-complex-instructions
UPDATE milestone_windows SET
  title             = 'Follows complex multi step instructions',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 130,
  peak_age_weeks    = 156,
  close_age_weeks   = 182,
  why_it_matters    = 'Following a 3 to 4 step instruction without prompting is a school readiness skill. It requires working memory, sustained attention, and language comprehension all working together. Children who can follow complex instructions transition more smoothly into structured classroom environments.',
  what_to_do        = '* Practice with daily routines: "go to your room, put your shoes by the door, and come back here"
* Break tasks into verbal steps instead of doing them for the child
* If they lose track, ask "what comes next?" rather than restating the whole instruction',
  what_not_to_worry = 'Compliance and comprehension are different. A child who understands the instruction but refuses to do it is developmentally different from a child who genuinely does not understand it.',
  missed_window     = 'If your 3 year old consistently cannot follow more than a single step instruction, discuss it at the 36 month visit. Practicing during familiar routines and breaking instructions into smaller parts can make a big difference, and many children catch up quickly.',
  source_citation   = 'CDC; AAP',
  updated_at        = now()
  WHERE slug = 'language-complex-instructions';

-- language-cooing
UPDATE milestone_windows SET
  title             = 'Cooing, first vowel sounds',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 4,
  peak_age_weeks    = 6,
  close_age_weeks   = 12,
  why_it_matters    = 'Cooing is the first sign that a baby is experimenting with their voice intentionally. The soft, drawn out vowel sounds (ohhh, ahhh) are not random, they are a baby''s first attempt at communication. They emerge around 4 to 6 weeks and are a precursor to babbling. Absent cooing by 2 months is a clinical red flag for hearing or developmental concerns.',
  what_to_do        = '* Get close and respond when your baby coos. Coo back, smile, wait for them to go again.
* Talk to your baby in a warm, slightly higher pitched voice, this is called infant directed speech and research confirms babies respond to it more than flat adult tone
* Give them quiet, alert time without background noise or screens',
  what_not_to_worry = 'Cooing happens most during alert, calm states. A tired or overstimulated baby will not perform. Test your observations when they are well fed and awake.',
  missed_window     = 'If there is no cooing or vocalization at all by 2 months, raise it at the 2 month well child visit. It may point to hearing concerns or a developmental delay. Issues identified early are often very treatable, and your care team can help you understand the next steps.',
  source_citation   = 'CDC Milestones (2024); AAP Developmental Surveillance',
  updated_at        = now()
  WHERE slug = 'language-cooing';

-- language-counts-objects-5
UPDATE milestone_windows SET
  title             = 'Counts objects 1 to 5 with one to one correspondence',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 117,
  peak_age_weeks    = 130,
  close_age_weeks   = 156,
  why_it_matters    = 'True counting (touching each object once and assigning it a number word in sequence) is different from reciting numbers. One to one correspondence is a foundational math skill, the understanding that each item gets exactly one number. Most children develop this skill somewhere between 30 and 36 months.',
  what_to_do        = '* Count small groups of physical objects together: "one cracker, two crackers, three crackers, three crackers total"
* Correct gently when they skip an object or count one twice
* Make it tactile: move each item as you count it',
  what_not_to_worry = 'Accurate one to one counting for 5 objects by age 3 is the goal. If they can count to 3 accurately, they are on track.',
  missed_window     = 'If your 3 year old cannot count even 2 objects with one to one correspondence, mention it at the 36 month visit. With a little focused practice during daily routines, most children pick this up quickly.',
  source_citation   = 'Gelman and Gallistel (1978); CDC',
  updated_at        = now()
  WHERE slug = 'language-counts-objects-5';

-- language-counts-to-3
UPDATE milestone_windows SET
  title             = 'Counts to 3',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 117,
  peak_age_weeks    = 130,
  close_age_weeks   = 156,
  why_it_matters    = 'Counting to 3 by age 3 is an early numeracy milestone. It reflects the ability to recall a sequence and pair number words with a concept of quantity. Note: "counting" at this age often means reciting the sequence, not yet understanding that each number corresponds to one object.',
  what_to_do        = '* Count everything: stairs, crackers, fingers, steps to the car
* Use fingers to show the count alongside the word
* Books and songs with counting sequences reinforce this naturally',
  what_not_to_worry = 'Reciting "one two three" without yet understanding that "three" means a quantity of three is completely normal at this age. True counting with one to one correspondence comes later.',
  missed_window     = 'If your 3 year old has no interest in counting or numbers at all, mention it at the 36 month visit. Interest in numbers often appears in bursts, and weaving counting into daily routines tends to help a lot.',
  source_citation   = 'CDC Milestones (2024); Baroody (1987)',
  updated_at        = now()
  WHERE slug = 'language-counts-to-3';

-- language-first-words
UPDATE milestone_windows SET
  title             = 'First words beyond mama and dada',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 47,
  peak_age_weeks    = 52,
  close_age_weeks   = 65,
  why_it_matters    = 'Beyond "mama" and "dada," most children produce their first true words, consistent labels for people, objects, or actions, between 11 and 14 months. "Ball," "dog," "more," "up", these count. Sign language counts. The milestone is not pronunciation perfection; it''s consistent, intentional use of a sound or sign to represent something specific. Not having any first words by 15 months is a language developmental flag.',
  what_to_do        = '* Label everything, constantly: "That''s a cup. Cup." "Here''s your ball. Ball."
* Read aloud daily, pointing to pictures and naming them builds the word object connection
* Baby sign language (more, all done, milk) gives babies a way to communicate before they can speak, it accelerates spoken language, it does not delay it',
  what_not_to_worry = 'Words don''t need to be clear to count. A consistent approximation, "bah" always for ball, "dah" always for dog, counts as a word. Don''t set the bar at adult pronunciation.',
  missed_window     = 'No words (including signs) by 15 months: raise at the 15 month well child visit. This is one of the primary assessment points. Early speech intervention at 12–18 months has strong evidence of effectiveness.',
  source_citation   = 'CDC Developmental Milestones (2024); AAP Language Developmental Surveillance; Fenson et al., MacArthur CDI Norms',
  updated_at        = now()
  WHERE slug = 'language-first-words';

-- language-full-sentences
UPDATE milestone_windows SET
  title             = 'Full sentences (4+ words)',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 130,
  peak_age_weeks    = 156,
  close_age_weeks   = 169,
  why_it_matters    = 'By 36 months, most children are speaking in sentences of 4 or more words and can be understood by unfamiliar adults roughly 75% of the time. Full sentences mark the point at which language is a reliable communication tool, not just labels and requests, but narrative, explanation, and emotional expression. Absent 4 word sentences by 36 months is a significant language flag.',
  what_to_do        = '* Have real conversations: ask about their day, their feelings, what they noticed
* Read books with storylines, not just picture books, narrative structure builds sentence structure
* Limit screens: at this age, screen time still primarily displaces conversation',
  what_not_to_worry = 'Grammar is still developing through age 5–7. Irregular verbs, pronouns, and plurals take years to master. The milestone is sentence length and communicative intent, not grammatical perfection.',
  missed_window     = 'Speech that is mostly 2 word phrases at 36 months warrants evaluation. Raise it at the 36 month well child visit. A speech language pathologist assessment at 3 years can identify issues that are very addressable with early therapy.',
  source_citation   = 'CDC Developmental Milestones (2024); AAP 36 Month Well Child Visit; ASHA (American Speech Language Hearing Association) Developmental Milestones',
  updated_at        = now()
  WHERE slug = 'language-full-sentences';

-- language-imitating-sounds
UPDATE milestone_windows SET
  title             = 'Imitates sounds and facial expressions',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 17,
  peak_age_weeks    = 21,
  close_age_weeks   = 30,
  why_it_matters    = 'Imitation is the engine of learning. When a baby copies a sound you make, or sticks out their tongue back at you, they are demonstrating the capacity for social learning. This is one of the building blocks of language, empathy, and communication. Imitation of facial expressions can begin as early as the first weeks, and most babies solidify sound imitation around 4 to 5 months.',
  what_to_do        = '* Make simple sounds close to their face and wait: "ba," "ma," "ah", see if they attempt to copy
* Exaggerate facial expressions: big open mouth, wide eyes, tongue out
* Give them time to respond. The pause after you make a sound matters.',
  what_not_to_worry = 'The imitation will be rough and approximate at first. A baby who opens their mouth wide when you do is imitating, even if the sound is not yet right.',
  missed_window     = 'If your 7 month old shows no imitation of sounds or expressions, mention it at the next visit. Most babies who are a little slower here respond quickly once given the right kind of back-and-forth interaction.',
  source_citation   = 'Meltzoff and Moore (1977), Infant Imitation Research; CDC',
  updated_at        = now()
  WHERE slug = 'language-imitating-sounds';

-- language-knows-name-age
UPDATE milestone_windows SET
  title             = 'Knows full first name and age',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 130,
  peak_age_weeks    = 156,
  close_age_weeks   = 182,
  why_it_matters    = 'Knowing and stating their full first name and age (holding up the correct number of fingers) by age 3 shows autobiographical memory, self concept, and language integration. It is also a practical safety milestone, a child who can state their name is better equipped to communicate with an adult if lost.',
  what_to_do        = '* Practice at home in a fun way: "what is your name?" "how old are you?"
* Celebrate birthday awareness, "you are 2 years old now!"
* Teach first and last name for safety purposes as soon as they can manage it',
  what_not_to_worry = 'Last name comes later than first name. Middle name is not part of this milestone.',
  missed_window     = 'If your 3.5 year old cannot state their first name when asked, it is worth a mention at the next visit. Most children this age know their name but may need a bit more practice saying it on request. A few fun repetitions a day tends to do the trick.',
  source_citation   = 'CDC; AAP Bright Futures',
  updated_at        = now()
  WHERE slug = 'language-knows-name-age';

-- language-label-emotions
UPDATE milestone_windows SET
  title             = 'Label emotions out loud',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 52,
  peak_age_weeks    = 65,
  close_age_weeks   = 104,
  why_it_matters    = 'Children who have words for their emotions are significantly better at regulating them. The research on emotional literacy consistently shows that naming a feeling (even for someone else) activates the prefrontal cortex and reduces the intensity of the amygdala response. In plain terms: naming it tames it. This starts with the parent labeling the child''s emotions, not the child doing it themselves.',
  what_to_do        = '* Narrate emotional states during daily life: "you look frustrated that the block won''t stay," "I can see you are really excited"
* Use simple, clear emotion words: happy, sad, angry, scared, surprised, silly
* Name your own emotions too: "I am feeling tired right now"',
  what_not_to_worry = 'You are not teaching them to perform emotions, you are building their emotional vocabulary. Even if they never say the words back to you in toddlerhood, the wiring is happening.',
  missed_window     = 'This window is always open. If you haven''t started, start today. The practice is valuable at any age.',
  source_citation   = 'Lieberman (2011), Putting Feelings into Words; Zero to Three; Gottman (1997)',
  updated_at        = now()
  WHERE slug = 'language-label-emotions';

-- language-laughing
UPDATE milestone_windows SET
  title             = 'Laughs out loud',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 8,
  peak_age_weeks    = 12,
  close_age_weeks   = 17,
  why_it_matters    = 'Laughing out loud (not just smiling) typically emerges around 3 months. It requires the coordination of breath, voice, and social responsiveness all at once. It is a sign the brain is making deeper social connections and that the baby finds the world interesting. Absent laughter by 4 months is worth noting.',
  what_to_do        = '* Gentle tickling, funny faces, and peek a boo are the most reliable triggers at this age
* Pay attention to what makes your specific baby laugh and repeat it
* Laughter is contagious, laugh back, even at their laughing',
  what_not_to_worry = 'Some babies are more serious than others and laugh less frequently. The question is whether they laugh at all, not whether they do it constantly.',
  missed_window     = 'If your baby is not laughing or producing any positive vocalizations by 4 months, bring this up at the 4 month visit. There is a wide range in how babies develop, and an early check can give you useful, personalized guidance.',
  source_citation   = 'CDC Milestones (2024); Zero to Three',
  updated_at        = now()
  WHERE slug = 'language-laughing';

-- language-mama-dada-specific
UPDATE milestone_windows SET
  title             = 'Uses "mama" and "dada" specifically',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 39,
  peak_age_weeks    = 47,
  close_age_weeks   = 52,
  why_it_matters    = 'Many babies say "mama" and "dada" as sounds by around 9 months, without attaching specific meaning. Most use them specifically by 12 months, "mama" when looking at mom, "dada" when looking at dad. This transition from babble to intentional label is the first vocabulary moment. It signals that the brain is now mapping sounds to people and objects. Not using any specific words by 12 months is a language red flag.',
  what_to_do        = '* Use "mama" and "dada" in self referential sentences: "Mama is right here." "Dada is coming."
* Point to each parent when saying the word, connect the sound to the face
* Respond enthusiastically (not over the top) when they use the words correctly, positive reinforcement locks it in',
  what_not_to_worry = '"Mama" said while crying for anyone is not the milestone. Specific use, looking at mom and saying "mama", is what you''re watching for.',
  missed_window     = 'No specific words by 12–13 months warrants a conversation with your pediatrician. Speech language referral at this stage, if indicated, is highly effective.',
  source_citation   = 'CDC Developmental Milestones (2024); AAP Language Development Guidelines',
  updated_at        = now()
  WHERE slug = 'language-mama-dada-specific';

-- language-names-colors
UPDATE milestone_windows SET
  title             = 'Names at least 2 colors',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 104,
  peak_age_weeks    = 117,
  close_age_weeks   = 130,
  why_it_matters    = 'Color naming is a cognitive and language milestone that most children reach somewhere around 24 to 30 months. It requires learning abstract category labels (colors are not things, they are properties of things), which is a more complex linguistic concept than naming objects.',
  what_to_do        = '* Name colors in daily life constantly: "here is your red cup," "look at the blue car"
* Use simple color sorting games with blocks or toys
* Read books that feature color concepts',
  what_not_to_worry = 'Color vision is usually fine even if naming is delayed. Many children confuse color names (calling blue "green") long after they can perceive the difference. Naming comes later than perception.',
  missed_window     = 'If your 3 year old cannot name a single color reliably, it is worth mentioning at the 36 month visit. Color naming is one of the last abstract language concepts to click, and most children get there with continued daily exposure.',
  source_citation   = 'CDC Milestones (2024); Shatz et al. (1996)',
  updated_at        = now()
  WHERE slug = 'language-names-colors';

-- language-narrate-meals
UPDATE milestone_windows SET
  title             = 'Narrate meals, builds vocabulary',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 0,
  peak_age_weeks    = 26,
  close_age_weeks   = 130,
  why_it_matters    = 'Mealtimes happen 3 times a day, every day, for years. That makes them one of the most powerful and underused language development settings. Narrating the food, describing textures and colors, naming what is on the plate, and asking open ended questions about the meal creates thousands of language learning moments per week.',
  what_to_do        = '* Name every food on the plate: "that is broccoli. It is green and crunchy."
* Describe sensory properties: "this soup is warm. Is it too hot?"
* From 30 months onward, ask open questions: "what do you think this tastes like?" — at this age children can begin simple causal and descriptive reasoning',
  what_not_to_worry = 'You do not need to turn every meal into a lesson. Casual narration is more natural and sustainable than formal teaching.',
  missed_window     = 'If meals are quiet and screen based, this is an easy practice to start this week. One narrated meal per day is better than none.',
  source_citation   = 'Hart and Risley (1995), Meaningful Differences; AAP Language Promotion',
  updated_at        = now()
  WHERE slug = 'language-narrate-meals';

-- language-pronouns
UPDATE milestone_windows SET
  title             = 'Uses pronouns, I, me, you',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 91,
  peak_age_weeks    = 104,
  close_age_weeks   = 117,
  why_it_matters    = 'Using pronouns correctly requires understanding that different people have different perspectives, "I" changes based on who is speaking. This is a significant cognitive and linguistic step. Most children begin using pronouns somewhere between 21 and 27 months. Persistent use of the child''s own name in place of "I" past 30 months is a flag worth noting.',
  what_to_do        = '* Model pronoun use constantly: "I am eating. You are eating. We are eating."
* Do not correct errors directly, expand and rephrase: if they say "Emma want cookie," say "You want a cookie? Here you go."
* Books with first and second person narration are helpful',
  what_not_to_worry = 'Pronoun reversal ("you want milk" when they mean "I want milk") is very common at 2 years and usually resolves on its own.',
  missed_window     = 'If your 30 month old is not using "I" or "me" at all, raise it at the 30 month visit. Pronoun development is often just a little behind the rest of speech, and most children work it out naturally with consistent modeling.',
  source_citation   = 'CDC Milestones (2024); Chiat (1986)',
  updated_at        = now()
  WHERE slug = 'language-pronouns';

-- language-question-asking
UPDATE milestone_windows SET
  title             = 'The question explosion, "What''s that?" and "Why?"',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 83,
  peak_age_weeks    = 92,
  close_age_weeks   = 156,
  why_it_matters    = 'Most toddlers begin asking "What''s that?" constantly around 20 to 24 months — this is a labeling and vocabulary-building strategy. True "Why?" questions, which require understanding cause and effect, typically don''t emerge until 30 to 36 months. Each question answered builds vocabulary and, more importantly, builds the understanding that words are tools for getting information.',
  what_to_do        = '* Answer every question, even the obvious ones. "That''s a mailbox. The mail carrier puts letters in it."
* Resist the urge to answer with a question back ("What do you think it is?") at this stage, they are asking because they genuinely do not know
* When you do not know the answer, say so and look it up together: "I don''t know. Let''s find out"
* Expect the same question multiple times. Repetition is how they cement new words.',
  what_not_to_worry = 'The sheer volume of questions at this age, sometimes dozens per hour, is developmentally normal and temporary. It peaks and fades as vocabulary grows.',
  missed_window     = 'A child who rarely or never asks questions by 22 to 24 months, especially combined with limited vocabulary, is worth raising at the 24 month visit. Keep talking, reading, and answering questions as they come. Language development continues well beyond this stage, and there is always more you can do to support it.',
  source_citation   = 'Hart & Risley (1995) Meaningful Differences; Nelson (1973) language acquisition research; CDC Milestones (2024)',
  updated_at        = now()
  WHERE slug = 'language-question-asking';

-- language-read-aloud-daily
UPDATE milestone_windows SET
  title             = 'Read aloud every day, build the habit',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 52,
  why_it_matters    = 'Reading aloud from birth is one of the highest impact things a parent can do for language development, school readiness, and the parent child relationship. The AAP recommends reading aloud starting at birth. Children who are read to daily have significantly larger vocabularies, better literacy skills, and stronger cognitive development by school age. The habit established in the first year carries through childhood. It requires no special books, no special voice, and no special time, just consistency.',
  what_to_do        = '* Start now, regardless of the baby''s age, they benefit from the voice, rhythm, and closeness from day one
* Any book counts. Board books, picture books, whatever''s available.
* Make it a daily routine: before the first nap, at bedtime, during a feed',
  what_not_to_worry = 'Your baby will not understand a word. Read anyway. The sound of language, the rhythm of sentences, and the close physical experience are what matter in the first months. Comprehension comes later.',
  missed_window     = 'It''s never too late to start reading aloud. If the habit isn''t established, start with one short book before bed tonight and build from there.',
  source_citation   = 'AAP Policy on Literacy Promotion (2014); REACH OUT AND READ Research Base; Strickland & Morrow, Emergent Literacy; Bus et al. (1995), Meta analysis on shared reading',
  updated_at        = now()
  WHERE slug = 'language-read-aloud-daily';

-- language-read-with-pointing
UPDATE milestone_windows SET
  title             = 'Read aloud with pointing, connecting words to pictures',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 26,
  peak_age_weeks    = 52,
  close_age_weeks   = 104,
  why_it_matters    = 'Once a baby can sit and focus on a book (around 6 months), pointing to pictures while you name them accelerates vocabulary acquisition significantly. The connection between the spoken word and the image on the page is how children learn that objects have labels. Research shows that children read to with pointing have larger vocabularies by age 2 than those simply read to in a flat narrative style.',
  what_to_do        = '* Point to the picture as you say the word: "look, a dog. The dog is running."
* Pause and let the child point back when they are old enough (8 to 10 months onward)
* Board books with large, clear pictures are ideal for this',
  what_not_to_worry = 'You do not need to follow the story text word for word. Describing what you see in the pictures is just as effective.',
  missed_window     = 'If you have been reading without pointing, start today. It is never too late to add this layer.',
  source_citation   = 'Bus et al. (1995); Whitehurst and Lonigan (1998); AAP Literacy Promotion',
  updated_at        = now()
  WHERE slug = 'language-read-with-pointing';

-- language-receptive-vocabulary
UPDATE milestone_windows SET
  title             = 'Understands 50+ words, receptive language leads the way',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 43,
  peak_age_weeks    = 52,
  close_age_weeks   = 61,
  why_it_matters    = 'Receptive language (words a child understands) always develops ahead of expressive language (words they can say). By 14 months, most children understand 50 or more words even though they may only say 5 to 10. This gap is normal and expected. However, a child who does not appear to understand common words, names, and simple instructions by 14 months is worth monitoring, as receptive delays can be an earlier indicator of language or hearing issues than expressive delays.',
  what_to_do        = '* Test receptive vocabulary with natural prompts: "Where is the dog?" "Can you bring me the cup?" "Show me your shoes."
* If the child looks, points, or retrieves the correct object, they understand it, even if they cannot say it
* Continue narrating daily life: every word you use builds the receptive vocabulary bank
* Read aloud daily, pointing to pictures and naming them builds word-to-object mapping',
  what_not_to_worry = 'A 12 to 14 month old who says very few words but clearly understands what is being said is on a normal trajectory. Expressive language catches up.',
  missed_window     = 'If your 14 month old does not consistently respond to their own name, does not follow simple one step instructions, and does not appear to understand common object names, bring it up at the 15 month visit. A hearing check is the first step, and early identification means early support, which makes a real difference.',
  source_citation   = 'Hart & Risley (1995); AAP Language Development Guidelines; CDC 12-Month Milestones',
  updated_at        = now()
  WHERE slug = 'language-receptive-vocabulary';

-- language-responds-to-name
UPDATE milestone_windows SET
  title             = 'Responds to own name',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 17,
  peak_age_weeks    = 21,
  close_age_weeks   = 30,
  why_it_matters    = 'Most babies develop reliable name response, turning specifically toward their own name rather than any voice or sound, somewhere between 5 and 7 months. It''s a sign that the brain is processing social information specifically: their name is meaningful in a way that random sounds are not. Not responding consistently to their name by 7 months is a red flag for hearing issues and is also one of the core early screening indicators for autism spectrum disorder.',
  what_to_do        = '* Use their name frequently and consistently, not just nicknames
* Test when they''re not looking at you: call their name from across the room and see if they turn
* Make name calling a positive event, say the name, they turn, you smile and engage',
  what_not_to_worry = 'Babies this age are easily distracted. Test name response when they''re alert and not engrossed in something. One or two failed attempts don''t indicate a problem.',
  missed_window     = 'If your baby does not consistently respond to their name by 7 months, mention it at the next well child visit or contact your pediatrician before then. Reliable name response is a key data point in developmental surveillance. The earlier any concerns are addressed, the more options are available.',
  source_citation   = 'CDC Developmental Milestones (2024); Nadig et al. (2007), Name Response as Early ASD Predictor; AAP Autism Screening',
  updated_at        = now()
  WHERE slug = 'language-responds-to-name';

-- language-screen-time-displacement
UPDATE milestone_windows SET
  title             = 'Screen time displaces language, minimize background TV',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 156,
  why_it_matters    = 'Background TV reduces parent to child verbal interaction. Studies show that for every hour of TV playing in the background, parents speak approximately 770 fewer words to their child. Children in homes with frequent background TV have smaller vocabularies and shorter conversational exchanges. Screen time is not the only language variable, but it is one of the most controllable.',
  what_to_do        = '* Turn off the TV when it is not being actively watched
* Designate specific screen times and keep the rest of the day screen free
* If screens are on, co watch and narrate: "what is that character doing?"',
  what_not_to_worry = 'For children under 18 months, the AAP recommends no screen time except interactive video chatting with family. After 18 to 24 months, occasional high-quality co-viewed programming is acceptable. The concern at any age is habitual background noise that competes with conversation.',
  missed_window     = 'This applies throughout childhood. If screens are a constant background feature of your home, reducing them is one of the highest impact language interventions available.',
  source_citation   = 'Christakis et al. (2009), TV and Language; AAP Screen Time Policy (2016, updated 2024)',
  updated_at        = now()
  WHERE slug = 'language-screen-time-displacement';

-- language-serve-return
UPDATE milestone_windows SET
  title             = 'Serve and return, the foundation of language',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 17,
  why_it_matters    = 'Harvard''s Center on the Developing Child calls serve and return "the most important thing parents can do for brain development." The concept: your baby makes a sound, a gesture, or a facial expression (the "serve"). You respond, make eye contact, mimic, talk back, engage (the "return"). Every exchange like this builds neural connections. Millions of these exchanges in the first years of life wire the architecture for language, emotional regulation, and learning. It''s not the content that matters, it''s the back-and-forth.',
  what_to_do        = '* Narrate everything you do: "I''m changing your diaper now. Left leg first."
* When your baby coos, coo back. When they look at something, look at it too and name it.
* Put the phone down during feeding and face to face time, your face is the most interesting thing in their world right now',
  what_not_to_worry = 'You don''t need special activities or toys. You are the activity. Talking to your baby while doing ordinary things, getting dressed, making breakfast, driving, is exactly what this looks like in practice.',
  missed_window     = 'This window never truly closes. Serve and return matters throughout childhood. If you''re starting late, start now. The density of these interactions early in life matters most, but every additional exchange still builds something.',
  source_citation   = 'Harvard Center on the Developing Child, Serve and Return; National Scientific Council on the Developing Child; AAP Literacy Guidelines',
  updated_at        = now()
  WHERE slug = 'language-serve-return';

-- language-singing-together
UPDATE milestone_windows SET
  title             = 'Singing together accelerates language',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 26,
  peak_age_weeks    = 52,
  close_age_weeks   = 104,
  why_it_matters    = 'Music and language share overlapping neural networks. Children who are sung to regularly show measurably better phonological awareness, vocabulary, and memory for sequences. Songs encode words in melody, which makes them easier to recall. Research by Sandra Trehub shows that infants have sophisticated musical sensitivity from birth.',
  what_to_do        = '* Sing during routines: bath time, car rides, getting dressed
* Repeat the same songs many times, repetition is the mechanism
* Interactive songs that involve the child''s name or body parts add an extra layer of engagement',
  what_not_to_worry = 'You do not need to be a good singer. Your child is not a music critic. They respond to your voice and the rhythm, not your pitch accuracy.',
  missed_window     = 'If singing is not part of your routine yet, starting at any age has demonstrable benefits. Pick three songs and repeat them this week.',
  source_citation   = 'Trehub (2003), Musical Predispositions in Infancy; Bryant et al. (1990); AAP',
  updated_at        = now()
  WHERE slug = 'language-singing-together';

-- language-songs-rhymes
UPDATE milestone_windows SET
  title             = 'Introduce nursery rhymes and songs',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 0,
  peak_age_weeks    = 12,
  close_age_weeks   = 52,
  why_it_matters    = 'Songs and rhymes are one of the oldest and most effective language tools. The repetition builds vocabulary through pattern recognition. The rhythm and rhyme make words easier to remember. Research shows that phonological awareness (the ability to hear and manipulate sounds) is a strong predictor of reading ability, and nursery rhymes are an early builder of this skill.',
  what_to_do        = '* Pick 3 to 5 simple songs and sing them consistently: "Twinkle Twinkle," "Itsy Bitsy Spider," "Row Your Boat"
* Use hand gestures or actions alongside the song
* Repetition is the whole point. Sing the same songs many times.',
  what_not_to_worry = 'You do not need to be a good singer. Babies do not care about pitch or quality. They care about your face, your voice, and the pattern.',
  missed_window     = 'If you haven''t started, start today with one song. Repeat it every day this week. Songs are one of the easiest and most enjoyable language tools, and it is never too late to build the habit.',
  source_citation   = 'Bryant et al. (1990), Nursery Rhymes and Reading; AAP',
  updated_at        = now()
  WHERE slug = 'language-songs-rhymes';

-- language-speech-clarity-family
UPDATE milestone_windows SET
  title             = 'Family can understand 75% or more of speech',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 78,
  peak_age_weeks    = 91,
  close_age_weeks   = 104,
  why_it_matters    = 'Most children, by around 24 months, are understood by the people who know them best (parents, siblings, close caregivers) the majority of the time. If even familiar adults are struggling to interpret their speech at 2 years, a speech evaluation is appropriate.',
  what_to_do        = '* Pay attention honestly to how much you understand versus how much you guess from context
* Ask your partner or other family members how much they understand
* At the 24 month visit, report your honest assessment to the pediatrician',
  what_not_to_worry = 'Strangers will always understand less than family. The 75% family comprehension target at 24 months is different from the stranger comprehension target, which is lower.',
  missed_window     = 'If your family cannot understand the majority of your 2 year old''s speech, ask for a speech language referral at the 24 month visit. Early referrals are quick and helpful, and most children respond very well to speech support.',
  source_citation   = 'ASHA; CDC Milestones (2024)',
  updated_at        = now()
  WHERE slug = 'language-speech-clarity-family';

-- language-startle-to-sound
UPDATE milestone_windows SET
  title             = 'Responds to sounds, startles, calms to voice',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 1,
  close_age_weeks   = 8,
  why_it_matters    = 'From birth, a baby should startle to sudden loud sounds and calm to a familiar voice. These are the earliest signs that hearing is functional and that the auditory system is working. Absent or inconsistent response to sound in the first weeks can be an early indicator of hearing loss, which affects 1–3 per 1,000 newborns. Early detection and intervention produces dramatically better language outcomes.',
  what_to_do        = '* Newborn hearing screen is done in the hospital before discharge, confirm it was completed and ask for the result
* At home: clap or make a sudden sound near (not directly at) the baby''s ear and watch for a startle response
* Note whether your baby calms to your voice specifically',
  what_not_to_worry = 'Newborns sleep deeply and may not startle to sounds when in deep sleep. Test when awake and alert for reliable results.',
  missed_window     = 'If your baby does not appear to respond to sounds by 2 months, raise this at the 2 month well child visit or call your pediatrician before then. Hearing screening can be repeated. Early intervention for hearing loss is highly effective when started before 6 months.',
  source_citation   = 'JCIH (Joint Committee on Infant Hearing) Year 2019 Position Statement; AAP Universal Newborn Hearing Screening',
  updated_at        = now()
  WHERE slug = 'language-startle-to-sound';

-- language-stranger-understands-50pct
UPDATE milestone_windows SET
  title             = '50% of speech understandable to strangers',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 91,
  peak_age_weeks    = 104,
  close_age_weeks   = 117,
  why_it_matters    = 'Most children, by around 24 months, are understood by strangers (people who do not know the child) about half the time. Parents and caregivers can often understand more because they know the child''s speech patterns and context. The stranger comprehension test is a more objective measure of speech clarity.',
  what_to_do        = '* Pay attention to how other adults respond when your child speaks, do they ask for translation often?
* Avoid habitually translating for your child, give them space to communicate directly
* If speech clarity is a concern, mention it to your pediatrician',
  what_not_to_worry = 'Some sounds (r, l, th, s blends) are not expected to be mastered until age 5 to 7. Clarity about the words as a whole matters more than individual sound perfection at this stage.',
  missed_window     = 'If strangers cannot understand any of your child''s speech by 24 months, a speech language evaluation is a helpful next step. Early speech support is highly effective, and most families find the process practical and reassuring.',
  source_citation   = 'ASHA Milestones; CDC',
  updated_at        = now()
  WHERE slug = 'language-stranger-understands-50pct';

-- language-stranger-understands-75pct
UPDATE milestone_windows SET
  title             = '75% of speech understandable to strangers',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 104,
  peak_age_weeks    = 117,
  close_age_weeks   = 130,
  why_it_matters    = 'Most children are understood by strangers approximately 75% of the time by around 36 months. This is the benchmark used by speech language pathologists for evaluating speech clarity at age 3. Below this threshold often indicates a speech sound disorder that benefits from early therapy.',
  what_to_do        = '* Note how often you have to translate for your child in interactions with other adults
* Ask your pediatrician at the 36 month visit to assess speech intelligibility
* If unclear, request a speech language pathology evaluation',
  what_not_to_worry = 'Background noise, tiredness, and shyness all reduce speech clarity. Assess your child in comfortable, familiar settings for the most accurate picture.',
  missed_window     = 'If strangers cannot understand the majority of your child''s speech by age 3, request a speech evaluation referral at the 36 month visit. Speech therapy at this stage is very effective, and many children make significant gains quickly.',
  source_citation   = 'ASHA; CDC Milestones (2024)',
  updated_at        = now()
  WHERE slug = 'language-stranger-understands-75pct';

-- language-tells-stories
UPDATE milestone_windows SET
  title             = 'Tells a simple story or describes a recent event',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 156,
  peak_age_weeks    = 169,
  close_age_weeks   = 195,
  why_it_matters    = 'Telling a story (even a simple one like "we went to the park, I saw a dog, the dog was big") requires narrative structure, memory retrieval, and connected sentence production. It is one of the most advanced language milestones in the early childhood window and a predictor of reading comprehension and academic success.',
  what_to_do        = '* After outings, ask open ended questions: "what happened at the park?" rather than "did you have fun?"
* Build narrative with them: "you told me about the dog, what did the dog do?"
* Use photos from recent events as prompts for storytelling practice',
  what_not_to_worry = 'Stories at this age will be out of sequence, missing details, and full of repetition. That is exactly right for this stage.',
  missed_window     = 'If your 4 year old cannot describe any recent event in connected sentences, a speech and language check is worth requesting. Many children are still building their narrative skills at this stage, and a targeted evaluation can give you a clear picture and helpful strategies.',
  source_citation   = 'CDC; Applebee (1978), Narrative Development Research',
  updated_at        = now()
  WHERE slug = 'language-tells-stories';

-- language-understands-no
UPDATE milestone_windows SET
  title             = 'Understands no',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 30,
  peak_age_weeks    = 39,
  close_age_weeks   = 52,
  why_it_matters    = 'Understanding "no", pausing or changing behavior in response to the word, shows that language comprehension is developing. For most babies, receptive language (what they understand) runs ahead of expressive language (what they say) through the 9 to 12 month window. A baby who understands "no" has reached a key comprehension checkpoint.',
  what_to_do        = '* Use "no" consistently and calmly when redirecting
* Pair it with a physical cue: a gentle hand hold or a redirection to a safe alternative
* Do not overuse "no", it loses meaning if it accompanies everything',
  what_not_to_worry = 'Understanding "no" and consistently obeying it are different things. Comprehension comes first. Compliance takes much longer and involves the prefrontal cortex, which is years away from being reliable.',
  missed_window     = 'If your 12 month old shows no response to "no" or their name, raise hearing and comprehension concerns at the 12 month visit. A hearing check is quick and straightforward, and most concerns are easily addressed with early support.',
  source_citation   = 'CDC Milestones (2024); AAP Language Surveillance',
  updated_at        = now()
  WHERE slug = 'language-understands-no';

-- language-vocab-10-words
UPDATE milestone_windows SET
  title             = 'Vocabulary: 10 words',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 56,
  peak_age_weeks    = 65,
  close_age_weeks   = 78,
  why_it_matters    = 'A vocabulary of 10 words by 15–18 months is the standard developmental checkpoint. This is not 10 perfect words, it''s 10 consistent, intentional labels for people, objects, or actions, in any form including sign language. Research on vocabulary development shows a clear acceleration (the "vocabulary spurt") that typically begins after the 10 word milestone. Getting to 10 words is what triggers it.',
  what_to_do        = '* Count consistently: keep a rough mental list of what counts as a word (consistent use, specific meaning)
* Read aloud with pointing: "Where''s the dog? There''s the dog."
* Simple songs with repetition are some of the most effective vocabulary tools at this age',
  what_not_to_worry = 'Boys tend to develop vocabulary slightly later than girls. This is well documented and not a reason to ignore red flags, but it provides some normal range context.',
  missed_window     = 'Fewer than 10 words by 18 months is one of the core language flags at the 18 month M-CHAT visit. Raise it with your pediatrician. Early speech evaluation and intervention at this stage is highly effective.',
  source_citation   = 'CDC Developmental Milestones (2024); Fenson et al., MacArthur CDI Research; AAP 18 Month Well Child Visit Guidelines',
  updated_at        = now()
  WHERE slug = 'language-vocab-10-words';

-- language-vocab-200-words
UPDATE milestone_windows SET
  title             = 'Vocabulary: 200+ words',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 91,
  peak_age_weeks    = 104,
  close_age_weeks   = 117,
  why_it_matters    = 'By 24 months, most children have approximately 200 words, though the range is wide. What matters more than the exact count is that language is growing rapidly and that two word combinations are present. The 200 word milestone signals that the vocabulary spurt is complete and that the child is on track for three word sentences by 30 months. A vocabulary below 50 words at 24 months is the flag, 200 words is the target.',
  what_to_do        = '* Continue daily reading, narrating daily activities, and expanding their utterances
* Name emotions as well as objects: "you look frustrated," "that made you happy"
* Introduce new vocabulary in context: at the park, at the grocery store, in the bath',
  what_not_to_worry = 'Children who attend daycare and hear multiple caregivers often have larger passive vocabularies but express fewer words. The gap between what they understand and what they say narrows quickly in this window.',
  missed_window     = 'Vocabulary significantly below expected range at 24 months warrants discussion at the 24 month visit and possible speech evaluation. The good news: early intervention at 2 years is highly effective.',
  source_citation   = 'CDC Developmental Milestones (2024); Fenson et al., MacArthur CDI; AAP Language Guidelines',
  updated_at        = now()
  WHERE slug = 'language-vocab-200-words';

-- language-vocab-50-words
UPDATE milestone_windows SET
  title             = 'Vocabulary: 50 words, the 50 word gate',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 78,
  peak_age_weeks    = 91,
  close_age_weeks   = 104,
  why_it_matters    = 'Fifty words is the gate that opens the next stage of language. Research consistently shows that once a child has approximately 50 words, two things happen: vocabulary grows exponentially (some children add 9 to 10 words per day), and two word combinations begin. Most children reach the 50 word milestone somewhere between 18 and 24 months. Not reaching it by 24 months is a language flag that nearly always warrants speech evaluation.',
  what_to_do        = '* Keep reading aloud, this is the single highest leverage language intervention
* Expand what they say: if they say "dog," you say "big dog" or "brown dog running." This is called "expansion," and research shows it accelerates vocabulary faster than drilling new words
* Reduce TV/screen time, it displaces conversation, which is the only thing that builds vocabulary at this age',
  what_not_to_worry = 'The 50 word count is approximate. The research cares about the range of 40–60. If your child is at 35 words at 22 months, they''re tracking fine. The flag is significantly below 50 at 24 months.',
  missed_window     = 'Fewer than 50 words at 24 months: bring this to the 24 month well child visit. This is the primary language flag at that visit. Speech language pathology evaluation at this stage produces measurable improvement in outcomes.',
  source_citation   = 'Fenson et al., MacArthur CDI Research; Ganger & Brent (2004), Vocabulary Spurt; CDC Developmental Milestones; AAP Language Guidelines',
  updated_at        = now()
  WHERE slug = 'language-vocab-50-words';

-- language-waving
UPDATE milestone_windows SET
  title             = 'Waving bye bye',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 34,
  peak_age_weeks    = 39,
  close_age_weeks   = 52,
  why_it_matters    = 'Waving is a social gesture, a deliberate communication with another person. It requires understanding that gestures carry meaning and that you can use your body to communicate without sound. It is also an early indicator of gestural communication, which is part of the same developmental pathway as pointing and language.',
  what_to_do        = '* Wave goodbye every time you leave a room or end a face to face interaction
* Clap and cheer when they wave back, make it rewarding
* Wave during video calls with family to give them more practice opportunities',
  what_not_to_worry = 'Some babies wave with their whole arm, some with just their hand, some with fingers splayed. Any intentional goodbye gesture counts.',
  missed_window     = 'No waving or gestural communication by 12 months is worth raising at the 12 month visit. It is a quick topic to discuss, and most families get clear, actionable guidance.',
  source_citation   = 'CDC Milestones (2024); AAP',
  updated_at        = now()
  WHERE slug = 'language-waving';

-- motor-balance-one-foot
UPDATE milestone_windows SET
  title             = 'Balancing on one foot for 2 seconds',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 131,
  peak_age_weeks    = 143,
  close_age_weeks   = 152,
  why_it_matters    = 'Most children develop the ability to stand briefly on one foot around 30 to 35 months. It requires the child to shift their center of gravity over a single support point while the raised leg is controlled, a demanding vestibular and proprioceptive task. This is the direct precursor to hopping, skipping, and the single-leg balance needed for kicking accuracy and stair climbing with alternating feet.',
  what_to_do        = '* Make it a game: "Can you stand on one foot like a flamingo?"
* Hold their hand at first and gradually reduce support
* Count out loud while they balance. This makes it concrete and motivating
* Practice during normal routines: standing on one foot to put on a sock is a real-world application',
  what_not_to_worry = 'Two seconds is the target by 36 months. Five or ten seconds comes later. Brief wobble and catch balancing counts.',
  missed_window     = 'Unable to balance on either foot for any duration by 36 months is worth noting at the well child visit as part of gross motor review. Your provider can offer targeted activities and reassurance based on your child''s overall motor picture.',
  source_citation   = 'Bayley Scales of Infant Development; CDC 3-Year Milestones',
  updated_at        = now()
  WHERE slug = 'motor-balance-one-foot';

-- motor-catching-ball
UPDATE milestone_windows SET
  title             = 'Catches a large ball',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 104,
  peak_age_weeks    = 130,
  close_age_weeks   = 156,
  why_it_matters    = 'Most children develop the ability to catch a large ball (arms extended, trapping the ball against the body) around 30 to 36 months. It requires anticipating the ball''s trajectory, timing the arm movement, and adjusting for errors in real time. These are visual motor integration skills that also underpin reading and writing.',
  what_to_do        = '* Use a large, soft ball (beach ball size), smaller balls require more precision than toddlers have
* Throw gently and directly to their outstretched arms
* Celebrate any contact with the ball, not just a clean catch',
  what_not_to_worry = 'Most toddlers catch by trapping the ball against their chest with both arms, not with a clean hand catch. This is completely correct technique for this age.',
  missed_window     = 'If your 3 year old cannot interact with a ball at all (catch, kick, or throw), mention it at the 36 month visit. A brief assessment can identify any support that would help.',
  source_citation   = 'CDC; AAP',
  updated_at        = now()
  WHERE slug = 'motor-catching-ball';

-- motor-crawling
UPDATE milestone_windows SET
  title             = 'Crawling or alternative locomotion',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 26,
  peak_age_weeks    = 34,
  close_age_weeks   = 43,
  why_it_matters    = 'Crawling is the first time a child can choose where they go. It builds the cross body coordination (left arm with right leg) that is important for later brain development and balance. However, the style of crawling matters less than the intent to move.',
  what_to_do        = '* Provide lots of uninterrupted floor time
* Place favorite toys just out of reach
* Babyproof your home now if you haven''t finished (see Safety section)',
  what_not_to_worry = 'Army crawling (on the belly), scooting on the butt, or rolling to get across the room all count as mobility. Some babies skip a traditional hands and knees crawl entirely.',
  missed_window     = 'If your 10 month old is making no effort to move across the room in any way, talk to your pediatrician. Most babies who need encouragement in this area respond well to a few targeted strategies.',
  source_citation   = 'AAP; CDC',
  updated_at        = now()
  WHERE slug = 'motor-crawling';

-- motor-cruising
UPDATE milestone_windows SET
  title             = 'Cruises along furniture',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 34,
  peak_age_weeks    = 43,
  close_age_weeks   = 52,
  why_it_matters    = 'Cruising (walking while holding onto furniture) is the final bridge to independent walking. It develops the side to side balance and hip strength needed for the first steps.',
  what_to_do        = '* Arrange furniture to create a safe path for laps
* Go barefoot as much as possible: toes provide essential grip and feedback for balance
* Never use baby walkers with wheels — the AAP has called for a ban on their manufacture and sale due to the high risk of severe head trauma, skull fractures, and stair falls. They also delay proper walking development.',
  what_not_to_worry = 'Cruising can last for months. Some babies cruise for a long time because they are cautious, even if they have the strength to walk.',
  missed_window     = 'If your one year old is not cruising or standing while holding on, discuss this at the 12 month visit. Your pediatrician can assess what is going on and suggest practical next steps.',
  source_citation   = 'AAP; CDC; AAP Policy Statement on Infant Walkers',
  updated_at        = now()
  WHERE slug = 'motor-cruising';

-- motor-drawing-circle
UPDATE milestone_windows SET
  title             = 'Copies a circle',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 104,
  peak_age_weeks    = 117,
  close_age_weeks   = 130,
  why_it_matters    = 'Copying a circle (drawing a closed, approximately circular shape) is a standard motor milestone around 30 months. It requires more wrist rotation and planning than a straight line. It is a letter readiness skill and a common item on developmental screening tests at age 3.',
  what_to_do        = '* Draw a circle slowly in front of the child and invite them to copy it
* Accept any closed or approximately circular shape
* Practice with finger painting, tracing circles, and drawing on fogged glass',
  what_not_to_worry = 'Their circle will look like an oval, or a lumpy potato shape, or a loop. It counts. Geometric accuracy comes years later.',
  missed_window     = 'If your 3 year old cannot produce any closed round shape at all, raise it at the 36 month visit. Most children respond well to simple fine motor activities and a bit more practice.',
  source_citation   = 'CDC Milestones; HELP Strands; AAP',
  updated_at        = now()
  WHERE slug = 'motor-drawing-circle';

-- motor-drawing-line
UPDATE milestone_windows SET
  title             = 'Copies a vertical line',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 86,
  peak_age_weeks    = 104,
  close_age_weeks   = 117,
  why_it_matters    = 'Copying a vertical line (as opposed to just scribbling) requires the child to observe a shape, form a motor plan, and replicate it. This is called imitation of a stroke and is a precursor to letter formation. Most children develop this skill between 21 and 27 months.',
  what_to_do        = '* Draw a simple vertical line and say "can you make one like this?"
* Do not hold their hand or guide the crayon, copying requires independent execution
* Horizontal lines come after vertical lines; circles come after both',
  what_not_to_worry = 'The copy will be rough and approximate. An imperfect vertical line is still a copied vertical line.',
  missed_window     = 'If your 27 month old cannot copy a simple vertical line, it is worth noting at the 30 month visit. Early support is effective and straightforward to put in place.',
  source_citation   = 'CDC Milestones; HELP Strands; AAP',
  updated_at        = now()
  WHERE slug = 'motor-drawing-line';

-- motor-first-steps
UPDATE milestone_windows SET
  title             = 'First steps',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 43,
  peak_age_weeks    = 52,
  close_age_weeks   = 65,
  why_it_matters    = 'First steps typically appear between 10 and 15 months (updated CDC 2022 guidance moved the expected milestone from 12 to 15 months). Most babies take their first independent steps around 12 months. Walking is a clinical milestone. Not walking independently by 18 months is the AAP''s clinical red flag. The 12 and 15 month well child visits monitor progress, but a child who is cruising at 15 months is developing normally.',
  what_to_do        = '* Create safe floor space: remove rugs that slip, soft landing surfaces are fine
* Encourage cruising (furniture walking), it builds the balance and strength needed
* Don''t rush it with walkers or push toys that provide too much support too early
* Let them fall. Falling is how balance is learned.',
  what_not_to_worry = 'Wide stance, toes turned out, and frequent falls are all completely normal in new walkers. The gait looks strange for months. This is expected.',
  missed_window     = 'If your child is not taking independent steps by 15 months, bring it up at the 15 month well child visit if you haven''t already. This is a standard assessment point and your pediatrician will be looking for it. Many children who are referred for assessment at this stage catch up quickly with support.',
  source_citation   = 'CDC Developmental Milestones (2022 update); AAP Developmental Surveillance Guidelines; WHO Motor Milestone Windows',
  updated_at        = now()
  WHERE slug = 'motor-first-steps';

-- motor-handedness-emerging
UPDATE milestone_windows SET
  title             = 'Dominant hand solidifies, and why you should not try to change it',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 113,
  peak_age_weeks    = 130,
  close_age_weeks   = 139,
  why_it_matters    = 'Between 26 and 32 months, most children settle into a consistent hand preference for drawing, eating, and throwing. This is neurological, not behavioral. The dominant hemisphere of the brain is establishing control over the contralateral hand. Approximately 10 percent of children are left handed. Attempting to switch a child''s dominant hand causes stress, disrupts motor learning, and in some cases has lasting effects on speech and language development.',
  what_to_do        = '* Observe which hand the child naturally reaches with for drawing, spoon use, and throwing
* Place objects in the midline. Let them choose which hand to use, do not hand objects to the right hand specifically
* If left handedness is emerging, buy left handed scissors when they reach preschool age
* Tell grandparents and caregivers: this is not something to correct',
  what_not_to_worry = 'Some children remain ambidextrous well past 30 months and settle into a preference closer to age 4 or 5. That is within normal range.',
  missed_window     = 'No dominant hand by age 4 or 5 is worth noting. Strong hand preference before 18 months (especially if one side is significantly weaker) may warrant review for asymmetric motor development. Early assessment is straightforward, and most concerns in this area resolve well with appropriate support.',
  source_citation   = 'Coren (1992) The Left-Hander Syndrome; AAP Motor Development Guidelines',
  updated_at        = now()
  WHERE slug = 'motor-handedness-emerging';

-- motor-head-control
UPDATE milestone_windows SET
  title             = 'Head control, holds head steady when upright',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 4,
  peak_age_weeks    = 12,
  close_age_weeks   = 17,
  why_it_matters    = 'Steady head control by 4 months is one of the foundational gross motor milestones. It signals that the neck muscles and upper spine are developing correctly. It''s also a prerequisite for solid food readiness, babies who can''t hold their heads up aren''t ready for solids. Absent or significantly delayed head control is one of the first motor red flags pediatricians check for.',
  what_to_do        = '* Tummy time (see above) is the main driver, the work happens there
* Hold baby in supported upright positions during waking hours: facing outward in your arms, in a baby carrier
* At the 4 month well child visit, your pediatrician will assess this directly',
  what_not_to_worry = '"Steady" doesn''t mean perfect. Some wobble at 3 months is completely normal. The test is: when held upright and supported at the torso, does the head stay up for several seconds without collapsing?',
  missed_window     = 'If your baby is not holding their head up by 4 months, bring it up at your next pediatrician visit. This is worth discussing. It doesn''t mean something is definitively wrong, but it warrants professional assessment. Most concerns at this stage are quickly identified and addressed.',
  source_citation   = 'CDC Developmental Milestones (2024); Denver II Developmental Screening Test; WHO Multicentre Growth Reference Study',
  updated_at        = now()
  WHERE slug = 'motor-head-control';

-- motor-hopping-one-foot
UPDATE milestone_windows SET
  title             = 'Hops on one foot',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 130,
  peak_age_weeks    = 156,
  close_age_weeks   = 182,
  why_it_matters    = 'Hopping on one foot (taking multiple consecutive hops on the same foot) is a milestone around age 3 to 3.5. It requires single leg balance, dynamic stability, and rhythmic motor planning. It is a precursor to skipping and is commonly assessed at the 4 year visit.',
  what_to_do        = '* Demonstrate hopping and make it a game: "hop like a bunny!"
* Hopscotch (even a rough version) is excellent practice
* Do not push the milestone, it develops on its own timeline',
  what_not_to_worry = 'Most children at age 3 can manage 1 to 2 hops before losing balance. Three or more consecutive hops typically consolidates by age 3.5 to 4.',
  missed_window     = 'If your 4 year old cannot hop on one foot at all, mention it at the 48 month visit. This is a developable skill and with practice most children get there.',
  source_citation   = 'CDC Milestones; AAP 4 Year Visit Guidelines',
  updated_at        = now()
  WHERE slug = 'motor-hopping-one-foot';

-- motor-jumping-both-feet
UPDATE milestone_windows SET
  title             = 'Jumping in place, both feet leave ground',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 86,
  peak_age_weeks    = 104,
  close_age_weeks   = 117,
  why_it_matters    = 'Jumping requires significant leg power and the ability to coordinate both sides of the body simultaneously. It is a major milestone for athleticism and physical confidence.',
  what_to_do        = '* Practice jumping off a very small height (like a 2 inch curb) onto a soft surface
* Model the behavior: Look, I jump!
* Use a trampoline with a handle or a soft mat for practice',
  what_not_to_worry = 'Many children one foot jump for a long time before they can get both feet off the ground at once. This is a normal progression.',
  missed_window     = 'If your 2.5 year old cannot jump in place with both feet, it is worth a mention at the 30 month visit. Many children take a bit longer with this skill and do just fine with a little extra practice.',
  source_citation   = 'CDC; Help Me Grow',
  updated_at        = now()
  WHERE slug = 'motor-jumping-both-feet';

-- motor-jumping-forward
UPDATE milestone_windows SET
  title             = 'Jumps forward',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 104,
  peak_age_weeks    = 117,
  close_age_weeks   = 130,
  why_it_matters    = 'Jumping forward with both feet leaving the ground is a gross motor milestone around age 2.5. It requires explosive leg strength, balance, and coordination of a two foot takeoff and landing. It is a standard item on the 30 month developmental screen.',
  what_to_do        = '* Demonstrate jumping and invite them to try
* Jumping on a soft surface (a mattress, cushions) is easier than jumping on the floor and builds confidence
* Count how far they jumped: "wow, two whole feet!"',
  what_not_to_worry = 'Some children jump with one foot slightly ahead of the other at first. True simultaneous two foot jumping develops with practice.',
  missed_window     = 'If your 30 month old cannot leave the ground with both feet at once in any context, mention it at the 30 month visit. Many children simply need a few more weeks of practice and encouragement.',
  source_citation   = 'CDC Milestones; AAP',
  updated_at        = now()
  WHERE slug = 'motor-jumping-forward';

-- motor-kicking-ball
UPDATE milestone_windows SET
  title             = 'Kicking a ball',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 65,
  peak_age_weeks    = 65,
  close_age_weeks   = 86,
  why_it_matters    = 'Most children begin kicking a stationary ball around 15 to 18 months. It requires the ability to stand on one leg briefly while the other leg swings forward, a balance skill that represents significant bilateral gross motor coordination. It also requires planning and directionality.',
  what_to_do        = '* Place a large, soft ball in front of the child and demonstrate kicking it
* Start with a ball that does not roll far so they can retrieve it easily
* Celebrate any attempt, even if the "kick" is more of a step on or push',
  what_not_to_worry = 'Kicking accurately takes much longer than kicking at all. A kick that goes sideways or barely moves the ball is a successful kick.',
  missed_window     = 'If your 20 month old cannot kick a stationary ball at all, mention it at the next visit as part of gross motor review. Most concerns at this stage are easily addressed with a little targeted practice and time.',
  source_citation   = 'CDC Milestones; AAP',
  updated_at        = now()
  WHERE slug = 'motor-kicking-ball';

-- motor-object-transfer
UPDATE milestone_windows SET
  title             = 'Transfers objects hand to hand',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 21,
  peak_age_weeks    = 26,
  close_age_weeks   = 34,
  why_it_matters    = 'This shows the two sides of the brain are communicating and that the child has intentional control over their grip and release. It is a prerequisite for more complex manual tasks.',
  what_to_do        = '* Offer a toy to one hand, then offer a second toy to the same hand to see if they move the first one over
* Use easy to grip toys like rattles or rings
* Play pass the toy games',
  what_not_to_worry = 'They will drop things constantly. At this age, dropping is often just as intentional as passing.',
  missed_window     = 'If your 8 month old only ever uses one hand or cannot pass an object between them, talk to your pediatrician. Early attention to hand use is often very responsive to simple play activities.',
  source_citation   = 'CDC; Help Me Grow',
  updated_at        = now()
  WHERE slug = 'motor-object-transfer';

-- motor-pincer-grasp
UPDATE milestone_windows SET
  title             = 'Pincer grasp develops',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 34,
  peak_age_weeks    = 39,
  close_age_weeks   = 52,
  why_it_matters    = 'The pincer grasp (using the thumb and index finger to pick up small objects) is a major fine motor milestone. It is required for self feeding small bits of food and is the foundation for later skills like drawing and buttoning clothes.',
  what_to_do        = '* Offer small, safe finger foods like O shaped cereal or cooked peas
* Provide toys with small knobs or buttons
* Practice point and touch games with your fingers',
  what_not_to_worry = 'It starts messy. They will try to use their whole hand at first. The precision takes time to develop.',
  missed_window     = 'If your 12 month old cannot pick up a small piece of food with their fingers, mention it to your pediatrician. Most children develop this skill with a bit more practice, and your pediatrician can suggest helpful activities.',
  source_citation   = 'Denver II; CDC',
  updated_at        = now()
  WHERE slug = 'motor-pincer-grasp';

-- motor-pull-to-stand
UPDATE milestone_windows SET
  title             = 'Pulls to standing',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 30,
  peak_age_weeks    = 39,
  close_age_weeks   = 52,
  why_it_matters    = 'This is the beginning of the transition from floor play to upright life. It requires significant leg and grip strength. Once a baby can pull up, your safety concerns change: they can now reach things on low tables and counters.',
  what_to_do        = '* Ensure heavy furniture is anchored to the wall (tip over risk)
* Provide sturdy surfaces like a heavy coffee table or a sofa for practice
* Lower the crib mattress to the lowest setting immediately',
  what_not_to_worry = 'They will often get stuck standing and cry because they don''t know how to sit back down. You will have to help them lower themselves for a week or two until they learn to drop to their diaper.',
  missed_window     = 'If your child is not attempting to pull up by their first birthday, bring it up with your pediatrician. Many babies are simply on a slightly later timeline, and a check helps confirm things are on track.',
  source_citation   = 'CDC; Help Me Grow',
  updated_at        = now()
  WHERE slug = 'motor-pull-to-stand';

-- motor-reaching-grabbing
UPDATE milestone_windows SET
  title             = 'Reaching for and grabbing objects',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 8,
  peak_age_weeks    = 14,
  close_age_weeks   = 26,
  why_it_matters    = 'This is the transition from reflexive movements to intentional ones. It requires the eyes and hands to work together (hand eye coordination). It is the foundation for self feeding and playing with toys.',
  what_to_do        = '* Hang toys within reach during floor play
* Offer objects of different sizes and textures
* Encourage baby to reach across the midline of their body',
  what_not_to_worry = 'Early attempts will be clumsy. They will miss the object or hit themselves in the face. This is how the brain maps distance and movement.',
  missed_window     = 'If your 6 month old is not reaching for toys at all, mention it at your next pediatrician visit. Getting an early look is worthwhile, and there is usually a lot that can be done with support.',
  source_citation   = 'CDC; Help Me Grow',
  updated_at        = now()
  WHERE slug = 'motor-reaching-grabbing';

-- motor-roll-back-to-tummy
UPDATE milestone_windows SET
  title             = 'Rolls back to tummy',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 12,
  peak_age_weeks    = 17,
  close_age_weeks   = 26,
  why_it_matters    = 'Rolling from the back to the stomach requires more coordination and muscle control than the reverse. Once a baby can do this, they can often get themselves into a tummy time position independently, which accelerates their motor progress.',
  what_to_do        = '* Stop using sleep positioners or restrictive swaddles immediately if you haven''t already
* Encourage play on the side, which is the halfway point for rolling
* Use a play mat with interesting textures to encourage movement',
  what_not_to_worry = 'Once they can roll to their tummy, they might do it in their sleep and then cry because they can''t get back. This is a frustrating but short phase that usually lasts only a week or two.',
  missed_window     = 'If your baby is not rolling in either direction by 6 months, discuss this with your pediatrician. Your pediatrician can offer guidance on what to try at home, and many babies respond well to a little extra encouragement.',
  source_citation   = 'CDC; AAP',
  updated_at        = now()
  WHERE slug = 'motor-roll-back-to-tummy';

-- motor-roll-tummy-to-back
UPDATE milestone_windows SET
  title             = 'Rolls tummy to back',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 8,
  peak_age_weeks    = 14,
  close_age_weeks   = 21,
  why_it_matters    = 'Rolling from the stomach to the back usually happens first, often accidentally as the baby pushes up during tummy time. It is a sign of increasing core and neck strength. It also marks the beginning of independent mobility.',
  what_to_do        = '* Provide plenty of floor time to practice
* Place toys just out of reach to encourage twisting and reaching
* Cheer when it happens: positive reinforcement encourages them to try again',
  what_not_to_worry = 'Some babies do this once and then forget how to do it for two weeks. This is normal. Development is not always a straight line.',
  missed_window     = 'If your baby is not rolling from tummy to back by 5 months, mention it at your next pediatrician visit. It is usually a sign they need more tummy time practice. Most babies catch up with a bit more floor time and encouragement.',
  source_citation   = 'CDC Milestones; WHO',
  updated_at        = now()
  WHERE slug = 'motor-roll-tummy-to-back';

-- motor-running
UPDATE milestone_windows SET
  title             = 'Running, first attempts',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 65,
  peak_age_weeks    = 78,
  close_age_weeks   = 86,
  why_it_matters    = 'Running typically emerges about 6 months after walking. It requires higher level balance and the ability to handle momentum. It is a sign that the gross motor system is maturing.',
  what_to_do        = '* Provide safe, wide open spaces like a park or a carpeted room
* Play games like chase or tag
* Expect lots of falls: choose soft surfaces for practice where possible',
  what_not_to_worry = 'The first run looks more like a fast, stiff legged walk. The smooth, rhythmic running motion won''t appear for another year.',
  missed_window     = 'If your 20 month old is walking well but shows no attempt to move faster or run, mention it at your next visit. Most children who are walking well are very close to running, and a quick check is usually reassuring.',
  source_citation   = 'CDC Milestones; WHO',
  updated_at        = now()
  WHERE slug = 'motor-running';

-- motor-scribbling
UPDATE milestone_windows SET
  title             = 'Scribbling with a crayon',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 65,
  peak_age_weeks    = 78,
  close_age_weeks   = 91,
  why_it_matters    = 'Scribbling is the earliest form of drawing and the precursor to writing. It begins around 15 months with large, whole arm movements and gradually becomes more controlled as the wrist and finger movements develop. The goal at this stage is not recognizable shapes, it is purposeful mark making.',
  what_to_do        = '* Provide large crayons (chunky toddler crayons) and large paper
* Draw alongside them and name what you are doing: "I am making circles"
* Avoid correcting or directing, free mark making at this stage is the goal',
  what_not_to_worry = 'Scribbling looks like scribbling. That is what it is supposed to look like. Representational drawing does not typically emerge until age 3 or 4.',
  missed_window     = 'If your 20 month old shows no interest in making marks on paper with any tool, mention it at the next visit as part of fine motor review. Many children take off quickly once they find a medium they enjoy.',
  source_citation   = 'CDC; Kellogg (1969), Stages of Children''s Drawing',
  updated_at        = now()
  WHERE slug = 'motor-scribbling';

-- motor-sitting-supported
UPDATE milestone_windows SET
  title             = 'Sits with support',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 12,
  peak_age_weeks    = 17,
  close_age_weeks   = 26,
  why_it_matters    = 'Sitting with support (using hands for balance or propped in a corner) is the precursor to independent sitting and solid food eating. It shows the trunk muscles are becoming strong enough to hold the weight of the head and upper body.',
  what_to_do        = '* Practice sitting on your lap or on the floor between your legs
* Use pillows for safety but let the baby do the work of balancing
* Keep sessions short to avoid over tiring the back muscles',
  what_not_to_worry = 'The tripod sit, where baby leans forward on their hands, is a perfectly normal part of this stage. It counts as supported sitting.',
  missed_window     = 'If your baby cannot sit even with significant support by 6 months, bring it up at your next visit. Your care team can offer targeted exercises, and most babies make good progress with guided support.',
  source_citation   = 'Denver II; CDC',
  updated_at        = now()
  WHERE slug = 'motor-sitting-supported';

-- motor-sitting-unsupported
UPDATE milestone_windows SET
  title             = 'Sits without support',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 21,
  peak_age_weeks    = 26,
  close_age_weeks   = 34,
  why_it_matters    = 'Independent sitting is a major milestone. It frees up the hands for play and exploration. It is also a key safety marker for moving to a high chair and starting more complex solid foods.',
  what_to_do        = '* Transition practice to a flat, firm surface without pillows nearby (but stay close)
* Place toys in front of them to keep their attention while they balance
* Once they are steady, practice reaching while sitting to build core stability',
  what_not_to_worry = 'They will still topple over occasionally when they get excited or distracted. This is normal until around 9 months.',
  missed_window     = 'If your baby is not sitting independently by 8 months, mention it at your well child visit. Your pediatrician can help clarify what to work on, and most babies who need extra time do well with support.',
  source_citation   = 'WHO Motor Milestones; CDC',
  updated_at        = now()
  WHERE slug = 'motor-sitting-unsupported';

-- motor-stacking-blocks-3
UPDATE milestone_windows SET
  title             = 'Fine motor, stacks 2 to 3 blocks',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 52,
  peak_age_weeks    = 56,
  close_age_weeks   = 69,
  why_it_matters    = 'Stacking requires a steady hand, depth perception, and the ability to release an object intentionally. Stacking 2 to 3 blocks by 15 months is a standard fine motor checkpoint.',
  what_to_do        = '* Provide 1 inch wooden or plastic blocks
* Sit on the floor and build a tower, then let the child try
* Celebrate the knock down just as much as the build',
  what_not_to_worry = 'They will prefer knocking your towers down for much longer than they will enjoy building their own. This is also a cognitive milestone (cause and effect).',
  missed_window     = 'If your 16 month old cannot stack two blocks, bring it up at the next visit. A little extra practice with stacking toys often makes a big difference quickly.',
  source_citation   = 'CDC; Denver II',
  updated_at        = now()
  WHERE slug = 'motor-stacking-blocks-3';

-- motor-stacking-blocks-6
UPDATE milestone_windows SET
  title             = 'Fine motor, stacks 6 or more blocks',
  urgency           = 'clinical',
  priority          = 2,
  open_age_weeks    = 65,
  peak_age_weeks    = 78,
  close_age_weeks   = 91,
  why_it_matters    = 'Most children develop the precision and patience required to stack 6 blocks somewhere around 18 to 21 months, which shows advanced fine motor control and spatial awareness.',
  what_to_do        = '* Continue providing blocks of different shapes and sizes
* Challenge them: How high can it go?
* Introduce simple puzzles with knobs',
  what_not_to_worry = 'Frustration is common. If the tower falls, they might have a small tantrum. Use this to practice co regulation.',
  missed_window     = 'If your 2 year old cannot stack more than 2 or 3 blocks, mention it at the 24 month visit. With continued practice and encouragement, most children make steady progress.',
  source_citation   = 'CDC; Help Me Grow',
  updated_at        = now()
  WHERE slug = 'motor-stacking-blocks-6';

-- motor-stair-climbing
UPDATE milestone_windows SET
  title             = 'Stair climbing with support',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 56,
  peak_age_weeks    = 65,
  close_age_weeks   = 78,
  why_it_matters    = 'Climbing stairs (with support, one step at a time) typically develops around 13 to 15 months alongside walking consolidation. It requires balance, coordination, and enough leg strength to lift body weight onto a higher step. Going up stairs comes before going down stairs, descending requires more motor control and spatial awareness.',
  what_to_do        = '* Let them try stairs with your hand or a railing for support
* Go up together, step by step, narrating: "up, up, up"
* Do not carry them past stairs if they want to try, the practice is valuable
* Keep safety gates in place for unsupervised access until they are reliably safe',
  what_not_to_worry = 'Most children use both hands and both feet (crawling up stairs) before they walk up one step at a time. This is the normal progression.',
  missed_window     = 'If your 18 month old cannot ascend even one step with support, raise it at the 18 month visit alongside other gross motor observations. Early input from a physical therapist can make a meaningful difference.',
  source_citation   = 'CDC Milestones; AAP',
  updated_at        = now()
  WHERE slug = 'motor-stair-climbing';

-- motor-stairs-descending
UPDATE milestone_windows SET
  title             = 'Walking downstairs with support',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 66,
  peak_age_weeks    = 70,
  close_age_weeks   = 78,
  why_it_matters    = 'Most children begin going up stairs with support around 12 to 13 months. Going down is harder and comes later, with most children managing descent around 15 to 18 months. Descending requires the child to shift weight forward onto a lower step while maintaining balance, a significantly more difficult coordination task. Until this is established, stairs remain a fall risk in both directions.',
  what_to_do        = '* Teach feet-first descent: turn the child around to face the stairs and let them step down backward
* Demonstrate and repeat the technique; backward descent is safer and comes first
* Keep stair gates in place during this learning window. supervised practice is not the same as unsupervised access
* Forward-facing descent with support comes around 18 to 24 months',
  what_not_to_worry = 'Many children prefer to bump down on their bottoms for months before walking down. Bottom-scooting is a legitimate strategy, not a motor delay.',
  missed_window     = 'If your 18 month-old cannot navigate stairs in any way (up or down) with or without support, mention it at the next well child visit.',
  source_citation   = 'CDC Motor Milestones; AAP Safety Guidelines',
  updated_at        = now()
  WHERE slug = 'motor-stairs-descending';

-- motor-throw-overarm
UPDATE milestone_windows SET
  title             = 'Overarm throwing develops',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 92,
  peak_age_weeks    = 96,
  close_age_weeks   = 108,
  why_it_matters    = 'Early ball play (months 6 to 12) involves rolling and dropping. Most children develop the shoulder rotation and weight shift needed for a true overarm throw around 21 to 25 months. This is a significant bilateral coordination milestone: the throwing arm swings forward while the opposite leg steps forward. It also requires the child to release the object at the right moment, which requires timing and planning.',
  what_to_do        = '* Demonstrate an overarm throw with a soft ball and invite them to copy
* Use soft, light balls, foam, cloth, or a small rubber ball, in a space where the throw can go far
* Throwing at a target (a bucket, a couch cushion on the floor) adds motivation and direction
* Celebrate range and enthusiasm over accuracy. Accuracy comes much later',
  what_not_to_worry = 'Most toddlers throw with both feet planted for many months before developing the step-through technique. An in place overarm throw is a fully legitimate first throw.',
  missed_window     = 'No clinical concern if throwing is still underarm or pushing at 25 months. Motor variation is wide. Note only if gross motor development is delayed broadly. Plenty of ball play and physical activity at any age supports motor development.',
  source_citation   = 'Gallahue & Ozmun (2006) Understanding Motor Development; CDC Motor Milestones',
  updated_at        = now()
  WHERE slug = 'motor-throw-overarm';

-- motor-tricycle-balance-bike
UPDATE milestone_windows SET
  title             = 'Tricycle or balance bike, first wheeled independence',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 113,
  peak_age_weeks    = 121,
  close_age_weeks   = 156,
  why_it_matters    = 'Most children can propel and steer a balance bike or walk a tricycle around 26 to 29 months. True pedaling — coordinating the reciprocal leg motion to actually drive a tricycle forward — is a milestone that typically arrives closer to 36 months. This is a major gross motor milestone and one of the most motivating forms of independent movement available to toddlers. Beyond the physical benefits, wheeled transport gives children a sense of spatial independence. They can move themselves somewhere they choose to go.',
  what_to_do        = '* For balance bikes: no pedals, child propels by walking then lifts feet to glide. Start there if introducing from scratch.
* For tricycles: position the seat so legs have a slight bend at the bottom of the pedal stroke
* Start on a flat, smooth surface. Grass is too hard, slopes are dangerous
* Helmet from day one, always. It builds the habit before speed makes it necessary.',
  what_not_to_worry = 'Pedaling coordination takes weeks or months to develop. A child who straddles a tricycle and walks it along without pedaling is a normal starting point.',
  missed_window     = 'Tricycle pedaling that has not emerged by 30 months is worth noting as part of a broader gross motor review, not as a standalone concern. Continuing to offer outdoor play and wheeled toys at your child''s own pace supports motor development whenever the skill arrives.',
  source_citation   = 'AAP Physical Activity Guidelines; Gallahue & Ozmun Motor Development; CDC 3-Year Motor Milestones',
  updated_at        = now()
  WHERE slug = 'motor-tricycle-balance-bike';

-- motor-tummy-time-build
UPDATE milestone_windows SET
  title             = 'Tummy time, build to 15–30 minutes per day',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 4,
  close_age_weeks   = 7,
  why_it_matters    = 'The AAP recommends working up to 15–30 minutes of tummy time per day by 7 weeks of age — not all at once, but spread across the day. Most babies who build tummy time consistently go on to roll somewhere between 3 and 5 months. Consistent tummy time supports motor development on track and helps prevent positional flat head.',
  what_to_do        = '* Build gradually: add 1–2 minutes per week starting from wherever you are
* Break it into sessions: 4–5 sessions of 4–5 minutes each is as good as one long session
* Toys, mirrors, and siblings make it more tolerable, try a rolled towel under the chest for support',
  what_not_to_worry = 'Not all 15–30 minutes need to happen on the floor. Tummy time on a parent''s chest, lap, or forearm counts toward the daily total.',
  missed_window     = 'If you''re past 7 weeks without consistent tummy time, start immediately with short bursts and build up over the next few days. Every session still contributes to rolling and motor development.',
  source_citation   = 'AAP Safe to Sleep Campaign; WHO Motor Development Milestones; AAP Safe Sleep and Tummy Time Guidelines (HealthyChildren.org)',
  updated_at        = now()
  WHERE slug = 'motor-tummy-time-build';

-- motor-tummy-time-start
UPDATE milestone_windows SET
  title             = 'Tummy time, start from birth',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 12,
  why_it_matters    = 'Tummy time builds the neck, shoulder, and back muscles your baby needs for every physical milestone that follows, rolling, sitting, crawling, standing. It also helps prevent positional flat head (plagiocephaly), which is most responsive to prevention and correction in the first months. With First Son, I started tummy time late because he hated it and I caved. He developed mild flat head that needed extra attention for months. With Second Son I started at day three and was consistent from the beginning. The difference was significant.',
  what_to_do        = '* Start the first week home from the hospital: 3–5 minutes, 2–3 times per day
* Use your chest, lay baby face down on your chest when you''re reclined. It counts
* Right after a diaper change is a natural moment to try',
  what_not_to_worry = 'Babies hate tummy time. This is normal. Discomfort does not mean harm. The goal is tolerance, not enjoyment.',
  missed_window     = 'If tummy time hasn''t been happening consistently, start now. It''s not too late before 3 months. Go slowly, build up in 30 second increments, and use the chest position if the floor is resisted.',
  source_citation   = 'AAP Safe to Sleep Campaign; AAP Policy on Tummy Time (2021); AAP Safe Sleep and Tummy Time Guidelines (2022)',
  updated_at        = now()
  WHERE slug = 'motor-tummy-time-start';

-- motor-walking-independent
UPDATE milestone_windows SET
  title             = 'Walking independently',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 47,
  peak_age_weeks    = 56,
  close_age_weeks   = 78,
  why_it_matters    = 'Independent walking, not just a few steps, but a primary mode of locomotion, typically establishes between 12 and 15 months. By 15 months, most children are walking well. The AAP checks on walking progress at the 15 month well child visit, but the hard clinical red flag for independent walking delay is 18 months. A child who is cruising (walking while holding furniture) at 15 months is developing normally. Early identification of gross motor delays allows for early intervention, which produces significantly better outcomes.',
  what_to_do        = '* Barefoot or soft sole shoes on hard floors is better for developing balance than stiff shoes
* Limit time in bouncers, walkers, and jumpers, they bypass the muscle groups needed for walking
* If walking hasn''t started by 13 months: mention it at your next visit, don''t wait for the scheduled appointment if you''re concerned',
  what_not_to_worry = 'Walking style varies enormously in the first months. Tip toe walking, wide stance, and wobbling are normal up to 18 months. The question is not how they walk, it''s whether they''re walking.',
  missed_window     = 'Not walking by 18 months: raise this with your pediatrician. They may recommend physical therapy referral or simply observation. Most children who receive early support do catch up well.',
  source_citation   = 'CDC Developmental Milestones (2022); AAP 15 Month Well Child Visit Guidelines; WHO Motor Milestone Windows; AAP Bright Futures Periodicity Schedule; CDC 2022 Milestone Updates',
  updated_at        = now()
  WHERE slug = 'motor-walking-independent';

-- nutrition-2pct-milk-switch
UPDATE milestone_windows SET
  title             = 'Switch from whole to 2% milk at age 2',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 104,
  peak_age_weeks    = 104,
  close_age_weeks   = 117,
  why_it_matters    = 'Whole milk is recommended from 12 to 24 months because the fat content supports brain development. After age 2, the AAP recommends switching to 2% reduced fat milk (or continuing whole milk if the child is at risk of being underweight). The switch is a single decision and requires no transition period.',
  what_to_do        = '* At the 24 month visit, confirm with your pediatrician that your child''s growth is on track for the switch
* Simply buy 2% from the next purchase, most children do not notice the difference
* If the child is lean or has slow weight gain, your pediatrician may recommend continuing whole milk',
  what_not_to_worry = '2% milk is still a whole food with significant protein, fat, and calcium. It is not skim milk. The nutritional difference is modest.',
  missed_window     = 'If your 3 year old is still on whole milk and growing well, switching to 2% at any point is appropriate.',
  source_citation   = 'AAP Nutrition Guidelines; USDA Dietary Guidelines (2020)',
  updated_at        = now()
  WHERE slug = 'nutrition-2pct-milk-switch';

-- nutrition-3-meals-rhythm
UPDATE milestone_windows SET
  title             = 'Move to 3 meals and 2 snacks daily',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 34,
  peak_age_weeks    = 43,
  close_age_weeks   = 52,
  why_it_matters    = 'For most babies, solids become a significant part of the daily calorie count somewhere around 10 months. Establishing a 3 meal rhythm prepares the baby for the transition away from formula or heavy breastfeeding at 12 months. It sets a predictable metabolic schedule.',
  what_to_do        = '* Align baby meal times with the family schedule where possible
* Offer a variety of food groups at each meal: protein, fat, and fiber
* Start offering small healthy snacks between meals if baby seems hungry',
  what_not_to_worry = 'Some days they will eat everything, and some days they will eat nothing. Trust their internal hunger cues.',
  missed_window     = 'If your 12 month old is still mostly on milk with one main meal a day, building toward 3 meals is a great next step. Starting with simple additions to mealtimes is all it takes, and most toddlers respond well to a regular eating rhythm.',
  source_citation   = 'USDA Dietary Guidelines for Infants; AAP',
  updated_at        = now()
  WHERE slug = 'nutrition-3-meals-rhythm';

-- nutrition-bottle-intro-breastfed
UPDATE milestone_windows SET
  title             = 'Introduce a bottle, breastfed babies only',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 3,
  peak_age_weeks    = 6,
  close_age_weeks   = 16,
  why_it_matters    = 'The AAP recommends starting the introduction around 3 to 4 weeks, early enough to give you the best chance. Before 3 weeks, a bottle can interfere with establishing breastfeeding. After week 16 or so, many babies have developed a strong preference and find it harder to switch. Introducing earlier in this stage gives you the most flexibility: shared feeding, nighttime options, and more independence as breastfeeding continues.',
  what_to_do        = '* Introduce one bottle of expressed breast milk per day, starting around week 3 to 4
* Always use a slow-flow (Level 1) nipple regardless of the baby''s age. Faster flow causes flow preference and can lead to breast refusal
* Use paced bottle feeding: hold the bottle horizontally, let the baby control the flow, and take breaks every few sucks. This mimics the breast''s rhythm and prevents the baby from developing a preference for the faster, easier bottle flow
* Have someone other than the breastfeeding parent offer it, baby associates the smell of the nursing parent with the breast
* Don''t panic if the first attempt fails; try again the next day',
  what_not_to_worry = 'One or two rejected attempts early on are completely normal. Persistence in the first few weeks almost always works.',
  missed_window     = 'Still worth trying. Use a slow-flow (Level 1) nipple, try different bottle shapes, and have your partner offer the bottle while you leave the room entirely. Some babies will accept a bottle at 5 to 6 months if you''re persistent. Try for 2 to 3 weeks. Many families navigate breastfeeding without a bottle just fine.',
  source_citation   = 'AAP Policy on Breastfeeding and the Use of Human Milk (2022); Academy of Breastfeeding Medicine; AAP Bright Futures: Guidelines for Health Supervision of Infants, Children, and Adolescents (4th Edition); Academy of Breastfeeding Medicine (ABM) Clinical Protocol #3: Supplementary Feedings in the Healthy Term Breastfed Neonate',
  updated_at        = now()
  WHERE slug = 'nutrition-bottle-intro-breastfed';

-- nutrition-bottle-weaning
UPDATE milestone_windows SET
  title             = 'Wean off the bottle, transition fully to cup',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 47,
  peak_age_weeks    = 52,
  close_age_weeks   = 65,
  why_it_matters    = 'The AAP recommends beginning the bottle transition at 12 months, with the goal of being completely off the bottle by 15 to 18 months. Prolonged bottle use is a leading cause of tooth decay and can interfere with the development of the jaw and speech muscles. It also leads to excessive milk intake, which displaces essential solid foods.',
  what_to_do        = '* Drop the midday bottles first, replacing them with a cup of milk or water during meals
* Drop the morning bottle next
* The before bed bottle is usually the hardest and should be the last to go',
  what_not_to_worry = 'A few days of protest are normal. Comfort the child with a book or a snuggle instead of the bottle to build a new routine.',
  missed_window     = 'If your 18 month old is still on a bottle, it is a good time to make the transition. Replace bottles with straw or open cups and introduce a comforting new bedtime routine in their place. Most children adjust within a few days, especially with a little extra snuggle time.',
  source_citation   = 'AAPD; AAP Section on Oral Health',
  updated_at        = now()
  WHERE slug = 'nutrition-bottle-weaning';

-- nutrition-breastfeeding-establishment
UPDATE milestone_windows SET
  title             = 'Breastfeeding establishment, the first 8 weeks',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 0,
  peak_age_weeks    = 1,
  close_age_weeks   = 8,
  why_it_matters    = 'The first 8 weeks are the critical window for supply and demand. Your body is calibrating how much milk to make based on how often the baby removes it. Frequent, effective removal in these weeks sets the stage for the rest of your breastfeeding journey. This is often the hardest period.',
  what_to_do        = '* Nurse on demand, usually 8 to 12 times per 24 hour period
* Ensure a deep latch to prevent nipple pain and ensure milk transfer
* Avoid long stretches without nursing or pumping in the first month',
  what_not_to_worry = 'Cluster feeding, where baby wants to eat every hour, is normal and does not mean your supply is low. It is the baby''s way of telling your body to make more milk.',
  missed_window     = 'If you are struggling at week 4 or 6, it is not too late. Contact a lactation consultant as soon as you can. Many supply issues can be corrected with proper support, and families who reach out early often find the situation improves significantly.',
  source_citation   = 'Academy of Breastfeeding Medicine; AAP Policy',
  updated_at        = now()
  WHERE slug = 'nutrition-breastfeeding-establishment';

-- nutrition-cows-milk-switch
UPDATE milestone_windows SET
  title             = 'Switch to whole cow milk at 12 months',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 52,
  peak_age_weeks    = 52,
  close_age_weeks   = 54,
  why_it_matters    = 'At one year, most babies can digest the proteins in cow milk and no longer need formula or exclusive breast milk. Whole milk provides the specific fats needed for brain development through age two. Do not switch earlier, as infant kidneys cannot handle the protein load of cow milk before 12 months.',
  what_to_do        = '* Transition gradually: mix 1/4 milk with 3/4 formula for a few days, then 1/2 and 1/2
* Use full fat (whole) milk, not 2% or skim — unless your pediatrician recommends otherwise based on your child''s weight or a family history of obesity, high cholesterol, or early cardiovascular disease
* If there is a family history of dairy allergy, consult your pediatrician before the switch',
  what_not_to_worry = 'If you are still breastfeeding, you do not need to add cow milk. Breast milk continues to provide excellent nutrition. Cow milk is simply a substitute for formula at this stage.',
  missed_window     = 'If your 13 month old is still on formula, whole milk is a nutritious and cost effective next step. Switch this week unless your doctor has given specific medical instructions otherwise. Avoid toddler formulas (also marketed as "transition formulas") — the AAP advises they are unnecessary, often contain added sugars, and lack the strict FDA regulation of infant formulas. Whole cow''s milk is the right next step.',
  source_citation   = 'AAP; USDA; AAP Clinical Report on Lipid Screening and Cardiovascular Health in Childhood; AAP Clinical Report: Older Infant-Young Child "Formulas" (2023)',
  updated_at        = now()
  WHERE slug = 'nutrition-cows-milk-switch';

-- nutrition-dairy-intro
UPDATE milestone_windows SET
  title             = 'Introduce dairy (yogurt and cheese), early allergen',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 17,
  peak_age_weeks    = 26,
  close_age_weeks   = 39,
  why_it_matters    = 'While babies should not drink cow milk as a beverage until 12 months, they can and should have dairy products like yogurt and cheese starting around 6 months. This early exposure helps prevent milk protein allergies.',
  what_to_do        = '* Offer plain, full fat Greek yogurt (no added sugar)
* Provide small pieces of pasteurized, mild cheese — always check the label to confirm it is pasteurized, as raw milk and unpasteurized cheeses carry a severe infection risk for infants
* Monitor for skin rashes or excessive spitting up',
  what_not_to_worry = 'The digestive system can handle the proteins in yogurt and cheese much better than the proteins in a glass of milk. These are safe first foods.',
  missed_window     = 'If you are past 9 months, start with plain yogurt today. Full fat dairy is important for brain development in the second half of the first year, and most babies take to yogurt and cheese quickly.',
  source_citation   = 'AAP Infant Food and Feeding; USDA; CDC Food Safety; AAP Infant Food and Feeding Guidelines',
  updated_at        = now()
  WHERE slug = 'nutrition-dairy-intro';

-- nutrition-dental-diet
UPDATE milestone_windows SET
  title             = 'Limit sugar, dental health starts with diet',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 26,
  peak_age_weeks    = 52,
  close_age_weeks   = 156,
  why_it_matters    = 'Dental caries (cavities) is the most common chronic disease in children. Sugar, combined with oral bacteria, produces acid that destroys enamel. Baby teeth matter. Early cavity patterns predict adult cavity risk and affect speech development, nutrition, and comfort. Diet is the most controllable variable.',
  what_to_do        = '* Avoid added sugars under 2 years entirely (AAP recommendation)
* After 2, limit added sugar to less than 25g (6 tsp) per day
* Never put a baby to bed with a bottle of juice or milk, the sugar pools around teeth throughout the night
* Brush teeth twice daily as soon as the first tooth appears',
  what_not_to_worry = 'Naturally occurring sugars in whole fruit are different from added sugars. Whole fruit with fiber slows glucose absorption and is not the dietary concern here.',
  missed_window     = 'The first dental visit should happen when the first tooth appears or by age 1, whichever comes first. If you have not been yet, schedule it now.',
  source_citation   = 'AAP Oral Health Policy; AAPD Caries Prevention Guidelines; WHO Sugar Guidelines',
  updated_at        = now()
  WHERE slug = 'nutrition-dental-diet';

-- nutrition-egg-intro
UPDATE milestone_windows SET
  title             = 'Introduce eggs, early allergen',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 17,
  peak_age_weeks    = 26,
  close_age_weeks   = 39,
  why_it_matters    = 'Egg is the second most common food allergy in children after peanut. The same early introduction research that changed peanut guidelines also applies to eggs: introducing eggs during the solid food window (4–9 months) significantly reduces the likelihood of egg allergy developing. The immune system is most flexible during this period.',
  what_to_do        = '* Introduce well cooked egg (scrambled or hard boiled) first, raw or undercooked egg carries salmonella risk
* Mix a small amount into puree on day one; give alone on day two and three
* Watch for 20 minutes after first introduction; a mild rash around the mouth can occur as a contact reaction, but monitor it closely — if it spreads, worsens, or is accompanied by any other symptoms, contact your pediatrician before continuing.
* If no reaction after 3 days, eggs can become a regular part of the diet',
  what_not_to_worry = 'Egg yolk and egg white have different allergen profiles. Most guidance now recommends introducing both together. If your child tolerates one and not the other, that''s worth noting but not cause for alarm before talking to your pediatrician.',
  missed_window     = 'Eggs can still be introduced after 9 months. The early introduction benefit applies most strongly earlier in this stage, but food allergies to eggs can still be avoided. Introduce normally and watch for reactions. Many families who introduce eggs after this stage have no issues.',
  source_citation   = 'AAP Infant Food and Feeding Guidelines (2022); LEAP On Study; Australasian Society of Clinical Immunology and Allergy (ASCIA); AAP Clinical Report on Management of Food Allergy (2019)',
  updated_at        = now()
  WHERE slug = 'nutrition-egg-intro';

-- nutrition-family-foods
UPDATE milestone_windows SET
  title             = 'Integrate family foods, eat what everyone eats',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 47,
  peak_age_weeks    = 52,
  close_age_weeks   = 65,
  why_it_matters    = 'Most babies are ready to move away from jarred baby food by around 12 months. Eating the same healthy foods as the rest of the family encourages social development and prevents the short order cook syndrome where parents make separate meals for toddlers.',
  what_to_do        = '* Modify the family meal: cut it into safe pieces and skip the added salt or sugar
* Include the child at the dinner table with everyone else
* Exposure to the scents and sights of family meals builds a broader palate',
  what_not_to_worry = 'Toddlers are naturally skeptical of new foods. It can take 10 to 15 exposures before they actually try something. Keep putting it on the plate without pressure.',
  missed_window     = 'If you are still buying jarred baby food at 14 months, it is an easy switch. Try offering small portions of your own healthy dinner tonight. Toddlers often surprise you when they eat what everyone else is eating.',
  source_citation   = 'AAP Healthy Active Living; USDA',
  updated_at        = now()
  WHERE slug = 'nutrition-family-foods';

-- nutrition-first-purees
UPDATE milestone_windows SET
  title             = 'First solids, single ingredient purees',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 17,
  peak_age_weeks    = 26,
  close_age_weeks   = 30,
  why_it_matters    = 'The goal of first solids is exposure and safety. Single ingredient purees allow you to identify any allergic reactions or sensitivities easily. At this stage, breast milk or formula is still the primary nutrition. Food is for practice.',
  what_to_do        = '* Start with smooth purees of vegetables or fruits like sweet potato, avocado, or peas
* When introducing highly allergenic foods (egg, peanut, dairy, tree nuts), introduce one at a time and wait 3 to 4 days to watch for reactions. For low-risk foods (vegetables, fruits, grains), you don''t need to space them out — variety is the goal.
* Watch for rashes, vomiting, or diarrhea after each new food',
  what_not_to_worry = 'Most of the first few meals will end up on the floor or the bib. This is expected. A few teaspoons is a successful meal at this age.',
  missed_window     = 'If you are past 6 months and haven''t tried purees, start today. Variety is important for developing a palate and preventing picky eating later. There''s plenty of time to explore a wide range of flavors.',
  source_citation   = 'CDC Infant and Toddler Nutrition; AAP',
  updated_at        = now()
  WHERE slug = 'nutrition-first-purees';

-- nutrition-fish-intro
UPDATE milestone_windows SET
  title             = 'Introduce fish, early allergen',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 17,
  peak_age_weeks    = 26,
  close_age_weeks   = 39,
  why_it_matters    = 'Fish is a common allergen, but early introduction (before 9 months) is now recommended to reduce the risk of developing a lifelong allergy. Fish also provides DHA, which is essential for brain and eye development.',
  what_to_do        = '* Offer well cooked, pureed or flaked white fish like cod or salmon
* Ensure there are absolutely no bones
* Give it alone for 3 days to monitor for reactions before mixing with other foods',
  what_not_to_worry = 'Avoid high mercury fish like swordfish or king mackerel. Stick to salmon, trout, and cod which are safe for infants.',
  missed_window     = 'If you haven''t introduced fish yet, add it to the menu soon. Introduction is still beneficial at any point in the first year, and most babies enjoy fish when it''s well prepared and offered early.',
  source_citation   = 'AAP Healthy Active Living for Families; NIAID Guidelines',
  updated_at        = now()
  WHERE slug = 'nutrition-fish-intro';

-- nutrition-fork-intro
UPDATE milestone_windows SET
  title             = 'Fork introduction',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 65,
  peak_age_weeks    = 78,
  close_age_weeks   = 104,
  why_it_matters    = 'Most children begin using a fork between 15 and 24 months. The stabbing motion of a fork is easier to master than the scooping of a spoon, which often means forks become the preferred utensil quickly once introduced. Toddler forks are blunt and safe for independent use.',
  what_to_do        = '* Introduce a toddler fork alongside the spoon at mealtimes
* Foods that hold to a fork easily (soft pasta, cooked vegetables, cheese cubes) work well at first
* Let them stab independently, even if they hold the fork awkwardly',
  what_not_to_worry = 'Using a fork with the whole fist grip is normal through age 3. A mature pencil like grip develops much later.',
  missed_window     = 'If your 2 year old has no interest in utensils at all, it is worth noting at the 24 month visit. Many children engage readily once they see others using utensils regularly.',
  source_citation   = 'AAP; CDC',
  updated_at        = now()
  WHERE slug = 'nutrition-fork-intro';

-- nutrition-healthy-snack-patterns
UPDATE milestone_windows SET
  title             = 'Build healthy snack patterns before age 2',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 52,
  peak_age_weeks    = 65,
  close_age_weeks   = 104,
  why_it_matters    = 'Eating patterns established in the first two years predict eating habits in later childhood. Research consistently shows that repeated exposure to a diverse range of foods in the toddler years (even if rejected at first) produces broader dietary acceptance by school age. Toddlers offered a wide variety of foods early tend to develop more adventurous eating over time.',
  what_to_do        = '* Offer 2 to 3 planned snacks per day at predictable times, unplanned grazing disrupts hunger cues
* Include a protein and a fruit or vegetable at each snack
* Continue offering foods that have been rejected, it can take 10 to 15 exposures before a food is accepted',
  what_not_to_worry = 'Toddler food refusal is normal. The goal is continued exposure, not compliance. A refused food on the plate is still doing its job.',
  missed_window     = 'If your 2 year old eats fewer than 10 different foods regularly, consider speaking to your pediatrician or a pediatric dietitian about expanding variety.',
  source_citation   = 'Birch and Fisher (1998), Food Acceptance Patterns; AAP; USDA MyPlate',
  updated_at        = now()
  WHERE slug = 'nutrition-healthy-snack-patterns';

-- nutrition-honey-avoidance
UPDATE milestone_windows SET
  title             = 'No honey under 12 months',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 52,
  why_it_matters    = 'Honey can contain spores of Clostridium botulinum, which can cause infant botulism. A baby''s digestive system is not developed enough to stop these spores from growing and producing toxins. This is rare but can be fatal.',
  what_to_do        = '* Absolutely no honey in any form: raw, baked into crackers, or in tea
* Check labels of processed snacks for honey content
* Once the child turns one, their digestive system is mature enough to handle it safely',
  what_not_to_worry = 'If a family member accidentally gives a tiny taste, monitor for signs like constipation, weak crying, or muscle weakness and call your doctor. Most exposures do not lead to illness, but the risk is not worth taking.',
  missed_window     = 'This is a safety rule that stays in effect until the first birthday. After 12 months, the botulism risk is gone — but the AAP recommends limiting honey and other added sugars until age 2. Introduce it occasionally after the first birthday rather than freely.',
  source_citation   = 'CDC; AAP; WHO',
  updated_at        = now()
  WHERE slug = 'nutrition-honey-avoidance';

-- nutrition-iron-fortified-foods
UPDATE milestone_windows SET
  title             = 'Introduce iron-fortified foods with first solids',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 17,
  peak_age_weeks    = 26,
  close_age_weeks   = 34,
  why_it_matters    = 'Around 6 months, a baby''s natural iron stores are almost gone. Because brain development is rapid, iron is a non negotiable nutrient. Iron-fortified cereals or pureed meats are the most efficient way to fill the gap.',
  what_to_do        = '* Choose iron-fortified infant cereals like oat or barley
* Pureed meats (beef, chicken, turkey) are excellent natural sources of iron and zinc
* Mix cereal with breast milk or formula to increase acceptance',
  what_not_to_worry = 'Rice cereal was the old standard, but it is no longer recommended as a primary food due to arsenic concerns. Stick to oat or multigrain options.',
  missed_window     = 'If your baby is 8 months and only eating fruits and vegetables, they may be low on iron. Prioritize meat or iron-fortified cereal starting with the next meal. It''s a straightforward addition that most babies accept well.',
  source_citation   = 'AAP Clinical Report on Iron Deficiency; USDA Dietary Guidelines',
  updated_at        = now()
  WHERE slug = 'nutrition-iron-fortified-foods';

-- nutrition-iron-rich-ongoing
UPDATE milestone_windows SET
  title             = 'Keep iron rich foods in regular rotation',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 26,
  peak_age_weeks    = 52,
  close_age_weeks   = 156,
  why_it_matters    = 'Iron deficiency is the most common nutritional deficiency in young children globally. After the iron stores from birth are depleted (around 6 months), dietary iron becomes critical. Toddlers who drink more than 24 oz of cow''s milk per day are at elevated risk for iron deficiency because milk displaces iron rich foods and reduces iron absorption.',
  what_to_do        = '* Include iron rich foods daily: red meat, beans, lentils, fortified cereals, tofu, dark leafy greens
* Pair non heme iron sources (plant based) with vitamin C to increase absorption: beans with tomato, spinach with lemon
* Limit cow''s milk to 16 to 24 oz per day',
  what_not_to_worry = 'Occasional meals without iron rich foods are fine. The concern is a pattern of dairy heavy, iron light eating across days and weeks.',
  missed_window     = 'At the 12 and 24 month visits, your pediatrician should check hemoglobin. If iron deficiency is found, dietary change is the first line intervention.',
  source_citation   = 'AAP Iron Supplementation Policy; WHO Iron Deficiency Anemia Guidelines',
  updated_at        = now()
  WHERE slug = 'nutrition-iron-rich-ongoing';

-- nutrition-iron-supplement-breastfed
UPDATE milestone_windows SET
  title             = 'Iron supplementation, breastfed babies at 4 months',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 17,
  peak_age_weeks    = 17,
  close_age_weeks   = 26,
  why_it_matters    = 'If you''re breastfeeding, this applies to you. Breast milk is nearly perfect nutrition, but it''s low in iron. Most babies are born with iron stores that last about 4 to 6 months. After that, those stores run out, and breast milk doesn''t replenish them fast enough. Iron deficiency in the first year affects brain development, cognitive function, and behavior, and it''s one of the most preventable nutritional problems in infancy. If your baby is on formula, you''re covered: standard iron-fortified formula already meets iron needs for the first 12 months.',
  what_to_do        = '* At the 4 month well child visit, ask your pediatrician about starting liquid iron drops (1 mg/kg/day is the AAP recommendation for exclusively or predominantly breastfed infants)
* Continue until your baby is regularly eating iron-rich foods: iron-fortified cereals, pureed meats, tofu, or beans. For most babies this aligns with 6 to 7 months, but the transition should be based on actual intake, not age alone
* If your baby was born prematurely or with a low birth weight, their iron protocol is different. Your pediatrician likely started supplementation earlier at a higher dose (2 to 4 mg/kg/day from 1 month). Follow their specific schedule; the guidance above does not apply to you',
  what_not_to_worry = 'Liquid iron drops stain, but they''re not harmful. The dark stools you may see are normal and not a sign of a problem. Iron drops can also cause constipation in some babies — if your baby seems uncomfortable or stops having regular bowel movements, contact your pediatrician for strategies to manage it. Don''t stop the supplement without talking to them first.',
  missed_window     = 'Bring it up at the next pediatrician visit. A simple blood test can check iron levels. If iron is low, supplementation and dietary intervention can correct it. Most families who catch this late do just fine.',
  source_citation   = 'AAP Clinical Report, Iron Deficiency and Iron Deficiency Anemia in Young Children (2020); AAP Clinical Report on Iron Deficiency (2010/Reaffirmed 2017); CDC Iron Recommendations; Academy of Breastfeeding Medicine (ABM) Clinical Protocol #29: Iron, Zinc, and Vitamin D Supplementation During Breastfeeding',
  updated_at        = now()
  WHERE slug = 'nutrition-iron-supplement-breastfed';

-- nutrition-juice-limit
UPDATE milestone_windows SET
  title             = 'Limit juice, none under 12 months, max 4 oz after',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 52,
  peak_age_weeks    = 60,
  close_age_weeks   = 104,
  why_it_matters    = 'The AAP recommends no fruit juice under 12 months and a maximum of 4 oz per day for children 12 to 36 months. Juice is high in sugar, low in fiber, and displaces more nutritious foods and drinks. Children who drink juice regularly are at higher risk for dental caries and excessive caloric intake.',
  what_to_do        = '* Under 12 months: no juice at all. Water and breast milk or formula only.
* Ages 1 to 3: if offered, limit to 4 oz per day in a cup (not a sippy that they carry all day)
* Whole fruit is always a better option than fruit juice',
  what_not_to_worry = 'An occasional small amount of juice is not going to cause harm. The concern is habitual juice intake replacing more nutritious options.',
  missed_window     = 'If your toddler has been drinking significant amounts of juice daily, reducing gradually over a few weeks is more effective than stopping abruptly.',
  source_citation   = 'AAP Fruit Juice Policy (2017); Pediatrics',
  updated_at        = now()
  WHERE slug = 'nutrition-juice-limit';

-- nutrition-milk-cap
UPDATE milestone_windows SET
  title             = 'Cap milk at 16 to 24 ounces per day after 12 months',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 52,
  peak_age_weeks    = 52,
  close_age_weeks   = 65,
  why_it_matters    = 'After age one, too much milk is a problem. It fills the stomach so the child doesn''t eat enough solid food, which leads to iron deficiency anemia. Milk is also low in fiber, so milk babies often struggle with severe constipation.',
  what_to_do        = '* Limit cow''s milk to no more than 24 ounces in a 24 hour period — excess cow''s milk inhibits iron absorption and is a leading cause of iron deficiency in toddlers. This cap does not apply to breast milk.
* Water should be the primary drink for thirst between meals
* If your child demands more milk, offer a small snack or water instead',
  what_not_to_worry = 'The transition might feel like the child isn''t getting enough at first. As long as they are eating a variety of solid foods, they are fine.',
  missed_window     = 'If your toddler is drinking 30 or more ounces of milk a day, cut back by 4 ounces every two days until you are under the 24 ounce limit. Many families find their toddler adjusts quickly once solid foods start filling in the gaps.',
  source_citation   = 'AAP; USDA; AAP Clinical Report on Iron Deficiency and Iron-Deficiency Anemia',
  updated_at        = now()
  WHERE slug = 'nutrition-milk-cap';

-- nutrition-peanut-intro
UPDATE milestone_windows SET
  title             = '⚠️ Peanut introduction window',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 17,
  peak_age_weeks    = 20,
  close_age_weeks   = 47,
  why_it_matters    = 'The LEAP study, published in the New England Journal of Medicine in 2015, showed that introducing peanuts somewhere between 4 and 11 months reduces the risk of peanut allergy by up to 80%. This is one of the most significant preventive health findings in pediatric research in a generation. The old advice was to avoid peanuts. The new advice is the opposite: introduce them early, and introduce them often. Most families complete this introduction well before 11 months.',
  what_to_do        = '* If your child has no eczema and no known food allergies: introduce at home, no doctor visit required
* If your child has mild to moderate eczema: introduce at home around 6 months. Only severe eczema or an existing egg allergy requires a pediatrician consult and potential testing first.
* Method: start with a small tip-of-the-spoon taste of smooth peanut butter thinned with water or puree, wait 10 minutes, and if no reaction, continue until the full serving of 2 teaspoons is consumed. Watch for reactions throughout (hives, swelling, vomiting, difficulty breathing). The 2 teaspoon dose is the clinical threshold for allergy prevention.
* If no reaction: offer peanut products 3 times per week going forward to maintain tolerance',
  what_not_to_worry = 'You don''t need an allergist appointment unless your child has severe eczema or a known egg allergy. Most children can be introduced at home with no special preparation.',
  missed_window     = 'Peanut introduction is still worthwhile at any age. The risk of allergy is higher than if you''d introduced earlier, but first exposure can still happen after 12 months. Discuss the approach with your pediatrician. Many children introduced after this stage do just fine.',
  source_citation   = 'Du Toit et al. (2015), LEAP Study, New England Journal of Medicine; AAP Updated Guidance on Early Peanut Introduction (2017); NIAID Addendum Guidelines (2017)',
  updated_at        = now()
  WHERE slug = 'nutrition-peanut-intro';

-- nutrition-self-feeding-pincer
UPDATE milestone_windows SET
  title             = 'Self feeding with pincer grasp',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 34,
  peak_age_weeks    = 39,
  close_age_weeks   = 52,
  why_it_matters    = 'Most babies develop the pincer grasp (picking up small objects with thumb and index finger) around 8 to 10 months. Soft, small finger foods at this stage are both a feeding strategy and a fine motor practice opportunity. Babies who are allowed to self feed small pieces develop better hand coordination and show more positive relationships with food.',
  what_to_do        = '* Offer soft, small pieces of food at mealtimes alongside purees: peas, soft banana, cooked carrot pieces, small pasta
* Let them pick up and eat independently, even if it takes a long time
* Always supervise and ensure pieces are small enough to dissolve safely',
  what_not_to_worry = 'Most of the food will end up on the floor. Self feeding at this age is about motor practice and food exposure as much as nutrition.',
  missed_window     = 'If your 12 month old is not attempting to pick up small pieces of food at all, mention it at the 12 month visit alongside other fine motor observations. Most children in this range are developing on their own timeline.',
  source_citation   = 'AAP Complementary Feeding Guidelines; Baby Led Weaning Research (Rapley and Murkett)',
  updated_at        = now()
  WHERE slug = 'nutrition-self-feeding-pincer';

-- nutrition-sesame-intro
UPDATE milestone_windows SET
  title             = 'Introduce sesame, early allergen',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 17,
  peak_age_weeks    = 26,
  close_age_weeks   = 39,
  why_it_matters    = 'Sesame was recently added to the list of major allergens because reactions can be severe. Like other allergens, most babies tolerate introduction most easily somewhere in the first year of life.',
  what_to_do        = '* Hummus or tahini thinned with water or puree is the easiest way to introduce sesame
* Do not give whole sesame seeds as they are a choking hazard
* Monitor for 20 minutes after the first few exposures',
  what_not_to_worry = 'Tahini has a strong taste. If baby rejects it at first, try mixing a tiny amount into a puree they already like.',
  missed_window     = 'If your baby is over 9 months and hasn''t had sesame, add it to the menu this week. Most babies tolerate it well, and it''s easy to mix into foods they already enjoy.',
  source_citation   = 'FASTER Act (2021); AAP Guidelines',
  updated_at        = now()
  WHERE slug = 'nutrition-sesame-intro';

-- nutrition-sippy-cup
UPDATE milestone_windows SET
  title             = 'Sippy or straw cup introduction',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 26,
  peak_age_weeks    = 34,
  close_age_weeks   = 47,
  why_it_matters    = 'Learning to use a cup is a motor skill that prevents the dental and speech issues associated with long term bottle use. Starting at 6 months with small sips of water builds the skill early. The goal is to begin transitioning off the bottle at the first birthday, with full weaning complete by 15 to 18 months.',
  what_to_do        = '* Offer a straw cup or an open cup with a tiny amount of water at meal times
* Weighted straw cups are often easier for babies to learn than traditional sippy cups
* Be patient: it takes weeks of practice before they actually swallow more than they spill',
  what_not_to_worry = 'The mess is part of the learning process. Use a bib and a waterproof mat.',
  missed_window     = 'If your baby is 10 months and hasn''t tried a cup yet, start today with a straw or open cup at mealtimes. Starting now gives you plenty of time to build the habit, and most babies catch on quickly with a little practice.',
  source_citation   = 'AAPD Dental Health Guidelines; AAP',
  updated_at        = now()
  WHERE slug = 'nutrition-sippy-cup';

-- nutrition-solids-readiness
UPDATE milestone_windows SET
  title             = 'Watch for solid food readiness signs',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 17,
  peak_age_weeks    = 21,
  close_age_weeks   = 26,
  why_it_matters    = 'Starting solids is about developmental readiness, not just age. Most babies are ready around 6 months. Starting too early (before 4 months) is linked to obesity and digestive issues. Starting too late (after 7 months) can lead to iron deficiency and texture aversion.',
  what_to_do        = '* Look for: sitting with little support, good head control, and interest in what you are eating
* Watch for the loss of the tongue thrust reflex, when baby stops pushing objects out of their mouth with their tongue
* If baby reaches for your food and can hold their head steady, they are likely ready
* Never put infant cereal in a bottle to try to help your baby sleep — it is a choking hazard, it does not actually improve sleep, and it bypasses your baby''s natural ability to regulate how much they eat',
  what_not_to_worry = 'If your baby is 5 months and shows no interest, that is fine. The 6 month mark is the standard goal for most.',
  missed_window     = 'If your baby is 7 months and hasn''t started solids, begin this week. Iron stores are naturally reducing at this age, and adding solid foods is a great way to support their nutrition. Most babies take to their first foods quickly.',
  source_citation   = 'WHO Guidelines on Complementary Feeding; AAP Section on Breastfeeding; AAP Clinical Report on Infant Feeding Practices',
  updated_at        = now()
  WHERE slug = 'nutrition-solids-readiness';

-- nutrition-soy-intro
UPDATE milestone_windows SET
  title             = 'Introduce soy as an early allergen',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 17,
  peak_age_weeks    = 26,
  close_age_weeks   = 39,
  why_it_matters    = 'Soy is one of the top 9 allergens. The LEAP and EAT studies established that early introduction of allergens reduces the likelihood of allergy development. Most babies can have soy introduced alongside other allergens between 4 and 6 months when solids begin.',
  what_to_do        = '* Introduce soy through age appropriate foods: soft tofu, edamame pureed, or very small amounts of soy based formula as a supplemental taste
* Introduce at home (not daycare) when you have time to monitor for 1 to 2 hours
* If there is a family history of soy or legume allergy, check with your pediatrician first',
  what_not_to_worry = 'Soy allergy affects only about 0.4% of children. Most children tolerate soy easily. The purpose of early introduction is prevention, not diagnosis.',
  missed_window     = 'If you delayed soy introduction past 9 months, introduce it now with standard allergen introduction precautions.',
  source_citation   = 'LEAP Study (Du Toit et al. 2015); AAP Allergen Introduction Guidelines',
  updated_at        = now()
  WHERE slug = 'nutrition-soy-intro';

-- nutrition-spoon-self-feeding
UPDATE milestone_windows SET
  title             = 'Spoon self feeding, let them try',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 52,
  peak_age_weeks    = 65,
  close_age_weeks   = 78,
  why_it_matters    = 'Most children begin spoon self feeding around 12 to 15 months. It is messy, inefficient, and completely normal. The fine motor coordination required to scoop and bring a spoon to the mouth without tipping it takes months to develop. Letting them try, even messily, is how the motor skill develops and builds self-confidence.',
  what_to_do        = '* Load the spoon for them in the early weeks and hand it to them, they manage the transport
* Use a wide, shallow spoon designed for toddlers
* Accept the mess. A splat mat under the chair is a practical long term investment.',
  what_not_to_worry = 'A 15 month old eating mostly with their hands despite having a spoon available is completely normal. The spoon skill takes months to consolidate.',
  missed_window     = 'If your 2 year old shows no interest in or ability to use a spoon at all, mention it at the 24 month visit as part of fine motor review.',
  source_citation   = 'AAP; CDC Motor Milestones',
  updated_at        = now()
  WHERE slug = 'nutrition-spoon-self-feeding';

-- nutrition-texture-finger-foods
UPDATE milestone_windows SET
  title             = 'Texture progression, soft finger foods',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 30,
  peak_age_weeks    = 34,
  close_age_weeks   = 43,
  why_it_matters    = 'Soft finger foods develop the pincer grasp and self regulation. Babies who feed themselves learn to stop when they are full, which is a foundational habit for healthy weight. Most babies are ready for soft finger foods somewhere around 7 to 8 months.',
  what_to_do        = '* Offer pea sized pieces of very soft food: cooked carrots, ripe pear, or small pieces of tofu
* The food should be soft enough to mash between your thumb and forefinger
* Always supervise finger food sessions closely',
  what_not_to_worry = 'You do not need teeth to eat soft finger foods. Gums are incredibly strong and can handle most well cooked vegetables.',
  missed_window     = 'If your 11 month old is not yet eating finger foods, start with very soft puffs or small bits of banana today. Self feeding is a major milestone for independence, and most babies pick it up quickly once they get a taste for it.',
  source_citation   = 'CDC Infant Nutrition; UNICEF',
  updated_at        = now()
  WHERE slug = 'nutrition-texture-finger-foods';

-- nutrition-texture-mashed
UPDATE milestone_windows SET
  title             = 'Texture progression, mashed and lumpy foods',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 26,
  peak_age_weeks    = 30,
  close_age_weeks   = 39,
  why_it_matters    = 'Most babies are most open to new textures somewhere between 6 and 9 months. If you stay on smooth purees for too long, you risk texture aversion, where the child refuses lumpy or solid food later. This is a primary cause of picky eating in toddlers.',
  what_to_do        = '* Stop blending food into a liquid: use a fork to mash soft foods like banana or avocado
* Gradually increase the size of the lumps as baby gets better at chewing (even without teeth)
* Introduce Stage 3 thicker baby foods if using store bought options
* If using store-bought purees, limit suckable food pouches — sucking directly from the spout bypasses the oral-motor chewing mechanics needed for speech development and bathes teeth in sugars. Always squeeze the pouch onto a spoon instead.',
  what_not_to_worry = 'Gagging is a normal safety reflex. It is not the same as choking. If baby gags, stay calm and let them work the food forward with their tongue.',
  missed_window     = 'If your 10 month old is still on smooth purees, start introducing mashed textures now. It may take a few attempts for them to adjust, but with patience and consistency, most babies make the transition well within a few weeks.',
  source_citation   = 'WHO Complementary Feeding Study; Illingworth (1986); American Speech-Language-Hearing Association (ASHA); AAPD Oral Health Guidance',
  updated_at        = now()
  WHERE slug = 'nutrition-texture-mashed';

-- nutrition-tree-nut-intro
UPDATE milestone_windows SET
  title             = 'Introduce tree nuts, early allergen',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 17,
  peak_age_weeks    = 26,
  close_age_weeks   = 39,
  why_it_matters    = 'Tree nut allergies, cashew, almond, walnut, pistachio, are among the most common causes of severe allergic reactions in children, and they tend to be lifelong. Like peanut and egg, early introduction during the solid food window reduces the likelihood of allergy developing. Tree nuts are not the same as peanuts (peanuts are legumes), so peanut tolerance does not mean tree nut tolerance.',
  what_to_do        = '* Introduce as a thinned nut butter (almond or cashew butter thinned with water or puree, never whole nuts, which are a choking hazard)
* Introduce one tree nut at a time, 3–4 days apart, so reactions can be traced
* Watch for 20 minutes after each first introduction
* Don''t rush: you don''t need to introduce all tree nuts in one week',
  what_not_to_worry = 'A mild rash around the mouth after tree nut introduction should always be taken seriously. Contact your pediatrician before offering that nut again. True allergic reactions involve hives, swelling, vomiting, or breathing difficulty — if any of these occur, stop immediately and seek medical attention.',
  missed_window     = 'Tree nuts can still be introduced after 9 months with appropriate caution. Early introduction is preferred but not the only option. Most families who introduce tree nuts after this window have no issues.',
  source_citation   = 'AAP Infant Food and Feeding Guidelines (2022); ASCIA Early Introduction Guidelines; AAP Clinical Report on Management of Food Allergy (2019)',
  updated_at        = now()
  WHERE slug = 'nutrition-tree-nut-intro';

-- nutrition-vitamin-d-breastfed
UPDATE milestone_windows SET
  title             = 'Vitamin D drops, start from birth for breastfed babies',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 0,
  peak_age_weeks    = 1,
  close_age_weeks   = 52,
  why_it_matters    = 'Breast milk is nearly perfect, but it is low in Vitamin D. Infants who do not get enough risk rickets, which is a condition that causes weak or deformed bones. Because babies should not have direct sun exposure in the first 6 months, they cannot make their own Vitamin D. Supplements are the only reliable source.',
  what_to_do        = '* Give 400 IU of liquid Vitamin D drops once per day
* Place the drop directly on the nipple before a feed or in a small bottle of expressed milk
* Continue until your baby is drinking at least 32 ounces of Vitamin D fortified formula or whole milk daily',
  what_not_to_worry = 'If you miss a day, do not double the dose. Just resume the normal routine the next day. The benefit is cumulative over time.',
  missed_window     = 'If you haven''t started yet, start today. It''s never too late to begin, and the full benefit of supplementation kicks in right away.',
  source_citation   = 'AAP Clinical Report, Vitamin D Status of Infants (2023)',
  updated_at        = now()
  WHERE slug = 'nutrition-vitamin-d-breastfed';

-- nutrition-vitamin-d-formula
UPDATE milestone_windows SET
  title             = 'Confirm formula has Vitamin D',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 0,
  peak_age_weeks    = 4,
  close_age_weeks   = 52,
  why_it_matters    = 'Most modern infant formulas are fortified with Vitamin D, but it is worth checking the label. If your baby is drinking less than 32 ounces of formula per day, they may still need a supplement to reach the 400 IU daily requirement.',
  what_to_do        = '* Check your formula label for Vitamin D content
* Calculate daily intake: if baby drinks less than 32 ounces, talk to your pediatrician about a partial supplement
* Transition to whole milk at 12 months will provide the next major source of Vitamin D',
  what_not_to_worry = 'Most major brands sold in the US and Europe meet these standards automatically. You are likely already covered.',
  missed_window     = 'Check the label today. If your formula is not fortified, switch brands or start drops immediately. Either fix is simple and quick.',
  source_citation   = 'FDA Infant Formula Nutrient Requirements; AAP Guidance',
  updated_at        = now()
  WHERE slug = 'nutrition-vitamin-d-formula';

-- nutrition-water-cup
UPDATE milestone_windows SET
  title             = 'Introduce water in a cup',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 26,
  peak_age_weeks    = 26,
  close_age_weeks   = 52,
  why_it_matters    = 'Once solids begin around 6 months, infants can have 4 to 8 ounces of water per day — offered with meals to aid digestion and to build familiarity with a cup. Under 6 months, water is not recommended because it can displace breast milk or formula and cause water intoxication (hyponatremia), a severe condition that can lead to infant seizures. Infants under 6 months get 100% of their necessary hydration from breast milk or properly mixed formula, even in hot weather.',
  what_to_do        = '* Use a small open cup or 360 cup, this is also good oral motor practice
* Offer at mealtimes alongside solids, not instead of breast milk or formula
* Amounts are small: a few sips is plenty at first',
  what_not_to_worry = 'Your baby will spill most of it. That is the expected outcome. The goal is exposure to the cup and a few sips of water, not hydration.',
  missed_window     = 'If your baby is 12 months and still on the bottle for all fluids, start cup practice now. The AAP recommends transitioning off the bottle entirely by 15 to 18 months.',
  source_citation   = 'AAP Nutrition Guidelines; Healthy Eating Research; AAP & CDC Healthy Beverage Consumption Guidelines',
  updated_at        = now()
  WHERE slug = 'nutrition-water-cup';

-- nutrition-wheat-intro
UPDATE milestone_windows SET
  title             = 'Introduce wheat, early allergen',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 17,
  peak_age_weeks    = 26,
  close_age_weeks   = 39,
  why_it_matters    = 'Wheat is one of the top nine allergens. Most babies who are introduced to wheat somewhere between 4 and 9 months, ideally while still breastfeeding, develop tolerance to gluten more easily. Early introduction can reduce the risk of wheat allergy and potentially Celiac disease.',
  what_to_do        = '* Start with a small amount of wheat cereal or a tiny piece of well cooked pasta
* Watch for any digestive distress or skin reactions
* If tolerated, keep wheat in the diet at least twice a week',
  what_not_to_worry = 'Gluten is not something to fear unless there is a diagnosed medical reason. For most babies, early exposure is a safety measure.',
  missed_window     = 'Introduce wheat now. For most babies, it''s a straightforward addition to the diet. If you have a family history of Celiac disease, your doctor can guide you on the best approach for your child.',
  source_citation   = 'NIAID Addendum Guidelines for Food Allergy Prevention',
  updated_at        = now()
  WHERE slug = 'nutrition-wheat-intro';

-- prebirth-hospital-bag
UPDATE milestone_windows SET
  title             = 'Pack the hospital bag',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 6,
  peak_age_weeks    = 3,
  close_age_weeks   = 0,
  why_it_matters    = 'A packed hospital bag at 37 weeks means one less thing to think about when labor starts. It also means you do not end up in the hospital without the things that actually matter: the car seat, the insurance card, the phone charger. First time parents typically underestimate how foggy and fast the immediate postpartum period is. Pack it now.',
  what_to_do        = 'For the birth parent:
* Insurance card and ID
* Birth preferences document (keep it to one page)
* Phone charger and a portable battery
* Comfortable, loose clothing for labor and postpartum: a few changes, socks
* Toiletries: toothbrush, shampoo, dry shampoo, face wash, lip balm
* Nursing bra and breast pads if planning to breastfeed
* Snacks for labor: granola bars, electrolyte drinks (hospitals often restrict eating during active labor)
* Going home outfit (sized for 6 months pregnant, not your pre pregnancy size — right after birth your uterus is still about the size of a 5 to 6 month pregnancy)

For the partner or support person:
* Phone charger
* Snacks and cash (hospital vending machines get expensive)
* A change of clothes
* Entertainment for the long stretches of early labor

For the baby:
* A going home outfit in newborn size AND 0 to 3 months (newborns are unpredictably sized)
* A hat and a swaddle blanket
* The car seat, installed and checked before 37 weeks (see below)

**Car seat: do this before you pack the bag:**
* Install the infant car seat in the car before 37 weeks
* Have the installation checked at a certified Child Passenger Safety Technician inspection station (most fire stations offer this free)
* The hospital will require you to have an appropriate infant car seat before discharge — but staff cannot verify if it is correctly installed. That responsibility is yours. Get the seat inspected at a certified car seat inspection station before your due date.',
  what_not_to_worry = 'You do not need a complete nursery ready before the baby comes home. You need: a safe place to sleep, the car seat, and enough supplies for 48 to 72 hours. The rest can wait.',
  missed_window     = 'If you are reading this at 38 or 39 weeks and the bag is not packed: do it this weekend. You may not get another clear window.',
  source_citation   = 'ACOG Labor and Delivery Preparation Guidelines; NHTSA Car Seat Safety; Safe Kids Worldwide; Standard US Hospital Discharge Policies',
  updated_at        = now()
  WHERE slug = 'prebirth-hospital-bag';

-- prebirth-newborn-screening
UPDATE milestone_windows SET
  title             = 'Understand newborn screening before the birth',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 4,
  peak_age_weeks    = 0,
  close_age_weeks   = 1,
  why_it_matters    = 'Newborn screening is one of the most important public health programs in existence. Before you leave the hospital, your baby will be tested for dozens of rare but serious conditions: metabolic disorders, hormonal conditions, cystic fibrosis, critical congenital heart disease, hearing loss. Most of these conditions are invisible at birth. Early detection means early treatment, and for many of them early treatment is the difference between a normal life and a severely impacted one.

This is not optional and not something you need to worry about arranging. It happens automatically at the hospital. What you need to do is understand what it is so you are not blindsided if a result comes back.',
  what_to_do        = 'Three screens happen automatically before you leave the hospital. Know what they are:

1. **Blood spot test (heel prick):** Done at 24 to 48 hours after birth. A few drops of blood from the baby''s heel, tested for up to 60+ conditions depending on your state or country. Results typically come back within 1 to 2 weeks. Your pediatrician will contact you if anything requires follow up.
2. **Hearing screen:** Done before discharge. A small probe in the ear, painless, takes a few minutes. If the baby does not pass initially, it is often due to fluid in the ear canal from birth. A rescreen is done before the first pediatrician visit.
3. **Critical Congenital Heart Disease (CCHD) screen:** Done after 24 hours of age. A pulse oximeter on the hand and foot measures oxygen levels. Low or discrepant readings trigger further evaluation.

Before you leave the hospital:
* Ask the staff whether all three screens were completed
* Confirm your pediatrician''s contact information is in the hospital record so they receive results directly

If a result flags:
* Do not panic. Most abnormal newborn screening results are false positives that resolve on repeat testing.
* Follow your pediatrician''s guidance immediately, including any specialist referral
* Act on it the same day if your pediatrician calls about a metabolic result. timeliness matters',
  what_not_to_worry = 'A rescreen for hearing is not a diagnosis of hearing loss. It is a standard protocol for a test that has a meaningful false positive rate in the first 24 hours of life.',
  missed_window     = 'If you left the hospital and are unsure whether all three screens were completed, call the hospital''s newborn nursery directly and ask. Your pediatrician should have the results in your file from the 3 to 5 day visit.',
  source_citation   = 'AAP Newborn Screening Policy; HRSA Recommended Uniform Screening Panel (RUSP); JCIH Position Statement (2019)',
  updated_at        = now()
  WHERE slug = 'prebirth-newborn-screening';

-- prebirth-pediatrician-selection
UPDATE milestone_windows SET
  title             = 'Choose your pediatrician before the baby is born',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 10,
  peak_age_weeks    = 6,
  close_age_weeks   = 0,
  why_it_matters    = 'The first well child visit happens within 3 to 5 days of birth. You will be exhausted, hormonally volatile, and trying to learn to feed a human. That is not the time to be researching doctors. Choosing your pediatrician before the birth means you have a name, a number, and an appointment already scheduled. It also means you have met this person before you are in crisis.

Many pediatric practices have prenatal meet and greet appointments (often called a prenatal consultation). They are worth doing.',
  what_to_do        = '* Start looking at 28 to 32 weeks. Do not leave it past 35 weeks.
* Ask your OB, midwife, or trusted parents in your area for recommendations
* Narrow to 2 to 3 candidates and schedule prenatal consultations
* At the consultation, ask:
 * What are your after hours and weekend protocols?
 * What hospital are you affiliated with?
 * What is your approach to breastfeeding support?
 * What is your vaccine policy?
 * How long does it typically take to get a sick visit?

**What matters most:**
* Accessibility: can you reach them when you need to?
* Philosophy alignment: do their approach and yours feel compatible?
* Practice logistics: is the office close? easy to park? easy to get an appointment?

**What to do once you choose:**
* Register as a patient before the birth
* Add the practice phone number to your phone now
* Schedule the first newborn visit for 3 to 5 days after the due date
* Give the hospital your pediatrician''s name so they can contact them directly if needed',
  what_not_to_worry = 'You are not locked in forever. If the relationship does not work after 6 to 12 months, you can switch. But having someone chosen before the birth is substantially better than navigating newborn care without a doctor.',
  missed_window     = 'If the baby is already here and you do not have a pediatrician, call practices today and explain your situation. Most will prioritize a newborn appointment.',
  source_citation   = 'AAP Bright Futures Guidelines; ACOG Prenatal Care Guidelines',
  updated_at        = now()
  WHERE slug = 'prebirth-pediatrician-selection';

-- prebirth-safe-sleep-setup
UPDATE milestone_windows SET
  title             = 'Set up safe sleep before the baby arrives',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 6,
  peak_age_weeks    = 4,
  close_age_weeks   = 0,
  why_it_matters    = 'Safe sleep setup is one of the highest impact things you can do before your baby is born. Sudden Infant Death Syndrome (SIDS) and sleep related infant deaths are among the leading causes of death in the first year. The AAP''s safe sleep guidelines are clear and backed by decades of research. The time to set this up is before you are exhausted with a newborn in your arms, not after.

The ABCs: Alone, Back, Crib. Every sleep, every time, from day one.',
  what_to_do        = '* Firm, flat sleep surface only. A crib, bassinet, or play yard with a firm mattress and fitted sheet. No inclined sleepers, no positioners, no nursing pillows left in the sleep space.
* Back to sleep for every single sleep, including naps, until 12 months. Once a baby can roll both ways independently, you do not need to reposition them — but always place them on their back to start.
* No loose items in the sleep space. No blankets, pillows, bumpers, stuffed animals. Nothing. A standard, non-weighted sleep sack instead of a blanket is the right call — weighted sleep sacks impair chest wall expansion and are not recommended by the AAP.
* Room sharing (not bed sharing) for at least the first 6 months. Your baby sleeps in their own sleep space, in your room. This reduces SIDS risk by up to 50% compared to a separate room.
* Temperature: 68–72°F (20–22°C). Overbundling is a SIDS risk factor.

**What to buy before the baby arrives:**
* A firm crib or bassinet that meets current safety standards (check CPSC certification)
* 2 to 3 fitted sheets in rotation
* 2 to 3 sleep sacks in newborn size (0 to 3 months)
* A room thermometer

**What to throw away or return:**
* Any inclined sleeper or lounger marketed for sleep (Fisher Price Rock N Play was recalled for this reason)
* Crib bumpers of any kind (even the mesh ones have insufficient evidence of safety)
* Positioners or wedges',
  what_not_to_worry = 'The back sleeping position does not increase choking or aspiration risk. The gag reflex protects the airway. Healthy babies placed on their backs are safe.

If your baby falls asleep in a swing, car seat, or bouncer, move them to the flat sleep surface when you can. These surfaces are not safe for unsupervised sleep.',
  missed_window     = 'If the baby is already here and safe sleep is not in place, set it up today. It is never too late, and every sleep counts.',
  source_citation   = 'AAP Safe Sleep Policy (2022); CDC SIDS Data; Moon et al. Pediatrics (2022)',
  updated_at        = now()
  WHERE slug = 'prebirth-safe-sleep-setup';

-- safety-babyproofing
UPDATE milestone_windows SET
  title             = 'Babyproof the home, before crawling begins',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 17,
  peak_age_weeks    = 26,
  close_age_weeks   = 34,
  why_it_matters    = 'The window between birth and crawling (approximately 4–8 months) is the time to babyproof. Once a baby is mobile, and mobility happens faster than almost all first time parents expect, the hazard exposure multiplies overnight. Babyproofing takes an afternoon. The most dangerous household hazards for crawlers are: stairs, electrical outlets, cabinets containing cleaning products, unsecured furniture that can tip, and cords.',
  what_to_do        = '* Get on your hands and knees and look at your home from baby''s height, this reveals hazards that aren''t visible from standing
* Priority targets: stair gates (hardware-mounted and drilled into the wall at the top of stairs; pressure-mounted gates are only safe at the bottom or between rooms — never at the top), outlet covers, cabinet locks for cleaning products and medications, furniture anchored to walls, electrical cords secured, window blind cords tied up or replaced with cordless coverings (a severe strangulation hazard — older homes and rentals often still have them)
* Check for small objects on floors that can be choking hazards',
  what_not_to_worry = 'You don''t need to buy everything at once. Start with the most dangerous hazards (stairs, toxins, tip over risks) and work outward from there.',
  missed_window     = 'If your baby is already crawling and the home isn''t babyproofed: start today, beginning with the room where they spend the most time. Even a single afternoon of focused babyproofing makes a real difference.',
  source_citation   = 'AAP Injury Prevention Guidelines; Safe Kids Worldwide, Home Safety Checklist; CDC Child Injury Prevention; CPSC Window Covering Safety Standard; AAP Injury Prevention Guidelines & CPSC Stair Gate Safety Standards',
  updated_at        = now()
  WHERE slug = 'safety-babyproofing';

-- safety-back-to-sleep
UPDATE milestone_windows SET
  title             = 'Back to sleep, every time',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 52,
  why_it_matters    = 'Back sleeping reduces SIDS risk by 50%. The "Back to Sleep" campaign, launched in 1994, cut SIDS rates by more than 50% within a decade. The rule is absolute until 12 months: always on the back, for every sleep, every nap, every person who cares for this baby. Many SIDS deaths happen at grandparents'' houses or with babysitters who were raised differently and think "tummy sleeping is fine, we all did it."',
  what_to_do        = '* Inform every caregiver: the rule is back sleeping, every time, no exceptions
* Tummy sleeping is safe during awake, supervised tummy time. Back sleeping is for sleep.
* After rolling both ways independently, a baby can be left in whatever position they roll to — but always place them on their back to start, until their first birthday',
  what_not_to_worry = 'Babies who are placed on their backs will not choke on spit up. The airway anatomy protects against this, a common misconception that leads parents to place babies on their sides "just in case."',
  missed_window     = 'The back to sleep rule applies until 12 months. While a baby who can roll both ways independently can stay in the position they naturally roll into, always place them on their back to start — every sleep, until their first birthday.',
  source_citation   = 'AAP Safe Sleep Guidelines (2022); Moon et al., Back to Sleep Evidence Base; Pediatrics (2022)',
  updated_at        = now()
  WHERE slug = 'safety-back-to-sleep';

-- safety-car-seat-install-check
UPDATE milestone_windows SET
  title             = 'Car seat installation check, rear facing, before first drive',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 4,
  why_it_matters    = 'Car accidents are a leading cause of injury death for young children globally. The first car ride, hospital to home, happens before most parents feel ready, and research shows that up to 75% of car seats are installed incorrectly. An incorrectly installed seat provides substantially less protection. Installation needs to happen before the baby is born, not in the hospital parking lot.',
  what_to_do        = '* Install the car seat rear facing before the due date, and have it checked
* Free car seat inspections are available through many fire stations, hospitals, and child road safety programs. Search "[your country] car seat inspection" to find a local service.
* The seat should not move more than 1 inch side-to-side or front-to-back when you tug firmly at the belt path (where the seatbelt or LATCH strap passes through)
* Check the built-in recline indicator to ensure the seat is at the correct angle for a newborn — a seat that is too upright can cause the baby''s head to fall forward and restrict their airway
* Never buckle your baby into a car seat wearing a puffy winter coat or snowsuit — buckle them in normal clothes, then place the coat or a blanket over the tightened straps',
  what_not_to_worry = 'You don''t need the most expensive car seat. The safest seat is any correctly installed seat that fits your vehicle and your child''s weight. Price does not predict safety rating. Never use aftermarket car seat accessories (like third-party head supports or strap covers) — if it didn''t come in the box with the car seat, it hasn''t been crash-tested with it and could be dangerous.',
  missed_window     = 'If your baby is already here and the seat hasn''t been checked: get it checked before the next car trip. Most inspections take 15 minutes.',
  source_citation   = 'NHTSA Child Passenger Safety Guidelines (2024); AAP Car Seat Safety; AAP Safe Sleep Policy; Safe Kids Worldwide, Installation Statistics; road safety guidelines vary by country, follow your local transport authority',
  updated_at        = now()
  WHERE slug = 'safety-car-seat-install-check';

-- safety-choking-awareness
UPDATE milestone_windows SET
  title             = 'Know the choking hazard list',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 10,
  peak_age_weeks    = 17,
  close_age_weeks   = 208,
  why_it_matters    = 'Choking is the leading cause of injury death in infants and one of the top causes in children under 4. The vast majority of choking incidents involve food or small objects that parents didn''t recognize as hazardous. The list is not intuitive: grapes, cherry tomatoes, hot dogs, whole nuts, raw carrots, popcorn, and raisins are all on it. So are coins, button batteries (which can cause severe internal burns within hours), and balloons. Most parents don''t know the full list.',
  what_to_do        = '* Memorize the food hazard list: whole grapes, cherry tomatoes, hot dogs, nuts, raw carrots, popcorn, raisins, marshmallows, large chunks of any food — round or cylindrical foods like grapes and hot dogs must be cut lengthwise first, then quartered (never into coins, which are the exact size of an infant''s trachea)
* Thick globs of peanut or nut butter are a choking hazard at any age — always thin with water or spread very thinly on food, never serve on a spoon or thick on a cracker
* Cut hazardous foods (grapes, hot dogs, raw carrots, firm fruits) into pieces no larger than one-half inch for children under 4 — soft foods like banana or cooked pasta don''t need to be pea-sized for older toddlers
* Learn infant and child choking first aid alongside infant CPR (same class, usually)
* Button batteries are a separate critical hazard: if ingested, go to the emergency room immediately. For children over 12 months only, give 10 mL (2 teaspoons) of honey every 10 minutes on the way — it coats the battery and delays severe internal burns. Never give honey to children under 12 months (botulism risk).',
  what_not_to_worry = 'Gagging is not choking. Babies gag frequently when learning to eat, it''s a safety reflex. The difference: a gagging child is making noise and is pink. A choking child is silent, has high pitched stridor, or is turning blue.',
  missed_window     = 'This stage doesn''t fully wind down until age 4. Review the food list at major food transitions: starting solids (6 months), starting finger foods (8–9 months), and starting family foods (12 months).',
  source_citation   = 'AAP Choking Prevention Guidelines; Safe Kids Worldwide, Choking Hazard Data; National Capital Poison Center, Button Battery Guidelines; National Capital Poison Center (NCPC) Button Battery Ingestion Triage and Treatment Guideline',
  updated_at        = now()
  WHERE slug = 'safety-choking-awareness';

-- safety-crib-to-bed-transition
UPDATE milestone_windows SET
  title             = 'Transitioning out of the crib, timing matters',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 78,
  peak_age_weeks    = 104,
  close_age_weeks   = 130,
  why_it_matters    = 'Moving from crib to toddler bed too early is one of the most common causes of sleep regression in the second year. Most sleep experts recommend keeping children in a crib until 3 years old unless there is a safety reason (climbing out consistently). The crib is a sleep boundary. Keeping it in place until age 3 makes bedtime more predictable for everyone.',
  what_to_do        = '* If climbing out: lower the mattress first, use a sleep sack to limit leg range, then transition if climbing continues
* Transition around age 3 when the child can understand and follow the boundary of staying in bed
* Transition out of the crib when your child reaches 35 inches in height, or when the crib rail is less than three-quarters of their height — whichever comes first, regardless of age
* Involve the child in choosing their new bed to create buy in',
  what_not_to_worry = 'There is no developmental reason to rush this transition. A child still in a crib at 3 is fine.',
  missed_window     = 'If you have already transitioned too early and are dealing with nightly escapes, use a consistent return to bed protocol: minimal interaction, same words, same calm return every time.',
  source_citation   = 'AAP Sleep Guidelines; Mindell (2005), Sleeping Through the Night; AAP and CPSC Crib Safety Guidelines',
  updated_at        = now()
  WHERE slug = 'safety-crib-to-bed-transition';

-- safety-forward-facing-transition
UPDATE milestone_windows SET
  title             = 'Car seat forward facing transition, weight and height based',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 104,
  peak_age_weeks    = 130,
  close_age_weeks   = 156,
  why_it_matters    = 'When a child has outgrown the rear facing limits of their seat (by height or weight, not by age), they transition to a forward facing harness seat. This is still significantly safer than a booster. The forward facing harness should be used until the child outgrows it as well. Weight limits vary by seat and country. Check your specific seat''s manual and your local road safety guidelines.',
  what_to_do        = '* Check your seat''s rear facing limit: if your child''s head is within 1 inch of the top of the seat, they have outgrown it
* Move to a forward facing convertible seat with a 5 point harness, not a booster yet
* Ensure the harness is at or above shoulder level in forward facing mode',
  what_not_to_worry = 'There is no hurry to move to a booster. A forward facing harness is much safer than a booster at this age and weight range.',
  missed_window     = 'If your child is already in a booster before age 4 or before reaching 40 lbs, move them back to a harnessed seat if possible.',
  source_citation   = 'NHTSA (2024); AAP Car Seat Guideline; Insurance Institute for Highway Safety; follow your country''s transport authority for legal requirements',
  updated_at        = now()
  WHERE slug = 'safety-forward-facing-transition';

-- safety-infant-cpr
UPDATE milestone_windows SET
  title             = 'Parent infant CPR training',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 17,
  why_it_matters    = 'Infant CPR is one of the most important skills a new parent can have, and one of the least likely to be used. In the event of a choking incident or respiratory emergency, the minutes before emergency services arrive are critical. Parents who have received hands on CPR training respond more effectively and more calmly than those who have only watched a video. The training takes 2 hours and can be done before the baby arrives.',
  what_to_do        = '* Take a hands on infant CPR and first aid class before or shortly after birth, hospital classes, Red Cross, or local fire stations often offer them
* Video only learning is better than nothing but significantly less effective than hands on practice
* Ensure any regular caregivers (grandparents, nanny) are also trained',
  what_not_to_worry = 'You don''t need to memorize every step. The muscle memory from hands on practice is what matters, it takes over in an emergency when memory fails.',
  missed_window     = 'It''s never too late to take this class. If you''re past 4 months and haven''t done it, schedule it this week.',
  source_citation   = 'American Red Cross, Infant CPR Guidelines; AAP Bright Futures; AHA Infant CPR Training Evidence',
  updated_at        = now()
  WHERE slug = 'safety-infant-cpr';

-- safety-poison-control
UPDATE milestone_windows SET
  title             = 'Save your local poison control number',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 52,
  why_it_matters    = 'Poisoning is one of the top causes of accidental injury in children under 5. Most poisoning calls to poison control involve household products (cleaning supplies, medications, vitamins, batteries) found by mobile toddlers. Having the number already saved means you are not searching for it while your child is in distress.',
  what_to_do        = '* US: 1-800-222-1222 | UK: 111 | Australia: 13 11 26 | HK: 2382 5111 | Canada: find at 1-800-268-9017
* Not sure? Find your country''s number at poison.org or ask your pediatrician at your first visit.
* Save it in your phone now, before you need it.
* Ensure all medications (including vitamins) are in child resistant containers and stored out of reach
* Button batteries (in remotes, key fobs, musical cards) are the most dangerous household poisoning risk, they cause severe internal burns within 2 hours if ingested',
  what_not_to_worry = 'Most poison control calls end without emergency intervention. The specialists will tell you exactly what to do based on what was ingested and the quantity.',
  missed_window     = 'Save the number today if you haven''t. Check your home for accessible medications and batteries this week. It only takes a minute and gives you real peace of mind.',
  source_citation   = 'National Capital Poison Center; AAP Injury Prevention; Safe Kids Worldwide',
  updated_at        = now()
  WHERE slug = 'safety-poison-control';

-- safety-rear-facing-as-long-as-possible
UPDATE milestone_windows SET
  title             = 'Stay rear facing as long as possible',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 104,
  why_it_matters    = 'Keep children rear facing until they reach the maximum height or weight limit of their specific seat, not until an arbitrary age. Age 2 is sometimes cited as a minimum benchmark, but it is not a target. Rear facing is significantly safer in frontal crashes because it distributes crash forces across the entire back, head, and neck. Check your country''s road safety guidelines for the legal minimum, then go beyond it as long as your seat allows.',
  what_to_do        = '* Check the weight and height limit of your specific seat, not a generic age guideline
* Most convertible car seats support rear facing up to 40 to 50 lbs, many toddlers can stay rear facing until age 4
* Folded or crossed legs in a rear facing seat are safe, the legs are not a safety issue',
  what_not_to_worry = 'Folded legs are safe. Discomfort from a cramped position is not a reason to switch. Children who have always been rear facing rarely object to it.',
  missed_window     = 'If you have already turned your child forward facing, ensure the forward facing seat is correctly installed and the harness is properly fitted at the correct slot height. A correctly installed forward facing seat with a properly fitted harness still provides excellent protection.',
  source_citation   = 'NHTSA (2024); AAP Car Seat Safety Policy; Insurance Institute for Highway Safety; equivalent guidance from Transport for NSW (Australia), UK Road Safety Trust, Transport Canada',
  updated_at        = now()
  WHERE slug = 'safety-rear-facing-as-long-as-possible';

-- safety-room-sharing
UPDATE milestone_windows SET
  title             = 'Room sharing without bed sharing',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 26,
  why_it_matters    = 'Room sharing (baby in your room, in their own sleep space) reduces SIDS risk by up to 50% compared to sleeping in a separate room. Bed sharing increases SIDS risk, particularly when the parent has consumed alcohol, medication, or is extremely fatigued. The AAP recommends room sharing for at least the first 6 months. This is one of the most straightforward risk reduction measures available and costs nothing.',
  what_to_do        = '* Keep the crib or bassinet in your room for the first 6 months
* If you''re tempted to bring the baby into your bed during a night feed: set up the sleep space to make transfer back easy, darkness, white noise, firm surface nearby
* After 6 months, transitioning to their own room is developmentally appropriate and safe',
  what_not_to_worry = 'Room sharing does not doom you to sleep disruption forever. The transition to their own room after 6 months is typically smooth.',
  missed_window     = 'If your baby is already in a separate room before 6 months and you choose to maintain that, discuss the risk tradeoff with your pediatrician. Some families find that room sharing is more disruptive to parental sleep, which creates its own risks. Talk with your pediatrician and do what works best for your family.',
  source_citation   = 'AAP Safe Sleep Guidelines (2022); Carpenter et al. (2013), Room Sharing Evidence; Pediatrics (2022)',
  updated_at        = now()
  WHERE slug = 'safety-room-sharing';

-- safety-safe-sleep-setup
UPDATE milestone_windows SET
  title             = 'Safe sleep setup, before baby arrives',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 4,
  why_it_matters    = 'Approximately 3,500 infants die each year in the US from sleep related causes, SIDS, accidental suffocation, and entrapment. The vast majority are preventable with the right sleep environment. The time to set up a safe sleep space is before the baby arrives, not at 2am after a long delivery. This is the single most important safety preparation for a new parent.',
  what_to_do        = '* Baby sleeps alone, on their back, on a firm, flat surface, in a crib, bassinet, or play yard that meets current safety standards
* Nothing in the sleep space: no pillows, no loose blankets, no bumpers, no positioners, no stuffed animals
* Room temperature should be comfortable for a lightly dressed adult, no need to bundle',
  what_not_to_worry = 'You don''t need an expensive crib. A firm, flat, appropriately sized sleep surface is the requirement. A $50 play yard with a proper mattress is safer than an expensive vintage crib with a soft mattress.',
  missed_window     = 'If your baby is already here and the sleep environment doesn''t meet these guidelines, change it tonight. This is a safety call, not a gradual transition. Simple changes tonight make the sleep space safe.',
  source_citation   = 'AAP Safe Sleep Guidelines (2022); Pediatrics, SIDS and Other Sleep Related Infant Deaths (2022 Update); Safe to Sleep Campaign',
  updated_at        = now()
  WHERE slug = 'safety-safe-sleep-setup';

-- safety-sunscreen-6months
UPDATE milestone_windows SET
  title             = 'Sunscreen from 6 months onward',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 26,
  peak_age_weeks    = 26,
  close_age_weeks   = 156,
  why_it_matters    = 'Baby skin is thinner and more permeable than adult skin and burns faster. Sunburn in infancy increases lifetime risk of melanoma. Under 6 months, the AAP recommends shade and protective clothing as the first line of defense. If adequate shade and clothing are not available, a minimal amount of mineral-based sunscreen (SPF 15 or higher) can be applied to small exposed areas like the face and back of hands — infant skin absorbs chemicals more readily, so limit application. From 6 months, SPF 30 or higher sunscreen should be applied to all exposed skin before sun exposure.',
  what_to_do        = '* Apply SPF 30 or higher broad spectrum sunscreen 15 minutes before going outside
* Choose mineral sunscreens (zinc oxide or titanium dioxide) for babies, they sit on the skin rather than being absorbed
* Reapply every 2 hours and after water exposure',
  what_not_to_worry = 'Sunscreen is safe for babies from 6 months. The small amount of chemical absorption from mineral sunscreens poses no documented health risk and is far outweighed by the protection provided.',
  missed_window     = 'If your baby under 6 months needs to be in the sun, protective clothing, a hat, and shade are the primary tools.',
  source_citation   = 'AAP Sun Safety Guidelines (2023); Skin Cancer Foundation; FDA Sunscreen Safety',
  updated_at        = now()
  WHERE slug = 'safety-sunscreen-6months';

-- safety-swaddle-transition
UPDATE milestone_windows SET
  title             = 'Swaddle transition, stop when rolling signs appear',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 4,
  peak_age_weeks    = 8,
  close_age_weeks   = 8,
  why_it_matters    = 'A swaddled baby who rolls face down cannot push themselves back up or move their face away from the mattress. This is a suffocation risk. The AAP is unambiguous: stop swaddling at 8 weeks (2 months) of age OR at the first signs of rolling — whichever comes first. Rolling signs include attempting to roll, rocking side to side, or getting one shoulder off the mat during tummy time. Do not wait for rolling signs if your baby is already past 8 weeks.',
  what_to_do        = '* Watch for rolling signs during tummy time: rocking onto one shoulder, getting a knee under the body
* The day you see a rolling attempt: stop swaddling that night, cold turkey
* Transition options: a sleep sack (arms free), a wearable blanket, or nothing, all are safe. Some babies need a few rough nights to adjust.',
  what_not_to_worry = 'Sleep will get worse before it gets better when you drop the swaddle. This is temporary. The safety benefit is not worth compromising.',
  missed_window     = 'If your baby is already rolling and still being swaddled, stop tonight. If your baby is past 8 weeks and not yet rolling, stop swaddling now anyway — the age limit is firm. Most babies adjust to sleeping without a swaddle within a few nights.',
  source_citation   = 'AAP Safe Sleep Guidelines (2022); SIDS and Other Sleep Related Infant Deaths: Evidence Base for 2016 Updated Recommendations (Pediatrics)',
  updated_at        = now()
  WHERE slug = 'safety-swaddle-transition';

-- safety-water-supervision
UPDATE milestone_windows SET
  title             = 'Water safety, never leave unattended near water',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 26,
  peak_age_weeks    = 52,
  close_age_weeks   = 156,
  why_it_matters    = 'Drowning is the leading cause of accidental death for children ages 1–4. A child can drown in less than 2 inches of water. Bath tubs, buckets, toilets, garden ponds, and paddling pools are all hazards, not just pools and lakes. The rule is simple and absolute: within arm''s reach whenever near any water, any depth. No exceptions. Not for a phone call. Not to answer the door.',
  what_to_do        = '* Arm''s reach rule: if you''re not touching them, you''re too far
* Infant bath seats and rings are not safety devices — the AAP warns against relying on them, as babies can slip through the leg openings or tip over. Never step away from a baby in a bath seat.
* Empty any container of standing water after use: bath, paddling pool, buckets
* A 4-sided isolation fence (at least 4 feet high, completely separating the pool from the house and yard) with a self-closing, self-latching gate is the AAP standard — a property-line fence alone is not sufficient',
  what_not_to_worry = 'Swimming lessons from 12 months onward reduce drowning risk and are worth doing — but they do not replace supervision. A child who can swim can still drown. Avoid puddle jumpers and inflatable arm bands: they teach a vertical posture (the drowning position) rather than horizontal swimming, and give parents a false sense of security. Use a US Coast Guard-approved life jacket for open water instead.',
  missed_window     = 'Water safety supervision is a principle that applies throughout early childhood. It remains essential until children are reliable, competent swimmers, which is typically not before age 6 or 7. Starting formal swimming lessons around age 1 is a great way to build skills and water confidence gradually.',
  source_citation   = 'AAP Drowning Prevention Policy; CDC Child Drowning Statistics; American Red Cross Water Safety; US Swim School Association',
  updated_at        = now()
  WHERE slug = 'safety-water-supervision';

-- screening-blood-lead
UPDATE milestone_windows SET
  title             = 'Blood lead level screen',
  urgency           = 'screening',
  priority          = 2,
  open_age_weeks    = 26,
  peak_age_weeks    = 52,
  close_age_weeks   = 65,
  why_it_matters    = 'Lead exposure has no safe level in children. Even low blood lead levels are associated with reduced IQ, attention difficulties, and behavioral problems. Lead exposure comes from old paint (homes built before 1978), contaminated soil, old plumbing, and some imported toys. The AAP recommends a verbal lead risk assessment for all children at 12 and 24 months. Universal blood testing is only required for children in high-prevalence areas or enrolled in Medicaid — for all others, a blood draw is ordered only if the verbal assessment identifies risk factors.',
  what_to_do        = '* Ask your pediatrician about lead screening at the 12 month visit if it has not been offered
* If you live in an older home or have concerns about your water pipes, mention this explicitly
* The test is a simple blood draw or finger prick',
  what_not_to_worry = 'A result at or near the detection limit is not a crisis. The goal is identifying elevated levels early, when dietary and environmental interventions are most effective.',
  missed_window     = 'If your child has not been screened by 24 months and you live in an older home or high risk area, request a blood lead test at the next visit. The test is simple and quick, and most results come back normal. Catching anything early makes treatment straightforward.',
  source_citation   = 'AAP Council on Environmental Health (2016); CDC Blood Lead Reference Value; AAP Council on Environmental Health; CDC Childhood Lead Poisoning Prevention',
  updated_at        = now()
  WHERE slug = 'screening-blood-lead';

-- screening-dental-first-visit
UPDATE milestone_windows SET
  title             = 'First dental visit, at first tooth, or by 12 months',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 17,
  peak_age_weeks    = 26,
  close_age_weeks   = 52,
  why_it_matters    = 'The AAPD (American Academy of Pediatric Dentistry) recommends the first dental visit when the first tooth appears or by 12 months, whichever comes first. Baby teeth matter. Tooth decay in infants and toddlers is the most common chronic disease in children, five times more prevalent than asthma. Early decay causes pain, affects eating, affects speech development, and predicts poor adult dental health. The first visit is as much about parent education as it is about the child''s teeth. One important myth to correct: teething does not cause a true fever. It may cause a very slight temperature elevation, but any temperature of 100.4°F (38°C) or higher is a sign of illness — not teething — and warrants a call to your pediatrician.',
  what_to_do        = '* Schedule when the first tooth appears, don''t wait until 12 months if teeth arrive early
* Wipe gums with a soft damp cloth before teeth arrive. Once the first tooth erupts, switch immediately to a soft-bristled infant toothbrush.
* Use a rice-grain smear of fluoride toothpaste from the first tooth — fluoride is safe and recommended from day one of brushing. Increase to a pea-sized amount at age 3.
* Night bottles of milk or juice after teeth appear: a leading cause of early childhood tooth decay
* Never use amber teething necklaces or bracelets — the FDA and AAP warn they offer no proven pain relief and pose a severe risk of strangulation and choking
* Never use topical numbing gels (like Orajel/benzocaine) or homeopathic teething tablets — the FDA warns these can cause severe, potentially fatal oxygen depletion in infants. For teething discomfort: a firm rubber teething ring or a cold damp washcloth.',
  what_not_to_worry = 'The first dental visit is brief and non invasive. It''s primarily about checking tooth eruption, discussing oral hygiene, and setting habits.',
  missed_window     = 'If your child is past 12 months without a dental visit, schedule one now. It''s never too late to start, and a first appointment is quick and low key. Getting into a routine early sets good habits for years to come.',
  source_citation   = 'AAPD Guideline on Infant Oral Health (2022); AAP Oral Health Guidelines; AAPD Policy on Early Childhood Caries; AAP Clinical Guidance on Teething and Fever; FDA Safety Communication & AAP Warning on Teething Necklaces; AAP & AAPD Clinical Guidelines on Fluoride Use in Early Childhood; FDA Safety Communication on Benzocaine & Homeopathic Teething Products',
  updated_at        = now()
  WHERE slug = 'screening-dental-first-visit';

-- screening-hearing-rescreen
UPDATE milestone_windows SET
  title             = 'Hearing re screen if any concern arises',
  urgency           = 'screening',
  priority          = 2,
  open_age_weeks    = 0,
  peak_age_weeks    = 52,
  close_age_weeks   = 156,
  why_it_matters    = 'Passing the newborn hearing screen does not guarantee lifetime normal hearing. Hearing loss can develop in the first years of life due to chronic ear infections (otitis media with effusion), genetic factors, or illness. Any parent concern about hearing should be taken seriously and acted upon promptly.',
  what_to_do        = '* If you have any doubt about your child''s hearing at any age, ask for a referral to audiology
* Signs to watch for: not responding to their name, not startling to loud sounds, significant speech delay, frequently asking "what?" or turning up the TV volume
* Three or more ear infections in one year is a risk factor for hearing impact',
  what_not_to_worry = 'Children with temporary hearing loss from fluid in the middle ear (glue ear) often catch up fully once the fluid resolves. Persistent concerns warrant formal audiological evaluation regardless.',
  missed_window     = 'If you have a nagging feeling that your child''s hearing is not quite right, act on it. Audiological evaluations are non invasive, and identifying any concerns early means you can get the right support in place quickly. Most hearing concerns are very manageable when caught and addressed early.',
  source_citation   = 'JCIH Position Statement (2019); AAP Hearing Screening Guidelines',
  updated_at        = now()
  WHERE slug = 'screening-hearing-rescreen';

-- screening-newborn-bilirubin
UPDATE milestone_windows SET
  title             = 'Newborn bilirubin (jaundice) check',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 1,
  close_age_weeks   = 2,
  why_it_matters    = 'Newborn jaundice, yellowing of skin and eyes, affects 60% of term newborns. Most cases are benign and resolve within 1–2 weeks. Severe untreated jaundice can cause brain damage (kernicterus). The standard is to check bilirubin levels before discharge and schedule follow-up based on your baby''s specific bilirubin risk zone at discharge — timing is individualized, not a universal 48-hour rule. Ask your care team exactly when your baby''s follow-up should be.',
  what_to_do        = '* Confirm bilirubin was checked before hospital discharge
* If discharged early (under 48 hours): ensure a follow up is scheduled within 48 hours of discharge
* Warning signs of severe jaundice: yellow color spreading to the belly or limbs, extreme sleepiness, difficulty feeding',
  what_not_to_worry = 'Mild jaundice visible only in the face and chest in the first week, with a baby who is feeding well and alert, is common and usually self resolving.',
  missed_window     = 'If severe jaundice signs appear after discharge: contact your pediatrician or emergency care immediately. Treatment for jaundice is very effective when caught early.',
  source_citation   = 'AAP Hyperbilirubinemia Management Guidelines (2022); Pediatrics, Newborn Bilirubin Screening; AAP Clinical Practice Guideline Revision: Management of Hyperbilirubinemia in the Newborn Infant 35 or More Weeks of Gestation (2022)',
  updated_at        = now()
  WHERE slug = 'screening-newborn-bilirubin';

-- screening-newborn-blood-spot
UPDATE milestone_windows SET
  title             = 'Newborn metabolic / blood spot screen',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 1,
  why_it_matters    = 'The newborn blood spot screen (heel prick) tests for 30+ serious metabolic, hormonal, and genetic conditions, including PKU, congenital hypothyroidism, cystic fibrosis, and sickle cell disease. Most of these conditions are treatable when caught early and devastating when missed. This is one of the highest value medical interventions in pediatrics.',
  what_to_do        = '* The test is done in the hospital, usually 24–48 hours after birth
* If you are discharged early and the heel prick is done before your baby is 24 hours old, the test must be repeated at your pediatrician''s office 1 to 2 weeks later — early testing can miss some metabolic conditions that require milk feeds to show up.
* Results come back within 1–2 weeks, ask your pediatrician if you haven''t heard back
* If any results are flagged: follow up immediately and ask for a clear explanation of what''s being tested',
  what_not_to_worry = 'Most abnormal initial results are false positives that resolve on repeat testing.',
  missed_window     = 'If the hospital screen was missed: schedule it with your pediatrician or state health department immediately. The test is quick and widely available.',
  source_citation   = 'AAP Newborn Screening Policy; March of Dimes Newborn Screening Guidelines; ACMG Guidelines',
  updated_at        = now()
  WHERE slug = 'screening-newborn-blood-spot';

-- screening-newborn-hearing
UPDATE milestone_windows SET
  title             = 'Newborn hearing screen, before hospital discharge',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 1,
  why_it_matters    = '1–3 per 1,000 babies are born with permanent hearing loss. Early detection, before 3 months, and early intervention, before 6 months, produces dramatically better language outcomes than detection at 12 or 18 months. The screen is painless, takes 10 minutes, and is done in the hospital.',
  what_to_do        = '* Confirm with the nursing staff that the hearing screen has been scheduled before discharge
* If your baby doesn''t pass: a refer result does not mean hearing loss, it means another test is needed. Follow up within one month.
* If your baby fails the screen, ask your pediatrician whether they should be tested for congenital CMV — this test must be done within the first 21 days of life to be accurate, and catching it early allows for antiviral treatment that can prevent hearing loss from worsening.',
  what_not_to_worry = 'A "refer" result at the newborn screen is common and usually resolves with a repeat test. It is not a diagnosis.',
  missed_window     = 'If the hospital screen was missed: schedule an outpatient audiology test as soon as possible. The goal is confirmation of normal hearing before 3 months, and most outpatient audiology clinics can see newborns quickly.',
  source_citation   = 'JCIH Year 2019 Position Statement; AAP Universal Newborn Hearing Screening Policy; AAP Clinical Report on Congenital Cytomegalovirus Infection',
  updated_at        = now()
  WHERE slug = 'screening-newborn-hearing';

-- screening-vision-12months
UPDATE milestone_windows SET
  title             = 'Vision screening at the 12 month visit',
  urgency           = 'screening',
  priority          = 2,
  open_age_weeks    = 52,
  peak_age_weeks    = 52,
  close_age_weeks   = 65,
  why_it_matters    = 'Early identification of vision problems (amblyopia, strabismus, refractive errors) is critical because the visual system is still developing through age 7 to 8. Problems identified and treated before age 3 have significantly better outcomes than those caught at school entry. Basic vision assessments (checking tracking and red reflex) happen at every well-child check from birth. Instrument-based vision screening (photo-screening) begins between 12 and 24 months — this is the more formal screen for amblyopia, strabismus, and refractive errors.',
  what_to_do        = '* At the 12 month visit, ensure a vision check is included, ask if it was not offered
* Note any eye turning, excessive squinting, or asymmetry in how the eyes move
* If there is a family history of eye conditions, mention it explicitly',
  what_not_to_worry = 'Eye crossing that resolved in the first few months of life is normal. Persistent or new eye turning after 4 months is what warrants attention.',
  missed_window     = 'If vision screening was not done at 12 months, ask for it at the next visit. Alternatively, request a referral to a pediatric ophthalmologist if you have any concerns. Vision conditions found early respond very well to treatment, and there is still plenty of time in the development window.',
  source_citation   = 'AAP Vision Screening Policy (2016); AAPOS Guidelines; AAP Bright Futures Periodicity Schedule (2024)',
  updated_at        = now()
  WHERE slug = 'screening-vision-12months';

-- screening-visit-12months
UPDATE milestone_windows SET
  title             = '12 month well child visit',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 52,
  peak_age_weeks    = 52,
  close_age_weeks   = 54,
  why_it_matters    = 'The 12 month visit is one of the most important in the first year. It assesses walking, first words, pointing, social engagement, and the transition to whole cow''s milk. Vaccines: MMR, varicella, hepatitis A (dose 1), PCV booster (dose 4), Hib (dose 4).',
  what_to_do        = '* Track words before the visit: how many specific, consistent words does your child have?
* Note pointing behavior, pointing to share interest (declarative) is key
* Transition to whole cow''s milk discussion',
  missed_window     = '* How many words should they have by 15 months?
* Is pointing happening?
* When should we expect walking?',
  source_citation   = 'AAP Periodicity Schedule 2024; CDC 12 Month Milestones',
  updated_at        = now()
  WHERE slug = 'screening-visit-12months';

-- screening-visit-15months
UPDATE milestone_windows SET
  title             = '15 month well child visit',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 65,
  peak_age_weeks    = 65,
  close_age_weeks   = 67,
  why_it_matters    = 'The 15 month visit assesses walking, word count (target: 10+ words), pointing, and social engagement. It''s a critical checkpoint for early identification of language delay and motor delay. Vaccines: DTaP (dose 4), Hib (dose 4 if needed), PCV (dose 4), influenza (annual).',
  what_to_do        = '* Count your child''s words before the visit
* Note whether they''re walking independently — most children walk by 15 months, with 18 months the clinical red flag per CDC 2022
* Mention any concerns about language, behavior, or social engagement',
  missed_window     = '* Is language development on track?
* Should we be concerned about [any specific behavior]?
* What milestones are next?',
  source_citation   = 'AAP Periodicity Schedule 2024; CDC 15 Month Milestones (2022 update)',
  updated_at        = now()
  WHERE slug = 'screening-visit-15months';

-- screening-visit-18months-autism
UPDATE milestone_windows SET
  title             = '18 month well child visit + M-CHAT autism screen',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 78,
  peak_age_weeks    = 78,
  close_age_weeks   = 80,
  why_it_matters    = 'The 18 month visit is the first formal autism screening, typically using the M-CHAT-R/F or an equivalent standardized tool. (M-CHAT is used widely across US, Australia, and internationally; your provider may use a different validated instrument.) It also assesses vocabulary (target: 10–20 words), two word combinations emerging, walking, and behavior. The M-CHAT is not a diagnosis, it identifies children who need further evaluation. Early identification before 24 months produces substantially better outcomes. Vaccines: hepatitis A (dose 2 if not given), influenza.',
  what_to_do        = '* Complete the M-CHAT questionnaire honestly, don''t answer what you wish were true
* Prepare observations: name response, pointing, vocabulary count, eye contact, social engagement
* If the M-CHAT indicates follow up: take it seriously and move quickly. Earlier evaluation means better outcomes.',
  missed_window     = '* What does the M-CHAT result mean?
* Should we see a speech language pathologist?
* What are the signs I should watch for between now and 24 months?',
  source_citation   = 'AAP Autism Screening Policy; Robins et al. (2014), M-CHAT R/F Validation; CDC Autism Screening Guidelines',
  updated_at        = now()
  WHERE slug = 'screening-visit-18months-autism';

-- screening-visit-24months-autism
UPDATE milestone_windows SET
  title             = '24 month well child visit + autism screen',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 104,
  peak_age_weeks    = 104,
  close_age_weeks   = 106,
  why_it_matters    = 'The 24 month visit includes a second autism screen (M-CHAT-R/F or an equivalent standardized tool). It also assesses vocabulary (target: 50+ words), two word combinations, social play, and the tantrum pattern. This is the most comprehensive developmental assessment in the first two years and often the first time significant language delay becomes clearly visible.',
  what_to_do        = '* Complete the developmental questionnaire accurately
* Be direct about concerns, this is not the time to minimize
* If there are language or social concerns: ask for a speech evaluation referral today',
  missed_window     = '* Is language development on track?
* Should we pursue a speech evaluation?
* What''s the waitlist situation for speech therapy referrals?',
  source_citation   = 'AAP Autism Screening Policy; CDC 24 Month Milestones; M-CHAT R/F',
  updated_at        = now()
  WHERE slug = 'screening-visit-24months-autism';

-- screening-visit-2months
UPDATE milestone_windows SET
  title             = '2 month well child visit',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 8,
  peak_age_weeks    = 8,
  close_age_weeks   = 10,
  why_it_matters    = 'The 2 month visit is a developmental milestone check and the start of the vaccination schedule. Vaccines given at 2 months: DTaP, Hib, PCV15 or PCV20, rotavirus, polio, hepatitis B (dose 2), and RSV immunization (Nirsevimab/Beyfortus, if your baby is entering their first RSV season and you did not receive the maternal RSV vaccine during pregnancy). The developmental assessment covers social smile, cooing, head control, and visual tracking.',
  what_to_do        = '* Schedule on time, vaccines are timed to the immune system''s development
* Expect fussiness and mild fever for 24–48 hours after vaccines — this is normal. For infants under 3 months, always take temperature rectally: forehead, ear, and underarm thermometers are not reliable enough at this age. A rectal temperature of 100.4°F (38°C) or higher requires a call to your pediatrician.
* Ask about tummy time progress and what to expect before the 4 month visit',
  missed_window     = '* Is development on track?
* Should we start vitamin D drops if breastfeeding?
* What should we expect at 4 months?',
  source_citation   = 'AAP Periodicity Schedule 2024; CDC Immunization Schedule 2024; CDC & AAP RSV Immunization Guidelines (Updated 2023/2024); AAP Clinical Report on Fever and Antipyretic Use in Children; AAP & CDC Immunization Guidelines on Managing Side Effects; AAP Clinical Guidelines on Fever and Antipyretic Use',
  updated_at        = now()
  WHERE slug = 'screening-visit-2months';

-- screening-visit-30months
UPDATE milestone_windows SET
  title             = '30 month well child visit, developmental screen',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 130,
  peak_age_weeks    = 130,
  close_age_weeks   = 132,
  why_it_matters    = 'The 30 month visit was added to the AAP schedule specifically for developmental surveillance. It assesses 3 word sentences, cooperative play, comprehension, and behavior. The gap between 24 months and 36 months is long enough that language delays can become significantly entrenched. The 30 month visit catches issues while intervention is still highly effective.',
  what_to_do        = '* Note sentence length: most 30 month olds use 3 word sentences regularly
* Note social behavior: does your child play with, not just alongside, other children?
* Bring any concerns about behavior, tantrums, sleep, or language',
  missed_window     = '* Is speech development on track?
* When should tantrums start to reduce?
* What does school readiness look like?',
  source_citation   = 'AAP Periodicity Schedule 2024 (30 month addition); CDC 30 Month Milestones',
  updated_at        = now()
  WHERE slug = 'screening-visit-30months';

-- screening-visit-36months
UPDATE milestone_windows SET
  title             = '36 month well child visit',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 156,
  peak_age_weeks    = 156,
  close_age_weeks   = 158,
  why_it_matters    = 'The 36 month visit marks the end of the most intensive developmental surveillance period. It assesses full sentences (4+ words), imaginative play, social skills, potty training readiness/progress, and school readiness. It''s also a preview of the annual well child schedule that begins at age 3. Vaccines: DTaP (dose 5), MMR (dose 2), varicella (dose 2), IPV (dose 4), influenza.',
  what_to_do        = '* Discuss potty training if not already completed, the window is open
* Note whether your child''s speech is understood by unfamiliar adults (~75% understandable is the target)
* Ask about preschool readiness if relevant',
  missed_window     = '* Is speech development on track for school entry?
* Should we be concerned about [any specific behavior]?
* What should we focus on before age 4?',
  source_citation   = 'AAP Periodicity Schedule 2024; CDC 36 Month Milestones',
  updated_at        = now()
  WHERE slug = 'screening-visit-36months';

-- screening-visit-3to5-days
UPDATE milestone_windows SET
  title             = 'First pediatrician visit, 3 to 5 days',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 1,
  close_age_weeks   = 1,
  why_it_matters    = 'The 3–5 day visit is primarily about weight. Newborns lose up to 10% of their birth weight in the first days and should be back to birth weight by 10–14 days. This visit confirms the baby is regaining weight, feeding is working, jaundice is resolving, and the family is coping. It''s a safety net, not a social call.',
  what_to_do        = '* Schedule before discharge from the hospital
* Track feeding: number of feeds per day, duration, wet and dirty diapers (a good proxy for intake)
* Write down your questions, the first week is chaotic, and you will forget them',
  missed_window     = '* Is weight gain on track?
* Is feeding working, how do we know?
* What warning signs should bring us back sooner?',
  source_citation   = 'AAP Periodicity Schedule 2024; AAP Newborn Discharge Guidelines',
  updated_at        = now()
  WHERE slug = 'screening-visit-3to5-days';

-- screening-visit-4months
UPDATE milestone_windows SET
  title             = '4 month well child visit',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 17,
  peak_age_weeks    = 17,
  close_age_weeks   = 19,
  why_it_matters    = 'The 4 month visit covers head control, rolling readiness, responsive feeding, and iron supplementation for breastfed babies. Vaccines: DTaP (dose 2), Hib (dose 2), PCV (dose 2), rotavirus (dose 2), polio (dose 2). This is also when the 4 month sleep regression is typically discussed.',
  what_to_do        = '* Ask specifically about iron supplementation if breastfeeding
* Discuss the 4 month sleep regression and what''s coming
* Ask about solid food readiness signs to watch for',
  missed_window     = '* When should we start solid foods?
* Should we start iron drops?
* What are the signs of the 4 month sleep regression?',
  source_citation   = 'AAP Periodicity Schedule 2024; AAP Iron Supplementation Guidance',
  updated_at        = now()
  WHERE slug = 'screening-visit-4months';

-- screening-visit-6months
UPDATE milestone_windows SET
  title             = '6 month well child visit',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 26,
  peak_age_weeks    = 26,
  close_age_weeks   = 28,
  why_it_matters    = 'The 6 month visit assesses sitting with support, babbling, hand to hand transfer, and object permanence emerging. It''s also the green light for solid food introduction and the first flu vaccine. Vaccines: DTaP (dose 3), Hib (dose 3), PCV (dose 3), polio (dose 3), rotavirus (dose 3, depending on brand), influenza (annual), hepatitis B (dose 3).',
  what_to_do        = '* Bring the solid food questions, this is the right time to ask about puree progression and allergen introduction
* Ask about the peanut introduction protocol for your baby specifically (eczema history, family allergy history)',
  missed_window     = '* Is babbling on track?
* How do we introduce allergens?
* What are the signs of peanut allergy?',
  source_citation   = 'AAP Periodicity Schedule 2024; AAP Early Allergen Introduction Guidance; CDC Childhood Immunization Schedule (2024)',
  updated_at        = now()
  WHERE slug = 'screening-visit-6months';

-- screening-visit-9months
UPDATE milestone_windows SET
  title             = '9 month well child visit, developmental surveillance',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 39,
  peak_age_weeks    = 39,
  close_age_weeks   = 41,
  why_it_matters    = 'The 9 month visit is the first formal developmental screening using a standardized tool (ASQ or similar). It assesses sitting independently, pulling to stand, babbling, responding to name, and early social engagement. No vaccines at this visit typically. This visit is where early joint attention behaviors first become clinically observable — following a point, sharing gaze, and showing objects to a caregiver.',
  what_to_do        = '* Complete any pre visit developmental questionnaire the practice sends (ASQ 3 is common)
* Bring specific behavioral observations: does the baby respond to their name? Point at things?',
  missed_window     = '* Is responding to name where it should be?
* What social emotional milestones should we see before 12 months?
* When should first words appear?',
  source_citation   = 'AAP Periodicity Schedule 2024; ASQ 3 Developmental Screening',
  updated_at        = now()
  WHERE slug = 'screening-visit-9months';

-- self-help-daytime-dryness
UPDATE milestone_windows SET
  title             = 'Daytime dryness established, the finish line for potty training',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 120,
  peak_age_weeks    = 130,
  close_age_weeks   = 143,
  why_it_matters    = 'Most children achieve consistent daytime dryness, fewer than one accident per day on most days, between 24 and 33 months. This is the functional endpoint of daytime potty training. Nighttime dryness comes later and is a separate milestone entirely (many children are not reliably dry at night until age 5 or 6, which is normal). By 33 months, if daytime dryness is not yet established, it is worth discussing with a pediatrician. This is not because something is necessarily wrong, but to review technique, readiness factors, and rule out physical contributors.',
  what_to_do        = '* If training is complete: maintain consistency in routine, especially at transitions (leaving the house, before nap, before bed)
* If still in progress: review the readiness checklist from the potty training window. If readiness signs are present but training is stalling, try a fresh three day intensive approach
* Accidents are normal throughout this period, respond calmly, clean up together, no shame or punishment
* Nighttime training is a separate milestone. Pull-ups or training pants at night are fine indefinitely at this age',
  what_not_to_worry = 'Nighttime accidents past age 3 are completely normal and are not a sign of failed training. Focus only on daytime dryness at this stage.',
  missed_window     = 'If your 33 month old has not begun showing any signs of toilet training progress despite months of effort and clear readiness signs, mention it at the next visit. Rarely, physical factors such as constipation, urinary tract issues, or sensory sensitivities are contributing. These are treatable once identified, and many families find that one simple change makes all the difference.',
  source_citation   = 'Brazelton (1962) child-led toilet training; AAP Toilet Training Guidelines; American Urogynecologic Society; FamilyForce Potty Training Playbook',
  updated_at        = now()
  WHERE slug = 'self-help-daytime-dryness';

-- self-help-dressing-simple-clothes
UPDATE milestone_windows SET
  title             = 'Dressing independently with simple clothes',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 135,
  peak_age_weeks    = 147,
  close_age_weeks   = 152,
  why_it_matters    = 'Between 31 and 35 months, most children can put on simple clothing independently: a shirt pulled over the head, pants with an elastic waist, socks, and velcro shoes. This is a significant independence milestone with practical implications, it is also a preschool readiness requirement. Children who can dress themselves have meaningfully more autonomy and self-confidence in the morning routine and in group care settings.',
  what_to_do        = '* Start with the easiest items: loose pants and socks. Let them try while you narrate.
* Teach front-from-back with a simple cue: "tag goes in the back"
* Put out tomorrow''s clothes the night before and let them get dressed independently in the morning. This removes time pressure
* Avoid buttons, snaps, and laces during the learning phase. Elastic and velcro only.',
  what_not_to_worry = 'Clothes on backward and inside out are fine. The goal right now is independent execution, not wardrobe accuracy. Correct it calmly if needed.',
  missed_window     = 'No ability to put on any clothing independently by 36 months may indicate fine motor differences worth discussing at the 36 month visit. Fine motor skills respond well to practice and, where needed, early occupational therapy support.',
  source_citation   = 'Gesell Developmental Schedules; AAP Developmental Milestones',
  updated_at        = now()
  WHERE slug = 'self-help-dressing-simple-clothes';

-- self-help-open-cup
UPDATE milestone_windows SET
  title             = 'Transition off the sippy cup to an open cup',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 57,
  peak_age_weeks    = 69,
  close_age_weeks   = 74,
  why_it_matters    = 'The AAP recommends transitioning away from sippy cups by 18 months. Prolonged sippy cup use encourages a sucking pattern that is different from normal cup drinking, can affect dental arch development, and keeps children reliant on a vessel they should be outgrowing. The open cup builds true oral motor coordination.',
  what_to_do        = '* Introduce a small, weighted open cup or a straw cup at one meal per day to start
* Expect spills and keep portions small. an inch of water is plenty for practice
* Let them hold it themselves even if it means a wet shirt; that is how it is learned
* Keep the sippy for on-the-go if needed but phase it out at the table',
  what_not_to_worry = 'Mess is part of the process. A 14 month old who spills constantly at cup practice is not behind, they are learning the physics of liquid.',
  missed_window     = 'If your child is still exclusively on a sippy cup past 18 months, make the switch. Most children adapt within a week or two with consistent practice.',
  source_citation   = 'AAP Pediatric Nutrition; AAPD Oral Health Guidelines',
  updated_at        = now()
  WHERE slug = 'self-help-open-cup';

-- self-help-potty-readiness
UPDATE milestone_windows SET
  title             = 'Potty training readiness. signs to watch for before you start',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 79,
  peak_age_weeks    = 95,
  close_age_weeks   = 113,
  why_it_matters    = 'Most children show readiness signs between 18 and 24 months, though the range runs from 18 to 36 months. Starting before a child is ready leads to a longer, more frustrating process with more accidents and more resistance. Waiting for readiness signs. rather than starting at a fixed age. is the single most reliable predictor of a faster, lower-conflict potty training experience. This is also the foundation of FamilyForce''s potty training playbook.',
  what_to_do        = '* Watch for the key readiness signs: staying dry for 2 or more hours, showing awareness of going — telling you before, during, or just after is all a good sign, showing interest in the toilet or underwear, being able to follow simple two-step instructions, and being able to pull pants up and down
* Do not start if the child cannot yet signal need. early training without signaling is toilet timing, not training
* Begin talking about the toilet naturally: let them see you use it, name body parts, read potty books
* Buy a floor potty and leave it out without pressure; familiarity reduces fear when training begins',
  what_not_to_worry = 'Later is not worse. A child who trains at 30 months trains faster than one started at 18 months who was not ready. The goal is readiness, not speed.',
  missed_window     = 'If no readiness signs are present by 30 months, mention it at the next visit. Delay in readiness can occasionally indicate sensory processing differences or developmental factors worth reviewing.',
  source_citation   = 'Brazelton child-led approach (1962); AAP Toilet Training Guidelines; FamilyForce Potty Training Playbook',
  updated_at        = now()
  WHERE slug = 'self-help-potty-readiness';

-- self-help-self-dressing-assist
UPDATE milestone_windows SET
  title             = 'Helping with getting dressed. arms through sleeves, pulling up pants',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 70,
  peak_age_weeks    = 78,
  close_age_weeks   = 86,
  why_it_matters    = 'Most children begin actively cooperating with dressing around 17 to 20 months, rather than going limp or squirming away. They push an arm through a sleeve, lift a foot for a sock, attempt to pull pants up. These are not just self-help skills. they are early steps in physical self-awareness, sequencing, and independence. Encouraging them now builds the groundwork for full dressing independence at 3 to 4 years.',
  what_to_do        = '* Narrate each step: "Now we put this arm through here. Your turn. can you push your arm through?"
* Give them the final step: start the sock yourself, then let them pull it up the last inch
* Use loose, easy clothing. elastic waists, stretchy materials. to reduce frustration
* Celebrate every attempt: "You helped get dressed today!"',
  what_not_to_worry = 'Speed is not the point at this stage. A five-minute dressing routine that involves the child is more valuable than a 90-second routine done entirely by the parent.',
  missed_window     = 'No clinical concern if assistance takes longer to emerge. Some toddlers cooperate readily at 17 months, others not until 22 months. Wide normal range.',
  source_citation   = 'Gesell Institute of Child Development; AAP',
  updated_at        = now()
  WHERE slug = 'self-help-self-dressing-assist';

-- self-help-tooth-brushing
UPDATE milestone_windows SET
  title             = 'Tooth brushing, child takes a turn',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 117,
  peak_age_weeks    = 130,
  close_age_weeks   = 139,
  why_it_matters    = 'The American Academy of Pediatric Dentistry recommends brushing from the first tooth, done by the parent with a rice-grain amount of fluoride toothpaste. Most children are ready to hold the brush and take a turn around 27 to 32 months. This is not just oral hygiene. It is a lifelong habit being formed. Children who brush independently (with supervision) from this age have significantly better dental outcomes than those who are passive recipients.',
  what_to_do        = '* Let the child brush first, then the parent does a thorough second pass. Starting with the child''s turn honors their autonomy and makes cooperation much easier. Their technique alone is not sufficient — the parent''s pass is non-negotiable.
* Let them pick their toothbrush (character brushes work) and their toothpaste flavor
* Make it a routine, not a battle: same time, same sequence, every day
* Electric toothbrushes are fine and often more effective at this age than manual',
  what_not_to_worry = 'The child''s brushing will be inadequate for years. That is fine. You are building the habit and the comfort, not relying on their technique.',
  missed_window     = 'If your child has significant tooth brushing resistance past 36 months, discuss with your pediatric dentist. Sensory-based resistance to brushing is real and treatable, and your pediatric dentist can help with practical strategies that make brushing easier for both of you.',
  source_citation   = 'AAPD Periodicity Guidelines; AAP Bright Futures Dental Guidelines',
  updated_at        = now()
  WHERE slug = 'self-help-tooth-brushing';

-- self-help-undressing-independently
UPDATE milestone_windows SET
  title             = 'Undressing independently, socks, shoes, and loose pants',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 113,
  peak_age_weeks    = 121,
  close_age_weeks   = 126,
  why_it_matters    = 'Most children develop the fine motor ability to undress themselves around 26 to 29 months: pulling off socks, removing shoes (especially velcro), and pulling down loose pants. Undressing always precedes dressing. It requires less precision. This is a practical independence skill and is directly relevant to toilet training, where the ability to pull pants down quickly matters a great deal.',
  what_to_do        = '* Let them undress themselves at bath time and bedtime, it takes longer but builds the skill
* Velcro shoes and elastic waists are the right starting equipment
* Break it into steps and let them do the last part first: you loosen the shoe, they pull it off
* Praise the effort: "You took your sock off all by yourself!"',
  what_not_to_worry = 'Dressing takes much longer to develop than undressing. A child who can take clothes off but struggles to put them on is normal and developmentally correct.',
  missed_window     = 'No ability to remove any clothing by 30 months may indicate fine motor differences worth reviewing at the next visit. With targeted support, most children catch up quickly, and there are many fun activities that build these skills in the meantime.',
  source_citation   = 'Gesell Developmental Schedules; AAP Developmental Milestones',
  updated_at        = now()
  WHERE slug = 'self-help-undressing-independently';

-- social-bedtime-routine-security
UPDATE milestone_windows SET
  title             = 'Consistent bedtime routine builds emotional security',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 12,
  peak_age_weeks    = 17,
  close_age_weeks   = 52,
  why_it_matters    = 'A predictable bedtime routine (bath, book, song, bed, always in the same order) reduces cortisol levels in children before sleep, shortens the time it takes to fall asleep, and improves sleep quality. Research by Mindell et al. found that a consistent 3 to 4 step bedtime routine produced measurable sleep improvements within one week. The routine signals safety: what happens next is predictable, and predictability is the foundation of emotional security.',
  what_to_do        = '* Choose 3 to 4 steps that work for your family and do them in the same order every night
* Keep the routine under 30 minutes to prevent overtiredness
* Both parents should be able to execute the same routine so there is no dependency on one person',
  what_not_to_worry = 'The specific activities matter less than the consistency. "Bath, book, bed" is as effective as any elaborate version.',
  missed_window     = 'It is never too late to establish a bedtime routine. Even starting at 12 months produces measurable improvement within days to weeks.',
  source_citation   = 'Mindell et al. (2009), Bedtime Routine Study; AAP Sleep Guidelines',
  updated_at        = now()
  WHERE slug = 'social-bedtime-routine-security';

-- social-caregiver-transition
UPDATE milestone_windows SET
  title             = 'Caregiver and daycare transition, making it easier',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 4,
  peak_age_weeks    = 26,
  close_age_weeks   = 52,
  why_it_matters    = 'Transitions to new caregivers or daycare are among the most stressful events of the first two years for both parent and child. How the transition is handled significantly affects the child''s adjustment. A gradual, supported transition produces faster settling and better long term outcomes than an abrupt start.',
  what_to_do        = '* Start with short periods at the new setting: 1 to 2 hours, then build up over 1 to 2 weeks
* Bring a comfort object from home that smells like a parent
* Establish a consistent goodbye ritual: same words, same hug, same quick exit',
  what_not_to_worry = 'Crying at drop off is not evidence of trauma. Most children settle within minutes after the parent leaves. The transition is harder for parents than it is for children in most cases.',
  missed_window     = 'If your child has been in daycare for several months and still does not settle within 10 minutes of drop off, talk to both the caregivers and your pediatrician. Most children do settle in time, and caregivers often have practical strategies that make a real difference.',
  source_citation   = 'Bowlby (1969); NICHD Study of Early Child Care (2003)',
  updated_at        = now()
  WHERE slug = 'social-caregiver-transition';

-- social-comforting-behavior
UPDATE milestone_windows SET
  title             = 'Comforting others, offering a hug or toy when someone seems sad',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 74,
  peak_age_weeks    = 82,
  close_age_weeks   = 95,
  why_it_matters    = 'Most toddlers begin showing early prosocial behavior around 17 to 22 months: patting a crying person, offering their own comfort object to someone who appears distressed, or attempting to wipe someone''s tears. This is not yet empathy in the adult sense. It is the earliest precursor to it. The child is registering emotional states in others and responding with a behavior intended to help. It is one of the most meaningful early social milestones, and one parents often miss because it appears spontaneous and brief.',
  what_to_do        = '* When you are mildly upset or pretend to be, name the emotion and observe the child''s response: "Oh, I bumped my knee. That hurt. I''m sad."
* If they approach or offer something, receive it warmly: "Thank you, that helped. You are so caring."
* Model comforting behavior explicitly: comfort a stuffed animal in front of them, narrate what you are doing
* Read books where characters help or comfort each other: "The Invisible String," "Llama Llama Red Pajama"',
  what_not_to_worry = 'Some children show comfort behaviors at 15 months, others not until 24 months. Wide normal range. A child who is engrossed in play when another person cries is not demonstrating a lack of empathy. They may simply not have noticed.',
  missed_window     = 'Complete absence of any prosocial or comfort response to others by 24 months, combined with limited eye contact and communication, is worth raising at the 24 month visit as part of the broader social emotional review. Raising it early means more options for support, and many children with social communication differences thrive with the right help.',
  source_citation   = 'Zahn-Waxler et al. (1992) prosocial development research; Eisenberg (2000) empathy development; AAP Social Emotional Milestones',
  updated_at        = now()
  WHERE slug = 'social-comforting-behavior';

-- social-consistent-discipline
UPDATE milestone_windows SET
  title             = 'Consistent, calm discipline approach',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 52,
  peak_age_weeks    = 65,
  close_age_weeks   = 156,
  why_it_matters    = 'Consistency is the single most important variable in discipline effectiveness. The approach itself (time outs, natural consequences, redirection, positive reinforcement) matters less than whether it is applied consistently. A child who receives the same response to a behavior every time learns quickly. A child who receives unpredictable responses continues to test because unpredictability is confusing.',
  what_to_do        = '* Agree on the approach with your co parent and apply it the same way every time
* State the limit clearly and calmly before enforcing it: "if you throw the food again, we will leave the table"
* Follow through. Every single time. Inconsistency teaches that limits are negotiable.',
  what_not_to_worry = 'The child will test the limit anyway. Consistent enforcement does not feel like it is working in the first week. It is. The behavior data shows improvement over 2 to 4 weeks of consistent response.',
  missed_window     = 'If discipline is chaotic or inconsistent in your household, starting a consistent approach at any age produces measurable improvement. The earlier the better, but it is always worth doing.',
  source_citation   = 'Patterson (1982), Coercive Family Process; Baumrind (1971), Authoritative Parenting; AAP Discipline Guidance',
  updated_at        = now()
  WHERE slug = 'social-consistent-discipline';

-- social-cooperative-play
UPDATE milestone_windows SET
  title             = 'Cooperative play begins, plays with other children',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 104,
  peak_age_weeks    = 117,
  close_age_weeks   = 156,
  why_it_matters    = 'Cooperative play (taking turns, following shared rules, working toward a common goal in play) emerges around 2.5 to 3 years. It requires theory of mind (understanding that others have their own thoughts and intentions) and enough self regulation to take turns. It is a significant social milestone and a predictor of school readiness.',
  what_to_do        = '* Arrange regular play with the same children so bonds and familiarity develop
* Simple structured games (rolling a ball back and forth) scaffold the turn taking concept
* Narrate: "now it is her turn. Now it is your turn."',
  what_not_to_worry = 'Conflict during early cooperative play is completely normal. Children are learning to negotiate for the first time. The conflict is the lesson.',
  missed_window     = 'If your 3 year old has no interest in playing with other children at all (not just near them), mention it at the 36 month visit. Many children warm up to cooperative play gradually, especially with familiar peers and structured games.',
  source_citation   = 'Parten (1932); Vygotsky (1978), Zone of Proximal Development; CDC',
  updated_at        = now()
  WHERE slug = 'social-cooperative-play';

-- social-empathy-emerging
UPDATE milestone_windows SET
  title             = 'Empathy emerging, shows concern when others are upset',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 78,
  peak_age_weeks    = 104,
  close_age_weeks   = 130,
  why_it_matters    = 'Most children begin to show genuine concern for others who are distressed around 18 to 24 months: offering a toy to a crying friend, patting a parent who looks sad. This is early empathy, and it is the foundation of prosocial behavior. It emerges from a consistent history of having their own emotions recognized and responded to.',
  what_to_do        = '* Acknowledge and respond to your child''s emotions consistently
* Label the emotions of people in books and real life: "the baby is crying because she is sad"
* Model empathic behavior toward others, children learn far more from watching than from being told',
  what_not_to_worry = 'Early empathy is inconsistent. A child may comfort their parent one day and ignore a crying friend the next. The behavior becoming more consistent over time is what matters.',
  missed_window     = 'Complete absence of any prosocial concern for others by 30 months is worth noting in the context of other social observations. Empathy continues to develop throughout early childhood, and consistent modeling and warm responses go a long way.',
  source_citation   = 'Zahn Waxler et al. (1992), Empathy Development Research; Hoffman (2000)',
  updated_at        = now()
  WHERE slug = 'social-empathy-emerging';

-- social-father-partner-bonding
UPDATE milestone_windows SET
  title             = 'Father and partner bonding, equally important from birth',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 26,
  why_it_matters    = 'Research consistently shows that active father and co parent involvement from birth predicts better cognitive, social, and emotional outcomes for children. Fathers who are involved from birth develop stronger attachment, more confidence as parents, and children who benefit from two distinct interaction styles. Rougher, more unpredictable play (more typical of fathers) builds the child''s stress regulation and risk tolerance in a different way than nurturing maternal interactions.',
  what_to_do        = '* The non birthing parent should handle at least one night feed per night from the beginning
* Skin to skin contact for co parents is as beneficial for them as for the birth parent
* Both parents should have regular independent time with the baby without the other present',
  what_not_to_worry = 'A partner who feels less confident than the primary caregiver is normal. Confidence comes from repetition. The answer is more solo time with the baby, not less.',
  missed_window     = 'If one parent has taken on almost all caregiving through the first 6 months, it is not too late to rebalance. Co parents who become more involved at 6 months still form strong attachments.',
  source_citation   = 'Lamb (1977), Paternal Involvement; Paquette (2004), Activation Relationship Theory; AAP',
  updated_at        = now()
  WHERE slug = 'social-father-partner-bonding';

-- social-gratitude-empathy-practice
UPDATE milestone_windows SET
  title             = 'Practice gratitude and empathy at the table',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 104,
  peak_age_weeks    = 117,
  close_age_weeks   = 195,
  why_it_matters    = 'Gratitude and empathy are teachable through repeated practice in low stakes, everyday contexts. Mealtime provides a consistent, captive setting for this. Research by Robert Emmons and others shows that children in families with regular gratitude practices show measurably higher wellbeing, prosocial behavior, and relationship quality by age 10. The mechanism is habit formation through repetition in early childhood.',
  what_to_do        = '* Introduce a simple mealtime ritual: one thing each person is grateful for today
* Name emotions at the table: "you look frustrated, what happened today?"
* Express genuine appreciation for the meal and for each other in simple terms',
  what_not_to_worry = 'Young children will give arbitrary or silly answers ("I am grateful for dinosaurs"). This is exactly right. The habit of pausing to notice good things is more important than the content of the answer.',
  missed_window     = 'This practice is most powerful when started early but remains valuable at any age. Starting now is not too late.',
  source_citation   = 'Emmons and McCullough (2003), Gratitude and Well Being Research; Eisenberg et al. (2006), Empathy in Childhood',
  updated_at        = now()
  WHERE slug = 'social-gratitude-empathy-practice';

-- social-imaginary-friends
UPDATE milestone_windows SET
  title             = 'Imaginary friends are normal and healthy',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 130,
  peak_age_weeks    = 156,
  close_age_weeks   = 195,
  why_it_matters    = 'Imaginary companions are a common and healthy feature of social development in 25 to 65% of children between ages 2.5 and 7. Research by Marjorie Taylor shows that children with imaginary friends are not lonely or confused about reality, they are often more socially skilled, better at perspective taking, and more creative than peers without imaginary friends. The imaginary friend is a safe space to practice social interaction.',
  what_to_do        = '* Engage with the imaginary friend playfully: "should we set a place at the table for them?"
* Do not dismiss or ridicule the imaginary companion
* Take it as a positive sign: it is evidence of active imagination, strong narrative capacity, and social rehearsal',
  what_not_to_worry = 'An imaginary friend who the child knows is not real is healthy. The concern (which is rare) would be a child who cannot distinguish their imaginary friend from reality or who is severely distressed when others do not acknowledge them.',
  missed_window     = 'There is no intervention needed for imaginary friends. Simply support and engage with the play.',
  source_citation   = 'Taylor (1999), Imaginary Companions and the Children Who Create Them; CDC; AAP',
  updated_at        = now()
  WHERE slug = 'social-imaginary-friends';

-- social-independence-me-do-it
UPDATE milestone_windows SET
  title             = 'Supporting the me do it phase safely',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 78,
  peak_age_weeks    = 91,
  close_age_weeks   = 130,
  why_it_matters    = 'The fierce insistence on doing things independently ("me do it!") that peaks around 18 to 24 months is not defiance, it is the emergence of autonomy, which is a healthy and necessary developmental drive. How parents respond to this phase shapes the child''s sense of competence and their relationship with effort. Allowing safe independent attempts, even slow or messy ones, builds confidence and persistence.',
  what_to_do        = '* Build extra time into routines so they can try things themselves: putting on shoes, carrying their cup
* Offer limited choices to support autonomy: "do you want the red shirt or the blue one?"
* When something is too dangerous: "you can do the zipper, I need to do the buckle"',
  what_not_to_worry = 'Everything taking twice as long is temporary. The investment in allowing independent attempts pays off in a more capable and confident 3 and 4 year old.',
  missed_window     = 'If your 2 year old shows no interest in doing anything for themselves and is passive about all tasks, it is worth discussing with your pediatrician. In most cases, a few small adjustments to the environment and routine can spark that independence quickly.',
  source_citation   = 'Erikson (1950), Autonomy vs Shame; Deci and Ryan, Self Determination Theory; AAP',
  updated_at        = now()
  WHERE slug = 'social-independence-me-do-it';

-- social-joint-attention
UPDATE milestone_windows SET
  title             = 'Pointing, joint attention',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 30,
  peak_age_weeks    = 56,
  close_age_weeks   = 78,
  why_it_matters    = 'Joint attention, pointing at something to share interest with you, then looking back to see your reaction, is one of the most important developmental milestones in the first year. It emerges around 9 months and is the foundation of language, social cognition, and learning. Babies who point more at 9–12 months have larger vocabularies at 18 months. Per updated CDC milestones, pointing to request something typically emerges by 15 months and pointing to share interest by 18 months. Absent pointing by 18 months is a key flag on the M-CHAT-R/F autism screening checklist.',
  what_to_do        = '* Point at things yourself, constantly: "Look, a dog." Then look at your baby to see if they follow your point
* When your baby points, respond immediately: name what they''re pointing at, share the moment
* Engage with whatever captures their attention, joint attention is about shared interest, not directed instruction',
  what_not_to_worry = 'There are two kinds of pointing: imperative (pointing to get something) and declarative (pointing to share). Declarative pointing, "look at that cool thing!", is the milestone that matters most and is the autism screening signal. Imperative pointing develops slightly earlier.',
  missed_window     = 'Pointing to request something typically emerges by 15 months; pointing to share interest by 18 months. If your child is not pointing at all by 18 months, raise it at that visit. This is a key item on the M-CHAT-R/F autism screening checklist.',
  source_citation   = 'Baron Cohen et al., Pointing as ASD Predictor; Carpenter et al. (1998), Joint Attention Research; CDC Developmental Milestones; AAP M-CHAT R/F Screening',
  updated_at        = now()
  WHERE slug = 'social-joint-attention';

-- social-label-big-feelings
UPDATE milestone_windows SET
  title             = 'Label big feelings out loud',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 52,
  peak_age_weeks    = 65,
  close_age_weeks   = 104,
  why_it_matters    = 'Naming emotions is one of the most important things a parent can do during the toddler years. When you say "you are so frustrated right now" during a meltdown, you are not just describing the situation, you are providing a cognitive framework that the child''s developing prefrontal cortex will use to process that emotion. Research by Matthew Lieberman showed that naming feelings literally reduces the intensity of the emotional response in the brain.',
  what_to_do        = '* Name the emotion before you redirect or problem solve: "I can see you are really angry. You wanted that toy."
* Use precise words: angry, frustrated, disappointed, excited, nervous, not just "upset"
* Label your own feelings too: "I am feeling impatient right now"',
  what_not_to_worry = 'You do not need the child to repeat the word back to you for this to work. The effect is neurological, not linguistic. You are rewiring their brain whether they acknowledge it or not.',
  missed_window     = 'This practice is valuable at any age. Starting now is never too late.',
  source_citation   = 'Lieberman et al. (2011); Gottman (1997); Zero to Three',
  updated_at        = now()
  WHERE slug = 'social-label-big-feelings';

-- social-named-friendships
UPDATE milestone_windows SET
  title             = 'Named friendships, "I want to play with Ella"',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 131,
  peak_age_weeks    = 139,
  close_age_weeks   = 147,
  why_it_matters    = 'Most children begin to form specific social preferences around 30 to 34 months, requesting particular children by name, showing excitement when they know a certain friend will be present, and expressing something that looks like genuine friendship. This is the emergence of selective social bonding beyond the family. It is one of the earliest signs of the social intelligence that will drive peer relationships throughout childhood.',
  what_to_do        = '* Take the preference seriously. If they ask for Ella, try to arrange it.
* Facilitate the playdate: same age, low-key, short (60 to 90 minutes), small numbers (one friend is enough)
* Stay nearby but let them navigate the social dynamic. Resist the urge to direct the play
* Debrief naturally afterward: "Did you have fun with Ella? What did you play?"',
  what_not_to_worry = 'Toddler friendships do not look like adult friendships. There will be disputes, toy grabs, and emotional exits. These are normal and are how social skills are learned.',
  missed_window     = 'No interest in any peer interaction by 36 months, not just preference but complete disinterest in other children, is worth noting at the 36 month visit. Social interest develops at different rates, and your pediatrician can help you understand what is typical for your child and offer the right next steps.',
  source_citation   = 'Hartup (1992) peer relations research; AAP Social Emotional Development',
  updated_at        = now()
  WHERE slug = 'social-named-friendships';

-- social-parallel-play
UPDATE milestone_windows SET
  title             = 'Parallel play, plays alongside other children',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 52,
  peak_age_weeks    = 65,
  close_age_weeks   = 104,
  why_it_matters    = 'Parallel play (playing near other children but not with them, doing similar activities independently) is the normal form of social play from age 1 to 3. It is not antisocial, it is the developmental precursor to cooperative play. Children in parallel play observe each other closely and learn through watching.',
  what_to_do        = '* Arrange playdates or park time with other children of similar age
* Do not force interaction, let proximity do the work
* Narrate what other children are doing: "Oliver is building a tower. What are you building?"',
  what_not_to_worry = 'A toddler who does not play with other children but plays near them is exactly on track. Cooperative play typically doesn''t emerge reliably until after age 3.',
  missed_window     = 'If your 3 year old completely avoids any proximity to other children or shows no interest in watching them, mention it at the 36 month visit. Most children this age engage socially in some way, and small supported play opportunities can make a big difference.',
  source_citation   = 'Parten (1932), Social Play Stages; AAP',
  updated_at        = now()
  WHERE slug = 'social-parallel-play';

-- social-parent-depression-screening
UPDATE milestone_windows SET
  title             = 'Parent mental health, screen for postpartum depression',
  urgency           = 'screening',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 6,
  close_age_weeks   = 26,
  why_it_matters    = 'Postpartum depression affects 1 in 5 mothers and 1 in 10 fathers. It is one of the most common and most under treated complications of childbirth. Untreated postpartum depression affects not just the parent but the child, studies consistently show that parental depression in the first year is associated with disruptions in attachment, language development, and emotional regulation in children. This is a screening window, not a judgment. The question is not whether you''re a good parent, it''s whether your brain chemistry is working against you.',
  what_to_do        = '* The Edinburgh Postnatal Depression Scale (EPDS) is the standard screening tool. The AAP recommends screening at the 1-, 2-, 4-, and 6-month well-child visits — not just once. If your provider doesn''t offer it, ask: "Can we do the postpartum depression screen today?"
* If you''re not screened: ask. Specifically: "Can I do the postpartum depression screen today?"
* Partners should also screen, paternal postpartum depression is real, underdiagnosed, and treatable',
  what_not_to_worry = 'Baby blues (tearfulness, emotional volatility in the first 2 weeks) are normal hormonal adjustment and resolve on their own. Postpartum depression is distinct: it persists beyond 2 weeks, and often involves more than sadness, anxiety, numbness, and disconnection are common presentations.',
  missed_window     = 'Postpartum depression can emerge up to 12 months after birth. If you are experiencing persistent low mood, anxiety, numbness, or difficulty connecting with your baby at any point in the first year, raise it with your OB or family doctor. Treatment is effective, and getting support benefits both you and your baby.',
  source_citation   = 'Edinburgh Postnatal Depression Scale (Cox et al., 1987); AAP Postpartum Depression Screening Guidelines; Paulson & Bazemore (2010), Paternal Postpartum Depression; AAP Clinical Report on Incorporating Recognition and Management of Perinatal Depression Into Pediatric Practice (2019)',
  updated_at        = now()
  WHERE slug = 'social-parent-depression-screening';

-- social-parent-self-care
UPDATE milestone_windows SET
  title             = 'Parent self care, the oxygen mask principle',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 52,
  why_it_matters    = 'A dysregulated parent cannot regulate a dysregulated child. A depleted parent cannot provide the consistent warmth and responsiveness that secure attachment requires. Parent wellbeing is directly connected to child wellbeing. This is not a self indulgent message. It is a developmental one.',
  what_to_do        = '* Identify the minimum self care that keeps you functional: sleep, food, one hour of quiet, movement
* Ask for help before you are in crisis, not after
* Accept offers of help. Declining help does not make you a better parent.',
  what_not_to_worry = 'Self care does not mean vacations and massages. It means meeting your basic needs consistently so you can show up for your child.',
  missed_window     = 'If you are consistently running on empty, this is worth raising at your own doctor''s appointment, not just the baby''s. Getting support is one of the best things you can do for your child.',
  source_citation   = 'Harvard Center on the Developing Child, Parent Wellbeing and Child Development; AAP Postpartum Care Guidelines',
  updated_at        = now()
  WHERE slug = 'social-parent-self-care';

-- social-peek-a-boo
UPDATE milestone_windows SET
  title             = 'Peek a boo play, teaches object permanence and trust',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 17,
  peak_age_weeks    = 26,
  close_age_weeks   = 43,
  why_it_matters    = 'Peek a boo is not just entertainment. It teaches object permanence (you disappear and reappear, you still exist), trust (you always come back), and the structure of social turn taking. It is also one of the earliest games where the baby learns to anticipate and laugh in expectation, which is a cognitive skill.',
  what_to_do        = '* Use your hands, a cloth, a corner, any method of disappearing and reappearing
* Build anticipation: slow down before the reveal to create the "peek a boo" moment
* Let the baby initiate as they get older',
  what_not_to_worry = 'They will want to play the exact same version of the same game many times in a row. This is them cementing the concept. Repetition is the point.',
  missed_window     = 'This is an opportunity, not a mandate. If you haven''t done it, start now. It remains valuable through 18 months.',
  source_citation   = 'Bruner and Sherwood (1976), Peek a Boo and Shared Attention; AAP',
  updated_at        = now()
  WHERE slug = 'social-peek-a-boo';

-- social-peer-friendships
UPDATE milestone_windows SET
  title             = 'Peer friendship formation begins',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 130,
  peak_age_weeks    = 156,
  close_age_weeks   = 195,
  why_it_matters    = 'True peer friendships (consistent preference for a specific other child, seeking them out, showing joy at reunion) begin to emerge around age 3. They are different from general sociability. Peer friendships are important for language development, theory of mind, conflict resolution skills, and emotional wellbeing.',
  what_to_do        = '* Facilitate regular time with the same small group of children
* Help your child learn to enter play: "you could ask if you can play too"
* Take their social preferences seriously, if they keep talking about one child, facilitate that friendship',
  what_not_to_worry = 'Not all children form close friendships at age 3. Some are more comfortable in small groups or one on one. The goal is social engagement in some form, not a specific friendship structure.',
  missed_window     = 'If your 4 year old has no interest in other children and avoids all social interaction, discuss it with your pediatrician. With patience and the right social settings, many children find their footing socially a little later and do very well.',
  source_citation   = 'Dunn (1993), Young Children''s Close Friendships; CDC',
  updated_at        = now()
  WHERE slug = 'social-peer-friendships';

-- social-primary-attachment
UPDATE milestone_windows SET
  title             = 'Primary attachment formation',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 26,
  why_it_matters    = 'Attachment theory, developed by John Bowlby and extended by Mary Ainsworth, is one of the most robust bodies of research in developmental psychology. Secure attachment in the first 6 months predicts better emotional regulation, more resilient stress responses, stronger social skills, and even better academic outcomes through childhood. Secure attachment is built not through any single action but through the cumulative experience of a caregiver who is consistently present, responsive, and warm. You cannot spoil a baby.',
  what_to_do        = '* Respond to cries, consistently and promptly. Research is unambiguous that responsive caregiving builds secure attachment. You cannot spoil an infant.
* Be present during waking hours: face to face time, physical closeness, eye contact
* Regulate yourself: a calm parent creates a calm baby. The nervous system is contagious.',
  what_not_to_worry = 'Attachment is built over months, not moments. One bad day, one missed cue, one necessary absence doesn''t break the bond. Consistent patterns matter. Single events don''t.',
  missed_window     = 'Attachment continues to develop beyond 6 months. This window represents the most critical foundation period, but the relationship continues to be shaped throughout childhood. If early months were difficult (illness, postpartum depression, NICU), focus on building consistency now.',
  source_citation   = 'Bowlby, J., Attachment and Loss; Ainsworth et al. (1978), Patterns of Attachment; Harvard Center on the Developing Child; van den Boom (1994), Attachment Intervention Research',
  updated_at        = now()
  WHERE slug = 'social-primary-attachment';

-- social-self-regulation
UPDATE milestone_windows SET
  title             = 'Self regulation strategies, co regulation comes first',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 78,
  peak_age_weeks    = 91,
  close_age_weeks   = 156,
  why_it_matters    = 'Self regulation, the ability to manage emotions and behavior, does not develop in isolation. It develops through co regulation first: a calm adult repeatedly helping a dysregulated child return to baseline. Every time a parent stays calm during a meltdown, they are literally modeling the neural pathway the child needs to build. Research by Stuart Shanker shows that children who experience consistent co regulation develop significantly better self regulation by age 5.',
  what_to_do        = '* Stay calm during meltdowns. Your nervous system is the regulator.
* Use physical co regulation: hold them, sit with them, speak slowly and quietly
* After they calm, name what happened: "that was so hard. You got really upset. And then you calmed down."',
  what_not_to_worry = 'You will not always stay calm. Rupture followed by repair is normal and also teaches resilience. What matters is the pattern, not the perfection.',
  missed_window     = 'This window is open throughout childhood. Consistent co regulation practice at any age produces measurable improvements in self regulation.',
  source_citation   = 'Shanker (2016), Self Reg; Siegel and Bryson (2011), The Whole Brain Child; Schore (1994)',
  updated_at        = now()
  WHERE slug = 'social-self-regulation';

-- social-separation-anxiety
UPDATE milestone_windows SET
  title             = 'Separation anxiety, normal and how to handle it',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 26,
  peak_age_weeks    = 34,
  close_age_weeks   = 65,
  why_it_matters    = 'For most children, separation anxiety peaks between 9 and 18 months. It reflects the child''s understanding that a parent exists and can leave (object permanence applied to people) combined with the inability to yet trust that the parent will come back. It is one of the most common sources of parenting stress in the first two years and also one of the most predictable.',
  what_to_do        = '* Always say goodbye, do not sneak out. Sneaking out increases anxiety long term.
* Keep goodbyes brief and confident. Your tone communicates safety.
* Practice short separations so the child learns the pattern: you leave, you always come back.',
  what_not_to_worry = 'The intensity of the goodbye cry is not an indicator of how the child feels two minutes after you leave. Many children stop crying almost immediately. Daycare cameras (where available) will often show this.',
  missed_window     = 'Severe separation anxiety that does not improve at all by age 3 is worth discussing with your pediatrician. Manageable separation distress throughout the toddler years is normal. There are very effective strategies that can help, and most children make great progress with gentle, consistent support.',
  source_citation   = 'Bowlby (1969); Ainsworth (1967); AAP',
  updated_at        = now()
  WHERE slug = 'social-separation-anxiety';

-- social-serve-return-loop
UPDATE milestone_windows SET
  title             = 'Serve and return emotional loop, reading and responding to cues',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 0,
  peak_age_weeks    = 4,
  close_age_weeks   = 52,
  why_it_matters    = 'Serve and return is the mechanism through which secure attachment is built moment to moment. A baby "serves" (looks, reaches, vocalizes) and the parent "returns" (responds with warmth, attention, and engagement). This cycle, repeated thousands of times, builds the neural pathways for emotional regulation, stress response, and social intelligence. The absence of consistent returns is one of the most documented early risk factors for developmental difficulties.',
  what_to_do        = '* Notice the serve: a look, a reach, a sound, a gesture is an invitation to connect
* Return the serve: make eye contact, respond verbally, lean in
* Do not worry about perfection, the pattern over time matters more than any single exchange',
  what_not_to_worry = 'You will miss many serves. Every parent does. The research shows it is the overall pattern and consistency that matters, not the hit rate.',
  missed_window     = 'This practice is valuable throughout childhood. If you are starting later, start now. The brain retains plasticity well beyond infancy.',
  source_citation   = 'Harvard Center on the Developing Child; Tronick (2007); Schore (1994)',
  updated_at        = now()
  WHERE slug = 'social-serve-return-loop';

-- social-sharing-not-before-3
UPDATE milestone_windows SET
  title             = 'Do not force sharing before age 3',
  urgency           = 'advisory',
  priority          = 3,
  open_age_weeks    = 104,
  peak_age_weeks    = 130,
  close_age_weeks   = 156,
  why_it_matters    = 'True sharing requires theory of mind (understanding that another person wants something you have) and impulse control sufficient to override the desire to keep it. Neither capacity is reliably developed before age 3. Forcing sharing before these capacities are in place does not teach sharing, it teaches that adults take things away arbitrarily. Researchers like Dacher Keltner and Kristine Onishi have studied this extensively and the findings are consistent: developmental readiness matters.',
  what_to_do        = '* From ages 1 to 3: use turn taking instead of forced sharing. "When you are done, Oliver will have a turn."
* Validate ownership: "that is your truck. You decide when you are done."
* Model sharing generously in your own life and narrate it',
  what_not_to_worry = 'Toddlers who refuse to share are not developing into selfish adults. They are behaving in a developmentally appropriate way for their age and brain development stage.',
  missed_window     = 'If your 3 to 4 year old is still completely unable to take turns or wait for a desired toy with any support, it is worth discussing at the next visit.',
  source_citation   = 'Brownell et al. (2009), Spontaneous Sharing in Toddlers; AAP; Keltner (2009)',
  updated_at        = now()
  WHERE slug = 'social-sharing-not-before-3';

-- social-skin-to-skin
UPDATE milestone_windows SET
  title             = 'Skin to skin bonding, the first hours matter',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 0,
  peak_age_weeks    = 0,
  close_age_weeks   = 4,
  why_it_matters    = 'Skin-to-skin contact immediately after birth, baby placed on the parent''s bare chest, triggers hormonal responses in both parent and child that are foundational to bonding and breastfeeding. Oxytocin, sometimes called the bonding hormone, is released in both. Babies in skin-to-skin contact have more stable heart rates, better temperature regulation, and better breastfeeding outcomes. This matters for both the birth parent and their partner.',
  what_to_do        = '* Request immediate skin-to-skin contact in your birth plan, it''s standard practice in most hospitals, but stating it explicitly increases the likelihood it happens
* Skin-to-skin can continue at home, it''s not just for the delivery room
* Partners benefit too: the hormonal response is not exclusive to the birthing parent',
  what_not_to_worry = 'If skin-to-skin wasn''t possible at birth, medical complications, C section, NICU stay, it doesn''t define the relationship. Bonding happens over time through consistent responsive caregiving. The first hours are important; they are not irreplaceable.',
  missed_window     = 'If the initial hours passed without skin-to-skin, continue with as much physical closeness as possible in the first weeks. Baby wearing, co sleeping safely, and responsive feeding all contribute to the same bonding outcomes over time.',
  source_citation   = 'AAP Breastfeeding Policy; Moore et al. (2016), Cochrane Review on Skin to Skin Care; ACOG Early Skin to Skin Guidelines',
  updated_at        = now()
  WHERE slug = 'social-skin-to-skin';

-- social-social-smile-appears
UPDATE milestone_windows SET
  title             = 'Social smile, the first intentional interaction',
  urgency           = 'clinical',
  priority          = 1,
  open_age_weeks    = 4,
  peak_age_weeks    = 6,
  close_age_weeks   = 12,
  why_it_matters    = 'The social smile, a smile in direct response to your face and voice, not gas, typically appears around 6 weeks. It''s the first sign that your baby is engaging with the social world intentionally. Absent social smiling by 3 months is a clinical red flag and one of the early screening indicators for autism spectrum disorder. The smile is also the beginning of the serve and return emotional exchange that drives language and attachment development.',
  what_to_do        = '* Get close, babies can only focus clearly at 8–12 inches
* Smile, talk, and wait. Give them time to respond. The social smile takes a beat.
* Respond to every smile: smile back, say something, make it a two way exchange',
  what_not_to_worry = 'Smiling at the ceiling or a pattern on the wall is reflexive, not social. The social smile is specifically triggered by a face. Don''t count random smiles as the milestone.',
  missed_window     = 'No social smile by 3 months: bring it up at the 3 month mark or at the next scheduled visit, whichever comes first. This is one of the earliest and most reliable autism screening behaviors.',
  source_citation   = 'CDC Developmental Milestones (2024); AAP Autism Screening Guidelines; Johnson et al. (2015), Early Social Smile and ASD Detection',
  updated_at        = now()
  WHERE slug = 'social-social-smile-appears';

-- social-stranger-anxiety
UPDATE milestone_windows SET
  title             = 'Stranger anxiety emerging, this is healthy',
  urgency           = 'advisory',
  priority          = 2,
  open_age_weeks    = 26,
  peak_age_weeks    = 30,
  close_age_weeks   = 43,
  why_it_matters    = 'Stranger anxiety, the wariness or distress at unfamiliar people, is something most babies develop between 6 and 10 months. It is a sign of healthy attachment: the baby has formed a strong enough bond with primary caregivers to distinguish them clearly from others. It is not a problem to solve. It is a developmental sign that the attachment system is working.',
  what_to_do        = '* Do not force interaction with strangers or unfamiliar relatives
* Stay in sight when introducing a new person, your presence is the safety signal
* Give the child time to warm up on their own terms',
  what_not_to_worry = 'Grandparents and relatives who feel hurt by the baby''s reaction need to understand this is a developmental milestone, not a personal rejection. A few minutes of patient, non pressuring presence usually results in engagement.',
  missed_window     = 'Complete absence of any stranger wariness by 9 months (universally happy with all strangers) can occasionally be a flag worth noting in the context of other developmental observations. In most cases, this will resolve naturally and no intervention is needed.',
  source_citation   = 'Ainsworth (1967); Bowlby (1969); CDC',
  updated_at        = now()
  WHERE slug = 'social-stranger-anxiety';

-- social-tantrums-peak
UPDATE milestone_windows SET
  title             = 'Tantrum peak, response strategy matters now',
  urgency           = 'advisory',
  priority          = 1,
  open_age_weeks    = 78,
  peak_age_weeks    = 91,
  close_age_weeks   = 156,
  why_it_matters    = 'Most children hit their peak of tantrum behavior somewhere between 18 months and 3 years. This is not a discipline problem. It''s a brain development problem. The prefrontal cortex, which governs emotional regulation, won''t be fully developed until the mid 20s. At 18 months, it barely exists. Your child is not defiant; they are neurologically incapable of managing the emotions they''re experiencing. But how you respond now sets patterns that last for years. Specifically: whether the child learns that tantrums are effective strategies or whether they learn that co regulation with a calm adult is available.',
  what_to_do        = '* During a tantrum: stay physically present, stay calm, say little. You''re a co regulator, not a negotiator.
* Never negotiate during a tantrum, it teaches that tantrums are effective tools for getting what they want
* After the tantrum: name what happened and reconnect. "You got really upset when we had to leave the park. That was hard."
* Prevent where possible: tantrums spike with hunger, tiredness, and transitions, manage the environment, not just the behavior',
  what_not_to_worry = 'Tantrums do not indicate a difficult child or poor parenting. They are developmentally universal. The research shows that parents who remain calm during tantrums have children who recover faster and tantrum less frequently over time.',
  missed_window     = 'Tantrums typically peak around age 2 and gradually decline through age 4. If they''re intensifying after age 4, involving self harm, or lasting more than 25 minutes, discuss with your pediatrician. Note: breath-holding spells are separate — they''re involuntary reflexes, not a behavioral problem, and peak between ages 1 and 2. If your child has breath-holding spells, mention it to your pediatrician, as a simple blood test for iron deficiency may be recommended. Most families see tantrums ease naturally as language develops.',
  source_citation   = 'Potegal & Davidson (2003), Tantrums Research; Zelazo et al., Prefrontal Development Research; AAP Bright Futures Behavioral Guidance; FamilyForce Tantrum Playbook; AAP Clinical Guidance on Breath-Holding Spells & Iron Deficiency',
  updated_at        = now()
  WHERE slug = 'social-tantrums-peak';

-- ── 3. Insert new windows ────────────────────────────────────
-- INSERT: screening-visit-1month
INSERT INTO milestone_windows (
  slug, title, category, urgency, priority,
  open_age_weeks, peak_age_weeks, close_age_weeks,
  why_it_matters, what_to_do, what_not_to_worry,
  missed_window, source_citation, prenatal, active
) VALUES (
  'screening-visit-1month',
  '1 month well child visit',
  'screening',
  'screening',
  1,
  4,
  4,
  5,
  'The 1 month visit is the first well child check after the newborn visit at 3 to 5 days. Most parents don''t realize it exists — it''s not as well publicized as the 2 month visit — but it''s on the AAP Periodicity Schedule for good reason. Your baby should be back to birth weight by now, feeding is either established or struggling, and postpartum depression in the primary caregiver is at or near its peak. This visit catches problems early, before they compound.',
  '* Schedule this visit before you leave the hospital — it should happen at 3 to 5 weeks of age
* Bring a list of feeding questions: how often, how long, how much weight gained since discharge
* The pediatrician will ask about your mood. Answer honestly. This is not a judgment — it''s a screen for postpartum depression, which is treatable and common.
* Vaccine given at this visit: Hepatitis B (dose 2, if not already given at the newborn visit)

**What to watch for before this visit:**
* Baby not back to birth weight by week 2 to 3 — flag this early
* Feeding taking more than 45 minutes per session, or baby seeming exhausted during feeds
* Any yellowing of skin or eyes persisting past 2 weeks',
  'The social smile hasn''t arrived yet for most babies — it typically emerges around 6 to 8 weeks. Your pediatrician will look for early signs but won''t flag its absence at 1 month.',
  'If the 1 month visit didn''t happen, flag any concerns about feeding, weight gain, or postpartum mood at the 2 month visit. Don''t wait.',
  'AAP Bright Futures Periodicity Schedule (2023); AAP Clinical Report on Incorporating Recognition and Management of Perinatal Depression Into Pediatric Practice (2019); CDC Immunization Schedule (2024)',
  false,
  true
) ON CONFLICT (slug) DO UPDATE SET
  title             = EXCLUDED.title,
  why_it_matters    = EXCLUDED.why_it_matters,
  what_to_do        = EXCLUDED.what_to_do,
  what_not_to_worry = EXCLUDED.what_not_to_worry,
  missed_window     = EXCLUDED.missed_window,
  source_citation   = EXCLUDED.source_citation,
  open_age_weeks    = EXCLUDED.open_age_weeks,
  peak_age_weeks    = EXCLUDED.peak_age_weeks,
  close_age_weeks   = EXCLUDED.close_age_weeks,
  updated_at        = now();

-- ── Summary ───────────────────────────────────────────────────
-- Windows updated:      212
-- Windows inserted:     1
-- Windows soft-deleted: 2

-- Verify:
-- SELECT slug, title, open_age_weeks, close_age_weeks, updated_at
-- FROM milestone_windows
-- WHERE updated_at > now() - interval '1 hour'
-- ORDER BY updated_at DESC;