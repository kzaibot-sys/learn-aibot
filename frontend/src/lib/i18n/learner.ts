import type { AppLocale } from "@/components/providers/language-provider";

type LearnerCopy = {
  common: {
    free: string;
    retry: string;
    browseCatalog: string;
    myCourses: string;
    open: string;
    continue: string;
    saveProgress: string;
    processing: string;
    loading: string;
    unavailable: string;
    inProgress: string;
    completed: string;
    general: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    heroEyebrow: string;
    heroTitle: string;
    heroDescription: string;
    enrolledCourses: string;
    enrolledCoursesHint: string;
    completedCourses: string;
    completedCoursesHint: string;
    averageProgress: string;
    averageProgressHint: string;
    currentStreak: string;
    currentStreakHint: string;
    summaryUnavailableTitle: string;
    summaryUnavailableBody: string;
    gamificationUnavailableTitle: string;
    gamificationUnavailableBody: string;
    continueTitle: string;
    continueSubtitle: string;
    noEnrollmentsTitle: string;
    noEnrollmentsBody: string;
    achievementsTitle: string;
    achievementsSubtitle: string;
    noAchievementsBody: string;
    openedLessons: string;
    currentStreakLabel: string;
    longestStreakLabel: string;
    awardedXp: string;
    findCourse: string;
    openLesson: string;
  };
  courses: {
    title: string;
    subtitle: string;
    filtersEyebrow: string;
    filtersTitle: string;
    filtersDescription: string;
    search: string;
    category: string;
    level: string;
    language: string;
    resetFilters: string;
    resultsLoading: string;
    resultsFound: string;
    resultsFoundOne: string;
    sortedByPopularity: string;
    checkoutErrorTitle: string;
    checkoutErrorBody: string;
    checkoutSuccessTitle: string;
    checkoutSuccessBody: string;
    catalogUnavailableTitle: string;
    catalogUnavailableBody: string;
    noMatchesTitle: string;
    noMatchesBody: string;
    clearFilters: string;
    myCoursesCta: string;
    enroll: string;
    processing: string;
    open: string;
    courseMetaGeneral: string;
    courseTagsTitle: string;
  };
  myCourses: {
    title: string;
    subtitle: string;
    queueEyebrow: string;
    queueTitle: string;
    queueDescription: string;
    refresh: string;
    browseCatalog: string;
    enrollments: string;
    inProgress: string;
    completed: string;
    errorTitle: string;
    errorBody: string;
    noCoursesTitle: string;
    noCoursesBody: string;
    inProgressLabel: string;
    completedLabel: string;
    continue: string;
    freeCourse: string;
    courseSubtitleGeneral: string;
  };
  player: {
    title: string;
    subtitle: string;
    courseProgressEyebrow: string;
    courseProgressTitle: string;
    courseProgressDescription: string;
    progress: string;
    lessons: string;
    unlocked: string;
    current: string;
    courseCurriculumUnavailableTitle: string;
    courseCurriculumUnavailableBody: string;
    backToCatalog: string;
    browseCatalog: string;
    noLessonsTitle: string;
    noLessonsBody: string;
    noUnlockedLessonTitle: string;
    noUnlockedLessonBody: string;
    lessonLoading: string;
    lessonUnavailableTitle: string;
    lessonUnavailableBody: string;
    currentLesson: string;
    watchTime: string;
    resumeHint: string;
    saveProgress: string;
    saving: string;
    lessonsHeader: string;
    unlockedCounter: string;
    moduleLessons: string;
    courseId: string;
    lessonCompleted: string;
    lessonReady: string;
    lessonLocked: string;
    lessonCouldNotLoadTitle: string;
    lessonCouldNotLoadBody: string;
  };
};

