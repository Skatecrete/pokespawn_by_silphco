// ========== GLOBAL VARIABLES ==========
let allPokemon = [];
let cartItems = [];
let customerName = '';
let customerIgn = '';
let selectedAdmin = '';
let filters = { shundo: false, shiny164: false, regional: false, greatLeague: false, ultraLeague: false, masterLeague: false, premierCup: false, ultraPremier: false };
let currentSearch = '';
let currentDebutData = null;

let DEBUT_COUNTDOWN_OFFSET_HOURS = 0;

// ========== ULTIMATE GALLERY URL BUILDER ==========
function getUltimateGalleryUrl(pokemonName, isShiny = false, isMega = false, isGigantamax = false, isUltraBeast = false) {
    if (!pokemonName) return null;

    let baseName = pokemonName.toLowerCase().trim();

    const prefixes = ['mega ', 'gigantamax ', 'shadow ', 'd-max ', 'ultra beast '];
    for (const prefix of prefixes) {
        if (baseName.startsWith(prefix)) {
            baseName = baseName.substring(prefix.length);
            break;
        }
    }

    baseName = baseName.replace(/[()]/g, '');
    baseName = baseName.replace(/'/g, '');

    const regionMap = {
        'alolan': 'alola',
        'alola': 'alola',
        'galarian': 'galarian',
        'hisuian': 'hisuian',
        'paldean': 'paldea',
        'paldea': 'paldea'
    };

    for (const [regionKeyword, regionSuffix] of Object.entries(regionMap)) {
        if (baseName.startsWith(regionKeyword + ' ')) {
            const pokemon = baseName.substring(regionKeyword.length + 1);
            baseName = pokemon + '-' + regionSuffix;
            break;
        } else if (baseName.endsWith(' ' + regionKeyword)) {
            const pokemon = baseName.substring(0, baseName.length - regionKeyword.length - 1);
            baseName = pokemon + '-' + regionSuffix;
            break;
        }
    }

    const slug = baseName.trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    let suffix = '';
    if (isMega) suffix = '-mega';
    else if (isGigantamax) suffix = '-gigantamax';
    else if (isUltraBeast) suffix = '-ultra-beast';

    const shinySuffix = isShiny ? '-shiny' : '';

    return `https://raw.githubusercontent.com/Skatecrete/infographics/main/ultimategallery/${slug}${suffix}${shinySuffix}.png`;
}

// ========== ULTRA BEAST IDS ==========
const ULTRA_BEAST_IDS = new Set([
    793,  // Nihilego
    794,  // Buzzwole
    795,  // Pheromosa
    796,  // Xurkitree
    797,  // Celesteela
    798,  // Kartana
    799,  // Guzzlord
    803,  // Poipole
    804,  // Naganadel
    805,  // Stakataka
    806   // Blacephalon
]);

function isUltraBeast(id) {
    return ULTRA_BEAST_IDS.has(id);
}

// ========== ALL POKEMON MASTER LIST (1-1025) ==========
const ALL_POKEMON_NAMES = {
    1: "Bulbasaur", 2: "Ivysaur", 3: "Venusaur",
    4: "Charmander", 5: "Charmeleon", 6: "Charizard",
    7: "Squirtle", 8: "Wartortle", 9: "Blastoise",
    10: "Caterpie", 11: "Metapod", 12: "Butterfree",
    13: "Weedle", 14: "Kakuna", 15: "Beedrill",
    16: "Pidgey", 17: "Pidgeotto", 18: "Pidgeot",
    19: "Rattata", 20: "Raticate", 21: "Spearow",
    22: "Fearow", 23: "Ekans", 24: "Arbok",
    25: "Pikachu", 26: "Raichu", 27: "Sandshrew",
    28: "Sandslash", 29: "Nidoran♀", 30: "Nidorina",
    31: "Nidoqueen", 32: "Nidoran♂", 33: "Nidorino",
    34: "Nidoking", 35: "Clefairy", 36: "Clefable",
    37: "Vulpix", 38: "Ninetales", 39: "Jigglypuff",
    40: "Wigglytuff", 41: "Zubat", 42: "Golbat",
    43: "Oddish", 44: "Gloom", 45: "Vileplume",
    46: "Paras", 47: "Parasect", 48: "Venonat",
    49: "Venomoth", 50: "Diglett", 51: "Dugtrio",
    52: "Meowth", 53: "Persian", 54: "Psyduck",
    55: "Golduck", 56: "Mankey", 57: "Primeape",
    58: "Growlithe", 59: "Arcanine", 60: "Poliwag",
    61: "Poliwhirl", 62: "Poliwrath", 63: "Abra",
    64: "Kadabra", 65: "Alakazam", 66: "Machop",
    67: "Machoke", 68: "Machamp", 69: "Bellsprout",
    70: "Weepinbell", 71: "Victreebel", 72: "Tentacool",
    73: "Tentacruel", 74: "Geodude", 75: "Graveler",
    76: "Golem", 77: "Ponyta", 78: "Rapidash",
    79: "Slowpoke", 80: "Slowbro", 81: "Magnemite",
    82: "Magneton", 83: "Farfetch'd", 84: "Doduo",
    85: "Dodrio", 86: "Seel", 87: "Dewgong",
    88: "Grimer", 89: "Muk", 90: "Shellder",
    91: "Cloyster", 92: "Gastly", 93: "Haunter",
    94: "Gengar", 95: "Onix", 96: "Drowzee",
    97: "Hypno", 98: "Krabby", 99: "Kingler",
    100: "Voltorb", 101: "Electrode", 102: "Exeggcute",
    103: "Exeggutor", 104: "Cubone", 105: "Marowak",
    106: "Hitmonlee", 107: "Hitmonchan", 108: "Lickitung",
    109: "Koffing", 110: "Weezing", 111: "Rhyhorn",
    112: "Rhydon", 113: "Chansey", 114: "Tangela",
    115: "Kangaskhan", 116: "Horsea", 117: "Seadra",
    118: "Goldeen", 119: "Seaking", 120: "Staryu",
    121: "Starmie", 122: "Mr. Mime", 123: "Scyther",
    124: "Jynx", 125: "Electabuzz", 126: "Magmar",
    127: "Pinsir", 128: "Tauros", 129: "Magikarp",
    130: "Gyarados", 131: "Lapras", 132: "Ditto",
    133: "Eevee", 134: "Vaporeon", 135: "Jolteon",
    136: "Flareon", 137: "Porygon", 138: "Omanyte",
    139: "Omastar", 140: "Kabuto", 141: "Kabutops",
    142: "Aerodactyl", 143: "Snorlax", 144: "Articuno",
    145: "Zapdos", 146: "Moltres", 147: "Dratini",
    148: "Dragonair", 149: "Dragonite", 150: "Mewtwo",
    151: "Mew",
    152: "Chikorita", 153: "Bayleef", 154: "Meganium",
    155: "Cyndaquil", 156: "Quilava", 157: "Typhlosion",
    158: "Totodile", 159: "Croconaw", 160: "Feraligatr",
    161: "Sentret", 162: "Furret", 163: "Hoothoot",
    164: "Noctowl", 165: "Ledyba", 166: "Ledian",
    167: "Spinarak", 168: "Ariados", 169: "Crobat",
    170: "Chinchou", 171: "Lanturn", 172: "Pichu",
    173: "Cleffa", 174: "Igglybuff", 175: "Togepi",
    176: "Togetic", 177: "Natu", 178: "Xatu",
    179: "Mareep", 180: "Flaaffy", 181: "Ampharos",
    182: "Bellossom", 183: "Marill", 184: "Azumarill",
    185: "Sudowoodo", 186: "Politoed", 187: "Hoppip",
    188: "Skiploom", 189: "Jumpluff", 190: "Aipom",
    191: "Sunkern", 192: "Sunflora", 193: "Yanma",
    194: "Wooper", 195: "Quagsire", 196: "Espeon",
    197: "Umbreon", 198: "Murkrow", 199: "Slowking",
    200: "Misdreavus", 201: "Unown", 202: "Wobbuffet",
    203: "Girafarig", 204: "Pineco", 205: "Forretress",
    206: "Dunsparce", 207: "Gligar", 208: "Steelix",
    209: "Snubbull", 210: "Granbull", 211: "Qwilfish",
    212: "Scizor", 213: "Shuckle", 214: "Heracross",
    215: "Sneasel", 216: "Teddiursa", 217: "Ursaring",
    218: "Slugma", 219: "Magcargo", 220: "Swinub",
    221: "Piloswine", 222: "Corsola", 223: "Remoraid",
    224: "Octillery", 225: "Delibird", 226: "Mantine",
    227: "Skarmory", 228: "Houndour", 229: "Houndoom",
    230: "Kingdra", 231: "Phanpy", 232: "Donphan",
    233: "Porygon2", 234: "Stantler", 235: "Smeargle",
    236: "Tyrogue", 237: "Hitmontop", 238: "Smoochum",
    239: "Elekid", 240: "Magby", 241: "Miltank",
    242: "Blissey", 243: "Raikou", 244: "Entei",
    245: "Suicune", 246: "Larvitar", 247: "Pupitar",
    248: "Tyranitar", 249: "Lugia", 250: "Ho-Oh",
    251: "Celebi",
    252: "Treecko", 253: "Grovyle", 254: "Sceptile",
    255: "Torchic", 256: "Combusken", 257: "Blaziken",
    258: "Mudkip", 259: "Marshtomp", 260: "Swampert",
    261: "Poochyena", 262: "Mightyena", 263: "Zigzagoon",
    264: "Linoone", 265: "Wurmple", 266: "Silcoon",
    267: "Beautifly", 268: "Cascoon", 269: "Dustox",
    270: "Lotad", 271: "Lombre", 272: "Ludicolo",
    273: "Seedot", 274: "Nuzleaf", 275: "Shiftry",
    276: "Taillow", 277: "Swellow", 278: "Wingull",
    279: "Pelipper", 280: "Ralts", 281: "Kirlia",
    282: "Gardevoir", 283: "Surskit", 284: "Masquerain",
    285: "Shroomish", 286: "Breloom", 287: "Slakoth",
    288: "Vigoroth", 289: "Slaking", 290: "Nincada",
    291: "Ninjask", 292: "Shedinja", 293: "Whismur",
    294: "Loudred", 295: "Exploud", 296: "Makuhita",
    297: "Hariyama", 298: "Azurill", 299: "Nosepass",
    300: "Skitty", 301: "Delcatty", 302: "Sableye",
    303: "Mawile", 304: "Aron", 305: "Lairon", 306: "Aggron",
    307: "Meditite", 308: "Medicham", 309: "Electrike",
    310: "Manectric", 311: "Plusle", 312: "Minun",
    313: "Volbeat", 314: "Illumise", 315: "Roselia",
    316: "Gulpin", 317: "Swalot", 318: "Carvanha",
    319: "Sharpedo", 320: "Wailmer", 321: "Wailord",
    322: "Numel", 323: "Camerupt", 324: "Torkoal",
    325: "Spoink", 326: "Grumpig", 327: "Spinda",
    328: "Trapinch", 329: "Vibrava", 330: "Flygon",
    331: "Cacnea", 332: "Cacturne", 333: "Swablu",
    334: "Altaria", 335: "Zangoose", 336: "Seviper",
    337: "Lunatone", 338: "Solrock", 339: "Barboach",
    340: "Whiscash", 341: "Corphish", 342: "Crawdaunt",
    343: "Baltoy", 344: "Claydol", 345: "Lileep",
    346: "Cradily", 347: "Anorith", 348: "Armaldo",
    349: "Feebas", 350: "Milotic", 351: "Castform",
    352: "Kecleon", 353: "Shuppet", 354: "Banette",
    355: "Duskull", 356: "Dusclops", 357: "Tropius",
    358: "Chimecho", 359: "Absol", 360: "Wynaut",
    361: "Snorunt", 362: "Glalie", 363: "Spheal",
    364: "Sealeo", 365: "Walrein", 366: "Clamperl",
    367: "Huntail", 368: "Gorebyss", 369: "Relicanth",
    370: "Luvdisc", 371: "Bagon", 372: "Shelgon",
    373: "Salamence", 374: "Beldum", 375: "Metang",
    376: "Metagross", 377: "Regirock", 378: "Regice",
    379: "Registeel", 380: "Latias", 381: "Latios",
    382: "Kyogre", 383: "Groudon", 384: "Rayquaza",
    385: "Jirachi", 386: "Deoxys",
    387: "Turtwig", 388: "Grotle", 389: "Torterra",
    390: "Chimchar", 391: "Monferno", 392: "Infernape",
    393: "Piplup", 394: "Prinplup", 395: "Empoleon",
    396: "Starly", 397: "Staravia", 398: "Staraptor",
    399: "Bidoof", 400: "Bibarel", 401: "Kricketot",
    402: "Kricketune", 403: "Shinx", 404: "Luxio",
    405: "Luxray", 406: "Budew", 407: "Roserade",
    408: "Cranidos", 409: "Rampardos", 410: "Shieldon",
    411: "Bastiodon", 412: "Burmy", 413: "Wormadam",
    414: "Mothim", 415: "Combee", 416: "Vespiquen",
    417: "Pachirisu", 418: "Buizel", 419: "Floatzel",
    420: "Cherubi", 421: "Cherrim", 422: "Shellos",
    423: "Gastrodon", 424: "Ambipom", 425: "Drifloon",
    426: "Drifblim", 427: "Buneary", 428: "Lopunny",
    429: "Mismagius", 430: "Honchkrow", 431: "Glameow",
    432: "Purugly", 433: "Chingling", 434: "Stunky",
    435: "Skuntank", 436: "Bronzor", 437: "Bronzong",
    438: "Mime Jr.", 439: "Happiny", 440: "Chatot",
    441: "Spiritomb", 442: "Gible", 443: "Gabite",
    444: "Garchomp", 445: "Munchlax", 446: "Riolu",
    447: "Lucario", 448: "Hippopotas", 449: "Hippowdon",
    450: "Skorupi", 451: "Drapion", 452: "Croagunk",
    453: "Toxicroak", 454: "Carnivine", 455: "Finneon",
    456: "Lumineon", 457: "Mantyke", 458: "Snover",
    459: "Abomasnow", 460: "Weavile", 461: "Magnezone",
    462: "Lickilicky", 463: "Rhyperior", 464: "Tangrowth",
    465: "Electivire", 466: "Magmortar", 467: "Togekiss",
    468: "Yanmega", 469: "Leafeon", 470: "Glaceon",
    471: "Gliscor", 472: "Mamoswine", 473: "Porygon-Z",
    474: "Gallade", 475: "Probopass", 476: "Dusknoir",
    477: "Froslass", 478: "Rotom", 479: "Uxie",
    480: "Mesprit", 481: "Azelf", 482: "Dialga",
    483: "Palkia", 484: "Heatran", 485: "Regigigas",
    486: "Giratina", 487: "Cresselia", 488: "Phione",
    489: "Manaphy", 490: "Darkrai", 491: "Shaymin",
    492: "Arceus", 493: "Victini",
    494: "Victini", 495: "Snivy", 496: "Servine",
    497: "Serperior", 498: "Tepig", 499: "Pignite",
    500: "Emboar", 501: "Oshawott", 502: "Dewott",
    503: "Samurott", 504: "Patrat", 505: "Watchog",
    506: "Lillipup", 507: "Herdier", 508: "Stoutland",
    509: "Purrloin", 510: "Liepard", 511: "Pansage",
    512: "Simisage", 513: "Pansear", 514: "Simisear",
    515: "Panpour", 516: "Simipour", 517: "Munna",
    518: "Musharna", 519: "Pidove", 520: "Tranquill",
    521: "Unfezant", 522: "Blitzle", 523: "Zebstrika",
    524: "Roggenrola", 525: "Boldore", 526: "Gigalith",
    527: "Woobat", 528: "Swoobat", 529: "Drilbur",
    530: "Excadrill", 531: "Audino", 532: "Timburr",
    533: "Gurdurr", 534: "Conkeldurr", 535: "Tympole",
    536: "Palpitoad", 537: "Seismitoad", 538: "Throh",
    539: "Sawk", 540: "Sewaddle", 541: "Swadloon",
    542: "Leavanny", 543: "Venipede", 544: "Whirlipede",
    545: "Scolipede", 546: "Cottonee", 547: "Whimsicott",
    548: "Petilil", 549: "Lilligant", 550: "Basculin",
    551: "Sandile", 552: "Krokorok", 553: "Krookodile",
    554: "Darumaka", 555: "Darmanitan", 556: "Maractus",
    557: "Dwebble", 558: "Crustle", 559: "Scraggy",
    560: "Scrafty", 561: "Sigilyph", 562: "Yamask",
    563: "Cofagrigus", 564: "Tirtouga", 565: "Carracosta",
    566: "Archen", 567: "Archeops", 568: "Trubbish",
    569: "Garbodor", 570: "Zorua", 571: "Zoroark",
    572: "Minccino", 573: "Cinccino", 574: "Gothita",
    575: "Gothorita", 576: "Gothitelle", 577: "Solosis",
    578: "Duosion", 579: "Reuniclus", 580: "Ducklett",
    581: "Swanna", 582: "Vanillite", 583: "Vanillish",
    584: "Vanilluxe", 585: "Deerling", 586: "Sawsbuck",
    587: "Emolga", 588: "Karrablast", 589: "Escavalier",
    590: "Foongus", 591: "Amoonguss", 592: "Frillish",
    593: "Jellicent", 594: "Alomomola", 595: "Joltik",
    596: "Galvantula", 597: "Ferroseed", 598: "Ferrothorn",
    599: "Klink", 600: "Klang", 601: "Klinklang",
    602: "Tynamo", 603: "Eelektrik", 604: "Eelektross",
    605: "Elgyem", 606: "Beheeyem", 607: "Litwick",
    608: "Lampent", 609: "Chandelure", 610: "Axew",
    611: "Fraxure", 612: "Haxorus", 613: "Cubchoo",
    614: "Beartic", 615: "Cryogonal", 616: "Shelmet",
    617: "Accelgor", 618: "Stunfisk", 619: "Mienfoo",
    620: "Mienshao", 621: "Druddigon", 622: "Golett",
    623: "Golurk", 624: "Pawniard", 625: "Bisharp",
    626: "Bouffalant", 627: "Rufflet", 628: "Braviary",
    629: "Vullaby", 630: "Mandibuzz", 631: "Heatmor",
    632: "Durant", 633: "Deino", 634: "Zweilous",
    635: "Hydreigon", 636: "Larvesta", 637: "Volcarona",
    638: "Cobalion", 639: "Terrakion", 640: "Virizion",
    641: "Tornadus", 642: "Thundurus", 643: "Reshiram",
    644: "Zekrom", 645: "Landorus", 646: "Kyurem",
    647: "Keldeo", 648: "Meloetta", 649: "Genesect",
    650: "Chespin", 651: "Quilladin", 652: "Chesnaught",
    653: "Fennekin", 654: "Braixen", 655: "Delphox",
    656: "Froakie", 657: "Frogadier", 658: "Greninja",
    659: "Bunnelby", 660: "Diggersby", 661: "Fletchling",
    662: "Fletchinder", 663: "Talonflame", 664: "Scatterbug",
    665: "Spewpa", 666: "Vivillon", 667: "Litleo",
    668: "Pyroar", 669: "Flabébé", 670: "Floette",
    671: "Florges", 672: "Skiddo", 673: "Gogoat",
    674: "Pancham", 675: "Pangoro", 676: "Furfrou",
    677: "Espurr", 678: "Meowstic", 679: "Honedge",
    680: "Doublade", 681: "Aegislash", 682: "Spritzee",
    683: "Aromatisse", 684: "Swirlix", 685: "Slurpuff",
    686: "Inkay", 687: "Malamar", 688: "Binacle",
    689: "Barbaracle", 690: "Skrelp", 691: "Dragalge",
    692: "Clauncher", 693: "Clawitzer", 694: "Helioptile",
    695: "Heliolisk", 696: "Tyrunt", 697: "Tyrantrum",
    698: "Amaura", 699: "Aurorus", 700: "Sylveon",
    701: "Hawlucha", 702: "Dedenne", 703: "Carbink",
    704: "Goomy", 705: "Sliggoo", 706: "Goodra",
    707: "Klefki", 708: "Phantump", 709: "Trevenant",
    710: "Pumpkaboo", 711: "Gourgeist", 712: "Bergmite",
    713: "Avalugg", 714: "Noibat", 715: "Noivern",
    716: "Xerneas", 717: "Yveltal", 718: "Zygarde",
    719: "Diancie", 720: "Hoopa", 721: "Volcanion",
    722: "Rowlet", 723: "Dartrix", 724: "Decidueye",
    725: "Litten", 726: "Torracat", 727: "Incineroar",
    728: "Popplio", 729: "Brionne", 730: "Primarina",
    731: "Pikipek", 732: "Trumbeak", 733: "Toucannon",
    734: "Yungoos", 735: "Gumshoos", 736: "Grubbin",
    737: "Charjabug", 738: "Vikavolt", 739: "Crabrawler",
    740: "Crabominable", 741: "Oricorio", 742: "Cutiefly",
    743: "Ribombee", 744: "Rockruff", 745: "Lycanroc",
    746: "Wishiwashi", 747: "Mareanie", 748: "Toxapex",
    749: "Mudbray", 750: "Mudsdale", 751: "Dewpider",
    752: "Araquanid", 753: "Fomantis", 754: "Lurantis",
    755: "Morelull", 756: "Shiinotic", 757: "Salandit",
    758: "Salazzle", 759: "Stufful", 760: "Bewear",
    761: "Bounsweet", 762: "Steenee", 763: "Tsareena",
    764: "Comfey", 765: "Oranguru", 766: "Passimian",
    767: "Wimpod", 768: "Golisopod", 769: "Sandygast",
    770: "Palossand", 771: "Pyukumuku", 772: "Type: Null",
    773: "Silvally", 774: "Minior", 775: "Komala",
    776: "Turtonator", 777: "Togedemaru", 778: "Mimikyu",
    779: "Bruxish", 780: "Drampa", 781: "Dhelmise",
    782: "Jangmo-o", 783: "Hakamo-o", 784: "Kommo-o",
    785: "Tapu Koko", 786: "Tapu Lele", 787: "Tapu Bulu",
    788: "Tapu Fini", 789: "Cosmog", 790: "Cosmoem",
    791: "Solgaleo", 792: "Lunala", 793: "Nihilego",
    794: "Buzzwole", 795: "Pheromosa", 796: "Xurkitree",
    797: "Celesteela", 798: "Kartana", 799: "Guzzlord",
    800: "Necrozma", 801: "Magearna", 802: "Marshadow",
    803: "Poipole", 804: "Naganadel", 805: "Stakataka",
    806: "Blacephalon", 807: "Zeraora", 808: "Meltan",
    809: "Melmetal",
    810: "Grookey", 811: "Thwackey", 812: "Rillaboom",
    813: "Scorbunny", 814: "Raboot", 815: "Cinderace",
    816: "Sobble", 817: "Drizzile", 818: "Inteleon",
    819: "Skwovet", 820: "Greedent", 821: "Rookidee",
    822: "Corvisquire", 823: "Corviknight", 824: "Blipbug",
    825: "Dottler", 826: "Orbeetle", 827: "Nickit",
    828: "Thievul", 829: "Gossifleur", 830: "Eldegoss",
    831: "Wooloo", 832: "Dubwool", 833: "Chewtle",
    834: "Drednaw", 835: "Yamper", 836: "Boltund",
    837: "Rolycoly", 838: "Carkol", 839: "Coalossal",
    840: "Applin", 841: "Flapple", 842: "Appletun",
    843: "Silicobra", 844: "Sandaconda", 845: "Cramorant",
    846: "Arrokuda", 847: "Barraskewda", 848: "Toxel",
    849: "Toxtricity", 850: "Sizzlipede", 851: "Centiskorch",
    852: "Clobbopus", 853: "Grapploct", 854: "Sinistea",
    855: "Polteageist", 856: "Hatenna", 857: "Hattrem",
    858: "Hatterene", 859: "Impidimp", 860: "Morgrem",
    861: "Grimmsnarl", 862: "Obstagoon", 863: "Perrserker",
    864: "Cursola", 865: "Sirfetch'd", 866: "Mr. Rime",
    867: "Runerigus", 868: "Milcery", 869: "Alcremie",
    870: "Falinks", 871: "Pincurchin", 872: "Snom",
    873: "Frosmoth", 874: "Stonjourner", 875: "Eiscue",
    876: "Indeedee", 877: "Morpeko", 878: "Cufant",
    879: "Copperajah", 880: "Dracozolt", 881: "Arctozolt",
    882: "Dracovish", 883: "Arctovish", 884: "Duraludon",
    885: "Dreepy", 886: "Drakloak", 887: "Dragapult",
    888: "Zacian", 889: "Zamazenta", 890: "Eternatus",
    891: "Kubfu", 892: "Urshifu", 893: "Zarude",
    894: "Regieleki", 895: "Regidrago", 896: "Glastrier",
    897: "Spectrier", 898: "Calyrex",
    899: "Wyrdeer", 900: "Kleavor", 901: "Ursaluna",
    902: "Basculegion", 903: "Sneasler", 904: "Overqwil",
    905: "Enamorus", 906: "Sprigatito", 907: "Floragato",
    908: "Meowscarada", 909: "Fuecoco", 910: "Crocalor",
    911: "Skeledirge", 912: "Quaxly", 913: "Quaxwell",
    914: "Quaquaval", 915: "Lechonk", 916: "Oinkologne",
    917: "Tarountula", 918: "Spidops", 919: "Nymble",
    920: "Lokix", 921: "Pawmi", 922: "Pawmo", 923: "Pawmot",
    924: "Tandemaus", 925: "Maushold", 926: "Fidough",
    927: "Dachsbun", 928: "Smoliv", 929: "Dolliv",
    930: "Arboliva", 931: "Squawkabilly", 932: "Nacli",
    933: "Naclstack", 934: "Garganacl", 935: "Charcadet",
    936: "Armarouge", 937: "Ceruledge", 938: "Tadbulb",
    939: "Bellibolt", 940: "Wattrel", 941: "Kilowattrel",
    942: "Maschiff", 943: "Mabosstiff", 944: "Shroodle",
    945: "Grafaiai", 946: "Bramblin", 947: "Brambleghast",
    948: "Toedscool", 949: "Toedscruel", 950: "Klawf",
    951: "Capsakid", 952: "Scovillain", 953: "Rellor",
    954: "Rabsca", 955: "Flittle", 956: "Espathra",
    957: "Tinkatink", 958: "Tinkatuff", 959: "Tinkaton",
    960: "Wiglett", 961: "Wugtrio", 962: "Bombirdier",
    963: "Finizen", 964: "Palafin", 965: "Varoom",
    966: "Revavroom", 967: "Cyclizar", 968: "Orthworm",
    969: "Glimmet", 970: "Glimmora", 971: "Greavard",
    972: "Houndstone", 973: "Flamigo", 974: "Cetoddle",
    975: "Cetitan", 976: "Veluza", 977: "Dondozo",
    978: "Tatsugiri", 979: "Annihilape", 980: "Clodsire",
    981: "Farigiraf", 982: "Dudunsparce", 983: "Kingambit",
    984: "Great Tusk", 985: "Scream Tail", 986: "Brute Bonnet",
    987: "Flutter Mane", 988: "Slither Wing", 989: "Sandy Shocks",
    990: "Iron Treads", 991: "Iron Bundle", 992: "Iron Hands",
    993: "Iron Jugulis", 994: "Iron Moth", 995: "Iron Thorns",
    996: "Frigibax", 997: "Arctibax", 998: "Baxcalibur",
    999: "Gimmighoul", 1000: "Gholdengo", 1001: "Wo-Chien",
    1002: "Chien-Pao", 1003: "Ting-Lu", 1004: "Chi-Yu",
    1005: "Roaring Moon", 1006: "Iron Valiant", 1007: "Koraidon",
    1008: "Miraidon", 1009: "Walking Wake", 1010: "Iron Leaves",
    1011: "Dipplin", 1012: "Poltchageist", 1013: "Sinistcha",
    1014: "Okidogi", 1015: "Munkidori", 1016: "Fezandipiti",
    1017: "Ogerpon", 1018: "Archaludon", 1019: "Hydrapple",
    1020: "Gouging Fire", 1021: "Raging Bolt", 1022: "Iron Boulder",
    1023: "Iron Crown", 1024: "Terapagos", 1025: "Pecharunt"
};

// ========== PRICING CACHE (Default values, updated by loadPricing) ==========
let pricingCache = {
    'Spawn_Shundo': 5,
    'Spawn_Hundo': 3,
    'Spawn_Hundo_Regional': 8,
    'Spawn_Shiny': 2,
    'Spawn_Shiny_Regional': 5,
    'Spawn_PvP': 5,
    'Spawn_Normal_Regional': 3,
    'Raid_Normal_10': 7,
    'Raid_Normal_20': 12,
    'Raid_Normal_50': 20,
    'Raid_Dynamax_4': 10,
    'Raid_Dynamax_Single': 2.5,
    'Coins_5600': 24,
    'Coins_15500': 45,
    'Coins_31000': 85
};

let coinPrices = { 
    5600: pricingCache['Coins_5600'], 
    15500: pricingCache['Coins_15500'], 
    31000: pricingCache['Coins_31000'] 
};

// Apps Script URL
// For submitting orders and RSVPs (POST) - still needs proxy
const SCRIPT_URL = 'https://corsproxy.io/?' + encodeURIComponent('https://script.google.com/macros/s/AKfycbx6i6Yn7ezXqwJKgZF3Mbq_MbgNeb4mQ8weT0Qipu0c9ASFRVK6l-HIdH83xFbJOeI4/exec');

// For reading history (GET) - use local JSON files (no CORS)
const ORDERS_JSON_URL = 'data/orders.json';
const RSVPS_JSON_URL = 'data/rsvps.json';

// ========== INITIALIZATION ==========
function setupTabListeners() {
    var btns = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener('click', function() {
            var tabId = this.dataset.tab;
            var allBtns = document.querySelectorAll('.tab-btn');
            for (var j = 0; j < allBtns.length; j++) {
                allBtns[j].classList.remove('active');
            }
            var allContents = document.querySelectorAll('.tab-content');
            for (var k = 0; k < allContents.length; k++) {
                allContents[k].classList.remove('active');
            }
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'spawns' && allPokemon.length === 0) loadSpawns();
            if (tabId === 'raids') loadRaids();
            if (tabId === 'current' || tabId === 'upcoming') {
                loadEvents();
                loadDebutData();
            }
        });
    }
}

