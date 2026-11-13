import { Archivo, Kalam, Karla, Lora } from "next/font/google";

// The type system the team chose on 13 Nov 2026 (docs/brand-options/type-system-7.png, "Homey serif and hand"):
// Lora for display, Karla for everything you read and for figures, Kalam (handwriting) for greetings and notes.
// The variables feed --display, --ui, --price (--slab on the home) and --hand in the stylesheets.

// Lora is loaded at 700 only, on purpose. The stylesheets ask for the display face at weight 400 (the old display face
// had a single weight); with only a 700 face in the family the browser uses it, so every heading is Lora Bold without
// touching each rule.
const lora = Lora({ weight: "700", subsets: ["latin"], display: "swap", variable: "--font-lora" });
// Karla is a variable font: 400 for text, 600 to 800 for labels and buttons. Figures and prices are Karla 800
// (the --price and --slab rules ask for that weight themselves).
const karla = Karla({ subsets: ["latin"], display: "swap", variable: "--font-karla" });
// Handwriting, for the season's greeting, a thank-you, a note in the margin. Never for anything that must be read fast.
const kalam = Kalam({ weight: ["400", "700"], subsets: ["latin"], display: "swap", variable: "--font-kalam", preload: false });
// Trinovata's Label face, for the home footer's credit only (its brand book: Archivo 600 13 px). Not preloaded: no other
// page uses it, and a 13 px footer line can wait for it.
const archivo = Archivo({ weight: "600", subsets: ["latin"], display: "swap", variable: "--font-archivo", preload: false });

export const fontVars = `${lora.variable} ${karla.variable} ${kalam.variable} ${archivo.variable}`;