const en: LearnerCopy = {
  common: {
    free: "Free",
    retry: "Retry",
    browseCatalog: "Browse catalog",
    myCourses: "My courses",
    open: "Open",
    continue: "Continue",
    saveProgress: "Save progress",
    processing: "Processing...",
    loading: "Loading...",
    unavailable: "Unavailable",
    inProgress: "In progress",
    completed: "Completed",
    general: "General",
  },
  dashboard: {
    title: "Welcome",
    subtitle: "Track progress, continue lessons and grow your learning streak.",
    heroEyebrow: "Learning overview",
    heroTitle: "Keep momentum with a clear view of what is next.",
    heroDescription:
      "Resume your current lessons, compare progress across enrollments, and use streaks to keep learning consistent.",
    enrolledCourses: "Enrolled courses",
    enrolledCoursesHint: "Active learning paths",
    completedCourses: "Completed courses",
    completedCoursesHint: "Finished programs",
    averageProgress: "Average progress",
    averageProgressHint: "Across your enrollments",
    currentStreak: "Current streak",
    currentStreakHint: "Days in a row",
    summaryUnavailableTitle: "Dashboard summary is unavailable",
    summaryUnavailableBody: "We could not load your summary right now.",
    gamificationUnavailableTitle: "Gamification data is unavailable",
    gamificationUnavailableBody: "We could not load your streak and badges right now.",
    continueTitle: "Continue learning",
    continueSubtitle: "Jump back into the course you were last working on.",
    noEnrollmentsTitle: "You have no active enrollments yet",
    noEnrollmentsBody: "Browse the catalog to get started.",
    achievementsTitle: "Achievements",
    achievementsSubtitle: "XP, level, and badges collected from your learning streak.",
    noAchievementsBody: "Complete lessons and keep your streak active to unlock badges.",
    openedLessons: "Open lesson",
    currentStreakLabel: "Current streak",
    longestStreakLabel: "Longest streak",
    awardedXp: "Awarded for {xp} XP",
    findCourse: "Find a course",
    openLesson: "Open lesson",
  },
  courses: {
    title: "Course Catalog",
    subtitle: "Explore programs, refine by topic, and enroll without losing your place.",
    filtersEyebrow: "Catalog filters",
    filtersTitle: "Find the right course faster, then jump into learning.",
    filtersDescription:
      "Search by keyword or narrow by category, level, and language. Results update as you change the filters.",
    search: "Search",
    category: "Category",
    level: "Level",
    language: "Language",
    resetFilters: "Reset filters",
    resultsLoading: "Loading courses...",
    resultsFound: "{count} course found",
    resultsFoundOne: "{count} course found",
    sortedByPopularity: "Sorted by popularity",
    checkoutErrorTitle: "Checkout could not start",
    checkoutErrorBody: "Please try again.",
    checkoutSuccessTitle: "Enrollment request sent",
    checkoutSuccessBody: "Your checkout request was accepted. Open My courses to continue.",
    catalogUnavailableTitle: "Catalog is unavailable",
    catalogUnavailableBody: "Failed to load courses.",
    noMatchesTitle: "No courses match these filters",
    noMatchesBody: "Adjust the search terms or clear the filters to see the full catalog.",
    clearFilters: "Clear filters",
    myCoursesCta: "My courses",
    enroll: "Enroll",
    processing: "Processing...",
    open: "Open",
    courseMetaGeneral: "General",
    courseTagsTitle: "Course tags",
  },
  myCourses: {
    title: "My Courses",
    subtitle: "Continue where you left off, see progress at a glance, and reopen lessons quickly.",
    queueEyebrow: "Your learning queue",
    queueTitle: "Everything you are enrolled in, organized in one place.",
    queueDescription:
      "Review progress, jump back into a lesson, or head to the catalog when you want a new topic.",
    refresh: "Refresh",
    browseCatalog: "Browse catalog",
    enrollments: "Enrollments",
    inProgress: "In progress",
    completed: "Completed",
    errorTitle: "Could not load your courses",
    errorBody: "Failed to load your enrollments.",
    noCoursesTitle: "You are not enrolled in any courses yet",
    noCoursesBody: "Open the catalog to choose a course, then come back here to continue learning.",
    inProgressLabel: "In progress",
    completedLabel: "Completed",
    continue: "Continue",
    freeCourse: "Free course",
    courseSubtitleGeneral: "General",
  },
  player: {
    title: "Learning Player",
    subtitle: "Sequential learning path with automatic progress and lesson locks.",
    courseProgressEyebrow: "Course progress",
    courseProgressTitle: "Continue through the learning path in order.",
    courseProgressDescription: "Continue through the learning path in order.",
    progress: "Progress",
    lessons: "Lessons",
    unlocked: "Unlocked",
    current: "Current",
    courseCurriculumUnavailableTitle: "Course curriculum is unavailable",
    courseCurriculumUnavailableBody: "We could not load the curriculum right now.",
    backToCatalog: "Back to catalog",
    browseCatalog: "Browse catalog",
    noLessonsTitle: "No lessons are available yet",
    noLessonsBody:
      "This course has not published a curriculum. Check back later or browse other courses.",
    noUnlockedLessonTitle: "No unlocked lesson yet",
    noUnlockedLessonBody: "Finish the previous item to unlock the next lesson.",
    lessonLoading: "Loading lesson...",
    lessonUnavailableTitle: "Lesson could not load",
    lessonUnavailableBody: "We could not load the selected lesson right now.",
    currentLesson: "Current lesson",
    watchTime: "Watch time",
    resumeHint: "Resume time syncs automatically when you switch lessons.",
    saveProgress: "Save progress",
    saving: "Saving...",
    lessonsHeader: "Lessons",
    unlockedCounter: "{unlocked}/{total} unlocked",
    moduleLessons: "{count} lessons",
    courseId: "Course ID",
    lessonCompleted: "This lesson is completed.",
    lessonReady: "This lesson is unlocked and ready.",
    lessonLocked: "Lesson is locked until previous completion.",
    lessonCouldNotLoadTitle: "Lesson could not load",
    lessonCouldNotLoadBody: "We could not load the selected lesson right now.",
  },
  };

