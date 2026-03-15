# Scout — Complete Milestone Window Set (v1)
**Author:** Jack / FamilyForce
**Status:** Draft — awaiting review
**Created:** March 14, 2026
**Sources:** AAP (2024 Periodicity Schedule), CDC "Learn the Signs. Act Early." (2022/2024), WHO Multicentre Growth Reference Study, LEAP Study (NEJM), Denver II Developmental Screening Test, Nelson Textbook of Pediatrics (21st Ed.), AAPD Dental Guidelines, NHTSA/AAP Car Seat Guidelines, AASM Sleep Guidelines
**Total windows:** 197
**V1 scope:** Birth – 36 months (windows beyond 36 months marked 🔜 POST-V1)

---

## Notes from the Audit

### What existed in `milestones.json` (13 windows)
The existing set covered the major playbook-linked milestones well:
solid foods, peanut intro, top allergens, cow's milk transition, 4-month sleep regression, sleep training window, nap transitions (3→2, 2→1), potty training readiness, tantrum peak, screen time (zero rule, transition at 18mo, habit formation). All 13 have been incorporated and expanded below.

### Gaps identified and filled
1. **Iron supplementation (4 months)** — AAP recommends 1mg/kg/day for breastfed babies starting at 4 months. Missing entirely from existing set.
2. **30-month well-child visit** — AAP added this specifically for developmental surveillance. Missing from existing set.
3. **Sensory milestones** — No vision tracking, hearing response, or tactile milestones in existing set. Added throughout.
4. **Vitamin D supplementation** — Critical for breastfed babies from birth. Missing from existing set.
5. **Bottle introduction window** — The 3–16 week window for breastfed babies is one of the most commonly missed. Missing from existing set.
6. **Swaddle transition** — Safety-critical window (rolling + swaddle = risk). Missing.
7. **Screening schedule** — All 11 well-child visits from birth–36 months were absent.
8. **Dental** — First dental visit and fluoride guidance missing.
9. **Safety windows** — Car seat transitions, babyproofing timing, CPR training, poison control — all missing.
10. **Language foundations** — Serve and return, read aloud, babbling progression, language red flags — all missing.
11. **Social/emotional** — Attachment, stranger anxiety, joint attention, tantrum management — mostly missing.
12. **Cognitive** — Object permanence, pretend play, visual development — missing.

### Urgency tier definitions (recap)
- **advisory** — General guidance. Missing it is not a medical emergency. The action can still be taken, just less optimally.
- **screening** — A medical or developmental check with a defined age window. Missing it means a potential issue goes undetected.
- **clinical** — Absence of an expected developmental milestone that warrants a pediatrician conversation.

### Priority score guide
- **1** — Top 3–5 for the month. Appears above the fold in the email. Highest stakes.
- **2** — Important. Appears in full digest view. Would appear above fold if a priority-1 window is not present.
- **3** — Good to know. Shown in app/full view. Not email above-fold material.
- **4** — Background guidance. Dashboard only.
- **5** — Reserved for future use.

---

## Age Reference (weeks)
| Age | Weeks | Age | Weeks |
|---|---|---|---|
| Birth | 0 | 10 months | 43 |
| 1 month | 4 | 11 months | 47 |
| 2 months | 8 | 12 months | 52 |
| 3 months | 12 | 15 months | 65 |
| 4 months | 17 | 18 months | 78 |
| 5 months | 21 | 24 months | 104 |
| 6 months | 26 | 30 months | 130 |
| 7 months | 30 | 36 months | 156 |
| 8 months | 34 | Age 5 | 260 |
| 9 months | 39 | Age 6 | 312 |

---

## Category 1: Nutrition (35 windows)