function showKingiMessage() {
    showToast("Kingi's messenger link coming soon!");
}

// ========== PRICING ==========
async function loadPricing() {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'getPricing' })
        });
        const data = await response.json();
        if (data.status === 'success' && data.prices) {
            pricingCache = data.prices;
            coinPrices = {
                5600: parseFloat(data.prices['Coins_5600'] || 24),
                15500: parseFloat(data.prices['Coins_15500'] || 45),
                31000: parseFloat(data.prices['Coins_31000'] || 85)
            };
            updateCoinPriceDisplay();
        }
    } catch (e) {
        console.error('Error loading pricing:', e);
    }
}

function updateCoinPriceDisplay() {
    var price5600 = document.getElementById('coinPrice5600');
    var price15500 = document.getElementById('coinPrice15500');
    var price31000 = document.getElementById('coinPrice31000');
    if (price5600) price5600.textContent = coinPrices[5600];
    if (price15500) price15500.textContent = coinPrices[15500];
    if (price31000) price31000.textContent = coinPrices[31000];
}

// ========== SPAWNS ==========
async function loadSpawns() {
    var container = document.getElementById('spawnsList');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading spawns...</div>';
    
    try {
        // Fetch from your GitHub repo instead of Shungo API
        const response = await fetch('https://raw.githubusercontent.com/Skatecrete/pogo-raid-data/main/spawns.json');
        const data = await response.json();
        var spawnData = data.spawns || [];
        
        // Create a map of fetched spawns by ID
        var fetchedMap = new Map();
        for (var i = 0; i < spawnData.length; i++) {
            fetchedMap.set(spawnData[i].id, spawnData[i]);
        }
        
        var pokemonList = [];
        
        // First, add all fetched spawns
        for (var i = 0; i < spawnData.length; i++) {
            var item = spawnData[i];
            var pokedexId = item.id;
            var spawnRate = item.rate;
            var isShiny = item.shiny;
            var name = item.name;
            
            var isPermaboosted = [144,145,146,150,243,244,245,249,250,251,380,381,382,383,384,480,481,482,483,484,485,486,487,488,785,786,787,788,888,889,894,895].includes(pokedexId);
            
            pokemonList.push({
                id: pokedexId,
                name: name,
                spawnRate: spawnRate,
                isShiny: isShiny,
                shinyRate: isShiny ? (isPermaboosted ? '✨ 1/64' : '✨ 1/512') : '❌ Not available',
                isRegional: isRegionalPokemon(name),
                isTopGreatLeague: isTopGreatLeaguePokemon(name),
                isTopUltraLeague: isTopUltraLeaguePokemon(name),
                isTopMasterLeague: isTopMasterLeaguePokemon(name),
                isTopPremierCup: isTopPremierCupPokemon(name),
                isTopUltraPremier: isTopUltraPremierPokemon(name)
            });
        }
        
        // Then, add missing Pokémon from master list as NOPE
        for (var id in ALL_POKEMON_NAMES) {
            var numericId = parseInt(id);
            if (!fetchedMap.has(numericId)) {
                var name = ALL_POKEMON_NAMES[id];
                pokemonList.push({
                    id: numericId,
                    name: name,
                    spawnRate: 0.0,
                    isShiny: false,
                    shinyRate: '❌ Not available',
                    isRegional: isRegionalPokemon(name),
                    isTopGreatLeague: isTopGreatLeaguePokemon(name),
                    isTopUltraLeague: isTopUltraLeaguePokemon(name),
                    isTopMasterLeague: isTopMasterLeaguePokemon(name),
                    isTopPremierCup: isTopPremierCupPokemon(name),
                    isTopUltraPremier: isTopUltraPremierPokemon(name)
                });
            }
        }
        
        pokemonList.sort(function(a, b) { return b.spawnRate - a.spawnRate; });
        allPokemon = pokemonList;
        displaySpawns();
    } catch (e) {
        console.error('Error loading spawns:', e);
        container.innerHTML = '<div class="loading">Failed to load spawns: ' + e.message + '</div>';
    }
}

// ========== HELPER FUNCTIONS FOR POKEMON TAGS ==========
function isRegionalPokemon(name) {
    var regionals = ['Farfetch\'d', 'Kangaskhan', 'Mr. Mime', 'Tauros', 'Corsola', 'Heracross', 'Illumise', 'Lunatone', 'Relicanth', 'Seviper', 'Solrock', 'Torkoal', 'Tropius', 'Volbeat', 'Zangoose', 'Carnivine', 'Chatot', 'Pachirisu', 'Shellos', 'Maractus', 'Sigilyph', 'Hawlucha', 'Klefki', 'Comfey', 'Stonjourner'];
    for (var i = 0; i < regionals.length; i++) {
        if (name.includes(regionals[i])) return true;
    }
    return false;
}

function isTopGreatLeaguePokemon(name) {
    var greatLeague = ['Aegislash', 'Carbink', 'Giratina', 'Zygarde', 'Clodsire', 'Registeel', 'Azumarill', 'Lucario', 'Altaria', 'Turtonator', 'Regidrago', 'Crustle', 'Skeledirge', 'Diggersby', 'Kommo-o', 'Torkoal', 'Clefable', 'Regirock', 'Genesect', 'Goodra', 'Latias', 'Machamp', 'Cetitan', 'Pangoro', 'Murkrow', 'Raikou', 'Rufflet'];
    for (var i = 0; i < greatLeague.length; i++) {
        if (name.includes(greatLeague[i])) return true;
    }
    return false;
}

function isTopUltraLeaguePokemon(name) {
    var ultraLeague = ['Zygarde', 'Giratina', 'Cresselia', 'Forretress', 'Registeel', 'Skeledirge', 'Pecharunt', 'Tentacruel', 'Moltres', 'Jellicent', 'Cobalion', 'Regidrago', 'Tinkaton', 'Grumpig', 'Dusknoir', 'Crustle', 'Lapras', 'Turtonator', 'Steelix', 'Lucario', 'Clefable', 'Lickilicky', 'Florges', 'Genesect', 'Dialga', 'Latias', 'Regirock'];
    for (var i = 0; i < ultraLeague.length; i++) {
        if (name.includes(ultraLeague[i])) return true;
    }
    return false;
}

function isTopMasterLeaguePokemon(name) {
    var masterLeague = ['Zygarde', 'Eternatus', 'Dialga', 'Giratina', 'Meloetta', 'Yveltal', 'Kyurem', 'Reshiram', 'Palkia', 'Zekrom', 'Zamazenta', 'Lugia', 'Ho-Oh', 'Metagross', 'Goodra', 'Lunala', 'Xerneas', 'Urshifu', 'Garchomp', 'Latias'];
    for (var i = 0; i < masterLeague.length; i++) {
        if (name.includes(masterLeague[i])) return true;
    }
    return false;
}

function isTopPremierCupPokemon(name) {
    var premierCup = ['Zygarde', 'Eternatus', 'Meloetta', 'Dialga', 'Kyurem', 'Giratina', 'Palkia', 'Zamazenta', 'Zacian', 'Metagross', 'Goodra', 'Urshifu', 'Garchomp', 'Moltres', 'Hydreigon', 'Gholdengo', 'Marshadow', 'Ho-Oh', 'Kommo-o', 'Genesect', 'Baxcalibur'];
    for (var i = 0; i < premierCup.length; i++) {
        if (name.includes(premierCup[i])) return true;
    }
    return false;
}

function isTopUltraPremierPokemon(name) {
    var ultraPremier = ['Forretress', 'Zygarde', 'Jellicent', 'Tinkaton', 'Moltres', 'Skeledirge', 'Mewtwo', 'Regidrago', 'Pecharunt', 'Cresselia', 'Turtonator', 'Giratina', 'Cradily', 'Lucario', 'Lapras', 'Crustle', 'Tentacruel', 'Ninetales', 'Florges', 'Dialga', 'Genesect', 'Toucannon', 'Goodra', 'Kingdra', 'Talonflame', 'Lickilicky'];
    for (var i = 0; i < ultraPremier.length; i++) {
        if (name.includes(ultraPremier[i])) return true;
    }
    return false;
}

async function getPokemonName(id) {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon-species/' + id + '/');
        const data = await response.json();
        var names = data.names;
        for (var i = 0; i < names.length; i++) {
            if (names[i].language.name === 'en') {
                return names[i].name;
            }
        }
        return 'Pokemon #' + id;
    } catch {
        return 'Pokemon #' + id;
    }
}