const ru: LearnerCopy = {
  common: {
    free: "Бесплатно",
    retry: "Повторить",
    browseCatalog: "Каталог",
    myCourses: "Мои курсы",
    open: "Открыть",
    continue: "Продолжить",
    saveProgress: "Сохранить прогресс",
    processing: "Обработка...",
    loading: "Загрузка...",
    unavailable: "Недоступно",
    inProgress: "В процессе",
    completed: "Завершено",
    general: "Общее",
  },
  dashboard: {
    title: "Добро пожаловать",
    subtitle: "Следите за прогрессом, продолжайте уроки и сохраняйте учебный ритм.",
    heroEyebrow: "Обзор обучения",
    heroTitle: "Сохраняйте темп, видя следующий шаг сразу.",
    heroDescription:
      "Продолжайте текущие уроки, сравнивайте прогресс по записям и держите учебный ритм стабильным.",
    enrolledCourses: "Записанные курсы",
    enrolledCoursesHint: "Активные учебные маршруты",
    completedCourses: "Завершенные курсы",
    completedCoursesHint: "Пройденные программы",
    averageProgress: "Средний прогресс",
    averageProgressHint: "По всем записям",
    currentStreak: "Текущая серия",
    currentStreakHint: "Дней подряд",
    summaryUnavailableTitle: "Сводка дашборда недоступна",
    summaryUnavailableBody: "Сейчас не удалось загрузить сводку.",
    gamificationUnavailableTitle: "Данные геймификации недоступны",
    gamificationUnavailableBody: "Сейчас не удалось загрузить серию и награды.",
    continueTitle: "Продолжить обучение",
    continueSubtitle: "Вернитесь к курсу, который открывали последним.",
    noEnrollmentsTitle: "У вас пока нет активных записей",
    noEnrollmentsBody: "Откройте каталог, чтобы начать.",
    achievementsTitle: "Достижения",
    achievementsSubtitle: "XP, уровень и значки, полученные за учебный ритм.",
    noAchievementsBody: "Проходите уроки и удерживайте серию, чтобы открывать награды.",
    openedLessons: "Открыть урок",
    currentStreakLabel: "Текущая серия",
    longestStreakLabel: "Лучшая серия",
    awardedXp: "Награда за {xp} XP",
    findCourse: "Найти курс",
    openLesson: "Открыть урок",
  },
  courses: {
    title: "Каталог курсов",
    subtitle: "Изучайте программы, фильтруйте по теме и записывайтесь без лишних шагов.",
    filtersEyebrow: "Фильтры каталога",
    filtersTitle: "Найдите подходящий курс быстрее и сразу переходите к обучению.",
    filtersDescription:
      "Ищите по ключевым словам или уточняйте по категории, уровню и языку. Результаты обновляются по мере ввода.",
    search: "Поиск",
    category: "Категория",
    level: "Уровень",
    language: "Язык",
    resetFilters: "Сбросить фильтры",
    resultsLoading: "Загрузка курсов...",
    resultsFound: "Найден {count} курс",
    resultsFoundOne: "Найден {count} курс",
    sortedByPopularity: "Сортировка по популярности",
    checkoutErrorTitle: "Не удалось начать оформление",
    checkoutErrorBody: "Попробуйте еще раз.",
    checkoutSuccessTitle: "Запрос на запись отправлен",
    checkoutSuccessBody: "Ваш запрос принят. Откройте Мои курсы, чтобы продолжить.",
    catalogUnavailableTitle: "Каталог недоступен",
    catalogUnavailableBody: "Не удалось загрузить курсы.",
    noMatchesTitle: "Курсы не найдены",
    noMatchesBody: "Измените запрос или сбросьте фильтры, чтобы увидеть весь каталог.",
    clearFilters: "Очистить фильтры",
    myCoursesCta: "Мои курсы",
    enroll: "Записаться",
    processing: "Обработка...",
    open: "Открыть",
    courseMetaGeneral: "Общее",
    courseTagsTitle: "Теги курса",
  },
  myCourses: {
    title: "Мои курсы",
    subtitle: "Возвращайтесь к урокам, смотрите прогресс и открывайте обучение быстрее.",
    queueEyebrow: "Ваша учебная очередь",
    queueTitle: "Все курсы, на которые вы записаны, в одном месте.",
    queueDescription:
      "Проверяйте прогресс, возвращайтесь к уроку или переходите в каталог, если нужен новый курс.",
    refresh: "Обновить",
    browseCatalog: "Открыть каталог",
    enrollments: "Записи",
    inProgress: "В процессе",
    completed: "Завершено",
    errorTitle: "Не удалось загрузить курсы",
    errorBody: "Не удалось загрузить ваши записи.",
    noCoursesTitle: "Вы пока не записаны ни на один курс",
    noCoursesBody:
      "Откройте каталог, выберите курс и вернитесь сюда, чтобы продолжить обучение.",
    inProgressLabel: "В процессе",
    completedLabel: "Завершено",
    continue: "Продолжить",
    freeCourse: "Бесплатный курс",
    courseSubtitleGeneral: "Общее",
  },
  player: {
    title: "Плеер обучения",
    subtitle: "Последовательный путь обучения с автопрогрессом и блокировкой уроков.",
    courseProgressEyebrow: "Прогресс курса",
    courseProgressTitle: "Продолжайте обучение по порядку.",
    courseProgressDescription: "Продолжайте обучение по порядку.",
    progress: "Прогресс",
    lessons: "Уроки",
    unlocked: "Открыто",
    current: "Текущий",
    courseCurriculumUnavailableTitle: "Учебный план недоступен",
    courseCurriculumUnavailableBody: "Сейчас не удалось загрузить учебный план.",
    backToCatalog: "Вернуться в каталог",
    browseCatalog: "Открыть каталог",
    noLessonsTitle: "Пока нет доступных уроков",
    noLessonsBody:
      "У этого курса еще не опубликован учебный план. Проверьте позже или откройте другие курсы.",
    noUnlockedLessonTitle: "Пока нет открытых уроков",
    noUnlockedLessonBody: "Завершите предыдущий пункт, чтобы открыть следующий урок.",
    lessonLoading: "Загрузка урока...",
    lessonUnavailableTitle: "Не удалось загрузить урок",
    lessonUnavailableBody: "Сейчас не удалось загрузить выбранный урок.",
    currentLesson: "Текущий урок",
    watchTime: "Время просмотра",
    resumeHint: "Время возобновления синхронизируется автоматически при переключении уроков.",
    saveProgress: "Сохранить прогресс",
    saving: "Сохранение...",
    lessonsHeader: "Уроки",
    unlockedCounter: "{unlocked}/{total} открыто",
    moduleLessons: "Уроков: {count}",
    courseId: "ID курса",
    lessonCompleted: "Этот урок завершен.",
    lessonReady: "Этот урок открыт и готов.",
    lessonLocked: "Урок будет доступен после завершения предыдущего.",
    lessonCouldNotLoadTitle: "Не удалось загрузить урок",
    lessonCouldNotLoadBody: "Сейчас не удалось загрузить выбранный урок.",
  },
};

