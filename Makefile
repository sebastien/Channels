# Channels Makefile (23-Jan-2007)
# TODO: Replace all this with source/target shortcuts
#
PROJECT=channels
SUGAR=sugar
SUGAR_OPTIONS=
DIR_SOURCES=Sources
DIR_DIST=Distribution
SOURCES_SJS=$(wildcard $(DIR_SOURCES)/*.sjs)
VERSION=$(shell grep '@version' Sources/$(PROJECT).sjs | cut -d' ' -f2 )
PRODUCT_JS=$(SOURCES_SJS:$(DIR_SOURCES)/%.sjs=$(DIR_DIST)/%-$(VERSION).js)
PRODUCT_SJS=$(SOURCES_SJS:$(DIR_SOURCES)/%.sjs=$(DIR_DIST)/%-$(VERSION).sjs)
DOC_API=$(DIR_DIST)/$(PROJECT)-api-$(VERSION).html
DOC_TEXT=$(shell echo *.txt)
DOC_HTML=$(DOC_TEXT:.txt=.html)

.PHONY: doc

# Generic rules ______________________________________________________________

all: doc dist
	@echo

doc: $(DOC_API) $(DOC_HTML)
	@echo "> Documentation generated:"
	@echo "  $(DOC_API)"
	@echo "  $(DOC_HTML)"
	@echo

dist: $(PRODUCT_JS) $(PRODUCT_SJS) doc $(DIR_DIST)
	@echo "> Distribution generated:"
	@echo "  $(PRODUCT_JS) $(PRODUCT_SJS)"
	@echo

clean:
	rm -rf $(DIR_DIST) $(DOC_HTML)

test:
	@echo "Go to http://localhost:8080/index.paml"
	@cd Tests ; python test.py

# Specific rules _____________________________________________________________

$(DOC_API): $(SOURCES_SJS) $(DIR_DIST)
	$(SUGAR) -a $@ $< > /dev/null

$(DIR_DIST)/%-$(VERSION).js: $(DIR_SOURCES)/%.sjs $(DIR_DIST)
	$(SUGAR) $(SUGAR_OPTIONS) -cljavascript $< > $@

$(DIR_DIST)/%-$(VERSION).sjs: $(DIR_SOURCES)/%.sjs $(DIR_DIST)
	cp $< $@

$(DIR_DIST):
	mkdir -p $@


%.html: %.paml
	pamela $< > $@

%.html: %.txt
	kiwi $< $@

# EOF