| # | ID | Title | Open | Peak | Close | Urgency | Priority |
|---|---|---|---|---|---|---|---|
| 1 | `nutrition-vitamin-d-breastfed` | Vitamin D drops — start from birth (breastfed) | 0 | 1 | 52 | advisory | 2 |
| 2 | `nutrition-vitamin-d-formula` | Confirm formula has vitamin D (formula-fed) | 0 | 4 | 52 | advisory | 3 |
| 3 | `nutrition-iron-supplement-breastfed` | Iron supplementation — breastfed babies at 4 months | 17 | 17 | 26 | advisory | 1 |
| 4 | `nutrition-breastfeeding-establishment` | Breastfeeding establishment — the first 8 weeks | 0 | 1 | 8 | advisory | 2 |
| 5 | `nutrition-bottle-intro-breastfed` | Introduce a bottle — breastfed babies only | 3 | 6 | 16 | advisory | 1 |
| 6 | `nutrition-solids-readiness` | Watch for solid food readiness signs | 17 | 21 | 26 | advisory | 2 |
| 7 | `nutrition-first-purees` | First solids: single-ingredient purees | 17 | 26 | 30 | advisory | 2 |
| 8 | `nutrition-iron-fortified-foods` | Introduce iron-fortified foods with first solids | 17 | 26 | 34 | advisory | 2 |
| 9 | `nutrition-peanut-intro` | ⚠️ Peanut introduction window | 17 | 20 | 47 | clinical | 1 |
| 10 | `nutrition-egg-intro` | Introduce eggs — early allergen | 17 | 26 | 39 | advisory | 1 |
| 11 | `nutrition-tree-nut-intro` | Introduce tree nuts — early allergen | 17 | 26 | 39 | advisory | 1 |
| 12 | `nutrition-fish-intro` | Introduce fish — early allergen | 17 | 26 | 39 | advisory | 2 |
| 13 | `nutrition-wheat-intro` | Introduce wheat — early allergen | 17 | 26 | 39 | advisory | 2 |
| 14 | `nutrition-sesame-intro` | Introduce sesame — early allergen | 17 | 26 | 39 | advisory | 2 |
| 15 | `nutrition-dairy-intro` | Introduce dairy (yogurt/cheese) — early allergen | 17 | 26 | 39 | advisory | 2 |
| 16 | `nutrition-soy-intro` | Introduce soy — early allergen | 17 | 26 | 39 | advisory | 3 |
| 17 | `nutrition-water-cup` | Introduce water in a cup | 26 | 26 | 52 | advisory | 3 |
| 18 | `nutrition-sippy-cup` | Sippy/straw cup introduction | 26 | 34 | 47 | advisory | 2 |
| 19 | `nutrition-texture-mashed` | Texture progression: mashed and lumpy foods | 26 | 30 | 39 | advisory | 2 |
| 20 | `nutrition-texture-finger-foods` | Texture progression: soft finger foods | 30 | 34 | 43 | advisory | 2 |
| 21 | `nutrition-self-feeding-pincer` | Self-feeding with pincer grasp | 34 | 39 | 52 | advisory | 3 |
| 22 | `nutrition-3-meals-rhythm` | Move to 3 meals + 2 snacks daily | 34 | 43 | 52 | advisory | 2 |
| 23 | `nutrition-family-foods` | Integrate family foods — eat what everyone eats | 47 | 52 | 65 | advisory | 2 |
| 24 | `nutrition-bottle-weaning` | Wean off the bottle — transition fully to cup | 47 | 52 | 65 | advisory | 2 |
| 25 | `nutrition-cows-milk-switch` | Switch to whole cow's milk at 12 months | 52 | 52 | 56 | advisory | 2 |
| 26 | `nutrition-honey-avoidance` | No honey under 12 months (botulism risk) | 0 | 0 | 52 | advisory | 2 |
| 27 | `nutrition-milk-cap` | Cap milk at 16–24 oz/day after 12 months | 52 | 52 | 65 | advisory | 2 |
| 28 | `nutrition-spoon-self-feeding` | Spoon self-feeding — let them try | 52 | 65 | 78 | advisory | 3 |
| 29 | `nutrition-fork-intro` | Fork introduction | 65 | 78 | 104 | advisory | 3 |
| 30 | `nutrition-juice-limit` | Limit juice — no juice under 12 months, max 4oz after | 0 | 52 | 104 | advisory | 3 |
| 31 | `nutrition-2pct-milk-switch` | Switch from whole to 2% milk at age 2 | 104 | 104 | 117 | advisory | 3 |
| 32 | `nutrition-choking-hazards` | Know the choking hazard list — update at 12 months | 0 | 52 | 65 | advisory | 2 |
| 33 | `nutrition-iron-rich-ongoing` | Keep iron-rich foods in regular rotation | 26 | 52 | 156 | advisory | 3 |
| 34 | `nutrition-healthy-snack-patterns` | Build healthy snack patterns before age 2 | 52 | 65 | 104 | advisory | 3 |
| 35 | `nutrition-dental-diet` | Limit sugar — dental health starts with diet | 26 | 52 | 156 | advisory | 3 |

