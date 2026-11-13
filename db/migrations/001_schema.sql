-- The Ivory Cradle School: core schema.
-- Plain PostgreSQL (13+). Every rule that matters (viewing progress, quiz attempts,
-- certificate issuance) is enforced by the server against these tables.

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null unique,
  password_hash text not null,
  full_name text not null,
  role text not null default 'student' check (role in ('student', 'staff', 'admin')),
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  user_agent text
);
create index sessions_user_idx on sessions(user_id);

-- Stored files. Small files (worksheets, captions, signatures, issued certificate PDFs)
-- live in the database. Large lesson videos live in private blob storage or are linked.
-- "bundled" files ship with the deployment (the staging sample course).
create table files (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('video', 'captions', 'worksheet', 'signature', 'certificate')),
  storage text not null check (storage in ('db', 'bundled', 'blob', 'url')),
  content_type text not null,
  filename text,
  size_bytes bigint,
  sha256 text,
  bytes bytea,
  path text,
  url text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references users(id),
  updated_at timestamptz not null default now()
);

create table credential_policies (
  credential_type text primary key,
  label text not null,
  validity_months int check (validity_months is null or validity_months > 0),
  updated_by uuid references users(id),
  updated_at timestamptz not null default now()
);

create table signature_sets (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  alante_file_id uuid not null references files(id),
  justine_file_id uuid not null references files(id),
  is_active boolean not null default false,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);
create unique index signature_sets_one_active on signature_sets(is_active) where is_active;

-- Courses keep an editable draft. Publishing snapshots the draft into an immutable
-- course version; students enroll into the version that was live at the time.
create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  -- draft: hidden; preview: shown in the catalog, not open for enrollment; published: enrollable
  status text not null default 'draft' check (status in ('draft', 'preview', 'published', 'archived')),
  sort_order int not null default 100,
  credential_type text not null default 'certificate_of_completion' references credential_policies(credential_type),
  price_cents int check (price_cents is null or price_cents >= 0),
  draft jsonb not null,
  published_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table course_versions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id),
  version_no int not null,
  title text not null,
  content jsonb not null,
  video_file_id uuid references files(id),
  video_duration_seconds numeric(10, 2) not null check (video_duration_seconds > 0),
  captions_file_id uuid references files(id),
  worksheet_file_id uuid references files(id),
  published_by uuid references users(id),
  published_at timestamptz not null default now(),
  unique (course_id, version_no)
);
alter table courses add constraint courses_published_version_fk
  foreign key (published_version_id) references course_versions(id);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  course_id uuid not null references courses(id),
  course_version_id uuid not null references course_versions(id),
  status text not null default 'active' check (status in ('active', 'completed', 'withdrawn')),
  certificate_name text,
  certificate_name_confirmed_at timestamptz,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  passed_attempt_id uuid,
  unique (user_id, course_id)
);

-- One row per complete viewing of the lesson. A new cycle starts when a student
-- uses all three quiz attempts and must rewatch from the beginning.
create table viewing_cycles (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id),
  cycle_no int not null,
  -- watching: required viewing in progress; quiz_open: viewing complete, attempts available;
  -- locked: three failed attempts, rewatch required; passed: quiz passed in this cycle
  status text not null default 'watching' check (status in ('watching', 'quiz_open', 'locked', 'passed')),
  watched_seconds numeric(10, 2) not null default 0,
  last_position numeric(10, 2) not null default 0,
  last_beat_at timestamptz,
  beats int not null default 0,
  started_at timestamptz not null default now(),
  viewing_completed_at timestamptz,
  completed_by text check (completed_by in ('viewing', 'accommodation')),
  unique (enrollment_id, cycle_no)
);

create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id),
  cycle_id uuid not null references viewing_cycles(id),
  attempt_no int not null check (attempt_no between 1 and 3),
  submission_key text not null,
  answers jsonb not null,
  score int not null check (score between 0 and 5),
  passed boolean not null,
  submitted_at timestamptz not null default now(),
  unique (cycle_id, attempt_no),
  unique (enrollment_id, submission_key)
);
alter table enrollments add constraint enrollments_passed_attempt_fk
  foreign key (passed_attempt_id) references quiz_attempts(id);

create table certificates (
  id uuid primary key default gen_random_uuid(),
  serial text not null unique,
  enrollment_id uuid references enrollments(id),
  user_id uuid references users(id),
  course_id uuid references courses(id),
  course_version_id uuid references course_versions(id),
  credential_type text not null,
  credential_label text not null,
  recipient_name text not null,
  course_title text not null,
  completion_date date not null,
  issue_date date not null,
  expires_on date,
  signature_set_id uuid references signature_sets(id),
  verification_url text not null,
  status text not null default 'active' check (status in ('active', 'revoked', 'replaced')),
  replaces_id uuid references certificates(id),
  replaced_by_id uuid references certificates(id),
  is_sample boolean not null default false,
  environment text not null,
  pdf_file_id uuid references files(id),
  issued_at timestamptz not null default now(),
  status_changed_at timestamptz
);
-- One original Certificate of Completion per completed enrollment.
create unique index certificates_one_original_per_enrollment
  on certificates(enrollment_id) where replaces_id is null and enrollment_id is not null;
create index certificates_user_idx on certificates(user_id);

-- Staff actions on credentials, courses and student records. Never shown publicly.
create table audit_events (
  id bigserial primary key,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  actor_id uuid references users(id),
  reason text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_events_entity_idx on audit_events(entity_type, entity_id);

create table rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (bucket, window_start)
);

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  user_id uuid references users(id),
  created_at timestamptz not null default now(),
  handled_at timestamptz,
  handled_by uuid references users(id)
);

create table interest_signups (
  id uuid primary key default gen_random_uuid(),
  program text not null,
  name text,
  email text not null,
  created_at timestamptz not null default now(),
  unique (program, email)
);
