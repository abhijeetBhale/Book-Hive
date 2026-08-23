// Comprehensive banned words list for username/display-name validation
// Covers English, Hindi, Hinglish, and Indian context
//
// TWO-TIER SYSTEM:
//  - Substring tier (ALL_BANNED_WORDS): blocked ANYWHERE inside a name/handle.
//    Only strong, unambiguous words belong here.
//  - Exact tier (EXACT_MATCH_ONLY_WORDS): blocked only when the ENTIRE
//    normalized name equals the word. Used for short/risky words that would
//    cause false positives (skills/peacock/bombay/salad/bhaktiyoga/etc.)

// English banned words - Sexual/Pornographic content
export const ENGLISH_SEXUAL = [
  'sex', 'porn', 'porno', 'xxx', 'nudes', 'nude',
  'fuck', 'fucker', 'fucking', 'fuk', 'fck', 'fking', 'fack',
  'slut', 'whore', 'bitch', 'bitches',
  'cumshot', 'dick', 'dicks',
  'pussy', 'pussies', 'orgasm',
  'boobs', 'boob', 'tits', 'titties', 'milf',
  'anal', 'deepthroat', 'horny', 'nsfw', 'camsex',
  'penis', 'vagina', 'masturbate', 'blowjob',
  'handjob', 'footjob', 'rimjob', 'sexting',
  'erotic', 'kinky', 'fetish', 'bdsm',
  'dildo', 'vibrator', 'escort',
  'prostitute', 'hooker', 'pimp', 'brothel',
  'hardcore', 'softcore', 'stripping', 'camgirl', 'camslut',
  'escortservice', 'onlyfans', 'onlyfan', 'only_fans',
  'panty', 'panties', 'underboob', 'undies', 'bikini', 'lingerie',
  'threesome', 'foursome', 'gangbang', 'dp', 'bdsmlover',
  'analqueen', 'analboy', 'butthole', 'assplay', 'asslover',
  'cumdump', 'cumslut', 'cumlicker', 'cumbucket', 'spunk', 'jizz',
  'deepanal', 'dirtytalk', 'suckit', 'suckme', 'hornygirl', 'hornyboy',
  'bondage', 'leathersex', 'bareback', 'rawfuck', 'wetdream', 'wetpanty',
  'squirting', 'fellatio', 'clit', 'clitoris', 'humping', 'dryhump',
  'meatspin', 'bareass', 'asslick', 'asslicker', 'analwhore', 'analtoy',
  'pervert', 'perv', 'pervy', 'sexworker', 'escortgirl', 'camwhore',
  'sexy', 'sexygirl', 'sexyboy', 'hotgirl', 'hotboy'
];

export const ENGLISH_VIOLENCE = [
  'killer', 'killall', 'dieall',
  'murder', 'murderer', 'massacre', 'sniper',
  'hangman', 'bomber', 'bombing', 'bloodlust',
  'torture', 'shoot', 'shooting', 'shooter',
  'stabber', 'stabbing', 'behead', 'beheading',
  'assassin', 'hitman', 'terrorist', 'terrorism', 'terror',
  'genocide', 'slaughter', 'execution',
  'blood', 'gore', 'brutal', 'brutality', 'mutilate', 'mutilation',
  'cripple', 'destroy', 'deadbody', 'corpse', 'decapitate',
  'hanghim', 'hangher', 'hangthem', 'shootme', 'shootem',
  'explode', 'explosive', 'detonate', 'armybomber',
  'skullcrusher', 'bonecrusher', 'blooddrip', 'torturer',
  'cutthroat', 'strangle', 'strangling', 'choke', 'choking',
  'massmurder', 'serialkiller', 'serialmurder', 'psychokiller'
];

export const ENGLISH_HATE = [
  'nazis', 'neonazi', 'hitler', 'kkk', 'whitepower', 'masterrace',
  'faggot', 'tranny', 'retard', 'retarded',
  'chink', 'gook', 'wetback',
  'nigger', 'nigga', 'beaner',
  'raghead', 'towelhead', 'sandnigger',
  'racist', 'antigay', 'antilgbt', 'killgays', 'gaykiller',
  'gaybasher', 'genderhate', 'jewhater', 'islamhater', 'christianhater',
  'antisemite', 'islamphobia', 'homophobe', 'transphobic',
  'hatespeech', 'dehumanize'
];

export const ENGLISH_SELFHARM = [
  'suicide', 'suicidal', 'killme', 'endmylife',
  'selfharm', 'lifesucks', 'dyinginside',
  'wanttodie', 'enditall', 'killmyself',
  'imdone', 'wanttoend', 'justdie', 'wishidie',
  'deadinside', 'endthispain', 'cantlive', 'erase_me',
  'godtake_me', 'want_to_sleep_forever'
];

