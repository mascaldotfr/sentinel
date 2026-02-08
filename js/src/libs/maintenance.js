import {$} from "./cortlibs.js";

export class Maintenance {
	constructor(maint_url) {
		this.maint_url = maint_url;
	}
	check() {
		// Put maintenance message (see /api/MAINTENANCE.md)
		setTimeout(async () => {
			const ts = Date.now();
			const last_check = parseInt(localStorage.getItem("maint_last_check")) || 0;
			let msg = localStorage.getItem("maint_msg") || "";
			try {
				// need to refresh the cache, either at start or if >=
				// 5 minutes after last fetch
				if (last_check == 0 ||  ts >= last_check + 5 * 60 * 1000) {
					msg = await $().get(this.maint_url);
					localStorage.setItem("maint_msg", msg);
					localStorage.setItem("maint_last_check", ts);
					// Bail out on empty message (404s fall here as well)
					if (msg.length == 0)
						return;
					$("#noapi").remove();
					$("body").prepend(`
						<div class="card bold center" style="background-color:#a9005d" id="noapi">
							&#9888;&#65039; ${msg}
						</div>
					`);
				}
			}
			catch (error) {
				// Things go really bad, or we're rebooting...
				console.error(error);
				$("#noapi").remove();
				$("body").prepend(`
					<div class="card bold center" style="background-color:#c44" id="noapi">
						&#128163; The API server cannot be reached!
						Check out the (slow) <a href="https://cort.go.yo.fr" target="_blank" style="color:gold"> backup site</a> if needed!
					</div>
				`);
			}
		}, 300);
	}
}
