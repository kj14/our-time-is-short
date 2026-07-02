APP_NAME := OurLifeIsShort
CONFIG   := release
BINARY   := .build/$(CONFIG)/$(APP_NAME)
BUNDLE   := build/$(APP_NAME).app

.PHONY: app build bundle sign run test clean

app: build bundle sign
	@echo "✓ built $(BUNDLE)"

build:
	swift build -c $(CONFIG)

bundle:
	rm -rf $(BUNDLE)
	mkdir -p $(BUNDLE)/Contents/MacOS $(BUNDLE)/Contents/Resources
	cp $(BINARY) $(BUNDLE)/Contents/MacOS/$(APP_NAME)
	cp Bundle/Info.plist $(BUNDLE)/Contents/Info.plist
	@if [ -f Bundle/AppIcon.icns ]; then cp Bundle/AppIcon.icns $(BUNDLE)/Contents/Resources/; fi

sign:
	codesign --force -s - $(BUNDLE)

run: app
	open $(BUNDLE)

test:
	swift run OurLifeIsShort --parity-check

clean:
	rm -rf .build build
