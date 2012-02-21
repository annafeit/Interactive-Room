 
### PBJ Vars
PBJDIR=externals/katajs/externals/protojs
PBJBIN=$(PBJDIR)/pbj



### Rules

#all : submodules katajs $(ALL_PBJJS) jquery-ui jnotify

### PBJ Rules

$(PBJBIN) :
	cd $(PBJDIR) &&	\
	./bootstrap.sh && \
	$(MAKE)

$(CHAT_PROTOCOL_OUTPUT)/%.pbj.js: $(CHAT_PROTOCOL_INPUT)/%.pbj
	@mkdir $(CHAT_PROTOCOL_OUTPUT) 2>/dev/null || true
	$(PBJBIN) $< $@


# Submodules intialization

katajs : katajs-submodules
	$(MAKE) -C externals/katajs
	$(MAKE) -C externals/katajs closure

katajs-submodules : our-submodules
	cd externals/katajs && \
	git submodule init && \
	git submodule update

our-submodules :
	git submodule init && \
	git submodule update

submodules : our-submodules katajs-submodules




.PHONY : submodules our-submodules katajs-submodules katajs 