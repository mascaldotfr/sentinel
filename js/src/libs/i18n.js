/*
 * Copyright (c) 2022-2025 mascal
 * A tiny i18n system. Released under the MIT license.
 */

export const __i18n__ = {
	"supported_lang": ["en", "fr", "es", "de"],
	"head over to CoRT!": {
		"fr": "rendez-vous sur CoRT !",
		"es": "dirígete a CoRT!",
		"de": "geht’s weiter auf CoRT!"
	},
	"Sentinel is Regnum at a glance. For more features,": {
		"fr": "Sentinel, c'est Regnum en un coup d'œil. Pour plus de fonctionalités,",
		"es": "Sentinel, es Regnum de un vistazo. ¡Para más funciones,",
		"de": "Sentinel ist Regnum auf einen Blick. Für mehr Funktionen,"
	},
	"Bosses status": {
		"fr": "Epiques",
		"es": "Épicos",
		"de": "Bosse"
	},
	"BZ status": {
		"fr": "Battlezone",
		"es": "Battlezone",
		"de": "Battle Zones"
	},
	"WZ status": {
		"fr": "Etat de la WZ",
		"es": "Estado de la ZG",
		"de": "WZ-Status"
	},
	"d":
	{
		"comment": "short for days",
		"fr": "j",
		"es": "d",
		"de": "T"
	},
	"h":
	{
		"comment": "short for hours",
		"fr": "h",
		"es": "h",
		"de": "S"
	},
	"m":
	{
		"comment": "short for minutes",
		"fr": "m",
		"es": "m",
		"de": "min"
	},
	"Next BZ in":
	{
		"fr": "Prochaine BZ dans",
		"es": "Próxima BZ en",
		"de": "Nächste BZ in"
	},
	"remaining":
	{
		"fr": "restantes",
		"es": "restantes",
		"de": "verbleibend"
	},
	"ON":
	{
		"fr": "Ouverte",
		"es": "Abierta",
		"de": "Offen"
	},
	"OFF":
	{
		"fr": "Fermée",
		"es": "Cerrada",
		"de": "Geschlossen"
	},
	"Next Boss":
	{
		"fr": "Prochain Boss",
		"es": "Próximo epico",
		"de": "Nächste Boss"
	},
	"in":
	{
		"comment": "***in*** x <time>",
		"fr": "dans",
		"es": "en",
		"de": "in"
	},
	"Gems": {
		"fr": "Gemmes",
		"es": "Gemas",
		"de": "Juwelen"
	},
	"Last gem stolen": {
		"fr": "Dernière gemme volée",
		"es": "Última gema robada",
		"de": "Letztes Juwel gestohlen"
	},
	"Last dragon wish": {
		"fr": "Dernier vœu du dragon",
		"es": "Último deseo del dragón",
		"de": "Letzter Drachenwunsch"
	},
	"%s ago": {
		"fr": "il y a %s",
		"es": "hace %s",
		"de": "vor %s"
	},
	"All hours are local. The page refreshes itself every minute. You can click on any title to go to the corresponding CoRT page": {
		"fr": "Toutes les heures sont locales. La page se rafraîchit automatiquement chaque minute. Vous pouvez cliquer sur n’importe quel titre pour accéder à la page CoRT correspondante.",
		"es": "Todas las horas son locales. La página se actualiza automáticamente cada minuto. Puede hacer clic en cualquier título para ir a la página CoRT correspondiente.",
		"de": "Alle Zeiten sind Ortszeit. Die Seite aktualisiert sich automatisch jede Minute. Sie können auf einen beliebigen Titel klicken, um zur entsprechenden CoRT-Seite zu gelangen."
	}
};


// automatic language detection if none is defined
if (localStorage.getItem("lang") == null) {
	let nav_lang = navigator.language.slice(0,2).toLowerCase();
	let lang = __i18n__.supported_lang.includes(nav_lang) ? nav_lang : "en";
	localStorage.setItem("lang", lang);
}

export const _ = function(string, ...p) {
	try {
		// Note that it doesn't protect from localstorage manipulation
		let lang = localStorage.getItem("lang");
		if (lang != "en")
			string = __i18n__[string][lang];
		for (let position in p)
			string = string.replace("%s", p[position]);
		return string;
	}
	catch (error) {
		console.error(`Translation failed for '${string}' failed, please correct it: ${error}.`);
		return string;
	}
}
