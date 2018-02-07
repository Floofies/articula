(function () {
	function empty(element) {
		while (element.hasChildNodes()) element.removeChild(element.lastChild);
	}
	function ajax(url = "/", verb = "GET", data = null) {
		return new Promise(function (resolve, reject) {
			const req = new XMLHttpRequest();
			req.onreadystatechange = function () {
				if (req.readyState === 4) {
					if (req.status >= 200 && req.status < 400) {
						resolve(req.response);
					} else {
						reject(new Error("HTTP Error " + req.status + ": " + req.statusText));
					}
				}
			};
			req.open(verb, url);
			req.responseType = "text";
			req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			req.send(data);
		});
	}
	const pageContainer = document.getElementById("pageContainer");
	const mdParser = markdownit();
	const cache = new Map();
	function loadPage(title) {
		showIndicator();
		hideError();
		const cached = cache.get(title);
		if (cached !== undefined) {
			empty(pageContainer);
			pageContainer.appendChild(cached.cloneNode(true));
			hideIndicator();
		} else {
			ajax(title + ".md").then(function (markdown) {
				const page = document.createRange().createContextualFragment(mdParser.render(markdown));
				empty(pageContainer);
				pageContainer.appendChild(page.cloneNode(true));
				hideIndicator();
				cache.set(title, page);
			}).catch(showError);
		}
	}
	function sidebarElement(title) {
		const template = elementTemplate.cloneNode(true);
		const element = template.querySelector(".sidebarElement");
		element.insertAdjacentText("afterbegin", title);
		element.addEventListener("click", function (event) {
			loadPage(title);
		});
		return template;
	}
	const sidebar = document.getElementById("sidebar");
	const sidebarToggle = document.getElementById("sidebarToggle");
	const sidebarToggleWrap = document.getElementById("sidebarToggleWrap");
	const sidebarList = sidebar.querySelector("#sidebarList");
	const elementTemplate = document.getElementById("elementTemplate").content;
	const sectionTemplate = document.getElementById("sectionTemplate").content;
	const sections = {};
	function toggleSidebar() {
		sidebarToggleWrap.classList.toggle("active");
		sidebar.classList.toggle("sidebarHidden");
		sidebar.classList.toggle("sidebarShowing");
	}
	sidebarToggleWrap.addEventListener("click", toggleSidebar);
	function loadIndex() {
		ajax("index.json").then(function (body) {
			const titles = JSON.parse(body);
			var rootSections = !Array.isArray(titles);
			for (const title in titles) {
				if (rootSections && Array.isArray(titles[title])) {
					var section = sectionTemplate.cloneNode(true);
					var sectionTitle = section.querySelector(".sectionTitle")
					sectionTitle.insertAdjacentText("afterbegin", "▸ " + title);
					sectionTitle.addEventListener("click", () => showSection(title));
					var sectionPages = section.querySelector(".sectionPages");
					sections[title] = {
						section: section,
						title: sectionTitle,
						pages: sectionPages
					};
					for (const subTitle of titles[title]) {
						sectionPages.appendChild(sidebarElement(subTitle));
					}
					sidebarList.appendChild(section);
				} else {
					var page = elementTemplate.cloneNode(true);
					sidebarList.appendChild(sidebarElement(titles[title]));
				}
			}
		}).catch(function (error) {
			error.message = "Unable to load index.json : " + error.message;
			showError(error);
		});
	}
	var curSection = null;
	function showSection(title) {
		if (curSection !== null) hideSection(curSection);
		if (curSection !== title) {
			const section = sections[title];
			empty(section.title);
			section.title.insertAdjacentText("afterbegin", "▾ " + title);
			sections[title].pages.classList.remove("hidden");
			curSection = title;
		} else {
			curSection = null;
		}
	}
	function hideSection(title) {
		const section = sections[title];
		section.pages.classList.add("hidden");
		empty(section.title);
		section.title.insertAdjacentText("afterbegin", "▸ " + title);
	}
	var showingError = false;
	const errorContainer = document.getElementById("errorContainer");
	function showError(error) {
		console.error(error);
		empty(errorContainer);
		errorContainer.insertAdjacentText("afterbegin", "Error: " + error.message);
		pageContainer.classList.add("hidden");
		showIndicator(false);
		errorContainer.classList.remove("hidden");
		showingError = true;
	}
	function hideError() {
		if (!showingError) return;
		errorContainer.classList.add("hidden");
		pageContainer.classList.remove("hidden");
		showingError = false;
	}
	var loading = true;
	const indicator = document.getElementById("dimmer");
	function showIndicator() {
		if (loading ) return;
		indicator.classList.remove("hidden");
		loading = true;
	}
	function hideIndicator() {
		if (!loading) return;
		indicator.classList.add("hidden");
		loading = false;
	}
	document.getElementById("sidebarHeader").addEventListener("click", () => loadPage("home"));
	loadPage("home");
	loadIndex();
})();