const kz: LearnerCopy = {
  common: {
    free: "Тегін",
    retry: "Қайта көру",
    browseCatalog: "Каталог",
    myCourses: "Менің курстарым",
    open: "Ашу",
    continue: "Жалғастыру",
    saveProgress: "Прогресті сақтау",
    processing: "Өңделуде...",
    loading: "Жүктелуде...",
    unavailable: "Қолжетімсіз",
    inProgress: "Оқу үстінде",
    completed: "Аяқталды",
    general: "Жалпы",
  },
  dashboard: {
    title: "Қош келдіңіз",
    subtitle: "Прогресті бақылаңыз, сабақтарды жалғастырыңыз және оқу ырғағын сақтаңыз.",
    heroEyebrow: "Оқу шолуы",
    heroTitle: "Келесі қадамды бірден көріп, қарқынды сақтаңыз.",
    heroDescription:
      "Ағымдағы сабақтарды жалғастырыңыз, жазылулар бойынша прогресті салыстырыңыз және тұрақты оқу ырғағын ұстаңыз.",
    enrolledCourses: "Тіркелген курстар",
    enrolledCoursesHint: "Белсенді оқу бағыттары",
    completedCourses: "Аяқталған курстар",
    completedCoursesHint: "Өтілген бағдарламалар",
    averageProgress: "Орташа прогресс",
    averageProgressHint: "Барлық жазылу бойынша",
    currentStreak: "Ағымдағы серия",
    currentStreakHint: "Қатарынан күндер",
    summaryUnavailableTitle: "Дашборд қорытындысы қолжетімсіз",
    summaryUnavailableBody: "Қазір қорытындыны жүктеу мүмкін болмады.",
    gamificationUnavailableTitle: "Геймификация деректері қолжетімсіз",
    gamificationUnavailableBody: "Қазір серия мен марапаттарды жүктеу мүмкін болмады.",
    continueTitle: "Оқуды жалғастыру",
    continueSubtitle: "Соңғы рет ашқан курсқа қайта оралыңыз.",
    noEnrollmentsTitle: "Әзірге белсенді жазылулар жоқ",
    noEnrollmentsBody: "Бастау үшін каталогты ашыңыз.",
    achievementsTitle: "Жетістіктер",
    achievementsSubtitle: "Оқу ырғағы үшін алынған XP, деңгей және белгілер.",
    noAchievementsBody: "Сабақтарды аяқтап, белгілерді ашу үшін серияны сақтаңыз.",
    openedLessons: "Сабақты ашу",
    currentStreakLabel: "Ағымдағы серия",
    longestStreakLabel: "Ең ұзақ серия",
    awardedXp: "{xp} XP үшін берілді",
    findCourse: "Курс табу",
    openLesson: "Сабақты ашу",
  },
  courses: {
    title: "Курстар каталoгы",
    subtitle: "Бағдарламаларды қарап шығыңыз, тақырып бойынша сүзгіден өткізіңіз және оңай жазылыңыз.",
    filtersEyebrow: "Каталог сүзгілері",
    filtersTitle: "Қажетті курсты жылдамырақ тауып, бірден оқуға кірісіңіз.",
    filtersDescription:
      "Кілтсөзбен іздеңіз немесе категория, деңгей және тіл бойынша нақтылаңыз. Нәтиже сүзгілер өзгерген сайын жаңарады.",
    search: "Іздеу",
    category: "Санат",
    level: "Деңгей",
    language: "Тіл",
    resetFilters: "Сүзгілерді тазалау",
    resultsLoading: "Курстар жүктелуде...",
    resultsFound: "{count} курс табылды",
    resultsFoundOne: "{count} курс табылды",
    sortedByPopularity: "Танымалдық бойынша",
    checkoutErrorTitle: "Тіркелуді бастау мүмкін болмады",
    checkoutErrorBody: "Қайта байқап көріңіз.",
    checkoutSuccessTitle: "Тіркелу сұрауы жіберілді",
    checkoutSuccessBody: "Сұрауыңыз қабылданды. Жалғастыру үшін Менің курстарым бөліміне өтіңіз.",
    catalogUnavailableTitle: "Каталог қолжетімсіз",
    catalogUnavailableBody: "Курстарды жүктеу мүмкін болмады.",
    noMatchesTitle: "Бұл сүзгілерге сәйкес курс жоқ",
    noMatchesBody:
      "Іздеу шарттарын өзгертіңіз немесе толық каталогты көру үшін сүзгілерді тазалаңыз.",
    clearFilters: "Сүзгілерді тазалау",
    myCoursesCta: "Менің курстарым",
    enroll: "Тіркелу",
    processing: "Өңделуде...",
    open: "Ашу",
    courseMetaGeneral: "Жалпы",
    courseTagsTitle: "Курс белгілері",
  },
  myCourses: {
    title: "Менің курстарым",
    subtitle: "Сабақтарға оралыңыз, прогресті көріңіз және оқуды жылдам жалғастырыңыз.",
    queueEyebrow: "Сіздің оқу кезегіңіз",
    queueTitle: "Тіркелген курстарыңыздың бәрі бір жерде.",
    queueDescription:
      "Прогресті тексеріңіз, сабаққа қайта кіріңіз немесе жаңа курс керек болса каталогқа өтіңіз.",
    refresh: "Жаңарту",
    browseCatalog: "Каталогты ашу",
    enrollments: "Тіркелулер",
    inProgress: "Оқу үстінде",
    completed: "Аяқталды",
    errorTitle: "Курстарды жүктеу мүмкін болмады",
    errorBody: "Сіздің тіркелулеріңізді жүктеу мүмкін болмады.",
    noCoursesTitle: "Сіз әлі бірде-бір курсқа тіркелмегенсіз",
    noCoursesBody:
      "Каталогты ашып, курс таңдаңыз да, оқуды жалғастыру үшін қайта оралыңыз.",
    inProgressLabel: "Оқу үстінде",
    completedLabel: "Аяқталды",
    continue: "Жалғастыру",
    freeCourse: "Тегін курс",
    courseSubtitleGeneral: "Жалпы",
  },
  player: {
    title: "Оқу плеері",
    subtitle: "Прогресс автоматты сақталатын және сабақтар құлыпталатын тізбекті оқу жолы.",
    courseProgressEyebrow: "Курс прогресі",
    courseProgressTitle: "Оқу жолымен ретімен жалғастырыңыз.",
    courseProgressDescription: "Оқу жолымен ретімен жалғастырыңыз.",
    progress: "Прогресс",
    lessons: "Сабақтар",
    unlocked: "Ашық",
    current: "Ағымдағы",
    courseCurriculumUnavailableTitle: "Курс жоспары қолжетімсіз",
    courseCurriculumUnavailableBody: "Қазір оқу жоспарын жүктеу мүмкін болмады.",
    backToCatalog: "Каталогқа қайту",
    browseCatalog: "Каталогты ашу",
    noLessonsTitle: "Әзірге қолжетімді сабақ жоқ",
    noLessonsBody:
      "Бұл курсқа оқу жоспары әлі жарияланбаған. Кейінірек тексеріңіз немесе басқа курстарды ашыңыз.",
    noUnlockedLessonTitle: "Әлі ашық сабақ жоқ",
    noUnlockedLessonBody: "Келесі сабақты ашу үшін алдыңғысын аяқтаңыз.",
    lessonLoading: "Сабақ жүктелуде...",
    lessonUnavailableTitle: "Сабақты жүктеу мүмкін болмады",
    lessonUnavailableBody: "Таңдалған сабақты қазір жүктеу мүмкін болмады.",
    currentLesson: "Ағымдағы сабақ",
    watchTime: "Көру уақыты",
    resumeHint: "Сабақ ауыстырғанда жалғастыру уақыты автоматты түрде синхрондалады.",
    saveProgress: "Прогресті сақтау",
    saving: "Сақталуда...",
    lessonsHeader: "Сабақтар",
    unlockedCounter: "{unlocked}/{total} ашық",
    moduleLessons: "{count} сабақ",
    courseId: "Курс ID",
    lessonCompleted: "Бұл сабақ аяқталды.",
    lessonReady: "Бұл сабақ ашық және дайын.",
    lessonLocked: "Сабақ алдыңғысын аяқтағаннан кейін ашылады.",
    lessonCouldNotLoadTitle: "Сабақты жүктеу мүмкін болмады",
    lessonCouldNotLoadBody: "Таңдалған сабақты қазір жүктеу мүмкін болмады.",
  },
};

export const learnerCopyByLocale: Record<AppLocale, LearnerCopy> = {
  en,
  ru,
  kz,
};

export function getLearnerCopy(locale: AppLocale) {
  return learnerCopyByLocale[locale] ?? learnerCopyByLocale.en;
}

export function getIntlLocale(locale: AppLocale) {
  if (locale === "ru") return "ru-RU";
  if (locale === "kz") return "kk-KZ";
  return "en-US";
}

export function formatCoursePrice(locale: AppLocale, priceCents?: number | null) {
  const cents = priceCents ?? 0;
  if (cents <= 0) {
    return getLearnerCopy(locale).common.free;
  }

  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
