-- ============================================================
-- Migration: Add multi-major courses & per-student seed data
-- ============================================================

-- 1. Add courses for all 5 majors
-- ============================================================

-- === تمريض (Nursing) ===
insert into public.courses (code,name,credits,category) values
 ('NRS101','أساسيات التمريض',3,'متطلبات تخصص إجبارية'),
 ('NRS102','علم التشريح ووظائف الأعضاء',3,'متطلبات تخصص إجبارية'),
 ('NRS201','التمريض الباطني والجراحي',3,'متطلبات تخصص إجبارية'),
 ('NRS202','تمريض صحة الأم والطفل',3,'متطلبات تخصص إجبارية'),
 ('NRS211','الصيدلة السريرية',3,'متطلبات تخصص إجبارية'),
 ('NRS301','تمريض الأطفال',3,'متطلبات تخصص إجبارية'),
 ('NRS302','تمريض الصحة النفسية',3,'متطلبات تخصص إجبارية'),
 ('NRS311','تمريض العناية المركزة',3,'متطلبات تخصص إجبارية'),
 ('NRS321','إدارة خدمات التمريض',3,'متطلبات تخصص اختيارية'),
 ('NRS331','تمريض صحة المجتمع',3,'متطلبات تخصص اختيارية')
on conflict (code) do nothing;

-- === هندسة البرمجيات (Software Engineering) ===
insert into public.courses (code,name,credits,category) values
 ('SE101','مبادئ هندسة البرمجيات',3,'متطلبات تخصص إجبارية'),
 ('SE201','تحليل وتصميم الأنظمة',3,'متطلبات تخصص إجبارية'),
 ('SE202','إدارة مشاريع البرمجيات',3,'متطلبات تخصص إجبارية'),
 ('SE211','اختبار البرمجيات',3,'متطلبات تخصص إجبارية'),
 ('SE221','أنماط التصميم',3,'متطلبات تخصص إجبارية'),
 ('SE301','هندسة البرمجيات المتقدمة',3,'متطلبات تخصص إجبارية'),
 ('SE311','بنية البرمجيات',3,'متطلبات تخصص إجبارية'),
 ('SE321','DevOps والتسليم المستمر',3,'متطلبات تخصص اختيارية'),
 ('SE331','تطوير تطبيقات الموبايل',3,'متطلبات تخصص اختيارية')
on conflict (code) do nothing;

-- === الذكاء الاصطناعي (Artificial Intelligence) ===
insert into public.courses (code,name,credits,category) values
 ('AI101','مقدمة في الذكاء الاصطناعي',3,'متطلبات تخصص إجبارية'),
 ('AI201','التعلم الآلي',3,'متطلبات تخصص إجبارية'),
 ('AI202','معالجة اللغات الطبيعية',3,'متطلبات تخصص إجبارية'),
 ('AI211','الرؤية الحاسوبية',3,'متطلبات تخصص إجبارية'),
 ('AI221','التعلم العميق',3,'متطلبات تخصص إجبارية'),
 ('AI301','أنظمة التوصية',3,'متطلبات تخصص إجبارية'),
 ('AI311','الروبوتات الذكية',3,'متطلبات تخصص إجبارية'),
 ('AI321','أخلاقيات الذكاء الاصطناعي',3,'متطلبات تخصص اختيارية'),
 ('AI331','تحليل البيانات الضخمة',3,'متطلبات تخصص اختيارية')
on conflict (code) do nothing;

-- === الأمن السيبراني (Cyber Security) ===
insert into public.courses (code,name,credits,category) values
 ('CYB101','أساسيات الأمن السيبراني',3,'متطلبات تخصص إجبارية'),
 ('CYB201','التشفير وأمن البيانات',3,'متطلبات تخصص إجبارية'),
 ('CYB202','اختبار الاختراق',3,'متطلبات تخصص إجبارية'),
 ('CYB211','أمن الشبكات',3,'متطلبات تخصص إجبارية'),
 ('CYB221','الطب الشرعي الرقمي',3,'متطلبات تخصص إجبارية'),
 ('CYB301','إدارة المخاطر السيبرانية',3,'متطلبات تخصص إجبارية'),
 ('CYB311','أمن الحوسبة السحابية',3,'متطلبات تخصص إجبارية'),
 ('CYB321','تحليل البرمجيات الخبيثة',3,'متطلبات تخصص اختيارية'),
 ('CYB331','أمن إنترنت الأشياء',3,'متطلبات تخصص اختيارية')
