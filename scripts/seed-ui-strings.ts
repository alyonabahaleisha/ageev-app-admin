/**
 * Seeds `config/ui_strings` with every UI text key the RN app reads via
 * useUIStrings(). Existing values are kept (only missing keys are added), so
 * re-running never overwrites admin edits.
 *
 *   npx tsx scripts/seed-ui-strings.ts --dry-run   # preview
 *   npx tsx scripts/seed-ui-strings.ts             # apply
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

const dryRun = process.argv.includes("--dry-run");

const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, "serviceAccountKey.json"), "utf-8")
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const DEFAULTS: Record<string, string> = {
  // Нижняя навигация
  nav_home: "Главная",
  nav_thinking: "Мышление",
  nav_practices: "Практики",
  nav_club: "Клуб",
  nav_profile: "Профиль",

  // Главная
  home_header_welcome: "Добро пожаловать,",
  home_header_name: "Михаил",
  home_about_title: "“Жизнь – это подарок Бога”",
  home_about_subtitle:
    "Практики и поддержка для внутренней силы, гармонии и связи с собой.",
  home_about_author: "С Михаилом Агеевым",
  home_quote_text: "Интерес – это голос высшего “Я”, ведущий к призванию",
  home_quote_author: "Михаил Агеев",
  home_affirmation_subtitle: "Сохраните эту мысль с собой на сегодня",
  home_affirmation_fallback: "Всё нужное приходит в своё время",
  home_affirmation_button: "Погрузиться в поток аффирмаций",
  home_angel_question: "С чем хотите поработать сегодня?",
  home_meditations_title: "Медитации",
  home_webinars_title: "Вебинары",
  home_recommended_title: "Рекомендует Михаил",
  home_recommended_subtitle:
    "Сегодня для вас подобраны материалы, которые помогут двигаться вперёд",
  home_school_title: "Школа Михаила Агеева",
  home_school_description:
    "В Школе мы даём знания, которые помогут вам почувствовать полную свободу и стать творцом своей жизни.",
  home_school_button: "Подробнее",
  home_clubs_title: "Клубы рядом с вами",
  home_clubs_subtitle:
    "148 городов по всему миру – найдите ближайшее пространство практики и поддержки.",
  home_clubs_button: "Подробнее",

  // Мышление
  thinking_title: "Мышление",
  thinking_picker_title: "Выберите состояние",
  thinking_picker_subtitle: "Что откликается вам больше всего?",

  // Практики
  practices_title: "Практики",
  practices_recommended_title: "Рекомендовано для вас",
  practices_format_title: "Выберите формат",
  practices_format_meditations: "Медитации",
  practices_format_affirmations: "Аффирмации",
  practices_format_webinars: "Вебинары",
  practices_format_breakfasts: "Духовные завтраки",

  // Фильтры списков (медитации/вебинары/завтраки)
  filter_all: "Все",
  filter_short: "Короткие",
  filter_long: "Длинные",

  // Медитации
  meditations_title: "Медитации",

  // Вебинары
  webinars_title: "Вебинары",

  // Духовные завтраки
  breakfasts_title: "Духовные завтраки",

  // Аффирмации
  affirmations_title: "Аффирмации",
  affirmations_filter_all: "Все",
  affirmations_empty: "Аффирмации скоро появятся",
  affirmations_swipe_hint:
    "Проведите вверх, чтобы увидеть следующую аффирмацию",

  // Плеер
  player_tab_description: "Описание",
  player_tab_similar: "Похожие практики",
  player_no_description: "Описание появится позже.",
  player_similar_placeholder: "Скоро здесь появятся похожие практики.",
  player_default_artist: "Михаил Агеев",

  // Клуб
  clubs_title: "Клуб",
  clubs_intro_title: "Клуб Михаила Агеева",
  clubs_intro_subtitle:
    "Это сообщество людей, объединённых практиками Михаила и стремлением к внутреннему балансу.",
  clubs_card_title: "Клубы рядом с вами",
  clubs_card_subtitle_suffix:
    "по всему миру – найдите ближайшее пространство практики и поддержки.",
  clubs_card_subtitle_empty:
    "Найдите ближайшее пространство практики и поддержки.",
  clubs_city_one: "город",
  clubs_city_few: "города",
  clubs_city_many: "городов",
  clubs_search_placeholder: "Найти город",
  clubs_map_title: "Наши клубы",
  clubs_map_telegram_link: "Перейти в Telegram",

  // О школе
  school_title: "О школе",
  school_intro:
    "Школа Михаила Агеева – это пространство практик для работы с внутренним состоянием и качеством жизни. Здесь человек учится лучше понимать себя и выстраивать более гармоничное состояние через регулярные практики.",
  school_section1_title: "Философия",
  school_section1_body:
    "В основе школы – идея, что качество жизни начинается с внутреннего состояния. Развивая осознанность и внимание к себе, человек может менять своё восприятие, реакции и жизненный путь.",
  school_section2_title: "Подход",
  school_section2_body:
    "Обучение строится через практику: медитации, упражнения и работу с состояниями. Основной фокус – не теория, а личный опыт и постепенное изменение внутреннего состояния.",
  school_section3_title: "Кто такой Михаил",
  school_section3_body:
    "Михаил Агеев – основатель школы и автор системы практик по работе с состоянием и осознанностью. Более 17 лет он развивает направления психологии и духовных практик, объединяя их в единую систему.",
  school_stat1_value: ">500",
  school_stat1_label: "личных сессий",
  school_stat2_value: ">5000",
  school_stat2_label: "учеников по всему миру",
  school_stat3_value: ">100",
  school_stat3_label: "живых семинаров",
  school_button: "Подробнее",

  // Экран состояния (Мышление → состояние)
  state_exercise_descriptor: "Упражнение дня",
  state_exercise_start: "Начать",
  state_affirmations_section: "Аффирмации",
  state_affirmation_more: "Читать полностью",
  state_affirmations_flow_btn: "Погрузиться в поток аффирмаций",
  state_breakfast_section: "Духовный завтрак",
  state_links_section: "Вебинары и медитации",
  state_meditations_section: "Медитации",
  state_webinars_section: "Вебинары",
  state_flow_start: "Начать упражнение",
  state_flow_recs_title: "Рекомендации по выполнению",
  state_flow_back_to_practice: "Вернуться к практике",
  state_flow_finish: "Завершить",
  state_flow_back: "Назад",
  state_flow_next: "Далее",

  // Сторис
  story_quote_fallback:
    "Интерес – это голос высшего “Я”, ведущий к призванию",
  story_quote_author_fallback: "Михаил Агеев",
  story_breakfast_title: "Духовный завтрак",
  story_breakfast_body:
    "То, как вы определяете себя в начале дня, создаёт события вашей реальности. Спросите себя:",
  story_breakfast_question: "Кто ты сегодня?",
  story_breakfast_cta: "Начать практику",
  story_affirmation_title: "Аффирмация дня",
  story_affirmation_fallback:
    "Я доверяю жизни и чувствую поддержку в каждом шаге",
  story_start_title: "Сегодня можно начать с малого",
  story_start_body:
    "Начните путь к лучшей версии себя – через практики, осознанность и заботу о своём внутреннем состоянии.",
  story_start_cta: "Все практики",
};

async function main() {
  const ref = db.doc("config/ui_strings");
  const snap = await ref.get();
  const existing: Record<string, string> = snap.exists
    ? (snap.data() as Record<string, string>)
    : {};

  const missing = Object.entries(DEFAULTS).filter(([k]) => !(k in existing));
  console.log(
    `Existing keys: ${Object.keys(existing).length}, defaults: ${
      Object.keys(DEFAULTS).length
    }, to add: ${missing.length}`
  );
  missing.forEach(([k, v]) => console.log(`  + ${k} = ${v.slice(0, 60)}`));

  if (dryRun) {
    console.log("(dry run — nothing written)");
    return;
  }
  if (missing.length === 0) {
    console.log("Nothing to add.");
    return;
  }
  await ref.set(Object.fromEntries(missing), { merge: true });
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