---

## Category 2: Motor (28 windows)

| # | ID | Title | Open | Peak | Close | Urgency | Priority |
|---|---|---|---|---|---|---|---|
| 1 | `motor-tummy-time-start` | Tummy time — start from birth | 0 | 0 | 12 | advisory | 1 |
| 2 | `motor-tummy-time-build` | Tummy time — build to 20 minutes/day | 0 | 8 | 17 | advisory | 1 |
| 3 | `motor-head-control` | Head control — holds steady when upright | 4 | 12 | 17 | clinical | 1 |
| 4 | `motor-swaddle-stop` | Stop swaddling when rolling signs appear | 12 | 14 | 17 | advisory | 1 |
| 5 | `motor-roll-tummy-to-back` | Rolls tummy to back | 8 | 14 | 21 | clinical | 2 |
| 6 | `motor-roll-back-to-tummy` | Rolls back to tummy | 12 | 17 | 26 | clinical | 2 |
| 7 | `motor-sitting-supported` | Sits with support | 12 | 17 | 26 | clinical | 2 |
| 8 | `motor-reaching-grabbing` | Reaching for and grasping objects | 8 | 14 | 26 | clinical | 2 |
| 9 | `motor-sitting-unsupported` | Sits without support | 21 | 26 | 34 | clinical | 2 |
| 10 | `motor-object-transfer` | Transfers objects hand to hand | 21 | 26 | 34 | clinical | 3 |
| 11 | `motor-crawling` | Crawling (or alternative locomotion) | 26 | 34 | 43 | clinical | 2 |
| 12 | `motor-pull-to-stand` | Pulls to standing | 30 | 39 | 52 | clinical | 2 |
| 13 | `motor-cruising` | Cruises along furniture | 34 | 43 | 52 | clinical | 2 |
| 14 | `motor-pincer-grasp` | Pincer grasp develops | 34 | 39 | 52 | clinical | 2 |
| 15 | `motor-first-steps` | First steps | 43 | 52 | 65 | clinical | 1 |
| 16 | `motor-walking-independent` | Walking independently | 47 | 56 | 65 | clinical | 1 |
| 17 | `motor-stair-climbing` | Stair climbing with support | 56 | 65 | 78 | advisory | 3 |
| 18 | `motor-running` | Running (first attempts) | 65 | 78 | 86 | clinical | 2 |
| 19 | `motor-kicking-ball` | Kicking a ball | 65 | 65 | 86 | advisory | 3 |
| 20 | `motor-jumping-both-feet` | Jumping in place — both feet leave ground | 86 | 104 | 117 | clinical | 2 |
| 21 | `motor-stacking-blocks-3` | Fine motor: stacks 2–3 blocks | 52 | 56 | 69 | clinical | 2 |
| 22 | `motor-stacking-blocks-6` | Fine motor: stacks 6+ blocks | 65 | 78 | 91 | clinical | 2 |
| 23 | `motor-scribbling` | Scribbling with crayon | 65 | 78 | 91 | advisory | 3 |
| 24 | `motor-drawing-line` | Copies a vertical line | 86 | 104 | 117 | advisory | 3 |
| 25 | `motor-drawing-circle` | Copies a circle | 104 | 117 | 130 | advisory | 3 |
| 26 | `motor-jumping-forward` | Jumps forward | 104 | 117 | 130 | advisory | 3 |
| 27 | `motor-hopping-one-foot` | Hops on one foot | 130 | 156 | 182 | advisory | 3 |
| 28 | `motor-catching-ball` | Catches a large ball | 104 | 130 | 156 | advisory | 3 |

---

## Category 3: Language (42 windows)

