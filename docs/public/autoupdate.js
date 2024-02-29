/* eslint-disable no-console */
(async (updateSWDelay, updateConfigDelay) => {
	const LSDB = {
		read: (key) => localStorage.getItem(key),
		write: (key, value) => {
			localStorage.setItem(key, value);
		},
	};
	async function updateSW() {
		if (navigator.serviceWorker) {
			navigator.serviceWorker
				.getRegistrations()
				.then(async (registrations) => {
					for (const registration of registrations) {
						await registration.unregister();
					}
					console.log("Unregistered service workers");
				})
				.then(() => {
					// register new service worker in /cw.js
					navigator.serviceWorker
						.register("/cw.js")
						.then(async (registration) => {
							console.log("Registered service worker");
							await registration.update();
							LSDB.write("cw_time_sw", Date.now());
						});
				});
		}
	}
	async function updateConfig() {
		await fetch("/cw-cgi/api/config")
			.then((res) => res.text())
			.then((res) => {
				if (res === "ok") {
					console.log("Config updated");
					LSDB.write("cw_time_config", Date.now());
				} else {
					console.log("Config update failed");
				}
			});
	}

	if (Number(LSDB.read("cw_time_sw")) < Date.now() - updateSWDelay) {
		await updateSW();
		await updateConfig();
	}
	if (Number(LSDB.read("cw_time_config")) < Date.now() - updateConfigDelay) {
		await updateConfig();
	}

	setInterval(async () => {
		await updateSW();
		await updateConfig();
	}, updateSWDelay);
	setInterval(async () => {
		await updateConfig();
	}, updateConfigDelay);
})(1000 * 60 * 60 * 12, 1000 * 60);