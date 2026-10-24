create type public.app_role as enum ('STUDENT','INSTRUCTOR','ACADEMIC_ADVISOR','REGISTRAR','FINANCE_ADMIN','SUPER_ADMIN');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  university_id text not null unique,
  full_name text not null,
  college text not null default 'كلية تكنولوجيا المعلومات',
  major text not null default 'علم الحاسوب',
  degree text not null default 'بكالوريوس',
  plan_no text not null default '2023-CS-01',
  advisor_name text not null default 'د. ليلى الحسيني',
  academic_status text not null default 'منتظم',
  admission_year int not null default 2023,
  required_hours int not null default 132,
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.academic_terms (
  code text primary key, name text not null, is_current boolean not null default false,
  starts_on date not null, ends_on date not null
);
grant select on public.academic_terms to authenticated;
grant all on public.academic_terms to service_role;
alter table public.academic_terms enable row level security;
create policy "terms read" on public.academic_terms for select to authenticated using (true);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, name text not null, credits int not null,
  category text not null
);
grant select on public.courses to authenticated;
grant all on public.courses to service_role;
alter table public.courses enable row level security;
create policy "courses read" on public.courses for select to authenticated using (true);

create table public.course_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  weekday int not null, start_time time not null, end_time time not null,
  room text not null, instructor text not null
);
grant select on public.course_sessions to authenticated;
grant all on public.course_sessions to service_role;
alter table public.course_sessions enable row level security;
create policy "sessions read" on public.course_sessions for select to authenticated using (true);

create table public.student_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  course_id uuid not null references public.courses(id) on delete cascade,
  term_code text not null references public.academic_terms(code),
  status text not null,
  grade_points numeric(3,2),
  letter text,
  absences int not null default 0
);
grant select on public.student_records to authenticated;
grant all on public.student_records to service_role;
alter table public.student_records enable row level security;
create policy "own records read" on public.student_records for select to authenticated using (auth.uid() = user_id);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  kind text not null, starts_at timestamptz not null, room text not null
);
grant select on public.exams to authenticated;
grant all on public.exams to service_role;
alter table public.exams enable row level security;
create policy "exams read" on public.exams for select to authenticated using (true);

create table public.deadlines (
  id uuid primary key default gen_random_uuid(),
  title text not null, kind text not null, due_at timestamptz not null
);
grant select on public.deadlines to authenticated;
grant all on public.deadlines to service_role;
alter table public.deadlines enable row level security;
create policy "deadlines read" on public.deadlines for select to authenticated using (true);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, title text not null, body text not null,
  level text not null default 'info', is_read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notif read" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "own notif update" on public.notifications for update to authenticated using (auth.uid() = user_id);

-- seed catalog
insert into public.academic_terms values
 ('2023-1','الفصل الأول 2023/2024',false,'2023-09-15','2024-01-20'),
 ('2023-2','الفصل الثاني 2023/2024',false,'2024-02-10','2024-06-10'),
 ('2024-1','الفصل الأول 2024/2025',false,'2024-09-15','2025-01-20'),
 ('2024-2','الفصل الثاني 2024/2025',false,'2025-02-10','2025-06-10'),
 ('2025-1','الفصل الأول 2025/2026',false,'2025-09-15','2026-01-20'),
 ('2026-1','الفصل الأول 2026/2027',true,'2026-09-14','2027-01-22');

insert into public.courses (code,name,credits,category) values
 ('UNI101','مهارات الاتصال باللغة العربية',3,'متطلبات جامعة'),
 ('UNI102','اللغة الإنجليزية الأكاديمية',3,'متطلبات جامعة'),
 ('UNI103','التربية الوطنية',3,'متطلبات جامعة'),
 ('UNI104','الريادة والابتكار',3,'متطلبات جامعة'),
 ('MTH101','التفاضل والتكامل 1',3,'متطلبات كلية'),
 ('MTH102','الرياضيات المتقطعة',3,'متطلبات كلية'),
 ('STA201','الإحصاء والاحتمالات',3,'متطلبات كلية'),
 ('CS101','مقدمة في البرمجة',3,'متطلبات تخصص إجبارية'),
 ('CS102','البرمجة الكيانية',3,'متطلبات تخصص إجبارية'),
 ('CS201','هياكل البيانات',3,'متطلبات تخصص إجبارية'),
 ('CS202','تنظيم الحاسوب',3,'متطلبات تخصص إجبارية'),
 ('CS211','قواعد البيانات',3,'متطلبات تخصص إجبارية'),
 ('CS221','تحليل الخوارزميات',3,'متطلبات تخصص إجبارية'),
 ('CS301','أنظمة التشغيل',3,'متطلبات تخصص إجبارية'),
 ('CS311','هندسة البرمجيات',3,'متطلبات تخصص إجبارية'),
 ('CS321','شبكات الحاسوب',3,'متطلبات تخصص إجبارية'),
 ('CS331','الذكاء الاصطناعي',3,'متطلبات تخصص إجبارية'),
 ('CS341','تطوير تطبيقات الويب',3,'متطلبات تخصص اختيارية'),
 ('CS351','أمن المعلومات',3,'متطلبات تخصص اختيارية');

