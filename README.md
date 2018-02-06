# Articula

**A simple Markdown navigator for GitHub Pages**

[View Demo](http://demo.articula.io)

---

## Installing

Navigate to your remote repository on GitHub, click Settings, and [set up your GitHub Pages publishing source.](https://help.github.com/articles/configuring-a-publishing-source-for-github-pages/)

Once you have set up your source directory, move `index.html`, `index.json`, and `home.md` to it, then commit/push the files to your repository.

Upon navigating to your GitHub Pages URL in a web browser, you should see a page which states: "Articula is Working!". If not, confirm that all needed files are present in your source directory. If they are present, you should also confirm that they are available by opening them directly via your GitHub Pages URL.

If you encounter any issues you can not fix, please create a new Issue in this repository which clearly describes the problem and how to reproduce it.

## Configuring

Articula uses a file named `home.md` as the index of your Pages site, and you can edit or replace this file.

Adding pages to Articula is very easy. A single `index.json` file is used to store the names of your pages without the filetype extensions.

By default, `index.json` is a flat array like this one:
```JSON
[
	"myPage",
	"myOtherPage"
]
```

Articula also supports basic drop-down menu organization if you use an object instead:
```JSON
{
	"mySection": [
		"myPage"
	],
	"myOtherSection": [
		"myOtherPage"
	]
}
```

## Building

If you are contributing to the project, GNU Make and `makefile` are used to build the production files. Run `make` in terminal for a list of build options.

The production build will be put into a `prod-build` directory.