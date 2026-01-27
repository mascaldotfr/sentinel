import {$} from "./libs/cortlibs.js";
import {_} from "./libs/i18n.js";
import {Time, Icons, Constants} from "./libs/wztools.js";
import {Maintenance} from "./libs/maintenance.js";

const API_BASE = "https://cort.thebus.top/api";
const API_SENTINEL = "/bin/sentinel/sentinel.php";
const API_MAINT = "/var/maintenance.txt";

$(document).ready(function() {
	$("#what-is-sentinel").text(_("Sentinel is Regnum at a glance. For more features,"));
	$("#move-to-cort").text(_("head over to CoRT!"));
	// CLS fix, otherwise the image moves around its parent div
	$("#cort > img").css("visibility", "visible");
	$("#bz-next-title").text(_("Next BZ in"));
	$("#boss-title").text(_("Next Boss"));
	$("#wishes-title").text(_("Last dragon wish"));
	$("#stolengems-title").text(_("Last gem stolen"));
	$("#footer-infos").text(_("All hours are local. The page refreshes itself every minute. You can click on any title to go to the corresponding CoRT page"));
	$("#gems-title").text(_("Gems"));

	const wz = new Warzone();
	if (wz.canvas === null)
		wz.setup_canvas("map-map");
	const battlezone = new Battlezone();
	const boss = new Boss();
	const stats = new Statistics();

	$("#map-map").css('background-image', 'url("data/map/base_map.png")');
	$("#map-map").css("background-size", "cover");

	// Data is refreshed :
	// 	- immediatly, when page is loaded
	// 	- every minutes between :10 and :15 if the window is visible
	// 	- immediatly, when the page is focused
	// Data is not refreshed :
	// 	- if the window is inactive
	// 	- if the last refresh was less than 5s ago
	let last_refresh = Date.now();
	display(wz, boss, battlezone, stats);
	window.addEventListener("focus", () => {
		const ts = Date.now();
		if (ts - last_refresh > 5000) {
			last_refresh = ts;
			display(wz, boss, battlezone, stats);
		}
	});
	const maint = new Maintenance(API_BASE + API_MAINT);
	setInterval(() => {
		const ts = Date.now();
		const now = new Date(ts);
		const sec = now.getSeconds();
		// CoRT API fetch warstatus at the beginning of each minute, so
		// give it a little time, but not too much.
		const should_display = sec >= 10 && sec < 15;
		const on_debounce = ts - last_refresh <= 5000;
		if (should_display && !on_debounce && !document.hidden) {
			display(wz, boss, battlezone, stats);
			last_refresh = ts;
		}
		maint.check();
	}, 5000);

	$(".lang").on("click", (event) => {
		localStorage.setItem("lang", event.currentTarget.dataset.lang);
		location.reload(false);
	});
});

async function display(wz, boss, battlezone, stats) {
	let failures =[];

	let api_data = null;
	try {
		api_data = await $().getJSON(API_BASE + API_SENTINEL);
		$("#sentinel-error").empty();
		$("#main-container").show();
	}
	catch(_unused) {
		$("#sentinel-error").text(`Unable to fetch API data! Check console.`);
		$("#main-container").hide();
		return;
	}

	const bz = battlezone.compute_bz(api_data["bz"]);
	$("#bz-on").text(bz["on"] === true ? _("ON") : _("OFF"));
	$("#bz-on").attr("data-status", bz["on"] === true ? "on" : "off");
	if (bz["on"] === true)
		$("#bz-current").text(`(${bz.ends_in} ${_("remaining")})`);
	else
		$("#bz-current").empty();
	$("#bz-next-datetime").text(`${bz.next_starts_in} (${bz.next_starts_at})`);

	const next_boss = boss.get_next_respawn(api_data["bosses"]);
	$("#boss-name").text(next_boss["name"][0].toUpperCase() + next_boss["name"].slice(1));
	$("#boss-time").text(`${_("in")} ${next_boss._in} (${next_boss.at})`);
	$("#boss-icon").html(`
		<picture>
			<source srcset="data/bosses/${next_boss.name.toLowerCase()}.webp" type="image/webp">
			<img src="data/bosses/${next_boss.name.toLowerCase()}.png" title="${next_boss.name}" class="inline-icon">
		</picture>
	`);


	const sc = stats.get(api_data["stats"]);
	for (let realm in sc["wishes"])
		$(`#wishes-${realm}`).text(sc["wishes"][realm]);
	for (let realm in sc["stolengems"])
		$(`#stolengems-${realm}`).text(sc["stolengems"][realm]);

	let wz_changed = wz.fetch_data(api_data["wz"]);
	if (wz_changed === true) {
		const gems_content = wz.generate_gems();
		for (let realm in gems_content)
			$(`#gems-${realm}`).html(gems_content[realm]);
		wz.display_map();
	}

}

class Battlezone {
	constructor() {
		// XXX ALL TIMES ARE UTC INTERNALLY
		// SUNDAY = 0 SATURDAY = 6

		this.dformatter = new Intl.DateTimeFormat(localStorage.getItem("lang"), {
			weekday: 'short', month:'short', day: 'numeric',
			hour: '2-digit', minute: '2-digit', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
		});
		this.time = new Time();
	}

	compute_bz(json) {
		// 60s to round to the next minute, since seconds aren't displayed
		return {
			on: 		json["bzon"],
			ends_in: 	this.time.timestamp_ago(json["bzendsat"] + 60)["human"],
			next_starts_in: this.time.timestamp_ago(json["bzbegin"][0] + 60)["human"],
			next_starts_at: this.dformatter.format(json["bzbegin"][0] * 1000),
		};
	}
}