on conflict (code) do nothing;

-- 2. Add sessions for new courses (current semester courses only need sessions)
-- ============================================================
insert into public.course_sessions (course_id,weekday,start_time,end_time,room,instructor)
select c.id, s.wd, s.st::time, s.et::time, s.room, s.ins from public.courses c join (values
 -- Nursing sessions
 ('NRS301',0,'08:00','09:30','NRS-101','د. سعاد الأحمد'),('NRS301',2,'08:00','09:30','NRS-101','د. سعاد الأحمد'),
 ('NRS302',1,'10:00','11:30','NRS-102','د. منى عيسى'),('NRS302',3,'10:00','11:30','NRS-102','د. منى عيسى'),
 ('NRS311',0,'12:00','13:30','NRS-LAB','م. فاطمة حسن'),('NRS311',2,'12:00','13:30','NRS-LAB','م. فاطمة حسن'),
 -- SE sessions
 ('SE301',0,'10:00','11:30','IT-301','د. عمر الشريف'),('SE301',2,'10:00','11:30','IT-301','د. عمر الشريف'),
 ('SE311',1,'09:00','10:30','IT-302','د. رائد حمدان'),('SE311',3,'09:00','10:30','IT-302','د. رائد حمدان'),
 ('SE321',0,'13:00','14:30','LAB-5','م. ديانا كرم'),('SE321',4,'13:00','14:30','LAB-5','م. ديانا كرم'),
 -- AI sessions
 ('AI301',1,'13:00','14:30','IT-401','د. هبة منصور'),('AI301',3,'13:00','14:30','IT-401','د. هبة منصور'),
 ('AI311',0,'14:00','15:30','LAB-AI','د. طارق النابلسي'),('AI311',2,'14:00','15:30','LAB-AI','د. طارق النابلسي'),
 ('AI321',4,'11:00','12:30','IT-403','د. ليلى الحسيني'),
 -- CYB sessions
 ('CYB301',1,'14:00','15:30','SEC-101','د. باسل العمري'),('CYB301',3,'14:00','15:30','SEC-101','د. باسل العمري'),
 ('CYB311',0,'08:00','09:30','SEC-LAB','م. أحمد الزعبي'),('CYB311',2,'08:00','09:30','SEC-LAB','م. أحمد الزعبي'),
 ('CYB321',4,'09:00','10:30','SEC-102','د. نور هاشم')
) s(code,wd,st,et,room,ins) on s.code = c.code
on conflict do nothing;


-- 3. Replace the trigger with per-student-type seeding
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_uid text;
  v_name text;
  v_major text;
  v_college text;
  v_plan text;
  v_advisor text;
  v_admission int;
  v_required int;
  v_status text;
  v_student_type text; -- 'excellent','midway','first_sem','failing','graduate'
  r record;
  i int;