function getFormSlug(name) {
    var nameLower = name.toLowerCase();
    
    var specials = {
        // Castform
        'castform rainy': 'castform-rainy',
        'castform snowy': 'castform-snowy',
        'castform sunny': 'castform-sunny',
        // Alolan
        'vulpix alola': 'vulpix-alolan',
        'ninetales alola': 'ninetales-alolan',
        'sandshrew alola': 'sandshrew-alolan',
        'sandslash alola': 'sandslash-alolan',
        'diglett alola': 'diglett-alolan',
        'dugtrio alola': 'dugtrio-alolan',
        'meowth alola': 'meowth-alolan',
        'persian alola': 'persian-alolan',
        'geodude alola': 'geodude-alolan',
        'graveler alola': 'graveler-alolan',
        'golem alola': 'golem-alolan',
        'grimer alola': 'grimer-alolan',
        'muk alola': 'muk-alolan',
        'exeggutor alola': 'exeggutor-alolan',
        'marowak alola': 'marowak-alolan',
        'raichu alola': 'raichu-alolan',
        // Galarian
        'meowth galarian': 'meowth-galarian',
        'ponyta galarian': 'ponyta-galarian',
        'rapidash galarian': 'rapidash-galarian',
        'slowpoke galarian': 'slowpoke-galarian',
        'slowbro galarian': 'slowbro-galarian',
        'slowking galarian': 'slowking-galarian',
        'zigzagoon galarian': 'zigzagoon-galarian',
        'linoone galarian': 'linoone-galarian',
        'darumaka galarian': 'darumaka-galarian',
        'darmanitan galarian': 'darmanitan-galarian',
        'yamask galarian': 'yamask-galarian',
        'stunfisk galarian': 'stunfisk-galarian',
        'corsola galarian': 'corsola-galarian',
        // Hisuian
        'growlithe hisuian': 'growlithe-hisuian',
        'arcanine hisuian': 'arcanine-hisuian',
        'voltorb hisuian': 'voltorb-hisuian',
        'electrode hisuian': 'electrode-hisuian',
        'typhlosion hisuian': 'typhlosion-hisuian',
        'qwilfish hisuian': 'qwilfish-hisuian',
        'sneasel hisuian': 'sneasel-hisuian',
        'samurott hisuian': 'samurott-hisuian',
        'lilligant hisuian': 'lilligant-hisuian',
        'zorua hisuian': 'zorua-hisuian',
        'zoroark hisuian': 'zoroark-hisuian',
        'braviary hisuian': 'braviary-hisuian',
        'sliggoo hisuian': 'sliggoo-hisuian',
        'goodra hisuian': 'goodra-hisuian',
        'avalugg hisuian': 'avalugg-hisuian',
        'decidueye hisuian': 'decidueye-hisuian',
        // Paldean
        'wooper paldean': 'wooper-paldean',
        'clodsire paldean': 'clodsire-paldean'
    };
    
    if (specials[nameLower]) return specials[nameLower];
    
    // Default: replace spaces with hyphens
    return nameLower.replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
}

function displaySpawns() {
    var container = document.getElementById('spawnsList');
    if (!container) return;
    
    var filtered = allPokemon.slice();
    
    if (currentSearch) {
        filtered = filtered.filter(function(p) { return p.name.toLowerCase().includes(currentSearch); });
    }
    
    if (filters.shundo) {
        filtered = filtered.filter(function(p) { return p.spawnRate >= 0.45 && p.isShiny; });
    }
    if (filters.shiny164) {
        filtered = filtered.filter(function(p) { return p.isShiny && p.spawnRate >= 0.45; });
    }
    if (filters.regional) {
        filtered = filtered.filter(function(p) { return p.isRegional; });
    }
    if (filters.greatLeague) {
        filtered = filtered.filter(function(p) { return p.isTopGreatLeague; });
    }
    if (filters.ultraLeague) {
        filtered = filtered.filter(function(p) { return p.isTopUltraLeague; });
    }
    if (filters.masterLeague) {
        filtered = filtered.filter(function(p) { return p.isTopMasterLeague; });
    }
    if (filters.premierCup) {
        filtered = filtered.filter(function(p) { return p.isTopPremierCup; });
    }
    if (filters.ultraPremier) {
        filtered = filtered.filter(function(p) { return p.isTopUltraPremier; });
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading">No spawns found</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < filtered.length; i++) {
        var p = filtered[i];
        
        // Check for NOPE (spawn rate == 0.0)
        var isNope = p.spawnRate === 0.0;
        
        var badgeClass = '', badgeText = '';
        if (!isNope) {
            if (p.spawnRate >= 0.85) { badgeClass = 'badge-heavy'; badgeText = 'HEAVY'; }
            else if (p.spawnRate >= 0.65) { badgeClass = 'badge-medium'; badgeText = 'MEDIUM'; }
            else if (p.spawnRate >= 0.30) { badgeClass = 'badge-low'; badgeText = 'LOW'; }
            else { badgeClass = 'badge-minimal'; badgeText = 'MINIMAL'; }
        }
        
        // Build tags HTML
        var tagsHtml = '';
        if (p.isRegional) tagsHtml += '<span class="pokemon-tag tag-regional">🌍 Regional</span>';
        if (p.isTopGreatLeague) tagsHtml += '<span class="pokemon-tag tag-great">🏆 Great League</span>';
        if (p.isTopUltraLeague) tagsHtml += '<span class="pokemon-tag tag-ultra">🏆 Ultra League</span>';
        if (p.isTopMasterLeague) tagsHtml += '<span class="pokemon-tag tag-master">🏆 Master League</span>';
        if (p.isTopPremierCup) tagsHtml += '<span class="pokemon-tag tag-premier">🏆 Premier Cup</span>';
        if (p.isTopUltraPremier) tagsHtml += '<span class="pokemon-tag tag-ultra-premier">🏆 Ultra Premier</span>';
        
        // For NOPE Pokémon, disable click and add disabled style
        if (isNope) {
            html += '<div class="pokemon-card disabled" style="opacity:0.5; cursor:not-allowed;">';
        } else {
            html += '<div class="pokemon-card" onclick=\'showSpawnOrderDialog(' + JSON.stringify(p).replace(/'/g, "&#39;") + ')\'>';
        }
        
        // Build image URLs with ultimategallery priority
        var ultimateUrl = getUltimateGalleryUrl(p.name, false, false, false);
        var customImageUrl = 'https://raw.githubusercontent.com/Skatecrete/pogo-raid-data/main/images/' + p.id + '_' + getFormSlug(p.name) + '.webp';
        var pokeApiFallback = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/' + p.id + '.png';
        
        // Start with ultimategallery, fallback to custom images, then PokeAPI
        var imageSrc = ultimateUrl || customImageUrl;
        
        html += '<img src="' + imageSrc + '" onerror="this.src=\'' + pokeApiFallback + '\'">';
        html += '<div class="pokemon-info">';
        
        // Pokemon name with NOPE badge or spawn badge
        html += '<div class="pokemon-name">' + p.name;
        if (isNope) {
            html += '<span class="spawn-badge badge-nope">💀 NOPE</span>';
        } else if (badgeText) {
            html += '<span class="spawn-badge ' + badgeClass + '">' + badgeText + '</span>';
        }
        html += '</div>';
        
        html += '<div class="pokemon-tags">' + tagsHtml + '</div>';
        
        // Spawn rate and shiny rate
        var spawnRateDisplay = isNope ? '0.00%' : p.spawnRate.toFixed(2) + '%';
        html += '<div class="pokemon-details"><span class="spawn-rate-green">Spawn Rate: ' + spawnRateDisplay + '</span> | <span class="shiny-rate">' + p.shinyRate + '</span></div>';
        html += '</div>';
        
        if (!isNope) {
            html += '<button class="order-btn" onclick="event.stopPropagation(); showSpawnOrderDialog(' + JSON.stringify(p).replace(/'/g, "&#39;") + ')">➕ Order</button>';
        } else {
            html += '<button class="order-btn disabled" style="opacity:0.5; cursor:not-allowed;" disabled>➕ Order</button>';
        }
        html += '</div>';
    }
    container.innerHTML = html;
}

function filterSpawns() {
    var searchInput = document.getElementById('spawnSearch');
    currentSearch = searchInput ? searchInput.value.toLowerCase() : '';
    displaySpawns();
}

function toggleFilter(filter) {
    filters[filter] = !filters[filter];
    var btn = event.target;
    if (filters[filter]) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
    displaySpawns();
}

// ========== SPAWN ORDER DIALOG ==========
var currentSpawnPokemon = null;
var spawnQuantities = { shundo: 0, hundo: 0, shiny: 0, normal: 0 };

