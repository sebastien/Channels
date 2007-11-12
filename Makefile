# Channels Makefile (12-Nov-2007)
# TODO: Replace all this with source/target shortcuts
#
SUGAR=sugar
PROJET=channels
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

doc: $(API_DOC) $(DOC_HTML)
	@echo "Documentation ready."

dist: $(EXTEND_DIST) $(EXTEND_SUGAR_DIST)
	@echo "Distribution ready."

clean:
	rm $(DIR_DIST) $(DOC_HTML)

# Specific rules _____________________________________________________________

$(DOC_API): $(SOURCES_SJS) $(DIR_DIST)
	$(SUGAR) -a $@ $< > /dev/null

$(API_DOC_SUGAR): $(EXTEND_SOURCE)
	$(SUGAR) -DSUGAR_RUNTIME -a $@ $< > /dev/null

$(DIR_DIST)/%.js: $(DIR_SOURCES)/%.sjs
	$(SUGAR) -cljavascript $< > $@

$(DIR_DIST):
	mkdir -p $<

%.html: %.txt
	kiwi $< $@

# EOF
