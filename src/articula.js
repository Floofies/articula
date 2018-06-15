(function () {
	// Sends an HTTP GET request to `url` with response type `type`.
	function get(url = "/", type = "text") {
		return fetch(url).then(xhrException).then(res => res[type]());
	}
	// Sends an HTTP HEAD request to `url`.
	function head(url = "/") {
		return fetch(url, { method: "HEAD" }).then(xhrException).then(res => res.headers);
	}
	function xhrException(res) {
		if (!res.ok) throw new Error(res.statusText);
		return res;
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
		const url = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + searchParams.toString() + window.location.hash;
		window.history.pushState({ path: url }, "", url);
	}
	// Returns the current page title from the URL Query String, or `null` if there is none.
	function getPageQueryString() {
		if (window.location.search.length === 0) return null;
		return decodeURIComponent(new URLSearchParams(window.location.search).get("p"));
	}
	const pageContainer = document.getElementById("pageContainer");
	// Parses markdown into an HTML tagString.
	const mdParser = markdownit();
	// Caches parsed markdown HTML Nodes.
	const pageCache = new Map();
	var lastCacheCheck = 0;
	var curPath = "";
	var loadFail = false;
	// Loads the markdown page if it exists.
	function loadPage(path, title) {
		curPath = path;
		hideError();
		setPageQueryString(path);
		// Check if page is in cache.
		const cached = pageCache.get(path);
		if (cached === undefined) {
			// Page not cached, load from server instead.
			showIndicator();
			loadPageRemote(path, title);
			return;
		} else if (Date.now() < cached.modTime + 60000) {
			// Don't check staleness if page is less than 60 seconds old
			renderPage(cached.page, cached.title);
			return;
		}
		// Check if the cached page is stale.
		getModTime(path).then(function (modTime) {
			if (modTime > cached.modTime) {
				showIndicator();
				loadPageRemote(path, title);
			} else {
				renderPage(cached.page, cached.title);
			}
		}).catch(error => {
			loadFail = true;
			setError(error);
		});
	}
	// Loads a markdown file from the remote server.
	function loadPageRemote(path, title) {
		fetch(path).then(xhrException).then(function (res) {
			const modTime = parseModTime(res.headers.get("Last-Modified"));
			res.text().then(function (markdown) {
				const page = createFragment(mdParser.render(markdown));
				pageCache.set(path, { page: page, title: title, modTime: modTime });
				renderPage(page, title);
			});
		}).catch(error => {
			loadFail = true;
			setError(error);
		});
	}
	// Display a DocumentFragment in the main page container.
	function renderPage(page, title) {
		empty(pageContainer);
		setTitle(title);
		pageContainer.appendChild(page.cloneNode(true));
		loadFail = false;
		collapseSidebar();
		headings = document.querySelectorAll(headingSelector);
		scrollToHash();
		hideIndicator();
	}
	function hidePage() {
		pageContainer.classList.add("hidden");
	}
	function showPage() {
		pageContainer.classList.remove("hidden");
	}
	function togglePage() {
		pageContainer.classList.toggle("hidden");
	}
	// Returns a new sidebar element template containing `title`, with an event listener attached.
	function createSidebarElement(path, title) {
		const template = elementTemplate.cloneNode(true);
		const element = template.querySelector(".sidebarElement");
		element.insertAdjacentText("afterbegin", title);
		element.addEventListener("click", function (event) {
			window.location.hash = "";
			loadPage(path, title);
		});
		return template;
	}
	const sidebar = document.getElementById("sidebar");
	const sidebarToggle = document.getElementById("sidebarToggle");
	const sidebarToggleWrap = document.getElementById("sidebarToggleWrap");
	const treeButton = document.getElementById("treeButtonWrap");
	const sidebarList = sidebar.querySelector("#sidebarList");
	const elementTemplate = document.getElementById("elementTemplate").content;
	const sectionTemplate = document.getElementById("sectionTemplate").content;
	const sections = {};
	// Toggles sidebar visibility and button appearance.
	function toggleSidebar() {
		treeButton.classList.toggle("hidden");
		sidebarToggleWrap.classList.toggle("active");
		sidebar.classList.toggle("sidebarHidden");
		collapseSidebar();
	}
	sidebarToggleWrap.addEventListener("click", toggleSidebar);
	var sidebarExpanded = false;
	function toggleExpandSidebar() {
		if (sidebarExpanded) {
			collapseSidebar();
		} else {
			expandSidebar();
		}
	}
	treeButton.addEventListener("click", toggleExpandSidebar);
	function expandSidebar() {
		sidebar.classList.add("sidebarExpanded");
		hideError();
		hidePage();
		sidebarExpanded = true;
	}
	function collapseSidebar() {
		sidebar.classList.remove("sidebarExpanded");
		if (loadFail) {
			showError();
		} else {
			showPage();
		}
		sidebarExpanded = false;
	}
	// Loads a list of pages into the sidebar.
	function loadIndex(pages, node = null) {
		if (node === null) node = sidebarList;
		for (const title in pages) {
			if ((typeof pages[title]) === "object") {
				const section = sectionTemplate.cloneNode(true);
				const sectionPages = section.querySelector(".sectionPages");
				const sectionTitle = section.querySelector(".sectionTitle");
				sectionTitle.insertAdjacentText("afterbegin", "▸ " + title);
				const sectionDescriptor = {
					section: section,
					title: sectionTitle,
					titleString: title,
					pages: sectionPages,
					parent: node
				};
				sectionTitle.addEventListener("click", () => toggleSection(sectionDescriptor));
				loadIndex(pages[title], sectionPages);
				node.appendChild(section);
			} else if ((typeof pages[title]) === "string") {
				node.appendChild(createSidebarElement(pages[title], title));
			}
		}
	}
	const nestStack = [];
	// Shows/hides a sidebar section's contents.
	function toggleSection(section) {
		if (nestStack.length === 0) {
			nestStack.push(section);
			showSection(section);
			return;
		}
		const index = nestStack.findIndex(value => value === section);
		const parentIndex = nestStack.findIndex(value => value.pages === section.parent);
		if (index === -1) {
			if (parentIndex !== -1) {
				if (parentIndex === (nestStack.length - 1)) {
					nestStack.push(section);
					showSection(section);
				} else {
					while (nestStack.length !== (parentIndex + 1)) hideSection(nestStack.pop());
					nestStack.push(section);
					showSection(section);
				}
			} else {
				while (nestStack.length !== 0) hideSection(nestStack.pop());
				nestStack.push(section);
				showSection(section);
			}
		} else if (index !== -1) {
			if (index !== (nestStack.length - 1)) {
				while ((nestStack.length - 1) !== (index - 1)) hideSection(nestStack.pop());
			} else {
				nestStack.pop(section);
				hideSection(section);
			}
		}
	}
	function showSection(section) {
		empty(section.title);
		section.title.insertAdjacentText("afterbegin", "▾ " + section.titleString);
		section.pages.classList.remove("hidden");
	}
	// Hides a sidebar section's contents.
	function hideSection(section) {
		empty(section.title);
		section.title.insertAdjacentText("afterbegin", "▸ " + section.titleString);
		section.pages.classList.add("hidden");
	}
	var showingError = false;
	const errorContainer = document.getElementById("errorContainer");
	// Shows the error message from `error.message`.
	function setError(error) {
		console.error(error);
		empty(errorContainer);
		errorContainer.insertAdjacentText("afterbegin", "Error: " + error.message);
		collapseSidebar();
		setTitle("Error!");
		showError();
		hideIndicator();
		showingError = true;
	}
	function showError() {
		if (showingError) return;
		errorContainer.classList.remove("hidden");
		hidePage();
		showingError = true;
	}
	// Hides the error message.
	function hideError() {
		if (!showingError) return;
		errorContainer.classList.add("hidden");
		showPage();
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
	var headings = null;
	// Scrolls to the first Heading element which matches `title`.
	function scrollToHeading(title) {
		if (headings === null || headings.length === 0) return;
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
	const homeButton = document.getElementById("homeButtonWrap");
	// Loads the configuration file, repository link, window title, home page, and sidebar.
	function init() {
		get("articula.json", "json").then(function (conf) {
			if ("repo" in conf) {
				repoLink.setAttribute("href", conf.repo);
				repoLink.classList.remove("invisible");
			}
			if ("title" in conf) window.title = conf.title;
			const queryStringPage = getPageQueryString();
			if ("home" in conf) {
				homeButton.addEventListener("click", function () {
					if (curPath !== conf.home) loadPage(conf.home, "Home")
				});
				homeButton.classList.remove("hidden");
			}
			if (queryStringPage !== null) {
				loadPage(queryStringPage, queryStringPage);
			} else if ("home" in conf) {
				loadPage(conf.home, "Home");
			}
			if (!("pages" in conf)) conf.pages = {};
			loadIndex(conf.pages);
			if ("sidebar" in conf && conf.sidebar === true) {
				sidebar.classList.remove("hidden");
				if ("sidebarOpen" in conf && conf.sidebarOpen === true) {
					sidebar.classList.remove("sidebarHidden");
					treeButton.classList.remove("hidden");
				}
			}
		}).catch(error => {
			loadFail = true;
			setError(error);
		});
	}
	init();
})();