insert into public.course_sessions (course_id,weekday,start_time,end_time,room,instructor)
select c.id, s.wd, s.st::time, s.et::time, s.room, s.ins from public.courses c join (values
 ('CS301',0,'09:30','11:00','IT-204','د. سامر العلي'),('CS301',2,'09:30','11:00','IT-204','د. سامر العلي'),
 ('CS311',1,'08:00','09:30','IT-110','د. رنا حداد'),('CS311',3,'08:00','09:30','IT-110','د. رنا حداد'),
 ('CS321',0,'11:30','13:00','LAB-3','م. خالد يوسف'),('CS321',2,'11:30','13:00','LAB-3','م. خالد يوسف'),
 ('CS331',1,'11:00','12:30','IT-302','د. هبة منصور'),('CS331',3,'11:00','12:30','IT-302','د. هبة منصور'),
 ('UNI104',4,'10:00','11:30','A-015','د. محمود سالم'),('UNI104',6,'13:00','14:30','A-015','د. محمود سالم')
) s(code,wd,st,et,room,ins) on s.code = c.code;

insert into public.exams (course_id,kind,starts_at,room)
select c.id, e.kind, e.at::timestamptz, e.room from public.courses c join (values
 ('CS301','امتحان أول','2026-10-12 09:30+03','IT-204'),
 ('CS311','امتحان أول','2026-10-29 08:00+03','IT-110'),
 ('CS321','امتحان أول','2026-11-03 11:30+03','LAB-3'),
 ('CS331','امتحان منتصف الفصل','2026-11-10 11:00+03','IT-302'),
 ('UNI104','امتحان منتصف الفصل','2026-11-17 10:00+03','A-015'),
 ('CS301','الامتحان النهائي','2027-01-10 09:00+03','H-1')
) e(code,kind,at,room) on e.code = c.code;

insert into public.deadlines (title,kind,due_at) values
 ('آخر موعد للسحب والإضافة','registration','2026-09-24 23:59+03'),
 ('آخر موعد لتسديد القسط الثاني','finance','2026-11-05 23:59+03'),
 ('آخر موعد للانسحاب من المواد','withdrawal','2026-12-03 23:59+03'),
 ('بداية الامتحانات النهائية','exams','2027-01-09 08:00+03'),
 ('بدء التسجيل للفصل الثاني','registration','2027-01-25 09:00+03');

-- signup handler: profile + role + demo academic history
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record; gp numeric[] := array[4.0,3.75,3.5,3.0,3.75,3.25,4.0,3.5,2.75,3.5,3.75,3.0,3.25,3.5]; i int := 0;
 terms text[] := array['2023-1','2023-1','2023-1','2023-2','2023-2','2023-2','2024-1','2024-1','2024-1','2024-2','2024-2','2025-1','2025-1','2025-1'];
 letters text := '';
begin
  insert into public.profiles (id, university_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'university_id', split_part(new.email,'@',1)),
          coalesce(new.raw_user_meta_data->>'full_name','طالب جامعة مرشدي'));
  insert into public.user_roles (user_id, role) values (new.id, 'STUDENT');
  for r in select id, code from public.courses where code in
    ('UNI101','UNI102','UNI103','MTH101','MTH102','STA201','CS101','CS102','CS201','CS202','CS211','CS221','CS341','CS351') order by code loop
    i := i + 1;
    insert into public.student_records (user_id, course_id, term_code, status, grade_points, letter)
    values (new.id, r.id, terms[i], 'completed', gp[i],
      case when gp[i] >= 4 then 'A' when gp[i] >= 3.75 then 'A-' when gp[i] >= 3.5 then 'B+' when gp[i] >= 3 then 'B' else 'C+' end);
  end loop;
  insert into public.student_records (user_id, course_id, term_code, status, absences)
  select new.id, c.id, '2026-1', 'current', case c.code when 'CS321' then 3 when 'CS331' then 1 else 0 end
  from public.courses c where c.code in ('CS301','CS311','CS321','CS331','UNI104');
  insert into public.notifications (user_id, title, body, level) values
   (new.id,'اقتراب حد الغياب','لديك 3 غيابات في شبكات الحاسوب. الحد المسموح 6 غيابات.','warning'),
   (new.id,'تم اعتماد خطتك الدراسية','اعتمد المرشد الأكاديمي خطتك للفصل الحالي.','success');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();