begin
  v_uid  := coalesce(new.raw_user_meta_data->>'university_id', split_part(new.email,'@',1));
  v_name := coalesce(new.raw_user_meta_data->>'full_name','طالب جامعة مرشدي');

  -- Determine student type based on university_id
  case v_uid
    when '20210001' then -- خريج / Graduated
      v_major := 'علم الحاسوب'; v_college := 'كلية تكنولوجيا المعلومات';
      v_plan := '2021-CS-01'; v_advisor := 'د. سامر العلي'; v_admission := 2021;
      v_required := 132; v_status := 'خريج'; v_student_type := 'graduate';
    when '20230015' then -- ممتاز / Excellent
      v_major := 'الذكاء الاصطناعي'; v_college := 'كلية تكنولوجيا المعلومات';
      v_plan := '2023-AI-01'; v_advisor := 'د. هبة منصور'; v_admission := 2023;
      v_required := 132; v_status := 'منتظم'; v_student_type := 'excellent';
    when '20250101' then -- أول فصل / First semester
      v_major := 'التمريض'; v_college := 'كلية التمريض';
      v_plan := '2025-NRS-01'; v_advisor := 'د. سعاد الأحمد'; v_admission := 2025;
      v_required := 132; v_status := 'منتظم'; v_student_type := 'first_sem';
    when '20230042' then -- نص الدراسة / Midway
      v_major := 'هندسة البرمجيات'; v_college := 'كلية تكنولوجيا المعلومات';
      v_plan := '2023-SE-01'; v_advisor := 'د. رائد حمدان'; v_admission := 2023;
      v_required := 132; v_status := 'منتظم'; v_student_type := 'midway';
    when '20240033' then -- إنذار أكاديمي / Failing
      v_major := 'الأمن السيبراني'; v_college := 'كلية تكنولوجيا المعلومات';
      v_plan := '2024-CYB-01'; v_advisor := 'د. باسل العمري'; v_admission := 2024;
      v_required := 132; v_status := 'إنذار أكاديمي'; v_student_type := 'failing';
    else -- default for any new user
      v_major := 'علم الحاسوب'; v_college := 'كلية تكنولوجيا المعلومات';
      v_plan := '2023-CS-01'; v_advisor := 'د. ليلى الحسيني'; v_admission := 2023;
      v_required := 132; v_status := 'منتظم'; v_student_type := 'midway';
  end case;

  -- Create profile
  insert into public.profiles (id, university_id, full_name, college, major, plan_no, advisor_name, academic_status, admission_year, required_hours)
  values (new.id, v_uid, v_name, v_college, v_major, v_plan, v_advisor, v_status, v_admission, v_required);

  -- Assign role
  insert into public.user_roles (user_id, role) values (new.id, 'STUDENT');

  -- =======================================================
  -- SEED ACADEMIC HISTORY based on student type
  -- =======================================================

  if v_student_type = 'graduate' then
    -- ===== خريج: أنهى كل المواد (132 ساعة) =====
    -- University reqs (27h = 9 courses)
    i := 0;
    for r in select id from courses where code in ('UNI101','UNI102','UNI103','UNI104') order by code loop
      i := i + 1;
      insert into student_records (user_id, course_id, term_code, status, grade_points, letter)
      values (new.id, r.id,
        case i when 1 then '2023-1' when 2 then '2023-1' when 3 then '2023-1' else '2023-2' end,
        'completed',
        (array[3.75,4.0,3.5,3.75])[i],
        (array['A-','A','B+','A-'])[i]);
    end loop;
    -- College reqs
    for r in select id from courses where code in ('MTH101','MTH102','STA201') order by code loop
      i := i + 1;
      insert into student_records (user_id, course_id, term_code, status, grade_points, letter)
      values (new.id, r.id,
        case when i <= 6 then '2023-1' else '2023-2' end,
        'completed',
        (array[3.25,3.5,3.75])[i-4],
        (array['B+','B+','A-'])[i-4]);
    end loop;
    -- Major courses across all semesters
    i := 0;
    for r in select id from courses where code in
      ('CS101','CS102','CS201','CS202','CS211','CS221','CS301','CS311','CS321','CS331','CS341','CS351') order by code loop
      i := i + 1;
      insert into student_records (user_id, course_id, term_code, status, grade_points, letter)
      values (new.id, r.id,
        case
          when i <= 2 then '2023-2'
          when i <= 4 then '2024-1'
          when i <= 6 then '2024-2'
          when i <= 8 then '2025-1'
          else '2025-1'
        end,
        'completed',
        (array[4.0,3.75,3.5,3.25,4.0,3.75,3.5,3.75,3.0,4.0,3.5,3.75])[i],
        (array['A','A-','B+','B+','A','A-','B+','A-','B','A','B+','A-'])[i]);
    end loop;

  elsif v_student_type = 'excellent' then
    -- ===== ممتاز: GPA 3.85+ سنة ثالثة =====
    -- University reqs
    i := 0;
    for r in select id from courses where code in ('UNI101','UNI102','UNI103','UNI104') order by code loop
      i := i + 1;
      insert into student_records (user_id, course_id, term_code, status, grade_points, letter)
      values (new.id, r.id,
        case i when 1 then '2023-1' when 2 then '2023-1' when 3 then '2023-2' else '2024-1' end,
        'completed',
        (array[4.0,4.0,3.75,4.0])[i],
        (array['A','A','A-','A'])[i]);
    end loop;
    -- College reqs
    i := 0;
    for r in select id from courses where code in ('MTH101','MTH102','STA201') order by code loop
      i := i + 1;
      insert into student_records (user_id, course_id, term_code, status, grade_points, letter)
      values (new.id, r.id,
        case i when 1 then '2023-1' when 2 then '2023-2' else '2024-1' end,
        'completed',
        (array[4.0,3.75,4.0])[i],
        (array['A','A-','A'])[i]);
    end loop;
    -- Major AI courses (completed)
    i := 0;
    for r in select id from courses where code in ('CS101','CS102','CS201','AI101','AI201','AI202','AI211','AI221') order by code loop
      i := i + 1;
      insert into student_records (user_id, course_id, term_code, status, grade_points, letter)
      values (new.id, r.id,
        case
          when i <= 2 then '2023-1'
          when i <= 4 then '2023-2'
          when i <= 6 then '2024-1'
          else '2024-2'
        end,
        'completed',
        (array[4.0,4.0,3.75,4.0,4.0,3.75,4.0,3.75])[i],
        (array['A','A','A-','A','A','A-','A','A-'])[i]);
    end loop;
    -- Current semester
    for r in select id, code from courses where code in ('AI301','AI311','AI321','CS331','UNI104') loop
      insert into student_records (user_id, course_id, term_code, status, absences)
      values (new.id, r.id, '2026-1', 'current', 0);
    end loop;

  elsif v_student_type = 'first_sem' then
    -- ===== أول فصل: لا يوجد تاريخ أكاديمي، فقط مواد الفصل الحالي =====
    for r in select id, code from courses where code in ('NRS101','NRS102','UNI101','UNI102','MTH101') loop
      insert into student_records (user_id, course_id, term_code, status, absences)
      values (new.id, r.id, '2026-1', 'current',
        case r.code when 'NRS101' then 1 when 'NRS102' then 0 else 0 end);
    end loop;

  elsif v_student_type = 'midway' then
    -- ===== نص الدراسة: سنة ثالثة، معدل 3.0 متوسط =====
    -- University reqs
    i := 0;
    for r in select id from courses where code in ('UNI101','UNI102','UNI103') order by code loop
      i := i + 1;
      insert into student_records (user_id, course_id, term_code, status, grade_points, letter)
      values (new.id, r.id,
        case i when 1 then '2023-1' when 2 then '2023-1' else '2023-2' end,
        'completed',
        (array[3.0,2.75,3.25])[i],
        (array['B','B-','B+'])[i]);
    end loop;
    -- College reqs
    i := 0;
    for r in select id from courses where code in ('MTH101','MTH102','STA201') order by code loop
      i := i + 1;
      insert into student_records (user_id, course_id, term_code, status, grade_points, letter)
      values (new.id, r.id,
        case i when 1 then '2023-1' when 2 then '2023-2' else '2024-1' end,
        'completed',
        (array[2.5,3.0,2.75])[i],
        (array['C+','B','B-'])[i]);
    end loop;
    -- Major SE courses
    i := 0;
    for r in select id from courses where code in ('CS101','CS102','CS201','SE101','SE201','SE202','SE211') order by code loop
      i := i + 1;
      insert into student_records (user_id, course_id, term_code, status, grade_points, letter)
      values (new.id, r.id,
        case
          when i <= 2 then '2023-2'
          when i <= 4 then '2024-1'
          when i <= 6 then '2024-2'
          else '2025-1'
        end,
        'completed',
        (array[3.25,2.75,3.0,3.5,3.0,2.75,3.25])[i],
        (array['B+','B-','B','B+','B','B-','B+'])[i]);
    end loop;
    -- Current semester
    for r in select id, code from courses where code in ('SE301','SE311','SE321','CS211','UNI104') loop
      insert into student_records (user_id, course_id, term_code, status, absences)
      values (new.id, r.id, '2026-1', 'current',
        case r.code when 'SE321' then 4 when 'CS211' then 2 else 0 end);
    end loop;

  elsif v_student_type = 'failing' then
    -- ===== راسب / إنذار أكاديمي: GPA أقل من 2.0 =====
    -- University reqs (struggled)
    i := 0;
    for r in select id from courses where code in ('UNI101','UNI102','UNI103') order by code loop
      i := i + 1;
      insert into student_records (user_id, course_id, term_code, status, grade_points, letter)
      values (new.id, r.id,
        case i when 1 then '2024-1' when 2 then '2024-1' else '2024-2' end,
        'completed',
        (array[2.0,1.5,2.25])[i],
        (array['C-','D','C'])[i]);
    end loop;
    -- College reqs (poor)
    i := 0;
    for r in select id from courses where code in ('MTH101','MTH102') order by code loop
      i := i + 1;
      insert into student_records (user_id, course_id, term_code, status, grade_points, letter)
      values (new.id, r.id,
        case i when 1 then '2024-1' else '2024-2' end,
        'completed',
        (array[1.0,1.75])[i],
        (array['F','D+'])[i]);
    end loop;
    -- Cyber courses (failed some, retook)
    i := 0;
    for r in select id from courses where code in ('CS101','CYB101','CYB201') order by code loop
      i := i + 1;
      insert into student_records (user_id, course_id, term_code, status, grade_points, letter)
      values (new.id, r.id,
        case i when 1 then '2024-2' when 2 then '2025-1' else '2025-1' end,
        'completed',
        (array[1.5,2.0,1.0])[i],
        (array['D','C-','F'])[i]);
    end loop;
    -- Retaking failed course + new courses
    for r in select id, code from courses where code in ('CYB201','CYB202','CYB211','UNI104','STA201') loop
      -- CYB201 is a retake
      if r.code = 'CYB201' then
        insert into student_records (user_id, course_id, term_code, status, absences)
        values (new.id, r.id, '2026-1', 'current', 3);
      else
        insert into student_records (user_id, course_id, term_code, status, absences)
        values (new.id, r.id, '2026-1', 'current',
          case r.code when 'CYB211' then 5 when 'STA201' then 2 else 0 end);
      end if;
    end loop;

  end if;

  -- Notifications based on student type
  if v_student_type = 'failing' then
    insert into notifications (user_id, title, body, level) values
      (new.id,'تحذير: إنذار أكاديمي','معدلك التراكمي أقل من 2.0. يرجى مراجعة المرشد الأكاديمي فوراً.','error'),
      (new.id,'اقتراب حد الغياب','لديك 5 غيابات في أمن الشبكات. الحد المسموح 6.','warning'),
      (new.id,'إعادة مادة التشفير','تم تسجيلك لإعادة مادة التشفير وأمن البيانات هذا الفصل.','info');
  elsif v_student_type = 'excellent' then
    insert into notifications (user_id, title, body, level) values
      (new.id,'تهانينا! قائمة الشرف','تم إدراجك في قائمة الشرف للفصل السابق بمعدل امتياز.','success'),
      (new.id,'فرصة بحثية','يوجد فرصة بحث مع د. هبة منصور في مختبر الذكاء الاصطناعي.','info');
  elsif v_student_type = 'first_sem' then
    insert into notifications (user_id, title, body, level) values
      (new.id,'مرحباً بك في جامعة مرشدي!','أهلاً وسهلاً بأول فصل دراسي لك. نتمنى لك التوفيق.','success'),
      (new.id,'جلسة تعريفية','جلسة تعريفية للطلبة الجدد يوم الأحد القادم الساعة 10:00.','info');
  elsif v_student_type = 'graduate' then
    insert into notifications (user_id, title, body, level) values
      (new.id,'تهانينا بالتخرج!','أنهيت جميع متطلبات التخرج بنجاح. مبارك!','success'),
      (new.id,'حفل التخرج','موعد حفل التخرج: 2026-07-15 الساعة 17:00 في القاعة الكبرى.','info');
  elsif v_student_type = 'midway' then
    insert into notifications (user_id, title, body, level) values
      (new.id,'اقتراب حد الغياب','لديك 4 غيابات في DevOps والتسليم المستمر. الحد المسموح 6.','warning'),
      (new.id,'تم اعتماد خطتك الدراسية','اعتمد المرشد الأكاديمي خطتك للفصل الحالي.','success');
  end if;

  return new;
end $$;