function showSpawnOrderDialog(pokemon) {
    // Prevent order dialog for NOPE Pokémon
    if (pokemon.spawnRate === 0.0) {
        showToast("This Pokémon is not currently spawning.");
        return;
    }
    
    currentSpawnPokemon = pokemon;
    spawnQuantities = { shundo: 0, hundo: 0, shiny: 0, normal: 0 };
    
    // Use regional pricing if applicable
    var shundoPrice = pricingCache['Spawn_Shundo'] || 5;
    var hundoPrice = pokemon.isRegional ? (pricingCache['Spawn_Hundo_Regional'] || 8) : (pricingCache['Spawn_Hundo'] || 3);
    var shinyPrice = pokemon.isRegional ? (pricingCache['Spawn_Shiny_Regional'] || 5) : (pricingCache['Spawn_Shiny'] || 2);
    var normalRegionalPrice = pricingCache['Spawn_Normal_Regional'] || 3;
    
    // Check if disclaimer should show (spawn rate between 0.45% and 0.65%)
    var showShundoDisclaimer = pokemon.spawnRate >= 0.45 && pokemon.spawnRate < 0.65 && pokemon.isShiny;
    
    // Check if Shundo should be available (0.45% or higher, with shiny)
    var shundoAvailable = pokemon.spawnRate >= 0.45 && pokemon.isShiny;
    
    document.getElementById('modalTitle').textContent = 'Order ' + pokemon.name;
    document.getElementById('modalBody').innerHTML = `
        <div class="order-stats">
            <div>Spawn Rate: ${pokemon.spawnRate.toFixed(2)}%</div>
            <div>Shiny: ${pokemon.shinyRate}</div>
        </div>
        
        ${showShundoDisclaimer ? `
        <div class="order-section" style="background:#33FFA500; margin-bottom:16px;">
            <div class="section-title" style="color:#FFA500;">⚠️ Disclaimer</div>
            <div style="font-size:12px; color:#FFA500; text-align:center;">Shundos between 0.45% - 0.65% may take up to 2 days to complete</div>
        </div>
        ` : ''}
        
        ${shundoAvailable ? `
        <div class="order-section">
            <div class="section-title">✨ SHUNDO (100% IV + SHINY) - $${shundoPrice} EACH</div>
            <div class="quantity-selector">
                <button class="qty-btn" onclick="updateSpawnQty('shundo', -1)">-</button>
                <span id="shundoQty" class="qty-num">0</span>
                <button class="qty-btn" onclick="updateSpawnQty('shundo', 1)">+</button>
                <span id="shundoPrice" class="item-price">$0.00</span>
            </div>
        </div>
        ` : ''}
        
        <div class="order-section">
            <div class="section-title">💯 HUNDO (100% IV) - ${pokemon.isRegional ? 'REGIONAL - ' : ''}$${hundoPrice} EACH</div>
            <div class="quantity-selector">
                <button class="qty-btn" onclick="updateSpawnQty('hundo', -1)">-</button>
                <span id="hundoQty" class="qty-num">0</span>
                <button class="qty-btn" onclick="updateSpawnQty('hundo', 1)">+</button>
                <span id="hundoPrice" class="item-price">$0.00</span>
            </div>
        </div>
        
        <div class="order-section">
            <div class="section-title">✨ SHINY (Random IVs) - ${pokemon.isRegional ? 'REGIONAL - ' : ''}$${shinyPrice} EACH</div>
            <div class="quantity-selector">
                <button class="qty-btn" onclick="updateSpawnQty('shiny', -1)">-</button>
                <span id="shinyQty" class="qty-num">0</span>
                <button class="qty-btn" onclick="updateSpawnQty('shiny', 1)">+</button>
                <span id="shinyPrice" class="item-price">$0.00</span>
            </div>
        </div>
        
        ${pokemon.isRegional ? `
        <div class="order-section">
            <div class="section-title">🎲 NORMAL (Any IV) - REGIONAL - $${normalRegionalPrice} EACH</div>
            <div class="quantity-selector">
                <button class="qty-btn" onclick="updateSpawnQty('normal', -1)">-</button>
                <span id="normalQty" class="qty-num">0</span>
                <button class="qty-btn" onclick="updateSpawnQty('normal', 1)">+</button>
                <span id="normalPrice" class="item-price">$0.00</span>
            </div>
        </div>
        ` : ''}
    `;
    document.getElementById('modalFooter').innerHTML = '<button class="cancel-btn" onclick="closeModal()">Cancel</button><button class="confirm-btn" onclick="addSpawnOrderToCart()">Add to Cart</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

function updateSpawnQty(type, delta) {
    var newQty = Math.max(0, spawnQuantities[type] + delta);
    spawnQuantities[type] = newQty;
    
    var priceMap = { 
        shundo: pricingCache['Spawn_Shundo'] || 5, 
        hundo: currentSpawnPokemon.isRegional ? (pricingCache['Spawn_Hundo_Regional'] || 8) : (pricingCache['Spawn_Hundo'] || 3),
        shiny: currentSpawnPokemon.isRegional ? (pricingCache['Spawn_Shiny_Regional'] || 5) : (pricingCache['Spawn_Shiny'] || 2),
        normal: pricingCache['Spawn_Normal_Regional'] || 3
    };
    
    var qtyElem = document.getElementById(type + 'Qty');
    var priceElem = document.getElementById(type + 'Price');
    if (qtyElem) qtyElem.textContent = newQty;
    if (priceElem) {
        var price = newQty * priceMap[type];
        priceElem.textContent = '$' + price.toFixed(2);
    }
}

function addSpawnOrderToCart() {
    var shundo = spawnQuantities.shundo;
    var hundo = spawnQuantities.hundo;
    var shiny = spawnQuantities.shiny;
    var normal = spawnQuantities.normal;
    
    if (shundo > 0) {
        addToCart({ type: 'shundo', pokemonName: currentSpawnPokemon.name, quantity: shundo, price: shundo * (pricingCache['Spawn_Shundo'] || 5) });
    }
    if (hundo > 0) {
        addToCart({ type: 'hundo', pokemonName: currentSpawnPokemon.name, quantity: hundo, price: hundo * (pricingCache['Spawn_Hundo'] || 3) });
    }
    if (shiny > 0) {
        addToCart({ type: 'shiny', pokemonName: currentSpawnPokemon.name, quantity: shiny, price: shiny * (pricingCache['Spawn_Shiny'] || 2) });
    }
    if (normal > 0) {
        addToCart({ type: 'service', pokemonName: currentSpawnPokemon.name + ' (Normal Regional)', quantity: normal, price: normal * (pricingCache['Spawn_Normal_Regional'] || 3) });
    }
    
    closeModal();
    showToast('Added to cart!');
}

// ========== RAIDS ==========
async function loadRaids() {
    var container = document.getElementById('raidsList');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading raids...</div>';
    
    try {
        // Fetch from both sources
        var scrapedResponse = await fetch('https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.min.json');
        var dynaResponse = await fetch('https://raw.githubusercontent.com/Skatecrete/pogo-raid-data/main/current_raids.json');
        
        if (!scrapedResponse.ok || !dynaResponse.ok) {
            throw new Error('Failed to load raid data');
        }
        
        var scrapedRaids = await scrapedResponse.json();
        var dynaRaids = await dynaResponse.json();
        
        // Initialize regular raids object
        var regularRaids = { 
            tier5: [], shadow5: [], shadow3: [], shadow1: [], ultraBeasts: []  // ADDED ultraBeasts
        };
        
        // ========== ULTRA BEAST IDS ==========
        const ultraBeastIds = [793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806];
        
        function isUltraBeast(id) {
            return ultraBeastIds.includes(id);
        }
        
        // Process ScrapedDuck raids (5-Star and Shadow only)
        for (var i = 0; i < scrapedRaids.length; i++) {
            var raid = scrapedRaids[i];
            var tier = raid.tier;
            var name = raid.name;
            var id = await getPokemonIdFromName(name);
            
            // Build image URL with ultimategallery first
            var isShadow = name.toLowerCase().includes('shadow') || tier.toLowerCase().includes('shadow');
            var isMega = tier.toLowerCase().includes('mega') || name.toLowerCase().includes('mega');
            
            var imageUrl;
            if (isMega) {
                var ultimateUrl = getUltimateGalleryUrl(name, raid.canBeShiny, true, false);
                imageUrl = ultimateUrl || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/' + id + '.png';
            } else {
                var ultimateUrl = getUltimateGalleryUrl(name, raid.canBeShiny, false, false);
                imageUrl = ultimateUrl || (raid.image || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/' + id + '.png');
            }
            
            var raidObj = { 
                name: name, 
                tier: tier, 
                id: id, 
                isShiny: raid.canBeShiny, 
                image: imageUrl
            };
            
            var tierLower = tier.toLowerCase();
            var nameLower = name.toLowerCase();
            
            // CHECK FOR ULTRA BEAST FIRST (before shadow or 5-star)
            if (isUltraBeast(id)) {
                regularRaids.ultraBeasts.push(raidObj);
            } else if (nameLower.includes('shadow') || tierLower.includes('shadow')) {
                if (tierLower.includes('5-star') || tierLower.includes('legendary')) {
                    regularRaids.shadow5.push(raidObj);
                } else if (tierLower.includes('3-star')) {
                    regularRaids.shadow3.push(raidObj);
                } else {
                    regularRaids.shadow1.push(raidObj);
                }
            } else if (tierLower.includes('5-star')) {
                regularRaids.tier5.push(raidObj);
            }
            // Ignore other tiers from ScrapedDuck (1-Star, 3-Star, Mega)
        }
        
        // Process SnackNap raids (1-Star, 3-Star, Mega, Dynamax, Gigantamax)
        var invalidNames = ['bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire', 'flying', 'ghost', 'grass', 'ground', 'ice', 'normal', 'poison', 'psychic', 'rock', 'steel', 'water', 'Search...'];
        
        // 1-Star from SnackNap
        if (dynaRaids['tier1']) {
            for (var j = 0; j < dynaRaids['tier1'].length; j++) {
                var raidName = dynaRaids['tier1'][j];
                if (raidName && raidName.length > 2 && !invalidNames.includes(raidName)) {
                    var raidId = await getPokemonIdFromName(raidName);
                    var ultimateUrl = getUltimateGalleryUrl(raidName, true, false, false);
                    var imageUrl = ultimateUrl || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/' + raidId + '.png';
                    if (!regularRaids.tier1) regularRaids.tier1 = [];
                    regularRaids.tier1.push({ 
                        name: raidName, 
                        tier: '1-Star', 
                        id: raidId, 
                        isShiny: true, 
                        image: imageUrl
                    });
                }
            }
        }
        
        // 3-Star from SnackNap
        if (dynaRaids['tier3']) {
            for (var j = 0; j < dynaRaids['tier3'].length; j++) {
                var raidName = dynaRaids['tier3'][j];
                if (raidName && raidName.length > 2 && !invalidNames.includes(raidName)) {
                    var raidId = await getPokemonIdFromName(raidName);
                    var ultimateUrl = getUltimateGalleryUrl(raidName, true, false, false);
                    var imageUrl = ultimateUrl || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/' + raidId + '.png';
                    if (!regularRaids.tier3) regularRaids.tier3 = [];
                    regularRaids.tier3.push({ 
                        name: raidName, 
                        tier: '3-Star', 
                        id: raidId, 
                        isShiny: true, 
                        image: imageUrl
                    });
                }
            }
        }
        
        // Mega from SnackNap
        if (dynaRaids['mega']) {
            for (var j = 0; j < dynaRaids['mega'].length; j++) {
                var raidName = dynaRaids['mega'][j];
                if (raidName && raidName.length > 2 && !invalidNames.includes(raidName)) {
                    var raidId = await getPokemonIdFromName(raidName);
                    var ultimateUrl = getUltimateGalleryUrl(raidName, true, true, false);
                    var imageUrl = ultimateUrl || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/' + raidId + '.png';
                    if (!regularRaids.mega) regularRaids.mega = [];
                    regularRaids.mega.push({ 
                        name: raidName, 
                        tier: 'Mega', 
                        id: raidId, 
                        isShiny: true, 
                        image: imageUrl
                    });
                }
            }
        }
        
        // Ultra Beasts from SnackNap (NEW)
        if (dynaRaids['ultra_beasts']) {
            for (var j = 0; j < dynaRaids['ultra_beasts'].length; j++) {
                var raidName = dynaRaids['ultra_beasts'][j];
                if (raidName && raidName.length > 2 && !invalidNames.includes(raidName)) {
                    var raidId = await getPokemonIdFromName(raidName);
                    var ultimateUrl = getUltimateGalleryUrl(raidName, true, false, false);
                    var imageUrl = ultimateUrl || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/' + raidId + '.png';
                    regularRaids.ultraBeasts.push({ 
                        name: raidName, 
                        tier: 'Ultra Beast', 
                        id: raidId, 
                        isShiny: true, 
                        image: imageUrl
                    });
                }
            }
        }
        
        // Dynamax and Gigantamax
        var dynamaxRaids = [];
        var tierMapping = {
            'gigantamax': '💥 GIGANTAMAX',
            'dynamax_tier5': '⚡⚡⚡⚡⚡ DYNAMAX TIER 5',
            'dynamax_tier4': '⚡⚡⚡⚡ DYNAMAX TIER 4',
            'dynamax_tier3': '⚡⚡⚡ DYNAMAX TIER 3',
            'dynamax_tier2': '⚡⚡ DYNAMAX TIER 2',
            'dynamax_tier1': '⚡ DYNAMAX TIER 1'
        };
        
        for (var key in tierMapping) {
            if (dynaRaids[key] && dynaRaids[key].length) {
                for (var j = 0; j < dynaRaids[key].length; j++) {
                    var raidName = dynaRaids[key][j];
                    if (!raidName || raidName.length < 2 || invalidNames.includes(raidName) || invalidNames.includes(raidName.toLowerCase())) continue;
                    var raidId = await getPokemonIdFromName(raidName);
                    
                    // Build image URL
                    var isGigantamax = (key === 'gigantamax');
                    var isDynamax = !isGigantamax;
                    
                    var ultimateUrl;
                    if (isGigantamax) {
                        ultimateUrl = getUltimateGalleryUrl(raidName, true, false, true);
                    } else {
                        ultimateUrl = getUltimateGalleryUrl(raidName, true, false, false);
                    }
                    
                    var imageUrl;
                    if (isGigantamax) {
                        // Fallback for Gigantamax
                        var slug = raidName.toLowerCase();
                        if (slug === 'toxtricity') slug = 'toxtricity';
                        if (slug === 'flapple' || slug === 'appletun') slug = 'appletun';
                        imageUrl = ultimateUrl || 'https://raw.githubusercontent.com/Skatecrete/infographics/main/gigantamax/gigantamax_' + slug + '.png';
                    } else {
                        // Fallback for Dynamax
                        imageUrl = ultimateUrl || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/' + raidId + '.png';
                    }
                    
                    dynamaxRaids.push({ 
                        name: raidName, 
                        tier: tierMapping[key], 
                        id: raidId, 
                        isShiny: true, 
                        image: imageUrl
                    });
                }
            }
        }
        
        displayRaids(regularRaids, dynamaxRaids);
    } catch (e) {
        console.error('Raids error:', e);
        container.innerHTML = '<div class="loading">Failed to load raids: ' + e.message + '</div>';
    }
}

async function getPokemonIdFromName(name) {
    var cleanName = name.replace('Shadow ', '').replace('Mega ', '').replace('D-Max ', '').trim().toLowerCase();
    
    // Special form mappings for PokeAPI
    var formMap = {
        'alolan marowak': 'marowak-alola',
        'alolan vulpix': 'vulpix-alola',
        'alolan sandshrew': 'sandshrew-alola',
        'alolan sandslash': 'sandslash-alola',
        'alolan diglett': 'diglett-alola',
        'alolan dugtrio': 'dugtrio-alola',
        'alolan meowth': 'meowth-alola',
        'alolan persian': 'persian-alola',
        'alolan geodude': 'geodude-alola',
        'alolan graveler': 'graveler-alola',
        'alolan golem': 'golem-alola',
        'alolan grimer': 'grimer-alola',
        'alolan muk': 'muk-alola',
        'alolan exeggutor': 'exeggutor-alola',
        'alolan raichu': 'raichu-alola',
        'galarian meowth': 'meowth-galar',
        'galarian ponyta': 'ponyta-galar',
        'galarian rapidash': 'rapidash-galar',
        'galarian slowpoke': 'slowpoke-galar',
        'galarian farfetchd': 'farfetchd-galar',
        'galarian zigzagoon': 'zigzagoon-galar',
        'galarian linoone': 'linoone-galar',
        'galarian darumaka': 'darumaka-galar',
        'galarian yamask': 'yamask-galar',
        'galarian stunfisk': 'stunfisk-galar',
        'hisuian growlithe': 'growlithe-hisui',
        'hisuian voltorb': 'voltorb-hisui',
        'hisuian sneasel': 'sneasel-hisui',
        'hisuian avalugg': 'avalugg-hisui',
        'hisuian qwilfish': 'qwilfish-hisui'
    };
    
    var apiName = formMap[cleanName] || cleanName;
    
    // Simple ID map for common shadow Pokémon (fallback)
    var simpleMap = { 
        'dratini': 147, 'gligar': 207, 'cacnea': 331, 'joltik': 595, 
        'lapras': 131, 'stantler': 234, 'latios': 381, 'latias': 380,
        'marowak-alola': 105, 'marowak': 105
    };
    
    if (simpleMap[apiName]) return simpleMap[apiName];
    
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon/' + apiName);
        if (response.ok) {
            const data = await response.json();
            return data.id;
        }
        // If fails, try without form
        var baseName = cleanName.split(' ')[0];
        if (simpleMap[baseName]) return simpleMap[baseName];
        return 25; // Pikachu as default
    } catch {
        return 25;
    }
}

function displayRaids(regularRaids, dynamaxRaids) {
    var container = document.getElementById('raidsList');
    if (!container) return;
    
    // Updated category order - Ultra Beasts at the top
    var categoryOrder = [
        { key: 'ultraBeasts', title: '🌀 ULTRA BEASTS' },
        { key: 'tier6', title: '⭐⭐⭐⭐⭐⭐ 6-STAR RAIDS' }, 
        { key: 'tier5', title: '⭐⭐⭐⭐⭐ 5-STAR RAIDS' },
        { key: 'tier4', title: '⭐⭐⭐⭐ 4-STAR RAIDS' }, 
        { key: 'tier3', title: '⭐⭐⭐ 3-STAR RAIDS' },
        { key: 'tier2', title: '⭐⭐ 2-STAR RAIDS' }, 
        { key: 'tier1', title: '⭐ 1-STAR RAIDS' },
        { key: 'mega', title: '🔴 MEGA RAIDS' }, 
        { key: 'shadow5', title: '🌑 SHADOW LEGENDARY (5-STAR)' },
        { key: 'shadow3', title: '🌑 SHADOW 3-STAR RAIDS' }, 
        { key: 'shadow1', title: '🌑 SHADOW 1-STAR RAIDS' }
    ];
    
    // Updated dynamax order - added dynamax_tier5
    var dynaOrder = [
        { key: 'gigantamax', title: '💥 GIGANTAMAX' },
        { key: 'dynamax_tier5', title: '⚡⚡⚡⚡⚡ DYNAMAX TIER 5' },
        { key: 'dynamax_tier4', title: '⚡⚡⚡⚡ DYNAMAX TIER 4' },
        { key: 'dynamax_tier3', title: '⚡⚡⚡ DYNAMAX TIER 3' },
        { key: 'dynamax_tier2', title: '⚡⚡ DYNAMAX TIER 2' },
        { key: 'dynamax_tier1', title: '⚡ DYNAMAX TIER 1' }  
    ];
    
    var html = '';
    
    for (var c = 0; c < categoryOrder.length; c++) {
        var cat = categoryOrder[c];
        if (regularRaids[cat.key] && regularRaids[cat.key].length) {
            // Add ultra-beast class for header styling
            var headerClass = (cat.key === 'ultraBeasts') ? 'raid-header ultra-beast' : 'raid-header';
            html += '<div class="' + headerClass + '"><h4>' + cat.title + '</h4></div><div class="raids-grid">';
            for (var r = 0; r < regularRaids[cat.key].length; r++) {
                var raid = regularRaids[cat.key][r];
                var isGigantamax = raid.tier === 'Gigantamax' || raid.tier === '💥 GIGANTAMAX';
                var isDynamax = raid.tier.includes('Dynamax');
                var isShadow = raid.name.includes('Shadow') || raid.tier.includes('Shadow');
                var isUltraBeast = (cat.key === 'ultraBeasts');
                
                html += '<div class="raid-card" onclick=\'showRaidOrderDialog(' + JSON.stringify(raid).replace(/'/g, "&#39;") + ')\'>';
                html += '<div class="raid-image-container">';
                
                // Underlays (behind image)
                if (isShadow) html += '<div class="shadow-underlay"></div>';
                if (!isGigantamax && isDynamax) html += '<div class="dynamax-underlay"></div>';
                if (isUltraBeast) html += '<div class="ultrabeast-underlay"></div>';
                
                // Pokémon image
                html += '<img src="' + raid.image + '" onerror="this.src=\'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png\'">';
                
                // Red tint overlay (on top of image, Dynamax only)
                if (!isGigantamax && isDynamax) html += '<div class="dynamax-red-tint"></div>';
                
                html += '</div>';
                html += '<span>' + raid.name + (raid.isShiny ? ' ✨' : '') + '</span>';
                html += '</div>';
            }
            html += '</div>';
        }
    }
    
    var dynaByTier = {};
    for (var d = 0; d < dynamaxRaids.length; d++) {
        var raid = dynamaxRaids[d];
        if (!dynaByTier[raid.tier]) dynaByTier[raid.tier] = [];
        dynaByTier[raid.tier].push(raid);
    }
    
    for (var dt = 0; dt < dynaOrder.length; dt++) {
        var dyna = dynaOrder[dt];
        if (dynaByTier[dyna.title] && dynaByTier[dyna.title].length) {
            html += '<div class="raid-header"><h4>' + dyna.title + '</h4></div><div class="raids-grid">';
            for (var dr = 0; dr < dynaByTier[dyna.title].length; dr++) {
                var raid = dynaByTier[dyna.title][dr];
                var isGigantamax = (dyna.title === '💥 GIGANTAMAX');
                var isDynamax = dyna.title.includes('DYNAMAX');
                
                html += '<div class="raid-card" onclick=\'showDynamaxOrderDialog(' + JSON.stringify(raid).replace(/'/g, "&#39;") + ')\'>';
                html += '<div class="raid-image-container">';
                
                // Underlays (behind image) - Gigantamax gets nothing
                if (!isGigantamax && isDynamax) {
                    html += '<div class="dynamax-underlay"></div>';
                }
                
                // Pokémon image
                html += '<img src="' + raid.image + '" onerror="this.src=\'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png\'">';
                
                // Red tint overlay (on top of image, Dynamax only, NOT Gigantamax)
                if (!isGigantamax && isDynamax) {
                    html += '<div class="dynamax-red-tint"></div>';
                }
                
                html += '</div>';
                html += '<span>' + raid.name + '</span>';
                html += '</div>';
            }
            html += '</div>';
        }
    }
    
    container.innerHTML = html || '<div class="loading">No raids available</div>';
}

// ========== RAID ORDER DIALOGS ==========
var selectedRaidPack = { quantity: 0, price: 0 };
var currentRaid = null;
var dynamaxQuantity = 0;

function showRaidOrderDialog(raid) {
    currentRaid = raid;
    selectedRaidPack = { quantity: 0, price: 0 };
    
    document.getElementById('modalTitle').textContent = 'Order ' + raid.name + ' Raids';
    document.getElementById('modalBody').innerHTML = `
        <div class="order-stats"><div>Tier: ${raid.tier}</div><div>Shiny Available: ${raid.isShiny ? '✨ Yes' : '❌ No'}</div></div>
        <div class="order-section">
            <div class="section-title">📦 RAID PACKS</div>
            <div class="raid-packs">
                <button class="pack-btn" onclick="selectRaidPack(10, ${pricingCache['Raid_Normal_10'] || 7})">10 Raids - $${pricingCache['Raid_Normal_10'] || 7}</button>
                <button class="pack-btn" onclick="selectRaidPack(20, ${pricingCache['Raid_Normal_20'] || 12})">20 Raids - $${pricingCache['Raid_Normal_20'] || 12}</button>
                <button class="pack-btn" onclick="selectRaidPack(50, ${pricingCache['Raid_Normal_50'] || 20})">50 Raids - $${pricingCache['Raid_Normal_50'] || 20}</button>
            </div>
            <div id="raidSelectedInfo" style="margin-top:12px;text-align:center"></div>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = '<button class="cancel-btn" onclick="closeModal()">Cancel</button><button class="confirm-btn" onclick="addRaidToCart()">Add to Cart</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

function selectRaidPack(quantity, price) {
    selectedRaidPack = { quantity: quantity, price: price };
    document.getElementById('raidSelectedInfo').innerHTML = 'Selected: ' + quantity + ' Raids - $' + price;
}

function addRaidToCart() {
    if (!selectedRaidPack.quantity) { showToast('Please select a raid pack'); return; }
    addToCart({ type: 'raid', pokemonName: currentRaid.name, raidTier: currentRaid.tier, quantity: selectedRaidPack.quantity, price: selectedRaidPack.price });
    closeModal();
}

function showDynamaxOrderDialog(raid) {
    currentRaid = raid;
    dynamaxQuantity = 0;
    
    var isGigantamax = raid.tier === '💥 GIGANTAMAX';
    var imageUrl;
    
    if (isGigantamax) {
        var slug = raid.name.toLowerCase();
        if (slug === 'toxtricity') slug = 'toxtricity';
        if (slug === 'flapple' || slug === 'appletun') slug = 'appletun';
        imageUrl = 'https://raw.githubusercontent.com/Skatecrete/infographics/main/gigantamax/gigantamax_' + slug + '.png';
    } else {
        imageUrl = raid.image;
    }
    
    document.getElementById('modalTitle').textContent = 'Order ' + raid.name;
    document.getElementById('modalBody').innerHTML = `
        <div class="order-stats"><div>Tier: ${raid.tier}</div></div>
        <div class="order-section" style="text-align:center;">
            <img src="${imageUrl}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'" style="width:120px; height:120px; object-fit:contain; margin:0 auto; display:block;">
        </div>
        <div class="order-section">
            <div class="section-title">⚡ SELECT QUANTITY (4 for $${pricingCache['Raid_Dynamax_4'] || 10} or $${pricingCache['Raid_Dynamax_Single'] || 2.50} each)</div>
            <div class="quantity-selector">
                <button class="qty-btn" onclick="updateDynamaxQty(-1)">-</button>
                <span id="dynamaxQty" class="qty-num">0</span>
                <button class="qty-btn" onclick="updateDynamaxQty(1)">+</button>
                <span id="dynamaxPrice" class="item-price">$0.00</span>
            </div>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = '<button class="cancel-btn" onclick="closeModal()">Cancel</button><button class="confirm-btn" onclick="addDynamaxToCart()">Add to Cart</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

function updateDynamaxQty(delta) {
    dynamaxQuantity = Math.max(0, dynamaxQuantity + delta);
    var qtyElem = document.getElementById('dynamaxQty');
    var priceElem = document.getElementById('dynamaxPrice');
    if (qtyElem) qtyElem.textContent = dynamaxQuantity;
    if (priceElem) {
        var price = Math.floor(dynamaxQuantity / 4) * (pricingCache['Raid_Dynamax_4'] || 10) + (dynamaxQuantity % 4) * (pricingCache['Raid_Dynamax_Single'] || 2.5);
        priceElem.textContent = '$' + price.toFixed(2);
    }
}

function addDynamaxToCart() {
    if (!dynamaxQuantity) { showToast('Please select a quantity'); return; }
    var price = Math.floor(dynamaxQuantity / 4) * (pricingCache['Raid_Dynamax_4'] || 10) + (dynamaxQuantity % 4) * (pricingCache['Raid_Dynamax_Single'] || 2.5);
    addToCart({ type: 'dynamax', pokemonName: currentRaid.name, raidTier: currentRaid.tier, quantity: dynamaxQuantity, price: price });
    closeModal();
}

// ========== CART FUNCTIONS ==========

function recalculateAllRaidPrices() {
    // Get all raid items
    var raidIndices = [];
    var raidItems = [];
    
    for (var i = 0; i < cartItems.length; i++) {
        if (cartItems[i].type === 'raid') {
            raidIndices.push(i);
            raidItems.push(cartItems[i]);
        }
    }
    
    if (raidItems.length === 0) return;
    
    // Calculate total quantity of all raids
    var totalQuantity = 0;
    for (var i = 0; i < raidItems.length; i++) {
        totalQuantity += raidItems[i].quantity;
    }
    
    // Calculate total price based on total quantity
    var totalPrice = 0;
    var remaining = totalQuantity;
    var raidPrice10 = pricingCache['Raid_Normal_10'] || 7;
    var raidPrice20 = pricingCache['Raid_Normal_20'] || 12;
    var raidPrice50 = pricingCache['Raid_Normal_50'] || 20;
    var singlePrice = raidPrice10 / 10;
    
    var fiftyPacks = Math.floor(remaining / 50);
    totalPrice += fiftyPacks * raidPrice50;
    remaining = remaining % 50;
    
    var twentyPacks = Math.floor(remaining / 20);
    totalPrice += twentyPacks * raidPrice20;
    remaining = remaining % 20;
    
    var tenPacks = Math.floor(remaining / 10);
    totalPrice += tenPacks * raidPrice10;
    remaining = remaining % 10;
    
    if (remaining > 0) {
        totalPrice += remaining * singlePrice;
    }
    
    // Distribute price proportionally back to each item
    for (var i = 0; i < raidItems.length; i++) {
        var proportion = raidItems[i].quantity / totalQuantity;
        cartItems[raidIndices[i]].price = totalPrice * proportion;
    }
}

function addToCart(item) {
    // For regular raids, find existing raid by Pokémon name and tier
    var existingIndex = -1;
    for (var i = 0; i < cartItems.length; i++) {
        if (cartItems[i].type === item.type && 
            cartItems[i].pokemonName === item.pokemonName && 
            cartItems[i].raidTier === item.raidTier) {
            existingIndex = i;
            break;
        }
    }
    
    if (existingIndex >= 0) {
        // For services, calculate unit price to maintain correct pricing
        if (item.type === 'service') {
            var existingItem = cartItems[existingIndex];
            var unitPrice = existingItem.price / existingItem.quantity;
            var newQuantity = existingItem.quantity + item.quantity;
            cartItems[existingIndex].quantity = newQuantity;
            cartItems[existingIndex].price = unitPrice * newQuantity;
        } else {
            cartItems[existingIndex].quantity += item.quantity;
        }
    } else {
        cartItems.push(item);
    }
    
    recalculateAllRaidPrices();
    saveCart();
    updateCartDisplay();
    showToast('Added ' + item.quantity + 'x ' + item.pokemonName + ' to cart');
}

function calculateItemPrice(item) {
    if (item.type === 'shundo') return item.quantity * (pricingCache['Spawn_Shundo'] || 5);
    if (item.type === 'hundo') return item.quantity * (pricingCache['Spawn_Hundo'] || 3);
    if (item.type === 'shiny') return item.quantity * (pricingCache['Spawn_Shiny'] || 2);
    if (item.type === 'coins') return item.price;
    if (item.type === 'service') return item.price;
    if (item.type === 'dynamax') {
        var quantity = item.quantity;
        var dynamaxPricePer4 = pricingCache['Raid_Dynamax_4'] || 10;
        var dynamaxPriceSingle = pricingCache['Raid_Dynamax_Single'] || 2.5;
        return Math.floor(quantity / 4) * dynamaxPricePer4 + (quantity % 4) * dynamaxPriceSingle;
    }
    if (item.type === 'raid') {
        // This is a fallback - actual price comes from recalculateAllRaidPrices
        return item.price || 0;
    }
    return 0;
}

function getCartTotal() {
    var total = 0;
    for (var i = 0; i < cartItems.length; i++) {
        total += (cartItems[i].price || calculateItemPrice(cartItems[i]));
    }
    return total;
}

function updateCartDisplay() {
    var cartContainer = document.getElementById('cartItems');
    var cartTotalElem = document.getElementById('cartTotal');
    var cartCountElem = document.getElementById('cartCount');
    var emptyCartMsg = document.getElementById('emptyCartMsg');
    
    recalculateAllRaidPrices();
    
    var total = getCartTotal();
    var itemCount = 0;
    for (var i = 0; i < cartItems.length; i++) {
        itemCount += cartItems[i].quantity;
    }
    
    if (cartCountElem) cartCountElem.textContent = itemCount + ' items';
    if (cartTotalElem) cartTotalElem.textContent = total.toFixed(2);
    
    if (!cartItems.length) {
        if (cartContainer) cartContainer.innerHTML = '';
        if (emptyCartMsg) emptyCartMsg.style.display = 'block';
        return;
    }
    
    if (emptyCartMsg) emptyCartMsg.style.display = 'none';
    
    if (cartContainer) {
        var html = '';
        for (var j = 0; j < cartItems.length; j++) {
            var item = cartItems[j];
            var displayPrice = item.price || calculateItemPrice(item);
            html += '<div class="cart-item">';
            html += '<div class="cart-item-info">';
            html += '<div class="cart-item-name">' + item.pokemonName + (item.raidTier ? ' (' + item.raidTier + ')' : '') + '</div>';
            html += '<div class="cart-item-price">$' + displayPrice.toFixed(2) + '</div>';
            html += '</div>';
            html += '<div class="cart-item-controls">';
            html += '<button class="qty-btn" onclick="updateCartQuantity(' + j + ', ' + (item.quantity - 1) + ')">-</button>';
            html += '<span style="min-width:30px;text-align:center">' + item.quantity + '</span>';
            html += '<button class="qty-btn" onclick="updateCartQuantity(' + j + ', ' + (item.quantity + 1) + ')">+</button>';
            html += '<button class="delete-btn" onclick="removeFromCart(' + j + ')">🗑️</button>';
            html += '</div></div>';
        }
        cartContainer.innerHTML = html;
    }
}

function updateCartQuantity(index, newQuantity) {
    if (newQuantity <= 0) {
        cartItems.splice(index, 1);
    } else {
        var item = cartItems[index];
        if (item.type === 'service') {
            var unitPrice = item.price / item.quantity;
            item.quantity = newQuantity;
            item.price = unitPrice * newQuantity;
        } else {
            item.quantity = newQuantity;
        }
    }
    recalculateAllRaidPrices();
    saveCart();
    updateCartDisplay();
}

function removeFromCart(index) {
    cartItems.splice(index, 1);
    recalculateAllRaidPrices();
    saveCart();
    updateCartDisplay();
}

function addCoinToCart(amount) {
    var price = coinPrices[amount];
    addToCart({ type: 'coins', pokemonName: amount + ' Coins', quantity: 1, price: price, coinAmount: amount });
}

// ========== PERSISTENT CART ==========
function saveCart() {
    localStorage.setItem('pokespawn_cart', JSON.stringify(cartItems));
}

function loadCart() {
    var savedCart = localStorage.getItem('pokespawn_cart');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
        recalculateAllRaidPrices();
        updateCartDisplay();
    }
}

function clearCart() {
    cartItems = [];
    saveCart();
    updateCartDisplay();
}

// ========== CHECKOUT ==========
function showCustomerDialog() {
    var savedTimePref = localStorage.getItem('timePreference') || 'Whenever Possible';
    
    document.getElementById('modalTitle').textContent = 'Who are you?! Reveal Yourself!';
    document.getElementById('modalBody').innerHTML = `
        <input type="text" id="customerName" placeholder="Your First Name *" class="rsvp-input" value="${customerName}">
        <input type="text" id="customerIgn" placeholder="In-Game Name (PoGo Name) *" class="rsvp-input" value="${customerIgn}">
        
        <div style="margin-top: 12px; margin-bottom: 8px;">
            <label style="font-size: 13px; font-weight: bold;">⏰ Preferred Time to Start Order</label>
        </div>
        <select id="timePreference" class="rsvp-input" style="background: #2a2a3e; color: white;">
            <option value="Whenever Possible" ${savedTimePref === 'Whenever Possible' ? 'selected' : ''}>Whenever Possible</option>
            <option value="Morning (US)" ${savedTimePref === 'Morning (US)' ? 'selected' : ''}>Morning (US)</option>
            <option value="Midday (US)" ${savedTimePref === 'Midday (US)' ? 'selected' : ''}>Midday (US)</option>
            <option value="Night/Overnight (US)" ${savedTimePref === 'Night/Overnight (US)' ? 'selected' : ''}>Night/Overnight (US)</option>
        </select>
        
        <div class="disclaimer" style="margin-top: 12px;">*Timed Events cannot have a predetermined time slot, nor can all orders be considered at certain times given the amount of orders we may have.</div>
    `;
    document.getElementById('modalFooter').innerHTML = '<button class="cancel-btn" onclick="closeModal()">Cancel</button><button class="confirm-btn" onclick="saveCustomerInfo()">Save</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

function saveCustomerInfo() {
    var name = document.getElementById('customerName')?.value.trim();
    var ign = document.getElementById('customerIgn')?.value.trim();
    var timePref = document.getElementById('timePreference')?.value || 'Whenever Possible';
    
    if (!name || !ign) {
        showToast('Please enter both name and in-game name');
        return;
    }
    
    customerName = name;
    customerIgn = ign;
    
    // Save time preference to localStorage for next time
    localStorage.setItem('timePreference', timePref);
    
    closeModal();
    showAdminSelection(timePref);
}

var currentTimePreference = '';

function showAdminSelection(timePref) {
    currentTimePreference = timePref;
    document.getElementById('modalTitle').textContent = 'Choose Your Admin';
    document.getElementById('modalBody').innerHTML = `
        <div class="admin-select">
            <button class="admin-option dan" onclick="selectAdminAndPay('Dan')">Dan (Skatecrete)</button>
            <button class="admin-option kingi" onclick="selectAdminAndPay('Kingi')">Kingi (zEViLvSTON4z)</button>
            <button class="admin-option thomas" onclick="selectAdminAndPay('Thomas')">Thomas (RampageGamer)</button>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = '';
    document.getElementById('orderModal').style.display = 'flex';
}

function selectAdminAndPay(admin) {
    selectedAdmin = admin;
    var total = getCartTotal();
    var notes = document.getElementById('notesInput')?.value || '';
    
    // Add time preference to notes if not "Whenever Possible"
    var finalNotes = notes;
    if (currentTimePreference && currentTimePreference !== 'Whenever Possible') {
        finalNotes = finalNotes ? finalNotes + '\n\n⏰ Time Preference: ' + currentTimePreference : '⏰ Time Preference: ' + currentTimePreference;
    }
    
    var paymentHtml = '';
    if (admin === 'Dan') {
        paymentHtml = `
            <div class="payment-option">
                <strong>💰 PayPal</strong>
                <div class="copy-row">
                    <span class="payment-username">@danstudz</span>
                    <button class="copy-btn" onclick="copyToClipboard('@danstudz')">Copy</button>
                </div>
                <div class="disclaimer">⚠️ Please send with Friends and Family option</div>
            </div>
            <div class="payment-option">
                <strong>💚 CashApp</strong>
                <div class="copy-row">
                    <span class="payment-username">$DanStudz</span>
                    <button class="copy-btn" onclick="copyToClipboard('$DanStudz')">Copy</button>
                </div>
            </div>
            <div class="payment-option">
                <strong>💙 Venmo</strong>
                <div class="copy-row">
                    <span class="payment-username">@DanStudz</span>
                    <button class="copy-btn" onclick="copyToClipboard('@DanStudz')">Copy</button>
                </div>
            </div>
        `;
    } else if (admin === 'Thomas') {
        paymentHtml = `
            <div class="payment-option">
                <strong>💰 PayPal</strong>
                <div class="copy-row">
                    <span class="payment-username">@Thomas061298</span>
                    <button class="copy-btn" onclick="copyToClipboard('@Thomas061298')">Copy</button>
                </div>
                <div class="disclaimer">⚠️ Please send with Friends and Family option</div>
            </div>
        `;
    } else {
        paymentHtml = `
            <div class="payment-option">
                <strong>⏳ Payment Options Coming Soon</strong>
                <div class="disclaimer">Please contact Kingi directly for payment options</div>
            </div>
        `;
    }
    
    document.getElementById('modalTitle').textContent = 'Complete Order';
    document.getElementById('modalBody').innerHTML = `
        <div class="order-summary" style="background:#0d0d1a;padding:12px;border-radius:12px;margin-bottom:16px">
            <strong>Customer:</strong> ${customerName} (${customerIgn})<br>
            <strong>Admin:</strong> ${admin}<br>
            <strong>Total:</strong> $${total.toFixed(2)}
            ${currentTimePreference && currentTimePreference !== 'Whenever Possible' ? '<br><strong>Time Preference:</strong> ' + currentTimePreference : ''}
        </div>
        ${finalNotes ? '<div class="order-section"><div class="section-title">📝 Notes</div><div>' + finalNotes + '</div></div>' : ''}
        ${paymentHtml}
        <div class="disclaimer">Once payment is received, your order will be placed in queue 🧙</div>
    `;
    document.getElementById('modalFooter').innerHTML = '<button class="cancel-btn" onclick="closeModal()">Cancel</button><button class="confirm-btn" onclick="submitOrder()">Submit Order</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast('Copied: ' + text);
}

async function submitOrder() {
    if (!cartItems.length) {
        showToast('Add items to your cart first');
        return;
    }
    
    showLoading('Submitting order...');
    
    var notes = document.getElementById('notesInput')?.value || '';
    var fullCustomerName = customerName + ' (' + customerIgn + ')';
    
    var finalNotes = notes;
    if (currentTimePreference && currentTimePreference !== 'Whenever Possible') {
        finalNotes = finalNotes ? finalNotes + '\n\nTime Preference: ' + currentTimePreference : 'Time Preference: ' + currentTimePreference;
    }
    
    var orderData = {
        type: 'submitOrder',
        customerName: fullCustomerName,
        otherRequests: finalNotes,
        paymentMethod: 'Web Order',
        assignedAdmin: selectedAdmin,
        items: cartItems.map(function(item) {
            return {
                type: item.type,
                pokemonName: item.pokemonName,
                quantity: item.quantity,
                price: item.price || calculateItemPrice(item),
                raidTier: item.raidTier,
                coinAmount: item.coinAmount
            };
        })
    };
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await response.json();
        
        hideLoading();
        if (data.status === 'success') {
            showToast('Order submitted! You gained Aura 😎');
            clearCart();  // This now clears localStorage too
            localStorage.removeItem('pokespawn_cart');  // ← ADD THIS
            document.getElementById('notesInput').value = '';
            closeModal();
        } else {
            showToast('Order failed. Please try again or contact admin.');
        }
    } catch (e) {
        hideLoading();
        showToast('Network error. Please try again.');
    }
}

// ========== EVENTS ==========
async function loadEvents() {
    try {
        const response = await fetch('https://leekduck.com/feeds/events.json');
        var events = await response.json();
        var now = new Date();
        now.setHours(0, 0, 0, 0);
        
        var currentEvents = [];
        var upcomingEvents = [];
        
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            var startDate = new Date(event.start);
            var endDate = new Date(event.end);
            startDate.setHours(0, 0, 0, 0);
            
            if (startDate <= now && endDate >= now) {
                currentEvents.push(event);
            }
            else if (startDate > now) {
                var daysUntil = (startDate - now) / (1000 * 60 * 60 * 24);
                if (daysUntil <= 45 || event.name.toLowerCase().includes('go fest')) {
                    upcomingEvents.push(event);
                }
            }
        }
        
        displayCurrentEvents(currentEvents);
        displayUpcomingEvents(upcomingEvents);
        
    } catch (e) {
        console.error('Error loading events:', e);
    }
}

function getEventImage(eventName) {
    const pokemonMap = {
        // ========== GEN 1 (1-151) ==========
        'Bulbasaur': 1, 'Ivysaur': 2, 'Venusaur': 3, 'Charmander': 4, 'Charmeleon': 5, 'Charizard': 6,
        'Squirtle': 7, 'Wartortle': 8, 'Blastoise': 9, 'Caterpie': 10, 'Metapod': 11, 'Butterfree': 12,
        'Weedle': 13, 'Kakuna': 14, 'Beedrill': 15, 'Pidgey': 16, 'Pidgeotto': 17, 'Pidgeot': 18,
        'Rattata': 19, 'Raticate': 20, 'Spearow': 21, 'Fearow': 22, 'Ekans': 23, 'Arbok': 24,
        'Pikachu': 25, 'Raichu': 26, 'Sandshrew': 27, 'Sandslash': 28, 'Nidoran♀': 29, 'Nidorina': 30,
        'Nidoqueen': 31, 'Nidoran♂': 32, 'Nidorino': 33, 'Nidoking': 34, 'Clefairy': 35, 'Clefable': 36,
        'Vulpix': 37, 'Ninetales': 38, 'Jigglypuff': 39, 'Wigglytuff': 40, 'Zubat': 41, 'Golbat': 42,
        'Oddish': 43, 'Gloom': 44, 'Vileplume': 45, 'Paras': 46, 'Parasect': 47, 'Venonat': 48, 'Venomoth': 49,
        'Diglett': 50, 'Dugtrio': 51, 'Meowth': 52, 'Persian': 53, 'Psyduck': 54, 'Golduck': 55,
        'Mankey': 56, 'Primeape': 57, 'Growlithe': 58, 'Arcanine': 59, 'Poliwag': 60, 'Poliwhirl': 61,
        'Poliwrath': 62, 'Abra': 63, 'Kadabra': 64, 'Alakazam': 65, 'Machop': 66, 'Machoke': 67, 'Machamp': 68,
        'Bellsprout': 69, 'Weepinbell': 70, 'Victreebel': 71, 'Tentacool': 72, 'Tentacruel': 73,
        'Geodude': 74, 'Graveler': 75, 'Golem': 76, 'Ponyta': 77, 'Rapidash': 78, 'Slowpoke': 79, 'Slowbro': 80,
        'Magnemite': 81, 'Magneton': 82, 'Farfetch\'d': 83, 'Doduo': 84, 'Dodrio': 85, 'Seel': 86, 'Dewgong': 87,
        'Grimer': 88, 'Muk': 89, 'Shellder': 90, 'Cloyster': 91, 'Gastly': 92, 'Haunter': 93, 'Gengar': 94,
        'Onix': 95, 'Drowzee': 96, 'Hypno': 97, 'Krabby': 98, 'Kingler': 99, 'Voltorb': 100, 'Electrode': 101,
        'Exeggcute': 102, 'Exeggutor': 103, 'Cubone': 104, 'Marowak': 105, 'Hitmonlee': 106, 'Hitmonchan': 107,
        'Lickitung': 108, 'Koffing': 109, 'Weezing': 110, 'Rhyhorn': 111, 'Rhydon': 112, 'Chansey': 113,
        'Tangela': 114, 'Kangaskhan': 115, 'Horsea': 116, 'Seadra': 117, 'Goldeen': 118, 'Seaking': 119,
        'Staryu': 120, 'Starmie': 121, 'Mr. Mime': 122, 'Scyther': 123, 'Jynx': 124, 'Electabuzz': 125,
        'Magmar': 126, 'Pinsir': 127, 'Tauros': 128, 'Magikarp': 129, 'Gyarados': 130, 'Lapras': 131,
        'Ditto': 132, 'Eevee': 133, 'Vaporeon': 134, 'Jolteon': 135, 'Flareon': 136, 'Porygon': 137,
        'Omanyte': 138, 'Omastar': 139, 'Kabuto': 140, 'Kabutops': 141, 'Aerodactyl': 142, 'Snorlax': 143,
        'Articuno': 144, 'Zapdos': 145, 'Moltres': 146, 'Dratini': 147, 'Dragonair': 148, 'Dragonite': 149,
        'Mewtwo': 150, 'Mew': 151,

        // ========== GEN 2 (152-251) ==========
        'Chikorita': 152, 'Bayleef': 153, 'Meganium': 154, 'Cyndaquil': 155, 'Quilava': 156, 'Typhlosion': 157,
        'Totodile': 158, 'Croconaw': 159, 'Feraligatr': 160, 'Sentret': 161, 'Furret': 162, 'Hoothoot': 163,
        'Noctowl': 164, 'Ledyba': 165, 'Ledian': 166, 'Spinarak': 167, 'Ariados': 168, 'Crobat': 169,
        'Chinchou': 170, 'Lanturn': 171, 'Pichu': 172, 'Cleffa': 173, 'Igglybuff': 174, 'Togepi': 175,
        'Togetic': 176, 'Natu': 177, 'Xatu': 178, 'Mareep': 179, 'Flaaffy': 180, 'Ampharos': 181,
        'Bellossom': 182, 'Marill': 183, 'Azumarill': 184, 'Sudowoodo': 185, 'Politoed': 186, 'Hoppip': 187,
        'Skiploom': 188, 'Jumpluff': 189, 'Aipom': 190, 'Sunkern': 191, 'Sunflora': 192, 'Yanma': 193,
        'Wooper': 194, 'Quagsire': 195, 'Espeon': 196, 'Umbreon': 197, 'Murkrow': 198, 'Slowking': 199,
        'Misdreavus': 200, 'Unown': 201, 'Wobbuffet': 202, 'Girafarig': 203, 'Pineco': 204, 'Forretress': 205,
        'Dunsparce': 206, 'Gligar': 207, 'Steelix': 208, 'Snubbull': 209, 'Granbull': 210, 'Qwilfish': 211,
        'Scizor': 212, 'Shuckle': 213, 'Heracross': 214, 'Sneasel': 215, 'Teddiursa': 216, 'Ursaring': 217,
        'Slugma': 218, 'Magcargo': 219, 'Swinub': 220, 'Piloswine': 221, 'Corsola': 222, 'Remoraid': 223,
        'Octillery': 224, 'Delibird': 225, 'Mantine': 226, 'Skarmory': 227, 'Houndour': 228, 'Houndoom': 229,
        'Kingdra': 230, 'Phanpy': 231, 'Donphan': 232, 'Porygon2': 233, 'Stantler': 234, 'Smeargle': 235,
        'Tyrogue': 236, 'Hitmontop': 237, 'Smoochum': 238, 'Elekid': 239, 'Magby': 240, 'Miltank': 241,
        'Blissey': 242, 'Raikou': 243, 'Entei': 244, 'Suicune': 245, 'Larvitar': 246, 'Pupitar': 247,
        'Tyranitar': 248, 'Lugia': 249, 'Ho-Oh': 250, 'Celebi': 251,

        // ========== GEN 3 (252-386) ==========
        'Treecko': 252, 'Grovyle': 253, 'Sceptile': 254, 'Torchic': 255, 'Combusken': 256, 'Blaziken': 257,
        'Mudkip': 258, 'Marshtomp': 259, 'Swampert': 260, 'Poochyena': 261, 'Mightyena': 262, 'Zigzagoon': 263,
        'Linoone': 264, 'Wurmple': 265, 'Silcoon': 266, 'Beautifly': 267, 'Cascoon': 268, 'Dustox': 269,
        'Lotad': 270, 'Lombre': 271, 'Ludicolo': 272, 'Seedot': 273, 'Nuzleaf': 274, 'Shiftry': 275,
        'Taillow': 276, 'Swellow': 277, 'Wingull': 278, 'Pelipper': 279, 'Ralts': 280, 'Kirlia': 281,
        'Gardevoir': 282, 'Surskit': 283, 'Masquerain': 284, 'Shroomish': 285, 'Breloom': 286, 'Slakoth': 287,
        'Vigoroth': 288, 'Slaking': 289, 'Nincada': 290, 'Ninjask': 291, 'Shedinja': 292, 'Whismur': 293,
        'Loudred': 294, 'Exploud': 295, 'Makuhita': 296, 'Hariyama': 297, 'Azurill': 298, 'Nosepass': 299,
        'Skitty': 300, 'Delcatty': 301, 'Sableye': 302, 'Mawile': 303, 'Aron': 304, 'Lairon': 305, 'Aggron': 306,
        'Meditite': 307, 'Medicham': 308, 'Electrike': 309, 'Manectric': 310, 'Plusle': 311, 'Minun': 312,
        'Volbeat': 313, 'Illumise': 314, 'Roselia': 315, 'Gulpin': 316, 'Swalot': 317, 'Carvanha': 318,
        'Sharpedo': 319, 'Wailmer': 320, 'Wailord': 321, 'Numel': 322, 'Camerupt': 323, 'Torkoal': 324,
        'Spoink': 325, 'Grumpig': 326, 'Spinda': 327, 'Trapinch': 328, 'Vibrava': 329, 'Flygon': 330,
        'Cacnea': 331, 'Cacturne': 332, 'Swablu': 333, 'Altaria': 334, 'Zangoose': 335, 'Seviper': 336,
        'Lunatone': 337, 'Solrock': 338, 'Barboach': 339, 'Whiscash': 340, 'Corphish': 341, 'Crawdaunt': 342,
        'Baltoy': 343, 'Claydol': 344, 'Lileep': 345, 'Cradily': 346, 'Anorith': 347, 'Armaldo': 348,
        'Feebas': 349, 'Milotic': 350, 'Castform': 351, 'Kecleon': 352, 'Shuppet': 353, 'Banette': 354,
        'Duskull': 355, 'Dusclops': 356, 'Tropius': 357, 'Chimecho': 358, 'Absol': 359, 'Wynaut': 360,
        'Snorunt': 361, 'Glalie': 362, 'Spheal': 363, 'Sealeo': 364, 'Walrein': 365, 'Clamperl': 366,
        'Huntail': 367, 'Gorebyss': 368, 'Relicanth': 369, 'Luvdisc': 370, 'Bagon': 371, 'Shelgon': 372,
        'Salamence': 373, 'Beldum': 374, 'Metang': 375, 'Metagross': 376, 'Regirock': 377, 'Regice': 378,
        'Registeel': 379, 'Latias': 380, 'Latios': 381, 'Kyogre': 382, 'Groudon': 383, 'Rayquaza': 384,
        'Jirachi': 385, 'Deoxys': 386,

        // ========== GEN 4 (387-493) ==========
        'Turtwig': 387, 'Grotle': 388, 'Torterra': 389, 'Chimchar': 390, 'Monferno': 391, 'Infernape': 392,
        'Piplup': 393, 'Prinplup': 394, 'Empoleon': 395, 'Starly': 396, 'Staravia': 397, 'Staraptor': 398,
        'Bidoof': 399, 'Bibarel': 400, 'Kricketot': 401, 'Kricketune': 402, 'Shinx': 403, 'Luxio': 404,
        'Luxray': 405, 'Budew': 406, 'Roserade': 407, 'Cranidos': 408, 'Rampardos': 409, 'Shieldon': 410,
        'Bastiodon': 411, 'Burmy': 412, 'Wormadam': 413, 'Mothim': 414, 'Combee': 415, 'Vespiquen': 416,
        'Pachirisu': 417, 'Buizel': 418, 'Floatzel': 419, 'Cherubi': 420, 'Cherrim': 421, 'Shellos': 422,
        'Gastrodon': 423, 'Ambipom': 424, 'Drifloon': 425, 'Drifblim': 426, 'Buneary': 427, 'Lopunny': 428,
        'Mismagius': 429, 'Honchkrow': 430, 'Glameow': 431, 'Purugly': 432, 'Chingling': 433, 'Stunky': 434,
        'Skuntank': 435, 'Bronzor': 436, 'Bronzong': 437, 'Mime Jr.': 438, 'Happiny': 439, 'Chatot': 440,
        'Spiritomb': 441, 'Gible': 442, 'Gabite': 443, 'Garchomp': 444, 'Munchlax': 445, 'Riolu': 446,
        'Lucario': 447, 'Hippopotas': 448, 'Hippowdon': 449, 'Skorupi': 450, 'Drapion': 451, 'Croagunk': 452,
        'Toxicroak': 453, 'Carnivine': 454, 'Finneon': 455, 'Lumineon': 456, 'Mantyke': 457, 'Snover': 458,
        'Abomasnow': 459, 'Weavile': 460, 'Magnezone': 461, 'Lickilicky': 462, 'Rhyperior': 463, 'Tangrowth': 464,
        'Electivire': 465, 'Magmortar': 466, 'Togekiss': 467, 'Yanmega': 468, 'Leafeon': 469, 'Glaceon': 470,
        'Gliscor': 471, 'Mamoswine': 472, 'Porygon-Z': 473, 'Gallade': 474, 'Probopass': 475, 'Dusknoir': 476,
        'Froslass': 477, 'Rotom': 478, 'Uxie': 479, 'Mesprit': 480, 'Azelf': 481, 'Dialga': 482, 'Palkia': 483,
        'Heatran': 484, 'Regigigas': 485, 'Giratina': 486, 'Cresselia': 487, 'Phione': 488, 'Manaphy': 489,
        'Darkrai': 490, 'Shaymin': 491, 'Arceus': 492, 'Victini': 494,

        // ========== GEN 5 (494-649) ==========
        'Snivy': 495, 'Servine': 496, 'Serperior': 497, 'Tepig': 498, 'Pignite': 499, 'Emboar': 500,
        'Oshawott': 501, 'Dewott': 502, 'Samurott': 503, 'Patrat': 504, 'Watchog': 505, 'Lillipup': 506,
        'Herdier': 507, 'Stoutland': 508, 'Purrloin': 509, 'Liepard': 510, 'Pansage': 511, 'Simisage': 512,
        'Pansear': 513, 'Simisear': 514, 'Panpour': 515, 'Simipour': 516, 'Munna': 517, 'Musharna': 518,
        'Pidove': 519, 'Tranquill': 520, 'Unfezant': 521, 'Blitzle': 522, 'Zebstrika': 523, 'Roggenrola': 524,
        'Boldore': 525, 'Gigalith': 526, 'Woobat': 527, 'Swoobat': 528, 'Drilbur': 529, 'Excadrill': 530,
        'Audino': 531, 'Timburr': 532, 'Gurdurr': 533, 'Conkeldurr': 534, 'Tympole': 535, 'Palpitoad': 536,
        'Seismitoad': 537, 'Throh': 538, 'Sawk': 539, 'Sewaddle': 540, 'Swadloon': 541, 'Leavanny': 542,
        'Venipede': 543, 'Whirlipede': 544, 'Scolipede': 545, 'Cottonee': 546, 'Whimsicott': 547, 'Petilil': 548,
        'Lilligant': 549, 'Basculin': 550, 'Sandile': 551, 'Krokorok': 552, 'Krookodile': 553, 'Darumaka': 554,
        'Darmanitan': 555, 'Maractus': 556, 'Dwebble': 557, 'Crustle': 558, 'Scraggy': 559, 'Scrafty': 560,
        'Sigilyph': 561, 'Yamask': 562, 'Cofagrigus': 563, 'Tirtouga': 564, 'Carracosta': 565, 'Archen': 566,
        'Archeops': 567, 'Trubbish': 568, 'Garbodor': 569, 'Zorua': 570, 'Zoroark': 571, 'Minccino': 572,
        'Cinccino': 573, 'Gothita': 574, 'Gothorita': 575, 'Gothitelle': 576, 'Solosis': 577, 'Duosion': 578,
        'Reuniclus': 579, 'Ducklett': 580, 'Swanna': 581, 'Vanillite': 582, 'Vanillish': 583, 'Vanilluxe': 584,
        'Deerling': 585, 'Sawsbuck': 586, 'Emolga': 587, 'Karrablast': 588, 'Escavalier': 589, 'Foongus': 590,
        'Amoonguss': 591, 'Frillish': 592, 'Jellicent': 593, 'Alomomola': 594, 'Joltik': 595, 'Galvantula': 596,
        'Ferroseed': 597, 'Ferrothorn': 598, 'Klink': 599, 'Klang': 600, 'Klinklang': 601, 'Tynamo': 602,
        'Eelektrik': 603, 'Eelektross': 604, 'Elgyem': 605, 'Beheeyem': 606, 'Litwick': 607, 'Lampent': 608,
        'Chandelure': 609, 'Axew': 610, 'Fraxure': 611, 'Haxorus': 612, 'Cubchoo': 613, 'Beartic': 614,
        'Cryogonal': 615, 'Shelmet': 616, 'Accelgor': 617, 'Stunfisk': 618, 'Mienfoo': 619, 'Mienshao': 620,
        'Druddigon': 621, 'Golett': 622, 'Golurk': 623, 'Pawniard': 624, 'Bisharp': 625, 'Bouffalant': 626,
        'Rufflet': 627, 'Braviary': 628, 'Vullaby': 629, 'Mandibuzz': 630, 'Heatmor': 631, 'Durant': 632,
        'Deino': 633, 'Zweilous': 634, 'Hydreigon': 635, 'Larvesta': 636, 'Volcarona': 637, 'Cobalion': 638,
        'Terrakion': 639, 'Virizion': 640, 'Tornadus': 641, 'Thundurus': 642, 'Reshiram': 643, 'Zekrom': 644,
        'Landorus': 645, 'Kyurem': 646, 'Keldeo': 647, 'Meloetta': 648, 'Genesect': 649,

        // ========== GEN 6 (650-721) ==========
        'Chespin': 650, 'Quilladin': 651, 'Chesnaught': 652, 'Fennekin': 653, 'Braixen': 654, 'Delphox': 655,
        'Froakie': 656, 'Frogadier': 657, 'Greninja': 658, 'Bunnelby': 659, 'Diggersby': 660, 'Fletchling': 661,
        'Fletchinder': 662, 'Talonflame': 663, 'Scatterbug': 664, 'Spewpa': 665, 'Vivillon': 666, 'Litleo': 667,
        'Pyroar': 668, 'Flabébé': 669, 'Floette': 670, 'Florges': 671, 'Skiddo': 672, 'Gogoat': 673,
        'Pancham': 674, 'Pangoro': 675, 'Furfrou': 676, 'Espurr': 677, 'Meowstic': 678, 'Honedge': 679,
        'Doublade': 680, 'Aegislash': 681, 'Spritzee': 682, 'Aromatisse': 683, 'Swirlix': 684, 'Slurpuff': 685,
        'Inkay': 686, 'Malamar': 687, 'Binacle': 688, 'Barbaracle': 689, 'Skrelp': 690, 'Dragalge': 691,
        'Clauncher': 692, 'Clawitzer': 693, 'Helioptile': 694, 'Heliolisk': 695, 'Tyrunt': 696, 'Tyrantrum': 697,
        'Amaura': 698, 'Aurorus': 699, 'Sylveon': 700, 'Hawlucha': 701, 'Dedenne': 702, 'Carbink': 703,
        'Goomy': 704, 'Sliggoo': 705, 'Goodra': 706, 'Klefki': 707, 'Phantump': 708, 'Trevenant': 709,
        'Pumpkaboo': 710, 'Gourgeist': 711, 'Bergmite': 712, 'Avalugg': 713, 'Noibat': 714, 'Noivern': 715,
        'Xerneas': 716, 'Yveltal': 717, 'Zygarde': 718, 'Diancie': 719, 'Hoopa': 720, 'Volcanion': 721,

        // ========== GEN 7 (722-809) ==========
        'Rowlet': 722, 'Dartrix': 723, 'Decidueye': 724, 'Litten': 725, 'Torracat': 726, 'Incineroar': 727,
        'Popplio': 728, 'Brionne': 729, 'Primarina': 730, 'Pikipek': 731, 'Trumbeak': 732, 'Toucannon': 733,
        'Yungoos': 734, 'Gumshoos': 735, 'Grubbin': 736, 'Charjabug': 737, 'Vikavolt': 738, 'Crabrawler': 739,
        'Crabominable': 740, 'Oricorio': 741, 'Cutiefly': 742, 'Ribombee': 743, 'Rockruff': 744, 'Lycanroc': 745,
        'Wishiwashi': 746, 'Mareanie': 747, 'Toxapex': 748, 'Mudbray': 749, 'Mudsdale': 750, 'Dewpider': 751,
        'Araquanid': 752, 'Fomantis': 753, 'Lurantis': 754, 'Morelull': 755, 'Shiinotic': 756, 'Salandit': 757,
        'Salazzle': 758, 'Stufful': 759, 'Bewear': 760, 'Bounsweet': 761, 'Steenee': 762, 'Tsareena': 763,
        'Comfey': 764, 'Oranguru': 765, 'Passimian': 766, 'Wimpod': 767, 'Golisopod': 768, 'Sandygast': 769,
        'Palossand': 770, 'Pyukumuku': 771, 'Type: Null': 772, 'Silvally': 773, 'Minior': 774, 'Komala': 775,
        'Turtonator': 776, 'Togedemaru': 777, 'Mimikyu': 778, 'Bruxish': 779, 'Drampa': 780, 'Dhelmise': 781,
        'Jangmo-o': 782, 'Hakamo-o': 783, 'Kommo-o': 784, 'Tapu Koko': 785, 'Tapu Lele': 786, 'Tapu Bulu': 787,
        'Tapu Fini': 788, 'Cosmog': 789, 'Cosmoem': 790, 'Solgaleo': 791, 'Lunala': 792, 'Nihilego': 793,
        'Buzzwole': 794, 'Pheromosa': 795, 'Xurkitree': 796, 'Celesteela': 797, 'Kartana': 798, 'Guzzlord': 799,
        'Necrozma': 800, 'Magearna': 801, 'Marshadow': 802, 'Poipole': 803, 'Naganadel': 804, 'Stakataka': 805,
        'Blacephalon': 806, 'Zeraora': 807, 'Meltan': 808, 'Melmetal': 809,

        // ========== GEN 8 (810-898) ==========
        'Grookey': 810, 'Thwackey': 811, 'Rillaboom': 812, 'Scorbunny': 813, 'Raboot': 814, 'Cinderace': 815,
        'Sobble': 816, 'Drizzile': 817, 'Inteleon': 818, 'Skwovet': 819, 'Greedent': 820, 'Rookidee': 821,
        'Corvisquire': 822, 'Corviknight': 823, 'Blipbug': 824, 'Dottler': 825, 'Orbeetle': 826, 'Nickit': 827,
        'Thievul': 828, 'Gossifleur': 829, 'Eldegoss': 830, 'Wooloo': 831, 'Dubwool': 832, 'Chewtle': 833,
        'Drednaw': 834, 'Yamper': 835, 'Boltund': 836, 'Rolycoly': 837, 'Carkol': 838, 'Coalossal': 839,
        'Applin': 840, 'Flapple': 841, 'Appletun': 842, 'Silicobra': 843, 'Sandaconda': 844, 'Cramorant': 845,
        'Arrokuda': 846, 'Barraskewda': 847, 'Toxel': 848, 'Toxtricity': 849, 'Sizzlipede': 850, 'Centiskorch': 851,
        'Clobbopus': 852, 'Grapploct': 853, 'Sinistea': 854, 'Polteageist': 855, 'Hatenna': 856, 'Hattrem': 857,
        'Hatterene': 858, 'Impidimp': 859, 'Morgrem': 860, 'Grimmsnarl': 861, 'Obstagoon': 862, 'Perrserker': 863,
        'Cursola': 864, 'Sirfetch\'d': 865, 'Mr. Rime': 866, 'Runerigus': 867, 'Milcery': 868, 'Alcremie': 869,
        'Falinks': 870, 'Pincurchin': 871, 'Snom': 872, 'Frosmoth': 873, 'Stonjourner': 874, 'Eiscue': 875,
        'Indeedee': 876, 'Morpeko': 877, 'Cufant': 878, 'Copperajah': 879, 'Dracozolt': 880, 'Arctozolt': 881,
        'Dracovish': 882, 'Arctovish': 883, 'Duraludon': 884, 'Dreepy': 885, 'Drakloak': 886, 'Dragapult': 887,
        'Zacian': 888, 'Zamazenta': 889, 'Eternatus': 890, 'Kubfu': 891, 'Urshifu': 892, 'Zarude': 893,
        'Regieleki': 894, 'Regidrago': 895, 'Glastrier': 896, 'Spectrier': 897, 'Calyrex': 898,

        // ========== GEN 9 (899-1025) ==========
        'Wyrdeer': 899, 'Kleavor': 900, 'Ursaluna': 901, 'Basculegion': 902, 'Sneasler': 903, 'Overqwil': 904,
        'Enamorus': 905, 'Sprigatito': 906, 'Floragato': 907, 'Meowscarada': 908, 'Fuecoco': 909, 'Crocalor': 910,
        'Skeledirge': 911, 'Quaxly': 912, 'Quaxwell': 913, 'Quaquaval': 914, 'Lechonk': 915, 'Oinkologne': 916,
        'Tarountula': 917, 'Spidops': 918, 'Nymble': 919, 'Lokix': 920, 'Pawmi': 921, 'Pawmo': 922, 'Pawmot': 923,
        'Tandemaus': 924, 'Maushold': 925, 'Fidough': 926, 'Dachsbun': 927, 'Smoliv': 928, 'Dolliv': 929,
        'Arboliva': 930, 'Squawkabilly': 931, 'Nacli': 932, 'Naclstack': 933, 'Garganacl': 934, 'Charcadet': 935,
        'Armarouge': 936, 'Ceruledge': 937, 'Tadbulb': 938, 'Bellibolt': 939, 'Wattrel': 940, 'Kilowattrel': 941,
        'Maschiff': 942, 'Mabosstiff': 943, 'Shroodle': 944, 'Grafaiai': 945, 'Bramblin': 946, 'Brambleghast': 947,
        'Toedscool': 948, 'Toedscruel': 949, 'Klawf': 950, 'Capsakid': 951, 'Scovillain': 952, 'Rellor': 953,
        'Rabsca': 954, 'Flittle': 955, 'Espathra': 956, 'Tinkatink': 957, 'Tinkatuff': 958, 'Tinkaton': 959,
        'Wiglett': 960, 'Wugtrio': 961, 'Bombirdier': 962, 'Finizen': 963, 'Palafin': 964, 'Varoom': 965,
        'Revavroom': 966, 'Cyclizar': 967, 'Orthworm': 968, 'Glimmet': 969, 'Glimmora': 970, 'Greavard': 971,
        'Houndstone': 972, 'Flamigo': 973, 'Cetoddle': 974, 'Cetitan': 975, 'Veluza': 976, 'Dondozo': 977,
        'Tatsugiri': 978, 'Annihilape': 979, 'Clodsire': 980, 'Farigiraf': 981, 'Dudunsparce': 982, 'Kingambit': 983,
        'Great Tusk': 984, 'Scream Tail': 985, 'Brute Bonnet': 986, 'Flutter Mane': 987, 'Slither Wing': 988,
        'Sandy Shocks': 989, 'Iron Treads': 990, 'Iron Bundle': 991, 'Iron Hands': 992, 'Iron Jugulis': 993,
        'Iron Moth': 994, 'Iron Thorns': 995, 'Frigibax': 996, 'Arctibax': 997, 'Baxcalibur': 998,
        'Gimmighoul': 999, 'Gholdengo': 1000, 'Wo-Chien': 1001, 'Chien-Pao': 1002, 'Ting-Lu': 1003, 'Chi-Yu': 1004,
        'Roaring Moon': 1005, 'Iron Valiant': 1006, 'Koraidon': 1007, 'Miraidon': 1008, 'Walking Wake': 1009,
        'Iron Leaves': 1010, 'Dipplin': 1011, 'Poltchageist': 1012, 'Sinistcha': 1013, 'Okidogi': 1014,
        'Munkidori': 1015, 'Fezandipiti': 1016, 'Ogerpon': 1017, 'Archaludon': 1018, 'Hydrapple': 1019,
        'Gouging Fire': 1020, 'Raging Bolt': 1021, 'Iron Boulder': 1022, 'Iron Crown': 1023, 'Terapagos': 1024,
        'Pecharunt': 1025
    };

    var eventLower = eventName.toLowerCase();
    var matchedPokemon = null;
    var matchLength = 0;

    // Find best matching Pokemon name from the event name
    for (var pokemon in pokemonMap) {
        var pokemonLower = pokemon.toLowerCase();
        if (eventLower.includes(pokemonLower)) {
            if (pokemonLower.length > matchLength) {
                matchLength = pokemonLower.length;
                matchedPokemon = pokemon;
            }
        }
    }

    // Partial matches for common event patterns
    if (!matchedPokemon) {
        var partialMatches = {
            'nihilego': 'Nihilego', 'buzzwole': 'Buzzwole', 'pheromosa': 'Pheromosa', 'xurkitree': 'Xurkitree',
            'celesteela': 'Celesteela', 'kartana': 'Kartana', 'guzzlord': 'Guzzlord', 'poipole': 'Poipole',
            'naganadel': 'Naganadel', 'stakataka': 'Stakataka', 'blacephalon': 'Blacephalon', 'lechonk': 'Lechonk',
            'oinkologne': 'Oinkologne', 'tinkatink': 'Tinkatink', 'tinkatuff': 'Tinkatuff', 'tinkaton': 'Tinkaton',
            'clodsire': 'Clodsire', 'farigiraf': 'Farigiraf', 'dudunsparce': 'Dudunsparce', 'kingambit': 'Kingambit',
            'gimmighoul': 'Gimmighoul', 'gholdengo': 'Gholdengo', 'ogerpon': 'Ogerpon', 'terapagos': 'Terapagos',
            'pecharunt': 'Pecharunt', 'walking wake': 'Walking Wake', 'iron leaves': 'Iron Leaves', 'iron bundle': 'Iron Bundle',
            'iron hands': 'Iron Hands', 'iron jugulis': 'Iron Jugulis', 'iron moth': 'Iron Moth', 'iron thorns': 'Iron Thorns',
            'iron treads': 'Iron Treads', 'iron valiant': 'Iron Valiant', 'roaring moon': 'Roaring Moon', 'sandy shocks': 'Sandy Shocks',
            'slither wing': 'Slither Wing', 'flutter mane': 'Flutter Mane', 'brute bonnet': 'Brute Bonnet', 'scream tail': 'Scream Tail',
            'great tusk': 'Great Tusk', 'gouging fire': 'Gouging Fire', 'raging bolt': 'Raging Bolt', 'iron boulder': 'Iron Boulder',
            'iron crown': 'Iron Crown', 'archaludon': 'Archaludon', 'hydrapple': 'Hydrapple', 'sinistcha': 'Sinistcha',
            'poltchageist': 'Poltchageist', 'dipplin': 'Dipplin', 'okidogi': 'Okidogi', 'munkidori': 'Munkidori',
            'fezandipiti': 'Fezandipiti', 'basculegion': 'Basculegion', 'sneasler': 'Sneasler', 'overqwil': 'Overqwil',
            'enamorus': 'Enamorus', 'ursaluna': 'Ursaluna', 'wyrdeer': 'Wyrdeer', 'kleavor': 'Kleavor'
        };
        for (var partial in partialMatches) {
            if (eventLower.includes(partial)) {
                matchedPokemon = partialMatches[partial];
                break;
            }
        }
    }

    if (matchedPokemon) {
        // Try ultimategallery first
        var ultimateUrl = getUltimateGalleryUrl(matchedPokemon, false, false, false);
        if (ultimateUrl) {
            return ultimateUrl;
        }
        // Fallback to PokeAPI
        var matchedId = pokemonMap[matchedPokemon];
        return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + matchedId + '.png';
    }

    return '😎';
}

function displayCurrentEvents(events) {
    var container = document.getElementById('currentEventsList');
    if (!container) return;
    
    if (!events.length) {
        container.innerHTML = '<div class="loading">No current events</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < events.length; i++) {
        var e = events[i];
        var imageSrc = getEventImage(e.name);
        var isEmoji = !imageSrc.startsWith('http');
        
        html += '<div class="event-card-with-img">';
        if (isEmoji) {
            html += '<div class="event-emoji">' + imageSrc + '</div>';
        } else {
            html += '<img src="' + imageSrc + '" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<div class=\\\'event-emoji\\\'😎</div>\'">';
        }
        html += '<div class="event-info">';
        html += '<div class="event-name">' + e.name + '</div>';
        html += '<div class="event-heading">' + (e.heading || 'Event') + '</div>';
        html += '<div class="event-time">🟢 ' + new Date(e.start).toLocaleString() + '</div>';
        html += '<div class="event-time">🔴 ' + new Date(e.end).toLocaleString() + '</div>';
        html += '</div>';
        html += '<div class="event-buttons">';
        html += '<button class="event-view-btn" onclick="window.open(\'' + e.link + '\', \'_blank\')">View</button>';
        html += '</div></div>';
    }
    container.innerHTML = html;
}

function displayUpcomingEvents(events) {
    var container = document.getElementById('upcomingEventsList');
    if (!container) return;
    
    if (!events.length) {
        container.innerHTML = '<div class="loading">No upcoming events</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < events.length; i++) {
        var e = events[i];
        var imageSrc = getEventImage(e.name);
        var isEmoji = !imageSrc.startsWith('http');
        
        html += '<div class="event-card-with-img">';
        if (isEmoji) {
            html += '<div class="event-emoji">' + imageSrc + '</div>';
        } else {
            html += '<img src="' + imageSrc + '" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<div class=\\\'event-emoji\\\'😎</div>\'">';
        }
        html += '<div class="event-info">';
        html += '<div class="event-name">' + e.name + '</div>';
        html += '<div class="event-heading">' + (e.heading || 'Event') + '</div>';
        html += '<div class="event-time">🟢 Starts: ' + new Date(e.start).toLocaleString() + '</div>';
        html += '<div class="event-time">🔴 Ends: ' + new Date(e.end).toLocaleString() + '</div>';
        html += '</div>';
        html += '<div class="event-buttons">';
        html += '<button class="event-view-btn" onclick="window.open(\'' + e.link + '\', \'_blank\')">View</button>';
        html += '<button class="event-rsvp-btn" onclick=\'showRSVPDialog("' + e.name.replace(/'/g, "\\'") + '", "' + e.link + '", "' + new Date(e.start).toLocaleString() + '", "' + new Date(e.end).toLocaleString() + '")\'>RSVP</button>';
        html += '</div></div>';
    }
    container.innerHTML = html;
}

// ========== INFOGRAPHICS FUNCTIONS ==========

let allInfographicsList = [];

async function loadAllInfographics() {
    showLoading('Loading infographics...');
    
    try {
        const response = await fetch('https://api.github.com/repos/Skatecrete/infographics/contents/images');
        const data = await response.json();
        
        allInfographicsList = [];
        for (var i = 0; i < data.length; i++) {
            var name = data[i].name;
            var downloadUrl = data[i].download_url;
            if (name !== 'placeholder.png' && (name.endsWith('.png') || name.endsWith('.webp'))) {
                allInfographicsList.push({ name: name, url: downloadUrl });
            }
        }
        
        hideLoading();
        
        if (allInfographicsList.length === 0) {
            showToast('No infographics found');
            return;
        }
        
        showGalleryView();
        
    } catch (e) {
        hideLoading();
        showToast('Failed to load infographics');
    }
}

function showGalleryView() {
    var modal = document.getElementById('galleryModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'galleryModal';
        modal.className = 'modal gallery-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📸 All Infographics</h2>
                    <button class="modal-close" onclick="closeGalleryModal()">✕</button>
                </div>
                <div id="galleryGrid" class="gallery-grid"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    var grid = document.getElementById('galleryGrid');
    var html = '';
    for (var i = 0; i < allInfographicsList.length; i++) {
        var item = allInfographicsList[i];
        html += `
            <div class="gallery-item" onclick="openImageViewer(${i})">
                <img src="${item.url}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%237627C5\'/%3E%3Ctext x=\'50\' y=\'55\' text-anchor=\'middle\' fill=\'white\' font-size=\'14\'%3E📸%3C/text%3E%3C/svg%3E'">
            </div>
        `;
    }
    grid.innerHTML = html;
    
    modal.style.display = 'flex';
}

function closeGalleryModal() {
    var modal = document.getElementById('galleryModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openImageViewer(index) {
    window.viewerImages = allInfographicsList;
    window.currentViewerIndex = index;
    
    var modal = document.getElementById('viewerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'viewerModal';
        modal.className = 'modal viewer-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📸 Infographic</h2>
                    <button class="modal-close" onclick="closeViewerModal()">✕</button>
                </div>
                <div class="viewer-container">
                    <img id="viewerImage" class="viewer-image" src="" alt="Infographic">
                </div>
                <div class="viewer-nav">
                    <button id="viewerPrevBtn" class="viewer-nav-btn" onclick="navigateViewer(-1)">◀</button>
                    <span id="viewerCounter" class="viewer-counter">1 / 1</span>
                    <button id="viewerNextBtn" class="viewer-nav-btn" onclick="navigateViewer(1)">▶</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    updateViewerDisplay();
    modal.style.display = 'flex';
}

function updateViewerDisplay() {
    var images = window.viewerImages;
    var index = window.currentViewerIndex;
    
    if (!images || images.length === 0) return;
    
    var imgElement = document.getElementById('viewerImage');
    var counterElement = document.getElementById('viewerCounter');
    var prevBtn = document.getElementById('viewerPrevBtn');
    var nextBtn = document.getElementById('viewerNextBtn');
    var titleElement = document.getElementById('viewerTitle');
    
    if (imgElement) {
        imgElement.src = images[index].url;
        imgElement.alt = images[index].name;
    }
    
    if (counterElement) {
        counterElement.textContent = (index + 1) + ' / ' + images.length;
    }
    
    if (titleElement) {
        titleElement.textContent = '📸 Infographic';
    }
    
    if (prevBtn) {
        prevBtn.disabled = index === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = index === images.length - 1;
    }
}

function navigateViewer(direction) {
    var images = window.viewerImages;
    var newIndex = window.currentViewerIndex + direction;
    
    if (newIndex >= 0 && newIndex < images.length) {
        window.currentViewerIndex = newIndex;
        updateViewerDisplay();
    }
}

function closeViewerModal() {
    var modal = document.getElementById('viewerModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function loadWeeklyView() {
    showLoading('Loading Weekly View...');
    await loadSingleInfographic('weekly.png', 'Weekly View');
}

async function loadMonthlyView() {
    showLoading('Loading Monthly View...');
    await loadSingleInfographic('monthly.png', 'Monthly View');
}

async function loadSingleInfographic(filename, title) {
    showLoading('Loading ' + title + '...');
    
    try {
        const url = 'https://raw.githubusercontent.com/Skatecrete/infographics/main/images/' + filename;
        
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
            hideLoading();
            showToast('No ' + title + ' graphic uploaded yet');
            return;
        }
        
        hideLoading();
        
        // Create single image viewer with X button only
        var modal = document.getElementById('singleViewerModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'singleViewerModal';
            modal.className = 'modal viewer-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="singleViewerTitle">Infographic</h2>
                        <button class="modal-close" onclick="closeSingleViewerModal()">✕</button>
                    </div>
                    <div class="viewer-container">
                        <img id="singleViewerImage" class="viewer-image" src="" alt="Infographic">
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        document.getElementById('singleViewerTitle').textContent = title;
        document.getElementById('singleViewerImage').src = url;
        modal.style.display = 'flex';
        
    } catch (e) {
        hideLoading();
        showToast('Failed to load graphic');
    }
}

function closeSingleViewerModal() {
    var modal = document.getElementById('singleViewerModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Add click handlers when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    var viewAllBtn = document.getElementById('viewAllInfographicsBtn');
    var weeklyBtn = document.getElementById('weeklyViewBtn');
    var monthlyBtn = document.getElementById('monthlyViewBtn');
    
    if (viewAllBtn) viewAllBtn.onclick = loadAllInfographics;
    if (weeklyBtn) weeklyBtn.onclick = loadWeeklyView;
    if (monthlyBtn) monthlyBtn.onclick = loadMonthlyView;
    
    var currentContent = document.getElementById('current');
    var upcomingContent = document.getElementById('upcoming');
    var ordersContent = document.getElementById('orders');
    var servicesGrid = document.getElementById('servicesGrid');
    
    if (currentContent && currentContent.classList.contains('active')) {
        // Current tab is active
        loadEvents();
        loadDebutData();
    } else if (upcomingContent && upcomingContent.classList.contains('active')) {
        // Upcoming tab is active
        loadEvents();
        loadDebutData();
    } else if (servicesGrid) {
        // Orders page (has services grid)
        loadSpawns();
        loadRaids();
        loadPricing();
        loadAdditionalServices();  // Load additional services for orders page
    } else {
        // Spawns/Raids pages
        loadSpawns();
        loadRaids();
        loadPricing();
    }
});

// ========== DEBUT DATA ==========
async function loadDebutData() {
    console.log('=== loadDebutData() CALLED ===');
    
    var banner = document.getElementById('debutBanner');
    if (!banner) return;
    
    try {
        const response = await fetch('https://raw.githubusercontent.com/Skatecrete/pogo-raid-data/main/debuts.json');
        const data = await response.json();
        var debuts = data.debuts || [];
        
        // Get current UTC time
        var nowUtc = new Date();
        console.log('Current UTC time:', nowUtc);
        
        var upcomingDebut = null;
        var activeDebut = null;
        var closestUpcomingDate = null;
        var closestActiveDate = null;
        
        var monthMap = { 
            'January': 0, 'February': 1, 'March': 2, 'April': 3, 
            'May': 4, 'June': 5, 'July': 6, 'August': 7, 
            'September': 8, 'October': 9, 'November': 10, 'December': 11 
        };
        
        for (var i = 0; i < debuts.length; i++) {
            var debut = debuts[i];
            var eventDateStr = debut.event_date;
            
            // Parse end date to get the year
            var endMatch = eventDateStr.match(/-\s*(\w+)\s+(\d+)(?:st|nd|rd|th)?\s+(\d{4})/);
            var eventYear = nowUtc.getFullYear();
            if (endMatch) {
                eventYear = parseInt(endMatch[3]);
            }
            
            // Parse start date
            var startMatch = eventDateStr.match(/^(\w+)\s+(\d+)(?:st|nd|rd|th)?/);
            if (!startMatch) continue;
            
            var startMonth = startMatch[1];
            var startDay = parseInt(startMatch[2]);
            
            // Create UTC date for start of event (10:00 AM NZT = 22:00 UTC previous day)
            var startDateUtc = new Date(Date.UTC(eventYear, monthMap[startMonth], startDay - 1, 22, 0, 0));
            
            // Parse end date
            var endDateUtc = null;
            if (endMatch) {
                var endMonth = endMatch[1];
                var endDay = parseInt(endMatch[2]);
                var endYear = parseInt(endMatch[3]);
                // Event ends at 8:00 PM NZT = 08:00 UTC same day
                endDateUtc = new Date(Date.UTC(endYear, monthMap[endMonth], endDay, 8, 0, 0));
            }
            
            console.log('Event:', debut.event_name);
            console.log('  startDateUtc:', startDateUtc);
            console.log('  endDateUtc:', endDateUtc);
            
            // Check if event is currently active
            var isActive = startDateUtc <= nowUtc && (!endDateUtc || endDateUtc >= nowUtc);
            
            if (isActive) {
                console.log('  -> Categorized as ACTIVE');
                if (!activeDebut || startDateUtc > closestActiveDate) {
                    activeDebut = debut;
                    closestActiveDate = startDateUtc;
                }
            } else if (startDateUtc > nowUtc) {
                console.log('  -> Categorized as UPCOMING');
                var daysUntil = (startDateUtc - nowUtc) / (1000 * 60 * 60 * 24);
                if (daysUntil <= 60) {
                    if (!upcomingDebut || startDateUtc < closestUpcomingDate) {
                        upcomingDebut = debut;
                        closestUpcomingDate = startDateUtc;
                    }
                }
            } else {
                console.log('  -> Categorized as PAST/ENDED');
            }
        }
        
        // Determine which tab is active
        var activeTab = 'upcoming';
        if (window.location.pathname.includes('current.html')) {
            activeTab = 'current';
        } else if (window.location.pathname.includes('upcoming.html')) {
            activeTab = 'upcoming';
        } else {
            var currentContent = document.getElementById('current');
            var upcomingContent = document.getElementById('upcoming');
            if (currentContent && currentContent.classList.contains('active')) {
                activeTab = 'current';
            } else if (upcomingContent && upcomingContent.classList.contains('active')) {
                activeTab = 'upcoming';
            }
        }
        
        console.log('activeTab:', activeTab);
        console.log('activeDebut:', activeDebut ? activeDebut.event_name : null);
        console.log('upcomingDebut:', upcomingDebut ? upcomingDebut.event_name : null);
        
        if (activeTab === 'current' && activeDebut) {
            displayDebutBanner(activeDebut, false, closestActiveDate);
            banner.style.display = 'block';
        } else if (activeTab === 'upcoming' && upcomingDebut) {
            displayDebutBanner(upcomingDebut, false, closestUpcomingDate);
            banner.style.display = 'block';
        } else {
            banner.style.display = 'none';
        }
        
    } catch (e) {
        console.error('Error loading debut data:', e);
    }
}

function displayDebutBanner(debut, isDayBefore, startDateUtc) {
    var banner = document.getElementById('debutBanner');
    var eventNameElem = document.getElementById('debutEventName');
    var countdownElem = document.getElementById('debutCountdown');
    var viewEventBtn = document.getElementById('debutViewEventBtn');
    
    if (!banner) return;
    
    eventNameElem.textContent = debut.event_name;
    viewEventBtn.onclick = function() { findAndOpenLeekDuckEvent(debut.event_name); };
    currentDebutData = debut;
    
    if (isDayBefore) {
        countdownElem.textContent = '⏰ Starting local soon!';
        countdownElem.style.color = '#FFA500';
        banner.style.display = 'block';
        return;
    }
    
    // Get current UTC time
    var nowUtc = new Date();
    
    // Apply offset (in milliseconds)
    var offsetMs = DEBUT_COUNTDOWN_OFFSET_HOURS * 60 * 60 * 1000;
    var adjustedNow = new Date(nowUtc.getTime() + offsetMs);
    
    var millisLeft = startDateUtc - adjustedNow;
    var totalHoursLeft = Math.floor(millisLeft / (1000 * 60 * 60));
    var daysLeft = Math.floor(totalHoursLeft / 24);
    var hoursLeft = totalHoursLeft % 24;
    
    console.log('Countdown Debug (with offset):');
    console.log('  startDateUtc:', startDateUtc);
    console.log('  adjustedNow (offset ' + DEBUT_COUNTDOWN_OFFSET_HOURS + 'h):', adjustedNow);
    console.log('  millisLeft:', millisLeft);
    console.log('  daysLeft:', daysLeft);
    console.log('  hoursLeft:', hoursLeft);
    
    if (daysLeft >= 1) {
        countdownElem.textContent = '⏰ Starts in ' + daysLeft + (daysLeft === 1 ? ' day' : ' days') + ' ' + hoursLeft + (hoursLeft === 1 ? ' hour' : ' hours');
    } else if (totalHoursLeft > 0) {
        countdownElem.textContent = '⏰ Starts in ' + totalHoursLeft + (totalHoursLeft === 1 ? ' hour' : ' hours');
    } else {
        var minutesLeft = Math.floor(millisLeft / (1000 * 60));
        if (minutesLeft > 0) {
            countdownElem.textContent = '⏰ Starts in ' + minutesLeft + (minutesLeft === 1 ? ' minute' : ' minutes');
        } else {
            countdownElem.textContent = '⏰ Starts in less than a minute';
        }
    }
    
    banner.style.display = 'block';
}

function showDebutDetails() {
    if (!currentDebutData) return;
    
    var newPokemon = currentDebutData.new_pokemon || [];
    var newShiny = currentDebutData.new_shiny || [];
    
    // Build arrays - keep both normal and shiny (don't filter)
    var allItems = [];
    for (var i = 0; i < newPokemon.length; i++) {
        allItems.push({ name: newPokemon[i], isShiny: false });
    }
    for (var i = 0; i < newShiny.length; i++) {
        allItems.push({ name: newShiny[i], isShiny: true });
    }
    
    if (allItems.length === 0) {
        closeModal();
        showToast('No debut details available');
        return;
    }
    
    var comingSoonUrl = 'https://raw.githubusercontent.com/Skatecrete/infographics/main/debuts/comingsoon.png';
    var html = '<div class="order-stats"><div>🌟 DEBUTS 🌟</div></div>';
    
    for (var i = 0; i < allItems.length; i++) {
        var item = allItems[i];
        var pokemon = item.name;
        var isShinyPokemon = item.isShiny;
        
        // Primary: ultimategallery with slug (hyphens, .png)
        var slug = pokemon.toLowerCase()
            .replace(/[\(\)]/g, '')
            .replace(/'/g, '')
            .trim()
            .replace(/\s+/g, '-');
        
        // Fallback: debuts folder with cleanName (no hyphens, .webp)
        var cleanName = pokemon.toLowerCase()
            .replace(/ /g, '')
            .replace(/[\(\)]/g, '')
            .replace(/-/g, '')
            .replace(/'/g, '');
        
        var primaryUrl = 'https://raw.githubusercontent.com/Skatecrete/infographics/main/ultimategallery/' + slug + '.png';
        var fallbackUrl = 'https://raw.githubusercontent.com/Skatecrete/infographics/main/debuts/' + cleanName + (isShinyPokemon ? 'shiny' : '') + '.webp';
        
        html += '<div class="order-section" style="text-align:center;">';
        html += '<div class="section-title">' + (isShinyPokemon ? '✨ SHINY ' + pokemon.toUpperCase() + ' ✨' : '🌟 ' + pokemon.toUpperCase() + ' 🌟') + '</div>';
        html += '<div style="display:flex; justify-content:center; margin-top:12px;">';
        html += '<img src="' + primaryUrl + '" onerror="this.src=\'' + fallbackUrl + '\'; this.onerror=this.src=\'' + comingSoonUrl + '\';" style="width:120px; height:120px; object-fit:contain;">';
        html += '</div>';
        html += '</div>';
    }
    
    document.getElementById('modalTitle').textContent = 'Debut Pokémon';
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('modalFooter').innerHTML = '<button class="confirm-btn" onclick="closeModal()">Close</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

async function findAndOpenLeekDuckEvent(eventName) {
    try {
        const response = await fetch('https://leekduck.com/feeds/events.json');
        var events = await response.json();
        var foundEvent = null;
        for (var i = 0; i < events.length; i++) {
            if (events[i].name.includes(eventName) || eventName.includes(events[i].name)) {
                foundEvent = events[i];
                break;
            }
        }
        if (foundEvent && foundEvent.link) {
            window.open(foundEvent.link, '_blank');
        } else {
            showToast('Event link not found');
        }
    } catch (e) {
        showToast('Could not open event');
    }
}

function showRSVPDialog(eventName, eventLink, startDate, endDate) {
    document.getElementById('modalTitle').textContent = 'RSVP for ' + eventName;
    document.getElementById('modalBody').innerHTML = `
        <input type="text" id="rsvpName" placeholder="Your Name *" class="rsvp-input">
        <input type="text" id="rsvpIgn" placeholder="In-Game Name *" class="rsvp-input">
        <div class="admin-select">
            <button class="admin-option dan" onclick='submitRSVP("${eventName.replace(/'/g, "\\'")}", "${eventLink}", "${startDate}", "${endDate}", "Dan")'>Dan (Skatecrete)</button>
            <button class="admin-option kingi" onclick='submitRSVP("${eventName.replace(/'/g, "\\'")}", "${eventLink}", "${startDate}", "${endDate}", "Kingi")'>Kingi (zEViLvSTON4z)</button>
            <button class="admin-option thomas" onclick='submitRSVP("${eventName.replace(/'/g, "\\'")}", "${eventLink}", "${startDate}", "${endDate}", "Thomas")'>Thomas (RampageGamer)</button>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = '';
    document.getElementById('orderModal').style.display = 'flex';
}

