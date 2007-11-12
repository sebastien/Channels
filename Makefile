# Channels Makefile (12-Nov-2007)
# TODO: Replace all this with source/target shortcuts
#
SUGAR=sugar
PROJECT=channels
DIR_SOURCES=Sources
DIR_DIST=Distribution
SOURCES_SJS=$(wildcard $(DIR_SOURCES)/*.sjs)
PRODUCT_JS=$(SOURCES_SJS:$(DIR_SOURCES)/%.sjs=$(DIR_DIST)/%.js)
DOC_API=$(DIR_DIST)/$(PROJECT)-api.html
DOC_TEXT=$(shell echo *.txt)
DOC_HTML=$(DOC_TEXT:.txt=.html)

.PHONY: doc

# Generic rules ______________________________________________________________

all: doc dist
	@echo

doc: $(DOC_API) $(DOC_HTML)
	@echo "Documentation ready."

dist: $(PRODUCT_JS) doc $(DIR_DIST)
	@echo "Distribution ready."

clean:
	rm $(DIR_DIST) $(DOC_HTML)

# Specific rules _____________________________________________________________

$(DOC_API): $(SOURCES_SJS) $(DIR_DIST)
	$(SUGAR) -a $@ $< > /dev/null

$(DIR_DIST)/%.js: $(DIR_SOURCES)/%.sjs $(DIR_DIST)
	$(SUGAR) -cljavascript $< > $@

$(DIR_DIST):
	mkdir -p $@

%.html: %.txt
	kiwi $< $@

# EOF
