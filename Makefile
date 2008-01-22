# Channels Makefile (12-Nov-2007)
# TODO: Replace all this with source/target shortcuts
#
SUGAR=sugar
PROJECT=channels
DIR_SOURCES=Sources
DIR_DIST=Distribution
SOURCES_SJS=$(wildcard $(DIR_SOURCES)/*.sjs)
PRODUCT_JS=$(SOURCES_SJS:$(DIR_SOURCES)/%.sjs=$(DIR_DIST)/%.js)
TEST_SJS=$(wildcard Tests/*.sjs Tests/lib/js/*.sjs)
TEST_PAML=$(wildcard Tests/*.paml)
TEST_JS=$(TEST_SJS:%.sjs=%.js)
TEST_HTML=$(TEST_PAML:%.paml=%.html)
DOC_API=$(DIR_DIST)/$(PROJECT)-api.html
DOC_TEXT=$(shell echo *.txt)
DOC_HTML=$(DOC_TEXT:.txt=.html)

.PHONY: doc

# Generic rules ______________________________________________________________

all: doc dist test
	@echo

doc: $(DOC_API) $(DOC_HTML)
	@echo "> Documentation generated:"
	@echo "  $(DOC_API)"
	@echo "  $(DOC_HTML)"
	@echo

dist: $(PRODUCT_JS) doc $(DIR_DIST)
	@echo "> Distribution generated:"
	@echo "  $(PRODUCT_JS)"
	@echo

test: $(TEST_HTML) $(TEST_JS)
	@echo "> Tests generated:"
	@echo "  $(TEST_HTML)"
	@echo "  $(TEST_JS)"
	@echo

clean:
	rm -rf $(DIR_DIST) $(DOC_HTML) $(TEST_JS) $(TEST_HTML)

# Specific rules _____________________________________________________________

$(DOC_API): $(SOURCES_SJS) $(DIR_DIST)
	$(SUGAR) -a $@ $< > /dev/null

$(DIR_DIST)/%.js: $(DIR_SOURCES)/%.sjs $(DIR_DIST)
	$(SUGAR) -cljavascript $< > $@

$(DIR_DIST):
	mkdir -p $@

%.js: %.sjs
	$(SUGAR) -LTests/lib/sjs -LSources -cljavascript $< > $@

%.html: %.paml
	pamela $< > $@

%.html: %.txt
	kiwi $< $@

# EOF