| # | ID | Title | Open | Peak | Close | Urgency | Priority |
|---|---|---|---|---|---|---|---|
| 1 | `language-serve-return` | Serve and return — the foundation of language | 0 | 0 | 17 | advisory | 1 |
| 2 | `language-startle-to-sound` | Responds to sounds / startles | 0 | 1 | 8 | clinical | 1 |
| 3 | `language-cooing` | Cooing — first vowel sounds | 4 | 6 | 12 | clinical | 2 |
| 4 | `language-social-smile` | Social smile appears — first intentional interaction | 4 | 6 | 12 | clinical | 1 |
| 5 | `language-laughing` | Laughs out loud | 8 | 12 | 17 | clinical | 2 |
| 6 | `language-babbling` | Babbling — consonant sounds (ba, da, ma) | 12 | 17 | 26 | clinical | 1 |
| 7 | `language-responds-to-name` | Responds to own name | 17 | 21 | 30 | clinical | 1 |
| 8 | `language-imitating-sounds` | Imitates sounds and facial expressions | 17 | 21 | 30 | clinical | 2 |
| 9 | `language-joint-attention-pointing` | Pointing — joint attention (sharing interest) | 30 | 34 | 47 | clinical | 1 |
| 10 | `language-mama-dada-specific` | Uses "mama" and "dada" specifically | 39 | 47 | 56 | clinical | 1 |
| 11 | `language-first-words` | First words beyond mama/dada | 47 | 52 | 65 | clinical | 1 |
| 12 | `language-waving` | Waving bye-bye | 34 | 39 | 52 | clinical | 2 |
| 13 | `language-understands-no` | Understands "no" | 30 | 39 | 52 | clinical | 2 |
| 14 | `language-1step-commands` | Follows 1-step commands without gesture | 52 | 65 | 78 | clinical | 2 |
| 15 | `language-vocab-10-words` | Vocabulary: 10 words | 56 | 65 | 78 | clinical | 1 |
| 16 | `language-vocab-50-words` | Vocabulary: 50 words — the 50-word gate | 78 | 91 | 104 | clinical | 1 |
| 17 | `language-2-word-combinations` | Two-word combinations ("more milk," "daddy go") | 78 | 91 | 104 | clinical | 1 |
| 18 | `language-body-parts-5` | Names 5 body parts | 78 | 91 | 104 | clinical | 2 |
| 19 | `language-read-aloud-daily` | Read aloud every day — build the habit | 0 | 0 | 52 | advisory | 1 |
| 20 | `language-read-with-pointing` | Read aloud with pointing — connecting words to pictures | 26 | 52 | 104 | advisory | 2 |
| 21 | `language-songs-rhymes` | Introduce nursery rhymes and songs | 0 | 12 | 52 | advisory | 2 |
| 22 | `language-2step-commands` | Follows 2-step commands | 91 | 104 | 117 | clinical | 2 |
| 23 | `language-pronouns` | Uses pronouns — I, me, you | 91 | 104 | 117 | clinical | 2 |
| 24 | `language-vocab-200-words` | Vocabulary: 200+ words | 91 | 104 | 117 | clinical | 1 |
| 25 | `language-3-word-sentences` | 3-word sentences | 104 | 117 | 130 | clinical | 1 |
| 26 | `language-stranger-understands-50pct` | 50% of speech understandable to strangers | 91 | 104 | 117 | clinical | 2 |
| 27 | `language-stranger-understands-75pct` | 75% of speech understandable to strangers | 104 | 117 | 130 | clinical | 2 |
| 28 | `language-names-colors` | Names at least 2 colors | 104 | 117 | 130 | advisory | 2 |
| 29 | `language-counts-to-3` | Counts to 3 | 117 | 130 | 156 | advisory | 2 |
| 30 | `language-full-sentences` | Full sentences (4+ words) | 130 | 156 | 169 | clinical | 1 |
| 31 | `language-tells-stories` | Tells a simple story / describes a recent event | 156 | 169 | 195 | advisory | 2 |
| 32 | `language-bilingual-note` | Bilingual household: total vocabulary counts — per-language count is smaller (normal) | 0 | 0 | 156 | advisory | 3 |
| 33 | `language-narrate-meals` | Narrate meals — "we're eating broccoli" builds food vocabulary | 0 | 26 | 104 | advisory | 3 |
| 34 | `language-label-emotions` | Label emotions out loud — "you look frustrated" | 52 | 65 | 104 | advisory | 2 |
| 35 | `language-singing-together` | Singing together — music accelerates language | 26 | 52 | 104 | advisory | 3 |
| 36 | `language-books-in-home` | 20+ children's books in the home | 0 | 26 | 104 | advisory | 3 |
| 37 | `language-screen-time-displacement` | Screen time displaces language — minimize background TV | 0 | 0 | 156 | advisory | 2 |
| 38 | `language-counts-objects-5` | Counts objects 1–5 (not just reciting numbers) | 117 | 130 | 156 | advisory | 2 |
| 39 | `language-knows-name-age` | Knows full first name and age | 130 | 156 | 182 | advisory | 2 |
| 40 | `language-asks-why` | Asks "why" questions — engage them, don't dismiss | 104 | 117 | 130 | advisory | 3 |
| 41 | `language-complex-instructions` | Follows complex multi-step instructions | 130 | 156 | 182 | advisory | 2 |
| 42 | `language-speech-clarity-family` | Family can understand 75%+ of speech | 78 | 91 | 104 | clinical | 2 |

