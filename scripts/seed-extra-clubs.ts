import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

const sa = JSON.parse(
  readFileSync(resolve(__dirname, "serviceAccountKey.json"), "utf-8")
);
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const translitMap: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
  ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((c) => translitMap[c] ?? c)
    .join("")
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

const clubs = [
  { country: "Россия", city: "Абакан", leader: "Лариса Пантилеева", telegramUrl: "https://t.me/+-jO1c9b3Q4Q3MzYy", region: "russia" as const, latitude: 53.7206, longitude: 91.4424 },
  { country: "Россия", city: "Альметьевск", leader: "Елена Мариненко", telegramUrl: "https://t.me/+LS57sKLsKLpjZWQy", region: "russia" as const, latitude: 54.9022, longitude: 52.3006 },
  { country: "Россия", city: "Анапа", leader: "Марина Котова", telegramUrl: "https://t.me/+OylEuX0oNGc4YjNi", region: "russia" as const, latitude: 44.8952, longitude: 37.3160 },
  { country: "Россия", city: "Апшеронск", leader: "Владимир Пономарев", telegramUrl: "https://t.me/+HCNH7hwj56cxMjky", region: "russia" as const, latitude: 44.4639, longitude: 39.7320 },
  { country: "Россия", city: "Астрахань", leader: "Раиль Шамуков", telegramUrl: "https://t.me/+da1m9YMQRyM1ZDli", region: "russia" as const, latitude: 46.3479, longitude: 48.0337 },
  { country: "Россия", city: "Барнаул", leader: "Марина Колерова", telegramUrl: "https://t.me/+xRmyI1XHM3BmZGQy", region: "russia" as const, latitude: 53.3606, longitude: 83.7636 },
  { country: "Россия", city: "Белгород", leader: "Ирина Демьянова", telegramUrl: "https://t.me/+qwiP-2hMIDY5ZmZi", region: "russia" as const, latitude: 50.5955, longitude: 36.5875 },
  { country: "Россия", city: "Бердск", leader: "Ираида Олененкова", telegramUrl: "https://t.me/+p7qjz18HQyhiZTAy", region: "russia" as const, latitude: 54.7572, longitude: 83.0985 },
  { country: "Россия", city: "Бийск", leader: "Татьяна Котова", telegramUrl: "https://t.me/+pusDKblAqX4yMWVi", region: "russia" as const, latitude: 52.5400, longitude: 85.1635 },
  { country: "Россия", city: "Благовещенск", leader: "Ольга Балмакова", telegramUrl: "https://t.me/+nOKjBH10FFJmZWNi", region: "russia" as const, latitude: 50.2897, longitude: 127.5272 },
  { country: "Россия", city: "Большой Камень", leader: "Елена Черненко", telegramUrl: "https://t.me/+R_oQnzLBPysyYzdi", region: "russia" as const, latitude: 43.1122, longitude: 132.3539 },
  { country: "Россия", city: "Брянск", leader: "Кирилл Кадыгроб", telegramUrl: "https://t.me/+eZYR7ztoLbtjZWQy", region: "russia" as const, latitude: 53.2434, longitude: 34.3659 },
  { country: "Россия", city: "Владивосток", leader: "Ирина Байсова", telegramUrl: "https://t.me/+3eXj_HzInM9lYmRi", region: "russia" as const, latitude: 43.1198, longitude: 131.8869 },
  { country: "Россия", city: "Владикавказ", leader: "Иосиф Пухаев", telegramUrl: "https://t.me/+_Y2qqJ8a-B8wZmVi", region: "russia" as const, latitude: 43.0355, longitude: 44.6680 },
  { country: "Россия", city: "Волгоград", leader: "Александр Полосминников", telegramUrl: "https://t.me/+c-kqWxgNI1JiNGIy", region: "russia" as const, latitude: 48.7080, longitude: 44.5133 },
  { country: "Россия", city: "Вологда", leader: "Кристина Филимонова", telegramUrl: "https://t.me/+rLvrL4twNIsyNTNi", region: "russia" as const, latitude: 59.2239, longitude: 39.8845 },
  { country: "Россия", city: "Воронеж", leader: "Надежда Коновалова", telegramUrl: "https://t.me/+3-YT43-Oy2pkMjYy", region: "russia" as const, latitude: 51.6720, longitude: 39.1843 },
  { country: "Россия", city: "Выборг", leader: "Юлия Атанова", telegramUrl: "https://t.me/+myOO2bh3ND5lNTky", region: "russia" as const, latitude: 60.7086, longitude: 28.7539 },
  { country: "Россия", city: "Екатеринбург", leader: "Татьяна Ковалева", telegramUrl: "https://t.me/+BDlYItUamOE4NWI6", region: "russia" as const, latitude: 56.8389, longitude: 60.6057 },
  { country: "Россия", city: "Елабуга", leader: "Замира Мурсеева", telegramUrl: "https://t.me/+88XXt3l-qKw0ZGQy", region: "russia" as const, latitude: 55.7631, longitude: 52.0572 },
  { country: "Россия", city: "Ессентуки", leader: "Людмила Мочигова", telegramUrl: "https://t.me/+94-g8vkar3JjYjQ6", region: "russia" as const, latitude: 44.0461, longitude: 42.8624 },
  { country: "Россия", city: "Иваново", leader: "Александр Сапрыкин", telegramUrl: "https://t.me/+MFcJ2ammI9dlNTdi", region: "russia" as const, latitude: 57.0005, longitude: 40.9737 },
  { country: "Россия", city: "Ижевск", leader: "Наталья Гара", telegramUrl: "https://t.me/+qqGxFXw4xi83NDQy", region: "russia" as const, latitude: 56.8527, longitude: 53.2114 },
  { country: "Россия", city: "Ишимбай", leader: "Татьяна Балаклеец", telegramUrl: "https://t.me/+_Ou950Jl144zOGNi", region: "russia" as const, latitude: 53.4524, longitude: 56.0414 },
  { country: "Россия", city: "Иркутск", leader: "Любовь Замащикова", telegramUrl: "https://t.me/+oSLJ5QyTprA1ZTli", region: "russia" as const, latitude: 52.2978, longitude: 104.2964 },
  { country: "Россия", city: "Йошкар-Ола", leader: "Марина Вершинина", telegramUrl: "https://t.me/+4ze9ugh9O8xjMjFi", region: "russia" as const, latitude: 56.6344, longitude: 47.8967 },
  { country: "Россия", city: "Казань", leader: "Татьяна Котова", telegramUrl: "https://t.me/+t0MgF7ImOYA5Y2Vi", region: "russia" as const, latitude: 55.7887, longitude: 49.1221 },
  { country: "Россия", city: "Калининград", leader: "Татьяна Котова", telegramUrl: "https://t.me/+yazX1qBmikw0ZTJi", region: "russia" as const, latitude: 54.7104, longitude: 20.4522 },
  { country: "Россия", city: "Калуга", leader: "Светлана Пинаева", telegramUrl: "https://t.me/+Vo1XJoNaD_NiMGMy", region: "russia" as const, latitude: 54.5293, longitude: 36.2754 },
  { country: "Россия", city: "Кемерово", leader: "Ирина Жмыхова", telegramUrl: "https://t.me/+HK-zRr06m2c2NmEy", region: "russia" as const, latitude: 55.3909, longitude: 86.0627 },
  { country: "Россия", city: "Киров", leader: "Татьяна Котова", telegramUrl: "https://t.me/+5tat3WdDJU9hNzZi", region: "russia" as const, latitude: 58.6035, longitude: 49.6680 },
  { country: "Россия", city: "Королёв", leader: "Светлана Овсянникова", telegramUrl: "https://t.me/+VD5aO7FE4JcwOWRi", region: "russia" as const, latitude: 55.9220, longitude: 37.7951 },
  { country: "Россия", city: "Краснодар", leader: "Анастасия Охрименко", telegramUrl: "https://t.me/+IlpgdCtBx_9iYjM6", region: "russia" as const, latitude: 45.0448, longitude: 38.9760 },
  { country: "Россия", city: "Красноярск", leader: "Мария Лавейкина", telegramUrl: "https://t.me/+hDGCQKWyGEoxZjUy", region: "russia" as const, latitude: 56.0153, longitude: 92.8932 },
  { country: "Россия", city: "Кунгур", leader: "Марина Попкова", telegramUrl: "https://t.me/+KMPa7SW1XHs2NzIy", region: "russia" as const, latitude: 57.4326, longitude: 56.9374 },
  { country: "Россия", city: "Курск", leader: "Ирина Матухно", telegramUrl: "https://t.me/+WOHGQGycY9w4MWNi", region: "russia" as const, latitude: 51.7373, longitude: 36.1873 },
  { country: "Россия", city: "Липецк", leader: "Любовь Крутских", telegramUrl: "https://t.me/+eSL03pDNjgU2MjRi", region: "russia" as const, latitude: 52.6031, longitude: 39.5708 },
  { country: "Россия", city: "Луганск", leader: "Анна Гречко", telegramUrl: "https://t.me/+PSVTEH1RjrhmNTEy", region: "russia" as const, latitude: 48.5740, longitude: 39.3078 },
  { country: "Россия", city: "Лысьва", leader: "Лариса Одегова", telegramUrl: "https://t.me/+e-1grThdFF42MWQ6", region: "russia" as const, latitude: 58.1033, longitude: 57.8072 },
  { country: "Россия", city: "Махачкала", leader: "Мария Галаган", telegramUrl: "https://t.me/+5v4DLzZJKLA5NWIy", region: "russia" as const, latitude: 42.9849, longitude: 47.5047 },
  { country: "Россия", city: "Москва", leader: "Яна Бабанская-Лившун", telegramUrl: "https://t.me/+xd655It_5Wc2NWMy", region: "russia" as const, latitude: 55.7558, longitude: 37.6173 },
  { country: "Россия", city: "Набережные Челны", leader: "Алексей Пивоваров", telegramUrl: "https://t.me/+eDfdwgHwi9JkMTA6", region: "russia" as const, latitude: 55.7432, longitude: 52.3958 },
  { country: "Россия", city: "Находка", leader: "Трофимова Екатерина", telegramUrl: "https://t.me/+44g8F3XmZSswZjcy", region: "russia" as const, latitude: 42.8188, longitude: 132.8966 },
  { country: "Россия", city: "Нижневартовск", leader: "Марина Синькова", telegramUrl: "https://t.me/+zxZkr56ICitlMzFi", region: "russia" as const, latitude: 60.9344, longitude: 76.5547 },
  { country: "Россия", city: "Нижнекамск", leader: "Гульнара Гарипова", telegramUrl: "https://t.me/+L1VVZL6wljZkYzU6", region: "russia" as const, latitude: 55.6385, longitude: 51.8224 },
  { country: "Россия", city: "Нижний Новгород", leader: "Ольга Коробова", telegramUrl: "https://t.me/+wbmRo-WGy_dkMmVi", region: "russia" as const, latitude: 56.2965, longitude: 43.9361 },
  { country: "Россия", city: "Новокузнецк", leader: "Олеся Касацкая", telegramUrl: "https://t.me/+9aI7usQBcR04OGRi", region: "russia" as const, latitude: 53.7557, longitude: 87.1099 },
  { country: "Россия", city: "Новосибирск", leader: "Надежда Золотухина", telegramUrl: "https://t.me/+Xvv7BoxgH2UzMTdi", region: "russia" as const, latitude: 54.9884, longitude: 82.9357 },
  { country: "Россия", city: "Октябрьский", leader: "Татьяна Котова", telegramUrl: "https://t.me/+ZRneQOTkXsViZmMy", region: "russia" as const, latitude: 54.4752, longitude: 53.4692 },
  { country: "Россия", city: "Омск", leader: "Екатерина Кернозик", telegramUrl: "https://t.me/+A7oT1GBKGO5hZmUy", region: "russia" as const, latitude: 54.9885, longitude: 73.3242 },
  { country: "Россия", city: "Оренбург", leader: "Татьяна Котова", telegramUrl: "https://t.me/+FQZ91hPgtvc4NzEy", region: "russia" as const, latitude: 51.7727, longitude: 55.0988 },
  { country: "Россия", city: "Пермь", leader: "Елена Болилая", telegramUrl: "https://t.me/+mWyzpsj1j9w1Y2Ey", region: "russia" as const, latitude: 58.0105, longitude: 56.2502 },
  { country: "Россия", city: "Петропавловск-Камчатский", leader: "Тамара Старцева", telegramUrl: "https://t.me/+YJiDAq4SUVo0MDFi", region: "russia" as const, latitude: 53.0452, longitude: 158.6509 },
  { country: "Россия", city: "Ростов-на-Дону", leader: "Анастасия Бареева", telegramUrl: "https://t.me/+O35fbWCx3lAyMjg6", region: "russia" as const, latitude: 47.2357, longitude: 39.7015 },
  { country: "Россия", city: "Рязань", leader: "Людмила Митюшкина", telegramUrl: "https://t.me/+5YJqWYxD3ElkMTli", region: "russia" as const, latitude: 54.6269, longitude: 39.6916 },
  { country: "Россия", city: "Самара", leader: "Юлия Мальцева", telegramUrl: "https://t.me/+K-9aSKrFEBUyZWIy", region: "russia" as const, latitude: 53.1959, longitude: 50.1456 },
  { country: "Россия", city: "Санкт-Петербург", leader: "Мария Смирнова", telegramUrl: "https://t.me/+FRDvoGK-WzY1N2Fi", region: "russia" as const, latitude: 59.9311, longitude: 30.3609 },
  { country: "Россия", city: "Саранск", leader: "Надежда Маслова", telegramUrl: "https://t.me/+krt4ezBO6yAzNGMy", region: "russia" as const, latitude: 54.1838, longitude: 45.1749 },
  { country: "Россия", city: "Саратов", leader: "Екатерина Ануфриева", telegramUrl: "https://t.me/+_YbzpY7jXjg5NGMy", region: "russia" as const, latitude: 51.5924, longitude: 46.0340 },
  { country: "Россия", city: "Севастополь", leader: "Алексей Почернин", telegramUrl: "https://t.me/+uxgs1iteyq44Mzgy", region: "russia" as const, latitude: 44.6166, longitude: 33.5254 },
  { country: "Россия", city: "Серов", leader: "Ирина Андреева", telegramUrl: "https://t.me/+Cs4meMIdSgk0NWZi", region: "russia" as const, latitude: 59.6010, longitude: 60.5729 },
  { country: "Россия", city: "Симферополь", leader: "Наталия Литвиненко", telegramUrl: "https://t.me/+sir8ahkFEbpkMGEy", region: "russia" as const, latitude: 44.9521, longitude: 34.1024 },
  { country: "Россия", city: "Славянск-на-Кубани", leader: "Владимир Савицкий", telegramUrl: "https://t.me/+W4x7_8G2V9tkMzQy", region: "russia" as const, latitude: 45.2640, longitude: 38.1258 },
  { country: "Россия", city: "Солнечногорск", leader: "Хелена Масленников", telegramUrl: "https://t.me/+mzaDVW3_d1w4ZmIy", region: "russia" as const, latitude: 56.1836, longitude: 36.9929 },
  { country: "Россия", city: "Сочи", leader: "Наталья Дель", telegramUrl: "https://t.me/+PGiGk-giYVBmMmJi", region: "russia" as const, latitude: 43.6028, longitude: 39.7342 },
  { country: "Россия", city: "Ставрополь", leader: "Татьяна Петенева", telegramUrl: "https://t.me/+pOmZBjXFLWwzMzgy", region: "russia" as const, latitude: 45.0449, longitude: 41.9691 },
  { country: "Россия", city: "Стерлитамак", leader: "Гульчира Сагдиева", telegramUrl: "https://t.me/+0nRUvmkTOw5hOWIy", region: "russia" as const, latitude: 53.6311, longitude: 55.9310 },
  { country: "Россия", city: "Сургут", leader: "Анна Маркова", telegramUrl: "https://t.me/+X8CdTpZ_TttjODA6", region: "russia" as const, latitude: 61.2540, longitude: 73.3964 },
  { country: "Россия", city: "Таганрог", leader: "Марина Катраженко", telegramUrl: "https://t.me/+l2O5CqIPO3w3NjVi", region: "russia" as const, latitude: 47.2086, longitude: 38.8975 },
  { country: "Россия", city: "Тольятти", leader: "Снежана Курилова", telegramUrl: "https://t.me/+HfrV8OAVAWM1MGQy", region: "russia" as const, latitude: 53.5303, longitude: 49.3461 },
  { country: "Россия", city: "Томск", leader: "Татьяна Медведева", telegramUrl: "https://t.me/+Adm1Tye-m7phN2Ey", region: "russia" as const, latitude: 56.4977, longitude: 84.9744 },
  { country: "Россия", city: "Туймазы", leader: "Рузиля Бикмухаметова", telegramUrl: "https://t.me/+EcwIYgrbIcc1M2Yy", region: "russia" as const, latitude: 54.6007, longitude: 53.6985 },
  { country: "Россия", city: "Тюмень", leader: "Сергей Гонненко", telegramUrl: "https://t.me/+wwHy7-Mkl0Q5ZWFi", region: "russia" as const, latitude: 57.1522, longitude: 65.5272 },
  { country: "Россия", city: "Улан-Удэ", leader: "Анна Костюковская", telegramUrl: "https://t.me/+Qu7LzwaOSI9iM2Qy", region: "russia" as const, latitude: 51.8272, longitude: 107.6069 },
  { country: "Россия", city: "Ульяновск", leader: "Виктория Кочеткова", telegramUrl: "https://t.me/+xiq6Uz3I-UlkOWIy", region: "russia" as const, latitude: 54.3142, longitude: 48.4031 },
  { country: "Россия", city: "Усть-Илимск", leader: "Наталья Аверина", telegramUrl: "https://t.me/+3j7JHBPlNqIyMjJi", region: "russia" as const, latitude: 57.9529, longitude: 102.6540 },
  { country: "Россия", city: "Уфа", leader: "Татьяна Котова", telegramUrl: "https://t.me/+GkFpR913FRw5Mzk6", region: "russia" as const, latitude: 54.7388, longitude: 55.9721 },
  { country: "Россия", city: "Хабаровск", leader: "Алена Шадринцева", telegramUrl: "https://t.me/+0pckdDDUziAwNTJi", region: "russia" as const, latitude: 48.4827, longitude: 135.0839 },
  { country: "Россия", city: "Чебоксары", leader: "Ольга Андриянова", telegramUrl: "https://t.me/+e9krM12gp6dmMTBi", region: "russia" as const, latitude: 56.1439, longitude: 47.2489 },
  { country: "Россия", city: "Челябинск", leader: "Артур Ибрагимов", telegramUrl: "https://t.me/+IkrdLRCHcH45NDIy", region: "russia" as const, latitude: 55.1644, longitude: 61.4368 },
  { country: "Россия", city: "Череповец", leader: "Татьяна Алёшина", telegramUrl: "https://t.me/+rAph2yT1cnhiZTAy", region: "russia" as const, latitude: 59.1255, longitude: 37.9023 },
  { country: "Россия", city: "Чехов", leader: "Анна Бондарева", telegramUrl: "https://t.me/+2YOg9Y5lnjc2ZjQy", region: "russia" as const, latitude: 55.1473, longitude: 37.4706 },
  { country: "Россия", city: "Чита", leader: "Елена Печенина", telegramUrl: "https://t.me/+7KDC8_s_D3YwY2Iy", region: "russia" as const, latitude: 52.0336, longitude: 113.5007 },
  { country: "Россия", city: "Якутск", leader: "Семенова Саргылана", telegramUrl: "https://t.me/+xKHNve0td2UyMzIy", region: "russia" as const, latitude: 62.0355, longitude: 129.6755 },
  { country: "Россия", city: "Ярославль", leader: "Наталья Вальд", telegramUrl: "https://t.me/+hYzDW7Kl6NY2YjYy", region: "russia" as const, latitude: 57.6261, longitude: 39.8845 },
  { country: "Австралия", city: "Мельбурн", leader: "Елена Костылева", telegramUrl: "https://t.me/+2w23gb5qFwxlMjg6", latitude: -37.8136, longitude: 144.9631 },
  { country: "Австрия", city: "Вена", leader: "Дженнет Гаусс", telegramUrl: "https://t.me/+_7ut59QHe71mMmRi", latitude: 48.2082, longitude: 16.3738 },
  { country: "Азербайджан", city: "Баку", leader: "Нигяр Гасанова", telegramUrl: "https://t.me/+uZj3V_B1G9RlNGY6", latitude: 40.4093, longitude: 49.8671 },
  { country: "Англия", city: "Лондон", leader: "Татьяна Котова", telegramUrl: "https://t.me/+vUHeFSkTi480MGQ6", latitude: 51.5074, longitude: -0.1278 },
  { country: "Беларусь", city: "Бобруйск", leader: "Андрей Логвиненко", telegramUrl: "https://t.me/+Jxm5yNwxXKExMGYy", latitude: 53.1381, longitude: 29.2213 },
  { country: "Беларусь", city: "Лида", leader: "Сергей Пинаевский", telegramUrl: "https://t.me/+emXW9vR0FlpkODYy", latitude: 53.8882, longitude: 25.2986 },
  { country: "Беларусь", city: "Минск", leader: "Татьяна Котова", telegramUrl: "https://t.me/+OJDxZpxIerU1MDky", latitude: 53.9045, longitude: 27.5615 },
  { country: "Бельгия", city: "Темсе", leader: "Светлана Меюс", telegramUrl: "https://t.me/+kobHzmb8hJE4Nzky", latitude: 51.1239, longitude: 4.2097 },
  { country: "Германия", city: "Берлин", leader: "София Вагнер", telegramUrl: "https://t.me/+5lJnFYzI6ik2YjBi", latitude: 52.5200, longitude: 13.4050 },
  { country: "Германия", city: "Брауншвайг", leader: "Анастасия Вервайн", telegramUrl: "https://t.me/+v87xRTSy5y1mZjYy", latitude: 52.2689, longitude: 10.5268 },
  { country: "Германия", city: "Вальдюрн", leader: "Хелена Лукахин", telegramUrl: "https://t.me/+Fk3dIxHzTKQxMTli", latitude: 49.5733, longitude: 9.3711 },
  { country: "Германия", city: "Гамбург", leader: "Wika Katschalkinа", telegramUrl: "https://t.me/+xzrOlGnXQvw3NmIy", latitude: 53.5753, longitude: 10.0153 },
  { country: "Германия", city: "Ганновер", leader: "Елена Небесова", telegramUrl: "https://t.me/+C5yakbEvbr5kMGE6", latitude: 52.3759, longitude: 9.7320 },
  { country: "Германия", city: "Дюссельдорф", leader: "Мадира Шмёгнер", telegramUrl: "https://t.me/+dxG-HT3wU1RkMDAy", latitude: 51.2217, longitude: 6.7762 },
  { country: "Германия", city: "Зенден", leader: "Елена Юрк", telegramUrl: "https://t.me/+MkEiRUMeG8RlYzI6", latitude: 51.8569, longitude: 7.4917 },
  { country: "Германия", city: "Кассель", leader: "Валентина Остер", telegramUrl: "https://t.me/+tonn1ZRktfgxYmJi", latitude: 51.3127, longitude: 9.4797 },
  { country: "Германия", city: "Бонн", leader: "Мадира Шмёгнер", telegramUrl: "https://t.me/+ZMuwbJDnrMtiYjdi", latitude: 50.7374, longitude: 7.0982 },
  { country: "Германия", city: "Крайльсхайм", leader: "Виталия Хорлахер", telegramUrl: "https://t.me/+S0Rg_ByuKI5iYzFi", latitude: 49.1289, longitude: 10.0700 },
  { country: "Германия", city: "Мемминген", leader: "Татьяна Лебер", telegramUrl: "https://t.me/+XKl3PhUJWyExNDA6", latitude: 47.9875, longitude: 10.1814 },
  { country: "Германия", city: "Нюрнберг", leader: "Катарина Лемм", telegramUrl: "https://t.me/+IK-OabD0_hExNzcy", latitude: 49.4521, longitude: 11.0767 },
  { country: "Германия", city: "Франкфурт-на-Майне", leader: "Юлия Сексте", telegramUrl: "https://t.me/+GZdNAU8vnqUyMDAy", latitude: 50.1109, longitude: 8.6821 },
  { country: "Грузия", city: "Тбилиси", leader: "Елена Григолашвили", telegramUrl: "https://t.me/+PVHSU4JAtJdlMzMy", latitude: 41.6938, longitude: 44.8015 },
  { country: "Израиль", city: "Петах-Тиква", leader: "Ирина Филлипьев", telegramUrl: "https://t.me/+ZsN2Zp9uAxM3ZTIy", latitude: 32.0840, longitude: 34.8878 },
  { country: "Израиль", city: "Хайфа", leader: "Оксана Павлова", telegramUrl: "https://t.me/+_43y-i6SM25hMDg6", latitude: 32.7940, longitude: 34.9896 },
  { country: "Италия", city: "Милан", leader: "Cughilo Vladislava", telegramUrl: "https://t.me/+v3qV9_AXp7RiZjVi", latitude: 45.4642, longitude: 9.1900 },
  { country: "Италия", city: "Падуя", leader: "Татьяна Котова", telegramUrl: "https://t.me/+QpGKxyRBF60zNzU6", latitude: 45.4064, longitude: 11.8768 },
  { country: "Италия", city: "Рим", leader: "Татьяна Диковец", telegramUrl: "https://t.me/+OIF-wqQ2jUNmZTMy", latitude: 41.9028, longitude: 12.4964 },
];

async function seed() {
  const batch = db.batch();
  for (const club of clubs) {
    const id = `${slugify(club.country)}_${slugify(club.city)}`;
    console.log(`  ${id} → ${club.country} / ${club.city}`);
    const { region, ...rest } = club as typeof club & { region?: string };
    batch.set(db.collection("clubs").doc(id), { ...rest, region: region ?? "abroad", sortOrder: 0 });
  }
  await batch.commit();
  console.log(`Done! Seeded ${clubs.length} additional clubs.`);
}

seed();
