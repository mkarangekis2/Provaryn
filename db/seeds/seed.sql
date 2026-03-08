insert into condition_catalog (code, name, body_system, category)
values
('MSK_BACK','Lumbar Strain','Musculoskeletal','Primary'),
('NEURO_RADIC','Radiculopathy','Neurological','Secondary'),
('HEARING_TINN','Tinnitus','Hearing','Primary'),
('MENTAL_PTS','Stress-Related Disorder','Mental Health','Primary'),
('SLEEP_APN','Sleep Apnea','Respiratory','Primary')
on conflict (code) do nothing;

insert into secondary_condition_rules (primary_condition, secondary_condition, rationale, weight)
values
('Lumbar Strain', 'Radiculopathy', 'Lumbar nerve involvement can produce radiating pain and neurological symptoms', 0.92),
('Stress-Related Disorder', 'Depressive Symptoms', 'Mood comorbidity patterns are common and should be screened', 0.83),
('Tinnitus', 'Sleep Disturbance', 'Persistent ringing can drive concentration and sleep disruption', 0.55),
('Sleep Apnea', 'Fatigue-Related Functional Impairment', 'Untreated sleep apnea frequently impacts daytime function', 0.77)
on conflict do nothing;

insert into benefits_catalog (state_code, title, category, min_rating, details, url)
values
('TX', 'Property Tax Relief', 'Tax', 100, 'Potential exemptions for qualifying disabled veterans', 'https://www.texas.gov'),
('CA', 'College Tuition Waiver', 'Education', 0, 'Education support programs for dependents and veterans', 'https://www.ca.gov'),
('FL', 'State Park Benefits', 'Discount', 30, 'Recreation-related discounts for eligible veterans', 'https://www.myflorida.com')
on conflict do nothing;