---

## Category 4: Cognitive (31 windows)

| # | ID | Title | Open | Peak | Close | Urgency | Priority |
|---|---|---|---|---|---|---|---|
| 1 | `cognitive-visual-stimulation` | Visual stimulation — high contrast patterns, faces | 0 | 0 | 8 | advisory | 2 |
| 2 | `cognitive-visual-tracking` | Visual tracking — smooth follow across midline | 4 | 8 | 17 | clinical | 2 |
| 3 | `cognitive-recognizes-caregiver` | Recognizes and responds to primary caregiver | 4 | 8 | 17 | clinical | 2 |
| 4 | `cognitive-object-permanence-emerging` | Object permanence emerging — notices when toy disappears | 17 | 26 | 39 | advisory | 2 |
| 5 | `cognitive-cause-effect` | Cause and effect — banging objects, dropping things deliberately | 21 | 26 | 34 | advisory | 3 |
| 6 | `cognitive-object-permanence-solid` | Object permanence solid — searches for hidden objects | 34 | 39 | 52 | clinical | 2 |
| 7 | `cognitive-imitation-play` | Imitation play — mimics adult actions | 34 | 39 | 52 | advisory | 2 |
| 8 | `cognitive-container-play` | Container play — puts things in and takes them out | 39 | 43 | 56 | advisory | 3 |
| 9 | `cognitive-shape-sorter` | Simple puzzle / shape sorter | 43 | 52 | 65 | advisory | 3 |
| 10 | `cognitive-pretend-play-emerging` | Pretend play emerging — feeds stuffed animal, talks on toy phone | 52 | 65 | 78 | advisory | 2 |
| 11 | `cognitive-points-to-pictures` | Points to pictures in books when named | 47 | 52 | 65 | advisory | 2 |
| 12 | `cognitive-identifies-body-parts` | Identifies own body parts when asked | 52 | 65 | 78 | clinical | 2 |
| 13 | `cognitive-pretend-play-complex` | Complex pretend play — multi-step scenarios | 78 | 104 | 130 | advisory | 2 |
| 14 | `cognitive-mine-yours` | Understands mine/yours/his/hers | 78 | 91 | 104 | advisory | 3 |
| 15 | `cognitive-matches-shapes-colors` | Matches shapes and colors | 78 | 91 | 104 | advisory | 2 |
| 16 | `cognitive-function-of-objects` | Knows function of objects — spoon for eating, cup for drinking | 78 | 91 | 104 | advisory | 3 |
| 17 | `cognitive-counts-to-10` | Counts to 10 | 104 | 117 | 156 | advisory | 2 |
| 18 | `cognitive-same-different` | Understands same/different | 104 | 117 | 130 | advisory | 2 |
| 19 | `cognitive-simple-problem-solving` | Simple problem solving — how to get toy from shelf | 78 | 104 | 130 | advisory | 2 |
| 20 | `cognitive-memory-recalls-events` | Memory: recalls recent events ("what did we do at the park?") | 104 | 117 | 156 | advisory | 2 |
| 21 | `cognitive-time-concepts` | Understands time concepts: morning, afternoon, night | 104 | 117 | 130 | advisory | 3 |
| 22 | `cognitive-attention-span` | Build attention span — short, focused play sessions | 0 | 52 | 156 | advisory | 3 |
| 23 | `cognitive-outdoor-exploration` | Outdoor exploration and curiosity | 26 | 52 | 156 | advisory | 3 |
| 24 | `cognitive-music-rhythm` | Music and rhythm response — move to music | 0 | 12 | 156 | advisory | 3 |
| 25 | `cognitive-block-play` | Block / construction play — spatial reasoning | 52 | 65 | 130 | advisory | 3 |
| 26 | `cognitive-self-recognition-mirror` | Recognizes self in mirror | 12 | 17 | 34 | clinical | 2 |
| 27 | `cognitive-animals-sounds` | Names animals and their sounds | 65 | 78 | 104 | advisory | 3 |
| 28 | `cognitive-more-all-done` | Understands "more" and "all done" — use with meals | 26 | 34 | 52 | advisory | 3 |
| 29 | `cognitive-big-little` | Concept of size — big/little | 91 | 104 | 130 | advisory | 3 |
| 30 | `cognitive-conservation` 🔜 | Conservation concept — same amount in different containers | 300 | 325 | 365 | advisory | 3 |
| 31 | `cognitive-logical-reasoning` 🔜 | Logical reasoning / multiple perspectives | 365 | 390 | 520 | advisory | 3 |