// Brand/platform impersonation (specific enough for substring matching)
export const ENGLISH_IMPERSONATION = [
  'officialinstagram', 'realinstagram', 'instaadmin',
  'instasupport', 'instagramadmin', 'metaadmin',
  'officialsupport', 'realsupport',
  'officialbookhive', 'bookhiveadmin', 'bookhivesupport',
  'bookhiveofficial', 'realbookhive', 'bookhivestaff',
  'superadmin', 'headadmin', 'leadadmin',
  'bookhivemod', 'instamod', 'officialmeta', 'officialgoogle',
  'securityteam', 'securityadmin', 'systemadmin',
  'bookhive_security', 'booksupport', 'readeradmin',
  'itadmin', 'techsupport', 'adminteam'
];

export const ENGLISH_PROFANITY = [
  'shit', 'shitty', 'bullshit', 'horseshit', 'batshit',
  'dumbass', 'dipshit', 'shithead', 'shitbag',
  'asshole', 'arsehole', 'bastard',
  'bollocks', 'bugger', 'jackoff', 'jerkoff',
  'wanker', 'piss', 'pissed', 'sonofabitch'
];

// Sexual violence / exploitation / CSAM-adjacent - zero tolerance
export const ENGLISH_EXPLOITATION = [
  'rape', 'rapist', 'raping', 'molest', 'molester', 'molesting',
  'pedo', 'pedophile', 'paedophile', 'pedobear', 'childporn',
  'incest', 'bestiality', 'zoophilia', 'zoophile',
  'necrophilia', 'necrophile', 'trafficker', 'groping',
  'voyeur', 'upskirt', 'creepshot', 'snufffilm', 'snuffmovie'
];

// Adult website brands
export const PORN_SITE_TERMS = [
  'pornhub', 'xvideos', 'xhamster', 'xnxx', 'redtube', 'youporn',
  'spankbang', 'chaturbate', 'stripchat', 'brazzers', 'bangbros',
  'hentai', 'nhentai', 'rule34'
];

// Drugs / 18+ substance references
export const ENGLISH_DRUGS = [
  'weed', 'marijuana', 'ganja', 'charas', 'cocaine',
  'mdma', 'lsd', 'opium', 'narcotics',
  'druglord', 'drugdealer', 'pothead'
];

export const HINDI_SEXUAL = [
  'chutiya', 'chutya', 'chutiye', 'chutiyaa', 'chutiyah', 'chatiya', 'chootiya',
  'madarchod', 'madharchod', 'madarchodd', 'maderchod',
  'behenchod', 'bhenchod', 'bhnchod', 'behnchod',
  'bhosdike', 'bhosadike', 'bsdk', 'bosdk', 'bhosdk', 'bhhosdike',
  'gaandu', 'ganduu', 'gaandmasti', 'gaandfat', 'gaandphat', 'gandmaraa', 'gandfadoo',
  'loda', 'lodu', 'lundh', 'lauda', 'lavde', 'lavda', 'lawde', 'lawda',
  'randibaz', 'rakhail', 'randibaaz',
  'chudai', 'chodu', 'chodna', 'chodunga', 'chudwana',
  'chudwa', 'chudwaa',
  'bhosad', 'bhosada', 'bhosdaa',
  'chutiyapanti', 'mcbc', 'madarchoddalal',
  'bhosdiwale', 'bhosri', 'laundibaaz'
];

export const HINDI_ABUSIVE = [
  'harami', 'haramii', 'haramzada', 'haramzadi',
  'kameena', 'kamina', 'kaminey', 'kamini',
  'kutta', 'kutti', 'kuttaa', 'kuttii',
  'suar', 'suvar', 'suwaar', 'suwar',
  'nalayak', 'nalayakk', 'nalayaq',
  'ghatiya', 'ghatiyaa', 'ghatiyah',
  'kutte', 'kuttey', 'kutiya', 'kutiyaa',
  'nikamma', 'nikammi', 'bewakoof', 'pagal',
  'takle'
];

export const HINDI_VIOLENCE = [
  'maar_dunga', 'mar_dunga', 'marunga', 'maarunga',
  'kat_dunga', 'kat_dalunga', 'kaat_dunga', 'kaat_dalunga',
  'jala_dunga', 'jalakar_mardunga', 'tod_dunga',
  'todi_haddi', 'katal', 'katall', 'qatal',
  'mardala', 'mardalo', 'mardenge',
  'peet_dunga', 'peetunga',
  'maar_khaayega', 'maar_denge', 'jan_levu',
  'kat_ke_rakh_dunga', 'jala_ke_rakh_dunga',
  'phod_dunga', 'chaku_mar'
];

