-- Internationalize US-specific milestone windows
-- Run in Supabase SQL Editor

-- Car seat: installation check
UPDATE milestone_windows SET
  why_it_matters = 'Car accidents are a leading cause of injury death for young children globally. The first car ride, hospital to home, happens before most parents feel ready, and research shows that up to 75% of car seats are installed incorrectly. An incorrectly installed seat provides substantially less protection. Installation needs to happen before the baby is born, not in the hospital parking lot.',
  what_to_do = E'Install the car seat rear facing before the due date, and have it checked.\nFree car seat inspections are available through many fire stations, hospitals, and child road safety programs. Search "[your country] car seat inspection" to find a local service.\nThe seat should not move more than 1 inch in any direction when you tug at the base.'
WHERE slug = 'safety-car-seat-install-check';

-- Car seat: rear facing as long as possible
UPDATE milestone_windows SET
  why_it_matters = 'Keep children rear facing until they reach the maximum height or weight limit of their specific seat, not until an arbitrary age. Age 2 is sometimes cited as a minimum benchmark, but it is not a target. Rear facing is significantly safer in frontal crashes because it distributes crash forces across the entire back, head, and neck. Check your country''s road safety guidelines for the legal minimum, then go beyond it as long as your seat allows.'
WHERE slug = 'safety-rear-facing-as-long-as-possible';

-- Car seat: forward facing transition
UPDATE milestone_windows SET
  why_it_matters = 'When a child has outgrown the rear facing limits of their seat (by height or weight, not by age), they transition to a forward facing harness seat. This is still significantly safer than a booster. The forward facing harness should be used until the child outgrows it as well. Weight limits vary by seat and country — check your specific seat''s manual and your local road safety guidelines.'
WHERE slug = 'safety-forward-facing-transition';

-- Screening visits: add international note (all 11 in one query)
UPDATE milestone_windows SET
  what_not_to_worry = COALESCE(what_not_to_worry || E'\n\n', '') || 'Visit timing above follows the AAP schedule (US). Your country''s well-child check schedule may have slightly different timing or names — UK uses the PCHR schedule, Australia uses the Blue Book, HK uses MCH clinics. The developmental milestones and questions to ask are universal.'
WHERE slug IN (
  'screening-visit-3to5-days',
  'screening-visit-2months',
  'screening-visit-4months',
  'screening-visit-6months',
  'screening-visit-9months',
  'screening-visit-12months',
  'screening-visit-15months',
  'screening-visit-18months-autism',
  'screening-visit-24months-autism',
  'screening-visit-30months',
  'screening-visit-36months'
);

-- M-CHAT: clarify it is widely used but not universal
UPDATE milestone_windows SET
  why_it_matters = replace(
    why_it_matters,
    'The 18 month visit is the first formal autism screening using the M-CHAT-R/F.',
    'The 18 month visit is the first formal autism screening, typically using the M-CHAT-R/F or an equivalent standardised tool. M-CHAT is used widely across the US, Australia, and internationally; your provider may use a different validated instrument.'
  )
WHERE slug = 'screening-visit-18months-autism';