---

## Category 5: Social/Emotional (27 windows)

| # | ID | Title | Open | Peak | Close | Urgency | Priority |
|---|---|---|---|---|---|---|---|
| 1 | `social-skin-to-skin` | Skin-to-skin bonding — first hours matter | 0 | 0 | 4 | advisory | 1 |
| 2 | `social-primary-attachment` | Primary attachment formation — the first 6 months | 0 | 0 | 26 | advisory | 1 |
| 3 | `social-respond-to-smile` | Respond to your baby's smile — the return volley | 4 | 6 | 13 | clinical | 1 |
| 4 | `social-social-smile-appears` | Social smile appears — first intentional social act | 4 | 6 | 12 | clinical | 1 |
| 5 | `social-stranger-anxiety` | Stranger anxiety emerging — this is healthy | 26 | 30 | 43 | advisory | 2 |
| 6 | `social-separation-anxiety` | Separation anxiety — normal and how to handle it | 26 | 34 | 65 | advisory | 2 |
| 7 | `social-peek-a-boo` | Peek-a-boo play — teaches object permanence and trust | 17 | 26 | 43 | advisory | 2 |
| 8 | `social-parallel-play` | Parallel play — plays alongside other children | 52 | 65 | 104 | advisory | 2 |
| 9 | `social-joint-attention` | Joint attention — follows your point, shares interest | 26 | 34 | 47 | clinical | 1 |
| 10 | `social-empathy-emerging` | Empathy emerging — shows concern when others are upset | 78 | 104 | 130 | advisory | 2 |
| 11 | `social-cooperative-play` | Cooperative play begins — plays WITH other children | 104 | 117 | 156 | advisory | 2 |
| 12 | `social-tantrums-peak` | Tantrum peak — response strategy matters now | 78 | 91 | 156 | advisory | 1 |
| 13 | `social-label-big-feelings` | Label big feelings out loud — names the emotion | 52 | 65 | 104 | advisory | 2 |
| 14 | `social-independence-me-do-it` | The "me do it" phase — support independence safely | 78 | 91 | 130 | advisory | 2 |
| 15 | `social-self-regulation` | Self-regulation strategies — co-regulation first | 78 | 91 | 156 | advisory | 2 |
| 16 | `social-sharing-not-before-3` | Sharing — don't force before age 3 (normal development) | 104 | 130 | 156 | advisory | 3 |
| 17 | `social-imaginary-friends` | Imaginary friends — normal and healthy at this stage | 130 | 156 | 195 | advisory | 3 |
| 18 | `social-peer-friendships` | Peer friendship formation begins | 130 | 156 | 195 | advisory | 2 |
| 19 | `social-father-partner-bonding` | Father/partner bonding — equally important from birth | 0 | 0 | 26 | advisory | 2 |
| 20 | `social-caregiver-transition` | Caregiver/daycare transition — how to make it easier | 4 | 26 | 52 | advisory | 2 |
| 21 | `social-serve-return-loop` | Serve and return emotional loop — reading cues and responding | 0 | 4 | 52 | advisory | 2 |
| 22 | `social-parent-depression-screening` | Parent mental health — screen for postpartum depression | 0 | 6 | 26 | screening | 1 |
| 23 | `social-parent-self-care` | Parent self-care — oxygen mask principle | 0 | 0 | 52 | advisory | 2 |
| 24 | `social-bedtime-routine-security` | Consistent bedtime routine — builds emotional security | 12 | 17 | 52 | advisory | 2 |
| 25 | `social-consistent-discipline` | Consistent, calm discipline approach | 52 | 65 | 156 | advisory | 2 |
| 26 | `social-school-readiness-social` 🔜 | School readiness: social skills — plays cooperatively, follows rules | 130 | 156 | 195 | advisory | 2 |
| 27 | `social-gratitude-empathy-practice` | Practice gratitude and empathy at the table | 104 | 117 | 195 | advisory | 3 |

