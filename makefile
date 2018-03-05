define buildIndex
	@printf "Building $(1)-build/index.html...\n"
	@rm -f $(1)-build/index.html
	@touch $(1)-build/index.html
	@echo "<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><script type='text/javascript'>window.addEventListener('load', function() {" >> $(1)-build/index.html
	@cat tmp/markdown-it.min.js >> $(1)-build/index.html
	@cat tmp/$(1)-articula.js >> $(1)-build/index.html
	@echo "});</script><style type='text/css'>" >> $(1)-build/index.html
	@cat tmp/skeleton.min.css tmp/style.css >> $(1)-build/index.html
	@echo "</style></head><body>" >> $(1)-build/index.html
	@cat src/index.html >> $(1)-build/index.html
	@echo "</body></html>" >> $(1)-build/index.html
	@printf "      \x1b[32;01m[OK]\x1b[0m\n"
endef

noargs :
	@printf "\
	╭─────────────────────────────────────────╮\n\
	│         Articula Build Options          │\n\
	├─────────────────────────────────────────┤\n\
	│ ▶ Production Build:   'make prod'       │\n\
	│ ▶ Development Build:  'make dev'        │\n\
	│ ▶ Remove Temp Files:  'make clean'      │\n\
	╰─────────────────────────────────────────╯\n\n"

prod-build :
	@mkdir -p prod-build
dev-build :
	@mkdir -p dev-build
tmp :
	@mkdir -p tmp
tmp/node_modules : tmp
	@mkdir -p tmp/node_modules
tmp/node_modules/uglify-es/bin/uglifyjs : tmp/node_modules
	@printf "Downloading UglifyJS2 from GitHub...\n"
	@npm install --prefix ./tmp github:mishoo/UglifyJS2#harmony --save-dev
tmp/node_modules/uglifycss/uglifycss : tmp/node_modules
	@printf "Downloading UglifyCSS from GitHub...\n"
	@npm install --prefix ./tmp uglifycss
tmp/skeleton.min.css : tmp
	@printf "Downloading skeleton.min.css...\n"
	@curl https://cdnjs.cloudflare.com/ajax/libs/skeleton/2.0.4/skeleton.min.css -o tmp/skeleton.min.css
tmp/markdown-it.min.js : tmp
	@printf "Downloading markdown-it.min.js...\n"
	@curl https://cdnjs.cloudflare.com/ajax/libs/markdown-it/8.4.0/markdown-it.min.js -o tmp/markdown-it.min.js	
tmp/style.css : src/style.css tmp/node_modules/uglifycss/uglifycss
	@tmp/node_modules/uglifycss/uglifycss --output tmp/style.css src/style.css
tmp/prod-articula.js : src/articula.js tmp/node_modules/uglify-es/bin/uglifyjs
	@tmp/node_modules/uglify-es/bin/uglifyjs -o tmp/prod-articula.js src/articula.js
tmp/dev-articula.js : src/articula.js tmp/node_modules/uglify-es/bin/uglifyjs
	@tmp/node_modules/uglify-es/bin/uglifyjs --warn --lint --comments all -b indent_level=8 -o tmp/dev-articula.js src/articula.js
prod-build/index.html : tmp/prod-articula.js tmp/style.css tmp/node_modules/uglify-es/bin/uglifyjs tmp/markdown-it.min.js tmp/skeleton.min.css
	$(call buildIndex,prod)
dev-build/index.html : tmp/dev-articula.js tmp/style.css tmp/node_modules/uglify-es/bin/uglifyjs tmp/markdown-it.min.js tmp/skeleton.min.css
	$(call buildIndex,dev)
prod :  prod-build prod-build/index.html
	@cp README.md prod-build/README.md
	@cp src/home.md prod-build/home.md
	@cp src/articula.json prod-build/articula.json
	@printf "Build Done! ･ω･\n"
dev :  dev-build dev-build/index.html
	@cp README.md dev-build/README.md
	@cp src/home.md dev-build/home.md
	@cp src/articula.json dev-build/articula.json
	@printf "Build Done! ･ω･\n"
clean :
	@printf "Cleaning up...\n"
	@rm -drf tmp