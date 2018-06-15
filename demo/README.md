# Articula

**A simple Markdown document viewer for GitHub Pages**

[View Demo](http://demo.articula.io)

---

# Installing

Navigate to your remote repository on GitHub, click Settings, and [set up your GitHub Pages publishing source.](https://help.github.com/articles/configuring-a-publishing-source-for-github-pages/)

Once you have set up your source directory, move `index.html`, `index.json`, and `home.md` to it, then commit/push the files to your repository.

Upon navigating to your GitHub Pages URL in a web browser, you should see a page which states: "Articula is Working!". If not, confirm that all needed files are present in your source directory. If they are present, you should also confirm that they are available by opening them directly via your GitHub Pages URL.

If you encounter any issues you can not fix, please create a new Issue in this repository which clearly describes the problem and how to reproduce it.

# Configuring

Articula uses a file named `articula.json` to store configuration settings and the page index.

## Available Configuration Options

Property|Value Type|Description
---|---|---
`title`|String|The title of the browser window.
`repo`|String|The URL to use with the "View On GitHub" button.
`home`|String|The path of a Markdown document you would like to use as the home page.
`sidebar`|Boolean|Setting to `false` will completely hide & disable the sidebar.
`sidebarOpen`|Boolean|Setting to `true` will open the sidebar when first loading Articula.
`pages`|Object|An Object tree describing the pages to display in the sidebar.

## Adding Pages, Sections, and Sub-Sections to the Sidebar

Pages can be added to the sidebar by adding properties to the `pages` object in `articula.json`. Property names are used to label the sidebar elements, while property values can identifiy either a section/sub-section or a Markdown document.

Strings idenfity Markdown documents, while Objects are sections/sub-sections.

Sections are nestable, allowing you to create unlimited sub-sections.

### Example - Basic Usage:

```JSON
pages: {
	"Page One": "path/to/page1.md",
	"Page Two": "path/to/page2.md",
	"Page Three": "path/to/page3.md"
}
```

### Example - Section Usage:

```JSON
pages: {
	"cats": {
		"Siamese": "cats/siamese.md",
		"American Bobtail": "cats/americanBobtail.md",
		"Scottish Fold": "cats/scottishFold.md"
	},
	"dogs": {
		"Basset Hound": "dogs/bassetHound.md",
		"Golden Retriever": "dogs/goldenRetriever.md",
		"Spanish Mastiff": "dogs/spanishMastiff.md"
	}
}
```

### Example - Nested Sub-Section Usage:

```JSON
pages: {
	"myPage": "path/to/myPage.md",
	"mySection": {
		"mySubPage": "path/to/mySubPage.md"
		"mySubSection": {
			"mySubSubPage": "path/to/mySubSubPage.md"
		}
	}
}
```

# Building

If you are contributing to the project, GNU Make and the `makefile` are used to build the production files.

Run `make` in terminal for a list of build options.