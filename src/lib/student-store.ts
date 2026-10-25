import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  StudentProfile,
  PlanCourse,
  CourseSection,
  AcademicDate,
  NoticeMessage,
  FinancialTransaction,
} from '../types/student';
import { demoStudents } from '../data/demoStudents';
import { offeredCourseSections } from '../data/offeredSections';
import { academicDates as initialDates } from '../data/academicDates';
import rawPlanCourses from '../data/courses_plan12.json';
import { supabase } from '../integrations/supabase/client';
import { checkSectionConflict, findScheduleConflicts, getRegistrationEligibility } from '../services/academicEngine';
import { toast } from 'sonner';

const STORAGE_KEY_PREFIX = 'nextaura_student_state_';
const ACTIVE_STUDENT_ID_KEY = 'nextaura_active_student_id';

// Standardized list of courses
export const allPlanCourses: PlanCourse[] = (rawPlanCourses as any[]).map((c) => ({
  code: c.code,
  name: c.name,
  credits: c.credits,
  group: c.group,
  type: c.type || 'إجباري',
  prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites : [],
  reviewRequired: Boolean(c.reviewRequired),
  reviewReason: c.reviewReason || undefined,
  learningType: c.learningType || 'نظري',
}));

// Initial default student
const defaultStudent = demoStudents[0];

export function getStoredActiveStudentId(): string {
  if (typeof window === 'undefined') return defaultStudent.universityId;
  return localStorage.getItem(ACTIVE_STUDENT_ID_KEY) || defaultStudent.universityId;
}

export function setStoredActiveStudentId(id: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACTIVE_STUDENT_ID_KEY, id);
  }
}

export function loadStudentState(universityId: string): StudentProfile {
  const base = demoStudents.find((s) => s.universityId === universityId) || demoStudents[0];
  if (typeof window === 'undefined') return base;

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${universityId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...base, ...parsed };
    }
  } catch (e) {
    console.error('Error loading stored student state:', e);
  }
  return base;
}

