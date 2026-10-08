/**
 * Word lists for invented paint-chip names ("Lake of April", «Miel al alba»).
 *
 * A name is a noun (picked by hue family and lightness band) plus a
 * qualifier (picked by saturation). Qualifiers are prepositional phrases, so
 * Spanish never needs gender agreement between the two parts.
 *
 * Add words freely: names are chosen by hashing the color, so adding words
 * renames colors, but every player still sees the same name for a color.
 */

export type ColorFamily =
	| "neutral"
	| "red"
	| "orange"
	| "yellow"
	| "lime"
	| "green"
	| "teal"
	| "cyan"
	| "blue"
	| "indigo"
	| "violet"
	| "magenta"
	| "pink";

export type LightnessBand = "dark" | "mid" | "light";

type Nouns = Record<ColorFamily, Record<LightnessBand, readonly string[]>>;

export const NOUNS: { en: Nouns; es: Nouns } = {
	en: {
		neutral: {
			dark: ["Graphite", "Charcoal", "Slate", "Ink", "Soot", "Basalt", "Iron"],
			mid: ["Pebble", "Ash", "Pewter", "Concrete", "Fog", "Flint", "Smoke"],
			light: ["Chalk", "Pearl", "Linen", "Paper", "Mist", "Bone", "Frost"],
		},
		red: {
			dark: [
				"Garnet",
				"Oxblood",
				"Bordeaux",
				"Mahogany",
				"Black Cherry",
				"Rust",
			],
			mid: ["Poppy", "Cherry", "Tomato", "Brick", "Cardinal", "Pomegranate"],
			light: [
				"Rose Hip",
				"Watermelon",
				"Coral",
				"Strawberry",
				"Blush",
				"Geranium",
			],
		},
		orange: {
			dark: ["Cinnamon", "Copper", "Terracotta", "Chestnut", "Paprika", "Clay"],
			mid: [
				"Tangerine",
				"Pumpkin",
				"Marigold",
				"Persimmon",
				"Saffron",
				"Ember",
			],
			light: ["Apricot", "Peach", "Melon", "Papaya", "Sherbet", "Cantaloupe"],
		},
		yellow: {
			dark: ["Mustard", "Ochre", "Bronze", "Amber", "Olive Oil", "Brass"],
			mid: ["Honey", "Sunflower", "Lemon", "Corn", "Canary", "Dandelion"],
			light: ["Butter", "Vanilla", "Custard", "Primrose", "Cream", "Straw"],
		},
		lime: {
			dark: ["Olive", "Moss", "Artichoke", "Fern", "Caper", "Lichen"],
			mid: ["Lime", "Pear", "Kiwi", "Chartreuse", "Pistachio", "Celery"],
			light: ["Sprout", "Pea", "Honeydew", "Meadow Tea", "Lime Zest", "Willow"],
		},
		green: {
			dark: ["Pine", "Forest", "Bottle", "Ivy", "Spruce", "Juniper"],
			mid: ["Clover", "Basil", "Emerald", "Leaf", "Shamrock", "Jade"],
			light: ["Mint", "Sage", "Celadon", "Spring", "Lettuce", "Eucalyptus"],
		},
		teal: {
			dark: [
				"Deep Lagoon",
				"Petrol",
				"Kelp",
				"Malachite",
				"Peacock",
				"Cypress",
			],
			mid: ["Teal", "Lagoon", "Verdigris", "Seaweed", "Turtle", "Patina"],
			light: [
				"Seafoam",
				"Glacier Mint",
				"Aloe",
				"Spearmint",
				"Jade Milk",
				"Surf",
			],
		},
		cyan: {
			dark: ["Deep Sea", "Harbor", "Storm Pool", "Abyss", "Mussel", "Fjord"],
			mid: ["Turquoise", "Lake", "Pool", "Reef", "Glacier", "Aqua"],
			light: ["Ice", "Spray", "Rain", "Frost Glass", "Shallows", "Sky Pool"],
		},
		blue: {
			dark: ["Navy", "Midnight", "Denim", "Thunder", "Admiral", "Ink Well"],
			mid: ["Cobalt", "Lake", "Sapphire", "Delft", "Cornflower", "Storm"],
			light: ["Sky", "Powder", "Forget-me-not", "Baby Blue", "Haze", "Wave"],
		},
		indigo: {
			dark: [
				"Indigo",
				"Night Sky",
				"Blackberry Ink",
				"Eclipse",
				"Dusk",
				"Velvet",
			],
			mid: [
				"Ultramarine",
				"Bluebell",
				"Iris",
				"Twilight",
				"Lapis",
				"Periwinkle",
			],
			light: [
				"Lavender Blue",
				"Cloud",
				"Hyacinth",
				"Wisteria",
				"Dawn",
				"Lilac Mist",
			],
		},
		violet: {
			dark: [
				"Aubergine",
				"Plum",
				"Blackcurrant",
				"Mulberry",
				"Amethyst",
				"Grape",
			],
			mid: ["Violet", "Orchid", "Heather", "Crocus", "Thistle", "Lilac"],
			light: [
				"Lavender",
				"Wisteria Bloom",
				"Mauve",
				"Lilac Milk",
				"Pansy",
				"Sugar Plum",
			],
		},
		magenta: {
			dark: [
				"Beetroot",
				"Boysenberry",
				"Wine",
				"Raspberry Jam",
				"Cassis",
				"Fig",
			],
			mid: [
				"Fuchsia",
				"Magenta",
				"Bougainvillea",
				"Dragon Fruit",
				"Peony",
				"Berry",
			],
			light: [
				"Orchid Pink",
				"Candy",
				"Bubblegum",
				"Sweet Pea",
				"Petal",
				"Taffy",
			],
		},
		pink: {
			dark: ["Raspberry", "Cranberry", "Ruby", "Sangria", "Rosewood", "Claret"],
			mid: ["Rose", "Flamingo", "Carnation", "Hibiscus", "Guava", "Lychee"],
			light: [
				"Cotton Candy",
				"Ballet",
				"Blossom",
				"Shell",
				"Marshmallow",
				"Cherry Blossom",
			],
		},
	},
	es: {
		neutral: {
			dark: [
				"Grafito",
				"Carbón",
				"Pizarra",
				"Tinta",
				"Hollín",
				"Basalto",
				"Hierro",
			],
			mid: [
				"Guijarro",
				"Ceniza",
				"Peltre",
				"Hormigón",
				"Niebla",
				"Pedernal",
				"Humo",
			],
			light: ["Tiza", "Perla", "Lino", "Papel", "Bruma", "Marfil", "Escarcha"],
		},
		red: {
			dark: [
				"Granate",
				"Burdeos",
				"Caoba",
				"Cereza negra",
				"Óxido",
				"Vino tinto",
			],
			mid: ["Amapola", "Cereza", "Tomate", "Ladrillo", "Cardenal", "Granada"],
			light: ["Escaramujo", "Sandía", "Coral", "Fresa", "Rubor", "Geranio"],
		},
		orange: {
			dark: ["Canela", "Cobre", "Terracota", "Castaña", "Pimentón", "Arcilla"],
			mid: ["Mandarina", "Calabaza", "Caléndula", "Caqui", "Azafrán", "Brasa"],
			light: [
				"Albaricoque",
				"Melocotón",
				"Melón",
				"Papaya",
				"Sorbete",
				"Nectarina",
			],
		},
		yellow: {
			dark: ["Mostaza", "Ocre", "Bronce", "Ámbar", "Aceite", "Latón"],
			mid: ["Miel", "Girasol", "Limón", "Maíz", "Canario", "Diente de león"],
			light: ["Mantequilla", "Vainilla", "Natilla", "Prímula", "Nata", "Paja"],
		},
		lime: {
			dark: [
				"Aceituna",
				"Musgo",
				"Alcachofa",
				"Helecho",
				"Alcaparra",
				"Liquen",
			],
			mid: ["Lima", "Pera", "Kiwi", "Chartreuse", "Pistacho", "Apio"],
			light: [
				"Brote",
				"Guisante",
				"Melón verde",
				"Té de prado",
				"Ralladura",
				"Sauce",
			],
		},
		green: {
			dark: ["Pino", "Bosque", "Botella", "Hiedra", "Abeto", "Enebro"],
			mid: ["Trébol", "Albahaca", "Esmeralda", "Hoja", "Prado", "Jade"],
			light: [
				"Menta",
				"Salvia",
				"Celadón",
				"Primavera",
				"Lechuga",
				"Eucalipto",
			],
		},
		teal: {
			dark: [
				"Laguna honda",
				"Petróleo",
				"Alga",
				"Malaquita",
				"Pavo real",
				"Ciprés",
			],
			mid: ["Cerceta", "Laguna", "Verdín", "Alga marina", "Tortuga", "Pátina"],
			light: [
				"Espuma de mar",
				"Menta glaciar",
				"Aloe",
				"Hierbabuena",
				"Jade lechoso",
				"Oleaje",
			],
		},
		cyan: {
			dark: [
				"Mar profundo",
				"Puerto",
				"Poza de tormenta",
				"Abismo",
				"Mejillón",
				"Fiordo",
			],
			mid: ["Turquesa", "Lago", "Piscina", "Arrecife", "Glaciar", "Agua"],
			light: [
				"Hielo",
				"Rocío",
				"Lluvia",
				"Vidrio helado",
				"Bajío",
				"Cielo de piscina",
			],
		},
		blue: {
			dark: [
				"Marino",
				"Medianoche",
				"Vaquero",
				"Trueno",
				"Almirante",
				"Tintero",
			],
			mid: ["Cobalto", "Lago", "Zafiro", "Azulejo", "Aciano", "Tormenta"],
			light: ["Cielo", "Polvo azul", "Nomeolvides", "Celeste", "Calima", "Ola"],
		},
		indigo: {
			dark: [
				"Índigo",
				"Cielo nocturno",
				"Tinta de mora",
				"Eclipse",
				"Anochecer",
				"Terciopelo",
			],
			mid: [
				"Ultramar",
				"Campanilla",
				"Iris",
				"Crepúsculo",
				"Lapislázuli",
				"Vincapervinca",
			],
			light: [
				"Lavanda azul",
				"Nube",
				"Jacinto",
				"Glicinia",
				"Alba",
				"Niebla lila",
			],
		},
		violet: {
			dark: [
				"Berenjena",
				"Ciruela",
				"Grosella negra",
				"Mora",
				"Amatista",
				"Uva",
			],
			mid: [
				"Violeta",
				"Orquídea",
				"Brezo",
				"Azafrán silvestre",
				"Cardo",
				"Lila",
			],
			light: [
				"Lavanda",
				"Flor de glicinia",
				"Malva",
				"Leche de lila",
				"Pensamiento",
				"Ciruela de azúcar",
			],
		},
		magenta: {
			dark: [
				"Remolacha",
				"Zarzamora",
				"Vino",
				"Mermelada de frambuesa",
				"Casis",
				"Higo",
			],
			mid: ["Fucsia", "Magenta", "Buganvilla", "Pitaya", "Peonía", "Baya"],
			light: [
				"Orquídea rosa",
				"Caramelo",
				"Chicle",
				"Guisante de olor",
				"Pétalo",
				"Golosina",
			],
		},
		pink: {
			dark: [
				"Frambuesa",
				"Arándano rojo",
				"Rubí",
				"Sangría",
				"Palo de rosa",
				"Clarete",
			],
			mid: ["Rosa", "Flamenco", "Clavel", "Hibisco", "Guayaba", "Lichi"],
			light: [
				"Algodón de azúcar",
				"Bailarina",
				"Flor de cerezo",
				"Concha",
				"Nube de azúcar",
				"Capullo",
			],
		},
	},
};