async function submitRSVP(eventName, eventLink, startDate, endDate, admin) {
    var name = document.getElementById('rsvpName')?.value.trim();
    var ign = document.getElementById('rsvpIgn')?.value.trim();
    
    if (!name || !ign) {
        showToast('Please enter your name and in-game name');
        return;
    }
    
    showLoading('Sending RSVP...');
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'addRSVP',
                customerName: name,
                ingameName: ign,
                eventName: eventName,
                eventStartDate: startDate,
                eventEndDate: endDate,
                eventLink: eventLink,
                assignedAdmin: admin
            })
        });
        const data = await response.json();
        
        hideLoading();
        if (data.status === 'success') {
            showToast('RSVP sent to ' + admin + '! They will contact you.');
            closeModal();
        } else {
            showToast('Failed to save RSVP. Please try again.');
        }
    } catch (e) {
        hideLoading();
        showToast('Network error. Please try again.');
    }
}

// ========== CUSTOMER HISTORY ==========
async function loadCustomerHistory() {
    var name = document.getElementById('historyName')?.value.trim();
    var ign = document.getElementById('historyIgn')?.value.trim();
    
    if (!name || !ign) {
        showToast('Enter both your name and in-game name');
        return;
    }
    
    showLoading('Loading your history...');
    
    try {
        var fullCustomerName = name + ' (' + ign + ')';
        
        // Fetch from local JSON files
        var ordersResponse = await fetch('data/orders.json');
        var rsvpsResponse = await fetch('data/rsvps.json');
        
        var allOrders = await ordersResponse.json();
        var allRSVPs = await rsvpsResponse.json();
        
        // Filter orders for this customer
        var customerOrderRows = allOrders.filter(function(order) {
            return order.customer === fullCustomerName;
        });
        
        // GROUP items by orderId
        var groupedOrders = {};
        for (var i = 0; i < customerOrderRows.length; i++) {
            var row = customerOrderRows[i];
            var orderId = row.orderId;
            
            if (!groupedOrders[orderId]) {
                groupedOrders[orderId] = {
                    orderId: orderId,
                    date: row.date,
                    customer: row.customer,
                    status: row.status,
                    paymentMethod: row.paymentMethod,
                    otherRequests: row.otherRequests,
                    assignedAdmin: row.assignedAdmin,
                    total: 0,
                    items: []
                };
            }
            
            // Add item to this order
            groupedOrders[orderId].items.push({
                huntType: row.huntType,
                raidType: row.raidType,
                pokemon: row.pokemon,
                quantity: row.quantity,
                coins: row.coins,
                price: row.itemPrice
            });
            
            groupedOrders[orderId].total += row.itemPrice;
        }
        
        // Convert grouped object back to array
        var customerOrders = Object.values(groupedOrders);
        
        // Sort by date (newest first)
        customerOrders.sort(function(a, b) {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Filter RSVPs for this customer
        var customerRSVPs = allRSVPs.filter(function(rsvp) {
            return rsvp.customer === fullCustomerName;
        });
        
        hideLoading();
        
        if (customerOrders.length > 0 || customerRSVPs.length > 0) {
            displayCustomerHistory(customerOrders, customerRSVPs);
        } else {
            document.getElementById('historyEmpty').style.display = 'block';
            document.getElementById('historyOrders').style.display = 'none';
            document.getElementById('historyRSVPs').style.display = 'none';
            showToast('No history found');
        }
        
    } catch (e) {
        hideLoading();
        console.error('History error:', e);
        showToast('Failed to load history');
    }
}

function displayCustomerHistory(orders, rsvps) {
    var ordersContainer = document.getElementById('ordersHistoryList');
    var rsvpsContainer = document.getElementById('rsvpsHistoryList');
    var ordersSection = document.getElementById('historyOrders');
    var rsvpsSection = document.getElementById('historyRSVPs');
    var emptySection = document.getElementById('historyEmpty');
    
    var hasData = false;
    
    if (orders && orders.length) {
        ordersSection.style.display = 'block';
        var ordersHtml = '';
        for (var i = 0; i < orders.length; i++) {
            var order = orders[i];
            
            // Build items display from grouped items
            var itemsDisplay = '';
            for (var j = 0; j < order.items.length; j++) {
                var item = order.items[j];
                var huntType = item.huntType || '';
                var pokemon = item.pokemon || '';
                var quantity = item.quantity || '1';
                var coins = item.coins || '';
                var price = item.price || 0;
                
                if (huntType === 'Coins') {
                    itemsDisplay += '• ' + coins + ' Coins x' + quantity + ' - $' + price.toFixed(2) + '<br>';
                } else if (huntType === 'Raid') {
                    var raidType = item.raidType || '';
                    itemsDisplay += '• ' + huntType + ': ' + pokemon + ' (' + raidType + ') x' + quantity + ' - $' + price.toFixed(2) + '<br>';
                } else {
                    itemsDisplay += '• ' + huntType + ': ' + pokemon + ' x' + quantity + ' - $' + price.toFixed(2) + '<br>';
                }
            }
            
            var statusClass = (order.status === 'Paid' || order.status === 'Completed') ? 'status-paid' : 'status-pending';
            var statusText = order.status || 'Pending';
            var orderDate = order.date ? order.date.split('T')[0] : '';
            
            ordersHtml += '<div class="order-history-item" onclick=\'showOrderDetail(' + JSON.stringify(order).replace(/'/g, "&#39;") + ')\'>';
            ordersHtml += '<div class="order-history-header">';
            ordersHtml += '<span class="order-id">' + (order.orderId || 'Order') + '</span>';
            ordersHtml += '<span class="order-total">$' + order.total.toFixed(2) + '</span>';
            ordersHtml += '</div>';
            ordersHtml += '<div class="order-details">' + itemsDisplay + '</div>';
            ordersHtml += '<div class="order-status ' + statusClass + '">' + statusText + '</div>';
            ordersHtml += '<div class="order-details">' + orderDate + '</div>';
            ordersHtml += '</div>';
        }
        ordersContainer.innerHTML = ordersHtml;
        hasData = true;
    } else {
        ordersSection.style.display = 'none';
    }
    
    if (rsvps && rsvps.length) {
        rsvpsSection.style.display = 'block';
        var rsvpsHtml = '';
        for (var i = 0; i < rsvps.length; i++) {
            var rsvp = rsvps[i];
            var statusClass = (rsvp.status === 'Confirmed') ? 'status-paid' : 'status-pending';
            rsvpsHtml += '<div class="rsvp-history-item">';
            rsvpsHtml += '<div class="rsvp-event-name" onclick="window.open(\'' + (rsvp.eventLink || '') + '\', \'_blank\')">' + (rsvp.eventName || 'Event') + '</div>';
            rsvpsHtml += '<div class="rsvp-event-date">📅 ' + (rsvp.eventStartDate || rsvp.eventDate || '') + '</div>';
            rsvpsHtml += '<div class="order-details">RSVP\'d: ' + (rsvp.date ? rsvp.date.split('T')[0] : '') + '</div>';
            rsvpsHtml += '<div class="order-status ' + statusClass + '">' + (rsvp.status || 'Pending') + '</div>';
            rsvpsHtml += '</div>';
        }
        rsvpsContainer.innerHTML = rsvpsHtml;
        hasData = true;
    } else {
        rsvpsSection.style.display = 'none';
    }
    
    emptySection.style.display = hasData ? 'none' : 'block';
}

function showOrderDetail(order) {
    var itemsHtml = '';
    if (order.items && order.items.length) {
        for (var i = 0; i < order.items.length; i++) {
            var item = order.items[i];
            var huntType = item.huntType || '';
            var pokemon = item.pokemon || '';
            var quantity = item.quantity || '1';
            var coins = item.coins || '';
            var price = item.price || 0;
            
            if (huntType === 'Coins') {
                itemsHtml += '<div>• ' + coins + ' Coins x' + quantity + ' - $' + price.toFixed(2) + '</div>';
            } else if (huntType === 'Raid') {
                var raidType = item.raidType || '';
                itemsHtml += '<div>• ' + huntType + ': ' + pokemon + ' (' + raidType + ') x' + quantity + ' - $' + price.toFixed(2) + '</div>';
            } else {
                itemsHtml += '<div>• ' + huntType + ': ' + pokemon + ' x' + quantity + ' - $' + price.toFixed(2) + '</div>';
            }
        }
    } else if (typeof order.items === 'string') {
        var itemsList = order.items.split(', ');
        for (var i = 0; i < itemsList.length; i++) {
            itemsHtml += '<div>• ' + itemsList[i] + '</div>';
        }
    }
    
    document.getElementById('modalTitle').textContent = 'Order ' + (order.orderId || 'Details');
    document.getElementById('modalBody').innerHTML = `
        <div class="order-stats">
            <div><strong>Date:</strong> ${order.date ? order.date.split(' ')[0] : 'N/A'}</div>
            <div><strong>Customer:</strong> ${order.customer || 'N/A'}</div>
            <div><strong>Status:</strong> <span class="${order.status === 'Paid' ? 'status-paid' : 'status-pending'}">${order.status || 'Pending'}</span></div>
            <div><strong>Payment:</strong> ${order.paymentMethod || 'N/A'}</div>
            <div><strong>Total:</strong> <span class="status-paid">$${(order.total || 0).toFixed(2)}</span></div>
        </div>
        ${itemsHtml ? '<div class="order-section"><div class="section-title">📦 Items</div>' + itemsHtml + '</div>' : ''}
        ${order.otherRequests ? '<div class="order-section"><div class="section-title">📝 Notes</div><div>' + order.otherRequests + '</div></div>' : ''}
    `;
    document.getElementById('modalFooter').innerHTML = '<button class="confirm-btn" onclick="closeModal()">Close</button>';
    document.getElementById('orderModal').style.display = 'flex';
}

// ========== ADDITIONAL SERVICES ==========
let additionalServices = [];
let currentServiceIndex = null;
let currentServiceQuantity = 1;

async function loadAdditionalServices() {
    var container = document.getElementById('servicesGrid');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-small">Loading services...</div>';
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'getAdditionalServices' })
        });
        const data = await response.json();
        
        if (data.status === 'success' && data.services && data.services.length > 0) {
            additionalServices = data.services;
            displayAdditionalServices();
        } else {
            container.innerHTML = '<div class="loading-small">No additional services available</div>';
        }
    } catch (e) {
        console.error('Error loading services:', e);
        container.innerHTML = '<div class="loading-small">Failed to load services</div>';
    }
}

