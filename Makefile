BIN = ./node_modules/.bin/

test:
	@${BIN}mocha \
		--harmony-generators \
		--reporter spec \
		--require should \
		--bail

clean:
	@rm -rf node_modules

.PHONY: test clean
