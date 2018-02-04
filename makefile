noargs :
	@printf "\
	╭─────────────────────────────────────────╮\n\
	│         Articula Build Options          │\n\
	├─────────────────────────────────────────┤\n\
	│ ▶ Production Build:   'make prod'       │\n\
	│ ▶ Clean Build:        'make prod clean' │\n\
	╰─────────────────────────────────────────╯\n\n"

prod-build :
	@mkdir prod-build
prod-build/tmp : prod-build
	@mkdir prod-build/tmp
prod-build/tmp/node_modules : prod-build/tmp
	@mkdir ./prod-build/tmp/node_modules
prod-build/tmp/node_modules/uglify-es/bin/uglifyjs : prod-build/tmp prod-build/tmp/node_modules
	@printf "Downloading UglifyJS2 from GitHub...\n"
	@npm install --prefix ./prod-build/tmp github:mishoo/UglifyJS2#harmony --save-dev
prod-build/tmp/node_modules/uglifycss/uglifycss : prod-build/tmp prod-build/tmp/node_modules
	@printf "Downloading UglifyCSS from GitHub...\n"
	@npm install --prefix ./prod-build/tmp uglifycss
prod-build/tmp/vs.min.css : prod-build/tmp
	@printf "Downloading vs.min.css...\n"
	@curl https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/vs.min.css -o prod-build/tmp/vs.min.css
prod-build/tmp/skeleton.min.css : prod-build/tmp
	@printf "Downloading skeleton.min.css...\n"
	@curl https://cdnjs.cloudflare.com/ajax/libs/skeleton/2.0.4/skeleton.min.css -o prod-build/tmp/skeleton.min.css
prod-build/tmp/markdown-it.min.js : prod-build/tmp
	@printf "Downloading markdown-it.min.js...\n"
	@curl https://cdnjs.cloudflare.com/ajax/libs/markdown-it/8.4.0/markdown-it.min.js -o prod-build/tmp/markdown-it.min.js
prod-build/tmp/highlight.min.js : prod-build/tmp
	@printf "Downloading highlight.min.js...\n"
	@curl https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js -o prod-build/tmp/highlight.min.js
prod-build/tmp/javascript.min.js : prod-build/tmp
	@printf "Downloading javascript.min.js...\n"
	@curl https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.4.0/languages/javascript.min.js -o prod-build/tmp/javascript.min.js
prod-build/tmp/index.js : src/index.js prod-build/tmp prod-build/tmp/node_modules/uglify-es/bin/uglifyjs
	@prod-build/tmp/node_modules/uglify-es/bin/uglifyjs -o prod-build/tmp/index.js src/index.js
prod-build/tmp/style.css : src/style.css prod-build/tmp prod-build/tmp/node_modules/uglifycss/uglifycss
	@prod-build/tmp/node_modules/uglifycss/uglifycss --output prod-build/tmp/style.css src/style.css
prod-build/index.html : prod-build prod-build/tmp/index.js prod-build/tmp/style.css prod-build/tmp/node_modules/uglify-es/bin/uglifyjs prod-build/tmp/javascript.min.js prod-build/tmp/highlight.min.js prod-build/tmp/markdown-it.min.js prod-build/tmp/skeleton.min.css prod-build/tmp/vs.min.css
	@printf "Building prod-build/index.html...\n"
	@rm -f prod-build/index.html
	@touch prod-build/index.html
	@echo "<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><title>Articula</title><script type='text/html/>window.addEventListener('load', function() {" >> prod-build/index.html
	@cat prod-build/tmp/markdown-it.min.js prod-build/tmp/highlight.min.js prod-build/tmp/javascript.min.js >> prod-build/index.html
	@cat prod-build/tmp/index.js >> prod-build/index.html
	@echo "});</script><style type='text/css'>" >> prod-build/index.html
	@cat prod-build/tmp/vs.min.css prod-build/tmp/skeleton.min.css prod-build/tmp/style.css >> prod-build/index.html
	@echo "</style></head><body>" >> prod-build/index.html
	@cat src/index.html >> prod-build/index.html
	@echo "</body></html>" >> prod-build/index.html
	@printf "      \x1b[32;01m[OK]\x1b[0m\n"
prod :  prod-build prod-build/index.html
	@cp README.md prod-build/README.md
	@printf "Build Done! ･ω･\n"
clean :
	@printf "Cleaning up...\n"
	@rm -drf prod-build/tmp