function displayAdditionalServices() {
    var container = document.getElementById('servicesGrid');
    if (!container) return;
    
    if (additionalServices.length === 0) {
        container.innerHTML = '<div class="loading-small">No additional services available</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < additionalServices.length; i++) {
        var service = additionalServices[i];
        var slug = getServiceImageSlug(service.serviceName);
        var imageUrl = 'https://raw.githubusercontent.com/Skatecrete/infographics/main/services_pics/' + slug + '.png';
        
        html += '<div class="service-card" onclick="showServiceDetails(' + i + ')">';
        html += '<img src="' + imageUrl + '" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=\\\'http://www.w3.org/2000/svg\\\' viewBox=\\\'0 0 100 100\\\'%3E%3Crect width=\\\'100\\\' height=\\\'100\\\' fill=\\\'%237627C5\\\'/%3E%3Ctext x=\\\'50\\\' y=\\\'55\\\' text-anchor=\\\'middle\\\' fill=\\\'white\\\' font-size=\\\'14\\\'%3E😎%3C/text%3E%3C/svg%3E\'">';
        html += '<div class="service-name">' + service.serviceName + '</div>';
        html += '<div class="service-price">$' + service.price.toFixed(2) + '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function getServiceImageSlug(serviceName) {
    var mapping = {
        'Go Fest': 'go_fest',
        'Go Fest Global': 'go_fest',
        'Go Tour': 'go_tour',
        'City-Specific Ticketed Event': 'ticketed_events',
        'Spotlight Hour': 'spotlight_hour',
        'Community Day': 'community_day',
        'Rocket Task': 'rocket',
        'Limited Time Mon': 'limited_time',
        'Half-Priced Store Purchase': 'store_purchase',
        'Stardust': 'stardust',
        'Egg Hatching per km': 'egg_hatching',
        'Candy': 'candy'
    };
    
    if (mapping[serviceName]) return mapping[serviceName];
    return serviceName.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
}

function showServiceDetails(index) {
    var service = additionalServices[index];
    if (!service) return;
    
    currentServiceIndex = index;
    currentServiceQuantity = 1;
    
    document.getElementById('serviceModalTitle').textContent = service.serviceName;
    document.getElementById('serviceModalBody').innerHTML = `
        <div class="service-detail-name">${service.serviceName}</div>
        <div id="serviceDetailPrice" class="service-detail-price">$${service.price.toFixed(2)}</div>
        <div class="service-detail-divider"></div>
        <div class="service-detail-description">${service.details || 'Contact admin for more information about this service.'}</div>
        <div class="quantity-selector" style="justify-content: center; margin-top: 16px;">
            <button class="qty-btn" onclick="updateServiceQuantity(-1)">-</button>
            <span id="serviceQty" class="qty-num" style="min-width: 40px;">1</span>
            <button class="qty-btn" onclick="updateServiceQuantity(1)">+</button>
        </div>
    `;
    document.getElementById('serviceModalFooter').innerHTML = `
        <button class="cancel-btn" onclick="closeServiceModal()">Cancel</button>
        <button class="confirm-btn" onclick="addServiceToCart()">Add to Cart</button>
    `;
    document.getElementById('serviceModal').style.display = 'flex';
}

function updateServiceQuantity(delta) {
    var service = additionalServices[currentServiceIndex];
    if (!service) return;
    
    var newQty = currentServiceQuantity + delta;
    if (newQty < 1) return;
    
    currentServiceQuantity = newQty;
    
    document.getElementById('serviceQty').textContent = currentServiceQuantity;
    var totalPrice = service.price * currentServiceQuantity;
    document.getElementById('serviceDetailPrice').textContent = '$' + totalPrice.toFixed(2);
}

function closeServiceModal() {
    document.getElementById('serviceModal').style.display = 'none';
    currentServiceIndex = null;
    currentServiceQuantity = 1;
}

function addServiceToCart() {
    var service = additionalServices[currentServiceIndex];
    if (!service) return;
    
    var totalPrice = service.price * currentServiceQuantity;
    
    addToCart({ 
        type: 'service', 
        pokemonName: service.serviceName, 
        quantity: currentServiceQuantity, 
        price: totalPrice,
        serviceName: service.serviceName,
        unitPrice: service.price
    });
    
    closeServiceModal();
    showToast('Added ' + currentServiceQuantity + 'x ' + service.serviceName + ' to cart');
}

// ========== UTILITIES ==========
function showLoading(message) {
    var modal = document.getElementById('loadingModal');
    var msgElem = document.getElementById('loadingMessage');
    if (msgElem) msgElem.textContent = message;
    if (modal) modal.style.display = 'flex';
}

function hideLoading() {
    var modal = document.getElementById('loadingModal');
    if (modal) modal.style.display = 'none';
}

function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(function() { toast.style.opacity = '0'; }, 2000);
}

function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Make functions global
window.filterSpawns = filterSpawns;
window.toggleFilter = toggleFilter;
window.showSpawnOrderDialog = showSpawnOrderDialog;
window.updateSpawnQty = updateSpawnQty;
window.addSpawnOrderToCart = addSpawnOrderToCart;
window.showRaidOrderDialog = showRaidOrderDialog;
window.selectRaidPack = selectRaidPack;
window.addRaidToCart = addRaidToCart;
window.showDynamaxOrderDialog = showDynamaxOrderDialog;
window.updateDynamaxQty = updateDynamaxQty;
window.addDynamaxToCart = addDynamaxToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.addCoinToCart = addCoinToCart;
window.showCustomerDialog = showCustomerDialog;
window.saveCustomerInfo = saveCustomerInfo;
window.selectAdminAndPay = selectAdminAndPay;
window.submitOrder = submitOrder;
window.showRSVPDialog = showRSVPDialog;
window.submitRSVP = submitRSVP;
window.showDebutDetails = showDebutDetails;
window.showKingiMessage = showKingiMessage;
window.closeModal = closeModal;