/**
 * Qualifiers: muted colors (low saturation) get calm, faded phrases; vivid
 * ones get lively phrases. 20 each, 40 per language.
 */
export const QUALIFIERS: {
	en: { muted: readonly string[]; vivid: readonly string[] };
	es: { muted: readonly string[]; vivid: readonly string[] };
} = {
	en: {
		muted: [
			"at Dusk",
			"in Winter",
			"after Rain",
			"at Dawn",
			"in Fog",
			"of November",
			"by the Window",
			"in the Attic",
			"under Snow",
			"at Low Tide",
			"of Old Maps",
			"in Shadow",
			"on Sunday",
			"of the Library",
			"in Silence",
			"after Supper",
			"of Faded Letters",
			"by Candlelight",
			"in Autumn",
			"at Rest",
		],
		vivid: [
			"of April",
			"at Noon",
			"in Summer",
			"at the Fair",
			"on Fire",
			"of the Market",
			"by the Sea",
			"in Bloom",
			"at Carnival",
			"of July",
			"at the Party",
			"in the Sun",
			"on Holiday",
			"of the Tropics",
			"in Neon",
			"at Full Speed",
			"of the Circus",
			"in the Garden",
			"at Sunrise",
			"on Stage",
		],
	},
	es: {
		muted: [
			"al anochecer",
			"de invierno",
			"tras la lluvia",
			"al alba",
			"en la niebla",
			"de noviembre",
			"junto a la ventana",
			"del desván",
			"bajo la nieve",
			"en marea baja",
			"de mapa antiguo",
			"en la sombra",
			"de domingo",
			"de biblioteca",
			"en silencio",
			"de sobremesa",
			"de carta antigua",
			"a la luz de la vela",
			"de otoño",
			"en calma",
		],
		vivid: [
			"de abril",
			"a mediodía",
			"de verano",
			"de feria",
			"en llamas",
			"de mercado",
			"junto al mar",
			"en flor",
			"de carnaval",
			"de julio",
			"de fiesta",
			"al sol",
			"de vacaciones",
			"del trópico",
			"de neón",
			"a toda prisa",
			"de circo",
			"del jardín",
			"al amanecer",
			"en escena",
		],
	},
};
