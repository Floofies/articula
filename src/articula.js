(function () {
	// Sends an HTTP GET request to `url` with response type `type`.
	function get(url = "/", type = "text") {
		return fetch(url).then(res => res[type]());
	}
	// Sends an HTTP HEAD request to `url`.
	function head(url = "/") {
		return fetch(url, { method: "HEAD" }).then(res => res.headers);
	}
	function parseModTime(modTime) {
		return parseInt((new Date(modTime).getTime() / 1000).toFixed(0), 10);
	}
	function getModTime(url) {
		return head(url).then(headers => parseModTime(headers.get("Last-Modified")));
	}
	// Removes all child nodes in an Element.
	function empty(element) {
		while (element.hasChildNodes()) element.removeChild(element.lastChild);
	}
	// Returns a new DocumentFragment.
	function createFragment(tagString) {
		return document.createRange().createContextualFragment(tagString);
	}
	const headerTitle = document.getElementById("headerTitle");
	// Sets the title in the header.
	function setTitle(title) {
		headerTitle.replaceChild(document.createTextNode(title), headerTitle.firstChild);
	}
	const searchParams = new URLSearchParams();
	// Sets the page title in the URL Query String
	function setPageQueryString(title) {
		searchParams.set("p", title);
		// TODO: super glue hair back on head
		const url = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + encodeURI(searchParams.toString()) + window.location.hash;
		window.history.pushState({ path: url }, "", url);
	}
	// Returns the current page title from the URL Query String, or `null` if there is none.
	function getPageQueryString() {
		if (window.location.search.length === 0) return null;
		return new URLSearchParams(window.location.search).get("p");
	}
	const pageContainer = document.getElementById("pageContainer");
	// Parses markdown into an HTML tagString.
	const mdParser = markdownit();
	// Caches parsed markdown HTML Nodes.
	const pageCache = new Map();
	var lastCacheCheck = 0;
	// Loads the markdown page if it exists.
	function loadPage(title) {
		showIndicator();
		hideError();
		setPageQueryString(title);
		// Check if page is in cache.
		const cached = pageCache.get(title);
		if (cached === undefined) {
			// Page not cached, load from server instead.
			loadPageRemote(title);
			return;
		} else if (Date.now() < cached.modTime + 60000) {
			// Don't check staleness if page is less than 60 seconds old
			renderPage(title, cached.page);
			return;
		}
		// Check if the cached page is stale.
		getModTime(title + ".md").then(function (modTime) {
			if (modTime > cached.modTime) {
				loadPageRemote(title);
			} else {
				renderPage(title, cached.page);
			}
		}).catch(showError);
	}
	// Loads a markdown file from the remote server.
	function loadPageRemote(title) {
		fetch(title + ".md").then(function (res) {
			const modTime = parseModTime(res.headers.get("Last-Modified"));
			res.text().then(function (markdown) {
				const page = createFragment(mdParser.render(markdown));
				pageCache.set(title, { page: page, modTime: modTime });
				renderPage(title, page);
			});
		}).catch(showError);
	}
	// Display a DocumentFragment in the main page container.
	function renderPage(title, page) {
		empty(pageContainer);
		setTitle(title);
		pageContainer.appendChild(page.cloneNode(true));
		scrollToHash();
		hideIndicator();
	}
	// Returns a new sidebar element template containing `title`, with an event listener attached.
	function createSidebarElement(title) {
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
	// Toggles sidebar visibility and button appearance.
	function toggleSidebar() {
		sidebarToggleWrap.classList.toggle("active");
		sidebar.classList.toggle("sidebarHidden");
	}
	sidebarToggleWrap.addEventListener("click", toggleSidebar);
	// Loads a list of pages into the sidebar.
	function loadIndex(titles) {
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
					sectionPages.appendChild(createSidebarElement(subTitle));
				}
				sidebarList.appendChild(section);
			} else {
				var page = elementTemplate.cloneNode(true);
				sidebarList.appendChild(createSidebarElement(titles[title]));
			}
		}
	}
	var curSection = null;
	// Shows a sidebar section's contents.
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
	// Hides a sidebar section's contents.
	function hideSection(title) {
		const section = sections[title];
		section.pages.classList.add("hidden");
		empty(section.title);
		section.title.insertAdjacentText("afterbegin", "▸ " + title);
	}
	var showingError = false;
	const errorContainer = document.getElementById("errorContainer");
	// Shows the error message from `error.message`.
	function showError(error) {
		console.error(error);
		empty(errorContainer);
		errorContainer.insertAdjacentText("afterbegin", "Error: " + error.message);
		pageContainer.classList.add("hidden");
		setTitle("Error!");
		errorContainer.classList.remove("hidden");
		hideIndicator();
		showingError = true;
	}
	// Hides the error message.
	function hideError() {
		if (!showingError) return;
		errorContainer.classList.add("hidden");
		pageContainer.classList.remove("hidden");
		showingError = false;
	}
	var loading = true;
	const indicator = document.getElementById("dimmer");
	// Shows the loading indicator.
	function showIndicator() {
		if (loading) return;
		indicator.classList.remove("hidden");
		loading = true;
	}
	// Hides the loading indicator.
	function hideIndicator() {
		if (!loading) return;
		indicator.classList.add("hidden");
		loading = false;
	}
	// Returns the value of the URL hash parameter, or `null` if the value is empty.
	function getHash() {
		if (window.location.hash.length < 2) return null;
		return window.location.hash.slice(1, window.location.hash.length)
	}
	const headingSelector = "h1, h2, h3, h4, h5, h6";
	// Scrolls to the first Heading element which matches `name`.
	function scrollToHeading(title) {
		const headings = document.querySelectorAll(headingSelector);
		if (headings === null) return;
		for (const heading of headings) {
			const headingTitle = heading.textContent;
			if (headingTitle.length === 0) continue;
			if (headingTitle.trim() === title) heading.scrollIntoView();
		}
	}
	function scrollToHash() {
		const title = getHash();
		if (title === null) return;
		scrollToHeading(title);
	}
	window.addEventListener("hashchange", scrollToHash);
	const repoLink = document.getElementById("repoLink");
	// Loads the configuration file, repository link, window title, home page, and sidebar.
	function init() {
		get("articula.json", "json").then(function (conf) {
			if ("repo" in conf) {
				repoLink.setAttribute("href", conf.repo);
				repoLink.classList.remove("invisible");
			}
			if ("title" in conf) window.title = conf.title;
			const queryStringPage = getPageQueryString();
			if (queryStringPage !== null) {
				loadPage(queryStringPage);
			} else if ("home" in conf) {
				loadPage(conf.home);
			}
			if ("pages" in conf) loadIndex(conf.pages);
			if ("sidebar" in conf) {
				sidebar.classList.remove("hidden");
				if ("sidebarOpen" in conf && conf.sidebarOpen === true) {
					sidebar.classList.remove("sidebarHidden");
				}
			}
		}).catch(showError);
	}
	init();
})();