export function saveStudentState(profile: StudentProfile) {
  if (typeof window === 'undefined' || !profile?.universityId) return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${profile.universityId}`, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving student state:', e);
  }
}

export interface StudentStore {
  activeStudent: StudentProfile;
  studentsDirectory: StudentProfile[];
  courses: PlanCourse[];
  offeredSections: CourseSection[];
  academicDates: AcademicDate[];
  basketSections: CourseSection[];
  notifications: NoticeMessage[];
  role: 'student' | 'admin';
  isLoading: boolean;
  
  // Actions
  selectStudentById: (studentId: string) => void;
  addToBasket: (section: CourseSection) => { success: boolean; message: string };
  removeFromBasket: (sectionId: string) => void;
  clearBasket: () => void;
  confirmRegistration: () => Promise<{ success: boolean; message: string }>;
  withdrawSection: (sectionId: string) => Promise<{ success: boolean; message: string }>;
  swapSection: (oldSectionId: string, newSection: CourseSection) => Promise<{ success: boolean; message: string }>;
  processPayment: (amount: number, method: string) => Promise<{ success: boolean; receiptNumber: string }>;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  postAnnouncement: (notice: Omit<NoticeMessage, 'id' | 'date' | 'unread'>) => void;
  updateGrade: (studentId: string, courseCode: string, grade: number, letterGrade?: string) => Promise<boolean>;
  updateSectionCapacity: (sectionId: string, capacity: number, status: CourseSection['status']) => void;
  resetStudentState: (universityId?: string) => void;
}

const initialNotifications: NoticeMessage[] = [
  {
    id: 'notif-1',
    title: 'انطلاق فترة التسجيل الإلكتروني والسحب والإضافة',
    body: 'نحيطكم علماً بأن فترة السحب والإضافة الإلكترونية للفصل الأول 2026/2027 نشطة ومتاحة لجميع الطلاب.',
    date: 'اليوم · 09:00 ص',
    category: 'التسجيل',
    tone: 'important',
    unread: true,
  },
  {
    id: 'notif-2',
    title: 'إعلان جدول الامتحانات ومواقع القاعات والمختبرات',
    body: 'تم اعتماد ونشر جدول الامتحانات المحوسبة والورقية على بوابتكم الأكاديمية مع أرقام المقاعد المخصصة.',
    date: 'أمس · 01:30 م',
    category: 'الامتحانات',
    tone: 'academic',
    unread: true,
  },
  {
    id: 'notif-3',
    title: 'اعتماد الخطة الدراسية وتحديث الشعب المطروحة',
    body: 'اعتمد المرشد الأكاديمي جدولك الدراسي وتم فتح شعب إضافية لمواد التخصص الإجبارية.',
    date: 'منذ 3 أيام',
    category: 'الشؤون الأكاديمية',
    tone: 'academic',
    unread: false,
  },
  {
    id: 'notif-4',
    title: 'ساعات دوام القبول والتسجيل والمركز المالي',
    body: 'تستقبل مكاتب العمادة والمالية المراجعات اليومية من الأحد إلى الخميس من 08:30 ص إلى 03:30 م.',
    date: 'منذ أسبوع',
    category: 'خدمة الطلبة',
    tone: 'general',
    unread: false,
  },
];

let globalStoreState: {
  activeStudent: StudentProfile;
  offeredSections: CourseSection[];
  basketSections: CourseSection[];
  notifications: NoticeMessage[];
  listeners: Set<() => void>;
} | null = null;

function getGlobalStore() {
  if (!globalStoreState) {
    const id = getStoredActiveStudentId();
    const student = loadStudentState(id);
    globalStoreState = {
      activeStudent: student,
      offeredSections: [...offeredCourseSections],
      basketSections: [],
      notifications: [...initialNotifications],
      listeners: new Set(),
    };
  }
  return globalStoreState;
}

export function useStudentStore(): StudentStore {
  const store = getGlobalStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    const notify = () => setTick((t) => t + 1);
    store.listeners.add(notify);

    // Initial check for signed-in user in Supabase
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const metadata = data.user.user_metadata;
        const uid = metadata?.university_id || data.user.email?.split('@')[0];
        if (uid && uid !== store.activeStudent.universityId) {
          const match = demoStudents.find((s) => s.universityId === uid);
          if (match) {
            store.activeStudent = loadStudentState(uid);
            setStoredActiveStudentId(uid);
            notify();
          }
        }
      }
    });

    return () => {
      store.listeners.delete(notify);
    };
  }, [store]);

  const emit = useCallback(() => {
    store.listeners.forEach((fn) => fn());
  }, [store]);

  const selectStudentById = useCallback(
    (studentId: string) => {
      const match = demoStudents.find((s) => s.universityId === studentId);
      if (match) {
        store.activeStudent = loadStudentState(studentId);
        store.basketSections = [];
        setStoredActiveStudentId(studentId);
        emit();
      }
    },
    [store, emit],
  );

  const addToBasket = useCallback(
    (section: CourseSection) => {
      const student = store.activeStudent;
      const courses = allPlanCourses;

      // 1. Check if course already taken
      if (student.completedCourses.includes(section.courseCode)) {
        return { success: false, message: 'المساق مجتاز ومستوفى سابقاً في سجلك الأكاديمي.' };
      }

      // 2. Check if already registered or in basket
      if (student.currentRegisteredSections.some((s) => s.courseCode === section.courseCode)) {
        return { success: false, message: 'المساق مسجل بالفعل في جدولك الدراسي الحالي.' };
      }
      if (store.basketSections.some((s) => s.courseCode === section.courseCode)) {
        return { success: false, message: 'المساق موجود مسبقاً في سلة التسجيل.' };
      }

      // 3. Check section capacity
      if (section.enrolled >= section.capacity || section.status === 'ممتلئة') {
        return { success: false, message: 'عذراً، هذه الشعبة ممتلئة تماماً ولا تتوفر مقاعد شاغرة.' };
      }

      // 4. Check prerequisites
      const eligibility = getRegistrationEligibility(section.courseCode, student, courses);
      if (eligibility.state !== 'ELIGIBLE') {
        return { success: false, message: eligibility.reason || 'المتطلبات السابقة للمساق غير مستوفاة.' };
      }

      // 5. Check credit limits (max 21 credits)
      const currentHours = student.currentRegisteredSections.reduce((acc, s) => acc + s.credits, 0);
      const basketHours = store.basketSections.reduce((acc, s) => acc + s.credits, 0);
      const MAX_CREDITS = 21;
      if (currentHours + basketHours + section.credits > MAX_CREDITS) {
        return {
          success: false,
          message: `لا يمكن تجاوز الحد الأقصى للعبء الدراسي المسموح به (${MAX_CREDITS} ساعة معتمدة).`,
        };
      }

      // 6. Check time conflict
      const allSelected = [...student.currentRegisteredSections, ...store.basketSections];
      const conflict = allSelected.find((existing) => checkSectionConflict(section, existing));
      if (conflict) {
        return {
          success: false,
          message: `يوجد تعارض زمني مع مساق "${conflict.courseName}" (${conflict.days} ${conflict.startTime}-${conflict.endTime}).`,
        };
      }

      store.basketSections.push(section);
      emit();
      return { success: true, message: `تمت إضافة مساق "${section.courseName}" إلى سلة التسجيل بنجاح.` };
    },
    [store, emit],
  );

  const removeFromBasket = useCallback(
    (sectionId: string) => {
      store.basketSections = store.basketSections.filter((s) => s.id !== sectionId);
      emit();
    },
    [store, emit],
  );

  const clearBasket = useCallback(() => {
    store.basketSections = [];
    emit();
  }, [store, emit]);

  const confirmRegistration = useCallback(async () => {
    if (store.basketSections.length === 0) {
      return { success: false, message: 'سلة التسجيل فارغة. اختر شعباً أولاً لتأكيد تسجيلها.' };
    }

    const newSections = [...store.basketSections];
    const addedCredits = newSections.reduce((sum, s) => sum + s.credits, 0);
    const feePerCredit = 40; // 40 JOD per credit hour
    const feeAmount = addedCredits * feePerCredit;

    // Update section enrollment numbers
    store.offeredSections = store.offeredSections.map((sec) => {
      const matched = newSections.find((ns) => ns.id === sec.id);
      if (matched) {
        const nextEnrolled = sec.enrolled + 1;
        return {
          ...sec,
          enrolled: nextEnrolled,
          status: nextEnrolled >= sec.capacity ? 'ممتلئة' : sec.status,
        };
      }
      return sec;
    });

    // Update active student
    const updatedStudent: StudentProfile = {
      ...store.activeStudent,
      currentRegisteredSections: [...store.activeStudent.currentRegisteredSections, ...newSections],
      financialSummary: {
        ...store.activeStudent.financialSummary,
        totalFees: store.activeStudent.financialSummary.totalFees + feeAmount,
        currentBalance: store.activeStudent.financialSummary.currentBalance + feeAmount,
      },
      transactions: [
        {
          id: `TXN-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          reference: `REG-${Date.now().toString().slice(-6)}`,
          statement: `رسوم تسجيل مساقات الفصل الحالي (${addedCredits} ساعات معتمدة)`,
          debit: feeAmount,
          credit: 0,
          balance: store.activeStudent.financialSummary.currentBalance + feeAmount,
        },
        ...store.activeStudent.transactions,
      ],
    };

    // Save and clear basket
    store.activeStudent = updatedStudent;
    store.basketSections = [];
    saveStudentState(updatedStudent);

    // Add a confirmation notification
    store.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'تأكيد عملية التسجيل الأكاديمي بنجاح',
      body: `تم تثبيت تسجيل ${newSections.length} مساقات دراسية جديدة بمجموع ${addedCredits} ساعة معتمدة. تم تحديث جدولك الدراسي والمركز المالي.`,
      date: 'الآن',
      category: 'التسجيل',
      tone: 'important',
      unread: true,
    });

    // Sync to Supabase user metadata if authenticated
    try {
      await supabase.auth.updateUser({
        data: {
          currentRegisteredSections: updatedStudent.currentRegisteredSections,
          lastRegistrationDate: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.warn('Supabase auth metadata update notice:', e);
    }

    emit();
    return {
      success: true,
      message: `تم تثبيت تسجيل ${newSections.length} مساق بنجاح (${addedCredits} ساعة معتمدة).`,
    };
  }, [store, emit]);

  const withdrawSection = useCallback(
    async (sectionId: string) => {
      const sec = store.activeStudent.currentRegisteredSections.find((s) => s.id === sectionId);
      if (!sec) {
        return { success: false, message: 'الشعبة المحددة غير مسجلة في جدولك.' };
      }

      // Restore seat capacity
      store.offeredSections = store.offeredSections.map((s) => {
        if (s.id === sectionId) {
          const nextEnrolled = Math.max(0, s.enrolled - 1);
          return {
            ...s,
            enrolled: nextEnrolled,
            status: nextEnrolled < s.capacity && s.status === 'ممتلئة' ? 'متاحة' : s.status,
          };
        }
        return s;
      });

      const refundAmount = sec.credits * 40;
      const updatedStudent: StudentProfile = {
        ...store.activeStudent,
        currentRegisteredSections: store.activeStudent.currentRegisteredSections.filter(
          (s) => s.id !== sectionId,
        ),
        financialSummary: {
          ...store.activeStudent.financialSummary,
          totalFees: Math.max(0, store.activeStudent.financialSummary.totalFees - refundAmount),
          currentBalance: Math.max(0, store.activeStudent.financialSummary.currentBalance - refundAmount),
        },
        transactions: [
          {
            id: `TXN-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            reference: `WDR-${Date.now().toString().slice(-6)}`,
            statement: `إسقاط مساق ${sec.courseName} واسترداد رسوم (${sec.credits} ساعات)`,
            debit: 0,
            credit: refundAmount,
            balance: Math.max(0, store.activeStudent.financialSummary.currentBalance - refundAmount),
          },
          ...store.activeStudent.transactions,
        ],
      };

      store.activeStudent = updatedStudent;
      saveStudentState(updatedStudent);

      store.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: `تم سحب وإسقاط مساق: ${sec.courseName}`,
        body: `تم تنفيذ طلب إسقاط المساق (${sec.courseCode}) رسمياً واسترداد رسوم ساعاته إلى رصيدك.`,
        date: 'الآن',
        category: 'التسجيل',
        tone: 'academic',
        unread: true,
      });

      emit();
      return { success: true, message: `تم سحب مساق "${sec.courseName}" بنجاح وتحديث الجدول والملف المالي.` };
    },
    [store, emit],
  );

  const swapSection = useCallback(
    async (oldSectionId: string, newSection: CourseSection) => {
      const oldSec = store.activeStudent.currentRegisteredSections.find((s) => s.id === oldSectionId);
      if (!oldSec) return { success: false, message: 'الشعبة الحالية غير موجودة في جدولك.' };

      if (newSection.enrolled >= newSection.capacity && newSection.status === 'ممتلئة') {
        return { success: false, message: 'الشعبة البديلة ممتلئة ولا يوجد بها مقاعد شاغرة.' };
      }

      // Check conflict with other courses (excluding the old section)
      const otherCourses = store.activeStudent.currentRegisteredSections.filter((s) => s.id !== oldSectionId);
      const conflict = otherCourses.find((c) => checkSectionConflict(newSection, c));
      if (conflict) {
        return {
          success: false,
          message: `تتعارض الشعبة البديلة زمنياً مع مساق "${conflict.courseName}" (${conflict.days} ${conflict.startTime}-${conflict.endTime}).`,
        };
      }

      // Update capacities
      store.offeredSections = store.offeredSections.map((s) => {
        if (s.id === oldSectionId) {
          const nextEnrolled = Math.max(0, s.enrolled - 1);
          return { ...s, enrolled: nextEnrolled, status: 'متاحة' };
        }
        if (s.id === newSection.id) {
          const nextEnrolled = s.enrolled + 1;
          return {
            ...s,
            enrolled: nextEnrolled,
            status: nextEnrolled >= s.capacity ? 'ممتلئة' : s.status,
          };
        }
        return s;
      });

      const updatedSections = store.activeStudent.currentRegisteredSections.map((s) =>
        s.id === oldSectionId ? newSection : s,
      );

      const updatedStudent: StudentProfile = {
        ...store.activeStudent,
        currentRegisteredSections: updatedSections,
      };

      store.activeStudent = updatedStudent;
      saveStudentState(updatedStudent);

      store.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: `تعديل شعبة مساق: ${newSection.courseName}`,
        body: `تم تبديل الشعبة بنجاح من شعبة ${oldSec.sectionNumber} إلى شعبة ${newSection.sectionNumber} (${newSection.days} ${newSection.startTime}-${newSection.endTime}).`,
        date: 'الآن',
        category: 'التسجيل',
        tone: 'academic',
        unread: true,
      });

      emit();
      return { success: true, message: `تم تغيير الشعبة إلى شعبة (${newSection.sectionNumber}) بنجاح.` };
    },
    [store, emit],
  );

  const processPayment = useCallback(
    async (amount: number, method: string) => {
      const receiptNumber = `PAY-${Date.now().toString().slice(-8)}`;
      const currentBal = store.activeStudent.financialSummary.currentBalance;
      const newBal = Math.max(0, currentBal - amount);

      const updatedStudent: StudentProfile = {
        ...store.activeStudent,
        financialSummary: {
          ...store.activeStudent.financialSummary,
          totalPayments: store.activeStudent.financialSummary.totalPayments + amount,
          currentBalance: newBal,
        },
        transactions: [
          {
            id: `TXN-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            reference: receiptNumber,
            statement: `دفعة مالية إلكترونية عبر (${method}) - إيصال سداد رقم #${receiptNumber}`,
            debit: 0,
            credit: amount,
            balance: newBal,
          },
          ...store.activeStudent.transactions,
        ],
      };

      store.activeStudent = updatedStudent;
      saveStudentState(updatedStudent);

      store.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'استلام دفعة مالية وقيدها بالحساب',
        body: `تم قيد دفعتك المالية بقيمة ${amount.toFixed(2)} د.أ بنجاح. رقم الإيصال: ${receiptNumber}. الرصيد المتبقي: ${newBal.toFixed(2)} د.أ.`,
        date: 'الآن',
        category: 'المالية',
        tone: 'important',
        unread: true,
      });

      emit();
      return { success: true, receiptNumber };
    },
    [store, emit],
  );

  const markNotificationAsRead = useCallback(
    (id: string) => {
      store.notifications = store.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n));
      emit();
    },
    [store, emit],
  );

  const markAllNotificationsAsRead = useCallback(() => {
    store.notifications = store.notifications.map((n) => ({ ...n, unread: false }));
    emit();
  }, [store, emit]);

  const deleteNotification = useCallback(
    (id: string) => {
      store.notifications = store.notifications.filter((n) => n.id !== id);
      emit();
    },
    [store, emit],
  );

  const postAnnouncement = useCallback(
    (notice: Omit<NoticeMessage, 'id' | 'date' | 'unread'>) => {
      store.notifications.unshift({
        ...notice,
        id: `notif-${Date.now()}`,
        date: 'الآن',
        unread: true,
      });
      emit();
    },
    [store, emit],
  );

  const updateGrade = useCallback(
    async (studentId: string, courseCode: string, grade: number, letterGrade?: string) => {
      const calcLetter = (val: number) => {
        if (val >= 90) return 'A';
        if (val >= 85) return 'A-';
        if (val >= 80) return 'B+';
        if (val >= 75) return 'B';
        if (val >= 70) return 'C+';
        if (val >= 60) return 'C';
        if (val >= 50) return 'D';
        return 'F';
      };

      const finalLetter = letterGrade || calcLetter(grade);
      const isPass = grade >= 60;

      const target = store.activeStudent.universityId === studentId ? store.activeStudent : loadStudentState(studentId);
      const updatedHistory = target.semesterHistory.map((sem, sIdx) => {
        if (sIdx === target.semesterHistory.length - 1) {
          const courses = sem.courses.map((c) =>
            c.courseCode === courseCode
              ? {
                  ...c,
                  grade,
                  letterGrade: finalLetter,
                  status: (isPass ? 'ناجح' : 'راسب') as 'ناجح' | 'راسب',
                }
              : c,
          );
          return { ...sem, courses };
        }
        return sem;
      });

      const updatedStudent: StudentProfile = {
        ...target,
        semesterHistory: updatedHistory,
      };

      if (target.universityId === store.activeStudent.universityId) {
        store.activeStudent = updatedStudent;
      }
      saveStudentState(updatedStudent);
      emit();
      return true;
    },
    [store, emit],
  );

  const updateSectionCapacity = useCallback(
    (sectionId: string, capacity: number, status: CourseSection['status']) => {
      store.offeredSections = store.offeredSections.map((s) =>
        s.id === sectionId ? { ...s, capacity, status } : s,
      );
      emit();
    },
    [store, emit],
  );

  const resetStudentState = useCallback(
    (universityId?: string) => {
      const id = universityId || store.activeStudent.universityId;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
      }
      const base = demoStudents.find((s) => s.universityId === id) || demoStudents[0];
      if (id === store.activeStudent.universityId) {
        store.activeStudent = { ...base };
        store.basketSections = [];
      }
      emit();
      toast.success('تمت إعادة ضبط بيانات الطالب وحالة التسجيل بنجاح.');
    },
    [store, emit],
  );

  return {
    activeStudent: store.activeStudent,
    studentsDirectory: demoStudents,
    courses: allPlanCourses,
    offeredSections: store.offeredSections,
    academicDates: initialDates,
    basketSections: store.basketSections,
    notifications: store.notifications,
    role: store.activeStudent.role === 'admin' ? 'admin' : 'student',
    isLoading: false,
    selectStudentById,
    addToBasket,
    removeFromBasket,
    clearBasket,
    confirmRegistration,
    withdrawSection,
    swapSection,
    processPayment,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    postAnnouncement,
    updateGrade,
    updateSectionCapacity,
    resetStudentState,
  };
}