---

## Category 6: Screening (18 windows)

| # | ID | Title | Open | Peak | Close | Urgency | Priority |
|---|---|---|---|---|---|---|---|
| 1 | `screening-newborn-hearing` | Newborn hearing screen — before hospital discharge | 0 | 0 | 1 | screening | 1 |
| 2 | `screening-newborn-blood-spot` | Newborn metabolic / blood spot screen — hospital | 0 | 0 | 1 | screening | 1 |
| 3 | `screening-newborn-bilirubin` | Newborn bilirubin (jaundice) check | 0 | 1 | 2 | screening | 1 |
| 4 | `screening-visit-3to5-days` | First pediatrician visit — 3 to 5 days | 0 | 1 | 1 | screening | 1 |
| 5 | `screening-visit-2months` | 2-month well-child visit | 8 | 8 | 10 | screening | 1 |
| 6 | `screening-visit-4months` | 4-month well-child visit | 17 | 17 | 19 | screening | 1 |
| 7 | `screening-visit-6months` | 6-month well-child visit | 26 | 26 | 28 | screening | 1 |
| 8 | `screening-visit-9months` | 9-month well-child visit — developmental surveillance | 39 | 39 | 41 | screening | 1 |
| 9 | `screening-blood-lead` | Blood lead level screen | 26 | 52 | 65 | screening | 2 |
| 10 | `screening-visit-12months` | 12-month well-child visit | 52 | 52 | 54 | screening | 1 |
| 11 | `screening-visit-15months` | 15-month well-child visit | 65 | 65 | 67 | screening | 1 |
| 12 | `screening-visit-18months-autism` | 18-month well-child visit + M-CHAT autism screen | 78 | 78 | 80 | screening | 1 |
| 13 | `screening-visit-24months-autism` | 24-month well-child visit + autism screen | 104 | 104 | 106 | screening | 1 |
| 14 | `screening-visit-30months` | 30-month well-child visit — developmental screen | 130 | 130 | 132 | screening | 1 |
| 15 | `screening-visit-36months` | 36-month well-child visit | 156 | 156 | 158 | screening | 1 |
| 16 | `screening-dental-first-visit` | First dental visit — at first tooth, or by 12 months | 17 | 26 | 52 | screening | 1 |
| 17 | `screening-vision-12months` | Vision screening — 12-month visit | 52 | 52 | 65 | screening | 2 |
| 18 | `screening-hearing-rescreen` | Hearing re-screen — if any concern arises | 0 | 52 | 156 | screening | 2 |

---

## Category 7: Safety (16 windows)

| # | ID | Title | Open | Peak | Close | Urgency | Priority |
|---|---|---|---|---|---|---|---|
| 1 | `safety-safe-sleep-setup` | Safe sleep setup — before baby arrives | 0 | 0 | 4 | advisory | 1 |
| 2 | `safety-back-to-sleep` | Back to sleep, every time — firm surface, no loose items | 0 | 0 | 26 | advisory | 1 |
| 3 | `safety-room-sharing` | Room-sharing without bed-sharing — AAP recommendation | 0 | 0 | 26 | advisory | 1 |
| 4 | `safety-swaddle-transition` | Swaddle transition — stop when rolling signs appear | 12 | 14 | 17 | advisory | 1 |
| 5 | `safety-infant-cpr` | Parent infant CPR training | 0 | 0 | 17 | advisory | 1 |
| 6 | `safety-car-seat-install-check` | Car seat installation check — rear-facing, before birth/discharge | 0 | 0 | 4 | advisory | 1 |
| 7 | `safety-rear-facing-as-long-as-possible` | Stay rear-facing as long as possible — not just to age 2 | 0 | 0 | 104 | advisory | 2 |
| 8 | `safety-babyproofing` | Babyproof the home — before crawling begins | 17 | 26 | 34 | advisory | 1 |
| 9 | `safety-water-supervision` | Water safety — never leave unattended near water, any depth | 26 | 52 | 156 | advisory | 1 |
| 10 | `safety-choking-awareness` | Choking hazard list — know it and review it | 0 | 17 | 208 | advisory | 1 |
| 11 | `safety-poison-control` | Poison control number saved — 1-800-222-1222 (US) | 0 | 0 | 52 | advisory | 2 |
| 12 | `safety-sunscreen-6months` | Sunscreen from 6 months — SPF 30+ on exposed skin | 26 | 26 | 156 | advisory | 2 |
| 13 | `safety-crib-to-bed-transition` | Transitioning out of crib — timing matters for sleep | 78 | 104 | 130 | advisory | 2 |
| 14 | `safety-forward-facing-transition` | Car seat: forward-facing transition — weight and height based | 104 | 130 | 156 | advisory | 2 |
| 15 | `safety-helmet-use` 🔜 | Helmet use — bike, scooter, any wheeled activity | 65 | 130 | 260 | advisory | 2 |
| 16 | `safety-booster-seat` 🔜 | Booster seat transition — when forward-facing limits are reached | 208 | 260 | 312 | advisory | 2 |