export const HINDI_HATE = [
  'muslimhater', 'hinduhater', 'islammurdabad',
  'allahhater', 'mandirtod', 'masjiddestroy',
  'dalithater', 'chamarhater', 'brahminpower',
  'banmuslims', 'pakistansucks', 'pakisucks',
  'chamar', 'bhangi', 'mlechha', 'mleccha',
  'katua', 'katwa',
  'librandu', 'presstitute',
  'anti_national', 'antinational', 'deshdrohi',
  'muslimkhilaf', 'hinduvaadi', 'islammardunga',
  'hinduisupreme', 'marwadihater', 'bihari_hater',
  'up_wale_chutiye', 'delhihater', 'biharisuck'
];

export const HINDI_WOMEN_TARGETED = [
  'randika_baccha', 'bitchybhabhi', 'desisexbhabhi',
  'hindisex', 'desisexy', 'bhabhixxx', 'xxxdesigirl',
  'desigirlxxx', 'rakhel',
  'bhabhiporn', 'hindibhabhi', 'sexybhabhi',
  'bhabhika', 'chudail', 'itemgirl',
  'patakha', 'hotmaal', 'mastbhabhi', 'sundaribhabhi'
];

export const HINDI_SELFHARM = [
  'mar_jaunga', 'mar_jaungi', 'mujhe_marna_hai',
  'zindaginahihai', 'zindagise_thak_gaya',
  'khudko_khatam', 'jeena_nahi', 'marna_chahta_hu',
  'khudkushi', 'aatmhatya',
  'mujhe_mar_do', 'mujhe_marne_do', 'jeena_nahi_hai',
  'marjaunga_main', 'marjau', 'aaj_maar_dunga',
  'zindagi_se_haar', 'haar_gaya'
];

// Combine all English words
export const ENGLISH_BANNED_WORDS = [
  ...ENGLISH_SEXUAL,
  ...ENGLISH_VIOLENCE,
  ...ENGLISH_HATE,
  ...ENGLISH_SELFHARM,
  ...ENGLISH_IMPERSONATION,
  ...ENGLISH_PROFANITY,
  ...ENGLISH_EXPLOITATION,
  ...PORN_SITE_TERMS,
  ...ENGLISH_DRUGS
];

// Combine all Hindi/Hinglish words
export const HINDI_HINGLISH_BANNED_WORDS = [
  ...HINDI_SEXUAL,
  ...HINDI_ABUSIVE,
  ...HINDI_VIOLENCE,
  ...HINDI_HATE,
  ...HINDI_WOMEN_TARGETED,
  ...HINDI_SELFHARM
];

// Combined master list (SUBSTRING tier - blocked anywhere in a name)
export const ALL_BANNED_WORDS = [
  ...ENGLISH_BANNED_WORDS,
  ...HINDI_HINGLISH_BANNED_WORDS
];

// EXACT tier - blocked only when the entire normalized name equals the word.
// These are vulgar/role words that appear inside legitimate everyday words,
// so substring matching them would harm innocent users:
//   gand -> Gandhi | chut -> chutney/chutki | kill -> skill/skills
//   cock -> peacock/Hancock | bomb -> Bombay | stab -> stable
//   sala -> salad | bhakt -> bhakti | coon -> raccoon | spic -> spice/spicy
//   meth -> method | heroin -> heroine | cutting -> cutting-edge | etc.
export const EXACT_MATCH_ONLY_WORDS = [
  // Legacy short-word exceptions
  'fag', 'die', 'cum', 'gay', 'ass', 'tit', 'ceo', 'coo',
  // English FP-prone vulgarity/violence
  'cock', 'arse', 'bomb', 'kill', 'stab', 'strip', 'hoe', 'wank', 'prick',
  'nazi', 'spic', 'coon', 'kike', 'cutting',
  // Drugs that collide with normal words
  'meth', 'crack', 'smack', 'stoner', 'bong', 'heroin', 'snuff',
  // Generic platform roles (brand-specific ones stay in substring tier)
  'admin', 'moderator', 'mod', 'support', 'official', 'staff', 'manager', 'employee',
  // Hindi/Hinglish FP-prone roots
  'gand', 'gaand', 'chut', 'choot', 'chooth', 'lund',
  'muth', 'mutth', 'muthh', 'randi', 'randii', 'chod', 'chodh',
  'maal', 'bhakt', 'mulla', 'mullaa',
  'sala', 'saala', 'sali', 'saali'
];

// Leetspeak and common substitutions mapping
export const LEETSPEAK_MAP = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '@': 'a',
  '$': 's',
  '!': 'i',
  '#': 'h',
  '%': 'x'
};

// Common character substitutions
export const CHAR_SUBSTITUTIONS = {
  '@': 'a',
  '4': 'a',
  '8': 'b',
  '(': 'c',
  '<': 'c',
  '3': 'e',
  '6': 'g',
  '#': 'h',
  '!': 'i',
  '1': 'i',
  '|': 'i',
  '7': 't',
  '0': 'o',
  '$': 's',
  '5': 's',
  '+': 't',
  '%': 'x',
  '2': 'z'
};