class Boss {
	constructor() {
		this.dformatter =  new Intl.DateTimeFormat(localStorage.getItem("lang"), {
			hour12: false, weekday: 'short', month: 'short', day: 'numeric',
			hour: 'numeric', minute: 'numeric', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
		});
		this.time = new Time();
	}

	get_next_respawn(json) {
		return {
			name: 	json["next_boss"],
			at:	this.dformatter.format(new Date(json["next_boss_ts"] * 1000)),
			_in:	this.time.timestamp_ago(json["next_boss_ts"], false, true)["human"]
		};
	}

}

class Warzone {
	constructor() {
		this.data = null;
		this.canvas = null;
		let icons = new Icons();
		this.wzicons = icons.get_all_icons();
	}

	fetch_data(new_json) {
		// This allows to redraw the map and gems only if things changed
		if (JSON.stringify(new_json) === JSON.stringify(this.data)) {
			return false;
		}
		else {
			this.data = new_json;
			return true;
		}
	}

	generate_gems() {
		// gems, output as SVG
		let icons = new Icons();
		let all_icons = icons.get_all_icons();
		let constants = new Constants();
		let gems = [];
		let gems_html = {};

		// @eshint can't translate for..of to firefox52, so we write in
		// ES5 ourselves.
		for (var i = 0; i < this.data["gems"].length; i++) {
				var gem = this.data["gems"][i];
				gems.push(all_icons[gem]);
		}

		for (var j = 0; j < constants.realm_names.length; j++) {
				var realm = constants.realm_names[j];
				gems_html[realm.toLowerCase()] = gems.splice(0, 6).join("");
		}

		return gems_html;
	}

	// canvas
	setup_canvas(id) {
		let canvas = document.getElementById(id);
		let dpr = window.devicePixelRatio || 1;

		canvas.width = 500 * dpr;
		canvas.height = 500 * dpr;

		let ctx = canvas.getContext('2d');
		// Prepopulate the map with a transparent rectangle Allows the map to
		// be fully show ASAP with no bounce effect while waiting to draw the
		// real map overlay
		ctx.strokeRect(0, 0, canvas.width, canvas.height);

		// Drop shadow under icons
		ctx.shadowOffsetX = 1 * dpr;
		ctx.shadowOffsetY = 2 * dpr;
		ctx.shadowColor = "#000000";

		this.canvas = {
			// In site order, [x, y, text_x, text_y]
			forts_positions: [
				[212, 60, 221, 55],
				[208, 175, 193, 195],
				[120, 187, 105, 207],
				[139, 140, 119, 165],
				[260, 111, 245, 133],
				[290, 180, 275, 200],
				[365, 220, 345, 245],
				[324, 140, 304, 165],
				[135, 230, 118, 250],
				[220, 250, 195, 270],
				[285, 360, 255, 385],
				[183, 310, 153, 335]
			],
			width: canvas.width,
			height: canvas.height,
			ctx: ctx,
			dpr: dpr
		};

	}

	// Use different fort icons according to their type
	dispatch_fort_icon(fort) {
		if (fort["name"].includes("Castle"))
			return "castle_" + fort["icon"];
		else if (fort["name"].startsWith("Great Wall"))
			return "wall_" + fort["icon"];
		else
			return fort["icon"];
	}


	// Create a svg blob for a given original icon filename
	svg_to_blob(fname) {
	    let xml = this.wzicons[fname];
	    if (!xml) {
		console.warn("Missing icon:", fname);
		return "";
	    }
	    // Properly encode UTF-8 characters for btoa
	    return "data:image/svg+xml;charset=UTF-8;base64," + btoa(unescape(encodeURIComponent(xml)));
	}

	display_map() {
		let forts = this.data["forts"];
		// Preload all images in parallel using Promises
		let imagePromises = forts.map(fort => {
			return new Promise(resolve => {
				let img = new Image();
				img.src = this.svg_to_blob(this.dispatch_fort_icon(fort));
				img.onload = () => resolve(img);
				img.onerror = () => resolve(null); // Gracefully handle missing icons
			});
		});

		// Wait for all images to load
		Promise.all(imagePromises)
			.then(images => {
				// Filter out any failed images
				let validImages = images.filter(img => img !== null);
				// Draw the map once all are ready
				return this.draw_map(validImages);
			})
			.catch(error => {
				console.error("Map generation failed:", error);
			});
	}

	async draw_map(images) {
		let dpr = this.canvas.dpr;
		// clear everything
		this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		// Draw each fort icon and label
		for (let i = 0; i < images.length; i++) {
			let pos = this.canvas.forts_positions[i];
			if (pos && images[i]) {
				this.canvas.ctx.drawImage(images[i], pos[0] * dpr, pos[1] * dpr, 36 * dpr, 36 * dpr);
			}
		}

	}
}

class Statistics {
	get(json) {
		let time = new Time();
		let retval = {"stolengems": {}, "wishes": {}};
		for (let realm in json) {
			let ri = json[realm];
			retval["stolengems"][realm.toLowerCase()] = time.timestamp_ago(ri["gems"]["stolen"]["last"], true)["human"];
			retval["wishes"][realm.toLowerCase()] = time.timestamp_ago(ri["wishes"]["last"], true)["human"];
		}
		return retval;
	}
}