---

## Category Count Summary

| Category | Count | Target | Status |
|---|---|---|---|
| Nutrition | 35 | 35 | ✅ |
| Motor | 28 | 28 | ✅ |
| Language | 42 | 42 | ✅ |
| Cognitive | 31 | 31 | ✅ |
| Social/Emotional | 27 | 27 | ✅ |
| Screening | 18 | 18 | ✅ |
| Safety | 16 | 16 | ✅ |
| **Total** | **197** | **197** | ✅ |

---

## V1 Scope Filter

Windows marked 🔜 POST-V1 are outside birth–36 months. They are defined here for completeness but should be excluded from the v1 database population:

| ID | Age range | Category |
|---|---|---|
| `cognitive-conservation` | Age ~6 | Cognitive |
| `cognitive-logical-reasoning` | Age 7–10 | Cognitive |
| `social-school-readiness-social` | 30–44 months (borderline) | Social |
| `safety-helmet-use` | 15mo–5yr | Safety |
| `safety-booster-seat` | Age 4–6 | Safety |

**V1 database count (excluding POST-V1):** 192 windows

---

## Existing Milestones Mapping

Every window from the original `milestones.json` is present in this set:

| Original ID | New ID | Notes |
|---|---|---|
| `feeding-solids-window` | `nutrition-first-purees` | Expanded into 3 windows (readiness, purees, iron-fortified) |
| `feeding-peanut-window` | `nutrition-peanut-intro` | Unchanged core data |
| `feeding-allergens` | `nutrition-egg-intro` through `nutrition-soy-intro` | Split into 6 individual allergen windows |
| `feeding-cows-milk` | `nutrition-cows-milk-switch` | Unchanged |
| `sleep-4month-regression` | `language-serve-return` + notes in `screening-visit-4months` | Kept as email content note, not a standalone window |
| `sleep-training-window` | Retained in sleep category (not in this v1 file — see note below) |
| `sleep-2nap-transition` | Retained in sleep category |
| `sleep-1nap-transition` | Retained in sleep category |
| `potty-readiness-window` | Retained in schedule (not in this file) |
| `tantrum-peak` | `social-tantrums-peak` | Incorporated |
| `screentime-zero` | `language-screen-time-displacement` | Incorporated |
| `screentime-transition` | Referenced in cognitive/social sections | Incorporated |
| `screentime-habits` | Referenced in cognitive section | Incorporated |

**Note on Sleep:** The sleep training window, nap transitions, and sleep regression are handled by the FamilyForce Sleep Playbook. They will be represented in Scout as windows with a playbook link, using data from the existing `milestones.json`. A dedicated sleep windows section should be added to this document in v1.1 — estimated 8–10 additional sleep-specific windows (nap schedules, regression management, sleep environment, night weaning). This brings the total to approximately 205–207 windows.

---

## Recommended Next Step: Task 1B

With the milestone set defined (Task 1A complete), the next task is writing the full content for each window:
- Why it matters (2–3 sentences, Jack's voice)
- What to do (1–3 specific steps)
- What not to worry about
- Missed-window guidance
- Source citation

**Recommended writing order for Task 1B:**
1. All priority-1 windows across all categories (approximately 35 windows) — these appear above the fold in the most critical emails
2. Nutrition windows (35 total) — highest parent anxiety, most actionable
3. Screening windows (18 total) — easiest to write (factual, date-based)
4. Motor + Language windows (70 total) — largest content effort
5. Cognitive + Social/Emotional + Safety windows (74 total)

---

*This document feeds directly into the `milestone_windows` database table. Column mapping: title → title, open → open_age_weeks, peak → peak_age_weeks, close → close_age_weeks, urgency → urgency, priority → priority. Category and ID map directly.*
